/**
 * دور الملف: خدمة تجميع وتنسيق تقارير قطاع البوابات والتذاكر (Type 5) مع التسويات الخارجية والضرائب المعيارية.
 * المدخلات: نطاق التواريخ، فروع البوابات، مستوى التجميع، الترتيب، وخيار دمج التسويات (includeAdjustments).
 * المخرجات: كائن تقرير البوابات المعتمد بنفس شكل الاستجابة (summary, columns, branches, records, filters).
 */

import { getPool } from "../db/sqlPool.js";
import { normalizeDateRange, toYmd } from "../utils/dateUtils.js";
import { GateAdjustmentsService } from "./gateAdjustmentsService.js";
import { executeGatesQueries } from "./reportQueryBuilder.js";

const GATE_COLUMNS = [
  { branchCode: "silver", name: "Silver", group: "silver", unitPrice: 300 },
  { branchCode: "golden", name: "Golden", group: "golden", unitPrice: 270 },
  { branchCode: "silver_combo", name: "Silver Combo", group: "silver_combo", unitPrice: 290 },
  { branchCode: "diamond", name: "Diamond", group: "diamond", unitPrice: 0 },
  { branchCode: "vip", name: "VIP", group: "vip", unitPrice: 0 },
  { branchCode: "family", name: "Family", group: "family", unitPrice: 275 },
  { branchCode: "family_plus", name: "Family Plus", group: "family_plus", unitPrice: 0 },
  { branchCode: "family_plus_partner", name: "Family Plus Partner", group: "family_plus_partner", unitPrice: 0 },
  { branchCode: "sm", name: "S&M", group: "sm", unitPrice: 215 },
  { branchCode: "promotion", name: "Promotion", group: "promotion", unitPrice: 0 },
  { branchCode: "bg", name: "B.G", group: "bg", unitPrice: 0 },
  { branchCode: "venders", name: "Venders", group: "venders", unitPrice: 0 },
];

export async function fetchGatesReportData({
  startDate = "2026-01-01",
  endDate = new Date().toISOString().split("T")[0],
  branches = [],
  granularity = "day",
  sortBy = "date_asc",
  includeAdjustments = true,
}) {
  try {
    const startTime = Date.now();
    const pool = await getPool();
    const { startDate: sDate, endDate: eDate, endDateNextDay } = normalizeDateRange(startDate, endDate);

    const validBranches = Array.isArray(branches)
      ? branches.map((b) => Number(String(b).trim())).filter((n) => [101, 102, 103, 104].includes(n))
      : [];
    const gateBranchCodes = validBranches.length > 0 ? validBranches : [101, 102, 103, 104];

    const [itemRes, posRes] = await executeGatesQueries(pool, { sDate, endDateNextDay, gateBranchCodes });
    const adjustmentsMap = GateAdjustmentsService.getAdjustments(sDate, eDate);

    const normGranularity = (granularity || "day").toLowerCase();
    const periodMap = new Map();

    const getPeriodKey = (d) => {
      const ymd = toYmd(d);
      if (normGranularity === "month") return ymd.slice(0, 7);
      if (normGranularity === "summary" || normGranularity === "total") return "SUMMARY";
      return ymd;
    };

    const getPeriodRecord = (key, dateStr) => {
      if (!periodMap.has(key)) {
        const ymd = toYmd(dateStr);
        const rowDate =
          normGranularity === "summary" || normGranularity === "total"
            ? `${sDate} إلى ${eDate}`
            : normGranularity === "month"
              ? ymd.slice(0, 7)
              : ymd;

        periodMap.set(key, {
          period: key, date: rowDate,
          silverRev: 0, silverSold: 0, goldenRev: 0, goldenSold: 0, excludedGoldenBooklet: 0,
          silverComboRev: 0, silverComboSold: 0, diamondRev: 0, diamondSold: 0,
          vipRev: 0, vipSold: 0, familyRev: 0, familySold: 0,
          familyPlusRev: 0, familyPlusSold: 0, familyPlusPartnerRev: 0, familyPlusPartnerSold: 0,
          smRev: 0, smSold: 0, smFree: 0, smRawPosRev: 0, smRawPosSold: 0,
          promoRev: 0, promoSold: 0, promoRawPosRev: 0, promoCommissionDeduction: 0, promoOrphanQty: 0,
          bgRev: 0, bgSold: 0, bgVouchersCount: 0, vendersRev: 0, vendersSold: 0,
          unmappedRev: 0, unmappedSold: 0, totalTicketRev: 0, totalTicketSold: 0, totalFree: 0, grr: 0,
          cash: 0, visa: 0, cl: 0,
          entranceGross: 0, entranceVat: 0, entranceNet: 0,
          theaterGross: 0, theaterVat: 0, theaterNet: 0,
          taftafGross: 0, totalVat: 0, netRevenue: 0,
          stdEntranceGross: 0, stdTheaterGross: 0, stdTaftafGross: 0,
          stdEntranceVat: 0, stdTheaterVat: 0, stdTotalVat: 0, stdNetRevenue: 0,
          hasAdjustment: false, adjustmentNotes: "", adjustmentsApplied: [],
        });
      }
      return periodMap.get(key);
    };

    for (const r of itemRes.recordset || []) {
      const rec = getPeriodRecord(getPeriodKey(r.Doc_Date), r.Doc_Date);
      const name = String(r.item_name || "").toLowerCase();
      const code = Number(r.Branch_Code);
      const gross = Number(r.GrossAmount) || 0;
      const qty = Number(r.Item_Qunt) || 0;
      const taxP = Number(r.item_Sels_Tax_P) || 0;
      const isEntrance = name.includes("entrance") || (!name.includes("theater") && !name.includes("taftaf"));

      if (code === 102 && (name.includes("دفتر") || name.includes("booklet"))) {
        rec.excludedGoldenBooklet += gross;
        continue;
      }

      if (taxP === 14) {
        const net = gross / 1.14;
        rec.entranceGross += gross; rec.entranceNet += net; rec.entranceVat += gross - net;
      } else if (taxP === 5) {
        const net = gross / 1.05;
        rec.theaterGross += gross; rec.theaterNet += net; rec.theaterVat += gross - net;
      } else {
        rec.taftafGross += gross;
      }

      if (code === 101 || name.includes("family")) {
        if (name.includes("partner") || name.includes("بارتنر")) {
          rec.familyPlusPartnerRev += gross; if (isEntrance) rec.familyPlusPartnerSold += qty;
        } else if (name.includes("plus") || name.includes("بلس")) {
          rec.familyPlusRev += gross; if (isEntrance) rec.familyPlusSold += qty;
        } else {
          rec.familyRev += gross; if (isEntrance) rec.familySold += qty;
        }
      } else if (code === 102 && name.includes("silver") && !name.includes("compo") && !name.includes("combo")) {
        rec.silverRev += gross; if (isEntrance) rec.silverSold += qty;
      } else if (code === 102 && (name.includes("golden") || name.includes("gold"))) {
        rec.goldenRev += gross; if (isEntrance) rec.goldenSold += qty;
      } else if (code === 102 && (name.includes("compo") || name.includes("combo"))) {
        rec.silverComboRev += gross; if (isEntrance) rec.silverComboSold += qty;
      } else if (name.includes("diamond") || name.includes("دايموند")) {
        rec.diamondRev += gross; if (isEntrance) rec.diamondSold += qty;
      } else if (name.includes("vip")) {
        rec.vipRev += gross; if (isEntrance) rec.vipSold += qty;
      } else if (code === 104 && (name.includes("sttaf") || name.includes("staff") || name.includes("عامل"))) {
        rec.bgRev += gross; if (isEntrance) rec.bgSold += qty;
        rec.bgVouchersCount += Number(r.DocCount) || 0;
      } else if (code === 104 && (name.includes("215") || name.includes("220") || name.includes("210") || name.includes("grop") || name.includes("group"))) {
        rec.smRev += gross; rec.smRawPosRev += gross;
        if (isEntrance) { rec.smSold += qty; rec.smRawPosSold += qty; }
      } else if (code === 104) {
        rec.promoRawPosRev += gross;
        if (name.includes("w 230") && isEntrance) rec.promoCommissionDeduction += qty * 10;
        if (name.includes("ايتام")) { if (isEntrance) rec.promoOrphanQty += qty; }
        else if (isEntrance) { rec.promoSold += qty; }
        rec.promoRev += gross;
      } else if (name.includes("vender") || name.includes("فيندور")) {
        rec.vendersRev += gross; if (isEntrance) rec.vendersSold += qty;
      } else {
        rec.unmappedRev += gross; if (isEntrance) rec.unmappedSold += qty;
      }
    }

    for (const rec of periodMap.values()) rec.promoRev -= rec.promoCommissionDeduction;

    for (const p of posRes.recordset || []) {
      const rec = getPeriodRecord(getPeriodKey(p.Doc_Date), p.Doc_Date);
      const code = Number(p.Branch_Code);
      const cash = Number(p.Cash) || 0;
      const visa = (Number(p.Visa) || 0) + (Number(p.Visa2) || 0) + (Number(p.Visa3) || 0);
      let cl = Number(p["C/L"]) || 0;
      if (code === 104 && cl > 0 && rec.promoCommissionDeduction > 0) {
        cl = Math.max(0, cl - rec.promoCommissionDeduction);
      }
      rec.cash += cash; rec.visa += visa; rec.cl += cl;
    }

    for (const rec of periodMap.values()) {
      if (rec.excludedGoldenBooklet > 0) {
        if (rec.cash >= rec.excludedGoldenBooklet) {
          rec.cash -= rec.excludedGoldenBooklet;
        } else {
          const rem = rec.excludedGoldenBooklet - rec.cash;
          rec.cash = 0;
          rec.visa = Math.max(0, rec.visa - rem);
        }
      }
    }

    if (includeAdjustments) {
      for (const [adjDate, adj] of Object.entries(adjustmentsMap)) {
        const pKey = getPeriodKey(adjDate);
        if (periodMap.has(pKey)) {
          const rec = periodMap.get(pKey);
          const smExtRev = Number(adj.smExternalRevenue) || 0;
          const promoAdjRev = Number(adj.promoAdjustmentRev) || 0;
          const bgAdjRev = Number(adj.bgAdjustmentRev) || 0;
          rec.smRev += smExtRev; rec.smSold += Number(adj.smExternalSold) || 0; rec.smFree += Number(adj.smFree) || 0;
          rec.promoRev += promoAdjRev; rec.promoSold += Number(adj.promoAdjustmentSold) || 0;
          rec.bgRev += bgAdjRev; rec.cl += smExtRev + promoAdjRev + bgAdjRev;
          rec.hasAdjustment = true;
          rec.adjustmentNotes = [rec.adjustmentNotes, adj.notes].filter(Boolean).join(" | ");
          rec.adjustmentsApplied.push(adj);
        }
      }
    }

    const records = [];
    for (const rec of periodMap.values()) {
      rec.bgVouchers = rec.bgVouchersCount || (rec.bgRev > 0 ? 1 : 0);
      delete rec.bgVouchersCount;
      rec.totalTicketRev = rec.silverRev + rec.goldenRev + rec.silverComboRev + rec.diamondRev + rec.vipRev +
        rec.familyRev + rec.familyPlusRev + rec.familyPlusPartnerRev + rec.smRev + rec.promoRev + rec.bgRev + rec.vendersRev + rec.unmappedRev;
      rec.totalFree = rec.smFree;
      rec.totalTicketSold = rec.silverSold + rec.goldenSold + rec.silverComboSold + rec.diamondSold + rec.vipSold +
        rec.familySold + rec.familyPlusSold + rec.familyPlusPartnerSold + rec.smSold + rec.promoSold + rec.totalFree;
      rec.grr = rec.totalTicketRev - rec.bgRev;
      rec.totalVat = rec.entranceVat + rec.theaterVat;
      rec.netRevenue = rec.totalTicketRev - rec.totalVat;
      rec.stdEntranceGross = rec.totalTicketRev * 0.5333;
      rec.stdTheaterGross = rec.totalTicketRev * 0.2667;
      rec.stdTaftafGross = rec.totalTicketRev * 0.2;
      rec.stdEntranceVat = rec.stdEntranceGross - rec.stdEntranceGross / 1.14;
      rec.stdTheaterVat = rec.stdTheaterGross - rec.stdTheaterGross / 1.05;
      rec.stdTotalVat = rec.stdEntranceVat + rec.stdTheaterVat;
      rec.stdNetRevenue = rec.totalTicketRev - rec.stdTotalVat;
      rec.total = rec.totalTicketRev; rec.totalSales = rec.totalTicketRev; rec.cover = rec.totalTicketSold;
      rec.creditLine = rec.cl; rec.salesTax = rec.totalVat; rec.serviceCharge = 0;
      rec.totalVoids = 0; rec.voidCount = 0; rec.variance = 0; rec.marketShare = 100;
      rec.avgTicket = rec.totalTicketSold > 0 ? Math.round((rec.totalTicketRev / rec.totalTicketSold) * 100) / 100 : 0;
      rec.name = `بوابات ${rec.period || rec.date}`;
      rec.branchCode = "gates";
      for (const [k, v] of Object.entries(rec)) {
        if (typeof v === "number") rec[k] = Math.round(v * 100) / 100;
      }
      records.push(rec);
    }

    records.sort((a, b) => (sortBy === "date_desc" ? b.period.localeCompare(a.period) : a.period.localeCompare(b.period)));

    const summary = records.reduce(
      (acc, r) => {
        acc.totalSales += r.totalTicketRev; acc.totalTicketRev += r.totalTicketRev;
        acc.totalTicketSold += r.totalTicketSold; acc.totalFree += r.totalFree; acc.grr += r.grr;
        acc.totalCash += r.cash; acc.totalVisa += r.visa; acc.totalCL += r.cl;
        acc.totalVat += r.totalVat; acc.netRevenue += r.netRevenue;
        acc.silverRev += r.silverRev; acc.silverSold += r.silverSold;
        acc.goldenRev += r.goldenRev; acc.goldenSold += r.goldenSold;
        acc.silverComboRev += r.silverComboRev; acc.silverComboSold += r.silverComboSold;
        acc.familyRev += r.familyRev; acc.familySold += r.familySold;
        acc.smRev += r.smRev; acc.smSold += r.smSold; acc.smFree += r.smFree;
        acc.promoRev += r.promoRev; acc.promoSold += r.promoSold;
        acc.bgRev += r.bgRev; acc.bgVouchers += r.bgVouchers;
        return acc;
      },
      {
        totalSales: 0, totalTicketRev: 0, totalTicketSold: 0, totalFree: 0, grr: 0,
        totalCash: 0, totalVisa: 0, totalCL: 0, totalVat: 0, netRevenue: 0,
        silverRev: 0, silverSold: 0, goldenRev: 0, goldenSold: 0, silverComboRev: 0, silverComboSold: 0,
        familyRev: 0, familySold: 0, smRev: 0, smSold: 0, smFree: 0,
        promoRev: 0, promoSold: 0, bgRev: 0, bgVouchers: 0, rowCount: records.length,
      }
    );

    summary.totalSales = summary.totalTicketRev;
    summary.totalOrders = summary.totalTicketSold;
    summary.totalCover = summary.totalTicketSold;
    summary.totalUnits = summary.totalTicketSold;
    summary.avgTicket = summary.totalTicketSold > 0 ? Math.round((summary.totalTicketRev / summary.totalTicketSold) * 100) / 100 : 0;
    summary.revenueGrowthPct = 0;
    summary.marketShare = 100;
    for (const [k, v] of Object.entries(summary)) {
      if (typeof v === "number") summary[k] = Math.round(v * 100) / 100;
    }

    return {
      executionTimeMs: Date.now() - startTime,
      sectorType: 5,
      sectorLabel: "البوابات والتذاكر",
      filters: { startDate: sDate, endDate: eDate, granularity, sectorType: 5, includeAdjustments },
      summary,
      columns: GATE_COLUMNS,
      branches: GATE_COLUMNS,
      records,
    };
  } catch (err) {
    console.error("[GatesReportService] Error:", err.message);
    throw new Error(`فشل استعلام تقرير البوابات والتذاكر (Type 5): ${err.message}`);
  }
}
