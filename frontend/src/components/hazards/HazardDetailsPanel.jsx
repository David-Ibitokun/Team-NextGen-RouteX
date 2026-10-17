import React, { useState } from "react";
import { X, MapPin, ThumbsUp, Flag, Calendar, CheckCircle, AlertTriangle } from "lucide-react";
import { CategoryBadge } from "./CategoryBadge";
import { FreshnessBadge } from "./FreshnessBadge";
import { getStatusBadgeStyle } from "../../utils/hazardConstants";
import { hazardService } from "../../services/apiClient";

export function HazardDetailsPanel({ hazard, onClose, onHazardUpdated }) {
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [flagging, setFlagging] = useState(false);
  const [flagged, setFlagged] = useState(false);
  const [flagReason, setFlagReason] = useState("cleared");
  const [showFlagForm, setShowFlagForm] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  if (!hazard) return null;

  const statusStyle = getStatusBadgeStyle(hazard.status);

  const handleConfirm = async () => {
    try {
      setConfirming(true);
      setErrorMessage("");
      const res = await hazardService.confirmHazard(hazard.id);
      setConfirmed(true);
      if (onHazardUpdated) {
        onHazardUpdated({
          ...hazard,
          confirmations_count: res.confirmations_count,
          status: res.status || hazard.status,
          status_display: res.status === "community_confirmed" ? "Community Confirmed" : hazard.status_display,
        });
      }
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        setErrorMessage("Please sign in to confirm this road hazard.");
      } else if (err.response?.data?.detail) {
        setErrorMessage(err.response.data.detail);
      } else {
        setErrorMessage("Could not submit confirmation. Please try again.");
      }
    } finally {
      setConfirming(false);
    }
  };

  const handleFlagSubmit = async (e) => {
    e.preventDefault();
    try {
      setFlagging(true);
      setErrorMessage("");
      await hazardService.flagHazard(hazard.id, { reason: flagReason });
      setFlagged(true);
      setShowFlagForm(false);
      if (onHazardUpdated) {
        onHazardUpdated({
          ...hazard,
          flags_count: (hazard.flags_count || 0) + 1,
        });
      }
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        setErrorMessage("Please sign in to flag a report.");
      } else if (err.response?.data?.detail) {
        setErrorMessage(err.response.data.detail);
      } else {
        setErrorMessage("Could not submit flag. Please try again.");
      }
    } finally {
      setFlagging(false);
    }
  };

  const formattedDate = new Date(hazard.created_at).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <aside
      aria-label="Hazard details"
      className="h-full flex flex-col bg-white dark:bg-[#142533] border-l border-[#DCE4E8] dark:border-slate-800 overflow-y-auto transition-colors"
    >
      {/* Header */}
      <div className="p-4 border-b border-[#DCE4E8] dark:border-slate-800 flex items-start justify-between gap-3 sticky top-0 bg-white dark:bg-[#142533] z-10">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <CategoryBadge category={hazard.category} size="lg" />
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${statusStyle}`}>
              {hazard.status_display || hazard.status}
            </span>
            {hazard.is_demo && (
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-[#855B09] dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                Demo Data
              </span>
            )}
          </div>
          <h3 className="text-base font-bold text-[#142B3B] dark:text-white leading-tight">
            {hazard.location_label || "Reported Location"}
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 text-[#667784] dark:text-slate-400 hover:text-[#142B3B] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
          aria-label="Close details"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4 flex-1">
        {/* Photo if present */}
        {hazard.photo_url ? (
          <div className="rounded-lg overflow-hidden border border-[#DCE4E8] dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
            <img
              src={hazard.photo_url}
              alt={hazard.location_label || "Hazard photo"}
              className="w-full h-48 object-cover"
            />
          </div>
        ) : null}

        {/* Description */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[#667784] dark:text-slate-400 mb-1">
            Condition details
          </h4>
          <p className="text-sm text-[#142B3B] dark:text-slate-100 leading-relaxed whitespace-pre-line bg-[#F7F9FA] dark:bg-[#1B3142] p-3 rounded-md border border-[#DCE4E8] dark:border-slate-700">
            {hazard.description}
          </p>
        </div>

        {/* Location & Coordinates */}
        <div className="space-y-1.5 text-xs text-[#667784] dark:text-slate-400">
          <div className="flex items-center gap-2 text-[#142B3B] dark:text-slate-200">
            <MapPin className="w-4 h-4 text-[#087F8C] shrink-0" />
            <span className="font-mono text-xs">
              {Number(hazard.latitude).toFixed(6)}, {Number(hazard.longitude).toFixed(6)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#667784] dark:text-slate-400 shrink-0" />
            <span>{formattedDate}</span>
          </div>
          <div className="pt-1">
            <FreshnessBadge freshness={hazard.freshness} createdAt={hazard.created_at} />
          </div>
        </div>

        {/* Trust disclaimer */}
        <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-md border border-slate-200 dark:border-slate-800 text-xs text-[#667784] dark:text-slate-400 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-[#F2B544] shrink-0 mt-0.5" />
          <p>
            Community-reported. Conditions may change quickly. Check the latest confirmation before travelling.
          </p>
        </div>

        {errorMessage && (
          <p className="text-xs text-[#D64545] bg-red-50 dark:bg-red-950/40 p-2 rounded border border-red-200 dark:border-red-800">
            {errorMessage}
          </p>
        )}

        {/* Actions */}
        <div className="pt-2 border-t border-[#DCE4E8] dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs text-[#667784] dark:text-slate-400">
            <span>Community confirmations:</span>
            <span className="font-bold text-[#087F8C] dark:text-teal-400 text-sm">
              {hazard.confirmations_count || 0}
            </span>
          </div>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={confirming || confirmed}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-semibold transition-all ${
              confirmed
                ? "bg-green-100 dark:bg-green-950/60 text-[#27865B] dark:text-green-300 border border-green-200 dark:border-green-800 cursor-default"
                : "bg-[#087F8C] text-white hover:bg-[#0aa3b3] shadow-sm"
            }`}
          >
            {confirmed ? (
              <>
                <CheckCircle className="w-4 h-4" />
                Presence confirmed
              </>
            ) : confirming ? (
              "Confirming..."
            ) : (
              <>
                <ThumbsUp className="w-4 h-4" />
                Confirm this hazard is still present
              </>
            )}
          </button>

          {!showFlagForm && !flagged && (
            <button
              type="button"
              onClick={() => setShowFlagForm(true)}
              className="w-full flex items-center justify-center gap-1.5 text-xs text-[#667784] dark:text-slate-400 hover:text-[#D64545] dark:hover:text-red-400 transition-colors py-1"
            >
              <Flag className="w-3.5 h-3.5" />
              Flag this report for review
            </button>
          )}

          {flagged && (
            <p className="text-center text-xs text-[#27865B] dark:text-green-300 bg-green-50 dark:bg-green-950/40 p-2 rounded border border-green-200 dark:border-green-800">
              Report flagged for moderator review. Thank you for keeping RouteX accurate.
            </p>
          )}

          {showFlagForm && !flagged && (
            <form onSubmit={handleFlagSubmit} className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-md border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
              <label className="block font-semibold text-[#142B3B] dark:text-slate-200">
                Reason for review:
              </label>
              <select
                value={flagReason}
                onChange={(e) => setFlagReason(e.target.value)}
                className="w-full bg-white dark:bg-[#1B3142] border border-[#DCE4E8] dark:border-slate-700 text-[#142B3B] dark:text-slate-100 rounded p-1.5 text-xs"
              >
                <option value="cleared">Hazard is cleared / no longer present</option>
                <option value="inaccurate">Inaccurate location or details</option>
                <option value="duplicate">Duplicate report</option>
                <option value="spam">Spam or abusive content</option>
              </select>
              <div className="flex gap-2 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setShowFlagForm(false)}
                  className="px-2.5 py-1 text-xs border border-[#DCE4E8] dark:border-slate-700 rounded bg-white dark:bg-[#1B3142] text-[#142B3B] dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={flagging}
                  className="px-2.5 py-1 text-xs bg-[#D64545] text-white rounded hover:bg-red-700"
                >
                  {flagging ? "Submitting..." : "Submit flag"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </aside>
  );
}

export default HazardDetailsPanel;
