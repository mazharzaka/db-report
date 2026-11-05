'use client';

import React, { useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Columns3,
  Search,
  RotateCw,
  Table as TableIcon,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
} from 'lucide-react';
import type { CaravanRecord } from '@/types/reports';
import { fmtInt, fmtMoney } from './charts';

type ColKey =
  | 'branchCode'
  | 'name'
  | 'period'
  | 'netRevenue'
  | 'serviceCharge'
  | 'salesTax'
  | 'cover'
  | 'cash'
  | 'visa'
  | 'creditLine'
  | 'total'
  | 'totalVoids'
  | 'variance'
  | 'marketShare'
  | 'avgTicket';

interface Col {
  key: ColKey;
  header: string;
  numeric: boolean;
  sumFormat?: 'int' | 'money';
  tooltip?: string;
}

interface Props {
  rows: CaravanRecord[];
  showPeriod: boolean;
  loading: boolean;
  className?: string;
}

const BASE_COLS: Col[] = [
  { key: 'name', header: 'المحل / الكرافان', numeric: false },
  { key: 'branchCode', header: 'الكود', numeric: false },
  { key: 'period', header: 'الفترة', numeric: false },
  { key: 'netRevenue', header: 'صافي الإيراد (Net)', numeric: true, sumFormat: 'money' },
  { key: 'serviceCharge', header: 'رسم الخدمة (Service)', numeric: true, sumFormat: 'money' },
  { key: 'salesTax', header: 'ضريبة المبيعات (Tax)', numeric: true, sumFormat: 'money' },
  { key: 'cover', header: 'عدد الشيكات (Checks)', numeric: true, sumFormat: 'int' },
  { key: 'cash', header: 'نقدي (Cash)', numeric: true, sumFormat: 'money' },
  { key: 'visa', header: 'فيزا (Visa)', numeric: true, sumFormat: 'money' },
  { key: 'creditLine', header: 'آجل (C/L)', numeric: true, sumFormat: 'money' },
  { key: 'total', header: 'الإجمالي الشامل (Grand Total)', numeric: true, sumFormat: 'money' },
  { key: 'totalVoids', header: 'المرتجعات (Voids)', numeric: true, sumFormat: 'money', tooltip: 'إجمالي المبالغ الملغاة والمرتجعة' },
  { key: 'variance', header: 'فارق التسوية (Variance)', numeric: true, sumFormat: 'money', tooltip: 'فارق تسوية النقدية: (كاش + فيزا + آجل) - صافي الإيراد الشامل' },
  { key: 'marketShare', header: 'الحصة السوقية', numeric: true },
  { key: 'avgTicket', header: 'متوسط الفاتورة', numeric: true },
];

export function CaravanGrid({ rows, showPeriod, loading, className = '' }: Props) {
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<ColKey>('total');
  const [asc, setAsc] = useState(false);
  const [hidden, setHidden] = useState<Partial<Record<ColKey, boolean>>>({});
  const [menuOpen, setMenuOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'standard' | 'transposed'>('standard');

  const cols = useMemo(
    () => BASE_COLS.filter((c) => (c.key !== 'period' || showPeriod) && !hidden[c.key]),
    [showPeriod, hidden]
  );

  const view = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? rows.filter(
          (r) =>
            r.name.toLowerCase().includes(q) ||
            String(r.branchCode).toLowerCase().includes(q) ||
            (r.period ?? '').includes(q)
        )
      : rows;
    return [...filtered].sort((a, b) => {
      const av = a[sortKey] as string | number | null | undefined;
      const bv = b[sortKey] as string | number | null | undefined;
      if (av == null) return 1;
      if (bv == null) return -1;
      const cmp =
        typeof av === 'number' && typeof bv === 'number'
          ? av - bv
          : String(av).localeCompare(String(bv), 'ar');
      return asc ? cmp : -cmp;
    });
  }, [rows, query, sortKey, asc]);

  const sum = (k: ColKey): number => {
    return view.reduce((a, r) => {
      if (k === 'netRevenue') {
        const val = r.netRevenue ?? (r.total - (r.salesTax || 0) - (r.serviceCharge || 0));
        return a + (Number(val) || 0);
      }
      if (k === 'serviceCharge') return a + (Number(r.serviceCharge) || 0);
      if (k === 'salesTax') return a + (Number(r.salesTax) || 0);
      if (k === 'totalVoids') return a + (Number(r.totalVoids) || 0);
      if (k === 'variance') return a + (Number(r.variance) || 0);
      return a + (Number(r[k]) || 0);
    }, 0);
  };

  const grandTotal = sum('total');
  const grandCover = sum('cover');
  const grandNet = sum('netRevenue');
  const grandService = sum('serviceCharge');
  const grandTax = sum('salesTax');
  const grandCash = sum('cash');
  const grandVisa = sum('visa');
  const grandCL = sum('creditLine');
  const grandVoids = sum('totalVoids');
  const grandVariance = Math.round(sum('variance') * 100) / 100;

  const toggleSort = (k: ColKey) => {
    if (k === sortKey) setAsc(!asc);
    else {
      setSortKey(k);
      setAsc(false);
    }
  };

  const renderCell = (r: CaravanRecord, c: Col): React.ReactNode => {
    switch (c.key) {
      case 'branchCode':
        return (
          <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-700 dark:bg-slate-800 dark:text-zinc-300">
            {r.branchCode}
          </span>
        );
      case 'name':
        return (
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 dark:text-white whitespace-nowrap">{r.name}</span>
            <span className="rounded-full bg-orange-50 border border-orange-200 px-2.5 py-0.5 text-[10px] font-medium text-orange-700 dark:bg-violet-500/10 dark:border-violet-500/20 dark:text-violet-300">
              كرافان
            </span>
          </div>
        );
      case 'period':
        return <span className="font-mono text-xs text-slate-500 dark:text-zinc-400">{r.period ?? '-'}</span>;
      case 'netRevenue': {
        const val = r.netRevenue ?? (r.total - (r.salesTax || 0) - (r.serviceCharge || 0));
        return <span className="font-semibold text-slate-800 dark:text-zinc-200">{fmtMoney(val)}</span>;
      }
      case 'serviceCharge':
        return <span className="text-slate-600 dark:text-zinc-300">{fmtMoney(r.serviceCharge || 0)}</span>;
      case 'salesTax':
        return <span className="text-amber-700 dark:text-amber-300/90">{fmtMoney(r.salesTax || 0)}</span>;
      case 'cover':
        return <span className="font-medium text-slate-800 dark:text-zinc-200">{fmtInt(r.cover)}</span>;
      case 'total':
        return <span className="font-mono font-extrabold text-slate-900 dark:text-slate-100">{fmtMoney(r.total)}</span>;
      case 'totalVoids': {
        const voids = Number(r.totalVoids) || 0;
        return (
          <span
            className={`font-mono font-semibold transition-colors ${
              voids > 0
                ? 'text-rose-600 dark:text-rose-400 print:text-black print:font-bold'
                : 'text-slate-400 dark:text-zinc-500 print:text-black'
            }`}
          >
            {fmtMoney(voids)}
          </span>
        );
      }
      case 'variance': {
        const v = Math.round((Number(r.variance) || 0) * 100) / 100;
        if (Math.abs(v) < 0.005) {
          // If Variance === 0: Subtle green text/indicator (Perfect Match)
          return (
            <span className="inline-flex items-center gap-1 font-mono font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/40 px-2 py-0.5 rounded-md text-xs print:border-none print:bg-transparent print:text-black">
              <span>0.00</span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-sans print:hidden">✓ مطابق</span>
            </span>
          );
        }
        if (v < 0) {
          // If Variance < 0 (Shortage/عجز): Light red background with bold dark red text
          return (
            <span className="inline-flex items-center gap-1.5 font-mono font-extrabold text-red-700 bg-red-50 dark:bg-red-950/50 dark:text-red-300 border border-red-200 dark:border-red-900/60 px-2.5 py-0.5 rounded-md text-xs print:border-none print:bg-transparent print:text-black print:font-extrabold">
              <span className="print:hidden">{fmtMoney(v)}</span>
              <span className="hidden print:inline font-bold">({fmtMoney(Math.abs(v))}) - عجز</span>
              <span className="text-[10px] font-semibold bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-200 px-1 rounded print:hidden">
                عجز
              </span>
            </span>
          );
        }
        // If Variance > 0 (Overage/زيادة): Light yellow/orange background with dark text
        return (
          <span className="inline-flex items-center gap-1.5 font-mono font-bold text-amber-800 bg-amber-50 dark:bg-amber-950/50 dark:text-amber-200 border border-amber-200 dark:border-amber-900/60 px-2.5 py-0.5 rounded-md text-xs print:border-none print:bg-transparent print:text-black print:font-bold">
            <span className="print:hidden">+{fmtMoney(v)}</span>
            <span className="hidden print:inline font-bold">+{fmtMoney(v)} زيادة</span>
            <span className="text-[10px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200 px-1 rounded print:hidden">
              زيادة
            </span>
          </span>
        );
      }
      case 'marketShare':
        return (
          <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-800 font-mono border border-slate-200 dark:bg-slate-800 dark:text-zinc-200 dark:border-white/5">
            {r.marketShare.toFixed(1)}%
          </span>
        );
      case 'cash':
        return <span className="font-mono text-slate-800 dark:text-zinc-200">{fmtMoney(r.cash)}</span>;
      case 'visa':
        return <span className="font-mono text-slate-800 dark:text-zinc-300">{fmtMoney(r.visa)}</span>;
      case 'creditLine':
      case 'avgTicket':
        return <span className="text-slate-800 dark:text-zinc-300">{fmtMoney(r[c.key])}</span>;
      default:
        return null;
    }
  };

  const renderFooter = (c: Col, idx: number): React.ReactNode => {
    if (idx === 0) return 'الإجمالي الموحد';
    if (c.key === 'branchCode' || c.key === 'period') return '—';
    if (c.key === 'marketShare') return view.length ? '100%' : '';
    if (c.key === 'avgTicket') return fmtMoney(grandCover > 0 ? grandTotal / grandCover : 0);
    if (c.key === 'netRevenue') return fmtMoney(grandNet);
    if (c.key === 'serviceCharge') return fmtMoney(grandService);
    if (c.key === 'salesTax') return fmtMoney(grandTax);
    if (c.key === 'totalVoids') {
      return (
        <span className="font-mono font-bold text-rose-600 dark:text-rose-400 print:text-black">
          {fmtMoney(grandVoids)}
        </span>
      );
    }
    if (c.key === 'variance') {
      if (Math.abs(grandVariance) < 0.005) {
        return (
          <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold print:text-black">
            0.00 ✓ مطابق
          </span>
        );
      }
      if (grandVariance < 0) {
        return (
          <span className="font-mono text-red-700 dark:text-red-400 font-extrabold print:text-black">
            <span className="print:hidden">{fmtMoney(grandVariance)} (عجز)</span>
            <span className="hidden print:inline">({fmtMoney(Math.abs(grandVariance))}) عجز</span>
          </span>
        );
      }
      return (
        <span className="font-mono text-amber-800 dark:text-amber-300 font-bold print:text-black">
          +{fmtMoney(grandVariance)} (زيادة)
        </span>
      );
    }
    if (c.sumFormat === 'int') return fmtInt(sum(c.key));
    if (c.sumFormat === 'money') return fmtMoney(sum(c.key));
    return '';
  };

  // Metrics for Transposed / Inverted Table View
  const transposedMetrics = [
    {
      key: 'netRevenue',
      label: 'صافي الإيراد (Net Revenue)',
      getValue: (r: CaravanRecord) => fmtMoney(r.netRevenue ?? (r.total - (r.salesTax || 0) - (r.serviceCharge || 0))),
      totalValue: fmtMoney(grandNet),
      color: 'text-slate-900 dark:text-slate-100 font-semibold',
    },
    {
      key: 'serviceCharge',
      label: 'رسم الخدمة (Service Charge)',
      getValue: (r: CaravanRecord) => fmtMoney(r.serviceCharge || 0),
      totalValue: fmtMoney(grandService),
      color: 'text-slate-600 dark:text-zinc-300',
    },
    {
      key: 'salesTax',
      label: 'ضريبة المبيعات (Sales Tax)',
      getValue: (r: CaravanRecord) => fmtMoney(r.salesTax || 0),
      totalValue: fmtMoney(grandTax),
      color: 'text-amber-700 dark:text-amber-400',
    },
    {
      key: 'cover',
      label: 'عدد الشيكات / العمليات (Checks)',
      getValue: (r: CaravanRecord) => fmtInt(r.cover),
      totalValue: fmtInt(grandCover),
      color: 'text-slate-900 dark:text-zinc-200 font-bold',
    },
    {
      key: 'cash',
      label: 'المتحصل نقداً (Cash)',
      getValue: (r: CaravanRecord) => fmtMoney(r.cash),
      totalValue: fmtMoney(grandCash),
      color: 'text-slate-800 dark:text-zinc-200',
    },
    {
      key: 'visa',
      label: 'المتحصل بالفيزا (Visa)',
      getValue: (r: CaravanRecord) => fmtMoney(r.visa),
      totalValue: fmtMoney(grandVisa),
      color: 'text-slate-800 dark:text-zinc-200',
    },
    {
      key: 'creditLine',
      label: 'مبيعات الآجل (Credit Line)',
      getValue: (r: CaravanRecord) => fmtMoney(r.creditLine),
      totalValue: fmtMoney(grandCL),
      color: 'text-slate-500 dark:text-zinc-400',
    },
    {
      key: 'total',
      label: 'الإجمالي الشامل (Grand Total)',
      getValue: (r: CaravanRecord) => fmtMoney(r.total),
      totalValue: fmtMoney(grandTotal),
      color: 'text-slate-900 dark:text-slate-100 font-extrabold text-sm',
    },
    {
      key: 'totalVoids',
      label: 'إجمالي المرتجعات (Total Voids)',
      getValue: (r: CaravanRecord) => (
        <span
          className={`font-mono font-semibold ${
            (r.totalVoids || 0) > 0 ? 'text-rose-600 dark:text-rose-400 print:text-black' : 'text-slate-400 dark:text-zinc-500 print:text-black'
          }`}
        >
          {fmtMoney(r.totalVoids || 0)}
        </span>
      ),
      totalValue: (
        <span className="font-mono font-bold text-rose-600 dark:text-rose-400 print:text-black">
          {fmtMoney(grandVoids)}
        </span>
      ),
      color: 'text-rose-600 dark:text-rose-400 font-bold',
    },
    {
      key: 'variance',
      label: 'فارق التسوية (Reconciliation Variance)',
      getValue: (r: CaravanRecord) => {
        const v = Math.round((Number(r.variance) || 0) * 100) / 100;
        if (Math.abs(v) < 0.005) {
          return (
            <span className="inline-flex items-center gap-1 font-mono font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/40 px-2 py-0.5 rounded-md text-xs print:border-none print:bg-transparent print:text-black">
              0.00 ✓ مطابق
            </span>
          );
        }
        if (v < 0) {
          return (
            <span className="inline-flex items-center gap-1.5 font-mono font-extrabold text-red-700 bg-red-50 dark:bg-red-950/50 dark:text-red-300 border border-red-200 dark:border-red-900/60 px-2 py-0.5 rounded-md text-xs print:border-none print:bg-transparent print:text-black">
              <span className="print:hidden">{fmtMoney(v)} (عجز)</span>
              <span className="hidden print:inline">({fmtMoney(Math.abs(v))}) عجز</span>
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1.5 font-mono font-bold text-amber-800 bg-amber-50 dark:bg-amber-950/50 dark:text-amber-200 border border-amber-200 dark:border-amber-900/60 px-2 py-0.5 rounded-md text-xs print:border-none print:bg-transparent print:text-black">
            <span className="print:hidden">+{fmtMoney(v)} (زيادة)</span>
            <span className="hidden print:inline">+{fmtMoney(v)} زيادة</span>
          </span>
        );
      },
      totalValue: (
        <span className="font-mono font-bold">
          {Math.abs(grandVariance) < 0.005 ? (
            '0.00 ✓'
          ) : grandVariance < 0 ? (
            <span className="text-red-700 dark:text-red-400 print:text-black">
              <span className="print:hidden">{fmtMoney(grandVariance)} عجز</span>
              <span className="hidden print:inline">({fmtMoney(Math.abs(grandVariance))}) عجز</span>
            </span>
          ) : (
            <span className="text-amber-800 dark:text-amber-300 print:text-black">
              +{fmtMoney(grandVariance)} زيادة
            </span>
          )}
        </span>
      ),
      color:
        Math.abs(grandVariance) < 0.005
          ? 'text-emerald-700 dark:text-emerald-400 font-bold'
          : grandVariance < 0
          ? 'text-red-700 dark:text-red-400 font-extrabold'
          : 'text-amber-800 dark:text-amber-300 font-bold',
    },
    {
      key: 'avgTicket',
      label: 'متوسط الفاتورة (Average Ticket)',
      getValue: (r: CaravanRecord) => fmtMoney(r.avgTicket),
      totalValue: fmtMoney(grandCover > 0 ? grandTotal / grandCover : 0),
      color: 'text-slate-600 dark:text-zinc-300',
    },
    {
      key: 'marketShare',
      label: 'الحصة السوقية (Market Share %)',
      getValue: (r: CaravanRecord) => `${r.marketShare.toFixed(1)}%`,
      totalValue: '100%',
      color: 'text-orange-600 dark:text-violet-300 font-semibold',
    },
  ];

  return (
    <div
      className={`rounded-3xl border border-slate-200 bg-white p-6 shadow-sm print:border-none print:shadow-none print:break-inside-auto print:p-0 dark:border-white/5 dark:bg-[#18181b] ${className}`}
    >
      {/* Header and Controls */}
      <div className="flex flex-col gap-3 border-b border-slate-200 dark:border-white/5 p-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              تسوية النقدية وتفاصيل الإيرادات (Cash Reconciliation & Outlets)
            </h3>
            <span className="rounded-full bg-orange-50 border border-orange-200 px-3 py-0.5 text-xs font-medium text-orange-700 dark:bg-violet-500/10 dark:border-violet-500/20 dark:text-violet-300">
              {viewMode === 'standard' ? 'عرض قياسي أفقي' : 'عرض معكوس (مقارنة المحلات)'}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
            <span className="tabular-nums font-semibold text-slate-800 dark:text-zinc-200">{fmtInt(view.length)}</span> سجل
            {query && (
              <span>
                {' '}
                (تمت التصفية من أصل <span className="tabular-nums font-semibold">{fmtInt(rows.length)}</span>)
              </span>
            )}
            {' • '}
            <span>مراقبة فروق التسوية (Variance) والمرتجعات (Voids) لضبط سلوك الكاشير</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Toggle: Standard vs Transposed */}
          <div className="inline-flex rounded-xl bg-slate-100 border border-slate-200 dark:bg-slate-800 dark:border-white/5 p-1">
            <button
              type="button"
              onClick={() => setViewMode('standard')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                viewMode === 'standard'
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-white dark:text-black font-medium'
                  : 'text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              <TableIcon className="h-3.5 w-3.5" />
              <span>العرض القياسي</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('transposed')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                viewMode === 'transposed'
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-white dark:text-black font-medium'
                  : 'text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              <RotateCw className="h-3.5 w-3.5" />
              <span>العرض المعكوس (مقارن)</span>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-zinc-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث عن كرافان أو كود..."
              className="w-52 rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-3 pr-9 text-xs text-slate-900 outline-none transition focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:border-white/5 dark:bg-zinc-950 dark:text-zinc-200 dark:focus:border-violet-400 dark:focus:ring-violet-400 placeholder:text-slate-400"
            />
          </div>

          {/* Column Visibility Selector (Standard view only) */}
          {viewMode === 'standard' && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-200 dark:border-white/5 dark:bg-slate-800 dark:text-zinc-200 dark:hover:bg-slate-700"
              >
                <Columns3 className="h-3.5 w-3.5" />
                الأعمدة
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setMenuOpen(false)} />
                  <div className="absolute left-0 z-30 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-white/5 dark:bg-[#18181b]">
                    <div className="px-2 py-1 text-[11px] font-bold text-slate-500 dark:text-zinc-400 border-b border-slate-100 dark:border-white/5 mb-1">
                      تحديد أعمدة الجدول:
                    </div>
                    {BASE_COLS.filter((c) => c.key !== 'period' || showPeriod).map((c) => (
                      <label
                        key={c.key}
                        className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-slate-800 select-none"
                      >
                        <input
                          type="checkbox"
                          checked={!hidden[c.key]}
                          onChange={(e) => setHidden({ ...hidden, [c.key]: !e.target.checked })}
                          className="h-3.5 w-3.5 rounded accent-orange-600 dark:accent-violet-400"
                        />
                        {c.header}
                      </label>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: STANDARD TABLE WITH FIXED FIRST COLUMN & SMOOTH SCROLL            */}
      {/* ========================================================================= */}
      {viewMode === 'standard' ? (
        <div className={`overflow-x-auto scroll-smooth max-h-[620px] print:max-h-none ${loading ? 'opacity-60' : ''}`}>
          <table className="w-full border-collapse text-xs text-right print:w-full print:table-fixed">
            <thead className="sticky top-0 z-20 bg-slate-100 dark:bg-zinc-950 shadow-xs border-b border-slate-200 dark:border-white/5">
              <tr>
                {cols.map((c, colIndex) => {
                  const isFirstCol = colIndex === 0;
                  return (
                    <th
                      key={c.key}
                      onClick={() => toggleSort(c.key)}
                      className={`cursor-pointer select-none whitespace-nowrap px-4 py-3.5 font-bold tracking-tight transition hover:text-slate-900 dark:hover:text-white print:px-2 print:py-2 print:text-black ${
                        isFirstCol
                          ? 'sticky right-0 z-30 bg-slate-100 text-slate-900 shadow-[2px_0_5px_rgba(0,0,0,0.06)] dark:bg-zinc-950 dark:text-slate-100 dark:shadow-[2px_0_5px_rgba(0,0,0,0.4)] print:shadow-none print:bg-transparent'
                          : 'text-slate-600 dark:text-zinc-400'
                      } ${c.numeric ? 'text-left' : 'text-right'}`}
                    >
                      <span className={`inline-flex items-center gap-1.5 ${c.numeric ? 'flex-row-reverse' : ''}`}>
                        {c.header}
                        <span className="print:hidden">
                          {sortKey === c.key ? (
                            asc ? (
                              <ArrowUp className="h-3.5 w-3.5 text-orange-600 dark:text-violet-300" />
                            ) : (
                              <ArrowDown className="h-3.5 w-3.5 text-orange-600 dark:text-violet-300" />
                            )
                          ) : (
                            <ArrowUpDown className="h-3 w-3 opacity-30" />
                          )}
                        </span>
                      </span>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80">
              {view.length === 0 ? (
                <tr>
                  <td colSpan={cols.length} className="py-16 text-center text-sm text-slate-400 dark:text-zinc-400">
                    {loading ? 'جاري استرجاع تفاصيل المحلات...' : 'لا توجد بيانات للفترة المحددة'}
                  </td>
                </tr>
              ) : (
                view.map((r, i) => {
                  const isEven = i % 2 === 0;
                  return (
                    <tr
                      key={`${r.branchCode}-${r.period ?? ''}-${i}`}
                      className={`group transition-colors duration-150 hover:bg-orange-50/40 dark:hover:bg-slate-800/50 ${
                        isEven ? 'bg-white dark:bg-zinc-950/40' : 'bg-slate-50/50 dark:bg-zinc-950/70'
                      }`}
                    >
                      {cols.map((c, colIndex) => {
                        const isFirstCol = colIndex === 0;
                        return (
                          <td
                            key={c.key}
                            className={`whitespace-nowrap px-4 py-3.5 print:px-2 print:py-1.5 ${
                              isFirstCol
                                ? 'sticky right-0 z-10 bg-white group-hover:bg-slate-50/90 dark:group-hover:bg-slate-800 text-slate-900 font-bold shadow-[2px_0_5px_rgba(0,0,0,0.04)] dark:bg-[#18181b] dark:text-slate-100 dark:shadow-[2px_0_5px_rgba(0,0,0,0.3)] print:shadow-none print:bg-transparent transition-colors duration-150'
                                : 'text-slate-800 dark:text-zinc-300'
                            } ${c.numeric ? 'text-left font-mono tabular-nums tracking-tight font-medium' : 'text-right'}`}
                            dir={c.numeric ? 'ltr' : undefined}
                          >
                            {renderCell(r, c)}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>

            {view.length > 0 && (
              <tfoot className="sticky bottom-0 z-20 bg-slate-100 font-bold border-t border-slate-200 dark:bg-zinc-950 dark:border-white/10 shadow-inner print:shadow-none print:bg-transparent">
                <tr>
                  {cols.map((c, idx) => {
                    const isFirstCol = idx === 0;
                    return (
                      <td
                        key={c.key}
                        className={`whitespace-nowrap px-4 py-3.5 text-slate-900 dark:text-slate-100 print:px-2 print:py-2 ${
                          isFirstCol
                            ? 'sticky right-0 z-30 bg-slate-100 font-extrabold text-orange-600 shadow-[2px_0_5px_rgba(0,0,0,0.06)] dark:bg-zinc-950 dark:text-[#c4b5fd] dark:shadow-[2px_0_5px_rgba(0,0,0,0.4)] print:shadow-none print:bg-transparent print:text-black'
                            : ''
                        } ${c.numeric ? 'text-left tabular-nums' : 'text-right'}`}
                        dir={c.numeric ? 'ltr' : undefined}
                      >
                        {renderFooter(c, idx)}
                      </td>
                    );
                  })}
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      ) : (
        /* ========================================================================= */
        /* MODE 2: TRANSPOSED / INVERTED VIEW (Metrics as Rows, Outlets as Columns) */
        /* ========================================================================= */
        <div className={`overflow-x-auto scroll-smooth max-h-[640px] print:max-h-none ${loading ? 'opacity-60' : ''}`}>
          <table className="w-full border-collapse text-xs text-right print:w-full">
            <thead className="sticky top-0 z-20 bg-slate-100 dark:bg-zinc-950 shadow-xs border-b border-slate-200 dark:border-white/5">
              <tr>
                <th className="sticky right-0 z-30 min-w-[200px] bg-slate-100 px-4 py-3 font-bold text-slate-900 shadow-[2px_0_5px_rgba(0,0,0,0.06)] dark:bg-zinc-950 dark:text-slate-100 dark:shadow-[2px_0_5px_rgba(0,0,0,0.4)] print:shadow-none print:bg-transparent print:text-black">
                  البيان المالي / المعيار
                </th>
                <th className="min-w-[150px] bg-slate-200/50 px-4 py-3 text-left font-bold text-orange-700 border-x border-slate-200 dark:bg-white/5 dark:text-violet-300 dark:border-white/5 print:text-black print:bg-transparent" dir="ltr">
                  الإجمالي الموحد (Total)
                </th>
                {view.map((r, i) => (
                  <th
                    key={`${r.branchCode}-${i}`}
                    className="min-w-[140px] px-4 py-3 font-bold text-slate-800 dark:text-zinc-200 text-left whitespace-nowrap print:text-black print:px-2"
                    dir="ltr"
                  >
                    <div className="flex flex-col items-start gap-0.5" dir="rtl">
                      <span className="font-bold text-slate-900 dark:text-white print:text-black">{r.name}</span>
                      <span className="font-mono text-[10px] text-slate-500 dark:text-zinc-400 print:text-black">#{r.branchCode}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {transposedMetrics.map((m, mIdx) => {
                const isEven = mIdx % 2 === 0;
                return (
                  <tr
                    key={m.key}
                    className={`transition-colors hover:bg-slate-100/60 dark:hover:bg-slate-800/50 ${
                      isEven ? 'bg-white dark:bg-zinc-950/40' : 'bg-slate-50/50 dark:bg-zinc-950/70'
                    }`}
                  >
                    {/* Fixed First Column: Metric Name */}
                    <td className="sticky right-0 z-10 min-w-[200px] bg-white px-4 py-3 font-bold text-slate-900 shadow-[2px_0_5px_rgba(0,0,0,0.04)] whitespace-nowrap dark:bg-[#18181b] dark:text-zinc-200 dark:shadow-[2px_0_5px_rgba(0,0,0,0.3)] print:shadow-none print:bg-transparent print:text-black">
                      {m.label}
                    </td>

                    {/* Consolidated Total Column */}
                    <td
                      className="min-w-[150px] bg-slate-50 px-4 py-3 text-left font-semibold text-orange-700 tabular-nums border-x border-slate-200 whitespace-nowrap dark:bg-white/5 dark:text-violet-300 dark:border-white/5 print:bg-transparent print:text-black"
                      dir="ltr"
                    >
                      {m.totalValue}
                    </td>

                    {/* Outlets Columns */}
                    {view.map((r, i) => (
                      <td
                        key={`${r.branchCode}-${m.key}-${i}`}
                        className={`min-w-[140px] px-4 py-3 text-left tabular-nums whitespace-nowrap ${m.color} print:text-black print:px-2`}
                        dir="ltr"
                      >
                        {m.getValue(r)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer Info & Landscape Print Helper */}
      <div className="flex flex-col gap-2 border-t border-slate-200 dark:border-white/5 p-3 text-xs text-slate-500 dark:text-zinc-400 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <span className="flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-orange-600 dark:text-violet-300" />
          <span>
            {viewMode === 'transposed'
              ? 'العرض المعكوس يتيح مقارنة أفقية متزامنة بين جميع المحلات عبر كافة المعايير المالية والتسويات.'
              : 'العمود الأول مثبت أثناء التمرير لتسهيل قراءة كافة المعايير بدون اقتطاع.'}
          </span>
        </span>
        <span className="text-[11px] text-slate-400 font-mono">
          A4 Landscape B&W Optimized
        </span>
      </div>
    </div>
  );
}
