import { useMemo } from 'react';
import type { CaravanRecord } from '@/types/reports';
import {
  type MatrixRowItem,
  type MatrixColumn,
  type MatrixRowData,
  type CalcMode,
  type RideStatusFilter,
  type RestaurantBranchRow,
  type OthColumnDef,
  CARAVAN_DISPLAY_NAMES,
  VGAMES_DISPLAY_NAMES,
  VGAMES_SECTOR_ORDER,
  PAID_RIDES_DISPLAY_NAMES,
  PAID_RIDES_SECTOR_ORDER,
  PAID_RIDES_INACTIVE_CODES,
  CARAVAN_SECTOR_ORDER,
  RESTAURANT_DISPLAY_NAMES,
  OTH_SECTOR_COLUMNS,
} from './matrixConstants';

export interface UseMatrixAggregationParams {
  rows?: (CaravanRecord | MatrixRowItem)[];
  sectorType?: number;
  effectiveRideStatusFilter?: RideStatusFilter;
  calcMode?: CalcMode;
  sortOrder?: 'asc' | 'desc';
  granularity?: 'summary' | 'month' | 'day' | 'total';
}

export function useMatrixAggregation({
  rows = [],
  sectorType = 4,
  effectiveRideStatusFilter = 'all',
  calcMode = 'total',
  sortOrder = 'asc',
  granularity,
}: UseMatrixAggregationParams) {
  const isRestaurants = sectorType === 1;

  // 1. Effective Granularity
  const effectiveGranularity = useMemo<'summary' | 'month' | 'day'>(() => {
    if (granularity === 'total') return 'summary';
    if (granularity === 'summary' || granularity === 'month' || granularity === 'day') return granularity;
    const sample = rows[0];
    if (!sample || !('period' in sample) || !sample.period) return 'summary';
    if (String(sample.period).length === 7) return 'month';
    return 'day';
  }, [granularity, rows]);

  // 2. Dedicated F&B Processor for Restaurants (sectorType === 1)
  const restaurantData = useMemo(() => {
    if (sectorType !== 1) return null;

    const applyMode = (val: number) => {
      if (calcMode === 'net') return val / 1.14;
      if (calcMode === 'vat') return val - val / 1.14;
      return val;
    };

    let rawTotalFood = 0;
    let rawTotalBeverage = 0;
    let rawTotalOther = 0;
    let rawTotalSales = 0;
    let rawTotalCash = 0;
    let rawTotalVisa = 0;
    let rawTotalCL = 0;

    const branchSummaryMap = new Map<string, {
      branchCode: string;
      name: string;
      food: number;
      beverage: number;
      other: number;
      total: number;
      cash: number;
      visa: number;
      cl: number;
    }>();

    const monthMap = new Map<string, {
      period: string;
      branches: Map<string, {
        branchCode: string;
        name: string;
        food: number;
        beverage: number;
        other: number;
        total: number;
        cash: number;
        visa: number;
        cl: number;
      }>;
    }>();

    const dayMap = new Map<string, {
      date: string;
      branches: Map<string, {
        branchCode: string;
        name: string;
        food: number;
        beverage: number;
        other: number;
        total: number;
        cash: number;
        visa: number;
        cl: number;
      }>;
    }>();

    rows.forEach((r) => {
      const rawPeriod = ('period' in r && r.period ? r.period : ('date' in r && r.date ? r.date : '')).trim();
      const branchCode = String(r.branchCode || '').trim();
      const branchName = r.name || `منفذ ${branchCode}`;
      const food = Number((r as any).food) || 0;
      const beverage = Number((r as any).beverage) || 0;
      const other = Number((r as any).other) || 0;
      const cash = Number(r.cash) || 0;
      const visa = Number(r.visa) || 0;
      const cl = Number(r.creditLine ?? (r as any).cl) || 0;
      const rawTotal = Number(r.total) || 0;
      const total = Math.abs(cash + visa + cl) > 0.0001 ? (cash + visa + cl) : rawTotal;

      rawTotalFood += food;
      rawTotalBeverage += beverage;
      rawTotalOther += other;
      rawTotalSales += total;
      rawTotalCash += cash;
      rawTotalVisa += visa;
      rawTotalCL += cl;

      // Summary
      if (!branchSummaryMap.has(branchCode)) {
        branchSummaryMap.set(branchCode, {
          branchCode,
          name: branchName,
          food: 0,
          beverage: 0,
          other: 0,
          total: 0,
          cash: 0,
          visa: 0,
          cl: 0,
        });
      }
      const bs = branchSummaryMap.get(branchCode)!;
      bs.food += food;
      bs.beverage += beverage;
      bs.other += other;
      bs.total += total;
      bs.cash += cash;
      bs.visa += visa;
      bs.cl += cl;

      // Month
      const monthKey = rawPeriod.length >= 7 ? rawPeriod.slice(0, 7) : 'غير محدد';
      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, { period: monthKey, branches: new Map() });
      }
      const mEntry = monthMap.get(monthKey)!;
      if (!mEntry.branches.has(branchCode)) {
        mEntry.branches.set(branchCode, {
          branchCode,
          name: branchName,
          food: 0,
          beverage: 0,
          other: 0,
          total: 0,
          cash: 0,
          visa: 0,
          cl: 0,
        });
      }
      const mb = mEntry.branches.get(branchCode)!;
      mb.food += food;
      mb.beverage += beverage;
      mb.other += other;
      mb.total += total;
      mb.cash += cash;
      mb.visa += visa;
      mb.cl += cl;

      // Day
      const dayKey = rawPeriod || 'غير محدد';
      if (!dayMap.has(dayKey)) {
        dayMap.set(dayKey, { date: dayKey, branches: new Map() });
      }
      const dEntry = dayMap.get(dayKey)!;
      if (!dEntry.branches.has(branchCode)) {
        dEntry.branches.set(branchCode, {
          branchCode,
          name: branchName,
          food: 0,
          beverage: 0,
          other: 0,
          total: 0,
          cash: 0,
          visa: 0,
          cl: 0,
        });
      }
      const db = dEntry.branches.get(branchCode)!;
      db.food += food;
      db.beverage += beverage;
      db.other += other;
      db.total += total;
      db.cash += cash;
      db.visa += visa;
      db.cl += cl;
    });

    const summaryBranches: RestaurantBranchRow[] = Array.from(branchSummaryMap.values())
      .map((b) => ({
        branchCode: b.branchCode,
        name: b.name,
        displayName: RESTAURANT_DISPLAY_NAMES[b.branchCode] || b.name,
        food: applyMode(b.food),
        beverage: applyMode(b.beverage),
        other: applyMode(b.other),
        total: applyMode(b.total),
        cash: applyMode(b.cash),
        visa: applyMode(b.visa),
        cl: applyMode(b.cl),
      }))
      .sort((a, b) => b.total - a.total);

    const monthGroups = Array.from(monthMap.entries())
      .map(([monthKey, m]) => {
        const bList: RestaurantBranchRow[] = Array.from(m.branches.values())
          .map((b) => ({
            branchCode: b.branchCode,
            name: b.name,
            displayName: RESTAURANT_DISPLAY_NAMES[b.branchCode] || b.name,
            food: applyMode(b.food),
            beverage: applyMode(b.beverage),
            other: applyMode(b.other),
            total: applyMode(b.total),
            cash: applyMode(b.cash),
            visa: applyMode(b.visa),
            cl: applyMode(b.cl),
          }))
          .sort((a, b) => b.total - a.total);

        return {
          monthKey,
          monthLabel: monthKey,
          food: bList.reduce((s, b) => s + b.food, 0),
          beverage: bList.reduce((s, b) => s + b.beverage, 0),
          other: bList.reduce((s, b) => s + b.other, 0),
          total: bList.reduce((s, b) => s + b.total, 0),
          cash: bList.reduce((s, b) => s + b.cash, 0),
          visa: bList.reduce((s, b) => s + b.visa, 0),
          cl: bList.reduce((s, b) => s + b.cl, 0),
          branches: bList,
        };
      })
      .sort((a, b) => {
        const cmp = a.monthKey.localeCompare(b.monthKey);
        return sortOrder === 'asc' ? cmp : -cmp;
      });

    const dayGroups = Array.from(dayMap.entries())
      .map(([dateKey, d]) => {
        const bList: RestaurantBranchRow[] = Array.from(d.branches.values())
          .map((b) => ({
            branchCode: b.branchCode,
            name: b.name,
            displayName: RESTAURANT_DISPLAY_NAMES[b.branchCode] || b.name,
            food: applyMode(b.food),
            beverage: applyMode(b.beverage),
            other: applyMode(b.other),
            total: applyMode(b.total),
            cash: applyMode(b.cash),
            visa: applyMode(b.visa),
            cl: applyMode(b.cl),
          }))
          .sort((a, b) => b.total - a.total);

        return {
          date: dateKey,
          food: bList.reduce((s, b) => s + b.food, 0),
          beverage: bList.reduce((s, b) => s + b.beverage, 0),
          other: bList.reduce((s, b) => s + b.other, 0),
          total: bList.reduce((s, b) => s + b.total, 0),
          cash: bList.reduce((s, b) => s + b.cash, 0),
          visa: bList.reduce((s, b) => s + b.visa, 0),
          cl: bList.reduce((s, b) => s + b.cl, 0),
          branches: bList,
        };
      })
      .sort((a, b) => {
        const cmp = a.date.localeCompare(b.date);
        return sortOrder === 'asc' ? cmp : -cmp;
      });

    return {
      grandFood: applyMode(rawTotalFood),
      grandBeverage: applyMode(rawTotalBeverage),
      grandOther: applyMode(rawTotalOther),
      grandTotal: applyMode(rawTotalSales),
      grandCash: applyMode(rawTotalCash),
      grandVisa: applyMode(rawTotalVisa),
      grandCL: applyMode(rawTotalCL),
      summaryBranches,
      monthGroups,
      dayGroups,
    };
  }, [rows, sectorType, calcMode, sortOrder]);

  // 3. Stage 1: Raw Pivot & Grouping
  const aggregatedData = useMemo(() => {
    if (sectorType === 5) {
      return {
        cols: [] as MatrixColumn[],
        dateMap: new Map<string, Map<string, { cash: number; visa: number; cl: number; rawTotal: number }>>(),
        datePaymentMap: new Map<string, { cash: number; visa: number; cl: number; total: number; cashVisa: number }>(),
        dateFbMap: new Map<string, { food: number; beverage: number; other: number; cost: number }>(),
        rawDates: (rows as any[]).map((r) => r.date || r.period),
      };
    }

    const colMap = new Map<string, string>();
    const branchTotals = new Map<string, number>();
    const dateMap = new Map<
      string,
      Map<string, { cash: number; visa: number; cl: number; rawTotal: number }>
    >();
    const datePaymentMap = new Map<
      string,
      { cash: number; visa: number; cl: number; total: number; cashVisa: number }
    >();
    const dateFbMap = new Map<
      string,
      { food: number; beverage: number; other: number; cost: number }
    >();

    rows.forEach((r) => {
      const rawDate = 'date' in r && r.date ? r.date : r.period;
      const dateKey = (rawDate || 'غير محدد').trim();
      let branchKey = String(r.branchCode || '').trim();
      let branchName =
        sectorType === 3
          ? VGAMES_DISPLAY_NAMES[branchKey] || r.name || `لعبة ${branchKey}`
          : sectorType === 2
            ? PAID_RIDES_DISPLAY_NAMES[branchKey] || r.name || `لعبة ${branchKey}`
            : CARAVAN_DISPLAY_NAMES[branchKey] || r.name || `منفذ ${branchKey}`;

      if (sectorType === 6) {
        const bCode = branchKey.toLowerCase();
        const bName = String(r.name || '').trim().toLowerCase();
        const normAr = bName.replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه');

        if (OTH_SECTOR_COLUMNS.some((c) => c.id === bCode) || bCode === 'unmapped') {
          branchKey = bCode;
        } else if (bCode === '120' || normAr.includes('ملاكي') || normAr.includes('تاكس') || (bName.includes('parking') && !bName.includes('bus') && !normAr.includes('باص'))) {
          branchKey = 'parking_private';
        } else if (bName.includes('buses') || normAr.includes('باص') || normAr.includes('اتوبيس') || normAr.includes('ميكروباص')) {
          branchKey = 'parking_buses';
        } else if (bCode.includes('mask') || bName.includes('mask') || normAr.includes('ماسك') || normAr.includes('محمود')) {
          branchKey = 'mask';
        } else if (bCode === '118' || normAr.includes('امانات') || normAr.includes('امانه') || normAr.includes('خزنه') || normAr.includes('خازين') || normAr.includes('لوكر') || bName.includes('lock')) {
          branchKey = 'locker';
        } else if (bName.includes('g.deposit') || normAr.includes('تامين')) {
          branchKey = 'g_deposit';
        } else if (bCode.includes('g_and_r') || bName.includes('g&r') || bName.includes('car ')) {
          branchKey = 'g_and_r';
        } else if (bCode.includes('telephon') || normAr.includes('تليفون') || bName.includes('telephon')) {
          branchKey = 'telephon';
        } else if (bName.includes('net coffee') || normAr.includes('نت كافيه')) {
          branchKey = 'net_coffee';
        }
        const othCol = OTH_SECTOR_COLUMNS.find((c) => c.id === branchKey);
        branchName = othCol ? othCol.header : (r.name || branchKey);
      }

      if (branchKey && !colMap.has(branchKey)) {
        colMap.set(branchKey, branchName);
      }

      const cash = Number(r.cash) || 0;
      const visa = Number(r.visa) || 0;
      const cl = Number(r.creditLine ?? (r as any).cl) || 0;
      const rawTotal = Number(r.total) || 0;
      const itemBaseTotal = Math.abs(cash + visa + cl) > 0.0001 ? (cash + visa + cl) : rawTotal;

      branchTotals.set(branchKey, (branchTotals.get(branchKey) || 0) + itemBaseTotal);

      if (sectorType === 1) {
        const curFb = dateFbMap.get(dateKey) || { food: 0, beverage: 0, other: 0, cost: 0 };
        curFb.food += Number((r as any).food) || 0;
        curFb.beverage += Number((r as any).beverage) || 0;
        curFb.other += Number((r as any).other) || 0;
        curFb.cost += Number((r as any).cost) || 0;
        dateFbMap.set(dateKey, curFb);
      }

      if (
        (r as any).dailyCash !== undefined ||
        (r as any).dailyVisa !== undefined ||
        (r as any).dailyCl !== undefined ||
        (r as any).dailyTotal !== undefined
      ) {
        if (!datePaymentMap.has(dateKey)) {
          const dCash = Number((r as any).dailyCash) || 0;
          const dVisa = Number((r as any).dailyVisa) || 0;
          const dCl = Number((r as any).dailyCl) || 0;
          const dTot = Number((r as any).dailyTotal) || (dCash + dVisa + dCl);
          datePaymentMap.set(dateKey, {
            cash: dCash,
            visa: dVisa,
            cl: dCl,
            total: dTot,
            cashVisa: dCash + dVisa,
          });
        }
      }

      if (!dateMap.has(dateKey)) {
        dateMap.set(
          dateKey,
          new Map<string, { cash: number; visa: number; cl: number; rawTotal: number }>()
        );
      }

      const branchValues = dateMap.get(dateKey)!;

      if (sectorType === 6 && (r as any).values && typeof (r as any).values === 'object') {
        OTH_SECTOR_COLUMNS.forEach((col) => {
          const colVal = Number((r as any).values[col.id]) || 0;
          if (Math.abs(colVal) > 0.0001) {
            const cur = branchValues.get(col.id) || { cash: 0, visa: 0, cl: 0, rawTotal: 0 };
            branchValues.set(col.id, {
              cash: cur.cash + colVal,
              visa: cur.visa,
              cl: cur.cl,
              rawTotal: cur.rawTotal + colVal,
            });
            if (col.id !== branchKey) {
              branchTotals.set(col.id, (branchTotals.get(col.id) || 0) + colVal);
            }
          }
        });
      } else {
        const currentVal = branchValues.get(branchKey) || {
          cash: 0,
          visa: 0,
          cl: 0,
          rawTotal: 0,
        };
        branchValues.set(branchKey, {
          cash: currentVal.cash + cash,
          visa: currentVal.visa + visa,
          cl: currentVal.cl + cl,
          rawTotal: currentVal.rawTotal + itemBaseTotal,
        });
      }
    });

    if (sectorType === 2 && (effectiveRideStatusFilter === 'all' || effectiveRideStatusFilter === 'inactive')) {
      PAID_RIDES_SECTOR_ORDER.forEach((code) => {
        if (!colMap.has(code)) {
          colMap.set(code, PAID_RIDES_DISPLAY_NAMES[code] || `لعبة ${code}`);
        }
      });
    }

    let cols: MatrixColumn[] = Array.from(colMap.entries())
      .map(([branchCode, name]) => ({ branchCode, name }))
      .sort((a, b) => {
        if (sectorType === 4) {
          const idxA = CARAVAN_SECTOR_ORDER.indexOf(a.branchCode);
          const idxB = CARAVAN_SECTOR_ORDER.indexOf(b.branchCode);
          if (idxA !== -1 && idxB !== -1) return idxA - idxB;
          if (idxA !== -1) return -1;
          if (idxB !== -1) return 1;
        }
        if (sectorType === 3) {
          const idxA = VGAMES_SECTOR_ORDER.indexOf(a.branchCode);
          const idxB = VGAMES_SECTOR_ORDER.indexOf(b.branchCode);
          if (idxA !== -1 && idxB !== -1) return idxA - idxB;
          if (idxA !== -1) return -1;
          if (idxB !== -1) return 1;
        }
        if (sectorType === 2) {
          const idxA = PAID_RIDES_SECTOR_ORDER.indexOf(a.branchCode);
          const idxB = PAID_RIDES_SECTOR_ORDER.indexOf(b.branchCode);
          if (idxA !== -1 && idxB !== -1) return idxA - idxB;
          if (idxA !== -1) return -1;
          if (idxB !== -1) return 1;
        }
        const numA = Number(a.branchCode);
        const numB = Number(b.branchCode);
        if (!isNaN(numA) && !isNaN(numB)) {
          return numA - numB;
        }
        return a.branchCode.localeCompare(b.branchCode);
      });

    if (sectorType === 2) {
      cols = cols.filter((c) => PAID_RIDES_SECTOR_ORDER.includes(c.branchCode));
      if (effectiveRideStatusFilter === 'active') {
        cols = cols.filter((c) => {
          const isInactiveListed = PAID_RIDES_INACTIVE_CODES.has(c.branchCode);
          const hasRev = (branchTotals.get(c.branchCode) || 0) > 0;
          return hasRev && !isInactiveListed;
        });
      } else if (effectiveRideStatusFilter === 'inactive') {
        cols = cols.filter((c) => {
          const isInactiveListed = PAID_RIDES_INACTIVE_CODES.has(c.branchCode);
          const hasRev = (branchTotals.get(c.branchCode) || 0) > 0;
          return isInactiveListed || !hasRev;
        });
      }
    }

    if (sectorType === 6) {
      cols = OTH_SECTOR_COLUMNS.map((c) => ({
        branchCode: c.id,
        name: c.header,
      }));
      if ((branchTotals.get('unmapped') || 0) > 0.0001) {
        cols.push({ branchCode: 'unmapped', name: 'Unmapped' });
      }
      if (effectiveRideStatusFilter === 'active') {
        cols = cols.filter((c) => (branchTotals.get(c.branchCode) || 0) > 0.0001);
      }
    }

    return {
      cols,
      dateMap,
      datePaymentMap,
      dateFbMap,
      rawDates: Array.from(dateMap.keys()),
    };
  }, [rows, sectorType, effectiveRideStatusFilter]);

  // 4. Stage 2: Dynamic Metric Projection & Aggregate Totals
  const {
    columns,
    matrixRows,
    columnTotals,
    grandTotal,
    grandCash,
    grandVisa,
    grandCoupons,
    grandCashVisa,
    grandFood,
    grandBeverage,
    grandOther,
    grandCost,
  } = useMemo(() => {
    if (sectorType === 5) {
      const sortedRows = [...(rows as any[])].sort((a, b) => {
        const dateA = a.date || a.period || '';
        const dateB = b.date || b.period || '';
        const cmp = dateA.localeCompare(dateB);
        return sortOrder === 'asc' ? cmp : -cmp;
      });

      let rawOverallTotal = 0;
      let rawOverallCash = 0;
      let rawOverallVisa = 0;
      let rawOverallCoupons = 0;

      sortedRows.forEach((r) => {
        rawOverallTotal += Number(r.totalTicketRev) || 0;
        rawOverallCash += Number(r.cash) || 0;
        rawOverallVisa += Number(r.visa) || 0;
        rawOverallCoupons += Number(r.cl) || 0;
      });

      return {
        columns: [] as MatrixColumn[],
        matrixRows: sortedRows,
        columnTotals: {} as Record<string, number>,
        grandTotal: rawOverallTotal,
        grandCash: rawOverallCash,
        grandVisa: rawOverallVisa,
        grandCoupons: rawOverallCoupons,
        grandCashVisa: rawOverallCash + rawOverallVisa,
        grandFood: 0,
        grandBeverage: 0,
        grandOther: 0,
        grandCost: 0,
      };
    }

    const { cols, dateMap, datePaymentMap, dateFbMap, rawDates } = aggregatedData;

    const dates = [...rawDates].sort((a, b) => {
      const cmp = a.localeCompare(b);
      return sortOrder === 'asc' ? cmp : -cmp;
    });

    const rawColTotals: Record<string, number> = {};
    cols.forEach((c) => {
      rawColTotals[c.branchCode] = 0;
    });

    let rawOverallTotal = 0;
    let rawOverallCash = 0;
    let rawOverallVisa = 0;
    let rawOverallCoupons = 0;
    let rawOverallFood = 0;
    let rawOverallBeverage = 0;
    let rawOverallOther = 0;
    let rawOverallCost = 0;

    const applyCalcMode = (val: number, mode: CalcMode) => {
      if (mode === 'net') return val / 1.14;
      if (mode === 'vat') return val - val / 1.14;
      return val;
    };

    const mRows = dates.map((date) => {
      const branchValues = dateMap.get(date);
      const values: Record<string, number> = {};
      let rawDailyTotal = 0;
      let rawDailyCash = 0;
      let rawDailyVisa = 0;
      let rawDailyCoupons = 0;

      cols.forEach((col) => {
        const item = branchValues?.get(col.branchCode) || {
          cash: 0,
          visa: 0,
          cl: 0,
          rawTotal: 0,
        };

        const itemCash = item.cash;
        const itemVisa = item.visa;
        const itemCl = item.cl;
        const itemBaseTotal =
          Math.abs(itemCash + itemVisa + itemCl) > 0.0001
            ? itemCash + itemVisa + itemCl
            : item.rawTotal;

        const val = applyCalcMode(itemBaseTotal, calcMode);

        values[col.branchCode] = val;
        rawDailyTotal += itemBaseTotal;
        if (!datePaymentMap.has(date)) {
          rawDailyCash += itemCash;
          rawDailyVisa += itemVisa;
          rawDailyCoupons += itemCl;
        }

        rawColTotals[col.branchCode] = (rawColTotals[col.branchCode] || 0) + itemBaseTotal;
      });

      if (datePaymentMap.has(date)) {
        const dPay = datePaymentMap.get(date)!;
        rawDailyCash = dPay.cash;
        rawDailyVisa = dPay.visa;
        rawDailyCoupons = dPay.cl;
      }

      if (sectorType === 6) {
        const rawValOf = (k: string) => {
          const it = branchValues?.get(k);
          if (!it) return 0;
          const sumPay = it.cash + it.visa + it.cl;
          return Math.abs(sumPay) > 0.0001 ? sumPay : it.rawTotal;
        };

        if (datePaymentMap.has(date)) {
          const dPay = datePaymentMap.get(date)!;
          rawDailyCash = dPay.cash;
          rawDailyVisa = dPay.visa;
          rawDailyCoupons = dPay.cl;
        } else {
          rawDailyCash =
            rawValOf('parking_private') +
            rawValOf('parking_buses') +
            rawValOf('mask') +
            rawValOf('telephon') +
            rawValOf('g_and_r') +
            rawValOf('net_coffee') +
            rawValOf('locker') +
            rawValOf('unmapped');
          rawDailyCoupons = rawValOf('tel_accrual') + rawValOf('sh_ov');
          rawDailyVisa = 0;
        }
      }

      const rowTotal = applyCalcMode(rawDailyTotal, calcMode);
      const rowCash = applyCalcMode(rawDailyCash, calcMode);
      const rowVisa = applyCalcMode(rawDailyVisa, calcMode);
      const rowCoupons = applyCalcMode(rawDailyCoupons, calcMode);
      const rowCashVisa = rowCash + rowVisa;

      rawOverallTotal += rawDailyTotal;
      rawOverallCash += rawDailyCash;
      rawOverallVisa += rawDailyVisa;
      rawOverallCoupons += rawDailyCoupons;

      const fb = dateFbMap?.get(date) || { food: 0, beverage: 0, other: 0, cost: 0 };
      const rowFood = applyCalcMode(fb.food, calcMode);
      const rowBeverage = applyCalcMode(fb.beverage, calcMode);
      const rowOther = applyCalcMode(fb.other, calcMode);
      const rowCost = applyCalcMode(fb.cost, calcMode);

      rawOverallFood += fb.food;
      rawOverallBeverage += fb.beverage;
      rawOverallOther += fb.other;
      rawOverallCost += fb.cost;

      return {
        date,
        values,
        rowTotal,
        rowCash,
        rowVisa,
        rowCoupons,
        rowCashVisa,
        food: rowFood,
        beverage: rowBeverage,
        other: rowOther,
        cost: rowCost,
      };
    });

    const colTotalsAcc: Record<string, number> = {};
    cols.forEach((c) => {
      colTotalsAcc[c.branchCode] = applyCalcMode(rawColTotals[c.branchCode] || 0, calcMode);
    });

    const grandTotalVal = applyCalcMode(rawOverallTotal, calcMode);
    const grandCashVal = applyCalcMode(rawOverallCash, calcMode);
    const grandVisaVal = applyCalcMode(rawOverallVisa, calcMode);
    const grandCouponsVal = applyCalcMode(rawOverallCoupons, calcMode);
    const grandCashVisaVal = grandCashVal + grandVisaVal;

    return {
      columns: cols,
      matrixRows: mRows,
      columnTotals: colTotalsAcc,
      grandTotal: grandTotalVal,
      grandCash: grandCashVal,
      grandVisa: grandVisaVal,
      grandCoupons: grandCouponsVal,
      grandCashVisa: grandCashVisaVal,
      grandFood: applyCalcMode(rawOverallFood, calcMode),
      grandBeverage: applyCalcMode(rawOverallBeverage, calcMode),
      grandOther: applyCalcMode(rawOverallOther, calcMode),
      grandCost: applyCalcMode(rawOverallCost, calcMode),
    };
  }, [aggregatedData, sortOrder, calcMode, rows, sectorType]);

  // 5. Gate Totals (Type 5)
  const gateTotals = useMemo(() => {
    if (sectorType !== 5) return null;
    const t = {
      silverRev: 0, silverSold: 0,
      goldenRev: 0, goldenSold: 0,
      silverComboRev: 0, silverComboSold: 0,
      familyRev: 0, familySold: 0,
      smRev: 0, smSold: 0, smFree: 0,
      promoRev: 0, promoSold: 0,
      bgRev: 0, bgVouchers: 0,
      totalTicketRev: 0, totalTicketSold: 0, totalFree: 0,
      grr: 0,
      cash: 0, visa: 0, cl: 0,
      entranceGross: 0, theaterGross: 0, taftafGross: 0, totalVat: 0, netRevenue: 0,
      stdEntranceGross: 0, stdTheaterGross: 0, stdTaftafGross: 0,
    };
    matrixRows.forEach((r: any) => {
      t.silverRev += Number(r.silverRev) || 0;
      t.silverSold += Number(r.silverSold) || 0;
      t.goldenRev += Number(r.goldenRev) || 0;
      t.goldenSold += Number(r.goldenSold) || 0;
      t.silverComboRev += Number(r.silverComboRev) || 0;
      t.silverComboSold += Number(r.silverComboSold) || 0;
      t.familyRev += Number(r.familyRev) || 0;
      t.familySold += Number(r.familySold) || 0;
      t.smRev += Number(r.smRev) || 0;
      t.smSold += Number(r.smSold) || 0;
      t.smFree += Number(r.smFree) || 0;
      t.promoRev += Number(r.promoRev) || 0;
      t.promoSold += Number(r.promoSold) || 0;
      t.bgRev += Number(r.bgRev) || 0;
      t.bgVouchers += Number(r.bgVouchers || (r.bgRev > 0 ? 1 : 0)) || 0;
      t.totalTicketRev += Number(r.totalTicketRev) || 0;
      t.totalTicketSold += Number(r.totalTicketSold) || 0;
      t.totalFree += Number(r.totalFree) || 0;
      t.grr += Number(r.grr) || 0;
      t.cash += Number(r.cash) || 0;
      t.visa += Number(r.visa) || 0;
      t.cl += Number(r.cl) || 0;
      t.entranceGross += Number(r.entranceGross) || 0;
      t.theaterGross += Number(r.theaterGross) || 0;
      t.taftafGross += Number(r.taftafGross) || 0;
      t.totalVat += Number(r.totalVat) || 0;
      t.netRevenue += Number(r.netRevenue) || 0;
      t.stdEntranceGross += Number(r.stdEntranceGross) || 0;
      t.stdTheaterGross += Number(r.stdTheaterGross) || 0;
      t.stdTaftafGross += Number(r.stdTaftafGross) || 0;
    });
    return t;
  }, [matrixRows, sectorType]);

  // 6. Header Groups for Type 6 (OTH)
  const othHeaderGroups = useMemo(() => {
    if (sectorType !== 6) return [];
    const groups: {
      parentHeader: string | null;
      colSpan: number;
      subColumns: OthColumnDef[];
    }[] = [];

    let currentGroup: {
      parentHeader: string | null;
      colSpan: number;
      subColumns: OthColumnDef[];
    } | null = null;

    columns.forEach((col) => {
      const othDef = OTH_SECTOR_COLUMNS.find((c) => c.id === col.branchCode);
      const parentHeader = othDef?.parentHeader ?? null;

      if (parentHeader) {
        if (currentGroup && currentGroup.parentHeader === parentHeader) {
          currentGroup.colSpan++;
          currentGroup.subColumns.push(othDef!);
        } else {
          currentGroup = {
            parentHeader,
            colSpan: 1,
            subColumns: [othDef!],
          };
          groups.push(currentGroup);
        }
      } else {
        currentGroup = {
          parentHeader: null,
          colSpan: 1,
          subColumns: [othDef || { id: col.branchCode, header: col.name, parentHeader: null, width: 16 }],
        };
        groups.push(currentGroup);
      }
    });

    return groups;
  }, [sectorType, columns]);

  const isTwoRowHeader =
    isRestaurants ||
    sectorType === 5 ||
    (sectorType === 6 && othHeaderGroups.some((g) => g.parentHeader !== null));

  const totalTableCols = useMemo(() => {
    if (isRestaurants) {
      return calcMode === 'vat' ? 5 : 8;
    }
    if (sectorType === 5) {
      return 29;
    }
    if (sectorType === 6) {
      return 1 + columns.length + 5;
    }
    const outletsCount = columns.length;
    return 1 + outletsCount + (calcMode === 'vat' ? 1 : 4);
  }, [columns, calcMode, isRestaurants, sectorType]);

  return {
    isRestaurants,
    effectiveGranularity,
    restaurantData,
    columns,
    matrixRows,
    columnTotals,
    grandTotal,
    grandCash,
    grandVisa,
    grandCoupons,
    grandCashVisa,
    grandFood,
    grandBeverage,
    grandOther,
    grandCost,
    gateTotals,
    othHeaderGroups,
    isTwoRowHeader,
    totalTableCols,
  };
}
