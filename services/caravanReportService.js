/**
 * @file services/caravanReportService.js
 * @description Analytical Service & Query Builder for Dream Park Sectors (Types 1–6).
 * Fully compatible with Microsoft SQL Server 2014 & dbDream_Park_Resturant schema.
 */

import { getPool, sql } from "../config/db.js";
import { GateAdjustmentsService } from "./gateAdjustmentsService.js";

// =========================================================================
// Bounded In-Memory LRU + TTL Cache for Report Queries
// =========================================================================
const REPORT_CACHE = new Map();
const REPORT_CACHE_MAX_ENTRIES = 60;
const HISTORICAL_TTL_MS = 10 * 60 * 1000; // 10 minutes for strictly past ranges (endDate < today)
const LIVE_TTL_MS = 45 * 1000; // 45 seconds when range includes today

const BRANCH_CODES_TTL_MS = 10 * 60 * 1000;
const DEFAULT_REQUEST_TIMEOUT_MS = 60000;
const EXCLUDED_NON_REVENUE_BRANCHES = [12, 13, 1019, 1020, 1026, 1028];
const EXCLUDED_BRANCHES_SET = new Set(EXCLUDED_NON_REVENUE_BRANCHES);

function getTodayDateString() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * التحقق من صحة نطاق التواريخ وتجهيز تاريخ اليوم التالي للاستعلامات SARGable
 * (Doc_Date >= @startDate AND Doc_Date < @endDateNextDay)
 */
function normalizeDateRange(startDate, endDate) {
  const isoRegex = /^\d{4}-\d{2}-\d{2}$/;
  const parseToYmd = (val, fallback) => {
    if (!val) return fallback;
    const str = String(val).trim().slice(0, 10);
    if (isoRegex.test(str)) {
      const [y, m, d] = str.split("-").map(Number);
      const dt = new Date(Date.UTC(y, m - 1, d));
      if (
        !Number.isNaN(dt.getTime()) &&
        dt.getUTCFullYear() === y &&
        dt.getUTCMonth() === m - 1 &&
        dt.getUTCDate() === d
      ) {
        return str;
      }
    }
    const parsed = new Date(val);
    if (Number.isNaN(parsed.getTime())) {
      throw new Error(`تاريخ غير صالح (Invalid date): "${val}"`);
    }
    const y = parsed.getUTCFullYear();
    const m = String(parsed.getUTCMonth() + 1).padStart(2, "0");
    const d = String(parsed.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const today = getTodayDateString();
  const sDate = parseToYmd(startDate, "2026-01-01");
  const eDate = parseToYmd(endDate, today);

  const [ey, em, ed] = eDate.split("-").map(Number);
  const nextDt = new Date(Date.UTC(ey, em - 1, ed + 1));
  const endDateNextDay = `${nextDt.getUTCFullYear()}-${String(nextDt.getUTCMonth() + 1).padStart(2, "0")}-${String(nextDt.getUTCDate()).padStart(2, "0")}`;

  return { startDate: sDate, endDate: eDate, endDateNextDay };
}

/**
 * إنشاء طلب SQL مضبوط المهلة الزمنية (Timeout = 60000ms) لتجنب انقطاع الاتصال في التقارير السنوية
 */
function createRequest(pool, timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS) {
  const req = pool.request();
  req.timeout = timeoutMs;
  return req;
}

/**
 * تمرير قائمة أكواد رقمية عبر sql.Int Parameterized Inputs لمنع SQL Injection وأخطاء الصيغة
 */
function bindIntList(req, prefix, codes) {
  const cleanCodes = Array.isArray(codes)
    ? codes.map((c) => Number(c)).filter((n) => Number.isInteger(n))
    : [];
  const finalCodes = cleanCodes.length > 0 ? cleanCodes : [-1];
  const placeholders = finalCodes.map((code, idx) => {
    const paramName = `${prefix}_${idx}`;
    req.input(paramName, sql.Int, code);
    return `@${paramName}`;
  });
  return placeholders.join(", ");
}

function buildReportCacheKey({
  sectorType,
  startDate,
  endDate,
  granularity,
  sortBy,
  branches,
  includeAdjustments = true,
}) {
  const normBranches = Array.isArray(branches)
    ? branches.map((b) => String(b).trim()).filter(Boolean).sort()
    : [];
  return JSON.stringify([
    Number(sectorType) || 4,
    String(startDate || "").trim(),
    String(endDate || "").trim(),
    String(granularity || "summary").toLowerCase(),
    String(sortBy || "total_desc").toLowerCase(),
    normBranches,
    Boolean(includeAdjustments),
  ]);
}

function getCachedReport(key) {
  const entry = REPORT_CACHE.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    REPORT_CACHE.delete(key);
    return null;
  }
  // LRU refresh
  REPORT_CACHE.delete(key);
  REPORT_CACHE.set(key, entry);
  return { ...entry.data, fromCache: true };
}

function setCachedReport(key, endDate, data) {
  const ttlMs =
    String(endDate || "") < getTodayDateString() ? HISTORICAL_TTL_MS : LIVE_TTL_MS;
  if (REPORT_CACHE.has(key)) {
    REPORT_CACHE.delete(key);
  } else if (REPORT_CACHE.size >= REPORT_CACHE_MAX_ENTRIES) {
    const oldestKey = REPORT_CACHE.keys().next().value;
    if (oldestKey !== undefined) REPORT_CACHE.delete(oldestKey);
  }
  REPORT_CACHE.set(key, {
    data,
    expiresAt: Date.now() + ttlMs,
  });
}

let BRANCH_TYPE_MAP_CACHE = null;

async function getBranchTypeMap(pool) {
  if (BRANCH_TYPE_MAP_CACHE && Date.now() < BRANCH_TYPE_MAP_CACHE.expiresAt) {
    return BRANCH_TYPE_MAP_CACHE.map;
  }
  const req = createRequest(pool, 30000);
  const res = await req.query(`
    SELECT [Code], [type]
    FROM [dbo].[Branchs] WITH (NOLOCK);
  `);
  const map = new Map();
  for (const r of res.recordset || []) {
    const code = Number(r.Code);
    const type = Number(r.type);
    if (Number.isFinite(code)) map.set(code, type);
  }
  BRANCH_TYPE_MAP_CACHE = { map, expiresAt: Date.now() + BRANCH_CODES_TTL_MS };
  return map;
}

function routeItemToSectorAndGame({
  branchCode,
  branchType,
  groupCode,
  itemCode,
  groupName,
  itemName,
}) {
  const bCode = Number(branchCode);
  const bType = Number(branchType);
  const gCode = Number(groupCode);
  const iCode = String(itemCode ?? "").trim();
  const gName = String(groupName ?? "");
  const iName = String(itemName ?? "");
  const gLow = gName.toLowerCase();
  const iLow = iName.toLowerCase();

  let targetSector;
  if (bType === 6 || bCode === 118 || bCode === 120) {
    targetSector = 6;
  } else if (
    (bCode === 102 && (gCode === 3 || gLow.includes("gold"))) ||
    (gLow.includes("gold") && iName.includes("جولدن"))
  ) {
    targetSector = 2;
  } else if (gCode === 21 || gLow.includes("zoo") || iLow.includes("zoo")) {
    targetSector = 0;
  } else if (gCode === 15 || gName.includes("شلال") || iName.includes("شلال")) {
    targetSector = 2;
  } else if (gCode === 18 || gLow.includes("vr2") || gLow.includes("vr 2")) {
    targetSector = 3;
  } else if (gCode === 13 || gName.includes("خيل") || iName.includes("خيل")) {
    targetSector = 2;
  } else if (
    gCode === 20 ||
    iCode === "74" ||
    iCode === "80" ||
    gLow.includes("hammer") ||
    iLow.includes("hammer") ||
    iName.includes("هامر")
  ) {
    targetSector = 3;
  } else if (
    gCode === 12 ||
    iCode === "40" ||
    gName.includes("رمايه 2") ||
    iName.includes("رمايه 2") ||
    gName.includes("الرمايه 2") ||
    iName.includes("الرمايه 2")
  ) {
    targetSector = 3;
  } else if (gCode === 3 || gName.includes("مقلوب") || iName.includes("مقلوب")) {
    targetSector = 3;
  } else if (gCode === 1 || gName.includes("ديسكفر") || iName.includes("ديسكفر")) {
    targetSector = 2;
  } else if (gName.includes("سلسل") || iName.includes("سلسل")) {
    targetSector = 2;
  } else if ([5, 9, 10, 11, 12, 17, 18, 19, 20, 22].includes(gCode)) {
    targetSector = 3;
  } else if ([2, 4, 6, 7, 8, 14, 16].includes(gCode)) {
    targetSector = 2;
  } else {
    targetSector = bType;
  }

  let gameCode;
  let gameName;

  if (bType === 6 || bCode === 118 || bCode === 120) {
    if ((gCode === 3 && iCode === "4") || iName.includes("ملاكي") || iName.includes("تاكس")) {
      gameCode = "parking_private";
      gameName = "Private";
    } else if (
      (gCode === 3 && (iCode === "5" || iCode === "6" || iCode === "7")) ||
      iName.includes("باص") ||
      iName.includes("اتوبيس") ||
      iName.includes("ميكروباص")
    ) {
      gameCode = "parking_buses";
      gameName = "Buses";
    } else if (
      (gCode === 3 && iCode === "8") ||
      iLow.includes("mask") ||
      iName.includes("ماسك") ||
      iName.includes("محمود")
    ) {
      gameCode = "mask";
      gameName = "Mask";
    } else if (
      (gCode === 2 && (iCode === "2" || iCode === "3")) ||
      iLow.includes("car ") ||
      iLow.includes("g&r")
    ) {
      gameCode = "g_and_r";
      gameName = "G&R";
    } else if (
      (gCode === 1 && iCode === "1") ||
      iName.includes("خازينة") ||
      iName.includes("خزنة") ||
      iName.includes("خزنه") ||
      iName.includes("امان") ||
      iName.includes("أمان") ||
      iLow.includes("lock")
    ) {
      gameCode = "locker";
      gameName = "Locker";
    } else if (iLow.includes("deposit") || iName.includes("تأمين") || iName.includes("تامين")) {
      gameCode = "g_deposit";
      gameName = "G.Deposit";
    } else if (iName.includes("تليفون") || iLow.includes("telephon")) {
      gameCode = "telephon";
      gameName = "Telephon";
    } else if (iLow.includes("net coffee") || iName.includes("نت كافيه")) {
      gameCode = "net_coffee";
      gameName = "Net Coffee";
    } else {
      gameCode = "unmapped";
      gameName = "Unmapped";
    }
  } else if (
    (bCode === 102 && (gCode === 3 || gLow.includes("gold"))) ||
    (gLow.includes("gold") && iName.includes("جولدن"))
  ) {
    gameCode = "golden";
    gameName = "الذهبية";
  } else if (gCode === 1 || gName.includes("ديسكفر")) {
    gameCode = "1";
    gameName = "الديسكفري";
  } else if (gName.includes("سلسل") || iName.includes("سلسل")) {
    gameCode = "23";
    gameName = "السلسلة";
  } else if (gCode === 5 && (iCode === "19" || iName.includes("روديو"))) {
    gameCode = "19";
    gameName = "الروديو";
  } else if (gCode === 5) {
    gameCode = "18";
    gameName = "الموفى";
  } else if (gCode === 20 || iCode === "74" || iCode === "80" || iLow.includes("hammer")) {
    gameCode = "20";
    gameName = "الهامر";
  } else if (
    gCode === 12 ||
    iCode === "40" ||
    gName.includes("رمايه 2") ||
    iName.includes("رمايه 2")
  ) {
    gameCode = "12";
    gameName = "شوتينج 2";
  } else if (gCode === 3 || gName.includes("مقلوب") || iName.includes("مقلوب")) {
    gameCode = "3";
    gameName = "البيت المقلوب";
  } else if (gCode === 15 || gName.includes("شلال")) {
    gameCode = "115";
    gameName = "شلال المرح";
  } else if (gCode === 18 || gLow.includes("vr2") || gLow.includes("vr 2")) {
    gameCode = "118";
    gameName = "VR 2";
  } else if (gCode === 13 || gName.includes("خيل")) {
    gameCode = "113";
    gameName = "الخيل";
  } else {
    const isStandardRide = [2, 4, 6, 7, 8, 14, 16].includes(gCode);
    gameCode = isStandardRide ? String(gCode) : String(100 + gCode);
    const nameMap = {
      19: "دوبي كاسل",
      9: "بابلوني",
      11: "شوتينج",
      22: "VR3",
      10: "ألعاب الأطفال",
      17: "VR 1",
    };
    gameName = nameMap[gCode] || gName;
  }

  return { targetSector, gameCode, gameName };
}

/**
 * خريطة التوجيه المرن للألعاب بين القطاعين (Type = 2: الألعاب الكبرى، Type = 3: الفيديو جيم والـ VR)
 */
export const GAME_SECTOR_OVERRIDES = {
  // 1. Move Hammer (all its variants) -> targetSector: 3 (Video Games & VR)
  20: 3,
  74: 3,
  80: 3,
  hammer: 3,
  hammer20: 3,
  الهامر: 3,
  هامر: 3,

  // 2. Move Shooting2 (الرمايه 2) -> targetSector: 3 (Video Games & VR)
  12: 3,
  40: 3,
  "الرمايه 2": 3,
  "رمايه 2": 3,
  shooting2: 3,

  // 3. Move Upside Down House (البيت المقلوب) -> targetSector: 3 (Video Games & VR)
  3: 3,
  21: 3,
  22: 3,
  151: 3,
  "البيت المقلوب": 3,
  "upside down house": 3,

  // 4. Move Funny Slides (شلال المرح) -> targetSector: 2 (Paid Rides)
  15: 2,
  115: 2,
  "شلال المرح": 2,
  "funny slides": 2,

  // 5. Move VR 2 -> targetSector: 3 (Video Games & VR)
  118: 3,
  vr2: 3,
  "vr 2": 3,

  // 6. Move Horse (الخيل) -> targetSector: 2 (Paid Rides)
  13: 2,
  113: 2,
  الخيل: 2,
  horse: 2,

  // 7. Ensure Discovery -> targetSector: 2 (Amusement Rides)
  1: 2,
  ديسكفري: 2,
  الديسكفري: 2,
  discovery: 2,

  // 8. Ensure Selsela / Chains -> targetSector: 2 (Amusement Rides)
  23: 2,
  سلسلة: 2,
  السلسلة: 2,
  chains: 2,
};

export class CaravanReportService {
  /**
   * استرجاع قائمة جميع منافذ القطاع المحددة (افتراضياً الكرفانات Type = 4)
   * مع استبعاد الكيانات غير الإيرادية (المخازن والمستشفيات)
   * بالنسبة لقطاعات الألعاب (Type = 2) والفيديو جيم (Type = 3) والأمانات (Type = 6)، يتم الاستعلام المباشر من الجداول الأساسية
   * @param {number} [sectorType=4]
   * @param {string} [startDate]
   * @param {string} [endDate]
   * @returns {Promise<Array<{Code: string, Name: string}>>}
   */
  static async getCaravanBranches(sectorType = 4, startDate, endDate) {
    try {
      const secType = Number(sectorType) || 4;

      if (secType === 5) {
        return [
          { Code: "101", Name: "Silvertik3 - بوابات العائلات" },
          { Code: "102", Name: "Silvertik4 - البوابات الرئيسية" },
          { Code: "103", Name: "Silvertik2 - البوابات الاحتياطية" },
          { Code: "104", Name: "Sales3 - مبيعات المجموعات والتسويق" },
        ];
      }

      const pool = await getPool();

      if (secType === 2 || secType === 3 || secType === 6) {
        const defaultStart = new Date(Date.now() - 30 * 86400000)
          .toISOString()
          .split("T")[0];
        const { startDate: sDate, endDateNextDay } = normalizeDateRange(
          startDate || defaultStart,
          endDate || getTodayDateString()
        );

        const branchTypeMap = await getBranchTypeMap(pool);
        const targetBranchCodes = [];
        if (secType === 6) {
          const s = new Set([118, 120]);
          for (const [code, t] of branchTypeMap.entries()) {
            if (t === 6) s.add(code);
          }
          targetBranchCodes.push(...[...s].sort((a, b) => a - b));
        } else {
          for (const [code, t] of branchTypeMap.entries()) {
            if ((t === 2 || t === 3) && !EXCLUDED_BRANCHES_SET.has(code)) {
              targetBranchCodes.push(code);
            }
          }
          targetBranchCodes.sort((a, b) => a - b);
        }

        const mainReq = createRequest(pool);
        mainReq.input("startDate", sql.Date, sDate);
        mainReq.input("endDateNextDay", sql.Date, endDateNextDay);
        const mainBranchesPh = bindIntList(mainReq, "mb", targetBranchCodes);

        const recReq = createRequest(pool);
        recReq.input("startDate", sql.Date, sDate);
        recReq.input("endDateNextDay", sql.Date, endDateNextDay);
        const recCodes =
          secType === 2 ? [...targetBranchCodes, 102] : targetBranchCodes;
        const recBranchesPh = bindIntList(recReq, "rb", recCodes);

        const queries = [
          mainReq.query(`
            SELECT DISTINCT
              sp.[Branch_Code],
              it.[Group_code],
              sp.[item_Code],
              gi.[name_a] AS [Groupitem_name],
              sp.[item_name]
            FROM [dbo].[POS_Sub_post] sp WITH (NOLOCK)
            INNER JOIN [dbo].[POS_Post] pp WITH (NOLOCK)
              ON sp.[Doc_NO] = pp.[Doc_NO]
              AND sp.[ID_Pos] = pp.[id_pos]
              AND sp.[Branch_Code] = pp.[Branch_Code]
              AND sp.[Doc_Date] = pp.[Doc_Date]
            INNER JOIN [dbo].[items] it WITH (NOLOCK)
              ON it.[code] = sp.[item_Code]
              AND it.[BranchCode] = sp.[Branch_Code]
            INNER JOIN [dbo].[Groupitem] gi WITH (NOLOCK)
              ON gi.[code] = it.[Group_code]
              AND gi.[Branch_Code] = it.[BranchCode]
            WHERE sp.[Doc_Date] >= @startDate
              AND sp.[Doc_Date] < @endDateNextDay
              AND pp.[Doc_Date] >= @startDate
              AND pp.[Doc_Date] < @endDateNextDay
              AND sp.[Branch_Code] IN (${mainBranchesPh})
              AND pp.[Branch_Code] IN (${mainBranchesPh})
              AND ISNULL(sp.[Void_item], 0) = 0
              AND pp.[Officer] = 0
            OPTION (LOOP JOIN, RECOMPILE);
          `),
          recReq
            .query(`
              SELECT DISTINCT
                rd.[Branch_Code],
                gi.[code] AS [Group_code],
                rd.[Item_Code] AS [item_Code],
                gi.[name_a] AS [Groupitem_name],
                it.[name_a] AS [item_name]
              FROM [dbo].[receipts_Details] rd WITH (NOLOCK)
              INNER JOIN [dbo].[receipts_Master] rm WITH (NOLOCK)
                ON rd.[Branch_Code] = rm.[Branch_Code]
                AND rd.[Book_Code] = rm.[Book_Code]
                AND rd.[Doc_NO] = rm.[Doc_NO]
              INNER JOIN [dbo].[items] it WITH (NOLOCK)
                ON rd.[Item_Code] = it.[code]
                AND rd.[Branch_Code] = it.[BranchCode]
              INNER JOIN [dbo].[Groupitem] gi WITH (NOLOCK)
                ON it.[BranchCode] = gi.[Branch_Code]
                AND it.[Group_code] = gi.[code]
              WHERE rm.[Doc_Date] >= @startDate
                AND rm.[Doc_Date] < @endDateNextDay
                AND rd.[Branch_Code] IN (${recBranchesPh})
                AND rm.[Branch_Code] IN (${recBranchesPh})
              OPTION (RECOMPILE);
            `)
            .catch(() => ({ recordset: [] })),
        ];

        if (secType === 2) {
          const goldReq = createRequest(pool);
          goldReq.input("startDate", sql.Date, sDate);
          goldReq.input("endDateNextDay", sql.Date, endDateNextDay);
          goldReq.input("goldBranch", sql.Int, 102);
          queries.push(
            goldReq.query(`
              SELECT DISTINCT
                sp.[Branch_Code],
                it.[Group_code],
                sp.[item_Code],
                gi.[name_a] AS [Groupitem_name],
                sp.[item_name]
              FROM [dbo].[POS_Sub_post] sp WITH (NOLOCK)
              INNER JOIN [dbo].[items] it WITH (NOLOCK)
                ON it.[code] = sp.[item_Code]
                AND it.[BranchCode] = sp.[Branch_Code]
              INNER JOIN [dbo].[Groupitem] gi WITH (NOLOCK)
                ON gi.[code] = it.[Group_code]
                AND gi.[Branch_Code] = it.[BranchCode]
              INNER JOIN [dbo].[POS_Post] pp WITH (NOLOCK)
                ON sp.[Doc_NO] = pp.[Doc_NO]
                AND sp.[ID_Pos] = pp.[id_pos]
                AND sp.[Branch_Code] = pp.[Branch_Code]
                AND sp.[Doc_Date] = pp.[Doc_Date]
              WHERE sp.[Doc_Date] >= @startDate
                AND sp.[Doc_Date] < @endDateNextDay
                AND pp.[Doc_Date] >= @startDate
                AND pp.[Doc_Date] < @endDateNextDay
                AND sp.[Branch_Code] = @goldBranch
                AND pp.[Branch_Code] = @goldBranch
                AND (it.[Group_code] = 3 OR gi.[name_a] LIKE N'%gold%')
                AND ISNULL(sp.[Void_item], 0) = 0
                AND pp.[Officer] = 0
              OPTION (HASH JOIN, RECOMPILE);
            `)
          );
        }

        const settled = await Promise.all(queries);
        const allRows = settled.flatMap((r) => r?.recordset || []);
        const uniqueMap = new Map();

        for (const row of allRows) {
          const bCode = Number(row.Branch_Code);
          const bType = branchTypeMap.get(bCode) ?? secType;
          if (secType === 2 && bCode === 102) {
            const gCode = Number(row.Group_code);
            const gLow = String(row.Groupitem_name ?? "").toLowerCase();
            if (bType === 2 || bType === 3) continue;
            if (gCode !== 3 && !gLow.includes("gold")) continue;
          }
          const { targetSector, gameCode, gameName } = routeItemToSectorAndGame({
            branchCode: bCode,
            branchType: bType,
            groupCode: row.Group_code,
            itemCode: row.item_Code,
            groupName: row.Groupitem_name,
            itemName: row.item_name,
          });
          if (targetSector !== secType) continue;
          const key = `${gameCode}\u0000${gameName}`;
          if (!uniqueMap.has(key)) {
            uniqueMap.set(key, { Code: gameCode, Name: gameName });
          }
        }

        return Array.from(uniqueMap.values()).sort((a, b) =>
          String(a.Name || "").localeCompare(String(b.Name || ""))
        );
      }

      const request = createRequest(pool);
      request.input("sectorType", sql.Int, secType);
      const exclPh = bindIntList(request, "ex", EXCLUDED_NON_REVENUE_BRANCHES);
      const query = `
        SELECT
          [Code],
          [Aname] AS [Name]
        FROM [dbo].[Branchs] WITH (NOLOCK)
        WHERE [Type] = @sectorType
          AND [Code] NOT IN (${exclPh})
        ORDER BY [Aname] ASC;
      `;
      const result = await request.query(query);
      return result.recordset || [];
    } catch (err) {
      console.error("[CaravanReportService.getCaravanBranches] Error:", err.message);
      throw new Error(`فشل استرجاع قائمة منافذ القطاع (${sectorType}): ${err.message}`);
    }
  }

  /**
   * تقرير تحليلي على مستوى الأصناف/الألعاب الفردية لقطاعات الألعاب (Type = 2) والفيديو جيم (Type = 3) والأمانات (Type = 6)
   */
  static async getItemLevelReportData({
    startDate = "2026-01-01",
    endDate = new Date().toISOString().split("T")[0],
    branches = [],
    granularity = "summary",
    sortBy = "total_desc",
    sectorType = 3,
  }) {
    try {
      const pool = await getPool();
      const secType = Number(sectorType) || 3;
      const { startDate: sDate, endDate: eDate, endDateNextDay } = normalizeDateRange(
        startDate,
        endDate
      );
      const isFiltered = Array.isArray(branches) && branches.length > 0;
      const allowedGameCodes = isFiltered
        ? new Set(branches.map((c) => String(c).trim()).filter(Boolean))
        : null;

      const normGranularity = (granularity || "summary").toLowerCase();
      const isSummaryGran = normGranularity === "summary" || normGranularity === "total";
      const periodExprSp = isSummaryGran
        ? "NULL"
        : normGranularity === "month"
          ? "CONVERT(VARCHAR(7), sp.[Doc_Date], 120)"
          : "CONVERT(VARCHAR(10), sp.[Doc_Date], 120)";
      const groupByPeriodSp = isSummaryGran ? "" : `${periodExprSp}, `;

      const periodExprRm = isSummaryGran
        ? "NULL"
        : normGranularity === "month"
          ? "CONVERT(VARCHAR(7), rm.[Doc_Date], 120)"
          : "CONVERT(VARCHAR(10), rm.[Doc_Date], 120)";
      const groupByPeriodRm = isSummaryGran ? "" : `${periodExprRm}, `;

      // Resolve Branch_Code -> type map from cached dimension table
      const branchTypeMap = await getBranchTypeMap(pool);
      const targetBranchCodes = [];
      if (secType === 6) {
        const s = new Set([118, 120]);
        for (const [code, t] of branchTypeMap.entries()) {
          if (t === 6) s.add(code);
        }
        targetBranchCodes.push(...[...s].sort((a, b) => a - b));
      } else {
        for (const [code, t] of branchTypeMap.entries()) {
          if ((t === 2 || t === 3) && !EXCLUDED_BRANCHES_SET.has(code)) {
            targetBranchCodes.push(code);
          }
        }
        targetBranchCodes.sort((a, b) => a - b);
      }

      // Query A: Main POS_Sub_post + POS_Post + items + Groupitem (Parameterized, SARGable, LOOP JOIN)
      const mainReq = createRequest(pool);
      mainReq.input("startDate", sql.Date, sDate);
      mainReq.input("endDateNextDay", sql.Date, endDateNextDay);
      const mainBranchPh = bindIntList(mainReq, "mb", targetBranchCodes);
      const mainPosQuery = `
        SELECT
          ${periodExprSp} AS [Period],
          sp.[Branch_Code],
          it.[Group_code],
          sp.[item_Code],
          gi.[name_a] AS [Groupitem_name],
          sp.[item_name],
          SUM(CAST(ISNULL(sp.[Item_Qunt], 0) AS INT)) AS [Cover],
          CAST(SUM(ISNULL(sp.[Item_Qunt], 0) * ISNULL(sp.[Item_Price], 0) * (1.0 + ISNULL(sp.[item_Sels_Tax_P], 0) / 100.0)) AS DECIMAL(38, 10)) AS [Total],
          CAST(SUM(ISNULL(sp.[Item_Qunt], 0) * ISNULL(sp.[Item_Price], 0)) AS DECIMAL(38, 10)) AS [NetAmount],
          CAST(SUM(ISNULL(sp.[item_Sels_Tax], 0)) AS DECIMAL(38, 10)) AS [TaxAmount],
          SUM(CAST(ISNULL(pp.[C/L], 0) AS DECIMAL(18, 4))) AS [CL]
        FROM [dbo].[POS_Sub_post] sp WITH (NOLOCK)
        INNER JOIN [dbo].[POS_Post] pp WITH (NOLOCK)
          ON sp.[Doc_NO] = pp.[Doc_NO]
          AND sp.[ID_Pos] = pp.[id_pos]
          AND sp.[Branch_Code] = pp.[Branch_Code]
          AND sp.[Doc_Date] = pp.[Doc_Date]
        INNER JOIN [dbo].[items] it WITH (NOLOCK)
          ON it.[code] = sp.[item_Code]
          AND it.[BranchCode] = sp.[Branch_Code]
        INNER JOIN [dbo].[Groupitem] gi WITH (NOLOCK)
          ON gi.[code] = it.[Group_code]
          AND gi.[Branch_Code] = it.[BranchCode]
        WHERE sp.[Doc_Date] >= @startDate
          AND sp.[Doc_Date] < @endDateNextDay
          AND pp.[Doc_Date] >= @startDate
          AND pp.[Doc_Date] < @endDateNextDay
          AND sp.[Branch_Code] IN (${mainBranchPh})
          AND pp.[Branch_Code] IN (${mainBranchPh})
          AND ISNULL(sp.[Void_item], 0) = 0
          AND pp.[Officer] = 0
        GROUP BY ${groupByPeriodSp}sp.[Branch_Code], it.[Group_code], sp.[item_Code], gi.[name_a], sp.[item_name]
        OPTION (LOOP JOIN, RECOMPILE);
      `;

      // Query B: receipts_Details + receipts_Master (guarantees 100% parity with Pos_item_post view)
      const receiptsBranchCodes =
        secType === 2 ? [...targetBranchCodes, 102] : targetBranchCodes;
      const recReq = createRequest(pool);
      recReq.input("startDate", sql.Date, sDate);
      recReq.input("endDateNextDay", sql.Date, endDateNextDay);
      const recBranchPh = bindIntList(recReq, "rb", receiptsBranchCodes);
      const receiptsQuery = `
        SELECT
          ${periodExprRm} AS [Period],
          rd.[Branch_Code],
          gi.[code] AS [Group_code],
          rd.[Item_Code] AS [item_Code],
          gi.[name_a] AS [Groupitem_name],
          it.[name_a] AS [item_name],
          SUM(CAST(ISNULL(rd.[Item_Qunt], 0) AS INT)) AS [Cover],
          CAST(SUM(ISNULL(rd.[Item_Qunt], 0) * (ISNULL(rd.[Item_Price], 0) / ((ISNULL(it.[Sels_Tax], 0) / 100) + 1)) * (1.0 + ISNULL(it.[Sels_Tax], 0) / 100.0)) AS DECIMAL(38, 10)) AS [Total],
          CAST(SUM(ISNULL(rd.[Item_Qunt], 0) * (ISNULL(rd.[Item_Price], 0) / ((ISNULL(it.[Sels_Tax], 0) / 100) + 1))) AS DECIMAL(38, 10)) AS [NetAmount],
          CAST(SUM(ISNULL(rd.[Item_Price], 0) * (ISNULL(it.[Sels_Tax], 0) / 100)) AS DECIMAL(38, 10)) AS [TaxAmount],
          CAST(0 AS DECIMAL(18, 4)) AS [CL]
        FROM [dbo].[receipts_Details] rd WITH (NOLOCK)
        INNER JOIN [dbo].[receipts_Master] rm WITH (NOLOCK)
          ON rd.[Branch_Code] = rm.[Branch_Code]
          AND rd.[Book_Code] = rm.[Book_Code]
          AND rd.[Doc_NO] = rm.[Doc_NO]
        INNER JOIN [dbo].[items] it WITH (NOLOCK)
          ON rd.[Item_Code] = it.[code]
          AND rd.[Branch_Code] = it.[BranchCode]
        INNER JOIN [dbo].[Groupitem] gi WITH (NOLOCK)
          ON it.[BranchCode] = gi.[Branch_Code]
          AND it.[Group_code] = gi.[code]
        WHERE rm.[Doc_Date] >= @startDate
          AND rm.[Doc_Date] < @endDateNextDay
          AND rd.[Branch_Code] IN (${recBranchPh})
          AND rm.[Branch_Code] IN (${recBranchPh})
        GROUP BY ${groupByPeriodRm}rd.[Branch_Code], gi.[code], rd.[Item_Code], gi.[name_a], it.[name_a]
        OPTION (RECOMPILE);
      `;

      const parallelPromises = [
        mainReq.query(mainPosQuery),
        recReq.query(receiptsQuery).catch((err) => {
          console.warn("[CaravanReportService] Receipts leg failed:", err.message);
          return { recordset: [] };
        }),
      ];

      // Query C (Type 2 only): Golden (Branch 102, Group 3 / gold)
      if (secType === 2) {
        const goldReq = createRequest(pool);
        goldReq.input("startDate", sql.Date, sDate);
        goldReq.input("endDateNextDay", sql.Date, endDateNextDay);
        goldReq.input("goldBranch", sql.Int, 102);
        const goldenQuery = `
          SELECT
            ${periodExprSp} AS [Period],
            sp.[Branch_Code],
            it.[Group_code],
            sp.[item_Code],
            gi.[name_a] AS [Groupitem_name],
            sp.[item_name],
            SUM(CAST(ISNULL(sp.[Item_Qunt], 0) AS INT)) AS [Cover],
            CAST(SUM(ISNULL(sp.[Item_Qunt], 0) * ISNULL(sp.[Item_Price], 0) * (1.0 + ISNULL(sp.[item_Sels_Tax_P], 0) / 100.0)) AS DECIMAL(38, 10)) AS [Total],
            CAST(SUM(ISNULL(sp.[Item_Qunt], 0) * ISNULL(sp.[Item_Price], 0)) AS DECIMAL(38, 10)) AS [NetAmount],
            CAST(SUM(ISNULL(sp.[item_Sels_Tax], 0)) AS DECIMAL(38, 10)) AS [TaxAmount],
            SUM(CAST(ISNULL(pp.[C/L], 0) AS DECIMAL(18, 4))) AS [CL]
          FROM [dbo].[POS_Sub_post] sp WITH (NOLOCK)
          INNER JOIN [dbo].[items] it WITH (NOLOCK)
            ON it.[code] = sp.[item_Code]
            AND it.[BranchCode] = sp.[Branch_Code]
          INNER JOIN [dbo].[Groupitem] gi WITH (NOLOCK)
            ON gi.[code] = it.[Group_code]
            AND gi.[Branch_Code] = it.[BranchCode]
          INNER JOIN [dbo].[POS_Post] pp WITH (NOLOCK)
            ON sp.[Doc_NO] = pp.[Doc_NO]
            AND sp.[ID_Pos] = pp.[id_pos]
            AND sp.[Branch_Code] = pp.[Branch_Code]
            AND sp.[Doc_Date] = pp.[Doc_Date]
          WHERE sp.[Doc_Date] >= @startDate
            AND sp.[Doc_Date] < @endDateNextDay
            AND pp.[Doc_Date] >= @startDate
            AND pp.[Doc_Date] < @endDateNextDay
            AND sp.[Branch_Code] = @goldBranch
            AND pp.[Branch_Code] = @goldBranch
            AND (it.[Group_code] = 3 OR gi.[name_a] LIKE N'%gold%')
            AND ISNULL(sp.[Void_item], 0) = 0
            AND pp.[Officer] = 0
          GROUP BY ${groupByPeriodSp}sp.[Branch_Code], it.[Group_code], sp.[item_Code], gi.[name_a], sp.[item_name]
          OPTION (HASH JOIN, RECOMPILE);
        `;
        parallelPromises.push(goldReq.query(goldenQuery));
      }

      // Queries D & E (Type 6 only): Real POS_Post payments & direct POS_Sub_post voids
      if (secType === 6) {
        const postSelectPeriod = isSummaryGran
          ? "NULL"
          : normGranularity === "month"
            ? "CONVERT(VARCHAR(7), p.[Doc_Date], 120)"
            : "CONVERT(VARCHAR(10), p.[Doc_Date], 120)";
        const postGroupBy = isSummaryGran ? "" : `GROUP BY ${postSelectPeriod}`;

        const postReq = createRequest(pool);
        postReq.input("startDate", sql.Date, sDate);
        postReq.input("endDateNextDay", sql.Date, endDateNextDay);
        const postBranchPh = bindIntList(postReq, "pb", targetBranchCodes);
        const type6PostQuery = `
          SELECT
            ${postSelectPeriod} AS [Period],
            CAST(ROUND(SUM(CAST(ISNULL(p.[Cash], 0) AS DECIMAL(18, 4))), 2) AS DECIMAL(18, 2)) AS [Cash],
            CAST(ROUND(SUM(CAST(ISNULL(p.[Visa], 0) + ISNULL(p.[Visa2], 0) + ISNULL(p.[Visa3], 0) AS DECIMAL(18, 4))), 2) AS DECIMAL(18, 2)) AS [Visa],
            CAST(ROUND(SUM(CAST(ISNULL(p.[C/L], 0) AS DECIMAL(18, 4))), 2) AS DECIMAL(18, 2)) AS [CL],
            CAST(ROUND(SUM(CAST(ISNULL(p.[TotalInv], 0) AS DECIMAL(18, 4))), 2) AS DECIMAL(18, 2)) AS [TotalInv],
            CAST(ROUND(SUM(CAST(ISNULL(p.[Sels_Tax], 0) AS DECIMAL(18, 4))), 2) AS DECIMAL(18, 2)) AS [SalesTax]
          FROM [dbo].[POS_Post] p WITH (NOLOCK)
          WHERE p.[Doc_Date] >= @startDate
            AND p.[Doc_Date] < @endDateNextDay
            AND (p.[Void] = 0 OR p.[Void] IS NULL)
            AND p.[Branch_Code] IN (${postBranchPh})
          ${postGroupBy}
          OPTION (RECOMPILE);
        `;

        const voidReq = createRequest(pool);
        voidReq.input("startDate", sql.Date, sDate);
        voidReq.input("endDateNextDay", sql.Date, endDateNextDay);
        const voidBranchPh = bindIntList(voidReq, "vb", targetBranchCodes);
        const type6VoidQuery = `
          SELECT
            COUNT(*) AS [VoidCount],
            CAST(ROUND(SUM(CAST(ISNULL(sp.[Item_Qunt], 0) * ISNULL(sp.[Item_Price], 0) * (1.0 + ISNULL(sp.[item_Sels_Tax_P], 0) / 100.0 + ISNULL(sp.[item_Serves_Tax_P], 0) / 100.0) AS DECIMAL(18, 4))), 2) AS DECIMAL(18, 2)) AS [TotalVoids]
          FROM [dbo].[POS_Sub_post] sp WITH (NOLOCK)
          INNER JOIN [dbo].[POS_Post] pp WITH (NOLOCK)
            ON sp.[Doc_NO] = pp.[Doc_NO]
            AND sp.[ID_Pos] = pp.[id_pos]
            AND sp.[Branch_Code] = pp.[Branch_Code]
            AND sp.[Doc_Date] = pp.[Doc_Date]
          WHERE sp.[Doc_Date] >= @startDate
            AND sp.[Doc_Date] < @endDateNextDay
            AND pp.[Doc_Date] >= @startDate
            AND pp.[Doc_Date] < @endDateNextDay
            AND sp.[Branch_Code] IN (${voidBranchPh})
            AND pp.[Branch_Code] IN (${voidBranchPh})
            AND ISNULL(sp.[Void_item], 0) = 1
            AND pp.[Officer] = 0
          OPTION (HASH JOIN, RECOMPILE);
        `;

        parallelPromises.push(
          postReq.query(type6PostQuery).catch((err) => {
            console.warn("[CaravanReportService] Type 6 POS_Post query failed:", err.message);
            return { recordset: [] };
          }),
          voidReq.query(type6VoidQuery).catch((err) => {
            console.warn("[CaravanReportService] Type 6 Voids query failed:", err.message);
            return { recordset: [] };
          })
        );
      }

      const startTime = Date.now();
      const settled = await Promise.all(parallelPromises);
      const duration = Date.now() - startTime;

      const mainRows = settled[0]?.recordset || [];
      const recRows = settled[1]?.recordset || [];
      const extraRows = secType === 2 ? settled[2]?.recordset || [] : [];

      // Aggregate & route all raw rows in O(N) in Node.js
      const groupedMap = new Map();
      const allRawRows = [...mainRows, ...recRows, ...extraRows];
      for (const row of allRawRows) {
        const bCode = Number(row.Branch_Code);
        const bType = branchTypeMap.get(bCode) ?? secType;
        if (secType === 2 && bCode === 102) {
          const gCode = Number(row.Group_code);
          const gLow = String(row.Groupitem_name ?? "").toLowerCase();
          if (bType === 2 || bType === 3) continue;
          if (gCode !== 3 && !gLow.includes("gold")) continue;
        }

        const { targetSector, gameCode, gameName } = routeItemToSectorAndGame({
          branchCode: bCode,
          branchType: bType,
          groupCode: row.Group_code,
          itemCode: row.item_Code,
          groupName: row.Groupitem_name,
          itemName: row.item_name,
        });

        if (targetSector !== secType) continue;
        if (allowedGameCodes && !allowedGameCodes.has(gameCode)) continue;

        const periodVal = row.Period ?? null;
        const key = `${periodVal ?? ""}\u0000${gameCode}\u0000${gameName}`;
        let acc = groupedMap.get(key);
        if (!acc) {
          acc = {
            Period: periodVal,
            Branch_Code: gameCode,
            Name: gameName,
            Cover: 0,
            Total: 0,
            NetAmount: 0,
            TaxAmount: 0,
            CL: 0,
          };
          groupedMap.set(key, acc);
        }
        acc.Cover += Number(row.Cover) || 0;
        acc.Total += Number(row.Total) || 0;
        acc.NetAmount += Number(row.NetAmount) || 0;
        acc.TaxAmount += Number(row.TaxAmount) || 0;
        acc.CL += Number(row.CL) || 0;
      }

      const rawItemRecords = [];
      for (const acc of groupedMap.values()) {
        const rounded4 = Math.round(acc.Total * 10000) / 10000;
        if (Math.abs(rounded4) < 0.00005) continue;
        rawItemRecords.push({
          Period: acc.Period,
          Branch_Code: acc.Branch_Code,
          Name: acc.Name,
          Cover: acc.Cover,
          Total: secType === 6 ? Math.round(acc.Total * 100) / 100 : rounded4,
          NetAmount: Math.round(acc.NetAmount * 100) / 100,
          TaxAmount: Math.round(acc.TaxAmount * 100) / 100,
          CL: Math.round(acc.CL * 10000) / 10000,
        });
      }

      rawItemRecords.sort((a, b) => {
        if (!isSummaryGran) {
          const cmp = String(a.Period || "").localeCompare(String(b.Period || ""));
          if (cmp !== 0) return cmp;
        }
        return b.Total - a.Total;
      });

      let type6PostMap = null;
      let type6VoidsTotal = 0;
      let type6VoidCount = 0;
      let type6PostSummary = null;

      if (secType === 6) {
        const pRes = settled[2];
        const vRes = settled[3];
        type6PostMap = new Map();
        let sumCash = 0;
        let sumVisa = 0;
        let sumCL = 0;
        let sumNet = 0;
        let sumTax = 0;
        for (const pr of pRes?.recordset || []) {
          const key = String(pr.Period || "all");
          const pCash = Math.round((Number(pr.Cash) || 0) * 100) / 100;
          const pVisa = Math.round((Number(pr.Visa) || 0) * 100) / 100;
          const pCl = Math.round((Number(pr.CL) || 0) * 100) / 100;
          const pTot = Math.round((pCash + pVisa + pCl) * 100) / 100;
          type6PostMap.set(key, { cash: pCash, visa: pVisa, cl: pCl, total: pTot });
          sumCash += pCash;
          sumVisa += pVisa;
          sumCL += pCl;
          sumNet += Number(pr.TotalInv) || 0;
          sumTax += Number(pr.SalesTax) || 0;
        }
        if ((pRes?.recordset || []).length > 0) {
          type6PostSummary = {
            cash: Math.round(sumCash * 100) / 100,
            visa: Math.round(sumVisa * 100) / 100,
            cl: Math.round(sumCL * 100) / 100,
            net: Math.round(sumNet * 100) / 100,
            tax: Math.round(sumTax * 100) / 100,
          };
        }
        const vr = (vRes?.recordset || [])[0];
        type6VoidCount = Number(vr?.VoidCount) || 0;
        type6VoidsTotal = Math.round((Number(vr?.TotalVoids) || 0) * 100) / 100;
      }

      // Build precise daily payment aggregates from game items (or real POS_Post for Type 6)
      const dailyPayMap = new Map();
      let totalSales = 0;
      let totalCL = 0;
      let totalCover = 0;

      for (const item of rawItemRecords) {
        const periodKey = String(item.Period || "all");
        const itemTot =
          secType === 6
            ? Math.round((Number(item.Total) || 0) * 100) / 100
            : Number(item.Total) || 0;
        const itemCl =
          secType === 6
            ? Math.round((Number(item.CL) || 0) * 100) / 100
            : Number(item.CL) || 0;
        const itemCash =
          secType === 6
            ? Math.round((itemTot - itemCl) * 100) / 100
            : itemTot - itemCl;
        const itemCover = Number(item.Cover) || 0;

        totalSales += itemTot;
        totalCL += itemCl;
        totalCover += itemCover;

        if (secType === 6 && type6PostMap && type6PostMap.has(periodKey)) {
          dailyPayMap.set(periodKey, type6PostMap.get(periodKey));
        } else {
          const existing = dailyPayMap.get(periodKey) || {
            cash: 0,
            visa: 0,
            cl: 0,
            total: 0,
          };
          existing.cash =
            secType === 6
              ? Math.round((existing.cash + itemCash) * 100) / 100
              : existing.cash + itemCash;
          existing.cl =
            secType === 6
              ? Math.round((existing.cl + itemCl) * 100) / 100
              : existing.cl + itemCl;
          existing.total =
            secType === 6
              ? Math.round((existing.total + itemTot) * 100) / 100
              : existing.total + itemTot;
          dailyPayMap.set(periodKey, existing);
        }
      }

      totalSales = Math.round(totalSales * 100) / 100;
      const totalCash =
        secType === 6 && type6PostSummary
          ? type6PostSummary.cash
          : Math.round((totalSales - totalCL) * 100) / 100;
      const totalVisa = secType === 6 && type6PostSummary ? type6PostSummary.visa : 0;
      totalCL =
        secType === 6 && type6PostSummary
          ? type6PostSummary.cl
          : Math.round(totalCL * 100) / 100;
      const totalNetRevenue =
        secType === 6 && type6PostSummary
          ? type6PostSummary.net
          : Math.round((totalSales / 1.14) * 100) / 100;
      const totalSalesTax =
        secType === 6 && type6PostSummary
          ? type6PostSummary.tax
          : Math.round((totalSales - totalNetRevenue) * 100) / 100;

      const records = rawItemRecords.map((r) => {
        const itemTotal =
          secType === 6
            ? Math.round((Number(r.Total) || 0) * 100) / 100
            : Number(r.Total) || 0;
        const itemCover = Number(r.Cover) || 0;
        const itemNetRev =
          secType === 6 && r.NetAmount !== undefined
            ? Math.round((Number(r.NetAmount) || 0) * 100) / 100
            : Math.round((itemTotal / 1.14) * 100) / 100;
        const itemTax =
          secType === 6 && r.TaxAmount !== undefined
            ? Math.round((Number(r.TaxAmount) || 0) * 100) / 100
            : Math.round((itemTotal - itemNetRev) * 100) / 100;
        const itemCl =
          secType === 6
            ? Math.round((Number(r.CL) || 0) * 100) / 100
            : Number(r.CL) || 0;
        const itemCash =
          secType === 6
            ? Math.round((itemTotal - itemCl) * 100) / 100
            : itemTotal - itemCl;

        const dPay = dailyPayMap.get(String(r.Period || "all")) || {
          cash: itemCash,
          visa: 0,
          cl: itemCl,
          total: itemTotal,
        };

        return {
          branchCode: String(r.Branch_Code),
          name: r.Name,
          period: r.Period || null,
          cover: itemCover,
          cash: itemCash,
          visa: 0,
          creditLine: itemCl,
          total: itemTotal,
          netRevenue: itemNetRev,
          serviceCharge: 0,
          salesTax: itemTax,
          grandTotal: itemTotal,
          totalCollected: itemTotal,
          totalVoids: 0,
          voidCount: 0,
          voidDetails: [],
          variance: 0,
          dailyCash: dPay.cash,
          dailyVisa: dPay.visa,
          dailyCl: dPay.cl,
          dailyTotal: dPay.total,
          marketShare:
            totalSales > 0 ? Math.round((itemTotal / totalSales) * 1000) / 10 : 0,
          avgTicket:
            itemCover > 0 ? Math.round((itemTotal / itemCover) * 100) / 100 : 0,
        };
      });

      return {
        executionTimeMs: duration,
        filters: {
          startDate: sDate,
          endDate: eDate,
          granularity,
          branches,
          sectorType: secType,
        },
        summary: {
          totalSales,
          totalCash,
          totalVisa,
          totalCL,
          totalCover,
          totalNetRevenue,
          totalServiceCharge: 0,
          totalSalesTax,
          totalVoids: secType === 6 ? type6VoidsTotal : 0,
          totalVoidCount: secType === 6 ? type6VoidCount : 0,
          totalVariance: 0,
          cashPct:
            totalSales > 0 ? Math.round((totalCash / totalSales) * 1000) / 10 : 0,
          visaPct:
            totalSales > 0 ? Math.round((totalVisa / totalSales) * 1000) / 10 : 0,
          clPct:
            totalSales > 0 ? Math.round((totalCL / totalSales) * 1000) / 10 : 0,
          avgTicket:
            totalCover > 0
              ? Math.round((totalSales / totalCover) * 100) / 100
              : 0,
          rowCount: records.length,
          topOutlet:
            records.length > 0
              ? {
                  name: records[0].name,
                  total: records[0].total,
                  cover: records[0].cover,
                }
              : null,
          topCaravan:
            records.length > 0
              ? {
                  name: records[0].name,
                  total: records[0].total,
                  cover: records[0].cover,
                }
              : null,
        },
        records,
      };
    } catch (err) {
      console.error("[CaravanReportService.getItemLevelReportData] Error:", err.message);
      throw new Error(`فشل استعلام تقرير الأصناف للقطاع (${sectorType}): ${err.message}`);
    }
  }

  /**
   * تقرير تحليلي محاسبي فائق السرعة لبوابات وتذاكر دريم بارك (Type = 5)
   * يعتمد على التجميع المسبق المباشر في SQL لجداول القاعدة الأساسية POS_Sub_post و POS_Post
   */
  static async getGatesReportData({
    startDate = "2026-01-01",
    endDate = new Date().toISOString().split("T")[0],
    branches = [],
    granularity = "day",
    sortBy = "date_asc",
    sectorType = 5,
    includeAdjustments = true,
  }) {
    try {
      const startTime = Date.now();
      const pool = await getPool();
      const { startDate: sDate, endDate: eDate, endDateNextDay } = normalizeDateRange(
        startDate,
        endDate
      );

      // 1. استعلامات متوازية فائقة السرعة ومحصنة بالبارامترات على جداول القاعدة الأساسية SARGable
      const validBranches = Array.isArray(branches)
        ? branches
            .map((b) => Number(String(b).trim()))
            .filter((n) => [101, 102, 103, 104].includes(n))
        : [];
      const gateBranchCodes =
        validBranches.length > 0 ? validBranches : [101, 102, 103, 104];

      const itemReq = createRequest(pool);
      itemReq.input("startDate", sql.Date, sDate);
      itemReq.input("endDateNextDay", sql.Date, endDateNextDay);
      const itemBranchesPh = bindIntList(itemReq, "gb", gateBranchCodes);

      const posReq = createRequest(pool);
      posReq.input("startDate", sql.Date, sDate);
      posReq.input("endDateNextDay", sql.Date, endDateNextDay);
      const posBranchesPh = bindIntList(posReq, "pb", gateBranchCodes);

      const [itemRes, posRes] = await Promise.all([
        itemReq.query(`
          SELECT
            CONVERT(VARCHAR(10), s.[Doc_Date], 120) AS [Doc_Date],
            s.[Branch_Code],
            s.[item_name],
            ISNULL(s.[item_Sels_Tax_P], 0) AS [item_Sels_Tax_P],
            SUM(CAST(ISNULL(s.[Item_Qunt], 0) AS DECIMAL(18, 4))) AS [Item_Qunt],
            CAST(SUM(ISNULL(s.[Item_Qunt], 0) * ISNULL(s.[Item_Price], 0) * (1.0 + ISNULL(s.[item_Sels_Tax_P], 0) / 100.0)) AS DECIMAL(38, 10)) AS [GrossAmount],
            COUNT(DISTINCT CASE WHEN s.[Branch_Code] = 104 THEN s.[Doc_NO] END) AS [DocCount]
          FROM [dbo].[POS_Sub_post] s WITH (NOLOCK)
          WHERE s.[Branch_Code] IN (${itemBranchesPh})
            AND s.[Doc_Date] >= @startDate
            AND s.[Doc_Date] < @endDateNextDay
            AND (s.[Void_item] = 0 OR s.[Void_item] IS NULL)
          GROUP BY CONVERT(VARCHAR(10), s.[Doc_Date], 120), s.[Branch_Code], s.[item_name], ISNULL(s.[item_Sels_Tax_P], 0)
          OPTION (LOOP JOIN, RECOMPILE);
        `),
        posReq.query(`
          SELECT
            CONVERT(VARCHAR(10), p.[Doc_Date], 120) AS [Doc_Date],
            p.[Branch_Code],
            ISNULL(p.[Cash], 0) AS [Cash],
            ISNULL(p.[Visa], 0) AS [Visa],
            ISNULL(p.[Visa2], 0) AS [Visa2],
            ISNULL(p.[Visa3], 0) AS [Visa3],
            ISNULL(p.[C/L], 0) AS [C/L]
          FROM [dbo].[POS_Post] p WITH (NOLOCK)
          WHERE p.[Branch_Code] IN (${posBranchesPh})
            AND p.[Doc_Date] >= @startDate
            AND p.[Doc_Date] < @endDateNextDay
            AND (p.[Void] = 0 OR p.[Void] IS NULL)
          OPTION (LOOP JOIN, RECOMPILE);
        `),
      ]);

      // 2. تحميل التسويات الخارجية للتسويق والمبيعات
      const adjustmentsMap = GateAdjustmentsService.getAdjustments(sDate, eDate);

      // 3. بناء الفترات (Periods) بدون مشاكل تحويل التوقيت المحلي
      const normGranularity = (granularity || "day").toLowerCase();
      const periodMap = new Map();

      const toYmd = (d) => {
        if (typeof d === "string" && /^\d{4}-\d{2}-\d{2}/.test(d.trim())) {
          return d.trim().slice(0, 10);
        }
        const dt = new Date(d);
        const yyyy = dt.getFullYear();
        const mm = String(dt.getMonth() + 1).padStart(2, "0");
        const dd = String(dt.getDate()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}`;
      };

      const getPeriodKey = (d) => {
        const ymd = toYmd(d);
        if (normGranularity === "month") return ymd.slice(0, 7);
        if (normGranularity === "summary" || normGranularity === "total")
          return "SUMMARY";
        return ymd;
      };

      const getPeriodRecord = (key, dateStr) => {
        if (!periodMap.has(key)) {
          const ymd = toYmd(dateStr);
          const rowDate =
            normGranularity === "summary" || normGranularity === "total"
              ? `${sDate} إلى ${eDate}`
              : normGranularity === "month"
                ? ymd.slice(0, 7)
                : ymd;

          periodMap.set(key, {
            period: key,
            date: rowDate,
            silverRev: 0,
            silverSold: 0,
            goldenRev: 0,
            goldenSold: 0,
            excludedGoldenBooklet: 0,
            silverComboRev: 0,
            silverComboSold: 0,
            diamondRev: 0,
            diamondSold: 0,
            vipRev: 0,
            vipSold: 0,
            familyRev: 0,
            familySold: 0,
            familyPlusRev: 0,
            familyPlusSold: 0,
            familyPlusPartnerRev: 0,
            familyPlusPartnerSold: 0,
            smRev: 0,
            smSold: 0,
            smFree: 0,
            smRawPosRev: 0,
            smRawPosSold: 0,
            promoRev: 0,
            promoSold: 0,
            promoRawPosRev: 0,
            promoCommissionDeduction: 0,
            promoOrphanQty: 0,
            bgRev: 0,
            bgSold: 0,
            bgVouchersCount: 0,
            vendersRev: 0,
            vendersSold: 0,
            unmappedRev: 0,
            unmappedSold: 0,
            totalTicketRev: 0,
            totalTicketSold: 0,
            totalFree: 0,
            grr: 0,
            cash: 0,
            visa: 0,
            cl: 0,
            // Actual Tax Breakdown
            entranceGross: 0,
            entranceVat: 0,
            entranceNet: 0,
            theaterGross: 0,
            theaterVat: 0,
            theaterNet: 0,
            taftafGross: 0,
            totalVat: 0,
            netRevenue: 0,
            // Accounting Standard (53.33% / 26.67% / 20.00%)
            stdEntranceGross: 0,
            stdTheaterGross: 0,
            stdTaftafGross: 0,
            stdEntranceVat: 0,
            stdTheaterVat: 0,
            stdTotalVat: 0,
            stdNetRevenue: 0,
            hasAdjustment: false,
            adjustmentNotes: "",
            adjustmentsApplied: [],
          });
        }
        return periodMap.get(key);
      };

      // 4. معالجة وتصنيف بنود التذاكر من POS_Sub_post المجمعة مسبقاً
      for (const r of itemRes.recordset || []) {
        const pKey = getPeriodKey(r.Doc_Date);
        const rec = getPeriodRecord(pKey, r.Doc_Date);

        const name = String(r.item_name || "").toLowerCase();
        const code = Number(r.Branch_Code);
        const gross = Number(r.GrossAmount) || 0;
        const qty = Number(r.Item_Qunt) || 0;
        const taxP = Number(r.item_Sels_Tax_P) || 0;
        const isEntrance =
          name.includes("entrance") ||
          (!name.includes("theater") && !name.includes("taftaf"));

        // استبعاد دفتر كوبونات ألعاب جولدن من الفرع 102 (يتبع قطاع الألعاب Type 2)
        if (code === 102 && (name.includes("دفتر") || name.includes("booklet"))) {
          rec.excludedGoldenBooklet += gross;
          continue;
        }

        // تجميع أجزاء الضرائب الفعلية
        if (taxP === 14) {
          rec.entranceGross += gross;
          const net = gross / 1.14;
          rec.entranceNet += net;
          rec.entranceVat += gross - net;
        } else if (taxP === 5) {
          rec.theaterGross += gross;
          const net = gross / 1.05;
          rec.theaterNet += net;
          rec.theaterVat += gross - net;
        } else {
          rec.taftafGross += gross;
        }

        // توجيه الفئات الدقيق
        if (code === 101 || name.includes("family")) {
          if (name.includes("partner") || name.includes("بارتنر")) {
            rec.familyPlusPartnerRev += gross;
            if (isEntrance) rec.familyPlusPartnerSold += qty;
          } else if (name.includes("plus") || name.includes("بلس")) {
            rec.familyPlusRev += gross;
            if (isEntrance) rec.familyPlusSold += qty;
          } else {
            rec.familyRev += gross;
            if (isEntrance) rec.familySold += qty;
          }
        } else if (
          code === 102 &&
          name.includes("silver") &&
          !name.includes("compo") &&
          !name.includes("combo")
        ) {
          rec.silverRev += gross;
          if (isEntrance) rec.silverSold += qty;
        } else if (code === 102 && (name.includes("golden") || name.includes("gold"))) {
          rec.goldenRev += gross;
          if (isEntrance) rec.goldenSold += qty;
        } else if (code === 102 && (name.includes("compo") || name.includes("combo"))) {
          rec.silverComboRev += gross;
          if (isEntrance) rec.silverComboSold += qty;
        } else if (name.includes("diamond") || name.includes("دايموند")) {
          rec.diamondRev += gross;
          if (isEntrance) rec.diamondSold += qty;
        } else if (name.includes("vip")) {
          rec.vipRev += gross;
          if (isEntrance) rec.vipSold += qty;
        } else if (
          code === 104 &&
          (name.includes("sttaf") || name.includes("staff") || name.includes("عامل"))
        ) {
          rec.bgRev += gross;
          if (isEntrance) rec.bgSold += qty;
          rec.bgVouchersCount += Number(r.DocCount) || 0;
        } else if (
          code === 104 &&
          (name.includes("215") ||
            name.includes("220") ||
            name.includes("210") ||
            name.includes("grop") ||
            name.includes("group"))
        ) {
          rec.smRev += gross;
          rec.smRawPosRev += gross;
          if (isEntrance) {
            rec.smSold += qty;
            rec.smRawPosSold += qty;
          }
        } else if (code === 104) {
          rec.promoRawPosRev += gross;
          if (name.includes("w 230") && isEntrance) {
            rec.promoCommissionDeduction += qty * 10;
          }
          if (name.includes("ايتام")) {
            if (isEntrance) rec.promoOrphanQty += qty;
          } else if (isEntrance) {
            rec.promoSold += qty;
          }
          rec.promoRev += gross;
        } else if (name.includes("vender") || name.includes("فيندور")) {
          rec.vendersRev += gross;
          if (isEntrance) rec.vendersSold += qty;
        } else {
          rec.unmappedRev += gross;
          if (isEntrance) rec.unmappedSold += qty;
        }
      }

      // 5. تسوية مبيعات العروض بخصم العمولة
      for (const rec of periodMap.values()) {
        rec.promoRev -= rec.promoCommissionDeduction;
      }

      // 6. معالجة الدفعات وتعديل دفتر جولدن وعمولة Doc 7
      for (const p of posRes.recordset || []) {
        const pKey = getPeriodKey(p.Doc_Date);
        const rec = getPeriodRecord(pKey, p.Doc_Date);

        const code = Number(p.Branch_Code);
        const cash = Number(p.Cash) || 0;
        const visa =
          (Number(p.Visa) || 0) + (Number(p.Visa2) || 0) + (Number(p.Visa3) || 0);
        let cl = Number(p["C/L"]) || 0;

        if (code === 104 && cl > 0 && rec.promoCommissionDeduction > 0) {
          cl = Math.max(0, cl - rec.promoCommissionDeduction);
        }

        rec.cash += cash;
        rec.visa += visa;
        rec.cl += cl;
      }

      // تعديل دفتر جولدن من دفعات الفرع 102
      for (const rec of periodMap.values()) {
        if (rec.excludedGoldenBooklet > 0) {
          if (rec.cash >= rec.excludedGoldenBooklet) {
            rec.cash -= rec.excludedGoldenBooklet;
          } else {
            const rem = rec.excludedGoldenBooklet - rec.cash;
            rec.cash = 0;
            rec.visa = Math.max(0, rec.visa - rem);
          }
        }
      }

      // 7. دمج التسويات الخارجية للمبيعات والتسويق (External Adjustments)
      if (includeAdjustments) {
        for (const [adjDate, adj] of Object.entries(adjustmentsMap)) {
          const pKey = getPeriodKey(adjDate);
          if (periodMap.has(pKey)) {
            const rec = periodMap.get(pKey);
            const smExtRev = Number(adj.smExternalRevenue) || 0;
            const smExtSold = Number(adj.smExternalSold) || 0;
            const smFree = Number(adj.smFree) || 0;
            const promoAdjRev = Number(adj.promoAdjustmentRev) || 0;
            const promoAdjSold = Number(adj.promoAdjustmentSold) || 0;
            const bgAdjRev = Number(adj.bgAdjustmentRev) || 0;

            rec.smRev += smExtRev;
            rec.smSold += smExtSold;
            rec.smFree += smFree;
            rec.promoRev += promoAdjRev;
            rec.promoSold += promoAdjSold;
            rec.bgRev += bgAdjRev;
            rec.cl += smExtRev + promoAdjRev + bgAdjRev;

            rec.hasAdjustment = true;
            rec.adjustmentNotes = [rec.adjustmentNotes, adj.notes]
              .filter(Boolean)
              .join(" | ");
            rec.adjustmentsApplied.push(adj);
          }
        }
      }

      // 8. حساب الإجماليات والضرائب المعيارية والقيم النهائية
      const records = [];
      for (const rec of periodMap.values()) {
        rec.bgVouchers = rec.bgVouchersCount || (rec.bgRev > 0 ? 1 : 0);
        delete rec.bgVouchersCount;

        rec.totalTicketRev =
          rec.silverRev +
          rec.goldenRev +
          rec.silverComboRev +
          rec.diamondRev +
          rec.vipRev +
          rec.familyRev +
          rec.familyPlusRev +
          rec.familyPlusPartnerRev +
          rec.smRev +
          rec.promoRev +
          rec.bgRev +
          rec.vendersRev +
          rec.unmappedRev;

        rec.totalFree = rec.smFree;
        rec.totalTicketSold =
          rec.silverSold +
          rec.goldenSold +
          rec.silverComboSold +
          rec.diamondSold +
          rec.vipSold +
          rec.familySold +
          rec.familyPlusSold +
          rec.familyPlusPartnerSold +
          rec.smSold +
          rec.promoSold +
          rec.totalFree;

        rec.grr = rec.totalTicketRev - rec.bgRev;

        // ضريبة فعلية
        rec.totalVat = rec.entranceVat + rec.theaterVat;
        rec.netRevenue = rec.totalTicketRev - rec.totalVat;

        // ضرائب ومعايير محاسبية (53.33% / 26.67% / 20.00%)
        rec.stdEntranceGross = rec.totalTicketRev * 0.5333;
        rec.stdTheaterGross = rec.totalTicketRev * 0.2667;
        rec.stdTaftafGross = rec.totalTicketRev * 0.2;
        rec.stdEntranceVat = rec.stdEntranceGross - rec.stdEntranceGross / 1.14;
        rec.stdTheaterVat = rec.stdTheaterGross - rec.stdTheaterGross / 1.05;
        rec.stdTotalVat = rec.stdEntranceVat + rec.stdTheaterVat;
        rec.stdNetRevenue = rec.totalTicketRev - rec.stdTotalVat;

        // توافق كامل مع الخصائص القياسية للتقارير
        rec.total = rec.totalTicketRev;
        rec.totalSales = rec.totalTicketRev;
        rec.cover = rec.totalTicketSold;
        rec.creditLine = rec.cl;
        rec.salesTax = rec.totalVat;
        rec.serviceCharge = 0;
        rec.totalVoids = 0;
        rec.voidCount = 0;
        rec.variance = 0;
        rec.marketShare = 100;
        rec.avgTicket =
          rec.totalTicketSold > 0
            ? Math.round((rec.totalTicketRev / rec.totalTicketSold) * 100) / 100
            : 0;
        rec.name = `بوابات ${rec.period || rec.date}`;
        rec.branchCode = "gates";

        // تقريب الحقول إلى منزلتين عشريتين
        for (const [k, v] of Object.entries(rec)) {
          if (typeof v === "number") {
            rec[k] = Math.round(v * 100) / 100;
          }
        }

        records.push(rec);
      }

      if (sortBy === "date_desc") {
        records.sort((a, b) => b.period.localeCompare(a.period));
      } else {
        records.sort((a, b) => a.period.localeCompare(b.period));
      }

      // 9. حساب ملخص الفترة الشامل (Overall Summary)
      const summary = records.reduce(
        (acc, r) => {
          acc.totalSales += r.totalTicketRev;
          acc.totalTicketRev += r.totalTicketRev;
          acc.totalTicketSold += r.totalTicketSold;
          acc.totalFree += r.totalFree;
          acc.grr += r.grr;
          acc.totalCash += r.cash;
          acc.totalVisa += r.visa;
          acc.totalCL += r.cl;
          acc.totalVat += r.totalVat;
          acc.netRevenue += r.netRevenue;
          acc.silverRev += r.silverRev;
          acc.silverSold += r.silverSold;
          acc.goldenRev += r.goldenRev;
          acc.goldenSold += r.goldenSold;
          acc.silverComboRev += r.silverComboRev;
          acc.silverComboSold += r.silverComboSold;
          acc.familyRev += r.familyRev;
          acc.familySold += r.familySold;
          acc.smRev += r.smRev;
          acc.smSold += r.smSold;
          acc.smFree += r.smFree;
          acc.promoRev += r.promoRev;
          acc.promoSold += r.promoSold;
          acc.bgRev += r.bgRev;
          acc.bgVouchers += r.bgVouchers;
          return acc;
        },
        {
          totalSales: 0,
          totalTicketRev: 0,
          totalTicketSold: 0,
          totalFree: 0,
          grr: 0,
          totalCash: 0,
          totalVisa: 0,
          totalCL: 0,
          totalVat: 0,
          netRevenue: 0,
          silverRev: 0,
          silverSold: 0,
          goldenRev: 0,
          goldenSold: 0,
          silverComboRev: 0,
          silverComboSold: 0,
          familyRev: 0,
          familySold: 0,
          smRev: 0,
          smSold: 0,
          smFree: 0,
          promoRev: 0,
          promoSold: 0,
          bgRev: 0,
          bgVouchers: 0,
          rowCount: records.length,
        }
      );

      summary.totalSales = summary.totalTicketRev;
      summary.totalOrders = summary.totalTicketSold;
      summary.totalCover = summary.totalTicketSold;
      summary.totalUnits = summary.totalTicketSold;
      summary.avgTicket =
        summary.totalTicketSold > 0
          ? Math.round((summary.totalTicketRev / summary.totalTicketSold) * 100) / 100
          : 0;
      summary.revenueGrowthPct = 0;
      summary.marketShare = 100;

      for (const [k, v] of Object.entries(summary)) {
        if (typeof v === "number") {
          summary[k] = Math.round(v * 100) / 100;
        }
      }

      const gateColumns = [
        { branchCode: "silver", name: "Silver", group: "silver", unitPrice: 300 },
        { branchCode: "golden", name: "Golden", group: "golden", unitPrice: 270 },
        {
          branchCode: "silver_combo",
          name: "Silver Combo",
          group: "silver_combo",
          unitPrice: 290,
        },
        { branchCode: "diamond", name: "Diamond", group: "diamond", unitPrice: 0 },
        { branchCode: "vip", name: "VIP", group: "vip", unitPrice: 0 },
        { branchCode: "family", name: "Family", group: "family", unitPrice: 275 },
        {
          branchCode: "family_plus",
          name: "Family Plus",
          group: "family_plus",
          unitPrice: 0,
        },
        {
          branchCode: "family_plus_partner",
          name: "Family Plus Partner",
          group: "family_plus_partner",
          unitPrice: 0,
        },
        { branchCode: "sm", name: "S&M", group: "sm", unitPrice: 215 },
        { branchCode: "promotion", name: "Promotion", group: "promotion", unitPrice: 0 },
        { branchCode: "bg", name: "B.G", group: "bg", unitPrice: 0 },
        { branchCode: "venders", name: "Venders", group: "venders", unitPrice: 0 },
      ];

      return {
        executionTimeMs: Date.now() - startTime,
        sectorType: 5,
        sectorLabel: "البوابات والتذاكر",
        filters: {
          startDate: sDate,
          endDate: eDate,
          granularity,
          sectorType: 5,
          includeAdjustments,
        },
        summary,
        columns: gateColumns,
        branches: gateColumns,
        records,
      };
    } catch (err) {
      console.error("[CaravanReportService.getGatesReportData] Error:", err.message);
      throw new Error(`فشل استعلام تقرير البوابات والتذاكر (Type 5): ${err.message}`);
    }
  }

  /**
   * استعلام وتجميع بيانات إيرادات القطاع المالي مع دعم التصفية الزمنية وتعدد المنافذ والتجميع الديناميكي
   * @param {Object} params
   * @param {string} params.startDate 'YYYY-MM-DD'
   * @param {string} params.endDate 'YYYY-MM-DD'
   * @param {string[]} [params.branches] قائمة أكواد الفروع
   * @param {('summary'|'month'|'day'|'total')} [params.granularity] مستوى التجميع
   * @param {string} [params.sortBy] طريقة الترتيب
   * @param {number} [params.sectorType=4] نوع القطاع (1: مطاعم, 2: ألعاب, 3: فيديو جيم, 4: كرفانات, 5: بوابات, 6: أمانات)
   */
  static async getReportData({
    startDate = "2026-01-01",
    endDate = new Date().toISOString().split("T")[0],
    branches = [],
    granularity = "summary",
    sortBy = "total_desc",
    sectorType = 4,
    bypassCache = false,
    includeAdjustments = true,
  }) {
    const secType = Number(sectorType) || 4;
    const { startDate: sDate, endDate: eDate, endDateNextDay } = normalizeDateRange(
      startDate,
      endDate
    );
    const normGranularity = (granularity || "summary").toLowerCase();
    const isSummaryGran = normGranularity === "summary" || normGranularity === "total";

    const cacheKey = buildReportCacheKey({
      sectorType: secType,
      startDate: sDate,
      endDate: eDate,
      granularity: normGranularity,
      sortBy,
      branches,
      includeAdjustments,
    });

    if (!bypassCache) {
      const cached = getCachedReport(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // قطاع البوابات والتذاكر (Type = 5)
    if (secType === 5) {
      const gatesResult = await this.getGatesReportData({
        startDate: sDate,
        endDate: eDate,
        branches,
        granularity: normGranularity,
        sortBy,
        sectorType: 5,
        includeAdjustments,
      });
      setCachedReport(cacheKey, eDate, gatesResult);
      return gatesResult;
    }

    // قطاعات الألعاب (Type = 2) والفيديو جيم (Type = 3) والأمانات والانتظار (Type = 6)
    if (secType === 2 || secType === 3 || secType === 6) {
      const itemResult = await this.getItemLevelReportData({
        startDate: sDate,
        endDate: eDate,
        branches,
        granularity: normGranularity,
        sortBy,
        sectorType: secType,
      });
      setCachedReport(cacheKey, eDate, itemResult);
      return itemResult;
    }

    try {
      const pool = await getPool();
      const request = createRequest(pool);

      // 1. تثبيت بارامترات التواريخ والقطاع الآمنة (SARGable DATE parameters)
      request.input("startDate", sql.Date, sDate);
      request.input("endDateNextDay", sql.Date, endDateNextDay);
      request.input("sectorType", sql.Int, secType);
      const exclPh = bindIntList(request, "ex", EXCLUDED_NON_REVENUE_BRANCHES);

      // 2. معالجة تصفية المنافذ المختارة
      const validBranchCodes = Array.isArray(branches)
        ? branches
            .map((code) => Number(String(code).trim()))
            .filter((n) => Number.isFinite(n))
        : [];

      let branchClause = "";
      if (validBranchCodes.length > 0) {
        const bPh = bindIntList(request, "branch", validBranchCodes);
        branchClause = ` AND b.[Code] IN (${bPh})`;
      }

      // 3. تحديد ترتيب النتائج
      let orderClause = "s.[Total] DESC";
      if (sortBy === "total_asc") orderClause = "s.[Total] ASC";
      else if (sortBy === "cover_desc")
        orderClause = "s.[Cover] DESC, s.[Total] DESC";
      else if (sortBy === "name_asc") orderClause = "s.[Name] ASC";

      // 4. بناء الحقول وفق مستوى التجميع (Granularity)
      let selectSalesPeriod = "";
      let groupBySalesPeriod = "";
      let selectItemPeriod = "";
      let groupByItemPeriod = "";
      let joinItemPeriod = "";
      let outerSelectPeriod = "";
      let orderByGranularity = "";

      if (normGranularity === "month") {
        selectSalesPeriod = `YEAR(p.[Doc_Date]) AS [PeriodYear], MONTH(p.[Doc_Date]) AS [PeriodMonth],`;
        groupBySalesPeriod = `, YEAR(p.[Doc_Date]), MONTH(p.[Doc_Date])`;
        selectItemPeriod = `YEAR(sp.[Doc_Date]) AS [PeriodYear], MONTH(sp.[Doc_Date]) AS [PeriodMonth],`;
        groupByItemPeriod = `, YEAR(sp.[Doc_Date]), MONTH(sp.[Doc_Date])`;
        joinItemPeriod = `AND i.[PeriodYear] = s.[PeriodYear] AND i.[PeriodMonth] = s.[PeriodMonth]`;
        outerSelectPeriod = `CAST(s.[PeriodYear] AS VARCHAR(4)) + '-' + RIGHT('0' + CAST(s.[PeriodMonth] AS VARCHAR(2)), 2) AS [Period],`;
        orderByGranularity = `s.[PeriodYear] ASC, s.[PeriodMonth] ASC, `;
      } else if (normGranularity === "day") {
        selectSalesPeriod = `p.[Doc_Date] AS [PeriodDate],`;
        groupBySalesPeriod = `, p.[Doc_Date]`;
        selectItemPeriod = `sp.[Doc_Date] AS [PeriodDate],`;
        groupByItemPeriod = `, sp.[Doc_Date]`;
        joinItemPeriod = `AND i.[PeriodDate] = s.[PeriodDate]`;
        outerSelectPeriod = `CONVERT(VARCHAR(10), s.[PeriodDate], 120) AS [Period],`;
        orderByGranularity = `s.[PeriodDate] ASC, `;
      }

      const fbCTE =
        secType === 1
          ? `
            ,
            ItemAgg AS (
                SELECT 
                    sp.[Branch_Code],
                    ${selectItemPeriod}
                    CAST(SUM(CASE WHEN g.[CategoryType] = 1 THEN ISNULL(sp.[Item_Qunt], 0) * ISNULL(sp.[Item_Price], 0) + ISNULL(sp.[item_Sels_Tax], 0) + ISNULL(sp.[item_Serves_Tax], 0) ELSE 0 END) AS DECIMAL(18, 4)) AS [Food],
                    CAST(SUM(CASE WHEN g.[CategoryType] = 2 THEN ISNULL(sp.[Item_Qunt], 0) * ISNULL(sp.[Item_Price], 0) + ISNULL(sp.[item_Sels_Tax], 0) + ISNULL(sp.[item_Serves_Tax], 0) ELSE 0 END) AS DECIMAL(18, 4)) AS [Beverage],
                    CAST(SUM(CASE WHEN ISNULL(g.[CategoryType], 0) NOT IN (1, 2) THEN ISNULL(sp.[Item_Qunt], 0) * ISNULL(sp.[Item_Price], 0) + ISNULL(sp.[item_Sels_Tax], 0) + ISNULL(sp.[item_Serves_Tax], 0) ELSE 0 END) AS DECIMAL(18, 4)) AS [Other],
                    CAST(SUM(ISNULL(sp.[Item_Qunt], 0) * ISNULL(it.[itemcost], 0)) AS DECIMAL(18, 4)) AS [Cost]
                FROM [dbo].[POS_Sub_post] sp WITH (NOLOCK)
                INNER JOIN TargetBranches tb ON tb.[Code] = sp.[Branch_Code]
                LEFT JOIN [dbo].[items] it WITH (NOLOCK) ON it.[code] = sp.[item_Code] AND it.[BranchCode] = sp.[Branch_Code]
                LEFT JOIN [dbo].[Groupitem] g WITH (NOLOCK) ON g.[code] = it.[Group_code] AND g.[Branch_Code] = it.[BranchCode]
                WHERE sp.[Doc_Date] >= @startDate AND sp.[Doc_Date] < @endDateNextDay
                  AND (sp.[Void_item] = 0 OR sp.[Void_item] IS NULL)
                GROUP BY sp.[Branch_Code] ${groupByItemPeriod}
            )`
          : "";

      const fbJoin =
        secType === 1
          ? `
            LEFT JOIN ItemAgg i ON i.[Branch_Code] = s.[Branch_Code] ${joinItemPeriod}
        `
          : "";

      const fbCols =
        secType === 1
          ? `
            ISNULL(i.[Food], 0) AS [Food],
            ISNULL(i.[Beverage], 0) AS [Beverage],
            ISNULL(i.[Other], 0) AS [Other],
            ISNULL(i.[Cost], 0) AS [Cost],
        `
          : "";

      const query = `
            WITH TargetBranches AS (
                SELECT [Code], [Aname]
                FROM [dbo].[Branchs] b WITH (NOLOCK)
                WHERE b.[Type] = @sectorType
                  AND b.[Code] NOT IN (${exclPh})
                  ${branchClause}
            ),
            SalesAgg AS (
                SELECT 
                    tb.[Code] AS [Branch_Code],
                    tb.[Aname] AS [Name],
                    ${selectSalesPeriod}
                    SUM(CAST(ISNULL(p.[cover], 0) AS INT)) AS [Cover],
                    SUM(CAST(ISNULL(p.[Cash], 0) AS DECIMAL(18, 4))) AS [Cash],
                    SUM(CAST(ISNULL(p.[Visa], 0) + ISNULL(p.[Visa2], 0) + ISNULL(p.[Visa3], 0) AS DECIMAL(18, 4))) AS [Visa],
                    SUM(CAST(ISNULL(p.[C/L], 0) AS DECIMAL(18, 4))) AS [CL],
                    SUM(CAST(ISNULL(p.[Cash], 0) + ISNULL(p.[Visa], 0) + ISNULL(p.[Visa2], 0) + ISNULL(p.[Visa3], 0) + ISNULL(p.[C/L], 0) AS DECIMAL(18, 4))) AS [Total],
                    SUM(CAST(ISNULL(p.[TotalInv], 0) AS DECIMAL(18, 4))) AS [TotalInv],
                    SUM(CAST(ISNULL(p.[serves_tax], 0) AS DECIMAL(18, 4))) AS [ServiceCharge],
                    SUM(CAST(ISNULL(p.[Sels_Tax], 0) AS DECIMAL(18, 4))) AS [SalesTax]
                FROM TargetBranches tb
                INNER JOIN [dbo].[POS_Post] p WITH (NOLOCK) ON p.[Branch_Code] = tb.[Code]
                WHERE p.[Doc_Date] >= @startDate
                  AND p.[Doc_Date] < @endDateNextDay
                  AND (p.[Void] = 0 OR p.[Void] IS NULL)
                GROUP BY tb.[Code], tb.[Aname] ${groupBySalesPeriod}
                HAVING SUM(CAST(ISNULL(p.[Cash], 0) + ISNULL(p.[Visa], 0) + ISNULL(p.[Visa2], 0) + ISNULL(p.[Visa3], 0) + ISNULL(p.[C/L], 0) AS DECIMAL(18, 4))) <> 0
            )
            ${fbCTE}
            SELECT 
                s.[Branch_Code],
                s.[Name],
                ${outerSelectPeriod}
                ${fbCols}
                s.[Cover],
                s.[Cash],
                s.[Visa],
                s.[CL] AS [C/L],
                s.[Total],
                s.[TotalInv],
                s.[ServiceCharge],
                s.[SalesTax],
                ((s.[Cash] + s.[Visa] + s.[CL]) - s.[Total]) AS [Variance],
                SUM(s.[Total]) OVER () AS [GrandTotalNet],
                SUM(s.[Cash]) OVER () AS [GrandTotalCash],
                SUM(s.[CL]) OVER () AS [GrandTotalCL],
                SUM(s.[Visa]) OVER () AS [GrandTotalVisa],
                SUM(s.[Cover]) OVER () AS [GrandTotalCover]
            FROM SalesAgg s
            ${fbJoin}
            ORDER BY ${orderByGranularity}${orderClause}
            OPTION (HASH JOIN, RECOMPILE);
        `;

      // Single-Pass Direct Voids Query on Base Tables (replaces 2 separate scans of slow Pos_item_post_void view!)
      const branchTypeMap = await getBranchTypeMap(pool);
      const sectorBranchCodes = [];
      for (const [code, t] of branchTypeMap.entries()) {
        if (t === secType && !EXCLUDED_BRANCHES_SET.has(code)) {
          if (validBranchCodes.length === 0 || validBranchCodes.includes(code)) {
            sectorBranchCodes.push(code);
          }
        }
      }

      const voidsReq = createRequest(pool);
      voidsReq.input("startDate", sql.Date, sDate);
      voidsReq.input("endDateNextDay", sql.Date, endDateNextDay);
      const voidBranchesPh = bindIntList(voidsReq, "vb", sectorBranchCodes);

      const singlePassVoidsQuery = `
        SELECT
          sp.[Branch_Code] AS [branchCode],
          ${normGranularity === "month" ? "CONVERT(VARCHAR(7), sp.[Doc_Date], 120) AS [period]," : normGranularity === "day" ? "CONVERT(VARCHAR(10), sp.[Doc_Date], 120) AS [period]," : ""}
          sp.[item_Code] AS [itemCode],
          ISNULL(sp.[item_name], it.[name_e]) AS [itemName],
          CONVERT(VARCHAR(10), sp.[Doc_Date], 120) AS [docDate],
          CONVERT(VARCHAR(8), ISNULL(sp.[Inv_Time], sp.[item_time]), 108) AS [docTime],
          ISNULL(sp.[Item_Qunt], 1) AS [quantity],
          ROUND(ISNULL(sp.[Item_Price], 0) * (1.0 + ISNULL(sp.[item_Sels_Tax_P], 0) / 100.0 + ISNULL(sp.[item_Serves_Tax_P], 0) / 100.0), 2) AS [price],
          CAST(ISNULL(sp.[Item_Qunt], 0) * ISNULL(sp.[Item_Price], 0) * (1.0 + ISNULL(sp.[item_Sels_Tax_P], 0) / 100.0 + ISNULL(sp.[item_Serves_Tax_P], 0) / 100.0) AS DECIMAL(18, 4)) AS [rawTotal],
          ROUND(ISNULL(sp.[Item_Qunt], 0) * ISNULL(sp.[Item_Price], 0) * (1.0 + ISNULL(sp.[item_Sels_Tax_P], 0) / 100.0 + ISNULL(sp.[item_Serves_Tax_P], 0) / 100.0), 2) AS [total]
        FROM [dbo].[POS_Sub_post] sp WITH (NOLOCK)
        INNER JOIN [dbo].[POS_Post] pp WITH (NOLOCK)
          ON sp.[Doc_NO] = pp.[Doc_NO]
          AND sp.[ID_Pos] = pp.[id_pos]
          AND sp.[Branch_Code] = pp.[Branch_Code]
          AND sp.[Doc_Date] = pp.[Doc_Date]
        INNER JOIN [dbo].[items] it WITH (NOLOCK)
          ON it.[code] = sp.[item_Code]
          AND it.[BranchCode] = sp.[Branch_Code]
        INNER JOIN [dbo].[Groupitem] gi WITH (NOLOCK)
          ON gi.[code] = it.[Group_code]
          AND gi.[Branch_Code] = it.[BranchCode]
        WHERE sp.[Doc_Date] >= @startDate
          AND sp.[Doc_Date] < @endDateNextDay
          AND pp.[Doc_Date] >= @startDate
          AND pp.[Doc_Date] < @endDateNextDay
          AND sp.[Branch_Code] IN (${voidBranchesPh})
          AND pp.[Branch_Code] IN (${voidBranchesPh})
          AND ISNULL(sp.[Void_item], 0) = 1
          AND pp.[Officer] = 0
        ORDER BY sp.[Doc_Date] DESC, sp.[Inv_Time] DESC
        OPTION (HASH JOIN, RECOMPILE);
      `;

      const startTime = Date.now();
      const [result, voidsResult] = await Promise.all([
        request.query(query),
        sectorBranchCodes.length > 0
          ? voidsReq.query(singlePassVoidsQuery).catch((err) => {
              console.warn(
                "[CaravanReportService] Single-pass voids query failed:",
                err.message
              );
              return { recordset: [] };
            })
          : Promise.resolve({ recordset: [] }),
      ]);
      const duration = Date.now() - startTime;

      const rawVoidDetails = voidsResult.recordset || [];

      // Compute BOTH voidsAggMap and voidMap in a single O(N) pass
      const voidsAggMap = new Map();
      const voidMap = new Map();
      for (const vd of rawVoidDetails) {
        const key = !isSummaryGran
          ? `${vd.branchCode}-${vd.period}`
          : String(vd.branchCode);
        const curAgg = voidsAggMap.get(key) || { TotalVoids: 0, VoidCount: 0 };
        curAgg.TotalVoids += Number(vd.rawTotal) || 0;
        curAgg.VoidCount += 1;
        voidsAggMap.set(key, curAgg);

        if (!voidMap.has(key)) voidMap.set(key, []);
        voidMap.get(key).push({
          itemCode: String(vd.itemCode),
          itemName: String(vd.itemName || "صنف غير محدد"),
          docDate: String(vd.docDate),
          docTime: vd.docTime ? String(vd.docTime) : undefined,
          quantity: Number(vd.quantity) || 1,
          price: Number(vd.price) || 0,
          total: Number(vd.total) || 0,
        });
      }

      const rawRecords = (result.recordset || [])
        .filter((r) => Math.abs(Number(r.Total) || 0) > 0.0001)
        .map((r) => {
          const key = !isSummaryGran
            ? `${r.Branch_Code}-${r.Period}`
            : String(r.Branch_Code);
          const va = voidsAggMap.get(key);
          return {
            ...r,
            TotalVoids: va ? va.TotalVoids : 0,
            VoidCount: va ? va.VoidCount : 0,
          };
        });

      // 5. الحسابات المالية التجميعية لملخص الأداء (مطابقة معيار الحسابات الذهبي)
      const sqlGrandTotal = Number(rawRecords[0]?.GrandTotalNet);
      const sqlGrandCash = Number(rawRecords[0]?.GrandTotalCash);
      const sqlGrandCL = Number(rawRecords[0]?.GrandTotalCL);
      const sqlGrandCover = Number(rawRecords[0]?.GrandTotalCover);

      let totalSales = 0;
      let totalCash = 0;
      let totalVisa = 0;
      let totalCL = 0;
      let totalCover = 0;
      let totalNetRevenue = 0;
      let totalServiceCharge = 0;
      let totalSalesTax = 0;
      let totalVoids = 0;
      let totalVariance = 0;
      let totalFood = 0;
      let totalBeverage = 0;
      let totalOther = 0;
      let totalCost = 0;

      for (const row of rawRecords) {
        totalSales += Number(row.Total) || 0;
        totalCash += Number(row.Cash) || 0;
        totalVisa += Number(row.Visa) || 0;
        totalCL += Number(row["C/L"] ?? row.CL) || 0;
        totalCover += Number(row.Cover) || 0;
        totalNetRevenue += Number(row.TotalInv) || 0;
        totalServiceCharge += Number(row.ServiceCharge) || 0;
        totalSalesTax += Number(row.SalesTax) || 0;
        totalVoids += Number(row.TotalVoids) || 0;
        totalVariance += Number(row.Variance) || 0;
        if (secType === 1) {
          totalFood += Number(row.Food) || 0;
          totalBeverage += Number(row.Beverage) || 0;
          totalOther += Number(row.Other) || 0;
          totalCost += Number(row.Cost) || 0;
        }
      }

      totalSales = Math.round(totalSales * 100) / 100;
      totalCash = Math.round(totalCash * 100) / 100;
      totalVisa = Math.round(totalVisa * 100) / 100;
      totalCL = Math.round(totalCL * 100) / 100;
      totalNetRevenue = Math.round(totalNetRevenue * 100) / 100;
      totalServiceCharge = Math.round(totalServiceCharge * 100) / 100;
      totalSalesTax = Math.round(totalSalesTax * 100) / 100;
      totalVoids = Math.round(totalVoids * 100) / 100;
      totalVariance = Math.round(totalVariance * 100) / 100;
      if (Math.abs(totalVariance) < 0.005) totalVariance = 0;

      if (Number.isFinite(sqlGrandTotal) && sqlGrandTotal > 0)
        totalSales = Math.round(sqlGrandTotal * 100) / 100;
      if (Number.isFinite(sqlGrandCash))
        totalCash = Math.round(sqlGrandCash * 100) / 100;
      if (Number.isFinite(sqlGrandCL))
        totalCL = Math.round(sqlGrandCL * 100) / 100;
      if (Number.isFinite(sqlGrandCover)) totalCover = sqlGrandCover;

      const records = rawRecords.map((r) => {
        const itemCash = Number(r.Cash) || 0;
        const itemVisa = Number(r.Visa) || 0;
        const itemCL = Number(r["C/L"] ?? r.CL) || 0;
        const itemTotal = Number(r.Total) || itemCash + itemVisa + itemCL;
        const itemCover = Number(r.Cover) || 0;
        const itemNetRev = Number(r.TotalInv) || itemTotal / 1.14;
        const itemServ = Number(r.ServiceCharge) || 0;
        const itemTax = Number(r.SalesTax) || 0;
        const itemVoids = Number(r.TotalVoids) || 0;
        const itemVoidCount = Number(r.VoidCount) || 0;

        const totalCollected = itemCash + itemVisa + itemCL;
        let variance = totalCollected - itemTotal;
        if (Math.abs(variance) < 0.005) {
          variance = 0;
        }

        const rowKey = !isSummaryGran
          ? `${r.Branch_Code}-${r.Period}`
          : String(r.Branch_Code);
        const voidDetails = voidMap.get(rowKey) || [];

        return {
          branchCode: String(r.Branch_Code),
          name: r.Name,
          period: r.Period || null,
          cover: itemCover,
          cash: secType === 1 ? Math.round(itemCash * 100) / 100 : itemCash,
          visa: secType === 1 ? Math.round(itemVisa * 100) / 100 : itemVisa,
          creditLine: secType === 1 ? Math.round(itemCL * 100) / 100 : itemCL,
          total: secType === 1 ? Math.round(itemTotal * 100) / 100 : itemTotal,
          netRevenue: Math.round(itemNetRev * 100) / 100,
          serviceCharge: Math.round(itemServ * 100) / 100,
          salesTax: Math.round(itemTax * 100) / 100,
          grandTotal:
            secType === 1 ? Math.round(itemTotal * 100) / 100 : itemTotal,
          totalCollected,
          totalVoids: Math.round(itemVoids * 100) / 100,
          voidCount: itemVoidCount,
          voidDetails,
          variance,
          marketShare:
            totalSales > 0 ? Math.round((itemTotal / totalSales) * 1000) / 10 : 0,
          avgTicket:
            itemCover > 0 ? Math.round((itemTotal / itemCover) * 100) / 100 : 0,
          ...(secType === 1
            ? (() => {
                const rTot = Math.round(itemTotal * 100) / 100;
                const rFood = Math.round((Number(r.Food) || 0) * 100) / 100;
                const rBev = Math.round((Number(r.Beverage) || 0) * 100) / 100;
                const rOther = Math.round((rTot - rFood - rBev) * 100) / 100;
                return {
                  food: rFood,
                  beverage: rBev,
                  other: rOther,
                  cost: Math.round((Number(r.Cost) || 0) * 100) / 100,
                };
              })()
            : {}),
        };
      });

      const finalReport = {
        executionTimeMs: duration,
        filters: {
          startDate: sDate,
          endDate: eDate,
          granularity,
          branches,
          sectorType: secType,
        },
        summary: {
          totalSales,
          totalCash,
          totalVisa,
          totalCL,
          totalCover,
          totalNetRevenue,
          totalServiceCharge,
          totalSalesTax,
          totalVoids,
          totalVariance,
          ...(secType === 1
            ? {
                totalFood: Math.round(totalFood * 100) / 100,
                totalBeverage: Math.round(totalBeverage * 100) / 100,
                totalOther: Math.round(totalOther * 100) / 100,
                totalCost: Math.round(totalCost * 100) / 100,
                foodPct:
                  totalSales > 0
                    ? Math.round((totalFood / totalSales) * 1000) / 10
                    : 0,
                beveragePct:
                  totalSales > 0
                    ? Math.round((totalBeverage / totalSales) * 1000) / 10
                    : 0,
                otherPct:
                  totalSales > 0
                    ? Math.round((totalOther / totalSales) * 1000) / 10
                    : 0,
              }
            : {}),
          cashPct:
            totalSales > 0 ? Math.round((totalCash / totalSales) * 1000) / 10 : 0,
          visaPct:
            totalSales > 0 ? Math.round((totalVisa / totalSales) * 1000) / 10 : 0,
          clPct:
            totalSales > 0 ? Math.round((totalCL / totalSales) * 1000) / 10 : 0,
          avgTicket:
            totalCover > 0
              ? Math.round((totalSales / totalCover) * 100) / 100
              : 0,
          rowCount: records.length,
          topOutlet:
            records.length > 0
              ? {
                  name: records[0].name,
                  total: records[0].total,
                  cover: records[0].cover,
                }
              : null,
          topCaravan:
            records.length > 0
              ? {
                  name: records[0].name,
                  total: records[0].total,
                  cover: records[0].cover,
                }
              : null,
        },
        records,
      };

      setCachedReport(cacheKey, eDate, finalReport);
      return finalReport;
    } catch (err) {
      console.error("[CaravanReportService.getReportData] Error:", err.message);
      throw new Error(`فشل استعلام تقرير القطاع (${secType}): ${err.message}`);
    }
  }
}
