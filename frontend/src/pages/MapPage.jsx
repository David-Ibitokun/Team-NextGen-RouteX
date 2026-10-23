import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { AppHeader } from "../components/layout/AppHeader";
import { MobileBottomNavigation } from "../components/layout/MobileBottomNavigation";
import { HazardMap } from "../components/map/HazardMap";
import { HazardFilters } from "../components/hazards/HazardFilters";
import { HazardCard } from "../components/hazards/HazardCard";
import { HazardDetailsPanel } from "../components/hazards/HazardDetailsPanel";
import { ReportHazardModal } from "../components/hazards/ReportHazardModal";
import { LoadingState } from "../components/feedback/LoadingState";
import { EmptyState } from "../components/feedback/EmptyState";
import { ErrorState } from "../components/feedback/ErrorState";
import { DemoDataBanner } from "../components/feedback/DemoDataBanner";
import { hazardService } from "../services/apiClient";
import { useAuth } from "../context/AuthContext";

export function MapPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get("category") || "";
  const initialStatus = searchParams.get("status") || "";

  const [hazards, setHazards] = useState([]);
  const [selectedHazard, setSelectedHazard] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedStatus, setSelectedStatus] = useState(initialStatus);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [mobileTab, setMobileTab] = useState("map"); // "map" | "list"
  const { user } = useAuth();

  // Geolocation & Near Me State
  const [userLocation, setUserLocation] = useState(null);
  const [nearMeActive, setNearMeActive] = useState(false);
  const [nearMeRadiusKm, setNearMeRadiusKm] = useState(10);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState(null);

  // Sync state with URL search params when category or status changes
  const handleCategoryChange = (cat) => {
    setSelectedCategory(cat);
    const newParams = new URLSearchParams(searchParams);
    if (cat) newParams.set("category", cat);
    else newParams.delete("category");
    setSearchParams(newParams);
  };

  const handleStatusChange = (st) => {
    setSelectedStatus(st);
    const newParams = new URLSearchParams(searchParams);
    if (st) newParams.set("status", st);
    else newParams.delete("status");
    setSearchParams(newParams);
  };

  const handleToggleNearMe = () => {
    if (nearMeActive) {
      setNearMeActive(false);
      setUserLocation(null);
      setLocationError(null);
      return;
    }

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }

    setLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserLocation(coords);
        setNearMeActive(true);
        setLocating(false);
      },
      (geoErr) => {
        setLocating(false);
        setNearMeActive(false);
        let msg = "Could not acquire your location.";
        if (geoErr.code === 1) {
          msg = "Location permission denied. Please allow location access in your browser settings to see hazards near you.";
        } else if (geoErr.code === 2) {
          msg = "Position unavailable. Please ensure your device's location/GPS is turned on.";
        } else if (geoErr.code === 3) {
          msg = "Location request timed out. Please try again.";
        }
        setLocationError(msg);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  };

  const fetchHazards = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (selectedCategory) params.category = selectedCategory;
      if (selectedStatus) params.status = selectedStatus;
      if (nearMeActive && userLocation) {
        params.lat = userLocation.lat;
        params.lng = userLocation.lng;
        params.radius_km = nearMeRadiusKm;
      }

      const response = await hazardService.getHazards(params);
      const items = response.results ? response.results : response;
      setHazards(items);

      const targetHazardId = searchParams.get("hazard_id") || searchParams.get("id");
      const targetLat = searchParams.get("lat");
      const targetLng = searchParams.get("lng");

      if (targetHazardId) {
        const found = items.find((h) => String(h.id) === String(targetHazardId));
        if (found) {
          setSelectedHazard(found);
          setMobileTab("map");
        } else if (targetLat && targetLng) {
          // If filtered out or not in current page, attempt fetching single hazard or fallback
          try {
            const single = await hazardService.getHazard(targetHazardId);
            if (single) {
              setSelectedHazard(single);
              setMobileTab("map");
            }
          } catch {
            // Create temporary target pin
            setSelectedHazard({
              id: Number(targetHazardId),
              latitude: Number(targetLat),
              longitude: Number(targetLng),
              location_label: "Reported Incident Location",
              description: "Target incident selected from moderation dashboard",
              category: "other",
              status: "reported",
            });
            setMobileTab("map");
          }
        }
      } else if (targetLat && targetLng) {
        // Find nearest or match
        const found = items.find(
          (h) =>
            Math.abs(Number(h.latitude) - Number(targetLat)) < 0.0005 &&
            Math.abs(Number(h.longitude) - Number(targetLng)) < 0.0005
        );
        if (found) {
          setSelectedHazard(found);
          setMobileTab("map");
        }
      } else if (selectedHazard) {
        const found = items.find((h) => h.id === selectedHazard.id);
        if (found) setSelectedHazard(found);
      }
    } catch (err) {
      setError("We could not load road hazards. Check your connection or try again.");
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, selectedStatus, searchParams, nearMeActive, userLocation, nearMeRadiusKm]);

  useEffect(() => {
    fetchHazards();
  }, [fetchHazards]);

  const handleHazardUpdated = (updatedHazard) => {
    setHazards((prev) =>
      prev.map((h) => (h.id === updatedHazard.id ? updatedHazard : h))
    );
    setSelectedHazard(updatedHazard);
  };

  const handleReportCreated = (newHazard) => {
    setHazards((prev) => [newHazard, ...prev]);
    setSelectedHazard(newHazard);
    setShowReportModal(false);
    setMobileTab("map");
  };

  const hasDemoReports = hazards.some((h) => h.is_demo);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-[#F7F9FA] dark:bg-[#0B161E] text-[#142B3B] dark:text-slate-100 transition-colors">
      <AppHeader onReportClick={() => setShowReportModal(true)} />
      <DemoDataBanner hasDemoReports={hasDemoReports} />

      {/* Main Container */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar (Desktop 30-35%, Hidden on Mobile when map active) */}
        <section
          aria-label="Hazard list and filters"
          className={`w-full md:w-[380px] lg:w-[420px] h-full flex flex-col bg-white dark:bg-[#142533] border-r border-[#DCE4E8] dark:border-slate-800 shrink-0 z-10 transition-colors ${
            mobileTab === "map" ? "hidden md:flex" : "flex"
          }`}
        >
          <HazardFilters
            selectedCategory={selectedCategory}
            onSelectCategory={handleCategoryChange}
            selectedStatus={selectedStatus}
            onSelectStatus={handleStatusChange}
            totalCount={hazards.length}
            nearMeActive={nearMeActive}
            onToggleNearMe={handleToggleNearMe}
            locating={locating}
            radiusKm={nearMeRadiusKm}
            onSelectRadius={setNearMeRadiusKm}
          />

          {locationError && (
            <div className="mx-3 mt-2 p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-800 dark:text-amber-300 flex items-start justify-between gap-2">
              <span>{locationError}</span>
              <button
                type="button"
                onClick={() => setLocationError(null)}
                className="text-amber-600 hover:text-amber-900 dark:text-amber-400 font-bold text-sm leading-none"
              >
                &times;
              </button>
            </div>
          )}

          {/* List or Feedback States */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 pb-20 md:pb-4">
            {loading && <LoadingState message="Fetching community road hazards..." />}

            {!loading && error && (
              <ErrorState message={error} onRetry={fetchHazards} />
            )}

            {!loading && !error && hazards.length === 0 && (
              <EmptyState
                title={nearMeActive ? `No Hazards Within ${nearMeRadiusKm} km` : "No reports match these filters"}
                message={
                  nearMeActive
                    ? `Great news! No road hazards have been reported within ${nearMeRadiusKm} km of your current location.`
                    : "No reports match these filters. Try another filter or report a hazard you see."
                }
                actionLabel={nearMeActive ? "View All Hazards" : "Report a hazard"}
                onAction={nearMeActive ? () => handleToggleNearMe() : () => setShowReportModal(true)}
              />
            )}

            {!loading &&
              !error &&
              hazards.map((hazard) => (
                <HazardCard
                  key={hazard.id}
                  hazard={hazard}
                  isSelected={selectedHazard?.id === hazard.id}
                  onSelect={(h) => {
                    setSelectedHazard(h);
                    setMobileTab("map");
                  }}
                  onViewOnMap={(h) => {
                    setSelectedHazard(h);
                    setMobileTab("map");
                  }}
                />
              ))}
          </div>
        </section>

        {/* Center/Right Map Area (~65-70%) */}
        <section
          aria-label="Interactive map"
          className={`flex-1 h-full relative ${
            mobileTab === "list" ? "hidden md:block" : "block"
          }`}
        >
          <HazardMap
            hazards={hazards}
            selectedHazard={selectedHazard}
            onSelectHazard={(h) => setSelectedHazard(h)}
            userLocation={userLocation}
            radiusKm={nearMeRadiusKm}
          />

          {/* Floating Details Slide-over for Selected Report */}
          {selectedHazard && (
            <div className="absolute top-0 right-0 bottom-0 w-full sm:w-[380px] md:w-[420px] z-1000 shadow-xl bg-white dark:bg-[#142533] animate-in slide-in-from-right duration-200">
              <HazardDetailsPanel
                hazard={selectedHazard}
                onClose={() => setSelectedHazard(null)}
                onHazardUpdated={handleHazardUpdated}
              />
            </div>
          )}
        </section>
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNavigation
        activeTab={mobileTab}
        onTabChange={setMobileTab}
        onReportClick={() => setShowReportModal(true)}
      />

      {/* Report Modal */}
      <ReportHazardModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        onSuccess={handleReportCreated}
      />
    </div>
  );
}

export default MapPage;
