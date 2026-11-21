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

export interface SectorExcelTheme {
  tabColor: string;
  titleColor: string;
  headerFill: string;
  footerFill: string;
  footerFont: string;
}

export interface SectorTheme {
  accentText: string;
  pillBg: string;
  activeBg: string;
  activeIconBg: string;
  activeBadge: string;
  borderAccent: string;
  borderTop: string;
  iconBox: string;
  badgeBg: string;
  bannerGradient: string;
  chartHex: string;
  matrix: {
    topBorder: string;
    hoverRow: string;
    totalRowBg: string;
    totalRowHover: string;
    totalRowText: string;
    totalRowBorder: string;
    footerBg: string;
    footerStickyDate: string;
    footerGrandTotal: string;
    footerSubTotal: string;
  };
  excel: SectorExcelTheme;
}

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
  // Type 1 — المطاعم (Restaurants): Red / Rose
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
    theme: {
      accentText: 'text-rose-600 dark:text-rose-400',
      pillBg: 'bg-rose-500/10 text-rose-600 border border-rose-200 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-800/40',
      activeBg: 'bg-rose-50 text-rose-600 shadow-2xs border-r-4 border-rose-500 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-400 font-bold',
      activeIconBg: 'bg-rose-500/15 text-rose-600 dark:bg-rose-400/20 dark:text-rose-400',
      activeBadge: 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300',
      borderAccent: 'border-rose-500 dark:border-rose-400',
      borderTop: 'border-t-2 border-rose-500 dark:border-rose-400',
      iconBox: 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400',
      badgeBg: 'bg-rose-100/80 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
      bannerGradient: 'bg-gradient-to-l from-rose-500/15 via-rose-500/5 to-transparent dark:from-rose-500/20 dark:via-rose-950/40 dark:to-slate-900/60 border-rose-500/30',
      chartHex: '#E11D48',
      matrix: {
        topBorder: 'border-t-4 border-rose-500',
        hoverRow: 'hover:bg-rose-100/70 dark:hover:bg-rose-950/40',
        totalRowBg: 'bg-rose-100/80 dark:bg-rose-950/60',
        totalRowHover: 'hover:bg-rose-200/70 dark:hover:bg-rose-900/60',
        totalRowText: 'text-rose-950 dark:text-rose-100',
        totalRowBorder: 'border-t-2 border-rose-500/60',
        footerBg: 'border-slate-300 bg-rose-100/95 dark:border-rose-800/60 dark:bg-rose-950/95 text-rose-950 dark:text-rose-100',
        footerStickyDate: 'border-slate-300 dark:border-rose-800/60 bg-rose-200/95 dark:bg-rose-900/90 text-rose-950 dark:text-rose-100',
        footerGrandTotal: 'bg-rose-200/95 dark:bg-rose-800/60 text-rose-950 dark:text-rose-50',
        footerSubTotal: 'bg-rose-200/80 dark:bg-rose-800/40 text-rose-950 dark:text-rose-50',
      },
      excel: {
        tabColor: 'FFE11D48',
        titleColor: 'FF881337',
        headerFill: 'FFFFF1F2',
        footerFill: 'FFFFE4E6',
        footerFont: 'FF881337',
      },
    },
  },

  // ---------------------------------------------------------------------------
  // Type 2 — الألعاب الكبرى (Amusement Rides): Gold / Yellow
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
    accentColor: 'yellow',
    path: '/reports/rides',
    theme: {
      accentText: 'text-yellow-600 dark:text-yellow-400',
      pillBg: 'bg-yellow-500/10 text-yellow-600 border border-yellow-200 dark:bg-yellow-500/20 dark:text-yellow-300 dark:border-yellow-800/40',
      activeBg: 'bg-yellow-50 text-yellow-600 shadow-2xs border-r-4 border-yellow-500 dark:bg-yellow-500/10 dark:text-yellow-400 dark:border-yellow-400 font-bold',
      activeIconBg: 'bg-yellow-500/15 text-yellow-600 dark:bg-yellow-400/20 dark:text-yellow-400',
      activeBadge: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/60 dark:text-yellow-300',
      borderAccent: 'border-yellow-500 dark:border-yellow-400',
      borderTop: 'border-t-2 border-yellow-500 dark:border-yellow-400',
      iconBox: 'bg-yellow-500/10 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-400',
      badgeBg: 'bg-yellow-100/80 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
      bannerGradient: 'bg-gradient-to-l from-yellow-500/15 via-yellow-500/5 to-transparent dark:from-yellow-500/20 dark:via-yellow-950/40 dark:to-slate-900/60 border-yellow-500/30',
      chartHex: '#CA8A04',
      matrix: {
        topBorder: 'border-t-4 border-yellow-500',
        hoverRow: 'hover:bg-yellow-100/70 dark:hover:bg-yellow-950/40',
        totalRowBg: 'bg-yellow-100/80 dark:bg-yellow-950/60',
        totalRowHover: 'hover:bg-yellow-200/70 dark:hover:bg-yellow-900/60',
        totalRowText: 'text-yellow-950 dark:text-yellow-100',
        totalRowBorder: 'border-t-2 border-yellow-500/60',
        footerBg: 'border-slate-300 bg-yellow-100/95 dark:border-yellow-800/60 dark:bg-yellow-950/95 text-yellow-950 dark:text-yellow-100',
        footerStickyDate: 'border-slate-300 dark:border-yellow-800/60 bg-yellow-200/95 dark:bg-yellow-900/90 text-yellow-950 dark:text-yellow-100',
        footerGrandTotal: 'bg-yellow-200/95 dark:bg-yellow-800/60 text-yellow-950 dark:text-yellow-50',
        footerSubTotal: 'bg-yellow-200/80 dark:bg-yellow-800/40 text-yellow-950 dark:text-yellow-50',
      },
      excel: {
        tabColor: 'FFEAB308',
        titleColor: 'FF713F12',
        headerFill: 'FFFEFCE8',
        footerFill: 'FFFEF08A',
        footerFont: 'FF713F12',
      },
    },
  },

  // ---------------------------------------------------------------------------
  // Type 3 — الفيديو جيم والـ VR (Video Games & VR): Purple / Violet
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
    theme: {
      accentText: 'text-violet-600 dark:text-violet-400',
      pillBg: 'bg-violet-500/10 text-violet-600 border border-violet-200 dark:bg-violet-500/20 dark:text-violet-300 dark:border-violet-800/40',
      activeBg: 'bg-violet-50 text-violet-600 shadow-2xs border-r-4 border-violet-500 dark:bg-violet-500/10 dark:text-violet-400 dark:border-violet-400 font-bold',
      activeIconBg: 'bg-violet-500/15 text-violet-600 dark:bg-violet-400/20 dark:text-violet-400',
      activeBadge: 'bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300',
      borderAccent: 'border-violet-500 dark:border-violet-400',
      borderTop: 'border-t-2 border-violet-500 dark:border-violet-400',
      iconBox: 'bg-violet-500/10 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400',
      badgeBg: 'bg-violet-100/80 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
      bannerGradient: 'bg-gradient-to-l from-violet-500/15 via-violet-500/5 to-transparent dark:from-violet-500/20 dark:via-violet-950/40 dark:to-slate-900/60 border-violet-500/30',
      chartHex: '#7C3AED',
      matrix: {
        topBorder: 'border-t-4 border-violet-500',
        hoverRow: 'hover:bg-violet-100/70 dark:hover:bg-violet-950/40',
        totalRowBg: 'bg-violet-100/80 dark:bg-violet-950/60',
        totalRowHover: 'hover:bg-violet-200/70 dark:hover:bg-violet-900/60',
        totalRowText: 'text-violet-950 dark:text-violet-100',
        totalRowBorder: 'border-t-2 border-violet-500/60',
        footerBg: 'border-slate-300 bg-violet-100/95 dark:border-violet-800/60 dark:bg-violet-950/95 text-violet-950 dark:text-violet-100',
        footerStickyDate: 'border-slate-300 dark:border-violet-800/60 bg-violet-200/95 dark:bg-violet-900/90 text-violet-950 dark:text-violet-100',
        footerGrandTotal: 'bg-violet-200/95 dark:bg-violet-800/60 text-violet-950 dark:text-violet-50',
        footerSubTotal: 'bg-violet-200/80 dark:bg-violet-800/40 text-violet-950 dark:text-violet-50',
      },
      excel: {
        tabColor: 'FF7C3AED',
        titleColor: 'FF4C1D95',
        headerFill: 'FFF5F3FF',
        footerFill: 'FFEDE9FE',
        footerFont: 'FF4C1D95',
      },
    },
  },

  // ---------------------------------------------------------------------------
  // Type 4 — الكرفانات والمحلات (Caravans & Shops): Blue / Sky
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
    theme: {
      accentText: 'text-blue-600 dark:text-blue-400',
      pillBg: 'bg-blue-500/10 text-blue-600 border border-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-800/40',
      activeBg: 'bg-blue-50 text-blue-600 shadow-2xs border-r-4 border-blue-500 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-400 font-bold',
      activeIconBg: 'bg-blue-500/15 text-blue-600 dark:bg-blue-400/20 dark:text-blue-400',
      activeBadge: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300',
      borderAccent: 'border-blue-500 dark:border-blue-400',
      borderTop: 'border-t-2 border-blue-500 dark:border-blue-400',
      iconBox: 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400',
      badgeBg: 'bg-blue-100/80 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
      bannerGradient: 'bg-gradient-to-l from-blue-500/15 via-blue-500/5 to-transparent dark:from-blue-500/20 dark:via-blue-950/40 dark:to-slate-900/60 border-blue-500/30',
      chartHex: '#2563EB',
      matrix: {
        topBorder: 'border-t-4 border-blue-500',
        hoverRow: 'hover:bg-blue-100/70 dark:hover:bg-blue-950/40',
        totalRowBg: 'bg-blue-100/80 dark:bg-blue-950/60',
        totalRowHover: 'hover:bg-blue-200/70 dark:hover:bg-blue-900/60',
        totalRowText: 'text-blue-950 dark:text-blue-100',
        totalRowBorder: 'border-t-2 border-blue-500/60',
        footerBg: 'border-slate-300 bg-blue-100/95 dark:border-blue-800/60 dark:bg-blue-950/95 text-blue-950 dark:text-blue-100',
        footerStickyDate: 'border-slate-300 dark:border-blue-800/60 bg-blue-200/95 dark:bg-blue-900/90 text-blue-950 dark:text-blue-100',
        footerGrandTotal: 'bg-blue-200/95 dark:bg-blue-800/60 text-blue-950 dark:text-blue-50',
        footerSubTotal: 'bg-blue-200/80 dark:bg-blue-800/40 text-blue-950 dark:text-blue-50',
      },
      excel: {
        tabColor: 'FF2563EB',
        titleColor: 'FF1E3A8A',
        headerFill: 'FFE2E8F0',
        footerFill: 'FFDBEAFE',
        footerFont: 'FF1E3A8A',
      },
    },
  },

  // ---------------------------------------------------------------------------
  // Type 5 — بوابات التذاكر (Gates / Tickets): Green / Emerald
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
    theme: {
      accentText: 'text-emerald-600 dark:text-emerald-400',
      pillBg: 'bg-emerald-500/10 text-emerald-600 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-800/40',
      activeBg: 'bg-emerald-50 text-emerald-600 shadow-2xs border-r-4 border-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-400 font-bold',
      activeIconBg: 'bg-emerald-500/15 text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-400',
      activeBadge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
      borderAccent: 'border-emerald-500 dark:border-emerald-400',
      borderTop: 'border-t-2 border-emerald-500 dark:border-emerald-400',
      iconBox: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400',
      badgeBg: 'bg-emerald-100/80 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
      bannerGradient: 'bg-gradient-to-l from-emerald-500/15 via-emerald-500/5 to-transparent dark:from-emerald-500/20 dark:via-emerald-950/40 dark:to-slate-900/60 border-emerald-500/30',
      chartHex: '#059669',
      matrix: {
        topBorder: 'border-t-4 border-emerald-500',
        hoverRow: 'hover:bg-emerald-100/70 dark:hover:bg-emerald-950/40',
        totalRowBg: 'bg-emerald-100/80 dark:bg-emerald-950/60',
        totalRowHover: 'hover:bg-emerald-200/70 dark:hover:bg-emerald-900/60',
        totalRowText: 'text-emerald-950 dark:text-emerald-100',
        totalRowBorder: 'border-t-2 border-emerald-500/60',
        footerBg: 'border-slate-300 bg-emerald-100/95 dark:border-emerald-800/60 dark:bg-emerald-950/95 text-emerald-950 dark:text-emerald-100',
        footerStickyDate: 'border-slate-300 dark:border-emerald-800/60 bg-emerald-200/95 dark:bg-emerald-900/90 text-emerald-950 dark:text-emerald-100',
        footerGrandTotal: 'bg-emerald-200/95 dark:bg-emerald-800/60 text-emerald-950 dark:text-emerald-50',
        footerSubTotal: 'bg-emerald-200/80 dark:bg-emerald-800/40 text-emerald-950 dark:text-emerald-50',
      },
      excel: {
        tabColor: 'FF059669',
        titleColor: 'FF064E3B',
        headerFill: 'FFECFDF5',
        footerFill: 'FFD1FAE5',
        footerFont: 'FF064E3B',
      },
    },
  },

  // ---------------------------------------------------------------------------
  // Type 6 — الأمانات والانتظار (Lockers & Parking): Teal / Cyan
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
    accentColor: 'teal',
    path: '/reports/parking',
    theme: {
      accentText: 'text-teal-600 dark:text-teal-400',
      pillBg: 'bg-teal-500/10 text-teal-600 border border-teal-200 dark:bg-teal-500/20 dark:text-teal-300 dark:border-teal-800/40',
      activeBg: 'bg-teal-50 text-teal-600 shadow-2xs border-r-4 border-teal-500 dark:bg-teal-500/10 dark:text-teal-400 dark:border-teal-400 font-bold',
      activeIconBg: 'bg-teal-500/15 text-teal-600 dark:bg-teal-400/20 dark:text-teal-400',
      activeBadge: 'bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300',
      borderAccent: 'border-teal-500 dark:border-teal-400',
      borderTop: 'border-t-2 border-teal-500 dark:border-teal-400',
      iconBox: 'bg-teal-500/10 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400',
      badgeBg: 'bg-teal-100/80 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
      bannerGradient: 'bg-gradient-to-l from-teal-500/15 via-teal-500/5 to-transparent dark:from-teal-500/20 dark:via-teal-950/40 dark:to-slate-900/60 border-teal-500/30',
      chartHex: '#0D9488',
      matrix: {
        topBorder: 'border-t-4 border-teal-500',
        hoverRow: 'hover:bg-teal-100/70 dark:hover:bg-teal-950/40',
        totalRowBg: 'bg-teal-100/80 dark:bg-teal-950/60',
        totalRowHover: 'hover:bg-teal-200/70 dark:hover:bg-teal-900/60',
        totalRowText: 'text-teal-950 dark:text-teal-100',
        totalRowBorder: 'border-t-2 border-teal-500/60',
        footerBg: 'border-slate-300 bg-teal-100/95 dark:border-teal-800/60 dark:bg-teal-950/95 text-teal-950 dark:text-teal-100',
        footerStickyDate: 'border-slate-300 dark:border-teal-800/60 bg-teal-200/95 dark:bg-teal-900/90 text-teal-950 dark:text-teal-100',
        footerGrandTotal: 'bg-teal-200/95 dark:bg-teal-800/60 text-teal-950 dark:text-teal-50',
        footerSubTotal: 'bg-teal-200/80 dark:bg-teal-800/40 text-teal-950 dark:text-teal-50',
      },
      excel: {
        tabColor: 'FF0D9488',
        titleColor: 'FF134E4A',
        headerFill: 'FFF0FDFA',
        footerFill: 'FFCCFBF1',
        footerFont: 'FF134E4A',
      },
    },
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
 * استرجاع هوية وألوان القطاع بواسطة كود النوع (Branchs.Type)
 */
export function getSectorTheme(sectorType?: number): SectorTheme {
  const sector = SECTORS_LIST.find((s) => s.type === sectorType);
  return sector?.theme || SECTORS_CONFIG.caravans.theme;
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
