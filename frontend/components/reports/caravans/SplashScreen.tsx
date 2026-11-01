'use client';

import React, { useEffect, useState } from 'react';

interface SplashScreenProps {
  isLoading: boolean;
  minDurationMs?: number;
}

export function SplashScreen({ isLoading, minDurationMs = 1400 }: SplashScreenProps) {
  const [shouldRender, setShouldRender] = useState(true);
  const [isFading, setIsFading] = useState(false);
  const [mountedAt] = useState(() => Date.now());

  useEffect(() => {
    if (!isLoading) {
      const elapsed = Date.now() - mountedAt;
      const remaining = Math.max(0, minDurationMs - elapsed);

      const fadeTimer = setTimeout(() => {
        setIsFading(true);
        const unmountTimer = setTimeout(() => {
          setShouldRender(false);
        }, 700); // 700ms smooth CSS fade transition
        return () => clearTimeout(unmountTimer);
      }, remaining);

      return () => clearTimeout(fadeTimer);
    }
  }, [isLoading, minDurationMs, mountedAt]);

  if (!shouldRender) return null;

  return (
    <div
      dir="rtl"
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 text-slate-100 transition-opacity duration-700 ${
        isFading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Background Ambient Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 right-1/2 h-96 w-96 translate-x-1/2 rounded-full bg-emerald-500/10 blur-[120px]" />
        <div className="absolute -bottom-40 right-1/2 h-96 w-96 translate-x-1/2 rounded-full bg-amber-500/10 blur-[120px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-md">
        {/* Dream Park Official Logo with Soft Pulse */}
        <div className="relative mb-6">
          <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-xl animate-pulse" />
          <img
            src="/dreampark-logo.png"
            alt="Dream Park"
            className="relative h-28 w-auto object-contain drop-shadow-[0_10px_25px_rgba(0,0,0,0.8)] transition-transform duration-500 hover:scale-105"
          />
        </div>

        {/* Brand Typography */}
        <h1 className="text-xl font-extrabold tracking-wide text-white sm:text-2xl drop-shadow-sm">
          منظومة دريم بارك المركزية للعمليات
        </h1>
        <p className="mt-1 text-xs font-semibold tracking-wider text-emerald-400/90 uppercase" dir="ltr">
          DREAM PARK &amp; ZOO — F&amp;B REVENUES &amp; OPERATIONS
        </p>

        {/* Amusement Park Ferris Wheel Loader (ساقية دريم بارك الدوارة) */}
        <div className="mt-8 flex flex-col items-center">
          <div className="relative flex h-20 w-20 items-center justify-center">
            {/* Spinning Ferris Wheel Wheel */}
            <svg
              className="h-20 w-20 animate-spin text-emerald-500/80"
              style={{ animationDuration: '6s', animationTimingFunction: 'linear' }}
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Outer Wheel Rim */}
              <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="2.5" strokeDasharray="6 4" opacity="0.7" />
              {/* Inner Wheel Rim */}
              <circle cx="50" cy="50" r="26" stroke="#f59e0b" strokeWidth="1.5" opacity="0.8" />
              {/* Center Hub */}
              <circle cx="50" cy="50" r="7" fill="#10b981" />
              <circle cx="50" cy="50" r="3" fill="#ffffff" />
              
              {/* 8 Spokes (أذرع الساقية) */}
              <line x1="50" y1="8" x2="50" y2="92" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
              <line x1="8" y1="50" x2="92" y2="50" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
              <line x1="20" y1="20" x2="80" y2="80" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
              <line x1="80" y1="20" x2="20" y2="80" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />

              {/* 8 Ferris Wheel Cabins (كابينات الركاب المعلقة) */}
              <circle cx="50" cy="8" r="4" fill="#f59e0b" />
              <circle cx="50" cy="92" r="4" fill="#f59e0b" />
              <circle cx="8" cy="50" r="4" fill="#10b981" />
              <circle cx="92" cy="50" r="4" fill="#10b981" />
              <circle cx="20" cy="20" r="4" fill="#38bdf8" />
              <circle cx="80" cy="80" r="4" fill="#38bdf8" />
              <circle cx="80" cy="20" r="4" fill="#ec4899" />
              <circle cx="20" cy="80" r="4" fill="#ec4899" />
            </svg>

            {/* Support Tower Base (قاعدة البرج) */}
            <div className="absolute -bottom-2 flex justify-center">
              <svg width="40" height="20" viewBox="0 0 40 20" fill="none">
                <line x1="20" y1="2" x2="6" y2="20" stroke="#64748b" strokeWidth="2" />
                <line x1="20" y1="2" x2="34" y2="20" stroke="#64748b" strokeWidth="2" />
                <line x1="12" y1="12" x2="28" y2="12" stroke="#64748b" strokeWidth="1.5" />
              </svg>
            </div>
          </div>

          {/* Glowing Animated Loading Bar */}
          <div className="mt-6 w-48 overflow-hidden rounded-full bg-slate-800 p-0.5 shadow-inner">
            <div className="h-1.5 w-full rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 to-emerald-500 animate-pulse" />
          </div>

          {/* Status Message */}
          <p className="mt-3 text-xs font-medium text-slate-400 animate-pulse">
            جاري تهيئة ومزامنة المؤشرات المالية وساعات الذروة التشغيلية...
          </p>
        </div>
      </div>
    </div>
  );
}

