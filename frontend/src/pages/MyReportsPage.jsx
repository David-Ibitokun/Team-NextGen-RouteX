import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FolderKanban, PlusCircle, MapPin, ExternalLink, Clock, ThumbsUp } from "lucide-react";
import { AppHeader } from "../components/layout/AppHeader";
import { CategoryBadge } from "../components/hazards/CategoryBadge";
import { FreshnessBadge } from "../components/hazards/FreshnessBadge";
import { LoadingState } from "../components/feedback/LoadingState";
import { ErrorState } from "../components/feedback/ErrorState";
import { EmptyState } from "../components/feedback/EmptyState";
import { authService } from "../services/apiClient";
import { useAuth } from "../context/AuthContext";

export function MyReportsPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login?next=/my-reports");
      return;
    }

    async function fetchUserReports() {
      if (!user) return;
      try {
        setLoading(true);
        setError(null);
        const data = await authService.getMyReports();
        setReports(data.results ? data.results : data);
      } catch (err) {
        setError("Unable to load your hazard report history. Check your connection.");
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      fetchUserReports();
    }
  }, [user, authLoading, navigate]);

  return (
    <div className="min-h-screen bg-[#F7F9FA] dark:bg-[#0B161E] text-[#142B3B] dark:text-slate-100 flex flex-col font-sans transition-colors">
      <AppHeader />

      <main className="flex-1 max-w-4xl mx-auto w-full p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#142B3B] dark:text-white flex items-center gap-2">
              <FolderKanban className="w-6 h-6 text-[#087F8C]" />
              <span>My Hazard Reports</span>
            </h1>
            <p className="text-xs text-[#667784] dark:text-slate-400 mt-1">
              Track the status, community feedback, and details of reports you have submitted.
            </p>
          </div>

          <Link
            to="/report"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#087F8C] hover:bg-[#0aa3b3] rounded-lg shadow-sm transition-all shrink-0 self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Submit new hazard</span>
          </Link>
        </div>

        {loading && <LoadingState message="Loading your submitted reports..." />}

        {!loading && error && (
          <ErrorState message={error} onRetry={() => window.location.reload()} />
        )}

        {!loading && !error && reports.length === 0 && (
          <EmptyState
            title="No reports submitted yet"
            message="You haven't reported any road hazards yet. When you notice dangerous road conditions, submit a report to help other road users."
            actionLabel="Report a hazard"
            onAction={() => navigate("/report")}
          />
        )}

        {!loading && !error && reports.length > 0 && (
          <div className="space-y-3">
            {reports.map((report) => (
              <div
                key={report.id}
                className="bg-white dark:bg-[#142533] rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs transition-all hover:border-slate-300 dark:hover:border-slate-700"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <CategoryBadge category={report.category} />
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                      {report.status_display || report.status}
                    </span>
                  </div>
                  <FreshnessBadge freshness={report.freshness} />
                </div>

                <h3 className="text-sm font-bold text-[#142B3B] dark:text-white">
                  {report.location_label || `Coordinates: ${report.latitude}, ${report.longitude}`}
                </h3>

                <p className="text-xs text-[#667784] dark:text-slate-300 mt-1 leading-relaxed">
                  {report.description}
                </p>

                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-[#667784] dark:text-slate-400">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1 text-[11px]">
                      <ThumbsUp className="w-3.5 h-3.5 text-[#087F8C]" />
                      <span>{report.confirmations_count} confirmations</span>
                    </span>
                    <span className="flex items-center gap-1 text-[11px]">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{new Date(report.created_at).toLocaleDateString()}</span>
                    </span>
                  </div>

                  <Link
                    to="/map"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#087F8C] dark:text-teal-400 hover:underline"
                  >
                    <span>View on map</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default MyReportsPage;
