'use client';

import React from 'react';

export interface SegmentedOption<T extends string = string> {
  id: T;
  label: string;
}

export interface SegmentedProps<T extends string = string> {
  options: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className = '',
}: SegmentedProps<T>) {
  return (
    <div
      className={`flex shrink-0 items-center gap-1 rounded-lg bg-slate-100/90 border border-slate-200/80 p-0.5 shadow-2xs ring-1 ring-slate-900/5 dark:bg-zinc-900/80 dark:border-zinc-800/80 dark:ring-white/10 ${className}`}
    >
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={`rounded-md px-3 py-1 text-xs font-semibold tabular-nums tracking-tight transition ${
            value === o.id
              ? 'bg-white text-slate-900 shadow-2xs ring-1 ring-slate-900/5 dark:bg-zinc-800 dark:text-white dark:ring-white/10 font-bold'
              : 'text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export default Segmented;
