import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Info,
  Radio,
  Check,
  Trash2,
  MapPin,
  X,
  Loader2,
} from "lucide-react";
import { useNotifications } from "../../context/NotificationContext";
import { useAuth } from "../../context/AuthContext";

function formatRelativeTime(dateString) {
  if (!dateString) return "";
  const now = new Date();
  const date = new Date(dateString);
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function getNotificationIcon(type) {
  const iconProps = { className: "w-4 h-4 shrink-0" };
  switch (type) {
    case "hazard_confirmed":
      return <CheckCircle2 {...iconProps} className="w-4 h-4 text-emerald-400 shrink-0" />;
    case "status_changed":
      return <CheckCircle2 {...iconProps} className="w-4 h-4 text-teal-400 shrink-0" />;
    case "safety_advisory":
      return <Radio {...iconProps} className="w-4 h-4 text-amber-400 shrink-0" />;
    case "hazard_flagged":
      return <ShieldAlert {...iconProps} className="w-4 h-4 text-red-400 shrink-0" />;
    case "hazard_reported":
      return <MapPin {...iconProps} className="w-4 h-4 text-sky-400 shrink-0" />;
    default:
      return <Info {...iconProps} className="w-4 h-4 text-slate-400 shrink-0" />;
  }
}

export function NotificationBell() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState("all"); // 'all' | 'unread'
  const popoverRef = useRef(null);

  // Toggle popover and fetch latest notifications
  const handleToggle = () => {
    if (!isOpen) {
      fetchNotifications({ unreadOnly: filter === "unread" });
    }
    setIsOpen((prev) => !prev);
  };

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Refetch when filter changes
  useEffect(() => {
    if (isOpen) {
      fetchNotifications({ unreadOnly: filter === "unread" });
    }
  }, [filter, isOpen, fetchNotifications]);

  const handleNotificationClick = (notif) => {
    if (!notif.is_read) {
      markAsRead(notif.id);
    }
    if (notif.target_hazard_id) {
      setIsOpen(false);
      navigate(`/map?hazard_id=${notif.target_hazard_id}`);
    }
  };

  if (!user) {
    return null;
  }

  const displayedNotifications =
    filter === "unread" ? notifications.filter((n) => !n.is_read) : notifications;

  return (
    <div className="relative" ref={popoverRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={handleToggle}
        className="relative p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-md transition-colors border border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
        title="Notifications"
        aria-label="Open notifications"
        aria-expanded={isOpen}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-extrabold text-white bg-teal-500 dark:bg-teal-400 rounded-full shadow-sm animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-[#142533] border border-slate-200 dark:border-slate-700/80 rounded-xl shadow-2xl z-50 overflow-hidden text-slate-800 dark:text-slate-100 flex flex-col max-h-[520px] transition-all">
          {/* Header */}
          <div className="p-3 border-b border-slate-200 dark:border-slate-700/80 flex items-center justify-between bg-slate-50 dark:bg-[#0E1B26]">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-[11px] font-semibold bg-teal-100 dark:bg-teal-950/70 text-teal-800 dark:text-teal-300 rounded-full border border-teal-300 dark:border-teal-800">
                  {unreadCount} unread
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="text-[11px] text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 font-medium"
                  title="Mark all as read"
                >
                  <Check className="w-3 h-3" />
                  Mark all read
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex border-b border-slate-200 dark:border-slate-700/80 bg-slate-100/60 dark:bg-[#101F2B] text-xs">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`flex-1 py-1.5 font-medium text-center transition-colors ${
                filter === "all"
                  ? "text-teal-600 dark:text-teal-400 border-b-2 border-teal-500 font-bold bg-white dark:bg-[#142533]"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setFilter("unread")}
              className={`flex-1 py-1.5 font-medium text-center transition-colors ${
                filter === "unread"
                  ? "text-teal-600 dark:text-teal-400 border-b-2 border-teal-500 font-bold bg-white dark:bg-[#142533]"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              Unread {unreadCount > 0 ? `(${unreadCount})` : ""}
            </button>
          </div>

          {/* List Content */}
          <div className="overflow-y-auto flex-1 divide-y divide-slate-100 dark:divide-slate-800/60">
            {loading ? (
              <div className="p-8 text-center text-slate-400 flex flex-col items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-teal-500" />
                <span className="text-xs">Loading notifications...</span>
              </div>
            ) : displayedNotifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 flex flex-col items-center gap-2">
                <Bell className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                <span className="text-xs font-medium">
                  {filter === "unread"
                    ? "No unread notifications"
                    : "No notifications yet"}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 max-w-[200px]">
                  You will be notified when road hazards in your area are verified or updated.
                </span>
              </div>
            ) : (
              displayedNotifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-3 transition-colors cursor-pointer flex gap-3 items-start group ${
                    notif.is_read
                      ? "bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/40 opacity-80"
                      : "bg-teal-50/50 dark:bg-teal-950/20 hover:bg-teal-50 dark:hover:bg-teal-950/40 font-medium"
                  }`}
                >
                  {/* Icon */}
                  <div className="mt-0.5">{getNotificationIcon(notif.notification_type)}</div>

                  {/* Body Text */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {notif.title}
                      </span>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap">
                        {formatRelativeTime(notif.created_at)}
                      </span>
                    </div>
                    <p className="text-[11.5px] text-slate-600 dark:text-slate-300 line-clamp-2 mt-0.5 leading-snug">
                      {notif.body}
                    </p>

                    {/* Metadata chips / actions */}
                    <div className="flex items-center gap-2 mt-1.5">
                      {notif.target_hazard_id && (
                        <span className="text-[10px] font-semibold text-teal-600 dark:text-teal-400 flex items-center gap-1 group-hover:underline">
                          <MapPin className="w-2.5 h-2.5" />
                          View on map
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quick Actions (Mark Read / Delete) */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!notif.is_read && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notif.id);
                        }}
                        className="p-1 text-slate-400 hover:text-teal-500 rounded"
                        title="Mark as read"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notif.id);
                      }}
                      className="p-1 text-slate-400 hover:text-red-500 rounded"
                      title="Delete notification"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
