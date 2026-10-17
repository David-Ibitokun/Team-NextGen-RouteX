import React from "react";
import { Clock } from "lucide-react";

export function FreshnessBadge({ freshness, createdAt }) {
  let label = "Recent report";
  let isStale = false;

  if (freshness && freshness.label) {
    label = freshness.label;
    isStale = !!freshness.is_stale;
  } else if (createdAt) {
    const created = new Date(createdAt);
    const now = new Date();
    const diffMins = Math.floor((now - created) / 60000);
    if (diffMins < 60) {
      label = `Reported ${diffMins <= 1 ? "just now" : `${diffMins} minutes ago`}`;
    } else {
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) {
        label = `Reported ${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;
      } else {
        const diffDays = Math.floor(diffHours / 24);
        label = `Reported ${diffDays} ${diffDays === 1 ? "day" : "days"} ago`;
        isStale = diffDays >= 2;
      }
    }
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${
        isStale
          ? "bg-amber-100 text-[#855B09] border border-amber-200"
          : "bg-slate-100 text-[#667784]"
      }`}
      title={isStale ? "This report may be out of date. Check the latest updates." : "Recent report"}
    >
      <Clock className="w-3 h-3 shrink-0" />
      <span>{label}</span>
    </span>
  );
}

export default FreshnessBadge;
