import React from "react";
import { Filter, Layers, Navigation, Loader2, X } from "lucide-react";
import { HAZARD_CATEGORIES, HAZARD_STATUSES } from "../../utils/hazardConstants";

export const RADIUS_OPTIONS = [2, 5, 10, 25, 50];

export function HazardFilters({
  selectedCategory,
  onSelectCategory,
  selectedStatus,
  onSelectStatus,
  totalCount = 0,
  nearMeActive = false,
  onToggleNearMe,
  locating = false,
  radiusKm = 10,
  onSelectRadius,
}) {
  return (
    <div className="bg-white dark:bg-[#142533] border-b border-[#DCE4E8] dark:border-slate-800 p-3 space-y-2.5 transition-colors">
      {/* Category chips and Near Me trigger */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {onToggleNearMe && (
          <button
            type="button"
            onClick={onToggleNearMe}
            disabled={locating}
            className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all shadow-xs ${
              nearMeActive
                ? "bg-[#087F8C] text-white ring-2 ring-[#087F8C]/30"
                : "bg-teal-50 dark:bg-teal-950/40 text-[#087F8C] dark:text-teal-300 border border-teal-200 dark:border-teal-800 hover:bg-teal-100 dark:hover:bg-teal-900/40"
            }`}
            title={nearMeActive ? `Hazards within ${radiusKm} km (Click to disable)` : `Show hazards within ${radiusKm} km of my location`}
          >
            {locating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Navigation className={`w-3.5 h-3.5 ${nearMeActive ? "fill-white" : ""}`} />
            )}
            <span>{nearMeActive ? `Near Me (${radiusKm} km)` : "Near Me"}</span>
            {nearMeActive && <X className="w-3 h-3 ml-0.5 opacity-80 hover:opacity-100" />}
          </button>
        )}

        <button
          type="button"
          onClick={() => onSelectCategory("")}
          className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
            !selectedCategory
              ? "bg-[#087F8C] text-white"
              : "bg-[#F7F9FA] dark:bg-[#1B3142] text-[#667784] dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
          }`}
        >
          All categories ({totalCount})
        </button>
        {HAZARD_CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(isActive ? "" : cat.id)}
              className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
                isActive
                  ? "bg-[#087F8C] text-white"
                  : "bg-[#F7F9FA] dark:bg-[#1B3142] text-[#667784] dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Radius options when Near Me is active */}
      {nearMeActive && onSelectRadius && (
        <div className="flex items-center gap-2 pt-1 border-t border-[#DCE4E8]/60 dark:border-slate-800/80">
          <span className="text-[11px] font-medium text-[#667784] dark:text-slate-400">Radius:</span>
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {RADIUS_OPTIONS.map((r) => {
              const isSelected = radiusKm === r;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => onSelectRadius(r)}
                  className={`text-xs px-2.5 py-0.5 rounded-full font-medium transition-colors ${
                    isSelected
                      ? "bg-[#087F8C] text-white shadow-xs"
                      : "bg-[#F7F9FA] dark:bg-[#1B3142] text-[#667784] dark:text-slate-300 hover:bg-teal-50 dark:hover:bg-slate-700"
                  }`}
                >
                  {r} km
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Secondary filter bar: Status & metadata */}
      <div className="flex items-center justify-between text-xs text-[#667784] dark:text-slate-400">
        <div className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-[#087F8C]" />
          <span>Status:</span>
          <select
            value={selectedStatus}
            onChange={(e) => onSelectStatus(e.target.value)}
            className="bg-[#F7F9FA] dark:bg-[#1B3142] border border-[#DCE4E8] dark:border-slate-700 text-[#142B3B] dark:text-slate-100 text-xs rounded px-2 py-1 focus:outline-none focus:border-[#087F8C]"
          >
            {HAZARD_STATUSES.map((st) => (
              <option key={st.id} value={st.id === "all" ? "" : st.id}>
                {st.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1 text-[11px] text-[#667784] dark:text-slate-400">
          <Layers className="w-3.5 h-3.5" />
          <span>Community reports</span>
        </div>
      </div>
    </div>
  );
}

export default HazardFilters;
