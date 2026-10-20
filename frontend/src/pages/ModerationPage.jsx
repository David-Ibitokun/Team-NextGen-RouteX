import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  FileText,
  History,
  Filter,
  Check,
  X,
  ExternalLink,
  RefreshCw,
  Eye,
  Sliders,
  Search,
  ArrowUpDown,
  Maximize2,
  Sparkles,
} from "lucide-react";
import { AppHeader } from "../components/layout/AppHeader";
import { CategoryBadge } from "../components/hazards/CategoryBadge";
import { FreshnessBadge } from "../components/hazards/FreshnessBadge";
import { LoadingState } from "../components/feedback/LoadingState";
import { ErrorState } from "../components/feedback/ErrorState";
import { EmptyState } from "../components/feedback/EmptyState";
import { PaginationBar } from "../components/common/PaginationBar";
import { ImageLightboxModal } from "../components/common/ImageLightboxModal";
import { moderationService } from "../services/apiClient";
import { aiService } from "../services/aiService";
import { AISuggestionCard } from "../components/ai/AISuggestionCard";
import { useAuth } from "../context/AuthContext";

export function ModerationPage() {
  const navigate = useNavigate();
  const { user, isModerator, isAdmin, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState("queue"); // "queue" | "history"
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination State
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // Filter States
  const [filterFlaggedOnly, setFilterFlaggedOnly] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [ordering, setOrdering] = useState("-flags_count");

  const [selectedReport, setSelectedReport] = useState(null);

  // Action modal state
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState("review");
  const [actionReason, setActionReason] = useState("");
  const [submittingAction, setSubmittingAction] = useState(false);
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  // Audit history state
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [actionHistory, setActionHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Platform-wide history state
  const [platformHistory, setPlatformHistory] = useState([]);
  const [loadingPlatformHistory, setLoadingPlatformHistory] = useState(false);

  // AI Assistant states for moderator
  const [aiSummary, setAiSummary] = useState(null);
  const [loadingAiSummary, setLoadingAiSummary] = useState(false);
  const [aiDuplicates, setAiDuplicates] = useState(null);
  const [loadingAiDuplicates, setLoadingAiDuplicates] = useState(false);
  const [aiModalNotice, setAiModalNotice] = useState(null);

  const fetchModerationData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = { page, page_size: pageSize };
      if (filterFlaggedOnly) params.flagged_only = true;
      if (statusFilter && statusFilter !== "all") params.status = statusFilter;
      if (categoryFilter && categoryFilter !== "all") params.category = categoryFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (ordering) params.ordering = ordering;

      const [reportsData, statsData] = await Promise.all([
        moderationService.getReports(params),
        moderationService.getStats().catch(() => null),
      ]);

      const items = reportsData.results ? reportsData.results : (Array.isArray(reportsData) ? reportsData : []);
      const count = reportsData.count ?? (Array.isArray(reportsData) ? reportsData.length : items.length);
      setReports(items);
      setTotalCount(count);
      if (statsData) setStats(statsData);
    } catch (err) {
      setError("Failed to fetch moderation queue. Check your network or permissions.");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, filterFlaggedOnly, statusFilter, categoryFilter, searchQuery, ordering]);

  const clearFilters = () => {
    setFilterFlaggedOnly(false);
    setStatusFilter("all");
    setCategoryFilter("all");
    setSearchQuery("");
    setOrdering("-flags_count");
    setPage(1);
  };

  const hasActiveFilters = filterFlaggedOnly || statusFilter !== "all" || categoryFilter !== "all" || searchQuery.trim() !== "" || ordering !== "-flags_count";

  const fetchPlatformHistory = useCallback(async () => {
    try {
      setLoadingPlatformHistory(true);
      const data = await moderationService.getAllHistory();
      setPlatformHistory(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      console.error("Failed to fetch platform moderation history:", err);
    } finally {
      setLoadingPlatformHistory(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate("/login?redirect=/moderator");
      } else if (isModerator) {
        fetchModerationData();
        if (activeTab === "history") fetchPlatformHistory();
      }
    }
  }, [user, isModerator, authLoading, navigate, fetchModerationData, activeTab, fetchPlatformHistory]);

  const handleOpenActionModal = (report, defaultAction) => {
    setSelectedReport(report);
    setActionType(defaultAction);
    setActionReason("");
    setActionError("");
    setActionSuccess("");
    setAiSummary(null);
    setAiDuplicates(null);
    setAiModalNotice(null);
    setActionModalOpen(true);
  };

  const handleFetchAiSummary = async (reportId) => {
    try {
      setLoadingAiSummary(true);
      setAiModalNotice(null);
      const res = await aiService.summarizeReport(reportId);
      setAiSummary(res);
    } catch (err) {
      const isAuth = err.response?.status === 401 || err.response?.status === 403 || err.response?.data?.detail?.includes("authenticated");
      const msg = isAuth ? "AI incident summarizer won't work because you are not authenticated. Please sign in to your RouteX account." : (err.response?.data?.error || err.response?.data?.detail || "AI incident summarizer is temporarily unavailable.");
      setAiModalNotice({ type: "error", message: msg });
    } finally {
      setLoadingAiSummary(false);
    }
  };

  const handleFetchAiDuplicates = async (report) => {
    try {
      setLoadingAiDuplicates(true);
      setAiModalNotice(null);
      const res = await aiService.checkDuplicates({
        latitude: report.latitude,
        longitude: report.longitude,
        description: report.description,
        category: report.category,
        radius_km: 1.0,
        exclude_report_id: report.id,
      });
      setAiDuplicates(res);
    } catch (err) {
      const isAuth = err.response?.status === 401 || err.response?.status === 403 || err.response?.data?.detail?.includes("authenticated");
      const msg = isAuth ? "Duplicate scanner won't work because you are not authenticated. Please sign in to your RouteX account." : (err.response?.data?.error || err.response?.data?.detail || "Duplicate scanner is temporarily unavailable.");
      setAiModalNotice({ type: "error", message: msg });
    } finally {
      setLoadingAiDuplicates(false);
    }
  };

  const handleSubmitAction = async (e) => {
    e.preventDefault();
    if (!actionReason.trim() || actionReason.trim().length < 3) {
      setActionError("Please provide an explanatory reason for this moderation action (min 3 chars).");
      return;
    }

    setSubmittingAction(true);
    setActionError("");
    try {
      const response = await moderationService.takeAction(selectedReport.id, {
        action: actionType,
        reason: actionReason.trim(),
      });

      // Update local report in list
      setReports((prev) =>
        prev.map((r) => (r.id === selectedReport.id ? response.report : r))
      );
      setActionSuccess(response.message || "Moderation action recorded successfully.");
      fetchModerationData();

      setTimeout(() => {
        setActionModalOpen(false);
      }, 1000);
    } catch (err) {
      setActionError("Unable to apply moderation action. Please check your input and try again.");
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleViewReportHistory = async (report) => {
    setSelectedReport(report);
    setHistoryModalOpen(true);
    setLoadingHistory(true);
    try {
      const hist = await moderationService.getReportHistory(report.id);
      setActionHistory(hist);
    } catch (err) {
      setActionHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F7F9FA] dark:bg-[#0B161E] flex flex-col">
        <AppHeader />
        <div className="flex-1 flex items-center justify-center">
          <LoadingState message="Verifying moderator access..." />
        </div>
      </div>
    );
  }

  if (!authLoading && user && !isModerator) {
    return (
      <div className="min-h-screen bg-[#F7F9FA] dark:bg-[#0B161E] text-[#142B3B] dark:text-slate-100 flex flex-col font-sans transition-colors">
        <AppHeader />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-[#142533] p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-4 shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto border border-amber-200 dark:border-amber-900">
              <Shield className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-extrabold text-[#142B3B] dark:text-white">Moderator Access Restricted</h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              The moderation queue is strictly reserved for authorized platform staff and community safety moderators.
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <button
                onClick={() => navigate("/dashboard")}
                className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl"
              >
                Go to Citizen Dashboard
              </button>
              <button
                onClick={() => navigate("/map")}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#087F8C] hover:bg-[#0aa3b3] rounded-xl"
              >
                Return to Map
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F9FA] dark:bg-[#0B161E] text-[#142B3B] dark:text-slate-100 flex flex-col font-sans transition-colors">
      <AppHeader />

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:px-8 py-8 space-y-6">
        {/* Header Bar */}
        <div className="bg-white dark:bg-[#142533] p-6 md:p-8 rounded-2xl border border-[#DCE4E8] dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-extrabold text-[#142B3B] dark:text-white">
                  Trust & Safety Review Queue
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  Moderator Workspace
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Audit reported road hazards, review flagged submissions, and record transparent resolution decisions.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchModerationData}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh Queue
            </button>
            {isAdmin && (
              <Link
                to="/admin-dashboard"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100"
              >
                <Sliders className="w-3.5 h-3.5" />
                Admin Portal
              </Link>
            )}
          </div>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-[#142533] p-4 rounded-2xl border border-[#DCE4E8] dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase">
              <span>Pending Flags</span>
              <AlertTriangle className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 mt-1">
              {stats?.pending_flags ?? reports.filter((r) => r.flags_count > 0).length}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Require urgent inspection</p>
          </div>

          <div className="bg-white dark:bg-[#142533] p-4 rounded-2xl border border-[#DCE4E8] dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase">
              <span>Under Review</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
              {stats?.under_review ?? reports.filter((r) => r.status === "under_review").length}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Investigating conditions</p>
          </div>

          <div className="bg-white dark:bg-[#142533] p-4 rounded-2xl border border-[#DCE4E8] dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase">
              <span>Active Reported</span>
              <Eye className="w-4 h-4 text-teal-500" />
            </div>
            <div className="text-2xl font-extrabold text-[#087F8C] dark:text-teal-400 mt-1">
              {stats?.active_reported ?? reports.filter((r) => r.status === "reported").length}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Community ground reports</p>
          </div>

          <div className="bg-white dark:bg-[#142533] p-4 rounded-2xl border border-[#DCE4E8] dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase">
              <span>Resolved</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
              {stats?.resolved ?? reports.filter((r) => r.status === "resolved").length}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Cleared hazards</p>
          </div>
        </div>

        {/* Tab & Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="overflow-x-auto">
            <div className="flex w-max min-w-full items-center space-x-6 text-sm font-semibold">
              <button
                onClick={() => setActiveTab("queue")}
                className={`pb-2 flex items-center gap-2 border-b-2 transition-all ${
                  activeTab === "queue"
                    ? "border-amber-500 text-amber-600 dark:text-amber-400"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                Queue Reports ({totalCount})
              </button>

              <button
                onClick={() => {
                  setActiveTab("history");
                  fetchPlatformHistory();
                }}
                className={`pb-2 flex items-center gap-2 border-b-2 transition-all ${
                  activeTab === "history"
                    ? "border-amber-500 text-amber-600 dark:text-amber-400"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                Moderation Decision History
              </button>
            </div>
          </div>
        </div>

        {/* Tab 1: Queue Reports */}
        {activeTab === "queue" && (
          <div className="space-y-4">
            {/* Enhanced Queue Filter & Search Bar */}
            <div className="rounded-2xl border border-[#DCE4E8] dark:border-slate-800 bg-white dark:bg-[#142533] p-4 sm:p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-900/50">
                    <Filter className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-[#142B3B] dark:text-white">Moderation Queue Filters</h2>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Showing {reports.length} of {totalCount} {totalCount === 1 ? "report" : "reports"} from live database
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                      Clear Filters
                    </button>
                  )}
                  <button
                    onClick={fetchModerationData}
                    disabled={loading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-amber-500" : ""}`} />
                    Sync
                  </button>
                </div>
              </div>

              {/* Search, Category, and Ordering */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
                <div className="sm:col-span-6 relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setPage(1);
                    }}
                    placeholder="Search by landmark, street, or description..."
                    className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-[#142B3B] dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setPage(1);
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="sm:col-span-3">
                  <select
                    value={categoryFilter}
                    onChange={(e) => {
                      setCategoryFilter(e.target.value);
                      setPage(1);
                    }}
                    className="w-full py-2 px-3 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-[#142B3B] dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="all">All Categories</option>
                    <option value="pothole">Pothole</option>
                    <option value="flooding">Flooding</option>
                    <option value="blocked_road">Blocked Road</option>
                    <option value="fallen_tree">Fallen Tree</option>
                    <option value="street_light_out">Street Light Out</option>
                    <option value="dangerous_debris">Dangerous Debris</option>
                    <option value="traffic_signal_failure">Traffic Signal Failure</option>
                    <option value="construction_hazard">Construction Hazard</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="sm:col-span-3 relative">
                  <select
                    value={ordering}
                    onChange={(e) => {
                      setOrdering(e.target.value);
                      setPage(1);
                    }}
                    className="w-full py-2 pl-3 pr-8 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-[#142B3B] dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 appearance-none"
                  >
                    <option value="-flags_count">Most Flagged First</option>
                    <option value="-created_at">Newest First</option>
                    <option value="created_at">Oldest First</option>
                    <option value="-confirmations_count">Most Confirmed</option>
                  </select>
                  <ArrowUpDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Status Chips and Flagged Only Toggle */}
              <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Status:</span>
                {[
                  { id: "all", label: "All Statuses" },
                  { id: "under_review", label: "Under Review" },
                  { id: "reported", label: "Reported" },
                  { id: "community_confirmed", label: "Confirmed" },
                  { id: "resolved", label: "Resolved" },
                  { id: "rejected", label: "Rejected" },
                ].map(({ id, label }) => (
                  <button
                    key={id}
                    onClick={() => {
                      setStatusFilter(id);
                      setPage(1);
                    }}
                    className={`min-h-8 px-3 rounded-xl text-xs font-semibold transition-all border ${
                      statusFilter === id
                        ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                        : "bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    {label}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => {
                    setFilterFlaggedOnly((prev) => !prev);
                    setPage(1);
                  }}
                  className={`ml-auto inline-flex items-center gap-1.5 min-h-8 px-3 rounded-xl text-xs font-semibold border transition-all ${
                    filterFlaggedOnly
                      ? "bg-rose-600 text-white border-rose-600 shadow-sm"
                      : "bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-300 hover:bg-slate-100 border-slate-200 dark:border-slate-700"
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Flagged Only</span>
                </button>
              </div>
            </div>

            {loading && <LoadingState message="Fetching moderation queue items..." />}
            {!loading && error && <ErrorState message={error} onRetry={fetchModerationData} />}

            {!loading && !error && reports.length === 0 && (
              <EmptyState
                title="No reports match your filters"
                message={
                  hasActiveFilters
                    ? "Try adjusting your search query, status, or category."
                    : "There are no hazard reports awaiting review in the queue."
                }
                actionLabel={hasActiveFilters ? "Clear All Filters" : "Refresh queue"}
                onAction={hasActiveFilters ? clearFilters : fetchModerationData}
              />
            )}

            {!loading && !error && reports.length > 0 && (
              <>
                <div className="space-y-4">
                {reports.map((report) => (
                  <div
                    key={report.id}
                    className="bg-white dark:bg-[#142533] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-5 justify-between"
                  >
                    <div className="space-y-3 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CategoryBadge category={report.category} />
                        <FreshnessBadge info={report.freshness_info} />
                        {report.flags_count > 0 && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800 animate-pulse">
                            <AlertTriangle className="w-3 h-3" />
                            {report.flags_count} Community Flag{report.flags_count > 1 ? "s" : ""}
                          </span>
                        )}
                        <span className="text-xs text-slate-400 font-mono">
                          ID: #{report.id}
                        </span>
                      </div>

                      <div>
                        <h3 className="font-bold text-base text-[#142B3B] dark:text-white">
                          {report.location_label || `Lat ${report.latitude}, Lng ${report.longitude}`}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                          {report.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                        <span>Reported by: <strong>{report.reporter?.username || "Citizen"}</strong></span>
                        <span>Confirmations: <strong>{report.confirmations_count}</strong></span>
                        <Link
                          to={`/map?hazard_id=${report.id}&lat=${report.latitude}&lng=${report.longitude}`}
                          className="inline-flex items-center gap-1 text-teal-600 dark:text-teal-400 font-semibold hover:underline"
                        >
                          View Map
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>

                      {report.photo && (
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedImage({
                              url: report.photo,
                              title: report.location_label || "Incident Observation",
                              subtitle: `${report.category_display || report.category || "Incident"} \u2022 ${report.status_display || report.status || "Reported"}`,
                            });
                          }}
                          className="mt-2.5 relative h-36 w-60 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 cursor-pointer group shadow-xs hover:border-teal-500 transition-all"
                        >
                          <img
                            src={report.photo}
                            alt="Hazard observation"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-end justify-end p-2">
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold text-white bg-black/60 backdrop-blur-xs group-hover:bg-[#087F8C] transition-colors shadow-xs">
                              <Maximize2 className="w-3 h-3" />
                              Expand
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 md:flex md:flex-col md:w-auto w-full justify-end gap-2 shrink-0 border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800 pt-3 md:pt-0 md:pl-5">
                      <button
                        onClick={() => handleOpenActionModal(report, "confirm")}
                        className="w-full min-w-0 px-2.5 py-1.5 rounded-xl text-xs font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 border border-teal-200 dark:border-teal-800"
                      >
                        Confirm Hazard
                      </button>
                      <button
                        onClick={() => handleOpenActionModal(report, "review")}
                        className="w-full min-w-0 px-2.5 py-1.5 rounded-xl text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 border border-amber-200 dark:border-amber-800"
                      >
                        Mark Under Review
                      </button>
                      <button
                        onClick={() => handleOpenActionModal(report, "resolve")}
                        className="w-full min-w-0 px-2.5 py-1.5 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800"
                      >
                        Mark Resolved
                      </button>
                      <button
                        onClick={() => handleOpenActionModal(report, "reject")}
                        className="w-full min-w-0 px-2.5 py-1.5 rounded-xl text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 border border-rose-200 dark:border-rose-800"
                      >
                        Reject / Dismiss
                      </button>
                      <button
                        onClick={() => handleViewReportHistory(report)}
                        className="col-span-2 md:col-span-1 w-full min-w-0 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                      >
                        View History
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination Controls */}
              <PaginationBar
                currentPage={page}
                totalPages={Math.max(1, Math.ceil(totalCount / pageSize))}
                totalCount={totalCount}
                pageSize={pageSize}
                onPageChange={(newPage) => setPage(newPage)}
                onPageSizeChange={(newSize) => {
                  setPageSize(newSize);
                  setPage(1);
                }}
                disabled={loading}
              />
            </>
          )}
          </div>
        )}

        {/* Tab 2: Decision History */}
        {activeTab === "history" && (
          <div className="bg-white dark:bg-[#142533] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-[#142B3B] dark:text-white flex items-center gap-2">
              <History className="w-5 h-5 text-amber-500" />
              Chronological Moderation Decisions
            </h2>

            {loadingPlatformHistory && <LoadingState message="Loading decision history..." />}

            {!loadingPlatformHistory && platformHistory.length === 0 && (
              <EmptyState
                title="No moderation decisions recorded yet"
                message="Actions taken on hazard reports will appear here in chronological order."
              />
            )}

            {!loadingPlatformHistory && platformHistory.length > 0 && (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {platformHistory.map((act) => (
                  <div key={act.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-amber-600 dark:text-amber-400 uppercase">
                          {act.action}
                        </span>
                        <span className="text-slate-400">on Report #{act.report}</span>
                        <span className="text-slate-600 dark:text-slate-300 font-semibold">
                          by @{act.moderator_username || "Moderator"}
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 italic">
                        "{act.reason}"
                      </p>
                    </div>
                    <span className="text-slate-400 shrink-0">
                      {new Date(act.created_at).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Action Modal */}
        {actionModalOpen && selectedReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-[#142533] max-w-md w-full rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-base text-[#142B3B] dark:text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-amber-500" />
                  Apply Moderation Decision
                </h3>
                <button
                  onClick={() => setActionModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 text-xs text-slate-600 dark:text-slate-300 space-y-1">
                <div><strong>Hazard:</strong> {selectedReport.location_label || `#${selectedReport.id}`}</div>
                <div><strong>Action:</strong> <span className="font-bold uppercase text-amber-600">{actionType}</span></div>
                <div className="pt-1 text-[11px] text-slate-500 line-clamp-2"><strong>Report:</strong> "{selectedReport.description}"</div>
              </div>

              {/* AI Assistance Tools */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleFetchAiSummary(selectedReport.id)}
                  disabled={loadingAiSummary}
                  className="flex-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 border border-teal-200 dark:border-teal-800 flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                  title="Generate concise neutral incident summary"
                >
                  {loadingAiSummary ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Sparkles className="w-3 h-3 text-[#087F8C] dark:text-teal-400" />
                  )}
                  <span>AI Summary</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleFetchAiDuplicates(selectedReport)}
                  disabled={loadingAiDuplicates}
                  className="flex-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 border border-amber-200 dark:border-amber-800 flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                  title="Scan for matching duplicate reports within 1km"
                >
                  {loadingAiDuplicates ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Sparkles className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                  )}
                  <span>Scan Duplicates</span>
                </button>
              </div>

              {aiSummary && (
                <AISuggestionCard
                  title={`Incident Summary (Urgency: ${aiSummary.urgency_level.toUpperCase()})`}
                  subtitle={aiSummary.category_display}
                  content={aiSummary.summary}
                  onDismiss={() => setAiSummary(null)}
                  disclaimer={aiSummary.disclaimer}
                />
              )}

              {aiDuplicates && (
                <AISuggestionCard
                  title={aiDuplicates.is_possible_duplicate ? "Potential Duplicate Detected" : "Deduplication Clear"}
                  subtitle={`${aiDuplicates.nearby_count} active reports nearby`}
                  content={
                    <div className="space-y-1.5 text-xs">
                      <p className="font-semibold text-amber-800 dark:text-amber-300">{aiDuplicates.analysis}</p>
                      {aiDuplicates.candidates.map((cand) => (
                        <div key={cand.id} className="p-1.5 rounded bg-slate-50 dark:bg-slate-800 text-[11px] border border-slate-200 dark:border-slate-700 flex justify-between">
                          <span>#{cand.id} {cand.category_display}</span>
                          <span className="font-mono text-teal-600 dark:text-teal-400">{cand.distance_meters}m</span>
                        </div>
                      ))}
                    </div>
                  }
                  onDismiss={() => setAiDuplicates(null)}
                  disclaimer={aiDuplicates.disclaimer}
                />
              )}

              {aiModalNotice && (
                <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between">
                  <span>{aiModalNotice.message}</span>
                  <button type="button" onClick={() => setAiModalNotice(null)}>&times;</button>
                </div>
              )}

              {actionSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0" />
                  {actionSuccess}
                </div>
              )}

              {actionError && (
                <div className="p-3 rounded-xl bg-rose-50 text-rose-800 text-xs">
                  {actionError}
                </div>
              )}

              <form onSubmit={handleSubmitAction} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Decision Rationale (Required)
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Provide explicit rationale for audit transparency..."
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 text-[#142B3B] dark:text-white"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setActionModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingAction}
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 transition-all"
                  >
                    {submittingAction ? "Recording..." : "Record Decision"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* History Modal */}
        {historyModalOpen && selectedReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-[#142533] max-w-lg w-full rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-base text-[#142B3B] dark:text-white flex items-center gap-2">
                  <History className="w-5 h-5 text-amber-500" />
                  Audit History for Report #{selectedReport.id}
                </h3>
                <button
                  onClick={() => setHistoryModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {loadingHistory && <LoadingState message="Fetching audit history..." />}

              {!loadingHistory && actionHistory.length === 0 && (
                <p className="text-xs text-slate-500 py-4 text-center">
                  No prior moderation actions recorded for this hazard.
                </p>
              )}

              {!loadingHistory && actionHistory.length > 0 && (
                <div className="space-y-3 max-h-72 overflow-y-auto">
                  {actionHistory.map((act) => (
                    <div key={act.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-600 uppercase">{act.action}</span>
                        <span className="text-slate-400">{new Date(act.created_at).toLocaleString()}</span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300">"{act.reason}"</p>
                      <div className="text-[11px] text-slate-400">By @{act.moderator_username || "Moderator"}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <ImageLightboxModal
        isOpen={Boolean(selectedImage)}
        imageUrl={selectedImage?.url}
        title={selectedImage?.title}
        subtitle={selectedImage?.subtitle}
        onClose={() => setSelectedImage(null)}
      />
    </div>
  );
}
