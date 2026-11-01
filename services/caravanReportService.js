/**
 * @file services/caravanReportService.js
 * @description Analytical Service & Query Builder for Dream Park Caravan & Outlets (Type = 4).
 * Fully compatible with Microsoft SQL Server 2014 & dbDream_Park_Resturant schema.
 */

import { getPool, sql } from '../config/db.js';

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

        if (granularity === 'month') {
            selectPeriod = `CONVERT(VARCHAR(7), p.[Doc_Date], 120) AS [Period],`;
            groupByPeriod = `, CONVERT(VARCHAR(7), p.[Doc_Date], 120)`;
            orderByGranularity = `[Period] ASC, `;
        } else if (granularity === 'day') {
            selectPeriod = `CONVERT(VARCHAR(10), p.[Doc_Date], 120) AS [Period],`;
            groupByPeriod = `, CONVERT(VARCHAR(10), p.[Doc_Date], 120)`;
            orderByGranularity = `[Period] ASC, `;
        }

        const query = `
            SELECT 
                b.[Code] AS [Branch_Code],
                b.[Aname] AS [Name],
                ${selectPeriod}
                SUM(ISNULL(p.[cover], 0)) AS [Cover],
                ROUND(SUM(ISNULL(p.[Cash], 0)), 2) AS [Cash],
                ROUND(SUM(ISNULL(p.[Visa], 0) + ISNULL(p.[Visa2], 0) + ISNULL(p.[Visa3], 0)), 2) AS [Visa],
                ROUND(SUM(ISNULL(p.[C/L], 0)), 2) AS [C/L],
                ROUND(SUM(ISNULL(p.[NetOfInv], 0)), 2) AS [Total],
                ROUND(SUM(ISNULL(p.[TotalInv], 0)), 2) AS [TotalInv],
                ROUND(SUM(ISNULL(p.[serves_tax], 0)), 2) AS [ServiceCharge],
                ROUND(SUM(ISNULL(p.[Sels_Tax], 0)), 2) AS [SalesTax],
                ROUND(SUM(SUM(ISNULL(p.[NetOfInv], 0))) OVER (), 2) AS [GrandTotalNet],
                ROUND(SUM(SUM(ISNULL(p.[Cash], 0))) OVER (), 2) AS [GrandTotalCash],
                ROUND(SUM(SUM(ISNULL(p.[C/L], 0))) OVER (), 2) AS [GrandTotalCL],
                SUM(SUM(ISNULL(p.[cover], 0))) OVER () AS [GrandTotalCover]
            FROM [dbo].[Branchs] b WITH (NOLOCK)
            INNER JOIN [dbo].[POS_Post] p WITH (NOLOCK) 
                ON p.[Branch_Code] = b.[Code]
            WHERE b.[Type] = 4
              ${branchClause}
              AND p.[Doc_Date] >= CAST(@startDate AS DATE)
              AND p.[Doc_Date] < DATEADD(DAY, 1, CAST(@endDate AS DATE))
              AND ISNULL(p.[Void], 0) <> 1
            GROUP BY b.[Code], b.[Aname] ${groupByPeriod}
            ORDER BY ${orderByGranularity}${orderClause};
        `;

        const startTime = Date.now();
        const result = await request.query(query);
        const duration = Date.now() - startTime;
        const rawRecords = result.recordset || [];

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

        for (const row of rawRecords) {
            totalSales += Number(row.Total) || 0;
            totalCash += Number(row.Cash) || 0;
            totalVisa += Number(row.Visa) || 0;
            totalCL += Number(row['C/L']) || 0;
            totalCover += Number(row.Cover) || 0;
            totalNetRevenue += Number(row.TotalInv) || 0;
            totalServiceCharge += Number(row.ServiceCharge) || 0;
            totalSalesTax += Number(row.SalesTax) || 0;
        }

        totalSales = Math.round(totalSales * 100) / 100;
        totalCash = Math.round(totalCash * 100) / 100;
        totalVisa = Math.round(totalVisa * 100) / 100;
        totalCL = Math.round(totalCL * 100) / 100;
        totalNetRevenue = Math.round(totalNetRevenue * 100) / 100;
        totalServiceCharge = Math.round(totalServiceCharge * 100) / 100;
        totalSalesTax = Math.round(totalSalesTax * 100) / 100;

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
            const itemNetRev = Number(r.TotalInv) || (itemTotal - (Number(r.SalesTax) || 0) - (Number(r.ServiceCharge) || 0)) || Number(r.Cash) || 0;
            const itemServ = Number(r.ServiceCharge) || 0;
            const itemTax = Number(r.SalesTax) || 0;
            return {
                branchCode: r.Branch_Code,
                name: r.Name,
                period: r.Period || null,
                cover: itemCover,
                cash: Number(r.Cash) || 0,
                visa: Number(r.Visa) || 0,
                creditLine: Number(r['C/L']) || 0,
                total: itemTotal,
                netRevenue: Math.round(itemNetRev * 100) / 100,
                serviceCharge: Math.round(itemServ * 100) / 100,
                salesTax: Math.round(itemTax * 100) / 100,
                grandTotal: itemTotal,
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

