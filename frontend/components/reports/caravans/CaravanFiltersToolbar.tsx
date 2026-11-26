'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Store, Check, Search, Filter, X, FileText } from 'lucide-react';
import type { BranchOption } from '@/types/reports';
import { FinancialDatePicker } from '@/components/ui/FinancialDatePicker';
import { Segmented } from '@/components/ui/Segmented';
import { getSectorTheme } from '@/config/sectorsConfig';

export type ViewMode = 'standard' | 'comparison';
export type Granularity = 'day' | 'month' | 'summary';
export type PresetId = 'today' | 'yesterday' | 'month' | 'quarter' | 'year' | 'custom';
export type CompPresetId = 'month_vs_last' | 'week_vs_last' | 'quarter_vs_last' | 'yoy' | 'custom';
export type FacilityType = 'all' | 'caravans' | 'shops';

export const CARAVAN_BRANCH_CODES = [
  '1003',
  '1004',
  '1005',
  '1006',
  '1007',
  '1008',
  '1010',
  '1015',
  '1018',
  '1027',
  '1030',
];

export const SHOP_BRANCH_CODES = ['1021', '1023', '1024', '1025', '1029'];

export const ALL_OUTLET_CODES = [...CARAVAN_BRANCH_CODES, ...SHOP_BRANCH_CODES];

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

const DEFAULT_BRANCH_NAMES: Record<string, string> = CARAVAN_DISPLAY_NAMES;

export const PRESETS: { id: Exclude<PresetId, 'custom'>; label: string }[] = [
  { id: 'yesterday', label: 'الأمس' },
  { id: 'today', label: 'اليوم' },
  { id: 'month', label: 'الشهر الحالي' },
  { id: 'quarter', label: 'الربع الحالي' },
  { id: 'year', label: 'السنة الحالية' },
];

export const COMP_PRESETS: { id: Exclude<CompPresetId, 'custom'>; label: string }[] = [
  { id: 'month_vs_last', label: 'الشهر الحالي vs السابق' },
  { id: 'week_vs_last', label: 'آخر 7 أيام vs السابقة' },
  { id: 'quarter_vs_last', label: 'الربع الحالي vs السابق' },
  { id: 'yoy', label: 'مقارنة سنوية (YoY)' },
];

export const GRANULARITIES: { id: Granularity; label: string }[] = [
  { id: 'summary', label: 'إجمالي الفترة' },
  { id: 'month', label: 'شهري' },
  { id: 'day', label: 'يومي' },
];

/* -------------------------------------------------------------------------- */
/*             Hybrid Dropdown (Sector Toggles + Granular Checkboxes)          */
/* -------------------------------------------------------------------------- */

interface HybridBranchFilterDropdownProps {
  sectorType?: number;
  sectorLabel?: string;
  facilityType: FacilityType;
  onFacilityTypeChange: (type: FacilityType) => void;
  options: BranchOption[];
  selectedBranches: string[];
  onChange: (branches: string[]) => void;
}

export function HybridBranchFilterDropdown({
  sectorType = 4,
  sectorLabel,
  facilityType,
  onFacilityTypeChange,
  options,
  selectedBranches,
  onChange,
}: HybridBranchFilterDropdownProps) {
  const theme = getSectorTheme(sectorType);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleOutsideClick);
      searchInputRef.current?.focus();
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  // Master list of all options strictly scoped to the active sector
  const allOutlets = useMemo<BranchOption[]>(() => {
    if (sectorType !== 4) {
      return options;
    }
    if (options.length > 0) {
      return options.map((opt) => ({
        Code: String(opt.Code),
        Name:
          opt.Name && opt.Name.trim()
            ? opt.Name.trim()
            : DEFAULT_BRANCH_NAMES[String(opt.Code)] || `منفذ ${opt.Code}`,
      }));
    }
    return ALL_OUTLET_CODES.map((code) => ({
      Code: code,
      Name: DEFAULT_BRANCH_NAMES[code] || `منفذ ${code}`,
    }));
  }, [options, sectorType]);

  // Check if a specific branch code is currently active
  const isBranchChecked = (code: string): boolean => {
    if (selectedBranches.length === 0) {
      if (sectorType === 4) {
        if (facilityType === 'caravans') return CARAVAN_BRANCH_CODES.includes(code);
        if (facilityType === 'shops') return SHOP_BRANCH_CODES.includes(code);
      }
      return true; // Default: All branches selected
    }
    return selectedBranches.includes(code);
  };

  // Compute checked count
  const checkedCount = useMemo(() => {
    return allOutlets.filter((o) => isBranchChecked(String(o.Code))).length;
  }, [allOutlets, selectedBranches, facilityType, sectorType]);

  // Dynamic Trigger Button Label
  const buttonLabel = useMemo(() => {
    if (sectorType === 2 || sectorType === 3) {
      if (selectedBranches.length === 0 || checkedCount === allOutlets.length) {
        return `كل الألعاب (${allOutlets.length} لعبة)`;
      }
      if (checkedCount === 1) {
        const single = allOutlets.find((o) => isBranchChecked(String(o.Code)));
        return single ? `${single.Name} (${single.Code})` : 'لعبة واحدة محددة';
      }
      return `تم تحديد ${checkedCount} من ${allOutlets.length} ألعاب`;
    }

    if (sectorType !== 4) {
      if (selectedBranches.length === 0 || checkedCount === allOutlets.length) {
        return `جميع منافذ ${sectorLabel || 'القطاع'}: الكل (${allOutlets.length} منفذ)`;
      }
      if (checkedCount === 1) {
        const single = allOutlets.find((o) => isBranchChecked(String(o.Code)));
        return single?.Name || 'منفذ واحد محدد';
      }
      return `تم تحديد ${checkedCount} من ${allOutlets.length} منافذ`;
    }

    if (facilityType === 'all' && (selectedBranches.length === 0 || checkedCount === allOutlets.length)) {
      return `الفروع والقطاعات: الكل (${allOutlets.length} منفذ)`;
    }
    if (facilityType === 'caravans') {
      if (checkedCount === CARAVAN_BRANCH_CODES.length) {
        return 'الكرفانات بالكامل (11 منافذ)';
      }
      return `الكرفانات (${checkedCount} من 10)`;
    }
    if (facilityType === 'shops') {
      if (checkedCount === SHOP_BRANCH_CODES.length) {
        return 'المحلات بالكامل (5 منافذ)';
      }
      return `المحلات (${checkedCount} من 5)`;
    }
    if (checkedCount === 1) {
      const single = allOutlets.find((o) => isBranchChecked(String(o.Code)));
      return single?.Name || 'منفذ واحد محدد';
    }
    return `تم تحديد ${checkedCount} منافذ`;
  }, [sectorType, sectorLabel, facilityType, selectedBranches, checkedCount, allOutlets]);

  // 1. Quick Sector Toggle in Section A (Caravans Only)
  const handleSectorToggle = (type: FacilityType) => {
    onFacilityTypeChange(type);
    if (type === 'all') {
      onChange([]);
    } else if (type === 'caravans') {
      onChange([...CARAVAN_BRANCH_CODES]);
    } else if (type === 'shops') {
      onChange([...SHOP_BRANCH_CODES]);
    }
  };

  // 2. Granular Checkbox Toggle in Section B
  const toggleBranch = (code: string) => {
    if (sectorType !== 4) {
      let nextChecked: string[];
      if (selectedBranches.length === 0) {
        nextChecked = allOutlets.map((o) => String(o.Code)).filter((c) => c !== code);
      } else if (selectedBranches.includes(code)) {
        nextChecked = selectedBranches.filter((c) => c !== code);
      } else {
        nextChecked = [...selectedBranches, code];
      }

      if (nextChecked.length === 0 || nextChecked.length === allOutlets.length) {
        onChange([]);
      } else {
        onChange(nextChecked);
      }
      return;
    }

    const currentChecked = allOutlets
      .map((o) => String(o.Code))
      .filter((c) => isBranchChecked(c));

    const nextChecked = currentChecked.includes(code)
      ? currentChecked.filter((c) => c !== code)
      : [...currentChecked, code];

    // Synchronize facilityType state with the new selection
    const onlyCaravans =
      nextChecked.length > 0 &&
      nextChecked.every((c) => CARAVAN_BRANCH_CODES.includes(c));
    const onlyShops =
      nextChecked.length > 0 &&
      nextChecked.every((c) => SHOP_BRANCH_CODES.includes(c));

    if (nextChecked.length === 0 || nextChecked.length === allOutlets.length) {
      onFacilityTypeChange('all');
      onChange([]);
    } else if (onlyCaravans) {
      onFacilityTypeChange('caravans');
      onChange(nextChecked);
    } else if (onlyShops) {
      onFacilityTypeChange('shops');
      onChange(nextChecked);
    } else {
      // Mixed selection across sectors
      onFacilityTypeChange('all');
      onChange(nextChecked);
    }
  };

  const handleSelectAll = () => {
    if (sectorType !== 4) {
      onChange([]);
      return;
    }
    if (facilityType === 'caravans') {
      onChange([...CARAVAN_BRANCH_CODES]);
    } else if (facilityType === 'shops') {
      onChange([...SHOP_BRANCH_CODES]);
    } else {
      onFacilityTypeChange('all');
      onChange([]);
    }
  };

  const handleClearAll = () => {
    onChange(['__NONE__']); // explicit empty filter
  };

  // Filtered list by search query
  const filteredList = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allOutlets;
    return allOutlets.filter(
      (o) => o.Name.toLowerCase().includes(q) || String(o.Code).toLowerCase().includes(q)
    );
  }, [allOutlets, query]);

  return (
    <div ref={dropdownRef} className="relative z-50">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-10 min-w-[260px] sm:min-w-[290px] items-center justify-between gap-3 rounded-lg border border-slate-200/80 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 shadow-sm ring-1 ring-slate-200/50 transition hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-200 dark:ring-white/10 dark:hover:bg-zinc-800"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Store className={`h-4 w-4 shrink-0 ${theme.accentText}`} />
          <span className="truncate font-bold text-slate-800 dark:text-zinc-100">
            {buttonLabel}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {checkedCount > 0 && checkedCount < allOutlets.length && (
            <span className={`rounded-full ${theme.badgeSolid} px-2 py-0.5 text-[10px] font-bold tabular-nums`}>
              {checkedCount}
            </span>
          )}
          <ChevronDown
            className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''
              }`}
          />
        </div>
      </button>

      {/* Dropdown Menu (Z-50 with high-contrast shadow & backdrop) */}
      {open && (
        <div
          dir="rtl"
          className="absolute right-0 top-full mt-2 w-[360px] sm:w-[410px] z-50 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl ring-1 ring-slate-900/10 dark:border-zinc-800 dark:bg-zinc-900 dark:ring-white/10 animate-in fade-in-50 zoom-in-95 duration-100"
        >
          {/* SECTION A: Quick Sector Toggles - ONLY RENDER FOR CARAVANS (Type = 4) */}
          {sectorType === 4 && (
            <div className="border-b border-slate-100 bg-slate-50/80 p-3 dark:border-zinc-800/80 dark:bg-zinc-950/60">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                  قطاع الأعمال (Sub-Category)
                </span>
                <span className="text-[10px] font-mono tabular-nums text-slate-400 dark:text-zinc-500">
                  {facilityType === 'caravans'
                    ? '11 كرفانات نشطة'
                    : facilityType === 'shops'
                      ? '5 محلات نشطة'
                      : `${allOutlets.length} منفذ كلي`}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-1 rounded-lg bg-slate-200/70 p-1 dark:bg-zinc-800/70">
                <button
                  type="button"
                  onClick={() => handleSectorToggle('all')}
                  className={`flex flex-col items-center justify-center rounded-md py-1.5 px-2 text-xs transition ${facilityType === 'all'
                    ? 'bg-white font-bold text-slate-900 shadow-xs dark:bg-zinc-900 dark:text-white'
                    : 'font-medium text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white'
                    }`}
                >
                  <span>الكل (All)</span>
                  <span className="text-[9px] opacity-70">{allOutlets.length} منفذ</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSectorToggle('caravans')}
                  className={`flex flex-col items-center justify-center rounded-md py-1.5 px-2 text-xs transition ${facilityType === 'caravans'
                    ? 'bg-white font-bold text-orange-600 shadow-xs dark:bg-zinc-900 dark:text-orange-400'
                    : 'font-medium text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white'
                    }`}
                >
                  <span>الكرفانات</span>
                  <span className="text-[9px] opacity-70">11 كرفان</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSectorToggle('shops')}
                  className={`flex flex-col items-center justify-center rounded-md py-1.5 px-2 text-xs transition ${facilityType === 'shops'
                    ? 'bg-white font-bold text-blue-600 shadow-xs dark:bg-zinc-900 dark:text-blue-400'
                    : 'font-medium text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white'
                    }`}
                >
                  <span>المحلات</span>
                  <span className="text-[9px] opacity-70">5 محلات</span>
                </button>
              </div>
            </div>
          )}

          {/* Quick Search inside Menu */}
          <div className="relative border-b border-slate-100 p-2.5 dark:border-zinc-800">
            <Search className="pointer-events-none absolute right-5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              ref={searchInputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={sectorType === 2 || sectorType === 3 ? "ابحث باسم اللعبة أو الكود..." : "ابحث بالاسم أو الكود..."}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-3 pr-8 text-xs text-slate-800 placeholder-slate-400 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-1 focus:ring-slate-400 dark:border-zinc-700/80 dark:bg-zinc-950 dark:text-zinc-200 dark:placeholder-zinc-500 dark:focus:border-zinc-600"
            />
          </div>

          {/* SECTION B: Granular Checkboxes List */}
          <ul className="max-h-60 overflow-y-auto p-1.5 divide-y divide-slate-50 dark:divide-zinc-800/40">
            {filteredList.length === 0 ? (
              <li className="p-4 text-center text-xs text-slate-400 dark:text-zinc-500">
                {sectorType === 2 || sectorType === 3 ? "لا توجد ألعاب مطابقة للبحث" : "لا توجد منافذ مطابقة للبحث"}
              </li>
            ) : (
              filteredList.map((branch) => {
                const isChecked = isBranchChecked(String(branch.Code));
                const isCaravan = CARAVAN_BRANCH_CODES.includes(String(branch.Code));
                return (
                  <li
                    key={branch.Code}
                    onClick={() => toggleBranch(String(branch.Code))}
                    className="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-xs transition hover:bg-slate-100/80 dark:hover:bg-zinc-800/60"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition ${isChecked
                          ? theme.checkboxActive
                          : 'border-slate-300 bg-white dark:border-zinc-600 dark:bg-zinc-900'
                          }`}
                      >
                        {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                      </span>
                      <span className="truncate font-semibold text-slate-800 dark:text-zinc-200">
                        {branch.Name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {sectorType === 4 && (
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${isCaravan
                            ? 'bg-amber-100/80 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                            : 'bg-blue-100/80 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                            }`}
                        >
                          {isCaravan ? 'كرفان' : 'محل'}
                        </span>
                      )}
                      <span className="font-mono text-[11px] tabular-nums text-slate-400 dark:text-zinc-500" dir="ltr">
                        {branch.Code}
                      </span>
                    </div>
                  </li>
                );
              })
            )}
          </ul>

          {/* Footer with Quick Multi-Select Actions */}
          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-3 py-2 text-xs text-slate-500 dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-400">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-[11px] font-bold text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white"
              >
                {sectorType === 2 || sectorType === 3 ? "كل الألعاب" : "تحديد الكل"}
              </button>
              <span className="text-slate-300 dark:text-zinc-700">•</span>
              <button
                type="button"
                onClick={handleClearAll}
                className="text-[11px] font-bold text-slate-600 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400"
              >
                إلغاء التحديد
              </button>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className={`rounded-lg ${theme.btnPrimary} px-3.5 py-1 text-xs font-bold text-white shadow-sm transition active:scale-95`}
            >
              تم
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                            Primary Toolbar                                 */
/* -------------------------------------------------------------------------- */

export interface CaravanFiltersToolbarProps {
  sectorType?: number;
  sectorLabel?: string;
  viewMode: ViewMode;
  facilityType: FacilityType;
  onFacilityTypeChange: (type: FacilityType) => void;
  rideStatusFilter?: 'active' | 'inactive' | 'all';
  onRideStatusFilterChange?: (filter: 'active' | 'inactive' | 'all') => void;
  branchOptions: BranchOption[];
  selectedBranches: string[];
  onSelectedBranchesChange: (branches: string[]) => void;
  // Standard Mode Props
  granularity: Granularity;
  onGranularityChange: (g: Granularity) => void;
  preset: PresetId;
  onApplyPreset: (id: Exclude<PresetId, 'custom'>) => void;
  startDate: string;
  endDate: string;
  onDateChange: (start: string, end: string) => void;
  isLoading?: boolean;
  // Comparison Mode Props
  compPreset: CompPresetId;
  onApplyCompPreset: (id: Exclude<CompPresetId, 'custom'>) => void;
  compStartA: string;
  compEndA: string;
  onCompRangeAChange: (start: string, end: string) => void;
  compStartB: string;
  compEndB: string;
  onCompRangeBChange: (start: string, end: string) => void;
  comparisonLoading?: boolean;
  onOpenGateAdjustments?: () => void;
}

export function CaravanFiltersToolbar({
  sectorType = 4,
  sectorLabel,
  viewMode,
  facilityType,
  onFacilityTypeChange,
  rideStatusFilter,
  onRideStatusFilterChange,
  branchOptions,
  selectedBranches,
  onSelectedBranchesChange,
  granularity,
  onGranularityChange,
  preset,
  onApplyPreset,
  startDate,
  endDate,
  onDateChange,
  isLoading = false,
  compPreset,
  onApplyCompPreset,
  compStartA,
  compEndA,
  onCompRangeAChange,
  compStartB,
  compEndB,
  onCompRangeBChange,
  comparisonLoading = false,
  onOpenGateAdjustments,
}: CaravanFiltersToolbarProps) {
  const theme = getSectorTheme(sectorType);
  if (viewMode === 'standard') {
    return (
      <div className="relative z-50 flex flex-col gap-3 rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-sm ring-1 ring-slate-200/50 backdrop-blur-md print:hidden dark:border-zinc-800 dark:bg-zinc-900/80 dark:ring-white/10">
        <div className="flex flex-wrap items-center justify-between gap-3 w-full">
          {/* Hybrid Dropdown: Sector Toggles + Granular Branch Multi-Select */}
          <div className="flex flex-wrap items-center gap-2.5">
            <HybridBranchFilterDropdown
              sectorType={sectorType}
              sectorLabel={sectorLabel}
              facilityType={facilityType}
              onFacilityTypeChange={onFacilityTypeChange}
              options={branchOptions}
              selectedBranches={selectedBranches}
              onChange={onSelectedBranchesChange}
            />

            {sectorType === 2 && (
              <Segmented
                options={[
                  { id: 'active', label: 'النشطة' },
                  { id: 'غير النشطة', label: 'غير النشطة' },
                  { id: 'all', label: 'الكل' },
                ].map(o => ({ id: o.id === 'غير النشطة' ? 'inactive' : o.id, label: o.label }))}
                value={rideStatusFilter || 'active'}
                onChange={(val) => onRideStatusFilterChange?.(val as 'active' | 'inactive' | 'all')}
              />
            )}

            {sectorType === 6 && (
              <Segmented
                options={[
                  { id: 'all', label: 'الكل' },
                  { id: 'active', label: 'النشطة' },
                ]}
                value={rideStatusFilter === 'active' ? 'active' : 'all'}
                onChange={(val) => onRideStatusFilterChange?.(val as 'active' | 'inactive' | 'all')}
                activeClassName="bg-[#1e293b] text-white shadow-xs font-bold"
              />
            )}

            {sectorType === 5 && (
              <button
                type="button"
                onClick={() => onOpenGateAdjustments?.()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border border-cyan-500/40 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-500/20 active:scale-95 shadow-2xs"
                title="تسويات أوامر دخول التسويق والمجموعات وتذاكر المشرفين الخارجية"
              >
                <FileText className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                <span>تسويات المبيعات الخارجية</span>
              </button>
            )}
          </div>

          {/* Granularity Switcher */}
          <Segmented
            options={GRANULARITIES}
            value={granularity}
            onChange={onGranularityChange}
            activeClassName={sectorType === 1 ? 'bg-[#881337] text-white shadow-xs font-bold' : undefined}
          />
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full">
          <div className="flex flex-wrap items-center gap-2">
            {PRESETS.map((p) => {
              const isActive = preset === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  disabled={isLoading}
                  onClick={() => onApplyPreset(p.id)}
                  className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold tabular-nums tracking-tight transition-all duration-200 ${
                    isActive
                      ? `${theme.btnActive} shadow-sm font-bold`
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-zinc-800/80 dark:text-zinc-300 dark:hover:bg-zinc-700 dark:hover:text-white'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          <FinancialDatePicker
            startDate={startDate}
            endDate={endDate}
            onChange={onDateChange}
            disabled={isLoading}
            showQuickPresets={false}
            sectorType={sectorType}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="relative z-50 flex flex-col gap-4 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm ring-1 ring-slate-200/50 backdrop-blur-md print:hidden dark:border-zinc-800 dark:bg-zinc-900/80 dark:ring-white/10">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-zinc-800/80 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">أنماط المقارنة الجاهزة:</span>
          {COMP_PRESETS.map((p) => {
            const isActive = compPreset === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onApplyCompPreset(p.id)}
                className={`rounded-lg px-3 py-1 text-xs font-semibold tabular-nums tracking-tight transition-all duration-200 ${isActive
                  ? `${theme.btnActive} shadow-sm font-bold`
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-zinc-800/80 dark:text-zinc-300 dark:hover:bg-zinc-700 dark:hover:text-white'
                  }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Hybrid Dropdown in Comparison Mode */}
        <div className="flex flex-wrap items-center gap-2.5">
          <HybridBranchFilterDropdown
            sectorType={sectorType}
            sectorLabel={sectorLabel}
            facilityType={facilityType}
            onFacilityTypeChange={onFacilityTypeChange}
            options={branchOptions}
            selectedBranches={selectedBranches}
            onChange={onSelectedBranchesChange}
          />

          {sectorType === 6 && (
            <Segmented
              options={[
                { id: 'all', label: 'الكل' },
                { id: 'active', label: 'النشطة' },
              ]}
              value={rideStatusFilter === 'active' ? 'active' : 'all'}
              onChange={(val) => onRideStatusFilterChange?.(val as 'active' | 'inactive' | 'all')}
              activeClassName="bg-[#1e293b] text-white shadow-xs font-bold"
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200/80 bg-slate-50/60 p-2.5 shadow-2xs dark:border-zinc-800/80 dark:bg-zinc-900/40">
          <div className="flex items-center gap-2">
            <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${theme.badgeSolid} text-xs font-bold`}>A</span>
            <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">الفترة الحالية (A):</span>
          </div>
          <FinancialDatePicker
            startDate={compStartA}
            endDate={compEndA}
            onChange={onCompRangeAChange}
            disabled={comparisonLoading}
            showQuickPresets={false}
            sectorType={sectorType}
          />
        </div>

        <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200/80 bg-slate-50/60 p-2.5 shadow-2xs dark:border-zinc-800/80 dark:bg-zinc-900/40">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-slate-400 text-xs font-bold text-white dark:bg-slate-600">B</span>
            <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">فترة المقارنة (B):</span>
          </div>
          <FinancialDatePicker
            startDate={compStartB}
            endDate={compEndB}
            onChange={onCompRangeBChange}
            disabled={comparisonLoading}
            showQuickPresets={false}
            sectorType={sectorType}
          />
        </div>
      </div>
    </div>
  );
}

export default CaravanFiltersToolbar;
