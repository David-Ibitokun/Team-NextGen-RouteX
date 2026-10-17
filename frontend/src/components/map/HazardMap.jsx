import React, { useEffect } from "react";
import { MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { HazardMarker } from "./HazardMarker";
import { useTheme } from "../../context/ThemeContext";

import { Layers, Map as MapIcon } from "lucide-react";

// Lagos, Nigeria coordinates
const LAGOS_CENTER = [6.5244, 3.3792];
const DEFAULT_ZOOM = 12;

export const MAP_LAYERS = {
  osm: {
    id: "osm",
    label: "OpenStreetMap",
    url: "https://tile.openstreetmap.de/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  },
  esri: {
    id: "esri",
    label: "Esri Streets",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
    attribution: 'Tiles &copy; <a href="https://www.esri.com">Esri</a> &mdash; DeLorme, NAVTEQ',
    maxZoom: 19,
  },
};

function MapResizeHandler() {
  const map = useMap();
  useEffect(() => {
    // Invalidate map size after mount and after small delay to avoid grey tile clipping
    map.invalidateSize();
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);

    const onResize = () => map.invalidateSize();
    window.addEventListener("resize", onResize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", onResize);
    };
  }, [map]);
  return null;
}

function MapEventsHandler({ onBoundsChange }) {
  const map = useMapEvents({
    moveend: () => {
      if (onBoundsChange) {
        const bounds = map.getBounds();
        onBoundsChange({
          min_lat: bounds.getSouth(),
          max_lat: bounds.getNorth(),
          min_lng: bounds.getWest(),
          max_lng: bounds.getEast(),
        });
      }
    },
  });
  return null;
}

function FlyToSelectedHazard({ selectedHazard }) {
  const map = useMap();
  useEffect(() => {
    if (selectedHazard && selectedHazard.latitude && selectedHazard.longitude) {
      map.flyTo(
        [Number(selectedHazard.latitude), Number(selectedHazard.longitude)],
        Math.max(map.getZoom(), 14),
        { duration: 1 }
      );
    }
  }, [selectedHazard, map]);

  return null;
}

export function HazardMap({
  hazards = [],
  selectedHazard,
  onSelectHazard,
  onBoundsChange,
  className = "w-full h-full",
}) {
  const { isDark } = useTheme();
  const [activeLayer, setActiveLayer] = React.useState("osm");

  const currentLayer = MAP_LAYERS[activeLayer] || MAP_LAYERS.osm;

  return (
    <div className={`relative ${className}`}>
      <MapContainer
        center={LAGOS_CENTER}
        zoom={DEFAULT_ZOOM}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <TileLayer
          key={`${activeLayer}-${isDark ? "dark" : "light"}`}
          attribution={currentLayer.attribution}
          url={currentLayer.url}
          maxZoom={currentLayer.maxZoom}
        />

        <MapResizeHandler />
        <MapEventsHandler onBoundsChange={onBoundsChange} />
        <FlyToSelectedHazard selectedHazard={selectedHazard} />

        {hazards.map((hazard) => (
          <HazardMarker
            key={hazard.id}
            hazard={hazard}
            isSelected={selectedHazard?.id === hazard.id}
            onSelect={onSelectHazard}
          />
        ))}
      </MapContainer>

      {/* Layer Switcher Pill */}
      <div className="absolute top-3 right-3 z-1000 flex items-center bg-white/90 dark:bg-[#142533]/90 backdrop-blur-md rounded-lg p-1 border border-slate-200/80 dark:border-slate-700/80 shadow-md text-xs">
        <button
          type="button"
          onClick={() => setActiveLayer("osm")}
          className={`px-2.5 py-1 rounded-md font-medium transition-all ${
            activeLayer === "osm"
              ? "bg-[#087F8C] text-white shadow-xs"
              : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
          }`}
          title="OpenStreetMap Standard (Free, community-powered)"
        >
          OSM
        </button>
        <button
          type="button"
          onClick={() => setActiveLayer("esri")}
          className={`px-2.5 py-1 rounded-md font-medium transition-all ${
            activeLayer === "esri"
              ? "bg-[#087F8C] text-white shadow-xs"
              : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
          }`}
          title="Esri World Streets (High performance global CDN)"
        >
          Esri Streets
        </button>
      </div>
    </div>
  );
}

export default HazardMap;
