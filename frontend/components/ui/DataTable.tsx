'use client';

import React, { useState, useMemo } from 'react';
import { ArrowUpDown, ChevronDown, ChevronUp, Search, Eye, Columns } from 'lucide-react';

export interface ColumnDef<T> {
  key: keyof T | string;
  header: string;
  render?: (row: T) => React.ReactNode;
  numeric?: boolean;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  format?: (value: any) => string;
  footer?: (rows: T[]) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  searchPlaceholder?: string;
  searchKey?: keyof T;
  emptyMessage?: string;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  searchPlaceholder = 'بحث سريع في السجلات...',
  searchKey,
  emptyMessage = 'لا توجد بيانات متاحة للعرض للفترة المحددة'
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() =>
    columns.reduce((acc, col) => ({ ...acc, [String(col.key)]: true }), {})
  );
  const [showColumnMenu, setShowColumnMenu] = useState(false);

  // 1. تصفية البيانات محلياً عبر مربع البحث
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const term = searchTerm.toLowerCase();
    return data.filter((row) => {
      if (searchKey && row[searchKey]) {
        return String(row[searchKey]).toLowerCase().includes(term);
      }
      return Object.values(row).some((val) =>
        val !== null && val !== undefined && String(val).toLowerCase().includes(term)
      );
    });
  }, [data, searchTerm, searchKey]);

  // 2. فرز البيانات تصاعدياً أو تنازلياً
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];

      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      const numA = Number(aVal);
      const numB = Number(bVal);
      const isNumeric = !isNaN(numA) && !isNaN(numB);

      const compare = isNumeric ? (numA > numB ? 1 : -1) : String(aVal).localeCompare(String(bVal), 'ar');
      return sortDirection === 'asc' ? compare : -compare;
    });
  }, [filteredData, sortKey, sortDirection]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDirection === 'desc') setSortDirection('asc');
      else setSortKey(null);
    } else {
      setSortKey(key);
      setSortDirection('desc');
    }
  };

  const activeCols = columns.filter((c) => visibleColumns[String(c.key)]);

  return (
    <div className="w-full bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden font-sans">
      {/* شريط الأدوات: البحث والتحكم في إظهار الأعمدة */}
      <div className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50">
        <div className="relative w-full sm:w-80">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pr-9 pl-4 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800 dark:text-slate-100"
          />
        </div>

        <div className="relative self-end sm:self-auto">
          <button
            onClick={() => setShowColumnMenu(!showColumnMenu)}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 shadow-xs transition"
          >
            <Columns className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>الأعمدة ({activeCols.length}/{columns.length})</span>
          </button>

          {showColumnMenu && (
            <div className="absolute left-0 mt-2 w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl p-2.5 z-40">
              <div className="text-xs font-bold text-slate-400 mb-2 px-2">تخصيص رؤية الأعمدة</div>
              <div className="max-h-60 overflow-y-auto space-y-1">
                {columns.map((col) => (
                  <label
                    key={String(col.key)}
                    className="flex items-center gap-2.5 px-2.5 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-200"
                  >
                    <input
                      type="checkbox"
                      checked={!!visibleColumns[String(col.key)]}
                      onChange={(e) =>
                        setVisibleColumns({
                          ...visibleColumns,
                          [String(col.key)]: e.target.checked
                        })
                      }
                      className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                    />
                    <span>{col.header}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* الجدول الرئيسي */}
      <div className="overflow-x-auto">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
              {activeCols.map((col) => {
                const k = String(col.key);
                const isSorted = sortKey === k;
                return (
                  <th
                    key={k}
                    onClick={() => col.sortable !== false && handleSort(k)}
                    className={`py-3.5 px-4 text-xs font-bold select-none ${
                      col.sortable !== false ? 'cursor-pointer hover:bg-slate-200/70 dark:hover:bg-slate-700/80 transition-colors' : ''
                    } ${col.align === 'center' ? 'text-center' : col.numeric ? 'text-left' : 'text-right'}`}
                  >
                    <div className={`inline-flex items-center gap-1.5 ${col.numeric ? 'flex-row-reverse' : ''}`}>
                      <span>{col.header}</span>
                      {col.sortable !== false && (
                        <span className="text-slate-400">
                          {isSorted ? (
                            sortDirection === 'asc' ? (
                              <ChevronUp className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3.5 h-3.5 opacity-30" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-200 text-sm">
            {sortedData.length === 0 ? (
              <tr>
                <td colSpan={activeCols.length} className="text-center py-12 text-slate-400 text-sm">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              sortedData.map((row, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-teal-50/50 dark:hover:bg-slate-800/60 transition-colors"
                >
                  {activeCols.map((col) => {
                    const k = String(col.key);
                    const val = row[k];
                    return (
                      <td
                        key={k}
                        className={`py-3 px-4 ${
                          col.align === 'center'
                            ? 'text-center'
                            : col.numeric
                            ? 'text-left font-mono font-medium'
                            : 'text-right'
                        }`}
                      >
                        {col.render
                          ? col.render(row)
                          : col.format
                          ? col.format(val)
                          : val ?? '-'}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>

          {/* تذييل الإجماليات الحسابية */}
          {sortedData.length > 0 && columns.some((c) => c.footer) && (
            <tfoot className="bg-slate-100 dark:bg-slate-800 font-bold border-t-2 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white">
              <tr>
                {activeCols.map((col) => {
                  const k = String(col.key);
                  return (
                    <td
                      key={k}
                      className={`py-3.5 px-4 text-sm ${
                        col.align === 'center'
                          ? 'text-center'
                          : col.numeric
                          ? 'text-left font-mono font-bold'
                          : 'text-right'
                      }`}
                    >
                      {col.footer ? col.footer(sortedData) : ''}
                    </td>
                  );
                })}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

