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

interface DailyRevenueMatrixProps {
  rows?: (CaravanRecord | MatrixRowItem)[];
  title?: string;
  loading?: boolean;
  sectorId?: string;
  sectorType?: number;
  sectorLabel?: string;
  sectorTheme?: SectorTheme;
  facilityType?: 'all' | 'caravans' | 'shops';
  rideStatusFilter?: RideStatusFilter;
  onRideStatusFilterChange?: (filter: RideStatusFilter) => void;
  startDate?: string;
  endDate?: string;
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
  rowCashVisa: number;
  rowCoupons: number;
}

interface MatrixTableRowProps {
  row: MatrixRowData;
  columns: MatrixColumn[];
  calcMode: CalcMode;
  hoverRowClass: string;
  hoverCellClass: string;
  totalRevColClass: string;
}

const MatrixTableRow = React.memo(function MatrixTableRow({
  row,
  columns,
  calcMode,
  hoverRowClass,
  hoverCellClass,
  totalRevColClass,
}: MatrixTableRowProps) {
  return (
    <tr className={`group transition-colors duration-150 ${hoverRowClass}`}>
      {/* Date Column (Sticky Right) */}
      <td className={`sticky right-0 z-10 px-4 py-3.5 text-center font-bold text-sm lg:text-base text-slate-900 border-l border-slate-200 bg-slate-50/95 ${hoverCellClass} dark:border-zinc-800 dark:bg-zinc-900/95 dark:text-zinc-100 transition-colors`}>
        {row.date}
      </td>

      {/* Outlet / Game Values */}
      {columns.map((col) => {
        const val = row.values[col.branchCode] || 0;
        return (
          <td
            key={col.branchCode}
            className={`px-4 py-3.5 text-left font-bold text-base lg:text-lg tabular-nums border-l border-slate-200/60 dark:border-zinc-800/40 ${hoverCellClass} transition-colors ${val > 0
              ? 'text-slate-900 dark:text-white'
              : 'text-slate-300 dark:text-zinc-600 font-normal'
              }`}
          >
            {val > 0 ? (
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
            <Money value={row.rowCashVisa} />
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
  rideStatusFilter,
  onRideStatusFilterChange,
  startDate,
  endDate,
}: DailyRevenueMatrixProps) {
  const theme = useMemo(() => sectorTheme || getSectorTheme(sectorType), [sectorTheme, sectorType]);
  const [exporting, setExporting] = useState(false);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Calculation Mode State - Default to 'total' (الإجمالي الشامل)
  const [calcMode, setCalcMode] = useState<CalcMode>('total');

  // Paid Rides (Sector 2) Active / Inactive / All Filter State
  const [internalRideStatusFilter, setInternalRideStatusFilter] = useState<RideStatusFilter>('active');
  const effectiveRideStatusFilter = rideStatusFilter ?? internalRideStatusFilter;
  const handleRideStatusFilterChange = (f: RideStatusFilter) => {
    setInternalRideStatusFilter(f);
    onRideStatusFilterChange?.(f);
  };

  // Client-Side Pagination States (Default 31 rows/page to prevent 365-row DOM overload)
  const [rowsPerPage, setRowsPerPage] = useState<number>(31);
  const [currentPage, setCurrentPage] = useState<number>(1);

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
      { cashVisa: number; cl: number; total: number }
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
      const itemBaseTotal = (cash + visa + cl) > 0 ? (cash + visa + cl) : rawTotal;

      branchTotals.set(branchKey, (branchTotals.get(branchKey) || 0) + itemBaseTotal);

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
            cashVisa: dCash + dVisa,
            cl: dCl,
            total: dTot,
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

    // Sector 2: Filter rides based on Active / Inactive / All
    if (sectorType === 2) {
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
      rawDates: Array.from(dateMap.keys()),
    };
}, [rows, sectorType, effectiveRideStatusFilter]);

// Stage 2: Dynamic Metric Projection & Aggregate Totals (Instant O(Dates * Columns))
const { columns, matrixRows, columnTotals, grandTotal, grandCashVisa, grandCoupons } = useMemo(() => {
  const { cols, dateMap, datePaymentMap, rawDates } = aggregatedData;

  const dates = [...rawDates].sort((a, b) => {
    const cmp = a.localeCompare(b);
    return sortOrder === 'asc' ? cmp : -cmp;
  });

  const rawColTotals: Record<string, number> = {};
  cols.forEach((c) => {
    rawColTotals[c.branchCode] = 0;
  });

  let rawOverallTotal = 0;
  let rawOverallCashVisa = 0;
  let rawOverallCoupons = 0;

  const applyCalcMode = (val: number, mode: CalcMode) => {
    if (mode === 'net') return val / 1.14;
    if (mode === 'vat') return val - val / 1.14;
    return val;
  };

  const mRows = dates.map((date) => {
    const branchValues = dateMap.get(date);
    const values: Record<string, number> = {};
    let rawDailyTotal = 0;
    let rawDailyCashVisa = 0;
    let rawDailyCoupons = 0;

    cols.forEach((col) => {
      const item = branchValues?.get(col.branchCode) || {
        cash: 0,
        visa: 0,
        cl: 0,
        rawTotal: 0,
      };

      const itemCashVisa = item.cash + item.visa;
      const itemCl = item.cl;
      // Always calculate using All sources: baseTotal = cash + visa + cl
      const itemBaseTotal =
        itemCashVisa + itemCl > 0
          ? itemCashVisa + itemCl
          : item.rawTotal;

      const val = applyCalcMode(itemBaseTotal, calcMode);

      values[col.branchCode] = val;
      rawDailyTotal += itemBaseTotal;
      if (!datePaymentMap.has(date)) {
        rawDailyCashVisa += itemCashVisa;
        rawDailyCoupons += itemCl;
      }

      rawColTotals[col.branchCode] = (rawColTotals[col.branchCode] || 0) + itemBaseTotal;
    });

    // Use POS_Post daily payment totals directly when available (Types 2 & 3 zero double-counting)
    if (datePaymentMap.has(date)) {
      const dPay = datePaymentMap.get(date)!;
      rawDailyCashVisa = dPay.cashVisa;
      rawDailyCoupons = dPay.cl;
    }

    // Apply calcMode to daily aggregate columns
    const rowTotal = applyCalcMode(rawDailyTotal, calcMode);
    const rowCashVisa = applyCalcMode(rawDailyCashVisa, calcMode);
    const rowCoupons = applyCalcMode(rawDailyCoupons, calcMode);

    rawOverallTotal += rawDailyTotal;
    rawOverallCashVisa += rawDailyCashVisa;
    rawOverallCoupons += rawDailyCoupons;

    return {
      date,
      values,
      rowTotal,
      rowCashVisa,
      rowCoupons,
    };
  });

  // Compute Grand Totals directly from raw unrounded aggregates to eliminate drift
  const colTotalsAcc: Record<string, number> = {};
  cols.forEach((c) => {
    colTotalsAcc[c.branchCode] = applyCalcMode(rawColTotals[c.branchCode] || 0, calcMode);
  });

  const grandTotal = applyCalcMode(rawOverallTotal, calcMode);
  const grandCashVisa = applyCalcMode(rawOverallCashVisa, calcMode);
  const grandCoupons = applyCalcMode(rawOverallCoupons, calcMode);

  return {
    columns: cols,
    matrixRows: mRows,
    columnTotals: colTotalsAcc,
    grandTotal,
    grandCashVisa,
    grandCoupons,
  };
}, [aggregatedData, sortOrder, calcMode]);

// Client-Side Pagination Calculations
const totalPages = Math.max(1, Math.ceil(matrixRows.length / rowsPerPage));

// Guard against rendering 365 rows x 25+ cols into the DOM when switching to a large range
useEffect(() => {
  if (matrixRows.length > 60 && rowsPerPage >= 9999) {
    setRowsPerPage(31);
    setCurrentPage(1);
  }
}, [matrixRows.length, rowsPerPage]);

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

const startRecord =
  matrixRows.length === 0
    ? 0
    : (currentPage - 1) * (rowsPerPage >= 9999 ? matrixRows.length : rowsPerPage) + 1;
const endRecord =
  rowsPerPage >= 9999 ? matrixRows.length : Math.min(currentPage * rowsPerPage, matrixRows.length);

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
    const worksheet = workbook.addWorksheet(sheetName, {
      views: [{ rightToLeft: true }],
    });
    worksheet.properties.tabColor = { argb: tabColor };

    // 1. Setup Column Headers: Date, Caravans/Shops (English ONLY), TOTAL REV, CASH, COPON /C L
    const wsColumns: { header: string; key: string; width: number; isShop?: boolean }[] = [
      { header: 'التاريخ', key: 'date', width: 16 },
      ...columns.map((col) => ({
        header: sectorType === 3
          ? (VGAMES_DISPLAY_NAMES[col.branchCode] || col.name)
          : sectorType === 2
              ? (PAID_RIDES_DISPLAY_NAMES[col.branchCode] || col.name)
              : (CARAVAN_DISPLAY_NAMES[col.branchCode] || col.name),
        key: `col_${col.branchCode}`,
        width: 20,
        isShop: sectorType === 4 && SHOP_BRANCH_CODES_SET.has(col.branchCode),
      })),
      { header: 'TOTAL REV', key: 'row_total', width: 22 },
      ...(calcMode !== 'vat'
        ? [
          { header: 'CASH', key: 'cash_visa', width: 18 },
          { header: 'COPON /C L', key: 'coupons', width: 20 },
        ]
        : []),
    ];

    worksheet.columns = wsColumns.map((c) => ({ key: c.key, width: c.width }));
    const totalColumnsCount = wsColumns.length;

    // Row 1 (height 28) and Row 2 (height 24) header area for Logo and Centered Title
    const row1 = worksheet.addRow([]);
    row1.height = 28;
    const row2 = worksheet.addRow([]);
    row2.height = 24;

    // Place Dream Park Logo cleanly in top-right corner (Columns A-B, Rows 1-2, zero overlap)
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

    // Merge Title strictly across first visible columns next to logo: Col C (col 3) to Math.min(lastColIndex, 10)
    if (totalColumnsCount >= 3) {
      const titleEndCol = Math.min(totalColumnsCount, 10);
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

    // Row 3: Table Header Row (Times New Roman, size 13, bold, fill theme.excel.headerFill, height 53.25)
    // Red #FF0000 font for the 5 Shops, #0F172A for Caravans & summary headers, crisp #000000 borders
    const headerValues: Record<string, string> = {};
    wsColumns.forEach((c) => {
      headerValues[c.key] = c.header;
    });
    const headerRow = worksheet.addRow(headerValues);
    headerRow.height = 53.25;

    for (let colIdx = 1; colIdx <= totalColumnsCount; colIdx++) {
      const cell = headerRow.getCell(colIdx);
      const colDef = wsColumns[colIdx - 1];
      const isShop = colDef?.isShop;

      cell.font = {
        name: 'Times New Roman',
        size: 13,
        bold: true,
        color: { argb: isShop ? 'FFFF0000' : 'FF0F172A' },
      };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: headerFill },
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } },
      };
    }

    // Rows 4+: Populate ALL Data Rows (Height: 26.1, Times New Roman, Size: 12, Bold, #0F172A, numFmt: '#,##0.00')
    matrixRows.forEach((item) => {
      const rowData: Record<string, any> = {
        date: item.date,
        row_total: item.rowTotal,
      };

      if (calcMode !== 'vat') {
        rowData.cash_visa = item.rowCashVisa;
        rowData.coupons = item.rowCoupons;
      }

      columns.forEach((col) => {
        rowData[`col_${col.branchCode}`] = item.values[col.branchCode] || 0;
      });

      const row = worksheet.addRow(rowData);
      row.height = 26.1;

      for (let colIdx = 1; colIdx <= totalColumnsCount; colIdx++) {
        const cell = row.getCell(colIdx);
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'thin', color: { argb: 'FF000000' } },
          left: { style: 'thin', color: { argb: 'FF000000' } },
          right: { style: 'thin', color: { argb: 'FF000000' } },
        };

        if (colIdx === 1) {
          // Date Cell
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
          cell.font = { name: 'Times New Roman', size: 12, bold: true, color: { argb: 'FF0F172A' } };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF8FAFC' },
          };
        } else {
          // Number data cells
          cell.numFmt = '#,##0.00';
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
          cell.font = { name: 'Times New Roman', size: 12, bold: true, color: { argb: 'FF0F172A' } };

          if (colIdx === columns.length + 2) {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFF1F5F9' },
            };
          }
        }
      }
    });

    // Grand Total Row (Height: 33.95, Times New Roman, Size: 14, Bold, #1E3A8A, fill #DBEAFE, bottom double border)
    const footerData: Record<string, any> = {
      date: 'الإجمالي',
      row_total: grandTotal,
    };

    if (calcMode !== 'vat') {
      footerData.cash_visa = grandCashVisa;
      footerData.coupons = grandCoupons;
    }

    columns.forEach((col) => {
      footerData[`col_${col.branchCode}`] = columnTotals[col.branchCode] || 0;
    });

    const totalRow = worksheet.addRow(footerData);
    totalRow.height = 33.95;

    for (let colIdx = 1; colIdx <= totalColumnsCount; colIdx++) {
      const cell = totalRow.getCell(colIdx);
      cell.font = { name: 'Times New Roman', size: 14, bold: true, color: { argb: footerFont } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: footerFill },
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'double', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } },
      };

      if (colIdx === 1) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      } else {
        cell.numFmt = '#,##0.00';
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
      }
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

      {/* Paid Rides (Sector 2) Active / Inactive / All Segmented Control */}
      {sectorType === 2 && (
        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          <span className="text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-full ${effectiveRideStatusFilter === 'active' ? 'bg-emerald-500' : effectiveRideStatusFilter === 'inactive' ? 'bg-amber-500' : 'bg-blue-500'}`} />
            <span>نطاق الألعاب:</span>
          </span>
          <div className="inline-flex bg-slate-200/60 dark:bg-zinc-800/80 p-1 rounded-xl shadow-inner">
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
          </div>
        </div>
      )}
    </div>

    {/* --------------------------------------------------------------------- */}
    {/* High-Readability Table with Crosshair Hover & Sticky Footer            */}
    {/* --------------------------------------------------------------------- */}
    <div className="relative overflow-x-auto rounded-lg border border-slate-300 dark:border-zinc-800 max-h-[700px] shadow-2xs">
      <table className="w-full text-right text-sm border-collapse" dir="rtl">
        {/* Header Row */}
        <thead>
          <tr className={`border-b ${sectorType === 3
              ? 'bg-violet-950 text-white border-violet-800/60'
              : `border-slate-300 text-slate-800 dark:border-zinc-700 dark:text-zinc-200 ${theme.matrix.headerBg}`
            } sticky top-0 z-20 shadow-xs`}>
            <th className={`sticky right-0 z-30 px-4 py-4 font-black text-center border-l min-w-[140px] ${sectorType === 3
                ? 'bg-violet-950 text-white border-violet-800/60'
                : `border-slate-300 ${theme.matrix.headerBg}`
              }`}>
              <div className="flex items-center justify-center gap-2">
                <Calendar className={`h-4 w-4 ${sectorType === 3 ? 'text-violet-200' : 'text-slate-600 dark:text-zinc-300'}`} />
                <span className={`font-bold text-sm ${sectorType === 3 ? 'text-white' : 'text-slate-900 dark:text-white'}`}>التاريخ</span>
              </div>
            </th>
            {columns.map((col) => {
              const isShop = sectorType === 4 && SHOP_BRANCH_CODES_SET.has(col.branchCode);
              const isGame = sectorType === 2 || sectorType === 3;
              return (
                <th
                  key={col.branchCode}
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
            <th className={`px-4 py-4 font-black text-left min-w-[160px] text-sm ${sectorType === 3
                ? 'bg-violet-950 text-white border-l border-violet-800/60'
                : `text-slate-900 dark:text-white ${theme.matrix.headerBg}`
              }`}>
              الإجمالي اليومي
            </th>
            {calcMode !== 'vat' && (
              <>
                <th className={`px-4 py-4 font-black text-left min-w-[150px] text-sm ${sectorType === 3
                    ? 'bg-violet-950 text-white border-l border-violet-800/60'
                    : `text-slate-900 dark:text-white ${theme.matrix.headerBg}`
                  }`}>
                  كاش
                </th>
                <th className={`px-4 py-4 font-black text-left min-w-[150px] text-sm ${sectorType === 3
                    ? 'bg-violet-950 text-white border-violet-800/60'
                    : `text-slate-900 dark:text-white ${theme.matrix.headerBg}`
                  }`}>
                  كوبونات و CL
                </th>
              </>
            )}
          </tr>
        </thead>

        {/* Table Body with Crosshair Row Hover & Readable Fonts */}
        <tbody className="divide-y divide-slate-200 dark:divide-zinc-800/80 font-mono tabular-nums tracking-tight">
          {loading ? (
            <tr>
              <td colSpan={columns.length + (calcMode === 'vat' ? 2 : 4)} className="py-16 text-center text-slate-400">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className={`h-7 w-7 animate-spin ${theme.accentText}`} />
                  <span className="text-sm font-sans font-semibold text-slate-700 dark:text-zinc-300">
                    جاري تجميع وحساب مصفوفة الإيرادات المالية...
                  </span>
                </div>
              </td>
            </tr>
          ) : paginatedRows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + (calcMode === 'vat' ? 2 : 4)}
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
              />
            ))
          )}
        </tbody>

        {/* Sticky Grand Totals Footer (Calculated over FULL Data) */}
        {!loading && matrixRows.length > 0 && (
          <tfoot className={`sticky bottom-0 z-20 shadow-xl ${theme.solidBg} font-mono tabular-nums tracking-tight !text-white`}>
            <tr className={`${theme.solidBg} !text-white font-bold`}>
              <td className={`sticky right-0 z-30 px-4 py-4 text-center font-sans text-sm lg:text-base font-black border-l border-white/20 ${theme.solidBg} !text-white`}>
                الإجمالي
              </td>
              {columns.map((col) => {
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
                    {MONEY_FORMATTER.format(grandCashVisa)}
                  </td>
                  <td className={`px-4 py-4 text-left text-base lg:text-lg font-black !text-white ${theme.solidBg}`}>
                    {MONEY_FORMATTER.format(grandCoupons)}
                  </td>
                </>
              )}
            </tr>
          </tfoot>
        )}
      </table>
    </div>

    {/* --------------------------------------------------------------------- */}
    {/* Client-Side Pagination & Audit Status Bar                             */}
    {/* --------------------------------------------------------------------- */}
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-xs text-slate-600 dark:text-zinc-400 border-t border-slate-200 pt-3 dark:border-zinc-800">
      <div className="flex items-center gap-4">
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
            {matrixRows.length <= 60 && (
              <option value={9999}>الكل ({matrixRows.length})</option>
            )}
          </select>
        </div>

        <span className="font-medium text-slate-700 dark:text-zinc-300">
          عرض {startRecord} - {endRecord} من إجمالي {matrixRows.length} يوم
        </span>
      </div>

      {/* Pagination Buttons */}
      {totalPages > 1 && rowsPerPage < 9999 && (
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
