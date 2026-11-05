"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Award,
  Banknote,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CreditCard,
  Minus,
  Search,
  X,
} from "lucide-react";
import type {
  PeriodComparisonResponse,
  PeriodItemPricing,
} from "@/types/reports";
import { fmtInt, fmtMoney } from "./charts";

interface PeriodComparisonDashboardProps {
  data: PeriodComparisonResponse | null;
  loading: boolean;
  scopeLabel: string;
}

export function PeriodComparisonDashboard({
  data,
  loading,
  scopeLabel,
}: PeriodComparisonDashboardProps) {
  if (loading && !data) {
    return (
      <div className="flex min-h-[420px] items-center justify-center rounded-3xl border border-slate-200 bg-white p-8 dark:border-white/5 dark:bg-[#18181b]">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-500 border-t-transparent dark:border-violet-300" />
          <p className="text-sm font-semibold text-slate-800 dark:text-zinc-200">
            جاري معالجة بيانات المقارنة المتقاطعة...
          </p>
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            تنفيذ الاستعلامات المتوازية عبر SQL Server 2014
          </p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 dark:border-white/5 dark:bg-[#18181b] dark:text-zinc-400">
        حدد الفترتين الزمنيتين لعرض المقارنة التحليلية
      </div>
    );
  }

  const { summary, topItemsShift, outletsComparison, filters } = data;
  const { periodA, periodB, growth } = summary;

  // Search and Pagination State for Period Items Comparison (Default 10 per page)
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset page when period filters change
  useEffect(() => {
    setPage(1);
  }, [
    filters.periodA.startDate,
    filters.periodA.endDate,
    filters.periodB.startDate,
    filters.periodB.endDate,
  ]);

  const filteredItems = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return topItemsShift;
    return topItemsShift.filter(
      (item) =>
        item.itemName.toLowerCase().includes(q) ||
        item.itemCode.toLowerCase().includes(q),
    );
  }, [topItemsShift, debouncedSearch]);

  const totalItems = filteredItems.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedItems = useMemo(() => {
    const from = (page - 1) * pageSize;
    return filteredItems.slice(from, from + pageSize);
  }, [filteredItems, page, pageSize]);

  const renderBadge = (growthPct: number | null) => {
    if (growthPct === null || growthPct === undefined) {
      return <span className="text-slate-400 dark:text-zinc-400">—</span>;
    }
    const isPositive = growthPct > 0;
    const isZero = growthPct === 0;

    if (isZero) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-zinc-400">
          <Minus className="h-3 w-3" />
          0.0%
        </span>
      );
    }

    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
          isPositive
            ? "bg-orange-50 text-orange-700 border border-orange-200 dark:bg-violet-500/20 dark:text-violet-300 dark:border-violet-500/30"
            : "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-rose-950/50 dark:text-rose-300"
        }`}
        dir="ltr"
      >
        {isPositive ? (
          <ArrowUpRight className="h-3.5 w-3.5" />
        ) : (
          <ArrowDownRight className="h-3.5 w-3.5" />
        )}
        {Math.abs(growthPct).toFixed(1)}%
      </span>
    );
  };

  const renderItemPricing = (p: PeriodItemPricing, label: string) => {
    if (!p || p.qty === 0) {
      return <span className="text-slate-400 dark:text-zinc-400">—</span>;
    }

    const unitPrice =
      p.unitPrice ??
      (p.qty > 0 ? Math.round((p.revenue / p.qty) * 100) / 100 : 0);

    return (
      <div className="space-y-1">
        {/* Actual Net Revenue in EGP */}
        <div
          className="font-extrabold text-sm text-slate-900 dark:text-slate-100 tabular-nums"
          dir="ltr"
        >
          {fmtMoney(p.revenue)}
        </div>

        {/* Total Quantity */}
        <div className="text-xs text-slate-600 dark:text-zinc-300 tabular-nums">
          الكمية المباعة:{" "}
          <strong className="text-slate-900 dark:text-white">
            {fmtInt(p.qty)}
          </strong>{" "}
          قطعة
        </div>

        {/* Unit Price Behavior: Stable Price or Price Tiers Breakdown */}
        <div
          className="text-[11px] text-slate-500 dark:text-zinc-400 tabular-nums"
          dir="ltr"
        >
          {p.hasPriceChange && p.priceTiers && p.priceTiers.length > 1 ? (
            <div className="flex flex-col gap-1 pt-0.5">
              <div className="flex flex-col gap-0.5">
                {p.priceTiers.map((tier, tIdx) => (
                  <div
                    key={tIdx}
                    className="inline-flex items-center gap-1 rounded border border-amber-500/25 bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-800 dark:text-amber-300 font-mono shadow-xs"
                    dir="ltr"
                  >
                    <span>{fmtInt(tier.quantity)} قطعة</span>
                    <span className="font-bold text-amber-600">×</span>
                    <span className="font-bold text-slate-900 dark:text-white">{fmtMoney(tier.price)}</span>
                    <span className="text-slate-500 dark:text-zinc-400 font-normal">({fmtMoney(tier.total)})</span>
                  </div>
                ))}
              </div>
              <div className="text-[11px] text-slate-700 dark:text-zinc-300">
                متوسط السعر:{" "}
                <strong className="text-amber-600 dark:text-amber-400">
                  {fmtMoney(p.weightedAvgPrice || unitPrice)}
                </strong>
              </div>
            </div>
          ) : (
            <div>
              سعر الوحدة:{" "}
              <strong className="text-slate-800 dark:text-zinc-200">
                {fmtMoney(unitPrice)}
              </strong>
              <span className="mr-1 text-[10px] text-slate-400 dark:text-zinc-400" dir="rtl">
                ({fmtInt(p.qty)} × {fmtMoney(unitPrice)})
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      className={`space-y-6 transition-opacity ${loading ? "opacity-60" : ""}`}
    >
      {/* ---------- Header Banner ---------- */}
      <div className="flex flex-col gap-2 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-[#18181b] sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-orange-600 dark:bg-white" />
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              نتائج المقارنة التحليلية بين الفترتين
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            النطاق التشغيلي:{" "}
            <span className="font-semibold text-slate-700 dark:text-zinc-200">
              {scopeLabel}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 rounded-xl border border-orange-200 bg-orange-50 px-3.5 py-1.5 font-medium text-orange-700 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-300 rounded-full">
            <Calendar className="h-3.5 w-3.5 text-orange-600 dark:text-violet-300" />
            <span>الفترة A:</span>
            <span className="tabular-nums font-mono" dir="ltr">
              {filters.periodA.startDate} → {filters.periodA.endDate}
            </span>
          </div>

          <span className="font-bold text-slate-400 dark:text-zinc-400">مقابل</span>

          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 font-semibold text-slate-700 dark:border-white/5 dark:bg-slate-800 dark:text-zinc-200">
            <Calendar className="h-3.5 w-3.5 text-slate-500" />
            <span>الفترة B:</span>
            <span className="tabular-nums font-mono" dir="ltr">
              {filters.periodB.startDate} → {filters.periodB.endDate}
            </span>
          </div>
        </div>
      </div>

      {/* ---------- Row 1: KPI Delta Cards ---------- */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Card 1: Revenue Comparison */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-[#18181b]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
              صافي الإيرادات
            </span>
            {renderBadge(growth.revenueGrowthPct)}
          </div>

          <div className="mt-3 flex items-baseline justify-between gap-2">
            <div>
              <p
                className="text-2xl font-black text-slate-900 dark:text-white"
                dir="ltr"
              >
                {fmtMoney(periodA.revenue)}
              </p>
              <p className="text-[11px] text-orange-600 dark:text-violet-300 font-semibold">
                الفترة الحالية (A)
              </p>
            </div>
            <div className="text-left">
              <p
                className="text-sm font-bold text-slate-500 dark:text-zinc-400 tabular-nums"
                dir="ltr"
              >
                {fmtMoney(periodB.revenue)}
              </p>
              <p className="text-[11px] text-slate-400 dark:text-zinc-400">الفترة السابقة (B)</p>
            </div>
          </div>

          <div className="mt-4 border-t border-slate-100 pt-3 text-xs tabular-nums text-slate-500 dark:border-white/5 dark:text-zinc-400">
            الفارق المالي:{" "}
            <span
              className="font-bold text-slate-800 dark:text-zinc-200"
              dir="ltr"
            >
              {fmtMoney(growth.revenueDelta)}
            </span>
          </div>
        </div>

        {/* Card 2: Orders Comparison */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-[#18181b]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
              عدد الشيكات والعمليات
            </span>
            {renderBadge(growth.ordersGrowthPct)}
          </div>

          <div className="mt-3 flex items-baseline justify-between gap-2">
            <div>
              <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                {fmtInt(periodA.orders)}
              </p>
              <p className="text-[11px] text-orange-600 dark:text-violet-300 font-semibold">
                شيك في (A)
              </p>
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-slate-500 dark:text-zinc-400 tabular-nums">
                {fmtInt(periodB.orders)}
              </p>
              <p className="text-[11px] text-slate-400 dark:text-zinc-400">شيك في (B)</p>
            </div>
          </div>

          <div className="mt-4 border-t border-slate-100 pt-3 text-xs tabular-nums text-slate-500 dark:border-white/5 dark:text-zinc-400">
            فارق الحركات:{" "}
            <span
              className="font-bold text-slate-800 dark:text-zinc-200"
              dir="ltr"
            >
              {growth.ordersDelta > 0
                ? `+${fmtInt(growth.ordersDelta)}`
                : fmtInt(growth.ordersDelta)}{" "}
              شيك
            </span>
          </div>
        </div>

        {/* Card 3: AOV Comparison */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-[#18181b]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
              متوسط الفاتورة (AOV)
            </span>
            {renderBadge(growth.aovGrowthPct)}
          </div>

          <div className="mt-3 flex items-baseline justify-between gap-2">
            <div>
              <p
                className="text-2xl font-black text-slate-900 dark:text-white"
                dir="ltr"
              >
                {fmtMoney(periodA.avgTicket)}
              </p>
              <p className="text-[11px] text-orange-600 dark:text-violet-300 font-semibold">
                متوسط (A)
              </p>
            </div>
            <div className="text-left">
              <p
                className="text-sm font-bold text-slate-500 dark:text-zinc-400 tabular-nums"
                dir="ltr"
              >
                {fmtMoney(periodB.avgTicket)}
              </p>
              <p className="text-[11px] text-slate-400 dark:text-zinc-400">متوسط (B)</p>
            </div>
          </div>

          <div className="mt-4 border-t border-slate-100 pt-3 text-xs tabular-nums text-slate-500 dark:border-white/5 dark:text-zinc-400">
            تغير الصرف للفاتورة:{" "}
            <span
              className="font-bold text-slate-800 dark:text-zinc-200"
              dir="ltr"
            >
              {fmtMoney(growth.aovDelta)}
            </span>
          </div>
        </div>

        {/* Card 4: Cash vs Visa Shift */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-[#18181b]">
          <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
            قنوات التحصيل
          </span>

          <div className="mt-3 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-zinc-300">
                <Banknote className="h-3.5 w-3.5 text-orange-600 dark:text-violet-300" />
                النقدية (Cash)
              </span>
              <div className="flex items-center gap-2">
                <span
                  className="font-bold tabular-nums font-mono text-slate-900 dark:text-slate-100"
                  dir="ltr"
                >
                  {fmtMoney(periodA.cash)}
                </span>
                {renderBadge(growth.cashGrowthPct)}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-zinc-300">
                <CreditCard className="h-3.5 w-3.5 text-slate-500 dark:text-zinc-400" />
                الفيزا (Visa)
              </span>
              <div className="flex items-center gap-2">
                <span
                  className="font-bold tabular-nums font-mono text-slate-900 dark:text-slate-100"
                  dir="ltr"
                >
                  {fmtMoney(periodA.visa)}
                </span>
                {renderBadge(growth.visaGrowthPct)}
              </div>
            </div>
          </div>

          <div className="mt-4 border-t border-slate-100 pt-3 text-[11px] text-slate-400 dark:border-white/5">
            مقارنة طرق الدفع بين الفترتين
          </div>
        </div>
      </div>

      {/* ---------- Row 2: Comprehensive Items Performance & Period Comparison Table ---------- */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 break-inside-avoid shadow-sm dark:border-white/5 dark:bg-[#18181b]">
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 dark:border-white/5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h4 className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-slate-100">
                <Award className="h-5 w-5 text-orange-600 dark:text-amber-500" />
                تحليل أداء ومقارنة مبيعات الأصناف بين الفترتين
              </h4>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
                متابعة حركة المنتجات، صافي الإيرادات النقدية، تغيرات الأسعار،
                ومتوسط السعر المرجح مع ترقيم الصفحات والبحث الحي
              </p>
            </div>
          </div>

          {/* Live Search and Page Size Filter Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 flex-1 xl:max-w-md">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-zinc-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث بكود الصنف أو اسم المنتج..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-9 text-xs text-slate-900 outline-none transition focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:border-white/5 dark:bg-zinc-950 dark:text-zinc-200 dark:focus:border-violet-400 dark:focus:ring-violet-400 placeholder:text-slate-400"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-white"
                  aria-label="مسح البحث"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-slate-500 dark:text-zinc-400">عرض:</span>
              <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 dark:border-white/5 dark:bg-zinc-950">
                {[10, 20, 50].map((size) => (
                  <button
                    key={size}
                    onClick={() => {
                      setPageSize(size);
                      setPage(1);
                    }}
                    className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                      pageSize === size
                        ? "bg-orange-600 text-white dark:bg-[#c4b5fd] dark:text-black font-bold"
                        : "text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-slate-200"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="mt-4 overflow-x-auto scroll-smooth">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-600 bg-slate-100 dark:border-white/5 dark:text-zinc-400 dark:bg-zinc-950/50">
                <th className="py-3 px-3 font-bold whitespace-nowrap">
                  الصنف / المنتج
                </th>
                <th className="py-3 px-3 text-center font-bold whitespace-nowrap">
                  حالة الحركة
                </th>
                <th className="py-3 px-3 font-bold whitespace-nowrap">
                  إيراد الصنف (الفترة A)
                </th>
                <th className="py-3 px-3 font-bold whitespace-nowrap">
                  إيراد الصنف (الفترة B)
                </th>
                <th
                  className="py-3 px-3 text-left font-bold whitespace-nowrap"
                  dir="ltr"
                >
                  الفارق (النمو / التراجع)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {paginatedItems.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-12 text-center text-sm text-slate-400 dark:text-zinc-400"
                  >
                    لا توجد منتجات مطابقة للبحث أو الفترة المحددة
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item, idx) => {
                  let badgeClass =
                    "bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-zinc-300 dark:border-transparent";
                  let badgeLabel = "مستقر";

                  if (item.status === "new") {
                    badgeClass =
                      "bg-orange-100 text-orange-800 border border-orange-200 dark:bg-violet-500/20 dark:text-violet-300 dark:border-violet-500/30";
                    badgeLabel = "صنف جديد";
                  } else if (item.status === "up") {
                    badgeClass =
                      "bg-orange-50 text-orange-700 border border-orange-200 dark:bg-indigo-950/40 dark:text-violet-300 dark:border-indigo-800/60";
                    badgeLabel = "صاعد";
                  } else if (item.status === "down") {
                    badgeClass =
                      "bg-amber-100 text-amber-800 border border-amber-200 dark:text-yellow-300 dark:bg-yellow-500/10 dark:border-yellow-500/20";
                    badgeLabel = "متراجع";
                  } else if (item.status === "dropped") {
                    badgeClass =
                      "bg-amber-100 text-amber-800 border border-amber-200 dark:text-yellow-300 dark:bg-yellow-500/20 dark:border-yellow-500/30";
                    badgeLabel = "متوقف";
                  }

                  const isPositive = item.revenueDelta > 0;
                  const isNegative = item.revenueDelta < 0;

                  return (
                    <tr
                      key={item.itemCode}
                      className="group transition-colors duration-150 hover:bg-orange-50/40 dark:hover:bg-slate-800/50"
                    >
                      {/* Item Details */}
                      <td className="py-3 px-3 font-semibold text-slate-800 dark:text-zinc-200">
                        <div className="flex items-center gap-2">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-slate-100 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-zinc-400">
                            {item.periodA.rank ?? "—"}
                          </span>
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white block">
                              {item.itemName}
                            </span>
                            <span className="font-mono text-[11px] text-slate-500 dark:text-zinc-400">
                              كود: {item.itemCode}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Movement Status Badge */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold ${badgeClass}`}
                        >
                          {badgeLabel}
                        </span>
                      </td>

                      {/* Period A Financial Display & Pricing Intelligence */}
                      <td className="py-3 px-3 align-top">
                        {renderItemPricing(item.periodA, "الفترة A")}
                      </td>

                      {/* Period B Financial Display & Pricing Intelligence */}
                      <td className="py-3 px-3 align-top">
                        {renderItemPricing(item.periodB, "الفترة B")}
                      </td>

                      {/* Financial Difference & Trend Badge */}
                      <td
                        className="py-3 px-3 align-top text-left whitespace-nowrap"
                        dir="ltr"
                      >
                        <div className="space-y-1">
                          <div className="font-extrabold text-sm tabular-nums">
                            <span
                              className={
                                isPositive
                                  ? "text-orange-600 dark:text-violet-300"
                                  : isNegative
                                    ? "text-amber-600 dark:text-yellow-300"
                                    : "text-slate-500"
                              }
                            >
                              {isPositive
                                ? `+${fmtMoney(item.revenueDelta)}`
                                : fmtMoney(item.revenueDelta)}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                            فارق الكمية:{" "}
                            <strong className="text-slate-800 dark:text-zinc-300">
                              {item.qtyDelta > 0
                                ? `+${fmtInt(item.qtyDelta)}`
                                : fmtInt(item.qtyDelta)}
                            </strong>
                          </div>
                          <div>{renderBadge(item.revenueGrowthPct)}</div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Dynamic Pagination Controls & Total Counter (Default 10 per page) */}
        <div className="mt-4 flex flex-col gap-3 border-t border-slate-200 pt-3 dark:border-white/5 sm:flex-row sm:items-center sm:justify-between print:hidden">
          <div className="text-xs text-slate-500 dark:text-zinc-400">
            عرض{" "}
            <span className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
              {totalItems === 0 ? 0 : (page - 1) * pageSize + 1}
            </span>
            {" - "}
            <span className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
              {Math.min(page * pageSize, totalItems)}
            </span>{" "}
            من أصل{" "}
            <span className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
              {fmtInt(totalItems)}
            </span>{" "}
            منتج
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-1.5 self-center sm:self-auto">
              {/* First Page */}
              <button
                onClick={() => setPage(1)}
                disabled={page <= 1}
                aria-label="الصفحة الأولى"
                className="rounded-lg border border-slate-200 bg-slate-100 p-1.5 text-slate-700 transition hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed dark:border-white/5 dark:bg-slate-800 dark:text-zinc-300 dark:hover:bg-slate-700"
              >
                <ChevronsRight className="h-4 w-4" />
              </button>

              {/* Previous Page */}
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                aria-label="الصفحة السابقة"
                className="rounded-lg border border-slate-200 bg-slate-100 p-1.5 text-slate-700 transition hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed dark:border-white/5 dark:bg-slate-800 dark:text-zinc-300 dark:hover:bg-slate-700"
              >
                <ChevronRight className="h-4 w-4" />
              </button>

              {/* Numeric Page Buttons */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum = i + 1;
                if (totalPages > 5) {
                  if (page > 3 && page < totalPages - 1) {
                    pageNum = page - 2 + i;
                  } else if (page >= totalPages - 1) {
                    pageNum = totalPages - 4 + i;
                  }
                }
                const isActive = pageNum === page;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`min-w-[28px] rounded-lg px-2 py-1 text-xs font-bold transition tabular-nums ${
                      isActive
                        ? "bg-orange-600 text-white dark:bg-[#c4b5fd] dark:text-black"
                        : "border border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200 dark:border-white/5 dark:bg-slate-800 dark:text-zinc-300 dark:hover:bg-slate-700"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              {/* Next Page */}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                aria-label="الصفحة التالية"
                className="rounded-lg border border-slate-200 bg-slate-100 p-1.5 text-slate-700 transition hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed dark:border-white/5 dark:bg-slate-800 dark:text-zinc-300 dark:hover:bg-slate-700"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {/* Last Page */}
              <button
                onClick={() => setPage(totalPages)}
                disabled={page >= totalPages}
                aria-label="الصفحة الأخيرة"
                className="rounded-lg border border-slate-200 bg-slate-100 p-1.5 text-slate-700 transition hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed dark:border-white/5 dark:bg-slate-800 dark:text-zinc-300 dark:hover:bg-slate-700"
              >
                <ChevronsLeft className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ---------- Row 3: Outlets Comparison Table ---------- */}
      {outletsComparison.length > 0 && (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-[#18181b]">
          <div className="mb-4">
            <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
              أداء المحلات بين الفترتين
            </h4>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
              مقارنة العائد وعدد الشيكات لكل كرفان مشمول في التقرير
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs text-slate-600 dark:border-white/5 dark:text-zinc-400">
                  <th className="pb-3 font-semibold">المحل / الكرفان</th>
                  <th className="pb-3 font-semibold">إيراد الفترة A</th>
                  <th className="pb-3 font-semibold">إيراد الفترة B</th>
                  <th className="pb-3 text-center font-semibold">
                    نمو الإيراد
                  </th>
                  <th className="pb-3 font-semibold">الشيكات A vs B</th>
                  <th className="pb-3 text-left font-semibold">نمو الحركات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs dark:divide-slate-800">
                {outletsComparison.map((o) => (
                  <tr
                    key={o.branchCode}
                    className="hover:bg-slate-100/60 dark:hover:bg-white/5"
                  >
                    <td className="py-3 font-bold text-slate-900 dark:text-zinc-200">
                      {o.name}
                    </td>
                    <td
                      className="py-3 font-semibold tabular-nums text-slate-900 dark:text-slate-100"
                      dir="ltr"
                    >
                      {fmtMoney(o.revenueA)}
                    </td>
                    <td
                      className="py-3 tabular-nums text-slate-500 dark:text-zinc-400"
                      dir="ltr"
                    >
                      {fmtMoney(o.revenueB)}
                    </td>
                    <td className="py-3 text-center">
                      {renderBadge(o.revenueGrowthPct)}
                    </td>
                    <td className="py-3 tabular-nums">
                      <span className="font-semibold text-slate-800 dark:text-zinc-200">
                        {fmtInt(o.ordersA)}
                      </span>
                      <span className="text-slate-400 dark:text-zinc-400"> vs </span>
                      <span className="text-slate-500 dark:text-zinc-400">
                        {fmtInt(o.ordersB)}
                      </span>
                    </td>
                    <td className="py-3 text-left">
                      {renderBadge(o.ordersGrowthPct)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
