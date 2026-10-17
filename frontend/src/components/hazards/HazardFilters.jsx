import React from "react";
import { Filter, Layers } from "lucide-react";
import { HAZARD_CATEGORIES, HAZARD_STATUSES } from "../../utils/hazardConstants";

export function HazardFilters({
  selectedCategory,
  onSelectCategory,
  selectedStatus,
  onSelectStatus,
  totalCount = 0,
}) {
  return (
    <div className="bg-white dark:bg-[#142533] border-b border-[#DCE4E8] dark:border-slate-800 p-3 space-y-2.5 transition-colors">
      {/* Category chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
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
