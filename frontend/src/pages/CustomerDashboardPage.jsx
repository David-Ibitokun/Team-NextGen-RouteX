import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  User,
  ShieldCheck,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  PlusCircle,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  HeartHandshake,
  Settings,
  Edit3,
  Droplets,
  TreePine,
  ShieldAlert,
  HelpCircle,
  Flame,
  Check,
  RefreshCw,
} from "lucide-react";
import { AppHeader } from "../components/layout/AppHeader";
import { useAuth } from "../context/AuthContext";
import { authService, hazardService } from "../services/apiClient";
import { CategoryBadge } from "../components/hazards/CategoryBadge";
import { FreshnessBadge } from "../components/hazards/FreshnessBadge";
import { LoadingState } from "../components/feedback/LoadingState";
import { ErrorState } from "../components/feedback/ErrorState";
import { EmptyState } from "../components/feedback/EmptyState";

export function CustomerDashboardPage() {
  const { user, isAuthenticated, loading: authLoading, refreshMe, deleteAccount } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("reports"); // "reports" | "impact" | "settings"
  const [reports, setReports] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");

  // Profile Edit Form State
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileError, setProfileError] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteAccountError, setDeleteAccountError] = useState("");

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [reportsData, summaryData] = await Promise.all([
        authService.getMyReports(),
        authService.getDashboardSummary(),
      ]);
      setReports(Array.isArray(reportsData) ? reportsData : reportsData.results || []);
      setSummary(summaryData);
    } catch (err) {
      setError("Failed to load your personal dashboard data. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login?redirect=/dashboard", { replace: true });
      return;
    }
    if (isAuthenticated) {
      loadDashboardData();
    }
  }, [authLoading, isAuthenticated, navigate, loadDashboardData]);

  useEffect(() => {
    if (user) {
      setDisplayName(user.display_name || "");
      setEmail(user.email || "");
    }
  }, [user]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      setUpdatingProfile(true);
      setProfileSuccess("");
      setProfileError("");
      await authService.updateProfile({ display_name: displayName, email });
      await refreshMe();
      setProfileSuccess("Your profile details were updated successfully.");
      setTimeout(() => setProfileSuccess(""), 4000);
    } catch (err) {
      const msg = err.response?.data?.email?.[0] || err.response?.data?.detail || "Could not update profile.";
      setProfileError(msg);
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("Delete your RouteX account permanently? Your account and profile cannot be recovered.")) {
      return;
    }

    try {
      setDeletingAccount(true);
      setDeleteAccountError("");
      await deleteAccount();
      navigate("/", { replace: true });
    } catch (err) {
      setDeleteAccountError(err.response?.data?.detail || "Could not delete your account. Please try again.");
    } finally {
      setDeletingAccount(false);
    }
  };

  const filteredReports = reports.filter((r) => {
    if (statusFilter === "all") return true;
    return r.status === statusFilter;
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F7F9FA] dark:bg-[#0B161E] flex flex-col">
        <AppHeader />
        <div className="flex-1 flex items-center justify-center">
          <LoadingState message="Checking authorization..." />
        </div>
      </div>
    );
  }

  const metrics = summary?.metrics || {
    total_reports: reports.length,
    active_reports: reports.filter((r) => r.status === "reported").length,
    confirmed_reports: reports.filter((r) => r.status === "community_confirmed").length,
    resolved_reports: reports.filter((r) => r.status === "resolved").length,
    confirmations_received: reports.reduce((acc, r) => acc + (r.confirmations_count || 0), 0),
  };

  return (
    <div className="min-h-screen bg-[#F7F9FA] dark:bg-[#0B161E] text-[#142B3B] dark:text-slate-100 transition-colors flex flex-col">
      <AppHeader />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* User Welcome Banner */}
        <div className="bg-white dark:bg-[#142533] rounded-2xl border border-[#DCE4E8] dark:border-slate-800 p-6 md:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#142B3B] dark:text-white">
                  {user?.display_name || user?.username}
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Citizen Contributor
                </span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                @{user?.username} &bull; Member since{" "}
                {user?.date_joined
                  ? new Date(user.date_joined).toLocaleDateString(undefined, {
                      month: "short",
                      year: "numeric",
                    })
                  : "Recently"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/report"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm text-white bg-[#087F8C] hover:bg-[#076d78] shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <PlusCircle className="w-4 h-4" />
              Report Hazard
            </Link>
            <Link
              to="/map"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm text-[#142B3B] dark:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-all"
            >
              <MapPin className="w-4 h-4 text-[#087F8C] dark:text-teal-400" />
              Live Map
            </Link>
          </div>
        </div>

        {/* Metrics Overview Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          <div className="bg-white dark:bg-[#142533] p-5 rounded-2xl border border-[#DCE4E8] dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <span>Total Submissions</span>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-3xl font-extrabold text-[#142B3B] dark:text-white">
              {metrics.total_reports}
            </div>
            <p className="text-xs text-slate-400 mt-1">Ground observations shared</p>
          </div>

          <div className="bg-white dark:bg-[#142533] p-5 rounded-2xl border border-[#DCE4E8] dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <span>Confirmations Received</span>
              <HeartHandshake className="w-4 h-4 text-teal-500" />
            </div>
            <div className="text-3xl font-extrabold text-[#087F8C] dark:text-teal-400">
              {metrics.confirmations_received}
            </div>
            <p className="text-xs text-slate-400 mt-1">Commuters verified your reports</p>
          </div>

          <div className="bg-white dark:bg-[#142533] p-5 rounded-2xl border border-[#DCE4E8] dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <span>Active Hazards</span>
              <Clock className="w-4 h-4 text-orange-500" />
            </div>
            <div className="text-3xl font-extrabold text-[#142B3B] dark:text-white">
              {metrics.active_reports + metrics.confirmed_reports}
            </div>
            <p className="text-xs text-slate-400 mt-1">Currently alerting road users</p>
          </div>

          <div className="bg-white dark:bg-[#142533] p-5 rounded-2xl border border-[#DCE4E8] dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <span>Resolved / Cleared</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {metrics.resolved_reports}
            </div>
            <p className="text-xs text-slate-400 mt-1">Road corridors cleared</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="overflow-x-auto border-b border-[#DCE4E8] dark:border-slate-800">
          <div className="flex w-max min-w-full items-center space-x-6 text-sm font-semibold">
          <button
            onClick={() => setActiveTab("reports")}
            className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
              activeTab === "reports"
                ? "border-[#087F8C] text-[#087F8C] dark:text-teal-400"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            {/* <AlertTriangle className="w-4 h-4" /> */}
            My Road Reports ({reports.length})
          </button>

          <button
            onClick={() => setActiveTab("impact")}
            className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
              activeTab === "impact"
                ? "border-[#087F8C] text-[#087F8C] dark:text-teal-400"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            {/* <TrendingUp className="w-4 h-4" /> */}
            Community Impact & Badges
          </button>

          <button
            onClick={() => setActiveTab("settings")}
            className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
              activeTab === "settings"
                ? "border-[#087F8C] text-[#087F8C] dark:text-teal-400"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            {/* <Settings className="w-4 h-4" /> */}
            Account & Profile
          </button>
          </div>
        </div>

        {/* Tab 1: My Reports List */}
        {activeTab === "reports" && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {["all", "reported", "community_confirmed", "resolved"].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                      statusFilter === st
                        ? "bg-[#142B3B] dark:bg-white text-white dark:text-[#142B3B]"
                        : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 border border-[#DCE4E8] dark:border-slate-700"
                    }`}
                  >
                    {st === "all" ? "All Reports" : st.replace("_", " ")}
                  </button>
                ))}
              </div>

              <button
                onClick={loadDashboardData}
                className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh
              </button>
            </div>

            {loading && <LoadingState message="Loading your submitted reports..." />}
            {!loading && error && <ErrorState message={error} onRetry={loadDashboardData} />}

            {!loading && !error && filteredReports.length === 0 && (
              <EmptyState
                title="No reports match your selection"
                message={
                  reports.length === 0
                    ? "You haven't submitted any road hazards yet. Help your community by reporting potholes, flooding, or blocked roads!"
                    : "No hazard reports match this status filter."
                }
                actionLabel="Report a Hazard"
                onAction={() => navigate("/report")}
              />
            )}

            {!loading && !error && filteredReports.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredReports.map((report) => (
                  <div
                    key={report.id}
                    className="bg-white dark:bg-[#142533] p-5 rounded-2xl border border-[#DCE4E8] dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <CategoryBadge category={report.category} />
                        <FreshnessBadge info={report.freshness_info} />
                      </div>

                      <div>
                        <h3 className="font-semibold text-base text-[#142B3B] dark:text-white line-clamp-1">
                          {report.location_label || "Road Hazard"}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                          {report.description}
                        </p>
                      </div>

                      {report.photo && (
                        <div className="relative h-32 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800">
                          <img
                            src={report.photo}
                            alt="Hazard observation"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center gap-1 font-medium text-teal-600 dark:text-teal-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {report.confirmations_count} confirmation{report.confirmations_count !== 1 ? "s" : ""}
                        </span>
                        {report.flags_count > 0 && (
                          <span className="text-amber-600 dark:text-amber-400 font-medium">
                            {report.flags_count} flag{report.flags_count !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>

                      <Link
                        to={`/map?lat=${report.latitude}&lng=${report.longitude}`}
                        className="inline-flex items-center gap-1 text-[#087F8C] hover:text-[#06636d] font-semibold"
                      >
                        Inspect on Map
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Community Impact */}
        {activeTab === "impact" && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-[#142533] p-6 rounded-2xl border border-[#DCE4E8] dark:border-slate-800 shadow-sm">
              <h2 className="text-lg font-bold text-[#142B3B] dark:text-white flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-500" />
                Your Civic Road Contribution
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
                Every report you submit alerts motorists, pedestrians, and cyclists. Community ground truth helps everyone make safer commute choices.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="p-4 rounded-xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-900/40">
                  <span className="text-xs uppercase font-bold text-teal-700 dark:text-teal-300">
                    Verification Rate
                  </span>
                  <div className="text-2xl font-extrabold text-[#087F8C] dark:text-teal-400 mt-1">
                    {reports.length > 0
                      ? Math.round((metrics.confirmed_reports / reports.length) * 100)
                      : 0}
                    %
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Reports confirmed by peers</p>
                </div>

                <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40">
                  <span className="text-xs uppercase font-bold text-amber-700 dark:text-amber-300">
                    Community Badge
                  </span>
                  <div className="text-lg font-extrabold text-amber-600 dark:text-amber-400 mt-1">
                    {reports.length >= 10
                      ? "Corridor Sentinel"
                      : reports.length >= 3
                      ? "Active Scout"
                      : "Civic Observer"}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Based on genuine submissions</p>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40">
                  <span className="text-xs uppercase font-bold text-emerald-700 dark:text-emerald-300">
                    Resolved Impact
                  </span>
                  <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                    {metrics.resolved_reports}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Hazards documented to clearance</p>
                </div>
              </div>
            </div>

            {/* Citizen Road Safety Pledge */}
            <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-base text-[#142B3B] dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                RouteX Citizen Observer Guidelines
              </h3>
              <ul className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                  <span><strong>Never report while operating a vehicle:</strong> Only capture photos and mark pins when parked safely or as a passenger/pedestrian.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                  <span><strong>Factual, objective descriptions:</strong> State exactly what you observe (e.g. "Standing water 15cm deep across right lane") rather than speculation.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                  <span><strong>Accurate pin placement:</strong> Drag the location marker to the precise spot on the road to assist navigation for upcoming drivers.</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Tab 3: Account & Profile Settings */}
        {activeTab === "settings" && (
          <div className="bg-white dark:bg-[#142533] p-6 md:p-8 rounded-2xl border border-[#DCE4E8] dark:border-slate-800 shadow-sm max-w-xl">
            <h2 className="text-lg font-bold text-[#142B3B] dark:text-white flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-[#087F8C]" />
              Update Profile Details
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Manage your display name shown on RouteX reports.
            </p>

            {profileSuccess && (
              <div className="mt-4 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                {profileSuccess}
              </div>
            )}

            {profileError && (
              <div className="mt-4 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {profileError}
              </div>
            )}

            <form onSubmit={handleProfileUpdate} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  disabled
                  value={user?.username || ""}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/60 text-slate-500 text-sm cursor-not-allowed"
                />
                <span className="text-[11px] text-slate-400">Usernames cannot be changed.</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Adetola A."
                  maxLength={80}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-[#142B3B] dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-[#142B3B] dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={updatingProfile}
                  className="px-5 py-2.5 rounded-xl font-semibold text-sm text-white bg-[#087F8C] hover:bg-[#076d78] disabled:opacity-50 transition-all flex items-center gap-2 shadow-sm"
                >
                  {updatingProfile ? "Saving Changes..." : "Save Profile Details"}
                </button>
              </div>
            </form>

            <div className="mt-8 pt-6 border-t border-red-200 dark:border-red-900/60">
              <h3 className="text-sm font-bold text-red-700 dark:text-red-300">Delete account</h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                Permanently remove your account and profile. Your submitted road reports will remain publicly useful without your account attribution.
              </p>
              {deleteAccountError && <p className="mt-3 text-xs text-red-600 dark:text-red-400">{deleteAccountError}</p>}
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deletingAccount}
                className="mt-4 px-4 py-2.5 rounded-xl font-semibold text-sm text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950/40 disabled:opacity-50 transition-colors"
              >
                {deletingAccount ? "Deleting Account..." : "Delete My Account"}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
