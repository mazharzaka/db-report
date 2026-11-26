/**
 * دور الملف: خدمة تجميع وتنسيق تقارير القطاعات القائمة على الأصناف (Type 2 الألعاب، Type 3 الفيديو جيم، Type 6 الانتظار والأمانات).
 * المدخلات: معاملات الفترة والقطاع والفروع ومستوى التجميع (startDate, endDate, branches, granularity, sectorType).
 * المخرجات: كائن التقرير المعتمد بنفس شكل الاستجابة (summary, records, filters, executionTimeMs).
 */

import { getPool } from "../db/sqlPool.js";
import { normalizeDateRange } from "../utils/dateUtils.js";
import {
  getBranchTypeMap,
  resolveItemLevelBranchCodes,
  routeItemToSectorAndGame,
} from "./sectorRouting.js";
import { executeItemLevelQueries } from "./reportQueryBuilder.js";

export async function fetchItemLevelReportData({
  startDate = "2026-01-01",
  endDate = new Date().toISOString().split("T")[0],
  branches = [],
  granularity = "summary",
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

    const branchTypeMap = await getBranchTypeMap(pool);
    const targetBranchCodes = resolveItemLevelBranchCodes(branchTypeMap, secType);

    const startTime = Date.now();
    const settled = await executeItemLevelQueries(pool, {
      secType,
      sDate,
      endDateNextDay,
      normGranularity,
      isSummaryGran,
      targetBranchCodes,
    });
    const duration = Date.now() - startTime;

    const allRawRows = [
      ...(settled[0]?.recordset || []),
      ...(settled[1]?.recordset || []),
      ...(secType === 2 ? settled[2]?.recordset || [] : []),
    ];

    const groupedMap = new Map();
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
      let sumCash = 0, sumVisa = 0, sumCL = 0, sumNet = 0, sumTax = 0;
      for (const pr of pRes?.recordset || []) {
        const key = String(pr.Period || "all");
        const pCash = Math.round((Number(pr.Cash) || 0) * 100) / 100;
        const pVisa = Math.round((Number(pr.Visa) || 0) * 100) / 100;
        const pCl = Math.round((Number(pr.CL) || 0) * 100) / 100;
        const pTot = Math.round((pCash + pVisa + pCl) * 100) / 100;
        type6PostMap.set(key, { cash: pCash, visa: pVisa, cl: pCl, total: pTot });
        sumCash += pCash; sumVisa += pVisa; sumCL += pCl;
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

    const dailyPayMap = new Map();
    let totalSales = 0, totalCL = 0, totalCover = 0;

    for (const item of rawItemRecords) {
      const periodKey = String(item.Period || "all");
      const itemTot = secType === 6 ? Math.round((Number(item.Total) || 0) * 100) / 100 : Number(item.Total) || 0;
      const itemCl = secType === 6 ? Math.round((Number(item.CL) || 0) * 100) / 100 : Number(item.CL) || 0;
      const itemCash = secType === 6 ? Math.round((itemTot - itemCl) * 100) / 100 : itemTot - itemCl;
      totalSales += itemTot;
      totalCL += itemCl;
      totalCover += Number(item.Cover) || 0;

      if (secType === 6 && type6PostMap && type6PostMap.has(periodKey)) {
        dailyPayMap.set(periodKey, type6PostMap.get(periodKey));
      } else {
        const existing = dailyPayMap.get(periodKey) || { cash: 0, visa: 0, cl: 0, total: 0 };
        existing.cash = secType === 6 ? Math.round((existing.cash + itemCash) * 100) / 100 : existing.cash + itemCash;
        existing.cl = secType === 6 ? Math.round((existing.cl + itemCl) * 100) / 100 : existing.cl + itemCl;
        existing.total = secType === 6 ? Math.round((existing.total + itemTot) * 100) / 100 : existing.total + itemTot;
        dailyPayMap.set(periodKey, existing);
      }
    }

    totalSales = Math.round(totalSales * 100) / 100;
    const totalCash = secType === 6 && type6PostSummary ? type6PostSummary.cash : Math.round((totalSales - totalCL) * 100) / 100;
    const totalVisa = secType === 6 && type6PostSummary ? type6PostSummary.visa : 0;
    totalCL = secType === 6 && type6PostSummary ? type6PostSummary.cl : Math.round(totalCL * 100) / 100;
    const totalNetRevenue = secType === 6 && type6PostSummary ? type6PostSummary.net : Math.round((totalSales / 1.14) * 100) / 100;
    const totalSalesTax = secType === 6 && type6PostSummary ? type6PostSummary.tax : Math.round((totalSales - totalNetRevenue) * 100) / 100;

    const records = rawItemRecords.map((r) => {
      const itemTotal = secType === 6 ? Math.round((Number(r.Total) || 0) * 100) / 100 : Number(r.Total) || 0;
      const itemCover = Number(r.Cover) || 0;
      const itemNetRev = secType === 6 && r.NetAmount !== undefined ? Math.round((Number(r.NetAmount) || 0) * 100) / 100 : Math.round((itemTotal / 1.14) * 100) / 100;
      const itemTax = secType === 6 && r.TaxAmount !== undefined ? Math.round((Number(r.TaxAmount) || 0) * 100) / 100 : Math.round((itemTotal - itemNetRev) * 100) / 100;
      const itemCl = secType === 6 ? Math.round((Number(r.CL) || 0) * 100) / 100 : Number(r.CL) || 0;
      const itemCash = secType === 6 ? Math.round((itemTotal - itemCl) * 100) / 100 : itemTotal - itemCl;
      const dPay = dailyPayMap.get(String(r.Period || "all")) || { cash: itemCash, visa: 0, cl: itemCl, total: itemTotal };

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
        marketShare: totalSales > 0 ? Math.round((itemTotal / totalSales) * 1000) / 10 : 0,
        avgTicket: itemCover > 0 ? Math.round((itemTotal / itemCover) * 100) / 100 : 0,
      };
    });

    const topItem = records.length > 0 ? { name: records[0].name, total: records[0].total, cover: records[0].cover } : null;

    return {
      executionTimeMs: duration,
      filters: { startDate: sDate, endDate: eDate, granularity, branches, sectorType: secType },
      summary: {
        totalSales, totalCash, totalVisa, totalCL, totalCover, totalNetRevenue,
        totalServiceCharge: 0, totalSalesTax,
        totalVoids: secType === 6 ? type6VoidsTotal : 0,
        totalVoidCount: secType === 6 ? type6VoidCount : 0,
        totalVariance: 0,
        cashPct: totalSales > 0 ? Math.round((totalCash / totalSales) * 1000) / 10 : 0,
        visaPct: totalSales > 0 ? Math.round((totalVisa / totalSales) * 1000) / 10 : 0,
        clPct: totalSales > 0 ? Math.round((totalCL / totalSales) * 1000) / 10 : 0,
        avgTicket: totalCover > 0 ? Math.round((totalSales / totalCover) * 100) / 100 : 0,
        rowCount: records.length,
        topOutlet: topItem,
        topCaravan: topItem,
      },
      records,
    };
  } catch (err) {
    console.error("[ItemLevelReportService] Error:", err.message);
    throw new Error(`فشل استعلام تقرير الأصناف للقطاع (${sectorType}): ${err.message}`);
  }
}
