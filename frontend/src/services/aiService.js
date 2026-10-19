import { apiClient } from "./apiClient";

/**
 * RouteX AI Assistant Service
 * Connects frontend reporting and moderation interfaces to backend Gemini AI endpoints.
 */
export const aiService = {
  /**
   * Suggest best hazard category based on draft description text
   * @param {string} description
   * @param {string|null} selectedCategory
   */
  async suggestCategory(description, selectedCategory = null) {
    const response = await apiClient.post("/ai/suggest-category/", {
      description,
      selected_category: selectedCategory || null,
    });
    return response.data;
  },

  /**
   * Refine and polish description wording without altering facts
   * @param {string} description
   */
  async improveDescription(description) {
    const response = await apiClient.post("/ai/improve-description/", {
      description,
    });
    return response.data;
  },

  /**
   * Generate an objective 1-2 sentence incident summary for a report
   * @param {number} reportId
   */
  async summarizeReport(reportId) {
    const response = await apiClient.post("/ai/summarise-report/", {
      report_id: reportId,
    });
    return response.data;
  },

  /**
   * Check for duplicate hazards in the vicinity using hybrid spatial + AI comparison
   * @param {Object} payload - { latitude, longitude, description, category, radius_km, hours_window }
   */
  async checkDuplicates(payload) {
    const response = await apiClient.post("/ai/check-duplicates/", payload);
    return response.data;
  },
};
