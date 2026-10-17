import React from "react";
import { Droplets, CircleAlert, ShieldAlert, Trees, AlertCircle } from "lucide-react";
import { getCategoryConfig } from "../../utils/hazardConstants";

export function CategoryBadge({ category, showIcon = true, size = "sm" }) {
  const config = getCategoryConfig(category);

  const renderIcon = () => {
    const iconSize = size === "lg" ? "w-4 h-4" : "w-3 h-3";
    switch (category) {
      case "flooding":
        return <Droplets className={iconSize} />;
      case "pothole":
        return <CircleAlert className={iconSize} />;
      case "blocked_road":
        return <ShieldAlert className={iconSize} />;
      case "fallen_tree":
        return <Trees className={iconSize} />;
      default:
        return <AlertCircle className={iconSize} />;
    }
  };

  const sizeClasses = size === "lg" ? "text-sm px-2.5 py-1" : "text-xs px-2 py-0.5";

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-md ${config.badgeBg} ${config.badgeText} ${sizeClasses}`}
    >
      {showIcon && renderIcon()}
      <span>{config.label}</span>
    </span>
  );
}

export default CategoryBadge;
