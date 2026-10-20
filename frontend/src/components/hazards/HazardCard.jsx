import React, { useState } from "react";
import { ThumbsUp, Maximize2, Navigation } from "lucide-react";
import { CategoryBadge } from "./CategoryBadge";
import { FreshnessBadge } from "./FreshnessBadge";
import { getStatusBadgeStyle } from "../../utils/hazardConstants";
import { ImageLightboxModal } from "../common/ImageLightboxModal";

export function HazardCard({ hazard, isSelected = false, onSelect }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const statusStyle = getStatusBadgeStyle(hazard.status);
  const photoUri = hazard.photo || hazard.photo_url;

  return (
    <>
      <article
        onClick={() => onSelect && onSelect(hazard)}
        className={`p-3.5 rounded-lg border transition-all cursor-pointer text-left ${
          isSelected
            ? "bg-white dark:bg-[#182C3A] border-[#087F8C] ring-2 ring-[#087F8C]/20 shadow-sm"
            : "bg-white dark:bg-[#142533] border-[#DCE4E8] dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-xs"
        }`}
      >
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <CategoryBadge category={hazard.category} />
            {hazard.distance_km != null && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#087F8C] bg-[#E6F4F6] dark:bg-[#087F8C]/20 dark:text-teal-300 px-2 py-0.5 rounded-full border border-teal-200 dark:border-teal-800">
                <Navigation className="w-2.5 h-2.5 fill-[#087F8C] dark:fill-teal-300" />
                {hazard.distance_km < 1 ? `${Math.round(hazard.distance_km * 1000)} m` : `${hazard.distance_km.toFixed(1)} km`}
              </span>
            )}
          </div>
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

        {/* Photographic Evidence Attachment */}
        {photoUri && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              setLightboxOpen(true);
            }}
            className="mb-3 relative h-40 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 cursor-pointer group shadow-xs hover:border-teal-500 transition-all"
          >
            <img
              src={photoUri}
              alt="Hazard observation"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-end justify-end p-2.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold text-white bg-black/60 backdrop-blur-xs group-hover:bg-[#087F8C] transition-colors shadow-xs">
                <Maximize2 className="w-3.5 h-3.5" />
                Click to expand
              </span>
            </div>
          </div>
        )}

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

      {photoUri && (
        <ImageLightboxModal
          isOpen={lightboxOpen}
          imageUrl={photoUri}
          title={hazard.location_label || "Road Hazard"}
          subtitle={`${hazard.category_display || hazard.category || "Hazard"} \u2022 ${hazard.status_display || hazard.status || "Reported"}`}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  );
}

export default HazardCard;
