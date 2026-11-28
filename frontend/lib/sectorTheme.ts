/**
 * @file sectorTheme.ts
 * @description Single Source of Truth for Dream Park Sector Visual Identity System.
 * Maps all 6 operational sectors (Branchs.Type 1 through 6) with signature color palettes
 * and complete literal Tailwind class sets for every UI slot.
 *
 * STRICT RULE: NO dynamic Tailwind string concatenation (`bg-${color}-600`).
 * Every class name must be complete and literal for Tailwind JIT scanning.
 */

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
  progressBar: string;
  tableRowHover: string;

  // Unified Interactive Slots
  primaryBtn: string;
  activeTab: string;
  activeToggle: string;
  activePreset: string;
  sidebarActiveBg: string;

  // Calendar Tokens (FinancialDatePicker)
  calendarActiveTrigger: string;
  calendarIconBg: string;
  calendarSelectedDay: string;
  calendarRangeBg: string;
  calendarTodayRing: string;
  calendarAccentText: string;
  calendarFocusRing: string;

  // KPI Card Tokens
  kpiCardBorder: string;
  kpiCardBg: string;
  kpiIconBg: string;
  kpiAccentText: string;
  kpiHighlightBadge: string;
  kpiCard: {
    cardBorder: string;
    cardBg: string;
    cardRing: string;
    cardHover: string;
    badge: string;
    divider: string;
  };

  // Matrix Table Tokens
  tableHeaderBg: string;
  tableSubHeaderBg: string;
  tableTotalHighlight: string;
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

export const SECTOR_THEMES: Record<number, SectorTheme> = {
  // ---------------------------------------------------------------------------
  // Type 1 — المطاعم (Restaurants): Rose / Pink
  // ---------------------------------------------------------------------------
  1: {
    solidBg: 'bg-[#881337]',
    solidHover: 'hover:bg-[#9f1239]',
    accentText: 'text-[#881337] dark:text-rose-400 font-bold',
    pillBg: 'bg-rose-900/10 text-[#881337] border border-rose-300 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-800/40',
    activeBg: 'bg-rose-50 text-[#881337] shadow-2xs border-r-4 border-[#881337] dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-400 font-bold',
    activeIconBg: 'bg-rose-900/15 text-[#881337] dark:bg-rose-900/30 dark:text-rose-400',
    activeBadge: 'bg-rose-100 text-[#881337] dark:bg-rose-950/60 dark:text-rose-300',
    borderAccent: 'border-[#881337] dark:border-rose-400',
    borderTop: 'border-t-2 border-[#881337] dark:border-rose-400',
    iconBox: 'bg-rose-900/10 text-[#881337] dark:bg-rose-900/20 dark:text-rose-400',
    badgeBg: 'bg-rose-100/80 text-[#881337] dark:bg-rose-900/40 dark:text-rose-300',
    bannerGradient: 'bg-gradient-to-l from-rose-900/15 via-rose-900/5 to-transparent dark:from-rose-950/40 dark:via-rose-950/20 dark:to-slate-900/60 border-rose-900/30',
    btnPrimary: 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm font-semibold active:scale-95',
    btnActive: 'bg-rose-600 text-white shadow-sm font-bold',
    badgeSolid: 'bg-rose-600 text-white',
    checkboxActive: 'border-rose-600 bg-rose-600 text-white dark:border-rose-700 dark:bg-rose-700',
    chartHex: '#E11D48',
    progressBar: 'bg-rose-600 dark:bg-rose-500',
    tableRowHover: 'hover:bg-rose-50/70 dark:hover:bg-rose-950/30',

    // Unified Slots
    primaryBtn: 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm font-semibold active:scale-95',
    activeTab: 'bg-rose-600 text-white shadow-sm font-bold',
    activeToggle: 'bg-rose-600 text-white shadow-xs font-bold',
    activePreset: 'bg-rose-600 text-white shadow-xs font-bold',
    sidebarActiveBg: 'bg-rose-600 text-white shadow-lg shadow-rose-500/35 ring-1 ring-rose-400/50 font-bold',

    // Calendar Tokens
    calendarActiveTrigger: 'border-[#881337] bg-rose-50/80 text-[#881337] ring-2 ring-rose-500/20 dark:border-rose-400 dark:bg-zinc-900 dark:text-rose-200',
    calendarIconBg: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
    calendarSelectedDay: 'bg-rose-600 text-white font-bold shadow-xs hover:bg-rose-700',
    calendarRangeBg: 'bg-rose-50/70 text-rose-950 dark:bg-rose-950/30 dark:text-rose-200 font-medium',
    calendarTodayRing: 'bg-rose-500',
    calendarAccentText: 'text-rose-600 dark:text-rose-400 font-bold',
    calendarFocusRing: 'focus:border-rose-500 focus:ring-1 focus:ring-rose-500',

    // KPI Card Tokens
    kpiCardBorder: 'border-rose-200/80 dark:border-rose-900/40',
    kpiCardBg: 'bg-rose-50/50 dark:bg-rose-950/20',
    kpiIconBg: 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400',
    kpiAccentText: 'text-rose-600 dark:text-rose-400 font-bold',
    kpiHighlightBadge: 'bg-rose-100/80 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 font-semibold',
    kpiCard: {
      cardBorder: 'border-rose-200/80 dark:border-rose-900/40',
      cardBg: 'bg-rose-50/50 dark:bg-rose-950/20',
      cardRing: 'ring-rose-900/10 dark:ring-rose-400/10',
      cardHover: 'hover:border-rose-400 dark:hover:border-rose-700',
      badge: 'bg-rose-100/80 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
      divider: 'border-rose-100/80 dark:border-rose-900/30',
    },

    // Matrix Table Tokens
    tableHeaderBg: 'bg-[#881337] text-white',
    tableSubHeaderBg: 'bg-[#70102e] text-white',
    tableTotalHighlight: 'bg-rose-200/75 text-rose-950 dark:bg-rose-500/25 dark:text-rose-100 font-bold',
    matrix: {
      topBorder: 'border-t-4 border-[#881337]',
      headerBg: 'bg-[#881337]',
      hoverRow: 'hover:bg-rose-50/40 dark:hover:bg-rose-950/20',
      hoverCell: 'group-hover:bg-rose-50/40 dark:group-hover:bg-rose-950/20',
      totalRevCol: 'text-rose-950 bg-rose-50/80 group-hover:bg-rose-100/80 dark:bg-zinc-800/60 dark:text-rose-200 dark:group-hover:bg-rose-950/60 font-black',
      totalRowBg: 'bg-[#4c0519]',
      totalRowHover: 'hover:bg-[#5c0720]',
      totalRowText: '!text-white font-bold',
      totalRowBorder: 'border-t-2 border-[#881337]',
      footerBg: 'bg-[#4c0519] !text-white',
      footerStickyDate: 'bg-[#4c0519] !text-white',
      footerGrandTotal: 'bg-[#4c0519] !text-white',
      footerSubTotal: 'bg-[#4c0519] !text-white',
    },
    excel: {
      tabColor: 'FFE11D48',
      titleColor: 'FF4C0519',
      headerFill: 'FF881337',
      footerFill: 'FF4C0519',
      footerFont: 'FFFFFFFF',
    },
  },

  // ---------------------------------------------------------------------------
  // Type 2 — الألعاب الكبرى (Paid Rides): Orange
  // ---------------------------------------------------------------------------
  2: {
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
    btnPrimary: 'bg-orange-600 hover:bg-orange-700 text-white shadow-sm font-semibold active:scale-95',
    btnActive: 'bg-orange-600 text-white shadow-sm font-bold',
    badgeSolid: 'bg-orange-600 text-white',
    checkboxActive: 'border-orange-600 bg-orange-600 text-white dark:border-orange-500 dark:bg-orange-500',
    chartHex: '#EA580C',
    progressBar: 'bg-orange-600 dark:bg-orange-500',
    tableRowHover: 'hover:bg-orange-50/70 dark:hover:bg-orange-950/30',

    // Unified Slots
    primaryBtn: 'bg-orange-600 hover:bg-orange-700 text-white shadow-sm font-semibold active:scale-95',
    activeTab: 'bg-orange-600 text-white shadow-sm font-bold',
    activeToggle: 'bg-orange-600 text-white shadow-xs font-bold',
    activePreset: 'bg-orange-600 text-white shadow-xs font-bold',
    sidebarActiveBg: 'bg-orange-600 text-white shadow-lg shadow-orange-500/35 ring-1 ring-orange-400/50 font-bold',

    // Calendar Tokens
    calendarActiveTrigger: 'border-orange-500 bg-orange-50/80 text-orange-950 ring-2 ring-orange-500/20 dark:border-orange-400 dark:bg-zinc-900 dark:text-orange-200',
    calendarIconBg: 'bg-orange-500/15 text-orange-700 dark:text-orange-300',
    calendarSelectedDay: 'bg-orange-600 text-white font-bold shadow-xs hover:bg-orange-700',
    calendarRangeBg: 'bg-orange-50/70 text-orange-950 dark:bg-orange-500/10 dark:text-orange-200 font-medium',
    calendarTodayRing: 'bg-orange-500',
    calendarAccentText: 'text-orange-600 dark:text-orange-400 font-bold',
    calendarFocusRing: 'focus:border-orange-500 focus:ring-1 focus:ring-orange-500',

    // KPI Card Tokens
    kpiCardBorder: 'border-orange-200/80 dark:border-orange-900/40',
    kpiCardBg: 'bg-orange-50/50 dark:bg-orange-950/20',
    kpiIconBg: 'bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400',
    kpiAccentText: 'text-orange-600 dark:text-orange-400 font-bold',
    kpiHighlightBadge: 'bg-orange-100/80 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 font-semibold',
    kpiCard: {
      cardBorder: 'border-orange-200/80 dark:border-orange-900/40',
      cardBg: 'bg-orange-50/50 dark:bg-orange-950/20',
      cardRing: 'ring-orange-500/10 dark:ring-orange-400/10',
      cardHover: 'hover:border-orange-300 dark:hover:border-orange-700',
      badge: 'bg-orange-100/80 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
      divider: 'border-orange-100/80 dark:border-orange-900/30',
    },

    // Matrix Table Tokens
    tableHeaderBg: 'bg-orange-600 text-white',
    tableSubHeaderBg: 'bg-orange-700 text-white',
    tableTotalHighlight: 'bg-orange-100 text-orange-950 dark:bg-orange-950/60 dark:text-orange-200 font-bold',
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

  // ---------------------------------------------------------------------------
  // Type 3 — الفيديو جيم والـ VR (Video Games & VR): Purple / Violet
  // ---------------------------------------------------------------------------
  3: {
    solidBg: 'bg-purple-700',
    solidHover: 'hover:bg-purple-800',
    accentText: 'text-purple-600 dark:text-purple-400 font-bold',
    pillBg: 'bg-purple-500/10 text-purple-600 border border-purple-200 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-800/40',
    activeBg: 'bg-purple-50 text-purple-600 shadow-2xs border-r-4 border-purple-500 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-400 font-bold',
    activeIconBg: 'bg-purple-500/15 text-purple-600 dark:bg-purple-400/20 dark:text-purple-400',
    activeBadge: 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300',
    borderAccent: 'border-purple-500 dark:border-purple-400',
    borderTop: 'border-t-2 border-purple-500 dark:border-purple-400',
    iconBox: 'bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400',
    badgeBg: 'bg-purple-100/80 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
    bannerGradient: 'bg-gradient-to-l from-purple-500/15 via-purple-500/5 to-transparent dark:from-purple-500/20 dark:via-purple-950/40 dark:to-slate-900/60 border-purple-500/30',
    btnPrimary: 'bg-purple-600 hover:bg-purple-700 text-white shadow-sm font-semibold active:scale-95',
    btnActive: 'bg-purple-600 text-white shadow-sm font-bold',
    badgeSolid: 'bg-purple-600 text-white',
    checkboxActive: 'border-purple-600 bg-purple-600 text-white dark:border-purple-500 dark:bg-purple-500',
    chartHex: '#9333EA',
    progressBar: 'bg-purple-600 dark:bg-purple-500',
    tableRowHover: 'hover:bg-purple-50/70 dark:hover:bg-purple-950/30',

    // Unified Slots
    primaryBtn: 'bg-purple-600 hover:bg-purple-700 text-white shadow-sm font-semibold active:scale-95',
    activeTab: 'bg-purple-600 text-white shadow-sm font-bold',
    activeToggle: 'bg-purple-600 text-white shadow-xs font-bold',
    activePreset: 'bg-purple-600 text-white shadow-xs font-bold',
    sidebarActiveBg: 'bg-purple-600 text-white shadow-lg shadow-purple-500/35 ring-1 ring-purple-400/50 font-bold',

    // Calendar Tokens
    calendarActiveTrigger: 'border-purple-700 bg-purple-50/80 text-purple-950 ring-2 ring-purple-500/20 dark:border-purple-500 dark:bg-zinc-900 dark:text-purple-200',
    calendarIconBg: 'bg-purple-500/15 text-purple-700 dark:text-purple-300',
    calendarSelectedDay: 'bg-purple-600 text-white font-bold shadow-xs hover:bg-purple-700',
    calendarRangeBg: 'bg-purple-50/70 text-purple-950 dark:bg-purple-950/30 dark:text-purple-200 font-medium',
    calendarTodayRing: 'bg-purple-500',
    calendarAccentText: 'text-purple-600 dark:text-purple-400 font-bold',
    calendarFocusRing: 'focus:border-purple-500 focus:ring-1 focus:ring-purple-500',

    // KPI Card Tokens
    kpiCardBorder: 'border-purple-200/80 dark:border-purple-900/40',
    kpiCardBg: 'bg-purple-50/50 dark:bg-purple-950/20',
    kpiIconBg: 'bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400',
    kpiAccentText: 'text-purple-600 dark:text-purple-400 font-bold',
    kpiHighlightBadge: 'bg-purple-100/80 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 font-semibold',
    kpiCard: {
      cardBorder: 'border-purple-200/80 dark:border-purple-900/40',
      cardBg: 'bg-purple-50/50 dark:bg-purple-950/20',
      cardRing: 'ring-purple-500/10 dark:ring-purple-400/10',
      cardHover: 'hover:border-purple-300 dark:hover:border-purple-700',
      badge: 'bg-purple-100/80 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
      divider: 'border-purple-100/80 dark:border-purple-900/30',
    },

    // Matrix Table Tokens
    tableHeaderBg: 'bg-purple-700 text-white',
    tableSubHeaderBg: 'bg-purple-800 text-white',
    tableTotalHighlight: 'bg-purple-100 text-purple-950 dark:bg-purple-950/60 dark:text-purple-200 font-bold',
    matrix: {
      topBorder: 'border-t-4 border-purple-500',
      headerBg: 'bg-purple-500/5 dark:bg-purple-950/20',
      hoverRow: 'hover:bg-purple-50/80 dark:hover:bg-purple-950/30',
      hoverCell: 'group-hover:bg-purple-50/80 dark:group-hover:bg-purple-950/30',
      totalRevCol: 'text-purple-950 bg-purple-50/80 group-hover:bg-purple-100/80 dark:bg-zinc-800/60 dark:text-purple-200 dark:group-hover:bg-purple-950/60 font-black',
      totalRowBg: 'bg-purple-700',
      totalRowHover: 'hover:bg-purple-800',
      totalRowText: '!text-white font-bold',
      totalRowBorder: 'border-t-2 border-purple-500',
      footerBg: 'bg-purple-700 !text-white',
      footerStickyDate: 'bg-purple-700 !text-white',
      footerGrandTotal: 'bg-purple-700 !text-white',
      footerSubTotal: 'bg-purple-700 !text-white',
    },
    excel: {
      tabColor: 'FF8B5CF6',
      titleColor: 'FF5B21B6',
      headerFill: 'FFF3E8FF',
      footerFill: 'FFD8B4FE',
      footerFont: 'FF4C1D95',
    },
  },

  // ---------------------------------------------------------------------------
  // Type 4 — الكرافانات والمحلات (Caravans): Blue
  // ---------------------------------------------------------------------------
  4: {
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
    btnPrimary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm font-semibold active:scale-95',
    btnActive: 'bg-blue-600 text-white shadow-sm font-bold',
    badgeSolid: 'bg-blue-600 text-white',
    checkboxActive: 'border-blue-600 bg-blue-600 text-white dark:border-blue-500 dark:bg-blue-500',
    chartHex: '#2563EB',
    progressBar: 'bg-blue-600 dark:bg-blue-500',
    tableRowHover: 'hover:bg-blue-50/70 dark:hover:bg-blue-950/30',

    // Unified Slots
    primaryBtn: 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm font-semibold active:scale-95',
    activeTab: 'bg-blue-600 text-white shadow-sm font-bold',
    activeToggle: 'bg-blue-600 text-white shadow-xs font-bold',
    activePreset: 'bg-blue-600 text-white shadow-xs font-bold',
    sidebarActiveBg: 'bg-blue-600 text-white shadow-lg shadow-blue-500/35 ring-1 ring-blue-400/50 font-bold',

    // Calendar Tokens
    calendarActiveTrigger: 'border-blue-500 bg-blue-50/80 text-blue-950 ring-2 ring-blue-500/20 dark:border-blue-400 dark:bg-zinc-900 dark:text-blue-200',
    calendarIconBg: 'bg-blue-500/15 text-blue-700 dark:text-blue-300',
    calendarSelectedDay: 'bg-blue-600 text-white font-bold shadow-xs hover:bg-blue-700',
    calendarRangeBg: 'bg-blue-50/70 text-blue-950 dark:bg-blue-950/30 dark:text-blue-200 font-medium',
    calendarTodayRing: 'bg-blue-500',
    calendarAccentText: 'text-blue-600 dark:text-blue-400 font-bold',
    calendarFocusRing: 'focus:border-blue-500 focus:ring-1 focus:ring-blue-500',

    // KPI Card Tokens
    kpiCardBorder: 'border-blue-200/80 dark:border-blue-900/40',
    kpiCardBg: 'bg-blue-50/50 dark:bg-blue-950/20',
    kpiIconBg: 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400',
    kpiAccentText: 'text-blue-600 dark:text-blue-400 font-bold',
    kpiHighlightBadge: 'bg-blue-100/80 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 font-semibold',
    kpiCard: {
      cardBorder: 'border-blue-200/80 dark:border-blue-900/40',
      cardBg: 'bg-blue-50/50 dark:bg-blue-950/20',
      cardRing: 'ring-blue-500/10 dark:ring-blue-400/10',
      cardHover: 'hover:border-blue-300 dark:hover:border-blue-700',
      badge: 'bg-blue-100/80 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
      divider: 'border-blue-100/80 dark:border-blue-900/30',
    },

    // Matrix Table Tokens
    tableHeaderBg: 'bg-blue-600 text-white',
    tableSubHeaderBg: 'bg-blue-700 text-white',
    tableTotalHighlight: 'bg-blue-100 text-blue-950 dark:bg-blue-950/60 dark:text-blue-200 font-bold',
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
      titleColor: 'FF1E40AF',
      headerFill: 'FFDBEAFE',
      footerFill: 'FF93C5FD',
      footerFont: 'FF1E3A8A',
    },
  },

  // ---------------------------------------------------------------------------
  // Type 5 — البوابات والتذاكر (Gates): Emerald / Green
  // ---------------------------------------------------------------------------
  5: {
    solidBg: 'bg-emerald-700',
    solidHover: 'hover:bg-emerald-800',
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
    btnPrimary: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm font-semibold active:scale-95',
    btnActive: 'bg-emerald-600 text-white shadow-sm font-bold',
    badgeSolid: 'bg-emerald-600 text-white',
    checkboxActive: 'border-emerald-600 bg-emerald-600 text-white dark:border-emerald-500 dark:bg-emerald-500',
    chartHex: '#059669',
    progressBar: 'bg-emerald-600 dark:bg-emerald-500',
    tableRowHover: 'hover:bg-emerald-50/70 dark:hover:bg-emerald-950/30',

    // Unified Slots
    primaryBtn: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm font-semibold active:scale-95',
    activeTab: 'bg-emerald-600 text-white shadow-sm font-bold',
    activeToggle: 'bg-emerald-600 text-white shadow-xs font-bold',
    activePreset: 'bg-emerald-600 text-white shadow-xs font-bold',
    sidebarActiveBg: 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/35 ring-1 ring-emerald-400/50 font-bold',

    // Calendar Tokens
    calendarActiveTrigger: 'border-emerald-500 bg-emerald-50/80 text-emerald-950 ring-2 ring-emerald-500/20 dark:border-emerald-400 dark:bg-zinc-900 dark:text-emerald-200',
    calendarIconBg: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
    calendarSelectedDay: 'bg-emerald-600 text-white font-bold shadow-xs hover:bg-emerald-700',
    calendarRangeBg: 'bg-emerald-50/70 text-emerald-950 dark:bg-emerald-950/30 dark:text-emerald-200 font-medium',
    calendarTodayRing: 'bg-emerald-500',
    calendarAccentText: 'text-emerald-600 dark:text-emerald-400 font-bold',
    calendarFocusRing: 'focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500',

    // KPI Card Tokens
    kpiCardBorder: 'border-emerald-200/80 dark:border-emerald-900/40',
    kpiCardBg: 'bg-emerald-50/50 dark:bg-emerald-950/20',
    kpiIconBg: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400',
    kpiAccentText: 'text-emerald-600 dark:text-emerald-400 font-bold',
    kpiHighlightBadge: 'bg-emerald-100/80 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 font-semibold',
    kpiCard: {
      cardBorder: 'border-emerald-200/80 dark:border-emerald-900/40',
      cardBg: 'bg-emerald-50/50 dark:bg-emerald-950/20',
      cardRing: 'ring-emerald-500/10 dark:ring-emerald-400/10',
      cardHover: 'hover:border-emerald-300 dark:hover:border-emerald-700',
      badge: 'bg-emerald-100/80 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
      divider: 'border-emerald-100/80 dark:border-emerald-900/30',
    },

    // Matrix Table Tokens
    tableHeaderBg: 'bg-[#064e3b] text-white',
    tableSubHeaderBg: 'bg-[#043427] text-white',
    tableTotalHighlight: 'bg-emerald-100 text-emerald-950 dark:bg-emerald-950/60 dark:text-emerald-200 font-bold',
    matrix: {
      topBorder: 'border-t-4 border-[#064e3b]',
      headerBg: 'bg-[#064e3b]',
      hoverRow: 'hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20',
      hoverCell: 'group-hover:bg-emerald-50/40 dark:group-hover:bg-emerald-950/20',
      totalRevCol: 'text-emerald-950 bg-emerald-50/80 group-hover:bg-emerald-100/80 dark:bg-zinc-800/60 dark:text-emerald-200 dark:group-hover:bg-emerald-950/60 font-black',
      totalRowBg: 'bg-[#064e3b]',
      totalRowHover: 'hover:bg-[#043427]',
      totalRowText: '!text-white font-bold',
      totalRowBorder: 'border-t-2 border-[#022c22]',
      footerBg: 'bg-[#064e3b] !text-white',
      footerStickyDate: 'bg-[#064e3b] !text-white',
      footerGrandTotal: 'bg-[#022c22] !text-white',
      footerSubTotal: 'bg-[#064e3b] !text-white',
    },
    excel: {
      tabColor: 'FF059669',
      titleColor: 'FF064E3B',
      headerFill: 'FFD1FAE5',
      footerFill: 'FF6EE7B7',
      footerFont: 'FF064E3B',
    },
  },

  // ---------------------------------------------------------------------------
  // Type 6 — الأمانات والانتظار (Parking & Lockers): Yellow / Gold
  // ---------------------------------------------------------------------------
  6: {
    solidBg: 'bg-yellow-500',
    solidHover: 'hover:bg-yellow-600',
    accentText: 'text-yellow-700 dark:text-yellow-400 font-bold',
    pillBg: 'bg-yellow-500/10 text-yellow-800 border border-yellow-300 dark:bg-yellow-500/20 dark:text-yellow-300 dark:border-yellow-700/40',
    activeBg: 'bg-yellow-50 text-slate-950 shadow-2xs border-r-4 border-yellow-500 dark:bg-yellow-500/10 dark:text-yellow-300 dark:border-yellow-400 font-bold',
    activeIconBg: 'bg-yellow-500/20 text-slate-950 dark:bg-yellow-400/25 dark:text-yellow-300',
    activeBadge: 'bg-yellow-100 text-yellow-900 dark:bg-yellow-950/60 dark:text-yellow-200',
    borderAccent: 'border-yellow-500 dark:border-yellow-400',
    borderTop: 'border-t-2 border-yellow-500 dark:border-yellow-400',
    iconBox: 'bg-yellow-500/15 text-yellow-800 dark:bg-yellow-500/25 dark:text-yellow-300',
    badgeBg: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
    bannerGradient: 'bg-gradient-to-l from-yellow-500/20 via-yellow-500/5 to-transparent dark:from-yellow-500/20 dark:via-yellow-950/40 dark:to-slate-900/60 border-yellow-500/40',
    btnPrimary: 'bg-yellow-500 hover:bg-yellow-600 text-slate-950 shadow-sm font-bold active:scale-95',
    btnActive: 'bg-yellow-500 text-slate-950 shadow-sm font-bold',
    badgeSolid: 'bg-yellow-500 text-slate-950 font-bold',
    checkboxActive: 'border-yellow-500 bg-yellow-500 text-slate-950 dark:border-yellow-400 dark:bg-yellow-400',
    chartHex: '#CA8A04',
    progressBar: 'bg-amber-500 dark:bg-amber-400',
    tableRowHover: 'hover:bg-amber-50/70 dark:hover:bg-amber-950/30',

    // Unified Slots (High-contrast text-slate-950 on bright yellow)
    primaryBtn: 'bg-yellow-500 hover:bg-yellow-600 text-slate-950 shadow-sm font-bold active:scale-95',
    activeTab: 'bg-yellow-500 text-slate-950 shadow-sm font-bold',
    activeToggle: 'bg-yellow-500 text-slate-950 shadow-xs font-bold',
    activePreset: 'bg-yellow-500 text-slate-950 shadow-xs font-bold',
    sidebarActiveBg: 'bg-yellow-500 text-slate-950 shadow-lg shadow-yellow-500/35 ring-1 ring-yellow-300/60 font-bold',

    // Calendar Tokens
    calendarActiveTrigger: 'border-yellow-500 bg-yellow-50/80 text-yellow-950 ring-2 ring-yellow-500/20 dark:border-yellow-400 dark:bg-zinc-900 dark:text-yellow-200',
    calendarIconBg: 'bg-yellow-500/15 text-yellow-800 dark:text-yellow-300',
    calendarSelectedDay: 'bg-yellow-500 text-slate-950 font-bold shadow-xs hover:bg-yellow-600',
    calendarRangeBg: 'bg-yellow-50/80 text-yellow-950 dark:bg-yellow-950/30 dark:text-yellow-200 font-medium',
    calendarTodayRing: 'bg-yellow-500',
    calendarAccentText: 'text-yellow-700 dark:text-yellow-400 font-bold',
    calendarFocusRing: 'focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500',

    // KPI Card Tokens
    kpiCardBorder: 'border-yellow-200/80 dark:border-yellow-800/40',
    kpiCardBg: 'bg-yellow-50/50 dark:bg-yellow-950/20',
    kpiIconBg: 'bg-yellow-500/15 text-yellow-800 dark:bg-yellow-500/25 dark:text-yellow-300',
    kpiAccentText: 'text-yellow-700 dark:text-yellow-400 font-bold',
    kpiHighlightBadge: 'bg-yellow-100 text-yellow-900 dark:bg-yellow-900/40 dark:text-yellow-200 font-semibold',
    kpiCard: {
      cardBorder: 'border-yellow-200/80 dark:border-yellow-800/40',
      cardBg: 'bg-yellow-50/50 dark:bg-yellow-950/20',
      cardRing: 'ring-yellow-500/10 dark:ring-yellow-400/10',
      cardHover: 'hover:border-yellow-400 dark:hover:border-yellow-600',
      badge: 'bg-yellow-100 text-yellow-900 dark:bg-yellow-900/40 dark:text-yellow-200',
      divider: 'border-yellow-200/80 dark:border-yellow-900/30',
    },

    // Matrix Table Tokens
    tableHeaderBg: 'bg-yellow-600 text-white dark:bg-yellow-500 dark:text-slate-950',
    tableSubHeaderBg: 'bg-yellow-700 text-white dark:bg-yellow-600 dark:text-slate-950',
    tableTotalHighlight: 'bg-yellow-100 text-yellow-950 dark:bg-yellow-950/60 dark:text-yellow-200 font-bold',
    matrix: {
      topBorder: 'border-t-4 border-yellow-600 dark:border-yellow-500',
      headerBg: 'bg-yellow-600 text-white dark:bg-yellow-500 dark:text-slate-950',
      hoverRow: 'hover:bg-yellow-50/80 dark:hover:bg-yellow-950/30',
      hoverCell: 'group-hover:bg-yellow-50/80 dark:group-hover:bg-yellow-950/30',
      totalRevCol: 'text-yellow-950 bg-yellow-50/80 group-hover:bg-yellow-100/80 dark:bg-zinc-800/60 dark:text-yellow-200 dark:group-hover:bg-yellow-950/60 font-black',
      totalRowBg: 'bg-yellow-600 dark:bg-yellow-500',
      totalRowHover: 'hover:bg-yellow-700 dark:hover:bg-yellow-600',
      totalRowText: '!text-white dark:!text-slate-950 font-bold',
      totalRowBorder: 'border-t-2 border-yellow-600 dark:border-yellow-500',
      footerBg: 'bg-yellow-600 !text-white dark:bg-yellow-500 dark:!text-slate-950',
      footerStickyDate: 'bg-yellow-600 !text-white dark:bg-yellow-500 dark:!text-slate-950',
      footerGrandTotal: 'bg-yellow-600 !text-white dark:bg-yellow-500 dark:!text-slate-950',
      footerSubTotal: 'bg-yellow-600 !text-white dark:bg-yellow-500 dark:!text-slate-950',
    },
    excel: {
      tabColor: 'FFCA8A04',
      titleColor: 'FF854D0E',
      headerFill: 'FFFEFCE8',
      footerFill: 'FFCA8A04',
      footerFont: 'FFFFFFFF',
    },
  },
};

/**
 * Get sector theme by sector type (Branchs.Type: 1 through 6).
 * Default fallback is Type 4 (Caravans / Blue).
 */
export function getSectorTheme(sectorType?: number): SectorTheme {
  const type = Number(sectorType) || 4;
  return SECTOR_THEMES[type] || SECTOR_THEMES[4];
}

export interface SectorAnalyticsCopy {
  rankingsTitle: string;
  rankingsSubtitle: string;
  topSellersTitle: string;
  slowMovingTitle: string;
  duelTitle: string;
  duelSubtitle: string;
  duelShareFootnote: string;
  distributionTitle: string;
  outletEfficiencyTitle: string;
  outletEfficiencySubtitle: string;
  netOutletRevLabel: string;
  unitLabel: string;
  volumeUnit: string;
  entityLabel: string;
}

export const SECTOR_ANALYTICS_COPY: Record<number, SectorAnalyticsCopy> = {
  1: {
    rankingsTitle: 'ترتيب المطاعم',
    rankingsSubtitle: 'أعلى المطاعم إيراداً خلال الفترة',
    topSellersTitle: 'الأصناف الأكثر مبيعاً في المطاعم',
    slowMovingTitle: 'الأصناف الأقل حركة',
    duelTitle: 'مواجهة المطعمين المتصدرين',
    duelSubtitle: 'أعلى مطعمين إيراداً خلال الفترة',
    duelShareFootnote: 'حصة كل مطعم من إجمالي الاثنين',
    distributionTitle: 'توزيع المأكولات والمشروبات',
    outletEfficiencyTitle: 'كفاءة تشغيل المطاعم',
    outletEfficiencySubtitle: 'معدل المبيعات لكل مطعم نشط',
    netOutletRevLabel: 'صافي إيراد المطاعم',
    unitLabel: 'طلب / وجبة',
    volumeUnit: 'وجبة',
    entityLabel: 'مطعم',
  },
  2: {
    rankingsTitle: 'ترتيب الألعاب الكبرى',
    rankingsSubtitle: 'أعلى الألعاب تحقيقاً للإيراد',
    topSellersTitle: 'التذاكر والألعاب الأكثر إقبالاً',
    slowMovingTitle: 'الألعاب الأقل حركة',
    duelTitle: 'مواجهة اللعبتين الأكثر طلباً',
    duelSubtitle: 'أعلى لعبتين إيراداً خلال الفترة',
    duelShareFootnote: 'حصة كل لعبة من إجمالي اللعبتين',
    distributionTitle: 'توزيع إيرادات الألعاب الكبرى',
    outletEfficiencyTitle: 'كفاءة تشغيل نقاط الألعاب',
    outletEfficiencySubtitle: 'معدل الإيراد لكل نقطة تشغيل نشطة',
    netOutletRevLabel: 'صافي إيراد الألعاب الكبرى',
    unitLabel: 'تذكرة / راكب',
    volumeUnit: 'تذكرة',
    entityLabel: 'لعبة',
  },
  3: {
    rankingsTitle: 'ترتيب ألعاب الفيديو جيم والـ VR',
    rankingsSubtitle: 'أعلى ألعاب الـ VR والأركيد إيراداً',
    topSellersTitle: 'التذاكر والكوبونات الأكثر مبيعاً',
    slowMovingTitle: 'الألعاب الأقل تشغيلاً',
    duelTitle: 'مواجهة الصالتين / النقطتين المتصدرتين',
    duelSubtitle: 'أعلى نقطتي تشغيل إيراداً خلال الفترة',
    duelShareFootnote: 'حصة كل طرف من إجمالي المتصدرين',
    distributionTitle: 'توزيع إيرادات صالات الألعاب والـ VR',
    outletEfficiencyTitle: 'كفاءة تشغيل نقاط الألعاب والمحاكيات',
    outletEfficiencySubtitle: 'معدل الإيراد لكل نقطة تشغيل نشطة',
    netOutletRevLabel: 'صافي إيراد صالات الألعاب والـ VR',
    unitLabel: 'كوبون / لعبة',
    volumeUnit: 'تذكرة',
    entityLabel: 'صالة / نقطة',
  },
  4: {
    rankingsTitle: 'ترتيب الكرافانات والمحلات',
    rankingsSubtitle: 'أعلى المنافذ مبيعاً خلال الفترة',
    topSellersTitle: 'الأصناف الأكثر مبيعاً في الكرافانات',
    slowMovingTitle: 'الأصناف الراكدة',
    duelTitle: 'مواجهة المنفذين المتصدرين',
    duelSubtitle: 'أعلى منفذين إيراداً خلال الفترة',
    duelShareFootnote: 'حصة كل منفذ من إجمالي المنفذين',
    distributionTitle: 'توزيع مبيعات الكرافانات والمحلات',
    outletEfficiencyTitle: 'كفاءة تشغيل المنافذ',
    outletEfficiencySubtitle: 'معدل المبيعات لكل منفذ نشط',
    netOutletRevLabel: 'صافي إيراد الكرافانات والمحلات',
    unitLabel: 'قطعة / وحدة',
    volumeUnit: 'قطعة',
    entityLabel: 'منفذ / محل',
  },
  5: {
    rankingsTitle: 'ترتيب فئات التذاكر وقنوات البيع',
    rankingsSubtitle: 'التذاكر الأكثر مبيعاً وإقبالاً',
    topSellersTitle: 'فئات التذاكر الأكثر مبيعاً',
    slowMovingTitle: 'فئات التذاكر الأقل طلباً',
    duelTitle: 'مقارنة القناتين / الفئتين المتصدرتين',
    duelSubtitle: 'أعلى بوابتين / فئتين إيراداً خلال الفترة',
    duelShareFootnote: 'حصة كل بوابة / فئة من الإجمالي',
    distributionTitle: 'حركة الزوار والبوابات',
    outletEfficiencyTitle: 'كفاءة بوابات الدخول',
    outletEfficiencySubtitle: 'معدل الإيراد لكل بوابة نشطة',
    netOutletRevLabel: 'صافي إيراد التذاكر والبوابات',
    unitLabel: 'تذكرة',
    volumeUnit: 'تذكرة',
    entityLabel: 'بوابة / قناة',
  },
  6: {
    rankingsTitle: 'توزيع خدمات الانتظار والأمانات',
    rankingsSubtitle: 'الأكثر استخداماً (ملاكي / باصات / ماسك / أمانات)',
    topSellersTitle: 'خدمات الانتظار والأمانات الأكثر إيراداً',
    slowMovingTitle: 'الخدمات الأقل استخداماً',
    duelTitle: 'مقارنة الخدمتين الأكثر استخداماً',
    duelSubtitle: 'أعلى خدمتين إيراداً خلال الفترة',
    duelShareFootnote: 'حصة كل خدمة من الإجمالي',
    distributionTitle: 'توزيع خدمات الانتظار وصناديق الأمانات',
    outletEfficiencyTitle: 'كفاءة تشغيل خدمات البارك والأمانات',
    outletEfficiencySubtitle: 'معدل الإيراد لكل منفذ خدمة نشط',
    netOutletRevLabel: 'صافي إيراد البارك والأمانات',
    unitLabel: 'سيارة / خدمة',
    volumeUnit: 'حركة',
    entityLabel: 'منفذ خدمة',
  },
};

export function getSectorAnalyticsCopy(sectorType?: number): SectorAnalyticsCopy {
  const type = Number(sectorType) || 4;
  return SECTOR_ANALYTICS_COPY[type] || SECTOR_ANALYTICS_COPY[4];
}
