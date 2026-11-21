'use client';

import React, { Suspense } from 'react';
import {
  AlertCircle,
  BarChart3,
  ChevronLeft,
  ChevronDown,
  DollarSign,
  Receipt,
  Percent,
  FileSpreadsheet,
  Printer,
  RefreshCw,
  Scale,
  Sparkles,
  LogOut,
} from 'lucide-react';
import { ThemeToggle } from '@/components/dashboard/ThemeToggle';
import { Card } from '@/components/ui/Card';
import { Segmented } from '@/components/ui/Segmented';
import { CaravanFiltersToolbar } from '@/components/reports/caravans/CaravanFiltersToolbar';
import { CaravanGrid } from '@/components/reports/caravans/CaravanGrid';
import { InvoicesTable } from '@/components/reports/caravans/InvoicesTable';
import { VoidsAlertWidget } from '@/components/reports/caravans/VoidsAlertWidget';
import { ParkMap } from '@/components/reports/caravans/ParkMap';
import {
  DuelCard,
  TopItemsWidget,
} from '@/components/reports/caravans/OperationalWidgets';
import { VisitorOutletPerformanceRow } from '@/components/reports/caravans/VisitorOutletPerformanceRow';
import { BranchComparisonChart } from '@/components/reports/caravans/BranchComparisonChart';
import { PeriodComparisonDashboard } from '@/components/reports/caravans/PeriodComparisonDashboard';
import { SplashScreen } from '@/components/reports/caravans/SplashScreen';
import { PrintConfigModal } from '@/components/reports/caravans/PrintConfigModal';
import { ItemSalesPerformance } from '@/components/reports/caravans/ItemSalesPerformance';
import { RevenueTrendChart, Money } from '@/components/reports/caravans/charts';
import {
  ExecutiveKpisSection,
  KPIsSkeleton,
} from '@/components/reports/caravans/ExecutiveKpisSection';
import { DailyRevenueMatrix } from '@/components/reports/caravans/DailyRevenueMatrix';
import { useSectorDashboard } from '@/hooks/useSectorDashboard';
import { type SectorConfig, SECTOR_ICONS } from '@/config/sectorsConfig';

interface SectorDashboardProps {
  sector: SectorConfig;
}

export function SectorDashboard({ sector }: SectorDashboardProps) {
  const dash = useSectorDashboard(sector);
  const SectorIcon = SECTOR_ICONS[sector.iconName];

  // Dynamic calculations for the 3 Core KPI Cards based on currently displayed rows
  const financialTotals = React.useMemo(() => {
    let rawTotal = 0;
    (dash.records || []).forEach((r) => {
      const cash = Number(r.cash) || 0;
      const visa = Number(r.visa) || 0;
      const cl = Number(r.creditLine ?? (r as any).cl) || 0;
      const rowSum = (cash + visa + cl) > 0 ? (cash + visa + cl) : (Number(r.total) || 0);
      rawTotal += rowSum;
    });

    const net = rawTotal / 1.14;
    const vat = rawTotal - net;

    return { total: rawTotal, net, retail: net, vat };
  }, [dash.records]);

  // Unauthenticated screen guard
  if (dash.isAuthorized === null || !dash.isAuthorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 dark:bg-[#09090b]">
        <div className="flex flex-col items-center gap-3">
          <img
            src="/dreampark-logo.png"
            alt="Dream Park"
            className="h-10 w-auto object-contain animate-pulse"
          />
          <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
            جاري التحقق من الصلاحيات والبيانات...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-slate-50 text-slate-900 selection:bg-orange-500/20 selection:text-orange-600 dark:bg-[#09090b] dark:text-white dark:selection:bg-orange-500/20 dark:selection:text-orange-400">
      {/* 1. Splash Screen with Dream Park Theming */}
      <SplashScreen isLoading={dash.loading} minDurationMs={1200} />

      {/* 2. Institutional Dream Park Background Watermark */}
      <div className="pointer-events-none fixed inset-0 z-0 flex items-center justify-center opacity-[0.03] select-none overflow-hidden print:opacity-[0.05] dark:opacity-[0.035]">
        <img
          src="/dreampark-logo.png"
          alt=""
          className="w-[740px] max-w-[85vw] object-contain filter grayscale contrast-150"
        />
      </div>

      <div className="relative z-10 mx-auto max-w-[1680px] space-y-6 p-4 sm:p-6 lg:p-8">
        {/* ---------- Header ---------- */}
        <header className="space-y-4">
          <div className="flex items-center justify-between">
            <nav className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-zinc-400" aria-label="breadcrumb">
              <span className="font-medium text-slate-700 dark:text-zinc-300">منظومة العمليات والتحليلات</span>
              <ChevronLeft className="h-3.5 w-3.5" />
              <span className={`font-bold ${sector.theme.accentText}`}>{sector.breadcrumb} 2026</span>
              <span className="rounded-full bg-slate-200/70 px-2 py-0.5 text-[11px] font-mono font-bold text-slate-700 dark:bg-zinc-800 dark:text-zinc-300">
                {sector.badge}
              </span>
            </nav>

            {/* User Session & Theme Controls */}
            <div className="flex items-center gap-2 print:hidden">
              <div className="hidden items-center gap-2 rounded-lg border border-slate-200/80 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm ring-1 ring-slate-900/5 dark:border-zinc-800/80 dark:bg-zinc-900/60 dark:ring-white/10 dark:text-zinc-300 sm:flex">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>المستخدم:</span>
                <strong className="font-semibold text-slate-900 dark:text-white font-mono">{dash.authUser}</strong>
              </div>

              <button
                type="button"
                onClick={dash.handleSignOut}
                title="تسجيل الخروج من النظام"
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200/80 bg-white px-3 text-xs font-semibold text-rose-600 shadow-sm ring-1 ring-slate-900/5 transition hover:bg-rose-50 hover:border-rose-300 dark:border-zinc-800/80 dark:bg-zinc-900/60 dark:ring-white/10 dark:text-rose-400 dark:hover:bg-rose-950/30 dark:hover:border-rose-900/50 active:scale-95"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">تسجيل الخروج</span>
              </button>

              <ThemeToggle />
            </div>
          </div>

                    {/* Top Sector Evaluation / Hero Banner Panel */}
                    <div className={`relative overflow-hidden rounded-2xl border p-5 sm:p-6 shadow-sm backdrop-blur-md transition-all duration-300 ${sector.theme.bannerGradient}`}>
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="flex items-center gap-3.5">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/90 p-1.5 shadow-sm ring-1 ring-slate-900/5 dark:bg-zinc-900/90 dark:ring-white/10">
                              <img src="/dreampark-logo.png" alt="Dream Park" className="h-full w-auto object-contain drop-shadow" />
                            </div>
                            <div>
                                <div className="flex flex-wrap items-center gap-2.5">
                                  <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white sm:text-3xl tracking-tight">
                                    {sector.pageTitle}
                                  </h1>
                                  {SectorIcon && (
                                    <div className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold shadow-2xs ${sector.theme.pillBg}`}>
                                      <SectorIcon className="h-4 w-4" />
                                      <span>{sector.label}</span>
                                      <span className="font-mono text-[10px] opacity-80">({sector.badge})</span>
                                    </div>
                                  )}
                                </div>
                                <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 mt-1 font-medium">
                                  {sector.description}
                                </p>
                            </div>
                          </div>

                              {/* Executive Print Report Header */}
                              <div className="hidden print:flex print:w-full print:items-center print:justify-between print:border-b-2 print:border-black print:pb-2 print:pt-1 print:mb-2">
                                <div className="flex items-center gap-3">
                                  <img src="/dreampark-logo.png" alt="Dream Park" className="h-9 w-auto object-contain" />
                                  <div>
                                    <h2 className="text-lg font-black text-black">دريم بارك — تقرير إيرادات ومبيعات {sector.label}</h2>
                                    <p className="text-[11px] font-semibold text-black mt-0.5">
                                      الفترة: {dash.start} إلى {dash.end} • النطاق: {dash.topScopeLabel}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-left text-[10px] font-semibold text-black" dir="ltr">
                                  <div>
                                    تاريخ الطباعة: {new Date().toLocaleDateString('en-GB')}{' '}
                                    {new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                  <div>المستخدم: {dash.authUser || 'admin'}</div>
                                </div>
                              </div>

                                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 px-3 py-1 text-xs font-medium text-slate-700 shadow-sm dark:border-white/10 dark:bg-zinc-900/60 dark:text-zinc-300 backdrop-blur-xs">
                                  <span className="relative flex h-2 w-2">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
                                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                                  </span>
                                  محدث لحظياً
                                  {dash.updatedAt && (
                                    <span className="tabular-nums opacity-80" dir="ltr">
                                      {dash.updatedAt.toLocaleTimeString('en-GB')}
                                    </span>
                                  )}
                                </span>
                        </div>

                            {/* Actions & Mode Switcher */}
                            <div className="flex flex-wrap items-center gap-2 print:hidden">
                              <div className="inline-flex rounded-lg border border-slate-200/80 bg-white/80 p-1 ring-1 ring-slate-900/5 dark:border-zinc-800/80 dark:bg-zinc-900/60 dark:ring-white/10 backdrop-blur-xs">
                                <button
                                  type="button"
                                  onClick={() => dash.setViewMode('standard')}
                                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition ${dash.viewMode === 'standard'
                                    ? 'bg-white text-orange-600 shadow-sm dark:bg-zinc-950 dark:text-orange-400 border border-slate-200/80 dark:border-zinc-800'
                                    : 'text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-300'
                                    }`}
                                >
                                  <BarChart3 className="h-3.5 w-3.5" />
                                  <span>التقرير القياسي</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => dash.setViewMode('comparison')}
                                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition ${dash.viewMode === 'comparison'
                                    ? 'bg-white text-orange-600 shadow-sm dark:bg-zinc-950 dark:text-orange-400 border border-slate-200/80 dark:border-zinc-800'
                                    : 'text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-300'
                                    }`}
                                >
                                  <Scale className="h-3.5 w-3.5" />
                                  <span>مقارنة فترتين</span>
                                </button>
                              </div>

                              <button
                                type="button"
                                onClick={dash.triggerRefresh}
                                disabled={dash.loading || dash.comparisonLoading}
                                aria-label="تحديث"
                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200/80 bg-white/80 text-slate-700 shadow-sm ring-1 ring-slate-900/5 transition hover:text-orange-600 hover:bg-slate-50 dark:border-zinc-800/80 dark:bg-zinc-900/60 dark:ring-white/10 dark:text-zinc-300 dark:hover:text-orange-400 dark:hover:bg-zinc-800 disabled:opacity-50 backdrop-blur-xs"
                              >
                                <RefreshCw
                                  className={`h-4 w-4 ${dash.loading || dash.comparisonLoading ? 'animate-spin' : ''}`}
                                />
                              </button>
                              <button
                                type="button"
                                onClick={dash.exportExcel}
                                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-orange-600 px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-orange-700 active:scale-95"
                              >
                                <FileSpreadsheet className="h-4 w-4" />
                                تصدير Excel
                              </button>
                              <button
                                type="button"
                                onClick={() => dash.setPrintModalOpen(true)}
                                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200/80 bg-white/80 px-3 text-xs font-semibold text-slate-700 shadow-sm ring-1 ring-slate-900/5 transition hover:bg-slate-50 dark:border-zinc-800/80 dark:bg-zinc-900/60 dark:ring-white/10 dark:text-zinc-300 dark:hover:bg-zinc-800 active:scale-95 backdrop-blur-xs"
                              >
                                <Printer className="h-4 w-4" />
                                طباعة
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* ---------- Filter Toolbar ---------- */}
                        <CaravanFiltersToolbar
                          sectorType={sector.type}
                          sectorLabel={sector.label}
                          viewMode={dash.viewMode}
                          facilityType={dash.facilityType}
                          onFacilityTypeChange={dash.setFacilityType}
                          branchOptions={dash.branchOptions}
                          selectedBranches={dash.selected}
                          onSelectedBranchesChange={dash.setSelected}
                          granularity={dash.granularity}
                          onGranularityChange={dash.setGranularity}
                          preset={dash.preset}
                          onApplyPreset={dash.applyPreset}
                          startDate={dash.start}
                          endDate={dash.end}
                          onDateChange={(newStart, newEnd) => {
                            dash.resetStaleData();
                            dash.setStart(newStart);
                            dash.setEnd(newEnd);
                            dash.setPreset('custom');
                          }}
                          isLoading={dash.isLoading}
                          compPreset={dash.compPreset}
                          onApplyCompPreset={dash.applyCompPreset}
                          compStartA={dash.compStartA}
                          compEndA={dash.compEndA}
                          onCompRangeAChange={(s, e) => {
                            dash.setComparisonData(null);
                            dash.setCompStartA(s);
                            dash.setCompEndA(e);
                            dash.setCompPreset('custom');
                          }}
                          compStartB={dash.compStartB}
                          compEndB={dash.compEndB}
                          onCompRangeBChange={(s, e) => {
                            dash.setComparisonData(null);
                            dash.setCompStartB(s);
                            dash.setCompEndB(e);
                            dash.setCompPreset('custom');
                          }}
                          comparisonLoading={dash.comparisonLoading}
                        />
                      </header>

                      {/* ---------- Error Alerts ---------- */}
                      {dash.error && (
                        <div
                          role="alert"
                          className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300"
                        >
                          <AlertCircle className="h-5 w-5 shrink-0" />
                          {dash.error}
                        </div>
                      )}

                      {dash.comparisonError && dash.viewMode === 'comparison' && (
                        <div
                          role="alert"
                          className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300"
                        >
                          <AlertCircle className="h-5 w-5 shrink-0" />
                          {dash.comparisonError}
                        </div>
                      )}

                      {/* ========================================================================= */}
                      {/* VIEW MODE 1: PERIOD-OVER-PERIOD COMPARISON                                */}
                      {/* ========================================================================= */}
                      {dash.viewMode === 'comparison' ? (
                        <div className="space-y-6">
                          <PeriodComparisonDashboard
                            data={dash.comparisonData}
                            loading={dash.comparisonLoading}
                            scopeLabel={dash.topScopeLabel}
                          />

                          <div className={`break-inside-avoid ${!dash.printConfig.itemsPerformance ? 'print:hidden' : ''}`}>
                            <ItemSalesPerformance
                              startDate={dash.compStartA}
                              endDate={dash.compEndA}
                              prevStartDate={dash.compStartB}
                              prevEndDate={dash.compEndB}
                              selectedBranches={dash.effectiveBranches}
                            />
                          </div>

                          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/5 dark:bg-[#18181b] print:hidden">
                            <div className="mb-4">
                              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                خريطة المنافذ — انقر للمقارنة الفردية
                              </h3>
                              <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
                                اضغط على أي منفذ لعزل ومقارنة أدائه بين الفترتين A و B فورياً
                              </p>
                            </div>
                            <ParkMap
                              outlets={
                                dash.outlets.length > 0
                                  ? dash.outlets
                                  : (dash.itemsData?.allOutlets ?? dash.itemsData?.outlets ?? [])
                              }
                              selected={dash.selected}
                              onSelect={dash.selectFromMap}
                            />
                          </section>
                        </div>
                      ) : (
                        /* ========================================================================= */
                        /* VIEW MODE 2: STANDARD OPERATIONAL REPORT                                 */
                        /* ========================================================================= */
                        <div className="space-y-6">
                          {/* --------------------------------------------------------------------- */}
                          {/* TOP KPI CARDS: 3 STANDALONE EQUAL FINANCIAL METRICS (Dynamic Calculation) */}
                          {/* --------------------------------------------------------------------- */}
                          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 break-inside-avoid">
                            {/* Card 1: Total Revenue (شامل الضريبة) */}
                            <div className={`flex flex-col justify-between rounded-xl border border-blue-200/80 bg-blue-50/50 p-5 shadow-sm ring-1 ring-blue-500/10 backdrop-blur-md transition hover:border-blue-300 dark:border-blue-900/40 dark:bg-blue-950/20 dark:ring-blue-400/10 border-t-2 ${sector.theme.borderAccent}`}>
                              <div className="flex items-start justify-between">
                                <div>
                                  <span className="text-sm font-bold text-slate-800 dark:text-zinc-100">
                                    إجمالي الإيرادات (شامل الضريبة)
                                  </span>
                                  <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
                                    Total Sales = Cash &amp; Visa &amp; CL
                                  </p>
                                </div>
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 shadow-2xs">
                                  <DollarSign className="h-5 w-5" />
                                </div>
                              </div>

                              <div className="mt-4 flex items-baseline justify-between gap-2">
                                <div className="text-3xl font-extrabold tracking-tight font-mono tabular-nums text-zinc-900 dark:text-white" dir="ltr">
                                  <Money value={financialTotals.total} symbolClassName="text-sm opacity-60 font-normal mr-1.5 select-none" />
                                </div>
                                <span className="rounded-full bg-blue-100/80 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                                  الإجمالي
                                </span>
                              </div>

                              <div className="mt-3 flex items-center justify-between border-t border-blue-100/80 pt-2.5 dark:border-blue-900/30 text-xs text-slate-500 dark:text-zinc-400">
                                <span>محسوب وفق المنافذ المعروضة</span>
                                <span className="font-mono tabular-nums">{dash.records.length} سجل</span>
                              </div>
                            </div>

                            {/* Card 2: Net Sales (الصافي) */}
                            <div className={`flex flex-col justify-between rounded-xl border border-emerald-200/80 bg-emerald-50/50 p-5 shadow-sm ring-1 ring-emerald-500/10 backdrop-blur-md transition hover:border-emerald-300 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:ring-emerald-400/10 border-t-2 ${sector.theme.borderAccent}`}>
                              <div className="flex items-start justify-between">
                                <div>
                                  <span className="text-sm font-bold text-slate-800 dark:text-zinc-100">
                                    الصافي (Net Sales)
                                  </span>
                                  <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
                                    Retail (Total / 1.14)
                                  </p>
                                </div>
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 shadow-2xs">
                                  <Receipt className="h-5 w-5" />
                                </div>
                              </div>

                              <div className="mt-4 flex items-baseline justify-between gap-2">
                                <div className="text-3xl font-extrabold tracking-tight font-mono tabular-nums text-zinc-900 dark:text-white" dir="ltr">
                                  <Money value={financialTotals.retail} symbolClassName="text-sm opacity-60 font-normal mr-1.5 select-none" />
                                </div>
                                <span className="rounded-full bg-emerald-100/80 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                                  قبل الضريبة
                                </span>
                              </div>

                              <div className="mt-3 flex items-center justify-between border-t border-emerald-100/80 pt-2.5 dark:border-emerald-900/30 text-xs text-slate-500 dark:text-zinc-400">
                                <span>صافي الدخل التشغيلي للمبيعات</span>
                                <span className="font-mono tabular-nums">87.7%</span>
                              </div>
                            </div>

                            {/* Card 3: VAT 14% (ضريبة القيمة المضافة) */}
                            <div className={`flex flex-col justify-between rounded-xl border border-amber-200/80 bg-amber-50/50 p-5 shadow-sm ring-1 ring-amber-500/10 backdrop-blur-md transition hover:border-amber-300 dark:border-amber-900/40 dark:bg-amber-950/20 dark:ring-amber-400/10 border-t-2 ${sector.theme.borderAccent}`}>
                              <div className="flex items-start justify-between">
                                <div>
                                  <span className="text-sm font-bold text-slate-800 dark:text-zinc-100">
                                    ضريبة القيمة المضافة (VAT 14%)
                                  </span>
                                  <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
                                    Total - Net
                                  </p>
                                </div>
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 shadow-2xs">
                                  <Percent className="h-5 w-5" />
                                </div>
                              </div>

                              <div className="mt-4 flex items-baseline justify-between gap-2">
                                <div className="text-3xl font-extrabold tracking-tight font-mono tabular-nums text-zinc-900 dark:text-white" dir="ltr">
                                  <Money value={financialTotals.vat} symbolClassName="text-sm opacity-60 font-normal mr-1.5 select-none" />
                                </div>
                                <span className="rounded-full bg-amber-100/80 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                                  14% مستحقة
                                </span>
                              </div>

                              <div className="mt-3 flex items-center justify-between border-t border-amber-100/80 pt-2.5 dark:border-amber-900/30 text-xs text-slate-500 dark:text-zinc-400">
                                <span>الضريبة المحصلة للإقرار المالي</span>
                                <span className="font-mono tabular-nums">14%</span>
                              </div>
                            </div>
                          </div>

                          {/* --------------------------------------------------------------------- */}
                          {/* DAILY REVENUE MATRIX (Excel-Like Dynamic Pivot)                       */}
                          {/* --------------------------------------------------------------------- */}
                          <div className="break-inside-avoid">
                            <DailyRevenueMatrix
                              rows={dash.records}
                              loading={dash.loading}
                              facilityType={dash.facilityType}
                              startDate={dash.start}
                              endDate={dash.end}
                              sectorType={sector.type}
                              sectorLabel={sector.label}
                              sectorId={sector.id}
                              sectorTheme={sector.theme}
                            />
                          </div>

                          {/* --------------------------------------------------------------------- */}
                          {/* ROW 1: DYNAMICS (Branch Comparison & Conditional Revenue Trend)       */}
                          {/* --------------------------------------------------------------------- */}
                          {(() => {
                            const isSingleDay = dash.start === dash.end;

                            return (
                              <div
                                className={`grid grid-cols-1 gap-4 transition-opacity lg:grid-cols-12 break-inside-avoid ${dash.loading ? 'opacity-60' : ''
                                  } ${!dash.printConfig.charts ? 'print:hidden' : ''}`}
                              >
                                <Card
                                  className={isSingleDay ? 'col-span-full lg:col-span-12' : 'col-span-12 lg:col-span-6'}
                                  title={`مقارنة أداء منافذ ${sector.label}`}
                                  subtitle={
                                    isSingleDay
                                      ? `جميع منافذ القطاع (${dash.comparisonStats.length} منفذ) مرتبة حسب ${dash.barMetric === 'revenue' ? 'الإجمالي الشامل' : 'عدد العمليات'
                                      }`
                                      : `أعلى ${Math.min(
                                        dash.comparisonStats.length,
                                        10
                                      )} منافذ مرتبة حسب ${dash.barMetric === 'revenue' ? 'الإجمالي الشامل' : 'عدد العمليات'
                                      }`
                                  }
                                  action={
                                    <Segmented
                                      options={[
                                        { id: 'revenue', label: 'الإجمالي الشامل' },
                                        { id: 'orders', label: 'عدد الشيكات' },
                                      ]}
                                      value={dash.barMetric}
                                      onChange={dash.setBarMetric}
                                    />
                                  }
                                >
                                  <div className="h-[360px]" dir="ltr">
                                    {dash.comparisonStats.length > 0 ? (
                                      <BranchComparisonChart
                                        stats={dash.comparisonStats}
                                        metric={dash.barMetric}
                                        isSingleDay={isSingleDay}
                                        chartHex={sector.theme.chartHex}
                                      />
                                    ) : (
                                      <div className="flex h-full items-center justify-center text-sm text-zinc-400">
                                        لا توجد بيانات
                                      </div>
                                    )}
                                  </div>
                                </Card>

                                {!isSingleDay && (
                                  <Card
                                    className="col-span-12 lg:col-span-6"
                                    title="اتجاه الإيرادات عبر الوقت"
                                    subtitle="مسار المبيعات مقسّماً (الإجمالي الشامل، النقدية، الفيزا)"
                                  >
                                    <div className="h-[360px]" dir="ltr">
                                      <RevenueTrendChart
                                        points={dash.trend}
                                        startDate={dash.start}
                                        endDate={dash.end}
                                      />
                                    </div>
                                  </Card>
                                )}
                              </div>
                            );
                          })()}

                          {/* --------------------------------------------------------------------- */}
                          {/* ROW 3: FINANCIAL CONTROL (Active Voids Alert & Master Ledger)         */}
                          {/* --------------------------------------------------------------------- */}
                          <div
                            className={`space-y-4 print:space-y-3 print:break-inside-auto ${!dash.printConfig.table ? 'print:hidden' : ''
                              }`}
                          >
                            {/* Active Voids Alert Widget */}
                            <VoidsAlertWidget rows={dash.records} />

                            {/* Master Financial Ledger */}
                            <CaravanGrid
                              rows={dash.records}
                              showPeriod={dash.granularity !== 'summary'}
                              loading={dash.loading}
                              singularLabel={sector.singularLabel}
                              pluralLabel={sector.pluralLabel}
                              sectorType={sector.type}
                            />
                          </div>

                          {/* --------------------------------------------------------------------- */}
                          {/* ROW 4: COLLAPSIBLE ANALYTICAL DRAWER (تحليلات إضافية وتركيبية)         */}
                          {/* --------------------------------------------------------------------- */}
                          <details className="group rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm ring-1 ring-slate-900/5 backdrop-blur-md transition-all duration-200 dark:border-zinc-800/80 dark:bg-zinc-900/60 dark:ring-white/10 print:hidden">
                            <summary className="flex cursor-pointer items-center justify-between text-base font-bold text-slate-800 dark:text-zinc-200 select-none list-none">
                              <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50 text-orange-600 dark:bg-zinc-800 dark:text-zinc-300">
                                  <Sparkles className="h-4 w-4" />
                                </div>
                                <div>
                                  <span className="text-base font-bold text-slate-900 dark:text-white">
                                    تحليلات إضافية وتركيبية
                                  </span>
                                  <p className="text-xs font-normal text-slate-500 dark:text-zinc-400 mt-0.5">
                                    تتضمن: سلوك الإنفاق، كفاءة التشغيل، الأفضل مبيعاً والراكد، تحليل مبيعات الأصناف، والمزيد
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 group-open:text-orange-600 dark:text-zinc-400 dark:group-open:text-orange-400">
                                <span className="hidden sm:inline">عرض / إخفاء</span>
                                <ChevronDown className="h-5 w-5 transition-transform duration-300 group-open:rotate-180" />
                              </div>
                            </summary>

                            <div className="mt-6 space-y-6 border-t border-slate-100 pt-6 dark:border-zinc-800/80">
                              {/* 1. Top Macro KPIs (إجمالي الإيرادات، الكميات، الزوار، والمرتجعات) */}
                              <div className="break-inside-avoid">
                                <Suspense fallback={<KPIsSkeleton />}>
                                  <ExecutiveKpisSection
                                    startDate={dash.start}
                                    endDate={dash.end}
                                    selectedBranches={dash.effectiveBranches}
                                    summary={dash.summary}
                                    trend={dash.trend}
                                    records={dash.records}
                                    guests={dash.guests}
                                    refreshTick={dash.refreshTick}
                                  />
                                </Suspense>
                              </div>

                              {/* 2. Spend Behavior & Operational Efficiency (سلوك الإنفاق وكفاءة التشغيل) */}
                              <div className="break-inside-avoid">
                                <VisitorOutletPerformanceRow
                                  totalRevenue={dash.summary?.totalSales ?? 0}
                                  records={dash.records}
                                  guests={dash.guests}
                                  spendPerGuest={dash.spendPerGuest}
                                  summary={dash.summary}
                                  loading={dash.loading}
                                />
                              </div>

                              {dash.itemsError && (
                                <div
                                  role="alert"
                                  className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300"
                                >
                                  <AlertCircle className="h-5 w-5 shrink-0" />
                                  تحليلات الأصناف غير متاحة: {dash.itemsError}
                                </div>
                              )}

                              {/* 2. Best & Worst Sellers (الأفضل مبيعاً والراكد) */}
                              <div className="break-inside-avoid">
                                <TopItemsWidget
                                  items={dash.topItems.length > 0 ? dash.topItems : (dash.itemsData?.topItems ?? [])}
                                  slowItems={dash.slowItems.length > 0 ? dash.slowItems : (dash.itemsData?.slowItems ?? [])}
                                  mode={dash.itemMode}
                                  onModeChange={dash.setItemMode}
                                  metric={dash.itemMetric}
                                  onMetricChange={dash.setItemMetric}
                                  scopeLabel={dash.topScopeLabel}
                                  loading={dash.itemsLoading}
                                />
                              </div>

                              {/* 3. Item Sales Analysis (تحليل مبيعات الأصناف - ABC Classification) */}
                              <div className="break-inside-avoid">
                                <ItemSalesPerformance
                                  startDate={dash.start}
                                  endDate={dash.end}
                                  selectedBranches={dash.effectiveBranches}
                                />
                              </div>

                              {/* 4. Duel Card & 2D Interactive Map */}
                              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                                <div className="lg:col-span-12 xl:col-span-5">
                                  <DuelCard duel={dash.itemsData?.duel ?? null} loading={dash.itemsLoading} />
                                </div>
                                <div className="lg:col-span-12 xl:col-span-7">
                                  <section className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-5 shadow-2xs ring-1 ring-slate-900/5 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-900/40 dark:ring-white/10">
                                    <div className="mb-4">
                                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                        خريطة المحلات ونشاط المبيعات
                                      </h3>
                                      <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
                                        اللون يعبّر عن سرعة المبيعات — انقر على منفذ لتصفية البيانات
                                      </p>
                                    </div>
                                    <ParkMap
                                      outlets={
                                        dash.outlets.length > 0
                                          ? dash.outlets
                                          : (dash.itemsData?.allOutlets ?? dash.itemsData?.outlets ?? [])
                                      }
                                      selected={dash.selected}
                                      onSelect={dash.selectFromMap}
                                    />
                                  </section>
                                </div>
                              </div>

                              {/* 5. Invoices Ledger */}
                              <div className="break-inside-avoid">
                                <InvoicesTable
                                  invoices={dash.invoicesData.length > 0 ? dash.invoicesData : undefined}
                                  loading={dash.loading}
                                />
                              </div>
                            </div>
                          </details>
                        </div>
                      )}
                    </div>

                    {/* Modular Print Configuration Modal */}
                    <PrintConfigModal
                      isOpen={dash.printModalOpen}
                      onClose={() => dash.setPrintModalOpen(false)}
                      config={dash.printConfig}
                      onChange={dash.setPrintConfig}
                      onPrint={dash.handlePrint}
                    />
                  </div>
                  );
}

                  export default SectorDashboard;
