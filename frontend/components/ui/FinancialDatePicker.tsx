'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  Check,
  RotateCcw,
} from 'lucide-react';

interface DateRange {
  start: string; // YYYY-MM-DD
  end: string;   // YYYY-MM-DD
}

interface PresetOption {
  id: string;
  label: string;
  getRange: () => DateRange;
}

interface FinancialDatePickerProps {
  startDate: string;
  endDate: string;
  onChange: (start: string, end: string) => void;
  label?: string;
  minYear?: number;
  maxYear?: number;
  disabled?: boolean;
  align?: 'right' | 'left';
}

const MONTH_NAMES_AR = [
  'يناير (01)',
  'فبراير (02)',
  'مارس (03)',
  'أبريل (04)',
  'مايو (05)',
  'يونيو (06)',
  'يوليو (07)',
  'أغسطس (08)',
  'سبتمبر (09)',
  'أكتوبر (10)',
  'نوفمبر (11)',
  'ديسمبر (12)',
];

const WEEKDAY_NAMES_AR = ['سبت', 'أحد', 'إثن', 'ثلا', 'أرب', 'خمي', 'جمع'];

const ymd = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const parseDate = (s: string): Date => {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return new Date();
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export function FinancialDatePicker({
  startDate,
  endDate,
  onChange,
  label,
  minYear = 2020,
  maxYear = 2035,
  disabled = false,
  align = 'right',
}: FinancialDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Draft state while popover is open
  const [draftStart, setDraftStart] = useState(startDate);
  const [draftEnd, setDraftEnd] = useState(endDate);
  const [selectingStep, setSelectingStep] = useState<'start' | 'end'>('start');

  // Calendar View month & year
  const initialDate = parseDate(startDate || endDate || ymd(new Date()));
  const [viewYear, setViewYear] = useState<number>(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(initialDate.getMonth());

  // Input text fields for direct manual editing
  const [inputStart, setInputStart] = useState(startDate);
  const [inputEnd, setInputEnd] = useState(endDate);

  // Sync state when props change or popover opens
  useEffect(() => {
    if (isOpen) {
      setDraftStart(startDate);
      setDraftEnd(endDate);
      setInputStart(startDate);
      setInputEnd(endDate);
      const parsed = parseDate(startDate || endDate);
      setViewYear(parsed.getFullYear());
      setViewMonth(parsed.getMonth());
      setSelectingStep('start');
    }
  }, [isOpen, startDate, endDate]);

  // Click outside listener
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Safe Year Increment / Decrement logic (Prevents any corrupted values or browser input bugs)
  const decrementYear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewYear((prev) => Math.max(minYear, prev - 1));
  };

  const incrementYear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewYear((prev) => Math.min(maxYear, prev + 1));
  };

  const prevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((prev) => Math.max(minYear, prev - 1));
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const nextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((prev) => Math.min(maxYear, prev + 1));
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  // Calendar days generation
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
    const lastDayOfMonth = new Date(viewYear, viewMonth + 1, 0);
    const totalDays = lastDayOfMonth.getDate();

    // In Arabic calendar, week starts Saturday (index 6 in JS standard getDay(): 0=Sun..6=Sat)
    const startDayIndex = (firstDayOfMonth.getDay() + 1) % 7;

    const days: { dateStr: string; dayNum: number; isCurrentMonth: boolean }[] = [];

    // Prev month padding
    const prevMonthLastDate = new Date(viewYear, viewMonth, 0).getDate();
    for (let i = startDayIndex - 1; i >= 0; i--) {
      const d = prevMonthLastDate - i;
      const prevM = viewMonth === 0 ? 11 : viewMonth - 1;
      const prevY = viewMonth === 0 ? viewYear - 1 : viewYear;
      days.push({
        dateStr: ymd(new Date(prevY, prevM, d)),
        dayNum: d,
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let d = 1; d <= totalDays; d++) {
      days.push({
        dateStr: ymd(new Date(viewYear, viewMonth, d)),
        dayNum: d,
        isCurrentMonth: true,
      });
    }

    // Next month padding to fill complete grid of 35 or 42
    const remaining = (7 - (days.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const nextM = viewMonth === 11 ? 0 : viewMonth + 1;
      const nextY = viewMonth === 11 ? viewYear + 1 : viewYear;
      days.push({
        dateStr: ymd(new Date(nextY, nextM, d)),
        dayNum: d,
        isCurrentMonth: false,
      });
    }

    return days;
  }, [viewYear, viewMonth]);

  // Handle Day Click
  const handleDayClick = (dateStr: string) => {
    if (selectingStep === 'start') {
      setDraftStart(dateStr);
      setDraftEnd(dateStr);
      setInputStart(dateStr);
      setInputEnd(dateStr);
      setSelectingStep('end');
    } else {
      if (dateStr < draftStart) {
        setDraftEnd(draftStart);
        setDraftStart(dateStr);
        setInputStart(dateStr);
        setInputEnd(draftStart);
      } else {
        setDraftEnd(dateStr);
        setInputEnd(dateStr);
      }
      setSelectingStep('start');
    }
  };

  // Quick Presets
  const applyQuickPreset = (type: 'yesterday' | 'today' | 'last7' | 'month' | 'year') => {
    const now = new Date();
    let s = '';
    let e = '';

    if (type === 'yesterday') {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      s = ymd(y);
      e = ymd(y);
    } else if (type === 'today') {
      s = ymd(now);
      e = ymd(now);
    } else if (type === 'last7') {
      const past = new Date();
      past.setDate(past.getDate() - 6);
      s = ymd(past);
      e = ymd(now);
    } else if (type === 'month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      s = ymd(startOfMonth);
      e = ymd(now);
    } else if (type === 'year') {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      s = ymd(startOfYear);
      e = ymd(now);
    }

    setDraftStart(s);
    setDraftEnd(e);
    setInputStart(s);
    setInputEnd(e);
    const parsed = parseDate(s);
    setViewYear(parsed.getFullYear());
    setViewMonth(parsed.getMonth());
  };

  const handleApply = () => {
    let finalStart = draftStart;
    let finalEnd = draftEnd;

    // Validate manual inputs if typed
    if (/^\d{4}-\d{2}-\d{2}$/.test(inputStart) && /^\d{4}-\d{2}-\d{2}$/.test(inputEnd)) {
      if (inputStart <= inputEnd) {
        finalStart = inputStart;
        finalEnd = inputEnd;
      } else {
        finalStart = inputEnd;
        finalEnd = inputStart;
      }
    }

    onChange(finalStart, finalEnd);
    setIsOpen(false);
  };

  // Year options for direct select
  const yearOptions = useMemo(() => {
    const list: number[] = [];
    for (let y = minYear; y <= maxYear; y++) {
      list.push(y);
    }
    return list;
  }, [minYear, maxYear]);

  // Label display
  const isSingleDay = startDate === endDate;
  const isYesterday = useMemo(() => {
    const y = new Date();
    y.setDate(y.getDate() - 1);
    return isSingleDay && startDate === ymd(y);
  }, [isSingleDay, startDate]);

  const isToday = useMemo(() => {
    return isSingleDay && startDate === ymd(new Date());
  }, [isSingleDay, startDate]);

  return (
    <div ref={containerRef} className="relative inline-block text-right">
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-800 shadow-xs transition hover:border-orange-500 hover:bg-slate-50 dark:border-white/10 dark:bg-[#09090b] dark:text-zinc-200 dark:hover:border-orange-400 dark:hover:bg-[#18181b] disabled:opacity-50 disabled:cursor-not-allowed ${
          isOpen ? 'ring-2 ring-orange-500/20 border-orange-500 dark:border-orange-400' : ''
        }`}
      >
        <CalendarIcon className="h-4 w-4 text-orange-600 dark:text-orange-400 shrink-0" />
        {label && <span className="text-slate-500 dark:text-zinc-400 font-normal">{label}:</span>}
        <div className="flex items-center gap-1.5 font-mono tabular-nums tracking-tight font-bold" dir="ltr">
          {isYesterday ? (
            <span className="font-sans text-orange-600 dark:text-orange-400 font-bold">أمس ({startDate})</span>
          ) : isToday ? (
            <span className="font-sans text-orange-600 dark:text-orange-400 font-bold">اليوم ({startDate})</span>
          ) : isSingleDay ? (
            <span>{startDate}</span>
          ) : (
            <>
              <span>{startDate}</span>
              <span className="text-slate-400 dark:text-zinc-500 font-sans">→</span>
              <span>{endDate}</span>
            </>
          )}
        </div>
        <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Popover Container */}
      {isOpen && (
        <div
          className={`absolute top-full z-50 mt-2 w-[340px] sm:w-[360px] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl dark:border-white/10 dark:bg-[#18181b] ${
            align === 'left' ? 'left-0' : 'right-0'
          }`}
          style={{ animation: 'fadeIn 0.15s ease-out' }}
        >
          {/* Quick Presets Pills */}
          <div className="mb-3 flex flex-wrap items-center gap-1.5 border-b border-slate-100 pb-3 dark:border-white/5">
            <button
              type="button"
              onClick={() => applyQuickPreset('yesterday')}
              className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 transition hover:bg-orange-100 hover:text-orange-700 dark:bg-[#09090b] dark:text-zinc-300 dark:hover:bg-orange-500/10 dark:hover:text-orange-300"
            >
              أمس
            </button>
            <button
              type="button"
              onClick={() => applyQuickPreset('today')}
              className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 transition hover:bg-orange-100 hover:text-orange-700 dark:bg-[#09090b] dark:text-zinc-300 dark:hover:bg-orange-500/10 dark:hover:text-orange-300"
            >
              اليوم
            </button>
            <button
              type="button"
              onClick={() => applyQuickPreset('last7')}
              className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 transition hover:bg-orange-100 hover:text-orange-700 dark:bg-[#09090b] dark:text-zinc-300 dark:hover:bg-orange-500/10 dark:hover:text-orange-300"
            >
              آخر 7 أيام
            </button>
            <button
              type="button"
              onClick={() => applyQuickPreset('month')}
              className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 transition hover:bg-orange-100 hover:text-orange-700 dark:bg-[#09090b] dark:text-zinc-300 dark:hover:bg-orange-500/10 dark:hover:text-orange-300"
            >
              الشهر الحالي
            </button>
            <button
              type="button"
              onClick={() => applyQuickPreset('year')}
              className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 transition hover:bg-orange-100 hover:text-orange-700 dark:bg-[#09090b] dark:text-zinc-300 dark:hover:bg-orange-500/10 dark:hover:text-orange-300"
            >
              السنة الحالية
            </button>
          </div>

          {/* Navigation Bar: Safe Year & Month Steppers */}
          <div className="mb-3 flex items-center justify-between gap-1">
            {/* Prev Year / Month Buttons */}
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={decrementYear}
                title="السنة السابقة"
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 transition hover:bg-slate-200 hover:text-orange-600 dark:border-white/5 dark:bg-[#09090b] dark:text-zinc-300 dark:hover:bg-slate-800"
              >
                <ChevronsRight className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={prevMonth}
                title="الشهر السابق"
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 transition hover:bg-slate-200 hover:text-orange-600 dark:border-white/5 dark:bg-[#09090b] dark:text-zinc-300 dark:hover:bg-slate-800"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Month & Year Dropdowns */}
            <div className="flex items-center gap-1.5">
              <select
                value={viewMonth}
                onChange={(e) => setViewMonth(Number(e.target.value))}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-bold text-slate-800 outline-none focus:border-orange-500 dark:border-white/10 dark:bg-[#09090b] dark:text-zinc-200"
              >
                {MONTH_NAMES_AR.map((m, idx) => (
                  <option key={idx} value={idx}>
                    {m}
                  </option>
                ))}
              </select>

              <select
                value={viewYear}
                onChange={(e) => setViewYear(Number(e.target.value))}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-mono font-bold text-slate-800 outline-none focus:border-orange-500 dark:border-white/10 dark:bg-[#09090b] dark:text-zinc-200"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {/* Next Month / Year Buttons */}
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={nextMonth}
                title="الشهر القادم"
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 transition hover:bg-slate-200 hover:text-orange-600 dark:border-white/5 dark:bg-[#09090b] dark:text-zinc-300 dark:hover:bg-slate-800"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={incrementYear}
                title="السنة القادمة"
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 transition hover:bg-slate-200 hover:text-orange-600 dark:border-white/5 dark:bg-[#09090b] dark:text-zinc-300 dark:hover:bg-slate-800"
              >
                <ChevronsLeft className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Weekday Labels (Saturday to Friday) */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {WEEKDAY_NAMES_AR.map((name, i) => (
              <span key={i} className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 py-1">
                {name}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {calendarDays.map((cell, idx) => {
              const isStart = cell.dateStr === draftStart;
              const isEnd = cell.dateStr === draftEnd;
              const inRange = cell.dateStr >= draftStart && cell.dateStr <= draftEnd;
              const isTodayCell = cell.dateStr === ymd(new Date());

              let cellStyle = 'text-slate-700 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-white/5';
              if (!cell.isCurrentMonth) {
                cellStyle = 'text-slate-300 dark:text-zinc-600 hover:bg-slate-50 dark:hover:bg-white/5';
              }

              if (inRange) {
                cellStyle = 'bg-orange-50 text-orange-900 dark:bg-orange-500/15 dark:text-orange-200 font-semibold';
              }

              if (isStart || isEnd) {
                cellStyle = 'bg-orange-600 text-white font-bold shadow-xs hover:bg-orange-700';
              }

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleDayClick(cell.dateStr)}
                  className={`h-8 w-full rounded-lg text-xs font-mono transition flex items-center justify-center relative ${cellStyle}`}
                >
                  {cell.dayNum}
                  {isTodayCell && !(isStart || isEnd) && (
                    <span className="absolute bottom-1 h-1 w-1 rounded-full bg-orange-500" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Manual Input & Confirmation */}
          <div className="mt-3 border-t border-slate-100 pt-3 dark:border-white/5">
            <div className="flex items-center justify-between gap-2 mb-3 text-xs" dir="ltr">
              <input
                type="text"
                value={inputStart}
                onChange={(e) => {
                  setInputStart(e.target.value);
                  if (/^\d{4}-\d{2}-\d{2}$/.test(e.target.value)) setDraftStart(e.target.value);
                }}
                placeholder="YYYY-MM-DD"
                className="w-1/2 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-xs text-slate-800 outline-none focus:border-orange-500 dark:border-white/10 dark:bg-[#09090b] dark:text-zinc-200"
              />
              <span className="text-slate-400">→</span>
              <input
                type="text"
                value={inputEnd}
                onChange={(e) => {
                  setInputEnd(e.target.value);
                  if (/^\d{4}-\d{2}-\d{2}$/.test(e.target.value)) setDraftEnd(e.target.value);
                }}
                placeholder="YYYY-MM-DD"
                className="w-1/2 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-xs text-slate-800 outline-none focus:border-orange-500 dark:border-white/10 dark:bg-[#09090b] dark:text-zinc-200"
              />
            </div>

            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-white/5 dark:text-zinc-400 dark:hover:bg-slate-800"
              >
                إلغاء
              </button>

              <button
                type="button"
                onClick={handleApply}
                className="flex items-center gap-1.5 rounded-xl bg-orange-600 px-4 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-orange-700 active:scale-95"
              >
                <Check className="h-3.5 w-3.5" />
                تطبيق التاريخ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

