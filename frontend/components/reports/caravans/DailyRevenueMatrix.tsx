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

interface DailyRevenueMatrixProps {
  rows?: (CaravanRecord | MatrixRowItem)[];
  title?: string;
  loading?: boolean;
}

interface MatrixColumn {
  branchCode: string;
  name: string;
}

export type CalcMode = 'total' | 'net' | 'vat';
export type MatrixViewMode = 'net' | 'vat' | 'total'; // Backward compatibility

/* -------------------------------------------------------------------------- */
/* Component Implementation                                                   */
/* -------------------------------------------------------------------------- */

export function DailyRevenueMatrix({
  rows = [],
  title = 'مصفوفة الإيرادات اليومية حسب المنفذ (Daily Revenue Matrix)',
  loading = false,
}: DailyRevenueMatrixProps) {
  const [exporting, setExporting] = useState(false);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Calculation Mode State - Default to 'total' (الإجمالي الشامل)
  const [calcMode, setCalcMode] = useState<CalcMode>('total');

  // Client-Side Pagination States
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Stage 1: Raw Pivot & Grouping (Runs ONLY when raw rows change)
  const aggregatedData = useMemo(() => {
    const colMap = new Map<string, string>();
    const dateMap = new Map<
      string,
      Map<string, { cash: number; visa: number; cl: number; rawTotal: number }>
    >();

    rows.forEach((r) => {
      const rawDate = 'date' in r && r.date ? r.date : r.period;
      const dateKey = (rawDate || 'غير محدد').trim();
      const branchKey = String(r.branchCode || '').trim();
      const branchName = r.name || `منفذ ${branchKey}`;

      if (branchKey && !colMap.has(branchKey)) {
        colMap.set(branchKey, branchName);
      }

      const cash = Number(r.cash) || 0;
      const visa = Number(r.visa) || 0;
      const cl = Number(r.creditLine ?? (r as any).cl) || 0;
      const rawTotal = Number(r.total) || 0;

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

    const cols: MatrixColumn[] = Array.from(colMap.entries())
      .map(([branchCode, name]) => ({ branchCode, name }))
      .sort((a, b) => a.branchCode.localeCompare(b.branchCode));

    return {
      cols,
      dateMap,
      rawDates: Array.from(dateMap.keys()),
    };
  }, [rows]);

  // Stage 2: Dynamic Metric Projection & Aggregate Totals (Instant O(Dates * Columns))
  const { columns, matrixRows, columnTotals, grandTotal, grandCashVisa, grandCoupons } = useMemo(() => {
    const { cols, dateMap, rawDates } = aggregatedData;

    const dates = [...rawDates].sort((a, b) => {
      const cmp = a.localeCompare(b);
      return sortOrder === 'asc' ? cmp : -cmp;
    });

    const colTotalsAcc: Record<string, number> = {};
    cols.forEach((c) => {
      colTotalsAcc[c.branchCode] = 0;
    });

    let overallTotal = 0;
    let overallCashVisa = 0;
    let overallCoupons = 0;

    const applyCalcMode = (val: number, mode: CalcMode) => {
      if (mode === 'net') return val / 1.14;
      if (mode === 'vat') return val - val / 1.14;
      return val;
    };

    const mRows = dates.map((date) => {
      const branchValues = dateMap.get(date);
      const values: Record<string, number> = {};
      let rowTotal = 0;
      let rawDailyCashVisa = 0;
      let rawDailyCoupons = 0;

      cols.forEach((col) => {
        const item = branchValues?.get(col.branchCode) || {
          cash: 0,
          visa: 0,
          cl: 0,
          rawTotal: 0,
        };

        // Always calculate using All sources: baseTotal = cash + visa + cl
        const baseTotal =
          item.cash + item.visa + item.cl > 0
            ? item.cash + item.visa + item.cl
            : item.rawTotal;

        const val = applyCalcMode(baseTotal, calcMode);

        values[col.branchCode] = val;
        rowTotal += val;
        colTotalsAcc[col.branchCode] += val;

        rawDailyCashVisa += item.cash + item.visa;
        rawDailyCoupons += item.cl;
      });

      // Apply calcMode to daily aggregate columns
      const rowCashVisa = applyCalcMode(rawDailyCashVisa, calcMode);
      const rowCoupons = applyCalcMode(rawDailyCoupons, calcMode);

      overallTotal += rowTotal;
      overallCashVisa += rowCashVisa;
      overallCoupons += rowCoupons;

      return {
        date,
        values,
        rowTotal,
        rowCashVisa,
        rowCoupons,
      };
    });

    return {
      columns: cols,
      matrixRows: mRows,
      columnTotals: colTotalsAcc,
      grandTotal: overallTotal,
      grandCashVisa: overallCashVisa,
      grandCoupons: overallCoupons,
    };
  }, [aggregatedData, sortOrder, calcMode]);

  // Client-Side Pagination Calculations
  const totalPages = Math.max(1, Math.ceil(matrixRows.length / rowsPerPage));

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

  /* -------------------------------------------------------------------------- */
  /* Excel Export using ExcelJS with Precise Cell Formatting & Styling Range    */
  /* -------------------------------------------------------------------------- */
  const handleExportToExcel = async () => {
    try {
      setExporting(true);

      const ExcelJS = (await import('exceljs')).default;
      const { saveAs } = (await import('file-saver')).default;

      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Dream Park ERP';
      workbook.created = new Date();

      const calcCode =
        calcMode === 'net' ? 'Net' : calcMode === 'vat' ? 'VAT' : 'Total';

      const calcLabel =
        calcMode === 'net' ? 'الصافي (Net)' : calcMode === 'vat' ? 'الضريبة (VAT)' : 'الإجمالي (Total)';

      const worksheet = workbook.addWorksheet(`Matrix_${calcCode}`, {
        views: [{ rightToLeft: true }],
      });

      // 1. Setup Column Headers: Date, Caravans, Total, Cash+Visa, Coupons
      const wsColumns: { header: string; key: string; width: number }[] = [
        { header: 'التاريخ', key: 'date', width: 16 },
        ...columns.map((col) => ({
          header: col.name,
          key: `col_${col.branchCode}`,
          width: 24,
        })),
        { header: `الإجمالي اليومي (${calcLabel})`, key: 'row_total', width: 24 },
        { header: `الكاش والفيزا (${calcLabel})`, key: 'cash_visa', width: 22 },
        { header: `الكوبونات (${calcLabel})`, key: 'coupons', width: 20 },
      ];

      worksheet.columns = wsColumns;
      const totalColumnsCount = wsColumns.length;

      // 2. Format Header Row (Height: 36, Size: 13, Bold, Arial, Soft Slate fill FFE2E8F0, Dark Text FF0F172A)
      // Strictly format cells 1 to totalColumnsCount to prevent infinite row-fill overflow
      const headerRow = worksheet.getRow(1);
      headerRow.height = 36;

      for (let colIdx = 1; colIdx <= totalColumnsCount; colIdx++) {
        const cell = headerRow.getCell(colIdx);
        cell.font = { name: 'Arial', size: 13, bold: true, color: { argb: 'FF0F172A' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE2E8F0' },
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF94A3B8' } },
          bottom: { style: 'medium', color: { argb: 'FF64748B' } },
          left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        };
      }

      // 3. Populate ALL Data Rows (Height: 26, Arial, Size: 12, Bold numbers, numFmt: '#,##0.00')
      matrixRows.forEach((item) => {
        const rowData: Record<string, any> = {
          date: item.date,
          row_total: item.rowTotal,
          cash_visa: item.rowCashVisa,
          coupons: item.rowCoupons,
        };

        columns.forEach((col) => {
          rowData[`col_${col.branchCode}`] = item.values[col.branchCode] || 0;
        });

        const row = worksheet.addRow(rowData);
        row.height = 26;

        for (let colIdx = 1; colIdx <= totalColumnsCount; colIdx++) {
          const cell = row.getCell(colIdx);
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          };

          if (colIdx === 1) {
            // Date Cell
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            cell.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FF0F172A' } };
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFF8FAFC' },
            };
          } else {
            // Number data cells
            cell.numFmt = '#,##0.00';
            cell.alignment = { vertical: 'middle', horizontal: 'right' };
            cell.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FF0F172A' } };

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

      // 4. Totals Row (Height: 34, Arial, Size: 14, Bold, Soft Blue fill FFDBEAFE, Dark Navy text FF1E3A8A)
      // Strictly format cells 1 to totalColumnsCount to prevent infinite row-fill overflow
      const footerData: Record<string, any> = {
        date: 'الإجمالي العام للفترة',
        row_total: grandTotal,
        cash_visa: grandCashVisa,
        coupons: grandCoupons,
      };

      columns.forEach((col) => {
        footerData[`col_${col.branchCode}`] = columnTotals[col.branchCode] || 0;
      });

      const totalRow = worksheet.addRow(footerData);
      totalRow.height = 34;

      for (let colIdx = 1; colIdx <= totalColumnsCount; colIdx++) {
        const cell = totalRow.getCell(colIdx);
        cell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FF1E3A8A' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFDBEAFE' },
        };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF3B82F6' } },
          bottom: { style: 'double', color: { argb: 'FF1E3A8A' } },
          left: { style: 'thin', color: { argb: 'FF93C5FD' } },
          right: { style: 'thin', color: { argb: 'FF93C5FD' } },
        };

        if (colIdx === 1) {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        } else {
          cell.numFmt = '#,##0.00';
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
        }
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const fileName = `Daily_Revenue_Matrix_${calcCode}_${new Date().toISOString().split('T')[0]}.xlsx`;
      saveAs(blob, fileName);
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
    <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-sm ring-1 ring-slate-900/5 backdrop-blur-md dark:border-zinc-800/90 dark:bg-zinc-900/70 dark:ring-white/10 space-y-4">
      {/* --------------------------------------------------------------------- */}
      {/* Matrix Header & Calculation Mode Toggle                               */}
      {/* --------------------------------------------------------------------- */}
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 dark:border-zinc-800/80">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
                <Grid3X3 className="h-5 w-5" />
              </div>
              <h3 className="text-base lg:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                {title}
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
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-emerald-600 px-3.5 text-xs font-semibold text-white shadow-2xs transition hover:bg-emerald-700 active:scale-95 disabled:opacity-50"
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
            <Receipt className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>معادلة الاحتساب:</span>
          </span>
          <div className="inline-flex bg-slate-200/60 dark:bg-zinc-800/80 p-1 rounded-xl shadow-inner">
            <button
              type="button"
              onClick={() => setCalcMode('total')}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${
                calcMode === 'total'
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-zinc-700 dark:text-white'
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
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-zinc-700 dark:text-white'
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
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-zinc-700 dark:text-white'
                  : 'text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              الضريبة (VAT 14%)
            </button>
          </div>
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* High-Readability Table with Crosshair Hover & Sticky Footer            */}
      {/* --------------------------------------------------------------------- */}
      <div className="relative overflow-x-auto rounded-lg border border-slate-300 dark:border-zinc-800 max-h-[700px] shadow-2xs">
        <table className="w-full text-right text-sm border-collapse" dir="rtl">
          {/* Header Row */}
          <thead>
            <tr className="border-b border-slate-300 bg-slate-100 text-slate-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 sticky top-0 z-20 shadow-xs">
              <th className="sticky right-0 z-30 px-4 py-4 font-black text-center border-l border-slate-300 bg-slate-200/90 dark:border-zinc-700 dark:bg-zinc-800 min-w-[140px]">
                <div className="flex items-center justify-center gap-2">
                  <Calendar className="h-4 w-4 text-slate-600 dark:text-zinc-300" />
                  <span className="font-bold text-sm text-slate-900 dark:text-white">التاريخ</span>
                </div>
              </th>
              {columns.map((col) => (
                <th
                  key={col.branchCode}
                  className="px-4 py-3.5 font-bold text-center border-l border-slate-300 dark:border-zinc-700 min-w-[155px] whitespace-nowrap"
                  title={`كود الفرع: ${col.branchCode}`}
                >
                  <div className="flex flex-col items-center">
                    <span className="font-bold text-sm">{col.name}</span>
                    <span className="text-xs font-mono font-medium opacity-70">
                      {col.branchCode}
                    </span>
                  </div>
                </th>
              ))}
              <th className="px-4 py-4 font-black text-left bg-slate-200/90 dark:bg-zinc-800 text-slate-900 dark:text-white min-w-[160px] text-sm">
                الإجمالي اليومي
              </th>
              <th className="px-4 py-4 font-black text-left bg-slate-200/90 dark:bg-zinc-800 text-slate-900 dark:text-white min-w-[150px] text-sm">
                الكاش والفيزا
              </th>
              <th className="px-4 py-4 font-black text-left bg-slate-200/90 dark:bg-zinc-800 text-slate-900 dark:text-white min-w-[150px] text-sm">
                الكوبونات
              </th>
            </tr>
          </thead>

          {/* Table Body with Crosshair Row Hover & Readable Fonts */}
          <tbody className="divide-y divide-slate-200 dark:divide-zinc-800/80 font-mono tabular-nums tracking-tight">
            {loading ? (
              <tr>
                <td colSpan={columns.length + 4} className="py-16 text-center text-slate-400">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
                    <span className="text-sm font-sans font-semibold text-slate-700 dark:text-zinc-300">
                      جاري تجميع وحساب مصفوفة الإيرادات المالية...
                    </span>
                  </div>
                </td>
              </tr>
            ) : paginatedRows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + 4}
                  className="py-12 text-center text-slate-500 text-sm font-sans font-medium"
                >
                  لا توجد سجلات كافية لبناء المصفوفة
                </td>
              </tr>
            ) : (
              paginatedRows.map((row) => (
                <tr
                  key={row.date}
                  className="group transition-colors duration-150 hover:bg-blue-100/70 dark:hover:bg-blue-950/40"
                >
                  {/* Date Column (Sticky Right) */}
                  <td className="sticky right-0 z-10 px-4 py-3.5 text-center font-bold text-sm lg:text-base text-slate-900 border-l border-slate-200 bg-slate-50/95 group-hover:bg-blue-100/90 dark:border-zinc-800 dark:bg-zinc-900/95 dark:text-zinc-100 dark:group-hover:bg-blue-950/80 transition-colors">
                    {row.date}
                  </td>

                  {/* Caravan Values */}
                  {columns.map((col) => {
                    const val = row.values[col.branchCode] || 0;
                    return (
                      <td
                        key={col.branchCode}
                        className={`px-4 py-3.5 text-left font-bold text-base lg:text-lg tabular-nums border-l border-slate-200/60 dark:border-zinc-800/40 group-hover:bg-blue-50/50 dark:group-hover:bg-blue-900/20 transition-colors ${
                          val > 0
                            ? 'text-slate-900 dark:text-white'
                            : 'text-slate-300 dark:text-zinc-600 font-normal'
                        }`}
                      >
                        {val > 0 ? (
                          val.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })
                        ) : (
                          <span className="select-none font-normal opacity-40">—</span>
                        )}
                      </td>
                    );
                  })}

                  {/* Daily Row Total */}
                  <td className="px-4 py-3.5 text-left font-black text-base lg:text-lg tabular-nums text-slate-950 bg-slate-100/80 group-hover:bg-blue-100/80 dark:bg-zinc-800/60 dark:text-white dark:group-hover:bg-blue-950/60 transition-colors">
                    <Money value={row.rowTotal} />
                  </td>

                  {/* Daily Cash & Visa */}
                  <td className="px-4 py-3.5 text-left font-bold text-base lg:text-lg tabular-nums text-slate-900 bg-slate-50/80 group-hover:bg-blue-50/80 dark:bg-zinc-800/40 dark:text-zinc-100 dark:group-hover:bg-blue-950/40 transition-colors">
                    <Money value={row.rowCashVisa} />
                  </td>

                  {/* Daily Coupons */}
                  <td className="px-4 py-3.5 text-left font-bold text-base lg:text-lg tabular-nums text-slate-900 bg-slate-50/80 group-hover:bg-blue-50/80 dark:bg-zinc-800/40 dark:text-zinc-100 dark:group-hover:bg-blue-950/40 transition-colors">
                    <Money value={row.rowCoupons} />
                  </td>
                </tr>
              ))
            )}
          </tbody>

          {/* Sticky Grand Totals Footer (Calculated over FULL Data) */}
          {!loading && matrixRows.length > 0 && (
            <tfoot className="sticky bottom-0 z-20 shadow-lg border-t-2 border-slate-300 bg-blue-100/95 dark:border-blue-800 dark:bg-blue-950/95 backdrop-blur-md font-mono tabular-nums tracking-tight">
              <tr className="font-bold text-slate-950 dark:text-blue-100">
                <td className="sticky right-0 z-30 px-4 py-4 text-center font-sans text-sm lg:text-base font-black border-l border-slate-300 dark:border-blue-800 bg-blue-200/95 dark:bg-blue-900/90 text-blue-950 dark:text-white">
                  الإجمالي العام للفترة
                </td>
                {columns.map((col) => {
                  const total = columnTotals[col.branchCode] || 0;
                  return (
                    <td
                      key={col.branchCode}
                      className="px-4 py-4 text-left font-black text-base lg:text-lg border-l border-slate-300/80 dark:border-blue-900/50"
                    >
                      {total.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                  );
                })}
                <td className="px-4 py-4 text-left text-lg lg:text-xl font-black bg-blue-200/95 dark:bg-blue-800/60 text-blue-950 dark:text-blue-50">
                  {grandTotal.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
                <td className="px-4 py-4 text-left text-base lg:text-lg font-black bg-blue-200/80 dark:bg-blue-800/40 text-blue-950 dark:text-blue-50">
                  {grandCashVisa.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
                <td className="px-4 py-4 text-left text-base lg:text-lg font-black bg-blue-200/80 dark:bg-blue-800/40 text-blue-950 dark:text-blue-50">
                  {grandCoupons.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
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
              className="h-8 rounded-md border border-slate-300 bg-white px-2.5 text-xs font-bold text-slate-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value={5}>5 صفوف</option>
              <option value={10}>10 صفوف</option>
              <option value={15}>15 صفاً</option>
              <option value={30}>30 صفاً</option>
              <option value={9999}>الكل ({matrixRows.length})</option>
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
}

export default DailyRevenueMatrix;
