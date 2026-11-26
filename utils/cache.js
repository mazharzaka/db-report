/**
 * دور الملف: كاش في الذاكرة (In-Memory LRU + TTL Cache) لمدة 5 دقائق لتسريع استعلامات التقارير المتكررة.
 * المدخلات: مفتاح التقرير (القطاع، التواريخ، التجميع، الفروع، الفلاتر) ونتائج التقرير.
 * المخرجات: دوال بناء المفتاح والقراءة والتخزين والمسح مع دعم تجاوز الكاش عند (refresh=true).
 */

import { env } from "../config/env.js";
import { getTodayDateString } from "./dateUtils.js";

const REPORT_CACHE = new Map();

export function buildReportCacheKey({
  sectorType,
  startDate,
  endDate,
  granularity,
  sortBy,
  branches,
  includeAdjustments = true,
}) {
  const normBranches = Array.isArray(branches)
    ? branches.map((b) => String(b).trim()).filter(Boolean).sort()
    : [];
  return JSON.stringify([
    Number(sectorType) || 4,
    String(startDate || "").trim(),
    String(endDate || "").trim(),
    String(granularity || "summary").toLowerCase(),
    String(sortBy || "total_desc").toLowerCase(),
    normBranches,
    Boolean(includeAdjustments),
  ]);
}

export function getCachedReport(key) {
  const entry = REPORT_CACHE.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    REPORT_CACHE.delete(key);
    return null;
  }
  // تحديث ترتيب LRU
  REPORT_CACHE.delete(key);
  REPORT_CACHE.set(key, entry);
  return { ...entry.data, fromCache: true };
}

export function setCachedReport(key, endDate, data) {
  const ttlMs =
    String(endDate || "") < getTodayDateString() ? env.cacheTtlMs : env.liveCacheTtlMs;

  if (REPORT_CACHE.has(key)) {
    REPORT_CACHE.delete(key);
  } else if (REPORT_CACHE.size >= env.cacheMaxEntries) {
    const oldestKey = REPORT_CACHE.keys().next().value;
    if (oldestKey !== undefined) REPORT_CACHE.delete(oldestKey);
  }

  REPORT_CACHE.set(key, {
    data,
    expiresAt: Date.now() + ttlMs,
  });
}

export function clearReportCache() {
  REPORT_CACHE.clear();
}
