import { apiRequest } from './apiClient';

export interface SuggestCategoryResult {
  suggested_category: string;
  category_display: string;
  confidence: number;
  reason: string;
  disclaimer: string;
}

export interface ImproveDescriptionResult {
  original_description: string;
  suggested_description: string;
  changes_made: string;
  disclaimer: string;
}

export interface SummarizeReportResult {
  report_id: number;
  category: string;
  category_display: string;
  location_label: string | null;
  summary: string;
  urgency_level: string;
  disclaimer: string;
}

export interface DuplicateCandidate {
  id: number;
  category: string;
  category_display: string;
  location_label: string | null;
  description: string;
  status: string;
  confirmations_count: number;
  distance_km: number;
  distance_meters: number;
  created_at: string;
  similarity_score: number;
  is_likely_same_hazard: boolean;
  match_rationale: string;
}

export interface CheckDuplicatesResult {
  is_possible_duplicate: boolean;
  nearby_count: number;
  candidates: DuplicateCandidate[];
  analysis: string;
  disclaimer: string;
}

export interface CheckDuplicatesPayload {
  latitude: number;
  longitude: number;
  description: string;
  category?: string;
  radius_km?: number;
  hours_window?: number;
  exclude_report_id?: number | null;
}

/**
 * RouteX Mobile AI Assistant Service
 * Connects React Native reporting and moderation interfaces to backend Gemini AI endpoints.
 */
export const aiService = {
  /**
   * Suggest best hazard category based on draft description text
   */
  async suggestCategory(
    description: string,
    selectedCategory?: string | null
  ): Promise<SuggestCategoryResult> {
    return apiRequest<SuggestCategoryResult>('/ai/suggest-category/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        description,
        selected_category: selectedCategory || null,
      }),
    });
  },

  /**
   * Refine and polish description wording without altering observed facts
   */
  async improveDescription(
    description: string
  ): Promise<ImproveDescriptionResult> {
    return apiRequest<ImproveDescriptionResult>('/ai/improve-description/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        description,
      }),
    });
  },

  /**
   * Generate an objective 1-2 sentence incident summary for a report (moderator triage)
   */
  async summarizeReport(reportId: number): Promise<SummarizeReportResult> {
    return apiRequest<SummarizeReportResult>('/ai/summarise-report/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        report_id: reportId,
      }),
    });
  },

  /**
   * Check for duplicate hazards in the vicinity using hybrid spatial + AI comparison
   */
  async checkDuplicates(
    payload: CheckDuplicatesPayload
  ): Promise<CheckDuplicatesResult> {
    return apiRequest<CheckDuplicatesResult>('/ai/check-duplicates/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  },
};
