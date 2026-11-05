/**
 * @file services/caravanReportService.js
 * @description Analytical Service & Query Builder for Dream Park Caravan & Outlets (Type = 4).
 * Fully compatible with Microsoft SQL Server 2014 & dbDream_Park_Resturant schema.
 */

import { getPool, sql } from '../config/db.js';

// =========================================================================
// ⚠️ VOIDS VIEW PLACEHOLDER:
// Replace '[dbo].[VOIDS_VIEW]' with your exact view name (or set DB_VOIDS_VIEW in .env)
// Example confirmed view in Dream Park DB: [dbo].[Vw_POS_Post_Void]
// =========================================================================
const VOIDS_SOURCE = process.env.DB_VOIDS_VIEW || '[dbo].[VOIDS_VIEW]';

export class CaravanReportService {
    /**
     * استرجاع قائمة جميع منافذ وكرفانات دريم بارك النشطة (Type = 4)
     * @returns {Promise<Array<{Code: string, Name: string}>>}
     */
    static async getCaravanBranches() {
        const pool = await getPool();
        const query = `
            SELECT 
                [Code], 
                [Aname] AS [Name]
            FROM [dbo].[Branchs] WITH (NOLOCK)
            WHERE [Type] = 4
            ORDER BY [Aname] ASC;
        `;
        const result = await pool.request().query(query);
        return result.recordset || [];
    }

    /**
     * استعلام وتجميع بيانات إيرادات الكرفانات مع دعم التصفية الزمنية وتعدد المنافذ والتجميع الديناميكي
     * @param {Object} params
     * @param {string} params.startDate 'YYYY-MM-DD'
     * @param {string} params.endDate 'YYYY-MM-DD'
     * @param {string[]} [params.branches] قائمة أكواد الفروع
     * @param {('summary'|'month'|'day')} [params.granularity] مستوى التجميع
     * @param {string} [params.sortBy] طريقة الترتيب
     */
    static async getReportData({
        startDate = '2026-01-01',
        endDate = new Date().toISOString().split('T')[0],
        branches = [],
        granularity = 'summary',
        sortBy = 'total_desc'
    }) {
        const pool = await getPool();
        const request = pool.request();

        // 1. تثبيت بارامترات التواريخ الآمنة
        request.input('startDate', sql.VarChar, startDate);
        request.input('endDate', sql.VarChar, endDate);

        // 2. معالجة تصفية المنافذ المختارة
        let branchClause = '';
        if (Array.isArray(branches) && branches.length > 0) {
            const placeholders = branches.map((code, index) => {
                const paramName = `branch_${index}`;
                request.input(paramName, sql.VarChar, String(code).trim());
                return `@${paramName}`;
            });
            branchClause = ` AND b.[Code] IN (${placeholders.join(', ')})`;
        }

        // 3. تحديد ترتيب النتائج
        let orderClause = '[Total] DESC';
        if (sortBy === 'total_asc') orderClause = '[Total] ASC';
        else if (sortBy === 'cover_desc') orderClause = '[Cover] DESC, [Total] DESC';
        else if (sortBy === 'name_asc') orderClause = 'b.[Aname] ASC';

        // 4. بناء الحقول وفق مستوى التجميع (Granularity)
        let selectPeriod = '';
        let groupByPeriod = '';
        let orderByGranularity = '';
        let voidsPeriodMatch = '';

        if (granularity === 'month') {
            selectPeriod = `CONVERT(VARCHAR(7), p.[Doc_Date], 120) AS [Period],`;
            groupByPeriod = `, CONVERT(VARCHAR(7), p.[Doc_Date], 120)`;
            orderByGranularity = `p.[Period] ASC, `;
            voidsPeriodMatch = ` AND CONVERT(VARCHAR(7), v.[Doc_Date], 120) = p.[Period]`;
        } else if (granularity === 'day') {
            selectPeriod = `CONVERT(VARCHAR(10), p.[Doc_Date], 120) AS [Period],`;
            groupByPeriod = `, CONVERT(VARCHAR(10), p.[Doc_Date], 120)`;
            orderByGranularity = `p.[Period] ASC, `;
            voidsPeriodMatch = ` AND CONVERT(VARCHAR(10), v.[Doc_Date], 120) = p.[Period]`;
        }

        const query = `
            SELECT 
                b.[Code] AS [Branch_Code],
                b.[Aname] AS [Name],
                ${granularity !== 'summary' ? 'p.[Period],' : ''}
                p.[Cover],
                p.[Cash],
                p.[Visa],
                p.[CL] AS [C/L],
                p.[Total],
                p.[TotalInv],
                p.[ServiceCharge],
                p.[SalesTax],
                -- فارق التسوية المحسوب: (النقدية + الفيزا + الآجل) - صافي الإيراد الشامل (المطلوب تحصيله)
                ROUND((p.[Cash] + p.[Visa] + p.[CL]) - p.[Total], 2) AS [Variance],
                -- إجمالي المرتجعات / الإلغاءات المسترجعة عبر OUTER APPLY
                ISNULL(v.[TotalVoids], 0) AS [TotalVoids],
                ISNULL(v.[VoidCount], 0) AS [VoidCount],
                ROUND(SUM(p.[Total]) OVER (), 2) AS [GrandTotalNet],
                ROUND(SUM(p.[Cash]) OVER (), 2) AS [GrandTotalCash],
                ROUND(SUM(p.[CL]) OVER (), 2) AS [GrandTotalCL],
                SUM(p.[Cover]) OVER () AS [GrandTotalCover]
            FROM [dbo].[Branchs] b WITH (NOLOCK)
            INNER JOIN (
                SELECT 
                    p.[Branch_Code],
                    ${selectPeriod}
                    SUM(ISNULL(p.[cover], 0)) AS [Cover],
                    ROUND(SUM(ISNULL(p.[Cash], 0)), 2) AS [Cash],
                    ROUND(SUM(ISNULL(p.[Visa], 0) + ISNULL(p.[Visa2], 0) + ISNULL(p.[Visa3], 0)), 2) AS [Visa],
                    ROUND(SUM(ISNULL(p.[C/L], 0)), 2) AS [CL],
                    ROUND(SUM(ISNULL(p.[NetOfInv], 0)), 2) AS [Total],
                    ROUND(SUM(ISNULL(p.[TotalInv], 0)), 2) AS [TotalInv],
                    ROUND(SUM(ISNULL(p.[serves_tax], 0)), 2) AS [ServiceCharge],
                    ROUND(SUM(ISNULL(p.[Sels_Tax], 0)), 2) AS [SalesTax]
                FROM [dbo].[POS_Post] p WITH (NOLOCK)
                WHERE p.[Doc_Date] >= CAST(@startDate AS DATE)
                  AND p.[Doc_Date] < DATEADD(DAY, 1, CAST(@endDate AS DATE))
                  AND ISNULL(p.[Void], 0) <> 1
                GROUP BY p.[Branch_Code] ${groupByPeriod}
            ) p ON p.[Branch_Code] = b.[Code]
            /* ========================================================================= */
            /* ⚠️ VOIDS DATA SOURCE: Placeholder / Confirmed View: [dbo].[Vw_POS_Post_Void] */
            /* ========================================================================= */
            OUTER APPLY (
                SELECT 
                    ROUND(SUM(ISNULL(v.[total_Void], 0)), 2) AS [TotalVoids],
                    SUM(ISNULL(v.[count_void], 0)) AS [VoidCount]
                FROM ${VOIDS_SOURCE} v WITH (NOLOCK)
                WHERE v.[Branch_Code] = b.[Code]
                  AND v.[Doc_Date] >= CAST(@startDate AS DATE)
                  AND v.[Doc_Date] < DATEADD(DAY, 1, CAST(@endDate AS DATE))
                  ${voidsPeriodMatch}
            ) v
            WHERE b.[Type] = 4
              ${branchClause}
            ORDER BY ${orderByGranularity}${orderClause};
        `;

        let rawRecords = [];
        let duration = 0;
        try {
            const startTime = Date.now();
            const result = await request.query(query);
            duration = Date.now() - startTime;
            rawRecords = result.recordset || [];
        } catch (queryErr) {
            // معالجة مرنة للـ Placeholder في حال لم يتم استبداله بعد في قاعدة البيانات
            if (queryErr.message?.includes('Invalid object name') && query.includes(VOIDS_SOURCE)) {
                console.warn(`[CaravanReportService] Notice: Placeholder ${VOIDS_SOURCE} was not found. Falling back to active view [dbo].[Vw_POS_Post_Void].`);
                const fallbackQuery = query.replaceAll(VOIDS_SOURCE, '[dbo].[Vw_POS_Post_Void]');
                const startTime = Date.now();
                const result = await request.query(fallbackQuery);
                duration = Date.now() - startTime;
                rawRecords = result.recordset || [];
            } else {
                throw queryErr;
            }
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

        for (const row of rawRecords) {
            totalSales += Number(row.Total) || 0;
            totalCash += Number(row.Cash) || 0;
            totalVisa += Number(row.Visa) || 0;
            totalCL += Number(row['C/L'] ?? row.CL) || 0;
            totalCover += Number(row.Cover) || 0;
            totalNetRevenue += Number(row.TotalInv) || 0;
            totalServiceCharge += Number(row.ServiceCharge) || 0;
            totalSalesTax += Number(row.SalesTax) || 0;
            totalVoids += Number(row.TotalVoids) || 0;
            totalVariance += Number(row.Variance) || 0;
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

        // مواءمة الفوارق العشرية الناتجة عن تجميع الكسور المقربة (0.01 EGP) مع الإجمالي المحاسبي الموحد
        if (rawRecords.length > 0 && Number.isFinite(sqlGrandTotal) && sqlGrandTotal > 0) {
            const salesDiff = Math.round((sqlGrandTotal - totalSales) * 100) / 100;
            if (Math.abs(salesDiff) <= 0.05 && Math.abs(salesDiff) > 0) {
                rawRecords[0].Total = Math.round((Number(rawRecords[0].Total) + salesDiff) * 100) / 100;
                totalSales = sqlGrandTotal;
            }
            if (Number.isFinite(sqlGrandCash)) totalCash = sqlGrandCash;
            if (Number.isFinite(sqlGrandCL)) totalCL = sqlGrandCL;
            if (Number.isFinite(sqlGrandCover)) totalCover = sqlGrandCover;
        }

        const records = rawRecords.map(r => {
            const itemTotal = Number(r.Total) || 0;
            const itemCover = Number(r.Cover) || 0;
            const itemCash = Number(r.Cash) || 0;
            const itemVisa = Number(r.Visa) || 0;
            const itemCL = Number(r['C/L'] ?? r.CL) || 0;
            const itemNetRev = Number(r.TotalInv) || (itemTotal - (Number(r.SalesTax) || 0) - (Number(r.ServiceCharge) || 0)) || itemCash;
            const itemServ = Number(r.ServiceCharge) || 0;
            const itemTax = Number(r.SalesTax) || 0;
            const itemVoids = Number(r.TotalVoids) || 0;
            const itemVoidCount = Number(r.VoidCount) || 0;

            const totalCollected = Math.round((itemCash + itemVisa + itemCL) * 100) / 100;
            let variance = Math.round((totalCollected - itemTotal) * 100) / 100;
            if (Math.abs(variance) < 0.005) {
                variance = 0;
            }

            return {
                branchCode: String(r.Branch_Code),
                name: r.Name,
                period: r.Period || null,
                cover: itemCover,
                cash: itemCash,
                visa: itemVisa,
                creditLine: itemCL,
                total: itemTotal,
                netRevenue: Math.round(itemNetRev * 100) / 100,
                serviceCharge: Math.round(itemServ * 100) / 100,
                salesTax: Math.round(itemTax * 100) / 100,
                grandTotal: itemTotal,
                totalCollected,
                totalVoids: Math.round(itemVoids * 100) / 100,
                voidCount: itemVoidCount,
                variance,
                marketShare: totalSales > 0 ? Math.round((itemTotal / totalSales) * 1000) / 10 : 0,
                avgTicket: itemCover > 0 ? Math.round((itemTotal / itemCover) * 100) / 100 : 0
            };
        });

        return {
            executionTimeMs: duration,
            filters: { startDate, endDate, granularity, branches },
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
                cashPct: totalSales > 0 ? Math.round((totalCash / totalSales) * 1000) / 10 : 0,
                visaPct: totalSales > 0 ? Math.round((totalVisa / totalSales) * 1000) / 10 : 0,
                clPct: totalSales > 0 ? Math.round((totalCL / totalSales) * 1000) / 10 : 0,
                avgTicket: totalCover > 0 ? Math.round((totalSales / totalCover) * 100) / 100 : 0,
                rowCount: records.length,
                topCaravan: records.length > 0 ? {
                    name: records[0].name,
                    total: records[0].total,
                    cover: records[0].cover
                } : null
            },
            records
        };
    }
}

