'use client';

import React, { useState } from 'react';
import { FileSpreadsheet, Loader2, Banknote, Receipt } from 'lucide-react';
import type { CaravanRecord } from '@/types/reports';
import { fmtInt, fmtMoney, Money } from './charts';

/* -------------------------------------------------------------------------- */
/* Types & Props                                                              */
/* -------------------------------------------------------------------------- */

export interface SettlementRow {
  branchCode: string;
  name: string;
  cover: number; // Orders / Cover count
  cash: number;
  visa: number;
  cl: number;
  total: number;
  retail: number; // Net before VAT (Total / 1.14)
  vat: number; // VAT 14% (Total - Retail)
}

interface DailySettlementProps {
  rows?: CaravanRecord[];
  date?: string;
  loading?: boolean;
}

/* -------------------------------------------------------------------------- */
/* Component Implementation                                                   */
/* -------------------------------------------------------------------------- */

export function DailySettlement({
  rows = [],
  date,
  loading = false,
}: DailySettlementProps) {
  const [exporting, setExporting] = useState(false);

  // 1. Calculate accounting settlement figures on-the-fly for each branch
  const settlementData: SettlementRow[] = rows.map((r) => {
    const cash = Number(r.cash) || 0;
    const visa = Number(r.visa) || 0;
    const cl = Number(r.creditLine ?? (r as any).cl) || 0;
    const cover = Number(r.cover) || 0;

    // Total = Cash + Visa + C/L
    const total = cash + visa + cl;

    // Retail / Net = Total / 1.14
    const retail = total / 1.14;

    // VAT = Total - Retail
    const vat = total - retail;

    return {
      branchCode: r.branchCode,
      name: r.name,
      cover,
      cash,
      visa,
      cl,
      total,
      retail,
      vat,
    };
  });

  // 2. Aggregate Totals for Summary Footer & Validation
  const grandTotals = settlementData.reduce(
    (acc, row) => ({
      cover: acc.cover + row.cover,
      retail: acc.retail + row.retail,
      vat: acc.vat + row.vat,
      total: acc.total + row.total,
      cash: acc.cash + row.cash,
      visa: acc.visa + row.visa,
      cl: acc.cl + row.cl,
    }),
    { cover: 0, retail: 0, vat: 0, total: 0, cash: 0, visa: 0, cl: 0 }
  );

  /* -------------------------------------------------------------------------- */
  /* ExcelJS Export Function (Matching Legacy Dream Park System)                */
  /* -------------------------------------------------------------------------- */
  const handleExportToExcel = async () => {
    try {
      setExporting(true);

      const ExcelJS = (await import('exceljs')).default;

      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Dream Park ERP';
      workbook.created = new Date();

      const worksheet = workbook.addWorksheet('التسوية النقدية اليومية', {
        views: [{ rightToLeft: true }],
      });

      // Define Columns exactly in required legacy sequence
      worksheet.columns = [
        { header: 'البيان (المنفذ)', key: 'name', width: 28 },
        { header: 'العدد (Cover)', key: 'cover', width: 15 },
        { header: 'الصافي (Retail)', key: 'retail', width: 20 },
        { header: 'الضريبة (VAT)', key: 'vat', width: 18 },
        { header: 'الإجمالي (Total)', key: 'total', width: 20 },
        { header: 'النقدي (Cash)', key: 'cash', width: 18 },
        { header: 'الفيزا (Visa)', key: 'visa', width: 18 },
        { header: 'آجل (C/L)', key: 'cl', width: 16 },
      ];

      // Format Header Row (Row 1)
      const headerRow = worksheet.getRow(1);
      headerRow.height = 28;
      headerRow.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF000000' } };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }, // Classic Excel Light Grey
      };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

      // Apply borders to header cells
      headerRow.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF999999' } },
          bottom: { style: 'medium', color: { argb: 'FF666666' } },
          left: { style: 'thin', color: { argb: 'FF999999' } },
          right: { style: 'thin', color: { argb: 'FF999999' } },
        };
      });

      // Populate Data Rows
      settlementData.forEach((item) => {
        const row = worksheet.addRow({
          name: item.name,
          cover: item.cover,
          retail: item.retail,
          vat: item.vat,
          total: item.total,
          cash: item.cash,
          visa: item.visa,
          cl: item.cl,
        });

        row.height = 22;
        row.alignment = { vertical: 'middle' };

        // Cell 1: Outlet name (Right-aligned in RTL)
        const nameCell = row.getCell(1);
        nameCell.alignment = { vertical: 'middle', horizontal: 'right' };

        // Cell 2: Cover count (Integer formatted)
        const coverCell = row.getCell(2);
        coverCell.numFmt = '#,##0';
        coverCell.alignment = { vertical: 'middle', horizontal: 'center' };

        // Cells 3-8: Financial metrics formatted to 2 decimals
        for (let col = 3; col <= 8; col++) {
          const cell = row.getCell(col);
          cell.numFmt = '#,##0.00';
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
        }

        // Add subtle borders
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE5E5E5' } },
            bottom: { style: 'thin', color: { argb: 'FFE5E5E5' } },
            left: { style: 'thin', color: { argb: 'FFE5E5E5' } },
            right: { style: 'thin', color: { argb: 'FFE5E5E5' } },
          };
        });
      });

      // Totals Row (Footer)
      const totalRow = worksheet.addRow({
        name: 'الإجمالي العام',
        cover: grandTotals.cover,
        retail: grandTotals.retail,
        vat: grandTotals.vat,
        total: grandTotals.total,
        cash: grandTotals.cash,
        visa: grandTotals.visa,
        cl: grandTotals.cl,
      });

      totalRow.height = 26;
      totalRow.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF000000' } };

      // Mandatory Legacy Dream Park Yellow Fill
      totalRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFFF00' }, // Pure Yellow FFFF00
      };

      const totalNameCell = totalRow.getCell(1);
      totalNameCell.alignment = { vertical: 'middle', horizontal: 'center' };

      const totalCoverCell = totalRow.getCell(2);
      totalCoverCell.numFmt = '#,##0';
      totalCoverCell.alignment = { vertical: 'middle', horizontal: 'center' };

      for (let col = 3; col <= 8; col++) {
        const cell = totalRow.getCell(col);
        cell.numFmt = '#,##0.00';
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
      }

      // Strong accounting double border on total row
      totalRow.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'double', color: { argb: 'FF000000' } },
          left: { style: 'thin', color: { argb: 'FFD4D400' } },
          right: { style: 'thin', color: { argb: 'FFD4D400' } },
        };
      });

      // Generate Buffer and trigger download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const fileName = `Daily_Settlement_${date || new Date().toISOString().split('T')[0]}.xlsx`;

      let downloaded = false;
      try {
        const fileSaverMod = await import('file-saver');
        const saveAsFn =
          (fileSaverMod as any).saveAs ||
          (fileSaverMod as any).default?.saveAs ||
          (fileSaverMod as any).default;

        if (typeof saveAsFn === 'function') {
          saveAsFn(blob, fileName);
          downloaded = true;
        }
      } catch (saveErr) {
        console.warn('file-saver dynamic import error, using native fallback:', saveErr);
      }

      if (!downloaded && typeof window !== 'undefined') {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        }, 200);
      }
    } catch (err) {
      console.error('Error exporting settlement to Excel:', err);
    } finally {
      setExporting(false);
    }
  };

  /* -------------------------------------------------------------------------- */
  /* Render UI Table & Modern Enterprise Layout                                 */
  /* -------------------------------------------------------------------------- */
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm ring-1 ring-slate-900/5 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-900/60 dark:ring-white/10">
      {/* Header Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 dark:border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
              <Banknote className="h-4 w-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              التسوية النقدية اليومية (Daily Cash Settlement)
            </h3>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
            توزيع الإيرادات المحصلة، احتساب صافي المبيعات، وضريبة القيمة المضافة (14% VAT) لكل منفذ
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportToExcel}
            disabled={exporting || loading || settlementData.length === 0}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-emerald-600 px-3.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95 disabled:opacity-50"
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="h-4 w-4" />
            )}
            <span>تصدير التسوية (Excel)</span>
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200/70 dark:border-zinc-800/70">
        <table className="w-full text-right text-xs" dir="rtl">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-700 dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-300">
              <th className="px-3.5 py-3 font-bold">المنفذ / الكرفان</th>
              <th className="px-3.5 py-3 font-bold text-center">العدد (Cover)</th>
              <th className="px-3.5 py-3 font-bold text-left">الصافي (Retail)</th>
              <th className="px-3.5 py-3 font-bold text-left">الضريبة (VAT 14%)</th>
              <th className="px-3.5 py-3 font-bold text-left bg-slate-100/70 dark:bg-zinc-900/60">
                الإجمالي (Total)
              </th>
              <th className="px-3.5 py-3 font-bold text-left text-emerald-700 dark:text-emerald-400">
                النقدي (Cash)
              </th>
              <th className="px-3.5 py-3 font-bold text-left text-indigo-700 dark:text-indigo-400">
                الفيزا (Visa)
              </th>
              <th className="px-3.5 py-3 font-bold text-left text-amber-700 dark:text-amber-400">
                آجل (C/L)
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60 font-mono tabular-nums tracking-tight">
            {loading ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
                    <span>جاري تحميل بيانات التسوية المالية...</span>
                  </div>
                </td>
              </tr>
            ) : settlementData.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-10 text-center text-slate-400">
                  لا توجد فروع مسجلة لهذه الفترة
                </td>
              </tr>
            ) : (
              settlementData.map((row) => (
                <tr
                  key={row.branchCode}
                  className="transition hover:bg-slate-50/60 dark:hover:bg-zinc-800/40"
                >
                  <td className="px-3.5 py-2.5 font-sans font-semibold text-slate-800 dark:text-zinc-200">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono font-normal text-slate-400 dark:text-zinc-500">
                        {row.branchCode}
                      </span>
                      <span>{row.name}</span>
                    </div>
                  </td>
                  <td className="px-3.5 py-2.5 text-center font-bold text-slate-600 dark:text-zinc-400">
                    {fmtInt(row.cover)}
                  </td>
                  <td className="px-3.5 py-2.5 text-left text-slate-700 dark:text-zinc-300">
                    <Money value={row.retail} />
                  </td>
                  <td className="px-3.5 py-2.5 text-left text-slate-500 dark:text-zinc-400">
                    <Money value={row.vat} />
                  </td>
                  <td className="px-3.5 py-2.5 text-left font-bold text-slate-900 bg-slate-50/50 dark:bg-zinc-900/40 dark:text-white">
                    <Money value={row.total} />
                  </td>
                  <td className="px-3.5 py-2.5 text-left text-emerald-600 dark:text-emerald-400 font-semibold">
                    <Money value={row.cash} />
                  </td>
                  <td className="px-3.5 py-2.5 text-left text-indigo-600 dark:text-indigo-400 font-semibold">
                    <Money value={row.visa} />
                  </td>
                  <td className="px-3.5 py-2.5 text-left text-amber-600 dark:text-amber-400">
                    <Money value={row.cl} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {/* Legacy Highlighted Totals Row */}
          {!loading && settlementData.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-slate-300 bg-amber-300/80 font-bold text-slate-900 dark:bg-amber-400 dark:text-zinc-950 font-mono tabular-nums tracking-tight shadow-inner">
                <td className="px-3.5 py-3 font-sans text-sm font-black">الإجمالي العام (Total)</td>
                <td className="px-3.5 py-3 text-center text-sm font-black">
                  {fmtInt(grandTotals.cover)}
                </td>
                <td className="px-3.5 py-3 text-left">
                  {grandTotals.retail.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
                <td className="px-3.5 py-3 text-left">
                  {grandTotals.vat.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
                <td className="px-3.5 py-3 text-left font-black text-sm">
                  {grandTotals.total.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
                <td className="px-3.5 py-3 text-left">
                  {grandTotals.cash.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
                <td className="px-3.5 py-3 text-left">
                  {grandTotals.visa.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
                <td className="px-3.5 py-3 text-left">
                  {grandTotals.cl.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Audit Footnote */}
      <div className="mt-3 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400">
        <span>* تم احتساب الصافي على أساس نسبة 14% ضريبة قيمة مضافة (Total / 1.14)</span>
        <span className="font-mono">
          إجمالي الإيرادات الخاضعة للتسوية: {fmtMoney(grandTotals.total)}
        </span>
      </div>
    </div>
  );
}

export default DailySettlement;
