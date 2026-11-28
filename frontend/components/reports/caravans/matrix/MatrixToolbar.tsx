'use client';

import React from 'react';
import {
  FileSpreadsheet,
  Loader2,
  Grid3X3,
  ArrowUpDown,
  Receipt,
  ChevronsUpDown,
  Store,
} from 'lucide-react';
import type { CalcMode, RideStatusFilter } from './matrixConstants';

interface MatrixToolbarProps {
  dynamicTitle: string;
  theme: any;
  isRestaurants: boolean;
  effectiveGranularity: 'summary' | 'month' | 'day';
  allMonthsExpanded: boolean;
  handleToggleAllMonths: (expand: boolean) => void;
  allDaysExpanded: boolean;
  handleToggleAllDays: () => void;
  sortOrder: 'asc' | 'desc';
  setSortOrder: React.Dispatch<React.SetStateAction<'asc' | 'desc'>>;
  handleExportToExcel: () => void;
  exporting: boolean;
  loading: boolean;
  matrixRowsLength: number;
  calcMode: CalcMode;
  setCalcMode: (mode: CalcMode) => void;
  sectorType: number;
  effectiveRideStatusFilter: RideStatusFilter;
  handleRideStatusFilterChange: (f: RideStatusFilter) => void;
  facilityType?: 'all' | 'caravans' | 'shops';
  onFacilityTypeChange?: (f: 'all' | 'caravans' | 'shops') => void;
}

export const MatrixToolbar = React.memo(function MatrixToolbar({
  dynamicTitle,
  theme,
  isRestaurants,
  effectiveGranularity,
  allMonthsExpanded,
  handleToggleAllMonths,
  allDaysExpanded,
  handleToggleAllDays,
  sortOrder,
  setSortOrder,
  handleExportToExcel,
  exporting,
  loading,
  matrixRowsLength,
  calcMode,
  setCalcMode,
  sectorType,
  effectiveRideStatusFilter,
  handleRideStatusFilterChange,
  facilityType = 'all',
  onFacilityTypeChange,
}: MatrixToolbarProps) {
  return (
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
            disabled={exporting || loading || matrixRowsLength === 0}
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

      {/* Calculation Mode Toggle */}
      <div className="flex flex-wrap items-center gap-2.5 pt-1">
        <span className="text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
          <Receipt className={`h-4 w-4 ${theme.accentText}`} />
          <span>معادلة الاحتساب:</span>
        </span>
        <div className="inline-flex bg-slate-200/60 dark:bg-zinc-800/80 p-1 rounded-xl shadow-inner">
          <button
            type="button"
            onClick={() => setCalcMode('total')}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${
              calcMode === 'total'
                ? `${theme.btnActive} shadow-sm`
                : 'text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            الإجمالي الشامل (Total Gross)
          </button>
          <button
            type="button"
            onClick={() => setCalcMode('net')}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${
              calcMode === 'net'
                ? `${theme.btnActive} shadow-sm`
                : 'text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            الصافي (Net Sales)
          </button>
          <button
            type="button"
            onClick={() => setCalcMode('vat')}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${
              calcMode === 'vat'
                ? `${theme.btnActive} shadow-sm`
                : 'text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            الضريبة (VAT 14%)
          </button>
        </div>
      </div>

      {/* Sector 2 Paid Rides Filter */}
      {sectorType === 2 && (
        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          <span className="text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                effectiveRideStatusFilter === 'all'
                  ? 'bg-blue-500'
                  : effectiveRideStatusFilter === 'active'
                  ? 'bg-emerald-500'
                  : 'bg-amber-500'
              }`}
            />
            <span>نطاق الألعاب:</span>
          </span>
          <div className="inline-flex bg-slate-200/60 dark:bg-zinc-800/80 p-1 rounded-xl shadow-inner">
            <button
              type="button"
              onClick={() => handleRideStatusFilterChange('all')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                effectiveRideStatusFilter === 'all'
                  ? `${theme.btnActive} shadow-sm`
                  : 'text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              الكل (All — 16 لعبة)
            </button>
            <button
              type="button"
              onClick={() => handleRideStatusFilterChange('active')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                effectiveRideStatusFilter === 'active'
                  ? `${theme.btnActive} shadow-sm`
                  : 'text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              النشطة (Active)
            </button>
            <button
              type="button"
              onClick={() => handleRideStatusFilterChange('inactive')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                effectiveRideStatusFilter === 'inactive'
                  ? `${theme.btnActive} shadow-sm`
                  : 'text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              غير النشطة (Inactive)
            </button>
          </div>
        </div>
      )}

      {/* Sector 4 Caravans / Shops Filter */}
      {sectorType === 4 && onFacilityTypeChange && (
        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          <span className="text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                facilityType === 'all'
                  ? 'bg-blue-500'
                  : facilityType === 'caravans'
                  ? 'bg-emerald-500'
                  : 'bg-amber-500'
              }`}
            />
            <span>نطاق المنافذ:</span>
          </span>
          <div className="inline-flex bg-slate-200/60 dark:bg-zinc-800/80 p-1 rounded-xl shadow-inner">
            <button
              type="button"
              onClick={() => onFacilityTypeChange('all')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                facilityType === 'all'
                  ? `${theme.btnActive} shadow-sm`
                  : 'text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              الكل
            </button>
            <button
              type="button"
              onClick={() => onFacilityTypeChange('caravans')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                facilityType === 'caravans'
                  ? `${theme.btnActive} shadow-sm`
                  : 'text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              الكرفانات
            </button>
            <button
              type="button"
              onClick={() => onFacilityTypeChange('shops')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                facilityType === 'shops'
                  ? `${theme.btnActive} shadow-sm`
                  : 'text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              المحلات
            </button>
          </div>
        </div>
      )}

      {/* Sector 6 OTH Filter */}
      {sectorType === 6 && (
        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          <span className="text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                effectiveRideStatusFilter === 'active' ? 'bg-[#1e293b]' : 'bg-slate-600'
              }`}
            />
            <span>نطاق الأعمدة:</span>
          </span>
          <div className="inline-flex bg-slate-200/60 dark:bg-zinc-800/80 p-1 rounded-xl shadow-inner">
            <button
              type="button"
              onClick={() => handleRideStatusFilterChange('all')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                effectiveRideStatusFilter !== 'active'
                  ? 'bg-[#1e293b] text-white shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              الكل (All)
            </button>
            <button
              type="button"
              onClick={() => handleRideStatusFilterChange('active')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                effectiveRideStatusFilter === 'active'
                  ? 'bg-[#1e293b] text-white shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              النشطة (Active)
            </button>
          </div>
        </div>
      )}
    </div>
  );
});
