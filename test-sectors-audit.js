/**
 * @file test-sectors-audit.js
 * @description سكريبت تدقيق شامل لجميع القطاعات التشغيلية الستة (Types 1–6) + بنود Type 6
 * يتحقق من تطابق مخرجات CaravanReportService مع الجداول الأساسية بنسبة 1.00x (صفر تضاعف).
 * Usage: node test-sectors-audit.js [YYYY-MM-DD]
 */

import "dotenv/config";
import { getPool, sql } from "./config/db.js";
import { CaravanReportService } from "./services/caravanReportService.js";

const TARGET_DATE = process.argv[2] || "2026-11-01";
const [y, m, d] = TARGET_DATE.split("-").map(Number);
const nextDt = new Date(Date.UTC(y, m - 1, d + 1));
const NEXT_DATE = `${nextDt.getUTCFullYear()}-${String(nextDt.getUTCMonth() + 1).padStart(2, "0")}-${String(nextDt.getUTCDate()).padStart(2, "0")}`;

const SECTORS = [
  { type: 1, name: "المطاعم (Type 1)" },
  { type: 2, name: "الألعاب الكبرى (Type 2)" },
  { type: 3, name: "الفيديو جيم (Type 3)" },
  { type: 4, name: "الكرافانات والمحلات (Type 4)" },
  { type: 5, name: "البوابات والتذاكر (Type 5)" },
  { type: 6, name: "الانتظار والأمانات (Type 6)" },
];

const TYPE6_ITEMS = [
  { code: "parking_private", label: "الملاكي (Private)", sqlCond: "it.[Group_code] = 3 AND sp.[item_Code] = N'4'" },
  { code: "parking_buses", label: "الباصات (Buses)", sqlCond: "it.[Group_code] = 3 AND sp.[item_Code] IN (N'5', N'6', N'7')" },
  { code: "mask", label: "الماسك (Mask)", sqlCond: "it.[Group_code] = 3 AND sp.[item_Code] = N'8'" },
  { code: "locker", label: "الأمانات (Locker)", sqlCond: "it.[Group_code] = 1 AND sp.[item_Code] = N'1'" },
  { code: "g_and_r", label: "G&R", sqlCond: "it.[Group_code] = 2 AND sp.[item_Code] IN (N'2', N'3')" },
];

function fmt(n) {
  return Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

async function getRawDbTotal(pool, secType) {
  const req = pool.request();
  req.input("s", sql.Date, TARGET_DATE);
  req.input("e", sql.Date, NEXT_DATE);

  if (secType === 1 || secType === 4) {
    req.input("t", sql.Int, secType);
    const res = await req.query(`
      SELECT CAST(ROUND(SUM(CAST(ISNULL(p.[Cash],0)+ISNULL(p.[Visa],0)+ISNULL(p.[Visa2],0)+ISNULL(p.[Visa3],0)+ISNULL(p.[C/L],0) AS DECIMAL(18,4))), 2) AS DECIMAL(18,2)) AS [Total]
      FROM [dbo].[POS_Post] p WITH (NOLOCK)
      INNER JOIN [dbo].[Branchs] b WITH (NOLOCK) ON b.[Code] = p.[Branch_Code]
      WHERE b.[Type] = @t
        AND b.[Code] NOT IN (12, 13, 14, 1019, 1020, 1026, 1028)
        AND p.[Doc_Date] >= @s AND p.[Doc_Date] < @e
        AND (p.[Void] = 0 OR p.[Void] IS NULL);
    `);
    return Number(res.recordset[0]?.Total) || 0;
  }

  if (secType === 5) {
    // Direct POS_Sub_post on Gates branches (101–104), excluding Golden Booklet (Branch 102) & W 230 commission (10 EGP/ticket)
    const res = await req.query(`
      SELECT CAST(ROUND(SUM(
        CASE
          WHEN s.[Branch_Code] = 102 AND (LOWER(ISNULL(s.[item_name], N'')) LIKE N'%دفتر%' OR LOWER(ISNULL(s.[item_name], N'')) LIKE N'%booklet%') THEN 0
          ELSE (ISNULL(s.[Item_Qunt], 0) * ISNULL(s.[Item_Price], 0) * (1.0 + ISNULL(s.[item_Sels_Tax_P], 0) / 100.0))
             - CASE
                 WHEN s.[Branch_Code] = 104
                  AND LOWER(ISNULL(s.[item_name], N'')) LIKE N'%w 230%'
                  AND (LOWER(ISNULL(s.[item_name], N'')) LIKE N'%entrance%' OR (LOWER(ISNULL(s.[item_name], N'')) NOT LIKE N'%theater%' AND LOWER(ISNULL(s.[item_name], N'')) NOT LIKE N'%taftaf%'))
                 THEN ISNULL(s.[Item_Qunt], 0) * 10
                 ELSE 0
               END
        END
      ), 2) AS DECIMAL(18,2)) AS [Total]
      FROM [dbo].[POS_Sub_post] s WITH (NOLOCK)
      WHERE s.[Branch_Code] IN (101, 102, 103, 104)
        AND s.[Doc_Date] >= @s AND s.[Doc_Date] < @e
        AND (s.[Void_item] = 0 OR s.[Void_item] IS NULL);
    `);
    return Number(res.recordset[0]?.Total) || 0;
  }

  if (secType === 6) {
    const res = await req.query(`
      SELECT CAST(ROUND(SUM(CAST(ISNULL(p.[Cash],0)+ISNULL(p.[Visa],0)+ISNULL(p.[Visa2],0)+ISNULL(p.[Visa3],0)+ISNULL(p.[C/L],0) AS DECIMAL(18,4))), 2) AS DECIMAL(18,2)) AS [Total]
      FROM [dbo].[POS_Post] p WITH (NOLOCK)
      WHERE p.[Branch_Code] IN (118, 120)
        AND p.[Doc_Date] >= @s AND p.[Doc_Date] < @e
        AND (p.[Void] = 0 OR p.[Void] IS NULL);
    `);
    return Number(res.recordset[0]?.Total) || 0;
  }

  // Types 2 & 3: Direct independent query on Pos_item_post view with canonical sector routing
  const res = await req.query(`
    SELECT CAST(ROUND(SUM(p.[Item_Qunt] * p.[Item_Price] * (1.0 + ISNULL(p.[item_Sels_Tax_P], 0) / 100.0)), 2) AS DECIMAL(18,2)) AS [Total]
    FROM [dbo].[Pos_item_post] p WITH (NOLOCK)
    WHERE p.[Doc_Date] >= @s AND p.[Doc_Date] < @e
      AND (p.[Void_item] = 0 OR p.[Void_item] IS NULL)
      AND (
        (p.[type] IN (2, 3) AND p.[Branch_Code] NOT IN (12, 13, 1019, 1020, 1026, 1028))
        OR (p.[Branch_Code] = 102 AND p.[type] NOT IN (2, 3) AND (p.[Group_code] = 3 OR p.[Groupitem_name] LIKE '%gold%'))
      )
      AND (
        CASE
          WHEN (p.[Branch_Code] = 102 AND (p.[Group_code] = 3 OR p.[Groupitem_name] LIKE '%gold%')) OR (p.[Groupitem_name] LIKE '%gold%' AND p.[item_name] LIKE N'%جولدن%') THEN 2
          WHEN p.[Group_code] = 21 OR p.[Groupitem_name] LIKE '%zoo%' OR p.[item_name] LIKE '%zoo%' THEN 0
          WHEN p.[Group_code] = 15 OR p.[Groupitem_name] LIKE N'%شلال%' OR p.[item_name] LIKE N'%شلال%' THEN 2
          WHEN p.[Group_code] = 18 OR p.[Groupitem_name] LIKE '%vr2%' OR p.[Groupitem_name] LIKE '%vr 2%' THEN 3
          WHEN p.[Group_code] = 13 OR p.[Groupitem_name] LIKE N'%خيل%' OR p.[item_name] LIKE N'%خيل%' THEN 2
          WHEN p.[Group_code] = 20 OR p.[item_Code] IN ('74','80') OR p.[Groupitem_name] LIKE '%hammer%' OR p.[item_name] LIKE '%hammer%' OR p.[item_name] LIKE N'%هامر%' THEN 3
          WHEN p.[Group_code] = 12 OR p.[item_Code] = '40' OR p.[Groupitem_name] LIKE N'%رمايه 2%' OR p.[item_name] LIKE N'%رمايه 2%' OR p.[Groupitem_name] LIKE N'%الرمايه 2%' OR p.[item_name] LIKE N'%الرمايه 2%' THEN 3
          WHEN p.[Group_code] = 3 OR p.[Groupitem_name] LIKE N'%مقلوب%' OR p.[item_name] LIKE N'%مقلوب%' THEN 3
          WHEN p.[Group_code] = 1 OR p.[Groupitem_name] LIKE N'%ديسكفر%' OR p.[item_name] LIKE N'%ديسكفر%' THEN 2
          WHEN p.[Groupitem_name] LIKE N'%سلسل%' OR p.[item_name] LIKE N'%سلسل%' THEN 2
          WHEN p.[Group_code] IN (5,9,10,11,12,17,18,19,20,22) THEN 3
          WHEN p.[Group_code] IN (2,4,6,7,8,14,16) THEN 2
          ELSE p.[type]
        END
      ) = ${secType};
  `);
  return Number(res.recordset[0]?.Total) || 0;
}

const pool = await getPool();
let allPass = true;

try {
  console.log(`\n=====================================================================================`);
  console.log(`  تدقيق القطاعات التشغيلية الستة (1x Audit) — التاريخ: ${TARGET_DATE}`);
  console.log(`=====================================================================================`);
  console.log(
    `${"اسم القطاع".padEnd(30)} | ${"رقم الداتابيز (1x)".padStart(18)} | ${"رقم التقرير".padStart(14)} | ${"النسبة".padStart(8)} | ${"الفرق".padStart(8)} | الحالة`
  );
  console.log(`-`.repeat(95));

  let sumRawAll = 0;
  let sumSvcAll = 0;
  let type6Report = null;

  for (const sec of SECTORS) {
    const [rawDb, report] = await Promise.all([
      getRawDbTotal(pool, sec.type),
      CaravanReportService.getReportData({
        startDate: TARGET_DATE,
        endDate: TARGET_DATE,
        sectorType: sec.type,
        granularity: "day",
        bypassCache: true,
        includeAdjustments: false, // مقارنة صافية مع قاعدة البيانات بدون تسويات خارجية
      }),
    ]);

    if (sec.type === 6) type6Report = report;

    const svcTotal = Number(report.summary.totalSales) || 0;
    const ratio = rawDb > 0 ? svcTotal / rawDb : svcTotal === 0 ? 1 : 0;
    const diff = Math.round((svcTotal - rawDb) * 100) / 100;
    const ok = Math.abs(diff) <= 0.01 && Math.abs(ratio - 1) < 0.0001;
    if (!ok) allPass = false;

    sumRawAll += rawDb;
    sumSvcAll += svcTotal;

    console.log(
      `${sec.name.padEnd(30)} | ${fmt(rawDb).padStart(18)} | ${fmt(svcTotal).padStart(14)} | ${(ratio.toFixed(2) + "x").padStart(8)} | ${fmt(diff).padStart(8)} | ${ok ? "PASS" : "FAIL"}`
    );
  }

  console.log(`-`.repeat(95));
  const totalRatio = sumRawAll > 0 ? sumSvcAll / sumRawAll : 1;
  const totalDiff = Math.round((sumSvcAll - sumRawAll) * 100) / 100;
  console.log(
    `${"الإجمالي الكلي (6 قطاعات)".padEnd(30)} | ${fmt(sumRawAll).padStart(18)} | ${fmt(sumSvcAll).padStart(14)} | ${(totalRatio.toFixed(2) + "x").padStart(8)} | ${fmt(totalDiff).padStart(8)} | ${Math.abs(totalDiff) <= 0.02 ? "PASS" : "FAIL"}`
  );

  // تدقيق تفصيلي لأصناف Type 6 (الملاكي، الباصات، الماسك، الأمانات، G&R)
  console.log(`\n=====================================================================================`);
  console.log(`  تدقيق تفصيلي لبنود Type 6 (الملاكي / الباصات / الماسك / الأمانات / G&R) — ${TARGET_DATE}`);
  console.log(`=====================================================================================`);
  console.log(
    `${"البند (Type 6)".padEnd(30)} | ${"رقم الداتابيز (1x)".padStart(18)} | ${"رقم التقرير".padStart(14)} | ${"النسبة".padStart(8)} | ${"الفرق".padStart(8)} | الحالة`
  );
  console.log(`-`.repeat(95));

  const t6Map = new Map((type6Report?.records || []).map((r) => [r.branchCode, Number(r.total) || 0]));
  let t6RawSum = 0;
  let t6SvcSum = 0;

  for (const item of TYPE6_ITEMS) {
    const req = pool.request();
    req.input("s", sql.Date, TARGET_DATE);
    req.input("e", sql.Date, NEXT_DATE);
    const res = await req.query(`
      SELECT CAST(ROUND(SUM(ISNULL(sp.[Item_Qunt],0) * ISNULL(sp.[Item_Price],0) * (1.0 + ISNULL(sp.[item_Sels_Tax_P],0) / 100.0)), 2) AS DECIMAL(18,2)) AS [Total]
      FROM [dbo].[POS_Sub_post] sp WITH (NOLOCK)
      INNER JOIN [dbo].[POS_Post] pp WITH (NOLOCK)
        ON sp.[Doc_NO] = pp.[Doc_NO] AND sp.[ID_Pos] = pp.[id_pos]
        AND sp.[Branch_Code] = pp.[Branch_Code] AND sp.[Doc_Date] = pp.[Doc_Date]
      INNER JOIN [dbo].[items] it WITH (NOLOCK)
        ON it.[code] = sp.[item_Code] AND it.[BranchCode] = sp.[Branch_Code]
      WHERE sp.[Doc_Date] >= @s AND sp.[Doc_Date] < @e
        AND pp.[Doc_Date] >= @s AND pp.[Doc_Date] < @e
        AND sp.[Branch_Code] IN (118, 120) AND pp.[Branch_Code] IN (118, 120)
        AND ISNULL(sp.[Void_item], 0) = 0 AND pp.[Officer] = 0
        AND (${item.sqlCond});
    `);

    const rawVal = Number(res.recordset[0]?.Total) || 0;
    const svcVal = t6Map.get(item.code) || 0;
    const ratio = rawVal > 0 ? svcVal / rawVal : svcVal === 0 ? 1 : 0;
    const diff = Math.round((svcVal - rawVal) * 100) / 100;
    const ok = Math.abs(diff) <= 0.01 && Math.abs(ratio - 1) < 0.0001;
    if (!ok) allPass = false;

    t6RawSum += rawVal;
    t6SvcSum += svcVal;

    console.log(
      `${item.label.padEnd(30)} | ${fmt(rawVal).padStart(18)} | ${fmt(svcVal).padStart(14)} | ${(ratio.toFixed(2) + "x").padStart(8)} | ${fmt(diff).padStart(8)} | ${ok ? "PASS" : "FAIL"}`
    );
  }

  console.log(`-`.repeat(95));
  console.log(
    `${"إجمالي Type 6".padEnd(30)} | ${fmt(t6RawSum).padStart(18)} | ${fmt(t6SvcSum).padStart(14)} | ${((t6RawSum > 0 ? t6SvcSum / t6RawSum : 1).toFixed(2) + "x").padStart(8)} | ${fmt(t6SvcSum - t6RawSum).padStart(8)} | ${Math.abs(t6SvcSum - t6RawSum) <= 0.01 ? "PASS" : "FAIL"}`
  );
  console.log(`\nالنتيجة النهائية: ${allPass ? "PASS — جميع القطاعات الستة وبنود Type 6 مطابقة بنسبة 1.00x (صفر تضاعف)" : "FAIL — يوجد فرق يتطلب مراجعة"}\n`);
  process.exitCode = allPass ? 0 : 1;
} finally {
  await pool.close();
}
