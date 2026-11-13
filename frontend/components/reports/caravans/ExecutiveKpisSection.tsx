'use client';

import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  Boxes,
  Receipt,
  Scale,
  ArrowUpRight,
  ArrowDownRight,
  type LucideIcon,
} from 'lucide-react';
import type {
  ExecutiveKpis,
  ExecutiveKpisResponse,
  ReportSummary,
} from '@/types/reports';
import { Sparkline, fmtInt, fmtMoney, Money, type TrendPoint } from './charts';

/* ------------------------------ Skeleton Component ------------------------------ */

export function KPIsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm ring-1 ring-slate-900/5 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-900/60 dark:ring-white/10 animate-pulse"
        >
          <div className="flex items-start justify-between">
            <div className="h-4 w-32 rounded bg-slate-200 dark:bg-zinc-800" />
            <div className="h-10 w-10 rounded-lg bg-slate-200 dark:bg-zinc-800" />
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div className="h-8 w-28 rounded-lg bg-slate-200 dark:bg-zinc-800" />
            <div className="h-5 w-14 rounded-full bg-slate-200 dark:bg-zinc-800" />
          </div>
          <div className="mt-4 h-10 w-full rounded bg-slate-200 dark:bg-zinc-800" />
          <div className="mt-3 h-3.5 w-40 rounded bg-slate-200 dark:bg-zinc-800" />
        </div>
      ))}
    </div>
  );
}

/* ------------------------------ Single KPI Card ------------------------------ */

interface KpiCardProps {
  title: string;
  value: React.ReactNode;
  icon: LucideIcon;
  spark: number[];
  sparkColor: 'emerald' | 'cyan' | 'violet';
  delta: number | null;
  badge?: string;
  badgeTone?: 'neutral' | 'success' | 'warning' | 'danger';
  footnote: string;
  loading?: boolean;
}

function KpiCard({
  title,
  value,
  icon: Icon,
  spark,
  sparkColor,
  delta,
  badge,
  badgeTone = 'neutral',
  footnote,
  loading = false,
}: KpiCardProps) {
  const isPositive = delta !== null && delta >= 0;

  let badgeClasses = 'text-slate-700 bg-slate-100 border border-slate-200 dark:text-zinc-200 dark:bg-zinc-800/80 dark:border-zinc-700';
  if (badgeTone === 'success') {
    badgeClasses = 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 shadow-xs font-mono tracking-tight';
  } else if (badgeTone === 'warning') {
    badgeClasses = 'bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30 shadow-xs font-mono tracking-tight';
  } else if (badgeTone === 'danger') {
    badgeClasses = 'bg-amber-950/80 text-amber-300 border border-amber-500/40 shadow-xs font-mono tracking-tight';
  }

  return (
    <div className="flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm ring-1 ring-slate-900/5 backdrop-blur-md transition hover:border-slate-300 dark:border-zinc-800/80 dark:bg-zinc-900/60 dark:ring-white/10 dark:hover:border-zinc-700">
      <div className="flex items-start justify-between">
        <span className="text-sm font-bold text-slate-700 dark:text-zinc-200">{title}</span>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 border border-slate-200/80 text-slate-700 dark:bg-zinc-800/80 dark:border-zinc-700/60 dark:text-zinc-300">
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-3 flex items-baseline justify-between gap-2">
        {loading ? (
          <div className="h-9 w-36 animate-pulse rounded-lg bg-slate-200 dark:bg-zinc-800" />
        ) : (
          <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white font-mono tabular-nums" dir="ltr">
            {value}
          </div>
        )}

        {loading ? (
          <div className="h-5 w-12 animate-pulse rounded-full bg-slate-200 dark:bg-zinc-800" />
        ) : badge ? (
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ${badgeClasses}`}>
            {badge}
          </span>
        ) : delta !== null ? (
          <span
            className={`inline-flex items-center gap-0.5 rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums tracking-tight border ${
              isPositive
                ? 'text-emerald-700 bg-emerald-50 border-emerald-200/80 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/20'
                : 'text-amber-700 bg-amber-50 border-amber-200/80 dark:text-amber-300 dark:bg-amber-500/10 dark:border-amber-500/20'
            }`}
            dir="ltr"
          >
            {isPositive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
            {Math.abs(delta).toFixed(1)}%
          </span>
        ) : null}
      </div>

      <div className="mt-3 h-12">
        <Sparkline data={spark.length > 1 ? spark : [0, 0]} color={sparkColor} />
      </div>
      <p className="mt-2 text-xs font-medium tabular-nums tracking-tight text-slate-600 dark:text-zinc-400">{footnote}</p>
    </div>
  );
}

/* ------------------------------ Executive KPIs Section ------------------------------ */

interface ExecutiveKpisSectionProps {
  startDate: string;
  endDate: string;
  selectedBranches: string[];
  summary?: ReportSummary | null;
  trend?: TrendPoint[];
  refreshTick?: number;
}

export function ExecutiveKpisSection({
  startDate,
  endDate,
  selectedBranches,
  summary,
  trend = [],
  refreshTick = 0,
}: ExecutiveKpisSectionProps) {
  const [kpisData, setKpisData] = useState<ExecutiveKpis | null>(null);
  const [totalUnits, setTotalUnits] = useState<number>(0);
  const [unitsGrowthPct, setUnitsGrowthPct] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const selectedKey = selectedBranches.join(',');

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);

    const kpiParams = new URLSearchParams({
      startDate,
      endDate,
    });
    if (selectedKey) kpiParams.set('branchCode', selectedKey);

    const itemsParams = new URLSearchParams({
      startDate,
      endDate,
      limit: '1',
    });
    if (selectedKey) itemsParams.set('branchCode', selectedKey);

    // Fetch Executive KPIs and Units sold in parallel without blocking main page
    Promise.all([
      fetch(`/api/reports/caravans/executive-kpis?${kpiParams.toString()}`, { signal: ctrl.signal })
        .then((res) => (res.ok ? res.json() : null))
        .catch(() => null),
      fetch(`/api/reports/caravans/items-performance?${itemsParams.toString()}`, { signal: ctrl.signal })
        .then((res) => (res.ok ? res.json() : null))
        .catch(() => null),
    ])
      .then(([kpiRes, itemsRes]) => {
        if (kpiRes && kpiRes.status === 'success' && kpiRes.kpis) {
          setKpisData(kpiRes.kpis);
        }
        if (itemsRes && itemsRes.summary) {
          const currQty = Number(itemsRes.summary.totalQuantity) || 0;
          const prevQty = Number(itemsRes.summary.prevQuantity) || 0;
          setTotalUnits(currQty);
          if (prevQty > 0) {
            setUnitsGrowthPct(Math.round(((currQty - prevQty) / prevQty) * 1000) / 10);
          } else {
            setUnitsGrowthPct(null);
          }
        }
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });

    return () => ctrl.abort();
  }, [startDate, endDate, selectedKey, refreshTick]);

  const totalRev = kpisData ? kpisData.revenue.current : (summary?.totalSales ?? 0);
  const revGrowth = kpisData ? kpisData.revenue.growthPct : null;
  const totalOrders = kpisData ? kpisData.orders.current : (summary?.totalCover ?? 0);
  const aovValue = kpisData ? kpisData.aov.current : (summary?.avgTicket ?? 0);
  const aovGrowth = kpisData ? kpisData.aov.growthPct : null;

  const varianceValue = summary?.totalVariance ?? 0;
  const isVarianceZero = Math.abs(varianceValue) < 0.01;
  const isShortage = varianceValue < -0.01;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {/* 1. Total Revenue (Inclusive of Tax) - CRITICAL TERMINOLOGY FIX */}
      <KpiCard
        title="إجمالي الإيرادات (شامل الضريبة)"
        value={<Money value={totalRev} symbolClassName="text-xs opacity-60 font-normal mr-1 select-none" />}
        icon={TrendingUp}
        sparkColor="violet"
        spark={trend.map((p) => p.total)}
        delta={revGrowth}
        badge="شامل الضريبة"
        footnote={
          kpisData?.selsTax?.current !== undefined && kpisData.selsTax.current > 0
            ? `ضريبة المبيعات: ${fmtMoney(kpisData.selsTax.current)} | السابقة: ${fmtMoney(kpisData.revenue.previous)}`
            : `الفترة السابقة: ${fmtMoney(kpisData?.revenue.previous ?? 0)}`
        }
        loading={loading}
      />

      {/* 2. Units Sold (Volume & Velocity) */}
      <KpiCard
        title="إجمالي الكميات المباعة"
        value={totalUnits > 0 ? `${fmtInt(totalUnits)} قطعة` : `${fmtInt(summary?.totalCover ?? 0)} وحدة`}
        icon={Boxes}
        sparkColor="violet"
        spark={trend.map((p) => p.total)}
        delta={unitsGrowthPct}
        badge="الكمية الإجمالية"
        footnote={
          totalUnits > 0 && totalOrders > 0
            ? `معدل كثافة السلة: ${(totalUnits / totalOrders).toFixed(1)} قطعة / شيك`
            : 'إجمالي حركة الوحدات المباعة عبر المنافذ'
        }
        loading={loading}
      />

      {/* 3. Checks & Average Order Value (AOV) */}
      <KpiCard
        title="عدد الشيكات ومتوسط الفاتورة"
        value={`${fmtInt(totalOrders)} شيك`}
        icon={Receipt}
        sparkColor="violet"
        spark={trend.map((p) => p.total)}
        delta={aovGrowth}
        badge="AOV"
        footnote={`متوسط الفاتورة: ${fmtMoney(aovValue)}`}
        loading={loading}
      />

      {/* 4. Variance & Cash Control Reconciliation */}
      <KpiCard
        title="فارق التسوية والرقابة النقدية"
        value={
          <span>
            {varianceValue >= 0 && !isVarianceZero ? '+' : ''}
            <Money value={varianceValue} symbolClassName="text-xs opacity-60 font-normal mr-1 select-none" />
          </span>
        }
        icon={Scale}
        sparkColor="violet"
        spark={trend.map((p) => p.cash)}
        delta={null}
        badge={isVarianceZero ? 'مطابق تماماً' : isShortage ? 'عجز توريد' : 'زيادة توريد'}
        badgeTone={isVarianceZero ? 'success' : isShortage ? 'danger' : 'warning'}
        footnote={
          isVarianceZero
            ? 'كافة المطابقات النقدية والفيزا متزنة 100%'
            : 'فارق تسوية النقدية والفيزا مع الإيراد الشامل المسجل'
        }
        loading={loading}
      />
    </div>
  );
}
