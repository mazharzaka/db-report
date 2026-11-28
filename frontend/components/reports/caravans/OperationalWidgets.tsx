'use client';

import React, { useState } from 'react';
import { AlertTriangle, Crown, PackageX, TrendingDown, Trophy, Users } from 'lucide-react';
import type { CaptureStats, DuelSide, ItemMetric, ItemMode, TopItem } from '@/types/reports';
import { fmtInt, fmtMoney } from './charts';
import { getSectorTheme, getSectorAnalyticsCopy } from '@/lib/sectorTheme';

/* ------------------------------ Top 5 best-sellers & Slow-Moving ------------------------------ */

interface TopItemsProps {
  items: TopItem[];
  slowItems?: TopItem[];
  mode?: ItemMode;
  onModeChange?: (m: ItemMode) => void;
  metric: ItemMetric;
  onMetricChange: (m: ItemMetric) => void;
  scopeLabel: string;
  loading: boolean;
  sectorType?: number;
}

export function TopItemsWidget({
  items,
  slowItems = [],
  mode: controlledMode,
  onModeChange,
  metric,
  onMetricChange,
  scopeLabel,
  loading,
  sectorType = 4,
}: TopItemsProps) {
  const theme = getSectorTheme(sectorType);
  const copy = getSectorAnalyticsCopy(sectorType);
  const [internalMode, setInternalMode] = useState<ItemMode>('best');
  const activeMode = controlledMode ?? internalMode;

  const handleModeChange = (newMode: ItemMode) => {
    if (onModeChange) {
      onModeChange(newMode);
    } else {
      setInternalMode(newMode);
    }
  };

  const isSlow = activeMode === 'slow';
  const displayedItems = isSlow ? slowItems : items;
  const maxValue = Math.max(
    ...displayedItems.map((i) => (metric === 'revenue' ? i.revenue : i.qty)),
    1
  );

  return (
    <section className="flex h-full flex-col rounded-xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-sm ring-1 ring-slate-900/5 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-900/60 dark:ring-white/10">
      {/* ---------- Header: Tabs & Mode Switcher ---------- */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {/* Main Tab Toggle: Best vs Slow-Moving */}
          <div
            role="tablist"
            aria-label="نوع تحليل الأصناف"
            className="inline-flex rounded-full bg-slate-100 p-1 border border-slate-200 dark:bg-zinc-950 dark:border-white/5"
          >
            <button
              role="tab"
              aria-selected={!isSlow}
              onClick={() => handleModeChange('best')}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                !isSlow
                  ? `${theme.btnPrimary} text-white shadow-sm font-medium`
                  : 'text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white font-bold rounded-full'
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${!isSlow ? 'bg-white' : 'bg-slate-400 dark:bg-slate-500'}`} />
              <span>{copy.topSellersTitle}</span>
            </button>
            <button
              role="tab"
              aria-selected={isSlow}
              onClick={() => handleModeChange('slow')}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                isSlow
                  ? `${theme.btnPrimary} text-white shadow-sm font-medium`
                  : 'text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white font-bold rounded-full'
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${isSlow ? 'bg-amber-300 dark:bg-amber-400' : 'bg-slate-400 dark:bg-slate-500'}`} />
              <span>الأصناف الراكدة (Dead Stock)</span>
            </button>
          </div>
          <p className="mt-1.5 text-xs text-slate-500 dark:text-zinc-400">{scopeLabel}</p>
        </div>

        {/* Metric Selector Toggle (Revenue vs Quantity) */}
        <div
          role="tablist"
          aria-label="معيار الترتيب"
          className="flex shrink-0 items-center gap-1 self-start rounded-full bg-slate-100 p-1 border border-slate-200 dark:bg-zinc-950 dark:border-white/5"
        >
          {([
            { id: 'quantity', label: 'الكمية' },
            { id: 'revenue', label: 'القيمة' },
          ] as { id: ItemMetric; label: string }[]).map((o) => (
            <button
              key={o.id}
              role="tab"
              aria-selected={metric === o.id}
              onClick={() => onMetricChange(o.id)}
              className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition ${metric === o.id
                ? 'bg-white text-slate-900 shadow-sm dark:bg-white dark:text-black font-bold px-3 py-1 rounded-full'
                : 'text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white font-bold rounded-full px-3 py-1'
                }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* ---------- Content / Items List ---------- */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5 dark:border-white/5 dark:bg-zinc-950/60 animate-pulse"
            >
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 rounded-full bg-slate-200 dark:bg-slate-800" />
                  <div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-800" />
                </div>
                <div className="h-4 w-12 rounded bg-slate-200 dark:bg-slate-800" />
              </div>
              <div className="h-1.5 w-full rounded bg-slate-200 dark:bg-slate-800" />
              <div className="mt-2 flex items-center justify-between">
                <div className="h-3 w-20 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="h-3 w-24 rounded bg-slate-200 dark:bg-slate-800" />
              </div>
            </div>
          ))}
        </div>
      ) : displayedItems.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center py-10 text-center text-sm text-slate-400 dark:text-zinc-400">
          {isSlow ? (
            <div className="space-y-1">
              <p className="font-semibold text-slate-700 dark:text-zinc-300">لا توجد أصناف راكدة</p>
              <p className="text-xs text-slate-500 dark:text-zinc-400">كافة البنود والمنافذ سجلت حركة تشغيل خلال الفترة</p>
            </div>
          ) : (
            'لا توجد عناصر مسجلة في هذه الفترة'
          )}
        </div>
      ) : (
        <ol className="space-y-3">
          {displayedItems.map((it, idx) => {
            const value = metric === 'revenue' ? it.revenue : it.qty;
            const isZeroSold = it.qty === 0;

            return (
              <li
                key={`${it.itemCode}-${idx}`}
                className={`rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5 transition-colors duration-150 ${theme.tableRowHover} dark:border-white/5 dark:bg-zinc-950/60`}
              >
                <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-700 border border-slate-300 text-[10px] font-bold font-mono dark:bg-white/5 dark:text-zinc-300 dark:border-white/5">
                      {idx + 1}
                    </span>
                    <span className="truncate font-semibold text-slate-900 dark:text-white">
                      {it.itemName}
                    </span>
                  </div>

                  {isSlow ? (
                    isZeroSold ? (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 px-2.5 py-0.5 text-[10px] font-bold font-mono">
                        راكد (0)
                      </span>
                    ) : (
                      <span className="shrink-0 text-xs font-semibold tabular-nums font-mono text-amber-600 dark:text-amber-300" dir="ltr">
                        {(Number(it.share) || 0).toFixed(1)}%
                      </span>
                    )
                  ) : (
                    <span className={`shrink-0 text-xs font-semibold tabular-nums font-mono ${theme.accentText}`} dir="ltr">
                      {(Number(it.share) || 0).toFixed(1)}%
                    </span>
                  )}
                </div>

                {/* Solid Slim Progress Track */}
                <div className="h-1.5 w-full overflow-hidden rounded bg-slate-200 dark:bg-zinc-950">
                  <div
                    className={`h-full rounded transition-all duration-300 ${
                      isSlow
                        ? isZeroSold
                          ? 'w-1 bg-amber-400/20 border border-amber-400/30'
                          : 'bg-amber-400'
                        : theme.progressBar
                    }`}
                    style={{
                      width: isZeroSold ? '4px' : `${Math.max(4, (value / maxValue) * 100)}%`,
                    }}
                  />
                </div>

                {/* Details Footer */}
                <div className="mt-2 flex items-center justify-between text-xs tabular-nums tracking-tight font-mono text-slate-500 dark:text-zinc-400">
                  <span>الكمية: <strong className="text-slate-700 dark:text-zinc-200">{fmtInt(it.qty)}</strong> {copy.volumeUnit}</span>
                  <span dir="ltr" className="font-bold text-slate-900 dark:text-white tabular-nums tracking-tight">
                    {fmtMoney(it.revenue)}
                  </span>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

/* ------------------------------ Head-to-head duel ------------------------------ */

function DuelColumn({
  side,
  winner,
  tone,
  accentClass,
  netRevLabel,
}: {
  side: DuelSide;
  winner: boolean;
  tone: 'primary' | 'slate';
  accentClass: string;
  netRevLabel: string;
}) {
  const accent = tone === 'primary' ? `${accentClass} font-mono font-medium` : 'text-slate-700 dark:text-zinc-300';
  return (
    <div className="min-w-0 flex-1 space-y-3">
      <div className="flex items-center gap-1.5">
        {winner && <Crown className="h-4 w-4 shrink-0 text-amber-500 dark:text-amber-400" />}
        <h4 className="truncate text-sm font-bold text-slate-900 dark:text-white">{side.name}</h4>
      </div>
      <div>
        <p className="text-[11px] text-slate-500 dark:text-zinc-400">{netRevLabel}</p>
        <p className={`text-lg font-extrabold tabular-nums tracking-tight font-mono ${accent}`} dir="ltr" style={{ textAlign: 'right' }}>{fmtMoney(side.revenue)}</p>
      </div>
      <dl className="space-y-1.5 text-xs tabular-nums tracking-tight">
        <div className="flex justify-between"><dt className="text-slate-500 dark:text-zinc-400">عدد العمليات / الشيكات</dt><dd className="font-semibold text-slate-700 dark:text-zinc-200 font-mono tabular-nums tracking-tight">{fmtInt(side.orders)}</dd></div>
        <div className="flex justify-between"><dt className="text-slate-500 dark:text-zinc-400">متوسط المعاملة</dt><dd className="font-semibold text-slate-700 dark:text-zinc-200 font-mono tabular-nums tracking-tight" dir="ltr">{fmtMoney(side.avgTicket)}</dd></div>
        <div className="flex justify-between gap-2">
          <dt className="shrink-0 text-slate-500 dark:text-zinc-400">البند المميز</dt>
          <dd className="truncate font-semibold text-slate-700 dark:text-zinc-200">{side.signature?.itemName ?? '—'}</dd>
        </div>
      </dl>
    </div>
  );
}

export function DuelCard({
  duel,
  loading,
  sectorType = 4,
}: {
  duel: { a: DuelSide; b: DuelSide } | null;
  loading: boolean;
  sectorType?: number;
}) {
  const theme = getSectorTheme(sectorType);
  const copy = getSectorAnalyticsCopy(sectorType);

  return (
    <section className="flex h-full flex-col rounded-xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-sm ring-1 ring-slate-900/5 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-900/60 dark:ring-white/10">
      <div className="mb-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">{copy.duelTitle}</h3>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">{copy.duelSubtitle}</p>
      </div>

      {loading ? (
        <div className="flex flex-1 flex-col justify-between py-2 animate-pulse">
          <div className="flex items-stretch gap-4">
            <div className="flex-1 space-y-3">
              <div className="h-5 w-28 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-7 w-32 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="space-y-1.5 pt-1">
                <div className="h-3.5 w-full rounded bg-slate-200 dark:bg-slate-800" />
                <div className="h-3.5 w-full rounded bg-slate-200 dark:bg-slate-800" />
                <div className="h-3.5 w-3/4 rounded bg-slate-200 dark:bg-slate-800" />
              </div>
            </div>
            <div className="flex flex-col items-center justify-center">
              <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-800" />
            </div>
            <div className="flex-1 space-y-3">
              <div className="h-5 w-28 rounded bg-slate-200 dark:bg-slate-800 ml-auto" />
              <div className="h-7 w-32 rounded bg-slate-200 dark:bg-slate-800 ml-auto" />
              <div className="space-y-1.5 pt-1">
                <div className="h-3.5 w-full rounded bg-slate-200 dark:bg-slate-800" />
                <div className="h-3.5 w-full rounded bg-slate-200 dark:bg-slate-800" />
                <div className="h-3.5 w-3/4 rounded bg-slate-200 dark:bg-slate-800 ml-auto" />
              </div>
            </div>
          </div>
          <div className="mt-5 h-2.5 w-full rounded-full bg-slate-200 dark:bg-slate-800" />
        </div>
      ) : !duel ? (
        <div className="flex flex-1 items-center justify-center py-10 text-sm text-slate-400 dark:text-zinc-400">
          يلزم وجود فرعين أو منفذين على الأقل للمقارنة
        </div>
      ) : (
        <div>
          <div className="flex items-stretch gap-4">
            <DuelColumn
              side={duel.a}
              winner
              tone="primary"
              accentClass={theme.accentText}
              netRevLabel={copy.netOutletRevLabel}
            />
            <div className="flex flex-col items-center justify-center">
              <div className="h-full w-px bg-slate-200 dark:bg-slate-700" />
              <span className="my-2 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600 dark:bg-zinc-950 dark:text-zinc-400">VS</span>
              <div className="h-full w-px bg-slate-200 dark:bg-slate-700" />
            </div>
            <DuelColumn
              side={duel.b}
              winner={false}
              tone="slate"
              accentClass={theme.accentText}
              netRevLabel={copy.netOutletRevLabel}
            />
          </div>

          <div className="mt-5">
            <div className="mb-1.5 flex justify-between text-xs font-semibold tabular-nums font-mono" dir="ltr">
              <span className={`${theme.accentText} font-mono font-medium`}>{(Number(duel.a?.share) || 0).toFixed(1)}%</span>
              <span className="text-slate-500 dark:text-zinc-400">{(Number(duel.b?.share) || 0).toFixed(1)}%</span>
            </div>
            <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-950" dir="ltr">
              <div className={`h-full ${theme.progressBar} transition-all duration-500`} style={{ width: `${duel.a.share}%` }} />
              <div className="h-full bg-slate-300 dark:bg-slate-600 transition-all duration-500" style={{ width: `${duel.b.share}%` }} />
            </div>
            <p className="mt-1.5 text-center text-[11px] text-slate-500 dark:text-zinc-400">{copy.duelShareFootnote}</p>
          </div>
        </div>
      )}
    </section>
  );
}

/* ------------------------------ Park capture rate ------------------------------ */

export function CaptureRateCard({
  capture,
  guests: directGuests,
  spendPerGuest: directSpend,
  caravanRevenue: directRevenue,
  grossRevenue: directGross,
  loading,
  sectorType = 4,
}: {
  capture?: CaptureStats | null;
  guests?: number;
  spendPerGuest?: number;
  caravanRevenue?: number;
  grossRevenue?: number;
  loading: boolean;
  sectorType?: number;
}) {
  const theme = getSectorTheme(sectorType);
  const guests = directGuests !== undefined ? Number(directGuests) : (Number(capture?.guests) || 0);
  const caravanRevenue = directRevenue !== undefined ? Number(directRevenue) : (Number(capture?.caravanRevenue) || 0);
  const grossRevenue = directGross !== undefined ? Number(directGross) : (Number(capture?.grossRevenue) || caravanRevenue);
  const avgSpend = directSpend !== undefined && directSpend > 0
    ? Number(directSpend)
    : (guests > 0 ? (caravanRevenue / guests) : (Number(capture?.spendPerGuest) || 0));

  return (
    <section className="flex h-full flex-col rounded-xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-sm ring-1 ring-slate-900/5 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-900/60 dark:ring-white/10">
      <div className="flex items-start justify-between">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${theme.iconBox}`}>
          <Users className="h-6 w-6" />
        </div>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:bg-zinc-950 dark:text-zinc-400">
          إنفاق الزائر
        </span>
      </div>

      {loading ? (
        <div className="mt-4 flex flex-1 flex-col justify-between animate-pulse">
          <div className="space-y-2">
            <div className="h-4 w-44 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-8 w-36 rounded bg-slate-200 dark:bg-slate-800" />
          </div>
          <div className="mt-4 space-y-2.5 border-t border-slate-100 pt-4 dark:border-white/5">
            <div className="h-4 w-full rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-4 w-full rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-4 w-full rounded bg-slate-200 dark:bg-slate-800" />
          </div>
          <div className="mt-auto pt-4 border-t border-slate-100 dark:border-white/5">
            <div className="h-3.5 w-48 rounded bg-slate-200 dark:bg-slate-800" />
          </div>
        </div>
      ) : (
        <>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <p className="text-sm font-bold text-slate-700 dark:text-zinc-300">متوسط إنفاق الزائر</p>
              <p className="mt-1 text-3xl font-extrabold tabular-nums tracking-tight font-mono text-slate-900 dark:text-white" dir="ltr" style={{ textAlign: 'right' }}>
                {fmtMoney(avgSpend)}
              </p>
            </div>
            {/* Subtle decorative CSS-only sparkline (mini bar chart) using Tailwind */}
            <div className="flex items-end gap-1.5 pb-1" title="نشاط المؤشر" aria-hidden="true">
              <span className="w-1.5 h-3 bg-emerald-500/30 rounded-t-sm" />
              <span className="w-1.5 h-5 bg-emerald-500/50 rounded-t-sm" />
              <span className="w-1.5 h-4 bg-emerald-500/40 rounded-t-sm" />
              <span className="w-1.5 h-7 bg-emerald-500/70 rounded-t-sm" />
              <span className="w-1.5 h-6 bg-emerald-500 rounded-t-sm" />
            </div>
          </div>

          <dl className="mt-4 space-y-2.5 border-t border-slate-100 pt-4 text-sm tabular-nums tracking-tight dark:border-white/5">
            <div className="flex items-center justify-between">
              <dt className="text-slate-500 dark:text-zinc-400">إجمالي الزوار</dt>
              <dd className="font-semibold text-slate-900 dark:text-white font-mono tabular-nums tracking-tight">{fmtInt(guests)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-slate-500 dark:text-zinc-400">صافي إيراد المحلات</dt>
              <dd className="font-semibold text-slate-900 dark:text-white" dir="ltr">{fmtMoney(caravanRevenue)}</dd>
            </div>
          </dl>

          <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-100 text-[11px] text-slate-500 dark:border-white/5 dark:text-zinc-400">
            <span>مؤشر الاستحواذ والإنفاق التقديري</span>
            <span className={`inline-flex items-center gap-1.5 font-medium ${theme.accentText}`}>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              محدّث تشغيلياً
            </span>
          </div>
        </>
      )}
    </section>
  );
}
