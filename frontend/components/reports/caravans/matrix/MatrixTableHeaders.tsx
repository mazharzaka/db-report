'use client';

import React from 'react';
import { Calendar, Store } from 'lucide-react';
import {
  type MatrixColumn,
  type CalcMode,
  type OthColumnDef,
  type RestaurantBranchRow,
} from './matrixConstants';

interface MatrixTableHeadersProps {
  isRestaurants: boolean;
  sectorType: number;
  effectiveGranularity: 'summary' | 'month' | 'day';
  calcMode: CalcMode;
  columns: MatrixColumn[];
  restaurantColumns?: RestaurantBranchRow[];
  othHeaderGroups: {
    parentHeader: string | null;
    colSpan: number;
    subColumns: OthColumnDef[];
  }[];
  isTwoRowHeader: boolean;
  theme: any;
}

export const MatrixTableHeaders = React.memo(function MatrixTableHeaders({
  isRestaurants,
  sectorType,
  effectiveGranularity,
  calcMode,
  columns,
  restaurantColumns = [],
  othHeaderGroups,
  isTwoRowHeader,
  theme,
}: MatrixTableHeadersProps) {
  if (isRestaurants) {
    return (
      <thead>
        <tr className="bg-[#881337] text-white border-b border-[#70102e] sticky top-0 z-20 shadow-xs">
          <th
            rowSpan={2}
            className="sticky right-0 z-30 px-4 py-3.5 font-bold text-base text-center min-w-[135px] bg-[#881337] text-white border-e-2 border-rose-400/60 shadow-[1px_0_0_0_rgba(0,0,0,0.1)] whitespace-nowrap"
          >
            <div className="flex items-center justify-center gap-2">
              <Calendar className="h-4 w-4 text-white/80" />
              <span>
                {effectiveGranularity === 'summary'
                  ? 'الفترة'
                  : effectiveGranularity === 'month'
                    ? 'الشهر'
                    : 'التاريخ'}
              </span>
            </div>
          </th>

          {restaurantColumns.map((rCol, rIdx) => {
            const isEven = rIdx % 2 === 0;
            return (
              <th
                key={rCol.branchCode}
                colSpan={4}
                className={`px-4 py-3.5 text-center font-bold text-base tracking-wide border-e-2 border-rose-300 dark:border-rose-700 whitespace-nowrap ${
                  isEven ? 'bg-rose-600 text-white' : 'bg-rose-800 text-white'
                }`}
              >
                {rCol.displayName || rCol.name}
              </th>
            );
          })}

          <th
            rowSpan={2}
            className="px-4 py-3.5 text-center font-extrabold text-base min-w-[145px] text-white bg-[#4c0519] border-e-2 border-rose-900 whitespace-nowrap"
          >
            Grand Total
          </th>

          {calcMode !== 'vat' && (
            <th
              colSpan={3}
              className="px-4 py-3.5 text-center font-bold text-base tracking-wide bg-[#70102e] text-white whitespace-nowrap border-e border-[#580c24]"
            >
              Payment Methods
            </th>
          )}
        </tr>

        <tr className="sticky top-[48px] z-20 shadow-xs text-sm font-bold border-b border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900">
          {restaurantColumns.map((rCol, rIdx) => {
            const isEven = rIdx % 2 === 0;
            const subBg = isEven
              ? 'bg-rose-50 text-rose-900 dark:bg-rose-950/35 dark:text-rose-200'
              : 'bg-rose-100/90 text-rose-950 dark:bg-rose-900/50 dark:text-rose-100';
            const totBg = isEven
              ? 'bg-rose-200/75 text-rose-950 dark:bg-rose-500/25 dark:text-rose-100'
              : 'bg-rose-200/90 text-rose-950 dark:bg-rose-500/35 dark:text-rose-100';

            return (
              <React.Fragment key={`sub_${rCol.branchCode}`}>
                <th className={`px-3.5 py-3 text-center min-w-[115px] border-e border-slate-200/60 dark:border-zinc-800 ${subBg}`}>
                  Food
                </th>
                <th className={`px-3.5 py-3 text-center min-w-[115px] border-e border-slate-200/60 dark:border-zinc-800 ${subBg}`}>
                  Bev
                </th>
                <th className={`px-3.5 py-3 text-center min-w-[115px] border-e border-slate-200/60 dark:border-zinc-800 ${subBg}`}>
                  Other
                </th>
                <th className={`px-3.5 py-3 text-center min-w-[130px] border-e-2 border-rose-300 dark:border-rose-700 font-extrabold ${totBg}`}>
                  Total
                </th>
              </React.Fragment>
            );
          })}

          {calcMode !== 'vat' && (
            <>
              <th className="px-3.5 py-3 text-center min-w-[125px] text-emerald-900 dark:text-emerald-300 bg-emerald-50/90 dark:bg-emerald-950/50 border-e border-slate-200 dark:border-zinc-800">
                Cash
              </th>
              <th className="px-3.5 py-3 text-center min-w-[125px] text-blue-900 dark:text-blue-300 bg-blue-50/90 dark:bg-blue-950/50 border-e border-slate-200 dark:border-zinc-800">
                Visa
              </th>
              <th className="px-3.5 py-3 text-center min-w-[125px] text-amber-900 dark:text-amber-300 bg-amber-50/90 dark:bg-amber-950/50">
                C.L
              </th>
            </>
          )}
        </tr>
      </thead>
    );
  }

  if (sectorType === 5) {
    return (
      <thead>
        <tr className="bg-[#064e3b] text-white border-b border-[#022c22] sticky top-0 z-20 shadow-xs">
          <th
            rowSpan={2}
            className="sticky right-0 z-30 px-4 py-4 font-black text-center align-middle border-l border-white/20 min-w-[140px] bg-[#064e3b] text-white"
          >
            <div className="flex items-center justify-center gap-2">
              <Calendar className="h-4 w-4 text-white/80" />
              <span className="font-bold text-sm text-white">التاريخ</span>
            </div>
          </th>
          <th colSpan={2} className="px-3 py-2.5 text-center align-middle border-l border-white/20 font-black text-sm tracking-wide bg-[#064e3b] text-white">Silver</th>
          <th colSpan={2} className="px-3 py-2.5 text-center align-middle border-l border-white/20 font-black text-sm tracking-wide bg-[#064e3b] text-white">Golden</th>
          <th colSpan={2} className="px-3 py-2.5 text-center align-middle border-l border-white/20 font-black text-sm tracking-wide bg-[#064e3b] text-white">Silver Combo</th>
          <th colSpan={2} className="px-3 py-2.5 text-center align-middle border-l border-white/20 font-black text-sm tracking-wide bg-[#064e3b] text-white">Family</th>
          <th colSpan={3} className="px-3 py-2.5 text-center align-middle border-l border-white/20 font-black text-sm tracking-wide bg-[#064e3b] text-white">S&amp;M</th>
          <th colSpan={2} className="px-3 py-2.5 text-center align-middle border-l border-white/20 font-black text-sm tracking-wide bg-[#064e3b] text-white">Promotion</th>
          <th colSpan={2} className="px-3 py-2.5 text-center align-middle border-l border-white/20 font-black text-sm tracking-wide bg-[#064e3b] text-white">B.G</th>
          <th rowSpan={2} className="px-4 py-4 font-black text-center align-middle min-w-[150px] text-sm text-white bg-[#022c22] border-l border-white/20">TOTAL REV</th>
          <th rowSpan={2} className="px-3 py-4 font-black text-center align-middle min-w-[100px] text-sm text-white bg-[#064e3b] border-l border-white/20">TOTAL SOLD</th>
          <th rowSpan={2} className="px-3 py-4 font-black text-center align-middle min-w-[100px] text-sm text-emerald-300 bg-[#064e3b] border-l border-white/20">TOTAL FREE</th>
          <th rowSpan={2} className="px-4 py-4 font-black text-center align-middle min-w-[150px] text-sm text-cyan-300 bg-[#064e3b] border-l border-white/20">G.R.R</th>
          <th colSpan={3} className="px-3 py-2.5 text-center align-middle border-l border-white/20 font-black text-sm tracking-wide bg-[#064e3b] text-white">طرق السداد (Payments)</th>
          <th colSpan={5} className="px-3 py-2.5 text-center align-middle border-l border-white/20 font-black text-sm tracking-wide bg-[#064e3b] text-white">الضريبة الفعلية (Actual VAT)</th>
          <th colSpan={3} className="px-3 py-2.5 text-center align-middle font-black text-sm tracking-wide bg-[#064e3b] text-white">المعيار المحاسبي (Standard Split)</th>
        </tr>
        <tr className="bg-[#043427] text-white border-b border-[#022c22] sticky top-[48px] z-20 shadow-xs text-xs font-bold">
          <th className="px-3 py-2 text-center border-l border-white/20 min-w-[110px]">قيمة</th>
          <th className="px-2 py-2 text-center border-l border-white/20 min-w-[70px]">تذاكر</th>
          <th className="px-3 py-2 text-center border-l border-white/20 min-w-[110px]">قيمة</th>
          <th className="px-2 py-2 text-center border-l border-white/20 min-w-[70px]">تذاكر</th>
          <th className="px-3 py-2 text-center border-l border-white/20 min-w-[110px]">قيمة</th>
          <th className="px-2 py-2 text-center border-l border-white/20 min-w-[70px]">تذاكر</th>
          <th className="px-3 py-2 text-center border-l border-white/20 min-w-[110px]">قيمة</th>
          <th className="px-2 py-2 text-center border-l border-white/20 min-w-[70px]">تذاكر</th>
          <th className="px-3 py-2 text-center border-l border-white/20 min-w-[110px]">قيمة</th>
          <th className="px-2 py-2 text-center border-l border-white/20 min-w-[70px]">تذاكر</th>
          <th className="px-2 py-2 text-center border-l border-white/20 min-w-[70px] text-emerald-300">مجاني</th>
          <th className="px-3 py-2 text-center border-l border-white/20 min-w-[110px]">قيمة</th>
          <th className="px-2 py-2 text-center border-l border-white/20 min-w-[70px]">تذاكر</th>
          <th className="px-3 py-2 text-center border-l border-white/20 min-w-[110px]">قيمة</th>
          <th className="px-2 py-2 text-center border-l border-white/20 min-w-[70px]">دفاتر</th>
          <th className="px-3 py-2 text-center border-l border-white/20 min-w-[100px]">Cash</th>
          <th className="px-3 py-2 text-center border-l border-white/20 min-w-[100px]">Visa</th>
          <th className="px-3 py-2 text-center border-l border-white/20 min-w-[100px]">C/L</th>
          <th className="px-3 py-2 text-center border-l border-white/20 min-w-[90px]">دخول (14%)</th>
          <th className="px-3 py-2 text-center border-l border-white/20 min-w-[90px]">ملاهي (5%)</th>
          <th className="px-3 py-2 text-center border-l border-white/20 min-w-[80px]">طفطف (0%)</th>
          <th className="px-3 py-2 text-center border-l border-white/20 min-w-[100px] text-amber-300">إجمالي الضريبة</th>
          <th className="px-3 py-2 text-center border-l border-white/20 min-w-[110px]">صافي الإيراد</th>
          <th className="px-3 py-2 text-center border-l border-white/20 min-w-[100px]">دخول 53.33%</th>
          <th className="px-3 py-2 text-center border-l border-white/20 min-w-[100px]">ملاهي 26.67%</th>
          <th className="px-3 py-2 text-center min-w-[100px]">طفطف 20.00%</th>
        </tr>
      </thead>
    );
  }

  if (sectorType === 6) {
    return (
      <thead>
        <tr className="bg-[#0f172a] text-white border-b border-slate-700 sticky top-0 z-20 shadow-xs">
          <th
            rowSpan={isTwoRowHeader ? 2 : 1}
            className="sticky right-0 z-30 px-4 py-4 font-black text-center align-middle border-l border-white/20 min-w-[140px] bg-[#0f172a] text-white"
          >
            <div className="flex items-center justify-center gap-2">
              <Calendar className="h-4 w-4 text-white/80" />
              <span className="font-bold text-sm text-white">التاريخ</span>
            </div>
          </th>
          {othHeaderGroups.map((grp, idx) =>
            grp.parentHeader ? (
              <th
                key={idx}
                colSpan={grp.colSpan}
                className="px-3 py-2.5 text-center align-middle border-l border-white/20 font-black text-sm tracking-wide bg-[#1e293b] text-white"
              >
                {grp.parentHeader}
              </th>
            ) : (
              <th
                key={idx}
                rowSpan={2}
                className="px-4 py-4 font-black text-center align-middle min-w-[110px] text-sm text-white border-l border-white/20 bg-[#0f172a]"
              >
                {grp.subColumns[0].header}
              </th>
            )
          )}
          <th colSpan={5} className="px-3 py-2.5 text-center align-middle font-black text-sm tracking-wide bg-[#1e293b] text-white">
            ملخص التحصيل والإجمالي (Summary &amp; Total)
          </th>
        </tr>
        <tr className="bg-[#1e293b] text-white border-b border-slate-700 sticky top-[48px] z-20 shadow-xs text-xs font-bold">
          {othHeaderGroups.map((grp) =>
            grp.parentHeader ? (
              grp.subColumns.map((sub) => (
                <th key={sub.id} className="px-3 py-2 text-center border-l border-white/20 min-w-[110px]">
                  {sub.header}
                </th>
              ))
            ) : null
          )}
          <th className="px-4 py-2 text-left border-l border-white/20 min-w-[130px]">Cash</th>
          <th className="px-4 py-2 text-left border-l border-white/20 min-w-[130px]">C.L</th>
          <th className="px-4 py-2 text-left border-l border-white/20 min-w-[130px]">G.Deposit</th>
          <th className="px-4 py-2 text-left border-l border-white/20 min-w-[130px]">Visa</th>
          <th className="px-4 py-2 text-left min-w-[150px] font-black text-sm bg-slate-800">TOTAL</th>
        </tr>
      </thead>
    );
  }

  return (
    <thead>
      <tr className={`${theme.solidBg} text-white border-b border-white/20 sticky top-0 z-20 shadow-xs text-xs font-bold`}>
        <th className={`sticky right-0 z-30 px-4 py-4 font-black text-center border-l border-white/20 min-w-[140px] ${theme.solidBg} text-white`}>
          <div className="flex items-center justify-center gap-2">
            <Calendar className="h-4 w-4 text-white/80" />
            <span className="font-bold text-sm text-white">التاريخ</span>
          </div>
        </th>
        {columns.map((col) => (
          <th key={col.branchCode} className="px-4 py-4 text-left border-l border-white/20 min-w-[130px] font-bold">
            {col.name}
          </th>
        ))}
        <th className="px-4 py-4 text-left border-l border-white/20 min-w-[150px] font-black text-sm">TOTAL REV</th>
        {calcMode !== 'vat' && (
          <>
            <th className="px-4 py-4 text-left border-l border-white/20 min-w-[130px]">CASH</th>
            <th className="px-4 py-4 text-left border-l border-white/20 min-w-[130px]">VISA</th>
            <th className="px-4 py-4 text-left min-w-[140px]">COPON / C.L</th>
          </>
        )}
      </tr>
    </thead>
  );
});
