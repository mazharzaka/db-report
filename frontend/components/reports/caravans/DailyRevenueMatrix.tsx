"use client";

import React, { useMemo, useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Utensils,
  Coffee,
  ShoppingBag,
  Receipt,
} from 'lucide-react';
import { fmtMoney } from './charts';
import { getSectorTheme } from '@/config/sectorsConfig';
import {
  type DailyRevenueMatrixProps,
  type CalcMode,
  type RideStatusFilter,
  formatDateAr,
  MONEY_FORMATTER,
} from './matrix/matrixConstants';
import { useMatrixAggregation } from './matrix/useMatrixAggregation';
import { exportMatrixToExcel } from './matrix/matrixExcelExport';
import { MatrixTableSkeleton } from './matrix/MatrixTableSkeleton';
import { MatrixTableRow } from './matrix/MatrixTableRow';
import { MatrixTableHeaders } from './matrix/MatrixTableHeaders';
import { RestaurantMatrixRows } from './matrix/RestaurantMatrixRows';
import { MatrixTableFooter } from './matrix/MatrixTableFooter';
import { MatrixToolbar } from './matrix/MatrixToolbar';

// Re-export constants & types for backward compatibility across the frontend
export * from './matrix/matrixConstants';
export { MatrixTableRow } from './matrix/MatrixTableRow';

/* -------------------------------------------------------------------------- */
/* Main DailyRevenueMatrix Component Implementation                           */
/* -------------------------------------------------------------------------- */

export const DailyRevenueMatrix = React.memo(function DailyRevenueMatrix({
  rows = [],
  title,
  loading = false,
  sectorId,
  sectorType = 4,
  sectorLabel,
  sectorTheme,
  facilityType = "all",
  onFacilityTypeChange,
  rideStatusFilter,
  onRideStatusFilterChange,
  startDate,
  endDate,
  granularity,
}: DailyRevenueMatrixProps) {
  const theme = useMemo(
    () => sectorTheme || getSectorTheme(sectorType),
    [sectorTheme, sectorType],
  );
  const [exporting, setExporting] = useState(false);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [calcMode, setCalcMode] = useState<CalcMode>("total");

  // Sector 2 (Paid Rides) ride status filter
  const [internalRideStatusFilter, setInternalRideStatusFilter] =
    useState<RideStatusFilter>("all");
  const effectiveRideStatusFilter =
    rideStatusFilter ?? internalRideStatusFilter;
  const handleRideStatusFilterChange = (f: RideStatusFilter) => {
    setInternalRideStatusFilter(f);
    onRideStatusFilterChange?.(f);
  };

  // 1. Unified Modular Matrix Aggregation Hook (Single-Pass 1.00x)
  const {
    isRestaurants,
    effectiveGranularity,
    restaurantData,
    columns,
    matrixRows,
    columnTotals,
    grandTotal,
    grandCash,
    grandVisa,
    grandCoupons,
    grandFood,
    grandBeverage,
    grandOther,
    gateTotals,
    othHeaderGroups,
    isTwoRowHeader,
    totalTableCols,
  } = useMatrixAggregation({
    rows,
    sectorType,
    effectiveRideStatusFilter,
    calcMode,
    sortOrder,
    granularity,
  });

  // Expansion states for Restaurants (Month & Day breakdown)
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [allDaysExpanded, setAllDaysExpanded] = useState<boolean>(false);

  useEffect(() => {
    if (
      isRestaurants &&
      effectiveGranularity === "month" &&
      restaurantData?.monthGroups
    ) {
      setExpandedMonths(
        new Set(restaurantData.monthGroups.map((m) => m.monthKey)),
      );
    }
  }, [isRestaurants, effectiveGranularity, restaurantData?.monthGroups]);

  const allMonthsExpanded = useMemo(() => {
    if (!restaurantData?.monthGroups || restaurantData.monthGroups.length === 0)
      return false;
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

  // Client-Side Pagination States
  const [rowsPerPage, setRowsPerPage] = useState<number>(31);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const totalRestaurantDays = restaurantData?.dayGroups.length || 0;
  const isRestaurantDayMode = isRestaurants && effectiveGranularity === "day";

  const totalPages = Math.max(
    1,
    Math.ceil(
      (isRestaurantDayMode ? totalRestaurantDays : matrixRows.length) /
        rowsPerPage,
    ),
  );

  const paginatedDayGroups = useMemo(() => {
    if (!restaurantData) return [];
    if (rowsPerPage >= 9999) return restaurantData.dayGroups;
    const startIdx = (currentPage - 1) * rowsPerPage;
    return restaurantData.dayGroups.slice(startIdx, startIdx + rowsPerPage);
  }, [restaurantData, currentPage, rowsPerPage]);

  useEffect(() => {
    if (
      (isRestaurantDayMode ? totalRestaurantDays : matrixRows.length) > 60 &&
      rowsPerPage >= 9999
    ) {
      setRowsPerPage(31);
      setCurrentPage(1);
    }
  }, [
    matrixRows.length,
    rowsPerPage,
    isRestaurantDayMode,
    totalRestaurantDays,
  ]);

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

  const activeTotalRecords = isRestaurantDayMode
    ? totalRestaurantDays
    : matrixRows.length;
  const startRecord =
    activeTotalRecords === 0
      ? 0
      : (currentPage - 1) *
          (rowsPerPage >= 9999 ? activeTotalRecords : rowsPerPage) +
        1;
  const endRecord =
    rowsPerPage >= 9999
      ? activeTotalRecords
      : Math.min(currentPage * rowsPerPage, activeTotalRecords);

  // Dynamic Title
  const dynamicTitle = useMemo(() => {
    if (title) return title;

    const rawStart =
      startDate || (matrixRows.length > 0 ? matrixRows[0].date : "");
    const rawEnd =
      endDate ||
      (matrixRows.length > 0 ? matrixRows[matrixRows.length - 1].date : "");
    const startFmt = formatDateAr(rawStart);
    const endFmt = formatDateAr(rawEnd);

    const periodText =
      startFmt && endFmt
        ? rawStart === rawEnd || startFmt === endFmt
          ? `يوم ${startFmt}`
          : `من فترة ${startFmt} إلى ${endFmt}`
        : startFmt
          ? `يوم ${startFmt}`
          : "";

    const secType = sectorType ?? 4;
    let baseSubject = "";

    if (secType === 4) {
      if (facilityType === "caravans") {
        baseSubject = "مبيعات الكرفانات";
      } else if (facilityType === "shops") {
        baseSubject = "مبيعات المحلات";
      } else {
        baseSubject = "مبيعات الكرفانات والمحلات";
      }
    } else {
      baseSubject = `مبيعات ${sectorLabel || "القطاع"}`;
    }

    return periodText ? `${baseSubject} ${periodText}` : baseSubject;
  }, [
    title,
    startDate,
    endDate,
    sectorType,
    sectorLabel,
    facilityType,
    matrixRows,
  ]);

  // Excel Export Handler using Modular Service
  const handleExportToExcel = async () => {
    try {
      setExporting(true);
      await exportMatrixToExcel({
        matrixRows,
        columns,
        sectorType,
        sectorLabel,
        facilityType,
        effectiveRideStatusFilter,
        calcMode,
        startDate,
        endDate,
        effectiveGranularity,
        theme,
        gateTotals,
        columnTotals,
        grandCash,
        grandVisa,
        grandCoupons,
        grandTotal,
        grandFood,
        grandBeverage,
        grandOther,
        isRestaurants,
        restaurantData,
        othHeaderGroups,
        isTwoRowHeader,
      });
    } catch (err) {
      console.error("Error exporting Matrix to Excel:", err);
    } finally {
      setExporting(false);
    }
  };

  const hoverRowClass = 'hover:bg-slate-100/70 dark:hover:bg-zinc-800/50';
  const hoverCellClass = 'group-hover:bg-slate-100/70 dark:group-hover:bg-zinc-800/50';
  const totalRevColClass = 'bg-slate-100/80 font-black text-slate-900 dark:bg-zinc-800/70 dark:text-white';

  return (
    <div
      className={`rounded-xl border border-slate-200/90 bg-white p-5 shadow-sm ring-1 ring-slate-900/5 backdrop-blur-md dark:border-zinc-800/90 dark:bg-zinc-900/70 dark:ring-white/10 space-y-4 ${theme.matrix.topBorder}`}
    >
      {/* --------------------------------------------------------------------- */}
      {/* Matrix Header & Controls Toolbar                                      */}
      {/* --------------------------------------------------------------------- */}
      <MatrixToolbar
        dynamicTitle={dynamicTitle}
        theme={theme}
        isRestaurants={isRestaurants}
        effectiveGranularity={effectiveGranularity}
        allMonthsExpanded={allMonthsExpanded}
        handleToggleAllMonths={handleToggleAllMonths}
        allDaysExpanded={allDaysExpanded}
        handleToggleAllDays={handleToggleAllDays}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        handleExportToExcel={handleExportToExcel}
        exporting={exporting}
        loading={loading}
        matrixRowsLength={matrixRows.length}
        calcMode={calcMode}
        setCalcMode={setCalcMode}
        sectorType={sectorType}
        effectiveRideStatusFilter={effectiveRideStatusFilter}
        handleRideStatusFilterChange={handleRideStatusFilterChange}
        facilityType={facilityType}
        onFacilityTypeChange={onFacilityTypeChange}
      />

      {/* F&B Mix Strip (Sector 1 Restaurants) */}
      {isRestaurants && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          <div className="flex items-center gap-3.5 p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs border-t-2 border-t-[#881337] dark:bg-zinc-900 dark:border-zinc-800">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-[#881337] dark:bg-rose-950/40 dark:text-rose-300">
              <Utensils className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-bold text-slate-600 dark:text-zinc-400">
                  مأكولات (Food)
                </span>
                <span className="rounded-full bg-rose-50 border border-rose-200/70 px-2 py-0.5 text-[11px] font-black text-[#881337] dark:bg-rose-950/60 dark:text-rose-300">
                  {grandTotal > 0
                    ? ((grandFood / grandTotal) * 100).toFixed(1)
                    : "0.0"}
                  %
                </span>
              </div>
              <div
                className="mt-1 text-base sm:text-lg font-black text-slate-900 dark:text-white tabular-nums font-mono"
                dir="ltr"
              >
                {MONEY_FORMATTER.format(grandFood)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs border-t-2 border-t-[#881337] dark:bg-zinc-900 dark:border-zinc-800">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-[#881337] dark:bg-rose-950/40 dark:text-rose-300">
              <Coffee className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-bold text-slate-600 dark:text-zinc-400">
                  مشروبات (Beverage)
                </span>
                <span className="rounded-full bg-rose-50 border border-rose-200/70 px-2 py-0.5 text-[11px] font-black text-[#881337] dark:bg-rose-950/60 dark:text-rose-300">
                  {grandTotal > 0
                    ? ((grandBeverage / grandTotal) * 100).toFixed(1)
                    : "0.0"}
                  %
                </span>
              </div>
              <div
                className="mt-1 text-base sm:text-lg font-black text-slate-900 dark:text-white tabular-nums font-mono"
                dir="ltr"
              >
                {MONEY_FORMATTER.format(grandBeverage)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs border-t-2 border-t-[#881337] dark:bg-zinc-900 dark:border-zinc-800">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-[#881337] dark:bg-rose-950/40 dark:text-rose-300">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-bold text-slate-600 dark:text-zinc-400">
                  أخرى (Other)
                </span>
                <span className="rounded-full bg-rose-50 border border-rose-200/70 px-2 py-0.5 text-[11px] font-black text-[#881337] dark:bg-rose-950/60 dark:text-rose-300">
                  {grandTotal > 0
                    ? ((grandOther / grandTotal) * 100).toFixed(1)
                    : "0.0"}
                  %
                </span>
              </div>
              <div
                className="mt-1 text-base sm:text-lg font-black text-slate-900 dark:text-white tabular-nums font-mono"
                dir="ltr"
              >
                {MONEY_FORMATTER.format(grandOther)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs border-t-2 border-t-[#881337] dark:bg-zinc-900 dark:border-zinc-800">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#881337] text-white">
              <Receipt className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-bold text-slate-600 dark:text-zinc-400">
                  إجمالي المبيعات
                </span>
                <span className="rounded-full bg-rose-50 border border-rose-200/70 px-2 py-0.5 text-[11px] font-black text-[#881337] dark:bg-rose-950/60 dark:text-rose-300">
                  100%
                </span>
              </div>
              <div
                className="mt-1 text-base sm:text-lg font-black text-[#881337] dark:text-rose-400 tabular-nums font-mono"
                dir="ltr"
              >
                {MONEY_FORMATTER.format(grandTotal)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* Table Area (Skeleton Shimmer during Loading, otherwise Real Matrix)   */}
      {/* --------------------------------------------------------------------- */}
      {loading ? (
        <MatrixTableSkeleton columnsCount={Math.min(totalTableCols, 12)} rowsCount={8} />
      ) : (
        <div className="relative overflow-x-auto rounded-lg border border-slate-300 dark:border-zinc-800 max-h-[700px] shadow-2xs">
          <table className="w-full text-right text-sm border-collapse" dir="rtl">
            <MatrixTableHeaders
              isRestaurants={isRestaurants}
              sectorType={sectorType}
              effectiveGranularity={effectiveGranularity}
              calcMode={calcMode}
              columns={columns}
              othHeaderGroups={othHeaderGroups}
              isTwoRowHeader={isTwoRowHeader}
              theme={theme}
            />

            {/* Table Body */}
            <tbody className="divide-y divide-slate-200 dark:divide-zinc-800/80 font-mono tabular-nums tracking-tight">
              {isRestaurants ? (
                <RestaurantMatrixRows
                  effectiveGranularity={effectiveGranularity}
                  restaurantData={restaurantData}
                  paginatedDayGroups={paginatedDayGroups}
                  expandedMonths={expandedMonths}
                  expandedDays={expandedDays}
                  allDaysExpanded={allDaysExpanded}
                  handleToggleMonth={handleToggleMonth}
                  handleToggleDay={handleToggleDay}
                  totalTableCols={totalTableCols}
                  calcMode={calcMode}
                />
              ) : matrixRows.length === 0 ? (
                <tr>
                  <td colSpan={totalTableCols} className="py-12 text-center text-slate-500 text-sm font-sans font-medium">
                    لا توجد بيانات متاحة في هذا القطاع للفترة المحددة
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row) => (
                  <MatrixTableRow
                    key={row.date}
                    row={row}
                    columns={columns}
                    calcMode={calcMode}
                    hoverRowClass={hoverRowClass}
                    hoverCellClass={hoverCellClass}
                    totalRevColClass={totalRevColClass}
                    isTwoRowHeader={isTwoRowHeader}
                    sectorType={sectorType}
                  />
                ))
              )}
            </tbody>

            {/* Sticky Grand Totals Footer */}
            {(isRestaurants || matrixRows.length > 0) && (
              <MatrixTableFooter
                isRestaurants={isRestaurants}
                sectorType={sectorType}
                columns={columns}
                columnTotals={columnTotals}
                calcMode={calcMode}
                grandTotal={grandTotal}
                grandCash={grandCash}
                grandVisa={grandVisa}
                grandCoupons={grandCoupons}
                grandFood={grandFood}
                grandBeverage={grandBeverage}
                grandOther={grandOther}
                gateTotals={gateTotals}
                theme={theme}
              />
            )}
          </table>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* Pagination & Status Footer                                            */}
      {/* --------------------------------------------------------------------- */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-xs text-slate-600 dark:text-zinc-400 border-t border-slate-200 pt-3 dark:border-zinc-800">
        <div className="flex items-center gap-4">
          {(!isRestaurants || effectiveGranularity === "day") && (
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
                {(isRestaurantDayMode
                  ? totalRestaurantDays
                  : matrixRows.length) <= 60 && (
                  <option value={9999}>
                    الكل (
                    {isRestaurantDayMode
                      ? totalRestaurantDays
                      : matrixRows.length}
                    )
                  </option>
                )}
              </select>
            </div>
          )}

          <span className="font-medium text-slate-700 dark:text-zinc-300">
            {isRestaurants && effectiveGranularity === "summary"
              ? `عرض جميع الفروع (${restaurantData?.summaryBranches.length || 0} فرع)`
              : isRestaurants && effectiveGranularity === "month"
                ? `عرض جميع الشهور (${restaurantData?.monthGroups.length || 0} شهر)`
                : `عرض ${startRecord} - ${endRecord} من إجمالي ${activeTotalRecords} يوم`}
          </span>
        </div>

        {/* Pagination Controls */}
        {(!isRestaurants || effectiveGranularity === "day") &&
          totalPages > 1 &&
          rowsPerPage < 9999 && (
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
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
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
            {calcMode === "net"
              ? "الصافي (Net Sales)"
              : calcMode === "vat"
                ? "الضريبة (VAT 14%)"
                : "الإجمالي الشامل (Total Gross)"}
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
