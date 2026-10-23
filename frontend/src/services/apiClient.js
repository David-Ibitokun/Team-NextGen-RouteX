import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api/v1";

function getCookie(name) {
  let cookieValue = null;
  if (typeof document !== "undefined" && document.cookie && document.cookie !== "") {
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === name + "=") {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

let inMemoryCsrfToken = null;
const SESSION_STORAGE_KEY = "routex_session_id";

export function getSessionId() {
  if (typeof window !== "undefined" && window.localStorage) {
    return window.localStorage.getItem(SESSION_STORAGE_KEY);
  }
  return null;
}

export function setSessionId(id) {
  if (typeof window !== "undefined" && window.localStorage) {
    if (id) {
      window.localStorage.setItem(SESSION_STORAGE_KEY, id);
    } else {
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  withCredentials: true,
  headers: {
    "Accept": "application/json",
  },
});

// Attach CSRF token to unsafe HTTP methods
apiClient.interceptors.request.use((config) => {
  const sessionId = getSessionId() || getCookie("sessionid");
  if (sessionId) {
    config.headers["X-Session-ID"] = sessionId;
    config.headers["Authorization"] = `Session ${sessionId}`;
  }
  const method = (config.method || "").toLowerCase();
  if (!["get", "head", "options"].includes(method)) {
    const csrfToken = getCookie("csrftoken") || inMemoryCsrfToken;
    if (csrfToken) {
      config.headers["X-CSRFToken"] = csrfToken;
    }
  }
  return config;
});

export const authService = {
  /**
   * Fetch CSRF token and set session cookie
   */
  async getCsrfToken() {
    try {
      const response = await apiClient.get("/auth/csrf/");
      if (response?.data?.csrfToken) {
        inMemoryCsrfToken = response.data.csrfToken;
      }
      return response.data;
    } catch {
      return null;
    }
  },

  /**
   * Register a new user account
   * @param {Object} payload - { username, email, password, password_confirm, display_name }
   */
  async register(payload) {
    await this.getCsrfToken();
    const response = await apiClient.post("/auth/register/", payload);
    if (response?.data?.session_id) {
      setSessionId(response.data.session_id);
    }
    return response.data;
  },

  /**
   * Log in user
   * @param {Object} payload - { username, password }
   */
  async login(payload) {
    await this.getCsrfToken();
    const response = await apiClient.post("/auth/login/", payload);
    if (response?.data?.session_id) {
      setSessionId(response.data.session_id);
    }
    return response.data;
  },

  /**
   * Log out active session
   */
  async logout() {
    try {
      const response = await apiClient.post("/auth/logout/");
      return response.data;
    } finally {
      setSessionId(null);
    }
  },

  /**
   * Get currently authenticated user profile
   */
  async getMe() {
    const response = await apiClient.get("/auth/me/");
    return response.data;
  },

  /**
   * Permanently delete the authenticated user's account
   */
  async deleteAccount() {
    try {
      await this.getCsrfToken();
      const response = await apiClient.delete("/auth/me/delete/");
      return response.data;
    } finally {
      setSessionId(null);
    }
  },

  /**
   * Get currently authenticated user's submitted reports with optional filtering
   * @param {Object} params - { status, category, search, ordering }
   */
  async getMyReports(params = {}) {
    const response = await apiClient.get("/auth/me/reports/", { params });
    return response.data;
  },

  /**
   * Get aggregate metrics for the citizen commuter dashboard
   */
  async getDashboardSummary() {
    const response = await apiClient.get("/auth/dashboard-summary/");
    return response.data;
  },

  /**
   * Update authenticated citizen profile (display name, email)
   */
  async updateProfile(payload) {
    await this.getCsrfToken();
    const response = await apiClient.patch("/auth/profile/", payload);
    return response.data;
  },

  /**
   * Request password reset link for user's registered email
   * @param {string} email
   */
  async requestPasswordReset(email) {
    await this.getCsrfToken();
    const response = await apiClient.post("/auth/password-reset/", { email });
    return response.data;
  },

  /**
   * Validate password reset token and user id
   * @param {string} uid
   * @param {string} token
   */
  async validateResetToken(uid, token) {
    const response = await apiClient.post("/auth/password-reset/validate/", { uid, token });
    return response.data;
  },

  /**
   * Set new password with verified reset token
   * @param {Object} payload - { uid, token, new_password, new_password_confirm }
   */
  async confirmPasswordReset(payload) {
    await this.getCsrfToken();
    const response = await apiClient.post("/auth/password-reset/confirm/", payload);
    return response.data;
  },
};

export const hazardService = {
  /**
   * Fetch paginated list of hazards with optional filtering
   * @param {Object} params - { category, status, demo, bbox, min_lat, max_lat, min_lng, max_lng, lat, lng, radius_km }
   */
  async getHazards(params = {}) {
    const response = await apiClient.get("/hazards/", { params });
    return response.data;
  },

  /**
   * Fetch single hazard detail
   * @param {string|number} id
   */
  async getHazardById(id) {
    const response = await apiClient.get(`/hazards/${id}/`);
    return response.data;
  },

  /**
   * Submit a new hazard report (supports JSON and Multipart)
   * @param {FormData|Object} payload
   */
  async createHazard(payload) {
    await authService.getCsrfToken();
    const isFormData = payload instanceof FormData;
    // When sending FormData, let the browser / Axios automatically set multipart/form-data with boundary
    const config = isFormData
      ? {}
      : { headers: { "Content-Type": "application/json" } };
    const response = await apiClient.post("/hazards/", payload, config);
    return response.data;
  },

  /**
   * Confirm hazard presence
   * @param {string|number} id
   */
  async confirmHazard(id) {
    await authService.getCsrfToken();
    const response = await apiClient.post(`/hazards/${id}/confirm/`);
    return response.data;
  },

  /**
   * Flag hazard report
   * @param {string|number} id
   * @param {Object} data - { reason, notes }
   */
  async flagHazard(id, data) {
    await authService.getCsrfToken();
    const response = await apiClient.post(`/hazards/${id}/flags/`, data);
    return response.data;
  },

  /**
   * Check backend health
   */
  async checkHealth() {
    const response = await apiClient.get("/health/");
    return response.data;
  },
};

export const moderationService = {
  /**
   * Get aggregate metrics for the Moderator dashboard
   */
  async getStats() {
    const response = await apiClient.get("/moderation/stats/");
    return response.data;
  },

  /**
   * List reports for moderation queue
   * @param {Object} params - { status, flagged_only }
   */
  async getReports(params = {}) {
    const response = await apiClient.get("/moderation/reports/", { params });
    return response.data;
  },

  /**
   * Apply moderation action to a report
   * @param {string|number} reportId
   * @param {Object} payload - { action: 'review'|'confirm'|'resolve'|'reject', reason: string }
   */
  async takeAction(reportId, payload) {
    await authService.getCsrfToken();
    const response = await apiClient.post(`/moderation/reports/${reportId}/action/`, payload);
    return response.data;
  },

  /**
   * Get history of actions on a specific report
   * @param {string|number} reportId
   */
  async getReportHistory(reportId) {
    const response = await apiClient.get(`/moderation/reports/${reportId}/actions/`);
    return response.data;
  },

  /**
   * Get recent moderation actions across the entire platform
   */
  async getAllHistory() {
    const response = await apiClient.get("/moderation/history/");
    return response.data;
  },
};

export const adminService = {
  /**
   * Get platform-wide operational statistics
   */
  async getStats() {
    const response = await apiClient.get("/admin/stats/");
    return response.data;
  },

  /**
   * List registered users with search and role filtering
   * @param {Object} params - { q, role }
   */
  async getUsers(params = {}) {
    const response = await apiClient.get("/admin/users/", { params });
    return response.data;
  },

  /**
   * Update a user's role (citizen, moderator, admin)
   * @param {number|string} userId
   * @param {string} role
   * @param {string} reason
   */
  async updateUserRole(userId, role, reason = "") {
    await authService.getCsrfToken();
    const response = await apiClient.patch(`/admin/users/${userId}/role/`, { role, reason });
    return response.data;
  },

  /**
   * Permanently delete a user account
   * @param {number|string} userId
   */
  async deleteUser(userId) {
    await authService.getCsrfToken();
    const response = await apiClient.delete(`/admin/users/${userId}/`);
    return response.data;
  },

  /**
   * Get platform operational settings
   */
  async getSettings() {
    const response = await apiClient.get("/admin/settings/");
    return response.data;
  },

  /**
   * Update platform operational settings
   * @param {Object} payload
   */
  async updateSettings(payload) {
    await authService.getCsrfToken();
    const response = await apiClient.patch("/admin/settings/", payload);
    return response.data;
  },

  /**
   * Get chronological system audit logs
   */
  async getAuditLogs() {
    const response = await apiClient.get("/admin/audit-logs/");
    return response.data;
  },
};

export default apiClient;
