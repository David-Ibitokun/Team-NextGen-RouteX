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
} from "lucide-react";
import { AppHeader } from "../components/layout/AppHeader";
import { CategoryBadge } from "../components/hazards/CategoryBadge";
import { FreshnessBadge } from "../components/hazards/FreshnessBadge";
import { LoadingState } from "../components/feedback/LoadingState";
import { ErrorState } from "../components/feedback/ErrorState";
import { EmptyState } from "../components/feedback/EmptyState";
import { moderationService } from "../services/apiClient";
import { useAuth } from "../context/AuthContext";

export function ModerationPage() {
  const navigate = useNavigate();
  const { user, isModerator, isAdmin, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState("queue"); // "queue" | "history"
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterFlaggedOnly, setFilterFlaggedOnly] = useState(false);
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

  const fetchModerationData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (filterFlaggedOnly) params.flagged_only = true;

      const [reportsData, statsData] = await Promise.all([
        moderationService.getReports(params),
        moderationService.getStats().catch(() => null),
      ]);

      const items = reportsData.results ? reportsData.results : reportsData;
      setReports(items);
      if (statsData) setStats(statsData);
    } catch (err) {
      setError("Failed to fetch moderation queue. Check your network or permissions.");
    } finally {
      setLoading(false);
    }
  }, [filterFlaggedOnly]);

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
    setActionModalOpen(true);
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
              {/* <AlertTriangle className="w-4 h-4" /> */}
              Queue Reports ({reports.length})
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
              {/* <History className="w-4 h-4" /> */}
              Moderation Decision History
            </button>
            </div>
          </div>

          {activeTab === "queue" && (
            <button
              type="button"
              onClick={() => setFilterFlaggedOnly((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
                filterFlaggedOnly
                  ? "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800"
                  : "bg-white dark:bg-[#142533] text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700"
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>{filterFlaggedOnly ? "Flagged Only" : "Show All Reports"}</span>
            </button>
          )}
        </div>

        {/* Tab 1: Queue Reports */}
        {activeTab === "queue" && (
          <div>
            {loading && <LoadingState message="Fetching moderation queue items..." />}
            {!loading && error && <ErrorState message={error} onRetry={fetchModerationData} />}

            {!loading && !error && reports.length === 0 && (
              <EmptyState
                title="Moderation queue is clear"
                message="There are no hazard reports awaiting review matching your criteria."
                actionLabel="Refresh queue"
                onAction={fetchModerationData}
              />
            )}

            {!loading && !error && reports.length > 0 && (
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
                          to={`/map?lat=${report.latitude}&lng=${report.longitude}`}
                          className="inline-flex items-center gap-1 text-teal-600 dark:text-teal-400 font-semibold hover:underline"
                        >
                          View Map
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>

                      {report.photo && (
                        <div className="mt-2">
                          <img
                            src={report.photo}
                            alt="Hazard observation"
                            className="h-28 w-44 object-cover rounded-xl border border-slate-200 dark:border-slate-700"
                          />
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
              </div>

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
    </div>
  );
}
