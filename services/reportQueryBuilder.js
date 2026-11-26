/**
 * دور الملف: بناء وتنفيذ استعلامات T-SQL المحسّنة (SARGable + Parameterized + ISNULL) لجميع القطاعات الستة.
 * المدخلات: مجمع الاتصال (pool)، نطاق التواريخ، نوع القطاع، أكواد الفروع، ومستوى التجميع.
 * المخرجات: مصفوفات وعود استعلامات متوازية جاهزة للتنفيذ عبر Promise.all بدون تكرار أو SQL Injection.
 */

import { sql, createRequest, bindIntList } from "../db/sqlPool.js";
import { EXCLUDED_NON_REVENUE_BRANCHES } from "./sectorRouting.js";

export function executeBranchListQueries(pool, { secType, sDate, endDateNextDay, targetBranchCodes }) {
  const mainReq = createRequest(pool);
  mainReq.input("startDate", sql.Date, sDate);
  mainReq.input("endDateNextDay", sql.Date, endDateNextDay);
  const mainPh = bindIntList(mainReq, "mb", targetBranchCodes);

  const recReq = createRequest(pool);
  recReq.input("startDate", sql.Date, sDate);
  recReq.input("endDateNextDay", sql.Date, endDateNextDay);
  const recCodes = secType === 2 ? [...targetBranchCodes, 102] : targetBranchCodes;
  const recPh = bindIntList(recReq, "rb", recCodes);

  const queries = [
    mainReq.query(`
      SELECT DISTINCT sp.[Branch_Code], it.[Group_code], sp.[item_Code], gi.[name_a] AS [Groupitem_name], sp.[item_name]
      FROM [dbo].[POS_Sub_post] sp WITH (NOLOCK)
      INNER JOIN [dbo].[POS_Post] pp WITH (NOLOCK)
        ON sp.[Doc_NO] = pp.[Doc_NO] AND sp.[ID_Pos] = pp.[id_pos]
        AND sp.[Branch_Code] = pp.[Branch_Code] AND sp.[Doc_Date] = pp.[Doc_Date]
      INNER JOIN [dbo].[items] it WITH (NOLOCK) ON it.[code] = sp.[item_Code] AND it.[BranchCode] = sp.[Branch_Code]
      INNER JOIN [dbo].[Groupitem] gi WITH (NOLOCK) ON gi.[code] = it.[Group_code] AND gi.[Branch_Code] = it.[BranchCode]
      WHERE sp.[Doc_Date] >= @startDate AND sp.[Doc_Date] < @endDateNextDay
        AND pp.[Doc_Date] >= @startDate AND pp.[Doc_Date] < @endDateNextDay
        AND sp.[Branch_Code] IN (${mainPh}) AND pp.[Branch_Code] IN (${mainPh})
        AND ISNULL(sp.[Void_item], 0) = 0 AND pp.[Officer] = 0
      OPTION (LOOP JOIN, RECOMPILE);
    `),
    recReq
      .query(`
        SELECT DISTINCT rd.[Branch_Code], gi.[code] AS [Group_code], rd.[Item_Code] AS [item_Code],
          gi.[name_a] AS [Groupitem_name], it.[name_a] AS [item_name]
        FROM [dbo].[receipts_Details] rd WITH (NOLOCK)
        INNER JOIN [dbo].[receipts_Master] rm WITH (NOLOCK)
          ON rd.[Branch_Code] = rm.[Branch_Code] AND rd.[Book_Code] = rm.[Book_Code] AND rd.[Doc_NO] = rm.[Doc_NO]
        INNER JOIN [dbo].[items] it WITH (NOLOCK) ON rd.[Item_Code] = it.[code] AND rd.[Branch_Code] = it.[BranchCode]
        INNER JOIN [dbo].[Groupitem] gi WITH (NOLOCK) ON it.[BranchCode] = gi.[Branch_Code] AND it.[Group_code] = gi.[code]
        WHERE rm.[Doc_Date] >= @startDate AND rm.[Doc_Date] < @endDateNextDay
          AND rd.[Branch_Code] IN (${recPh}) AND rm.[Branch_Code] IN (${recPh})
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
        SELECT DISTINCT sp.[Branch_Code], it.[Group_code], sp.[item_Code], gi.[name_a] AS [Groupitem_name], sp.[item_name]
        FROM [dbo].[POS_Sub_post] sp WITH (NOLOCK)
        INNER JOIN [dbo].[items] it WITH (NOLOCK) ON it.[code] = sp.[item_Code] AND it.[BranchCode] = sp.[Branch_Code]
        INNER JOIN [dbo].[Groupitem] gi WITH (NOLOCK) ON gi.[code] = it.[Group_code] AND gi.[Branch_Code] = it.[BranchCode]
        INNER JOIN [dbo].[POS_Post] pp WITH (NOLOCK)
          ON sp.[Doc_NO] = pp.[Doc_NO] AND sp.[ID_Pos] = pp.[id_pos]
          AND sp.[Branch_Code] = pp.[Branch_Code] AND sp.[Doc_Date] = pp.[Doc_Date]
        WHERE sp.[Doc_Date] >= @startDate AND sp.[Doc_Date] < @endDateNextDay
          AND pp.[Doc_Date] >= @startDate AND pp.[Doc_Date] < @endDateNextDay
          AND sp.[Branch_Code] = @goldBranch AND pp.[Branch_Code] = @goldBranch
          AND (it.[Group_code] = 3 OR gi.[name_a] LIKE N'%gold%')
          AND ISNULL(sp.[Void_item], 0) = 0 AND pp.[Officer] = 0
        OPTION (HASH JOIN, RECOMPILE);
      `)
    );
  }

  return Promise.all(queries);
}

export function executeItemLevelQueries(
  pool,
  { secType, sDate, endDateNextDay, normGranularity, isSummaryGran, targetBranchCodes }
) {
  const periodExprSp = isSummaryGran
    ? "NULL"
    : normGranularity === "month"
      ? "CONVERT(VARCHAR(7), sp.[Doc_Date], 120)"
      : "CONVERT(VARCHAR(10), sp.[Doc_Date], 120)";
  const groupBySp = isSummaryGran ? "" : `${periodExprSp}, `;

  const periodExprRm = isSummaryGran
    ? "NULL"
    : normGranularity === "month"
      ? "CONVERT(VARCHAR(7), rm.[Doc_Date], 120)"
      : "CONVERT(VARCHAR(10), rm.[Doc_Date], 120)";
  const groupByRm = isSummaryGran ? "" : `${periodExprRm}, `;

  const mainReq = createRequest(pool);
  mainReq.input("startDate", sql.Date, sDate);
  mainReq.input("endDateNextDay", sql.Date, endDateNextDay);
  const mainPh = bindIntList(mainReq, "mb", targetBranchCodes);

  const recCodes = secType === 2 ? [...targetBranchCodes, 102] : targetBranchCodes;
  const recReq = createRequest(pool);
  recReq.input("startDate", sql.Date, sDate);
  recReq.input("endDateNextDay", sql.Date, endDateNextDay);
  const recPh = bindIntList(recReq, "rb", recCodes);

  const promises = [
    mainReq.query(`
      SELECT ${periodExprSp} AS [Period], sp.[Branch_Code], it.[Group_code], sp.[item_Code],
        gi.[name_a] AS [Groupitem_name], sp.[item_name],
        SUM(CAST(ISNULL(sp.[Item_Qunt], 0) AS INT)) AS [Cover],
        CAST(SUM(ISNULL(sp.[Item_Qunt], 0) * ISNULL(sp.[Item_Price], 0) * (1.0 + ISNULL(sp.[item_Sels_Tax_P], 0) / 100.0)) AS DECIMAL(38, 10)) AS [Total],
        CAST(SUM(ISNULL(sp.[Item_Qunt], 0) * ISNULL(sp.[Item_Price], 0)) AS DECIMAL(38, 10)) AS [NetAmount],
        CAST(SUM(ISNULL(sp.[item_Sels_Tax], 0)) AS DECIMAL(38, 10)) AS [TaxAmount],
        SUM(CAST(ISNULL(pp.[C/L], 0) AS DECIMAL(18, 4))) AS [CL]
      FROM [dbo].[POS_Sub_post] sp WITH (NOLOCK)
      INNER JOIN [dbo].[POS_Post] pp WITH (NOLOCK)
        ON sp.[Doc_NO] = pp.[Doc_NO] AND sp.[ID_Pos] = pp.[id_pos]
        AND sp.[Branch_Code] = pp.[Branch_Code] AND sp.[Doc_Date] = pp.[Doc_Date]
      INNER JOIN [dbo].[items] it WITH (NOLOCK) ON it.[code] = sp.[item_Code] AND it.[BranchCode] = sp.[Branch_Code]
      INNER JOIN [dbo].[Groupitem] gi WITH (NOLOCK) ON gi.[code] = it.[Group_code] AND gi.[Branch_Code] = it.[BranchCode]
      WHERE sp.[Doc_Date] >= @startDate AND sp.[Doc_Date] < @endDateNextDay
        AND pp.[Doc_Date] >= @startDate AND pp.[Doc_Date] < @endDateNextDay
        AND sp.[Branch_Code] IN (${mainPh}) AND pp.[Branch_Code] IN (${mainPh})
        AND ISNULL(sp.[Void_item], 0) = 0 AND pp.[Officer] = 0
      GROUP BY ${groupBySp}sp.[Branch_Code], it.[Group_code], sp.[item_Code], gi.[name_a], sp.[item_name]
      OPTION (LOOP JOIN, RECOMPILE);
    `),
    recReq
      .query(`
        SELECT ${periodExprRm} AS [Period], rd.[Branch_Code], gi.[code] AS [Group_code],
          rd.[Item_Code] AS [item_Code], gi.[name_a] AS [Groupitem_name], it.[name_a] AS [item_name],
          SUM(CAST(ISNULL(rd.[Item_Qunt], 0) AS INT)) AS [Cover],
          CAST(SUM(ISNULL(rd.[Item_Qunt], 0) * (ISNULL(rd.[Item_Price], 0) / ((ISNULL(it.[Sels_Tax], 0) / 100) + 1)) * (1.0 + ISNULL(it.[Sels_Tax], 0) / 100.0)) AS DECIMAL(38, 10)) AS [Total],
          CAST(SUM(ISNULL(rd.[Item_Qunt], 0) * (ISNULL(rd.[Item_Price], 0) / ((ISNULL(it.[Sels_Tax], 0) / 100) + 1))) AS DECIMAL(38, 10)) AS [NetAmount],
          CAST(SUM(ISNULL(rd.[Item_Price], 0) * (ISNULL(it.[Sels_Tax], 0) / 100)) AS DECIMAL(38, 10)) AS [TaxAmount],
          CAST(0 AS DECIMAL(18, 4)) AS [CL]
        FROM [dbo].[receipts_Details] rd WITH (NOLOCK)
        INNER JOIN [dbo].[receipts_Master] rm WITH (NOLOCK)
          ON rd.[Branch_Code] = rm.[Branch_Code] AND rd.[Book_Code] = rm.[Book_Code] AND rd.[Doc_NO] = rm.[Doc_NO]
        INNER JOIN [dbo].[items] it WITH (NOLOCK) ON rd.[Item_Code] = it.[code] AND rd.[Branch_Code] = it.[BranchCode]
        INNER JOIN [dbo].[Groupitem] gi WITH (NOLOCK) ON it.[BranchCode] = gi.[Branch_Code] AND it.[Group_code] = gi.[code]
        WHERE rm.[Doc_Date] >= @startDate AND rm.[Doc_Date] < @endDateNextDay
          AND rd.[Branch_Code] IN (${recPh}) AND rm.[Branch_Code] IN (${recPh})
        GROUP BY ${groupByRm}rd.[Branch_Code], gi.[code], rd.[Item_Code], gi.[name_a], it.[name_a]
        OPTION (RECOMPILE);
      `)
      .catch((err) => {
        console.warn("[QueryBuilder] Receipts leg failed:", err.message);
        return { recordset: [] };
      }),
  ];

  if (secType === 2) {
    const goldReq = createRequest(pool);
    goldReq.input("startDate", sql.Date, sDate);
    goldReq.input("endDateNextDay", sql.Date, endDateNextDay);
    goldReq.input("goldBranch", sql.Int, 102);
    promises.push(
      goldReq.query(`
        SELECT ${periodExprSp} AS [Period], sp.[Branch_Code], it.[Group_code], sp.[item_Code],
          gi.[name_a] AS [Groupitem_name], sp.[item_name],
          SUM(CAST(ISNULL(sp.[Item_Qunt], 0) AS INT)) AS [Cover],
          CAST(SUM(ISNULL(sp.[Item_Qunt], 0) * ISNULL(sp.[Item_Price], 0) * (1.0 + ISNULL(sp.[item_Sels_Tax_P], 0) / 100.0)) AS DECIMAL(38, 10)) AS [Total],
          CAST(SUM(ISNULL(sp.[Item_Qunt], 0) * ISNULL(sp.[Item_Price], 0)) AS DECIMAL(38, 10)) AS [NetAmount],
          CAST(SUM(ISNULL(sp.[item_Sels_Tax], 0)) AS DECIMAL(38, 10)) AS [TaxAmount],
          SUM(CAST(ISNULL(pp.[C/L], 0) AS DECIMAL(18, 4))) AS [CL]
        FROM [dbo].[POS_Sub_post] sp WITH (NOLOCK)
        INNER JOIN [dbo].[items] it WITH (NOLOCK) ON it.[code] = sp.[item_Code] AND it.[BranchCode] = sp.[Branch_Code]
        INNER JOIN [dbo].[Groupitem] gi WITH (NOLOCK) ON gi.[code] = it.[Group_code] AND gi.[Branch_Code] = it.[BranchCode]
        INNER JOIN [dbo].[POS_Post] pp WITH (NOLOCK)
          ON sp.[Doc_NO] = pp.[Doc_NO] AND sp.[ID_Pos] = pp.[id_pos]
          AND sp.[Branch_Code] = pp.[Branch_Code] AND sp.[Doc_Date] = pp.[Doc_Date]
        WHERE sp.[Doc_Date] >= @startDate AND sp.[Doc_Date] < @endDateNextDay
          AND pp.[Doc_Date] >= @startDate AND pp.[Doc_Date] < @endDateNextDay
          AND sp.[Branch_Code] = @goldBranch AND pp.[Branch_Code] = @goldBranch
          AND (it.[Group_code] = 3 OR gi.[name_a] LIKE N'%gold%')
          AND ISNULL(sp.[Void_item], 0) = 0 AND pp.[Officer] = 0
        GROUP BY ${groupBySp}sp.[Branch_Code], it.[Group_code], sp.[item_Code], gi.[name_a], sp.[item_name]
        OPTION (HASH JOIN, RECOMPILE);
      `)
    );
  }

  if (secType === 6) {
    const postPeriod = isSummaryGran
      ? "NULL"
      : normGranularity === "month"
        ? "CONVERT(VARCHAR(7), p.[Doc_Date], 120)"
        : "CONVERT(VARCHAR(10), p.[Doc_Date], 120)";
    const postGroup = isSummaryGran ? "" : `GROUP BY ${postPeriod}`;

    const postReq = createRequest(pool);
    postReq.input("startDate", sql.Date, sDate);
    postReq.input("endDateNextDay", sql.Date, endDateNextDay);
    const postPh = bindIntList(postReq, "pb", targetBranchCodes);

    const voidReq = createRequest(pool);
    voidReq.input("startDate", sql.Date, sDate);
    voidReq.input("endDateNextDay", sql.Date, endDateNextDay);
    const voidPh = bindIntList(voidReq, "vb", targetBranchCodes);

    promises.push(
      postReq
        .query(`
          SELECT ${postPeriod} AS [Period],
            CAST(ROUND(SUM(CAST(ISNULL(p.[Cash], 0) AS DECIMAL(18, 4))), 2) AS DECIMAL(18, 2)) AS [Cash],
            CAST(ROUND(SUM(CAST(ISNULL(p.[Visa], 0) + ISNULL(p.[Visa2], 0) + ISNULL(p.[Visa3], 0) AS DECIMAL(18, 4))), 2) AS DECIMAL(18, 2)) AS [Visa],
            CAST(ROUND(SUM(CAST(ISNULL(p.[C/L], 0) AS DECIMAL(18, 4))), 2) AS DECIMAL(18, 2)) AS [CL],
            CAST(ROUND(SUM(CAST(ISNULL(p.[TotalInv], 0) AS DECIMAL(18, 4))), 2) AS DECIMAL(18, 2)) AS [TotalInv],
            CAST(ROUND(SUM(CAST(ISNULL(p.[Sels_Tax], 0) AS DECIMAL(18, 4))), 2) AS DECIMAL(18, 2)) AS [SalesTax]
          FROM [dbo].[POS_Post] p WITH (NOLOCK)
          WHERE p.[Doc_Date] >= @startDate AND p.[Doc_Date] < @endDateNextDay
            AND (p.[Void] = 0 OR p.[Void] IS NULL) AND p.[Branch_Code] IN (${postPh})
          ${postGroup}
          OPTION (RECOMPILE);
        `)
        .catch(() => ({ recordset: [] })),
      voidReq
        .query(`
          SELECT COUNT(*) AS [VoidCount],
            CAST(ROUND(SUM(CAST(ISNULL(sp.[Item_Qunt], 0) * ISNULL(sp.[Item_Price], 0) * (1.0 + ISNULL(sp.[item_Sels_Tax_P], 0) / 100.0 + ISNULL(sp.[item_Serves_Tax_P], 0) / 100.0) AS DECIMAL(18, 4))), 2) AS DECIMAL(18, 2)) AS [TotalVoids]
          FROM [dbo].[POS_Sub_post] sp WITH (NOLOCK)
          INNER JOIN [dbo].[POS_Post] pp WITH (NOLOCK)
            ON sp.[Doc_NO] = pp.[Doc_NO] AND sp.[ID_Pos] = pp.[id_pos]
            AND sp.[Branch_Code] = pp.[Branch_Code] AND sp.[Doc_Date] = pp.[Doc_Date]
          WHERE sp.[Doc_Date] >= @startDate AND sp.[Doc_Date] < @endDateNextDay
            AND pp.[Doc_Date] >= @startDate AND pp.[Doc_Date] < @endDateNextDay
            AND sp.[Branch_Code] IN (${voidPh}) AND pp.[Branch_Code] IN (${voidPh})
            AND ISNULL(sp.[Void_item], 0) = 1 AND pp.[Officer] = 0
          OPTION (HASH JOIN, RECOMPILE);
        `)
        .catch(() => ({ recordset: [] }))
    );
  }

  return Promise.all(promises);
}

export function executeGatesQueries(pool, { sDate, endDateNextDay, gateBranchCodes }) {
  const itemReq = createRequest(pool);
  itemReq.input("startDate", sql.Date, sDate);
  itemReq.input("endDateNextDay", sql.Date, endDateNextDay);
  const itemPh = bindIntList(itemReq, "gb", gateBranchCodes);

  const posReq = createRequest(pool);
  posReq.input("startDate", sql.Date, sDate);
  posReq.input("endDateNextDay", sql.Date, endDateNextDay);
  const posPh = bindIntList(posReq, "pb", gateBranchCodes);

  return Promise.all([
    itemReq.query(`
      SELECT CONVERT(VARCHAR(10), s.[Doc_Date], 120) AS [Doc_Date], s.[Branch_Code], s.[item_name],
        ISNULL(s.[item_Sels_Tax_P], 0) AS [item_Sels_Tax_P],
        SUM(CAST(ISNULL(s.[Item_Qunt], 0) AS DECIMAL(18, 4))) AS [Item_Qunt],
        CAST(SUM(ISNULL(s.[Item_Qunt], 0) * ISNULL(s.[Item_Price], 0) * (1.0 + ISNULL(s.[item_Sels_Tax_P], 0) / 100.0)) AS DECIMAL(38, 10)) AS [GrossAmount],
        COUNT(DISTINCT CASE WHEN s.[Branch_Code] = 104 THEN s.[Doc_NO] END) AS [DocCount]
      FROM [dbo].[POS_Sub_post] s WITH (NOLOCK)
      WHERE s.[Branch_Code] IN (${itemPh}) AND s.[Doc_Date] >= @startDate AND s.[Doc_Date] < @endDateNextDay
        AND (s.[Void_item] = 0 OR s.[Void_item] IS NULL)
      GROUP BY CONVERT(VARCHAR(10), s.[Doc_Date], 120), s.[Branch_Code], s.[item_name], ISNULL(s.[item_Sels_Tax_P], 0)
      OPTION (LOOP JOIN, RECOMPILE);
    `),
    posReq.query(`
      SELECT CONVERT(VARCHAR(10), p.[Doc_Date], 120) AS [Doc_Date], p.[Branch_Code],
        ISNULL(p.[Cash], 0) AS [Cash], ISNULL(p.[Visa], 0) AS [Visa],
        ISNULL(p.[Visa2], 0) AS [Visa2], ISNULL(p.[Visa3], 0) AS [Visa3], ISNULL(p.[C/L], 0) AS [C/L]
      FROM [dbo].[POS_Post] p WITH (NOLOCK)
      WHERE p.[Branch_Code] IN (${posPh}) AND p.[Doc_Date] >= @startDate AND p.[Doc_Date] < @endDateNextDay
        AND (p.[Void] = 0 OR p.[Void] IS NULL)
      OPTION (LOOP JOIN, RECOMPILE);
    `),
  ]);
}

export function executeSectorSalesAndVoidsQueries(
  pool,
  { secType, sDate, endDateNextDay, normGranularity, sortBy, validBranchCodes, sectorBranchCodes }
) {
  const request = createRequest(pool);
  request.input("startDate", sql.Date, sDate);
  request.input("endDateNextDay", sql.Date, endDateNextDay);
  request.input("sectorType", sql.Int, secType);
  const exclPh = bindIntList(request, "ex", EXCLUDED_NON_REVENUE_BRANCHES);
  const branchClause =
    validBranchCodes.length > 0 ? ` AND b.[Code] IN (${bindIntList(request, "branch", validBranchCodes)})` : "";

  let orderClause = "s.[Total] DESC";
  if (sortBy === "total_asc") orderClause = "s.[Total] ASC";
  else if (sortBy === "cover_desc") orderClause = "s.[Cover] DESC, s.[Total] DESC";
  else if (sortBy === "name_asc") orderClause = "s.[Name] ASC";

  const isMonth = normGranularity === "month";
  const isDay = normGranularity === "day";
  const selectSalesPeriod = isMonth ? "YEAR(p.[Doc_Date]) AS [PeriodYear], MONTH(p.[Doc_Date]) AS [PeriodMonth]," : isDay ? "p.[Doc_Date] AS [PeriodDate]," : "";
  const groupBySalesPeriod = isMonth ? ", YEAR(p.[Doc_Date]), MONTH(p.[Doc_Date])" : isDay ? ", p.[Doc_Date]" : "";
  const selectItemPeriod = isMonth ? "YEAR(sp.[Doc_Date]) AS [PeriodYear], MONTH(sp.[Doc_Date]) AS [PeriodMonth]," : isDay ? "sp.[Doc_Date] AS [PeriodDate]," : "";
  const groupByItemPeriod = isMonth ? ", YEAR(sp.[Doc_Date]), MONTH(sp.[Doc_Date])" : isDay ? ", sp.[Doc_Date]" : "";
  const joinItemPeriod = isMonth ? "AND i.[PeriodYear] = s.[PeriodYear] AND i.[PeriodMonth] = s.[PeriodMonth]" : isDay ? "AND i.[PeriodDate] = s.[PeriodDate]" : "";
  const outerSelectPeriod = isMonth ? "CAST(s.[PeriodYear] AS VARCHAR(4)) + '-' + RIGHT('0' + CAST(s.[PeriodMonth] AS VARCHAR(2)), 2) AS [Period]," : isDay ? "CONVERT(VARCHAR(10), s.[PeriodDate], 120) AS [Period]," : "";
  const orderByGran = isMonth ? "s.[PeriodYear] ASC, s.[PeriodMonth] ASC, " : isDay ? "s.[PeriodDate] ASC, " : "";

  const fbCTE = secType === 1 ? `,
    ItemAgg AS (
      SELECT sp.[Branch_Code], ${selectItemPeriod}
        CAST(SUM(CASE WHEN g.[CategoryType] = 1 THEN ISNULL(sp.[Item_Qunt], 0) * ISNULL(sp.[Item_Price], 0) + ISNULL(sp.[item_Sels_Tax], 0) + ISNULL(sp.[item_Serves_Tax], 0) ELSE 0 END) AS DECIMAL(18, 4)) AS [Food],
        CAST(SUM(CASE WHEN g.[CategoryType] = 2 THEN ISNULL(sp.[Item_Qunt], 0) * ISNULL(sp.[Item_Price], 0) + ISNULL(sp.[item_Sels_Tax], 0) + ISNULL(sp.[item_Serves_Tax], 0) ELSE 0 END) AS DECIMAL(18, 4)) AS [Beverage],
        CAST(SUM(CASE WHEN ISNULL(g.[CategoryType], 0) NOT IN (1, 2) THEN ISNULL(sp.[Item_Qunt], 0) * ISNULL(sp.[Item_Price], 0) + ISNULL(sp.[item_Sels_Tax], 0) + ISNULL(sp.[item_Serves_Tax], 0) ELSE 0 END) AS DECIMAL(18, 4)) AS [Other],
        CAST(SUM(ISNULL(sp.[Item_Qunt], 0) * ISNULL(it.[itemcost], 0)) AS DECIMAL(18, 4)) AS [Cost]
      FROM [dbo].[POS_Sub_post] sp WITH (NOLOCK)
      INNER JOIN TargetBranches tb ON tb.[Code] = sp.[Branch_Code]
      LEFT JOIN [dbo].[items] it WITH (NOLOCK) ON it.[code] = sp.[item_Code] AND it.[BranchCode] = sp.[Branch_Code]
      LEFT JOIN [dbo].[Groupitem] g WITH (NOLOCK) ON g.[code] = it.[Group_code] AND g.[Branch_Code] = it.[BranchCode]
      WHERE sp.[Doc_Date] >= @startDate AND sp.[Doc_Date] < @endDateNextDay AND (sp.[Void_item] = 0 OR sp.[Void_item] IS NULL)
      GROUP BY sp.[Branch_Code] ${groupByItemPeriod}
    )` : "";
  const fbJoin = secType === 1 ? `LEFT JOIN ItemAgg i ON i.[Branch_Code] = s.[Branch_Code] ${joinItemPeriod}` : "";
  const fbCols = secType === 1 ? "ISNULL(i.[Food], 0) AS [Food], ISNULL(i.[Beverage], 0) AS [Beverage], ISNULL(i.[Other], 0) AS [Other], ISNULL(i.[Cost], 0) AS [Cost]," : "";

  const salesQuery = `
    WITH TargetBranches AS (
      SELECT [Code], [Aname] FROM [dbo].[Branchs] b WITH (NOLOCK)
      WHERE b.[Type] = @sectorType AND b.[Code] NOT IN (${exclPh}) ${branchClause}
    ),
    SalesAgg AS (
      SELECT tb.[Code] AS [Branch_Code], tb.[Aname] AS [Name], ${selectSalesPeriod}
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
      WHERE p.[Doc_Date] >= @startDate AND p.[Doc_Date] < @endDateNextDay AND (p.[Void] = 0 OR p.[Void] IS NULL)
      GROUP BY tb.[Code], tb.[Aname] ${groupBySalesPeriod}
      HAVING SUM(CAST(ISNULL(p.[Cash], 0) + ISNULL(p.[Visa], 0) + ISNULL(p.[Visa2], 0) + ISNULL(p.[Visa3], 0) + ISNULL(p.[C/L], 0) AS DECIMAL(18, 4))) <> 0
    )
    ${fbCTE}
    SELECT s.[Branch_Code], s.[Name], ${outerSelectPeriod} ${fbCols}
      s.[Cover], s.[Cash], s.[Visa], s.[CL] AS [C/L], s.[Total], s.[TotalInv], s.[ServiceCharge], s.[SalesTax],
      ((s.[Cash] + s.[Visa] + s.[CL]) - s.[Total]) AS [Variance],
      SUM(s.[Total]) OVER () AS [GrandTotalNet], SUM(s.[Cash]) OVER () AS [GrandTotalCash],
      SUM(s.[CL]) OVER () AS [GrandTotalCL], SUM(s.[Visa]) OVER () AS [GrandTotalVisa], SUM(s.[Cover]) OVER () AS [GrandTotalCover]
    FROM SalesAgg s ${fbJoin}
    ORDER BY ${orderByGran}${orderClause}
    OPTION (HASH JOIN, RECOMPILE);
  `;

  const voidsReq = createRequest(pool);
  voidsReq.input("startDate", sql.Date, sDate);
  voidsReq.input("endDateNextDay", sql.Date, endDateNextDay);
  const voidPh = bindIntList(voidsReq, "vb", sectorBranchCodes);
  const voidPeriod = isMonth ? "CONVERT(VARCHAR(7), sp.[Doc_Date], 120) AS [period]," : isDay ? "CONVERT(VARCHAR(10), sp.[Doc_Date], 120) AS [period]," : "";

  const voidsPromise =
    sectorBranchCodes.length > 0
      ? voidsReq
          .query(`
            SELECT sp.[Branch_Code] AS [branchCode], ${voidPeriod} sp.[item_Code] AS [itemCode],
              ISNULL(sp.[item_name], it.[name_e]) AS [itemName], CONVERT(VARCHAR(10), sp.[Doc_Date], 120) AS [docDate],
              CONVERT(VARCHAR(8), ISNULL(sp.[Inv_Time], sp.[item_time]), 108) AS [docTime],
              ISNULL(sp.[Item_Qunt], 1) AS [quantity],
              ROUND(ISNULL(sp.[Item_Price], 0) * (1.0 + ISNULL(sp.[item_Sels_Tax_P], 0) / 100.0 + ISNULL(sp.[item_Serves_Tax_P], 0) / 100.0), 2) AS [price],
              CAST(ISNULL(sp.[Item_Qunt], 0) * ISNULL(sp.[Item_Price], 0) * (1.0 + ISNULL(sp.[item_Sels_Tax_P], 0) / 100.0 + ISNULL(sp.[item_Serves_Tax_P], 0) / 100.0) AS DECIMAL(18, 4)) AS [rawTotal],
              ROUND(ISNULL(sp.[Item_Qunt], 0) * ISNULL(sp.[Item_Price], 0) * (1.0 + ISNULL(sp.[item_Sels_Tax_P], 0) / 100.0 + ISNULL(sp.[item_Serves_Tax_P], 0) / 100.0), 2) AS [total]
            FROM [dbo].[POS_Sub_post] sp WITH (NOLOCK)
            INNER JOIN [dbo].[POS_Post] pp WITH (NOLOCK)
              ON sp.[Doc_NO] = pp.[Doc_NO] AND sp.[ID_Pos] = pp.[id_pos]
              AND sp.[Branch_Code] = pp.[Branch_Code] AND sp.[Doc_Date] = pp.[Doc_Date]
            INNER JOIN [dbo].[items] it WITH (NOLOCK) ON it.[code] = sp.[item_Code] AND it.[BranchCode] = sp.[Branch_Code]
            INNER JOIN [dbo].[Groupitem] gi WITH (NOLOCK) ON gi.[code] = it.[Group_code] AND gi.[Branch_Code] = it.[BranchCode]
            WHERE sp.[Doc_Date] >= @startDate AND sp.[Doc_Date] < @endDateNextDay
              AND pp.[Doc_Date] >= @startDate AND pp.[Doc_Date] < @endDateNextDay
              AND sp.[Branch_Code] IN (${voidPh}) AND pp.[Branch_Code] IN (${voidPh})
              AND ISNULL(sp.[Void_item], 0) = 1 AND pp.[Officer] = 0
            ORDER BY sp.[Doc_Date] DESC, sp.[Inv_Time] DESC
            OPTION (HASH JOIN, RECOMPILE);
          `)
          .catch((err) => {
            console.warn("[QueryBuilder] Single-pass voids query failed:", err.message);
            return { recordset: [] };
          })
      : Promise.resolve({ recordset: [] });

  return Promise.all([request.query(salesQuery), voidsPromise]);
}
