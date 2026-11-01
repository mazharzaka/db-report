'use client';

import React from 'react';
import {
  Printer,
  X,
  CheckSquare,
  Square,
  BarChart3,
  TrendingUp,
  Table as TableIcon,
  Clock,
  Package,
  FileText,
  SlidersHorizontal,
} from 'lucide-react';
import type { PrintSectionsConfig } from '@/types/reports';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  config: PrintSectionsConfig;
  onChange: (config: PrintSectionsConfig) => void;
  onPrint: () => void;
}

export function PrintConfigModal({
  isOpen,
  onClose,
  config,
  onChange,
  onPrint,
}: Props) {
  if (!isOpen) return null;

  const toggleSection = (key: keyof Omit<PrintSectionsConfig, 'orientation'>) => {
    onChange({
      ...config,
      [key]: !config[key],
    });
  };

  const selectAll = () => {
    onChange({
      ...config,
      kpis: true,
      charts: true,
      table: true,
      peakHours: true,
      itemsPerformance: true,
    });
  };

  const deselectAll = () => {
    onChange({
      ...config,
      kpis: false,
      charts: false,
      table: false,
      peakHours: false,
      itemsPerformance: false,
    });
  };

  const sections: {
    key: keyof Omit<PrintSectionsConfig, 'orientation'>;
    title: string;
    description: string;
    icon: React.ElementType;
  }[] = [
    {
      key: 'kpis',
      title: 'المؤشرات التنفيذية وبانر المطابقة المالي الذهبي',
      description: 'بطاقات إجمالي الإيرادات الصافية، النقدية، معدلات النمو، ومتوسط الفاتورة مع باركود المطابقة',
      icon: TrendingUp,
    },
    {
      key: 'charts',
      title: 'الرسوم البيانية ومقارنة الفروع واتجاه الإيرادات',
      description: 'مخطط اتجاه الإيرادات عبر الوقت ومقارنة توزيع المبيعات بين المنافذ',
      icon: BarChart3,
    },
    {
      key: 'table',
      title: 'جدول تفاصيل إيرادات الكرافانات والمنافذ',
      description: 'الجدول المالي الشامل (الصافي، رسم الخدمة، ضريبة المبيعات، الشيكات، الإجمالي)',
      icon: TableIcon,
    },
    {
      key: 'peakHours',
      title: 'ساعات الذروة وحركة البوابات (Peak Hours & Gate Traffic)',
      description: 'توزيع حركة مبيعات الكرافانات على مدار ساعات اليوم ومقارنتها بتدفق التذاكر',
      icon: Clock,
    },
    {
      key: 'itemsPerformance',
      title: 'تحليل مبيعات الأصناف والمنتجات (Item-Level Analytics)',
      description: 'جدول أداء المنتجات، الكميات المباعة، صافي المبيعات، ومعدلات النمو الدوري',
      icon: Package,
    },
  ];

  const anySelected =
    config.kpis || config.charts || config.table || config.peakHours || config.itemsPerformance;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm print:hidden animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-xl rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Printer className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">إعدادات الطباعة المخصصة</h2>
              <p className="text-xs text-slate-400">حدد الأقسام المراد تضمينها في مستند الطباعة وتقرير PDF</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
            aria-label="إغلاق"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Quick select buttons */}
        <div className="flex items-center justify-between py-3">
          <span className="text-xs font-semibold text-slate-400">أقسام التقرير:</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={selectAll}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition"
            >
              تحديد الكل
            </button>
            <span className="text-slate-600">•</span>
            <button
              type="button"
              onClick={deselectAll}
              className="text-xs font-semibold text-slate-400 hover:text-slate-200 transition"
            >
              إلغاء التحديد
            </button>
          </div>
        </div>

        {/* Checkbox List */}
        <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
          {sections.map(({ key, title, description, icon: Icon }) => {
            const isChecked = config[key];
            return (
              <div
                key={key}
                onClick={() => toggleSection(key)}
                className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition select-none ${
                  isChecked
                    ? 'border-emerald-500/40 bg-emerald-950/20 text-slate-100'
                    : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:border-slate-700 hover:bg-slate-800/70'
                }`}
              >
                <div className="mt-0.5 text-emerald-400 shrink-0">
                  {isChecked ? (
                    <CheckSquare className="h-5 w-5 text-emerald-400" />
                  ) : (
                    <Square className="h-5 w-5 text-slate-500" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${isChecked ? 'text-emerald-400' : 'text-slate-500'}`} />
                    <span className={`text-sm font-bold ${isChecked ? 'text-white' : 'text-slate-300'}`}>
                      {title}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-400 leading-relaxed">{description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Print Layout Orientation Note */}
        <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/60 p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <SlidersHorizontal className="h-3.5 w-3.5 text-emerald-400" />
              اتجاه الصفحة المفضل:
            </span>
            <div className="flex items-center gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => onChange({ ...config, orientation: 'auto' })}
                className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                  config.orientation === 'auto'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                تلقائي
              </button>
              <button
                type="button"
                onClick={() => onChange({ ...config, orientation: 'landscape' })}
                className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                  config.orientation === 'landscape'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                أفقي (Landscape)
              </button>
              <button
                type="button"
                onClick={() => onChange({ ...config, orientation: 'portrait' })}
                className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                  config.orientation === 'portrait'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                رأسي (Portrait)
              </button>
            </div>
          </div>
          <p className="mt-1.5 text-[11px] text-slate-400">
            * يتم تحسين الهوامش (10 مم) وإخفاء أشرطة التمرير وعناصر التحكم تلقائياً دون تداخل بين الصفحات.
          </p>
        </div>

        {/* Footer Actions */}
        <div className="mt-5 flex items-center justify-end gap-2.5 border-t border-slate-800 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 transition hover:bg-slate-700"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={onPrint}
            disabled={!anySelected}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-md transition hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
          >
            <Printer className="h-4 w-4" />
            بدء الطباعة الآن
          </button>
        </div>
      </div>
    </div>
  );
}

