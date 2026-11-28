/**
 * دور الملف: منطق توجيه وتصنيف القطاعات الستة وبنود Type 6 (الملاكي، الباصات، الماسك، الأمانات، G&R) مع كاش خريطة الفروع.
 * المدخلات: بيانات الصنف/المجموعة/الفرع ومجمع الاتصال (pool).
 * المخرجات: القطاع المستهدف والكود والاسم المعياري (targetSector, gameCode, gameName) وخريطة أنواع الفروع.
 */

import { createRequest } from "../db/sqlPool.js";

export const EXCLUDED_NON_REVENUE_BRANCHES = [12, 13, 14, 1019, 1020, 1026, 1028];
export const EXCLUDED_BRANCHES_SET = new Set(EXCLUDED_NON_REVENUE_BRANCHES);

const BRANCH_MAP_TTL_MS = 10 * 60 * 1000;
let branchTypeMapCache = null;

export async function getBranchTypeMap(pool) {
  if (branchTypeMapCache && Date.now() < branchTypeMapCache.expiresAt) {
    return branchTypeMapCache.map;
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
  branchTypeMapCache = { map, expiresAt: Date.now() + BRANCH_MAP_TTL_MS };
  return map;
}

export function resolveItemLevelBranchCodes(branchTypeMap, secType) {
  const codes = [];
  if (secType === 6) {
    const s = new Set([118, 120]);
    for (const [code, t] of branchTypeMap.entries()) {
      if (t === 6) s.add(code);
    }
    codes.push(...[...s].sort((a, b) => a - b));
  } else {
    for (const [code, t] of branchTypeMap.entries()) {
      if ((t === 2 || t === 3) && !EXCLUDED_BRANCHES_SET.has(code)) {
        codes.push(code);
      }
    }
    codes.sort((a, b) => a - b);
  }
  return codes;
}

export function routeItemToSectorAndGame({
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
  const iNormAr = iName.replace(/[أإآ]/g, "ا").replace(/ة/g, "ه");

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
    if ((gCode === 3 && iCode === "4") || iNormAr.includes("ملاكي") || iNormAr.includes("تاكس")) {
      gameCode = "parking_private";
      gameName = "Private";
    } else if (
      (gCode === 3 && (iCode === "5" || iCode === "6" || iCode === "7")) ||
      iNormAr.includes("باص") ||
      iNormAr.includes("اتوبيس") ||
      iNormAr.includes("ميكروباص")
    ) {
      gameCode = "parking_buses";
      gameName = "Buses";
    } else if (
      (gCode === 3 && iCode === "8") ||
      iLow.includes("mask") ||
      iNormAr.includes("ماسك") ||
      iNormAr.includes("محمود")
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
      iNormAr.includes("امان") ||
      iNormAr.includes("خزنه") ||
      iNormAr.includes("خازين") ||
      iName.includes("لوكر") ||
      iLow.includes("lock")
    ) {
      gameCode = "locker";
      gameName = "Locker";
    } else if (iLow.includes("deposit") || iNormAr.includes("تامين")) {
      gameCode = "g_deposit";
      gameName = "G.Deposit";
    } else if (iNormAr.includes("تليفون") || iLow.includes("telephon")) {
      gameCode = "telephon";
      gameName = "Telephon";
    } else if (iLow.includes("net coffee") || iNormAr.includes("نت كافيه")) {
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
  } else if (gCode === 12 || iCode === "40" || gName.includes("رمايه 2") || iName.includes("رمايه 2")) {
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

export const GAME_SECTOR_OVERRIDES = {
  20: 3, 74: 3, 80: 3, hammer: 3, hammer20: 3, الهامر: 3, هامر: 3,
  12: 3, 40: 3, "الرمايه 2": 3, "رمايه 2": 3, shooting2: 3,
  3: 3, 21: 3, 22: 3, 151: 3, "البيت المقلوب": 3, "upside down house": 3,
  15: 2, 115: 2, "شلال المرح": 2, "funny slides": 2,
  118: 3, vr2: 3, "vr 2": 3,
  13: 2, 113: 2, الخيل: 2, horse: 2,
  1: 2, ديسكفري: 2, الديسكفري: 2, discovery: 2,
  23: 2, سلسلة: 2, السلسلة: 2, chains: 2,
};
