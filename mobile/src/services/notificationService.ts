import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiRequest } from './apiClient';

export interface RouteXNotification {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  type: 'report' | 'confirmation' | 'alert' | 'system';
  read: boolean;
  data?: Record<string, any>;
}

const NOTIFICATIONS_STORAGE_KEY = '@routex_notifications_list';
const NATIVE_NOTIFICATIONS_ENABLED = false;

// Lazy loader for expo-notifications to prevent "[runtime not ready]" startup crashes
let cachedNotificationsModule: any = null;
function getNotificationsModule() {
  if (!NATIVE_NOTIFICATIONS_ENABLED) {
    return undefined;
  }

  if (cachedNotificationsModule !== null) {
    return cachedNotificationsModule;
  }
  try {
    // Only require once runtime is ready
    cachedNotificationsModule = require('expo-notifications');
    return cachedNotificationsModule;
  } catch {
    cachedNotificationsModule = undefined;
    return undefined;
  }
}

let isHandlerConfigured = false;

/**
 * Initialize notifications channels and permissions safely after runtime is ready
 */
export async function setupNotificationChannels(): Promise<boolean> {
  const Notifications = getNotificationsModule();
  if (!Notifications) {
    return false;
  }

  try {
    // Safely configure foreground presentation behavior
    if (!isHandlerConfigured && typeof Notifications.setNotificationHandler === 'function') {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          priority: Notifications.AndroidNotificationPriority?.HIGH ?? 4,
        }),
      });
      isHandlerConfigured = true;
    }

    // Configure Android Notification Channel
    const isAndroid = typeof Platform !== 'undefined' && Platform?.OS === 'android';
    if (isAndroid && typeof Notifications.setNotificationChannelAsync === 'function') {
      await Notifications.setNotificationChannelAsync('hazard-alerts', {
        name: 'RouteX Road Hazard Alerts',
        description: 'Instant alerts on reported road conditions and confirmations',
        importance: Notifications.AndroidImportance?.HIGH ?? 4,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#087F8C',
        enableVibrate: true,
        sound: 'default',
      });
    }

    if (typeof Notifications.getPermissionsAsync === 'function') {
      const settings = await Notifications.getPermissionsAsync();
      const granted = (
        settings?.granted ||
        settings?.ios?.status === 1 || // PROVISIONAL
        settings?.ios?.status === 2    // AUTHORIZED
      );
      if (granted && typeof Notifications.getExpoPushTokenAsync === 'function') {
        try {
          const tokenData = await Notifications.getExpoPushTokenAsync();
          if (tokenData?.data) {
            registerDevicePushToken(tokenData.data).catch(() => {});
          }
        } catch {
          // Token registration may fail if running without Expo Project ID or in bare test
        }
      }
      return granted;
    }
  } catch {
    // Gracefully fallback if notifications native runtime is restricted
  }

  return false;
}

/**
 * Register mobile device push token with backend notifications API
 */
export async function registerDevicePushToken(token: string): Promise<boolean> {
  if (!token) return false;
  try {
    await apiRequest('/notifications/devices/', {
      method: 'POST',
      body: JSON.stringify({ token, platform: Platform.OS }),
      headers: { 'Content-Type': 'application/json' },
      timeoutMs: 5000,
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Request notification permissions from user
 */
export async function requestNotificationPermission(): Promise<boolean> {
  const Notifications = getNotificationsModule();
  if (!Notifications || typeof Notifications.requestPermissionsAsync !== 'function') {
    return false;
  }

  try {
    const { status } = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
    });
    return status === 'granted';
  } catch {
    return false;
  }
}

/**
 * Fetch saved notifications history.
 * If authenticated, fetches remote notifications from backend API and synchronizes locally.
 * If offline or guest, falls back to AsyncStorage.
 */
export async function getNotificationHistory(): Promise<RouteXNotification[]> {
  try {
    const res = await apiRequest<{ results?: any[]; count?: number }>('/notifications/', {
      timeoutMs: 5000,
    });
    if (res && Array.isArray(res.results)) {
      const remoteList: RouteXNotification[] = res.results.map((item) => ({
        id: String(item.id),
        title: item.title,
        body: item.body,
        createdAt: item.created_at,
        type:
          item.notification_type === 'hazard_confirmed'
            ? 'confirmation'
            : item.notification_type === 'hazard_reported'
            ? 'report'
            : item.notification_type === 'safety_advisory'
            ? 'alert'
            : 'system',
        read: Boolean(item.is_read),
        data: {
          targetHazardId: item.target_hazard_id,
          category: item.target_hazard_category,
          location: item.target_hazard_location,
          ...(item.metadata || {}),
        },
      }));

      // Cache latest 50 to AsyncStorage
      await AsyncStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(remoteList.slice(0, 50)));
      return remoteList;
    }
  } catch {
    // Fall back to AsyncStorage when offline or unauthenticated
  }

  try {
    const raw = await AsyncStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * Mark a single notification as read
 */
export async function markNotificationRead(id: string): Promise<void> {
  const numId = parseInt(id, 10);
  if (!isNaN(numId)) {
    try {
      await apiRequest(`/notifications/${numId}/read/`, { method: 'PATCH', timeoutMs: 4000 });
    } catch {
      // ignore
    }
  }

  try {
    const raw = await AsyncStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (raw) {
      const list: RouteXNotification[] = JSON.parse(raw);
      const updated = list.map((n) => (n.id === id ? { ...n, read: true } : n));
      await AsyncStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
    }
  } catch {
    // ignore
  }
}

/**
 * Save notification item to history
 */
async function saveToHistory(item: RouteXNotification): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    const existing: RouteXNotification[] = raw ? JSON.parse(raw) : [];
    const updated = [item, ...existing.slice(0, 49)]; // Keep latest 50
    await AsyncStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsRead(): Promise<RouteXNotification[]> {
  try {
    await apiRequest('/notifications/mark-all-read/', { method: 'POST', timeoutMs: 5000 });
  } catch {
    // ignore
  }

  try {
    const raw = await AsyncStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    const existing: RouteXNotification[] = raw ? JSON.parse(raw) : [];
    const updated = existing.map((n) => ({ ...n, read: true }));
    await AsyncStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

/**
 * Clear all notifications
 */
export async function clearAllNotifications(): Promise<void> {
  await AsyncStorage.removeItem(NOTIFICATIONS_STORAGE_KEY);
}

/**
 * Send an immediate local notification and save to history
 */
export async function sendLocalNotification(params: {
  title: string;
  body: string;
  type?: RouteXNotification['type'];
  data?: Record<string, any>;
}): Promise<RouteXNotification> {
  const notifItem: RouteXNotification = {
    id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    title: params.title,
    body: params.body,
    createdAt: new Date().toISOString(),
    type: params.type || 'alert',
    read: false,
    data: params.data,
  };

  const Notifications = getNotificationsModule();
  if (Notifications && typeof Notifications.scheduleNotificationAsync === 'function') {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: params.title,
          body: params.body,
          data: params.data || {},
          sound: true,
          priority: Notifications.AndroidNotificationPriority?.HIGH ?? 4,
        },
        trigger: null, // deliver immediately
      });
    } catch {
      // Notification schedule might fail if permissions denied or running in emulator
    }
  }

  await saveToHistory(notifItem);
  return notifItem;
}

/**
 * Specialized notification: User submitted a hazard
 */
export async function notifyHazardReported(
  locationName?: string,
  category: string = 'hazard'
): Promise<RouteXNotification> {
  const catFormatted = category.replace(/_/g, ' ');
  const safeLocation = locationName || 'Reported Location';
  return sendLocalNotification({
    title: 'Hazard Report Submitted',
    body: `Your report for "${catFormatted}" at ${safeLocation} has been broadcast to the RouteX network.`,
    type: 'report',
    data: { category, locationName: safeLocation },
  });
}

/**
 * Specialized notification: Community hazard confirmation
 */
export async function notifyHazardConfirmed(
  category: string,
  locationName?: string
): Promise<RouteXNotification> {
  const catFormatted = category.replace(/_/g, ' ');
  const safeLocation = locationName || 'Reported Location';
  return sendLocalNotification({
    title: 'Hazard Presence Confirmed',
    body: `Fellow commuters confirmed the ${catFormatted} condition at ${safeLocation}. Safe travels!`,
    type: 'confirmation',
    data: { category, locationName: safeLocation },
  });
}

/**
 * Specialized notification: Corridor Safety Advisory
 */
export async function notifySafetyAdvisory(
  corridor: string,
  message: string
): Promise<RouteXNotification> {
  return sendLocalNotification({
    title: `Road Safety Advisory: ${corridor}`,
    body: message,
    type: 'alert',
    data: { corridor },
  });
}
