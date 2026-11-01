'use client';

import React from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  Award,
  Banknote,
  Calendar,
  CheckCircle2,
  CreditCard,
  Minus,
  Receipt,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import type { PeriodComparisonResponse } from '@/types/reports';
import { fmtInt, fmtMoney } from './charts';

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
      <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-emerald-500 border-t-transparent" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            جاري معالجة بيانات المقارنة المتقاطعة...
          </p>
          <p className="text-xs text-slate-400">تنفيذ الاستعلامات المتوازية عبر SQL Server 2014</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-400 dark:border-slate-800 dark:bg-slate-900">
        حدد الفترتين الزمنيتين لعرض المقارنة التحليلية
      </div>
    );
  }

  const { summary, topItemsShift, outletsComparison, filters } = data;
  const { periodA, periodB, growth } = summary;

  const renderBadge = (growthPct: number) => {
    const isPositive = growthPct > 0;
    const isZero = growthPct === 0;

    if (isZero) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
          <Minus className="h-3 w-3" />
          0.0%
        </span>
      );
    }

    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
          isPositive
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
            : 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'
        }`}
        dir="ltr"
      >
        {isPositive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
        {Math.abs(growthPct).toFixed(1)}%
      </span>
    );
  };

  return (
    <div className={`space-y-6 transition-opacity ${loading ? 'opacity-60' : ''}`}>
      {/* ---------- Header Banner ---------- */}
      <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-gradient-to-r from-emerald-50/50 via-white to-cyan-50/50 p-5 dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800/80 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              نتائج المقارنة التحليلية بين الفترتين
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            النطاق التشغيلي: <span className="font-semibold text-slate-700 dark:text-slate-200">{scopeLabel}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 font-semibold text-emerald-800 dark:border-emerald-800/40 dark:bg-emerald-950/30 dark:text-emerald-300">
            <Calendar className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>الفترة A:</span>
            <span className="tabular-nums" dir="ltr">{filters.periodA.startDate} → {filters.periodA.endDate}</span>
          </div>

          <span className="font-bold text-slate-400">مقابل</span>

          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
            <Calendar className="h-3.5 w-3.5 text-slate-500" />
            <span>الفترة B:</span>
            <span className="tabular-nums" dir="ltr">{filters.periodB.startDate} → {filters.periodB.endDate}</span>
          </div>
        </div>
      </div>

      {/* ---------- Row 1: KPI Delta Cards ---------- */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Card 1: Revenue Comparison */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">صافي الإيرادات</span>
            {renderBadge(growth.revenueGrowthPct)}
          </div>

          <div className="mt-3 flex items-baseline justify-between gap-2">
            <div>
              <p className="text-2xl font-black text-slate-900 dark:text-white" dir="ltr">
                {fmtMoney(periodA.revenue)}
              </p>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400">الفترة الحالية (A)</p>
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-slate-400 tabular-nums" dir="ltr">
                {fmtMoney(periodB.revenue)}
              </p>
              <p className="text-[11px] text-slate-400">الفترة السابقة (B)</p>
            </div>
          </div>

          <div className="mt-4 border-t border-slate-100 pt-3 text-xs tabular-nums text-slate-500 dark:border-slate-800 dark:text-slate-400">
            الفارق المالي: <span className="font-bold text-slate-700 dark:text-slate-200" dir="ltr">{fmtMoney(growth.revenueDelta)}</span>
          </div>
        </div>

        {/* Card 2: Orders Comparison */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">عدد الشيكات والعمليات</span>
            {renderBadge(growth.ordersGrowthPct)}
          </div>

          <div className="mt-3 flex items-baseline justify-between gap-2">
            <div>
              <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                {fmtInt(periodA.orders)}
              </p>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400">شيك في (A)</p>
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-slate-400 tabular-nums">
                {fmtInt(periodB.orders)}
              </p>
              <p className="text-[11px] text-slate-400">شيك في (B)</p>
            </div>
          </div>

          <div className="mt-4 border-t border-slate-100 pt-3 text-xs tabular-nums text-slate-500 dark:border-slate-800 dark:text-slate-400">
            فارق الحركات: <span className="font-bold text-slate-700 dark:text-slate-200" dir="ltr">{growth.ordersDelta > 0 ? `+${fmtInt(growth.ordersDelta)}` : fmtInt(growth.ordersDelta)} شيك</span>
          </div>
        </div>

        {/* Card 3: AOV Comparison */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">متوسط الفاتورة (AOV)</span>
            {renderBadge(growth.aovGrowthPct)}
          </div>

          <div className="mt-3 flex items-baseline justify-between gap-2">
            <div>
              <p className="text-2xl font-black text-slate-900 dark:text-white" dir="ltr">
                {fmtMoney(periodA.avgTicket)}
              </p>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400">متوسط (A)</p>
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-slate-400 tabular-nums" dir="ltr">
                {fmtMoney(periodB.avgTicket)}
              </p>
              <p className="text-[11px] text-slate-400">متوسط (B)</p>
            </div>
          </div>

          <div className="mt-4 border-t border-slate-100 pt-3 text-xs tabular-nums text-slate-500 dark:border-slate-800 dark:text-slate-400">
            تغير الصرف للفاتورة: <span className="font-bold text-slate-700 dark:text-slate-200" dir="ltr">{fmtMoney(growth.aovDelta)}</span>
          </div>
        </div>

        {/* Card 4: Cash vs Visa Shift */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-semibold text-slate-400">قنوات التحصيل</span>

          <div className="mt-3 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-300">
                <Banknote className="h-3.5 w-3.5 text-cyan-500" />
                النقدية (Cash)
              </span>
              <div className="flex items-center gap-2">
                <span className="font-bold tabular-nums text-slate-800 dark:text-slate-100" dir="ltr">{fmtMoney(periodA.cash)}</span>
                {renderBadge(growth.cashGrowthPct)}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-300">
                <CreditCard className="h-3.5 w-3.5 text-indigo-500" />
                الفيزا (Visa)
              </span>
              <div className="flex items-center gap-2">
                <span className="font-bold tabular-nums text-slate-800 dark:text-slate-100" dir="ltr">{fmtMoney(periodA.visa)}</span>
                {renderBadge(growth.visaGrowthPct)}
              </div>
            </div>
          </div>

          <div className="mt-4 border-t border-slate-100 pt-3 text-[11px] text-slate-400 dark:border-slate-800">
            مقارنة طرق الدفع بين الفترتين
          </div>
        </div>
      </div>

      {/* ---------- Row 2: Top Selling Items Shift Table ---------- */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h4 className="flex items-center gap-2 text-base font-bold text-slate-800 dark:text-slate-100">
              <Award className="h-4 w-4 text-amber-500" />
              مقارنة حركة وتصدر الأصناف بين الفترتين
            </h4>
            <p className="mt-0.5 text-xs text-slate-400">
              تتبع التغير في مبيعات وترتيب الأصناف الأكثر طلباً
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs text-slate-400 dark:border-slate-800">
                <th className="pb-3 font-semibold">الصنف</th>
                <th className="pb-3 text-center font-semibold">حالة الحركة</th>
                <th className="pb-3 font-semibold">الفترة A (الكمية / الإيراد)</th>
                <th className="pb-3 font-semibold">الفترة B (الكمية / الإيراد)</th>
                <th className="pb-3 text-left font-semibold">نسبة النمو</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs dark:divide-slate-800">
              {topItemsShift.map((item) => {
                let badgeClass = 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';
                let badgeLabel = 'مستقر';

                if (item.status === 'new') {
                  badgeClass = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300';
                  badgeLabel = 'صنف جديد 🌟';
                } else if (item.status === 'up') {
                  badgeClass = 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300';
                  badgeLabel = 'صاعد ⬆️';
                } else if (item.status === 'down') {
                  badgeClass = 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300';
                  badgeLabel = 'متراجع ⬇️';
                }

                return (
                  <tr key={item.itemCode} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="py-3 font-semibold text-slate-800 dark:text-slate-200">
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-slate-100 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                          {item.periodA.rank ?? '—'}
                        </span>
                        <span className="truncate">{item.itemName}</span>
                      </div>
                    </td>
                    <td className="py-3 text-center">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${badgeClass}`}>
                        {badgeLabel}
                      </span>
                    </td>
                    <td className="py-3 tabular-nums">
                      <span className="font-semibold text-slate-800 dark:text-slate-100">
                        {fmtInt(item.periodA.qty)} وحدة
                      </span>
                      <span className="mr-2 text-slate-400" dir="ltr">({fmtMoney(item.periodA.revenue)})</span>
                    </td>
                    <td className="py-3 tabular-nums text-slate-500 dark:text-slate-400">
                      {item.periodB.qty > 0 ? (
                        <>
                          <span>{fmtInt(item.periodB.qty)} وحدة</span>
                          <span className="mr-2" dir="ltr">({fmtMoney(item.periodB.revenue)})</span>
                        </>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600">—</span>
                      )}
                    </td>
                    <td className="py-3 text-left">
                      {renderBadge(item.revenueGrowthPct)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* ---------- Row 3: Outlets Comparison Table ---------- */}
      {outletsComparison.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4">
            <h4 className="text-base font-bold text-slate-800 dark:text-slate-100">
              أداء المنافذ بين الفترتين
            </h4>
            <p className="mt-0.5 text-xs text-slate-400">
              مقارنة العائد وعدد الشيكات لكل كرفان مشمول في التقرير
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs text-slate-400 dark:border-slate-800">
                  <th className="pb-3 font-semibold">المنفذ / الكرفان</th>
                  <th className="pb-3 font-semibold">إيراد الفترة A</th>
                  <th className="pb-3 font-semibold">إيراد الفترة B</th>
                  <th className="pb-3 text-center font-semibold">نمو الإيراد</th>
                  <th className="pb-3 font-semibold">الشيكات A vs B</th>
                  <th className="pb-3 text-left font-semibold">نمو الحركات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs dark:divide-slate-800">
                {outletsComparison.map((o) => (
                  <tr key={o.branchCode} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="py-3 font-bold text-slate-800 dark:text-slate-200">
                      {o.name}
                    </td>
                    <td className="py-3 font-semibold tabular-nums text-slate-800 dark:text-slate-100" dir="ltr">
                      {fmtMoney(o.revenueA)}
                    </td>
                    <td className="py-3 tabular-nums text-slate-500 dark:text-slate-400" dir="ltr">
                      {fmtMoney(o.revenueB)}
                    </td>
                    <td className="py-3 text-center">
                      {renderBadge(o.revenueGrowthPct)}
                    </td>
                    <td className="py-3 tabular-nums">
                      <span className="font-semibold text-slate-700 dark:text-slate-200">{fmtInt(o.ordersA)}</span>
                      <span className="text-slate-400"> vs </span>
                      <span className="text-slate-400">{fmtInt(o.ordersB)}</span>
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

