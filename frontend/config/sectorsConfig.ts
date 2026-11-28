/**
 * @file sectorsConfig.ts
 * @description Centralized RBAC-Ready Sector Configuration & Visual Identity System for Dream Park.
 * Maps all 6 operational sectors (Branchs.Type 1 through 6) with titles, permissions, routing,
 * signature color palettes, and Excel export HEX styles.
 */

import React from 'react';
import {
  Caravan,
  Utensils,
  FerrisWheel,
  Gamepad2,
  Ticket,
  Car,
} from 'lucide-react';
import {
  type SectorExcelTheme,
  type SectorTheme,
  type SectorAnalyticsCopy,
  SECTOR_THEMES,
  SECTOR_ANALYTICS_COPY,
  getSectorTheme,
  getSectorAnalyticsCopy,
} from '@/lib/sectorTheme';

export type { SectorExcelTheme, SectorTheme, SectorAnalyticsCopy };
export { getSectorTheme, getSectorAnalyticsCopy, SECTOR_THEMES, SECTOR_ANALYTICS_COPY };

export interface SectorConfig {
  id: 'caravans' | 'restaurants' | 'rides' | 'vr' | 'gates' | 'parking';
  type: number;
  label: string;
  singularLabel: string;
  pluralLabel: string;
  matrixTitle: string;
  pageTitle: string;
  breadcrumb: string;
  description: string;
  permissionKey: string;
  iconName: 'Caravan' | 'Utensils' | 'FerrisWheel' | 'Gamepad2' | 'Ticket' | 'Car';
  badge: string;
  accentColor: string;
  path: string;
  theme: SectorTheme;
}

export const SECTOR_ICONS: Record<SectorConfig['iconName'], React.ComponentType<{ className?: string }>> = {
  Caravan,
  Utensils,
  FerrisWheel,
  Gamepad2,
  Ticket,
  Car,
};

export const SECTORS_CONFIG: Record<SectorConfig['id'], SectorConfig> = {
  // ---------------------------------------------------------------------------
  // Type 1 — المطاعم (Restaurants): Rose / Pink
  // ---------------------------------------------------------------------------
  restaurants: {
    id: 'restaurants',
    type: 1,
    label: 'المطاعم',
    singularLabel: 'مطعم',
    pluralLabel: 'المطاعم',
    matrixTitle: 'مصفوفة الإيرادات - المطاعم',
    pageTitle: 'إيرادات قطاع المطاعم',
    breadcrumb: 'لوحة تقارير المطاعم',
    description: 'متابعة وتدقيق إيرادات المطاعم وصالات الطعام الرئيسية',
    permissionKey: 'sector:restaurants',
    iconName: 'Utensils',
    badge: 'Type 1',
    accentColor: 'rose',
    path: '/reports/restaurants',
    theme: SECTOR_THEMES[1],
  },

  // ---------------------------------------------------------------------------
  // Type 2 — الألعاب الكبرى (Paid Rides): Orange
  // ---------------------------------------------------------------------------
  rides: {
    id: 'rides',
    type: 2,
    label: 'الألعاب الكبرى',
    singularLabel: 'لعبة',
    pluralLabel: 'الألعاب الكبرى',
    matrixTitle: 'مصفوفة الإيرادات - الألعاب الكبرى',
    pageTitle: 'إيرادات قطاع الألعاب الكبرى',
    breadcrumb: 'لوحة تقارير الألعاب الكبرى',
    description: 'متابعة مبيعات نقاط تشغيل وكاشيرات الألعاب الترفيهية الكبرى',
    permissionKey: 'sector:rides',
    iconName: 'FerrisWheel',
    badge: 'Type 2',
    accentColor: 'orange',
    path: '/reports/rides',
    theme: SECTOR_THEMES[2],
  },

  // ---------------------------------------------------------------------------
  // Type 3 — الفيديو جيم والـ VR (Video Games & VR): Purple
  // ---------------------------------------------------------------------------
  vr: {
    id: 'vr',
    type: 3,
    label: 'الفيديو جيم والـ VR',
    singularLabel: 'لعبة',
    pluralLabel: 'الفيديو جيم والـ VR',
    matrixTitle: 'مصفوفة الإيرادات - الفيديو جيم والـ VR',
    pageTitle: 'إيرادات قطاع الفيديو جيم والـ VR',
    breadcrumb: 'لوحة تقارير الفيديو جيم والـ VR',
    description: 'متابعة وتدقيق إيرادات صالات الألعاب والمحاكيات وقلعة دوبي',
    permissionKey: 'sector:vr',
    iconName: 'Gamepad2',
    badge: 'Type 3',
    accentColor: 'violet',
    path: '/reports/vr',
    theme: SECTOR_THEMES[3],
  },

  // ---------------------------------------------------------------------------
  // Type 4 — الكرفانات والمحلات (Caravans & Shops): Blue — REFERENCE
  // ---------------------------------------------------------------------------
  caravans: {
    id: 'caravans',
    type: 4,
    label: 'الكرفانات',
    singularLabel: 'كرفان / محل',
    pluralLabel: 'الكرفانات والمحلات',
    matrixTitle: 'مصفوفة الإيرادات - الكرفانات',
    pageTitle: 'إيرادات قطاع الكرفانات والمحلات',
    breadcrumb: 'لوحة تقارير الكرفانات',
    description: 'متابعة وتدقيق إيرادات الأكشاك ومنافذ البيع السريعة والمحلات',
    permissionKey: 'sector:caravans',
    iconName: 'Caravan',
    badge: 'Type 4',
    accentColor: 'blue',
    path: '/reports/caravans',
    theme: SECTOR_THEMES[4],
  },

  // ---------------------------------------------------------------------------
  // Type 5 — بوابات التذاكر (Gates): Green
  // ---------------------------------------------------------------------------
  gates: {
    id: 'gates',
    type: 5,
    label: 'بوابات التذاكر',
    singularLabel: 'بوابة',
    pluralLabel: 'بوابات التذاكر',
    matrixTitle: 'مصفوفة الإيرادات - بوابات التذاكر',
    pageTitle: 'إيرادات قطاع بوابات التذاكر',
    breadcrumb: 'لوحة تقارير بوابات التذاكر',
    description: 'متابعة وتدقيق مبيعات تذاكر الدخول الفضية وتذاكر البوابات',
    permissionKey: 'sector:gates',
    iconName: 'Ticket',
    badge: 'Type 5',
    accentColor: 'emerald',
    path: '/reports/gates',
    theme: SECTOR_THEMES[5],
  },

  // ---------------------------------------------------------------------------
  // Type 6 — الأمانات والانتظار (Lockers & Parking): Yellow/Amber
  // ---------------------------------------------------------------------------
  parking: {
    id: 'parking',
    type: 6,
    label: 'الأمانات والانتظار',
    singularLabel: 'منفذ',
    pluralLabel: 'الأمانات والانتظار',
    matrixTitle: 'مصفوفة الإيرادات - الأمانات والانتظار',
    pageTitle: 'إيرادات قطاع الأمانات والانتظار',
    breadcrumb: 'لوحة تقارير الأمانات والانتظار',
    description: 'متابعة وتدقيق إيرادات بارك السيارات وصناديق الأمانات',
    permissionKey: 'sector:parking',
    iconName: 'Car',
    badge: 'Type 6',
    accentColor: 'amber',
    path: '/reports/parking',
    theme: SECTOR_THEMES[6],
  },
};

export const SECTORS_LIST: SectorConfig[] = Object.values(SECTORS_CONFIG);

export const DEFAULT_SECTOR: SectorConfig = SECTORS_CONFIG.caravans;

/**
 * استرجاع إعدادات القطاع بواسطة المعرف النصي (id)
 */
export function getSectorById(id: string): SectorConfig | undefined {
  return SECTORS_CONFIG[id as SectorConfig['id']];
}

/**
 * استرجاع إعدادات القطاع بواسطة كود النوع (Branchs.Type)
 */
export function getSectorByType(type: number): SectorConfig | undefined {
  return SECTORS_LIST.find((s) => s.type === type);
}

/**
 * التحقق من صلاحيات المستخدم للوصول لقطاع معين (RBAC Ready)
 * افتراضياً يمنح الصلاحية للمدراء (ADMIN) ولجميع المستخدمين حالياً
 */
export function hasSectorAccess(
  userRole?: string,
  userPermissions?: string[],
  permissionKey?: string
): boolean {
  if (!userRole || userRole.toLowerCase() === 'admin' || userRole.toLowerCase() === 'administrator') {
    return true;
  }
  if (!permissionKey) return true;
  if (Array.isArray(userPermissions) && userPermissions.includes(permissionKey)) {
    return true;
  }
  return true; // Default fallback to allow access
}
