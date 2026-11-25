/**
 * @file services/caravanReportService.js
 * @description Analytical Service & Query Builder for Dream Park Caravan & Outlets (Type = 4).
 * Fully compatible with Microsoft SQL Server 2014 & dbDream_Park_Resturant schema.
 */

import { getPool, sql } from "../config/db.js";

// =========================================================================
// ⚠️ VOIDS VIEW PLACEHOLDER:
// Replace '[dbo].[VOIDS_VIEW]' with your exact view name (or set DB_VOIDS_VIEW in .env)
// Example confirmed view in Dream Park DB: [dbo].[Vw_POS_Post_Void]
// =========================================================================
const VOIDS_SOURCE = "[dbo].[Pos_item_post_void]";

// =========================================================================
// Bounded In-Memory LRU + TTL Cache for Report Queries
// =========================================================================
const REPORT_CACHE = new Map();
const REPORT_CACHE_MAX_ENTRIES = 60;
const HISTORICAL_TTL_MS = 10 * 60 * 1000; // 10 minutes for strictly past ranges (endDate < today)
const LIVE_TTL_MS = 45 * 1000; // 45 seconds when range includes today

// Tiny dimension cache for Branchs.Code by sector type (10 min TTL)
const BRANCH_CODES_CACHE = new Map();
const BRANCH_CODES_TTL_MS = 10 * 60 * 1000;

function getTodayDateString() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function buildReportCacheKey({ sectorType, startDate, endDate, granularity, sortBy, branches }) {
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
  const ttlMs = String(endDate || "") < getTodayDateString() ? HISTORICAL_TTL_MS : LIVE_TTL_MS;
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
  const res = await pool.request().query(`
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

function routeItemToSectorAndGame({ branchCode, branchType, groupCode, itemCode, groupName, itemName }) {
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
   * بالنسبة لقطاعات الألعاب (Type = 2) والفيديو جيم (Type = 3)، يتم استرجاع الألعاب من Pos_item_post
   * @param {number} [sectorType=4]
   * @param {string} [startDate]
   * @param {string} [endDate]
   * @returns {Promise<Array<{Code: string, Name: string}>>}
   */
  static async getCaravanBranches(sectorType = 4, startDate, endDate) {
    const pool = await getPool();
    const request = pool.request();
    const secType = Number(sectorType) || 4;
    request.input("sectorType", sql.Int, secType);

    if (secType === 2 || secType === 3 || secType === 6) {
      const sDate =
        startDate ||
        new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];
      const eDate = endDate || new Date().toISOString().split("T")[0];
      request.input("startDate", sql.Date, sDate);
      request.input("endDate", sql.Date, eDate);

      const goldenBranchUnion = secType === 2 ? `
                    UNION ALL
                    SELECT
                        p.[Branch_Code],
                        p.[type] AS [Branch_Type],
                        p.[Group_code],
                        p.[item_Code],
                        p.[Groupitem_name],
                        p.[item_name]
                    FROM [dbo].[Pos_item_post] p WITH (NOLOCK)
                    WHERE p.[Doc_Date] >= @startDate
                      AND p.[Doc_Date] < DATEADD(DAY, 1, @endDate)
                      AND p.[Branch_Code] = 102
                      AND p.[type] NOT IN (2, 3)
                      AND (p.[Group_code] = 3 OR p.[Groupitem_name] LIKE '%gold%')
                      AND (p.[Void_item] = 0 OR p.[Void_item] IS NULL)` : '';

      const query = `
                WITH FilteredItems AS (
                    SELECT
                        p.[Branch_Code],
                        p.[type] AS [Branch_Type],
                        p.[Group_code],
                        p.[item_Code],
                        p.[Groupitem_name],
                        p.[item_name]
                    FROM [dbo].[Pos_item_post] p WITH (NOLOCK)
                    WHERE p.[Doc_Date] >= @startDate
                      AND p.[Doc_Date] < DATEADD(DAY, 1, @endDate)
                      AND (
                        (p.[type] IN (2, 3) AND p.[Branch_Code] NOT IN (12, 13, 1019, 1020, 1026, 1028))
                        OR (p.[type] = 6 OR p.[Branch_Code] IN (118, 120))
                      )
                      AND (p.[Void_item] = 0 OR p.[Void_item] IS NULL)
                    ${goldenBranchUnion}
                )
                SELECT DISTINCT
                    g.[Game_Code] AS [Code],
                    g.[Game_Name] AS [Name]
                FROM FilteredItems p
                CROSS APPLY (
                    SELECT 
                        -- Target Sector Routing:
                        CASE 
                            WHEN p.[Branch_Type] = 6 OR p.[Branch_Code] IN (118, 120) THEN 6
                            -- Golden (دفتر جولدن / Branch 102 / Group 3) to Sector 2 (Paid Rides):
                            WHEN (p.[Branch_Code] = 102 AND (p.[Group_code] = 3 OR p.[Groupitem_name] LIKE '%gold%')) 
                              OR (p.[Groupitem_name] LIKE '%gold%' AND p.[item_name] LIKE '%جولدن%') THEN 2
                            -- Exclude Zoo (Group 21 / separate promotion) from Type 3:
                            WHEN p.[Group_code] = 21 OR p.[Groupitem_name] LIKE '%zoo%' OR p.[item_name] LIKE '%zoo%' THEN 0
                            -- Funny Slides (شلال المرح / Group 15) to Sector 2 (Paid Rides):
                            WHEN p.[Group_code] = 15 OR p.[Groupitem_name] LIKE '%شلال%' OR p.[item_name] LIKE '%شلال%' THEN 2
                            -- VR 2 (Group 18) to Sector 3 (Video Games & VR):
                            WHEN p.[Group_code] = 18 OR p.[Groupitem_name] LIKE '%vr2%' OR p.[Groupitem_name] LIKE '%vr 2%' THEN 3
                            -- Horse (الخيل / Group 13) to Sector 2 (Paid Rides):
                            WHEN p.[Group_code] = 13 OR p.[Groupitem_name] LIKE '%خيل%' OR p.[item_name] LIKE '%خيل%' THEN 2
                            -- Hammer to Sector 3 (Video Games & VR):
                            WHEN p.[Group_code] = 20 OR p.[item_Code] IN ('74', '80') OR p.[Groupitem_name] LIKE '%hammer%' OR p.[item_name] LIKE '%hammer%' OR p.[item_name] LIKE '%هامر%' THEN 3
                            -- Shooting2 (الرمايه 2) to Sector 3:
                            WHEN p.[Group_code] = 12 OR p.[item_Code] = '40' OR p.[Groupitem_name] LIKE '%رمايه 2%' OR p.[item_name] LIKE '%رمايه 2%' OR p.[Groupitem_name] LIKE '%الرمايه 2%' OR p.[item_name] LIKE '%الرمايه 2%' THEN 3
                            -- Upside Down House (البيت المقلوب) to Sector 3:
                            WHEN p.[Group_code] = 3 OR p.[Groupitem_name] LIKE '%مقلوب%' OR p.[item_name] LIKE '%مقلوب%' THEN 3
                            -- Discovery & Selsela to Sector 2 (Amusement Rides):
                            WHEN p.[Group_code] = 1 OR p.[Groupitem_name] LIKE '%ديسكفر%' OR p.[item_name] LIKE '%ديسكفر%' THEN 2
                            WHEN p.[Groupitem_name] LIKE '%سلسل%' OR p.[item_name] LIKE '%سلسل%' THEN 2
                            -- Explicitly route all Video Games groups to Sector 3 to prevent leaking into Sector 2 from cashiers with Branch_Type = 2:
                            WHEN p.[Group_code] IN (5, 9, 10, 11, 12, 17, 18, 19, 20, 22) THEN 3
                            -- Standard Paid Rides (Type 2 games):
                            WHEN p.[Group_code] IN (2, 4, 6, 7, 8, 14, 16) THEN 2
                            -- Default to Branch Type:
                            ELSE p.[Branch_Type]
                        END AS [Target_Sector],

                        -- Canonical Game Code:
                        CASE 
                            -- Sector 6 OTH columns (strict Group_code / Item_Code mapping + Unicode N'...' patterns, explicit 'unmapped' fallback):
                            WHEN p.[Branch_Type] = 6 OR p.[Branch_Code] IN (118, 120) THEN
                                CASE 
                                    WHEN (p.[Group_code] = 3 AND p.[item_Code] = N'4') OR p.[item_name] LIKE N'%ملاكي%' OR p.[item_name] LIKE N'%تاكس%' THEN 'parking_private'
                                    WHEN (p.[Group_code] = 3 AND p.[item_Code] IN (N'5', N'6', N'7')) OR p.[item_name] LIKE N'%باص%' OR p.[item_name] LIKE N'%اتوبيس%' OR p.[item_name] LIKE N'%ميكروباص%' THEN 'parking_buses'
                                    WHEN (p.[Group_code] = 3 AND p.[item_Code] = N'8') OR p.[item_name] LIKE N'%mask%' OR p.[item_name] LIKE N'%ماسك%' OR p.[item_name] LIKE N'%محمود%' THEN 'mask'
                                    WHEN (p.[Group_code] = 2 AND p.[item_Code] IN (N'2', N'3')) OR p.[item_name] LIKE N'%car %' OR p.[item_name] LIKE N'%g&r%' THEN 'g_and_r'
                                    WHEN (p.[Group_code] = 1 AND p.[item_Code] = N'1') OR p.[item_name] LIKE N'%خازينة%' OR p.[item_name] LIKE N'%خزنة%' OR p.[item_name] LIKE N'%خزنه%' OR p.[item_name] LIKE N'%امان%' OR p.[item_name] LIKE N'%أمان%' OR p.[item_name] LIKE N'%lock%' THEN 'locker'
                                    WHEN p.[item_name] LIKE N'%deposit%' OR p.[item_name] LIKE N'%تأمين%' OR p.[item_name] LIKE N'%تامين%' THEN 'g_deposit'
                                    WHEN p.[item_name] LIKE N'%تليفون%' OR p.[item_name] LIKE N'%telephon%' THEN 'telephon'
                                    WHEN p.[item_name] LIKE N'%net coffee%' OR p.[item_name] LIKE N'%نت كافيه%' THEN 'net_coffee'
                                    ELSE 'unmapped'
                                END
                            -- Golden always Code 'golden'
                            WHEN (p.[Branch_Code] = 102 AND (p.[Group_code] = 3 OR p.[Groupitem_name] LIKE '%gold%')) 
                              OR (p.[Groupitem_name] LIKE '%gold%' AND p.[item_name] LIKE '%جولدن%') THEN 'golden'
                            -- Discovery always Code '1'
                            WHEN p.[Group_code] = 1 OR p.[Groupitem_name] LIKE '%ديسكفر%' THEN '1'
                            -- Selsela always Code '23'
                            WHEN p.[Groupitem_name] LIKE '%سلسل%' OR p.[item_name] LIKE '%سلسل%' THEN '23'
                            -- Movie hall split: Radio is '19', Movie is '18'
                            WHEN p.[Group_code] = 5 AND (p.[item_Code] = '19' OR p.[item_name] LIKE '%روديو%') THEN '19'
                            WHEN p.[Group_code] = 5 THEN '18'
                            -- Hammer always Code '20'
                            WHEN p.[Group_code] = 20 OR p.[item_Code] IN ('74', '80') OR p.[item_name] LIKE '%hammer%' THEN '20'
                            -- Shooting2 always Code '12'
                            WHEN p.[Group_code] = 12 OR p.[item_Code] = '40' OR p.[Groupitem_name] LIKE '%رمايه 2%' OR p.[item_name] LIKE '%رمايه 2%' THEN '12'
                            -- Upside Down House always Code '3'
                            WHEN p.[Group_code] = 3 OR p.[Groupitem_name] LIKE '%مقلوب%' OR p.[item_name] LIKE '%مقلوب%' THEN '3'
                            -- Misplaced Paid Rides moved to Type 2:
                            WHEN p.[Group_code] = 15 OR p.[Groupitem_name] LIKE '%شلال%' THEN '115'
                            WHEN p.[Group_code] = 18 OR p.[Groupitem_name] LIKE '%vr2%' OR p.[Groupitem_name] LIKE '%vr 2%' THEN '118'
                            WHEN p.[Group_code] = 13 OR p.[Groupitem_name] LIKE '%خيل%' THEN '113'
                            -- Standard Rides (Type 2 games): keep Group_code as Code
                            WHEN p.[Group_code] IN (2, 4, 6, 7, 8, 14, 16) THEN CAST(p.[Group_code] AS VARCHAR(50))
                            -- Type 3 Games: Code with 100 + Group_code to prevent collision
                            ELSE CAST(100 + p.[Group_code] AS VARCHAR(50))
                        END AS [Game_Code],

                        -- Canonical Game Name:
                        CASE 
                            -- Sector 6 OTH columns:
                            WHEN p.[Branch_Type] = 6 OR p.[Branch_Code] IN (118, 120) THEN
                                CASE 
                                    WHEN (p.[Group_code] = 3 AND p.[item_Code] = N'4') OR p.[item_name] LIKE N'%ملاكي%' OR p.[item_name] LIKE N'%تاكس%' THEN 'Private'
                                    WHEN (p.[Group_code] = 3 AND p.[item_Code] IN (N'5', N'6', N'7')) OR p.[item_name] LIKE N'%باص%' OR p.[item_name] LIKE N'%اتوبيس%' OR p.[item_name] LIKE N'%ميكروباص%' THEN 'Buses'
                                    WHEN (p.[Group_code] = 3 AND p.[item_Code] = N'8') OR p.[item_name] LIKE N'%mask%' OR p.[item_name] LIKE N'%ماسك%' OR p.[item_name] LIKE N'%محمود%' THEN 'Mask'
                                    WHEN (p.[Group_code] = 2 AND p.[item_Code] IN (N'2', N'3')) OR p.[item_name] LIKE N'%car %' OR p.[item_name] LIKE N'%g&r%' THEN 'G&R'
                                    WHEN (p.[Group_code] = 1 AND p.[item_Code] = N'1') OR p.[item_name] LIKE N'%خازينة%' OR p.[item_name] LIKE N'%خزنة%' OR p.[item_name] LIKE N'%خزنه%' OR p.[item_name] LIKE N'%امان%' OR p.[item_name] LIKE N'%أمان%' OR p.[item_name] LIKE N'%lock%' THEN 'Locker'
                                    WHEN p.[item_name] LIKE N'%deposit%' OR p.[item_name] LIKE N'%تأمين%' OR p.[item_name] LIKE N'%تامين%' THEN 'G.Deposit'
                                    WHEN p.[item_name] LIKE N'%تليفون%' OR p.[item_name] LIKE N'%telephon%' THEN 'Telephon'
                                    WHEN p.[item_name] LIKE N'%net coffee%' OR p.[item_name] LIKE N'%نت كافيه%' THEN 'Net Coffee'
                                    ELSE 'Unmapped'
                                END
                            WHEN (p.[Branch_Code] = 102 AND (p.[Group_code] = 3 OR p.[Groupitem_name] LIKE '%gold%')) 
                              OR (p.[Groupitem_name] LIKE '%gold%' AND p.[item_name] LIKE '%جولدن%') THEN N'الذهبية'
                            WHEN p.[Group_code] = 1 OR p.[Groupitem_name] LIKE '%ديسكفر%' THEN N'الديسكفري'
                            WHEN p.[Groupitem_name] LIKE '%سلسل%' OR p.[item_name] LIKE '%سلسل%' THEN N'السلسلة'
                            WHEN p.[Group_code] = 5 AND (p.[item_Code] = '19' OR p.[item_name] LIKE '%روديو%') THEN N'الروديو'
                            WHEN p.[Group_code] = 5 THEN N'الموفى'
                            WHEN p.[Group_code] = 20 OR p.[item_Code] IN ('74', '80') OR p.[item_name] LIKE '%hammer%' THEN N'الهامر'
                            WHEN p.[Group_code] = 12 OR p.[item_Code] = '40' OR p.[Groupitem_name] LIKE '%رمايه 2%' OR p.[item_name] LIKE '%رمايه 2%' THEN N'شوتينج 2'
                            WHEN p.[Group_code] = 3 OR p.[Groupitem_name] LIKE '%مقلوب%' OR p.[item_name] LIKE '%مقلوب%' THEN N'البيت المقلوب'
                            WHEN p.[Group_code] = 15 OR p.[Groupitem_name] LIKE '%شلال%' THEN N'شلال المرح'
                            WHEN p.[Group_code] = 18 OR p.[Groupitem_name] LIKE '%vr2%' OR p.[Groupitem_name] LIKE '%vr 2%' THEN N'VR 2'
                            WHEN p.[Group_code] = 13 OR p.[Groupitem_name] LIKE '%خيل%' THEN N'الخيل'
                            WHEN p.[Group_code] = 19 THEN N'دوبي كاسل'
                            WHEN p.[Group_code] = 9 THEN N'بابلوني'
                            WHEN p.[Group_code] = 11 THEN N'شوتينج'
                            WHEN p.[Group_code] = 22 THEN N'VR3'
                            WHEN p.[Group_code] = 10 THEN N'ألعاب الأطفال'
                            WHEN p.[Group_code] = 17 THEN N'VR 1'
                            ELSE p.[Groupitem_name]
                        END AS [Game_Name]
                ) g
                WHERE g.[Target_Sector] = @sectorType
                ORDER BY [Name] ASC
                OPTION (HASH JOIN);
            `;
      const result = await request.query(query);
      return result.recordset || [];
    }

    const query = `
            SELECT 
                [Code], 
                [Aname] AS [Name]
            FROM [dbo].[Branchs] WITH (NOLOCK)
            WHERE [Type] = @sectorType
              AND [Code] NOT IN (12, 13, 1019, 1020, 1026, 1028)
            ORDER BY [Aname] ASC;
        `;
    const result = await request.query(query);
    return result.recordset || [];
  }

  /**
   * تقرير تحليلي على مستوى الأصناف/الألعاب الفردية لقطاعي الألعاب (Type = 2) والفيديو جيم (Type = 3)
   */
  static async getItemLevelReportData({
    startDate = "2026-01-01",
    endDate = new Date().toISOString().split("T")[0],
    branches = [],
    granularity = "summary",
    sortBy = "total_desc",
    sectorType = 3,
  }) {
    const pool = await getPool();
    const secType = Number(sectorType) || 3;
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

    // Resolve Branch_Code -> type map from cached 50-row dimension table (avoids 5-table SQL join plan regression)
    const branchTypeMap = await getBranchTypeMap(pool);
    const EXCLUDED_BRANCHES = new Set([12, 13, 1019, 1020, 1026, 1028]);
    const targetBranchCodes = [];
    if (secType === 6) {
      const s = new Set([118, 120]);
      for (const [code, t] of branchTypeMap.entries()) {
        if (t === 6) s.add(code);
      }
      targetBranchCodes.push(...[...s].sort((a, b) => a - b));
    } else {
      for (const [code, t] of branchTypeMap.entries()) {
        if ((t === 2 || t === 3) && !EXCLUDED_BRANCHES.has(code)) {
          targetBranchCodes.push(code);
        }
      }
      targetBranchCodes.sort((a, b) => a - b);
    }
    const branchCodeInList = targetBranchCodes.length > 0 ? targetBranchCodes.join(", ") : "-1";

    // Query A: Main POS_Sub_post + POS_Post + items + Groupitem (NO UNION ALL, NO Branchs join -> ~0.2s–1.3s via LOOP JOIN)
    const mainReq = pool.request();
    mainReq.input("startDate", sql.Date, startDate);
    mainReq.input("endDate", sql.Date, endDate);
    const mainPosQuery = `
      SELECT
        ${periodExprSp} AS [Period],
        sp.[Branch_Code],
        it.[Group_code],
        sp.[item_Code],
        gi.[name_a] AS [Groupitem_name],
        sp.[item_name],
        SUM(CAST(sp.[Item_Qunt] AS INT)) AS [Cover],
        CAST(SUM(sp.[Item_Qunt] * sp.[Item_Price] * (1.0 + ISNULL(sp.[item_Sels_Tax_P], 0) / 100.0)) AS DECIMAL(38, 10)) AS [Total],
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
        AND sp.[Doc_Date] < DATEADD(DAY, 1, @endDate)
        AND pp.[Doc_Date] >= @startDate
        AND pp.[Doc_Date] < DATEADD(DAY, 1, @endDate)
        AND sp.[Branch_Code] IN (${branchCodeInList})
        AND pp.[Branch_Code] IN (${branchCodeInList})
        AND ISNULL(sp.[Void_item], 0) = 0
        AND pp.[Officer] = 0
      GROUP BY ${groupByPeriodSp}sp.[Branch_Code], it.[Group_code], sp.[item_Code], gi.[name_a], sp.[item_name]
      OPTION (LOOP JOIN, RECOMPILE);
    `;

    // Query B: receipts_Details + receipts_Master (tiny table, ~35ms, guarantees 100% parity with Pos_item_post view)
    const receiptsBranches = secType === 2 ? `${branchCodeInList}, 102` : branchCodeInList;
    const recReq = pool.request();
    recReq.input("startDate", sql.Date, startDate);
    recReq.input("endDate", sql.Date, endDate);
    const receiptsQuery = `
      SELECT
        ${periodExprRm} AS [Period],
        rd.[Branch_Code],
        gi.[code] AS [Group_code],
        rd.[Item_Code] AS [item_Code],
        gi.[name_a] AS [Groupitem_name],
        it.[name_a] AS [item_name],
        SUM(CAST(rd.[Item_Qunt] AS INT)) AS [Cover],
        CAST(SUM(rd.[Item_Qunt] * (rd.[Item_Price] / ((it.[Sels_Tax] / 100) + 1)) * (1.0 + ISNULL(it.[Sels_Tax], 0) / 100.0)) AS DECIMAL(38, 10)) AS [Total],
        CAST(SUM(ISNULL(rd.[Item_Qunt], 0) * (rd.[Item_Price] / ((it.[Sels_Tax] / 100) + 1))) AS DECIMAL(38, 10)) AS [NetAmount],
        CAST(SUM(ISNULL(rd.[Item_Price] * (it.[Sels_Tax] / 100), 0)) AS DECIMAL(38, 10)) AS [TaxAmount],
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
        AND rm.[Doc_Date] < DATEADD(DAY, 1, @endDate)
        AND rd.[Branch_Code] IN (${receiptsBranches})
        AND rm.[Branch_Code] IN (${receiptsBranches})
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

    // Query C (Type 2 only): Golden (Branch 102, Group 3 / gold) (~85ms)
    if (secType === 2) {
      const goldReq = pool.request();
      goldReq.input("startDate", sql.Date, startDate);
      goldReq.input("endDate", sql.Date, endDate);
      const goldenQuery = `
        SELECT
          ${periodExprSp} AS [Period],
          sp.[Branch_Code],
          it.[Group_code],
          sp.[item_Code],
          gi.[name_a] AS [Groupitem_name],
          sp.[item_name],
          SUM(CAST(sp.[Item_Qunt] AS INT)) AS [Cover],
          CAST(SUM(sp.[Item_Qunt] * sp.[Item_Price] * (1.0 + ISNULL(sp.[item_Sels_Tax_P], 0) / 100.0)) AS DECIMAL(38, 10)) AS [Total],
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
          AND sp.[Doc_Date] < DATEADD(DAY, 1, @endDate)
          AND pp.[Doc_Date] >= @startDate
          AND pp.[Doc_Date] < DATEADD(DAY, 1, @endDate)
          AND sp.[Branch_Code] = 102
          AND pp.[Branch_Code] = 102
          AND (it.[Group_code] = 3 OR gi.[name_a] LIKE '%gold%')
          AND ISNULL(sp.[Void_item], 0) = 0
          AND pp.[Officer] = 0
        GROUP BY ${groupByPeriodSp}sp.[Branch_Code], it.[Group_code], sp.[item_Code], gi.[name_a], sp.[item_name]
        OPTION (HASH JOIN, RECOMPILE);
      `;
      parallelPromises.push(goldReq.query(goldenQuery));
    }

    // Queries D & E (Type 6 only): Real POS_Post payments & direct POS_Sub_post voids (~45ms each, no slow view!)
    if (secType === 6) {
      const postSelectPeriod = isSummaryGran
        ? "NULL"
        : normGranularity === "month"
          ? "CONVERT(VARCHAR(7), p.[Doc_Date], 120)"
          : "CONVERT(VARCHAR(10), p.[Doc_Date], 120)";
      const postGroupBy = isSummaryGran ? "" : `GROUP BY ${postSelectPeriod}`;

      const postReq = pool.request();
      postReq.input("startDate", sql.Date, startDate);
      postReq.input("endDate", sql.Date, endDate);
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
          AND p.[Doc_Date] < DATEADD(DAY, 1, @endDate)
          AND (p.[Void] = 0 OR p.[Void] IS NULL)
          AND p.[Branch_Code] IN (${branchCodeInList})
        ${postGroupBy}
        OPTION (RECOMPILE);
      `;

      const voidReq = pool.request();
      voidReq.input("startDate", sql.Date, startDate);
      voidReq.input("endDate", sql.Date, endDate);
      const type6VoidQuery = `
        SELECT
          COUNT(*) AS [VoidCount],
          CAST(ROUND(SUM(CAST(ISNULL(sp.[Item_Qunt] * sp.[Item_Price] * (1.0 + ISNULL(sp.[item_Sels_Tax_P], 0) / 100.0 + ISNULL(sp.[item_Serves_Tax_P], 0) / 100.0), 0) AS DECIMAL(18, 4))), 2) AS DECIMAL(18, 2)) AS [TotalVoids]
        FROM [dbo].[POS_Sub_post] sp WITH (NOLOCK)
        INNER JOIN [dbo].[POS_Post] pp WITH (NOLOCK)
          ON sp.[Doc_NO] = pp.[Doc_NO]
          AND sp.[ID_Pos] = pp.[id_pos]
          AND sp.[Branch_Code] = pp.[Branch_Code]
          AND sp.[Doc_Date] = pp.[Doc_Date]
        WHERE sp.[Doc_Date] >= @startDate
          AND sp.[Doc_Date] < DATEADD(DAY, 1, @endDate)
          AND pp.[Doc_Date] >= @startDate
          AND pp.[Doc_Date] < DATEADD(DAY, 1, @endDate)
          AND sp.[Branch_Code] IN (${branchCodeInList})
          AND pp.[Branch_Code] IN (${branchCodeInList})
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

    // Aggregate & route all raw rows in O(N) in Node.js (exact 100% parity with SQL CROSS APPLY)
    const groupedMap = new Map();
    const allRawRows = [...mainRows, ...recRows, ...extraRows];
    for (const row of allRawRows) {
      const bCode = Number(row.Branch_Code);
      const bType = branchTypeMap.get(bCode) ?? secType;
      // For receipts from Branch 102 on secType === 2, ensure only Group 3 / gold passes (matches goldenItemsUnion)
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
      const itemTot = secType === 6 ? Math.round((Number(item.Total) || 0) * 100) / 100 : (Number(item.Total) || 0);
      const itemCl = secType === 6 ? Math.round((Number(item.CL) || 0) * 100) / 100 : (Number(item.CL) || 0);
      const itemCash = secType === 6 ? Math.round((itemTot - itemCl) * 100) / 100 : (itemTot - itemCl);
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
        existing.cash = secType === 6 ? Math.round((existing.cash + itemCash) * 100) / 100 : (existing.cash + itemCash);
        existing.cl = secType === 6 ? Math.round((existing.cl + itemCl) * 100) / 100 : (existing.cl + itemCl);
        existing.total = secType === 6 ? Math.round((existing.total + itemTot) * 100) / 100 : (existing.total + itemTot);
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
      const itemTotal = secType === 6 ? Math.round((Number(r.Total) || 0) * 100) / 100 : (Number(r.Total) || 0);
      const itemCover = Number(r.Cover) || 0;
      const itemNetRev =
        secType === 6 && r.NetAmount !== undefined
          ? Math.round((Number(r.NetAmount) || 0) * 100) / 100
          : Math.round((itemTotal / 1.14) * 100) / 100;
      const itemTax =
        secType === 6 && r.TaxAmount !== undefined
          ? Math.round((Number(r.TaxAmount) || 0) * 100) / 100
          : Math.round((itemTotal - itemNetRev) * 100) / 100;
      const itemCl = secType === 6 ? Math.round((Number(r.CL) || 0) * 100) / 100 : (Number(r.CL) || 0);
      const itemCash = secType === 6 ? Math.round((itemTotal - itemCl) * 100) / 100 : (itemTotal - itemCl);

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
        ...(secType === 1
          ? (() => {
              const rFood = Math.round((Number(r.Food) || 0) * 100) / 100;
              const rBev = Math.round((Number(r.Beverage) || 0) * 100) / 100;
              const rOther = Math.round((itemTotal - rFood - rBev) * 100) / 100;
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

    return {
      executionTimeMs: duration,
      filters: {
        startDate,
        endDate,
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
  }

  /**
   * استعلام وتجميع بيانات إيرادات القطاع المالي مع دعم التصفية الزمنية وتعدد المنافذ والتجميع الديناميكي
   * @param {Object} params
   * @param {string} params.startDate 'YYYY-MM-DD'
   * @param {string} params.endDate 'YYYY-MM-DD'
   * @param {string[]} [params.branches] قائمة أكواد الفروع
   * @param {('summary'|'month'|'day')} [params.granularity] مستوى التجميع
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
  }) {
    const secType = Number(sectorType) || 4;
    const cacheKey = buildReportCacheKey({
      sectorType: secType,
      startDate,
      endDate,
      granularity,
      sortBy,
      branches,
    });

    if (!bypassCache) {
      const cached = getCachedReport(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // قطاعات الألعاب (Type = 2) والفيديو جيم (Type = 3) والأمانات والانتظار (Type = 6): تجميع على مستوى الأصناف
    if (secType === 2 || secType === 3 || secType === 6) {
      const itemResult = await this.getItemLevelReportData({
        startDate,
        endDate,
        branches,
        granularity,
        sortBy,
        sectorType: secType,
      });
      setCachedReport(cacheKey, endDate, itemResult);
      return itemResult;
    }

    const pool = await getPool();
    const request = pool.request();

    // 1. تثبيت بارامترات التواريخ والقطاع الآمنة (SARGable DATE parameters)
    request.input("startDate", sql.Date, startDate);
    request.input("endDate", sql.Date, endDate);
    request.input("sectorType", sql.Int, secType);

    // 2. معالجة تصفية المنافذ المختارة
    const validBranchCodes = Array.isArray(branches)
      ? branches.map((code) => Number(String(code).trim())).filter((n) => Number.isFinite(n))
      : [];

    let branchClause = '';
    if (validBranchCodes.length > 0) {
      const placeholders = validBranchCodes.map((code, index) => {
        const paramName = `branch_${index}`;
        request.input(paramName, sql.Int, code);
        return `@${paramName}`;
      });
      branchClause = ` AND b.[Code] IN (${placeholders.join(', ')})`;
    }

    // 3. تحديد ترتيب النتائج
    let orderClause = "s.[Total] DESC";
    if (sortBy === "total_asc") orderClause = "s.[Total] ASC";
    else if (sortBy === "cover_desc")
      orderClause = "s.[Cover] DESC, s.[Total] DESC";
    else if (sortBy === "name_asc") orderClause = "s.[Name] ASC";

    // 4. بناء الحقول وفق مستوى التجميع (Granularity)
    // Separate POS_Post (sales) and Pos_item_post_void (voids) into independent parallel queries
    // so SQL Server 2014 can NEVER inline a voids CTE into a 58s nested loop on 'month' granularity.
    let selectSalesPeriod = '';
    let groupBySalesPeriod = '';
    let selectVoidsPeriod = '';
    let groupByVoidsPeriod = '';
    let selectItemPeriod = '';
    let groupByItemPeriod = '';
    let joinItemPeriod = '';
    let outerSelectPeriod = '';
    let orderByGranularity = '';

    if (granularity === 'month') {
      selectSalesPeriod = `YEAR(p.[Doc_Date]) AS [PeriodYear], MONTH(p.[Doc_Date]) AS [PeriodMonth],`;
      groupBySalesPeriod = `, YEAR(p.[Doc_Date]), MONTH(p.[Doc_Date])`;
      selectVoidsPeriod = `CONVERT(VARCHAR(7), v.[Doc_Date], 120) AS [Period],`;
      groupByVoidsPeriod = `, CONVERT(VARCHAR(7), v.[Doc_Date], 120)`;
      selectItemPeriod = `YEAR(sp.[Doc_Date]) AS [PeriodYear], MONTH(sp.[Doc_Date]) AS [PeriodMonth],`;
      groupByItemPeriod = `, YEAR(sp.[Doc_Date]), MONTH(sp.[Doc_Date])`;
      joinItemPeriod = `AND i.[PeriodYear] = s.[PeriodYear] AND i.[PeriodMonth] = s.[PeriodMonth]`;
      outerSelectPeriod = `CAST(s.[PeriodYear] AS VARCHAR(4)) + '-' + RIGHT('0' + CAST(s.[PeriodMonth] AS VARCHAR(2)), 2) AS [Period],`;
      orderByGranularity = `s.[PeriodYear] ASC, s.[PeriodMonth] ASC, `;
    } else if (granularity === 'day') {
      selectSalesPeriod = `p.[Doc_Date] AS [PeriodDate],`;
      groupBySalesPeriod = `, p.[Doc_Date]`;
      selectVoidsPeriod = `CONVERT(VARCHAR(10), v.[Doc_Date], 120) AS [Period],`;
      groupByVoidsPeriod = `, CONVERT(VARCHAR(10), v.[Doc_Date], 120)`;
      selectItemPeriod = `sp.[Doc_Date] AS [PeriodDate],`;
      groupByItemPeriod = `, sp.[Doc_Date]`;
      joinItemPeriod = `AND i.[PeriodDate] = s.[PeriodDate]`;
      outerSelectPeriod = `CONVERT(VARCHAR(10), s.[PeriodDate], 120) AS [Period],`;
      orderByGranularity = `s.[PeriodDate] ASC, `;
    }

    const fbCTE = secType === 1 ? `
            ,
            ItemAgg AS (
                SELECT 
                    sp.[Branch_Code],
                    ${selectItemPeriod}
                    CAST(SUM(CASE WHEN g.[CategoryType] = 1 THEN sp.[Item_Qunt] * sp.[Item_Price] + ISNULL(sp.[item_Sels_Tax], 0) + ISNULL(sp.[item_Serves_Tax], 0) ELSE 0 END) AS DECIMAL(18, 4)) AS [Food],
                    CAST(SUM(CASE WHEN g.[CategoryType] = 2 THEN sp.[Item_Qunt] * sp.[Item_Price] + ISNULL(sp.[item_Sels_Tax], 0) + ISNULL(sp.[item_Serves_Tax], 0) ELSE 0 END) AS DECIMAL(18, 4)) AS [Beverage],
                    CAST(SUM(CASE WHEN ISNULL(g.[CategoryType], 0) NOT IN (1, 2) THEN sp.[Item_Qunt] * sp.[Item_Price] + ISNULL(sp.[item_Sels_Tax], 0) + ISNULL(sp.[item_Serves_Tax], 0) ELSE 0 END) AS DECIMAL(18, 4)) AS [Other],
                    CAST(SUM(sp.[Item_Qunt] * ISNULL(it.[itemcost], 0)) AS DECIMAL(18, 4)) AS [Cost]
                FROM [dbo].[POS_Sub_post] sp WITH (NOLOCK)
                INNER JOIN TargetBranches tb ON tb.[Code] = sp.[Branch_Code]
                LEFT JOIN [dbo].[items] it WITH (NOLOCK) ON it.[code] = sp.[item_Code] AND it.[BranchCode] = sp.[Branch_Code]
                LEFT JOIN [dbo].[Groupitem] g WITH (NOLOCK) ON g.[code] = it.[Group_code] AND g.[Branch_Code] = it.[BranchCode]
                WHERE sp.[Doc_Date] >= @startDate AND sp.[Doc_Date] < DATEADD(DAY, 1, @endDate)
                  AND (sp.[Void_item] = 0 OR sp.[Void_item] IS NULL)
                GROUP BY sp.[Branch_Code] ${groupByItemPeriod}
            )` : '';

    const fbJoin = secType === 1 ? `
            LEFT JOIN ItemAgg i ON i.[Branch_Code] = s.[Branch_Code] ${joinItemPeriod}
        ` : '';

    const fbCols = secType === 1 ? `
            ISNULL(i.[Food], 0) AS [Food],
            ISNULL(i.[Beverage], 0) AS [Beverage],
            ISNULL(i.[Other], 0) AS [Other],
            ISNULL(i.[Cost], 0) AS [Cost],
        ` : '';

    const query = `
            WITH TargetBranches AS (
                SELECT [Code], [Aname]
                FROM [dbo].[Branchs] b WITH (NOLOCK)
                WHERE b.[Type] = @sectorType
                  AND b.[Code] NOT IN (12, 13, 1019, 1020, 1026, 1028)
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
                  AND p.[Doc_Date] < DATEADD(DAY, 1, @endDate)
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
            OPTION (HASH JOIN);
        `;

    // Independent single-scan Voids Aggregation Query (runs in parallel with SalesAgg)
    const voidsAggReq = pool.request();
    voidsAggReq.input('startDate', sql.Date, startDate);
    voidsAggReq.input('endDate', sql.Date, endDate);
    voidsAggReq.input('sectorType', sql.Int, secType);
    if (validBranchCodes.length > 0) {
      validBranchCodes.forEach((code, index) => {
        voidsAggReq.input(`vbranch_${index}`, sql.Int, code);
      });
    }
    const voidsAggBranchClause = validBranchCodes.length > 0
      ? ` AND v.[Branch_Code] IN (${validBranchCodes.map((_, i) => `@vbranch_${i}`).join(', ')})`
      : '';

    const voidsAggQuery = `
            SELECT 
                v.[Branch_Code],
                ${selectVoidsPeriod}
                SUM(CAST(ISNULL(v.[Item_Qunt] * v.[Item_Price] * (1.0 + ISNULL(v.[item_Sels_Tax_P], 0) / 100.0 + ISNULL(v.[item_Serves_Tax_P], 0) / 100.0), 0) AS DECIMAL(18, 4))) AS [TotalVoids],
                COUNT(*) AS [VoidCount]
            FROM [dbo].[Pos_item_post_void] v WITH (NOLOCK)
            INNER JOIN [dbo].[Branchs] b WITH (NOLOCK) ON b.[Code] = v.[Branch_Code]
            WHERE b.[Type] = @sectorType
              AND b.[Code] NOT IN (12, 13, 1019, 1020, 1026, 1028)
              AND v.[Doc_Date] >= @startDate
              AND v.[Doc_Date] < DATEADD(DAY, 1, @endDate)
              ${voidsAggBranchClause}
            GROUP BY v.[Branch_Code] ${groupByVoidsPeriod};
        `;

    // Prepare Void Details Query for Expandable Sub-Tables
    const detailsReq = pool.request();
    detailsReq.input('startDate', sql.Date, startDate);
    detailsReq.input('endDate', sql.Date, endDate);
    detailsReq.input('sectorType', sql.Int, secType);
    if (validBranchCodes.length > 0) {
      validBranchCodes.forEach((code, index) => {
        detailsReq.input(`dbranch_${index}`, sql.Int, code);
      });
    }
    const detailsBranchClause = validBranchCodes.length > 0
      ? ` AND v.[Branch_Code] IN (${validBranchCodes.map((_, i) => `@dbranch_${i}`).join(', ')})`
      : '';

    const voidDetailsQuery = `
            SELECT 
                v.[Branch_Code] AS [branchCode],
                ${granularity === "month" ? "CONVERT(VARCHAR(7), v.[Doc_Date], 120) AS [period]," : granularity === "day" ? "CONVERT(VARCHAR(10), v.[Doc_Date], 120) AS [period]," : ""}
                v.[item_Code] AS [itemCode],
                ISNULL(v.[item_name], v.[items_name]) AS [itemName],
                CONVERT(VARCHAR(10), v.[Doc_Date], 120) AS [docDate],
                CONVERT(VARCHAR(8), ISNULL(v.[Inv_Time], v.[item_time]), 108) AS [docTime],
                ISNULL(v.[Item_Qunt], 1) AS [quantity],
                ROUND(v.[Item_Price] * (1.0 + ISNULL(v.[item_Sels_Tax_P], 0) / 100.0 + ISNULL(v.[item_Serves_Tax_P], 0) / 100.0), 2) AS [price],
                ROUND(v.[Item_Qunt] * v.[Item_Price] * (1.0 + ISNULL(v.[item_Sels_Tax_P], 0) / 100.0 + ISNULL(v.[item_Serves_Tax_P], 0) / 100.0), 2) AS [total]
            FROM [dbo].[Pos_item_post_void] v WITH (NOLOCK)
            INNER JOIN [dbo].[Branchs] b WITH (NOLOCK) ON b.[Code] = v.[Branch_Code]
            WHERE b.[Type] = @sectorType
              AND b.[Code] NOT IN (12, 13, 1019, 1020, 1026, 1028)
              AND v.[Doc_Date] >= @startDate
              AND v.[Doc_Date] < DATEADD(DAY, 1, @endDate)
              ${detailsBranchClause}
            ORDER BY v.[Doc_Date] DESC, v.[Inv_Time] DESC;
        `;

    let rawRecords = [];
    let rawVoidDetails = [];
    let duration = 0;
    try {
      const startTime = Date.now();
      const [result, voidsAggResult, detailsResult] = await Promise.all([
        request.query(query),
        voidsAggReq.query(voidsAggQuery).catch(err => {
          console.warn('[CaravanReportService] Voids agg query failed:', err.message);
          return { recordset: [] };
        }),
        detailsReq.query(voidDetailsQuery).catch(err => {
          console.warn('[CaravanReportService] Void details query failed:', err.message);
          return { recordset: [] };
        })
      ]);
      duration = Date.now() - startTime;

      // Merge single-scan VoidsAgg into SalesAgg in O(N)
      const voidsAggMap = new Map();
      for (const va of (voidsAggResult.recordset || [])) {
        const key = granularity !== 'summary' ? `${va.Branch_Code}-${va.Period}` : String(va.Branch_Code);
        voidsAggMap.set(key, {
          TotalVoids: Number(va.TotalVoids) || 0,
          VoidCount: Number(va.VoidCount) || 0,
        });
      }

      rawRecords = (result.recordset || [])
        .filter(r => Math.abs(Number(r.Total) || 0) > 0.0001)
        .map(r => {
          const key = granularity !== 'summary' ? `${r.Branch_Code}-${r.Period}` : String(r.Branch_Code);
          const va = voidsAggMap.get(key);
          return {
            ...r,
            TotalVoids: va ? va.TotalVoids : 0,
            VoidCount: va ? va.VoidCount : 0,
          };
        });
      rawVoidDetails = detailsResult.recordset || [];
    } catch (queryErr) {
      throw queryErr;
    }

    // Map void details by branch (and period if present)
    const voidMap = new Map();
    for (const vd of rawVoidDetails) {
      const key =
        granularity !== "summary"
          ? `${vd.branchCode}-${vd.period}`
          : String(vd.branchCode);
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

      const rowKey =
        granularity !== "summary"
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
        grandTotal: secType === 1 ? Math.round(itemTotal * 100) / 100 : itemTotal,
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
        startDate,
        endDate,
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

    setCachedReport(cacheKey, endDate, finalReport);
    return finalReport;
  }
}
