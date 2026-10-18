export const HAZARD_CATEGORIES = [
  {
    id: "flooding",
    label: "Flooding",
    description: "Deep standing water, impassable road, or drainage overflow",
    badgeBg: "bg-blue-100",
    badgeText: "text-blue-800",
    markerColor: "#087F8C", // Teal
  },
  {
    id: "pothole",
    label: "Pothole",
    description: "Deep crater, road surface damage, or sinkhole",
    badgeBg: "bg-amber-100",
    badgeText: "text-amber-800",
    markerColor: "#F2B544", // Amber
  },
  {
    id: "blocked_road",
    label: "Blocked road",
    description: "Broken vehicle, accident, or road obstruction",
    badgeBg: "bg-red-100",
    badgeText: "text-red-800",
    markerColor: "#D64545", // Red
  },
  {
    id: "fallen_tree",
    label: "Fallen tree",
    description: "Fallen tree, hanging branch, or fallen pole/cables",
    badgeBg: "bg-emerald-100",
    badgeText: "text-emerald-800",
    markerColor: "#27865B", // Green
  },
  {
    id: "other",
    label: "Other hazard",
    description: "Dangerous road situation not covered above",
    badgeBg: "bg-slate-100",
    badgeText: "text-slate-800",
    markerColor: "#667784", // Slate
  },
];

export const HAZARD_STATUSES = [
  { id: "all", label: "All statuses" },
  { id: "reported", label: "Reported" },
  { id: "under_review", label: "Under review" },
  { id: "community_confirmed", label: "Community-confirmed" },
  { id: "resolved", label: "Resolved" },
];

export function getCategoryConfig(categoryId) {
  return (
    HAZARD_CATEGORIES.find((c) => c.id === categoryId) || {
      id: categoryId,
      label: categoryId,
      description: "",
      badgeBg: "bg-slate-100",
      badgeText: "text-slate-800",
      markerColor: "#667784",
    }
  );
}

export function getStatusBadgeStyle(status) {
  switch (status) {
    case "community_confirmed":
      return "bg-[#087F8C]/15 text-[#087F8C] border-[#087F8C]/30";
    case "under_review":
      return "bg-[#F2B544]/20 text-[#855B09] border-[#F2B544]/40";
    case "resolved":
      return "bg-[#27865B]/15 text-[#27865B] border-[#27865B]/30";
    case "rejected":
      return "bg-[#D64545]/15 text-[#D64545] border-[#D64545]/30";
    case "reported":
    default:
      return "bg-[#667784]/15 text-[#142B3B] dark:text-slate-200 border-[#667784]/30";
  }
}
