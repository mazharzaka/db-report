'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Package,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  TrendingUp,
  Boxes,
  Coins,
  RefreshCw,
} from 'lucide-react';
import type { ItemPerformanceRecord, ItemsPerformanceResponse } from '@/types/reports';
import { fmtInt, fmtMoney } from './charts';

interface Props {
  startDate: string;
  endDate: string;
  prevStartDate?: string;
  prevEndDate?: string;
  selectedBranches: string[];
  className?: string;
}

export function ItemSalesPerformance({
  startDate,
  endDate,
  prevStartDate,
  prevEndDate,
  selectedBranches,
  className = '',
}: Props) {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState<'revenue' | 'quantity' | 'growth' | 'name' | 'code'>('revenue');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const [data, setData] = useState<ItemsPerformanceResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounce search input by 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to page 1 on new search
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset page when date filters or branch filters change
  const branchesKey = selectedBranches.join(',');
  useEffect(() => {
    setPage(1);
  }, [startDate, endDate, prevStartDate, prevEndDate, branchesKey]);

  // Fetch item performance data
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        startDate,
        endDate,
        page: String(page),
        limit: String(limit),
        sortBy,
        sortOrder,
      });
      if (prevStartDate) params.set('prevStartDate', prevStartDate);
      if (prevEndDate) params.set('prevEndDate', prevEndDate);
      if (branchesKey) params.set('branchCode', branchesKey);
      if (debouncedSearch) params.set('search', debouncedSearch);

      const res = await fetch(`/api/reports/caravans/items-performance?${params.toString()}`);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`خطأ في استجابة الخادم (${res.status}): ${text.slice(0, 80)}`);
      }
      const json = (await res.json()) as ItemsPerformanceResponse;
      if (json.status !== 'success') {
        throw new Error(json.message || 'فشل استرجاع بيانات الأصناف');
      }
      setData(json);
    } catch (err) {
      setError((err as Error).message || 'تعذر تحميل بيانات مبيعات الأصناف');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, prevStartDate, prevEndDate, branchesKey, debouncedSearch, page, limit, sortBy, sortOrder]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const toggleSort = (col: 'revenue' | 'quantity' | 'growth' | 'name' | 'code') => {
    if (sortBy === col) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(col);
      setSortOrder('desc');
    }
    setPage(1);
  };

  const pagination = data?.pagination ?? {
    page: 1,
    limit,
    totalItems: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  };

  const summary = data?.summary ?? {
    totalItems: 0,
    totalQuantity: 0,
    totalRevenue: 0,
    prevQuantity: 0,
    prevRevenue: 0,
    revenueGrowthPct: null,
  };

  const items = data?.items ?? [];

  return (
    <section
      className={`rounded-2xl border border-slate-800 bg-slate-900/95 p-5 shadow-sm backdrop-blur-sm break-inside-avoid ${className}`}
    >
      {/* Header and Summary KPIs */}
      <div className="flex flex-col gap-4 border-b border-slate-800 pb-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">تحليل مبيعات الأصناف والمنتجات</h3>
              <p className="text-xs text-slate-400">
                مؤشرات أداء الأصناف، الكميات المباعة، صافي الإيرادات، ومقارنة معدلات النمو الدوري
              </p>
            </div>
          </div>

          {/* Quick Refresh */}
          <div className="flex items-center gap-2 print:hidden">
            <button
              onClick={() => void loadData()}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-700 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              تحديث
            </button>
          </div>
        </div>

        {/* Aggregate Metrics Bar */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
            <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
              <Boxes className="h-3.5 w-3.5 text-cyan-400" />
              الأصناف المطابقة
            </span>
            <span className="mt-1 block text-lg font-extrabold text-white tabular-nums">
              {fmtInt(summary.totalItems)} صنف
            </span>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
            <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
              <Package className="h-3.5 w-3.5 text-emerald-400" />
              إجمالي الكميات المباعة
            </span>
            <span className="mt-1 block text-lg font-extrabold text-white tabular-nums">
              {fmtInt(summary.totalQuantity)} قطعة
            </span>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
            <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
              <Coins className="h-3.5 w-3.5 text-emerald-400" />
              إجمالي صافي الإيرادات
            </span>
            <span className="mt-1 block text-lg font-extrabold text-emerald-400 tabular-nums" dir="ltr">
              {fmtMoney(summary.totalRevenue)}
            </span>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
            <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-violet-400" />
              معدل النمو الدوري الإجمالي
            </span>
            <span
              className={`mt-1 block text-lg font-extrabold tabular-nums ${
                summary.revenueGrowthPct !== null && summary.revenueGrowthPct >= 0
                  ? 'text-emerald-400'
                  : summary.revenueGrowthPct !== null
                  ? 'text-rose-400'
                  : 'text-slate-400'
              }`}
              dir="ltr"
            >
              {summary.revenueGrowthPct !== null
                ? `${summary.revenueGrowthPct >= 0 ? '+' : ''}${summary.revenueGrowthPct.toFixed(1)}%`
                : '—'}
            </span>
          </div>
        </div>

        {/* Live Search & Limit Controls */}
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between print:hidden">
          <div className="relative flex-1 max-w-md">
            <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث بكود الصنف أو اسم المنتج (مثال: مياه، كانز، 111069)..."
              className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2 pl-9 pr-9 text-xs text-slate-100 outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 placeholder:text-slate-500"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                aria-label="مسح البحث"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">عرض في الصفحة:</span>
            <div className="inline-flex rounded-lg border border-slate-700 bg-slate-950 p-0.5">
              {[10, 20, 50, 100].map((size) => (
                <button
                  key={size}
                  onClick={() => {
                    setLimit(size);
                    setPage(1);
                  }}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                    limit === size
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Error alert if any */}
      {error && (
        <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
          {error}
        </div>
      )}

      {/* Items Table */}
      <div className={`mt-4 overflow-x-auto scroll-smooth ${loading ? 'opacity-60' : ''}`}>
        <table className="w-full border-collapse text-xs text-right">
          <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400">
            <tr>
              <th
                onClick={() => toggleSort('code')}
                className="cursor-pointer px-4 py-3 font-bold transition hover:text-white select-none whitespace-nowrap"
              >
                <span className="inline-flex items-center gap-1">
                  كود الصنف
                  {sortBy === 'code' ? (
                    sortOrder === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-emerald-400" /> : <ArrowDown className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <ArrowUpDown className="h-3 w-3 opacity-30" />
                  )}
                </span>
              </th>
              <th
                onClick={() => toggleSort('name')}
                className="cursor-pointer px-4 py-3 font-bold transition hover:text-white select-none whitespace-nowrap"
              >
                <span className="inline-flex items-center gap-1">
                  اسم الصنف / المنتج
                  {sortBy === 'name' ? (
                    sortOrder === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-emerald-400" /> : <ArrowDown className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <ArrowUpDown className="h-3 w-3 opacity-30" />
                  )}
                </span>
              </th>
              <th
                onClick={() => toggleSort('quantity')}
                className="cursor-pointer px-4 py-3 font-bold text-left transition hover:text-white select-none whitespace-nowrap"
                dir="ltr"
              >
                <span className="inline-flex items-center gap-1 flex-row-reverse">
                  الكمية المباعة
                  {sortBy === 'quantity' ? (
                    sortOrder === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-emerald-400" /> : <ArrowDown className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <ArrowUpDown className="h-3 w-3 opacity-30" />
                  )}
                </span>
              </th>
              <th className="px-4 py-3 font-bold whitespace-nowrap">
                سعر البيع وسلوك السعر
              </th>
              <th
                onClick={() => toggleSort('revenue')}
                className="cursor-pointer px-4 py-3 font-bold text-left transition hover:text-white select-none whitespace-nowrap"
                dir="ltr"
              >
                <span className="inline-flex items-center gap-1 flex-row-reverse">
                  صافي الإيراد المحقق
                  {sortBy === 'revenue' ? (
                    sortOrder === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-emerald-400" /> : <ArrowDown className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <ArrowUpDown className="h-3 w-3 opacity-30" />
                  )}
                </span>
              </th>
              <th className="px-4 py-3 font-bold text-left whitespace-nowrap" dir="ltr">
                إيراد الفترة السابقة
              </th>
              <th
                onClick={() => toggleSort('growth')}
                className="cursor-pointer px-4 py-3 font-bold text-left transition hover:text-white select-none whitespace-nowrap"
                dir="ltr"
              >
                <span className="inline-flex items-center gap-1 flex-row-reverse">
                  معدل النمو (PoP)
                  {sortBy === 'growth' ? (
                    sortOrder === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-emerald-400" /> : <ArrowDown className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <ArrowUpDown className="h-3 w-3 opacity-30" />
                  )}
                </span>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800">
            {items.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-sm text-slate-400">
                  {loading ? 'جاري استرجاع بيانات الأصناف...' : 'لا توجد أصناف مطابقة للبحث أو الفترة المحددة'}
                </td>
              </tr>
            ) : (
              items.map((item, idx) => {
                const isEven = idx % 2 === 0;
                const isPositive = item.growthPct !== null && item.growthPct >= 0;
                const unitPrice = item.unitPrice && item.unitPrice > 0
                  ? item.unitPrice
                  : (item.quantity > 0 ? Math.round((item.netRevenue / item.quantity) * 100) / 100 : (item.avgPrice ?? 0));

                return (
                  <tr
                    key={item.itemCode}
                    className={`transition-colors hover:bg-slate-800/60 ${
                      isEven ? 'bg-slate-900/40' : 'bg-slate-900/80'
                    }`}
                  >
                    <td className="px-4 py-3 font-mono text-slate-400">
                      <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[11px] text-slate-300">
                        {item.itemCode}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-white whitespace-nowrap">
                      {item.itemName}
                    </td>
                    <td className="px-4 py-3 text-left font-semibold text-slate-200 tabular-nums" dir="ltr">
                      {fmtInt(item.quantity)} قطعة
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="text-[11px] text-slate-300 tabular-nums" dir="ltr">
                        {item.hasPriceChange && item.minPrice && item.maxPrice && item.minPrice < item.maxPrice ? (
                          <div>
                            <span>
                              متوسط السعر:{' '}
                              <strong className="text-amber-400">{fmtMoney(unitPrice)}</strong>
                            </span>
                            <span className="block text-[10px] font-medium text-amber-400/90" dir="rtl">
                              تغير السعر: من {fmtMoney(item.minPrice)} إلى {fmtMoney(item.maxPrice)}
                            </span>
                          </div>
                        ) : (
                          <div>
                            سعر الوحدة: <strong className="text-white">{fmtMoney(unitPrice)}</strong>
                            <span className="mr-1 text-[10px] text-slate-400" dir="rtl">
                              ({fmtInt(item.quantity)} × {fmtMoney(unitPrice)})
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-left font-extrabold text-emerald-400 tabular-nums" dir="ltr">
                      {fmtMoney(item.netRevenue)}
                    </td>
                    <td className="px-4 py-3 text-left text-slate-400 tabular-nums" dir="ltr">
                      {fmtMoney(item.prevNetRevenue)}
                    </td>
                    <td className="px-4 py-3 text-left tabular-nums whitespace-nowrap" dir="ltr">
                      {item.growthPct !== null ? (
                        <span
                          className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold ${
                            isPositive
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                          {Math.abs(item.growthPct).toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="mt-4 flex flex-col gap-3 border-t border-slate-800 pt-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div className="text-xs text-slate-400">
          عرض{' '}
          <span className="font-semibold text-slate-200 tabular-nums">
            {pagination.totalItems === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1}
          </span>
          {' - '}
          <span className="font-semibold text-slate-200 tabular-nums">
            {Math.min(pagination.page * pagination.limit, pagination.totalItems)}
          </span>{' '}
          من أصل{' '}
          <span className="font-semibold text-slate-200 tabular-nums">
            {fmtInt(pagination.totalItems)}
          </span>{' '}
          منتج
        </div>

        {pagination.totalPages > 1 && (
          <div className="flex items-center gap-1.5 self-center sm:self-auto">
            {/* First Page */}
            <button
              onClick={() => setPage(1)}
              disabled={pagination.page <= 1 || loading}
              aria-label="الصفحة الأولى"
              className="rounded-lg border border-slate-700 bg-slate-800 p-1.5 text-slate-300 transition hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronsRight className="h-4 w-4" />
            </button>

            {/* Previous Page */}
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={!pagination.hasPrevPage || loading}
              aria-label="الصفحة السابقة"
              className="rounded-lg border border-slate-700 bg-slate-800 p-1.5 text-slate-300 transition hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            {/* Numeric Page Buttons */}
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              let pageNum = i + 1;
              if (pagination.totalPages > 5) {
                if (pagination.page > 3 && pagination.page < pagination.totalPages - 1) {
                  pageNum = pagination.page - 2 + i;
                } else if (pagination.page >= pagination.totalPages - 1) {
                  pageNum = pagination.totalPages - 4 + i;
                }
              }
              const isActive = pageNum === pagination.page;
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`min-w-[28px] rounded-lg px-2 py-1 text-xs font-bold transition tabular-nums ${
                    isActive
                      ? 'bg-emerald-600 text-white'
                      : 'border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            {/* Next Page */}
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={!pagination.hasNextPage || loading}
              aria-label="الصفحة التالية"
              className="rounded-lg border border-slate-700 bg-slate-800 p-1.5 text-slate-300 transition hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {/* Last Page */}
            <button
              onClick={() => setPage(pagination.totalPages)}
              disabled={pagination.page >= pagination.totalPages || loading}
              aria-label="الصفحة الأخيرة"
              className="rounded-lg border border-slate-700 bg-slate-800 p-1.5 text-slate-300 transition hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

