import React, { useEffect } from "react";
import { ReportHazardForm } from "../forms/ReportHazardForm";

export function ReportHazardModal({ isOpen, onClose, onSuccess }) {
  // Close modal when pressing Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll while modal is open
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-hazard-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/65 dark:bg-black/80 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
    >
      <div
        className="w-full sm:max-w-xl max-h-[92vh] sm:max-h-[88vh] flex flex-col bg-white dark:bg-[#142533] rounded-t-2xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
      >
        <ReportHazardForm
          isModal={true}
          onSuccess={onSuccess}
          onCancel={onClose}
        />
      </div>
    </div>
  );
}

export default ReportHazardModal;
