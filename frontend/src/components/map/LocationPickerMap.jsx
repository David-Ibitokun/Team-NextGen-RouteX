import React, { useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import { Navigation, MapPin } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

const DEFAULT_MAP_CENTER = [6.5244, 3.3792];

const pickerIcon = L.divIcon({
  html: `
    <div style="
      width: 32px;
      height: 32px;
      background-color: #087F8C;
      border: 3px solid #FFFFFF;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 4px 8px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="
        width: 10px;
        height: 10px;
        background-color: #FFFFFF;
        border-radius: 50%;
        transform: rotate(45deg);
      "></div>
    </div>
  `,
  className: "routex-picker-marker",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

function MapClickHandler({ onLocationSelected }) {
  useMapEvents({
    click: (e) => {
      onLocationSelected(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function MapResizeHandler() {
  const map = useMap();
  React.useEffect(() => {
    map.invalidateSize();
    const timer = setTimeout(() => map.invalidateSize(), 200);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

function PanToLocation({ position }) {
  const map = useMap();
  React.useEffect(() => {
    if (position) {
      map.panTo(position);
    }
  }, [position, map]);
  return null;
}

export function LocationPickerMap({
  latitude,
  longitude,
  onLocationChange,
  className = "h-64 w-full",
}) {
  const { isDark } = useTheme();
  const [geoLocating, setGeoLocating] = useState(false);
  const [geoMessage, setGeoMessage] = useState("");

  const hasPosition = latitude && longitude;
  const currentPosition = hasPosition
    ? [Number(latitude), Number(longitude)]
    : DEFAULT_MAP_CENTER;

  const tileUrl = "https://tile.openstreetmap.de/{z}/{x}/{y}.png";
  const tileAttribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoMessage("Geolocation is not supported by your browser. Please tap the map to place the pin.");
      return;
    }

    setGeoLocating(true);
    setGeoMessage("");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoLocating(false);
        onLocationChange(pos.coords.latitude, pos.coords.longitude);
      },
      (err) => {
        setGeoLocating(false);
        setGeoMessage(
          "We couldn't get your location. Move the map pin or enter the location manually."
        );
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-[#667784] dark:text-slate-400">
        <span>Tap the map to set the exact hazard location:</span>
        <button
          type="button"
          onClick={handleGetCurrentLocation}
          disabled={geoLocating}
          className="inline-flex items-center gap-1 text-[#087F8C] hover:text-[#0aa3b3] font-medium"
        >
          <Navigation className="w-3.5 h-3.5" />
          {geoLocating ? "Locating..." : "Use current location"}
        </button>
      </div>

      <div className={`relative rounded-lg overflow-hidden border border-[#DCE4E8] dark:border-slate-700 ${className}`}>
        <MapContainer
          center={currentPosition}
          zoom={13}
          scrollWheelZoom={false}
          className="w-full h-full"
        >
          <TileLayer
            key={isDark ? "picker-dark" : "picker-light"}
            attribution={tileAttribution}
            url={tileUrl}
          />
          <MapResizeHandler />
          <MapClickHandler onLocationSelected={onLocationChange} />
          {hasPosition && <PanToLocation position={currentPosition} />}
          {hasPosition && (
            <Marker position={currentPosition} icon={pickerIcon} />
          )}
        </MapContainer>

        <div className="absolute bottom-2 left-2 right-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs p-1.5 rounded text-[11px] text-[#142B3B] dark:text-slate-100 flex items-center justify-between shadow-xs z-1000 border border-slate-200/50 dark:border-slate-700/50">
          <div className="flex items-center gap-1 font-mono">
            <MapPin className="w-3.5 h-3.5 text-[#087F8C]" />
            {hasPosition ? (
              <span>
                {Number(latitude).toFixed(6)}, {Number(longitude).toFixed(6)}
              </span>
            ) : (
              <span className="text-[#667784] dark:text-slate-400 font-sans">
                No location selected yet. Tap the map.
              </span>
            )}
          </div>
        </div>
      </div>

      {geoMessage && (
        <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-2 rounded border border-amber-200 dark:border-amber-800">
          {geoMessage}
        </p>
      )}
    </div>
  );
}

export default LocationPickerMap;
