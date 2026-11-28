import { getSectorTheme, type SectorTheme } from '@/config/sectorsConfig';
import type { CaravanRecord } from '@/types/reports';

/* -------------------------------------------------------------------------- */
/* Types & Interfaces                                                         */
/* -------------------------------------------------------------------------- */

export interface MatrixRowItem {
  date?: string;
  period?: string | null;
  branchCode: string;
  name: string;
  cash?: number;
  visa?: number;
  cl?: number;
  creditLine?: number;
  total?: number;
  [key: string]: any;
}

export interface MatrixColumn {
  branchCode: string;
  name: string;
}

export type CalcMode = 'total' | 'net' | 'vat';
export type MatrixViewMode = 'net' | 'vat' | 'total'; // Backward compatibility
export type RideStatusFilter = 'active' | 'inactive' | 'all';

export interface MatrixRowData {
  date: string;
  values: Record<string, number>;
  rowTotal: number;
  rowCash: number;
  rowVisa: number;
  rowCoupons: number;
  rowCashVisa: number;
  food?: number;
  beverage?: number;
  other?: number;
  cost?: number;
}

export interface OthColumnDef {
  id: string;
  header: string;
  parentHeader: string | null;
  width: number;
}

export interface RestaurantBranchRow {
  branchCode: string;
  name: string;
  displayName: string;
  food: number;
  beverage: number;
  other: number;
  total: number;
  cash: number;
  visa: number;
  cl: number;
}

export interface DailyRevenueMatrixProps {
  rows?: (CaravanRecord | MatrixRowItem)[];
  title?: string;
  loading?: boolean;
  sectorId?: string;
  sectorType?: number;
  sectorLabel?: string;
  sectorTheme?: SectorTheme;
  facilityType?: 'all' | 'caravans' | 'shops';
  onFacilityTypeChange?: (f: 'all' | 'caravans' | 'shops') => void;
  rideStatusFilter?: RideStatusFilter;
  onRideStatusFilterChange?: (filter: RideStatusFilter) => void;
  startDate?: string;
  endDate?: string;
  granularity?: 'summary' | 'month' | 'day' | 'total';
}

/* -------------------------------------------------------------------------- */
/* Display Names & Sector Order Constants                                    */
/* -------------------------------------------------------------------------- */

export const CARAVAN_DISPLAY_NAMES: Record<string, string> = {
  '1003': 'BAWABA',
  '1004': 'AL SHLAL',
  '1005': 'DISCOVRY',
  '1006': 'ROCET',
  '1007': 'DARKNISS',
  '1008': 'THE RIVER',
  '1010': 'EGYPTION',
  '1015': 'AL PATATS',
  '1018': '229',
  '1021': 'DOPY',
  '1023': 'LIMO',
  '1024': 'TOYES',
  '1025': 'BONBON',
  '1027': 'ZOO',
  '1029': 'Funny',
  '1030': 'ALTAAWWSS',
};

export const VGAMES_DISPLAY_NAMES: Record<string, string> = {
  '18': 'Movy',
  '119': 'Doobi Castle',
  '109': 'Babliony',
  '20': 'Hummer',
  '111': 'Shooting',
  '122': 'VR3',
  '12': 'Shooting2',
  '19': 'Radio',
  '3': 'Upside Down House',
  '110': 'Childrens',
  '117': 'V.R 1',
  '118': 'V.R 2',
};

export const VGAMES_SECTOR_ORDER: string[] = [
  '18',  // Movy
  '119', // Doobi Castle
  '109', // Babliony
  '20',  // Hummer
  '111', // Shooting
  '122', // VR3
  '12',  // Shooting2
  '19',  // Radio
  '3',   // Upside Down House
  '110', // Childrens
  '117', // V.R 1
  '118', // V.R 2
];

export const PAID_RIDES_DISPLAY_NAMES: Record<string, string> = {
  '7': 'R.Coaster',
  '16': 'Rocket',
  'simulator': 'Simulator',
  'golden': 'Golden',
  'topspin': 'Top Spin',
  '8': 'Go Kart',
  '4': '7 D',
  '1': 'Discovery',
  '113': 'Horse',
  '6': 'Tornado',
  '115': 'Funny Slides',
  'fire': 'Fire Brigade',
  '2': 'Super Spin',
  '14': 'Laser zone',
};

export const PAID_RIDES_SECTOR_ORDER: string[] = [
  '7',         // 1. R.Coaster (القطار) — Active
  '16',        // 2. Rocket (الصاروخ) — Active
  'simulator', // 3. Simulator (السيمولاتور) — Inactive
  'golden',    // 4. Golden (الذهبية / VIP / الباقات) — Active
  'topspin',   // 5. Top Spin (التوب سبين) — Inactive
  '8',         // 6. Go Kart (السيارات) — Active
  '4',         // 7. 7 D (7D) — Active
  '1',         // 8. Discovery (الديسكفري) — Active
  '113',       // 9. Horse (الخيل — 113) — Active
  '6',         // 10. Tornado (التورنيدو) — Active
  '115',       // 11. Funny Slides (شلال المرح — 115) — Active
  'fire',      // 12. Fire Brigade (المطافي) — Inactive
  '2',         // 13. Super Spin (السوبر سبين) — Active
  '14',        // 14. Laser zone (الليزر زون) — Active
];

export const PAID_RIDES_INACTIVE_CODES = new Set([
  'simulator',
  'topspin',
  'fire',
]);

export const SHOP_BRANCH_CODES_SET = new Set(['1021', '1023', '1024', '1025', '1029']);

export const CARAVAN_SECTOR_ORDER: string[] = [
  '1003', // BAWABA
  '1004', // AL SHLAL
  '1005', // DISCOVRY
  '1006', // ROCET
  '1007', // DARKNISS
  '1008', // THE RIVER
  '1010', // EGYPTION
  '1015', // AL PATATS
  '1018', // 229
  '1027', // ZOO
  '1030', // ALTAAWWSS
  '1021', // DOPY (Shop)
  '1023', // LIMO (Shop)
  '1024', // TOYES (Shop)
  '1025', // BONBON (Shop)
  '1029', // Funny (Shop)
];

export const RESTAURANT_DISPLAY_NAMES: Record<string, string> = {
  '1': 'المطعم الصيني (Chinese)',
  '2': 'المطعم المصري (Egypt)',
  '3': 'المطعم الإيطالي (Italian)',
  '4': 'المطعم الشرقي (Oriental)',
  '5': 'مطعم الستيك (Steak)',
  '6': 'يشمع هيلتون (Yashmk)',
  '7': 'شيكي (Cheky)',
  '8': 'هوليوود (Hollywood)',
  '9': 'دريم تو جو (Dream To Go)',
  '10': 'فرش (Fresh)',
  '11': 'مستر برجر (Mr. Burger)',
  '13': 'مستشفى دريم (Dream Hospital)',
  '14': 'الكانتين (Canteen)',
};

export const OTH_SECTOR_COLUMNS: OthColumnDef[] = [
  // 1. Parking [Private, Buses]
  { id: 'parking_private', header: 'Private', parentHeader: 'Parking', width: 14 },
  { id: 'parking_buses', header: 'Buses', parentHeader: 'Parking', width: 14 },

  // 2. Mask (single combined column)
  { id: 'mask', header: 'Mask', parentHeader: null, width: 16 },

  // 3. Telephon
  { id: 'telephon', header: 'Telephon', parentHeader: null, width: 16 },

  // 4. Tel.Accrual
  { id: 'tel_accrual', header: 'Tel.Accrual', parentHeader: null, width: 16 },

  // 5. G.Deposit
  { id: 'g_deposit', header: 'G.Deposit', parentHeader: null, width: 16 },

  // 6. G&R
  { id: 'g_and_r', header: 'G&R', parentHeader: null, width: 16 },

  // 7. Sh_Ov
  { id: 'sh_ov', header: 'Sh_Ov', parentHeader: null, width: 16 },

  // 8. Net Coffee
  { id: 'net_coffee', header: 'Net Coffee', parentHeader: null, width: 16 },

  // 9. Locker
  { id: 'locker', header: 'Locker', parentHeader: null, width: 16 },
];

export const OTH_SUMMARY_COLUMNS = [
  { id: 'summary_cash', header: 'Cash', width: 16 },
  { id: 'summary_cl', header: 'C.L', width: 16 },
  { id: 'summary_g_deposit', header: 'G.Deposit', width: 16 },
  { id: 'summary_visa', header: 'Visa', width: 16 },
  { id: 'summary_total', header: 'TOTAL', width: 18 },
];

export const MONEY_FORMATTER = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatDateAr(dateStr?: string): string {
  if (!dateStr) return '';
  const trimmed = dateStr.trim();
  const parts = trimmed.split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts;
    return `${parseInt(d, 10)}/${parseInt(m, 10)}/${y}`;
  }
  const d = new Date(trimmed);
  if (!isNaN(d.getTime())) {
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  }
  return trimmed;
}
