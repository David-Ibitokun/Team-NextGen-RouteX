import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogIn, PlusCircle, ArrowLeft, Shield } from "lucide-react";
import { AppHeader } from "../components/layout/AppHeader";
import { ReportHazardForm } from "../components/forms/ReportHazardForm";
import { useAuth } from "../context/AuthContext";
import { LoadingState } from "../components/feedback/LoadingState";

export function ReportHazardPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  return (
    <div className="min-h-screen bg-[#F7F9FA] dark:bg-[#0B161E] text-[#142B3B] dark:text-slate-100 flex flex-col font-sans transition-colors">
      <AppHeader onReportClick={() => {}} />

      <main className="flex-1 max-w-2xl mx-auto w-full p-4 sm:p-6 lg:p-8">
        <div className="mb-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-[#087F8C] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Go back</span>
          </button>
        </div>

        {loading ? (
          <LoadingState message="Checking session status..." />
        ) : !user ? (
          <div className="bg-white dark:bg-[#142533] rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center space-y-4 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-teal-50 dark:bg-teal-950/60 text-[#087F8C] dark:text-teal-400 flex items-center justify-center mx-auto">
              <Shield className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-[#142B3B] dark:text-white">
              Sign in to report a road hazard
            </h2>
            <p className="text-xs text-[#667784] dark:text-slate-300 max-w-md mx-auto leading-relaxed">
              RouteX requires an account to submit hazard reports to maintain community trust, prevent abuse, and allow updates to be tracked transparently.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                to="/login?next=/report"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-[#087F8C] hover:bg-[#0aa3b3] rounded-lg shadow-sm transition-all"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign in</span>
              </Link>
              <Link
                to="/register?next=/report"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-semibold text-[#142B3B] dark:text-slate-200 bg-white dark:bg-[#1B3142] hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg shadow-xs transition-all"
              >
                <span>Create an account</span>
              </Link>
            </div>
          </div>
        ) : (
          <ReportHazardForm
            onSuccess={() => navigate("/map")}
            onCancel={() => navigate("/map")}
          />
        )}
      </main>
    </div>
  );
}

export default ReportHazardPage;
