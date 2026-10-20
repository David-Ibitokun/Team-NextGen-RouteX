import { apiClient } from "./apiClient";

export const notificationService = {
  /**
   * Fetch paginated list of notifications for the authenticated user
   * @param {Object} options - { page, pageSize, unreadOnly, type }
   */
  async getNotifications({ page = 1, pageSize = 20, unreadOnly = false, type = null } = {}) {
    const params = {
      page,
      page_size: pageSize,
    };
    if (unreadOnly) {
      params.unread = true;
    }
    if (type) {
      params.type = type;
    }
    const response = await apiClient.get("/notifications/", { params });
    return response.data;
  },

  /**
   * Get total unread notifications count
   */
  async getUnreadCount() {
    const response = await apiClient.get("/notifications/unread-count/");
    return response.data; // { unread_count: number }
  },

  /**
   * Mark a single notification as read
   * @param {number} notificationId
   */
  async markAsRead(notificationId) {
    const response = await apiClient.patch(`/notifications/${notificationId}/read/`);
    return response.data;
  },

  /**
   * Mark all unread notifications as read
   */
  async markAllAsRead() {
    const response = await apiClient.post("/notifications/mark-all-read/");
    return response.data;
  },

  /**
   * Permanently delete a notification
   * @param {number} notificationId
   */
  async deleteNotification(notificationId) {
    const response = await apiClient.delete(`/notifications/${notificationId}/`);
    return response.data;
  },

  /**
   * Broadcast a corridor or city-wide safety advisory (moderators/admins)
   * @param {Object} payload - { corridor, title, message }
   */
  async broadcastAdvisory(payload) {
    const response = await apiClient.post("/notifications/broadcast/", payload);
    return response.data;
  },
};

export default notificationService;
