'use client';

import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search, Store } from 'lucide-react';
import type { BranchOption } from '@/types/reports';

interface Props {
  options: BranchOption[];
  value: string[];
  onChange: (codes: string[]) => void;
}

/**
 * Accessible multi-select combobox for branches / caravans.
 * Row 0 is always the "All branches" option (empty selection = all).
 * Keyboard: ArrowUp/Down, Home/End, Enter/Space toggle, Escape close, typing filters.
 */
export function BranchSelect({ options, value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q
      ? options.filter((o) => o.Name.toLowerCase().includes(q) || String(o.Code).toLowerCase().includes(q))
      : options;
  }, [options, query]);

  // Row 0 = "all", rows 1..n = filtered branches
  const rowCount = filtered.length + 1;
  const allSelected = value.length === 0;

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
  }, []);

  // Click-away
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) close();
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open, close]);

  useEffect(() => {
    if (open) {
      setActive(0);
      searchRef.current?.focus();
    }
  }, [open]);

  // Keep the active row visible
  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-idx="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const toggle = (code: string) =>
    onChange(value.includes(code) ? value.filter((c) => c !== code) : [...value, code]);

  const activate = (idx: number) => {
    if (idx === 0) onChange([]);
    else toggle(String(filtered[idx - 1].Code));
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!open) setOpen(true);
        else setActive((a) => (a + 1) % rowCount);
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (!open) setOpen(true);
        else setActive((a) => (a - 1 + rowCount) % rowCount);
        break;
      case 'Home':
        if (open) { e.preventDefault(); setActive(0); }
        break;
      case 'End':
        if (open) { e.preventDefault(); setActive(rowCount - 1); }
        break;
      case 'Enter':
        e.preventDefault();
        if (open) activate(active);
        else setOpen(true);
        break;
      case ' ':
        // Space toggles only when the search box is empty (otherwise it is typing)
        if (open && query === '') { e.preventDefault(); activate(active); }
        break;
      case 'Escape':
        if (open) { e.preventDefault(); close(); }
        break;
      case 'Tab':
        if (open) close();
        break;
    }
  };

  const label = allSelected
    ? 'جميع الفروع والمحلات'
    : value.length === 1
    ? options.find((o) => String(o.Code) === value[0])?.Name ?? 'فرع واحد'
    : `تم تحديد ${value.length} فروع`;

  return (
    <div ref={rootRef} className="relative" onKeyDown={onKeyDown}>
      <button
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label="اختيار الفروع / الكرافانات"
        onClick={() => setOpen((o) => !o)}
        className={`flex h-10 w-full min-w-[230px] items-center justify-between gap-2 rounded-xl border bg-white px-3 text-sm transition dark:bg-[#18181b] ${
          open
            ? 'border-violet-400 ring-2 ring-violet-400/20'
            : 'border-slate-200 hover:border-slate-300 dark:border-white/10 dark:hover:border-slate-600'
        }`}
      >
        <span className="flex min-w-0 items-center gap-2">
          <Store className="h-4 w-4 shrink-0 text-slate-400" />
          <span className="truncate font-medium text-slate-700 dark:text-slate-200">{label}</span>
        </span>
        <span className="flex shrink-0 items-center gap-2">
          {!allSelected && (
            <span className="rounded-full bg-white text-black px-2 py-0.5 text-[11px] font-bold tabular-nums">
              {value.length}
            </span>
          )}
          <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </span>
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-full min-w-[300px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-white/10 dark:bg-[#18181b]">
          <div className="relative border-b border-slate-100 p-2 dark:border-white/10">
            <Search className="pointer-events-none absolute right-5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => { setQuery(e.target.value); setActive(0); }}
              placeholder="ابحث باسم المحل أو الكود..."
              aria-controls={listId}
              aria-activedescendant={`${listId}-${active}`}
              className="w-full rounded-lg bg-slate-50 py-2 pl-3 pr-9 text-sm text-slate-700 outline-none dark:bg-zinc-950 dark:text-slate-200"
            />
          </div>

          <ul ref={listRef} id={listId} role="listbox" aria-multiselectable="true" className="max-h-72 overflow-y-auto p-1.5">
            <li
              id={`${listId}-0`}
              data-idx={0}
              role="option"
              aria-selected={allSelected}
              onMouseEnter={() => setActive(0)}
              onClick={() => onChange([])}
              className={`flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold ${
                active === 0 ? 'bg-slate-100 dark:bg-zinc-950' : ''
              } ${allSelected ? 'text-violet-300 font-bold' : 'text-slate-700 dark:text-slate-200'}`}
            >
              <span>جميع الفروع والمحلات</span>
              {allSelected && <Check className="h-4 w-4" />}
            </li>

            <li role="presentation" className="my-1 h-px bg-slate-100 dark:bg-zinc-950" />

            {filtered.length === 0 && (
              <li role="presentation" className="px-3 py-6 text-center text-sm text-slate-400">
                لا توجد نتائج
              </li>
            )}

            {filtered.map((o, i) => {
              const idx = i + 1;
              const selected = value.includes(String(o.Code));
              return (
                <li
                  key={o.Code}
                  id={`${listId}-${idx}`}
                  data-idx={idx}
                  role="option"
                  aria-selected={selected}
                  onMouseEnter={() => setActive(idx)}
                  onClick={() => toggle(String(o.Code))}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm ${
                    active === idx ? 'bg-slate-100 dark:bg-zinc-950' : ''
                  }`}
                >
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition ${
                      selected
                        ? 'border-violet-300 bg-violet-300 text-black'
                        : 'border-slate-300 dark:border-slate-600'
                    }`}
                  >
                    {selected && <Check className="h-3 w-3" strokeWidth={3} />}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-slate-700 dark:text-slate-200">{o.Name}</span>
                  <span className="font-mono text-[11px] text-slate-400">{o.Code}</span>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center justify-between border-t border-slate-100 px-3 py-2 text-xs text-slate-400 dark:border-white/10">
            <span className="tabular-nums">{options.length} محل</span>
            <button
              type="button"
              onClick={close}
              className="rounded-full bg-white text-black px-4 py-1 text-xs font-medium transition hover:bg-zinc-200"
            >
              تم
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

