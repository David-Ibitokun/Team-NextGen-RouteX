import React from "react";
import { AlertCircle } from "lucide-react";

export function EmptyState({
  title = "No reports found",
  message = "No reports match these filters. Try another filter or report a hazard you see.",
  actionLabel,
  onAction,
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-[#142533] rounded-lg border border-[#DCE4E8] dark:border-slate-800 transition-colors shadow-xs">
      <div className="w-12 h-12 rounded-full bg-[#F7F9FA] dark:bg-[#1B3142] flex items-center justify-center mb-3 text-[#667784] dark:text-slate-400">
        <AlertCircle className="w-6 h-6 text-[#087F8C] dark:text-teal-400" />
      </div>
      <h3 className="text-base font-semibold text-[#142B3B] dark:text-white mb-1">{title}</h3>
      <p className="text-sm text-[#667784] dark:text-slate-300 max-w-sm mb-4">{message}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-[#087F8C] hover:bg-[#0aa3b3] rounded-md transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export default EmptyState;
