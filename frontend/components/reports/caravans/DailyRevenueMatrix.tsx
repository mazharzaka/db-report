'use client';

import React, { useMemo, useState } from 'react';
import { FileSpreadsheet, Loader2, Calendar, Grid3X3, ArrowUpDown } from 'lucide-react';
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

  // 1. Process & Pivot data: Extract unique columns (Caravans) and group by Date
  const { columns, matrixRows, columnTotals, grandTotal } = useMemo(() => {
    const colMap = new Map<string, string>();
    const dateMap = new Map<string, Map<string, number>>();

    rows.forEach((r) => {
      // Determine effective Date (from date or period property)
      const rawDate = ('date' in r && r.date) ? r.date : r.period;
      const dateKey = (rawDate || 'غير محدد').trim();
      const branchKey = String(r.branchCode || '').trim();
      const branchName = r.name || `منفذ ${branchKey}`;

      if (branchKey && !colMap.has(branchKey)) {
        colMap.set(branchKey, branchName);
      }

      // Calculate Total = Cash + Visa + C/L
      const cash = Number(r.cash) || 0;
      const visa = Number(r.visa) || 0;
      const cl = Number(r.creditLine ?? (r as any).cl) || 0;
      const rawTotal = (cash + visa + cl) > 0 ? (cash + visa + cl) : (Number(r.total) || 0);

      // Net Sales / Retail = Total / 1.14 (VAT 14% deduction)
      const retail = rawTotal / 1.14;

      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, new Map<string, number>());
      }

      const branchValues = dateMap.get(dateKey)!;
      const currentVal = branchValues.get(branchKey) || 0;
      branchValues.set(branchKey, currentVal + retail);
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
        const val = branchValues.get(col.branchCode) || 0;
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
  }, [rows, sortOrder]);

  /* -------------------------------------------------------------------------- */
  /* Excel Export using ExcelJS with exact legacy palette                       */
  /* -------------------------------------------------------------------------- */
  const handleExportToExcel = async () => {
    try {
      setExporting(true);

      const ExcelJS = (await import('exceljs')).default;
      const { saveAs } = (await import('file-saver')).default;

      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Dream Park ERP';
      workbook.created = new Date();

      const worksheet = workbook.addWorksheet('مصفوفة الإيرادات اليومية', {
        views: [{ rightToLeft: true }],
      });

      // 1. Setup Column Headers: Date, Caravans, Total
      const wsColumns: { header: string; key: string; width: number }[] = [
        { header: 'التاريخ', key: 'date', width: 16 },
        ...columns.map((col) => ({
          header: col.name,
          key: `col_${col.branchCode}`,
          width: 20,
        })),
        { header: 'الإجمالي اليومي', key: 'row_total', width: 20 },
      ];

      worksheet.columns = wsColumns;

      // 2. Format Header Row (Legacy Modernized Pink / Rose: #F4C7C3)
      const headerRow = worksheet.getRow(1);
      headerRow.height = 30;
      headerRow.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF1F2937' } };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF4C7C3' }, // Modernized legacy pink header
      };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

      // Apply borders to header
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

        // Date Cell (Legacy Light Blue: #BCE2E8)
        const dateCell = row.getCell(1);
        dateCell.alignment = { vertical: 'middle', horizontal: 'center' };
        dateCell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF0F172A' } };
        dateCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFBCE2E8' }, // Light Blue
        };

        // Numerical Cells (Col 2 to Total Col)
        for (let colIdx = 2; colIdx <= columns.length + 2; colIdx++) {
          const cell = row.getCell(colIdx);
          cell.numFmt = '#,##0.00';
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
          cell.font = { name: 'Arial', size: 10 };

          // Total column formatting
          if (colIdx === columns.length + 2) {
            cell.font = { name: 'Arial', size: 10, bold: true };
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFF1F5F9' },
            };
          }
        }

        // Full cell borders
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          };
        });
      });

      // 4. Totals Row (Footer)
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
        fgColor: { argb: 'FFFFFF00' }, // Classic Yellow Totals
      };

      const footerDateCell = totalRow.getCell(1);
      footerDateCell.alignment = { vertical: 'middle', horizontal: 'center' };

      for (let colIdx = 2; colIdx <= columns.length + 2; colIdx++) {
        const cell = totalRow.getCell(colIdx);
        cell.numFmt = '#,##0.00';
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
      }

      // Accounting borders on Totals row
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
      const fileName = `Daily_Revenue_Matrix_${new Date().toISOString().split('T')[0]}.xlsx`;
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
    <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm ring-1 ring-slate-900/5 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-900/60 dark:ring-white/10">
      {/* Matrix Header Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 dark:border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400">
              <Grid3X3 className="h-4 w-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">{title}</h3>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
            مصفوفة أفقية متقاطعة توزع صافي المبيعات (Retail / Net) يومياً عبر كافة كرافانات ومحلات الحديقة
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200/80 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm ring-1 ring-slate-900/5 transition hover:bg-slate-50 dark:border-zinc-800/80 dark:bg-zinc-900/60 dark:ring-white/10 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <ArrowUpDown className="h-3.5 w-3.5" />
            <span>ترتيب التاريخ: {sortOrder === 'asc' ? 'تصاعدي' : 'تنازلي'}</span>
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
      <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200 dark:border-zinc-800">
        <table className="w-full text-right text-sm" dir="rtl">
          <thead>
            {/* Header row with sleek modern enterprise styling (No red/pink) */}
            <tr className="border-b border-slate-200 bg-slate-100/90 text-slate-700 dark:border-zinc-800 dark:bg-zinc-800/80 dark:text-zinc-200">
              <th className="sticky right-0 z-20 px-4 py-3.5 font-semibold text-center border-l border-slate-200 bg-slate-200/70 dark:border-zinc-700/80 dark:bg-zinc-800 min-w-[130px]">
                <div className="flex items-center justify-center gap-2">
                  <Calendar className="h-4 w-4 text-slate-500 dark:text-zinc-400" />
                  <span className="font-semibold text-slate-800 dark:text-zinc-100">التاريخ</span>
                </div>
              </th>
              {columns.map((col) => (
                <th
                  key={col.branchCode}
                  className="px-4 py-3.5 font-semibold text-center border-l border-slate-200/80 dark:border-zinc-700/60 min-w-[145px] whitespace-nowrap"
                  title={`كود الفرع: ${col.branchCode}`}
                >
                  <div className="flex flex-col items-center">
                    <span className="text-slate-800 dark:text-zinc-100 font-semibold">{col.name}</span>
                    <span className="text-xs font-mono font-normal opacity-60">
                      {col.branchCode}
                    </span>
                  </div>
                </th>
              ))}
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
                  {/* Date Column: Clean subtle contrasting tone */}
                  <td className="sticky right-0 z-10 px-4 py-3 text-center font-medium text-slate-900 border-l border-slate-200/80 bg-slate-50/90 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-200">
                    {row.date}
                  </td>

                  {/* Caravan Values */}
                  {columns.map((col) => {
                    const val = row.values[col.branchCode] || 0;
                    return (
                      <td
                        key={col.branchCode}
                        className={`px-4 py-3 text-left font-medium border-l border-slate-100 dark:border-zinc-800/40 ${
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

          {/* Grand Totals Footer: Modern Enterprise Accent Theme (No yellow) */}
          {!loading && matrixRows.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-slate-300 bg-blue-50/80 font-semibold text-slate-900 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-100 font-mono tabular-nums tracking-tight">
                <td className="sticky right-0 z-10 px-4 py-3.5 text-center font-sans text-sm font-semibold border-l border-slate-300 dark:border-blue-800 bg-blue-100/70 dark:bg-blue-900/40">
                  الإجمالي العام
                </td>
                {columns.map((col) => {
                  const total = columnTotals[col.branchCode] || 0;
                  return (
                    <td
                      key={col.branchCode}
                      className="px-4 py-3.5 text-left font-semibold border-l border-slate-200 dark:border-blue-900/40"
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
      <div className="mt-3 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400">
        <span>* القيم المعروضة تمثل صافي المبيعات (Retail / Net) بعد استبعاد 14% ضريبة القيمة المضافة</span>
        <span className="font-mono">
          إجمالي المصفوفة: {fmtMoney(grandTotal)}
        </span>
      </div>
    </div>
  );
}

export default DailyRevenueMatrix;
