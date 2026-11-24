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

    if (secType === 2 || secType === 3) {
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
                      AND p.[type] IN (2, 3)
                      AND p.[Branch_Code] NOT IN (12, 13, 1019, 1020, 1026, 1028)
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
    const request = pool.request();
    const secType = Number(sectorType) || 3;

    request.input("startDate", sql.Date, startDate);
    request.input("endDate", sql.Date, endDate);
    request.input("sectorType", sql.Int, secType);

    let itemFilterClause = "";
    const isFiltered = Array.isArray(branches) && branches.length > 0;
    if (isFiltered) {
      const placeholders = branches.map((code, index) => {
        const paramName = `grp_${index}`;
        request.input(paramName, sql.VarChar, String(code).trim());
        return `@${paramName}`;
      });
      itemFilterClause = ` AND g.[Game_Code] IN (${placeholders.join(", ")})`;
    }

    let selectPeriodExpr = "CONVERT(VARCHAR(10), p.[Doc_Date], 120)";
    let groupByPeriodExpr = "CONVERT(VARCHAR(10), p.[Doc_Date], 120), ";
    let orderByPeriodExpr = "[Period] ASC, ";
    const normGranularity = (granularity || "summary").toLowerCase();
    if (normGranularity === "month") {
      selectPeriodExpr = "CONVERT(VARCHAR(7), p.[Doc_Date], 120)";
      groupByPeriodExpr = "CONVERT(VARCHAR(7), p.[Doc_Date], 120), ";
    } else if (normGranularity === "summary" || normGranularity === "total") {
      selectPeriodExpr = "NULL";
      groupByPeriodExpr = "";
      orderByPeriodExpr = "";
    }

    const goldenItemsUnion = secType === 2 ? `
                UNION ALL
                SELECT
                    p.[Doc_Date],
                    p.[Branch_Code],
                    p.[type] AS [Branch_Type],
                    p.[Group_code],
                    p.[item_Code],
                    p.[Groupitem_name],
                    p.[item_name],
                    p.[Item_Qunt],
                    p.[Item_Price],
                    p.[item_Sels_Tax_P],
                    p.[C/L]
                FROM [dbo].[Pos_item_post] p WITH (NOLOCK)
                WHERE p.[Doc_Date] >= @startDate
                  AND p.[Doc_Date] < DATEADD(DAY, 1, @endDate)
                  AND p.[Branch_Code] = 102
                  AND p.[type] NOT IN (2, 3)
                  AND (p.[Group_code] = 3 OR p.[Groupitem_name] LIKE '%gold%')
                  AND (p.[Void_item] = 0 OR p.[Void_item] IS NULL)` : '';

    const itemsQuery = `
            WITH FilteredItems AS (
                SELECT
                    p.[Doc_Date],
                    p.[Branch_Code],
                    p.[type] AS [Branch_Type],
                    p.[Group_code],
                    p.[item_Code],
                    p.[Groupitem_name],
                    p.[item_name],
                    p.[Item_Qunt],
                    p.[Item_Price],
                    p.[item_Sels_Tax_P],
                    p.[C/L]
                FROM [dbo].[Pos_item_post] p WITH (NOLOCK)
                WHERE p.[Doc_Date] >= @startDate
                  AND p.[Doc_Date] < DATEADD(DAY, 1, @endDate)
                  AND p.[type] IN (2, 3)
                  AND p.[Branch_Code] NOT IN (12, 13, 1019, 1020, 1026, 1028)
                  AND (p.[Void_item] = 0 OR p.[Void_item] IS NULL)
                ${goldenItemsUnion}
            )
            SELECT 
                ${selectPeriodExpr} AS [Period],
                g.[Game_Code] AS [Branch_Code],
                g.[Game_Name] AS [Name],
                SUM(CAST(p.[Item_Qunt] AS INT)) AS [Cover],
                CAST(SUM(p.[Item_Qunt] * p.[Item_Price] * (1.0 + ISNULL(p.[item_Sels_Tax_P], 0) / 100.0)) AS DECIMAL(18, 4)) AS [Total],
                SUM(CAST(ISNULL(p.[C/L], 0) AS DECIMAL(18, 4))) AS [CL]
            FROM FilteredItems p
            CROSS APPLY (
                SELECT 
                    -- Target Sector Routing:
                    CASE 
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
              ${itemFilterClause}
            GROUP BY ${groupByPeriodExpr}g.[Game_Code], g.[Game_Name]
            HAVING CAST(SUM(p.[Item_Qunt] * p.[Item_Price] * (1.0 + ISNULL(p.[item_Sels_Tax_P], 0) / 100.0)) AS DECIMAL(18, 4)) <> 0
            ORDER BY ${orderByPeriodExpr}[Total] DESC
            OPTION (HASH JOIN);
        `;

    const startTime = Date.now();
    const itemsRes = await request.query(itemsQuery);
    const duration = Date.now() - startTime;

    const rawItemRecords = itemsRes.recordset || [];

    // Build precise daily payment aggregates from game items
    const dailyPayMap = new Map();
    let totalSales = 0;
    let totalCL = 0;
    let totalCover = 0;

    for (const item of rawItemRecords) {
      const periodKey = String(item.Period || "all");
      const itemTot = Number(item.Total) || 0;
      const itemCl = Number(item.CL) || 0;
      const itemCash = itemTot - itemCl;
      const itemCover = Number(item.Cover) || 0;

      totalSales += itemTot;
      totalCL += itemCl;
      totalCover += itemCover;

      const existing = dailyPayMap.get(periodKey) || {
        cash: 0,
        visa: 0,
        cl: 0,
        total: 0,
      };
      existing.cash += itemCash;
      existing.cl += itemCl;
      existing.total += itemTot;
      dailyPayMap.set(periodKey, existing);
    }

    totalSales = Math.round(totalSales * 100) / 100;
    const totalCash = Math.round((totalSales - totalCL) * 100) / 100;
    const totalVisa = 0;
    totalCL = Math.round(totalCL * 100) / 100;
    const totalNetRevenue = Math.round((totalSales / 1.14) * 100) / 100;
    const totalSalesTax =
      Math.round((totalSales - totalNetRevenue) * 100) / 100;

    const records = rawItemRecords.map((r) => {
      const itemTotal = Number(r.Total) || 0;
      const itemCover = Number(r.Cover) || 0;
      const itemNetRev = Math.round((itemTotal / 1.14) * 100) / 100;
      const itemTax = Math.round((itemTotal - itemNetRev) * 100) / 100;
      const itemCl = Number(r.CL) || 0;
      const itemCash = itemTotal - itemCl;

      const dPay = dailyPayMap.get(String(r.Period)) || {
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
        dailyVisa: 0,
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
        totalVoids: 0,
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
  }) {
    const secType = Number(sectorType) || 4;

    // قطاعات الألعاب (Type = 2) والفيديو جيم (Type = 3): تجميع على مستوى الأصناف/الألعاب
    if (secType === 2 || secType === 3) {
      return this.getItemLevelReportData({
        startDate,
        endDate,
        branches,
        granularity,
        sortBy,
        sectorType: secType,
      });
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
  }
}
