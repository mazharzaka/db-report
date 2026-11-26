'use client';

import React from 'react';
import { Money } from '../charts';
import {
  type MatrixRowData,
  type MatrixColumn,
  type CalcMode,
  MONEY_FORMATTER,
} from './matrixConstants';

export interface MatrixTableRowProps {
  row: MatrixRowData;
  columns: MatrixColumn[];
  calcMode: CalcMode;
  hoverRowClass: string;
  hoverCellClass: string;
  totalRevColClass: string;
  isTwoRowHeader?: boolean;
  sectorType?: number;
}

export const MatrixTableRow = React.memo(function MatrixTableRow({
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

  if (sectorType === 5) {
    const r = row as any;
    const formatCell = (val: number, isCurrency = true) => {
      const hasVal = Math.abs(val) > 0.0001;
      return (
        <span className={hasVal ? 'text-slate-900 dark:text-white font-bold' : 'text-slate-400 dark:text-zinc-600 font-normal opacity-40'}>
          {hasVal ? (isCurrency ? MONEY_FORMATTER.format(val) : val.toLocaleString()) : (isCurrency ? '0.00' : '0')}
        </span>
      );
    };

    return (
      <tr className={`group transition-colors duration-150 ${hoverRowClass}`}>
        {/* Date Column (Sticky Right) */}
        <td className={`sticky right-0 z-10 px-4 py-3.5 text-center font-bold text-sm lg:text-base text-slate-900 border-l border-slate-200 bg-slate-50/95 ${hoverCellClass} dark:border-zinc-800 dark:bg-zinc-900/95 dark:text-zinc-100 transition-colors`}>
          <div className="flex flex-col items-center">
            <span>{row.date}</span>
            {r.hasAdjustment && (
              <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-sans font-bold" title={r.adjustmentNotes}>
                معدّل
              </span>
            )}
          </div>
        </td>

        {/* Silver */}
        <td className={`px-3 py-3 text-center font-mono text-sm border-l border-slate-200/60 dark:border-zinc-800/40 ${hoverCellClass}`}>
          {formatCell(r.silverRev || 0)}
        </td>
        <td className={`px-2 py-3 text-center font-mono text-xs border-l border-slate-200/60 dark:border-zinc-800/40 ${hoverCellClass}`}>
          {formatCell(r.silverSold || 0, false)}
        </td>

        {/* Golden */}
        <td className={`px-3 py-3 text-center font-mono text-sm border-l border-slate-200/60 dark:border-zinc-800/40 ${hoverCellClass}`}>
          {formatCell(r.goldenRev || 0)}
        </td>
        <td className={`px-2 py-3 text-center font-mono text-xs border-l border-slate-200/60 dark:border-zinc-800/40 ${hoverCellClass}`}>
          {formatCell(r.goldenSold || 0, false)}
        </td>

        {/* Silver Combo */}
        <td className={`px-3 py-3 text-center font-mono text-sm border-l border-slate-200/60 dark:border-zinc-800/40 ${hoverCellClass}`}>
          {formatCell(r.silverComboRev || 0)}
        </td>
        <td className={`px-2 py-3 text-center font-mono text-xs border-l border-slate-200/60 dark:border-zinc-800/40 ${hoverCellClass}`}>
          {formatCell(r.silverComboSold || 0, false)}
        </td>

        {/* Family */}
        <td className={`px-3 py-3 text-center font-mono text-sm border-l border-slate-200/60 dark:border-zinc-800/40 ${hoverCellClass}`}>
          {formatCell(r.familyRev || 0)}
        </td>
        <td className={`px-2 py-3 text-center font-mono text-xs border-l border-slate-200/60 dark:border-zinc-800/40 ${hoverCellClass}`}>
          {formatCell(r.familySold || 0, false)}
        </td>

        {/* S&M */}
        <td className={`px-3 py-3 text-center font-mono text-sm border-l border-slate-200/60 dark:border-zinc-800/40 ${hoverCellClass}`}>
          {formatCell(r.smRev || 0)}
        </td>
        <td className={`px-2 py-3 text-center font-mono text-xs border-l border-slate-200/60 dark:border-zinc-800/40 ${hoverCellClass}`}>
          {formatCell(r.smSold || 0, false)}
        </td>
        <td className={`px-2 py-3 text-center font-mono text-xs border-l border-slate-200/60 dark:border-zinc-800/40 ${hoverCellClass} text-emerald-600 dark:text-emerald-400 font-bold`}>
          {formatCell(r.smFree || 0, false)}
        </td>

        {/* Promotion */}
        <td className={`px-3 py-3 text-center font-mono text-sm border-l border-slate-200/60 dark:border-zinc-800/40 ${hoverCellClass}`}>
          {formatCell(r.promoRev || 0)}
        </td>
        <td className={`px-2 py-3 text-center font-mono text-xs border-l border-slate-200/60 dark:border-zinc-800/40 ${hoverCellClass}`}>
          {formatCell(r.promoSold || 0, false)}
        </td>

        {/* B.G Staff */}
        <td className={`px-3 py-3 text-center font-mono text-sm border-l border-slate-200/60 dark:border-zinc-800/40 ${hoverCellClass}`}>
          {formatCell(r.bgRev || 0)}
        </td>
        <td className={`px-2 py-3 text-center font-mono text-xs border-l border-slate-200/60 dark:border-zinc-800/40 ${hoverCellClass}`}>
          {formatCell(r.bgVouchers || (r.bgRev > 0 ? 1 : 0), false)}
        </td>

        {/* TOTAL REV */}
        <td className={`px-4 py-3.5 text-center font-black text-base tabular-nums border-l border-slate-200/60 dark:border-zinc-800/40 ${totalRevColClass} ${hoverCellClass}`}>
          <Money value={r.totalTicketRev || 0} />
        </td>

        {/* TOTAL SOLD */}
        <td className={`px-3 py-3.5 text-center font-black text-sm tabular-nums border-l border-slate-200/60 dark:border-zinc-800/40 ${hoverCellClass} text-slate-900 dark:text-white`}>
          {(r.totalTicketSold || 0).toLocaleString()}
        </td>

        {/* TOTAL FREE */}
        <td className={`px-3 py-3.5 text-center font-black text-sm tabular-nums border-l border-slate-200/60 dark:border-zinc-800/40 ${hoverCellClass} text-emerald-600 dark:text-emerald-400`}>
          {(r.totalFree || 0).toLocaleString()}
        </td>

        {/* G.R.R */}
        <td className={`px-4 py-3.5 text-center font-black text-base tabular-nums border-l border-slate-200/60 dark:border-zinc-800/40 ${hoverCellClass} text-cyan-600 dark:text-cyan-400`}>
          <Money value={r.grr || 0} />
        </td>

        {/* Payments: Cash, Visa, C/L */}
        <td className={`px-3 py-3 text-center font-mono text-sm border-l border-slate-200/60 dark:border-zinc-800/40 ${hoverCellClass}`}>
          {formatCell(r.cash || 0)}
        </td>
        <td className={`px-3 py-3 text-center font-mono text-sm border-l border-slate-200/60 dark:border-zinc-800/40 ${hoverCellClass}`}>
          {formatCell(r.visa || 0)}
        </td>
        <td className={`px-3 py-3 text-center font-mono text-sm border-l border-slate-200/60 dark:border-zinc-800/40 ${hoverCellClass}`}>
          {formatCell(r.cl || 0)}
        </td>

        {/* Actual Taxes */}
        <td className={`px-3 py-3 text-center font-mono text-xs border-l border-slate-200/60 dark:border-zinc-800/40 ${hoverCellClass}`}>
          {formatCell(r.entranceGross || 0)}
        </td>
        <td className={`px-3 py-3 text-center font-mono text-xs border-l border-slate-200/60 dark:border-zinc-800/40 ${hoverCellClass}`}>
          {formatCell(r.theaterGross || 0)}
        </td>
        <td className={`px-3 py-3 text-center font-mono text-xs border-l border-slate-200/60 dark:border-zinc-800/40 ${hoverCellClass}`}>
          {formatCell(r.taftafGross || 0)}
        </td>
        <td className={`px-3 py-3 text-center font-mono text-xs border-l border-slate-200/60 dark:border-zinc-800/40 ${hoverCellClass} text-amber-500 font-bold`}>
          {formatCell(r.totalVat || 0)}
        </td>
        <td className={`px-3 py-3 text-center font-mono text-sm border-l border-slate-200/60 dark:border-zinc-800/40 ${hoverCellClass} font-bold`}>
          {formatCell(r.netRevenue || 0)}
        </td>

        {/* Accounting Standard (53.33 / 26.67 / 20.00) */}
        <td className={`px-3 py-3 text-center font-mono text-xs border-l border-slate-200/60 dark:border-zinc-800/40 ${hoverCellClass}`}>
          {formatCell(r.stdEntranceGross || 0)}
        </td>
        <td className={`px-3 py-3 text-center font-mono text-xs border-l border-slate-200/60 dark:border-zinc-800/40 ${hoverCellClass}`}>
          {formatCell(r.stdTheaterGross || 0)}
        </td>
        <td className={`px-3 py-3 text-center font-mono text-xs ${hoverCellClass}`}>
          {formatCell(r.stdTaftafGross || 0)}
        </td>
      </tr>
    );
  }

  if (sectorType === 6) {
    return (
      <tr className={`group transition-colors duration-150 ${hoverRowClass}`}>
        {/* Date Column (Sticky Right) */}
        <td className={`sticky right-0 z-10 px-4 py-3.5 text-center font-bold text-sm lg:text-base text-slate-900 border-l border-slate-200 bg-slate-50/95 ${hoverCellClass} dark:border-zinc-800 dark:bg-zinc-900/95 dark:text-zinc-100 transition-colors`}>
          {row.date}
        </td>

        {/* Dynamic OTH Columns */}
        {columns.map((col) => {
          const val = row.values[col.branchCode] || 0;
          const hasVal = Math.abs(val) > 0.0001;
          return (
            <td
              key={col.branchCode}
              className={`px-3 py-3.5 text-center font-mono text-sm tabular-nums border-l border-slate-200/60 dark:border-zinc-800/40 ${hoverCellClass} ${hasVal
                ? val < 0
                  ? 'text-rose-600 dark:text-rose-400 font-bold'
                  : 'text-slate-900 dark:text-white font-bold'
                : 'text-slate-400 dark:text-zinc-600 font-normal opacity-40'
                }`}
            >
              {hasVal ? MONEY_FORMATTER.format(val) : <span className="opacity-40 font-normal">0.00</span>}
            </td>
          );
        })}

        {/* 5 Final Summary Columns: Cash, C.L, G.Deposit, Visa, TOTAL */}
        <td className={`px-4 py-3.5 text-left font-bold text-base lg:text-lg tabular-nums bg-slate-50/80 ${hoverCellClass} dark:bg-zinc-800/40 transition-colors border-l border-slate-200/60 dark:border-zinc-800/40 ${Math.abs(row.rowCash) > 0.0001 ? 'text-slate-900 dark:text-white font-bold' : 'text-slate-400 dark:text-zinc-600 font-normal opacity-40'}`}>
          <Money value={row.rowCash} />
        </td>
        <td className={`px-4 py-3.5 text-left font-bold text-base lg:text-lg tabular-nums bg-slate-50/80 ${hoverCellClass} dark:bg-zinc-800/40 transition-colors border-l border-slate-200/60 dark:border-zinc-800/40 ${Math.abs(row.rowCoupons) > 0.0001 ? 'text-slate-900 dark:text-white font-bold' : 'text-slate-400 dark:text-zinc-600 font-normal opacity-40'}`}>
          <Money value={row.rowCoupons} />
        </td>
        <td className={`px-4 py-3.5 text-left font-bold text-base lg:text-lg tabular-nums bg-slate-50/80 ${hoverCellClass} dark:bg-zinc-800/40 transition-colors border-l border-slate-200/60 dark:border-zinc-800/40 ${Math.abs(row.values['g_deposit'] || 0) > 0.0001 ? 'text-slate-900 dark:text-white font-bold' : 'text-slate-400 dark:text-zinc-600 font-normal opacity-40'}`}>
          <Money value={row.values['g_deposit'] || 0} />
        </td>
        <td className={`px-4 py-3.5 text-left font-bold text-base lg:text-lg tabular-nums bg-slate-50/80 ${hoverCellClass} dark:bg-zinc-800/40 transition-colors border-l border-slate-200/60 dark:border-zinc-800/40 ${Math.abs(row.rowVisa) > 0.0001 ? 'text-slate-900 dark:text-white font-bold' : 'text-slate-400 dark:text-zinc-600 font-normal opacity-40'}`}>
          <Money value={row.rowVisa} />
        </td>
        <td className={`px-4 py-3.5 text-left font-black text-base lg:text-lg tabular-nums ${totalRevColClass} ${hoverCellClass} transition-colors ${Math.abs(row.rowTotal) > 0.0001 ? 'text-slate-900 dark:text-white font-black' : 'text-slate-400 dark:text-zinc-600 font-normal opacity-40'}`}>
          <Money value={row.rowTotal} />
        </td>
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
        const val = row.values[col.branchCode] || 0;
        const hasValue = Math.abs(val) > 0.0001;
        return (
          <td
            key={col.branchCode}
            className={`px-4 py-3.5 text-left font-bold text-base lg:text-lg tabular-nums border-l border-slate-200/60 dark:border-zinc-800/40 ${hoverCellClass} transition-colors ${hasValue
              ? val < 0 ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-900 dark:text-white font-bold'
              : 'text-slate-400 dark:text-zinc-600 font-normal opacity-40'
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
      <td className={`px-4 py-3.5 text-left font-black text-base lg:text-lg tabular-nums ${totalRevColClass} ${hoverCellClass} transition-colors ${Math.abs(row.rowTotal) > 0.0001 ? 'text-slate-900 dark:text-white font-black' : 'text-slate-400 dark:text-zinc-600 font-normal opacity-40'}`}>
        <Money value={row.rowTotal} />
      </td>

      {calcMode !== 'vat' && (
        <>
          {/* Daily Cash */}
          <td className={`px-4 py-3.5 text-left font-bold text-base lg:text-lg tabular-nums bg-slate-50/80 ${hoverCellClass} dark:bg-zinc-800/40 transition-colors border-l border-slate-200/60 dark:border-zinc-800/40 ${Math.abs(row.rowCash) > 0.0001 ? 'text-slate-900 dark:text-white font-bold' : 'text-slate-400 dark:text-zinc-600 font-normal opacity-40'}`}>
            <Money value={row.rowCash} />
          </td>

          {/* Daily Visa */}
          <td className={`px-4 py-3.5 text-left font-bold text-base lg:text-lg tabular-nums bg-slate-50/80 ${hoverCellClass} dark:bg-zinc-800/40 transition-colors border-l border-slate-200/60 dark:border-zinc-800/40 ${Math.abs(row.rowVisa) > 0.0001 ? 'text-slate-900 dark:text-white font-bold' : 'text-slate-400 dark:text-zinc-600 font-normal opacity-40'}`}>
            <Money value={row.rowVisa} />
          </td>

          {/* Daily Coupons & CL */}
          <td className={`px-4 py-3.5 text-left font-bold text-base lg:text-lg tabular-nums bg-slate-50/80 ${hoverCellClass} dark:bg-zinc-800/40 transition-colors ${Math.abs(row.rowCoupons) > 0.0001 ? 'text-slate-900 dark:text-white font-bold' : 'text-slate-400 dark:text-zinc-600 font-normal opacity-40'}`}>
            <Money value={row.rowCoupons} />
          </td>
        </>
      )}
    </tr>
  );
});
