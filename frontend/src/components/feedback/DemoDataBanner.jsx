import React from "react";
import { Info } from "lucide-react";

export function DemoDataBanner({ hasDemoReports = false }) {
  if (!hasDemoReports) return null;

  return (
    <aside
      aria-label="Demo data notice"
      className="bg-[#F2B544]/20 dark:bg-amber-950/40 border-b border-[#F2B544]/40 dark:border-amber-800 px-4 py-2 text-xs text-[#142B3B] dark:text-amber-200 flex items-center justify-between transition-colors"
    >
      <div className="flex items-center gap-2">
        <Info className="w-4 h-4 text-[#855B09] dark:text-amber-400 shrink-0" />
        <span>
          <strong className="font-semibold">Demo data active:</strong> Showing illustrative hazards in Lagos for development. These are not real-time road closures.
        </span>
      </div>
      <span className="hidden sm:inline-block text-[11px] font-mono text-[#855B09] dark:text-amber-300 uppercase tracking-wider bg-white/70 dark:bg-amber-900/60 px-2 py-0.5 rounded border border-amber-300 dark:border-amber-700">
        Demo Mode
      </span>
    </aside>
  );
}

export default DemoDataBanner;
