/**
 * @file types/reports.ts
 * @description TypeScript Definitions for Dream Park Enterprise Financial Reports.
 */

export interface CaravanRecord {
  branchCode: string;
  name: string;
  period?: string | null;
  cover: number;
  cash: number;
  visa: number;
  creditLine: number;
  total: number;
  marketShare: number;
  avgTicket: number;
  netRevenue?: number;
  serviceCharge?: number;
  salesTax?: number;
  grandTotal?: number;
  totalCollected?: number;
  totalVoids?: number;
  voidCount?: number;
  variance?: number;
}

export interface PriceTier {
  price: number;
  quantity: number;
  total: number;
}

export interface ItemPerformanceRecord {
  itemCode: string;
  itemName: string;
  quantity: number;
  totalQuantity?: number;
  netRevenue: number;
  totalNetRevenue?: number;
  prevQuantity: number;
  prevNetRevenue: number;
  growthPct: number | null;
  avgPrice: number;
  minPrice?: number;
  maxPrice?: number;
  hasPriceChange?: boolean;
  weightedAvgPrice?: number | null;
  unitPrice?: number;
  stableUnitPrice?: number | null;
  priceTiers?: PriceTier[];
  prevPriceTiers?: PriceTier[];
  abcCategory?: 'A' | 'B' | 'C';
}

export interface AbcSummary {
  categoryACount: number;
  categoryBCount: number;
  categoryCCount: number;
  categoryARevenue: number;
  categoryBRevenue: number;
  categoryCRevenue: number;
  activeCategory?: 'A' | 'B' | 'C' | null;
}

export interface ItemsPerformanceResponse {
  status: string;
  message?: string;
  executionTimeMs: number;
  filters: {
    startDate: string;
    endDate: string;
    prevStartDate?: string;
    prevEndDate?: string;
    branchCodes: string[];
    search?: string;
    sortBy?: string;
    sortOrder?: string;
    abcCategory?: 'A' | 'B' | 'C' | null;
  };
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  summary: {
    totalItems: number;
    totalQuantity: number;
    totalRevenue: number;
    prevQuantity: number;
    prevRevenue: number;
    revenueGrowthPct: number | null;
    abcSummary?: AbcSummary;
  };
  items: ItemPerformanceRecord[];
}

export interface PrintSectionsConfig {
  kpis: boolean;
  charts: boolean;
  table: boolean;
  peakHours?: boolean;
  itemsPerformance: boolean;
  orientation: 'auto' | 'landscape' | 'portrait';
}

export interface ReportSummary {
  totalSales: number;
  totalCash: number;
  totalVisa: number;
  totalCL: number;
  totalCover: number;
  cashPct: number;
  visaPct: number;
  clPct: number;
  avgTicket: number;
  rowCount: number;
  topCaravan?: {
    name: string;
    total: number;
    cover: number;
  } | null;
}

export interface BranchOption {
  Code: string;
  Name: string;
}

export interface ReportFilters {
  startDate: string;
  endDate: string;
  granularity: 'summary' | 'month' | 'day';
  selectedBranches: string[];
}


export type ItemMetric = 'revenue' | 'quantity';
export type ItemMode = 'best' | 'slow';

export interface TopItem {
  itemCode: string | number;
  itemName: string;
  qty: number;
  revenue: number;
  share: number;
}

export interface OutletSignature {
  itemName: string;
  qty: number;
  revenue: number;
}

export interface OutletStat {
  branchCode: string;
  name: string;
  revenue: number;
  orders: number;
  avgTicket: number;
  signature: OutletSignature | null;
}

export interface DuelSide extends OutletStat {
  share: number;
}

export interface CaptureStats {
  caravanRevenue: number;
  grossRevenue: number;
  gateTickets: number;
  guests: number;
  spendPerGuest: number;
  visitDivisor: number;
  gateBranchCodes: string[];
}

export interface HourlyTrafficPoint {
  hour: number;
  label: string;
  orders: number;
  revenue: number;
  gateTickets?: number;
  guests?: number;
  sharePct: number;
  isPeak: boolean;
  isGatePeak?: boolean;
}

export interface HourlyTrafficSummary {
  peakHour: number | null;
  peakHourLabel: string | null;
  peakRevenue: number;
  peakOrders: number;
  peakGateHour?: number | null;
  peakGateHourLabel?: string | null;
  peakGateTickets?: number;
  peakGuests?: number;
  totalHourlyRevenue: number;
  totalHourlyOrders: number;
  totalGateTickets?: number;
  recommendedStaffingWindow: string;
  points: HourlyTrafficPoint[];
}

export interface ItemsSummary {
  status: string;
  message?: string;
  topItems: TopItem[];
  slowItems?: TopItem[];
  duel: { a: DuelSide; b: DuelSide } | null;
  outlets: OutletStat[];
  allOutlets?: OutletStat[];
  capture: CaptureStats;
  hourlyTraffic?: HourlyTrafficSummary;
}

export interface PeriodMetrics {
  startDate: string;
  endDate: string;
  revenue: number;
  cash: number;
  visa: number;
  cl: number;
  orders: number;
  avgTicket: number;
}

export interface PeriodItemPricing {
  rank: number | null;
  qty: number;
  revenue: number;
  minPrice?: number;
  maxPrice?: number;
  hasPriceChange?: boolean;
  unitPrice?: number;
  weightedAvgPrice?: number | null;
  priceTiers?: PriceTier[];
}

export interface ItemShift {
  itemCode: string;
  itemName: string;
  periodA: PeriodItemPricing;
  periodB: PeriodItemPricing;
  revenueDelta: number;
  revenueGrowthPct: number;
  qtyDelta: number;
  qtyGrowthPct: number;
  status: 'new' | 'dropped' | 'up' | 'down' | 'same';
}

export interface OutletComparisonItem {
  branchCode: string;
  name: string;
  revenueA: number;
  revenueB: number;
  revenueGrowthPct: number;
  ordersA: number;
  ordersB: number;
  ordersGrowthPct: number;
  avgTicketA: number;
  avgTicketB: number;
}

export interface PeriodComparisonResponse {
  status: string;
  message?: string;
  executionTimeMs: number;
  filters: {
    periodA: { startDate: string; endDate: string };
    periodB: { startDate: string; endDate: string };
    branchCodes: string[];
  };
  summary: {
    periodA: PeriodMetrics;
    periodB: PeriodMetrics;
    growth: {
      revenueGrowthPct: number;
      revenueDelta: number;
      ordersGrowthPct: number;
      ordersDelta: number;
      aovGrowthPct: number;
      aovDelta: number;
      cashGrowthPct: number;
      visaGrowthPct: number;
    };
  };
  topItemsShift: ItemShift[];
  outletsComparison: OutletComparisonItem[];
}

export interface ExecutiveKpiMetric {
  current: number;
  previous: number;
  delta?: number;
  growthPct: number | null;
  sharePct?: number;
}

export interface ExecutiveKpis {
  revenue: ExecutiveKpiMetric;
  subtotal?: ExecutiveKpiMetric;
  cash: ExecutiveKpiMetric;
  visa: ExecutiveKpiMetric;
  taxesServices?: ExecutiveKpiMetric;
  selsTax?: ExecutiveKpiMetric;
  discount?: ExecutiveKpiMetric;
  orders: ExecutiveKpiMetric;
  aov: ExecutiveKpiMetric;
}

export interface ExecutiveKpisResponse {
  status: 'success' | 'error';
  executionTimeMs: number;
  message?: string;
  filters: {
    startDate: string;
    endDate: string;
    prevStartDate: string;
    prevEndDate: string;
    branchCodes: string[];
    isScoped: boolean;
  };
  benchmark?: {
    isTargetRange: boolean;
    passed: boolean;
    targets: {
      totalChecks: number;
      caravansSpecificTax: number;
      netSubtotal: number;
      taxesServices: number;
      grandTotal: number;
    };
  };
  kpis: ExecutiveKpis;
}
