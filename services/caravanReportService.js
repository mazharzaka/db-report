/**
 * دور الملف: منسّق خدمات تقارير القطاعات الستة؛ يربط الكاش بالاستعلامات المحسّنة ويوحّد شكل المخرجات للواجهة.
 * المدخلات: معاملات التقرير (startDate, endDate, sectorType, branches, granularity, sortBy, bypassCache).
 * المخرجات: كائن التقرير المالي الكامل (summary, records, filters, executionTimeMs) وقائمة فروع كل قطاع.
 */

import { getPool, sql, createRequest, bindIntList } from "../db/sqlPool.js";
import { getTodayDateString, normalizeDateRange } from "../utils/dateUtils.js";
import { buildReportCacheKey, getCachedReport, setCachedReport } from "../utils/cache.js";
import {
  EXCLUDED_NON_REVENUE_BRANCHES,
  EXCLUDED_BRANCHES_SET,
  GAME_SECTOR_OVERRIDES,
  getBranchTypeMap,
  resolveItemLevelBranchCodes,
  routeItemToSectorAndGame,
} from "./sectorRouting.js";
import {
  executeBranchListQueries,
  executeSectorSalesAndVoidsQueries,
} from "./reportQueryBuilder.js";
import { fetchItemLevelReportData } from "./itemLevelReportService.js";
import { fetchGatesReportData } from "./gatesReportService.js";

export { GAME_SECTOR_OVERRIDES };

export class CaravanReportService {
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
        const defaultStart = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];
        const { startDate: sDate, endDateNextDay } = normalizeDateRange(
          startDate || defaultStart,
          endDate || getTodayDateString()
        );
        const branchTypeMap = await getBranchTypeMap(pool);
        const targetBranchCodes = resolveItemLevelBranchCodes(branchTypeMap, secType);
        const settled = await executeBranchListQueries(pool, {
          secType, sDate, endDateNextDay, targetBranchCodes,
        });

        const uniqueMap = new Map();
        for (const row of settled.flatMap((r) => r?.recordset || [])) {
          const bCode = Number(row.Branch_Code);
          const bType = branchTypeMap.get(bCode) ?? secType;
          if (secType === 2 && bCode === 102) {
            const gCode = Number(row.Group_code);
            const gLow = String(row.Groupitem_name ?? "").toLowerCase();
            if (bType === 2 || bType === 3) continue;
            if (gCode !== 3 && !gLow.includes("gold")) continue;
          }
          const { targetSector, gameCode, gameName } = routeItemToSectorAndGame({
            branchCode: bCode, branchType: bType, groupCode: row.Group_code,
            itemCode: row.item_Code, groupName: row.Groupitem_name, itemName: row.item_name,
          });
          if (targetSector !== secType) continue;
          const key = `${gameCode}\u0000${gameName}`;
          if (!uniqueMap.has(key)) uniqueMap.set(key, { Code: gameCode, Name: gameName });
        }

        return Array.from(uniqueMap.values()).sort((a, b) =>
          String(a.Name || "").localeCompare(String(b.Name || ""))
        );
      }

      const req = createRequest(pool);
      req.input("sectorType", sql.Int, secType);
      const exclPh = bindIntList(req, "ex", EXCLUDED_NON_REVENUE_BRANCHES);
      const res = await req.query(`
        SELECT [Code], [Aname] AS [Name]
        FROM [dbo].[Branchs] WITH (NOLOCK)
        WHERE [Type] = @sectorType AND [Code] NOT IN (${exclPh})
        ORDER BY [Aname] ASC;
      `);
      return res.recordset || [];
    } catch (err) {
      console.error("[CaravanReportService.getCaravanBranches] Error:", err.message);
      throw new Error(`فشل استرجاع قائمة منافذ القطاع (${sectorType}): ${err.message}`);
    }
  }

  static async getItemLevelReportData(params) {
    return fetchItemLevelReportData(params);
  }

  static async getGatesReportData(params) {
    return fetchGatesReportData(params);
  }

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
    const { startDate: sDate, endDate: eDate, endDateNextDay } = normalizeDateRange(startDate, endDate);
    const normGranularity = (granularity || "summary").toLowerCase();
    const isSummaryGran = normGranularity === "summary" || normGranularity === "total";

    const cacheKey = buildReportCacheKey({
      sectorType: secType, startDate: sDate, endDate: eDate,
      granularity: normGranularity, sortBy, branches, includeAdjustments,
    });

    if (!bypassCache) {
      const cached = getCachedReport(cacheKey);
      if (cached) return cached;
    }

    if (secType === 5) {
      const gatesResult = await fetchGatesReportData({
        startDate: sDate, endDate: eDate, branches, granularity: normGranularity,
        sortBy, includeAdjustments,
      });
      setCachedReport(cacheKey, eDate, gatesResult);
      return gatesResult;
    }

    if (secType === 2 || secType === 3 || secType === 6) {
      const itemResult = await fetchItemLevelReportData({
        startDate: sDate, endDate: eDate, branches, granularity: normGranularity,
        sortBy, sectorType: secType,
      });
      setCachedReport(cacheKey, eDate, itemResult);
      return itemResult;
    }

    try {
      const pool = await getPool();
      const validBranchCodes = Array.isArray(branches)
        ? branches.map((c) => Number(String(c).trim())).filter((n) => Number.isFinite(n))
        : [];
      const branchTypeMap = await getBranchTypeMap(pool);
      const sectorBranchCodes = [];
      for (const [code, t] of branchTypeMap.entries()) {
        if (t === secType && !EXCLUDED_BRANCHES_SET.has(code)) {
          if (validBranchCodes.length === 0 || validBranchCodes.includes(code)) {
            sectorBranchCodes.push(code);
          }
        }
      }

      const startTime = Date.now();
      const [result, voidsResult] = await executeSectorSalesAndVoidsQueries(pool, {
        secType, sDate, endDateNextDay, normGranularity, sortBy, validBranchCodes, sectorBranchCodes,
      });
      const duration = Date.now() - startTime;

      const voidsAggMap = new Map();
      const voidMap = new Map();
      for (const vd of voidsResult.recordset || []) {
        const key = !isSummaryGran ? `${vd.branchCode}-${vd.period}` : String(vd.branchCode);
        const curAgg = voidsAggMap.get(key) || { TotalVoids: 0, VoidCount: 0 };
        curAgg.TotalVoids += Number(vd.rawTotal) || 0;
        curAgg.VoidCount += 1;
        voidsAggMap.set(key, curAgg);

        if (!voidMap.has(key)) voidMap.set(key, []);
        voidMap.get(key).push({
          itemCode: String(vd.itemCode), itemName: String(vd.itemName || "صنف غير محدد"),
          docDate: String(vd.docDate), docTime: vd.docTime ? String(vd.docTime) : undefined,
          quantity: Number(vd.quantity) || 1, price: Number(vd.price) || 0, total: Number(vd.total) || 0,
        });
      }

      const rawRecords = (result.recordset || [])
        .filter((r) => Math.abs(Number(r.Total) || 0) > 0.0001)
        .map((r) => {
          const key = !isSummaryGran ? `${r.Branch_Code}-${r.Period}` : String(r.Branch_Code);
          const va = voidsAggMap.get(key);
          return { ...r, TotalVoids: va ? va.TotalVoids : 0, VoidCount: va ? va.VoidCount : 0 };
        });

      const sqlGrandTotal = Number(rawRecords[0]?.GrandTotalNet);
      const sqlGrandCash = Number(rawRecords[0]?.GrandTotalCash);
      const sqlGrandCL = Number(rawRecords[0]?.GrandTotalCL);
      const sqlGrandCover = Number(rawRecords[0]?.GrandTotalCover);

      let totalSales = 0, totalCash = 0, totalVisa = 0, totalCL = 0, totalCover = 0;
      let totalNetRevenue = 0, totalServiceCharge = 0, totalSalesTax = 0, totalVoids = 0, totalVariance = 0;
      let totalFood = 0, totalBeverage = 0, totalOther = 0, totalCost = 0;

      for (const row of rawRecords) {
        totalSales += Number(row.Total) || 0; totalCash += Number(row.Cash) || 0;
        totalVisa += Number(row.Visa) || 0; totalCL += Number(row["C/L"] ?? row.CL) || 0;
        totalCover += Number(row.Cover) || 0; totalNetRevenue += Number(row.TotalInv) || 0;
        totalServiceCharge += Number(row.ServiceCharge) || 0; totalSalesTax += Number(row.SalesTax) || 0;
        totalVoids += Number(row.TotalVoids) || 0; totalVariance += Number(row.Variance) || 0;
        if (secType === 1) {
          totalFood += Number(row.Food) || 0; totalBeverage += Number(row.Beverage) || 0;
          totalOther += Number(row.Other) || 0; totalCost += Number(row.Cost) || 0;
        }
      }

      totalSales = Number.isFinite(sqlGrandTotal) && sqlGrandTotal > 0 ? Math.round(sqlGrandTotal * 100) / 100 : Math.round(totalSales * 100) / 100;
      totalCash = Number.isFinite(sqlGrandCash) ? Math.round(sqlGrandCash * 100) / 100 : Math.round(totalCash * 100) / 100;
      totalVisa = Math.round(totalVisa * 100) / 100;
      totalCL = Number.isFinite(sqlGrandCL) ? Math.round(sqlGrandCL * 100) / 100 : Math.round(totalCL * 100) / 100;
      if (Number.isFinite(sqlGrandCover)) totalCover = sqlGrandCover;
      totalNetRevenue = Math.round(totalNetRevenue * 100) / 100;
      totalServiceCharge = Math.round(totalServiceCharge * 100) / 100;
      totalSalesTax = Math.round(totalSalesTax * 100) / 100;
      totalVoids = Math.round(totalVoids * 100) / 100;
      totalVariance = Math.abs(Math.round(totalVariance * 100) / 100) < 0.005 ? 0 : Math.round(totalVariance * 100) / 100;

      const records = rawRecords.map((r) => {
        const itemCash = Number(r.Cash) || 0, itemVisa = Number(r.Visa) || 0, itemCL = Number(r["C/L"] ?? r.CL) || 0;
        const itemTotal = Number(r.Total) || itemCash + itemVisa + itemCL;
        const itemCover = Number(r.Cover) || 0;
        const itemNetRev = Number(r.TotalInv) || itemTotal / 1.14;
        const totalCollected = itemCash + itemVisa + itemCL;
        const variance = Math.abs(totalCollected - itemTotal) < 0.005 ? 0 : totalCollected - itemTotal;
        const rowKey = !isSummaryGran ? `${r.Branch_Code}-${r.Period}` : String(r.Branch_Code);
        const rTot = Math.round(itemTotal * 100) / 100;

        return {
          branchCode: String(r.Branch_Code), name: r.Name, period: r.Period || null, cover: itemCover,
          cash: secType === 1 ? Math.round(itemCash * 100) / 100 : itemCash,
          visa: secType === 1 ? Math.round(itemVisa * 100) / 100 : itemVisa,
          creditLine: secType === 1 ? Math.round(itemCL * 100) / 100 : itemCL,
          total: secType === 1 ? rTot : itemTotal,
          netRevenue: Math.round(itemNetRev * 100) / 100,
          serviceCharge: Math.round((Number(r.ServiceCharge) || 0) * 100) / 100,
          salesTax: Math.round((Number(r.SalesTax) || 0) * 100) / 100,
          grandTotal: secType === 1 ? rTot : itemTotal,
          totalCollected, totalVoids: Math.round((Number(r.TotalVoids) || 0) * 100) / 100,
          voidCount: Number(r.VoidCount) || 0, voidDetails: voidMap.get(rowKey) || [], variance,
          marketShare: totalSales > 0 ? Math.round((itemTotal / totalSales) * 1000) / 10 : 0,
          avgTicket: itemCover > 0 ? Math.round((itemTotal / itemCover) * 100) / 100 : 0,
          ...(secType === 1 ? (() => {
            const rFood = Math.round((Number(r.Food) || 0) * 100) / 100;
            const rBev = Math.round((Number(r.Beverage) || 0) * 100) / 100;
            return { food: rFood, beverage: rBev, other: Math.round((rTot - rFood - rBev) * 100) / 100, cost: Math.round((Number(r.Cost) || 0) * 100) / 100 };
          })() : {}),
        };
      });

      const topRow = records.length > 0 ? { name: records[0].name, total: records[0].total, cover: records[0].cover } : null;
      const finalReport = {
        executionTimeMs: duration,
        filters: { startDate: sDate, endDate: eDate, granularity, branches, sectorType: secType },
        summary: {
          totalSales, totalCash, totalVisa, totalCL, totalCover, totalNetRevenue,
          totalServiceCharge, totalSalesTax, totalVoids, totalVariance,
          ...(secType === 1 ? {
            totalFood: Math.round(totalFood * 100) / 100, totalBeverage: Math.round(totalBeverage * 100) / 100,
            totalOther: Math.round(totalOther * 100) / 100, totalCost: Math.round(totalCost * 100) / 100,
            foodPct: totalSales > 0 ? Math.round((totalFood / totalSales) * 1000) / 10 : 0,
            beveragePct: totalSales > 0 ? Math.round((totalBeverage / totalSales) * 1000) / 10 : 0,
            otherPct: totalSales > 0 ? Math.round((totalOther / totalSales) * 1000) / 10 : 0,
          } : {}),
          cashPct: totalSales > 0 ? Math.round((totalCash / totalSales) * 1000) / 10 : 0,
          visaPct: totalSales > 0 ? Math.round((totalVisa / totalSales) * 1000) / 10 : 0,
          clPct: totalSales > 0 ? Math.round((totalCL / totalSales) * 1000) / 10 : 0,
          avgTicket: totalCover > 0 ? Math.round((totalSales / totalCover) * 100) / 100 : 0,
          rowCount: records.length, topOutlet: topRow, topCaravan: topRow,
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
