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
        ) : (
          <div className="space-y-4">
            {!user && (
              <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-xl p-3.5 flex items-center justify-between gap-3 text-xs text-amber-800 dark:text-amber-200">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>
                    Reporting as a community guest.{" "}
                    <Link to="/login?next=/report" className="underline font-semibold hover:text-amber-950 dark:hover:text-white">
                      Sign in
                    </Link>{" "}
                    to track your reports on your citizen dashboard.
                  </span>
                </div>
              </div>
            )}
            <ReportHazardForm
              onSuccess={() => navigate("/map")}
              onCancel={() => navigate("/map")}
            />
          </div>
        )}
      </main>
    </div>
  );
}

export default ReportHazardPage;
