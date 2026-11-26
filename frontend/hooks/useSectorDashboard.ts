"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  BranchOption,
  CaravanRecord,
  InvoiceRecord,
  ItemMetric,
  ItemMode,
  ItemsSummary,
  PeriodComparisonResponse,
  ReportSummary,
  PrintSectionsConfig,
} from "@/types/reports";
import type { TrendPoint } from "@/components/reports/caravans/charts";
import type { OutletMetricStat } from "@/components/reports/caravans/BranchComparisonChart";
import {
  type ViewMode,
  type Granularity,
  type PresetId,
  type CompPresetId,
  type FacilityType,
} from "@/components/reports/caravans/CaravanFiltersToolbar";
import { SectorConfig, DEFAULT_SECTOR } from "@/config/sectorsConfig";

/* ------------------------------ Constants & Codes ------------------------------ */

export const CARAVAN_BRANCH_CODES = [
  "1003",
  "1004",
  "1005",
  "1006",
  "1007",
  "1008",
  "1010",
  "1015",
  "1018",
  "1027",
  "1030",
];

export const SHOP_BRANCH_CODES = ["1021", "1023", "1024", "1025", "1029"];

const MAX_BRANCHES_IN_CHART = 10;

/* ------------------------------ Types & Helpers ------------------------------ */

export interface ReportResponse {
  status: string;
  message?: string;
  records: CaravanRecord[];
  summary: ReportSummary;
  fromCache?: boolean;
  responseTimeMs?: number;
  meta?: {
    duration?: string;
    cached?: boolean;
    timestamp?: string;
  };
}

export interface LocalBranchStat {
  code: string;
  name: string;
  total: number;
  cash: number;
  visa: number;
  credit: number;
  cover: number;
}

export type ItemRow = {
  name: string;
  qty?: number;
  revenue?: number;
  [k: string]: any;
};
export type OutletRow = { name: string; [k: string]: any };

export const ymd = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const addDays = (d: Date, n: number): Date => {
  const next = new Date(d);
  next.setDate(next.getDate() + n);
  return next;
};

export const parseYmd = (s: string): Date => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export function presetRange(id: Exclude<PresetId, "custom">): {
  start: string;
  end: string;
} {
  const now = new Date();
  switch (id) {
    case "today":
      return { start: ymd(now), end: ymd(now) };
    case "yesterday": {
      const y = addDays(now, -1);
      return { start: ymd(y), end: ymd(y) };
    }
    case "month":
      return {
        start: ymd(new Date(now.getFullYear(), now.getMonth(), 1)),
        end: ymd(now),
      };
    case "quarter":
      return {
        start: ymd(
          new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1),
        ),
        end: ymd(now),
      };
    case "year":
      return { start: ymd(new Date(now.getFullYear(), 0, 1)), end: ymd(now) };
    default:
      return { start: ymd(now), end: ymd(now) };
  }
}

export function getInitialParamsFromUrl() {
  if (typeof window === "undefined") return null;
  try {
    const params = new URLSearchParams(window.location.search);
    const start = params.get("start");
    const end = params.get("end");
    const preset = params.get("preset") as PresetId | null;
    const granularity = params.get("granularity") as Granularity | null;
    const branches = params.get("branches");
    const facility = params.get("facility") as FacilityType | null;

    const validPresets: PresetId[] = [
      "today",
      "yesterday",
      "month",
      "quarter",
      "year",
      "custom",
    ];
    const validGranularities: Granularity[] = ["day", "month", "summary"];
    const validFacilities: FacilityType[] = ["all", "caravans", "shops"];

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const validStart = start && dateRegex.test(start) ? start : null;
    const validEnd = end && dateRegex.test(end) ? end : null;

    return {
      hasParams: window.location.search.length > 1,
      start: validStart,
      end: validEnd,
      preset: preset && validPresets.includes(preset) ? preset : null,
      granularity:
        granularity && validGranularities.includes(granularity)
          ? granularity
          : null,
      branches: branches
        ? branches
            .split(",")
            .map((b) => b.trim())
            .filter(Boolean)
        : null,
      facility:
        facility && validFacilities.includes(facility) ? facility : null,
    };
  } catch {
    return null;
  }
}

export function getComparisonPresetDates(id: Exclude<CompPresetId, "custom">): {
  startA: string;
  endA: string;
  startB: string;
  endB: string;
} {
  const now = new Date();
  if (id === "month_vs_last") {
    const startA = new Date(now.getFullYear(), now.getMonth(), 1);
    const endA = now;
    const startB = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endB = new Date(now.getFullYear(), now.getMonth(), 0);
    return {
      startA: ymd(startA),
      endA: ymd(endA),
      startB: ymd(startB),
      endB: ymd(endB),
    };
  } else if (id === "week_vs_last") {
    const endA = now;
    const startA = addDays(now, -6);
    const endB = addDays(startA, -1);
    const startB = addDays(endB, -6);
    return {
      startA: ymd(startA),
      endA: ymd(endA),
      startB: ymd(startB),
      endB: ymd(endB),
    };
  } else if (id === "quarter_vs_last") {
    const q = Math.floor(now.getMonth() / 3);
    const startA = new Date(now.getFullYear(), q * 3, 1);
    const endA = now;
    const startB = new Date(now.getFullYear(), (q - 1) * 3, 1);
    const endB = new Date(now.getFullYear(), q * 3, 0);
    return {
      startA: ymd(startA),
      endA: ymd(endA),
      startB: ymd(startB),
      endB: ymd(endB),
    };
  } else {
    // YoY: Current year vs Previous year
    const startA = new Date(now.getFullYear(), 0, 1);
    const endA = now;
    const startB = new Date(now.getFullYear() - 1, 0, 1);
    const endB = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    return {
      startA: ymd(startA),
      endA: ymd(endA),
      startB: ymd(startB),
      endB: ymd(endB),
    };
  }
}

export async function fetchReport(
  start: string,
  end: string,
  granularity: Granularity,
  branches: string[],
  signal: AbortSignal,
  sectorType: number = 4,
  refresh: boolean = false,
): Promise<ReportResponse> {
  const params = new URLSearchParams({
    startDate: start,
    endDate: end,
    granularity,
    sectorType: String(sectorType),
  });
  if (branches.length > 0) params.set("branches", branches.join(","));
  if (refresh) params.set("refresh", "1");

  const t0 =
    typeof performance !== "undefined" ? performance.now() : Date.now();
  const res = await fetch(`/api/caravans/report?${params.toString()}`, {
    signal,
  });
  const clientElapsed = Math.round(
    (typeof performance !== "undefined" ? performance.now() : Date.now()) - t0,
  );

  if (!res.ok) throw new Error(`خطأ في استجابة الخادم (${res.status})`);
  const json = (await res.json()) as ReportResponse;
  if (json.status !== "success")
    throw new Error(json.message || "فشل جلب بيانات التقرير");

  const headerCache = res.headers.get("X-Cache-Status");
  const headerTime = res.headers.get("X-Response-Time-Ms");

  const isHit = headerCache ? headerCache === "HIT" : Boolean(json.fromCache);
  const duration = headerTime
    ? Number(headerTime)
    : typeof json.meta?.duration === "string"
      ? parseInt(json.meta.duration, 10)
      : clientElapsed;

  json.fromCache = isHit;
  json.responseTimeMs = isNaN(duration) ? clientElapsed : duration;

  return json;
}

export function buildTrend(
  records: CaravanRecord[],
  groupByMonth = false,
): TrendPoint[] {
  const map = new Map<string, TrendPoint>();
  for (const r of records) {
    const rawKey = r.period ?? "";
    const key =
      groupByMonth && rawKey.length >= 7 ? rawKey.slice(0, 7) : rawKey;
    const p = map.get(key) ?? {
      label: key.length === 10 ? key.slice(5) : key,
      total: 0,
      cash: 0,
      visa: 0,
    };
    const cash = Number(r.cash) || 0;
    const visa = Number(r.visa) || 0;
    const cl = Number(r.creditLine ?? (r as any).cl) || 0;
    p.total += cash + visa + cl;
    p.cash += cash;
    p.visa += visa;
    map.set(key, p);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => v);
}

export function buildBranchStats(records: CaravanRecord[]): LocalBranchStat[] {
  const map = new Map<string, LocalBranchStat>();
  for (const r of records) {
    const key = String(r.branchCode);
    const s = map.get(key) ?? {
      code: key,
      name: r.name,
      total: 0,
      cash: 0,
      visa: 0,
      credit: 0,
      cover: 0,
    };
    const cash = Number(r.cash) || 0;
    const visa = Number(r.visa) || 0;
    const cl = Number(r.creditLine ?? (r as any).cl) || 0;
    s.total += cash + visa + cl;
    s.cash += cash;
    s.visa += visa;
    s.credit += cl;
    s.cover += Number(r.cover) || 0;
    map.set(key, s);
  }
  return Array.from(map.values()).sort((a, b) => b.total - a.total);
}

export function normalizeItemsSummary(raw: any) {
  const src = raw ?? {};
  const cap = src.capture ?? {};
  const kpi = src.kpis ?? {};
  const pick = (...c: any[]) => c.find((v) => v !== undefined && v !== null);
  const asArray = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
  const asNum = (v: unknown) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };
  return {
    guests: asNum(
      pick(src.guests, kpi.guests, cap.guests, src.visitors, src.visitorCount),
    ),
    spendPerGuest: asNum(
      pick(src.spendPerGuest, kpi.spendPerGuest, cap.spendPerGuest),
    ),
    topItems: asArray<ItemRow>(
      pick(src.topItems, src.top_items, src.topSellers),
    ),
    slowItems: asArray<ItemRow>(
      pick(src.slowItems, src.slow_items, src.worstItems),
    ),
    outlets: asArray<OutletRow>(pick(src.outlets, src.branches, src.caravans)),
    allOutlets: asArray<OutletRow>(pick(src.allOutlets, src.outlets)),
    duel: pick(src.duel, null),
    caravanRevenue: asNum(
      pick(src.caravanRevenue, kpi.caravanRevenue, cap.caravanRevenue),
    ),
    grossRevenue: asNum(
      pick(
        src.grossRevenue,
        kpi.grossRevenue,
        cap.grossRevenue,
        src.caravanRevenue,
        cap.caravanRevenue,
      ),
    ),
    gateTickets: asNum(pick(src.gateTickets, kpi.gateTickets, cap.gateTickets)),
    degraded: Boolean(src.degraded),
    blockStatus: src.blockStatus ?? {},
    errors: asArray<any>(src.errors),
  };
}

/* ------------------------------ Primary Unified Sector Hook ------------------------------ */

export function useSectorDashboard(sector: SectorConfig = DEFAULT_SECTOR) {
  const router = useRouter();

  // Authentication State
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [authUser, setAuthUser] = useState<string>("admin");

  useEffect(() => {
    try {
      const auth = localStorage.getItem("isAuthenticated");
      if (auth !== "true") {
        router.replace("/login");
      } else {
        const user = localStorage.getItem("authUser") || "admin";
        setAuthUser(user);
        setIsAuthorized(true);
      }
    } catch {
      router.replace("/login");
    }
  }, [router]);

  const handleSignOut = useCallback(() => {
    try {
      localStorage.removeItem("isAuthenticated");
      localStorage.removeItem("authUser");
      localStorage.removeItem("authRole");
      localStorage.removeItem("authTime");
    } catch (err) {
      console.error("Sign out error:", err);
    }
    router.replace("/login");
  }, [router]);

  const [viewMode, setViewMode] = useState<ViewMode>("standard");

  // Business Segmentation State: 'all' | 'caravans' | 'shops' (Caravans sector specific)
  const [facilityType, setFacilityType] = useState<FacilityType>("all");

  // Standard Report Date Filters
  const initial = useMemo(() => presetRange("yesterday"), []);
  const [preset, setPreset] = useState<PresetId>("yesterday");
  const [start, setStart] = useState(initial.start);
  const [end, setEnd] = useState(initial.end);
  const [granularity, setGranularity] = useState<Granularity>("day");
  const [isUrlInitialized, setIsUrlInitialized] = useState(false);

  // Period Comparison State
  const initialComp = useMemo(
    () => getComparisonPresetDates("month_vs_last"),
    [],
  );
  const [compPreset, setCompPreset] = useState<CompPresetId>("month_vs_last");
  const [compStartA, setCompStartA] = useState(initialComp.startA);
  const [compEndA, setCompEndA] = useState(initialComp.endA);
  const [compStartB, setCompStartB] = useState(initialComp.startB);
  const [compEndB, setCompEndB] = useState(initialComp.endB);
  const [comparisonData, setComparisonData] =
    useState<PeriodComparisonResponse | null>(null);
  const [comparisonLoading, setComparisonLoading] = useState(false);
  const [comparisonError, setComparisonError] = useState<string | null>(null);

  // Multi-Branch Selection
  const [branchOptions, setBranchOptions] = useState<BranchOption[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [barMetric, setBarMetric] = useState<"revenue" | "orders">("revenue");

  // Dynamically Filtered Branch Options based on Facility Type (if Caravans, otherwise full sector list)
  const filteredBranchOptions = useMemo<BranchOption[]>(() => {
    if (sector.type === 4) {
      if (facilityType === "caravans") {
        return branchOptions.filter((b) =>
          CARAVAN_BRANCH_CODES.includes(String(b.Code)),
        );
      }
      if (facilityType === "shops") {
        return branchOptions.filter((b) =>
          SHOP_BRANCH_CODES.includes(String(b.Code)),
        );
      }
    }
    return branchOptions;
  }, [sector.type, facilityType, branchOptions]);

  // Dynamic Effective Branches passed to API
  const effectiveBranches = useMemo<string[]>(() => {
    if (sector.type === 4) {
      if (facilityType === "caravans") {
        const subset = selected.filter((c) => CARAVAN_BRANCH_CODES.includes(c));
        return subset.length > 0 ? subset : CARAVAN_BRANCH_CODES;
      }
      if (facilityType === "shops") {
        const subset = selected.filter((c) => SHOP_BRANCH_CODES.includes(c));
        return subset.length > 0 ? subset : SHOP_BRANCH_CODES;
      }
    }
    return selected;
  }, [sector.type, facilityType, selected]);

  const effectiveSelectedKey = effectiveBranches.join(",");

  // Smart facility type switcher (Restricted strictly to Caravans Type = 4)
  const handleFacilityTypeChange = useCallback(
    (newType: FacilityType) => {
      if (sector.type !== 4) {
        setFacilityType("all");
        return;
      }
      setFacilityType(newType);
      setSelected((cur) => {
        if (newType === "caravans") {
          return cur.filter((c) => CARAVAN_BRANCH_CODES.includes(c));
        }
        if (newType === "shops") {
          return cur.filter((c) => SHOP_BRANCH_CODES.includes(c));
        }
        return cur;
      });
    },
    [sector.type],
  );

  // Operational Data State
  const [records, setRecords] = useState<CaravanRecord[]>([]);
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [branchStats, setBranchStats] = useState<LocalBranchStat[]>([]);
  const [itemsData, setItemsData] = useState<ItemsSummary | null>(null);
  const [guests, setGuests] = useState<number>(0);
  const [spendPerGuest, setSpendPerGuest] = useState<number>(0);
  const [topItems, setTopItems] = useState<any[]>([]);
  const [slowItems, setSlowItems] = useState<any[]>([]);
  const [outlets, setOutlets] = useState<any[]>([]);

  // Default to QUANTITY as required by revenue priorities
  const [itemMetric, setItemMetric] = useState<ItemMetric>("quantity");
  const [itemMode, setItemMode] = useState<ItemMode>("best");
  const [itemsLoading, setItemsLoading] = useState(false);
  const [itemsError, setItemsError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  // Cache & Response-Time Status
  const [fromCache, setFromCache] = useState<boolean | null>(null);
  const [responseTimeMs, setResponseTimeMs] = useState<number | null>(null);
  const forceRefreshRef = useRef(false);

  // Initialize filters from URL Search Params on mount (Step A - Zero Overwrite Guard)
  useEffect(() => {
    const urlParams = getInitialParamsFromUrl();
    if (urlParams && urlParams.hasParams) {
      if (urlParams.preset && urlParams.preset !== "custom") {
        const r = presetRange(urlParams.preset);
        const effectiveStart = urlParams.start || r.start;
        const effectiveEnd = urlParams.end || r.end;
        setStart(effectiveStart);
        setEnd(effectiveEnd);
        setPreset(urlParams.preset);
      } else if (urlParams.start && urlParams.end) {
        setStart(urlParams.start);
        setEnd(urlParams.end);
        setPreset("custom");
      }

      if (urlParams.granularity) {
        setGranularity(urlParams.granularity);
      }
      if (urlParams.branches && urlParams.branches.length > 0) {
        setSelected(urlParams.branches);
      }
      if (urlParams.facility && sector.type === 4) {
        setFacilityType(urlParams.facility);
      }
    } else {
      const y = presetRange("yesterday");
      setStart(y.start);
      setEnd(y.end);
      setPreset("yesterday");
    }
    setIsUrlInitialized(true);
  }, [sector.type]);

  // Sync active filters to Next.js URL Search Params (Step B - Only runs AFTER isUrlInitialized is true)
  useEffect(() => {
    if (!isUrlInitialized || typeof window === "undefined") return;

    const params = new URLSearchParams();
    if (preset) params.set("preset", preset);
    if (start) params.set("start", start);
    if (end) params.set("end", end);
    if (granularity && granularity !== "day")
      params.set("granularity", granularity);
    if (selected.length > 0) params.set("branches", selected.join(","));
    if (sector.type === 4 && facilityType !== "all")
      params.set("facility", facilityType);

    const queryString = params.toString();
    const currentQuery = window.location.search.replace(/^\?/, "");

    if (queryString !== currentQuery) {
      const newUrl = queryString
        ? `${window.location.pathname}?${queryString}`
        : window.location.pathname;
      window.history.replaceState(null, "", newUrl);
    }
  }, [
    isUrlInitialized,
    start,
    end,
    preset,
    granularity,
    selected,
    facilityType,
    sector.type,
  ]);

  // Support browser Back/Forward (popstate)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handlePopState = () => {
      const urlParams = getInitialParamsFromUrl();
      if (!urlParams) return;
      if (urlParams.preset && urlParams.preset !== "custom") {
        const r = presetRange(urlParams.preset);
        setStart(urlParams.start || r.start);
        setEnd(urlParams.end || r.end);
        setPreset(urlParams.preset);
      } else if (urlParams.start && urlParams.end) {
        setStart(urlParams.start);
        setEnd(urlParams.end);
        setPreset("custom");
      }
      if (urlParams.granularity) setGranularity(urlParams.granularity);
      if (urlParams.branches) setSelected(urlParams.branches);
      if (urlParams.facility && sector.type === 4)
        setFacilityType(urlParams.facility);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [sector.type]);

  // Print Configuration Modal State
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printConfig, setPrintConfig] = useState<PrintSectionsConfig>({
    kpis: true,
    charts: true,
    table: true,
    itemsPerformance: true,
    orientation: "landscape",
  });

  const isLoading = loading || itemsLoading;

  const handlePrint = useCallback(() => {
    if (isLoading) return;
    document.body.classList.add("print-landscape-mode");
    setPrintModalOpen(false);
    setTimeout(() => {
      window.print();
    }, 200);
  }, [isLoading]);

  // Derivative invoices data for experimental ledger
  const invoicesData: InvoiceRecord[] = useMemo(() => {
    if (!records || records.length === 0) return [];
    return records
      .filter((r) => r.total > 0 || (r.totalVoids || 0) > 0)
      .map((r, i) => ({
        id: `INV-${r.branchCode}-${1000 + i}`,
        docNo: `${1000 + i}`,
        docDate: end || ymd(new Date()),
        docTime: "14:30",
        branchCode: r.branchCode,
        branchName: r.name,
        cashierName: `كاشير ${r.branchCode}`,
        paymentMethod:
          Number(r.cash) > 0 && Number(r.visa) > 0
            ? "مختلط"
            : Number(r.visa) > 0
              ? "فيزا"
              : "نقدي",
        subtotal: r.netRevenue || r.total,
        tax: r.salesTax || 0,
        service: r.serviceCharge || 0,
        total: r.total,
        totalVoids: r.totalVoids || 0,
        voidDetails: r.voidDetails,
      }));
  }, [records, end]);

  const resetStaleData = useCallback(() => {
    setError(null);
    setItemsError(null);
    setSummary(null);
    setRecords([]);
    setTrend([]);
    setBranchStats([]);
    setTopItems([]);
    setSlowItems([]);
    setItemsData(null);
    setGuests(0);
    setSpendPerGuest(0);
  }, []);

  // Reset selection, facilityType, and branch options ONLY when sector changes (not on every date change)
  useEffect(() => {
    setSelected([]);
    setFacilityType("all");
    setBranchOptions([]);
    resetStaleData();

    if (sector.type === 2 || sector.type === 3) return;

    let active = true;
    fetch(`/api/caravans/branches?sectorType=${sector.type}`)
      .then((r) => r.json())
      .then((j: { status: string; branches?: BranchOption[] }) => {
        if (active && j.status === "success" && Array.isArray(j.branches)) {
          setBranchOptions(j.branches);
        }
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, [sector.type, resetStaleData]);

  const applyPreset = useCallback(
    (id: Exclude<PresetId, "custom">) => {
      setError(null);
      setItemsError(null);
      resetStaleData();
      const r = presetRange(id);
      setPreset(id);
      setStart(r.start);
      setEnd(r.end);
      setRefreshTick((t) => t + 1);
    },
    [resetStaleData],
  );

  const applyCompPreset = useCallback((id: Exclude<CompPresetId, "custom">) => {
    const dates = getComparisonPresetDates(id);
    setCompPreset(id);
    setCompStartA(dates.startA);
    setCompEndA(dates.endA);
    setCompStartB(dates.startB);
    setCompEndB(dates.endB);
  }, []);

  // Standard report data loader (Table records & Trends)
  const load = useCallback(async () => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    setError(null);

    const isForce = forceRefreshRef.current;
    forceRefreshRef.current = false;

    try {
      const s = parseYmd(start);
      const e = parseYmd(end);
      const days = Math.max(
        1,
        Math.round((e.getTime() - s.getTime()) / 86_400_000) + 1,
      );
      const trendGran: Granularity = days > 92 ? "month" : "day";
      const branches = effectiveSelectedKey
        ? effectiveSelectedKey.split(",")
        : [];

      const isItemSector = sector.type === 2 || sector.type === 3;
      const canDeriveLocally = isItemSector && granularity === "day";

      const [main, totals, trendRes] = await Promise.all([
        fetchReport(
          start,
          end,
          granularity,
          branches,
          ctrl.signal,
          sector.type,
          isForce,
        ),
        granularity === "summary" || canDeriveLocally
          ? Promise.resolve(null)
          : fetchReport(
              start,
              end,
              "summary",
              branches,
              ctrl.signal,
              sector.type,
              isForce,
            ),
        canDeriveLocally
          ? Promise.resolve(null)
          : fetchReport(
              start,
              end,
              trendGran,
              branches,
              ctrl.signal,
              sector.type,
              isForce,
            ),
      ]);

      setRecords(main.records);
      setFromCache(main.fromCache ?? null);
      setResponseTimeMs(main.responseTimeMs ?? null);
      if (isItemSector) {
        if (
          selected.length === 0 &&
          Array.isArray(main.records) &&
          main.records.length > 0
        ) {
          const gameMap = new Map<string, string>();
          main.records.forEach((r) => {
            if (r.branchCode && !gameMap.has(String(r.branchCode))) {
              gameMap.set(
                String(r.branchCode),
                r.name || `لعبة ${r.branchCode}`,
              );
            }
          });
          const gameOptions: BranchOption[] = Array.from(gameMap.entries())
            .map(([Code, Name]) => ({ Code, Name }))
            .sort((a, b) => a.Name.localeCompare(b.Name));
          if (gameOptions.length > 0) {
            setBranchOptions(gameOptions);
          }
        }
      }
      const effectiveTotals = totals ?? main;
      setSummary(effectiveTotals.summary);
      setTrend(
        trendRes
          ? buildTrend(trendRes.records)
          : buildTrend(main.records, trendGran === "month"),
      );
      setBranchStats(buildBranchStats(effectiveTotals.records));
      setUpdatedAt(new Date());
    } catch (err) {
      if (
        ctrl.signal.aborted ||
        (err as any)?.name === "AbortError" ||
        (err as any)?.code === 20 ||
        (err as any)?.message?.toLowerCase().includes("abort")
      ) {
        return;
      }
      if (abortRef.current === ctrl) {
        setError((err as Error).message || "تعذر الاتصال بخادم التقارير");
      }
    } finally {
      if (abortRef.current === ctrl) setLoading(false);
    }
  }, [start, end, granularity, effectiveSelectedKey, sector.type]);

  // STEP C: Data Fetch - Wait until isUrlInitialized is true
  useEffect(() => {
    if (!isUrlInitialized) return;
    void load();
    return () => abortRef.current?.abort();
  }, [isUrlInitialized, load, refreshTick]);

  // Operational items & outlets summary
  useEffect(() => {
    if (!isUrlInitialized) return;
    const ctrl = new AbortController();
    setItemsLoading(true);
    setItemsError(null);
    const params = new URLSearchParams({
      startDate: start,
      endDate: end,
      metricType: itemMetric,
      mode: itemMode,
      sectorType: String(sector.type),
    });
    if (effectiveSelectedKey) params.set("branchCode", effectiveSelectedKey);

    fetch(`/api/reports/caravans/items-summary?${params.toString()}`, {
      signal: ctrl.signal,
    })
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(
            `خطأ في استجابة الخادم (${res.status}): ${text.slice(0, 80)}`,
          );
        }
        const json = await res.json();
        const data = normalizeItemsSummary(json);

        setGuests(data.guests);
        setSpendPerGuest(data.spendPerGuest);
        setTopItems(data.topItems);
        setSlowItems(data.slowItems);
        setOutlets(data.outlets);

        const payload: ItemsSummary = {
          ...json,
          status: "success",
          topItems: data.topItems,
          slowItems: data.slowItems,
          outlets: data.outlets,
          allOutlets: data.allOutlets,
          duel: data.duel,
          guests: data.guests,
          spendPerGuest: data.spendPerGuest,
          capture: {
            caravanRevenue: data.caravanRevenue,
            grossRevenue: data.grossRevenue,
            gateTickets: data.gateTickets,
            guests: data.guests,
            spendPerGuest: data.spendPerGuest,
            visitDivisor: Number(json.capture?.visitDivisor ?? 6) || 6,
            gateBranchCodes: Array.isArray(json.capture?.gateBranchCodes)
              ? json.capture.gateBranchCodes
              : [],
          },
        };
        setItemsData(payload);
      })
      .catch((err: Error) => {
        if (
          ctrl.signal.aborted ||
          err?.name === "AbortError" ||
          (err as any)?.code === 20 ||
          err?.message?.toLowerCase().includes("abort")
        ) {
          return;
        }
        setItemsError(err.message || "تحليلات الأصناف غير متوفرة");
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setItemsLoading(false);
      });

    return () => ctrl.abort();
  }, [
    isUrlInitialized,
    start,
    end,
    effectiveSelectedKey,
    itemMetric,
    itemMode,
    refreshTick,
    sector.type,
  ]);

  // Period-over-Period comparison loader
  const loadComparison = useCallback(async () => {
    setComparisonLoading(true);
    setComparisonError(null);
    try {
      const params = new URLSearchParams({
        periodAStart: compStartA,
        periodAEnd: compEndA,
        periodBStart: compStartB,
        periodBEnd: compEndB,
        sectorType: String(sector.type),
      });
      if (effectiveSelectedKey) params.set("branchCode", effectiveSelectedKey);

      const res = await fetch(
        `/api/reports/caravans/comparison?${params.toString()}`,
      );
      if (!res.ok) {
        const text = await res.text();
        throw new Error(
          `خطأ في استجابة الخادم (${res.status}): ${text.slice(0, 80)}`,
        );
      }
      const json = (await res.json()) as PeriodComparisonResponse;
      if (json.status !== "success")
        throw new Error(json.message || "فشل جلب بيانات المقارنة");
      setComparisonData(json);
    } catch (err) {
      setComparisonError(
        (err as Error).message || "تعذر تحميل المقارنة التحليلية",
      );
    } finally {
      setComparisonLoading(false);
    }
  }, [
    compStartA,
    compEndA,
    compStartB,
    compEndB,
    effectiveSelectedKey,
    sector.type,
  ]);

  useEffect(() => {
    if (viewMode === "comparison") {
      void loadComparison();
    }
  }, [viewMode, loadComparison, refreshTick]);

  // Map click toggle: single branch filter (click again to clear)
  const selectFromMap = useCallback((code: string) => {
    setSelected((cur) => (cur.length === 1 && cur[0] === code ? [] : [code]));
  }, []);

  // Dynamic scope label incorporating sector and selection
  const topScopeLabel = useMemo(() => {
    if (sector.type === 4) {
      const facilityLabel =
        facilityType === "caravans"
          ? "قطاع الكرفانات"
          : facilityType === "shops"
            ? "قطاع المحلات"
            : "القطاع الكامل (كرفانات ومحلات)";

      if (selected.length === 0) {
        return facilityType === "all"
          ? "عبر جميع كرفانات ومحلات الحديقة (القطاع الكامل)"
          : `عبر جميع منافذ ${facilityLabel}`;
      }
      if (selected.length === 1) {
        const match = branchOptions.find((o) => String(o.Code) === selected[0]);
        return `منفذ محدد (${facilityLabel}): ${match?.Name ?? selected[0]}`;
      }
      return `${selected.length} منافذ محددة (${facilityLabel}): ${selected
        .map((c) => branchOptions.find((o) => String(o.Code) === c)?.Name ?? c)
        .slice(0, 3)
        .join("، ")}${selected.length > 3 ? "..." : ""}`;
    }

    if (selected.length === 0) {
      return `عبر جميع منافذ ${sector.label} (${branchOptions.length} منفذ)`;
    }
    if (selected.length === 1) {
      const match = branchOptions.find((o) => String(o.Code) === selected[0]);
      return `منفذ محدد (${sector.label}): ${match?.Name ?? selected[0]}`;
    }
    return `${selected.length} منافذ محددة (${sector.label}): ${selected
      .map((c) => branchOptions.find((o) => String(o.Code) === c)?.Name ?? c)
      .slice(0, 3)
      .join("، ")}${selected.length > 3 ? "..." : ""}`;
  }, [sector.type, sector.label, facilityType, selected, branchOptions]);

  const exportExcel = useCallback(() => {
    const params = new URLSearchParams({
      startDate: start,
      endDate: end,
      granularity,
      sectorType: String(sector.type),
    });
    if (effectiveBranches.length > 0)
      params.set("branches", effectiveBranches.join(","));
    window.location.href = `/api/caravans/export?${params.toString()}`;
  }, [start, end, granularity, effectiveBranches, sector.type]);

  const comparisonStats = useMemo<OutletMetricStat[]>(() => {
    if (branchStats.length > 0) {
      return branchStats.map((s) => ({
        code: s.code,
        name: s.name,
        revenue: s.total,
        orders: s.cover,
        avgTicket: s.cover > 0 ? s.total / s.cover : 0,
      }));
    }
    const list = outlets.length > 0 ? outlets : (itemsData?.outlets ?? []);
    if (list.length > 0) {
      return list.map((o: any) => ({
        code: String(o.branchCode || o.code),
        name: String(o.name || o.branchCode || ""),
        revenue: Number(o.revenue) || 0,
        orders: Number(o.orders) || 0,
        avgTicket:
          Number(o.avgTicket) ||
          (Number(o.orders) > 0 ? Number(o.revenue) / Number(o.orders) : 0),
      }));
    }
    return [];
  }, [branchStats, outlets, itemsData]);

  const triggerRefresh = useCallback((force: boolean = true) => {
    forceRefreshRef.current = force;
    setRefreshTick((t) => t + 1);
  }, []);

  return {
    sector,

    // Cache & Response-Time Status
    fromCache,
    responseTimeMs,

    // Auth
    isAuthorized,
    authUser,
    handleSignOut,

    // Modes & Toggles
    viewMode,
    setViewMode,
    facilityType,
    setFacilityType: handleFacilityTypeChange,
    barMetric,
    setBarMetric,
    itemMetric,
    setItemMetric,
    itemMode,
    setItemMode,

    // Branches & Segmentation
    branchOptions,
    filteredBranchOptions,
    rawBranchOptions: branchOptions,
    selected,
    setSelected,
    effectiveBranches,
    selectFromMap,
    topScopeLabel,

    // Standard Filters
    start,
    setStart,
    end,
    setEnd,
    preset,
    setPreset,
    granularity,
    setGranularity,
    applyPreset,
    resetStaleData,

    // Comparison Filters & State
    compPreset,
    setCompPreset,
    compStartA,
    setCompStartA,
    compEndA,
    setCompEndA,
    compStartB,
    setCompStartB,
    compEndB,
    setCompEndB,
    applyCompPreset,
    comparisonData,
    setComparisonData,
    comparisonLoading,
    comparisonError,

    // Operational Data
    records,
    summary,
    trend,
    branchStats,
    itemsData,
    guests,
    spendPerGuest,
    topItems,
    slowItems,
    outlets,
    comparisonStats,
    invoicesData,

    // Status & Lifecycles
    loading,
    error,
    itemsLoading,
    itemsError,
    isLoading,
    isUrlInitialized,
    updatedAt,
    refreshTick,
    triggerRefresh,

    // Export & Print
    exportExcel,
    printModalOpen,
    setPrintModalOpen,
    printConfig,
    setPrintConfig,
    handlePrint,
  };
}

export default useSectorDashboard;
