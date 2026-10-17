import React from "react";

export function HazardCardSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading hazard details"
      className="p-4 bg-white dark:bg-[#142533] rounded-xl border border-[#DCE4E8] dark:border-slate-800 shadow-sm animate-pulse space-y-3"
    >
      <div className="flex items-center justify-between">
        <div className="h-5 w-24 bg-slate-200 dark:bg-slate-700 rounded-full" />
        <div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded-md" />
      </div>

      <div className="flex items-center gap-2">
        <div className="h-4 w-4 bg-slate-200 dark:bg-slate-700 rounded-full shrink-0" />
        <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-700 rounded" />
      </div>

      <div className="space-y-1.5 pt-1">
        <div className="h-3 w-full bg-slate-200 dark:bg-slate-700 rounded" />
        <div className="h-3 w-5/6 bg-slate-200 dark:bg-slate-700 rounded" />
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80">
        <div className="h-3 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
        <div className="h-6 w-14 bg-slate-200 dark:bg-slate-700 rounded-full" />
      </div>
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export function LoadingState({ count = 3, message }) {
  return (
    <div className="w-full space-y-3 py-2">
      {message && (
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 px-1">
          {message}
        </p>
      )}
      {Array.from({ length: count }).map((_, idx) => (
        <HazardCardSkeleton key={`skeleton-${idx}`} />
      ))}
    </div>
  );
}

export default LoadingState;
