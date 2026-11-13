"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
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
  type ChartOptions,
} from "chart.js";
import { Line, Doughnut } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
);

/* ---------- Formatting helpers (LTR numbers inside RTL layout) ---------- */

export const fmtMoney = (v: number): string =>
  `${(Number(v) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ج.م`;

export function Money({
  value,
  className = '',
  symbolClassName = 'text-xs opacity-50 font-normal mr-1 select-none',
}: {
  value: number;
  className?: string;
  symbolClassName?: string;
}) {
  const formatted = (Number(value) || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return (
    <span className={`tabular-nums tracking-tight font-mono ${className}`} dir="ltr">
      {formatted}
      <span className={symbolClassName}> ج.م</span>
    </span>
  );
}

export const fmtInt = (v: number): string =>
  (Number(v) || 0).toLocaleString("en-US");

export const fmtCompact = (v: number): string => {
  const n = Number(v) || 0;
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(Math.round(n));
};

/* ---------- Theme detection (class-based dark mode) ---------- */

export function useIsDark(): boolean {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted) return true;
  return resolvedTheme === "dark";
}

export const PALETTE = {
  orange: "249, 115, 22", // #F97316 (Light Mode Primary)
  lavender: "196, 181, 253", // #C4B5FD (Dark Mode Primary)
  purple: "139, 92, 246", // #8B5CF6
  navy: "30, 58, 138", // #1E3A8A (Light Mode Secondary)
  royalBlue: "37, 99, 235", // #2563EB
  slate: "148, 163, 184", // #94A3B8 (Dark Mode Secondary)
  amber: "245, 158, 11", // #F59E0B (Tertiary)
  rose: "225, 29, 72", // #E11D48
  emerald: "16, 185, 129",
  indigo: "196, 181, 253",
  cyan: "148, 163, 184",
  violet: "196, 181, 253",
};

/* Dark translucent tooltip shared by all charts */
const tooltipBase = {
  rtl: true,
  backgroundColor: "rgba(15, 23, 42, 0.95)",
  borderColor: "rgba(148, 163, 184, 0.25)",
  borderWidth: 1,
  titleColor: "#e2e8f0",
  bodyColor: "#cbd5e1",
  padding: 12,
  cornerRadius: 12,
  boxPadding: 4,
  usePointStyle: true,
} as const;

/* ---------- Sparkline (NO GRADIENTS: clean solid flat line) ---------- */

export function Sparkline({
  data,
  color,
}: {
  data: number[];
  color: keyof typeof PALETTE;
}) {
  const dark = useIsDark();
  // In dark mode: Lavender/Purple, In light mode: Orange or specified color
  const rgb = color === 'orange' || color === 'indigo' || color === 'violet'
    ? (dark ? PALETTE.lavender : PALETTE.orange)
    : PALETTE[color];

  const options: ChartOptions<"line"> = {
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
            fill: false,
            backgroundColor: "transparent",
          },
        ],
      }}
    />
  );
}

/* ---------- Chart A: revenue trend (NO GRADIENTS, Dual-Theme) ---------- */

export interface TrendPoint {
  label: string;
  total: number;
  cash: number;
  visa: number;
}

export function RevenueTrendChart({ points }: { points: TrendPoint[] }) {
  const dark = useIsDark();
  const tick = dark ? "#94a3b8" : "#4b5563";
  const grid = dark ? "#334155" : "#e5e7eb";

  // Strict Dual-Theme Palette:
  // Dark: Primary = Lavender (#c4b5fd), Secondary = Slate (#94a3b8), Tertiary = Amber (#f59e0b)
  // Light: Primary = Solid Orange (#f97316), Secondary = Deep Navy (#1e3a8a), Tertiary = Amber (#f59e0b)
  const series = [
    {
      key: "total" as const,
      label: "صافي الإيرادات",
      rgb: dark ? PALETTE.lavender : PALETTE.orange,
    },
    {
      key: "cash" as const,
      label: "النقدية",
      rgb: dark ? PALETTE.slate : PALETTE.navy,
    },
    {
      key: "visa" as const,
      label: "الفيزا",
      rgb: PALETTE.amber,
    },
  ];

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: {
        rtl: true,
        position: "top",
        align: "end",
        labels: {
          color: tick,
          usePointStyle: true,
          boxWidth: 8,
          font: { size: 12 },
        },
      },
      tooltip: {
        ...tooltipBase,
        backgroundColor: dark ? "rgba(24, 24, 27, 0.95)" : "rgba(255, 255, 255, 0.98)",
        borderColor: dark ? "rgba(255, 255, 255, 0.08)" : "#e2e8f0",
        titleColor: dark ? "#ffffff" : "#0f172a",
        bodyColor: dark ? "#a1a1aa" : "#475569",
        callbacks: {
          label: (c) => ` ${c.dataset.label}: ${fmtMoney(Number(c.parsed.y))}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: tick, maxTicksLimit: 10, font: { size: 11 } },
        border: { display: false },
      },
      y: {
        beginAtZero: true,
        grid: { color: grid },
        border: { display: false },
        ticks: {
          color: tick,
          callback: (v) => fmtCompact(Number(v)),
          font: { size: 11 },
        },
      },
    },
    elements: {
      point: { radius: 0, hoverRadius: 5 },
      line: { tension: 0.35, borderWidth: 2.5 },
    },
  };

  return (
    <Line
      options={options}
      data={{
        labels: points.map((p) => p.label),
        datasets: series.map((s) => ({
          label: s.label,
          data: points.map((p) => p[s.key]),
          borderColor: `rgb(${s.rgb})`,
          pointBackgroundColor: `rgb(${s.rgb})`,
          fill: false, // Strictly NO GRADIENTS: clean solid lines
        })),
      }}
    />
  );
}

/* ---------- Chart B: top caravans (pure HTML progress bars, Light/Dark) ---------- */

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
  const dark = useIsDark();
  const max = Math.max(maxOverride ?? 0, ...items.map((i) => i.total), 1);
  if (items.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-slate-400 dark:text-zinc-400">
        لا توجد بيانات
      </div>
    );
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
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold tabular-nums ${
                    idx === 0
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-black font-medium'
                      : 'bg-slate-100 text-slate-700 dark:bg-white/5 dark:text-zinc-300 border border-slate-200 dark:border-white/5'
                  }`}
                >
                  {idx + 1}
                </span>
                <span className="truncate font-medium text-slate-900 dark:text-white">
                  {item.name}
                </span>
              </div>
              <div
                className="flex shrink-0 items-center gap-2 tabular-nums"
                dir="ltr"
              >
                <span className="text-xs text-slate-500 dark:text-zinc-400">
                  {item.share.toFixed(1)}%
                </span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {fmtCompact(item.total)}
                </span>
              </div>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-950">
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${
                  dark
                    ? idx === 0
                      ? 'bg-[#c4b5fd]'
                      : idx === 1
                        ? 'bg-[#86efac]'
                        : 'bg-[#fde047]'
                    : idx === 0
                      ? 'bg-[#f97316]'
                      : idx === 1
                        ? 'bg-[#2563eb]'
                        : 'bg-[#f59e0b]'
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

export function PaymentDonut({
  slices,
  compact = false,
}: {
  slices: PaymentSlice[];
  compact?: boolean;
}) {
  const dark = useIsDark();
  const total = slices.reduce((a, s) => a + s.value, 0);

  // Palette adaptation for slices:
  // In dark: [Lavender, Slate, Amber]
  // In light: [Orange, Navy, Amber]
  const themedSlices = slices.map((s, idx) => {
    let rgb = s.rgb;
    let dot = s.dot;
    if (idx === 0) {
      rgb = dark ? PALETTE.lavender : PALETTE.orange;
      dot = dark ? "bg-[#c4b5fd]" : "bg-[#f97316]";
    } else if (idx === 1) {
      rgb = dark ? PALETTE.slate : PALETTE.navy;
      dot = dark ? "bg-[#94a3b8]" : "bg-[#1e3a8a]";
    } else if (idx === 2) {
      rgb = PALETTE.amber;
      dot = "bg-amber-500";
    }
    return { ...s, rgb, dot };
  });

  const options: ChartOptions<"doughnut"> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "72%",
    plugins: {
      legend: { display: false },
      tooltip: {
        ...tooltipBase,
        backgroundColor: dark ? "rgba(24, 24, 27, 0.95)" : "rgba(255, 255, 255, 0.98)",
        borderColor: dark ? "rgba(255, 255, 255, 0.08)" : "#e2e8f0",
        titleColor: dark ? "#ffffff" : "#0f172a",
        bodyColor: dark ? "#a1a1aa" : "#475569",
        callbacks: {
          label: (c) => {
            const v = Number(c.parsed);
            return ` ${c.label}: ${fmtMoney(v)} (${total > 0 ? ((v / total) * 100).toFixed(1) : "0.0"}%)`;
          },
        },
      },
    },
  };

  return (
    <div>
      <div
        className={`relative mx-auto ${compact ? "h-36 w-36" : "h-48 w-48"}`}
      >
        <Doughnut
          options={options}
          data={{
            labels: themedSlices.map((s) => s.label),
            datasets: [
              {
                data: themedSlices.map((s) => s.value),
                backgroundColor: themedSlices.map((s) => `rgb(${s.rgb})`),
                borderColor: dark ? "#18181b" : "#ffffff",
                borderWidth: 3,
                borderRadius: 4,
                hoverOffset: 6,
              },
            ],
          }}
        />
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs text-slate-500 dark:text-slate-400">الإجمالي</span>
          <span
            className="text-lg font-bold tabular-nums text-slate-900 dark:text-slate-100"
            dir="ltr"
          >
            {fmtCompact(total)}
          </span>
        </div>
      </div>

      <ul className={`space-y-2.5 ${compact ? "mt-4" : "mt-5"}`}>
        {themedSlices.map((s) => (
          <li
            key={s.label}
            className="flex items-center justify-between text-sm"
          >
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${s.dot}`} />
              <span className="text-slate-700 dark:text-slate-300">
                {s.label}
              </span>
            </div>
            <div className="flex items-center gap-2 tabular-nums" dir="ltr">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {total > 0 ? ((s.value / total) * 100).toFixed(1) : "0.0"}%
              </span>
              {!compact && (
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {fmtMoney(s.value)}
                </span>
              )}
              {compact && (
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {fmtCompact(s.value)}
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
