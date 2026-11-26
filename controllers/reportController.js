/**
 * دور الملف: طبقة التحكم (Controllers) لاستقبال طلبات التقارير والتحقق من المدخلات واستدعاء الخدمات وقياس زمن التنفيذ.
 * المدخلات: كائنات طلب واستجابة Express (req, res, next) شاملة الفلاتر والتواريخ وخيار (refresh=true).
 * المخرجات: استجابات JSON مطابقة تماماً للشكل المعتمد للواجهة الأمامية أو تمرير الأخطاء للمعالج المركزي.
 */

import { getPool } from "../db/sqlPool.js";
import { getTodayDateString, getYesterdayDateString } from "../utils/dateUtils.js";
import { CaravanReportService } from "../services/caravanReportService.js";
import { CaravanItemService } from "../services/caravanItemService.js";
import { GateAdjustmentsService } from "../services/gateAdjustmentsService.js";

function parseBranchesList(raw) {
  if (!raw) return [];
  const arr = Array.isArray(raw)
    ? raw.flatMap((b) => String(b).split(","))
    : String(raw).split(",");
  return arr.map((b) => b.trim()).filter(Boolean);
}

export async function handleHealthCheck(_req, res) {
  try {
    const pool = await getPool();
    const testRes = await pool
      .request()
      .query("SELECT @@VERSION AS [version], GETDATE() AS [serverTime];");
    res.json({
      status: "ok",
      service: "Dream Park Caravan Revenues Reporting Service",
      serverTime: testRes.recordset[0]?.serverTime,
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(503).json({
      status: "error",
      service: "Dream Park Caravan Revenues Reporting Service",
      databaseConnected: false,
      error: err.message,
    });
  }
}

export async function handleSectorBranches(req, res, next) {
  try {
    const sectorType = Number(req.query.sectorType || req.query.type) || 4;
    const { startDate, endDate } = req.query;
    const branches = await CaravanReportService.getCaravanBranches(sectorType, startDate, endDate);
    res.json({
      status: "success",
      sectorType,
      count: branches.length,
      branches: branches.map((b) => ({ Code: b.Code, Name: b.Name })),
    });
  } catch (err) {
    next(err);
  }
}

export async function handleCaravanReport(req, res, next) {
  try {
    const t0 = Date.now();
    const queryParams = { ...req.query, ...req.body };
    const { startDate, endDate, granularity, sort, sectorType, type } = queryParams;
    const secType = Number(sectorType || type) || 4;
    const branches = parseBranchesList(queryParams.branches);

    const bypassCache =
      queryParams.refresh === "1" ||
      queryParams.refresh === "true" ||
      queryParams.refresh === true ||
      queryParams.bypassCache === "1" ||
      queryParams.bypassCache === "true" ||
      queryParams.bypassCache === true;

    const report = await CaravanReportService.getReportData({
      startDate: startDate ? String(startDate).trim() : getYesterdayDateString(),
      endDate: endDate ? String(endDate).trim() : getTodayDateString(),
      branches,
      granularity: (granularity || "summary").toLowerCase(),
      sortBy: (sort || "total_desc").toLowerCase(),
      sectorType: secType,
      bypassCache,
      includeAdjustments:
        queryParams.includeAdjustments !== "false" &&
        queryParams.includeAdjustments !== false,
    });

    const isFromCache = Boolean(report && report.fromCache);
    res.setHeader("X-Cache-Status", isFromCache ? "HIT" : "MISS");
    res.setHeader("X-Response-Time-Ms", String(Date.now() - t0));
    res.json({ status: "success", fromCache: isFromCache, ...report });
  } catch (err) {
    next(err);
  }
}

export function handleGetGateAdjustments(req, res, next) {
  try {
    const { startDate, endDate } = req.query;
    const data = GateAdjustmentsService.getAdjustments(startDate, endDate);
    res.json({ status: "success", data });
  } catch (err) {
    next(err);
  }
}

export function handleSaveGateAdjustments(req, res, next) {
  try {
    const { date, adjustments } = req.body;
    if (adjustments && typeof adjustments === "object" && !date) {
      for (const [d, val] of Object.entries(adjustments)) {
        GateAdjustmentsService.saveAdjustment(d, val);
      }
      return res.json({ status: "success", message: "Adjustments saved successfully" });
    }
    if (!date) {
      return res.status(400).json({ status: "error", message: "Date is required" });
    }
    GateAdjustmentsService.saveAdjustment(date, req.body);
    res.json({ status: "success", message: `Adjustment for ${date} saved successfully` });
  } catch (err) {
    next(err);
  }
}

export function handleDeleteGateAdjustments(req, res, next) {
  try {
    const { date } = req.params;
    GateAdjustmentsService.deleteAdjustment(date);
    res.json({ status: "success", message: `Adjustment for ${date} deleted successfully` });
  } catch (err) {
    next(err);
  }
}

export async function handleItemsSummary(req, res, next) {
  try {
    const { startDate, endDate, branchCode, metricType, mode } = req.query;
    const data = await CaravanItemService.getItemsSummary({
      startDate: startDate ? String(startDate).trim() : "",
      endDate: endDate ? String(endDate).trim() : "",
      branchCodes: parseBranchesList(branchCode),
      metricType: metricType ? String(metricType).toLowerCase() : "revenue",
      mode: mode ? String(mode).toLowerCase() : "best",
    });
    res.json({ status: "success", ...data });
  } catch (err) {
    next(err);
  }
}

export async function handleItemsPerformance(req, res, next) {
  try {
    const {
      startDate, endDate, prevStartDate, prevEndDate, branchCode, branches,
      search, page, limit, sortBy, sortOrder, abcCategory,
    } = req.query;

    const data = await CaravanItemService.getItemsPerformance({
      startDate: String(startDate || getYesterdayDateString()).trim(),
      endDate: String(endDate || getTodayDateString()).trim(),
      prevStartDate: prevStartDate ? String(prevStartDate).trim() : undefined,
      prevEndDate: prevEndDate ? String(prevEndDate).trim() : undefined,
      branchCodes: parseBranchesList(branchCode || branches),
      search: search ? String(search).trim() : "",
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 10,
      sortBy: sortBy ? String(sortBy).trim() : "revenue",
      sortOrder: sortOrder ? String(sortOrder).trim() : "desc",
      abcCategory: abcCategory ? String(abcCategory).trim() : undefined,
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function handleExecutiveKpis(req, res, next) {
  try {
    const { startDate, endDate, prevStartDate, prevEndDate, branchCode } = req.query;
    const data = await CaravanItemService.getExecutiveKpis({
      startDate: String(startDate || "").trim(),
      endDate: String(endDate || "").trim(),
      prevStartDate: prevStartDate ? String(prevStartDate).trim() : undefined,
      prevEndDate: prevEndDate ? String(prevEndDate).trim() : undefined,
      branchCodes: parseBranchesList(branchCode),
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function handlePeriodComparison(req, res, next) {
  try {
    const { periodAStart, periodAEnd, periodBStart, periodBEnd, branchCode } = req.query;
    const comparison = await CaravanItemService.getPeriodComparison({
      periodA: {
        startDate: String(periodAStart || "").trim(),
        endDate: String(periodAEnd || "").trim(),
      },
      periodB: {
        startDate: String(periodBStart || "").trim(),
        endDate: String(periodBEnd || "").trim(),
      },
      branchCodes: parseBranchesList(branchCode),
    });
    res.json({ status: "success", ...comparison });
  } catch (err) {
    next(err);
  }
}

export async function handleAuditBenchmark(_req, res, next) {
  try {
    const audit = await CaravanItemService.getGoldenBenchmarkAudit();
    res.json(audit);
  } catch (err) {
    next(err);
  }
}
