'use client';

import React, { useState } from 'react';
import { AlertTriangle, Crown, PackageX, TrendingDown, Trophy, Users } from 'lucide-react';
import type { CaptureStats, DuelSide, ItemMetric, ItemMode, TopItem } from '@/types/reports';
import { fmtInt, fmtMoney } from './charts';

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
}: TopItemsProps) {
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
    <section className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {/* ---------- Header: Tabs & Mode Switcher ---------- */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {/* Main Tab Toggle: Best vs Slow-Moving */}
          <div
            role="tablist"
            aria-label="نوع تحليل الأصناف"
            className="inline-flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800"
          >
            <button
              role="tab"
              aria-selected={!isSlow}
              onClick={() => handleModeChange('best')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all duration-200 ${
                !isSlow
                  ? 'bg-white text-emerald-700 shadow dark:bg-slate-700 dark:text-emerald-300'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Trophy className={`h-3.5 w-3.5 ${!isSlow ? 'text-amber-500' : 'text-slate-400'}`} />
              <span>الأفضل مبيعاً (Top 5)</span>
            </button>
            <button
              role="tab"
              aria-selected={isSlow}
              onClick={() => handleModeChange('slow')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all duration-200 ${
                isSlow
                  ? 'bg-white text-rose-700 shadow dark:bg-slate-700 dark:text-rose-300'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <PackageX className={`h-3.5 w-3.5 ${isSlow ? 'text-rose-500' : 'text-slate-400'}`} />
              <span>الأصناف الراكدة (Dead Stock)</span>
            </button>
          </div>
          <p className="mt-1.5 text-xs text-slate-400">{scopeLabel}</p>
        </div>

        {/* Metric Selector Toggle (Revenue vs Quantity) */}
        <div
          role="tablist"
          aria-label="معيار الترتيب"
          className="flex shrink-0 items-center gap-1 self-start rounded-full bg-slate-100 p-1 dark:bg-slate-800"
        >
          {([
            { id: 'revenue', label: 'القيمة' },
            { id: 'quantity', label: 'الكمية' },
          ] as { id: ItemMetric; label: string }[]).map((o) => (
            <button
              key={o.id}
              role="tab"
              aria-selected={metric === o.id}
              onClick={() => onMetricChange(o.id)}
              className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-all duration-200 ${
                metric === o.id
                  ? isSlow
                    ? 'bg-white text-rose-700 shadow-sm dark:bg-slate-700 dark:text-rose-300'
                    : 'bg-white text-emerald-700 shadow-sm dark:bg-slate-700 dark:text-emerald-300'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* ---------- Content / Items List ---------- */}
      {displayedItems.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center py-10 text-center text-sm text-slate-400">
          {loading ? (
            <div className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
              <span>جاري التحميل...</span>
            </div>
          ) : isSlow ? (
            <div className="space-y-1">
              <p className="font-semibold text-slate-600 dark:text-slate-300">لا توجد أصناف راكدة</p>
              <p className="text-xs text-slate-400">جميع الأصناف النشطة تحركت بشكل جيد خلال هذه الفترة</p>
            </div>
          ) : (
            'لا توجد أصناف في هذه الفترة'
          )}
        </div>
      ) : (
        <ol className={`space-y-3.5 transition-opacity ${loading ? 'opacity-60' : ''}`}>
          {displayedItems.map((it, idx) => {
            const value = metric === 'revenue' ? it.revenue : it.qty;
            const isZeroSold = it.qty === 0;

            return (
              <li
                key={`${it.itemCode}-${idx}`}
                className={`rounded-xl p-2.5 transition-colors ${
                  isSlow
                    ? 'bg-rose-50/40 hover:bg-rose-50/80 dark:bg-rose-950/10 dark:hover:bg-rose-950/20'
                    : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[10px] font-bold tabular-nums ${
                        isSlow
                          ? isZeroSold
                            ? 'bg-rose-500 text-white shadow-sm'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                          : idx === 0
                          ? 'bg-emerald-500 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <span className="truncate font-semibold text-slate-800 dark:text-slate-100">
                      {it.itemName}
                    </span>
                  </div>

                  {isSlow ? (
                    isZeroSold ? (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700 dark:bg-rose-900/50 dark:text-rose-300">
                        <AlertTriangle className="h-3 w-3" />
                        راكد تماماً (0)
                      </span>
                    ) : (
                      <span className="shrink-0 text-xs font-semibold tabular-nums text-amber-600 dark:text-amber-400" dir="ltr">
                        {it.share.toFixed(1)}%
                      </span>
                    )
                  ) : (
                    <span className="shrink-0 text-xs font-semibold tabular-nums text-emerald-600 dark:text-emerald-400" dir="ltr">
                      {it.share.toFixed(1)}%
                    </span>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ease-out ${
                      isSlow
                        ? isZeroSold
                          ? 'w-1 bg-rose-300 dark:bg-rose-700'
                          : 'bg-gradient-to-r from-amber-400 to-rose-400'
                        : idx === 0
                        ? 'bg-gradient-to-r from-emerald-400 to-emerald-600'
                        : 'bg-gradient-to-r from-cyan-400 to-emerald-500/80'
                    }`}
                    style={{
                      width: isZeroSold ? '4px' : `${Math.max(4, (value / maxValue) * 100)}%`,
                    }}
                  />
                </div>

                {/* Details Footer */}
                <div className="mt-1.5 flex items-center justify-between text-[11px] tabular-nums text-slate-400">
                  <span>الكمية: {fmtInt(it.qty)} وحدة</span>
                  <span dir="ltr" className="font-medium text-slate-600 dark:text-slate-300">
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

function DuelColumn({ side, winner, tone }: { side: DuelSide; winner: boolean; tone: 'emerald' | 'cyan' }) {
  const accent = tone === 'emerald' ? 'text-emerald-600 dark:text-emerald-400' : 'text-cyan-600 dark:text-cyan-400';
  return (
    <div className="min-w-0 flex-1 space-y-3">
      <div className="flex items-center gap-1.5">
        {winner && <Crown className="h-4 w-4 shrink-0 text-amber-500" />}
        <h4 className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">{side.name}</h4>
      </div>
      <div>
        <p className="text-[11px] text-slate-400">صافي الإيراد</p>
        <p className={`text-lg font-extrabold tabular-nums ${accent}`} dir="ltr" style={{ textAlign: 'right' }}>{fmtMoney(side.revenue)}</p>
      </div>
      <dl className="space-y-1.5 text-xs tabular-nums">
        <div className="flex justify-between"><dt className="text-slate-400">عدد الشيكات</dt><dd className="font-semibold text-slate-700 dark:text-slate-200">{fmtInt(side.orders)}</dd></div>
        <div className="flex justify-between"><dt className="text-slate-400">متوسط الفاتورة</dt><dd className="font-semibold text-slate-700 dark:text-slate-200" dir="ltr">{fmtMoney(side.avgTicket)}</dd></div>
        <div className="flex justify-between gap-2">
          <dt className="shrink-0 text-slate-400">الصنف المميز</dt>
          <dd className="truncate font-semibold text-slate-700 dark:text-slate-200">{side.signature?.itemName ?? '—'}</dd>
        </div>
      </dl>
    </div>
  );
}

export function DuelCard({ duel, loading }: { duel: { a: DuelSide; b: DuelSide } | null; loading: boolean }) {
  return (
    <section className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4">
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">مواجهة المتصدّرَين</h3>
        <p className="mt-0.5 text-xs text-slate-400">أعلى منفذين إيراداً خلال الفترة</p>
      </div>

      {!duel ? (
        <div className="flex flex-1 items-center justify-center py-10 text-sm text-slate-400">
          {loading ? 'جاري التحميل...' : 'يلزم منفذان على الأقل للمقارنة'}
        </div>
      ) : (
        <div className={`transition-opacity ${loading ? 'opacity-60' : ''}`}>
          <div className="flex items-stretch gap-4">
            <DuelColumn side={duel.a} winner tone="emerald" />
            <div className="flex flex-col items-center justify-center">
              <div className="h-full w-px bg-slate-200 dark:bg-slate-700" />
              <span className="my-2 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">VS</span>
              <div className="h-full w-px bg-slate-200 dark:bg-slate-700" />
            </div>
            <DuelColumn side={duel.b} winner={false} tone="cyan" />
          </div>

          <div className="mt-5">
            <div className="mb-1.5 flex justify-between text-xs font-semibold tabular-nums" dir="ltr">
              <span className="text-emerald-600 dark:text-emerald-400">{duel.a.share.toFixed(1)}%</span>
              <span className="text-cyan-600 dark:text-cyan-400">{duel.b.share.toFixed(1)}%</span>
            </div>
            <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800" dir="ltr">
              <div className="h-full bg-emerald-500 transition-all duration-700" style={{ width: `${duel.a.share}%` }} />
              <div className="h-full bg-cyan-500 transition-all duration-700" style={{ width: `${duel.b.share}%` }} />
            </div>
            <p className="mt-1.5 text-center text-[11px] text-slate-400">حصة كل منفذ من إجمالي المنفذين</p>
          </div>
        </div>
      )}
    </section>
  );
}

/* ------------------------------ Park capture rate ------------------------------ */

export function CaptureRateCard({ capture, loading }: { capture: CaptureStats | null; loading: boolean }) {
  return (
    <section className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-sm">
          <Users className="h-6 w-6 text-white" />
        </div>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
          إنفاق الزائر
        </span>
      </div>

      <div className={`mt-4 transition-opacity ${loading ? 'opacity-60' : ''}`}>
        <p className="text-sm text-slate-500 dark:text-slate-400">متوسط إنفاق الزائر في المطاعم والكرفانات</p>
        <p className="mt-1 text-2xl font-extrabold tabular-nums text-slate-900 dark:text-white" dir="ltr" style={{ textAlign: 'right' }}>
          {fmtMoney(capture?.spendPerGuest ?? 0)}
        </p>
      </div>

      <dl className="mt-4 space-y-2.5 border-t border-slate-100 pt-4 text-sm tabular-nums dark:border-slate-800">
        <div className="flex items-center justify-between">
          <dt className="text-slate-500 dark:text-slate-400">إجمالي الزوار</dt>
          <dd className="font-semibold text-slate-800 dark:text-slate-100">{fmtInt(capture?.guests ?? 0)}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-slate-500 dark:text-slate-400">صافي إيراد المنافذ</dt>
          <dd className="font-semibold text-slate-800 dark:text-slate-100" dir="ltr">{fmtMoney(capture?.caravanRevenue ?? 0)}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-slate-500 dark:text-slate-400">إجمالي المبيعات (قبل الخصم)</dt>
          <dd className="font-semibold text-slate-800 dark:text-slate-100" dir="ltr">{fmtMoney(capture?.grossRevenue ?? 0)}</dd>
        </div>
      </dl>

      <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-100 text-[11px] text-slate-400 dark:border-slate-800">
        <span>مؤشر الاستحواذ والإنفاق التقديري</span>
        <span className="inline-flex items-center gap-1.5 font-medium text-emerald-500">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          محدّث تشغيلياً
        </span>
      </div>
    </section>
  );
}
