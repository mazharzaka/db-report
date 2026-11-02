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
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#09090b] text-slate-100 transition-opacity duration-500 ${
        isFading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-md">
        {/* Dream Park Official Logo */}
        <div className="relative mb-6">
          <img
            src="/dreampark-logo.png"
            alt="Dream Park"
            className="relative h-28 w-auto object-contain transition-transform duration-300"
          />
        </div>

        {/* Brand Typography */}
        <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
          منظومة دريم بارك المركزية للعمليات
        </h1>
        <p className="mt-1 text-xs font-semibold tracking-wider text-violet-300 uppercase font-mono" dir="ltr">
          DREAM PARK &amp; ZOO — F&amp;B REVENUES &amp; FINANCIAL REPORTING
        </p>

        {/* Professional Minimalist Loader */}
        <div className="mt-8 flex flex-col items-center">
          <div className="relative flex h-14 w-14 items-center justify-center">
            <svg
              className="h-12 w-12 animate-spin text-violet-300"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              />
            </svg>
          </div>

          {/* Clean Progress Indicator */}
          <div className="mt-5 w-44 overflow-hidden rounded-full bg-slate-800">
            <div className="h-1 w-full rounded-full bg-indigo-600 animate-pulse" />
          </div>

          {/* Status Message */}
          <p className="mt-3 text-xs font-medium text-slate-400">
            جاري استرجاع ومزامنة البيانات المالية والمؤشرات التشغيلية...
          </p>
        </div>
      </div>
    </div>
  );
}

