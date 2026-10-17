import React from "react";

export function RouteXLogo({ size = "md", showText = false, showTagline = false, className = "" }) {
  const sizeMap = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-10 h-10",
    xl: "w-12 h-12",
  };

  const svgClass = sizeMap[size] || sizeMap.md;

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <svg
        className={`${svgClass} shrink-0`}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="RouteX Logo"
      >
        <defs>
          <linearGradient id="routex-logo-grad" x1="5.5" y1="2.5" x2="42.5" y2="46.8" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0AA3B3" />
            <stop offset="100%" stopColor="#087F8C" />
          </linearGradient>
        </defs>
        {/* Map Pin */}
        <path
          d="M24 2.5C13.8 2.5 5.5 10.8 5.5 21c0 13.4 15.4 23.9 17.9 25.5a1.6 1.6 0 0 0 1.2.3c2.5-1.6 17.9-12.1 17.9-25.8C42.5 10.8 34.2 2.5 24 2.5z"
          fill="url(#routex-logo-grad)"
        />
        {/* Road Surface */}
        <path
          d="M21.4 38.5C21.4 31 28.2 29.2 28.2 22.6 28.2 18.6 24.4 17.4 24.4 12.4"
          stroke="#FFFFFF"
          strokeWidth="5.6"
          strokeLinecap="round"
        />
        {/* Center Lane Markings */}
        <path
          d="M21.4 38.5C21.4 31 28.2 29.2 28.2 22.6 28.2 18.6 24.4 17.4 24.4 12.4"
          stroke="#087F8C"
          strokeWidth="1.2"
          strokeDasharray="2.4 2.2"
          strokeLinecap="round"
        />
        {/* Destination Waypoint */}
        <circle cx="24.4" cy="11" r="3.6" fill="#FFFFFF" />
        <circle cx="24.4" cy="11" r="1.6" fill="#087F8C" />
      </svg>

      {showText && (
        <div className="flex flex-col">
          <span className="font-extrabold text-base tracking-tight text-[#142B3B] dark:text-white leading-tight">
            RouteX
          </span>
          {showTagline && (
            <span className="text-[10px] text-[#667784] dark:text-slate-400 leading-none">
              Know the Road Ahead.
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default RouteXLogo;
