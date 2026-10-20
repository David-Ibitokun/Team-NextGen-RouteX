import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "./AuthContext";
import { notificationService } from "../services/notificationService";

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const prevUnreadCountRef = useRef(0);
  const hasInitializedRef = useRef(false);

  const fetchUnreadCount = useCallback(async () => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    try {
      const data = await notificationService.getUnreadCount();
      const newCount = data.unread_count || 0;

      // If count increased after initial load, trigger toast for the newest notification
      if (hasInitializedRef.current && newCount > prevUnreadCountRef.current) {
        try {
          const latestList = await notificationService.getNotifications({ page: 1, pageSize: 1 });
          if (latestList?.results?.length > 0) {
            const newest = latestList.results[0];
            setToast({
              id: newest.id,
              title: newest.title,
              body: newest.body,
              type: newest.notification_type,
              target_hazard_id: newest.target_hazard_id,
            });
          }
        } catch {
          // ignore toast fetch error
        }
      }

      setUnreadCount(newCount);
      prevUnreadCountRef.current = newCount;
      hasInitializedRef.current = true;
    } catch {
      // ignore network errors
    }
  }, [user]);

  const fetchNotifications = useCallback(async (options = {}) => {
    if (!user) {
      setNotifications([]);
      return;
    }
    setLoading(true);
    try {
      const data = await notificationService.getNotifications(options);
      setNotifications(data.results || []);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const markAsRead = useCallback(async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
      prevUnreadCountRef.current = 0;
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
    }
  }, []);

  const deleteNotification = useCallback(async (notificationId) => {
    try {
      await notificationService.deleteNotification(notificationId);
      setNotifications((prev) => {
        const item = prev.find((n) => n.id === notificationId);
        if (item && !item.is_read) {
          setUnreadCount((c) => Math.max(0, c - 1));
        }
        return prev.filter((n) => n.id !== notificationId);
      });
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  }, []);

  const dismissToast = useCallback(() => {
    setToast(null);
  }, []);

  // Poll unread count every 45 seconds when user is authenticated
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      hasInitializedRef.current = false;
      return;
    }

    fetchUnreadCount();

    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 45000);

    const handleFocus = () => {
      fetchUnreadCount();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [user, fetchUnreadCount]);

  const value = {
    notifications,
    unreadCount,
    loading,
    toast,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    dismissToast,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}

export default NotificationContext;
