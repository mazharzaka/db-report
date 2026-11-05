'use client';

import React, { useMemo } from 'react';
import { ShieldAlert, AlertTriangle, ChevronLeft } from 'lucide-react';
import type { CaravanRecord } from '@/types/reports';
import { fmtInt, fmtMoney } from './charts';

interface VoidsAlertWidgetProps {
  rows: CaravanRecord[];
  className?: string;
}

export function VoidsAlertWidget({ rows, className = '' }: VoidsAlertWidgetProps) {
  // تصفية المنافذ التي تحتوي على مبالغ مرتجعات فعلية أكبر من صفر
  const branchesWithVoids = useMemo(() => {
    return rows
      .filter((r) => (Number(r.totalVoids) || 0) > 0)
      .sort((a, b) => (Number(b.totalVoids) || 0) - (Number(a.totalVoids) || 0));
  }, [rows]);

  // =========================================================================
  // شرط صارم: إذا كانت المرتجعات = 0 لكافة المنافذ، لا يتم رسم المكون نهائياً
  // =========================================================================
  if (branchesWithVoids.length === 0) {
    return null;
  }

  // حساب إجماليات المرتجعات للمنافذ المتأثرة
  const totalVoidAmount = branchesWithVoids.reduce((acc, r) => acc + (Number(r.totalVoids) || 0), 0);
  const totalVoidCount = branchesWithVoids.reduce((acc, r) => acc + (Number(r.voidCount) || 0), 0);
  const totalSalesOfAffected = branchesWithVoids.reduce((acc, r) => acc + (Number(r.total) || 0), 0);
  const overallVoidRatio = totalSalesOfAffected > 0 ? (totalVoidAmount / totalSalesOfAffected) * 100 : 0;

  return (
    <section
      aria-label="تنبيه الرقابة المالية للمرتجعات"
      className={`rounded-2xl border border-rose-200 bg-rose-50/70 p-4 shadow-xs transition-colors dark:border-rose-900/40 dark:bg-rose-950/20 print:border-black print:bg-transparent print:p-2 print:break-inside-avoid ${className}`}
    >
      {/* Header Block */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between border-b border-rose-200/80 pb-3 dark:border-rose-900/40 print:border-b print:border-black">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-xl bg-rose-600/10 p-2 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300 print:text-black print:p-0">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-rose-950 dark:text-rose-100 print:text-black">
                تنبيه الرقابة المالية: رصد مرتجعات وإلغاءات نشطة (Active Voids Alert)
              </h3>
              <span className="inline-flex items-center rounded-full bg-rose-100 px-2.5 py-0.5 text-[11px] font-bold text-rose-800 dark:bg-rose-900/50 dark:text-rose-200 print:hidden">
                {branchesWithVoids.length} منفذ متأثر
              </span>
            </div>
            <p className="mt-0.5 text-xs text-rose-800/80 dark:text-rose-300/80 print:text-black">
              يُعرض هذا التنبيه لوجود عمليات إلغاء/مرتجع تتطلب تدقيقاً ومطابقة مع أذونات الإلغاء المعتمدة للكاشير.
            </p>
          </div>
        </div>

        {/* Aggregated KPI Badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <div className="rounded-lg bg-white/90 border border-rose-200 px-3 py-1 text-rose-900 dark:bg-zinc-900 dark:border-rose-900/40 dark:text-rose-200 print:border-black print:bg-transparent print:text-black">
            <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-sans ml-1">إجمالي المرتجعات:</span>
            <span className="font-extrabold">{fmtMoney(totalVoidAmount)}</span>
          </div>
          {totalVoidCount > 0 && (
            <div className="rounded-lg bg-white/90 border border-rose-200 px-3 py-1 text-rose-900 dark:bg-zinc-900 dark:border-rose-900/40 dark:text-rose-200 print:border-black print:bg-transparent print:text-black">
              <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-sans ml-1">عدد الإلغاءات:</span>
              <span className="font-bold">{fmtInt(totalVoidCount)} عملية</span>
            </div>
          )}
          <div className="rounded-lg bg-white/90 border border-rose-200 px-3 py-1 text-rose-900 dark:bg-zinc-900 dark:border-rose-900/40 dark:text-rose-200 print:border-black print:bg-transparent print:text-black">
            <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-sans ml-1">نسبة الهدر:</span>
            <span className="font-bold">{overallVoidRatio.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* Mini Voids Table */}
      <div className="mt-3 overflow-x-auto">
        <table className="w-full border-collapse text-xs text-right print:w-full">
          <thead>
            <tr className="border-b border-rose-200/60 text-rose-900/80 dark:border-rose-900/30 dark:text-rose-300/80 print:border-b print:border-black print:text-black">
              <th className="py-2 pr-2 font-bold">كود</th>
              <th className="py-2 px-3 font-bold">المنفذ / الكرافان</th>
              <th className="py-2 px-3 font-bold text-center">عدد الإلغاءات</th>
              <th className="py-2 px-3 font-bold text-left" dir="ltr">قيمة المرتجعات (Voids)</th>
              <th className="py-2 px-3 font-bold text-left" dir="ltr">إجمالي المبيعات</th>
              <th className="py-2 px-3 font-bold text-center">نسبة الإلغاء</th>
              <th className="py-2 pl-2 font-bold text-left" dir="ltr">فارق التسوية (Variance)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rose-200/40 dark:divide-rose-900/20 print:divide-slate-300">
            {branchesWithVoids.map((b) => {
              const bVoid = Number(b.totalVoids) || 0;
              const bTotal = Number(b.total) || 0;
              const bRatio = bTotal > 0 ? (bVoid / bTotal) * 100 : 0;
              const bVariance = Math.round((Number(b.variance) || 0) * 100) / 100;

              return (
                <tr
                  key={b.branchCode}
                  className="transition-colors hover:bg-rose-100/50 dark:hover:bg-rose-900/10"
                >
                  <td className="py-2 pr-2 font-mono text-slate-600 dark:text-zinc-400 print:text-black">
                    #{b.branchCode}
                  </td>
                  <td className="py-2 px-3 font-bold text-slate-900 dark:text-white print:text-black">
                    {b.name}
                  </td>
                  <td className="py-2 px-3 text-center font-mono font-semibold text-slate-700 dark:text-zinc-300 print:text-black">
                    {b.voidCount ? fmtInt(b.voidCount) : '—'}
                  </td>
                  <td className="py-2 px-3 font-mono font-extrabold text-rose-700 dark:text-rose-300 text-left print:text-black" dir="ltr">
                    {fmtMoney(bVoid)}
                  </td>
                  <td className="py-2 px-3 font-mono text-slate-700 dark:text-zinc-300 text-left print:text-black" dir="ltr">
                    {fmtMoney(bTotal)}
                  </td>
                  <td className="py-2 px-3 text-center font-mono font-semibold">
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded text-[11px] ${
                        bRatio >= 5
                          ? 'bg-rose-200/80 text-rose-900 dark:bg-rose-900/60 dark:text-rose-200 print:border print:border-black print:bg-transparent'
                          : 'bg-rose-100/60 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 print:bg-transparent'
                      }`}
                    >
                      {bRatio.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-2 pl-2 text-left" dir="ltr">
                    {Math.abs(bVariance) < 0.005 ? (
                      <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 print:text-black text-xs">
                        0.00 ✓
                      </span>
                    ) : bVariance < 0 ? (
                      <span className="inline-flex items-center gap-1 font-mono font-extrabold text-red-700 dark:text-red-300 text-xs print:text-black">
                        <span className="print:hidden">{fmtMoney(bVariance)}</span>
                        <span className="hidden print:inline">({fmtMoney(Math.abs(bVariance))}) عجز</span>
                        <span className="text-[10px] font-sans px-1 rounded bg-red-100 dark:bg-red-900/60 text-red-800 dark:text-red-200 print:hidden">
                          عجز
                        </span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-mono font-bold text-amber-800 dark:text-amber-200 text-xs print:text-black">
                        <span className="print:hidden">+{fmtMoney(bVariance)}</span>
                        <span className="hidden print:inline">+{fmtMoney(bVariance)} زيادة</span>
                        <span className="text-[10px] font-sans px-1 rounded bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 print:hidden">
                          زيادة
                        </span>
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="border-t border-rose-300 font-bold dark:border-rose-800 print:border-t-2 print:border-black">
            <tr>
              <td colSpan={2} className="py-2 pr-2 text-rose-950 dark:text-rose-100 print:text-black">
                إجمالي المنافذ المتأثرة
              </td>
              <td className="py-2 px-3 text-center font-mono text-rose-950 dark:text-rose-100 print:text-black">
                {totalVoidCount > 0 ? fmtInt(totalVoidCount) : '—'}
              </td>
              <td className="py-2 px-3 font-mono font-extrabold text-rose-700 dark:text-rose-300 text-left print:text-black" dir="ltr">
                {fmtMoney(totalVoidAmount)}
              </td>
              <td className="py-2 px-3 font-mono text-slate-800 dark:text-zinc-200 text-left print:text-black" dir="ltr">
                {fmtMoney(totalSalesOfAffected)}
              </td>
              <td className="py-2 px-3 text-center font-mono text-rose-900 dark:text-rose-200 print:text-black">
                {overallVoidRatio.toFixed(1)}%
              </td>
              <td className="py-2 pl-2 text-left text-slate-500 font-mono text-xs print:text-black" dir="ltr">
                —
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}

