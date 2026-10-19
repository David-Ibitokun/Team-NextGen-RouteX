import React from "react";
import { Sparkles, Check, X, AlertCircle } from "lucide-react";

export function AISuggestionCard({
  title = "AI Suggestion",
  subtitle = "Generated to assist your report",
  content,
  reason,
  onApply,
  onDismiss,
  applyLabel = "Apply Suggestion",
  dismissLabel = "Dismiss",
  isApplying = false,
  badgeText = "Gemini AI",
  disclaimer = "AI suggestions are advisory only. Confirm that details match your observations.",
}) {
  return (
    <div className="p-3.5 bg-gradient-to-br from-teal-50/80 to-slate-50 dark:from-teal-950/20 dark:to-slate-900/40 border border-teal-200/80 dark:border-teal-800/60 rounded-xl space-y-2.5 transition-all animate-fadeIn">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[#087F8C]/10 dark:bg-teal-400/20 flex items-center justify-center text-[#087F8C] dark:text-teal-400">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#142B3B] dark:text-slate-100 flex items-center gap-1.5">
              <span>{title}</span>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300">
                {badgeText}
              </span>
            </h4>
            {subtitle && (
              <p className="text-[10px] text-[#667784] dark:text-slate-400">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="p-1 text-[#667784] hover:text-[#142B3B] dark:text-slate-400 dark:hover:text-white rounded-lg transition-colors"
            title="Dismiss suggestion"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {content && (
        <div className="p-2.5 bg-white/90 dark:bg-[#1B3142]/80 border border-slate-200 dark:border-slate-700/60 rounded-lg text-xs text-[#142B3B] dark:text-slate-200 leading-relaxed font-sans shadow-2xs">
          {content}
        </div>
      )}

      {reason && (
        <div className="flex items-start gap-1.5 text-[11px] text-[#667784] dark:text-slate-400">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-teal-600 dark:text-teal-400" />
          <span>{reason}</span>
        </div>
      )}

      <div className="flex items-center justify-between pt-1 gap-2 border-t border-teal-100/60 dark:border-slate-800">
        <p className="text-[10px] text-[#667784] dark:text-slate-500 italic truncate">
          {disclaimer}
        </p>
        <div className="flex items-center gap-1.5 shrink-0">
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="px-2 py-1 text-[11px] font-medium text-[#667784] dark:text-slate-400 hover:text-[#142B3B] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              {dismissLabel}
            </button>
          )}
          {onApply && (
            <button
              type="button"
              onClick={onApply}
              disabled={isApplying}
              className="inline-flex items-center gap-1 px-3 py-1 text-[11px] font-bold text-white bg-[#087F8C] hover:bg-[#06636E] dark:bg-teal-600 dark:hover:bg-teal-500 rounded-lg transition-all shadow-xs disabled:opacity-50"
            >
              <Check className="w-3 h-3" />
              <span>{applyLabel}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
