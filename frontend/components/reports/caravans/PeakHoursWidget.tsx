'use client';

import React, { useState } from 'react';
import { Clock, Flame, Ticket, Sparkles } from 'lucide-react';
import type { HourlyTrafficSummary } from '@/types/reports';
import { fmtMoney, fmtInt, useIsDark } from './charts';

interface PeakHoursWidgetProps {
  data: HourlyTrafficSummary | null | undefined;
  loading?: boolean;
}

type ViewMode = 'combined' | 'revenue' | 'gate' | 'orders';

export function PeakHoursWidget({ data, loading = false }: PeakHoursWidgetProps) {
  const [mode, setMode] = useState<ViewMode>('combined');
  const dark = useIsDark();

  if (loading) {
    return (
      <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/5 dark:bg-[#18181b]">
        <div className="flex items-center justify-between">
          <div className="h-5 w-48 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
          <div className="h-8 w-24 animate-pulse rounded-full bg-slate-100 dark:bg-slate-800" />
        </div>
        <div className="my-8 flex h-44 items-end justify-between gap-2 px-2">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="w-full animate-pulse rounded-t bg-slate-100 dark:bg-slate-800"
              style={{ height: `${20 + ((i * 17) % 70)}%` }}
            />
          ))}
        </div>
        <div className="h-14 w-full animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
      </div>
    );
  }

  const points = data?.points ?? [];
  const maxRevenue = Math.max(1, ...points.map((p) => p.revenue));
  const maxOrders = Math.max(1, ...points.map((p) => p.orders));
  const maxGate = Math.max(1, ...points.map((p) => p.gateTickets ?? p.guests ?? 0));

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition dark:border-white/5 dark:bg-[#18181b]/95">
      {/* Header & Controls */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-50 text-orange-600 border border-orange-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20">
              <Clock className="h-4 w-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">ساعات الذروة التشغيلية وحركة بوابات الدخول</h3>

            {/* Peak Sales Badge */}
            {data?.peakHourLabel && (
              <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200 dark:bg-violet-500/10 dark:text-violet-300 dark:border-violet-500/20">
                <Flame className="h-3 w-3" />
                ذروة المبيعات: {data.peakHourLabel}
              </span>
            )}

            {/* Peak Gate Badge */}
            {data?.peakGateHourLabel && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20 px-2.5 py-0.5 text-xs font-semibold">
                <Ticket className="h-3 w-3" />
                ذروة الدخول: {data.peakGateHourLabel}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            مقارنة تدفق دخول الزوار من البوابات مع أوقات تسارع مبيعات الكرافانات والمطاعم لضبط التشغيل
          </p>
        </div>

        {/* View Mode Toggle (Flat solid tabs) */}
        <div className="inline-flex flex-wrap rounded-xl bg-slate-100 p-1 border border-slate-200 self-start lg:self-auto gap-0.5 dark:bg-slate-800/90 dark:border-slate-700/60">
          <button
            onClick={() => setMode('combined')}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
              mode === 'combined'
                ? 'bg-orange-600 text-white shadow-sm dark:bg-[#c4b5fd] dark:text-black font-medium'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            الدخول والإنفاق معا
          </button>
          <button
            onClick={() => setMode('revenue')}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
              mode === 'revenue'
                ? 'bg-orange-600 text-white shadow-sm dark:bg-[#c4b5fd] dark:text-black font-medium'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            المبيعات (ج.م)
          </button>
          <button
            onClick={() => setMode('gate')}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
              mode === 'gate'
                ? 'bg-amber-600 text-white shadow-sm dark:bg-amber-500 dark:text-black font-medium'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            البوابات (تذاكر)
          </button>
          <button
            onClick={() => setMode('orders')}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
              mode === 'orders'
                ? 'bg-blue-600 text-white shadow-sm dark:bg-blue-500 dark:text-white font-medium'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            الطلبات
          </button>
        </div>
      </div>

      {/* Chart Legend (for combined mode) */}
      {mode === 'combined' && (
        <div className="mt-3 flex items-center gap-4 text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-xs ${dark ? 'bg-[#c4b5fd]' : 'bg-[#f97316]'}`} />
            <span>مبيعات الكرافانات</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-xs bg-amber-500" />
            <span>دخول بوابات الحديقة</span>
          </div>
        </div>
      )}

      {/* Hourly Chart Canvas */}
      {points.length === 0 ? (
        <div className="flex h-44 items-center justify-center text-xs text-slate-400">
          لا توجد بيانات ساعات مسجلة في هذه الفترة
        </div>
      ) : (
        <div className="mt-6 mb-2">
          <div className="flex h-40 items-end justify-between gap-1 sm:gap-2 px-1">
            {points.map((p) => {
              const revPct = Math.max(4, Math.round((p.revenue / maxRevenue) * 100));
              const gatePct = Math.max(4, Math.round(((p.gateTickets ?? 0) / maxGate) * 100));
              const ordPct = Math.max(4, Math.round((p.orders / maxOrders) * 100));

              return (
                <div key={p.hour} className="group relative flex flex-1 flex-col items-center">
                  {/* Tooltip on Hover */}
                  <div className="pointer-events-none absolute -top-20 z-30 hidden -translate-x-1/2 flex-col items-center group-hover:flex">
                    <div className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-center shadow-xl dark:border-slate-700 dark:bg-slate-900/95 backdrop-blur-md">
                      <div className="text-[11px] font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-1 mb-1">{p.label}</div>
                      <div className="space-y-0.5 text-right text-[10px]">
                        <div className="flex items-center justify-between gap-3 text-orange-600 dark:text-[#c4b5fd]">
                          <span>المبيعات:</span>
                          <span className="font-bold font-mono" dir="ltr">{fmtMoney(p.revenue)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3 text-amber-600 dark:text-amber-400">
                          <span>تذاكر البوابات:</span>
                          <span className="font-bold font-mono" dir="ltr">{fmtInt(p.gateTickets ?? 0)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3 text-blue-600 dark:text-blue-400">
                          <span>الطلبات:</span>
                          <span className="font-bold font-mono" dir="ltr">{fmtInt(p.orders)} طلب</span>
                        </div>
                      </div>
                    </div>
                    <div className="h-1.5 w-1.5 rotate-45 border-b border-r border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900" />
                  </div>

                  {/* Columns (Strictly Solid Colors, No Gradients) */}
                  <div className="relative flex w-full items-end justify-center gap-0.5 h-32">
                    {mode === 'combined' ? (
                      <>
                        {/* Gate Admissions Track (Amber) */}
                        <div
                          style={{ height: `${gatePct}%` }}
                          className={`w-1/2 rounded-t-xs transition-all duration-300 ${
                            p.isGatePeak
                              ? 'bg-amber-500'
                              : 'bg-amber-400/80 hover:bg-amber-500'
                          }`}
                        />
                        {/* Caravan Sales Track (Solid Orange in Light, Lavender in Dark) */}
                        <div
                          style={{ height: `${revPct}%` }}
                          className={`w-1/2 rounded-t-xs transition-all duration-300 ${
                            p.isPeak
                              ? dark
                                ? 'bg-[#c4b5fd]'
                                : 'bg-[#f97316]'
                              : dark
                                ? 'bg-[#8b5cf6]/80 hover:bg-[#8b5cf6]'
                                : 'bg-orange-500/80 hover:bg-orange-500'
                          }`}
                        />
                      </>
                    ) : mode === 'revenue' ? (
                      <div
                        style={{ height: `${revPct}%` }}
                        className={`w-full rounded-t-md transition-all duration-300 ${
                          p.isPeak
                            ? dark
                              ? 'bg-[#c4b5fd]'
                              : 'bg-[#f97316]'
                            : revPct > 40
                            ? dark
                              ? 'bg-[#8b5cf6]'
                              : 'bg-orange-600'
                            : 'bg-slate-200 hover:bg-slate-300 dark:bg-slate-700/80 dark:hover:bg-slate-600'
                        }`}
                      />
                    ) : mode === 'gate' ? (
                      <div
                        style={{ height: `${gatePct}%` }}
                        className={`w-full rounded-t-md transition-all duration-300 ${
                          p.isGatePeak
                            ? 'bg-amber-500'
                            : gatePct > 40
                            ? 'bg-amber-600'
                            : 'bg-slate-200 hover:bg-slate-300 dark:bg-slate-700/80 dark:hover:bg-slate-600'
                        }`}
                      />
                    ) : (
                      <div
                        style={{ height: `${ordPct}%` }}
                        className={`w-full rounded-t-md transition-all duration-300 ${
                          ordPct > 50
                            ? 'bg-blue-600'
                            : 'bg-slate-200 hover:bg-slate-300 dark:bg-slate-700/80 dark:hover:bg-slate-600'
                        }`}
                      />
                    )}
                  </div>

                  {/* Hour Label */}
                  <span
                    className={`mt-2 text-[10px] font-medium tabular-nums ${
                      p.isPeak || p.isGatePeak ? 'font-bold text-orange-600 dark:text-amber-300' : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {p.hour > 12 ? `${p.hour - 12}م` : `${p.hour}ص`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Staffing & Operational Recommendation Banner */}
      <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-white/5 dark:bg-zinc-950">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-orange-600 dark:bg-white/5 dark:text-[#c4b5fd]">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 dark:text-white">رؤية تشغيلية لإدارة الأغذية والمشروبات (F&amp;B):</span>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
              نافذة ذروة المبيعات تتركز في الفترة (<span className="text-orange-600 dark:text-[#c4b5fd] font-semibold">{data?.recommendedStaffingWindow || '5:00 م — 9:00 م'}</span>)
              {data?.peakGateHourLabel && data?.peakHourLabel ? (
                <> بعد ذروة دخول البوابات في <span className="text-amber-600 dark:text-amber-300 font-semibold">{data.peakGateHourLabel}</span>، مما يمنح المطاعم متسعاً لتجهيز أطقم الخدمة ومضاعفة خطوط التحضير.</>
              ) : (
                <>، يوصى بتكثيف أطقم الخدمة لمواكبة زيادة تدفق الزوار.</>
              )}
            </p>
          </div>
        </div>

        {data?.peakRevenue ? (
          <div className="shrink-0 text-left self-end sm:self-auto border-t sm:border-t-0 sm:border-r border-slate-200 dark:border-white/5 pt-2 sm:pt-0 sm:pr-3">
            <div className="text-[10px] text-slate-500 dark:text-slate-400">إيراد ساعة الذروة</div>
            <div className="text-sm font-extrabold text-orange-600 dark:text-amber-400 font-mono" dir="ltr">
              {fmtMoney(data.peakRevenue)}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
