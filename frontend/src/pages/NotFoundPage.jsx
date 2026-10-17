import React from "react";
import { Link } from "react-router-dom";
import { AppHeader } from "../components/layout/AppHeader";
import { RouteXLogo } from "../components/common/RouteXLogo";

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#F7F9FA] dark:bg-[#0B161E] text-[#142B3B] dark:text-slate-100 flex flex-col transition-colors">
      <AppHeader />

      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="mb-4">
          <RouteXLogo size="lg" />
        </div>
        <h1 className="text-xl font-bold text-[#142B3B] dark:text-white mb-2">Page not found</h1>
        <p className="text-sm text-[#667784] dark:text-slate-400 max-w-sm mb-6">
          The road you are looking for does not exist or has moved. Return to the main hazard map to see current road reports.
        </p>
        <Link
          to="/"
          className="px-4 py-2 bg-[#087F8C] text-white text-xs font-semibold rounded-md hover:bg-[#0aa3b3] transition-colors"
        >
          Back to map
        </Link>
      </main>
    </div>
  );
}

export default NotFoundPage;
