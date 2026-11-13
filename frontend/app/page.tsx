'use client';

import React, { Suspense } from 'react';
import {
  AlertCircle,
  BarChart3,
  ChevronLeft,
  ChevronDown,
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
  CaptureRateCard,
  DuelCard,
  TopItemsWidget,
} from '@/components/reports/caravans/OperationalWidgets';
import { BranchComparisonChart } from '@/components/reports/caravans/BranchComparisonChart';
import { PeriodComparisonDashboard } from '@/components/reports/caravans/PeriodComparisonDashboard';
import { SplashScreen } from '@/components/reports/caravans/SplashScreen';
import { PrintConfigModal } from '@/components/reports/caravans/PrintConfigModal';
import { ItemSalesPerformance } from '@/components/reports/caravans/ItemSalesPerformance';
import { RevenueTrendChart } from '@/components/reports/caravans/charts';
import {
  ExecutiveKpisSection,
  KPIsSkeleton,
} from '@/components/reports/caravans/ExecutiveKpisSection';
import { useCaravanDashboard } from '@/hooks/useCaravanDashboard';

const MAX_BRANCHES_IN_CHART = 10;

export default function CaravanDashboardHomePage() {
  const dash = useCaravanDashboard();

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
              <span className="font-bold text-orange-600 dark:text-orange-400">لوحة تقارير الكرفانات 2026</span>
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

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-3">
                <img src="/dreampark-logo.png" alt="Dream Park" className="h-10 w-auto object-contain drop-shadow" />
                <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white sm:text-3xl">
                  إيرادات الكرفانات والمحلات
                </h1>
              </div>

              {/* Executive Print Report Header */}
              <div className="hidden print:flex print:w-full print:items-center print:justify-between print:border-b-2 print:border-black print:pb-2 print:pt-1 print:mb-2">
                <div className="flex items-center gap-3">
                  <img src="/dreampark-logo.png" alt="Dream Park" className="h-9 w-auto object-contain" />
                  <div>
                    <h2 className="text-lg font-black text-black">دريم بارك — تقرير إيرادات ومبيعات الكرفانات والمحلات</h2>
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

              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm dark:border-white/5 dark:bg-white/5 dark:text-zinc-300">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-500 opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-orange-500" />
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
              <div className="inline-flex rounded-lg border border-slate-200/80 bg-slate-100 p-1 ring-1 ring-slate-900/5 dark:border-zinc-800/80 dark:bg-zinc-900/60 dark:ring-white/10">
                <button
                  type="button"
                  onClick={() => dash.setViewMode('standard')}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition ${
                    dash.viewMode === 'standard'
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
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition ${
                    dash.viewMode === 'comparison'
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
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200/80 bg-white text-slate-700 shadow-sm ring-1 ring-slate-900/5 transition hover:text-orange-600 hover:bg-slate-50 dark:border-zinc-800/80 dark:bg-zinc-900/60 dark:ring-white/10 dark:text-zinc-300 dark:hover:text-orange-400 dark:hover:bg-zinc-800 disabled:opacity-50"
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
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200/80 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm ring-1 ring-slate-900/5 transition hover:bg-slate-50 dark:border-zinc-800/80 dark:bg-zinc-900/60 dark:ring-white/10 dark:text-zinc-300 dark:hover:bg-zinc-800 active:scale-95"
              >
                <Printer className="h-4 w-4" />
                طباعة
              </button>
            </div>
          </div>

          {/* ---------- Filter Toolbar ---------- */}
          <CaravanFiltersToolbar
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
                  خريطة الكرافانات — انقر للمقارنة الفردية
                </h3>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
                  اضغط على أي محل لعزل ومقارنة أدائه بين الفترتين A و B فورياً
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
          /* VIEW MODE 2: STANDARD OPERATIONAL REPORT (REORDERED CARAVANS MVP)         */
          /* ========================================================================= */
          <div className="space-y-6">
            {/* --------------------------------------------------------------------- */}
            {/* ROW 1: EXECUTIVE PULSE (Suspense-wrapped Top KPI Cards)               */}
            {/* --------------------------------------------------------------------- */}
            <div className={`break-inside-avoid ${!dash.printConfig.kpis ? 'print:hidden' : ''}`}>
              <Suspense fallback={<KPIsSkeleton />}>
                <ExecutiveKpisSection
                  startDate={dash.start}
                  endDate={dash.end}
                  selectedBranches={dash.effectiveBranches}
                  summary={dash.summary}
                  trend={dash.trend}
                  refreshTick={dash.refreshTick}
                />
              </Suspense>
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

            {/* --------------------------------------------------------------------- */}
            {/* ROW 2: SALES DRIVERS (Top Items by Quantity & Capture Rate)          */}
            {/* --------------------------------------------------------------------- */}
            <div
              className={`grid grid-cols-1 gap-4 lg:grid-cols-12 break-inside-avoid ${
                !dash.printConfig.kpis ? 'print:hidden' : ''
              }`}
            >
              {/* Primary Focus: Top Items defaulting to QUANTITY (الكميات) */}
              <div className="lg:col-span-12 xl:col-span-8">
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

              {/* Park Capture Rate & Spend per Guest */}
              <div className="lg:col-span-12 xl:col-span-4">
                <CaptureRateCard
                  guests={dash.guests}
                  spendPerGuest={dash.spendPerGuest}
                  capture={
                    dash.itemsData?.capture ?? {
                      caravanRevenue: dash.summary?.totalSales ?? 0,
                      grossRevenue: dash.summary?.totalSales ?? 0,
                      gateTickets: 0,
                      guests: dash.guests,
                      spendPerGuest: dash.spendPerGuest,
                      visitDivisor: 6,
                      gateBranchCodes: [],
                    }
                  }
                  loading={dash.itemsLoading}
                />
              </div>
            </div>

            {/* --------------------------------------------------------------------- */}
            {/* ROW 3: DYNAMICS (Branch Comparison & Revenue Trend Side-by-Side)      */}
            {/* --------------------------------------------------------------------- */}
            <div
              className={`grid grid-cols-1 gap-4 transition-opacity lg:grid-cols-12 break-inside-avoid ${
                dash.loading ? 'opacity-60' : ''
              } ${!dash.printConfig.charts ? 'print:hidden' : ''}`}
            >
              <Card
                className="lg:col-span-6"
                title="مقارنة أداء الفروع والمحلات"
                subtitle={`أعلى ${Math.min(
                  dash.comparisonStats.length,
                  MAX_BRANCHES_IN_CHART
                )} محلات مرتبة حسب ${
                  dash.barMetric === 'revenue' ? 'صافي الإيراد' : 'عدد العمليات'
                }`}
                action={
                  <Segmented
                    options={[
                      { id: 'revenue', label: 'صافي الإيراد' },
                      { id: 'orders', label: 'عدد الشيكات' },
                    ]}
                    value={dash.barMetric}
                    onChange={dash.setBarMetric}
                  />
                }
              >
                <div className="h-[360px]" dir="ltr">
                  {dash.comparisonStats.length > 0 ? (
                    <BranchComparisonChart stats={dash.comparisonStats} metric={dash.barMetric} />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-zinc-400">
                      لا توجد بيانات
                    </div>
                  )}
                </div>
              </Card>

              <Card
                className="lg:col-span-6"
                title="اتجاه الإيرادات عبر الوقت"
                subtitle="مسار المبيعات مقسّماً (صافي الإيراد، النقدية، الفيزا)"
              >
                <div className="h-[360px]" dir="ltr">
                  {dash.trend.length > 0 ? (
                    <RevenueTrendChart points={dash.trend} />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-zinc-400">
                      لا توجد بيانات
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* --------------------------------------------------------------------- */}
            {/* ROW 4: FINANCIAL CONTROL (Active Voids Alert & Caravan Master Ledger) */}
            {/* --------------------------------------------------------------------- */}
            <div
              className={`space-y-4 print:space-y-3 print:break-inside-auto ${
                !dash.printConfig.table ? 'print:hidden' : ''
              }`}
            >
              {/* Active Voids Alert Widget */}
              <VoidsAlertWidget rows={dash.records} />

              {/* Master Caravan Financial Ledger */}
              <CaravanGrid
                rows={dash.records}
                showPeriod={dash.granularity !== 'summary'}
                loading={dash.loading}
              />
            </div>

            {/* --------------------------------------------------------------------- */}
            {/* ROW 5: ITEM DEEP-DIVE (ABC Classification & Full Product Matrix)     */}
            {/* --------------------------------------------------------------------- */}
            <div className={`break-inside-avoid ${!dash.printConfig.itemsPerformance ? 'print:hidden' : ''}`}>
              <ItemSalesPerformance
                startDate={dash.start}
                endDate={dash.end}
                selectedBranches={dash.effectiveBranches}
              />
            </div>

            {/* --------------------------------------------------------------------- */}
            {/* ROW 6: ADVANCED ANALYTICS DRAWER (Collapsible Experimental Tools)    */}
            {/* --------------------------------------------------------------------- */}
            <details className="group rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm ring-1 ring-slate-900/5 backdrop-blur-md transition-all duration-200 dark:border-zinc-800/80 dark:bg-zinc-900/60 dark:ring-white/10 print:hidden">
              <summary className="flex cursor-pointer items-center justify-between text-base font-bold text-slate-800 dark:text-zinc-200 select-none list-none">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50 text-orange-600 dark:bg-zinc-800 dark:text-zinc-300">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-base font-bold text-slate-900 dark:text-white">
                      تحليلات إضافية وتجريبية (Advanced Analytics Drawer)
                    </span>
                    <p className="text-xs font-normal text-slate-500 dark:text-zinc-400 mt-0.5">
                      أدوات مساعدة: مواجهة المتصدرين (Duel)، خريطة المنافذ التفاعلية (2D)، وسجل الفواتير التقديرية
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 group-open:text-orange-600 dark:text-zinc-400 dark:group-open:text-orange-400">
                  <span className="hidden sm:inline">عرض / إخفاء</span>
                  <ChevronDown className="h-5 w-5 transition-transform duration-300 group-open:rotate-180" />
                </div>
              </summary>

              <div className="mt-6 space-y-6 border-t border-slate-100 pt-6 dark:border-zinc-800/80">
                {/* 1. Duel Card & 2D Interactive Map */}
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

                {/* 2. Invoices Ledger */}
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
