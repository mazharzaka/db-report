'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  BarChart3,
  Calendar,
  ChevronLeft,
  CreditCard,
  FileSpreadsheet,
  Printer,
  Receipt,
  RefreshCw,
  Scale,
  TrendingUp,
  Clock,
  Flame,
  Activity,
  Percent,
  LogOut,
  UserCheck,
  type LucideIcon,
} from 'lucide-react';
import type {
  BranchOption,
  CaravanRecord,
  ExecutiveKpis,
  ExecutiveKpisResponse,
  ItemMetric,
  ItemMode,
  ItemsSummary,
  PeriodComparisonResponse,
  ReportSummary,
  PrintSectionsConfig,
} from '@/types/reports';
import { ThemeToggle } from '@/components/dashboard/ThemeToggle';
import { FinancialDatePicker } from '@/components/ui/FinancialDatePicker';
import { CaravanGrid } from '@/components/reports/caravans/CaravanGrid';
import { VoidsAlertWidget } from '@/components/reports/caravans/VoidsAlertWidget';
import { BranchSelect } from '@/components/reports/caravans/BranchSelect';
import { ParkMap } from '@/components/reports/caravans/ParkMap';
import { CaptureRateCard, DuelCard, TopItemsWidget } from '@/components/reports/caravans/OperationalWidgets';
import { BranchComparisonChart, type OutletMetricStat } from '@/components/reports/caravans/BranchComparisonChart';
import { PeriodComparisonDashboard } from '@/components/reports/caravans/PeriodComparisonDashboard';
import { SplashScreen } from '@/components/reports/caravans/SplashScreen';
import { PrintConfigModal } from '@/components/reports/caravans/PrintConfigModal';
import { ItemSalesPerformance } from '@/components/reports/caravans/ItemSalesPerformance';
import {
  RevenueTrendChart,
  Sparkline,
  fmtInt,
  fmtMoney,
  type TrendPoint,
} from '@/components/reports/caravans/charts';

/* ------------------------------ Types & helpers ------------------------------ */

type ViewMode = 'standard' | 'comparison';
type Granularity = 'day' | 'month' | 'summary';
type PresetId = 'today' | 'yesterday' | 'month' | 'quarter' | 'year' | 'custom';
type CompPresetId = 'month_vs_last' | 'week_vs_last' | 'quarter_vs_last' | 'yoy' | 'custom';

interface ReportResponse {
  status: string;
  message?: string;
  records: CaravanRecord[];
  summary: ReportSummary;
}

interface LocalBranchStat {
  code: string;
  name: string;
  total: number;
  cash: number;
  visa: number;
  credit: number;
  cover: number;
}

const PRESETS: { id: Exclude<PresetId, 'custom'>; label: string }[] = [
  { id: 'yesterday', label: 'أمس' },
  { id: 'today', label: 'اليوم' },
  { id: 'month', label: 'الشهر الحالي' },
  { id: 'quarter', label: 'الربع الحالي' },
  { id: 'year', label: 'السنة الحالية' },
];

const COMP_PRESETS: { id: Exclude<CompPresetId, 'custom'>; label: string }[] = [
  { id: 'month_vs_last', label: 'الشهر الحالي vs السابق' },
  { id: 'week_vs_last', label: 'آخر 7 أيام vs السابقة' },
  { id: 'quarter_vs_last', label: 'الربع الحالي vs السابق' },
  { id: 'yoy', label: 'مقارنة سنوية (YoY)' },
];

const GRANULARITIES: { id: Granularity; label: string }[] = [
  { id: 'summary', label: 'إجمالي الفترة' },
  { id: 'month', label: 'شهري' },
  { id: 'day', label: 'يومي' },
];

const MAX_BRANCHES_IN_CHART = 10;

const ymd = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const addDays = (d: Date, n: number): Date => {
  const next = new Date(d);
  next.setDate(next.getDate() + n);
  return next;
};

const parseYmd = (s: string): Date => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};

function presetRange(id: Exclude<PresetId, 'custom'>): { start: string; end: string } {
  const now = new Date();
  switch (id) {
    case 'today':
      return { start: ymd(now), end: ymd(now) };
    case 'yesterday': {
      const y = addDays(now, -1);
      return { start: ymd(y), end: ymd(y) };
    }
    case 'month':
      return { start: ymd(new Date(now.getFullYear(), now.getMonth(), 1)), end: ymd(now) };
    case 'quarter':
      return { start: ymd(new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)), end: ymd(now) };
    case 'year': {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      return { start: ymd(startOfYear), end: ymd(now) };
    }
  }
}

function getComparisonPresetDates(id: Exclude<CompPresetId, 'custom'>) {
  const now = new Date();
  if (id === 'month_vs_last') {
    const startA = new Date(now.getFullYear(), now.getMonth(), 1);
    const endA = now;
    const startB = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endB = new Date(now.getFullYear(), now.getMonth(), 0);
    return {
      startA: ymd(startA),
      endA: ymd(endA),
      startB: ymd(startB),
      endB: ymd(endB),
    };
  } else if (id === 'week_vs_last') {
    const endA = now;
    const startA = addDays(now, -6);
    const endB = addDays(startA, -1);
    const startB = addDays(endB, -6);
    return {
      startA: ymd(startA),
      endA: ymd(endA),
      startB: ymd(startB),
      endB: ymd(endB),
    };
  } else if (id === 'quarter_vs_last') {
    const q = Math.floor(now.getMonth() / 3);
    const startA = new Date(now.getFullYear(), q * 3, 1);
    const endA = now;
    const startB = new Date(now.getFullYear(), (q - 1) * 3, 1);
    const endB = new Date(now.getFullYear(), q * 3, 0);
    return {
      startA: ymd(startA),
      endA: ymd(endA),
      startB: ymd(startB),
      endB: ymd(endB),
    };
  } else {
    // YoY: 2026 vs 2025
    const startA = new Date(now.getFullYear(), 0, 1);
    const endA = now;
    const startB = new Date(now.getFullYear() - 1, 0, 1);
    const endB = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    return {
      startA: ymd(startA),
      endA: ymd(endA),
      startB: ymd(startB),
      endB: ymd(endB),
    };
  }
}

async function fetchReport(
  start: string,
  end: string,
  granularity: Granularity,
  branches: string[],
  signal: AbortSignal
): Promise<ReportResponse> {
  const params = new URLSearchParams({ startDate: start, endDate: end, granularity });
  if (branches.length > 0) params.set('branches', branches.join(','));
  const res = await fetch(`/api/caravans/report?${params.toString()}`, { signal });
  if (!res.ok) throw new Error(`خطأ في استجابة الخادم (${res.status})`);
  const json = (await res.json()) as ReportResponse;
  if (json.status !== 'success') throw new Error(json.message || 'فشل جلب بيانات التقرير');
  return json;
}

const pctDelta = (cur: number, prev: number): number | null =>
  prev > 0 ? ((cur - prev) / prev) * 100 : null;

function buildTrend(records: CaravanRecord[]): TrendPoint[] {
  const map = new Map<string, TrendPoint>();
  for (const r of records) {
    const key = r.period ?? '';
    const p = map.get(key) ?? { label: key.length === 10 ? key.slice(5) : key, total: 0, cash: 0, visa: 0 };
    p.total += r.total;
    p.cash += r.cash;
    p.visa += r.visa;
    map.set(key, p);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => v);
}

function buildBranchStats(records: CaravanRecord[]): LocalBranchStat[] {
  const map = new Map<string, LocalBranchStat>();
  for (const r of records) {
    const key = String(r.branchCode);
    const s = map.get(key) ?? { code: key, name: r.name, total: 0, cash: 0, visa: 0, credit: 0, cover: 0 };
    s.total += r.total;
    s.cash += r.cash;
    s.visa += r.visa;
    s.credit += r.creditLine;
    s.cover += r.cover;
    map.set(key, s);
  }
  return Array.from(map.values()).sort((a, b) => b.total - a.total);
}

/* ------------------------------ Single Source of Truth Normalization ------------------------------ */

type ItemRow = { name: string; qty?: number; revenue?: number; [k: string]: any };
type OutletRow = { name: string; [k: string]: any };

function normalizeItemsSummary(raw: any) {
  const src = raw ?? {};
  const cap = src.capture ?? {};
  const kpi = src.kpis ?? {};
  const pick = (...c: any[]) => c.find((v) => v !== undefined && v !== null);
  const asArray = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
  const asNum = (v: unknown) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };
  return {
    guests: asNum(pick(src.guests, kpi.guests, cap.guests, src.visitors, src.visitorCount)),
    spendPerGuest: asNum(pick(src.spendPerGuest, kpi.spendPerGuest, cap.spendPerGuest)),
    topItems: asArray<ItemRow>(pick(src.topItems, src.top_items, src.topSellers)),
    slowItems: asArray<ItemRow>(pick(src.slowItems, src.slow_items, src.worstItems)),
    outlets: asArray<OutletRow>(pick(src.outlets, src.branches, src.caravans)),
    allOutlets: asArray<OutletRow>(pick(src.allOutlets, src.outlets)),
    duel: pick(src.duel, null),
    caravanRevenue: asNum(pick(src.caravanRevenue, kpi.caravanRevenue, cap.caravanRevenue)),
    grossRevenue: asNum(pick(src.grossRevenue, kpi.grossRevenue, cap.grossRevenue, src.caravanRevenue, cap.caravanRevenue)),
    gateTickets: asNum(pick(src.gateTickets, kpi.gateTickets, cap.gateTickets)),
    degraded: Boolean(src.degraded),
    blockStatus: src.blockStatus ?? {},
    errors: asArray<any>(src.errors),
  };
}

/* ------------------------------ UI building blocks ------------------------------ */

interface KpiProps {
  title: string;
  value: string;
  icon: LucideIcon;
  spark: number[];
  sparkColor: 'emerald' | 'cyan' | 'violet';
  delta: number | null;
  badge: string;
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
  footnote,
  loading = false,
}: KpiProps) {
  const isPositive = delta !== null && delta >= 0;
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:border-slate-300 dark:border-white/5 dark:bg-[#18181b] dark:hover:border-white/10">
      <div className="flex items-start justify-between">
        <span className="text-sm font-medium text-slate-500 dark:text-zinc-400">{title}</span>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 border border-slate-200/80 text-slate-700 dark:bg-[#09090b] dark:border-white/5 dark:text-zinc-300">
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-3 flex items-baseline justify-between gap-2">
        {loading ? (
          <div className="h-8 w-32 animate-pulse rounded-lg bg-slate-200 dark:bg-[#09090b]" />
        ) : (
          <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-mono tabular-nums" dir="ltr">
            {value}
          </span>
        )}
        {loading ? (
          <div className="h-5 w-12 animate-pulse rounded-full bg-slate-200 dark:bg-[#09090b]" />
        ) : delta !== null ? (
          <span
            className={`inline-flex items-center gap-0.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
              isPositive
                ? 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-500/10'
                : 'text-yellow-600 bg-yellow-50 dark:text-yellow-300 dark:bg-yellow-500/10'
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
      <p className="mt-2 text-xs tabular-nums text-slate-500 dark:text-zinc-400">{footnote}</p>
    </div>
  );
}

function Card({
  title,
  subtitle,
  action,
  children,
  className = '',
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm backdrop-blur-sm dark:border-white/5 dark:bg-[#18181b]/90 ${className}`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex shrink-0 items-center gap-1 rounded-full bg-slate-100 border border-slate-200 p-1 dark:bg-[#09090b] dark:border-white/5/60">
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
            value === o.id
              ? 'bg-white text-slate-900 shadow-sm dark:bg-white dark:text-black font-bold'
              : 'text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------ Primary Page Component ------------------------------ */

export default function CaravanDashboardHomePage() {
  const router = useRouter();

  // Authentication State
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [authUser, setAuthUser] = useState<string>('admin');

  useEffect(() => {
    try {
      const auth = localStorage.getItem('isAuthenticated');
      if (auth !== 'true') {
        router.replace('/login');
      } else {
        const user = localStorage.getItem('authUser') || 'admin';
        setAuthUser(user);
        setIsAuthorized(true);
      }
    } catch {
      router.replace('/login');
    }
  }, [router]);

  const handleSignOut = () => {
    try {
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('authUser');
      localStorage.removeItem('authRole');
      localStorage.removeItem('authTime');
    } catch (err) {
      console.error('Sign out error:', err);
    }
    router.replace('/login');
  };

  const [viewMode, setViewMode] = useState<ViewMode>('standard');

  // Standard Report Date Filters
  const initial = presetRange('yesterday');
  const [preset, setPreset] = useState<PresetId>('yesterday');
  const [start, setStart] = useState(initial.start);
  const [end, setEnd] = useState(initial.end);
  const [granularity, setGranularity] = useState<Granularity>('summary');

  // Period Comparison State
  const initialComp = getComparisonPresetDates('month_vs_last');
  const [compPreset, setCompPreset] = useState<CompPresetId>('month_vs_last');
  const [compStartA, setCompStartA] = useState(initialComp.startA);
  const [compEndA, setCompEndA] = useState(initialComp.endA);
  const [compStartB, setCompStartB] = useState(initialComp.startB);
  const [compEndB, setCompEndB] = useState(initialComp.endB);
  const [comparisonData, setComparisonData] = useState<PeriodComparisonResponse | null>(null);
  const [comparisonLoading, setComparisonLoading] = useState(false);
  const [comparisonError, setComparisonError] = useState<string | null>(null);

  // Multi-Caravan Selection (Applies strictly across all widgets)
  const [branchOptions, setBranchOptions] = useState<BranchOption[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [barMetric, setBarMetric] = useState<'revenue' | 'orders'>('revenue');

  // Executive KPIs State (Single-Trip Parallel Conditional Aggregation: < 300ms)
  const [kpisData, setKpisData] = useState<ExecutiveKpis | null>(null);
  const [benchmarkInfo, setBenchmarkInfo] = useState<ExecutiveKpisResponse['benchmark'] | null>(null);
  const [kpisLoading, setKpisLoading] = useState(false);
  const [kpisError, setKpisError] = useState<string | null>(null);

  // Operational Data State
  const [records, setRecords] = useState<CaravanRecord[]>([]);
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [prevSummary, setPrevSummary] = useState<ReportSummary | null>(null);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [branchStats, setBranchStats] = useState<LocalBranchStat[]>([]);
  const [itemsData, setItemsData] = useState<ItemsSummary | null>(null);
  const [guests, setGuests] = useState<number>(0);
  const [spendPerGuest, setSpendPerGuest] = useState<number>(0);
  const [topItems, setTopItems] = useState<any[]>([]);
  const [slowItems, setSlowItems] = useState<any[]>([]);
  const [outlets, setOutlets] = useState<any[]>([]);
  const [itemMetric, setItemMetric] = useState<ItemMetric>('revenue');
  const [itemMode, setItemMode] = useState<ItemMode>('best');
  const [itemsLoading, setItemsLoading] = useState(false);
  const [itemsError, setItemsError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  // Print Configuration Modal State
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printConfig, setPrintConfig] = useState<PrintSectionsConfig>({
    kpis: true,
    charts: true,
    table: true,
    peakHours: true,
    itemsPerformance: true,
    orientation: 'landscape',
  });

  const handlePrint = () => {
    if (isLoading) return;
    document.body.classList.add('print-landscape-mode');
    setPrintModalOpen(false);
    setTimeout(() => {
      window.print();
    }, 200);
  };

  // Load branch list for dropdown
  useEffect(() => {
    fetch('/api/caravans/branches')
      .then((r) => r.json())
      .then((j: { status: string; branches?: BranchOption[] }) => {
        if (j.status === 'success' && Array.isArray(j.branches)) setBranchOptions(j.branches);
      })
      .catch(() => undefined);
  }, []);

  const resetStaleData = () => {
    setKpisData(null);
    setSummary(null);
    setPrevSummary(null);
    setRecords([]);
    setTrend([]);
    setBranchStats([]);
    setTopItems([]);
    setSlowItems([]);
    setItemsData(null);
    setGuests(0);
    setSpendPerGuest(0);
  };

  const applyPreset = (id: Exclude<PresetId, 'custom'>) => {
    resetStaleData();
    const r = presetRange(id);
    setPreset(id);
    setStart(r.start);
    setEnd(r.end);
  };

  const applyCompPreset = (id: Exclude<CompPresetId, 'custom'>) => {
    const dates = getComparisonPresetDates(id);
    setCompPreset(id);
    setCompStartA(dates.startA);
    setCompEndA(dates.endA);
    setCompStartB(dates.startB);
    setCompEndB(dates.endB);
  };

  const selectedKey = selected.join(',');

  // 1. Executive KPIs Loader (Single-Trip Conditional Aggregation: < 300ms)
  useEffect(() => {
    const ctrl = new AbortController();
    setKpisLoading(true);
    setKpisError(null);
    setKpisData(null);

    const params = new URLSearchParams({
      startDate: start,
      endDate: end,
    });
    if (selectedKey) params.set('branchCode', selectedKey);

    fetch(`/api/reports/caravans/executive-kpis?${params.toString()}`, { signal: ctrl.signal })
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`خطأ في استجابة الخادم (${res.status}): ${text.slice(0, 80)}`);
        }
        const json = (await res.json()) as ExecutiveKpisResponse;
        if (json.status === 'success' && json.kpis) {
          setKpisData(json.kpis);
          setBenchmarkInfo(json.benchmark || null);
        }
      })
      .catch((err: Error) => {
        if (err.name !== 'AbortError') {
          console.warn('Executive KPIs fetch error:', err.message);
          setKpisError(err.message);
        }
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setKpisLoading(false);
      });

    return () => ctrl.abort();
  }, [start, end, selectedKey, refreshTick]);

  // 2. Standard report data loader (Table records & Trends)
  const load = useCallback(async () => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    setError(null);
    setRecords([]);
    setSummary(null);
    setTrend([]);
    setBranchStats([]);

    try {
      const s = parseYmd(start);
      const e = parseYmd(end);
      const days = Math.max(1, Math.round((e.getTime() - s.getTime()) / 86_400_000) + 1);
      const trendGran: Granularity = days > 92 ? 'month' : 'day';
      const branches = selectedKey ? selectedKey.split(',') : [];

      const [main, totals, trendRes] = await Promise.all([
        fetchReport(start, end, granularity, branches, ctrl.signal),
        granularity === 'summary'
          ? Promise.resolve(null)
          : fetchReport(start, end, 'summary', branches, ctrl.signal),
        fetchReport(start, end, trendGran, branches, ctrl.signal),
      ]);

      setRecords(main.records);
      const effectiveTotals = totals ?? main;
      setSummary(effectiveTotals.summary);
      setTrend(buildTrend(trendRes.records));
      setBranchStats(buildBranchStats(effectiveTotals.records));
      setUpdatedAt(new Date());
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      setError((err as Error).message || 'تعذر الاتصال بخادم التقارير');
    } finally {
      if (abortRef.current === ctrl) setLoading(false);
    }
  }, [start, end, granularity, selectedKey]);

  useEffect(() => {
    void load();
    return () => abortRef.current?.abort();
  }, [load, refreshTick]);

  // Operational items & outlets summary
  useEffect(() => {
    const ctrl = new AbortController();
    setItemsLoading(true);
    setItemsError(null);
    setItemsData(null);
    setTopItems([]);
    setSlowItems([]);
    setGuests(0);
    setSpendPerGuest(0);
    const params = new URLSearchParams({
      startDate: start,
      endDate: end,
      metricType: itemMetric,
      mode: itemMode,
    });
    if (selectedKey) params.set('branchCode', selectedKey);

    fetch(`/api/reports/caravans/items-summary?${params.toString()}`, { signal: ctrl.signal })
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`خطأ في استجابة الخادم (${res.status}): ${text.slice(0, 80)}`);
        }
        const json = await res.json();
        const data = normalizeItemsSummary(json);

        setGuests(data.guests);
        setSpendPerGuest(data.spendPerGuest);
        setTopItems(data.topItems);
        setSlowItems(data.slowItems);
        setOutlets(data.outlets);

        const payload: ItemsSummary = {
          ...json,
          status: 'success',
          topItems: data.topItems,
          slowItems: data.slowItems,
          outlets: data.outlets,
          allOutlets: data.allOutlets,
          duel: data.duel,
          guests: data.guests,
          spendPerGuest: data.spendPerGuest,
          capture: {
            caravanRevenue: data.caravanRevenue,
            grossRevenue: data.grossRevenue,
            gateTickets: data.gateTickets,
            guests: data.guests,
            spendPerGuest: data.spendPerGuest,
            visitDivisor: Number(json.capture?.visitDivisor ?? 6) || 6,
            gateBranchCodes: Array.isArray(json.capture?.gateBranchCodes) ? json.capture.gateBranchCodes : [],
          },
        };
        setItemsData(payload);
      })
      .catch((err: Error) => {
        if (err.name !== 'AbortError') setItemsError(err.message || 'تعذر تحميل تحليلات الأصناف');
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setItemsLoading(false);
      });

    return () => ctrl.abort();
  }, [start, end, selectedKey, itemMetric, itemMode, refreshTick]);

  // Period-over-Period comparison loader
  const loadComparison = useCallback(async () => {
    setComparisonLoading(true);
    setComparisonError(null);
    setComparisonData(null);
    try {
      const params = new URLSearchParams({
        periodAStart: compStartA,
        periodAEnd: compEndA,
        periodBStart: compStartB,
        periodBEnd: compEndB,
      });
      if (selectedKey) params.set('branchCode', selectedKey);

      const res = await fetch(`/api/reports/caravans/comparison?${params.toString()}`);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`خطأ في استجابة الخادم (${res.status}): ${text.slice(0, 80)}`);
      }
      const json = (await res.json()) as PeriodComparisonResponse;
      if (json.status !== 'success') throw new Error(json.message || 'فشل جلب بيانات المقارنة');
      setComparisonData(json);
    } catch (err) {
      setComparisonError((err as Error).message || 'تعذر تحميل المقارنة التحليلية');
    } finally {
      setComparisonLoading(false);
    }
  }, [compStartA, compEndA, compStartB, compEndB, selectedKey]);

  useEffect(() => {
    if (viewMode === 'comparison') {
      void loadComparison();
    }
  }, [viewMode, loadComparison, refreshTick]);

  // Map click toggle: single caravan filter (click again to clear)
  const selectFromMap = (code: string) =>
    setSelected((cur) => (cur.length === 1 && cur[0] === code ? [] : [code]));

  // Dynamic scope label
  const topScopeLabel = useMemo(() => {
    if (selected.length === 0) return 'عبر جميع كرافانات ومحلات الحديقة (القطاع الكامل)';
    if (selected.length === 1) {
      const match = branchOptions.find((o) => String(o.Code) === selected[0]);
      return `محل محدد: ${match?.Name ?? selected[0]}`;
    }
    return `${selected.length} محلات محددة: ${selected
      .map((c) => branchOptions.find((o) => String(o.Code) === c)?.Name ?? c)
      .slice(0, 3)
      .join('، ')}${selected.length > 3 ? '...' : ''}`;
  }, [selected, branchOptions]);

  const exportExcel = () => {
    if (isLoading) return;
    const params = new URLSearchParams({ startDate: start, endDate: end, granularity });
    if (selected.length > 0) params.set('branches', selected.join(','));
    window.location.href = `/api/caravans/export?${params.toString()}`;
  };

  const isLoading = loading || kpisLoading || itemsLoading || (viewMode === 'comparison' && comparisonLoading);

  const comparisonStats = useMemo<OutletMetricStat[]>(() => {
    const list = outlets.length > 0 ? outlets : (itemsData?.outlets ?? []);
    if (list.length > 0) {
      return list.map((o: any) => ({
        code: String(o.branchCode || o.code),
        name: String(o.name || o.branchCode || ''),
        revenue: Number(o.revenue) || 0,
        orders: Number(o.orders) || 0,
        avgTicket: Number(o.avgTicket) || (Number(o.orders) > 0 ? Number(o.revenue) / Number(o.orders) : 0),
      })).slice(0, MAX_BRANCHES_IN_CHART);
    }
    return branchStats.map((b) => ({
      code: b.code,
      name: b.name,
      revenue: b.total,
      orders: b.cover,
      avgTicket: b.cover > 0 ? b.total / b.cover : 0,
    })).slice(0, MAX_BRANCHES_IN_CHART);
  }, [outlets, itemsData, branchStats]);

  const overallAov = summary?.avgTicket ?? 0;

  // Unauthenticated screen guard (prevents flash of dashboard content)
  if (isAuthorized === null || !isAuthorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 dark:bg-[#09090b]">
        <div className="flex flex-col items-center gap-3">
          <img
            src="/dreampark-logo.png"
            alt="Dream Park"
            className="h-10 w-auto object-contain animate-pulse"
          />
          <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
            جاري التحقق من الصلاحيات والبيانات...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-slate-50 text-slate-900 selection:bg-orange-500/20 selection:text-orange-600 dark:bg-[#09090b] dark:text-white dark:selection:bg-orange-500/20 dark:selection:text-orange-400">
      {/* 1. Splash Screen with Dream Park Theming & Ferris Wheel Loader */}
      <SplashScreen isLoading={loading || kpisLoading} minDurationMs={1400} />

      {/* 2. Institutional Dream Park Subtle Background Watermark */}
      <div className="pointer-events-none fixed inset-0 z-0 flex items-center justify-center opacity-[0.03] select-none overflow-hidden print:opacity-[0.05] dark:opacity-[0.035]">
        <img
          src="/dreampark-logo.png"
          alt=""
          className="w-[740px] max-w-[85vw] object-contain filter grayscale contrast-150"
        />
      </div>

      <div className="relative z-10 mx-auto max-w-[1680px] space-y-6 p-4 sm:p-6 lg:p-8">
        {/* ---------- Header ---------- */}
        <header className="space-y-4">
          <div className="flex items-center justify-between">
            <nav className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-zinc-400" aria-label="breadcrumb">
              <span className="font-medium text-slate-700 dark:text-zinc-300">منظومة العمليات والتحليلات</span>
              <ChevronLeft className="h-3.5 w-3.5" />
              <span className="font-bold text-orange-600 dark:text-orange-400">لوحة تقارير الكرافانات 2026</span>
            </nav>

            {/* User Session & Theme Controls */}
            <div className="flex items-center gap-2 print:hidden">
              <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm dark:border-white/10 dark:bg-[#18181b] dark:text-zinc-300 sm:flex">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>المستخدم:</span>
                <strong className="font-semibold text-slate-900 dark:text-white font-mono">{authUser}</strong>
              </div>

              <button
                onClick={handleSignOut}
                title="تسجيل الخروج من النظام"
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-rose-600 shadow-sm transition hover:bg-rose-50 hover:border-rose-300 dark:border-white/10 dark:bg-[#18181b] dark:text-rose-400 dark:hover:bg-rose-950/30 dark:hover:border-rose-900/50 active:scale-95"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">تسجيل الخروج</span>
              </button>

              <ThemeToggle />
            </div>
          </div>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-3">
                <img src="/dreampark-logo.png" alt="Dream Park" className="h-10 w-auto object-contain drop-shadow" />
                <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white sm:text-3xl">
                  إيرادات الكرفانات والمحلات
                </h1>
              </div>
              {/* Executive Print Report Header */}
            <div className="hidden print:flex print:w-full print:items-center print:justify-between print:border-b-2 print:border-black print:pb-2 print:pt-1 print:mb-2">
              <div className="flex items-center gap-3">
                <img src="/dreampark-logo.png" alt="Dream Park" className="h-9 w-auto object-contain" />
                <div>
                  <h2 className="text-lg font-black text-black">دريم بارك — تقرير إيرادات ومبيعات الكرفانات والمحلات</h2>
                  <p className="text-[11px] font-semibold text-black mt-0.5">
                    الفترة: {start} إلى {end} • النطاق: {topScopeLabel}
                  </p>
                </div>
              </div>
              <div className="text-left text-[10px] font-semibold text-black" dir="ltr">
                <div>تاريخ الطباعة: {new Date().toLocaleDateString('en-GB')} {new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</div>
                <div>المستخدم: {authUser || 'admin'}</div>
              </div>
            </div>

            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm dark:border-white/5 dark:bg-white/5 dark:text-zinc-300">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-500 opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-orange-500" />
                </span>
                محدث لحظياً
                {updatedAt && (
                  <span className="tabular-nums opacity-80" dir="ltr">{updatedAt.toLocaleTimeString('en-GB')}</span>
                )}
              </span>
            </div>

            {/* Actions & Mode Switcher */}
            <div className="flex flex-wrap items-center gap-2 print:hidden">
              {/* Primary Mode Toggle: Standard vs Period Comparison */}
              <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-1 dark:border-white/5 dark:bg-[#18181b]">
                <button
                  onClick={() => setViewMode('standard')}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    viewMode === 'standard'
                      ? 'bg-white text-orange-600 shadow-sm dark:bg-[#09090b] dark:text-orange-400 border border-slate-200/80 dark:border-white/10'
                      : 'text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-300'
                  }`}
                >
                  <BarChart3 className="h-3.5 w-3.5" />
                  <span>التقرير القياسي</span>
                </button>
                <button
                  onClick={() => setViewMode('comparison')}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    viewMode === 'comparison'
                      ? 'bg-white text-orange-600 shadow-sm dark:bg-[#09090b] dark:text-orange-400 border border-slate-200/80 dark:border-white/10'
                      : 'text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-300'
                  }`}
                >
                  <Scale className="h-3.5 w-3.5" />
                  <span>مقارنة فترتين</span>
                </button>
              </div>

              <button
                onClick={() => setRefreshTick((t) => t + 1)}
                disabled={isLoading}
                aria-label="تحديث"
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:text-orange-600 hover:bg-slate-50 dark:border-white/5 dark:bg-[#09090b] dark:text-zinc-300 dark:hover:text-orange-400 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={exportExcel}
                disabled={isLoading}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-orange-600 px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-orange-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
              >
                <FileSpreadsheet className="h-4 w-4" />
                تصدير Excel
              </button>
              <button
                onClick={() => setPrintModalOpen(true)}
                disabled={isLoading}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-white/5 dark:bg-[#09090b] dark:text-zinc-300 dark:hover:bg-slate-800 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
              >
                <Printer className="h-4 w-4" />
                طباعة
              </button>
            </div>
          </div>

          {/* ---------- Filter Toolbar ---------- */}
          {viewMode === 'standard' ? (
            /* Standard Mode Filters */
            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm xl:flex-row xl:items-center xl:justify-between print:hidden dark:border-white/5 dark:bg-[#18181b]/90">
              <div className="flex flex-wrap items-center gap-2">
                {PRESETS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => applyPreset(p.id)}
                    className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-all duration-200 ${
                      preset === p.id
                        ? 'bg-orange-600 text-white shadow-sm dark:bg-white dark:text-black font-medium'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-[#09090b] dark:text-zinc-300 dark:hover:bg-slate-700 dark:hover:text-white'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
                <FinancialDatePicker
                  startDate={start}
                  endDate={end}
                  onChange={(newStart, newEnd) => {
                    resetStaleData();
                    setStart(newStart);
                    setEnd(newEnd);
                    setPreset('custom');
                  }}
                  disabled={isLoading}
                  showQuickPresets={false}
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <BranchSelect options={branchOptions} value={selected} onChange={setSelected} />
                <Segmented options={GRANULARITIES} value={granularity} onChange={setGranularity} />
              </div>
            </div>
          ) : (
            /* Period Comparison Mode Filters */
            <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm print:hidden dark:border-white/5 dark:bg-[#18181b]/95">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-white/5 pb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">أنماط المقارنة الجاهزة:</span>
                  {COMP_PRESETS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => applyCompPreset(p.id)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold transition-all duration-200 ${
                        compPreset === p.id
                          ? 'bg-orange-600 text-white shadow-sm dark:bg-white dark:text-black font-medium'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-[#09090b] dark:text-zinc-300 dark:hover:bg-slate-700 dark:hover:text-white'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">تصفية المحلات:</span>
                  <BranchSelect options={branchOptions} value={selected} onChange={setSelected} />
                </div>
              </div>

              {/* Dual Period Date Pickers */}
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-2.5 dark:border-white/5 dark:bg-[#09090b]">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-orange-500 text-xs font-bold text-white">A</span>
                    <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">الفترة الحالية (A):</span>
                  </div>
                  <FinancialDatePicker
                    startDate={compStartA}
                    endDate={compEndA}
                    onChange={(s, e) => {
                      setComparisonData(null);
                      setCompStartA(s);
                      setCompEndA(e);
                      setCompPreset('custom');
                    }}
                    disabled={comparisonLoading}
                    showQuickPresets={false}
                  />
                </div>

                <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/80 p-2.5 dark:border-white/5 dark:bg-[#09090b]/80">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-slate-400 text-xs font-bold text-white dark:bg-slate-600">B</span>
                    <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">فترة المقارنة (B):</span>
                  </div>
                  <FinancialDatePicker
                    startDate={compStartB}
                    endDate={compEndB}
                    onChange={(s, e) => {
                      setComparisonData(null);
                      setCompStartB(s);
                      setCompEndB(e);
                      setCompPreset('custom');
                    }}
                    disabled={comparisonLoading}
                    showQuickPresets={false}
                  />
                </div>
              </div>
            </div>
          )}
        </header>

        {/* ---------- Error Alerts ---------- */}
        {error && (
          <div role="alert" className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
            <AlertCircle className="h-5 w-5 shrink-0" />
            {error}
          </div>
        )}

        {comparisonError && viewMode === 'comparison' && (
          <div role="alert" className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
            <AlertCircle className="h-5 w-5 shrink-0" />
            {comparisonError}
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW MODE 1: PERIOD-OVER-PERIOD COMPARISON (مقارنة فترتين زمنيتين)       */}
        {/* ========================================================================= */}
        {viewMode === 'comparison' ? (
          <div className="space-y-6">
            <PeriodComparisonDashboard
              data={comparisonData}
              loading={comparisonLoading}
              scopeLabel={topScopeLabel}
            />

            {/* Detailed Item-Level Sales Analytics with Instant Search & Pagination for Comparison Period */}
            <div className={`break-inside-avoid ${!printConfig.itemsPerformance ? 'print:hidden' : ''}`}>
              <ItemSalesPerformance
                startDate={compStartA}
                endDate={compEndA}
                prevStartDate={compStartB}
                prevEndDate={compEndB}
                selectedBranches={selected}
              />
            </div>

            {/* Interactive 2D Map for click-to-compare */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/5 dark:bg-[#18181b] print:hidden">
              <div className="mb-4">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">خريطة الكرافانات — انقر للمقارنة الفردية</h3>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">اضغط على أي محل بالخريطة لعزل ومقارنة أدائه بين الفترتين A و B فورياً</p>
              </div>
              <ParkMap
                outlets={outlets.length > 0 ? outlets : (itemsData?.allOutlets ?? itemsData?.outlets ?? [])}
                selected={selected}
                onSelect={selectFromMap}
              />
            </section>
          </div>
        ) : (
          /* ========================================================================= */
          /* VIEW MODE 2: STANDARD OPERATIONAL REPORT (التقرير التشغيلي القياسي)      */
          /* ========================================================================= */
          <div className="space-y-6">
            {/* ---------- Row 1: Top Metrics (Executive KPI Cards - Fast Conditional Aggregation) ---------- */}
            <div className={`grid grid-cols-1 gap-4 transition-opacity sm:grid-cols-2 xl:grid-cols-4 break-inside-avoid ${loading && kpisLoading ? 'opacity-60' : ''} ${!printConfig.kpis ? 'print:hidden' : ''}`}>
              <KpiCard
                title="إجمالي الإيرادات الصافية"
                value={fmtMoney(kpisData ? kpisData.revenue.current : (summary?.totalSales ?? 0))}
                icon={TrendingUp}
                sparkColor="violet"
                spark={trend.map((p) => p.total)}
                delta={kpisData ? kpisData.revenue.growthPct : pctDelta(summary?.totalSales ?? 0, prevSummary?.totalSales ?? 0)}
                badge="—"
                footnote={
                  kpisData?.selsTax?.current !== undefined && kpisData.selsTax.current > 0
                    ? `ضريبة المبيعات: ${fmtMoney(kpisData.selsTax.current)} | سابقة: ${fmtMoney(kpisData.revenue.previous)}`
                    : `الفترة السابقة: ${fmtMoney(kpisData ? kpisData.revenue.previous : (prevSummary?.totalSales ?? 0))}`
                }
                loading={isLoading || kpisLoading}
              />
              <KpiCard
                title="التحصيل والسيولة النقدية"
                value={fmtMoney(kpisData ? kpisData.cash.current : (summary?.totalCash ?? 0))}
                icon={Banknote}
                sparkColor="violet"
                spark={trend.map((p) => p.cash)}
                delta={kpisData ? kpisData.cash.growthPct : pctDelta(summary?.totalCash ?? 0, prevSummary?.totalCash ?? 0)}
                badge={`${(kpisData ? (kpisData.cash.sharePct ?? 0) : (summary?.cashPct ?? 0)).toFixed(1)}%`}
                footnote={
                  kpisData?.taxesServices?.current !== undefined && kpisData.taxesServices.current > 0
                    ? `نقدية: ${fmtMoney(kpisData.cash.current)} | ضرائب وخدمات: ${fmtMoney(kpisData.taxesServices.current)}`
                    : `${(kpisData ? (kpisData.cash.sharePct ?? 0) : (summary?.cashPct ?? 0)).toFixed(1)}% نقدية | ${(kpisData ? (kpisData.visa.sharePct ?? 0) : (summary?.visaPct ?? 0)).toFixed(1)}% فيزا`
                }
                loading={isLoading || kpisLoading}
              />
              <KpiCard
                title="معدل النمو للفترة المقارنة"
                value={
                  kpisData?.revenue.growthPct !== null && kpisData?.revenue.growthPct !== undefined
                    ? `${kpisData.revenue.growthPct >= 0 ? '+' : ''}${kpisData.revenue.growthPct.toFixed(1)}%`
                    : '—'
                }
                icon={kpisData?.revenue.growthPct !== null && (kpisData?.revenue.growthPct ?? 0) >= 0 ? TrendingUp : Activity}
                sparkColor="violet"
                spark={trend.map((p) => p.total)}
                delta={kpisData ? kpisData.revenue.growthPct : null}
                badge="مقارنة دورية"
                footnote={
                  kpisData?.revenue.delta !== undefined
                    ? `فارق السيولة: ${kpisData.revenue.delta >= 0 ? '+' : ''}${fmtMoney(kpisData.revenue.delta)}`
                    : `الفترة السابقة: ${fmtMoney(kpisData?.revenue.previous ?? 0)}`
                }
                loading={isLoading || kpisLoading}
              />
              <KpiCard
                title="عدد الشيكات ومتوسط الفاتورة"
                value={`${fmtInt(kpisData ? kpisData.orders.current : (summary?.totalCover ?? 0))} شيك`}
                icon={Receipt}
                sparkColor="violet"
                spark={trend.map((p) => p.total)}
                delta={kpisData ? kpisData.aov.growthPct : pctDelta(overallAov, prevSummary?.avgTicket ?? 0)}
                badge="—"
                footnote={`متوسط الفاتورة: ${fmtMoney(kpisData ? kpisData.aov.current : overallAov)}`}
                loading={isLoading || kpisLoading}
              />
            </div>

            {itemsError && (
              <div role="alert" className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
                <AlertCircle className="h-5 w-5 shrink-0" />
                تحليلات الأصناف غير متاحة: {itemsError}
              </div>
            )}

            {/* ---------- Row 2: Operational Analytics Bento Grid ---------- */}
            <div className={`grid grid-cols-1 gap-4 lg:grid-cols-12 break-inside-avoid ${!printConfig.kpis ? 'print:hidden' : ''}`}>
              {/* Col 1-3: Capture Rate */}
              <div className="lg:col-span-12 xl:col-span-3">
                <CaptureRateCard
                  guests={guests}
                  spendPerGuest={spendPerGuest}
                  capture={
                    itemsData?.capture ?? {
                      caravanRevenue: summary?.totalSales ?? 0,
                      grossRevenue: summary?.totalSales ?? 0,
                      gateTickets: 0,
                      guests,
                      spendPerGuest,
                      visitDivisor: 6,
                      gateBranchCodes: [],
                    }
                  }
                  loading={itemsLoading}
                />
              </div>
              {/* Col 4-8: Top 5 Best Sellers & Slow-Moving (Dead Stock) */}
              <div className="lg:col-span-12 xl:col-span-5">
                <TopItemsWidget
                  items={topItems.length > 0 ? topItems : (itemsData?.topItems ?? [])}
                  slowItems={slowItems.length > 0 ? slowItems : (itemsData?.slowItems ?? [])}
                  mode={itemMode}
                  onModeChange={setItemMode}
                  metric={itemMetric}
                  onMetricChange={setItemMetric}
                  scopeLabel={topScopeLabel}
                  loading={itemsLoading}
                />
              </div>
              {/* Col 9-12: Head-to-Head Duel */}
              <div className="lg:col-span-12 xl:col-span-4">
                <DuelCard duel={itemsData?.duel ?? null} loading={itemsLoading} />
              </div>
            </div>

            {/* ---------- Row 3: Outlets Comparison & Revenue Trend (Side-by-Side) ---------- */}
            <div className={`grid grid-cols-1 gap-4 transition-opacity lg:grid-cols-12 break-inside-avoid ${loading ? 'opacity-60' : ''} ${!printConfig.charts ? 'print:hidden' : ''}`}>
              {/* Col 1-6: Outlets Comparison Bar Chart */}
              <Card
                className="lg:col-span-6"
                title="مقارنة أداء الفروع والمحلات"
                subtitle={`أعلى ${Math.min(comparisonStats.length, MAX_BRANCHES_IN_CHART)} محلات مرتبة حسب ${barMetric === 'revenue' ? 'صافي الإيراد' : 'عدد العمليات'}`}
                action={
                  <Segmented
                    options={[
                      { id: 'revenue', label: 'صافي الإيراد' },
                      { id: 'orders', label: 'عدد الشيكات' },
                    ]}
                    value={barMetric}
                    onChange={setBarMetric}
                  />
                }
              >
                <div className="h-[360px]" dir="ltr">
                  {loading ? (
                    <div className="flex h-full items-center justify-center">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
                    </div>
                  ) : comparisonStats.length > 0 ? (
                    <BranchComparisonChart stats={comparisonStats} metric={barMetric} />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-zinc-400">لا توجد بيانات</div>
                  )}
                </div>
              </Card>

              {/* Col 7-12: Revenue Trend Line Chart */}
              <Card
                className="lg:col-span-6"
                title="اتجاه الإيرادات عبر الوقت"
                subtitle="مسار المبيعات مقسّماً (صافي الإيراد، النقدية، الفيزا)"
              >
                <div className="h-[360px]" dir="ltr">
                  {loading ? (
                    <div className="flex h-full items-center justify-center">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
                    </div>
                  ) : trend.length > 0 ? (
                    <RevenueTrendChart points={trend} />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-zinc-400">لا توجد بيانات</div>
                  )}
                </div>
              </Card>
            </div>

            {/* ---------- Row 4: Item-Level Sales Analytics with Instant Search & Period Comparison ---------- */}
            <div className={`break-inside-avoid ${!printConfig.itemsPerformance ? 'print:hidden' : ''}`}>
              <ItemSalesPerformance
                startDate={start}
                endDate={end}
                selectedBranches={selected}
              />
            </div>

            {/* ---------- Row 5: Interactive 2D Park Map ---------- */}
            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-white/5 dark:bg-[#18181b]/90 print:hidden">
              <div className="mb-4">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">خريطة المحلات ونشاط المبيعات</h3>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">اللون يعبّر عن سرعة المبيعات مقارنةً بمتوسط المحلات — اضغط على محل لتصفية التقرير والجدول</p>
              </div>
              <ParkMap
                outlets={outlets.length > 0 ? outlets : (itemsData?.allOutlets ?? itemsData?.outlets ?? [])}
                selected={selected}
                onSelect={selectFromMap}
              />
            </section>

            {/* ---------- Row 6: Voids Alert Widget & Detailed Data Grid ---------- */}
            <div className={`space-y-4 print:space-y-3 print:break-inside-auto ${!printConfig.table ? 'print:hidden' : ''}`}>
              <VoidsAlertWidget rows={records} />
              <CaravanGrid rows={records} showPeriod={granularity !== 'summary'} loading={loading} />
            </div>
          </div>
        )}
      </div>

      {/* Modular Print Configuration Modal */}
      <PrintConfigModal
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        config={printConfig}
        onChange={setPrintConfig}
        onPrint={handlePrint}
      />
    </div>
  );
}
