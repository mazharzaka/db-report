'use client';

import React from 'react';
import { fmtMoney } from '../charts';
import type { RestaurantBranchRow, CalcMode } from './matrixConstants';

interface RestaurantMatrixRowsProps {
  effectiveGranularity: 'summary' | 'month' | 'day';
  restaurantData: {
    summaryBranches: RestaurantBranchRow[];
    monthGroups: { monthKey: string; monthLabel: string; food: number; beverage: number; other: number; total: number; cash: number; visa: number; cl: number; branches: RestaurantBranchRow[] }[];
    dayGroups: { date: string; food: number; beverage: number; other: number; total: number; cash: number; visa: number; cl: number; branches: RestaurantBranchRow[] }[];
  } | null;
  restaurantColumns?: RestaurantBranchRow[];
  paginatedDayGroups: { date: string; food: number; beverage: number; other: number; total: number; cash: number; visa: number; cl: number; branches: RestaurantBranchRow[] }[];
  totalTableCols: number;
  calcMode: CalcMode;
  // Backward compatibility optional props
  expandedMonths?: Set<string>;
  expandedDays?: Set<string>;
  allDaysExpanded?: boolean;
  handleToggleMonth?: (monthKey: string) => void;
  handleToggleDay?: (date: string) => void;
}

export const RestaurantMatrixRows = React.memo(function RestaurantMatrixRows({
  effectiveGranularity,
  restaurantData,
  restaurantColumns = [],
  paginatedDayGroups,
  totalTableCols,
  calcMode,
}: RestaurantMatrixRowsProps) {
  if (!restaurantData || restaurantColumns.length === 0) {
    return (
      <tr>
        <td colSpan={totalTableCols} className="py-12 text-center text-slate-500 text-sm font-sans font-medium">
          لا توجد بيانات مطاعم للفترة المحددة
        </td>
      </tr>
    );
  }

  const fmt = (v: number) => fmtMoney(v);

  const renderFlatRow = (
    rowKey: string,
    dateLabel: string,
    branches: RestaurantBranchRow[],
    rowTotal: number,
    rowCash: number,
    rowVisa: number,
    rowCL: number,
    isEvenRow: boolean
  ) => {
    const branchMap = new Map<string, RestaurantBranchRow>();
    branches.forEach((b) => branchMap.set(String(b.branchCode), b));

    return (
      <tr
        key={rowKey}
        className={`border-b border-slate-200/80 dark:border-zinc-800/80 transition-colors ${
          isEvenRow ? 'bg-white dark:bg-zinc-900' : 'bg-slate-50/70 dark:bg-zinc-800/30'
        } hover:bg-rose-50/30 dark:hover:bg-rose-950/20`}
      >
        {/* Date Column (Sticky Right) */}
        <td className="sticky right-0 z-10 px-4 py-3.5 text-center font-sans text-[15px] font-semibold text-slate-800 dark:text-zinc-200 min-w-[135px] whitespace-nowrap bg-white dark:bg-zinc-900 border-e border-slate-200 dark:border-zinc-800 shadow-[1px_0_0_0_rgba(0,0,0,0.05)]">
          {dateLabel}
        </td>

        {/* Per-Restaurant 4 Columns */}
        {restaurantColumns.map((rCol, rIdx) => {
          const b = branchMap.get(String(rCol.branchCode));
          const food = b ? b.food : 0;
          const beverage = b ? b.beverage : 0;
          const other = b ? b.other : 0;
          const total = b ? b.total : 0;

          const isEvenRest = rIdx % 2 === 0;
          const subBg = isEvenRest
            ? 'bg-rose-50/35 dark:bg-rose-950/15'
            : 'bg-rose-100/55 dark:bg-rose-900/30';
          const totBg = isEvenRest
            ? 'bg-rose-200/75 dark:bg-rose-500/25'
            : 'bg-rose-200/90 dark:bg-rose-500/35';

          return (
            <React.Fragment key={`cell_${rowKey}_${rCol.branchCode}`}>
              <td className={`px-4 py-3.5 text-left font-mono text-[15px] font-semibold tabular-nums whitespace-nowrap min-w-[115px] border-e border-slate-200/50 dark:border-zinc-800/50 text-slate-700 dark:text-zinc-300 ${subBg}`}>
                {fmt(food)}
              </td>
              <td className={`px-4 py-3.5 text-left font-mono text-[15px] font-semibold tabular-nums whitespace-nowrap min-w-[115px] border-e border-slate-200/50 dark:border-zinc-800/50 text-slate-700 dark:text-zinc-300 ${subBg}`}>
                {fmt(beverage)}
              </td>
              <td className={`px-4 py-3.5 text-left font-mono text-[15px] font-semibold tabular-nums whitespace-nowrap min-w-[115px] border-e border-slate-200/50 dark:border-zinc-800/50 text-slate-700 dark:text-zinc-300 ${subBg}`}>
                {fmt(other)}
              </td>
              <td className={`px-4 py-3.5 text-left font-mono text-base font-bold tabular-nums whitespace-nowrap min-w-[130px] border-e-2 border-rose-300 dark:border-rose-700 text-rose-950 dark:text-rose-100 ${totBg}`}>
                {fmt(total)}
              </td>
            </React.Fragment>
          );
        })}

        {/* Row Grand Total */}
        <td className="px-4 py-3.5 text-left font-mono text-[17px] font-extrabold tabular-nums whitespace-nowrap min-w-[145px] bg-rose-600/20 text-rose-950 dark:text-white dark:bg-rose-500/35 border-e-2 border-rose-400/60 dark:border-rose-600/60">
          {fmt(rowTotal)}
        </td>

        {/* Payment Methods */}
        {calcMode !== 'vat' && (
          <>
            <td className="px-4 py-3.5 text-left font-mono text-base font-bold tabular-nums whitespace-nowrap min-w-[125px] bg-emerald-50/80 text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-300 border-e border-slate-200 dark:border-zinc-800">
              {fmt(rowCash)}
            </td>
            <td className="px-4 py-3.5 text-left font-mono text-base font-bold tabular-nums whitespace-nowrap min-w-[125px] bg-blue-50/80 text-blue-900 dark:bg-blue-500/15 dark:text-blue-300 border-e border-slate-200 dark:border-zinc-800">
              {fmt(rowVisa)}
            </td>
            <td className="px-4 py-3.5 text-left font-mono text-base font-bold tabular-nums whitespace-nowrap min-w-[125px] bg-amber-50/80 text-amber-900 dark:bg-amber-500/15 dark:text-amber-300">
              {fmt(rowCL)}
            </td>
          </>
        )}
      </tr>
    );
  };

  if (effectiveGranularity === 'summary') {
    const sumBranches = restaurantData.summaryBranches;
    const sumTot = sumBranches.reduce((s, b) => s + b.total, 0);
    const sumCash = sumBranches.reduce((s, b) => s + b.cash, 0);
    const sumVisa = sumBranches.reduce((s, b) => s + b.visa, 0);
    const sumCL = sumBranches.reduce((s, b) => s + b.cl, 0);

    return (
      <>
        {renderFlatRow(
          'summary_row',
          'إجمالي الفترة',
          sumBranches,
          sumTot,
          sumCash,
          sumVisa,
          sumCL,
          true
        )}
      </>
    );
  }

  if (effectiveGranularity === 'month') {
    if (restaurantData.monthGroups.length === 0) {
      return (
        <tr>
          <td colSpan={totalTableCols} className="py-12 text-center text-slate-500 text-sm font-sans font-medium">
            لا توجد بيانات شهرية للفترة المحددة
          </td>
        </tr>
      );
    }

    return (
      <>
        {restaurantData.monthGroups.map((m, idx) =>
          renderFlatRow(
            m.monthKey,
            m.monthLabel,
            m.branches,
            m.total,
            m.cash,
            m.visa,
            m.cl,
            idx % 2 === 0
          )
        )}
      </>
    );
  }

  // Day Granularity
  if (paginatedDayGroups.length === 0) {
    return (
      <tr>
        <td colSpan={totalTableCols} className="py-12 text-center text-slate-500 text-sm font-sans font-medium">
          لا توجد بيانات يومية للفترة المحددة
        </td>
      </tr>
    );
  }

  return (
    <>
      {paginatedDayGroups.map((d, idx) =>
        renderFlatRow(
          d.date,
          d.date,
          d.branches,
          d.total,
          d.cash,
          d.visa,
          d.cl,
          idx % 2 === 0
        )
      )}
    </>
  );
});
