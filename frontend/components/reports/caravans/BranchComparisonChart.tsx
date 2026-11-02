"use client";

import React from "react";
import { Bar } from "react-chartjs-2";
import type { ChartOptions } from "chart.js";
import { fmtCompact, fmtInt, fmtMoney, useIsDark } from "./charts";

export interface OutletMetricStat {
  code: string;
  name: string;
  revenue: number;
  orders: number;
  avgTicket: number;
}

const truncate = (s: string, n: number): string =>
  s.length > n ? `${s.slice(0, n - 1)}…` : s;

/**
 * Outlets Comparison Bar Chart: Executive single-metric bar showing
 * Net Revenue per Outlet or Volume of Orders in Dual-Theme palette.
 * Dark Mode: Elegant solid Lavender (#c4b5fd).
 * Light Mode: Solid Orange (#f97316).
 */
export function BranchComparisonChart({
  stats,
  metric = "revenue",
}: {
  stats: OutletMetricStat[];
  metric?: "revenue" | "orders";
}) {
  const dark = useIsDark();
  const tick = dark ? "#94a3b8" : "#4b5563";
  const grid = dark ? "#334155" : "#e5e7eb";
  const barColor = dark ? "#c4b5fd" : "#f97316";
  const barHoverColor = dark ? "#a78bfa" : "#ea580c";

  const isRevenue = metric === "revenue";

  const options: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        rtl: true,
        backgroundColor: dark
          ? "rgba(24, 24, 27, 0.95)"
          : "rgba(255, 255, 255, 0.98)",
        borderColor: dark ? "rgba(255, 255, 255, 0.08)" : "#e2e8f0",
        borderWidth: 1,
        titleColor: dark ? "#ffffff" : "#0f172a",
        bodyColor: dark ? "#a1a1aa" : "#475569",
        padding: 12,
        cornerRadius: 12,
        usePointStyle: true,
        callbacks: {
          title: (items) =>
            items[0] ? (stats[items[0].dataIndex]?.name ?? "") : "",
          label: (c) =>
            isRevenue
              ? ` صافي الإيراد: ${fmtMoney(Number(c.parsed.y))}`
              : ` عدد العمليات: ${fmtInt(Number(c.parsed.y))} شيك`,
          footer: (items) => {
            const s = items[0] ? stats[items[0].dataIndex] : undefined;
            return s
              ? `متوسط الفاتورة: ${fmtMoney(s.avgTicket)} | الشيكات: ${fmtInt(s.orders)}`
              : "";
          },
        },
        footerColor: barColor,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: {
          color: tick,
          autoSkip: false,
          maxRotation: 0,
          font: { size: 11 },
          callback(value) {
            return truncate(stats[Number(value)]?.name ?? "", 14);
          },
        },
      },
      y: {
        beginAtZero: true,
        grid: { color: grid },
        border: { display: false },
        ticks: {
          color: tick,
          font: { size: 11 },
          callback: (v) =>
            isRevenue ? fmtCompact(Number(v)) : fmtInt(Number(v)),
        },
      },
    },
    datasets: {
      bar: {
        borderRadius: {
          topLeft: 8,
          topRight: 8,
          bottomLeft: 0,
          bottomRight: 0,
        },
        borderSkipped: false,
        maxBarThickness: 42,
      },
    },
  };

  const dataValues = stats.map((s) => (isRevenue ? s.revenue : s.orders));

  return (
    <Bar
      options={options}
      data={{
        labels: stats.map((s) => s.name),
        datasets: [
          {
            label: isRevenue ? "صافي الإيراد" : "عدد الشيكات",
            data: dataValues,
            backgroundColor: barColor,
            hoverBackgroundColor: barHoverColor,
          },
        ],
      }}
    />
  );
}
