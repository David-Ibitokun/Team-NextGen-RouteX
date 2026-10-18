import AsyncStorage from '@react-native-async-storage/async-storage';
import { HazardItem } from '../constants/hazardTypes';

const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
export const API_BASE_URL = configuredApiUrl
  ? configuredApiUrl.replace(/\/+$/, '')
  : 'http://192.168.0.141:8000/api/v1';

const STORAGE_KEYS = {
  CSRF_TOKEN: '@routex_csrf_token',
  SESSION_ID: '@routex_session_id',
  SAVED_USER: '@routex_saved_user',
};

// In-memory cookie and CSRF cache
let cachedCsrfToken: string | null = null;
let cachedSessionId: string | null = null;

/**
 * Initialize tokens from AsyncStorage on app boot
 */
export async function initializeApiSession(): Promise<{
  csrfToken: string | null;
  sessionId: string | null;
}> {
  try {
    const [storedCsrf, storedSession] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.CSRF_TOKEN),
      AsyncStorage.getItem(STORAGE_KEYS.SESSION_ID),
    ]);
    cachedCsrfToken = storedCsrf;
    cachedSessionId = storedSession;
    return { csrfToken: storedCsrf, sessionId: storedSession };
  } catch {
    return { csrfToken: null, sessionId: null };
  }
}

/**
 * Update and persist session tokens
 */
export async function persistTokens(tokens: {
  csrfToken?: string | null;
  sessionId?: string | null;
}) {
  if (tokens.csrfToken !== undefined) {
    cachedCsrfToken = tokens.csrfToken;
    if (tokens.csrfToken) {
      await AsyncStorage.setItem(STORAGE_KEYS.CSRF_TOKEN, tokens.csrfToken);
    } else {
      await AsyncStorage.removeItem(STORAGE_KEYS.CSRF_TOKEN);
    }
  }

  if (tokens.sessionId !== undefined) {
    cachedSessionId = tokens.sessionId;
    if (tokens.sessionId) {
      await AsyncStorage.setItem(STORAGE_KEYS.SESSION_ID, tokens.sessionId);
    } else {
      await AsyncStorage.removeItem(STORAGE_KEYS.SESSION_ID);
    }
  }
}

/**
 * Extract cookies from response Set-Cookie headers
 */
function extractCookiesFromResponse(response: Response) {
  try {
    const setCookieHeader = response.headers.get('set-cookie');
    if (!setCookieHeader) return;

    // Handle sessionid
    const sessionMatch = /sessionid=([^;]+)/i.exec(setCookieHeader);
    if (sessionMatch && sessionMatch[1]) {
      persistTokens({ sessionId: sessionMatch[1] });
    }

    // Handle csrftoken
    const csrfMatch = /csrftoken=([^;]+)/i.exec(setCookieHeader);
    if (csrfMatch && csrfMatch[1]) {
      persistTokens({ csrfToken: csrfMatch[1] });
    }
  } catch {
    // Ignore header parse issues
  }
}

export interface ApiResponse<T = any> {
  ok: boolean;
  status: number;
  data: T;
  error?: string;
  fieldErrors?: Record<string, any>;
}

/**
 * Core HTTP Request Wrapper with CSRF and Session handling
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit & { timeoutMs?: number } = {}
): Promise<T> {
  if (!API_BASE_URL && !endpoint.startsWith('http')) {
    throw new Error('EXPO_PUBLIC_API_URL is not configured. Set it in mobile/.env and restart Expo.');
  }

  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const method = (options.method || 'GET').toUpperCase();
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  // Build Cookie Header
  const cookies: string[] = [];
  if (cachedSessionId) {
    cookies.push(`sessionid=${cachedSessionId}`);
  }
  if (cachedCsrfToken) {
    cookies.push(`csrftoken=${cachedCsrfToken}`);
  }
  if (cookies.length > 0) {
    headers['Cookie'] = cookies.join('; ');
  }

  // Attach X-CSRFToken on mutation requests
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method) && cachedCsrfToken) {
    headers['X-CSRFToken'] = cachedCsrfToken;
  }

  const timeoutMs = options.timeoutMs ?? 15000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
      credentials: 'omit', // We explicitly supply Cookie header for uniform Android/iOS behavior
    });
    clearTimeout(timer);

    extractCookiesFromResponse(response);

    const contentType = response.headers.get('content-type') || '';
    let responseData: any = null;
    if (contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }

    if (!response.ok) {
      let errorMsg = `Request failed with status ${response.status}`;
      if (typeof responseData === 'object' && responseData) {
        if (responseData.detail) {
          errorMsg = String(responseData.detail);
        } else if (responseData.message) {
          errorMsg = String(responseData.message);
        } else {
          const fieldMsgs = Object.entries(responseData)
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : String(v)}`)
            .join(' | ');
          if (fieldMsgs) errorMsg = fieldMsgs;
        }
      }
      console.warn(`[RouteX] HTTP ${response.status} from ${endpoint}:`, JSON.stringify(responseData));
      const errorObj: any = new Error(errorMsg);
      errorObj.status = response.status;
      errorObj.data = responseData;
      throw errorObj;
    }

    return responseData as T;
  } catch (err: any) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      const timeoutErr: any = new Error('Request timed out. Please check your connection.');
      timeoutErr.isTimeout = true;
      throw timeoutErr;
    }
    throw err;
  }
}

/**
 * Authentication Service
 */
export const authService = {
  /**
   * Fetch CSRF token and set session cookie
   */
  async getCsrfToken(): Promise<string> {
    const data = await apiRequest<{ csrfToken: string }>('/auth/csrf/');
    if (data?.csrfToken) {
      await persistTokens({ csrfToken: data.csrfToken });
    }
    return data?.csrfToken || '';
  },

  /**
   * Log in user with username/email & password
   */
  async login(payload: { username: string; password: string }) {
    await this.getCsrfToken();
    const data = await apiRequest('/auth/login/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (data) {
      await AsyncStorage.setItem(STORAGE_KEYS.SAVED_USER, JSON.stringify(data));
    }
    return data;
  },

  /**
   * Register a new user account
   */
  async register(payload: {
    username: string;
    email: string;
    password: string;
    password_confirm: string;
    display_name?: string;
  }) {
    await this.getCsrfToken();
    const data = await apiRequest('/auth/register/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (data) {
      await AsyncStorage.setItem(STORAGE_KEYS.SAVED_USER, JSON.stringify(data));
    }
    return data;
  },

  /**
   * Log out active session
   */
  async logout() {
    try {
      await apiRequest('/auth/logout/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch {
      // Ignore network errors on logout
    } finally {
      await persistTokens({ sessionId: null, csrfToken: null });
      await AsyncStorage.removeItem(STORAGE_KEYS.SAVED_USER);
    }
  },

  /**
   * Get currently authenticated user profile
   */
  async getMe() {
    const data = await apiRequest('/auth/me/');
    if (data) {
      await AsyncStorage.setItem(STORAGE_KEYS.SAVED_USER, JSON.stringify(data));
    }
    return data;
  },

  /**
   * Permanently delete the authenticated user's account
   */
  async deleteAccount() {
    await this.getCsrfToken();
    const data = await apiRequest('/auth/me/delete/', {
      method: 'DELETE',
    });
    await persistTokens({ sessionId: null, csrfToken: null });
    await AsyncStorage.removeItem(STORAGE_KEYS.SAVED_USER);
    return data;
  },

  /**
   * Get cached user from storage
   */
  async getSavedUser() {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.SAVED_USER);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  /**
   * Get currently authenticated user's submitted reports
   */
  async getMyReports(): Promise<HazardItem[]> {
    return apiRequest<HazardItem[]>('/auth/me/reports/');
  },

  /**
   * Get aggregate metrics for the commuter dashboard
   */
  async getDashboardSummary() {
    return apiRequest('/auth/dashboard-summary/');
  },

  /**
   * Update profile (display name, email)
   */
  async updateProfile(payload: { display_name?: string; email?: string }) {
    await this.getCsrfToken();
    return apiRequest('/auth/profile/', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  },

  /**
   * Request password reset link for user's registered email
   */
  async requestPasswordReset(email: string) {
    await this.getCsrfToken();
    return apiRequest('/auth/password-reset/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });
  },

  /**
   * Confirm password reset
   */
  async confirmPasswordReset(payload: {
    uid: string;
    token: string;
    new_password: string;
    new_password_confirm: string;
  }) {
    await this.getCsrfToken();
    return apiRequest('/auth/password-reset/confirm/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  },
};

/**
 * Moderation Service for Safety Team
 */
export const moderationService = {
  async getStats() {
    return apiRequest('/moderation/stats/');
  },
  async getReports(params: Record<string, any> = {}) {
    const query = new URLSearchParams();
    Object.keys(params).forEach((key) => {
      if (params[key] !== undefined && params[key] !== null) {
        query.append(key, String(params[key]));
      }
    });
    const qs = query.toString();
    return apiRequest(`/moderation/reports/${qs ? `?${qs}` : ''}`);
  },
  async takeAction(reportId: string | number, payload: { action: string; reason: string }) {
    await authService.getCsrfToken();
    return apiRequest(`/moderation/reports/${reportId}/action/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  },
};

/**
 * Admin Service for Platform Operations
 */
export const adminService = {
  async getStats() {
    return apiRequest('/admin/stats/');
  },
  async getUsers(params: Record<string, any> = {}) {
    const query = new URLSearchParams();
    Object.keys(params).forEach((key) => {
      if (params[key] !== undefined && params[key] !== null) {
        query.append(key, String(params[key]));
      }
    });
    const qs = query.toString();
    return apiRequest(`/admin/users/${qs ? `?${qs}` : ''}`);
  },
  async getSettings() {
    return apiRequest('/admin/settings/');
  },
  async updateSettings(payload: Record<string, any>) {
    await authService.getCsrfToken();
    return apiRequest('/admin/settings/', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  },
  async getAuditLogs() {
    return apiRequest('/admin/audit-logs/');
  },
};
