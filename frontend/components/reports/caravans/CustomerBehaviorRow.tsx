'use client';

import React from 'react';
import { CreditCard, ShoppingBag, Banknote, Users } from 'lucide-react';
import type { ReportSummary } from '@/types/reports';
import { fmtInt, fmtMoney, Money } from './charts';

interface CustomerBehaviorRowProps {
  totalUnits: number;
  totalOrders: number;
  avgSpend: number;
  totalRevenue: number;
  guests?: number;
  summary?: ReportSummary | null;
  loading?: boolean;
}

export function CustomerBehaviorRow({
  totalUnits,
  totalOrders,
  avgSpend,
  totalRevenue,
  guests = 0,
  summary,
  loading = false,
}: CustomerBehaviorRowProps) {
  // 1. Calculate Basket Density (كثافة السلة = إجمالي الوحدات ÷ إجمالي الشيكات)
  const basketDensity =
    totalOrders > 0 ? (totalUnits / totalOrders).toFixed(1) : '0.0';

  // 2. Payment channels breakdown
  const totalCash = summary?.totalCash ?? 0;
  const totalVisa = (summary?.totalVisa ?? 0) + (summary?.totalCL ?? 0);
  const totalSales = summary?.totalSales ?? totalRevenue;

  const cashPct =
    totalSales > 0 ? Math.min(100, Math.max(0, (totalCash / totalSales) * 100)) : 0;
  const visaPct =
    totalSales > 0 ? Math.min(100, Math.max(0, (totalVisa / totalSales) * 100)) : 0;

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="h-64 animate-pulse rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/60" />
        <div className="h-64 animate-pulse rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/60" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {/* ===================================================================== */}
      {/* COLUMN 1 (LEFT / AOV & BASKET DENSITY): سلوك إنفاق الزائر والسلة       */}
      {/* ===================================================================== */}
      <section className="flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm ring-1 ring-slate-900/5 backdrop-blur-md transition hover:border-slate-300 dark:border-zinc-800/80 dark:bg-zinc-900/80 dark:ring-white/10 dark:hover:border-zinc-700">
        <div>
          {/* Header */}
          <div className="flex items-start justify-between border-b border-slate-100 pb-3 dark:border-zinc-800/80">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-100">
                سلوك إنفاق الزائر والسلة (Customer Behavior)
              </h3>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
                تحليل متوسط قيمة المعاملة ومعدل كثافة الأصناف المشتراة في كل عملية
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600 dark:bg-zinc-800 dark:text-zinc-300">
              مؤشر القيمة
            </span>
          </div>

          {/* Sub-Metrics 2-Box Split */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 py-4">
            {/* Box A: Average Order Value */}
            <div className="flex flex-col justify-between rounded-lg border border-slate-200/70 bg-slate-50/70 p-3.5 dark:border-zinc-800/70 dark:bg-zinc-950/50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                  متوسط إنفاق الزائر (AOV)
                </span>
                <CreditCard className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="mt-3 flex items-end justify-between">
                <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white font-mono tabular-nums">
                  <Money value={avgSpend} symbolClassName="text-xs opacity-60 font-normal mr-1 select-none" />
                </div>
                {/* Decorative CSS Sparkline */}
                <div className="flex items-end gap-1 pb-1" title="نشاط مؤشر الإنفاق" aria-hidden="true">
                  <span className="w-1.5 h-3 bg-emerald-500/30 rounded-t-sm" />
                  <span className="w-1.5 h-5 bg-emerald-500/50 rounded-t-sm" />
                  <span className="w-1.5 h-4 bg-emerald-500/40 rounded-t-sm" />
                  <span className="w-1.5 h-7 bg-emerald-500/70 rounded-t-sm" />
                  <span className="w-1.5 h-6 bg-emerald-500 rounded-t-sm" />
                </div>
              </div>
              <p className="mt-2 text-[11px] font-medium text-slate-500 dark:text-zinc-400">
                متوسط الإيراد لكل شيك / زائر
              </p>
            </div>

            {/* Box B: Basket Density (كثافة السلة) */}
            <div className="flex flex-col justify-between rounded-lg border border-slate-200/70 bg-slate-50/70 p-3.5 dark:border-zinc-800/70 dark:bg-zinc-950/50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                  كثافة السلة (Basket Density)
                </span>
                <ShoppingBag className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="mt-3 flex items-baseline gap-1.5">
                <span
                  className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white font-mono tabular-nums"
                  dir="ltr"
                >
                  {basketDensity}
                </span>
                <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">
                  صنف / شيك
                </span>
              </div>
              <p className="mt-2 text-[11px] font-medium text-slate-500 dark:text-zinc-400">
                إجمالي {fmtInt(totalUnits)} قطعة ÷ {fmtInt(totalOrders)} شيك
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] text-slate-500 dark:border-zinc-800/80 dark:text-zinc-400">
          <span>معدل تنوع وكثافة الشراء في العملية الواحدة</span>
          {guests > 0 ? (
            <span className="font-mono tabular-nums">
              إجمالي الزوار المقدر: {fmtInt(guests)} زائر
            </span>
          ) : (
            <span className="font-mono tabular-nums text-emerald-600 dark:text-emerald-400 font-semibold">
              مؤشر سلة مرتفع
            </span>
          )}
        </div>
      </section>

      {/* ===================================================================== */}
      {/* COLUMN 2 (RIGHT / PAYMENT BREAKDOWN): تحصيل الإيرادات وطرق الدفع       */}
      {/* ===================================================================== */}
      <section className="flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm ring-1 ring-slate-900/5 backdrop-blur-md transition hover:border-slate-300 dark:border-zinc-800/80 dark:bg-zinc-900/80 dark:ring-white/10 dark:hover:border-zinc-700">
        <div>
          {/* Header */}
          <div className="flex items-start justify-between border-b border-slate-100 pb-3 dark:border-zinc-800/80">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-100">
                تحصيل الإيرادات (Payment Channels)
              </h3>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
                توزيع قنوات السداد المحصلة نقدياً وعبر نقاط البيع الإلكترونية (POS)
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600 dark:bg-zinc-800 dark:text-zinc-300 font-mono tabular-nums">
              مطابقة 100%
            </span>
          </div>

          <div className="py-4 space-y-3.5">
            {/* Visual Distribution Progress Bar */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span>نقدي: {cashPct.toFixed(1)}%</span>
                </span>
                <span className="flex items-center gap-1.5 text-indigo-700 dark:text-indigo-400">
                  <span>فيزا / نقاط بيع: {visaPct.toFixed(1)}%</span>
                  <span className="h-2 w-2 rounded-full bg-indigo-500" />
                </span>
              </div>

              <div
                className="h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-950 flex"
                dir="ltr"
              >
                <div
                  style={{ width: `${cashPct}%` }}
                  className="bg-emerald-500 transition-all duration-500"
                  title={`نقدي: ${cashPct.toFixed(1)}%`}
                />
                <div
                  style={{ width: `${visaPct}%` }}
                  className="bg-indigo-500 transition-all duration-500"
                  title={`فيزا وبطاقات: ${visaPct.toFixed(1)}%`}
                />
              </div>
            </div>

            {/* Micro Cards: Cash vs Visa */}
            <div className="grid grid-cols-2 gap-3">
              {/* Cash Box */}
              <div className="rounded-lg border border-slate-200/70 bg-emerald-50/40 p-3 dark:border-emerald-500/20 dark:bg-emerald-950/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                    النقدية (Cash)
                  </span>
                  <Banknote className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="mt-2 text-xl font-extrabold text-zinc-900 dark:text-white font-mono tabular-nums">
                  <Money value={totalCash} symbolClassName="text-xs opacity-60 font-normal mr-1 select-none" />
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400 font-mono">
                  <span>الحصة:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {cashPct.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Visa / POS Box */}
              <div className="rounded-lg border border-slate-200/70 bg-indigo-50/40 p-3 dark:border-indigo-500/20 dark:bg-indigo-950/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                    الفيزا والائتمان
                  </span>
                  <CreditCard className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="mt-2 text-xl font-extrabold text-zinc-900 dark:text-white font-mono tabular-nums">
                  <Money value={totalVisa} symbolClassName="text-xs opacity-60 font-normal mr-1 select-none" />
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400 font-mono">
                  <span>الحصة:</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">
                    {visaPct.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] text-slate-500 dark:border-zinc-800/80 dark:text-zinc-400">
          <span>إجمالي التدفق المالي المحقق</span>
          <span className="font-mono font-bold text-zinc-900 dark:text-white">
            {fmtMoney(totalSales)}
          </span>
        </div>
      </section>
    </div>
  );
}

export default CustomerBehaviorRow;
