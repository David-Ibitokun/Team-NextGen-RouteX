import React from "react";
import { ThumbsUp } from "lucide-react";
import { CategoryBadge } from "./CategoryBadge";
import { FreshnessBadge } from "./FreshnessBadge";
import { getStatusBadgeStyle } from "../../utils/hazardConstants";

export function HazardCard({ hazard, isSelected = false, onSelect }) {
  const statusStyle = getStatusBadgeStyle(hazard.status);

  return (
    <article
      onClick={() => onSelect && onSelect(hazard)}
      className={`p-3.5 rounded-lg border transition-all cursor-pointer text-left ${
        isSelected
          ? "bg-white dark:bg-[#182C3A] border-[#087F8C] ring-2 ring-[#087F8C]/20 shadow-sm"
          : "bg-white dark:bg-[#142533] border-[#DCE4E8] dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-xs"
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <CategoryBadge category={hazard.category} />
        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${statusStyle}`}>
          {hazard.status_display || hazard.status}
        </span>
      </div>

      <h4 className="text-sm font-semibold text-[#142B3B] dark:text-slate-100 line-clamp-1 mb-1">
        {hazard.location_label || `Lat: ${Number(hazard.latitude).toFixed(4)}, Lng: ${Number(hazard.longitude).toFixed(4)}`}
      </h4>

      <p className="text-xs text-[#667784] dark:text-slate-300 line-clamp-2 mb-2.5">
        {hazard.description}
      </p>

      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/60 text-[11px] text-[#667784] dark:text-slate-400">
        <FreshnessBadge freshness={hazard.freshness} createdAt={hazard.created_at} />

        <div className="flex items-center gap-2">
          {hazard.is_demo && (
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
              Demo
            </span>
          )}
          <span className="inline-flex items-center gap-1 font-medium text-[#087F8C] dark:text-teal-400">
            <ThumbsUp className="w-3 h-3" />
            {hazard.confirmations_count || 0}
          </span>
        </div>
      </div>
    </article>
  );
}

export default HazardCard;
