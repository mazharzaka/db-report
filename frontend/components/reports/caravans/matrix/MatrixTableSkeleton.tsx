'use client';

import React from 'react';

interface MatrixTableSkeletonProps {
  columnsCount?: number;
  rowsCount?: number;
}

export const MatrixTableSkeleton = React.memo(function MatrixTableSkeleton({
  columnsCount = 10,
  rowsCount = 8,
}: MatrixTableSkeletonProps) {
  const shimmerCols = Array.from({ length: columnsCount });
  const shimmerRows = Array.from({ length: rowsCount });

  return (
    <div className="w-full animate-pulse select-none" dir="rtl">
      {/* Skeleton Top Bar */}
      <div className="flex items-center justify-between pb-3 px-1 border-b border-slate-200 dark:border-zinc-800 mb-3">
        <div className="h-5 w-48 rounded bg-slate-200 dark:bg-zinc-800" />
        <div className="flex items-center gap-2">
          <div className="h-8 w-24 rounded-lg bg-slate-200 dark:bg-zinc-800" />
          <div className="h-8 w-24 rounded-lg bg-slate-200 dark:bg-zinc-800" />
        </div>
      </div>

      {/* Skeleton Table Container */}
      <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs">
        <table className="w-full border-collapse">
          {/* Header Skeleton */}
          <thead>
            <tr className="border-b border-slate-200 dark:border-zinc-800 bg-slate-100/80 dark:bg-zinc-800/60">
              <th className="px-4 py-3.5 text-center">
                <div className="h-4 w-20 mx-auto rounded bg-slate-300 dark:bg-zinc-700" />
              </th>
              {shimmerCols.map((_, i) => (
                <th key={i} className="px-3 py-3.5 text-center">
                  <div className="h-4 w-16 mx-auto rounded bg-slate-300 dark:bg-zinc-700" />
                </th>
              ))}
            </tr>
          </thead>

          {/* Body Skeleton */}
          <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
            {shimmerRows.map((_, rIdx) => (
              <tr
                key={rIdx}
                className={rIdx % 2 === 1 ? 'bg-slate-50/50 dark:bg-zinc-900/50' : 'bg-white dark:bg-zinc-900'}
              >
                {/* Date / Name Sticky Col */}
                <td className="px-4 py-3 text-center">
                  <div className="h-4 w-20 mx-auto rounded bg-slate-200 dark:bg-zinc-800" />
                </td>

                {/* Shimmer Cells */}
                {shimmerCols.map((_, cIdx) => (
                  <td key={cIdx} className="px-3 py-3 text-center">
                    <div
                      className={`h-4 rounded bg-slate-200 dark:bg-zinc-800 mx-auto ${
                        cIdx % 3 === 0 ? 'w-16' : cIdx % 3 === 1 ? 'w-12' : 'w-20'
                      }`}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>

          {/* Footer Skeleton */}
          <tfoot>
            <tr className="border-t-2 border-slate-300 dark:border-zinc-700 bg-slate-100/90 dark:bg-zinc-800/80">
              <td className="px-4 py-3 text-center">
                <div className="h-5 w-24 mx-auto rounded bg-slate-300 dark:bg-zinc-700" />
              </td>
              {shimmerCols.map((_, i) => (
                <td key={i} className="px-3 py-3 text-center">
                  <div className="h-5 w-16 mx-auto rounded bg-slate-300 dark:bg-zinc-700" />
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Skeleton Footer Bar */}
      <div className="flex items-center justify-between pt-3 px-1">
        <div className="h-4 w-32 rounded bg-slate-200 dark:bg-zinc-800" />
        <div className="h-8 w-48 rounded-lg bg-slate-200 dark:bg-zinc-800" />
      </div>
    </div>
  );
});
