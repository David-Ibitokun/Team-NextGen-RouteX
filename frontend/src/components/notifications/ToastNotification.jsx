import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCircle2, Radio, ShieldAlert, Info, X, MapPin } from "lucide-react";
import { useNotifications } from "../../context/NotificationContext";

export function ToastNotification() {
  const navigate = useNavigate();
  const { toast, dismissToast } = useNotifications();

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      dismissToast();
    }, 6000);
    return () => clearTimeout(timer);
  }, [toast, dismissToast]);

  if (!toast) return null;

  const handleClick = () => {
    if (toast.target_hazard_id) {
      navigate(`/map?hazard_id=${toast.target_hazard_id}`);
    }
    dismissToast();
  };

  const renderIcon = () => {
    switch (toast.type) {
      case "hazard_confirmed":
      case "status_changed":
        return <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;
      case "safety_advisory":
        return <Radio className="w-5 h-5 text-amber-400 shrink-0" />;
      case "hazard_flagged":
        return <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />;
      default:
        return <Bell className="w-5 h-5 text-teal-400 shrink-0" />;
    }
  };

  return (
    <div
      role="alert"
      className="fixed top-20 right-4 z-50 max-w-sm w-full bg-[#142B3B] text-white border border-teal-500/40 rounded-xl shadow-2xl p-4 flex gap-3 items-start animate-in fade-in slide-in-from-top-4 duration-300 transition-all cursor-pointer hover:border-teal-400"
      onClick={handleClick}
    >
      <div className="mt-0.5">{renderIcon()}</div>
      <div className="flex-1 min-w-0">
        <h4 className="text-xs font-bold text-white flex items-center justify-between gap-2">
          <span>{toast.title}</span>
        </h4>
        <p className="text-[11.5px] text-slate-300 mt-0.5 line-clamp-2 leading-relaxed">
          {toast.body}
        </p>
        {toast.target_hazard_id && (
          <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-teal-300 mt-2 hover:underline">
            <MapPin className="w-3 h-3" />
            View update on live map
          </span>
        )}
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          dismissToast();
        }}
        className="p-1 text-slate-400 hover:text-white rounded"
        aria-label="Dismiss notification"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export default ToastNotification;
