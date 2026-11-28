'use client';

import React from 'react';
import { Users, Store, TrendingUp } from 'lucide-react';
import type { CaravanRecord, ReportSummary } from '@/types/reports';
import { fmtInt, fmtMoney, Money } from './charts';
import { getSectorTheme } from '@/lib/sectorTheme';

interface VisitorOutletPerformanceRowProps {
  totalRevenue: number;
  records?: CaravanRecord[];
  guests?: number;
  spendPerGuest?: number;
  summary?: ReportSummary | null;
  loading?: boolean;
  sectorType?: number;
}

export function VisitorOutletPerformanceRow({
  totalRevenue,
  records = [],
  guests = 0,
  spendPerGuest = 0,
  summary,
  loading = false,
  sectorType = 4,
}: VisitorOutletPerformanceRowProps) {
  const theme = getSectorTheme(sectorType);
  // 1. Calculate Active Outlets: Distinct branches with sales > 0
  const activeRecords = records.filter((r) => (Number(r.total) || 0) > 0);
  const activeCount = activeRecords.length;
  const totalRegisteredCount = records.length;

  // 2. Average Revenue per Active Outlet (متوسط إيراد المنفذ النشط)
  const netRevenue = summary?.totalSales ?? totalRevenue;
  const avgRevPerActiveOutlet = activeCount > 0 ? netRevenue / activeCount : 0;

  // 3. Visitor Spend Calculation:
  // Prefer API spendPerGuest or calculated netRevenue / guests
  const effectiveAvgSpend =
    spendPerGuest > 0
      ? spendPerGuest
      : guests > 0
      ? netRevenue / guests
      : 0;

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="h-44 animate-pulse rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/60" />
        <div className="h-44 animate-pulse rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/60" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {/* ===================================================================== */}
      {/* COLUMN 1: VISITOR SPEND ANALYSIS (سلوك الزائر)                        */}
      {/* ===================================================================== */}
      <section className="flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm ring-1 ring-slate-900/5 backdrop-blur-md transition hover:border-slate-300 dark:border-zinc-800/80 dark:bg-zinc-900/80 dark:ring-white/10 dark:hover:border-zinc-700">
        <div>
          {/* Header */}
          <div className="flex items-start justify-between border-b border-slate-100 pb-3 dark:border-zinc-800/80">
            <div>
              <div className="flex items-center gap-2">
                <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${theme.iconBox}`}>
                  <Users className="h-4 w-4" />
                </span>
                <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-100">
                  سلوك إنفاق الزائر (Visitor Spend Analysis)
                </h3>
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
                معدل الاستهلاك الفعلي لرواد الحديقة بالربط مع أعداد التذاكر والبوابات
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600 dark:bg-zinc-800 dark:text-zinc-300 font-mono">
              سلوك الرواد
            </span>
          </div>

          {/* Body: Two Bold Numbers Side-by-Side */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
            {/* 1. Average Spend Value */}
            <div className="flex flex-col justify-between rounded-lg border border-slate-200/70 bg-slate-50/70 p-4 dark:border-zinc-800/70 dark:bg-zinc-950/50">
              <span className="text-xs font-bold text-slate-600 dark:text-zinc-300">
                متوسط إنفاق الزائر (Per Guest)
              </span>
              <div className="mt-3 flex items-baseline gap-1.5">
                <span
                  className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white font-mono tabular-nums"
                  dir="ltr"
                >
                  {effectiveAvgSpend > 0 ? (
                    <Money value={effectiveAvgSpend} symbolClassName="text-xs opacity-60 font-normal mr-1 select-none" />
                  ) : (
                    <span className="text-2xl text-zinc-400 dark:text-zinc-500">—</span>
                  )}
                </span>
              </div>
              <p className="mt-2 text-[11px] font-medium text-slate-500 dark:text-zinc-400">
                إجمالي الإيرادات ÷ إجمالي الرواد
              </p>
            </div>

            {/* 2. Total Number of Visitors */}
            <div className="flex flex-col justify-between rounded-lg border border-slate-200/70 bg-slate-50/70 p-4 dark:border-zinc-800/70 dark:bg-zinc-950/50">
              <span className="text-xs font-bold text-slate-600 dark:text-zinc-300">
                إجمالي عدد الزوار (Total Guests)
              </span>
              <div className="mt-3 flex items-baseline gap-1.5">
                <span
                  className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white font-mono tabular-nums text-emerald-600 dark:text-emerald-400"
                  dir="ltr"
                >
                  {guests > 0 ? fmtInt(guests) : '—'}
                </span>
                {guests > 0 && (
                  <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">
                    زائر
                  </span>
                )}
              </div>
              <p className="mt-2 text-[11px] font-medium text-slate-500 dark:text-zinc-400">
                {guests > 0 ? 'محتسب من بوابات التذاكر الرسمية' : 'بانتظار مزامنة بوابات الدخول'}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] text-slate-500 dark:border-zinc-800/80 dark:text-zinc-400">
          <span>مؤشر القوة الشرائية المباشرة داخل المتنزه</span>
          <span className={`font-mono tabular-nums ${theme.accentText} font-semibold`}>
            {guests > 0 ? `تغطية ${fmtInt(guests)} زائر` : 'بيانات الزوار المركزية'}
          </span>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* COLUMN 2: ACTIVE OUTLET PERFORMANCE (كفاءة التشغيل)                   */}
      {/* ===================================================================== */}
      <section className="flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm ring-1 ring-slate-900/5 backdrop-blur-md transition hover:border-slate-300 dark:border-zinc-800/80 dark:bg-zinc-900/80 dark:ring-white/10 dark:hover:border-zinc-700">
        <div>
          {/* Header */}
          <div className="flex items-start justify-between border-b border-slate-100 pb-3 dark:border-zinc-800/80">
            <div>
              <div className="flex items-center gap-2">
                <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${theme.iconBox}`}>
                  <Store className="h-4 w-4" />
                </span>
                <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-100">
                  كفاءة تشغيل المنافذ (Outlet Efficiency)
                </h3>
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
                معدل المبيعات لكل نقطة بيع محققة للإيرادات لعزل الفروع المتوقفة
              </p>
            </div>
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/20 font-mono">
              معيار الإدارة المالية
            </span>
          </div>

          {/* Body: Prominent Average Revenue Metric & Operational Subtitles */}
          <div className="py-4">
            <div className="rounded-lg border border-slate-200/70 bg-slate-50/70 p-4 dark:border-zinc-800/70 dark:bg-zinc-950/50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                  متوسط إيراد المنفذ النشط (Avg Revenue / Active Outlet)
                </span>
                <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${theme.accentText} font-mono`}>
                  <TrendingUp className="h-3.5 w-3.5" />
                  مؤشر الكفاءة
                </span>
              </div>

              <div className="mt-3 flex items-baseline justify-between">
                <div
                  className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white font-mono tabular-nums"
                  dir="ltr"
                >
                  <Money value={avgRevPerActiveOutlet} symbolClassName="text-xs opacity-60 font-normal mr-1 select-none" />
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center rounded-md bg-zinc-200/60 dark:bg-zinc-800 px-2 py-0.5 text-xs font-bold font-mono text-zinc-800 dark:text-zinc-200">
                    {activeCount} من {totalRegisteredCount} نشط
                  </span>
                </div>
              </div>

              {/* Explicit subtitle for CFO benchmark */}
              <div className="mt-3 flex items-center justify-between border-t border-slate-200/60 pt-2.5 dark:border-zinc-800/60 text-xs">
                <span className="font-medium text-slate-600 dark:text-zinc-300">
                  بناءً على تشغيل <strong className="font-bold font-mono text-zinc-900 dark:text-white">{activeCount}</strong> منفذ اليوم
                </span>
                <span className="font-mono text-slate-500 dark:text-zinc-400">
                  صافي الإيراد: {fmtMoney(netRevenue)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] text-slate-500 dark:border-zinc-800/80 dark:text-zinc-400">
          <span>معيار فوري لقياس جدوى تشغيل المنافذ في ورديات العمل</span>
          <span className="font-mono tabular-nums text-slate-600 dark:text-zinc-300">
            نسبة التشغيل: {totalRegisteredCount > 0 ? Math.round((activeCount / totalRegisteredCount) * 100) : 0}%
          </span>
        </div>
      </section>
    </div>
  );
}

export default VisitorOutletPerformanceRow;
