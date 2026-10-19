import React, { useEffect } from "react";
import { X, MapPin } from "lucide-react";

export function ImageLightboxModal({
  isOpen,
  imageUrl,
  title,
  subtitle,
  onClose,
}) {
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

  if (!isOpen || !imageUrl) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex flex-col justify-between bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Header Bar */}
      <div
        className="flex items-center justify-between px-6 py-4 bg-slate-900/80 border-b border-white/10 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col text-left">
          {title && (
            <div className="flex items-center gap-2 text-white font-semibold text-sm sm:text-base">
              <MapPin className="w-4 h-4 text-teal-400 shrink-0" />
              <span className="line-clamp-1">{title}</span>
            </div>
          )}
          {subtitle && (
            <span className="text-xs text-slate-400 capitalize mt-0.5">
              {subtitle}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-full text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 transition-colors ml-4 focus:outline-none"
          aria-label="Close image preview"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Image Viewport */}
      <div
        className="flex-1 flex items-center justify-center p-4 sm:p-6 overflow-hidden"
        onClick={onClose}
      >
        <img
          src={imageUrl}
          alt={title || "Hazard observation"}
          className="max-h-[75vh] max-w-[92vw] sm:max-w-[85vw] object-contain rounded-xl shadow-2xl border border-white/10 select-none animate-in zoom-in-95 duration-200 cursor-default"
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      {/* Footer Hint */}
      <div
        className="py-3 text-center bg-slate-900/80 border-t border-white/10 text-xs text-slate-400 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        Click outside or press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-mono border border-slate-700">Esc</kbd> to close
      </div>
    </div>
  );
}

export default ImageLightboxModal;
