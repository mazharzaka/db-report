'use client';

import React, { useMemo, useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Loader2,
  Calendar,
  Grid3X3,
  ArrowUpDown,
  Receipt,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Store,
  Utensils,
  Coffee,
  ShoppingBag,
} from 'lucide-react';
import type { CaravanRecord } from '@/types/reports';
import { fmtMoney, Money } from './charts';
import { getSectorTheme, type SectorTheme } from '@/config/sectorsConfig';

/* -------------------------------------------------------------------------- */
/* Types & Interfaces                                                         */
/* -------------------------------------------------------------------------- */

export interface MatrixRowItem {
  date?: string;
  period?: string | null;
  branchCode: string;
  name: string;
  cash?: number;
  visa?: number;
  cl?: number;
  creditLine?: number;
  total?: number;
  [key: string]: any;
}

export const CARAVAN_DISPLAY_NAMES: Record<string, string> = {
  '1003': 'BAWABA',
  '1004': 'AL SHLAL',
  '1005': 'DISCOVRY',
  '1006': 'ROCET',
  '1007': 'DARKNISS',
  '1008': 'THE RIVER',
  '1010': 'EGYPTION',
  '1015': 'AL PATATS',
  '1018': '229',
  '1021': 'DOPY',
  '1023': 'LIMO',
  '1024': 'TOYES',
  '1025': 'BONBON',
  '1027': 'ZOO',
  '1029': 'Funny',
  '1030': 'ALTAAWWSS',
};

export const VGAMES_DISPLAY_NAMES: Record<string, string> = {
  '18': 'Movy',
  '119': 'Doobi Castle',
  '109': 'Babliony',
  '20': 'Hummer',
  '111': 'Shooting',
  '122': 'VR3',
  '12': 'Shooting2',
  '19': 'Radio',
  '3': 'Upside Down House',
  '110': 'Childrens',
  '117': 'V.R 1',
  '118': 'V.R 2',
};

export const VGAMES_SECTOR_ORDER: string[] = [
  '18',  // Movy
  '119', // Doobi Castle
  '109', // Babliony
  '20',  // Hummer
  '111', // Shooting
  '122', // VR3
  '12',  // Shooting2
  '19',  // Radio
  '3',   // Upside Down House
  '110', // Childrens
  '117', // V.R 1
  '118', // V.R 2
];

export const PAID_RIDES_DISPLAY_NAMES: Record<string, string> = {
  '7': 'R.Coaster',
  '16': 'Rocket',
  'simulator': 'Simulator',
  'golden': 'Golden',
  'topspin': 'Top Spin',
  '8': 'Go Kart',
  'moto': 'Moto',
  '4': '7 D',
  '1': 'Discovery',
  '113': 'Horse',
  '6': 'Tornado',
  'camel': 'Camel',
  '115': 'Funny Slides',
  'fire': 'Fire Brigade',
  '2': 'Super Spin',
  '14': 'Laser zone',
};

export const PAID_RIDES_SECTOR_ORDER: string[] = [
  '7',         // 1. R.Coaster (القطار) — Active
  '16',        // 2. Rocket (الصاروخ) — Active
  'simulator', // 3. Simulator (السيمولاتور) — Inactive
  'golden',    // 4. Golden (الذهبية / VIP / الباقات) — Active
  'topspin',   // 5. Top Spin (التوب سبين) — Inactive
  '8',         // 6. Go Kart (السيارات) — Active
  'moto',      // 7. Moto (الموتوسيكلات) — Inactive
  '4',         // 8. 7 D (7D) — Active
  '1',         // 9. Discovery (الديسكفري) — Active
  '113',       // 10. Horse (الخيل — 113) — Active
  '6',         // 11. Tornado (التورنيدو) — Active
  'camel',     // 12. Camel (الجمال) — Inactive
  '115',       // 13. Funny Slides (شلال المرح — 115) — Active
  'fire',      // 14. Fire Brigade (المطافي) — Inactive
  '2',         // 15. Super Spin (السوبر سبين) — Active
  '14',        // 16. Laser zone (الليزر زون) — Active
];

export const PAID_RIDES_INACTIVE_CODES = new Set([
  'simulator',
  'topspin',
  'moto',
  'camel',
  'fire',
]);

export type RideStatusFilter = 'active' | 'inactive' | 'all';

export const SHOP_BRANCH_CODES_SET = new Set(['1021', '1023', '1024', '1025', '1029']);

export const CARAVAN_SECTOR_ORDER: string[] = [
  '1003', // BAWABA
  '1004', // AL SHLAL
  '1005', // DISCOVRY
  '1006', // ROCET
  '1007', // DARKNISS
  '1008', // THE RIVER
  '1010', // EGYPTION
  '1015', // AL PATATS
  '1018', // 229
  '1027', // ZOO
  '1030', // ALTAAWWSS
  '1021', // DOPY (Shop)
  '1023', // LIMO (Shop)
  '1024', // TOYES (Shop)
  '1025', // BONBON (Shop)
  '1029', // Funny (Shop)
];

export const RESTAURANT_DISPLAY_NAMES: Record<string, string> = {
  '1': 'المطعم الصيني (Chinese)',
  '2': 'المطعم المصري (Egypt)',
  '3': 'المطعم الإيطالي (Italian)',
  '4': 'المطعم الشرقي (Oriental)',
  '5': 'مطعم الستيك (Steak)',
  '6': 'يشمع هيلتون (Yashmk)',
  '7': 'شيكي (Cheky)',
  '8': 'هوليوود (Hollywood)',
  '9': 'دريم تو جو (Dream To Go)',
  '10': 'فرش (Fresh)',
  '11': 'مستر برجر (Mr. Burger)',
  '13': 'مستشفى دريم (Dream Hospital)',
  '14': 'الكانتين (Canteen)',
};

interface DailyRevenueMatrixProps {
  rows?: (CaravanRecord | MatrixRowItem)[];
  title?: string;
  loading?: boolean;
  sectorId?: string;
  sectorType?: number;
  sectorLabel?: string;
  sectorTheme?: SectorTheme;
  facilityType?: 'all' | 'caravans' | 'shops';
  onFacilityTypeChange?: (f: 'all' | 'caravans' | 'shops') => void;
  rideStatusFilter?: RideStatusFilter;
  onRideStatusFilterChange?: (filter: RideStatusFilter) => void;
  startDate?: string;
  endDate?: string;
  granularity?: 'summary' | 'month' | 'day' | 'total';
}

interface MatrixColumn {
  branchCode: string;
  name: string;
}

export type CalcMode = 'total' | 'net' | 'vat';
export type MatrixViewMode = 'net' | 'vat' | 'total'; // Backward compatibility

// Shared Intl.NumberFormat instance (avoids creating 7,000+ formatters per render on 365-day matrices)
const MONEY_FORMATTER = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

interface MatrixRowData {
  date: string;
  values: Record<string, number>;
  rowTotal: number;
  rowCash: number;
  rowVisa: number;
  rowCoupons: number;
  rowCashVisa: number;
  food?: number;
  beverage?: number;
  other?: number;
  cost?: number;
}

interface MatrixTableRowProps {
  row: MatrixRowData;
  columns: MatrixColumn[];
  calcMode: CalcMode;
  hoverRowClass: string;
  hoverCellClass: string;
  totalRevColClass: string;
  isTwoRowHeader?: boolean;
  sectorType?: number;
}

const MatrixTableRow = React.memo(function MatrixTableRow({
  row,
  columns,
  calcMode,
  hoverRowClass,
  hoverCellClass,
  totalRevColClass,
  isTwoRowHeader = false,
  sectorType,
}: MatrixTableRowProps) {
  if (sectorType === 1) {
    return (
      <tr className={`group transition-colors duration-150 ${hoverRowClass}`}>
        {/* Date Column (Sticky Right) */}
        <td className={`sticky right-0 z-10 px-4 py-3.5 text-center font-bold text-sm lg:text-base text-slate-900 border-l border-slate-200 bg-slate-50/95 ${hoverCellClass} dark:border-zinc-800 dark:bg-zinc-900/95 dark:text-zinc-100 transition-colors`}>
          {row.date}
        </td>

        {/* Food */}
        <td className={`px-4 py-3.5 text-left font-bold text-base lg:text-lg tabular-nums border-l border-slate-200/60 dark:border-zinc-800/40 ${hoverCellClass} text-slate-900 dark:text-white`}>
          {MONEY_FORMATTER.format(row.food || 0)}
        </td>

        {/* Beverage */}
        <td className={`px-4 py-3.5 text-left font-bold text-base lg:text-lg tabular-nums border-l border-slate-200/60 dark:border-zinc-800/40 ${hoverCellClass} text-slate-900 dark:text-white`}>
          {MONEY_FORMATTER.format(row.beverage || 0)}
        </td>

        {/* Other */}
        <td className={`px-4 py-3.5 text-left font-bold text-base lg:text-lg tabular-nums border-l border-slate-200/60 dark:border-zinc-800/40 ${hoverCellClass} text-slate-900 dark:text-white`}>
          {MONEY_FORMATTER.format(row.other || 0)}
        </td>

        {/* Daily Total */}
        <td className={`px-4 py-3.5 text-left font-black text-base lg:text-lg tabular-nums ${totalRevColClass} ${hoverCellClass} transition-colors border-l border-slate-200/60 dark:border-zinc-800/40`}>
          <Money value={row.rowTotal} />
        </td>

        {calcMode !== 'vat' && (
          <>
            {/* Daily Cash */}
            <td className={`px-4 py-3.5 text-left font-bold text-base lg:text-lg tabular-nums text-slate-900 bg-slate-50/80 ${hoverCellClass} dark:bg-zinc-800/40 dark:text-zinc-100 transition-colors border-l border-slate-200/60 dark:border-zinc-800/40`}>
              <Money value={row.rowCash} />
            </td>

            {/* Daily Visa */}
            <td className={`px-4 py-3.5 text-left font-bold text-base lg:text-lg tabular-nums text-slate-900 bg-slate-50/80 ${hoverCellClass} dark:bg-zinc-800/40 dark:text-zinc-100 transition-colors border-l border-slate-200/60 dark:border-zinc-800/40`}>
              <Money value={row.rowVisa} />
            </td>

            {/* Daily Coupons & CL */}
            <td className={`px-4 py-3.5 text-left font-bold text-base lg:text-lg tabular-nums text-slate-900 bg-slate-50/80 ${hoverCellClass} dark:bg-zinc-800/40 dark:text-zinc-100 transition-colors`}>
              <Money value={row.rowCoupons} />
            </td>
          </>
        )}
      </tr>
    );
  }

  return (
    <tr className={`group transition-colors duration-150 ${hoverRowClass}`}>
      {/* Date Column (Sticky Right) */}
      <td className={`sticky right-0 z-10 px-4 py-3.5 text-center font-bold text-sm lg:text-base text-slate-900 border-l border-slate-200 bg-slate-50/95 ${hoverCellClass} dark:border-zinc-800 dark:bg-zinc-900/95 dark:text-zinc-100 transition-colors`}>
        {row.date}
      </td>

      {/* Outlet / Game Values */}
      {columns.map((col) => {
        if (isTwoRowHeader && col.branchCode === 'golden') {
          const sGolden = row.values['golden_sgolden'] || 0;
          const platinum = row.values['golden_platinum'] || 0;
          const diamond = row.values['golden_diamond'] || 0;
          const vip = row.values['golden_vip'] || 0;
          const total = row.values['golden'] || (sGolden + platinum + diamond + vip);
          return (
            <React.Fragment key={col.branchCode}>
              <td className={`px-2.5 py-3.5 text-center font-mono text-sm tabular-nums border-l border-slate-200/60 dark:border-zinc-800/40 ${hoverCellClass} text-slate-400 dark:text-zinc-600`}>
                {sGolden > 0 ? MONEY_FORMATTER.format(sGolden) : <span className="opacity-40 font-normal">0.00</span>}
              </td>
              <td className={`px-2.5 py-3.5 text-center font-mono text-sm tabular-nums border-l border-slate-200/60 dark:border-zinc-800/40 ${hoverCellClass} text-slate-400 dark:text-zinc-600`}>
                {platinum > 0 ? MONEY_FORMATTER.format(platinum) : <span className="opacity-40 font-normal">0.00</span>}
              </td>
              <td className={`px-2.5 py-3.5 text-center font-mono text-sm tabular-nums border-l border-slate-200/60 dark:border-zinc-800/40 ${hoverCellClass} text-slate-400 dark:text-zinc-600`}>
                {diamond > 0 ? MONEY_FORMATTER.format(diamond) : <span className="opacity-40 font-normal">0.00</span>}
              </td>
              <td className={`px-2.5 py-3.5 text-center font-mono text-sm tabular-nums border-l border-slate-200/60 dark:border-zinc-800/40 ${hoverCellClass} text-slate-400 dark:text-zinc-600`}>
                {vip > 0 ? MONEY_FORMATTER.format(vip) : <span className="opacity-40 font-normal">0.00</span>}
              </td>
              <td className={`px-3 py-3.5 text-left font-bold text-base lg:text-lg tabular-nums border-l border-slate-200/60 dark:border-zinc-800/40 ${hoverCellClass} ${total > 0 ? 'text-slate-900 dark:text-white font-black' : 'text-slate-300 dark:text-zinc-600 font-normal'}`}>
                {total > 0 ? MONEY_FORMATTER.format(total) : <span className="opacity-40 font-normal">—</span>}
              </td>
            </React.Fragment>
          );
        }

        if (isTwoRowHeader && col.branchCode === '4') {
          const cash = row.values['4_cash'] || 0;
          const platinum = row.values['4_platinum'] || 0;
          const diamond = row.values['4_diamond'] || 0;
          const visa = row.values['4_visa'] || 0;
          const total = row.values['4'] || (cash + platinum + diamond + visa);
          return (
            <React.Fragment key={col.branchCode}>
              <td className={`px-2.5 py-3.5 text-center font-mono text-sm tabular-nums border-l border-slate-200/60 dark:border-zinc-800/40 ${hoverCellClass} text-slate-400 dark:text-zinc-600`}>
                {cash > 0 ? MONEY_FORMATTER.format(cash) : <span className="opacity-40 font-normal">0.00</span>}
              </td>
              <td className={`px-2.5 py-3.5 text-center font-mono text-sm tabular-nums border-l border-slate-200/60 dark:border-zinc-800/40 ${hoverCellClass} text-slate-400 dark:text-zinc-600`}>
                {platinum > 0 ? MONEY_FORMATTER.format(platinum) : <span className="opacity-40 font-normal">0.00</span>}
              </td>
              <td className={`px-2.5 py-3.5 text-center font-mono text-sm tabular-nums border-l border-slate-200/60 dark:border-zinc-800/40 ${hoverCellClass} text-slate-400 dark:text-zinc-600`}>
                {diamond > 0 ? MONEY_FORMATTER.format(diamond) : <span className="opacity-40 font-normal">0.00</span>}
              </td>
              <td className={`px-2.5 py-3.5 text-center font-mono text-sm tabular-nums border-l border-slate-200/60 dark:border-zinc-800/40 ${hoverCellClass} text-slate-400 dark:text-zinc-600`}>
                {visa > 0 ? MONEY_FORMATTER.format(visa) : <span className="opacity-40 font-normal">0.00</span>}
              </td>
              <td className={`px-3 py-3.5 text-left font-bold text-base lg:text-lg tabular-nums border-l border-slate-200/60 dark:border-zinc-800/40 ${hoverCellClass} ${total > 0 ? 'text-slate-900 dark:text-white font-black' : 'text-slate-300 dark:text-zinc-600 font-normal'}`}>
                {total > 0 ? MONEY_FORMATTER.format(total) : <span className="opacity-40 font-normal">—</span>}
              </td>
            </React.Fragment>
          );
        }

        const val = row.values[col.branchCode] || 0;
        const hasValue = Math.abs(val) > 0.0001;
        return (
          <td
            key={col.branchCode}
            className={`px-4 py-3.5 text-left font-bold text-base lg:text-lg tabular-nums border-l border-slate-200/60 dark:border-zinc-800/40 ${hoverCellClass} transition-colors ${hasValue
              ? val < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'
              : 'text-slate-300 dark:text-zinc-600 font-normal'
              }`}
          >
            {hasValue ? (
              MONEY_FORMATTER.format(val)
            ) : (
              <span className="select-none font-normal opacity-40">—</span>
            )}
          </td>
        );
      })}

      {/* Daily Row Total */}
      <td className={`px-4 py-3.5 text-left font-black text-base lg:text-lg tabular-nums ${totalRevColClass} ${hoverCellClass} transition-colors`}>
        <Money value={row.rowTotal} />
      </td>

      {calcMode !== 'vat' && (
        <>
          {/* Daily Cash */}
          <td className={`px-4 py-3.5 text-left font-bold text-base lg:text-lg tabular-nums text-slate-900 bg-slate-50/80 ${hoverCellClass} dark:bg-zinc-800/40 dark:text-zinc-100 transition-colors`}>
            <Money value={row.rowCash} />
          </td>

          {/* Daily Visa */}
          <td className={`px-4 py-3.5 text-left font-bold text-base lg:text-lg tabular-nums text-slate-900 bg-slate-50/80 ${hoverCellClass} dark:bg-zinc-800/40 dark:text-zinc-100 transition-colors`}>
            <Money value={row.rowVisa} />
          </td>

          {/* Daily Coupons & CL */}
          <td className={`px-4 py-3.5 text-left font-bold text-base lg:text-lg tabular-nums text-slate-900 bg-slate-50/80 ${hoverCellClass} dark:bg-zinc-800/40 dark:text-zinc-100 transition-colors`}>
            <Money value={row.rowCoupons} />
          </td>
        </>
      )}
    </tr>
  );
});

function formatDateAr(dateStr?: string): string {
  if (!dateStr) return '';
  const trimmed = dateStr.trim();
  const parts = trimmed.split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts;
    return `${parseInt(d, 10)}/${parseInt(m, 10)}/${y}`;
  }
  const d = new Date(trimmed);
  if (!isNaN(d.getTime())) {
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  }
  return trimmed;
}

/* -------------------------------------------------------------------------- */
/* Component Implementation                                                   */
/* -------------------------------------------------------------------------- */

export const DailyRevenueMatrix = React.memo(function DailyRevenueMatrix({
  rows = [],
  title,
  loading = false,
  sectorId,
  sectorType,
  sectorLabel,
  sectorTheme,
  facilityType = 'all',
  onFacilityTypeChange,
  rideStatusFilter,
  onRideStatusFilterChange,
  startDate,
  endDate,
  granularity,
}: DailyRevenueMatrixProps) {
  const theme = useMemo(() => sectorTheme || getSectorTheme(sectorType), [sectorTheme, sectorType]);
  const [exporting, setExporting] = useState(false);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Calculation Mode State - Default to 'total' (الإجمالي الشامل)
  const [calcMode, setCalcMode] = useState<CalcMode>('total');

  // Effective granularity for Restaurants (Type 1)
  const isRestaurants = sectorType === 1;

  interface RestaurantBranchRow {
    branchCode: string;
    name: string;
    displayName: string;
    food: number;
    beverage: number;
    other: number;
    total: number;
    cash: number;
    visa: number;
    cl: number;
  }
  const effectiveGranularity = useMemo<'summary' | 'month' | 'day'>(() => {
    if (granularity === 'total') return 'summary';
    if (granularity === 'summary' || granularity === 'month' || granularity === 'day') return granularity;
    const sample = rows[0];
    if (!sample || !('period' in sample) || !sample.period) return 'summary';
    if (String(sample.period).length === 7) return 'month';
    return 'day';
  }, [granularity, rows]);

  // Expansion states for Restaurants (Month & Day breakdown)
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [allDaysExpanded, setAllDaysExpanded] = useState<boolean>(false);

  // Paid Rides (Sector 2) All / Active / Inactive Filter State (Default: 'all')
  const [internalRideStatusFilter, setInternalRideStatusFilter] = useState<RideStatusFilter>('all');
  const effectiveRideStatusFilter = rideStatusFilter ?? internalRideStatusFilter;
  const handleRideStatusFilterChange = (f: RideStatusFilter) => {
    setInternalRideStatusFilter(f);
    onRideStatusFilterChange?.(f);
  };

  // Client-Side Pagination States (Default 31 rows/page to prevent 365-row DOM overload)
  const [rowsPerPage, setRowsPerPage] = useState<number>(31);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // ---------------------------------------------------------------------------
  // Dedicated Branch-by-Branch F&B Processor for Restaurants (sectorType === 1)
  // ---------------------------------------------------------------------------
  const restaurantData = useMemo(() => {
    if (sectorType !== 1) return null;

    const applyMode = (val: number) => {
      if (calcMode === 'net') return val / 1.14;
      if (calcMode === 'vat') return val - val / 1.14;
      return val;
    };

    let rawTotalFood = 0;
    let rawTotalBeverage = 0;
    let rawTotalOther = 0;
    let rawTotalSales = 0;
    let rawTotalCash = 0;
    let rawTotalVisa = 0;
    let rawTotalCL = 0;

    // 1. Summary Mode: Group strictly by branchCode
    const branchSummaryMap = new Map<string, {
      branchCode: string;
      name: string;
      food: number;
      beverage: number;
      other: number;
      total: number;
      cash: number;
      visa: number;
      cl: number;
    }>();

    // 2. Month Mode: Group by period ('YYYY-MM') -> branches
    const monthMap = new Map<string, {
      period: string;
      branches: Map<string, {
        branchCode: string;
        name: string;
        food: number;
        beverage: number;
        other: number;
        total: number;
        cash: number;
        visa: number;
        cl: number;
      }>;
    }>();

    // 3. Day Mode: Group by period ('YYYY-MM-DD') -> branches
    const dayMap = new Map<string, {
      date: string;
      branches: Map<string, {
        branchCode: string;
        name: string;
        food: number;
        beverage: number;
        other: number;
        total: number;
        cash: number;
        visa: number;
        cl: number;
      }>;
    }>();

    rows.forEach((r) => {
      const rawPeriod = ('period' in r && r.period ? r.period : ('date' in r && r.date ? r.date : '')).trim();
      const branchCode = String(r.branchCode || '').trim();
      const branchName = r.name || `منفذ ${branchCode}`;
      const food = Number((r as any).food) || 0;
      const beverage = Number((r as any).beverage) || 0;
      const other = Number((r as any).other) || 0;
      const cash = Number(r.cash) || 0;
      const visa = Number(r.visa) || 0;
      const cl = Number(r.creditLine ?? (r as any).cl) || 0;
      const rawTotal = Number(r.total) || 0;
      const total = Math.abs(cash + visa + cl) > 0.0001 ? (cash + visa + cl) : rawTotal;

      rawTotalFood += food;
      rawTotalBeverage += beverage;
      rawTotalOther += other;
      rawTotalSales += total;
      rawTotalCash += cash;
      rawTotalVisa += visa;
      rawTotalCL += cl;

      // Summary aggregation
      if (!branchSummaryMap.has(branchCode)) {
        branchSummaryMap.set(branchCode, {
          branchCode,
          name: branchName,
          food: 0,
          beverage: 0,
          other: 0,
          total: 0,
          cash: 0,
          visa: 0,
          cl: 0,
        });
      }
      const bs = branchSummaryMap.get(branchCode)!;
      bs.food += food;
      bs.beverage += beverage;
      bs.other += other;
      bs.total += total;
      bs.cash += cash;
      bs.visa += visa;
      bs.cl += cl;

      // Month aggregation
      const monthKey = rawPeriod.length >= 7 ? rawPeriod.slice(0, 7) : 'غير محدد';
      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, { period: monthKey, branches: new Map() });
      }
      const mEntry = monthMap.get(monthKey)!;
      if (!mEntry.branches.has(branchCode)) {
        mEntry.branches.set(branchCode, {
          branchCode,
          name: branchName,
          food: 0,
          beverage: 0,
          other: 0,
          total: 0,
          cash: 0,
          visa: 0,
          cl: 0,
        });
      }
      const mb = mEntry.branches.get(branchCode)!;
      mb.food += food;
      mb.beverage += beverage;
      mb.other += other;
      mb.total += total;
      mb.cash += cash;
      mb.visa += visa;
      mb.cl += cl;

      // Day aggregation
      const dayKey = rawPeriod || 'غير محدد';
      if (!dayMap.has(dayKey)) {
        dayMap.set(dayKey, { date: dayKey, branches: new Map() });
      }
      const dEntry = dayMap.get(dayKey)!;
      if (!dEntry.branches.has(branchCode)) {
        dEntry.branches.set(branchCode, {
          branchCode,
          name: branchName,
          food: 0,
          beverage: 0,
          other: 0,
          total: 0,
          cash: 0,
          visa: 0,
          cl: 0,
        });
      }
      const db = dEntry.branches.get(branchCode)!;
      db.food += food;
      db.beverage += beverage;
      db.other += other;
      db.total += total;
      db.cash += cash;
      db.visa += visa;
      db.cl += cl;
    });

    // Format Summary Branches list
    const summaryBranches: RestaurantBranchRow[] = Array.from(branchSummaryMap.values())
      .map((b) => ({
        branchCode: b.branchCode,
        name: b.name,
        displayName: RESTAURANT_DISPLAY_NAMES[b.branchCode] || b.name,
        food: applyMode(b.food),
        beverage: applyMode(b.beverage),
        other: applyMode(b.other),
        total: applyMode(b.total),
        cash: applyMode(b.cash),
        visa: applyMode(b.visa),
        cl: applyMode(b.cl),
      }))
      .sort((a, b) => b.total - a.total);

    // Format Month Groups
    const monthGroups = Array.from(monthMap.entries())
      .map(([monthKey, m]) => {
        const bList: RestaurantBranchRow[] = Array.from(m.branches.values())
          .map((b) => ({
            branchCode: b.branchCode,
            name: b.name,
            displayName: RESTAURANT_DISPLAY_NAMES[b.branchCode] || b.name,
            food: applyMode(b.food),
            beverage: applyMode(b.beverage),
            other: applyMode(b.other),
            total: applyMode(b.total),
            cash: applyMode(b.cash),
            visa: applyMode(b.visa),
            cl: applyMode(b.cl),
          }))
          .sort((a, b) => b.total - a.total);

        const mFood = bList.reduce((s, b) => s + b.food, 0);
        const mBev = bList.reduce((s, b) => s + b.beverage, 0);
        const mOther = bList.reduce((s, b) => s + b.other, 0);
        const mTotal = bList.reduce((s, b) => s + b.total, 0);
        const mCash = bList.reduce((s, b) => s + b.cash, 0);
        const mVisa = bList.reduce((s, b) => s + b.visa, 0);
        const mCL = bList.reduce((s, b) => s + b.cl, 0);

        return {
          monthKey,
          monthLabel: monthKey,
          food: mFood,
          beverage: mBev,
          other: mOther,
          total: mTotal,
          cash: mCash,
          visa: mVisa,
          cl: mCL,
          branches: bList,
        };
      })
      .sort((a, b) => {
        const cmp = a.monthKey.localeCompare(b.monthKey);
        return sortOrder === 'asc' ? cmp : -cmp;
      });

    // Format Day Groups
    const dayGroups = Array.from(dayMap.entries())
      .map(([dateKey, d]) => {
        const bList: RestaurantBranchRow[] = Array.from(d.branches.values())
          .map((b) => ({
            branchCode: b.branchCode,
            name: b.name,
            displayName: RESTAURANT_DISPLAY_NAMES[b.branchCode] || b.name,
            food: applyMode(b.food),
            beverage: applyMode(b.beverage),
            other: applyMode(b.other),
            total: applyMode(b.total),
            cash: applyMode(b.cash),
            visa: applyMode(b.visa),
            cl: applyMode(b.cl),
          }))
          .sort((a, b) => b.total - a.total);

        const dFood = bList.reduce((s, b) => s + b.food, 0);
        const dBev = bList.reduce((s, b) => s + b.beverage, 0);
        const dOther = bList.reduce((s, b) => s + b.other, 0);
        const dTotal = bList.reduce((s, b) => s + b.total, 0);
        const dCash = bList.reduce((s, b) => s + b.cash, 0);
        const dVisa = bList.reduce((s, b) => s + b.visa, 0);
        const dCL = bList.reduce((s, b) => s + b.cl, 0);

        return {
          date: dateKey,
          food: dFood,
          beverage: dBev,
          other: dOther,
          total: dTotal,
          cash: dCash,
          visa: dVisa,
          cl: dCL,
          branches: bList,
        };
      })
      .sort((a, b) => {
        const cmp = a.date.localeCompare(b.date);
        return sortOrder === 'asc' ? cmp : -cmp;
      });

    return {
      grandFood: applyMode(rawTotalFood),
      grandBeverage: applyMode(rawTotalBeverage),
      grandOther: applyMode(rawTotalOther),
      grandTotal: applyMode(rawTotalSales),
      grandCash: applyMode(rawTotalCash),
      grandVisa: applyMode(rawTotalVisa),
      grandCL: applyMode(rawTotalCL),
      summaryBranches,
      monthGroups,
      dayGroups,
    };
  }, [rows, sectorType, calcMode, sortOrder]);

  // Default month expansion
  useEffect(() => {
    if (isRestaurants && effectiveGranularity === 'month' && restaurantData?.monthGroups) {
      setExpandedMonths(new Set(restaurantData.monthGroups.map((m) => m.monthKey)));
    }
  }, [isRestaurants, effectiveGranularity, restaurantData?.monthGroups]);

  const allMonthsExpanded = useMemo(() => {
    if (!restaurantData?.monthGroups || restaurantData.monthGroups.length === 0) return false;
    return expandedMonths.size >= restaurantData.monthGroups.length;
  }, [expandedMonths, restaurantData?.monthGroups]);

  const handleToggleAllMonths = (expand: boolean) => {
    if (expand) {
      const keys = (restaurantData?.monthGroups || []).map((m) => m.monthKey);
      setExpandedMonths(new Set(keys));
    } else {
      setExpandedMonths(new Set());
    }
  };

  const handleToggleMonth = (monthKey: string) => {
    setExpandedMonths((prev) => {
      const next = new Set(prev);
      if (next.has(monthKey)) next.delete(monthKey);
      else next.add(monthKey);
      return next;
    });
  };

  const handleToggleAllDays = () => {
    if (allDaysExpanded) {
      setExpandedDays(new Set());
      setAllDaysExpanded(false);
    } else {
      const keys = (restaurantData?.dayGroups || []).map((d) => d.date);
      setExpandedDays(new Set(keys));
      setAllDaysExpanded(true);
    }
  };

  const handleToggleDay = (date: string) => {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  };

  // Stage 1: Raw Pivot & Grouping (Runs ONLY when raw rows change)
  const aggregatedData = useMemo(() => {
    const colMap = new Map<string, string>();
    const branchTotals = new Map<string, number>();
    const dateMap = new Map<
      string,
      Map<string, { cash: number; visa: number; cl: number; rawTotal: number }>
    >();
    const datePaymentMap = new Map<
      string,
      { cash: number; visa: number; cl: number; total: number; cashVisa: number }
    >();
    const dateFbMap = new Map<
      string,
      { food: number; beverage: number; other: number; cost: number }
    >();

    rows.forEach((r) => {
      const rawDate = 'date' in r && r.date ? r.date : r.period;
      const dateKey = (rawDate || 'غير محدد').trim();
      const branchKey = String(r.branchCode || '').trim();
      const branchName =
        sectorType === 3
          ? VGAMES_DISPLAY_NAMES[branchKey] || r.name || `لعبة ${branchKey}`
          : sectorType === 2
              ? PAID_RIDES_DISPLAY_NAMES[branchKey] || r.name || `لعبة ${branchKey}`
              : CARAVAN_DISPLAY_NAMES[branchKey] || r.name || `منفذ ${branchKey}`;

      if (branchKey && !colMap.has(branchKey)) {
        colMap.set(branchKey, branchName);
      }

      const cash = Number(r.cash) || 0;
      const visa = Number(r.visa) || 0;
      const cl = Number(r.creditLine ?? (r as any).cl) || 0;
      const rawTotal = Number(r.total) || 0;
      const itemBaseTotal = Math.abs(cash + visa + cl) > 0.0001 ? (cash + visa + cl) : rawTotal;

      branchTotals.set(branchKey, (branchTotals.get(branchKey) || 0) + itemBaseTotal);

      // Track F&B metrics when sectorType === 1
      if (sectorType === 1) {
        const curFb = dateFbMap.get(dateKey) || { food: 0, beverage: 0, other: 0, cost: 0 };
        curFb.food += Number((r as any).food) || 0;
        curFb.beverage += Number((r as any).beverage) || 0;
        curFb.other += Number((r as any).other) || 0;
        curFb.cost += Number((r as any).cost) || 0;
        dateFbMap.set(dateKey, curFb);
      }

      // Track daily payments from POS_Post if provided (Types 2 & 3 zero double-counting)
      if (
        (r as any).dailyCash !== undefined ||
        (r as any).dailyVisa !== undefined ||
        (r as any).dailyCl !== undefined ||
        (r as any).dailyTotal !== undefined
      ) {
        if (!datePaymentMap.has(dateKey)) {
          const dCash = Number((r as any).dailyCash) || 0;
          const dVisa = Number((r as any).dailyVisa) || 0;
          const dCl = Number((r as any).dailyCl) || 0;
          const dTot = Number((r as any).dailyTotal) || (dCash + dVisa + dCl);
          datePaymentMap.set(dateKey, {
            cash: dCash,
            visa: dVisa,
            cl: dCl,
            total: dTot,
            cashVisa: dCash + dVisa,
          });
        }
      }

      if (!dateMap.has(dateKey)) {
        dateMap.set(
          dateKey,
          new Map<string, { cash: number; visa: number; cl: number; rawTotal: number }>()
        );
      }

      const branchValues = dateMap.get(dateKey)!;
      const currentVal = branchValues.get(branchKey) || {
        cash: 0,
        visa: 0,
        cl: 0,
        rawTotal: 0,
      };
      branchValues.set(branchKey, {
        cash: currentVal.cash + cash,
        visa: currentVal.visa + visa,
        cl: currentVal.cl + cl,
        rawTotal: currentVal.rawTotal + rawTotal,
      });
    });

    // In Sector 2, ensure all 16 rides exist in colMap when 'all' or 'inactive' is selected
    if (sectorType === 2 && (effectiveRideStatusFilter === 'all' || effectiveRideStatusFilter === 'inactive')) {
      PAID_RIDES_SECTOR_ORDER.forEach((code) => {
        if (!colMap.has(code)) {
          colMap.set(code, PAID_RIDES_DISPLAY_NAMES[code] || `لعبة ${code}`);
        }
      });
    }

    let cols: MatrixColumn[] = Array.from(colMap.entries())
      .map(([branchCode, name]) => ({ branchCode, name }))
      .sort((a, b) => {
        if (sectorType === 4) {
          const idxA = CARAVAN_SECTOR_ORDER.indexOf(a.branchCode);
          const idxB = CARAVAN_SECTOR_ORDER.indexOf(b.branchCode);
          if (idxA !== -1 && idxB !== -1) return idxA - idxB;
          if (idxA !== -1) return -1;
          if (idxB !== -1) return 1;
        }
        if (sectorType === 3) {
          const idxA = VGAMES_SECTOR_ORDER.indexOf(a.branchCode);
          const idxB = VGAMES_SECTOR_ORDER.indexOf(b.branchCode);
          if (idxA !== -1 && idxB !== -1) return idxA - idxB;
          if (idxA !== -1) return -1;
          if (idxB !== -1) return 1;
        }
        if (sectorType === 2) {
          const idxA = PAID_RIDES_SECTOR_ORDER.indexOf(a.branchCode);
          const idxB = PAID_RIDES_SECTOR_ORDER.indexOf(b.branchCode);
          if (idxA !== -1 && idxB !== -1) return idxA - idxB;
          if (idxA !== -1) return -1;
          if (idxB !== -1) return 1;
        }
        const numA = Number(a.branchCode);
        const numB = Number(b.branchCode);
        if (!isNaN(numA) && !isNaN(numB)) {
          return numA - numB;
        }
        return a.branchCode.localeCompare(b.branchCode);
      });

    // Sector 2: Strictly whitelist the 16 Paid Rides ending at Laser zone ('14'), filtering by Active / Inactive / All
    if (sectorType === 2) {
      cols = cols.filter((c) => PAID_RIDES_SECTOR_ORDER.includes(c.branchCode));
      if (effectiveRideStatusFilter === 'active') {
        cols = cols.filter((c) => {
          const isInactiveListed = PAID_RIDES_INACTIVE_CODES.has(c.branchCode);
          const hasRev = (branchTotals.get(c.branchCode) || 0) > 0;
          return hasRev && !isInactiveListed;
        });
      } else if (effectiveRideStatusFilter === 'inactive') {
        cols = cols.filter((c) => {
          const isInactiveListed = PAID_RIDES_INACTIVE_CODES.has(c.branchCode);
          const hasRev = (branchTotals.get(c.branchCode) || 0) > 0;
          return isInactiveListed || !hasRev;
        });
      }
    }

    return {
      cols,
      dateMap,
      datePaymentMap,
      dateFbMap,
      rawDates: Array.from(dateMap.keys()),
    };
}, [rows, sectorType, effectiveRideStatusFilter]);

// Stage 2: Dynamic Metric Projection & Aggregate Totals (Instant O(Dates * Columns))
const { columns, matrixRows, columnTotals, grandTotal, grandCash, grandVisa, grandCoupons, grandCashVisa, grandFood, grandBeverage, grandOther, grandCost } = useMemo(() => {
  const { cols, dateMap, datePaymentMap, dateFbMap, rawDates } = aggregatedData;

  const dates = [...rawDates].sort((a, b) => {
    const cmp = a.localeCompare(b);
    return sortOrder === 'asc' ? cmp : -cmp;
  });

  const rawColTotals: Record<string, number> = {};
  cols.forEach((c) => {
    rawColTotals[c.branchCode] = 0;
  });

  let rawOverallTotal = 0;
  let rawOverallCash = 0;
  let rawOverallVisa = 0;
  let rawOverallCoupons = 0;
  let rawOverallFood = 0;
  let rawOverallBeverage = 0;
  let rawOverallOther = 0;
  let rawOverallCost = 0;

  const applyCalcMode = (val: number, mode: CalcMode) => {
    if (mode === 'net') return val / 1.14;
    if (mode === 'vat') return val - val / 1.14;
    return val;
  };

  const mRows = dates.map((date) => {
    const branchValues = dateMap.get(date);
    const values: Record<string, number> = {};
    let rawDailyTotal = 0;
    let rawDailyCash = 0;
    let rawDailyVisa = 0;
    let rawDailyCoupons = 0;

    cols.forEach((col) => {
      const item = branchValues?.get(col.branchCode) || {
        cash: 0,
        visa: 0,
        cl: 0,
        rawTotal: 0,
      };

      const itemCash = item.cash;
      const itemVisa = item.visa;
      const itemCl = item.cl;
      // Always calculate using All sources: baseTotal = cash + visa + cl
      const itemBaseTotal =
        Math.abs(itemCash + itemVisa + itemCl) > 0.0001
          ? itemCash + itemVisa + itemCl
          : item.rawTotal;

      const val = applyCalcMode(itemBaseTotal, calcMode);

      values[col.branchCode] = val;
      rawDailyTotal += itemBaseTotal;
      if (!datePaymentMap.has(date)) {
        rawDailyCash += itemCash;
        rawDailyVisa += itemVisa;
        rawDailyCoupons += itemCl;
      }

      rawColTotals[col.branchCode] = (rawColTotals[col.branchCode] || 0) + itemBaseTotal;
    });

    // Use POS_Post daily payment totals directly when available (Types 2 & 3 zero double-counting)
    if (datePaymentMap.has(date)) {
      const dPay = datePaymentMap.get(date)!;
      rawDailyCash = dPay.cash;
      rawDailyVisa = dPay.visa;
      rawDailyCoupons = dPay.cl;
    }

    // Apply calcMode to daily aggregate columns
    const rowTotal = applyCalcMode(rawDailyTotal, calcMode);
    const rowCash = applyCalcMode(rawDailyCash, calcMode);
    const rowVisa = applyCalcMode(rawDailyVisa, calcMode);
    const rowCoupons = applyCalcMode(rawDailyCoupons, calcMode);
    const rowCashVisa = rowCash + rowVisa;

    rawOverallTotal += rawDailyTotal;
    rawOverallCash += rawDailyCash;
    rawOverallVisa += rawDailyVisa;
    rawOverallCoupons += rawDailyCoupons;

    // F&B row calculations for sectorType === 1
    const fb = dateFbMap?.get(date) || { food: 0, beverage: 0, other: 0, cost: 0 };
    const rowFood = applyCalcMode(fb.food, calcMode);
    const rowBeverage = applyCalcMode(fb.beverage, calcMode);
    const rowOther = applyCalcMode(fb.other, calcMode);
    const rowCost = applyCalcMode(fb.cost, calcMode);

    rawOverallFood += fb.food;
    rawOverallBeverage += fb.beverage;
    rawOverallOther += fb.other;
    rawOverallCost += fb.cost;

    return {
      date,
      values,
      rowTotal,
      rowCash,
      rowVisa,
      rowCoupons,
      rowCashVisa,
      food: rowFood,
      beverage: rowBeverage,
      other: rowOther,
      cost: rowCost,
    };
  });

  // Compute Grand Totals directly from raw unrounded aggregates to eliminate drift
  const colTotalsAcc: Record<string, number> = {};
  cols.forEach((c) => {
    colTotalsAcc[c.branchCode] = applyCalcMode(rawColTotals[c.branchCode] || 0, calcMode);
  });

  const grandTotal = applyCalcMode(rawOverallTotal, calcMode);
  const grandCash = applyCalcMode(rawOverallCash, calcMode);
  const grandVisa = applyCalcMode(rawOverallVisa, calcMode);
  const grandCoupons = applyCalcMode(rawOverallCoupons, calcMode);
  const grandCashVisa = grandCash + grandVisa;

  return {
    columns: cols,
    matrixRows: mRows,
    columnTotals: colTotalsAcc,
    grandTotal,
    grandCash,
    grandVisa,
    grandCoupons,
    grandCashVisa,
    grandFood: applyCalcMode(rawOverallFood, calcMode),
    grandBeverage: applyCalcMode(rawOverallBeverage, calcMode),
    grandOther: applyCalcMode(rawOverallOther, calcMode),
    grandCost: applyCalcMode(rawOverallCost, calcMode),
  };
}, [aggregatedData, sortOrder, calcMode]);

  const totalRestaurantDays = restaurantData?.dayGroups.length || 0;
  const isRestaurantDayMode = isRestaurants && effectiveGranularity === 'day';

  // Client-Side Pagination Calculations
  const totalPages = Math.max(
    1,
    Math.ceil((isRestaurantDayMode ? totalRestaurantDays : matrixRows.length) / rowsPerPage)
  );

  const paginatedDayGroups = useMemo(() => {
    if (!restaurantData) return [];
    if (rowsPerPage >= 9999) return restaurantData.dayGroups;
    const startIdx = (currentPage - 1) * rowsPerPage;
    return restaurantData.dayGroups.slice(startIdx, startIdx + rowsPerPage);
  }, [restaurantData, currentPage, rowsPerPage]);

  // Guard against rendering 365 rows x 25+ cols into the DOM when switching to a large range
  useEffect(() => {
    if ((isRestaurantDayMode ? totalRestaurantDays : matrixRows.length) > 60 && rowsPerPage >= 9999) {
      setRowsPerPage(31);
      setCurrentPage(1);
    }
  }, [matrixRows.length, rowsPerPage, isRestaurantDayMode, totalRestaurantDays]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const paginatedRows = useMemo(() => {
    if (rowsPerPage >= 9999) return matrixRows;
    const startIdx = (currentPage - 1) * rowsPerPage;
    return matrixRows.slice(startIdx, startIdx + rowsPerPage);
  }, [matrixRows, currentPage, rowsPerPage]);

  const activeTotalRecords = isRestaurantDayMode ? totalRestaurantDays : matrixRows.length;

  const startRecord =
    activeTotalRecords === 0
      ? 0
      : (currentPage - 1) * (rowsPerPage >= 9999 ? activeTotalRecords : rowsPerPage) + 1;
  const endRecord =
    rowsPerPage >= 9999 ? activeTotalRecords : Math.min(currentPage * rowsPerPage, activeTotalRecords);

// Dynamic Title according to sector, facility sub-filter, and period
const dynamicTitle = useMemo(() => {
  if (title) return title;

  const rawStart = startDate || (matrixRows.length > 0 ? matrixRows[0].date : '');
  const rawEnd = endDate || (matrixRows.length > 0 ? matrixRows[matrixRows.length - 1].date : '');
  const startFmt = formatDateAr(rawStart);
  const endFmt = formatDateAr(rawEnd);

  const periodText =
    startFmt && endFmt
      ? (rawStart === rawEnd || startFmt === endFmt ? `يوم ${startFmt}` : `من فترة ${startFmt} إلى ${endFmt}`)
      : startFmt
        ? `يوم ${startFmt}`
        : '';

  const secType = sectorType ?? 4;
  let baseSubject = '';

  if (secType === 4) {
    if (facilityType === 'caravans') {
      baseSubject = 'مبيعات الكرفانات';
    } else if (facilityType === 'shops') {
      baseSubject = 'مبيعات المحلات';
    } else {
      baseSubject = 'مبيعات الكرفانات والمحلات';
    }
  } else {
    baseSubject = `مبيعات ${sectorLabel || 'القطاع'}`;
  }

  return periodText ? `${baseSubject} ${periodText}` : baseSubject;
}, [title, startDate, endDate, sectorType, sectorLabel, facilityType, matrixRows]);

/* -------------------------------------------------------------------------- */
/* Excel Export using ExcelJS with Precise Cell Formatting & Styling Range    */
/* -------------------------------------------------------------------------- */
const isPaidRides = sectorType === 2;
const isTwoRowHeader = (isPaidRides && effectiveRideStatusFilter === 'all') || isRestaurants;

const totalTableCols = useMemo(() => {
  if (isRestaurants) {
    return calcMode === 'vat' ? 5 : 8;
  }
  const outletsCount = columns.reduce(
    (acc, c) =>
      acc + (isTwoRowHeader && (c.branchCode === 'golden' || c.branchCode === '4') ? 5 : 1),
    0
  );
  return 1 + outletsCount + (calcMode === 'vat' ? 1 : 4);
}, [columns, isTwoRowHeader, calcMode, isRestaurants]);

const handleExportToExcel = async () => {
  try {
    setExporting(true);

    const ExcelJS = (await import('exceljs')).default;

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Dream Park ERP';
    workbook.created = new Date();

    const excelTheme = theme?.excel ?? {
      tabColor: 'FF2563EB',
      titleColor: 'FF1E3A8A',
      headerFill: 'FFE2E8F0',
      footerFill: 'FFDBEAFE',
      footerFont: 'FF1E3A8A',
    };
    const tabColor = excelTheme?.tabColor || 'FF2563EB';
    const titleColor = excelTheme?.titleColor || 'FF1E3A8A';
    const headerFill = excelTheme?.headerFill || 'FFE2E8F0';
    const footerFill = excelTheme?.footerFill || 'FFDBEAFE';
    const footerFont = excelTheme?.footerFont || 'FF1E3A8A';

    const calcCode =
      calcMode === 'net' ? 'Net' : calcMode === 'vat' ? 'VAT' : 'Total';

    // Build Arabic Entity Name
    const secType = sectorType ?? 4;
    let entityName = '';
    if (secType === 4) {
      if (facilityType === 'caravans') {
        entityName = 'الكرفانات';
      } else if (facilityType === 'shops') {
        entityName = 'المحلات';
      } else {
        entityName = 'الكرفانات والمحلات';
      }
    } else if (secType === 2) {
      const filterWord =
        effectiveRideStatusFilter === 'active'
          ? 'الألعاب النشطة'
          : effectiveRideStatusFilter === 'inactive'
            ? 'الألعاب غير النشطة'
            : 'جميع الألعاب';
      entityName = `${sectorLabel || 'الألعاب الكبرى'} - ${filterWord}`;
    } else {
      entityName = sectorLabel || 'القطاع';
    }

    // Build CalcMode Arabic Label
    let calcModeLabel = '';
    let modeWord = '';
    if (calcMode === 'net') {
      calcModeLabel = 'صافي المبيعات (قبل الضريبة)';
      modeWord = 'صافي';
    } else if (calcMode === 'vat') {
      calcModeLabel = 'ضريبة القيمة المضافة (14%)';
      modeWord = 'ضرائب';
    } else {
      calcModeLabel = 'إجمالي المبيعات (شامل الضريبة)';
      modeWord = 'إجمالي';
    }

    // Build Date / Period Label
    const rawStart = startDate || (matrixRows.length > 0 ? matrixRows[0].date : '');
    const rawEnd = endDate || (matrixRows.length > 0 ? matrixRows[matrixRows.length - 1].date : '');
    const startFmt = formatDateAr(rawStart);
    const endFmt = formatDateAr(rawEnd);

    let datePeriodLabel = '';
    let dateFilePart = '';
    if (startFmt && endFmt) {
      if (rawStart === rawEnd || startFmt === endFmt) {
        datePeriodLabel = `يوم ${startFmt}`;
        dateFilePart = startFmt.replace(/\//g, '-');
      } else {
        datePeriodLabel = `من ${startFmt} إلى ${endFmt}`;
        dateFilePart = `من_${startFmt.replace(/\//g, '-')}_إلى_${endFmt.replace(/\//g, '-')}`;
      }
    } else if (startFmt) {
      datePeriodLabel = `يوم ${startFmt}`;
      dateFilePart = startFmt.replace(/\//g, '-');
    } else {
      dateFilePart = new Date().toISOString().split('T')[0];
    }

    // Full Arabic Dynamic Title for Excel
    const excelTitle = datePeriodLabel
      ? `${calcModeLabel} - ${entityName} - ${datePeriodLabel}`
      : `${calcModeLabel} - ${entityName}`;

    // Clean Arabic Worksheet Name (Max 31 chars, no invalid Excel chars)
    const rawSheetName = `${modeWord} ${entityName}`.replace(/[\\/?*:[\]]/g, '').trim();
    const sheetName = rawSheetName.slice(0, 31) || 'المبيعات';

    // 1. Flip Excel Export Direction to Left-to-Right (LTR) with frozen header panes
    const worksheet = workbook.addWorksheet(sheetName, {
      views: [{ rightToLeft: false, state: 'frozen', ySplit: isTwoRowHeader ? 4 : 3 }],
    });
    worksheet.properties.tabColor = { argb: tabColor };

    // Standard border and styling objects
    const thinBorder = {
      top: { style: 'thin' as const, color: { argb: 'FF000000' } },
      bottom: { style: 'thin' as const, color: { argb: 'FF000000' } },
      left: { style: 'thin' as const, color: { argb: 'FF000000' } },
      right: { style: 'thin' as const, color: { argb: 'FF000000' } },
    };
    const doubleBottomBorder = {
      top: { style: 'thin' as const, color: { argb: 'FF000000' } },
      bottom: { style: 'double' as const, color: { argb: 'FF000000' } },
      left: { style: 'thin' as const, color: { argb: 'FF000000' } },
      right: { style: 'thin' as const, color: { argb: 'FF000000' } },
    };
    const headerFillPattern = {
      type: 'pattern' as const,
      pattern: 'solid' as const,
      fgColor: { argb: headerFill },
    };
    const centerMiddleAlign = {
      vertical: 'middle' as const,
      horizontal: 'center' as const,
      wrapText: true,
    };
    const headerFontNormal = {
      name: 'Times New Roman',
      size: 13,
      bold: true,
      color: { argb: 'FF0F172A' },
    };
    const headerFontSub = {
      name: 'Times New Roman',
      size: 11,
      bold: true,
      color: { argb: 'FF0F172A' },
    };
    const redHeaderFont = {
      name: 'Times New Roman',
      size: 13,
      bold: true,
      color: { argb: 'FFFF0000' },
    };

    function styleRange(
      ws: any,
      startRow: number,
      startCol: number,
      endRow: number,
      endCol: number,
      style: {
        font?: any;
        fill?: any;
        alignment?: any;
        border?: any;
        numFmt?: string;
      }
    ) {
      for (let r = startRow; r <= endRow; r++) {
        const rowObj = ws.getRow(r);
        for (let c = startCol; c <= endCol; c++) {
          const cell = rowObj.getCell(c);
          if (style.font) cell.font = style.font;
          if (style.fill) cell.fill = style.fill;
          if (style.alignment) cell.alignment = style.alignment;
          if (style.border) cell.border = style.border;
          if (style.numFmt) cell.numFmt = style.numFmt;
        }
      }
    }

    // 2. Setup Export Columns & Worksheet Data
    if (isRestaurants) {
      const isVat = calcMode === 'vat';
      const restCols = [
        { key: 'period', width: 16 },
        { key: 'branch', width: 26 },
        { key: 'food', width: 16 },
        { key: 'beverage', width: 16 },
        { key: 'other', width: 14 },
        { key: 'total', width: 18 },
        ...(isVat
          ? []
          : [
              { key: 'cash', width: 16 },
              { key: 'visa', width: 16 },
              { key: 'cl', width: 16 },
            ]),
      ];
      worksheet.columns = restCols;
      const totalRestColsCount = restCols.length;

      // Row 1 & Row 2 for Logo & Title
      const row1 = worksheet.addRow([]);
      row1.height = 28;
      const row2 = worksheet.addRow([]);
      row2.height = 24;

      // Place Dream Park Logo cleanly in top-left corner
      try {
        const logoRes = await fetch('/dreampark-logo.png');
        if (logoRes.ok) {
          const logoBuffer = await logoRes.arrayBuffer();
          const imageId = workbook.addImage({
            buffer: logoBuffer,
            extension: 'png',
          });
          worksheet.addImage(imageId, {
            tl: { col: 0, row: 0 },
            ext: { width: 110, height: 48 },
          });
        }
      } catch (logoErr) {
        console.warn('Could not load logo for Excel export:', logoErr);
      }

      // Title Cell across visible columns
      worksheet.mergeCells(1, 3, 2, totalRestColsCount);
      const titleCell = worksheet.getCell(1, 3);
      titleCell.value = excelTitle;
      titleCell.font = { name: 'Times New Roman', size: 15, bold: true, color: { argb: 'FF4C0519' } };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

      // Row 3 & 4: Two-Level Grouped Header with Muted Deep Rose (#881337)
      const row3 = worksheet.getRow(3);
      row3.height = 28;
      const row4 = worksheet.getRow(4);
      row4.height = 26;

      const restHeaderFill = {
        type: 'pattern' as const,
        pattern: 'solid' as const,
        fgColor: { argb: 'FF881337' },
      };
      const restHeaderFontNormal = {
        name: 'Times New Roman',
        size: 13,
        bold: true,
        color: { argb: 'FFFFFFFF' },
      };
      const restHeaderFontSub = {
        name: 'Times New Roman',
        size: 11,
        bold: true,
        color: { argb: 'FFFFFFFF' },
      };

      // Col 1: Date/Period/Code vertically merged across Row 3 and Row 4
      worksheet.mergeCells(3, 1, 4, 1);
      const col1Label =
        effectiveGranularity === 'summary' ? 'Code' : effectiveGranularity === 'month' ? 'Month' : 'Date';
      worksheet.getCell(3, 1).value = col1Label;
      styleRange(worksheet, 3, 1, 4, 1, {
        font: restHeaderFontNormal,
        fill: restHeaderFill,
        alignment: centerMiddleAlign,
        border: thinBorder,
      });

      // Col 2: Restaurant Branch vertically merged
      worksheet.mergeCells(3, 2, 4, 2);
      worksheet.getCell(3, 2).value = 'Restaurant Branch';
      styleRange(worksheet, 3, 2, 4, 2, {
        font: restHeaderFontNormal,
        fill: restHeaderFill,
        alignment: centerMiddleAlign,
        border: thinBorder,
      });

      // Cols 3-6: Sales Breakdown
      worksheet.mergeCells(3, 3, 3, 6);
      worksheet.getCell(3, 3).value = 'Sales Breakdown';
      styleRange(worksheet, 3, 3, 3, 6, {
        font: restHeaderFontNormal,
        fill: restHeaderFill,
        alignment: centerMiddleAlign,
        border: thinBorder,
      });

      const subHeaders = ['Food', 'Beverage', 'Other', 'TOTAL'];
      subHeaders.forEach((sub, sIdx) => {
        const cIdx = 3 + sIdx;
        worksheet.getCell(4, cIdx).value = sub;
        styleRange(worksheet, 4, cIdx, 4, cIdx, {
          font: restHeaderFontSub,
          fill: restHeaderFill,
          alignment: centerMiddleAlign,
          border: thinBorder,
        });
      });

      // Cols 7-9: Payment Breakdown (if not vat)
      if (!isVat) {
        worksheet.mergeCells(3, 7, 3, 9);
        worksheet.getCell(3, 7).value = 'Payment Breakdown';
        styleRange(worksheet, 3, 7, 3, 9, {
          font: restHeaderFontNormal,
          fill: restHeaderFill,
          alignment: centerMiddleAlign,
          border: thinBorder,
        });

        const paySubs = ['Cash', 'Visa', 'C.L'];
        paySubs.forEach((sub, sIdx) => {
          const cIdx = 7 + sIdx;
          worksheet.getCell(4, cIdx).value = sub;
          styleRange(worksheet, 4, cIdx, 4, cIdx, {
            font: restHeaderFontSub,
            fill: restHeaderFill,
            alignment: centerMiddleAlign,
            border: thinBorder,
          });
        });
      }

      // Populate Branch-by-Branch Data Rows
      const restDataRows: (string | number)[][] = [];
      if (effectiveGranularity === 'summary') {
        (restaurantData?.summaryBranches || []).forEach((b) => {
          const rowVals = [b.branchCode, b.displayName, b.food, b.beverage, b.other, b.total];
          if (!isVat) rowVals.push(b.cash, b.visa, b.cl);
          restDataRows.push(rowVals);
        });
      } else if (effectiveGranularity === 'month') {
        (restaurantData?.monthGroups || []).forEach((m) => {
          m.branches.forEach((b) => {
            const rowVals = [m.monthLabel, b.displayName, b.food, b.beverage, b.other, b.total];
            if (!isVat) rowVals.push(b.cash, b.visa, b.cl);
            restDataRows.push(rowVals);
          });
        });
      } else {
        (restaurantData?.dayGroups || []).forEach((d) => {
          d.branches.forEach((b) => {
            const rowVals = [d.date, b.displayName, b.food, b.beverage, b.other, b.total];
            if (!isVat) rowVals.push(b.cash, b.visa, b.cl);
            restDataRows.push(rowVals);
          });
        });
      }

      restDataRows.forEach((rVals) => {
        const row = worksheet.addRow(rVals);
        row.height = 24;

        const c1 = row.getCell(1);
        c1.alignment = { vertical: 'middle', horizontal: 'center' };
        c1.font = { name: 'Times New Roman', size: 11, bold: true, color: { argb: 'FF0F172A' } };
        c1.border = thinBorder;

        const c2 = row.getCell(2);
        c2.alignment = { vertical: 'middle', horizontal: 'left' };
        c2.font = { name: 'Times New Roman', size: 11, bold: true, color: { argb: 'FF0F172A' } };
        c2.border = thinBorder;

        for (let c = 3; c <= totalRestColsCount; c++) {
          const cell = row.getCell(c);
          cell.numFmt = '#,##0.00';
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
          cell.font = { name: 'Times New Roman', size: 11, bold: c === 6, color: { argb: 'FF0F172A' } };
          cell.border = thinBorder;
          if (c === 6) {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFF1F5F9' },
            };
          }
        }
      });

      // Grand Total Row with Dark Burgundy (#4c0519) fill and White Bold Font
      const footerRowVals: (string | number)[] = [
        'TOTAL',
        'ALL BRANCHES',
        grandFood,
        grandBeverage,
        grandOther,
        grandTotal,
      ];
      if (!isVat) footerRowVals.push(grandCash, grandVisa, grandCoupons);
      const totalRow = worksheet.addRow(footerRowVals);
      totalRow.height = 32;

      const restFooterFill = {
        type: 'pattern' as const,
        pattern: 'solid' as const,
        fgColor: { argb: 'FF4C0519' },
      };
      const restFooterFont = {
        name: 'Times New Roman',
        size: 13,
        bold: true,
        color: { argb: 'FFFFFFFF' },
      };

      for (let c = 1; c <= totalRestColsCount; c++) {
        const cell = totalRow.getCell(c);
        cell.font = restFooterFont;
        cell.fill = restFooterFill;
        cell.border = doubleBottomBorder;
        if (c >= 3) {
          cell.numFmt = '#,##0.00';
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
        } else {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        }
      }

      // Blank Row & Signature
      const blankRow = worksheet.addRow([]);
      blankRow.height = 18;
      const signatureRow = worksheet.addRow(['INCOME AUDITOR']);
      signatureRow.height = 24;
      const sigCell = signatureRow.getCell(1);
      sigCell.font = { name: 'Times New Roman', size: 11, bold: true, color: { argb: 'FF0F172A' } };
      sigCell.alignment = { vertical: 'middle', horizontal: 'center' };
    } else {
      // 2. Setup Export Columns flowing from Left to Right (Date -> Rides -> Summary)
      interface ExportColDef {
        key: string;
        header: string;
        parentHeader?: string;
        width: number;
        isShop?: boolean;
        getValue: (row: MatrixRowData) => number;
        getTotal: () => number;
      }

      const exportColumns: ExportColDef[] = [];

      columns.forEach((col) => {
        if (isTwoRowHeader && col.branchCode === 'golden') {
          exportColumns.push(
            { key: 'golden_sgolden', header: 'S.Golden', parentHeader: 'Golden', width: 14, getValue: (r) => r.values['golden_sgolden'] || 0, getTotal: () => columnTotals['golden_sgolden'] || 0 },
            { key: 'golden_platinum', header: 'Platinum', parentHeader: 'Golden', width: 14, getValue: (r) => r.values['golden_platinum'] || 0, getTotal: () => columnTotals['golden_platinum'] || 0 },
            { key: 'golden_diamond', header: 'Diamond', parentHeader: 'Golden', width: 14, getValue: (r) => r.values['golden_diamond'] || 0, getTotal: () => columnTotals['golden_diamond'] || 0 },
            { key: 'golden_vip', header: 'VIP', parentHeader: 'Golden', width: 14, getValue: (r) => r.values['golden_vip'] || 0, getTotal: () => columnTotals['golden_vip'] || 0 },
            { key: 'golden_total', header: 'Total', parentHeader: 'Golden', width: 16, getValue: (r) => r.values['golden'] || 0, getTotal: () => columnTotals['golden'] || 0 }
          );
        } else if (isTwoRowHeader && col.branchCode === '4') {
          exportColumns.push(
            { key: '4_cash', header: 'Cash', parentHeader: '7 D', width: 14, getValue: (r) => r.values['4_cash'] || 0, getTotal: () => columnTotals['4_cash'] || 0 },
            { key: '4_platinum', header: 'Platinum', parentHeader: '7 D', width: 14, getValue: (r) => r.values['4_platinum'] || 0, getTotal: () => columnTotals['4_platinum'] || 0 },
            { key: '4_diamond', header: 'Diamond', parentHeader: '7 D', width: 14, getValue: (r) => r.values['4_diamond'] || 0, getTotal: () => columnTotals['4_diamond'] || 0 },
            { key: '4_visa', header: 'Visa', parentHeader: '7 D', width: 14, getValue: (r) => r.values['4_visa'] || 0, getTotal: () => columnTotals['4_visa'] || 0 },
            { key: '4_total', header: 'Total', parentHeader: '7 D', width: 16, getValue: (r) => r.values['4'] || 0, getTotal: () => columnTotals['4'] || 0 }
          );
        } else {
          const headerName =
            sectorType === 3
              ? (VGAMES_DISPLAY_NAMES[col.branchCode] || col.name)
              : sectorType === 2
                  ? (PAID_RIDES_DISPLAY_NAMES[col.branchCode] || col.name)
                  : (CARAVAN_DISPLAY_NAMES[col.branchCode] || col.name);

          exportColumns.push({
            key: `col_${col.branchCode}`,
            header: headerName,
            width: 18,
            isShop: sectorType === 4 && SHOP_BRANCH_CODES_SET.has(col.branchCode),
            getValue: (r) => r.values[col.branchCode] || 0,
            getTotal: () => columnTotals[col.branchCode] || 0,
          });
        }
      });

      // Summary columns on the right (matching English Copy of RETAL.xls layout)
      exportColumns.push({
        key: 'row_total',
        header: 'TOTAL REV',
        width: 20,
        getValue: (r) => r.rowTotal,
        getTotal: () => grandTotal,
      });

      if (calcMode !== 'vat') {
        exportColumns.push(
          {
            key: 'cash',
            header: 'CASH',
            width: 16,
            getValue: (r) => r.rowCash,
            getTotal: () => grandCash,
          },
          {
            key: 'visa',
            header: 'VISA',
            width: 16,
            getValue: (r) => r.rowVisa,
            getTotal: () => grandVisa,
          },
          {
            key: 'coupons',
            header: 'COPON / C.L',
            width: 18,
            getValue: (r) => r.rowCoupons,
            getTotal: () => grandCoupons,
          }
        );
      }

      worksheet.columns = [
        { key: 'date', width: 16 },
        ...exportColumns.map((c) => ({ key: c.key, width: c.width })),
      ];
      const totalColumnsCount = 1 + exportColumns.length;

      // Row 1 (height 28) and Row 2 (height 24) header area for Logo and Centered Title
      const row1 = worksheet.addRow([]);
      row1.height = 28;
      const row2 = worksheet.addRow([]);
      row2.height = 24;

      // Place Dream Park Logo cleanly in top-left corner (Columns A-B, Rows 1-2 in LTR)
      try {
        const logoRes = await fetch('/dreampark-logo.png');
        if (logoRes.ok) {
          const logoBuffer = await logoRes.arrayBuffer();
          const imageId = workbook.addImage({
            buffer: logoBuffer,
            extension: 'png',
          });
          worksheet.addImage(imageId, {
            tl: { col: 0, row: 0 },
            ext: { width: 110, height: 48 },
          });
        }
      } catch (logoErr) {
        console.warn('Could not load logo for Excel export:', logoErr);
      }

      // Merge Title strictly across visible columns next to logo: Col C (col 3) to Math.min(lastColIndex, 12)
      if (totalColumnsCount >= 3) {
        const titleEndCol = Math.min(totalColumnsCount, 12);
        worksheet.mergeCells(1, 3, 2, titleEndCol);
        const titleCell = worksheet.getCell(1, 3);
        titleCell.value = excelTitle;
        titleCell.font = { name: 'Times New Roman', size: 15, bold: true, color: { argb: titleColor } };
        titleCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      } else {
        worksheet.mergeCells(1, 1, 2, totalColumnsCount);
        const titleCell = worksheet.getCell(1, 1);
        titleCell.value = excelTitle;
        titleCell.font = { name: 'Times New Roman', size: 15, bold: true, color: { argb: titleColor } };
        titleCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      }

      // 3. Render Table Headers (2-row grouped for Sector 2 All, or clean 1-row header)
      if (isTwoRowHeader) {
        const row3 = worksheet.getRow(3);
        row3.height = 28;
        const row4 = worksheet.getRow(4);
        row4.height = 26;

        // Column 1: Date vertically merged across Row 3 and Row 4
        worksheet.mergeCells(3, 1, 4, 1);
        worksheet.getCell(3, 1).value = 'Date';
        styleRange(worksheet, 3, 1, 4, 1, {
          font: headerFontNormal,
          fill: headerFillPattern,
          alignment: centerMiddleAlign,
          border: thinBorder,
        });

        let currentXCol = 2;
        let idx = 0;
        while (idx < exportColumns.length) {
          const colDef = exportColumns[idx];
          if (colDef.parentHeader) {
            const parentName = colDef.parentHeader;
            let count = 0;
            while (
              idx + count < exportColumns.length &&
              exportColumns[idx + count].parentHeader === parentName
            ) {
              count++;
            }
            const startCol = currentXCol;
            const endCol = currentXCol + count - 1;

            // Merge parent in row 3
            worksheet.mergeCells(3, startCol, 3, endCol);
            worksheet.getCell(3, startCol).value = parentName;
            styleRange(worksheet, 3, startCol, 3, endCol, {
              font: headerFontNormal,
              fill: headerFillPattern,
              alignment: centerMiddleAlign,
              border: thinBorder,
            });

            // Sub headers in row 4
            for (let s = 0; s < count; s++) {
              const targetCol = startCol + s;
              const subDef = exportColumns[idx + s];
              worksheet.getCell(4, targetCol).value = subDef.header;
              styleRange(worksheet, 4, targetCol, 4, targetCol, {
                font: headerFontSub,
                fill: headerFillPattern,
                alignment: centerMiddleAlign,
                border: thinBorder,
              });
            }

            currentXCol += count;
            idx += count;
          } else {
            // Single ride column vertically merged across row 3 and row 4
            worksheet.mergeCells(3, currentXCol, 4, currentXCol);
            worksheet.getCell(3, currentXCol).value = colDef.header;
            styleRange(worksheet, 3, currentXCol, 4, currentXCol, {
              font: colDef.isShop ? redHeaderFont : headerFontNormal,
              fill: headerFillPattern,
              alignment: centerMiddleAlign,
              border: thinBorder,
            });

            currentXCol++;
            idx++;
          }
        }
      } else {
        // 1-Row Clean Header (when Filter is Active/Inactive or other sectors)
        const headerRow = worksheet.getRow(3);
        headerRow.height = 53.25;

        worksheet.getCell(3, 1).value = 'Date';
        styleRange(worksheet, 3, 1, 3, 1, {
          font: headerFontNormal,
          fill: headerFillPattern,
          alignment: centerMiddleAlign,
          border: thinBorder,
        });

        for (let i = 0; i < exportColumns.length; i++) {
          const colDef = exportColumns[i];
          const targetCol = 2 + i;
          worksheet.getCell(3, targetCol).value = colDef.header;
          styleRange(worksheet, 3, targetCol, 3, targetCol, {
            font: colDef.isShop ? redHeaderFont : headerFontNormal,
            fill: headerFillPattern,
            alignment: centerMiddleAlign,
            border: thinBorder,
          });
        }
      }

      // 4. Populate Data Rows (Height: 26.1, Times New Roman, Size: 12, Bold, #0F172A, numFmt: '#,##0.00')
      matrixRows.forEach((item) => {
        const rowData: (string | number)[] = [item.date];
        for (const colDef of exportColumns) {
          rowData.push(colDef.getValue(item));
        }

        const row = worksheet.addRow(rowData);
        row.height = 26.1;

        // Date Cell
        const dateCell = row.getCell(1);
        dateCell.alignment = { vertical: 'middle', horizontal: 'center' };
        dateCell.font = { name: 'Times New Roman', size: 12, bold: true, color: { argb: 'FF0F172A' } };
        dateCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF8FAFC' },
        };
        dateCell.border = thinBorder;

        // Numeric Cells
        for (let colIdx = 2; colIdx <= totalColumnsCount; colIdx++) {
          const cell = row.getCell(colIdx);
          cell.numFmt = '#,##0.00';
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
          cell.font = { name: 'Times New Roman', size: 12, bold: true, color: { argb: 'FF0F172A' } };
          cell.border = thinBorder;

          const colDef = exportColumns[colIdx - 2];
          if (colDef?.key === 'row_total') {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFF1F5F9' },
            };
          }
        }
      });

      // 5. Grand Total Row (Height: 33.95, Times New Roman, Size: 14, Bold, #1E3A8A, fill #DBEAFE, bottom double border)
      const footerData: (string | number)[] = ['TOTAL'];
      for (const colDef of exportColumns) {
        footerData.push(colDef.getTotal());
      }

      const totalRow = worksheet.addRow(footerData);
      totalRow.height = 33.95;

      const footerDateCell = totalRow.getCell(1);
      footerDateCell.alignment = { vertical: 'middle', horizontal: 'center' };
      footerDateCell.font = { name: 'Times New Roman', size: 14, bold: true, color: { argb: footerFont } };
      footerDateCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: footerFill },
      };
      footerDateCell.border = doubleBottomBorder;

      for (let colIdx = 2; colIdx <= totalColumnsCount; colIdx++) {
        const cell = totalRow.getCell(colIdx);
        cell.numFmt = '#,##0.00';
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
        cell.font = { name: 'Times New Roman', size: 14, bold: true, color: { argb: footerFont } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: footerFill },
        };
        cell.border = doubleBottomBorder;
      }

      // Blank Row after Grand Total
      const blankRow = worksheet.addRow([]);
      blankRow.height = 18;

      // Signature Row: INCOME AUDITOR in Col A (Times New Roman, size 11, bold)
      const signatureRow = worksheet.addRow(['INCOME AUDITOR']);
      signatureRow.height = 24;
      const sigCell = signatureRow.getCell(1);
      sigCell.font = { name: 'Times New Roman', size: 11, bold: true, color: { argb: 'FF0F172A' } };
      sigCell.alignment = { vertical: 'middle', horizontal: 'center' };
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const safeEntityName = (entityName || 'تقرير').replace(/\s+/g, '_').replace(/[/\\:*?"<>|]/g, '');
    const safeDatePart = (dateFilePart || 'بيانات').replace(/[/\\:*?"<>|]/g, '-');
    const fileName = `${modeWord || 'مصفوفة'}_${safeEntityName}_${safeDatePart}.xlsx`;

    let downloaded = false;
    try {
      const fileSaverMod = await import('file-saver');
      const saveAsFn =
        (fileSaverMod as any).saveAs ||
        (fileSaverMod as any).default?.saveAs ||
        (fileSaverMod as any).default;

      if (typeof saveAsFn === 'function') {
        saveAsFn(blob, fileName);
        downloaded = true;
      }
    } catch (saveErr) {
      console.warn('file-saver dynamic import error, using native fallback:', saveErr);
    }

    if (!downloaded && typeof window !== 'undefined') {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 200);
    }
  } catch (err) {
    console.error('Error exporting Matrix to Excel:', err);
  } finally {
    setExporting(false);
  }
};

/* -------------------------------------------------------------------------- */
/* UI Table Rendering (High Contrast Enterprise Glass & Steel Style)           */
/* -------------------------------------------------------------------------- */
return (
  <div className={`rounded-xl border border-slate-200/90 bg-white p-5 shadow-sm ring-1 ring-slate-900/5 backdrop-blur-md dark:border-zinc-800/90 dark:bg-zinc-900/70 dark:ring-white/10 space-y-4 ${theme.matrix.topBorder}`}>
    {/* --------------------------------------------------------------------- */}
    {/* Matrix Header & Calculation Mode Toggle                               */}
    {/* --------------------------------------------------------------------- */}
    <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 dark:border-zinc-800/80">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${theme.iconBox}`}>
              <Grid3X3 className="h-5 w-5" />
            </div>
            <h3 className="text-base lg:text-lg font-black text-slate-900 dark:text-white tracking-tight">
              {dynamicTitle}
            </h3>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
            لوحة التدقيق المالي المباشر: اختر نوع الاحتساب لمطابقة الدفاتر الحسابية لحظياً
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {isRestaurants && effectiveGranularity === 'month' && (
            <button
              type="button"
              onClick={() => handleToggleAllMonths(!allMonthsExpanded)}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200/90 bg-white px-3 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <ChevronsUpDown className="h-3.5 w-3.5" />
              <span>{allMonthsExpanded ? 'طي كل الشهور' : 'توسيع كل الشهور'}</span>
            </button>
          )}

          {isRestaurants && effectiveGranularity === 'day' && (
            <button
              type="button"
              onClick={handleToggleAllDays}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200/90 bg-white px-3 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <Store className="h-3.5 w-3.5" />
              <span>{allDaysExpanded ? 'إخفاء تفصيل الفروع' : 'عرض تفصيل الفروع'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200/90 bg-white px-3 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <ArrowUpDown className="h-3.5 w-3.5" />
            <span>ترتيب: {sortOrder === 'asc' ? 'تصاعدي' : 'تنازلي'}</span>
          </button>

          <button
            type="button"
            onClick={handleExportToExcel}
            disabled={exporting || loading || matrixRows.length === 0}
            className={`inline-flex h-9 items-center gap-2 rounded-lg ${theme.btnPrimary} px-3.5 text-xs font-semibold text-white shadow-2xs transition active:scale-95 disabled:opacity-50`}
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="h-4 w-4" />
            )}
            <span>تصدير المصفوفة (Excel)</span>
          </button>
        </div>
      </div>

      {/* Calculation Mode Toggle: 3-way Segmented Control */}
      <div className="flex flex-wrap items-center gap-2.5 pt-1">
        <span className="text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
          <Receipt className={`h-4 w-4 ${theme.accentText}`} />
          <span>معادلة الاحتساب:</span>
        </span>
        <div className="inline-flex bg-slate-200/60 dark:bg-zinc-800/80 p-1 rounded-xl shadow-inner">
          <button
            type="button"
            onClick={() => setCalcMode('total')}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${calcMode === 'total'
                ? `${theme.btnActive} shadow-sm`
                : 'text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
          >
            الإجمالي الشامل (Total Gross)
          </button>
          <button
            type="button"
            onClick={() => setCalcMode('net')}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${calcMode === 'net'
                ? `${theme.btnActive} shadow-sm`
                : 'text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
          >
            الصافي (Net Sales)
          </button>
          <button
            type="button"
            onClick={() => setCalcMode('vat')}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${calcMode === 'vat'
                ? `${theme.btnActive} shadow-sm`
                : 'text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
          >
            الضريبة (VAT 14%)
          </button>
        </div>
      </div>

      {/* Paid Rides (Sector 2) All / Active / Inactive Segmented Control */}
      {sectorType === 2 && (
        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          <span className="text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-full ${effectiveRideStatusFilter === 'all' ? 'bg-blue-500' : effectiveRideStatusFilter === 'active' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            <span>نطاق الألعاب:</span>
          </span>
          <div className="inline-flex bg-slate-200/60 dark:bg-zinc-800/80 p-1 rounded-xl shadow-inner">
            <button
              type="button"
              onClick={() => handleRideStatusFilterChange('all')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${effectiveRideStatusFilter === 'all'
                  ? `${theme.btnActive} shadow-sm`
                  : 'text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
            >
              الكل (All — 16 لعبة)
            </button>
            <button
              type="button"
              onClick={() => handleRideStatusFilterChange('active')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${effectiveRideStatusFilter === 'active'
                  ? `${theme.btnActive} shadow-sm`
                  : 'text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
            >
              النشطة (Active)
            </button>
            <button
              type="button"
              onClick={() => handleRideStatusFilterChange('inactive')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${effectiveRideStatusFilter === 'inactive'
                  ? `${theme.btnActive} shadow-sm`
                  : 'text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
            >
              غير النشطة (Inactive)
            </button>
          </div>
        </div>
      )}

      {/* Caravans & Shops (Sector 4) All / Caravans / Shops Segmented Control (Same Position & Style as Sector 2) */}
      {sectorType === 4 && onFacilityTypeChange && (
        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          <span className="text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-full ${facilityType === 'all' ? 'bg-blue-500' : facilityType === 'caravans' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            <span>نطاق المنافذ:</span>
          </span>
          <div className="inline-flex bg-slate-200/60 dark:bg-zinc-800/80 p-1 rounded-xl shadow-inner">
            <button
              type="button"
              onClick={() => onFacilityTypeChange('all')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${facilityType === 'all'
                  ? `${theme.btnActive} shadow-sm`
                  : 'text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
            >
              الكل
            </button>
            <button
              type="button"
              onClick={() => onFacilityTypeChange('caravans')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${facilityType === 'caravans'
                  ? `${theme.btnActive} shadow-sm`
                  : 'text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
            >
              الكرفانات
            </button>
            <button
              type="button"
              onClick={() => onFacilityTypeChange('shops')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${facilityType === 'shops'
                  ? `${theme.btnActive} shadow-sm`
                  : 'text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
            >
              المحلات
            </button>
          </div>
        </div>
      )}
    </div>

    {/* F&B Mix Summary Strip (Rendered EXCLUSIVELY for Restaurants Type = 1) */}
    {isRestaurants && (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* Food Card */}
        <div className="flex items-center gap-3.5 p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs border-t-2 border-t-[#881337] dark:bg-zinc-900 dark:border-zinc-800">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-[#881337] dark:bg-rose-950/40 dark:text-rose-300">
            <Utensils className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs font-bold text-slate-600 dark:text-zinc-400">مأكولات (Food)</span>
              <span className="rounded-full bg-rose-50 border border-rose-200/70 px-2 py-0.5 text-[11px] font-black text-[#881337] dark:bg-rose-950/60 dark:text-rose-300">
                {grandTotal > 0 ? ((grandFood / grandTotal) * 100).toFixed(1) : '0.0'}%
              </span>
            </div>
            <div className="mt-1 text-base sm:text-lg font-black text-slate-900 dark:text-white tabular-nums font-mono" dir="ltr">
              {MONEY_FORMATTER.format(grandFood)}
            </div>
          </div>
        </div>

        {/* Beverage Card */}
        <div className="flex items-center gap-3.5 p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs border-t-2 border-t-[#881337] dark:bg-zinc-900 dark:border-zinc-800">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-[#881337] dark:bg-rose-950/40 dark:text-rose-300">
            <Coffee className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs font-bold text-slate-600 dark:text-zinc-400">مشروبات (Beverage)</span>
              <span className="rounded-full bg-rose-50 border border-rose-200/70 px-2 py-0.5 text-[11px] font-black text-[#881337] dark:bg-rose-950/60 dark:text-rose-300">
                {grandTotal > 0 ? ((grandBeverage / grandTotal) * 100).toFixed(1) : '0.0'}%
              </span>
            </div>
            <div className="mt-1 text-base sm:text-lg font-black text-slate-900 dark:text-white tabular-nums font-mono" dir="ltr">
              {MONEY_FORMATTER.format(grandBeverage)}
            </div>
          </div>
        </div>

        {/* Other Card */}
        <div className="flex items-center gap-3.5 p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs border-t-2 border-t-[#881337] dark:bg-zinc-900 dark:border-zinc-800">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-[#881337] dark:bg-rose-950/40 dark:text-rose-300">
            <ShoppingBag className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs font-bold text-slate-600 dark:text-zinc-400">أخرى (Other)</span>
              <span className="rounded-full bg-rose-50 border border-rose-200/70 px-2 py-0.5 text-[11px] font-black text-[#881337] dark:bg-rose-950/60 dark:text-rose-300">
                {grandTotal > 0 ? ((grandOther / grandTotal) * 100).toFixed(1) : '0.0'}%
              </span>
            </div>
            <div className="mt-1 text-base sm:text-lg font-black text-slate-900 dark:text-white tabular-nums font-mono" dir="ltr">
              {MONEY_FORMATTER.format(grandOther)}
            </div>
          </div>
        </div>

        {/* Total Sales Card */}
        <div className="flex items-center gap-3.5 p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs border-t-2 border-t-[#881337] dark:bg-zinc-900 dark:border-zinc-800">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#881337] text-white">
            <Receipt className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs font-bold text-slate-600 dark:text-zinc-400">إجمالي المبيعات</span>
              <span className="rounded-full bg-rose-50 border border-rose-200/70 px-2 py-0.5 text-[11px] font-black text-[#881337] dark:bg-rose-950/60 dark:text-rose-300">
                100%
              </span>
            </div>
            <div className="mt-1 text-base sm:text-lg font-black text-[#881337] dark:text-rose-400 tabular-nums font-mono" dir="ltr">
              {MONEY_FORMATTER.format(grandTotal)}
            </div>
          </div>
        </div>
      </div>
    )}

    {/* --------------------------------------------------------------------- */}
    {/* High-Readability Table with Crosshair Hover & Sticky Footer            */}
    {/* --------------------------------------------------------------------- */}
    <div className="relative overflow-x-auto rounded-lg border border-slate-300 dark:border-zinc-800 max-h-[700px] shadow-2xs">
      <table className="w-full text-right text-sm border-collapse" dir="rtl">
        {/* Header Row(s) */}
        <thead>
          {isRestaurants ? (
            <>
              {/* Row 1: Grouped Parent Headers */}
              <tr className="bg-[#881337] text-white border-b border-[#70102e] sticky top-0 z-20 shadow-xs">
                <th
                  rowSpan={2}
                  className="sticky right-0 z-30 px-4 py-4 font-black text-center border-l border-[#70102e] min-w-[170px] bg-[#881337] text-white"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Store className="h-4 w-4 text-white/80" />
                    <span className="font-bold text-sm text-white">
                      {effectiveGranularity === 'summary'
                        ? 'الفرع / المطعم'
                        : effectiveGranularity === 'month'
                          ? 'الشهر / الفرع'
                          : 'التاريخ / الفرع'}
                    </span>
                  </div>
                </th>
                <th
                  colSpan={4}
                  className="px-3 py-2.5 text-center border-l border-[#70102e] font-black text-sm tracking-wide bg-[#881337] text-white"
                >
                  مبيعات الأغذية والمشروبات (F&amp;B Sales Breakdown)
                </th>
                {calcMode !== 'vat' && (
                  <th
                    colSpan={3}
                    className="px-3 py-2.5 text-center font-black text-sm tracking-wide bg-[#881337] text-white"
                  >
                    طرق التحصيل والسداد (Payment Breakdown)
                  </th>
                )}
              </tr>
              {/* Row 2: Sub-headers */}
              <tr className="bg-[#70102e] text-white border-b border-[#580c24] sticky top-[48px] z-20 shadow-xs text-xs font-bold">
                <th className="px-4 py-2.5 text-center border-l border-[#580c24] min-w-[130px]">مأكولات (Food)</th>
                <th className="px-4 py-2.5 text-center border-l border-[#580c24] min-w-[130px]">مشروبات (Beverage)</th>
                <th className="px-4 py-2.5 text-center border-l border-[#580c24] min-w-[120px]">أخرى (Other)</th>
                <th className="px-4 py-2.5 text-left border-l border-[#580c24] min-w-[150px] font-black text-sm">TOTAL REV</th>
                {calcMode !== 'vat' && (
                  <>
                    <th className="px-4 py-2.5 text-left border-l border-[#580c24] min-w-[130px]">CASH</th>
                    <th className="px-4 py-2.5 text-left border-l border-[#580c24] min-w-[130px]">VISA</th>
                    <th className="px-4 py-2.5 text-left min-w-[140px]">COPON / C.L</th>
                  </>
                )}
              </tr>
            </>
          ) : (
            <>
              <tr className={`border-b ${sectorType === 3
                  ? 'bg-violet-950 text-white border-violet-800/60'
                  : `border-slate-300 text-slate-800 dark:border-zinc-700 dark:text-zinc-200 ${theme.matrix.headerBg}`
                } sticky top-0 z-20 shadow-xs`}>
                <th
                  rowSpan={isTwoRowHeader ? 2 : 1}
                  className={`sticky right-0 z-30 px-4 py-4 font-black text-center border-l min-w-[140px] ${sectorType === 3
                    ? 'bg-violet-950 text-white border-violet-800/60'
                    : `border-slate-300 ${theme.matrix.headerBg}`
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Calendar className={`h-4 w-4 ${sectorType === 3 ? 'text-violet-200' : 'text-slate-600 dark:text-zinc-300'}`} />
                    <span className={`font-bold text-sm ${sectorType === 3 ? 'text-white' : 'text-slate-900 dark:text-white'}`}>التاريخ</span>
                  </div>
                </th>
                {columns.map((col) => {
                  const isShop = sectorType === 4 && SHOP_BRANCH_CODES_SET.has(col.branchCode);
                  const isGame = sectorType === 2 || sectorType === 3;
                  if (isTwoRowHeader && (col.branchCode === 'golden' || col.branchCode === '4')) {
                    const titleText = col.branchCode === 'golden' ? 'Golden' : '7 D';
                    return (
                      <th
                        key={col.branchCode}
                        colSpan={5}
                        className={`px-3 py-2 text-center border-l font-black text-sm tracking-wide border-slate-300 dark:border-zinc-700 ${theme.matrix.headerBg} text-slate-900 dark:text-white`}
                      >
                        {titleText}
                      </th>
                    );
                  }

                  return (
                    <th
                      key={col.branchCode}
                      rowSpan={isTwoRowHeader ? 2 : 1}
                      className={`px-4 py-3 text-center border-l min-w-[145px] whitespace-nowrap transition-colors ${sectorType === 3
                          ? 'bg-violet-950 text-white border-violet-800/60'
                          : isShop
                            ? 'border-orange-500/20 bg-orange-500/10 text-orange-600 dark:text-orange-400 border-b-2 border-b-orange-500'
                            : `border-slate-300 dark:border-zinc-700 ${theme.matrix.headerBg}`
                        }`}
                      title={isGame ? `كود اللعبة: ${col.branchCode}` : `كود المنفذ: ${col.branchCode}`}
                    >
                      <div className="flex flex-col items-center justify-center gap-0.5">
                        <span
                          className={`text-sm tracking-wide ${sectorType === 3
                              ? 'font-bold text-white'
                              : isShop
                                ? 'font-bold text-orange-600 dark:text-orange-400'
                                : 'font-bold text-slate-900 dark:text-white'
                            }`}
                        >
                          {col.name}
                        </span>
                        <span
                          className={`text-xs font-mono font-medium ${sectorType === 3
                              ? 'text-violet-300/80'
                              : isShop
                                ? 'text-orange-500/80 dark:text-orange-400/80'
                                : 'text-slate-500 dark:text-zinc-400'
                            }`}
                        >
                          {col.branchCode}
                        </span>
                      </div>
                    </th>
                  );
                })}
                <th
                  rowSpan={isTwoRowHeader ? 2 : 1}
                  className={`px-4 py-4 font-black text-left min-w-[160px] text-sm ${sectorType === 3
                    ? 'bg-violet-950 text-white border-l border-violet-800/60'
                    : `text-slate-900 dark:text-white ${theme.matrix.headerBg}`
                  }`}
                >
                  الإجمالي اليومي
                </th>
                {calcMode !== 'vat' && (
                  <>
                    <th
                      rowSpan={isTwoRowHeader ? 2 : 1}
                      className={`px-4 py-4 font-black text-left min-w-[130px] text-sm ${sectorType === 3
                        ? 'bg-violet-950 text-white border-l border-violet-800/60'
                        : `text-slate-900 dark:text-white ${theme.matrix.headerBg}`
                      }`}
                    >
                      كاش
                    </th>
                    <th
                      rowSpan={isTwoRowHeader ? 2 : 1}
                      className={`px-4 py-4 font-black text-left min-w-[130px] text-sm ${sectorType === 3
                        ? 'bg-violet-950 text-white border-l border-violet-800/60'
                        : `text-slate-900 dark:text-white ${theme.matrix.headerBg}`
                      }`}
                    >
                      فيزا
                    </th>
                    <th
                      rowSpan={isTwoRowHeader ? 2 : 1}
                      className={`px-4 py-4 font-black text-left min-w-[150px] text-sm ${sectorType === 3
                        ? 'bg-violet-950 text-white border-violet-800/60'
                        : `text-slate-900 dark:text-white ${theme.matrix.headerBg}`
                      }`}
                    >
                      كوبونات و CL
                    </th>
                  </>
                )}
              </tr>

              {/* Sub-header Row for Two-Level Grouped Headers */}
              {isTwoRowHeader && (
                <tr className={`border-b border-slate-300 dark:border-zinc-700 ${theme.matrix.headerBg} sticky top-[48px] z-20 shadow-xs text-xs font-bold`}>
                  {columns.map((col) => {
                    if (col.branchCode === 'golden') {
                      return (
                        <React.Fragment key="golden-sub-headers">
                          <th className="px-2 py-2 text-center border-l border-slate-300 dark:border-zinc-700 min-w-[75px] text-xs">S.Golden</th>
                          <th className="px-2 py-2 text-center border-l border-slate-300 dark:border-zinc-700 min-w-[75px] text-xs">Platinum</th>
                          <th className="px-2 py-2 text-center border-l border-slate-300 dark:border-zinc-700 min-w-[75px] text-xs">Diamond</th>
                          <th className="px-2 py-2 text-center border-l border-slate-300 dark:border-zinc-700 min-w-[75px] text-xs">VIP</th>
                          <th className="px-2.5 py-2 text-center border-l border-slate-300 dark:border-zinc-700 min-w-[85px] text-xs font-black text-slate-900 dark:text-white">Total</th>
                        </React.Fragment>
                      );
                    }
                    if (col.branchCode === '4') {
                      return (
                        <React.Fragment key="4-sub-headers">
                          <th className="px-2 py-2 text-center border-l border-slate-300 dark:border-zinc-700 min-w-[75px] text-xs">Cash</th>
                          <th className="px-2 py-2 text-center border-l border-slate-300 dark:border-zinc-700 min-w-[75px] text-xs">Platinum</th>
                          <th className="px-2 py-2 text-center border-l border-slate-300 dark:border-zinc-700 min-w-[75px] text-xs">Diamond</th>
                          <th className="px-2 py-2 text-center border-l border-slate-300 dark:border-zinc-700 min-w-[75px] text-xs">Visa</th>
                          <th className="px-2.5 py-2 text-center border-l border-slate-300 dark:border-zinc-700 min-w-[85px] text-xs font-black text-slate-900 dark:text-white">Total</th>
                        </React.Fragment>
                      );
                    }
                    return null;
                  })}
                </tr>
              )}
            </>
          )}
        </thead>

        {/* Table Body with Crosshair Row Hover & Readable Fonts */}
        <tbody className="divide-y divide-slate-200 dark:divide-zinc-800/80 font-mono tabular-nums tracking-tight">
          {loading ? (
            <tr>
              <td colSpan={totalTableCols} className="py-16 text-center text-slate-400">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className={`h-7 w-7 animate-spin ${theme.accentText}`} />
                  <span className="text-sm font-sans font-semibold text-slate-700 dark:text-zinc-300">
                    جاري تجميع وحساب مصفوفة الإيرادات المالية...
                  </span>
                </div>
              </td>
            </tr>
          ) : isRestaurants ? (
            effectiveGranularity === 'summary' ? (
              // 1. Summary Granularity: Branch-by-Branch Table
              !restaurantData || restaurantData.summaryBranches.length === 0 ? (
                <tr>
                  <td
                    colSpan={totalTableCols}
                    className="py-12 text-center text-slate-500 text-sm font-sans font-medium"
                  >
                    لا توجد بيانات مطاعم للفترة المحددة
                  </td>
                </tr>
              ) : (
                restaurantData.summaryBranches.map((b, idx) => (
                  <tr
                    key={b.branchCode}
                    className={`border-b border-slate-200/80 transition-colors ${
                      idx % 2 === 1 ? 'bg-slate-50/70 dark:bg-zinc-800/40' : 'bg-white dark:bg-zinc-900'
                    } hover:bg-rose-50/40 dark:hover:bg-rose-950/20`}
                  >
                    <td className="sticky right-0 z-10 px-4 py-3 font-sans text-sm font-bold text-slate-800 dark:text-zinc-200 border-l border-slate-200 dark:border-zinc-800 bg-inherit whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 dark:bg-zinc-800 text-xs font-mono text-slate-600 dark:text-zinc-400">
                          {b.branchCode}
                        </span>
                        <span>{b.displayName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-left border-l border-slate-200/60 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 font-mono">
                      {fmtMoney(b.food)}
                    </td>
                    <td className="px-4 py-3 text-left border-l border-slate-200/60 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 font-mono">
                      {fmtMoney(b.beverage)}
                    </td>
                    <td className="px-4 py-3 text-left border-l border-slate-200/60 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 font-mono">
                      {fmtMoney(b.other)}
                    </td>
                    <td className="px-4 py-3 text-left border-l border-slate-200/60 dark:border-zinc-800 font-black text-slate-900 dark:text-white bg-slate-100/60 dark:bg-zinc-800/60 font-mono">
                      {fmtMoney(b.total)}
                    </td>
                    {calcMode !== 'vat' && (
                      <>
                        <td className="px-4 py-3 text-left border-l border-slate-200/60 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 font-mono">
                          {fmtMoney(b.cash)}
                        </td>
                        <td className="px-4 py-3 text-left border-l border-slate-200/60 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 font-mono">
                          {fmtMoney(b.visa)}
                        </td>
                        <td className="px-4 py-3 text-left text-slate-700 dark:text-zinc-300 font-mono">
                          {fmtMoney(b.cl)}
                        </td>
                      </>
                    )}
                  </tr>
                ))
              )
            ) : effectiveGranularity === 'month' ? (
              // 2. Month Granularity: Grouped by Month with Subtotals & Branches
              !restaurantData || restaurantData.monthGroups.length === 0 ? (
                <tr>
                  <td
                    colSpan={totalTableCols}
                    className="py-12 text-center text-slate-500 text-sm font-sans font-medium"
                  >
                    لا توجد بيانات مطاعم شهرية للفترة المحددة
                  </td>
                </tr>
              ) : (
                restaurantData.monthGroups.map((m) => {
                  const isExpanded = expandedMonths.has(m.monthKey);
                  return (
                    <React.Fragment key={m.monthKey}>
                      <tr
                        onClick={() => handleToggleMonth(m.monthKey)}
                        className="cursor-pointer bg-slate-100 dark:bg-zinc-800/80 font-bold border-y border-slate-300 dark:border-zinc-700 hover:bg-rose-50/50 dark:hover:bg-rose-950/30 transition-colors"
                      >
                        <td className="sticky right-0 z-10 px-4 py-3 font-sans text-sm font-black text-slate-900 dark:text-white border-l border-slate-300 dark:border-zinc-700 bg-inherit">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-[#881337] dark:text-rose-400" />
                              ) : (
                                <ChevronUp className="h-4 w-4 text-slate-400" />
                              )}
                              <span>{m.monthLabel}</span>
                            </div>
                            <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-slate-200 dark:bg-zinc-700 text-slate-600 dark:text-zinc-300">
                              {m.branches.length} مطعم
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-left border-l border-slate-300/60 text-slate-900 dark:text-white font-bold font-mono">
                          {fmtMoney(m.food)}
                        </td>
                        <td className="px-4 py-3 text-left border-l border-slate-300/60 text-slate-900 dark:text-white font-bold font-mono">
                          {fmtMoney(m.beverage)}
                        </td>
                        <td className="px-4 py-3 text-left border-l border-slate-300/60 text-slate-900 dark:text-white font-bold font-mono">
                          {fmtMoney(m.other)}
                        </td>
                        <td className="px-4 py-3 text-left border-l border-slate-300/60 font-black text-slate-900 dark:text-white bg-slate-200/50 dark:bg-zinc-700/50 font-mono">
                          {fmtMoney(m.total)}
                        </td>
                        {calcMode !== 'vat' && (
                          <>
                            <td className="px-4 py-3 text-left border-l border-slate-300/60 text-slate-900 dark:text-white font-bold font-mono">
                              {fmtMoney(m.cash)}
                            </td>
                            <td className="px-4 py-3 text-left border-l border-slate-300/60 text-slate-900 dark:text-white font-bold font-mono">
                              {fmtMoney(m.visa)}
                            </td>
                            <td className="px-4 py-3 text-left text-slate-900 dark:text-white font-bold font-mono">
                              {fmtMoney(m.cl)}
                            </td>
                          </>
                        )}
                      </tr>

                      {isExpanded &&
                        m.branches.map((b) => (
                          <tr
                            key={`${m.monthKey}_${b.branchCode}`}
                            className="border-b border-slate-200/60 bg-white dark:bg-zinc-900/60 hover:bg-rose-50/30 dark:hover:bg-rose-950/20 text-xs"
                          >
                            <td className="sticky right-0 z-10 pr-8 pl-4 py-2.5 font-sans font-medium text-slate-700 dark:text-zinc-300 border-l border-slate-200 dark:border-zinc-800 bg-inherit whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-mono text-slate-400">#{b.branchCode}</span>
                                <span>{b.displayName}</span>
                              </div>
                            </td>
                            <td className="px-4 py-2.5 text-left border-l border-slate-200/40 text-slate-600 dark:text-zinc-400 font-mono">
                              {fmtMoney(b.food)}
                            </td>
                            <td className="px-4 py-2.5 text-left border-l border-slate-200/40 text-slate-600 dark:text-zinc-400 font-mono">
                              {fmtMoney(b.beverage)}
                            </td>
                            <td className="px-4 py-2.5 text-left border-l border-slate-200/40 text-slate-600 dark:text-zinc-400 font-mono">
                              {fmtMoney(b.other)}
                            </td>
                            <td className="px-4 py-2.5 text-left border-l border-slate-200/40 font-bold text-slate-800 dark:text-zinc-200 bg-slate-50 dark:bg-zinc-800/40 font-mono">
                              {fmtMoney(b.total)}
                            </td>
                            {calcMode !== 'vat' && (
                              <>
                                <td className="px-4 py-2.5 text-left border-l border-slate-200/40 text-slate-600 dark:text-zinc-400 font-mono">
                                  {fmtMoney(b.cash)}
                                </td>
                                <td className="px-4 py-2.5 text-left border-l border-slate-200/40 text-slate-600 dark:text-zinc-400 font-mono">
                                  {fmtMoney(b.visa)}
                                </td>
                                <td className="px-4 py-2.5 text-left text-slate-600 dark:text-zinc-400 font-mono">
                                  {fmtMoney(b.cl)}
                                </td>
                              </>
                            )}
                          </tr>
                        ))}
                    </React.Fragment>
                  );
                })
              )
            ) : (
              // 3. Day Granularity: Paginated Days with Collapsible Branch Breakdown
              paginatedDayGroups.length === 0 ? (
                <tr>
                  <td
                    colSpan={totalTableCols}
                    className="py-12 text-center text-slate-500 text-sm font-sans font-medium"
                  >
                    لا توجد بيانات مطاعم يومية للفترة المحددة
                  </td>
                </tr>
              ) : (
                paginatedDayGroups.map((d) => {
                  const isExpanded = expandedDays.has(d.date) || allDaysExpanded;
                  return (
                    <React.Fragment key={d.date}>
                      <tr
                        onClick={() => handleToggleDay(d.date)}
                        className="cursor-pointer border-b border-slate-200 bg-white dark:bg-zinc-900 hover:bg-rose-50/40 dark:hover:bg-rose-950/20 transition-colors font-bold"
                      >
                        <td className="sticky right-0 z-10 px-4 py-3 font-sans text-sm font-bold text-slate-800 dark:text-zinc-200 border-l border-slate-200 dark:border-zinc-800 bg-inherit whitespace-nowrap">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-[#881337] dark:text-rose-400" />
                              ) : (
                                <ChevronUp className="h-4 w-4 text-slate-400" />
                              )}
                              <span>{formatDateAr(d.date)}</span>
                            </div>
                            <span className="text-[11px] font-normal px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-500">
                              {d.branches.length} مطعم
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-left border-l border-slate-200/60 text-slate-800 dark:text-zinc-200 font-mono">
                          {fmtMoney(d.food)}
                        </td>
                        <td className="px-4 py-3 text-left border-l border-slate-200/60 text-slate-800 dark:text-zinc-200 font-mono">
                          {fmtMoney(d.beverage)}
                        </td>
                        <td className="px-4 py-3 text-left border-l border-slate-200/60 text-slate-800 dark:text-zinc-200 font-mono">
                          {fmtMoney(d.other)}
                        </td>
                        <td className="px-4 py-3 text-left border-l border-slate-200/60 font-black text-slate-900 dark:text-white bg-slate-100/60 dark:bg-zinc-800/60 font-mono">
                          {fmtMoney(d.total)}
                        </td>
                        {calcMode !== 'vat' && (
                          <>
                            <td className="px-4 py-3 text-left border-l border-slate-200/60 text-slate-800 dark:text-zinc-200 font-mono">
                              {fmtMoney(d.cash)}
                            </td>
                            <td className="px-4 py-3 text-left border-l border-slate-200/60 text-slate-800 dark:text-zinc-200 font-mono">
                              {fmtMoney(d.visa)}
                            </td>
                            <td className="px-4 py-3 text-left text-slate-800 dark:text-zinc-200 font-mono">
                              {fmtMoney(d.cl)}
                            </td>
                          </>
                        )}
                      </tr>

                      {isExpanded &&
                        d.branches.map((b) => (
                          <tr
                            key={`${d.date}_${b.branchCode}`}
                            className="border-b border-slate-200/40 bg-slate-50/70 dark:bg-zinc-800/30 hover:bg-rose-50/30 text-xs font-normal"
                          >
                            <td className="sticky right-0 z-10 pr-8 pl-4 py-2 font-sans text-slate-600 dark:text-zinc-400 border-l border-slate-200 dark:border-zinc-800 bg-inherit whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono text-slate-400">#{b.branchCode}</span>
                                <span>{b.displayName}</span>
                              </div>
                            </td>
                            <td className="px-4 py-2 text-left border-l border-slate-200/40 text-slate-600 dark:text-zinc-400 font-mono">
                              {fmtMoney(b.food)}
                            </td>
                            <td className="px-4 py-2 text-left border-l border-slate-200/40 text-slate-600 dark:text-zinc-400 font-mono">
                              {fmtMoney(b.beverage)}
                            </td>
                            <td className="px-4 py-2 text-left border-l border-slate-200/40 text-slate-600 dark:text-zinc-400 font-mono">
                              {fmtMoney(b.other)}
                            </td>
                            <td className="px-4 py-2 text-left border-l border-slate-200/40 font-bold text-slate-700 dark:text-zinc-300 bg-slate-100/40 font-mono">
                              {fmtMoney(b.total)}
                            </td>
                            {calcMode !== 'vat' && (
                              <>
                                <td className="px-4 py-2 text-left border-l border-slate-200/40 text-slate-600 dark:text-zinc-400 font-mono">
                                  {fmtMoney(b.cash)}
                                </td>
                                <td className="px-4 py-2 text-left border-l border-slate-200/40 text-slate-600 dark:text-zinc-400 font-mono">
                                  {fmtMoney(b.visa)}
                                </td>
                                <td className="px-4 py-2 text-left text-slate-600 dark:text-zinc-400 font-mono">
                                  {fmtMoney(b.cl)}
                                </td>
                              </>
                            )}
                          </tr>
                        ))}
                    </React.Fragment>
                  );
                })
              )
            )
          ) : paginatedRows.length === 0 ? (
            <tr>
              <td
                colSpan={totalTableCols}
                className="py-12 text-center text-slate-500 text-sm font-sans font-medium"
              >
                لا توجد سجلات كافية لبناء المصفوفة
              </td>
            </tr>
          ) : (
            paginatedRows.map((row) => (
              <MatrixTableRow
                key={row.date}
                row={row}
                columns={columns}
                calcMode={calcMode}
                hoverRowClass={theme.matrix.hoverRow}
                hoverCellClass={theme.matrix.hoverCell}
                totalRevColClass={theme.matrix.totalRevCol}
                isTwoRowHeader={isTwoRowHeader}
                sectorType={sectorType}
              />
            ))
          )}
        </tbody>

        {/* Sticky Grand Totals Footer (Calculated over FULL Data) */}
        {!loading && (isRestaurants || matrixRows.length > 0) && (
          <tfoot className={`sticky bottom-0 z-20 shadow-xl ${theme.solidBg} font-mono tabular-nums tracking-tight !text-white`}>
            {isRestaurants ? (
              <tr className="bg-[#4c0519] !text-white font-bold border-t-2 border-[#881337]">
                <td className="sticky right-0 z-30 px-4 py-4 text-center font-sans text-sm lg:text-base font-black border-l border-white/20 bg-[#4c0519] !text-white">
                  الإجمالي العام
                </td>
                <td className="px-4 py-4 text-left font-black text-base lg:text-lg border-l border-white/20 !text-white bg-[#4c0519]">
                  {MONEY_FORMATTER.format(grandFood)}
                </td>
                <td className="px-4 py-4 text-left font-black text-base lg:text-lg border-l border-white/20 !text-white bg-[#4c0519]">
                  {MONEY_FORMATTER.format(grandBeverage)}
                </td>
                <td className="px-4 py-4 text-left font-black text-base lg:text-lg border-l border-white/20 !text-white bg-[#4c0519]">
                  {MONEY_FORMATTER.format(grandOther)}
                </td>
                <td className="px-4 py-4 text-left text-lg lg:text-xl font-black border-l border-white/20 !text-white bg-[#4c0519]">
                  {MONEY_FORMATTER.format(grandTotal)}
                </td>
                {calcMode !== 'vat' && (
                  <>
                    <td className="px-4 py-4 text-left text-base lg:text-lg font-black border-l border-white/20 !text-white bg-[#4c0519]">
                      {MONEY_FORMATTER.format(grandCash)}
                    </td>
                    <td className="px-4 py-4 text-left text-base lg:text-lg font-black border-l border-white/20 !text-white bg-[#4c0519]">
                      {MONEY_FORMATTER.format(grandVisa)}
                    </td>
                    <td className="px-4 py-4 text-left text-base lg:text-lg font-black !text-white bg-[#4c0519]">
                      {MONEY_FORMATTER.format(grandCoupons)}
                    </td>
                  </>
                )}
              </tr>
            ) : (
              <tr className={`${theme.solidBg} !text-white font-bold`}>
                <td className={`sticky right-0 z-30 px-4 py-4 text-center font-sans text-sm lg:text-base font-black border-l border-white/20 ${theme.solidBg} !text-white`}>
                  الإجمالي
                </td>
                {columns.map((col) => {
                  if (isTwoRowHeader && col.branchCode === 'golden') {
                    const total = columnTotals['golden'] || 0;
                    return (
                      <React.Fragment key={col.branchCode}>
                        <td className={`px-2 py-4 text-center font-mono text-xs border-l border-white/20 !text-white/70 ${theme.solidBg}`}>0.00</td>
                        <td className={`px-2 py-4 text-center font-mono text-xs border-l border-white/20 !text-white/70 ${theme.solidBg}`}>0.00</td>
                        <td className={`px-2 py-4 text-center font-mono text-xs border-l border-white/20 !text-white/70 ${theme.solidBg}`}>0.00</td>
                        <td className={`px-2 py-4 text-center font-mono text-xs border-l border-white/20 !text-white/70 ${theme.solidBg}`}>0.00</td>
                        <td className={`px-3 py-4 text-left font-black text-base lg:text-lg border-l border-white/20 !text-white ${theme.solidBg}`}>
                          {MONEY_FORMATTER.format(total)}
                        </td>
                      </React.Fragment>
                    );
                  }
                  if (isTwoRowHeader && col.branchCode === '4') {
                    const total = columnTotals['4'] || 0;
                    return (
                      <React.Fragment key={col.branchCode}>
                        <td className={`px-2 py-4 text-center font-mono text-xs border-l border-white/20 !text-white/70 ${theme.solidBg}`}>0.00</td>
                        <td className={`px-2 py-4 text-center font-mono text-xs border-l border-white/20 !text-white/70 ${theme.solidBg}`}>0.00</td>
                        <td className={`px-2 py-4 text-center font-mono text-xs border-l border-white/20 !text-white/70 ${theme.solidBg}`}>0.00</td>
                        <td className={`px-2 py-4 text-center font-mono text-xs border-l border-white/20 !text-white/70 ${theme.solidBg}`}>0.00</td>
                        <td className={`px-3 py-4 text-left font-black text-base lg:text-lg border-l border-white/20 !text-white ${theme.solidBg}`}>
                          {MONEY_FORMATTER.format(total)}
                        </td>
                      </React.Fragment>
                    );
                  }
                  const total = columnTotals[col.branchCode] || 0;
                  return (
                    <td
                      key={col.branchCode}
                      className={`px-4 py-4 text-left font-black text-base lg:text-lg border-l border-white/20 !text-white ${theme.solidBg}`}
                    >
                      {MONEY_FORMATTER.format(total)}
                    </td>
                  );
                })}
                <td className={`px-4 py-4 text-left text-lg lg:text-xl font-black border-l border-white/20 !text-white ${theme.solidBg}`}>
                  {MONEY_FORMATTER.format(grandTotal)}
                </td>
                {calcMode !== 'vat' && (
                  <>
                    <td className={`px-4 py-4 text-left text-base lg:text-lg font-black border-l border-white/20 !text-white ${theme.solidBg}`}>
                      {MONEY_FORMATTER.format(grandCash)}
                    </td>
                    <td className={`px-4 py-4 text-left text-base lg:text-lg font-black border-l border-white/20 !text-white ${theme.solidBg}`}>
                      {MONEY_FORMATTER.format(grandVisa)}
                    </td>
                    <td className={`px-4 py-4 text-left text-base lg:text-lg font-black !text-white ${theme.solidBg}`}>
                      {MONEY_FORMATTER.format(grandCoupons)}
                    </td>
                  </>
                )}
              </tr>
            )}
          </tfoot>
        )}
      </table>
    </div>

    {/* --------------------------------------------------------------------- */}
    {/* Client-Side Pagination & Audit Status Bar                             */}
    {/* --------------------------------------------------------------------- */}
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-xs text-slate-600 dark:text-zinc-400 border-t border-slate-200 pt-3 dark:border-zinc-800">
      <div className="flex items-center gap-4">
        {(!isRestaurants || effectiveGranularity === 'day') && (
          <div className="flex items-center gap-2">
            <span>عدد الصفوف في الصفحة:</span>
            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="h-8 rounded-md border border-slate-300 bg-white px-2.5 text-xs font-bold text-slate-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-400 dark:focus:ring-zinc-600"
            >
              <option value={10}>10 صفوف</option>
              <option value={15}>15 صفاً</option>
              <option value={31}>31 صفاً (شهر)</option>
              <option value={50}>50 صفاً</option>
              {(isRestaurantDayMode ? totalRestaurantDays : matrixRows.length) <= 60 && (
                <option value={9999}>الكل ({(isRestaurantDayMode ? totalRestaurantDays : matrixRows.length)})</option>
              )}
            </select>
          </div>
        )}

        <span className="font-medium text-slate-700 dark:text-zinc-300">
          {isRestaurants && effectiveGranularity === 'summary'
            ? `عرض جميع الفروع (${restaurantData?.summaryBranches.length || 0} فرع)`
            : isRestaurants && effectiveGranularity === 'month'
              ? `عرض جميع الشهور (${restaurantData?.monthGroups.length || 0} شهر)`
              : `عرض ${startRecord} - ${endRecord} من إجمالي ${activeTotalRecords} يوم`}
        </span>
      </div>

      {/* Pagination Buttons */}
      {(!isRestaurants || effectiveGranularity === 'day') && totalPages > 1 && rowsPerPage < 9999 && (
        <div className="flex items-center gap-1.5" dir="ltr">
          <button
            type="button"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            title="الصفحة الأولى"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            <ChevronsLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            title="السابق"
            className="inline-flex h-8 px-2.5 items-center justify-center gap-1 rounded-md border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span>السابق</span>
          </button>

          <span className="px-2 font-mono font-bold text-slate-800 dark:text-zinc-200">
            {currentPage} / {totalPages}
          </span>

          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            title="التالي"
            className="inline-flex h-8 px-2.5 items-center justify-center gap-1 rounded-md border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            <span>التالي</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            title="الصفحة الأخيرة"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            <ChevronsRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>

    {/* Accounting Footnote */}
    <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-zinc-400 bg-slate-50/60 p-2.5 rounded-md dark:bg-zinc-900/40">
      <span>
        * الحالة الحالية: نوع الاحتساب [
        <strong>
          {calcMode === 'net'
            ? 'الصافي (Net Sales)'
            : calcMode === 'vat'
              ? 'الضريبة (VAT 14%)'
              : 'الإجمالي الشامل (Total Gross)'}
        </strong>
        ]
      </span>
      <span className="font-mono font-bold text-slate-700 dark:text-zinc-300">
        إجمالي محددات العرض للفترة: {fmtMoney(grandTotal)}
      </span>
    </div>
  </div>
);
});

export default DailyRevenueMatrix;
