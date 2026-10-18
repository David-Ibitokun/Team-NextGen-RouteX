import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ShieldAlert,
  Users,
  Settings,
  Activity,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Save,
  RefreshCw,
  UserCheck,
  UserX,
  Shield,
  FileText,
  Sliders,
  Check,
  X,
  ExternalLink,
  Trash2,
} from "lucide-react";
import { AppHeader } from "../components/layout/AppHeader";
import { useAuth } from "../context/AuthContext";
import { adminService } from "../services/apiClient";
import { LoadingState } from "../components/feedback/LoadingState";
import { ErrorState } from "../components/feedback/ErrorState";
import { EmptyState } from "../components/feedback/EmptyState";

export function AdminDashboardPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("users"); // "users" | "settings" | "audit"
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Users Tab State
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedUserForRole, setSelectedUserForRole] = useState(null);
  const [targetRole, setTargetRole] = useState("citizen");
  const [roleChangeReason, setRoleChangeReason] = useState("");
  const [updatingRole, setUpdatingRole] = useState(false);
  const [roleModalError, setRoleModalError] = useState("");

  // User Deletion State
  const [selectedUserForDelete, setSelectedUserForDelete] = useState(null);
  const [deletingUser, setDeletingUser] = useState(false);
  const [deleteModalError, setDeleteModalError] = useState("");

  // Settings Tab State
  const [settings, setSettings] = useState({
    confirmation_threshold: 3,
    freshness_hours: 24,
    max_upload_size_mb: 5,
    allow_anonymous_map_view: true,
    emergency_notice_enabled: true,
  });
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState("");
  const [settingsError, setSettingsError] = useState("");

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  // General Toast Notification
  const [toastMessage, setToastMessage] = useState("");

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4000);
  };

  const fetchStats = useCallback(async () => {
    try {
      setLoadingStats(true);
      const data = await adminService.getStats();
      setStats(data);
    } catch (err) {
      console.error("Failed to fetch admin stats:", err);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      setLoadingUsers(true);
      const params = {};
      if (searchQuery.trim()) params.q = searchQuery.trim();
      if (roleFilter !== "all") params.role = roleFilter;
      const data = await adminService.getUsers(params);
      setUsers(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setLoadingUsers(false);
    }
  }, [searchQuery, roleFilter]);

  const fetchSettings = useCallback(async () => {
    try {
      setLoadingSettings(true);
      const data = await adminService.getSettings();
      setSettings(data);
    } catch (err) {
      console.error("Failed to fetch platform settings:", err);
    } finally {
      setLoadingSettings(false);
    }
  }, []);

  const fetchAuditLogs = useCallback(async () => {
    try {
      setLoadingAudit(true);
      const data = await adminService.getAuditLogs();
      setAuditLogs(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      console.error("Failed to fetch audit logs:", err);
    } finally {
      setLoadingAudit(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate("/login?redirect=/admin-dashboard", { replace: true });
        return;
      }
      if (isAdmin) {
        fetchStats();
        if (activeTab === "users") fetchUsers();
        if (activeTab === "settings") fetchSettings();
        if (activeTab === "audit") fetchAuditLogs();
      }
    }
  }, [authLoading, user, isAdmin, navigate, activeTab, fetchStats, fetchUsers, fetchSettings, fetchAuditLogs]);

  const handleRoleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUserForRole) return;
    try {
      setUpdatingRole(true);
      setRoleModalError("");
      const updatedUser = await adminService.updateUserRole(
        selectedUserForRole.id,
        targetRole,
        roleChangeReason
      );

      setUsers((prev) =>
        prev.map((u) => (u.id === selectedUserForRole.id ? updatedUser : u))
      );
      showToast(`User @${selectedUserForRole.username} was updated to ${targetRole}.`);
      setSelectedUserForRole(null);
      setRoleChangeReason("");
      fetchStats();
    } catch (err) {
      const msg = err.response?.data?.detail || "Failed to update user role.";
      setRoleModalError(msg);
    } finally {
      setUpdatingRole(false);
    }
  };

  const handleDeleteUserSubmit = async () => {
    if (!selectedUserForDelete) return;
    try {
      setDeletingUser(true);
      setDeleteModalError("");
      await adminService.deleteUser(selectedUserForDelete.id);

      setUsers((prev) => prev.filter((u) => u.id !== selectedUserForDelete.id));
      showToast(`User @${selectedUserForDelete.username} has been permanently deleted.`);
      setSelectedUserForDelete(null);
      fetchStats();
      if (activeTab === "audit") {
        fetchAuditLogs();
      }
    } catch (err) {
      const msg = err.response?.data?.detail || "Failed to delete user account.";
      setDeleteModalError(msg);
    } finally {
      setDeletingUser(false);
    }
  };

  const handleSettingsSave = async (e) => {
    e.preventDefault();
    try {
      setSavingSettings(true);
      setSettingsSuccess("");
      setSettingsError("");
      const updated = await adminService.updateSettings(settings);
      setSettings(updated);
      setSettingsSuccess("Platform operational parameters updated successfully.");
      showToast("Operational parameters saved to live configuration.");
      fetchStats();
      setTimeout(() => setSettingsSuccess(""), 4000);
    } catch (err) {
      const msg = err.response?.data?.detail || "Failed to save platform settings.";
      setSettingsError(msg);
    } finally {
      setSavingSettings(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F7F9FA] dark:bg-[#0B161E] flex flex-col">
        <AppHeader />
        <div className="flex-1 flex items-center justify-center">
          <LoadingState message="Verifying administrative credentials..." />
        </div>
      </div>
    );
  }

  // Strict RBAC Access Check
  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-[#F7F9FA] dark:bg-[#0B161E] flex flex-col text-[#142B3B] dark:text-slate-100">
        <AppHeader />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-[#142533] p-8 rounded-2xl border border-rose-200 dark:border-rose-900/40 text-center space-y-4 shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto border border-rose-100 dark:border-rose-900">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-extrabold text-[#142B3B] dark:text-white">
              Administrator Access Required
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              This dashboard is restricted strictly to platform administrators. If you are an authorized operator, please sign in with an account granted administrative privileges.
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <button
                onClick={() => navigate("/dashboard")}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
              >
                Go to Citizen Dashboard
              </button>
              <button
                onClick={() => navigate("/login?redirect=/admin-dashboard")}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-white bg-[#087F8C] hover:bg-[#076d78]"
              >
                Sign In as Admin
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F9FA] dark:bg-[#0B161E] text-[#142B3B] dark:text-slate-100 transition-colors flex flex-col">
      <AppHeader />

      {/* Floating Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-[#142B3B] text-white text-xs font-semibold shadow-xl border border-slate-700 flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4 text-emerald-400" />
          {toastMessage}
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header Bar */}
        <div className="bg-white dark:bg-[#142533] p-6 md:p-8 rounded-2xl border border-[#DCE4E8] dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#142B3B] dark:text-white">
                  Platform Operations & Governance
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  <Shield className="w-3.5 h-3.5" />
                  Administrator Portal
                </span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Manage user access roles, configure live operational parameters, and monitor civic health.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                fetchStats();
                if (activeTab === "users") fetchUsers();
                if (activeTab === "settings") fetchSettings();
                if (activeTab === "audit") fetchAuditLogs();
                showToast("Refreshed platform data.");
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh Data
            </button>
            <Link
              to="/moderator"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm text-[#087F8C] bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-900/60 border border-teal-200 dark:border-teal-800 transition-all"
            >
              <ShieldAlert className="w-4 h-4" />
              Moderator Queue
            </Link>
          </div>
        </div>

        {/* High-Level Metric Tiles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-[#142533] p-5 rounded-2xl border border-[#DCE4E8] dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <span>Total Accounts</span>
              <Users className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-3xl font-extrabold text-[#142B3B] dark:text-white">
              {stats?.users?.total ?? "..."}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {stats?.users?.citizens ?? 0} Citizens &bull; {stats?.users?.moderators ?? 0} Mods &bull; {stats?.users?.admins ?? 0} Admins
            </p>
          </div>

          <div className="bg-white dark:bg-[#142533] p-5 rounded-2xl border border-[#DCE4E8] dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <span>Reported Hazards</span>
              <Activity className="w-4 h-4 text-teal-500" />
            </div>
            <div className="text-3xl font-extrabold text-[#087F8C] dark:text-teal-400">
              {stats?.hazards?.total ?? "..."}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {stats?.hazards?.active ?? 0} Active &bull; {stats?.hazards?.confirmed ?? 0} Confirmed
            </p>
          </div>

          <div className="bg-white dark:bg-[#142533] p-5 rounded-2xl border border-[#DCE4E8] dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <span>Pending Flags</span>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-3xl font-extrabold text-amber-600 dark:text-amber-400">
              {stats?.hazards?.flagged ?? 0}
            </div>
            <p className="text-xs text-slate-400 mt-1">Reports flagged for attention</p>
          </div>

          <div className="bg-white dark:bg-[#142533] p-5 rounded-2xl border border-[#DCE4E8] dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <span>Operational Engine</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
              Healthy
            </div>
            <p className="text-xs text-slate-400 mt-1">Django 5.1 REST Framework</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="overflow-x-auto border-b border-[#DCE4E8] dark:border-slate-800">
          <div className="flex w-max min-w-full items-center space-x-6 text-sm font-semibold">
          <button
            onClick={() => setActiveTab("users")}
            className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
              activeTab === "users"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            {/* <Users className="w-4 h-4" /> */}
            User & Role Management ({users.length})
          </button>

          <button
            onClick={() => setActiveTab("settings")}
            className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
              activeTab === "settings"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            {/* <Settings className="w-4 h-4" /> */}
            Operational Platform Settings
          </button>

          <button
            onClick={() => setActiveTab("audit")}
            className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
              activeTab === "audit"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            {/* <FileText className="w-4 h-4" /> */}
            System Audit Trail
          </button>
          </div>
        </div>

        {/* Tab 1: User & Role Management */}
        {activeTab === "users" && (
          <div className="space-y-4">
            {/* Search & Role Filter Bar */}
            <div className="bg-white dark:bg-[#142533] p-4 rounded-2xl border border-[#DCE4E8] dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by username or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-[#142B3B] dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-slate-400">Role:</span>
                {["all", "citizen", "moderator", "admin"].map((r) => (
                  <button
                    key={r}
                    onClick={() => setRoleFilter(r)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                      roleFilter === r
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {loadingUsers && <LoadingState message="Fetching registered users..." />}

            {!loadingUsers && users.length === 0 && (
              <EmptyState
                title="No users found"
                message="No registered users match your search criteria."
                actionLabel="Clear Filter"
                onAction={() => {
                  setSearchQuery("");
                  setRoleFilter("all");
                }}
              />
            )}

            {!loadingUsers && users.length > 0 && (
              <div className="bg-white dark:bg-[#142533] rounded-2xl border border-[#DCE4E8] dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="px-5 py-3.5">User</th>
                        <th className="px-5 py-3.5">Email</th>
                        <th className="px-5 py-3.5">Assigned Role</th>
                        <th className="px-5 py-3.5">Reports</th>
                        <th className="px-5 py-3.5">Confirmations</th>
                        <th className="px-5 py-3.5">Joined</th>
                        <th className="px-5 py-3.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="px-5 py-4 font-semibold text-[#142B3B] dark:text-white">
                            <div>{u.display_name || u.username}</div>
                            <div className="text-[11px] font-normal text-slate-400">@{u.username}</div>
                          </td>
                          <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                            {u.email || "No email"}
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                u.role === "admin"
                                  ? "bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                                  : u.role === "moderator"
                                  ? "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                                  : "bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border border-teal-200 dark:border-teal-800"
                              }`}
                            >
                              {u.role === "admin" && <ShieldAlert className="w-3 h-3" />}
                              {u.role === "moderator" && <Shield className="w-3 h-3" />}
                              {u.role === "citizen" && <UserCheck className="w-3 h-3" />}
                              {u.role}
                            </span>
                          </td>
                          <td className="px-5 py-4 font-semibold text-slate-700 dark:text-slate-300">
                            {u.reports_count}
                          </td>
                          <td className="px-5 py-4 text-slate-500 dark:text-slate-400">
                            {u.confirmations_count}
                          </td>
                          <td className="px-5 py-4 text-slate-400">
                            {new Date(u.date_joined).toLocaleDateString()}
                          </td>
                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  setSelectedUserForRole(u);
                                  setTargetRole(u.role);
                                  setRoleChangeReason("");
                                  setRoleModalError("");
                                }}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors"
                              >
                                Manage Role
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedUserForDelete(u);
                                  setDeleteModalError("");
                                }}
                                disabled={u.id === user?.id}
                                title={u.id === user?.id ? "You cannot delete your own active account" : "Delete user account"}
                                className="p-1.5 rounded-lg text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Operational Platform Settings */}
        {activeTab === "settings" && (
          <div className="bg-white dark:bg-[#142533] p-6 md:p-8 rounded-2xl border border-[#DCE4E8] dark:border-slate-800 shadow-sm max-w-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-[#087F8C] flex items-center justify-center">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#142B3B] dark:text-white">
                  Operational Settings & Thresholds
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Configure real-time civic heuristics for automatic verification and stale report markers.
                </p>
              </div>
            </div>

            {settingsSuccess && (
              <div className="mt-4 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                {settingsSuccess}
              </div>
            )}

            {settingsError && (
              <div className="mt-4 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {settingsError}
              </div>
            )}

            <form onSubmit={handleSettingsSave} className="mt-6 space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Community Confirmation Auto-Threshold (1–20)
                </label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={settings.confirmation_threshold}
                  onChange={(e) =>
                    setSettings({ ...settings, confirmation_threshold: parseInt(e.target.value) || 1 })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-[#142B3B] dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  When a report receives this number of distinct community confirmations, its status automatically updates to "Community Confirmed".
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Report Freshness Window (Hours, 1–168)
                </label>
                <input
                  type="number"
                  min={1}
                  max={168}
                  value={settings.freshness_hours}
                  onChange={(e) =>
                    setSettings({ ...settings, freshness_hours: parseInt(e.target.value) || 1 })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-[#142B3B] dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Reports older than this window without recent confirmations are marked as "Stale" on the map.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Max Photographic Upload Size (MB, 1–25)
                </label>
                <input
                  type="number"
                  min={1}
                  max={25}
                  value={settings.max_upload_size_mb}
                  onChange={(e) =>
                    setSettings({ ...settings, max_upload_size_mb: parseInt(e.target.value) || 1 })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-[#142B3B] dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Upload ceiling for photographic evidence submitted with hazard reports.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-200 dark:border-slate-800">
                <span className="text-xs text-slate-400">
                  Last updated by {settings.updated_by_username || "System"}
                </span>
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center gap-2 shadow-sm"
                >
                  <Save className="w-4 h-4" />
                  {savingSettings ? "Saving Settings..." : "Save Operational Rules"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab 3: System Audit Trail */}
        {activeTab === "audit" && (
          <div className="bg-white dark:bg-[#142533] p-6 rounded-2xl border border-[#DCE4E8] dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-[#142B3B] dark:text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  Administrative Audit History
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Immutable record of role promotions, demotions, and system parameter mutations.
                </p>
              </div>
              <button
                onClick={fetchAuditLogs}
                className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh
              </button>
            </div>

            {loadingAudit && <LoadingState message="Loading audit history..." />}

            {!loadingAudit && auditLogs.length === 0 && (
              <EmptyState
                title="No administrative audit events"
                message="No role changes or parameter mutations have been recorded yet."
              />
            )}

            {!loadingAudit && auditLogs.length > 0 && (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {auditLogs.map((log) => (
                  <div key={log.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {log.action_type}
                        </span>
                        <span className="font-semibold text-[#142B3B] dark:text-white">
                          By @{log.actor_username}
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400">{log.details}</p>
                    </div>
                    <div className="text-slate-400 shrink-0">
                      {new Date(log.created_at).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Role Change Modal */}
        {selectedUserForRole && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-[#142533] max-w-md w-full rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-lg text-[#142B3B] dark:text-white flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-indigo-600" />
                  Update Access Role
                </h3>
                <button
                  onClick={() => setSelectedUserForRole(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                <div><strong>User:</strong> {selectedUserForRole.display_name || selectedUserForRole.username} (@{selectedUserForRole.username})</div>
                <div><strong>Current Role:</strong> <span className="capitalize font-semibold">{selectedUserForRole.role}</span></div>
              </div>

              {roleModalError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300">
                  {roleModalError}
                </div>
              )}

              <form onSubmit={handleRoleUpdateSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Select New Role
                  </label>
                  <select
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-[#142B3B] dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="citizen">Citizen (Standard Commuter Access)</option>
                    <option value="moderator">Moderator (Trust & Safety Review Queue)</option>
                    <option value="admin">Administrator (Platform Governance & Settings)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Audit Reason (Required for transparency)
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Provide justification for granting or revoking privileges..."
                    value={roleChangeReason}
                    onChange={(e) => setRoleChangeReason(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-[#142B3B] dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedUserForRole(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updatingRole}
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-all"
                  >
                    {updatingRole ? "Applying..." : "Confirm Role Change"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete User Confirmation Modal */}
        {selectedUserForDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-[#142533] max-w-md w-full rounded-2xl border border-rose-200 dark:border-rose-900/50 p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-lg text-rose-600 dark:text-rose-400 flex items-center gap-2">
                  <Trash2 className="w-5 h-5" />
                  Delete User Account
                </h3>
                <button
                  onClick={() => setSelectedUserForDelete(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-xs text-rose-900 dark:text-rose-200 space-y-1.5">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                  This action is permanent and cannot be undone.
                </div>
                <p className="text-[11px] leading-relaxed text-rose-800/90 dark:text-rose-300/80">
                  Deleting this user will permanently remove their credentials and authentication records. Associated hazard reports and community confirmations will be preserved anonymously for road safety.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                <div><strong>User:</strong> {selectedUserForDelete.display_name || selectedUserForDelete.username} (@{selectedUserForDelete.username})</div>
                <div><strong>Email:</strong> {selectedUserForDelete.email || "No email"}</div>
                <div><strong>Role:</strong> <span className="capitalize font-semibold">{selectedUserForDelete.role}</span></div>
                <div><strong>Reports Submitted:</strong> {selectedUserForDelete.reports_count}</div>
              </div>

              {deleteModalError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300">
                  {deleteModalError}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedUserForDelete(null)}
                  disabled={deletingUser}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteUserSubmit}
                  disabled={deletingUser}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {deletingUser ? "Deleting..." : "Permanently Delete"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
