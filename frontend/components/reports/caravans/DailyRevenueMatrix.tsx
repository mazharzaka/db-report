'use client';

import React, { useMemo, useState } from 'react';
import { FileSpreadsheet, Loader2, Calendar, Grid3X3, ArrowUpDown, Plus, HelpCircle, Gamepad2, X } from 'lucide-react';
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

export type MatrixViewMode = 'net' | 'vat' | 'total';

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
  const [viewMode, setViewMode] = useState<MatrixViewMode>('net');

  // --- TODO: REMOVE BEFORE PRODUCTION (TEMP DEBUG) ---
  const [debugItemCode, setDebugItemCode] = useState('');
  const [tempDebugRows, setTempDebugRows] = useState<MatrixRowItem[]>([]);
  const [debugError, setDebugError] = useState<string | null>(null);

  const handleAddDebugComparison = () => {
    setDebugError(null);
    const code = debugItemCode.trim();

    if (!code) {
      setDebugError('الرجاء إدخال كود الصنف أو اللعبة');
      return;
    }

    // Specific critical test case: Code 18 => Movy VR Game with Total = 10,480
    if (code === '18') {
      const today = new Date().toISOString().split('T')[0];
      const movyRow: MatrixRowItem = {
        date: today,
        period: today,
        branchCode: 'VR-18',
        name: 'Movy VR (لعبة موفي 18)',
        cash: 6000,
        visa: 4480,
        cl: 0,
        total: 10480, // Total = 10,480.00 | Net = 9,192.98 | VAT = 1,287.02
      };

      setTempDebugRows((prev) => {
        const filtered = prev.filter((r) => r.branchCode !== 'VR-18');
        return [...filtered, movyRow];
      });
      setDebugItemCode('');
    } else {
      setDebugError(`الكود "${code}" غير مسجل بحالات الاختبار المحددة (جرب الكود: 18 لاختبار Movy VR)`);
    }
  };

  const handleClearDebugRows = () => {
    setTempDebugRows([]);
    setDebugError(null);
  };
  // --- END TEMP DEBUG ---

  // Merge incoming rows with temporary debug rows
  const effectiveRows = useMemo(() => {
    return [...rows, ...tempDebugRows];
  }, [rows, tempDebugRows]);

  // 1. Process & Pivot data: Extract unique columns (Caravans/Games) and group by Date
  const { columns, matrixRows, columnTotals, grandTotal } = useMemo(() => {
    const colMap = new Map<string, string>();
    const dateMap = new Map<string, Map<string, { net: number; vat: number; total: number }>>();

    effectiveRows.forEach((r) => {
      // Determine effective Date (from date or period property)
      const rawDate = ('date' in r && r.date) ? r.date : r.period;
      const dateKey = (rawDate || 'غير محدد').trim();
      const branchKey = String(r.branchCode || '').trim();
      const branchName = r.name || `منفذ ${branchKey}`;

      if (branchKey && !colMap.has(branchKey)) {
        colMap.set(branchKey, branchName);
      }

      // Exact Formula:
      // total = cash + visa + cl
      // net = total / 1.14
      // vat = total - net
      const cash = Number(r.cash) || 0;
      const visa = Number(r.visa) || 0;
      const cl = Number(r.creditLine ?? (r as any).cl) || 0;
      const total = (cash + visa + cl) > 0 ? (cash + visa + cl) : (Number(r.total) || 0);

      const net = total / 1.14;
      const vat = total - net;

      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, new Map<string, { net: number; vat: number; total: number }>());
      }

      const branchValues = dateMap.get(dateKey)!;
      const currentVal = branchValues.get(branchKey) || { net: 0, vat: 0, total: 0 };
      branchValues.set(branchKey, {
        net: currentVal.net + net,
        vat: currentVal.vat + vat,
        total: currentVal.total + total,
      });
    });

    // Form column list sorted by branchCode
    const cols: MatrixColumn[] = Array.from(colMap.entries())
      .map(([branchCode, name]) => ({ branchCode, name }))
      .sort((a, b) => a.branchCode.localeCompare(b.branchCode));

    // Sort distinct dates
    const dates = Array.from(dateMap.keys()).sort((a, b) => {
      const cmp = a.localeCompare(b);
      return sortOrder === 'asc' ? cmp : -cmp;
    });

    // Form matrix rows with per-row total
    const colTotalsAcc: Record<string, number> = {};
    cols.forEach((c) => {
      colTotalsAcc[c.branchCode] = 0;
    });

    let overallTotal = 0;

    const mRows = dates.map((date) => {
      const branchValues = dateMap.get(date)!;
      const values: Record<string, number> = {};
      let rowTotal = 0;

      cols.forEach((col) => {
        const item = branchValues.get(col.branchCode) || { net: 0, vat: 0, total: 0 };
        // Select metric based on viewMode
        const val = viewMode === 'net' ? item.net : viewMode === 'vat' ? item.vat : item.total;
        values[col.branchCode] = val;
        rowTotal += val;
        colTotalsAcc[col.branchCode] += val;
      });

      overallTotal += rowTotal;

      return {
        date,
        values,
        rowTotal,
      };
    });

    return {
      columns: cols,
      matrixRows: mRows,
      columnTotals: colTotalsAcc,
      grandTotal: overallTotal,
    };
  }, [effectiveRows, sortOrder, viewMode]);

  /* -------------------------------------------------------------------------- */
  /* Excel Export using ExcelJS with currently toggled viewMode                  */
  /* -------------------------------------------------------------------------- */
  const handleExportToExcel = async () => {
    try {
      setExporting(true);

      const ExcelJS = (await import('exceljs')).default;
      const { saveAs } = (await import('file-saver')).default;

      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Dream Park ERP';
      workbook.created = new Date();

      const viewTitle =
        viewMode === 'net'
          ? 'صافي المبيعات (Net)'
          : viewMode === 'vat'
          ? 'ضريبة القيمة المضافة (VAT 14%)'
          : 'الإجمالي الشامل (Total Gross)';

      const worksheet = workbook.addWorksheet(`المصفوفة - ${viewTitle}`, {
        views: [{ rightToLeft: true }],
      });

      // 1. Setup Column Headers: Date, Caravans, Total
      const wsColumns: { header: string; key: string; width: number }[] = [
        { header: 'التاريخ', key: 'date', width: 16 },
        ...columns.map((col) => ({
          header: col.name,
          key: `col_${col.branchCode}`,
          width: 22,
        })),
        { header: `الإجمالي اليومي (${viewTitle})`, key: 'row_total', width: 22 },
      ];

      worksheet.columns = wsColumns;

      // 2. Format Header Row
      const headerRow = worksheet.getRow(1);
      headerRow.height = 30;
      headerRow.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF1F2937' } };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF4C7C3' }, // Legacy pink tint for excel compliance
      };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

      headerRow.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFB0BEC5' } },
          bottom: { style: 'medium', color: { argb: 'FF90A4AE' } },
          left: { style: 'thin', color: { argb: 'FFCFD8DC' } },
          right: { style: 'thin', color: { argb: 'FFCFD8DC' } },
        };
      });

      // 3. Populate Data Rows
      matrixRows.forEach((item) => {
        const rowData: Record<string, any> = {
          date: item.date,
          row_total: item.rowTotal,
        };

        columns.forEach((col) => {
          rowData[`col_${col.branchCode}`] = item.values[col.branchCode] || 0;
        });

        const row = worksheet.addRow(rowData);
        row.height = 22;

        // Date Cell (#BCE2E8 light blue)
        const dateCell = row.getCell(1);
        dateCell.alignment = { vertical: 'middle', horizontal: 'center' };
        dateCell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF0F172A' } };
        dateCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFBCE2E8' },
        };

        // Number cells formatting
        for (let colIdx = 2; colIdx <= columns.length + 2; colIdx++) {
          const cell = row.getCell(colIdx);
          cell.numFmt = '#,##0.00';
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
          cell.font = { name: 'Arial', size: 10 };

          if (colIdx === columns.length + 2) {
            cell.font = { name: 'Arial', size: 10, bold: true };
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFF1F5F9' },
            };
          }
        }

        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          };
        });
      });

      // 4. Totals Row (Footer: #FFFF00 Yellow)
      const footerData: Record<string, any> = {
        date: 'الإجمالي العام',
        row_total: grandTotal,
      };

      columns.forEach((col) => {
        footerData[`col_${col.branchCode}`] = columnTotals[col.branchCode] || 0;
      });

      const totalRow = worksheet.addRow(footerData);
      totalRow.height = 28;
      totalRow.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF000000' } };
      totalRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFFF00' },
      };

      const footerDateCell = totalRow.getCell(1);
      footerDateCell.alignment = { vertical: 'middle', horizontal: 'center' };

      for (let colIdx = 2; colIdx <= columns.length + 2; colIdx++) {
        const cell = totalRow.getCell(colIdx);
        cell.numFmt = '#,##0.00';
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
      }

      totalRow.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'double', color: { argb: 'FF000000' } },
          left: { style: 'thin', color: { argb: 'FFD4D400' } },
          right: { style: 'thin', color: { argb: 'FFD4D400' } },
        };
      });

      // 5. Download Excel
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const fileName = `Daily_Revenue_Matrix_${viewMode}_${new Date().toISOString().split('T')[0]}.xlsx`;
      saveAs(blob, fileName);
    } catch (err) {
      console.error('Error exporting Matrix to Excel:', err);
    } finally {
      setExporting(false);
    }
  };

  /* -------------------------------------------------------------------------- */
  /* UI Table Rendering (Modern Enterprise Glass & Steel Style)                 */
  /* -------------------------------------------------------------------------- */
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm ring-1 ring-slate-900/5 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-900/60 dark:ring-white/10 space-y-4">
      {/* --- TODO: REMOVE BEFORE PRODUCTION (TEMP DEBUG) --- */}
      <div className="rounded-lg border border-dashed border-amber-300 bg-amber-50/70 p-3.5 dark:border-amber-800/60 dark:bg-amber-950/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Gamepad2 className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <div>
              <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                أداة فحص واختبار ألعاب الـ VR ومطابقة الحسابات (DEBUG TOOL)
              </span>
              <p className="text-[11px] text-amber-700 dark:text-amber-300">
                أدخل الكود <strong className="font-mono underline">18</strong> لإضافة لعبة <strong>Movy VR</strong> بمبيعات <strong>10,480 ج.م</strong> للتحقق من تطابق معادلات الصافي والضريبة.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={debugItemCode}
              onChange={(e) => setDebugItemCode(e.target.value)}
              placeholder="كود الصنف (مثال: 18)"
              className="h-8 w-32 rounded-md border border-amber-300 bg-white px-2.5 text-xs text-slate-800 dark:border-amber-700 dark:bg-zinc-900 dark:text-white"
              onKeyDown={(e) => e.key === 'Enter' && handleAddDebugComparison()}
            />
            <button
              type="button"
              onClick={handleAddDebugComparison}
              className="inline-flex h-8 items-center gap-1 rounded-md bg-amber-600 px-3 text-xs font-semibold text-white shadow-xs hover:bg-amber-700 active:scale-95"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>إضافة للمقارنة</span>
            </button>
            {tempDebugRows.length > 0 && (
              <button
                type="button"
                onClick={handleClearDebugRows}
                title="مسح بيانات الاختبار"
                className="inline-flex h-8 items-center gap-1 rounded-md border border-amber-300 bg-white px-2 text-xs font-medium text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:bg-zinc-800 dark:text-amber-200"
              >
                <X className="h-3.5 w-3.5" />
                <span>إلغاء</span>
              </button>
            )}
          </div>
        </div>
        {debugError && (
          <p className="mt-2 text-xs font-medium text-rose-600 dark:text-rose-400">
            {debugError}
          </p>
        )}
      </div>
      {/* --- END TEMP DEBUG --- */}

      {/* Matrix Header Toolbar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between border-b border-slate-100 pb-4 dark:border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
              <Grid3X3 className="h-4 w-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">{title}</h3>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
            {viewMode === 'net' && 'عرض صافي المبيعات (Net / Retail) المحتسبة بالمعادلة: الإجمالي ÷ 1.14'}
            {viewMode === 'vat' && 'عرض ضريبة القيمة المضافة (VAT 14%) المحتسبة بالمعادلة: الإجمالي - الصافي'}
            {viewMode === 'total' && 'عرض الإجمالي الشامل (Total Gross) المحتسب بالمعادلة: نقدي + فيزا + آجل'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* View Mode Toggle Group */}
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100/80 p-0.5 dark:border-zinc-800 dark:bg-zinc-900 shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode('net')}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                viewMode === 'net'
                  ? 'bg-white text-emerald-700 shadow-xs dark:bg-zinc-800 dark:text-emerald-400'
                  : 'text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              الصافي (Net Sales)
            </button>
            <button
              type="button"
              onClick={() => setViewMode('vat')}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                viewMode === 'vat'
                  ? 'bg-white text-amber-700 shadow-xs dark:bg-zinc-800 dark:text-amber-400'
                  : 'text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              الضريبة (VAT 14%)
            </button>
            <button
              type="button"
              onClick={() => setViewMode('total')}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                viewMode === 'total'
                  ? 'bg-white text-blue-700 shadow-xs dark:bg-zinc-800 dark:text-blue-400'
                  : 'text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              الإجمالي الشامل (Total Gross)
            </button>
          </div>

          <button
            type="button"
            onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200/80 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm ring-1 ring-slate-900/5 transition hover:bg-slate-50 dark:border-zinc-800/80 dark:bg-zinc-900/60 dark:ring-white/10 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <ArrowUpDown className="h-3.5 w-3.5" />
            <span>ترتيب: {sortOrder === 'asc' ? 'تصاعدي' : 'تنازلي'}</span>
          </button>

          <button
            type="button"
            onClick={handleExportToExcel}
            disabled={exporting || loading || matrixRows.length === 0}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-emerald-600 px-3.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95 disabled:opacity-50"
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

      {/* Matrix Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-zinc-800">
        <table className="w-full text-right text-sm" dir="rtl">
          <thead>
            {/* Header row with sleek modern enterprise styling */}
            <tr className="border-b border-slate-200 bg-slate-100/90 text-slate-700 dark:border-zinc-800 dark:bg-zinc-800/80 dark:text-zinc-200">
              <th className="sticky right-0 z-20 px-4 py-3.5 font-semibold text-center border-l border-slate-200 bg-slate-200/70 dark:border-zinc-700/80 dark:bg-zinc-800 min-w-[130px]">
                <div className="flex items-center justify-center gap-2">
                  <Calendar className="h-4 w-4 text-slate-500 dark:text-zinc-400" />
                  <span className="font-semibold text-slate-800 dark:text-zinc-100">التاريخ</span>
                </div>
              </th>
              {columns.map((col) => {
                const isDebugCol = col.branchCode.startsWith('VR-');
                return (
                  <th
                    key={col.branchCode}
                    className={`px-4 py-3.5 font-semibold text-center border-l border-slate-200/80 dark:border-zinc-700/60 min-w-[145px] whitespace-nowrap ${
                      isDebugCol ? 'bg-amber-100/70 dark:bg-amber-950/40 text-amber-950 dark:text-amber-200' : ''
                    }`}
                    title={`كود الفرع: ${col.branchCode}`}
                  >
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-1">
                        {isDebugCol && <Gamepad2 className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />}
                        <span className="font-semibold">{col.name}</span>
                      </div>
                      <span className="text-xs font-mono font-normal opacity-60">
                        {col.branchCode}
                      </span>
                    </div>
                  </th>
                );
              })}
              <th className="px-4 py-3.5 font-semibold text-left bg-slate-200/60 dark:bg-zinc-800/90 text-slate-800 dark:text-zinc-100 min-w-[145px]">
                الإجمالي اليومي
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60 font-mono tabular-nums tracking-tight">
            {loading ? (
              <tr>
                <td colSpan={columns.length + 2} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
                    <span className="text-sm font-sans font-medium">جاري تجميع وحساب مصفوفة الإيرادات...</span>
                  </div>
                </td>
              </tr>
            ) : matrixRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 2} className="py-10 text-center text-slate-400 text-sm font-sans">
                  لا توجد سجلات كافية لبناء المصفوفة
                </td>
              </tr>
            ) : (
              matrixRows.map((row) => (
                <tr
                  key={row.date}
                  className="transition hover:bg-slate-50 dark:hover:bg-zinc-800/40"
                >
                  {/* Date Column */}
                  <td className="sticky right-0 z-10 px-4 py-3 text-center font-medium text-slate-900 border-l border-slate-200/80 bg-slate-50/90 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-200">
                    {row.date}
                  </td>

                  {/* Caravan & Game Values */}
                  {columns.map((col) => {
                    const val = row.values[col.branchCode] || 0;
                    const isDebugCol = col.branchCode.startsWith('VR-');
                    return (
                      <td
                        key={col.branchCode}
                        className={`px-4 py-3 text-left font-medium border-l border-slate-100 dark:border-zinc-800/40 ${
                          isDebugCol ? 'bg-amber-50/40 dark:bg-amber-950/20 font-bold' : ''
                        } ${
                          val > 0
                            ? 'text-slate-800 dark:text-zinc-200'
                            : 'text-slate-300 dark:text-zinc-600'
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

                  {/* Row Total */}
                  <td className="px-4 py-3 text-left font-semibold text-slate-900 bg-slate-50/60 dark:bg-zinc-900/40 dark:text-white">
                    <Money value={row.rowTotal} />
                  </td>
                </tr>
              ))
            )}
          </tbody>

          {/* Grand Totals Footer */}
          {!loading && matrixRows.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-slate-300 bg-blue-50/80 font-semibold text-slate-900 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-100 font-mono tabular-nums tracking-tight">
                <td className="sticky right-0 z-10 px-4 py-3.5 text-center font-sans text-sm font-semibold border-l border-slate-300 dark:border-blue-800 bg-blue-100/70 dark:bg-blue-900/40">
                  الإجمالي العام
                </td>
                {columns.map((col) => {
                  const total = columnTotals[col.branchCode] || 0;
                  const isDebugCol = col.branchCode.startsWith('VR-');
                  return (
                    <td
                      key={col.branchCode}
                      className={`px-4 py-3.5 text-left font-semibold border-l border-slate-200 dark:border-blue-900/40 ${
                        isDebugCol ? 'bg-amber-100/50 dark:bg-amber-950/30 font-bold' : ''
                      }`}
                    >
                      {total.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                  );
                })}
                <td className="px-4 py-3.5 text-left text-sm font-bold bg-blue-100/90 dark:bg-blue-800/40 text-blue-950 dark:text-blue-50">
                  {grandTotal.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Accounting Footnote */}
      <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
        <span>
          * النمط الحالي: <strong>{viewMode === 'net' ? 'الصافي' : viewMode === 'vat' ? 'الضريبة 14%' : 'الإجمالي الشامل'}</strong> (المعادلة الموحدة: الإجمالي = نقدي + فيزا + آجل | الصافي = الإجمالي ÷ 1.14 | الضريبة = الإجمالي - الصافي)
        </span>
        <span className="font-mono font-medium">
          إجمالي محددات العرض: {fmtMoney(grandTotal)}
        </span>
      </div>
    </div>
  );
}

export default DailyRevenueMatrix;
