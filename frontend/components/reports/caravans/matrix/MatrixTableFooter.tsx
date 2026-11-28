'use client';

import React from 'react';
import {
  type MatrixColumn,
  type CalcMode,
  type RestaurantBranchRow,
  MONEY_FORMATTER,
} from './matrixConstants';

interface MatrixTableFooterProps {
  isRestaurants: boolean;
  sectorType: number;
  columns: MatrixColumn[];
  restaurantColumns?: RestaurantBranchRow[];
  columnTotals: Record<string, number>;
  calcMode: CalcMode;
  grandTotal: number;
  grandCash: number;
  grandVisa: number;
  grandCoupons: number;
  grandFood: number;
  grandBeverage: number;
  grandOther: number;
  gateTotals: any;
  theme: any;
}

export const MatrixTableFooter = React.memo(function MatrixTableFooter({
  isRestaurants,
  sectorType,
  columns,
  restaurantColumns = [],
  columnTotals,
  calcMode,
  grandTotal,
  grandCash,
  grandVisa,
  grandCoupons,
  grandFood,
  grandBeverage,
  grandOther,
  gateTotals,
  theme,
}: MatrixTableFooterProps) {
  return (
    <tfoot className={`sticky bottom-0 z-20 shadow-xl ${theme.solidBg} font-mono tabular-nums tracking-tight !text-white`}>
      {isRestaurants ? (
        <tr className="bg-[#4c0519] !text-white font-bold border-t-2 border-[#881337]">
          {/* Date Cell */}
          <td className="sticky right-0 z-30 px-4 py-4 text-center font-sans text-base font-black border-e border-white/20 bg-[#4c0519] !text-white min-w-[135px] shadow-[1px_0_0_0_rgba(0,0,0,0.2)] whitespace-nowrap">
            الإجمالي العام
          </td>

          {/* Per-Restaurant Totals (Food, Bev, Other, Total) */}
          {restaurantColumns.map((rCol) => (
            <React.Fragment key={`foot_${rCol.branchCode}`}>
              <td className="px-4 py-4 text-left font-mono text-base font-bold min-w-[115px] border-e border-white/10 !text-white bg-[#5c0e24] tabular-nums whitespace-nowrap">
                {MONEY_FORMATTER.format(rCol.food)}
              </td>
              <td className="px-4 py-4 text-left font-mono text-base font-bold min-w-[115px] border-e border-white/10 !text-white bg-[#5c0e24] tabular-nums whitespace-nowrap">
                {MONEY_FORMATTER.format(rCol.beverage)}
              </td>
              <td className="px-4 py-4 text-left font-mono text-base font-bold min-w-[115px] border-e border-white/10 !text-white bg-[#5c0e24] tabular-nums whitespace-nowrap">
                {MONEY_FORMATTER.format(rCol.other)}
              </td>
              <td className="px-4 py-4 text-left font-mono text-base font-black min-w-[130px] border-e-2 border-white/40 !text-white bg-[#881337] tabular-nums whitespace-nowrap">
                {MONEY_FORMATTER.format(rCol.total)}
              </td>
            </React.Fragment>
          ))}

          {/* Grand Total */}
          <td className="px-4 py-4 text-left font-mono text-[17px] font-black min-w-[145px] bg-[#881337] shadow-inner !text-white border-e-2 border-white/40 tabular-nums whitespace-nowrap">
            {MONEY_FORMATTER.format(grandTotal)}
          </td>

          {/* Payments */}
          {calcMode !== 'vat' && (
            <>
              <td className="px-4 py-4 text-left font-mono text-base font-bold min-w-[125px] text-emerald-300 bg-[#4c0519] border-e border-white/10 tabular-nums whitespace-nowrap">
                {MONEY_FORMATTER.format(grandCash)}
              </td>
              <td className="px-4 py-4 text-left font-mono text-base font-bold min-w-[125px] text-blue-300 bg-[#4c0519] border-e border-white/10 tabular-nums whitespace-nowrap">
                {MONEY_FORMATTER.format(grandVisa)}
              </td>
              <td className="px-4 py-4 text-left font-mono text-base font-bold min-w-[125px] text-amber-300 bg-[#4c0519] tabular-nums whitespace-nowrap">
                {MONEY_FORMATTER.format(grandCoupons)}
              </td>
            </>
          )}
        </tr>
      ) : sectorType === 5 ? (
        <tr className="border-t-2 border-[#022c22] bg-[#064e3b] font-mono font-bold text-white shadow-xs">
          <td className="sticky right-0 z-30 px-4 py-4 text-center text-sm font-sans font-black border-l border-white/20 bg-[#064e3b] text-white">
            الإجمالي (TOTAL)
          </td>
          <td className="px-3 py-3 text-center border-l border-white/20 font-mono text-sm">{gateTotals?.silverRev ? MONEY_FORMATTER.format(gateTotals.silverRev) : '0.00'}</td>
          <td className="px-2 py-3 text-center border-l border-white/20 font-mono text-xs">{gateTotals?.silverSold?.toLocaleString() || '0'}</td>
          <td className="px-3 py-3 text-center border-l border-white/20 font-mono text-sm">{gateTotals?.goldenRev ? MONEY_FORMATTER.format(gateTotals.goldenRev) : '0.00'}</td>
          <td className="px-2 py-3 text-center border-l border-white/20 font-mono text-xs">{gateTotals?.goldenSold?.toLocaleString() || '0'}</td>
          <td className="px-3 py-3 text-center border-l border-white/20 font-mono text-sm">{gateTotals?.silverComboRev ? MONEY_FORMATTER.format(gateTotals.silverComboRev) : '0.00'}</td>
          <td className="px-2 py-3 text-center border-l border-white/20 font-mono text-xs">{gateTotals?.silverComboSold?.toLocaleString() || '0'}</td>
          <td className="px-3 py-3 text-center border-l border-white/20 font-mono text-sm">{gateTotals?.familyRev ? MONEY_FORMATTER.format(gateTotals.familyRev) : '0.00'}</td>
          <td className="px-2 py-3 text-center border-l border-white/20 font-mono text-xs">{gateTotals?.familySold?.toLocaleString() || '0'}</td>
          <td className="px-3 py-3 text-center border-l border-white/20 font-mono text-sm">{gateTotals?.smRev ? MONEY_FORMATTER.format(gateTotals.smRev) : '0.00'}</td>
          <td className="px-2 py-3 text-center border-l border-white/20 font-mono text-xs">{gateTotals?.smSold?.toLocaleString() || '0'}</td>
          <td className="px-2 py-3 text-center border-l border-white/20 font-mono text-xs text-emerald-300">{gateTotals?.smFree?.toLocaleString() || '0'}</td>
          <td className="px-3 py-3 text-center border-l border-white/20 font-mono text-sm">{gateTotals?.promoRev ? MONEY_FORMATTER.format(gateTotals.promoRev) : '0.00'}</td>
          <td className="px-2 py-3 text-center border-l border-white/20 font-mono text-xs">{gateTotals?.promoSold?.toLocaleString() || '0'}</td>
          <td className="px-3 py-3 text-center border-l border-white/20 font-mono text-sm">{gateTotals?.bgRev ? MONEY_FORMATTER.format(gateTotals.bgRev) : '0.00'}</td>
          <td className="px-2 py-3 text-center border-l border-white/20 font-mono text-xs">{gateTotals?.bgVouchers?.toLocaleString() || '0'}</td>
          <td className="px-4 py-3 text-center border-l border-white/20 font-mono text-base font-black bg-[#022c22]">{gateTotals?.totalTicketRev ? MONEY_FORMATTER.format(gateTotals.totalTicketRev) : '0.00'}</td>
          <td className="px-3 py-3 text-center border-l border-white/20 font-mono text-sm font-black">{gateTotals?.totalTicketSold?.toLocaleString() || '0'}</td>
          <td className="px-3 py-3 text-center border-l border-white/20 font-mono text-sm font-black text-emerald-300">{gateTotals?.totalFree?.toLocaleString() || '0'}</td>
          <td className="px-4 py-3 text-center border-l border-white/20 font-mono text-base font-black text-cyan-300">{gateTotals?.grr ? MONEY_FORMATTER.format(gateTotals.grr) : '0.00'}</td>
          <td className="px-3 py-3 text-center border-l border-white/20 font-mono text-sm">{gateTotals?.cash ? MONEY_FORMATTER.format(gateTotals.cash) : '0.00'}</td>
          <td className="px-3 py-3 text-center border-l border-white/20 font-mono text-sm">{gateTotals?.visa ? MONEY_FORMATTER.format(gateTotals.visa) : '0.00'}</td>
          <td className="px-3 py-3 text-center border-l border-white/20 font-mono text-sm">{gateTotals?.cl ? MONEY_FORMATTER.format(gateTotals.cl) : '0.00'}</td>
          <td className="px-3 py-3 text-center border-l border-white/20 font-mono text-xs">{gateTotals?.entranceGross ? MONEY_FORMATTER.format(gateTotals.entranceGross) : '0.00'}</td>
          <td className="px-3 py-3 text-center border-l border-white/20 font-mono text-xs">{gateTotals?.theaterGross ? MONEY_FORMATTER.format(gateTotals.theaterGross) : '0.00'}</td>
          <td className="px-3 py-3 text-center border-l border-white/20 font-mono text-xs">{gateTotals?.taftafGross ? MONEY_FORMATTER.format(gateTotals.taftafGross) : '0.00'}</td>
          <td className="px-3 py-3 text-center border-l border-white/20 font-mono text-xs text-amber-300 font-bold">{gateTotals?.totalVat ? MONEY_FORMATTER.format(gateTotals.totalVat) : '0.00'}</td>
          <td className="px-3 py-3 text-center border-l border-white/20 font-mono text-sm font-bold">{gateTotals?.netRevenue ? MONEY_FORMATTER.format(gateTotals.netRevenue) : '0.00'}</td>
          <td className="px-3 py-3 text-center border-l border-white/20 font-mono text-xs">{gateTotals?.stdEntranceGross ? MONEY_FORMATTER.format(gateTotals.stdEntranceGross) : '0.00'}</td>
          <td className="px-3 py-3 text-center border-l border-white/20 font-mono text-xs">{gateTotals?.stdTheaterGross ? MONEY_FORMATTER.format(gateTotals.stdTheaterGross) : '0.00'}</td>
          <td className="px-3 py-3 text-center font-mono text-xs">{gateTotals?.stdTaftafGross ? MONEY_FORMATTER.format(gateTotals.stdTaftafGross) : '0.00'}</td>
        </tr>
      ) : sectorType === 6 ? (
        <tr className="bg-[#0f172a] !text-white font-bold">
          <td className="sticky right-0 z-30 px-4 py-4 text-center font-sans text-sm lg:text-base font-black border-l border-white/20 bg-[#0f172a] !text-white">
            الإجمالي
          </td>
          {columns.map((col) => {
            const total = columnTotals[col.branchCode] || 0;
            return (
              <td key={col.branchCode} className="px-3 py-4 text-center font-mono text-sm border-l border-white/20 !text-white bg-[#0f172a]">
                {MONEY_FORMATTER.format(total)}
              </td>
            );
          })}
          <td className="px-4 py-4 text-left text-base font-bold border-l border-white/20 !text-white bg-[#0f172a]">{MONEY_FORMATTER.format(grandCash)}</td>
          <td className="px-4 py-4 text-left text-base font-bold border-l border-white/20 !text-white bg-[#0f172a]">{MONEY_FORMATTER.format(grandCoupons)}</td>
          <td className="px-4 py-4 text-left text-base font-bold border-l border-white/20 !text-white bg-[#0f172a]">{MONEY_FORMATTER.format(columnTotals['g_deposit'] || 0)}</td>
          <td className="px-4 py-4 text-left text-base font-bold border-l border-white/20 !text-white bg-[#0f172a]">{MONEY_FORMATTER.format(grandVisa)}</td>
          <td className="px-4 py-4 text-left text-lg lg:text-xl font-black !text-white bg-slate-800">{MONEY_FORMATTER.format(grandTotal)}</td>
        </tr>
      ) : (
        <tr className={`${theme.solidBg} !text-white font-bold`}>
          <td className={`sticky right-0 z-30 px-4 py-4 text-center font-sans text-sm lg:text-base font-black border-l border-white/20 ${theme.solidBg} !text-white`}>
            الإجمالي
          </td>
          {columns.map((col) => {
            const total = columnTotals[col.branchCode] || 0;
            return (
              <td key={col.branchCode} className={`px-4 py-4 text-left font-black text-base lg:text-lg border-l border-white/20 !text-white ${theme.solidBg}`}>
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
  );
});
