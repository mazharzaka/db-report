'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Caravan,
  Utensils,
  FerrisWheel,
  Gamepad2,
  Ticket,
  Car,
  ChevronRight,
  ChevronLeft,
  Menu,
  X,
  Layers,
  ShieldCheck,
} from 'lucide-react';
import { SECTORS_LIST, SectorConfig, SECTOR_ICONS } from '@/config/sectorsConfig';

const SECTOR_SIDEBAR_STYLES: Record<string, {
  activeContainer: string;
  activeIcon: string;
  activeBadge: string;
}> = {
  caravans: {
    activeContainer: 'bg-blue-600 text-white shadow-lg shadow-blue-500/35 ring-1 ring-blue-400/50 font-bold',
    activeIcon: 'bg-white/20 text-white',
    activeBadge: 'bg-white/20 text-white',
  },
  vr: {
    activeContainer: 'bg-purple-600 text-white shadow-lg shadow-purple-500/35 ring-1 ring-purple-400/50 font-bold',
    activeIcon: 'bg-white/20 text-white',
    activeBadge: 'bg-white/20 text-white',
  },
  rides: {
    activeContainer: 'bg-orange-600 text-white shadow-lg shadow-orange-500/35 ring-1 ring-orange-400/50 font-bold',
    activeIcon: 'bg-white/20 text-white',
    activeBadge: 'bg-white/20 text-white',
  },
  gates: {
    activeContainer: 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/35 ring-1 ring-emerald-400/50 font-bold',
    activeIcon: 'bg-white/20 text-white',
    activeBadge: 'bg-white/20 text-white',
  },
  parking: {
    activeContainer: 'bg-yellow-500 text-slate-950 shadow-lg shadow-yellow-500/35 ring-1 ring-yellow-300/60 font-bold',
    activeIcon: 'bg-black/15 text-slate-950',
    activeBadge: 'bg-black/15 text-slate-950',
  },
  restaurants: {
    activeContainer: 'bg-rose-600 text-white shadow-lg shadow-rose-500/35 ring-1 ring-rose-400/50 font-bold',
    activeIcon: 'bg-white/20 text-white',
    activeBadge: 'bg-white/20 text-white',
  },
};

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Determine active sector with safe trailing slash normalization
  const normalize = (path: string) => path.replace(/\/+$/, '') || '/';

  const getIsActive = (sector: SectorConfig) => {
    const current = normalize(pathname || '');
    if (sector.id === 'caravans' && (current === '/' || current === '/reports/caravans')) {
      return true;
    }
    return current === normalize(sector.path);
  };

  return (
    <>
      {/* Mobile Floating Toggle Button */}
      <div className="fixed top-3 right-3 z-50 lg:hidden print:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/80 bg-white/95 text-slate-700 shadow-md backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/95 dark:text-zinc-200"
          aria-label="القائمة الجانبية للقطاعات"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden print:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 right-0 z-40 flex flex-col border-l border-slate-200/80 bg-white/95 transition-all duration-300 ease-in-out backdrop-blur-md dark:border-zinc-800/80 dark:bg-[#0c0c0e]/95 print:hidden lg:static ${isCollapsed ? 'w-20' : 'w-72'
          } ${mobileOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand Header */}
        <div className="flex h-20 items-center justify-between border-b border-slate-200/80 px-4 dark:border-zinc-800/80">
          <Link
            href="/"
            className="flex items-center gap-3 overflow-hidden text-right"
            title="منظومة دريم بارك المركزية"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 shadow-sm text-white font-bold p-1">
              <img
                src="/dreampark-logo.png"
                alt="Dream Park"
                className="h-full w-auto object-contain brightness-0 invert"
              />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col overflow-hidden">
                <span className="truncate text-sm font-black text-slate-900 dark:text-white">
                  دريم بارك المركزية
                </span>
                <span className="truncate text-[11px] font-medium text-slate-500 dark:text-zinc-400">
                  لوحة مؤشرات القطاعات 2026
                </span>
              </div>
            )}
          </Link>

          {/* Desktop Collapse Toggle */}
          <button
            type="button"
            onClick={() => setIsCollapsed((prev) => !prev)}
            className="hidden h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-200 lg:flex"
            title={isCollapsed ? 'توسيع القائمة' : 'طي القائمة'}
          >
            {isCollapsed ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        </div>

        {/* Section Heading */}
        <div className="px-4 pt-5 pb-2">
          {!isCollapsed ? (
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 dark:text-zinc-500">
              <span className="flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5" />
                <span>القطاعات التشغيلية (Sectors)</span>
              </span>
              <span className="font-mono text-[10px]">6 قطاعات</span>
            </div>
          ) : (
            <div className="flex justify-center text-slate-400 dark:text-zinc-500">
              <Layers className="h-4 w-4" />
            </div>
          )}
        </div>

        {/* Sector Navigation Links */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto px-3 py-2">
          {SECTORS_LIST.map((sector) => {
            const Icon = SECTOR_ICONS[sector.iconName] || Caravan;
            const isActive = getIsActive(sector);
            const activeStyle = SECTOR_SIDEBAR_STYLES[sector.id] || {
              activeContainer: 'bg-blue-600 text-white font-bold',
              activeIcon: 'bg-white/20 text-white',
              activeBadge: 'bg-white/20 text-white',
            };

            return (
              <Link
                key={sector.id}
                href={sector.path}
                title={`${sector.label} (${sector.badge})`}
                className={`group relative flex items-center rounded-xl transition-all duration-200 ${isCollapsed ? 'justify-center h-11 w-11 mx-auto' : 'gap-3 px-3 py-2.5 text-sm'
                  } ${isActive
                    ? activeStyle.activeContainer
                    : 'font-semibold text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-zinc-900/60 dark:hover:text-zinc-100'
                  }`}
              >
                <div
                  className={`flex ${isCollapsed ? 'h-full w-full' : 'h-9 w-9'} shrink-0 items-center justify-center rounded-lg transition-colors ${isActive
                      ? isCollapsed ? 'bg-transparent text-inherit' : activeStyle.activeIcon
                      : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200/80 group-hover:text-slate-800 dark:bg-zinc-800/80 dark:text-zinc-400 dark:group-hover:bg-zinc-800 dark:group-hover:text-zinc-200'
                    }`}
                >
                  <Icon className="h-5 w-5" />
                </div>

                {!isCollapsed && (
                  <div className="flex flex-1 items-center justify-between overflow-hidden">
                    <span className="truncate text-sm font-bold">{sector.label}</span>
                    <span
                      className={`font-mono text-[10px] font-semibold rounded-md px-1.5 py-0.5 tracking-tight ${isActive
                          ? activeStyle.activeBadge
                          : 'bg-slate-100 text-slate-500 dark:bg-zinc-800/80 dark:text-zinc-400'
                        }`}
                    >
                      {sector.badge}
                    </span>
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer Info */}
        <div className="border-t border-slate-200/80 p-4 dark:border-zinc-800/80">
          {!isCollapsed ? (
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                <span className="font-semibold text-slate-700 dark:text-zinc-300">نظام التدقيق اللحظي</span>
              </div>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                100% قروش
              </span>
            </div>
          ) : (
            <div className="flex justify-center" title="نظام التدقيق اللحظي المعتمد">
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
