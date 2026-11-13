'use client';

import React, { useMemo, useState } from 'react';
import {
  FileText,
  Search,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import type { InvoiceRecord, VoidDetailItem } from '@/types/reports';
import { fmtMoney } from './charts';

interface InvoicesTableProps {
  invoices?: InvoiceRecord[];
  loading?: boolean;
  className?: string;
  defaultShowVoidsInPrint?: boolean;
}

// عينة بيانات فواتير مرتجعات واقعية من نظام دريم بارك
const SAMPLE_VOID_INVOICES: InvoiceRecord[] = [
  {
    id: 'INV-1004-9821',
    docNo: '9821',
    docDate: '2026-10-25',
    docTime: '14:22:10',
    branchCode: '1004',
    branchName: 'Car4 - الشلال',
    cashierName: 'أحمد محمود',
    paymentMethod: 'نقدي (Cash)',
    subtotal: 420.0,
    tax: 58.8,
    service: 0,
    total: 478.8,
    totalVoids: 85.0,
    voidDetails: [
      {
        itemCode: '111070',
        itemName: 'ماء معدني صغير',
        docDate: '2026-10-25',
        docTime: '14:25:01',
        quantity: 2,
        price: 15.0,
        total: 30.0,
      },
      {
        itemCode: '114022',
        itemName: 'سندوتش برجر سوبريم',
        docDate: '2026-10-25',
        docTime: '14:26:15',
        quantity: 1,
        price: 55.0,
        total: 55.0,
      },
    ],
  },
  {
    id: 'INV-1008-5412',
    docNo: '5412',
    docDate: '2026-10-25',
    docTime: '15:10:44',
    branchCode: '1008',
    branchName: 'Car8 - النهر',
    cashierName: 'إبراهيم حسن',
    paymentMethod: 'فيزا (Visa)',
    subtotal: 650.0,
    tax: 91.0,
    service: 0,
    total: 741.0,
    totalVoids: 120.0,
    voidDetails: [
      {
        itemCode: '115001',
        itemName: 'وجبة كريسبي عائلي',
        docDate: '2026-10-25',
        docTime: '15:15:30',
        quantity: 1,
        price: 120.0,
        total: 120.0,
      },
    ],
  },
  {
    id: 'INV-1027-8109',
    docNo: '8109',
    docDate: '2026-10-25',
    docTime: '17:40:22',
    branchCode: '1027',
    branchName: 'Car_ZOO',
    cashierName: 'كريم عادل',
    paymentMethod: 'نقدي (Cash)',
    subtotal: 510.0,
    tax: 71.4,
    service: 0,
    total: 581.4,
    totalVoids: 45.0,
    voidDetails: [
      {
        itemCode: '112015',
        itemName: 'عصير برتقال فريش',
        docDate: '2026-10-25',
        docTime: '17:43:00',
        quantity: 1,
        price: 45.0,
        total: 45.0,
      },
    ],
  },
];

export function InvoicesTable({
  invoices = SAMPLE_VOID_INVOICES,
  loading = false,
  className = '',
  defaultShowVoidsInPrint = false,
}: InvoicesTableProps) {
  const [query, setQuery] = useState('');
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [showVoidsInPrint, setShowVoidsInPrint] = useState(defaultShowVoidsInPrint);

  // النقر في أي مكان في الصف لتبديل حالة التوسيع/الطي
  const toggleRow = (id: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // 1. تصفية صارمة: عرض الفواتير التي تحتوي على مرتجعات فقط (totalVoids > 0)
  const voidInvoices = useMemo(() => {
    return (invoices || []).filter((inv) => (Number(inv.totalVoids) || 0) > 0);
  }, [invoices]);

  // 2. البحث والتصفية بحسب رقم الفاتورة أو المحل
  const filteredInvoices = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return voidInvoices;
    return voidInvoices.filter(
      (inv) =>
        String(inv.docNo).toLowerCase().includes(q) ||
        String(inv.branchCode).toLowerCase().includes(q) ||
        inv.branchName.toLowerCase().includes(q)
    );
  }, [voidInvoices, query]);

  // إجماليات فواتير المرتجعات
  const totalInvoicesAmount = useMemo(
    () => filteredInvoices.reduce((sum, inv) => sum + (Number(inv.total) || 0), 0),
    [filteredInvoices]
  );
  const totalAllVoids = useMemo(
    () => filteredInvoices.reduce((sum, inv) => sum + (Number(inv.totalVoids) || 0), 0),
    [filteredInvoices]
  );

  // حالة التحميل الأولي
  if (loading && (!invoices || invoices.length === 0)) {
    return (
      <div className={`rounded-xl border border-slate-200/80 bg-white p-8 text-center shadow-sm ring-1 ring-slate-900/5 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-900/60 dark:ring-white/10 ${className}`}>
        <div className="flex h-10 w-10 mx-auto animate-spin items-center justify-center rounded-full border-2 border-orange-500 border-t-transparent" />
        <p className="mt-3 text-xs font-semibold text-slate-500 dark:text-zinc-400">جاري فحص وتدقيق سجل المرتجعات...</p>
      </div>
    );
  }

  // 3. حالة عدم وجود مرتجعات (Smart Reassuring Empty State)
  if (!loading && voidInvoices.length === 0) {
    return (
      <div
        className={`rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-8 text-center shadow-sm ring-1 ring-emerald-500/20 backdrop-blur-md dark:border-emerald-500/20 dark:bg-emerald-950/20 ${className}`}
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-xs">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h3 className="mt-3.5 text-base font-bold text-slate-900 dark:text-white">
          لا توجد أي مرتجعات مسجلة في هذه الفترة
        </h3>
        <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
          جميع العمليات والفواتير مكتملة بصورة سليمة دون وجود أي فواتير ملغاة أو مرتجعة.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm ring-1 ring-slate-900/5 backdrop-blur-md print:border-none print:shadow-none print:p-0 dark:border-zinc-800/80 dark:bg-zinc-900/60 dark:ring-white/10 ${className}`}
    >
      {/* Header and Controls */}
      <div className="flex flex-col gap-3 border-b border-slate-200 dark:border-white/5 p-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400">
              <FileText className="h-4 w-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              سجل فواتير المرتجعات (Voided Invoices Report)
            </h3>
            <span className="rounded-full bg-rose-50 border border-rose-200/70 px-2.5 py-0.5 text-xs font-semibold text-rose-700 dark:bg-rose-950/40 dark:border-rose-900/40 dark:text-rose-300">
              {filteredInvoices.length} فاتورة مرتجعة
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
            تقرير رقابي مخصص للفواتير ذات البنود الملغاة أو المرتجعة. اضغط على أي صف لعرض تفاصيل الأصناف المسترجعة.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Smart Print Control Checkbox */}
          <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs cursor-pointer select-none transition hover:bg-slate-100 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800">
            <input
              type="checkbox"
              checked={showVoidsInPrint}
              onChange={(e) => setShowVoidsInPrint(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-slate-300 text-rose-600 focus:ring-rose-500 dark:border-zinc-700 dark:bg-zinc-900"
            />
            <span>إظهار تفاصيل المرتجعات في الطباعة</span>
          </label>

          {/* Search Input */}
          <div className="relative">
            <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-zinc-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="بحث برقم الفاتورة أو المحل..."
              className="w-56 rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-3 pr-9 text-xs text-slate-900 outline-none transition focus:border-rose-500 focus:ring-1 focus:ring-rose-500 dark:border-white/5 dark:bg-zinc-950 dark:text-zinc-200 placeholder:text-slate-400"
            />
          </div>
        </div>
      </div>

      {/* Main Invoices Table (Clutter-free: Cashier removed) */}
      <div className={`overflow-x-auto scroll-smooth max-h-[640px] print:max-h-none ${loading ? 'opacity-60' : ''}`}>
        <table className="w-full border-collapse text-xs text-right print:w-full print:table-fixed">
          <thead className="sticky top-0 z-20 bg-slate-100 dark:bg-zinc-950 shadow-xs border-b border-slate-200 dark:border-white/5">
            <tr>
              <th className="px-4 py-3 font-bold text-slate-900 dark:text-slate-100 text-right">رقم الفاتورة</th>
              <th className="px-4 py-3 font-bold text-slate-600 dark:text-zinc-400 text-center">التاريخ والوقت</th>
              <th className="px-4 py-3 font-bold text-slate-600 dark:text-zinc-400 text-right">المحل / الكرافان</th>
              <th className="px-4 py-3 font-bold text-slate-600 dark:text-zinc-400 text-center">طريقة الدفع</th>
              <th className="px-4 py-3 font-bold text-slate-900 dark:text-slate-100 text-left" dir="ltr">قيمة الفاتورة</th>
              <th className="px-4 py-3 font-bold text-rose-700 dark:text-rose-400 text-left" dir="ltr">المرتجعات (Voids)</th>
              <th className="w-10 px-3 py-3 text-center print:hidden"></th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80">
            {filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400 dark:text-zinc-500">
                  لا توجد فواتير مرتجعة مطابقة للبحث
                </td>
              </tr>
            ) : (
              filteredInvoices.map((inv, idx) => {
                const isEven = idx % 2 === 0;
                const isExpanded = Boolean(expandedRows[inv.id]);
                const hasVoids = Boolean(inv.voidDetails && inv.voidDetails.length > 0);

                return (
                  <React.Fragment key={inv.id}>
                    {/* Parent Invoice Row - Trigger: Clicking ANYWHERE on this row expands/collapses */}
                    <tr
                      onClick={() => toggleRow(inv.id)}
                      className={`cursor-pointer transition-colors duration-150 select-none ${
                        isExpanded
                          ? 'bg-slate-100/90 dark:bg-zinc-800/60'
                          : isEven
                          ? 'bg-white hover:bg-slate-50/80 dark:bg-zinc-950/40 dark:hover:bg-white/5'
                          : 'bg-slate-50/50 hover:bg-slate-100/70 dark:bg-zinc-950/70 dark:hover:bg-white/5'
                      }`}
                    >
                      <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-white print:text-black">
                        #{inv.docNo}
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-slate-600 dark:text-zinc-400 print:text-black" dir="ltr">
                        {inv.docDate} {inv.docTime || ''}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-900 dark:text-white print:text-black">{inv.branchName}</span>
                          <span className="font-mono text-[10px] text-slate-400 dark:text-zinc-500">#{inv.branchCode}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:bg-slate-800 dark:text-zinc-300 print:bg-transparent print:border print:border-black print:text-black">
                          {inv.paymentMethod}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-left font-mono font-extrabold text-slate-900 dark:text-slate-100 print:text-black" dir="ltr">
                        {fmtMoney(inv.total)}
                      </td>
                      <td className="px-4 py-3 text-left" dir="ltr">
                        <span className="font-mono font-bold text-rose-600 dark:text-rose-400 print:text-black print:font-bold">
                          ({fmtMoney(inv.totalVoids || 0)})
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center print:hidden">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 text-slate-500 dark:border-white/10 dark:text-zinc-400">
                          {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                        </span>
                      </td>
                    </tr>

                    {/* Nested Void Details Sub-Table */}
                    {isExpanded && (
                      <tr
                        className={`void-details-subtable-row border-b border-slate-200 dark:border-white/10 ${
                          showVoidsInPrint ? 'print:table-row print:bg-white print:border-black' : 'print:hidden'
                        }`}
                      >
                        <td colSpan={7} className="p-0">
                          {/* Accent Right Border & Subtle Transparent Tint */}
                          <div className="border-r-4 border-rose-500 bg-rose-50/30 dark:bg-rose-950/10 p-3 sm:px-6 py-3.5 space-y-2.5">
                            {/* Sub-Table Header */}
                            <div className="flex items-center justify-between text-xs text-slate-800 dark:text-zinc-200 print:text-black">
                              <div className="flex items-center gap-2">
                                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 print:border print:border-black">
                                  <RotateCcw className="h-3 w-3" />
                                </span>
                                <span className="font-bold">
                                  تفاصيل الأصناف الملغاة للفاتورة #{inv.docNo} ({inv.branchName})
                                </span>
                                <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 dark:bg-rose-950/60 px-2.5 py-0.5 text-[11px] font-bold text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-900/50">
                                  مرتجع (Void)
                                </span>
                              </div>
                              <div className="flex items-center gap-1 font-mono text-xs" dir="ltr">
                                <span className="font-bold text-rose-600 dark:text-rose-400">
                                  ({fmtMoney(inv.totalVoids || 0)})
                                </span>
                                <span className="text-slate-500 dark:text-zinc-400 font-sans">:إجمالي المرتجع</span>
                              </div>
                            </div>

                            {/* Nested Table: 5 Columns [اسم الصنف | كود الصنف | التاريخ والوقت | الكمية | الإجمالي] */}
                            <div className="overflow-x-auto rounded-xl border border-slate-200/80 bg-white dark:border-white/10 dark:bg-[#09090b] shadow-xs print:border print:border-black print:bg-transparent">
                              <table className="w-full text-right text-xs print:text-[8pt]">
                                <thead className="bg-slate-100/90 dark:bg-[#121214] text-slate-700 dark:text-zinc-300 border-b border-slate-200/80 dark:border-white/10 print:bg-slate-100 print:border-b print:border-black">
                                  <tr>
                                    <th className="px-3.5 py-2 font-bold">اسم الصنف</th>
                                    <th className="px-3.5 py-2 font-bold text-center">كود الصنف</th>
                                    <th className="px-3.5 py-2 font-bold text-center">التاريخ والوقت</th>
                                    <th className="px-3.5 py-2 font-bold text-center">الكمية</th>
                                    <th className="px-3.5 py-2 font-bold text-left" dir="ltr">الإجمالي</th>
                                  </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-100 dark:divide-white/5 print:divide-black">
                                  {hasVoids ? (
                                    inv.voidDetails!.map((item, vIdx) => {
                                      const lineTotal = Number(item.total) || (Number(item.quantity) * Number(item.price || 0));
                                      return (
                                        <tr key={vIdx} className="hover:bg-slate-50/80 dark:hover:bg-white/5 transition-colors print:bg-transparent">
                                          <td className="px-3.5 py-2 font-semibold text-slate-900 dark:text-white print:text-black">
                                            {item.itemName}
                                          </td>
                                          <td className="px-3.5 py-2 text-center font-mono text-slate-500 dark:text-zinc-400 print:text-black">
                                            {item.itemCode}
                                          </td>
                                          <td className="px-3.5 py-2 text-center font-mono text-slate-600 dark:text-zinc-300 print:text-black" dir="ltr">
                                            {item.docDate} {item.docTime || ''}
                                          </td>
                                          <td className="px-3.5 py-2 text-center font-mono font-medium text-slate-800 dark:text-zinc-200 print:text-black">
                                            {item.quantity}
                                          </td>
                                          {/* RED/ROSE color applied to negative deduction amounts inside parentheses */}
                                          <td className="px-3.5 py-2 text-left font-mono font-bold text-rose-600 dark:text-rose-400 print:text-black print:font-bold" dir="ltr">
                                            ({fmtMoney(lineTotal)})
                                          </td>
                                        </tr>
                                      );
                                    })
                                  ) : (
                                    <tr>
                                      <td colSpan={5} className="py-4 text-center text-slate-400 dark:text-zinc-500">
                                        لا توجد أصناف مرتجعة مسجلة لهذه الفاتورة
                                      </td>
                                    </tr>
                                  )}
                                </tbody>

                                {/* Verification Sum Footer */}
                                {hasVoids && (
                                  <tfoot className="border-t-2 border-slate-300 bg-slate-100/90 dark:border-white/10 dark:bg-[#121214] print:border-t-2 print:border-black print:bg-slate-100 font-bold">
                                    <tr>
                                      <td colSpan={3} className="px-3.5 py-2 text-right text-xs font-bold text-slate-800 dark:text-zinc-200 print:text-black">
                                        إجمالي المرتجعات (المطابقة الفورية):
                                      </td>
                                      <td className="px-3.5 py-2 text-center font-mono text-xs font-bold text-slate-800 dark:text-zinc-200 print:text-black">
                                        {inv.voidDetails!.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0)}
                                      </td>
                                      <td className="px-3.5 py-2 text-left font-mono text-sm font-extrabold text-rose-600 dark:text-rose-400 print:text-black" dir="ltr">
                                        ({fmtMoney(
                                          inv.voidDetails!.reduce(
                                            (sum, item) => sum + (Number(item.total) || (Number(item.quantity) * Number(item.price || 0))),
                                            0
                                          )
                                        )})
                                      </td>
                                    </tr>
                                  </tfoot>
                                )}
                              </table>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>

          {/* Grand Footer */}
          {filteredInvoices.length > 0 && (
            <tfoot className="sticky bottom-0 z-20 bg-slate-100 font-bold border-t border-slate-200 dark:bg-zinc-950 dark:border-white/10 shadow-inner print:shadow-none print:bg-transparent">
              <tr>
                <td colSpan={4} className="px-4 py-3.5 text-right font-bold text-slate-900 dark:text-slate-100 print:text-black">
                  إجمالي فواتير المرتجعات للفترة المعروضة
                </td>
                <td className="px-4 py-3.5 text-left font-mono font-extrabold text-slate-900 dark:text-slate-100 print:text-black" dir="ltr">
                  {fmtMoney(totalInvoicesAmount)}
                </td>
                <td className="px-4 py-3.5 text-left font-mono font-extrabold text-rose-600 dark:text-rose-400 print:text-black" dir="ltr">
                  ({fmtMoney(totalAllVoids)})
                </td>
                <td className="print:hidden"></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Footer Info */}
      <div className="flex flex-col gap-2 border-t border-slate-200 dark:border-white/5 p-3 text-xs text-slate-500 dark:text-zinc-400 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <span className="flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
          <span>الضغط على أي سطر فاتورة يفتح/يغلق تفاصيل الأصناف الملغاة مباشرة.</span>
        </span>
        <span className="text-[11px] text-slate-400 font-mono">
          Page-break avoid configured
        </span>
      </div>
    </div>
  );
}
