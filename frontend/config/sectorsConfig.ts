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
  solidBg: string;
  solidHover: string;
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
  btnPrimary: string;
  btnActive: string;
  badgeSolid: string;
  checkboxActive: string;
  chartHex: string;
  kpiCard: {
    cardBorder: string;
    cardBg: string;
    cardRing: string;
    cardHover: string;
    badge: string;
    divider: string;
  };
  matrix: {
    topBorder: string;
    headerBg: string;
    hoverRow: string;
    hoverCell: string;
    totalRevCol: string;
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
  // Type 1 — المطاعم (Restaurants): Red
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
      solidBg: 'bg-rose-600',
      solidHover: 'hover:bg-rose-700',
      accentText: 'text-rose-600 dark:text-rose-400 font-bold',
      pillBg: 'bg-rose-500/10 text-rose-600 border border-rose-200 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-800/40',
      activeBg: 'bg-rose-50 text-rose-600 shadow-2xs border-r-4 border-rose-500 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-400 font-bold',
      activeIconBg: 'bg-rose-500/15 text-rose-600 dark:bg-rose-400/20 dark:text-rose-400',
      activeBadge: 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300',
      borderAccent: 'border-rose-500 dark:border-rose-400',
      borderTop: 'border-t-2 border-rose-500 dark:border-rose-400',
      iconBox: 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400',
      badgeBg: 'bg-rose-100/80 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
      bannerGradient: 'bg-gradient-to-l from-rose-500/15 via-rose-500/5 to-transparent dark:from-rose-500/20 dark:via-rose-950/40 dark:to-slate-900/60 border-rose-500/30',
      btnPrimary: 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm font-semibold',
      btnActive: 'bg-rose-600 text-white shadow-sm font-bold',
      badgeSolid: 'bg-rose-600 text-white',
      checkboxActive: 'border-rose-600 bg-rose-600 text-white dark:border-rose-500 dark:bg-rose-500',
      chartHex: '#E11D48',
      kpiCard: {
        cardBorder: 'border-rose-200/80 dark:border-rose-900/40',
        cardBg: 'bg-rose-50/50 dark:bg-rose-950/20',
        cardRing: 'ring-rose-500/10 dark:ring-rose-400/10',
        cardHover: 'hover:border-rose-300 dark:hover:border-rose-700',
        badge: 'bg-rose-100/80 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
        divider: 'border-rose-100/80 dark:border-rose-900/30',
      },
      matrix: {
        topBorder: 'border-t-4 border-rose-500',
        headerBg: 'bg-rose-500/5 dark:bg-rose-950/20',
        hoverRow: 'hover:bg-rose-50/80 dark:hover:bg-rose-950/30',
        hoverCell: 'group-hover:bg-rose-50/80 dark:group-hover:bg-rose-950/30',
        totalRevCol: 'text-rose-950 bg-rose-50/80 group-hover:bg-rose-100/80 dark:bg-zinc-800/60 dark:text-rose-200 dark:group-hover:bg-rose-950/60 font-black',
        totalRowBg: 'bg-rose-600',
        totalRowHover: 'hover:bg-rose-700',
        totalRowText: '!text-white font-bold',
        totalRowBorder: 'border-t-2 border-rose-500',
        footerBg: 'bg-rose-600 !text-white',
        footerStickyDate: 'bg-rose-600 !text-white',
        footerGrandTotal: 'bg-rose-600 !text-white',
        footerSubTotal: 'bg-rose-600 !text-white',
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
    theme: {
      solidBg: 'bg-orange-600',
      solidHover: 'hover:bg-orange-700',
      accentText: 'text-orange-600 dark:text-orange-400 font-bold',
      pillBg: 'bg-orange-500/10 text-orange-600 border border-orange-200 dark:bg-orange-500/20 dark:text-orange-300 dark:border-orange-800/40',
      activeBg: 'bg-orange-50 text-orange-600 shadow-2xs border-r-4 border-orange-500 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-400 font-bold',
      activeIconBg: 'bg-orange-500/15 text-orange-600 dark:bg-orange-400/20 dark:text-orange-400',
      activeBadge: 'bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300',
      borderAccent: 'border-orange-500 dark:border-orange-400',
      borderTop: 'border-t-2 border-orange-500 dark:border-orange-400',
      iconBox: 'bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400',
      badgeBg: 'bg-orange-100/80 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
      bannerGradient: 'bg-gradient-to-l from-orange-500/15 via-orange-500/5 to-transparent dark:from-orange-500/20 dark:via-orange-950/40 dark:to-slate-900/60 border-orange-500/30',
      btnPrimary: 'bg-orange-600 hover:bg-orange-700 text-white shadow-sm font-semibold',
      btnActive: 'bg-orange-600 text-white shadow-sm font-bold',
      badgeSolid: 'bg-orange-600 text-white',
      checkboxActive: 'border-orange-600 bg-orange-600 text-white dark:border-orange-500 dark:bg-orange-500',
      chartHex: '#EA580C',
      kpiCard: {
        cardBorder: 'border-orange-200/80 dark:border-orange-900/40',
        cardBg: 'bg-orange-50/50 dark:bg-orange-950/20',
        cardRing: 'ring-orange-500/10 dark:ring-orange-400/10',
        cardHover: 'hover:border-orange-300 dark:hover:border-orange-700',
        badge: 'bg-orange-100/80 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
        divider: 'border-orange-100/80 dark:border-orange-900/30',
      },
      matrix: {
        topBorder: 'border-t-4 border-orange-500',
        headerBg: 'bg-orange-500/5 dark:bg-orange-950/20',
        hoverRow: 'hover:bg-orange-50/80 dark:hover:bg-orange-950/30',
        hoverCell: 'group-hover:bg-orange-50/80 dark:group-hover:bg-orange-950/30',
        totalRevCol: 'text-orange-950 bg-orange-50/80 group-hover:bg-orange-100/80 dark:bg-zinc-800/60 dark:text-orange-200 dark:group-hover:bg-orange-950/60 font-black',
        totalRowBg: 'bg-orange-600',
        totalRowHover: 'hover:bg-orange-700',
        totalRowText: '!text-white font-bold',
        totalRowBorder: 'border-t-2 border-orange-500',
        footerBg: 'bg-orange-600 !text-white',
        footerStickyDate: 'bg-orange-600 !text-white',
        footerGrandTotal: 'bg-orange-600 !text-white',
        footerSubTotal: 'bg-orange-600 !text-white',
      },
      excel: {
        tabColor: 'FFF97316',
        titleColor: 'FF9A3412',
        headerFill: 'FFFFEDD5',
        footerFill: 'FFFDBA74',
        footerFont: 'FF7C2D12',
      },
    },
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
    theme: {
      solidBg: 'bg-violet-950',
      solidHover: 'hover:bg-violet-900',
      accentText: 'text-violet-900 dark:text-violet-300 font-bold',
      pillBg: 'bg-violet-950/40 text-violet-200 border border-violet-800/50 dark:bg-violet-950/60 dark:text-violet-200 dark:border-violet-800/40',
      activeBg: 'bg-violet-950/30 text-violet-200 shadow-2xs border-r-4 border-violet-800 dark:bg-violet-950/50 dark:text-violet-200 dark:border-violet-700 font-bold',
      activeIconBg: 'bg-violet-950/40 text-violet-300 dark:bg-violet-900/40 dark:text-violet-300',
      activeBadge: 'bg-violet-950/60 text-violet-200 border border-violet-800/40 dark:bg-violet-950/80 dark:text-violet-200',
      borderAccent: 'border-violet-800/60 dark:border-violet-700/60',
      borderTop: 'border-t-2 border-violet-800/60 dark:border-violet-700/60',
      iconBox: 'bg-violet-950/20 text-violet-800 dark:bg-violet-950/40 dark:text-violet-300',
      badgeBg: 'bg-violet-950/30 text-violet-800 dark:bg-violet-950/60 dark:text-violet-200',
      bannerGradient: 'bg-gradient-to-l from-violet-950/30 via-violet-950/15 to-transparent dark:from-violet-950/40 dark:via-zinc-900/60 dark:to-zinc-900/80 border-violet-800/30',
      btnPrimary: 'bg-violet-950 hover:bg-violet-900 text-white border border-violet-800/60 shadow-sm font-semibold',
      btnActive: 'bg-violet-950 hover:bg-violet-900 text-white border border-violet-800/60 shadow-sm font-bold',
      badgeSolid: 'bg-violet-950 text-white border border-violet-800/60',
      checkboxActive: 'border-violet-800 bg-violet-950 text-white dark:border-violet-700 dark:bg-violet-950',
      chartHex: '#4C1D95',
      kpiCard: {
        cardBorder: 'border-slate-200/80 dark:border-zinc-800',
        cardBg: 'bg-violet-950/10 dark:bg-violet-950/30',
        cardRing: 'ring-violet-900/10 dark:ring-violet-800/10',
        cardHover: 'hover:border-violet-800/60 dark:hover:border-violet-700/60',
        badge: 'bg-violet-950/50 text-violet-200 border border-violet-800/40 dark:bg-violet-950/60 dark:text-violet-200',
        divider: 'border-violet-900/20 dark:border-violet-800/30',
      },
      matrix: {
        topBorder: '',
        headerBg: 'bg-violet-950 text-white border-b border-violet-800/60',
        hoverRow: 'hover:bg-violet-950/10 dark:hover:bg-violet-950/25',
        hoverCell: 'group-hover:bg-violet-950/10 dark:group-hover:bg-violet-950/25',
        totalRevCol: 'text-violet-950 bg-violet-950/5 group-hover:bg-violet-950/10 dark:bg-zinc-800/60 dark:text-violet-200 dark:group-hover:bg-violet-950/40 font-black',
        totalRowBg: 'bg-violet-950',
        totalRowHover: 'hover:bg-violet-900',
        totalRowText: '!text-white font-bold',
        totalRowBorder: 'border-t-2 border-violet-800/60',
        footerBg: 'bg-violet-950 !text-white',
        footerStickyDate: 'bg-violet-950 !text-white',
        footerGrandTotal: 'bg-violet-950 !text-white',
        footerSubTotal: 'bg-violet-950 !text-white',
      },
      excel: {
        tabColor: 'FF4C1D95',
        titleColor: 'FF2E1065',
        headerFill: 'FFF5F3FF',
        footerFill: 'FFEDE9FE',
        footerFont: 'FF2E1065',
      },
    },
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
    theme: {
      solidBg: 'bg-blue-600',
      solidHover: 'hover:bg-blue-700',
      accentText: 'text-blue-600 dark:text-blue-400 font-bold',
      pillBg: 'bg-blue-500/10 text-blue-600 border border-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-800/40',
      activeBg: 'bg-blue-50 text-blue-600 shadow-2xs border-r-4 border-blue-500 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-400 font-bold',
      activeIconBg: 'bg-blue-500/15 text-blue-600 dark:bg-blue-400/20 dark:text-blue-400',
      activeBadge: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300',
      borderAccent: 'border-blue-500 dark:border-blue-400',
      borderTop: 'border-t-2 border-blue-500 dark:border-blue-400',
      iconBox: 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400',
      badgeBg: 'bg-blue-100/80 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
      bannerGradient: 'bg-gradient-to-l from-blue-500/15 via-blue-500/5 to-transparent dark:from-blue-500/20 dark:via-blue-950/40 dark:to-slate-900/60 border-blue-500/30',
      btnPrimary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm font-semibold',
      btnActive: 'bg-blue-600 text-white shadow-sm font-bold',
      badgeSolid: 'bg-blue-600 text-white',
      checkboxActive: 'border-blue-600 bg-blue-600 text-white dark:border-blue-500 dark:bg-blue-500',
      chartHex: '#2563EB',
      kpiCard: {
        cardBorder: 'border-blue-200/80 dark:border-blue-900/40',
        cardBg: 'bg-blue-50/50 dark:bg-blue-950/20',
        cardRing: 'ring-blue-500/10 dark:ring-blue-400/10',
        cardHover: 'hover:border-blue-300 dark:hover:border-blue-700',
        badge: 'bg-blue-100/80 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
        divider: 'border-blue-100/80 dark:border-blue-900/30',
      },
      matrix: {
        topBorder: 'border-t-4 border-blue-500',
        headerBg: 'bg-blue-500/5 dark:bg-blue-950/20',
        hoverRow: 'hover:bg-blue-50/80 dark:hover:bg-blue-950/30',
        hoverCell: 'group-hover:bg-blue-50/80 dark:group-hover:bg-blue-950/30',
        totalRevCol: 'text-blue-950 bg-blue-50/80 group-hover:bg-blue-100/80 dark:bg-zinc-800/60 dark:text-blue-200 dark:group-hover:bg-blue-950/60 font-black',
        totalRowBg: 'bg-blue-600',
        totalRowHover: 'hover:bg-blue-700',
        totalRowText: '!text-white font-bold',
        totalRowBorder: 'border-t-2 border-blue-500',
        footerBg: 'bg-blue-600 !text-white',
        footerStickyDate: 'bg-blue-600 !text-white',
        footerGrandTotal: 'bg-blue-600 !text-white',
        footerSubTotal: 'bg-blue-600 !text-white',
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
    theme: {
      solidBg: 'bg-emerald-600',
      solidHover: 'hover:bg-emerald-700',
      accentText: 'text-emerald-600 dark:text-emerald-400 font-bold',
      pillBg: 'bg-emerald-500/10 text-emerald-600 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-800/40',
      activeBg: 'bg-emerald-50 text-emerald-600 shadow-2xs border-r-4 border-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-400 font-bold',
      activeIconBg: 'bg-emerald-500/15 text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-400',
      activeBadge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
      borderAccent: 'border-emerald-500 dark:border-emerald-400',
      borderTop: 'border-t-2 border-emerald-500 dark:border-emerald-400',
      iconBox: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400',
      badgeBg: 'bg-emerald-100/80 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
      bannerGradient: 'bg-gradient-to-l from-emerald-500/15 via-emerald-500/5 to-transparent dark:from-emerald-500/20 dark:via-emerald-950/40 dark:to-slate-900/60 border-emerald-500/30',
      btnPrimary: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm font-semibold',
      btnActive: 'bg-emerald-600 text-white shadow-sm font-bold',
      badgeSolid: 'bg-emerald-600 text-white',
      checkboxActive: 'border-emerald-600 bg-emerald-600 text-white dark:border-emerald-500 dark:bg-emerald-500',
      chartHex: '#059669',
      kpiCard: {
        cardBorder: 'border-emerald-200/80 dark:border-emerald-900/40',
        cardBg: 'bg-emerald-50/50 dark:bg-emerald-950/20',
        cardRing: 'ring-emerald-500/10 dark:ring-emerald-400/10',
        cardHover: 'hover:border-emerald-300 dark:hover:border-emerald-700',
        badge: 'bg-emerald-100/80 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
        divider: 'border-emerald-100/80 dark:border-emerald-900/30',
      },
      matrix: {
        topBorder: 'border-t-4 border-emerald-500',
        headerBg: 'bg-emerald-500/5 dark:bg-emerald-950/20',
        hoverRow: 'hover:bg-emerald-50/80 dark:hover:bg-emerald-950/30',
        hoverCell: 'group-hover:bg-emerald-50/80 dark:group-hover:bg-emerald-950/30',
        totalRevCol: 'text-emerald-950 bg-emerald-50/80 group-hover:bg-emerald-100/80 dark:bg-zinc-800/60 dark:text-emerald-200 dark:group-hover:bg-emerald-950/60 font-black',
        totalRowBg: 'bg-emerald-600',
        totalRowHover: 'hover:bg-emerald-700',
        totalRowText: '!text-white font-bold',
        totalRowBorder: 'border-t-2 border-emerald-500',
        footerBg: 'bg-emerald-600 !text-white',
        footerStickyDate: 'bg-emerald-600 !text-white',
        footerGrandTotal: 'bg-emerald-600 !text-white',
        footerSubTotal: 'bg-emerald-600 !text-white',
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
    theme: {
      solidBg: 'bg-amber-600',
      solidHover: 'hover:bg-amber-700',
      accentText: 'text-amber-600 dark:text-amber-400 font-bold',
      pillBg: 'bg-amber-500/10 text-amber-600 border border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-800/40',
      activeBg: 'bg-amber-50 text-amber-600 shadow-2xs border-r-4 border-amber-500 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-400 font-bold',
      activeIconBg: 'bg-amber-500/15 text-amber-600 dark:bg-amber-400/20 dark:text-amber-400',
      activeBadge: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
      borderAccent: 'border-amber-500 dark:border-amber-400',
      borderTop: 'border-t-2 border-amber-500 dark:border-amber-400',
      iconBox: 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400',
      badgeBg: 'bg-amber-100/80 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
      bannerGradient: 'bg-gradient-to-l from-amber-500/15 via-amber-500/5 to-transparent dark:from-amber-500/20 dark:via-amber-950/40 dark:to-slate-900/60 border-amber-500/30',
      btnPrimary: 'bg-amber-600 hover:bg-amber-700 text-white shadow-sm font-semibold',
      btnActive: 'bg-amber-600 text-white shadow-sm font-bold',
      badgeSolid: 'bg-amber-600 text-white',
      checkboxActive: 'border-amber-600 bg-amber-600 text-white dark:border-amber-500 dark:bg-amber-500',
      chartHex: '#D97706',
      kpiCard: {
        cardBorder: 'border-amber-200/80 dark:border-amber-900/40',
        cardBg: 'bg-amber-50/50 dark:bg-amber-950/20',
        cardRing: 'ring-amber-500/10 dark:ring-amber-400/10',
        cardHover: 'hover:border-amber-300 dark:hover:border-amber-700',
        badge: 'bg-amber-100/80 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
        divider: 'border-amber-100/80 dark:border-amber-900/30',
      },
      matrix: {
        topBorder: 'border-t-4 border-amber-500',
        headerBg: 'bg-amber-500/5 dark:bg-amber-950/20',
        hoverRow: 'hover:bg-amber-50/80 dark:hover:bg-amber-950/30',
        hoverCell: 'group-hover:bg-amber-50/80 dark:group-hover:bg-amber-950/30',
        totalRevCol: 'text-amber-950 bg-amber-50/80 group-hover:bg-amber-100/80 dark:bg-zinc-800/60 dark:text-amber-200 dark:group-hover:bg-amber-950/60 font-black',
        totalRowBg: 'bg-amber-600',
        totalRowHover: 'hover:bg-amber-700',
        totalRowText: '!text-white font-bold',
        totalRowBorder: 'border-t-2 border-amber-500',
        footerBg: 'bg-amber-600 !text-white',
        footerStickyDate: 'bg-amber-600 !text-white',
        footerGrandTotal: 'bg-amber-600 !text-white',
        footerSubTotal: 'bg-amber-600 !text-white',
      },
      excel: {
        tabColor: 'FFD97706',
        titleColor: 'FF78350F',
        headerFill: 'FFFEF3C7',
        footerFill: 'FFFDE68A',
        footerFont: 'FF78350F',
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
