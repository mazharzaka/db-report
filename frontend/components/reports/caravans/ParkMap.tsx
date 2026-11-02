'use client';

import React, { useMemo, useState } from 'react';
import type { OutletStat } from '@/types/reports';
import { PARK_H, PARK_W, resolvePositions } from '@/config/parkLayout';
import { fmtInt, fmtMoney } from './charts';

type Velocity = 'high' | 'normal' | 'low';

const VELOCITY_STYLE: Record<Velocity, { fill: string; ring: string; label: string; dot: string }> = {
  high: { fill: '#f97316', ring: '#fb923c', label: 'مبيعات مرتفعة', dot: 'bg-orange-500' },
  normal: { fill: '#fbbf24', ring: '#fcd34d', label: 'مبيعات متوسطة', dot: 'bg-amber-400' },
  low: { fill: '#71717a', ring: '#a1a1aa', label: 'راكد / منخفض', dot: 'bg-zinc-500' },
};

/**
 * Sales velocity relative to the average outlet in the period:
 * high >= 120% of the mean, low < 50% of the mean, otherwise normal.
 */
export function classify(revenue: number, mean: number): Velocity {
  if (mean <= 0) return 'low';
  if (revenue >= mean * 1.2) return 'high';
  if (revenue < mean * 0.5) return 'low';
  return 'normal';
}

interface Props {
  outlets: OutletStat[];
  selected: string[];
  onSelect: (code: string) => void;
}

export function ParkMap({ outlets, selected, onSelect }: Props) {
  const [hover, setHover] = useState<string | null>(null);

  const positions = useMemo(() => resolvePositions(outlets.map((o) => o.branchCode)), [outlets]);
  const mean = useMemo(
    () => (outlets.length ? outlets.reduce((a, o) => a + o.revenue, 0) / outlets.length : 0),
    [outlets]
  );
  const maxRevenue = Math.max(...outlets.map((o) => o.revenue), 1);

  const hovered = outlets.find((o) => o.branchCode === hover) ?? null;
  const hoveredPos = hovered ? positions[hovered.branchCode] : null;

  if (outlets.length === 0) {
    return <div className="flex h-[380px] items-center justify-center text-sm text-slate-400">لا توجد بيانات للمنافذ</div>;
  }

  return (
    <div>
      <div className="relative w-full overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800/60" dir="ltr">
        <svg
          viewBox={`0 0 ${PARK_W} ${PARK_H}`}
          className="block h-auto w-full"
          role="group"
          aria-label="خريطة المنافذ داخل الحديقة"
        >
          {/* Decorative park base (self-contained, no external assets) */}
          <rect x="12" y="12" width={PARK_W - 24} height={PARK_H - 24} rx="28" className="fill-slate-50 stroke-slate-200 dark:fill-zinc-950 dark:stroke-white/5" strokeWidth="2" />
          <path d={`M60 ${PARK_H / 2} C 260 ${PARK_H / 2 - 120}, 460 ${PARK_H / 2 + 120}, ${PARK_W - 60} ${PARK_H / 2}`} className="fill-none stroke-slate-200 dark:stroke-white/5" strokeWidth="18" strokeLinecap="round" />
          <ellipse cx={PARK_W / 2} cy={PARK_H - 90} rx="120" ry="38" className="fill-slate-200 dark:fill-slate-800" />
          <rect x="30" y={PARK_H / 2 - 30} width="46" height="60" rx="10" className="fill-slate-200 dark:fill-slate-700" />
          <text x="53" y={PARK_H / 2 + 4} textAnchor="middle" fontSize="12" className="fill-slate-500 dark:fill-slate-400">البوابة</text>

          {outlets.map((o) => {
            const pos = positions[o.branchCode];
            if (!pos) return null;
            const v = classify(o.revenue, mean);
            const st = VELOCITY_STYLE[v];
            const r = 14 + (o.revenue / maxRevenue) * 14;
            const isSel = selected.includes(o.branchCode);
            const isHover = hover === o.branchCode;
            return (
              <g
                key={o.branchCode}
                role="button"
                tabIndex={0}
                aria-pressed={isSel}
                aria-label={`${o.name}: ${fmtMoney(o.revenue)} — ${st.label}`}
                className="cursor-pointer outline-none"
                onMouseEnter={() => setHover(o.branchCode)}
                onMouseLeave={() => setHover((h) => (h === o.branchCode ? null : h))}
                onFocus={() => setHover(o.branchCode)}
                onBlur={() => setHover((h) => (h === o.branchCode ? null : h))}
                onClick={() => onSelect(o.branchCode)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect(o.branchCode);
                  }
                }}
              >
                {(isSel || isHover) && <circle cx={pos.x} cy={pos.y} r={r + 8} fill="none" stroke={st.ring} strokeWidth="3" opacity="0.7" />}
                {v === 'high' && <circle cx={pos.x} cy={pos.y} r={r + 4} fill={st.fill} opacity="0.18" />}
                <circle cx={pos.x} cy={pos.y} r={r} fill={st.fill} stroke="white" strokeWidth="3" />
                <text x={pos.x} y={pos.y + 4} textAnchor="middle" fontSize="11" fontWeight="700" fill="white" pointerEvents="none">
                  {o.branchCode}
                </text>
                <text x={pos.x} y={pos.y + r + 16} textAnchor="middle" fontSize="11" className="fill-slate-600 dark:fill-slate-300" pointerEvents="none">
                  {o.name.length > 16 ? `${o.name.slice(0, 15)}…` : o.name}
                </text>
              </g>
            );
          })}
        </svg>

        {hovered && hoveredPos && (
          <div
            className="pointer-events-none absolute z-10 w-56 -translate-x-1/2 -translate-y-full rounded-xl border border-slate-700/40 bg-slate-900/90 p-3 text-xs text-slate-200 shadow-xl backdrop-blur"
            style={{
              left: `${Math.min(88, Math.max(12, (hoveredPos.x / PARK_W) * 100))}%`,
              top: `${(hoveredPos.y / PARK_H) * 100 - 6}%`,
            }}
            dir="rtl"
          >
            <p className="mb-1.5 font-bold text-white">{hovered.name}</p>
            <div className="space-y-1 tabular-nums">
              <div className="flex justify-between"><span className="text-slate-400">الإيراد</span><span dir="ltr">{fmtMoney(hovered.revenue)}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">الشيكات</span><span>{fmtInt(hovered.orders)}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">متوسط الفاتورة</span><span dir="ltr">{fmtMoney(hovered.avgTicket)}</span></div>
              {hovered.signature && (
                <div className="flex justify-between gap-2"><span className="text-slate-400">الأكثر مبيعاً</span><span className="truncate">{hovered.signature.itemName}</span></div>
              )}
            </div>
            <p className="mt-2 text-[10px] text-violet-300">اضغط لتصفية التقرير على هذا المنفذ</p>
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
        <ul className="flex flex-wrap items-center gap-4">
          {(Object.keys(VELOCITY_STYLE) as Velocity[]).map((k) => (
            <li key={k} className="flex items-center gap-1.5">
              <span className={`h-2.5 w-2.5 rounded-full ${VELOCITY_STYLE[k].dot}`} />
              {VELOCITY_STYLE[k].label}
            </li>
          ))}
        </ul>
        <span>المواقع تقريبية — تُعدَّل من <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">config/parkLayout.ts</code></span>
      </div>
    </div>
  );
}

