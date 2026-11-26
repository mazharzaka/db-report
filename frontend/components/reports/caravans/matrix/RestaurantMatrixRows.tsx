'use client';

import React from 'react';
import { ChevronDown, ChevronLeft } from 'lucide-react';
import { fmtMoney } from '../charts';
import type { RestaurantBranchRow, CalcMode } from './matrixConstants';

interface RestaurantMatrixRowsProps {
  effectiveGranularity: 'summary' | 'month' | 'day';
  restaurantData: {
    summaryBranches: RestaurantBranchRow[];
    monthGroups: { monthKey: string; monthLabel: string; food: number; beverage: number; other: number; total: number; cash: number; visa: number; cl: number; branches: RestaurantBranchRow[] }[];
    dayGroups: { date: string; food: number; beverage: number; other: number; total: number; cash: number; visa: number; cl: number; branches: RestaurantBranchRow[] }[];
  } | null;
  paginatedDayGroups: { date: string; food: number; beverage: number; other: number; total: number; cash: number; visa: number; cl: number; branches: RestaurantBranchRow[] }[];
  expandedMonths: Set<string>;
  expandedDays: Set<string>;
  allDaysExpanded: boolean;
  handleToggleMonth: (monthKey: string) => void;
  handleToggleDay: (date: string) => void;
  totalTableCols: number;
  calcMode: CalcMode;
}

export const RestaurantMatrixRows = React.memo(function RestaurantMatrixRows({
  effectiveGranularity,
  restaurantData,
  paginatedDayGroups,
  expandedMonths,
  expandedDays,
  allDaysExpanded,
  handleToggleMonth,
  handleToggleDay,
  totalTableCols,
  calcMode,
}: RestaurantMatrixRowsProps) {
  if (effectiveGranularity === 'summary') {
    if (!restaurantData || restaurantData.summaryBranches.length === 0) {
      return (
        <tr>
          <td colSpan={totalTableCols} className="py-12 text-center text-slate-500 text-sm font-sans font-medium">
            لا توجد بيانات مطاعم للفترة المحددة
          </td>
        </tr>
      );
    }

    return (
      <>
        {restaurantData.summaryBranches.map((b, idx) => (
          <tr
            key={b.branchCode}
            className={`border-b border-slate-200/80 transition-colors ${idx % 2 === 1 ? 'bg-slate-50/70 dark:bg-zinc-800/40' : 'bg-white dark:bg-zinc-900'} hover:bg-rose-50/40 dark:hover:bg-rose-950/20`}
          >
            <td className="sticky right-0 z-10 px-4 py-3 font-sans text-sm font-bold text-slate-800 dark:text-zinc-200 border-l border-slate-200 dark:border-zinc-800 bg-inherit whitespace-nowrap">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 dark:bg-zinc-800 text-xs font-mono text-slate-600 dark:text-zinc-400">
                  {b.branchCode}
                </span>
                <span>{b.displayName}</span>
              </div>
            </td>
            <td className="px-4 py-3 text-left border-l border-slate-200/60 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 font-mono">{fmtMoney(b.food)}</td>
            <td className="px-4 py-3 text-left border-l border-slate-200/60 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 font-mono">{fmtMoney(b.beverage)}</td>
            <td className="px-4 py-3 text-left border-l border-slate-200/60 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 font-mono">{fmtMoney(b.other)}</td>
            <td className="px-4 py-3 text-left border-l border-slate-200/60 dark:border-zinc-800 font-black text-rose-700 dark:text-rose-400 font-mono">{fmtMoney(b.total)}</td>
            {calcMode !== 'vat' && (
              <>
                <td className="px-4 py-3 text-left border-l border-slate-200/60 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 font-mono">{fmtMoney(b.cash)}</td>
                <td className="px-4 py-3 text-left border-l border-slate-200/60 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 font-mono">{fmtMoney(b.visa)}</td>
                <td className="px-4 py-3 text-left text-slate-700 dark:text-zinc-300 font-mono">{fmtMoney(b.cl)}</td>
              </>
            )}
          </tr>
        ))}
      </>
    );
  }

  if (effectiveGranularity === 'month') {
    if (!restaurantData || restaurantData.monthGroups.length === 0) {
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
        {restaurantData.monthGroups.map((m) => {
          const isExpanded = expandedMonths.has(m.monthKey);
          return (
            <React.Fragment key={m.monthKey}>
              <tr
                onClick={() => handleToggleMonth(m.monthKey)}
                className="border-b border-rose-200 bg-rose-50/80 dark:bg-rose-950/40 dark:border-rose-900/40 cursor-pointer font-bold text-slate-900 dark:text-white hover:bg-rose-100/70"
              >
                <td className="sticky right-0 z-10 px-4 py-3 font-sans text-sm font-black border-l border-rose-200 dark:border-rose-900/40 bg-inherit whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    {isExpanded ? <ChevronDown className="h-4 w-4 text-rose-700" /> : <ChevronLeft className="h-4 w-4 text-rose-700" />}
                    <span>{m.monthLabel}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-left border-l border-rose-200 dark:border-rose-900/40">{fmtMoney(m.food)}</td>
                <td className="px-4 py-3 text-left border-l border-rose-200 dark:border-rose-900/40">{fmtMoney(m.beverage)}</td>
                <td className="px-4 py-3 text-left border-l border-rose-200 dark:border-rose-900/40">{fmtMoney(m.other)}</td>
                <td className="px-4 py-3 text-left border-l border-rose-200 dark:border-rose-900/40 font-black text-rose-700 dark:text-rose-400">{fmtMoney(m.total)}</td>
                {calcMode !== 'vat' && (
                  <>
                    <td className="px-4 py-3 text-left border-l border-rose-200 dark:border-rose-900/40">{fmtMoney(m.cash)}</td>
                    <td className="px-4 py-3 text-left border-l border-rose-200 dark:border-rose-900/40">{fmtMoney(m.visa)}</td>
                    <td className="px-4 py-3 text-left">{fmtMoney(m.cl)}</td>
                  </>
                )}
              </tr>
              {isExpanded &&
                m.branches.map((b) => (
                  <tr key={`${m.monthKey}_${b.branchCode}`} className="border-b border-slate-100 bg-white dark:bg-zinc-900 hover:bg-slate-50 text-xs">
                    <td className="sticky right-0 z-10 pr-9 pl-4 py-2 text-slate-700 dark:text-zinc-300 border-l border-slate-200 bg-inherit whitespace-nowrap">
                      {b.displayName}
                    </td>
                    <td className="px-4 py-2 text-left border-l border-slate-100">{fmtMoney(b.food)}</td>
                    <td className="px-4 py-2 text-left border-l border-slate-100">{fmtMoney(b.beverage)}</td>
                    <td className="px-4 py-2 text-left border-l border-slate-100">{fmtMoney(b.other)}</td>
                    <td className="px-4 py-2 text-left border-l border-slate-100 font-bold text-rose-700">{fmtMoney(b.total)}</td>
                    {calcMode !== 'vat' && (
                      <>
                        <td className="px-4 py-2 text-left border-l border-slate-100">{fmtMoney(b.cash)}</td>
                        <td className="px-4 py-2 text-left border-l border-slate-100">{fmtMoney(b.visa)}</td>
                        <td className="px-4 py-2 text-left">{fmtMoney(b.cl)}</td>
                      </>
                    )}
                  </tr>
                ))}
            </React.Fragment>
          );
        })}
      </>
    );
  }

  // Day Granularity
  if (!restaurantData || paginatedDayGroups.length === 0) {
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
      {paginatedDayGroups.map((d) => {
        const isExpanded = expandedDays.has(d.date) || allDaysExpanded;
        return (
          <React.Fragment key={d.date}>
            <tr
              onClick={() => handleToggleDay(d.date)}
              className="border-b border-rose-200 bg-rose-50/70 dark:bg-rose-950/30 cursor-pointer font-bold text-slate-900 dark:text-white hover:bg-rose-100/60"
            >
              <td className="sticky right-0 z-10 px-4 py-3 font-sans text-sm font-black border-l border-rose-200 dark:border-rose-900/40 bg-inherit whitespace-nowrap">
                <div className="flex items-center gap-2">
                  {isExpanded ? <ChevronDown className="h-4 w-4 text-rose-700" /> : <ChevronLeft className="h-4 w-4 text-rose-700" />}
                  <span>{d.date}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-left border-l border-rose-200">{fmtMoney(d.food)}</td>
              <td className="px-4 py-3 text-left border-l border-rose-200">{fmtMoney(d.beverage)}</td>
              <td className="px-4 py-3 text-left border-l border-rose-200">{fmtMoney(d.other)}</td>
              <td className="px-4 py-3 text-left border-l border-rose-200 font-black text-rose-700">{fmtMoney(d.total)}</td>
              {calcMode !== 'vat' && (
                <>
                  <td className="px-4 py-3 text-left border-l border-rose-200">{fmtMoney(d.cash)}</td>
                  <td className="px-4 py-3 text-left border-l border-rose-200">{fmtMoney(d.visa)}</td>
                  <td className="px-4 py-3 text-left">{fmtMoney(d.cl)}</td>
                </>
              )}
            </tr>
            {isExpanded &&
              d.branches.map((b) => (
                <tr key={`${d.date}_${b.branchCode}`} className="border-b border-slate-100 bg-white dark:bg-zinc-900 hover:bg-slate-50 text-xs">
                  <td className="sticky right-0 z-10 pr-9 pl-4 py-2 text-slate-700 dark:text-zinc-300 border-l border-slate-200 bg-inherit whitespace-nowrap">
                    {b.displayName}
                  </td>
                  <td className="px-4 py-2 text-left border-l border-slate-100">{fmtMoney(b.food)}</td>
                  <td className="px-4 py-2 text-left border-l border-slate-100">{fmtMoney(b.beverage)}</td>
                  <td className="px-4 py-2 text-left border-l border-slate-100">{fmtMoney(b.other)}</td>
                  <td className="px-4 py-2 text-left border-l border-slate-100 font-bold text-rose-700">{fmtMoney(b.total)}</td>
                  {calcMode !== 'vat' && (
                    <>
                      <td className="px-4 py-2 text-left border-l border-slate-100">{fmtMoney(b.cash)}</td>
                      <td className="px-4 py-2 text-left border-l border-slate-100">{fmtMoney(b.visa)}</td>
                      <td className="px-4 py-2 text-left">{fmtMoney(b.cl)}</td>
                    </>
                  )}
                </tr>
              ))}
          </React.Fragment>
        );
      })}
    </>
  );
});
