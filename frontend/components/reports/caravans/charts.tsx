'use client';

import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
  type ChartArea,
  type ChartOptions,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler
);

/* ---------- Formatting helpers (LTR numbers inside RTL layout) ---------- */

export const fmtMoney = (v: number): string =>
  `${(Number(v) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ج.م`;

export const fmtInt = (v: number): string => (Number(v) || 0).toLocaleString('en-US');

export const fmtCompact = (v: number): string => {
  const n = Number(v) || 0;
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(Math.round(n));
};

/* ---------- Theme detection (class-based dark mode) ---------- */

export function useIsDark(): boolean {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const root = document.documentElement;
    const update = () => setDark(root.classList.contains('dark'));
    update();
    const obs = new MutationObserver(update);
    obs.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);
  return dark;
}

const PALETTE = {
  emerald: '16, 185, 129', // #10B981
  cyan: '6, 182, 212', // #06B6D4
  violet: '99, 102, 241', // #6366F1 (indigo)
};

function gradient(ctx: CanvasRenderingContext2D, area: ChartArea, rgb: string, top: number, bottom: number) {
  const g = ctx.createLinearGradient(0, area.top, 0, area.bottom);
  g.addColorStop(0, `rgba(${rgb}, ${top})`);
  g.addColorStop(1, `rgba(${rgb}, ${bottom})`);
  return g;
}

/* Dark translucent tooltip shared by all charts */
const tooltipBase = {
  rtl: true,
  backgroundColor: 'rgba(15, 23, 42, 0.88)',
  borderColor: 'rgba(148, 163, 184, 0.25)',
  borderWidth: 1,
  titleColor: '#e2e8f0',
  bodyColor: '#cbd5e1',
  padding: 12,
  cornerRadius: 12,
  boxPadding: 4,
  usePointStyle: true,
} as const;

/* ---------- Sparkline ---------- */

export function Sparkline({ data, color }: { data: number[]; color: keyof typeof PALETTE }) {
  const rgb = PALETTE[color];
  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
    scales: { x: { display: false }, y: { display: false } },
    elements: { point: { radius: 0 }, line: { tension: 0.4, borderWidth: 2 } },
  };
  return (
    <Line
      options={options}
      data={{
        labels: data.map((_, i) => String(i)),
        datasets: [
          {
            data,
            borderColor: `rgb(${rgb})`,
            fill: true,
            backgroundColor: (c) =>
              c.chart.chartArea ? gradient(c.chart.ctx, c.chart.chartArea, rgb, 0.3, 0) : `rgba(${rgb}, 0.1)`,
          },
        ],
      }}
    />
  );
}

/* ---------- Chart A: revenue trend ---------- */

export interface TrendPoint {
  label: string;
  total: number;
  cash: number;
  visa: number;
}

export function RevenueTrendChart({ points }: { points: TrendPoint[] }) {
  const dark = useIsDark();
  const tick = dark ? '#94a3b8' : '#64748b';
  const grid = dark ? 'rgba(51, 65, 85, 0.5)' : 'rgba(226, 232, 240, 0.9)';

  const series = [
    { key: 'total' as const, label: 'صافي الإيرادات', rgb: PALETTE.emerald },
    { key: 'cash' as const, label: 'النقدية', rgb: PALETTE.cyan },
    { key: 'visa' as const, label: 'الفيزا', rgb: PALETTE.violet },
  ];

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        rtl: true,
        position: 'top',
        align: 'end',
        labels: { color: tick, usePointStyle: true, boxWidth: 8, font: { size: 12 } },
      },
      tooltip: {
        ...tooltipBase,
        callbacks: { label: (c) => ` ${c.dataset.label}: ${fmtMoney(Number(c.parsed.y))}` },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: tick, maxTicksLimit: 10, font: { size: 11 } }, border: { display: false } },
      y: {
        beginAtZero: true,
        grid: { color: grid },
        border: { display: false },
        ticks: { color: tick, callback: (v) => fmtCompact(Number(v)), font: { size: 11 } },
      },
    },
    elements: { point: { radius: 0, hoverRadius: 5 }, line: { tension: 0.4, borderWidth: 2.5 } },
  };

  return (
    <Line
      options={options}
      data={{
        labels: points.map((p) => p.label),
        datasets: series.map((s, i) => ({
          label: s.label,
          data: points.map((p) => p[s.key]),
          borderColor: `rgb(${s.rgb})`,
          pointBackgroundColor: `rgb(${s.rgb})`,
          fill: true,
          backgroundColor: (c) =>
            c.chart.chartArea
              ? gradient(c.chart.ctx, c.chart.chartArea, s.rgb, i === 0 ? 0.32 : 0.1, 0)
              : `rgba(${s.rgb}, 0.1)`,
        })),
      }}
    />
  );
}

/* ---------- Chart B: top caravans (pure HTML progress bars) ---------- */

export interface RankedItem {
  name: string;
  total: number;
  share: number;
}

export function TopCaravansBars({
  items,
  offset = 0,
  max: maxOverride,
}: {
  items: RankedItem[];
  offset?: number;
  max?: number;
}) {
  const max = Math.max(maxOverride ?? 0, ...items.map((i) => i.total), 1);
  if (items.length === 0) {
    return <div className="py-10 text-center text-sm text-slate-400">لا توجد بيانات</div>;
  }
  return (
    <ul className="space-y-4">
      {items.map((item, i) => {
        const idx = i + offset;
        return (
        <li key={item.name} className="group">
          <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
            <div className="flex min-w-0 items-center gap-2">
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[10px] font-bold tabular-nums ${
                  idx === 0
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                {idx + 1}
              </span>
              <span className="truncate font-medium text-slate-700 dark:text-slate-200">{item.name}</span>
            </div>
            <div className="flex shrink-0 items-center gap-2 tabular-nums" dir="ltr">
              <span className="text-xs text-slate-400">{item.share.toFixed(1)}%</span>
              <span className="font-semibold text-slate-800 dark:text-slate-100">{fmtCompact(item.total)}</span>
            </div>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${
                idx === 0 ? 'bg-emerald-500' : idx === 1 ? 'bg-cyan-500' : 'bg-violet-500/80'
              }`}
              style={{ width: `${(item.total / max) * 100}%` }}
            />
          </div>
        </li>
        );
      })}
    </ul>
  );
}

/* ---------- Chart C: payment distribution donut ---------- */

export interface PaymentSlice {
  label: string;
  value: number;
  rgb: string;
  dot: string; // tailwind bg class for the legend
}

export function PaymentDonut({ slices, compact = false }: { slices: PaymentSlice[]; compact?: boolean }) {
  const dark = useIsDark();
  const total = slices.reduce((a, s) => a + s.value, 0);

  const options: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    plugins: {
      legend: { display: false },
      tooltip: {
        ...tooltipBase,
        callbacks: {
          label: (c) => {
            const v = Number(c.parsed);
            return ` ${c.label}: ${fmtMoney(v)} (${total > 0 ? ((v / total) * 100).toFixed(1) : '0.0'}%)`;
          },
        },
      },
    },
  };

  return (
    <div>
      <div className={`relative mx-auto ${compact ? 'h-36 w-36' : 'h-48 w-48'}`}>
        <Doughnut
          options={options}
          data={{
            labels: slices.map((s) => s.label),
            datasets: [
              {
                data: slices.map((s) => s.value),
                backgroundColor: slices.map((s) => `rgb(${s.rgb})`),
                borderColor: dark ? '#0f172a' : '#ffffff',
                borderWidth: 3,
                borderRadius: 6,
                hoverOffset: 6,
              },
            ],
          }}
        />
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs text-slate-400">الإجمالي</span>
          <span className="text-lg font-bold tabular-nums text-slate-800 dark:text-slate-100" dir="ltr">
            {fmtCompact(total)}
          </span>
        </div>
      </div>

      <ul className={`space-y-2.5 ${compact ? 'mt-4' : 'mt-5'}`}>
        {slices.map((s) => (
          <li key={s.label} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${s.dot}`} />
              <span className="text-slate-600 dark:text-slate-300">{s.label}</span>
            </div>
            <div className="flex items-center gap-2 tabular-nums" dir="ltr">
              <span className="text-xs text-slate-400">
                {total > 0 ? ((s.value / total) * 100).toFixed(1) : '0.0'}%
              </span>
              {!compact && (
                <span className="font-semibold text-slate-800 dark:text-slate-100">{fmtMoney(s.value)}</span>
              )}
              {compact && (
                <span className="font-semibold text-slate-800 dark:text-slate-100">{fmtCompact(s.value)}</span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
