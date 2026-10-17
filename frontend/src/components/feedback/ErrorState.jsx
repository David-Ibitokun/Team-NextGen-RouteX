import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export function ErrorState({
  title = "Unable to load reports",
  message = "We could not retrieve the road hazard reports right now. Check your connection or try again.",
  onRetry,
}) {
  return (
    <div className="flex flex-col items-center justify-center p-6 text-center bg-red-50/60 dark:bg-red-950/40 rounded-lg border border-red-200 dark:border-red-900/60 transition-colors">
      <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/60 flex items-center justify-center mb-3 text-[#D64545] dark:text-red-400">
        <AlertTriangle className="w-5 h-5" />
      </div>
      <h3 className="text-sm font-semibold text-[#142B3B] dark:text-white mb-1">{title}</h3>
      <p className="text-xs text-[#667784] dark:text-slate-300 max-w-xs mb-3">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#142B3B] dark:text-slate-200 bg-white dark:bg-[#1A2E3D] border border-[#DCE4E8] dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Try again
        </button>
      )}
    </div>
  );
}

export default ErrorState;
