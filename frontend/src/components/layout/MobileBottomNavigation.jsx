import React from "react";
import { Map, List, PlusCircle } from "lucide-react";

export function MobileBottomNavigation({ activeTab, onTabChange, onReportClick }) {
  return (
    <nav
      aria-label="Mobile navigation"
      className="sm:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-[#0B161E] border-t border-[#DCE4E8] dark:border-slate-800 px-4 py-2 flex items-center justify-around z-30 shadow-md transition-colors"
    >
      <button
        type="button"
        onClick={() => onTabChange("map")}
        className={`flex flex-col items-center gap-1 text-[11px] font-medium transition-colors ${
          activeTab === "map" ? "text-[#087F8C] dark:text-teal-400" : "text-[#667784] dark:text-slate-400"
        }`}
      >
        <Map className="w-4 h-4" />
        <span>Map</span>
      </button>

      <button
        type="button"
        onClick={onReportClick}
        className="flex flex-col items-center gap-1 text-[11px] font-semibold text-[#087F8C] dark:text-teal-400 -mt-5 bg-white dark:bg-[#142533] p-2 rounded-full border border-[#DCE4E8] dark:border-slate-700 shadow-md hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
      >
        <div className="w-8 h-8 rounded-full bg-[#087F8C] flex items-center justify-center text-white">
          <PlusCircle className="w-5 h-5" />
        </div>
        <span>Report</span>
      </button>

      <button
        type="button"
        onClick={() => onTabChange("list")}
        className={`flex flex-col items-center gap-1 text-[11px] font-medium transition-colors ${
          activeTab === "list" ? "text-[#087F8C] dark:text-teal-400" : "text-[#667784] dark:text-slate-400"
        }`}
      >
        <List className="w-4 h-4" />
        <span>List</span>
      </button>
    </nav>
  );
}

export default MobileBottomNavigation;
