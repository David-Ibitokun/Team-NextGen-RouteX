import React from "react";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { getCategoryConfig } from "../../utils/hazardConstants";

// Cache custom icons so we do not recreate them on every render
const iconCache = {};

function createCustomMarkerIcon(category, isSelected, isDemo) {
  const cacheKey = `${category}-${isSelected}-${isDemo}`;
  if (iconCache[cacheKey]) {
    return iconCache[cacheKey];
  }

  const config = getCategoryConfig(category);
  const bgColor = config.markerColor || "#087F8C";
  const size = isSelected ? 38 : 32;

  // Visual category indicator letter
  const initial = (config.label || "H")[0].toUpperCase();

  const html = `
    <div style="
      width: ${size}px;
      height: ${size}px;
      background-color: ${bgColor};
      border: 3px solid ${isSelected ? "#142B3B" : "#FFFFFF"};
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #FFFFFF;
      font-weight: 700;
      font-size: ${isSelected ? "14px" : "12px"};
      box-shadow: 0 4px 10px rgba(0,0,0,0.3);
      cursor: pointer;
      position: relative;
    ">
      <span>${initial}</span>
      ${isDemo ? '<span style="position:absolute; bottom:-3px; right:-3px; width:10px; height:10px; background:#F2B544; border:1.5px solid #fff; border-radius:50%;" title="Demo report"></span>' : ""}
    </div>
  `;

  const icon = L.divIcon({
    html,
    className: "routex-leaflet-marker",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2)],
  });

  iconCache[cacheKey] = icon;
  return icon;
}

export function HazardMarker({ hazard, isSelected = false, onSelect }) {
  const icon = createCustomMarkerIcon(hazard.category, isSelected, hazard.is_demo);
  const position = [Number(hazard.latitude), Number(hazard.longitude)];

  return (
    <Marker
      position={position}
      icon={icon}
      eventHandlers={{
        click: () => onSelect && onSelect(hazard),
      }}
    >
      <Popup>
        <div className="p-1 max-w-xs text-xs font-sans">
          <div className="font-bold text-[#142B3B] mb-1">
            {hazard.location_label || "Hazard Location"}
          </div>
          <div className="text-[#667784] mb-2 line-clamp-2">
            {hazard.description}
          </div>
          <button
            type="button"
            onClick={() => onSelect && onSelect(hazard)}
            className="w-full text-center py-1 px-2 bg-[#087F8C] text-white rounded font-medium text-[11px]"
          >
            View details
          </button>
        </div>
      </Popup>
    </Marker>
  );
}

export default HazardMarker;
