import { getPool } from './config/db.js';

async function diagnose() {
  const pool = await getPool();

  const gateSql = `
    SELECT 
      SUM(
        CASE 
          WHEN p.[item_name] LIKE '%family Entrance%' OR p.[items_name] LIKE '%family Entrance%' 
            THEN CAST(ISNULL(p.[Item_Qunt], 0) AS FLOAT) * 5
          WHEN p.[item_name] LIKE '%Entrance%' OR p.[items_name] LIKE '%Entrance%' 
            OR p.[item_name] LIKE N'%دخول%' OR p.[items_name] LIKE N'%دخول%'
            THEN CAST(ISNULL(p.[Item_Qunt], 0) AS FLOAT)
          ELSE 0 
        END
      ) AS [totalVisitors],
      SUM(
        CASE 
          WHEN p.[item_name] LIKE '%family Entrance%' OR p.[items_name] LIKE '%family Entrance%' 
            THEN CAST(ISNULL(p.[Item_Qunt], 0) AS FLOAT) * 4
          WHEN p.[item_name] LIKE '%Entrance%' OR p.[items_name] LIKE '%Entrance%' 
            OR p.[item_name] LIKE N'%دخول%' OR p.[items_name] LIKE N'%دخول%'
            THEN CAST(ISNULL(p.[Item_Qunt], 0) AS FLOAT)
          ELSE 0 
        END
      ) AS [totalVisitorsIfFamilyIs4],
      SUM(
        CASE 
          WHEN p.[item_name] LIKE '%Entrance%' OR p.[items_name] LIKE '%Entrance%' 
            OR p.[item_name] LIKE N'%دخول%' OR p.[items_name] LIKE N'%دخول%'
            THEN CAST(ISNULL(p.[Item_Qunt], 0) AS FLOAT)
          ELSE 0 
        END
      ) AS [rawTicketCount],
      SUM(CAST(ISNULL(p.[Item_Qunt], 0) AS FLOAT)) AS [rawAllItemsInGates],
      ROUND(SUM(CAST(ISNULL(p.[Item_Qunt], 0) AS FLOAT)) / 3.0, 0) AS [currentOldLogic]
    FROM Pos_item_post p WITH (NOLOCK)
    WHERE p.[Branch_Code] IN ('101', '102', '103', '104')
      AND p.[Doc_Date] = '2026-10-30'
      AND (p.[Void_item] = 0 OR p.[Void_item] IS NULL);
  `;

  const res = await pool.request().query(gateSql);
  console.log('=== GATE SQL CALCULATION COMPARISON ON 2026-10-30 ===');
  console.table(res.recordset);

  process.exit(0);
}

diagnose().catch(err => {
  console.error(err);
  process.exit(1);
});
