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

  const fetchHazards = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (selectedCategory) params.category = selectedCategory;
      if (selectedStatus) params.status = selectedStatus;

      const response = await hazardService.getHazards(params);
      const items = response.results ? response.results : response;
      setHazards(items);

      if (selectedHazard) {
        const found = items.find((h) => h.id === selectedHazard.id);
        if (found) setSelectedHazard(found);
      }
    } catch (err) {
      setError("We could not load road hazards. Check your connection or try again.");
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, selectedStatus]);

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
          />

          {/* List or Feedback States */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 pb-20 md:pb-4">
            {loading && <LoadingState message="Fetching community road hazards..." />}

            {!loading && error && (
              <ErrorState message={error} onRetry={fetchHazards} />
            )}

            {!loading && !error && hazards.length === 0 && (
              <EmptyState
                title="No reports match these filters"
                message="No reports match these filters. Try another filter or report a hazard you see."
                actionLabel="Report a hazard"
                onAction={() => setShowReportModal(true)}
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
