'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CalendarDays,
  AlertCircle,
  X,
  ArrowRight,
} from 'lucide-react';

interface DateRangeProps {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  onChange: (start: string, end: string) => void;
  label?: string;
  minYear?: number;
  maxYear?: number;
  disabled?: boolean;
  showQuickPresets?: boolean;
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
  showQuickPresets = true,
}: DateRangeProps) {
  // Active calendar popover: 'start' | 'end' | null
  const [activePicker, setActivePicker] = useState<'start' | 'end' | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Internal Draft State for Deferred Fetching (prevents premature re-renders/aborts)
  const [draftStart, setDraftStart] = useState<string>(startDate);
  const [draftEnd, setDraftEnd] = useState<string>(endDate);

  // Validation Error Message
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Manual input field state
  const [manualInput, setManualInput] = useState<string>('');

  // Month & Year state for the currently active calendar
  const [viewYear, setViewYear] = useState<number>(() => {
    return parseDate(startDate || ymd(new Date())).getFullYear();
  });
  const [viewMonth, setViewMonth] = useState<number>(() => {
    return parseDate(startDate || ymd(new Date())).getMonth();
  });

  // Sync internal drafts whenever parent props change (if user is not actively editing)
  useEffect(() => {
    if (!activePicker) {
      setDraftStart(startDate);
      setDraftEnd(endDate);
      setErrorMessage(null);
    }
  }, [startDate, endDate, activePicker]);

  // Update month & year view whenever the active picker opens or switches
  const updateCalendarView = (dateStr: string) => {
    const d = parseDate(dateStr);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
    setManualInput(dateStr);
  };

  const openPicker = (type: 'start' | 'end') => {
    // Loading State Protection: Don't open if disabled and closed, but allow interaction once open
    if (disabled && !activePicker) return;
    setActivePicker(type);
    setErrorMessage(null);
    updateCalendarView(type === 'start' ? draftStart : draftEnd);
  };

  // Click outside listener: commits the range if valid on blur/close
  useEffect(() => {
    if (!activePicker) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        // Deferred commit on close/blur if range is valid
        if (draftStart && draftEnd && draftStart <= draftEnd) {
          if (draftStart !== startDate || draftEnd !== endDate) {
            onChange(draftStart, draftEnd);
          }
        } else if (draftStart > draftEnd) {
          // Revert draft to valid prop state if invalid on blur
          setDraftStart(startDate);
          setDraftEnd(endDate);
        }
        setActivePicker(null);
        setErrorMessage(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [activePicker, draftStart, draftEnd, startDate, endDate, onChange]);

  // Safe Year Increment / Decrement
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

  // Generate calendar days for view
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
    const lastDayOfMonth = new Date(viewYear, viewMonth + 1, 0);
    const totalDays = lastDayOfMonth.getDate();

    // Arabic week starts Saturday (index 6 in standard JS)
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

    // Next month padding to complete grid
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

  // Handle Day Selection with Smart Auto-Focus & Deferred Fetching
  const handleSelectDay = (dateStr: string) => {
    setErrorMessage(null);

    if (activePicker === 'start') {
      // 1. Set Draft Start
      setDraftStart(dateStr);

      // Auto-adjust draftEnd if it is strictly before the new start date
      let nextEnd = draftEnd;
      if (dateStr > draftEnd) {
        nextEnd = dateStr;
        setDraftEnd(dateStr);
      }

      // 2. SMART AUTO-FOCUS: Seamlessly transition to 'end' picker without closing!
      setActivePicker('end');
      updateCalendarView(nextEnd);

      // 3. DEFERRED FETCHING: Do NOT trigger onChange here.
      // Wait until end date is picked or user finishes interaction.
    } else if (activePicker === 'end') {
      // Validation Check: End date cannot precede Start date
      if (dateStr < draftStart) {
        setErrorMessage('تاريخ النهاية لا يمكن أن يسبق تاريخ البداية');
        return;
      }

      // 4. SELECTION COMPLETE: Commit both dates and close
      setDraftEnd(dateStr);
      setActivePicker(null);
      setErrorMessage(null);

      // Trigger the single deferred API fetch
      onChange(draftStart, dateStr);
    }
  };

  // Handle Manual Input Typing
  const handleManualInputChange = (val: string) => {
    setManualInput(val);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(val)) return;

    if (activePicker === 'start') {
      setDraftStart(val);
      if (val > draftEnd) setDraftEnd(val);
      setErrorMessage(null);
      updateCalendarView(val);
    } else if (activePicker === 'end') {
      if (val < draftStart) {
        setErrorMessage('تاريخ النهاية لا يمكن أن يسبق تاريخ البداية');
      } else {
        setDraftEnd(val);
        setErrorMessage(null);
        updateCalendarView(val);
      }
    }
  };

  // Quick Preset Handlers (Instant Complete Range)
  const applyPreset = (preset: 'yesterday' | 'this_month' | 'last_month') => {
    const now = new Date();
    let s = '';
    let e = '';

    if (preset === 'yesterday') {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      s = ymd(y);
      e = ymd(y);
    } else if (preset === 'this_month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      s = ymd(startOfMonth);
      e = ymd(now);
    } else if (preset === 'last_month') {
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      s = ymd(startOfLastMonth),
      e = ymd(endOfLastMonth);
    }

    setDraftStart(s);
    setDraftEnd(e);
    setActivePicker(null);
    setErrorMessage(null);
    onChange(s, e);
  };

  const yearOptions = useMemo(() => {
    const list: number[] = [];
    for (let y = minYear; y <= maxYear; y++) list.push(y);
    return list;
  }, [minYear, maxYear]);

  // Loading State Protection: Only disable trigger buttons when no picker is actively open
  const isTriggerDisabled = disabled && activePicker === null;

  return (
    <div ref={containerRef} className="relative flex flex-wrap items-center gap-2">
      {/* Optional Label */}
      {label && (
        <span className="text-xs font-bold text-slate-600 dark:text-zinc-400 select-none">
          {label}:
        </span>
      )}

      {/* Quick Selectors (Accounting Shortcuts) */}
      {showQuickPresets && (
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={isTriggerDisabled}
            onClick={() => applyPreset('yesterday')}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700 transition hover:border-orange-400 hover:bg-orange-50 hover:text-orange-700 dark:border-white/5 dark:bg-[#09090b] dark:text-zinc-300 dark:hover:border-orange-500/40 dark:hover:bg-orange-500/10 dark:hover:text-orange-300 disabled:opacity-50"
          >
            أمس
          </button>
          <button
            type="button"
            disabled={isTriggerDisabled}
            onClick={() => applyPreset('this_month')}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700 transition hover:border-orange-400 hover:bg-orange-50 hover:text-orange-700 dark:border-white/5 dark:bg-[#09090b] dark:text-zinc-300 dark:hover:border-orange-500/40 dark:hover:bg-orange-500/10 dark:hover:text-orange-300 disabled:opacity-50"
          >
            الشهر الحالي
          </button>
          <button
            type="button"
            disabled={isTriggerDisabled}
            onClick={() => applyPreset('last_month')}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700 transition hover:border-orange-400 hover:bg-orange-50 hover:text-orange-700 dark:border-white/5 dark:bg-[#09090b] dark:text-zinc-300 dark:hover:border-orange-500/40 dark:hover:bg-orange-500/10 dark:hover:text-orange-300 disabled:opacity-50"
          >
            الشهر السابق
          </button>
        </div>
      )}

      {/* Two Explicit Inputs (Side-by-Side SAP/Stripe Pattern) */}
      <div className="flex items-center gap-1.5" dir="ltr">
        {/* Input 1: Start Date (من تاريخ) */}
        <div className="relative">
          <button
            type="button"
            disabled={isTriggerDisabled}
            onClick={() => (activePicker === 'start' ? setActivePicker(null) : openPicker('start'))}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-mono font-bold transition shadow-xs ${
              activePicker === 'start'
                ? 'border-orange-500 bg-orange-50/70 text-orange-950 ring-2 ring-orange-500/20 dark:border-orange-400 dark:bg-orange-500/15 dark:text-orange-200'
                : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300 dark:border-white/10 dark:bg-[#09090b] dark:text-zinc-200 dark:hover:border-white/20'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <CalendarIcon className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400 shrink-0" />
            <span className="font-sans text-[11px] font-normal text-slate-500 dark:text-zinc-400">من:</span>
            <span className="tabular-nums tracking-tight font-semibold">
              {activePicker ? draftStart : startDate}
            </span>
          </button>
        </div>

        <span className="text-slate-400 dark:text-zinc-600 select-none font-bold">→</span>

        {/* Input 2: End Date (إلى تاريخ) */}
        <div className="relative">
          <button
            type="button"
            disabled={isTriggerDisabled}
            onClick={() => (activePicker === 'end' ? setActivePicker(null) : openPicker('end'))}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-mono font-bold transition shadow-xs ${
              activePicker === 'end'
                ? 'border-orange-500 bg-orange-50/70 text-orange-950 ring-2 ring-orange-500/20 dark:border-orange-400 dark:bg-orange-500/15 dark:text-orange-200'
                : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300 dark:border-white/10 dark:bg-[#09090b] dark:text-zinc-200 dark:hover:border-white/20'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <CalendarIcon className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400 shrink-0" />
            <span className="font-sans text-[11px] font-normal text-slate-500 dark:text-zinc-400">إلى:</span>
            <span className="tabular-nums tracking-tight font-semibold">
              {activePicker ? draftEnd : endDate}
            </span>
          </button>
        </div>
      </div>

      {/* Popover Calendar */}
      {activePicker && (
        <div
          className="absolute top-full z-50 mt-2 w-[320px] rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xl dark:border-white/10 dark:bg-[#18181b]"
          style={{ animation: 'fadeIn 0.15s ease-out', right: 0 }}
        >
          {/* Header Indicating EXACT Active Boundary & Step Hint */}
          <div className="mb-2.5 flex items-center justify-between border-b border-slate-100 pb-2 dark:border-white/5">
            <div className="flex items-center gap-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500/15 text-orange-700 dark:text-orange-300">
                <CalendarDays className="h-3 w-3" />
              </span>
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                {activePicker === 'start' ? (
                  <span>
                    تحديد تاريخ البداية <span className="text-orange-600 dark:text-orange-400 font-extrabold">(من)</span>
                  </span>
                ) : (
                  <span>
                    تحديد تاريخ النهاية <span className="text-orange-600 dark:text-orange-400 font-extrabold">(إلى)</span>
                  </span>
                )}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setActivePicker(null);
                setErrorMessage(null);
              }}
              className="text-[11px] font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300"
            >
              إغلاق
            </button>
          </div>

          {/* Validation Alert (Inline Toast) */}
          {errorMessage && (
            <div
              role="alert"
              className="mb-2.5 flex items-center justify-between gap-2 rounded-xl border border-red-200 bg-red-50 p-2 text-xs font-bold text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300"
            >
              <div className="flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
                <span>{errorMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                aria-label="إغلاق التنبيه"
                className="rounded p-0.5 hover:bg-red-100 dark:hover:bg-red-900/50"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Month & Year Steppers */}
          <div className="mb-3 flex items-center justify-between gap-1">
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={decrementYear}
                title="السنة السابقة"
                className="flex h-6 w-6 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 transition hover:bg-slate-200 hover:text-orange-600 dark:border-white/5 dark:bg-[#09090b] dark:text-zinc-300"
              >
                <ChevronsRight className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={prevMonth}
                title="الشهر السابق"
                className="flex h-6 w-6 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 transition hover:bg-slate-200 hover:text-orange-600 dark:border-white/5 dark:bg-[#09090b] dark:text-zinc-300"
              >
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>

            <div className="flex items-center gap-1">
              <select
                value={viewMonth}
                onChange={(e) => setViewMonth(Number(e.target.value))}
                className="rounded-lg border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-xs font-bold text-slate-800 outline-none focus:border-orange-500 dark:border-white/10 dark:bg-[#09090b] dark:text-zinc-200"
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
                className="rounded-lg border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-xs font-mono font-bold text-slate-800 outline-none focus:border-orange-500 dark:border-white/10 dark:bg-[#09090b] dark:text-zinc-200"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={nextMonth}
                title="الشهر القادم"
                className="flex h-6 w-6 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 transition hover:bg-slate-200 hover:text-orange-600 dark:border-white/5 dark:bg-[#09090b] dark:text-zinc-300"
              >
                <ChevronLeft className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={incrementYear}
                title="السنة القادمة"
                className="flex h-6 w-6 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 transition hover:bg-slate-200 hover:text-orange-600 dark:border-white/5 dark:bg-[#09090b] dark:text-zinc-300"
              >
                <ChevronsLeft className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* Weekday Labels Header */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {WEEKDAY_NAMES_AR.map((name, i) => (
              <span key={i} className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 py-0.5">
                {name}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {calendarDays.map((cell, idx) => {
              const isSelected =
                activePicker === 'start'
                  ? cell.dateStr === draftStart
                  : cell.dateStr === draftEnd;

              // Proactive Safeguard: In 'end' picker, disable dates strictly before draftStart
              const isImpossibleDate = activePicker === 'end' && cell.dateStr < draftStart;

              // Highlight range between draftStart and draftEnd for visual context
              const inDraftRange =
                cell.dateStr >= draftStart && cell.dateStr <= draftEnd;

              const isTodayCell = cell.dateStr === ymd(new Date());

              let cellStyle = 'text-slate-700 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-white/5';

              if (!cell.isCurrentMonth) {
                cellStyle = 'text-slate-300 dark:text-zinc-600 hover:bg-slate-50 dark:hover:bg-white/5';
              }

              if (inDraftRange && !isSelected) {
                cellStyle = 'bg-orange-50/70 text-orange-950 dark:bg-orange-500/10 dark:text-orange-200 font-medium';
              }

              if (isImpossibleDate) {
                cellStyle =
                  'text-slate-300 dark:text-zinc-700 opacity-25 cursor-not-allowed pointer-events-none line-through';
              }

              if (isSelected) {
                cellStyle = 'bg-orange-600 text-white font-bold shadow-xs hover:bg-orange-700';
              }

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={isImpossibleDate}
                  onClick={() => handleSelectDay(cell.dateStr)}
                  className={`h-7 w-full rounded-lg text-xs font-mono transition flex items-center justify-center relative ${cellStyle}`}
                >
                  {cell.dayNum}
                  {isTodayCell && !isSelected && (
                    <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-orange-500" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Manual Input Field (For manual typing with validation) */}
          <div className="mt-2.5 flex items-center justify-between gap-1.5 border-t border-slate-100 pt-2 text-[11px] dark:border-white/5" dir="ltr">
            <span className="text-slate-500 dark:text-zinc-400 font-sans">كتابة يدوية:</span>
            <input
              type="text"
              value={manualInput}
              onChange={(e) => handleManualInputChange(e.target.value)}
              placeholder="YYYY-MM-DD"
              className="w-28 rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-[11px] text-slate-800 outline-none focus:border-orange-500 dark:border-white/10 dark:bg-[#09090b] dark:text-zinc-200"
            />
          </div>

          {/* Current Selection Footnote */}
          <div className="mt-1.5 text-[11px] text-slate-500 dark:text-zinc-400 flex items-center justify-between font-mono" dir="ltr">
            <span className="font-sans">النطاق المحدد:</span>
            <span className="font-bold text-slate-800 dark:text-zinc-200">
              {draftStart} → {draftEnd}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
