import { HazardItem } from '../constants/hazardTypes';
import { apiRequest, authService, API_BASE_URL } from './apiClient';

export { API_BASE_URL };

// Fallback seed data in case the physical device is not on the same Wi-Fi
export const MOCK_HAZARDS: HazardItem[] = [
  {
    id: 'mock-1',
    category: 'flooding',
    status: 'community_confirmed',
    location_name: 'Lekki-Epe Expressway, KM 14',
    description: 'Heavy flash flood covering both inner lanes following torrential morning rainfall. Slow moving traffic.',
    latitude: 6.4428,
    longitude: 3.4839,
    created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    confirmations_count: 14,
    flags_count: 0,
    is_demo: true,
  },
  {
    id: 'mock-2',
    category: 'pothole',
    status: 'reported',
    location_name: 'Ikorodu Road, Maryland Underpass',
    description: 'Severe sharp pothole right before the flyover ascent. Causing sudden swerves and vehicle damage.',
    latitude: 6.5721,
    longitude: 3.3672,
    created_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    confirmations_count: 7,
    flags_count: 0,
    is_demo: true,
  },
  {
    id: 'mock-3',
    category: 'fallen_tree',
    status: 'under_review',
    location_name: 'Ozumba Mbadiwe Avenue, Victoria Island',
    description: 'Large tree branch fell across the service lane near Civic Centre. Utility workers on site.',
    latitude: 6.4355,
    longitude: 3.4211,
    created_at: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    confirmations_count: 9,
    flags_count: 0,
    is_demo: true,
  },
  {
    id: 'mock-4',
    category: 'blocked_road',
    status: 'community_confirmed',
    location_name: 'Third Mainland Bridge, Adeniji Adele Ramp',
    description: 'Breakdown of a container trailer blocking rightmost lane outbound toward Lagos Island.',
    latitude: 6.4674,
    longitude: 3.3982,
    created_at: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
    confirmations_count: 26,
    flags_count: 1,
    is_demo: true,
  },
  {
    id: 'mock-5',
    category: 'other',
    status: 'resolved',
    location_name: 'Awolowo Way, Ikeja',
    description: 'Manhole cover replaced and hazard warning signs cleared. Road is safe for normal speed.',
    latitude: 6.5982,
    longitude: 3.3441,
    created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    confirmations_count: 18,
    flags_count: 0,
    is_demo: true,
  },
];

/**
 * Fetch hazards from backend API database
 */
export async function fetchHazards(params: {
  category?: string;
  status?: string;
  bbox?: string;
  lat?: number;
  lng?: number;
  radius_km?: number;
  page_size?: number;
} = {}): Promise<HazardItem[]> {
  const queryParts: string[] = [];
  if (params.category && params.category !== 'all') {
    queryParts.push(`category=${encodeURIComponent(params.category)}`);
  }
  if (params.status && params.status !== 'all') {
    queryParts.push(`status=${encodeURIComponent(params.status)}`);
  }
  if (params.bbox) {
    queryParts.push(`bbox=${encodeURIComponent(params.bbox)}`);
  }
  if (params.lat != null && params.lng != null) {
    queryParts.push(`lat=${encodeURIComponent(params.lat)}`);
    queryParts.push(`lng=${encodeURIComponent(params.lng)}`);
    queryParts.push(`radius_km=${encodeURIComponent(params.radius_km ?? 10)}`);
  }
  const pageSize = params.page_size ?? 100;
  queryParts.push(`page_size=${pageSize}`);
  const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';

  try {
    const data = await apiRequest(`/hazards/${queryString}`, { timeoutMs: 15000 });
    const rawItems: any[] = Array.isArray(data) ? data : data?.results || [];
    const items: HazardItem[] = rawItems.map((h) => ({
      ...h,
      location_name: h.location_name || h.location_label || 'Lagos, Nigeria',
      location_label: h.location_label || h.location_name || 'Lagos, Nigeria',
    }));
    return items;
  } catch (err) {
    console.warn('[RouteX] Error fetching live hazards from backend database:', err);
    return [];
  }
}

/**
 * Fetch hazard by ID from backend database
 */
export async function getHazardById(id: string | number): Promise<HazardItem> {
  return await apiRequest<HazardItem>(`/hazards/${id}/`);
}

/**
 * Submit a new hazard report to the backend API
 */
export async function submitHazard(payload: {
  category: string;
  description: string;
  location_name: string;
  latitude: number;
  longitude: number;
  photoUri?: string;
  photoBase64?: string;
}): Promise<HazardItem> {
  const localHazardId = `native-${Date.now()}`;
  const fallbackHazard: HazardItem = {
    id: localHazardId,
    category: payload.category as any,
    status: 'reported',
    location_name: payload.location_name,
    description: payload.description,
    latitude: payload.latitude,
    longitude: payload.longitude,
    photo_url: payload.photoUri,
    created_at: new Date().toISOString(),
    confirmations_count: 1,
    flags_count: 0,
    is_demo: false,
  };

  try {
    // Ensure CSRF token is available
    await authService.getCsrfToken().catch(() => '');

    let data: HazardItem;
    const formattedLat = Number(Number(payload.latitude).toFixed(6));
    const formattedLng = Number(Number(payload.longitude).toFixed(6));

    if (payload.photoBase64) {
      // 100% reliable JSON submission with base64 encoded photo
      data = await apiRequest<HazardItem>('/hazards/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category: payload.category,
          location_label: payload.location_name,
          description: payload.description,
          latitude: formattedLat,
          longitude: formattedLng,
          photo_base64: payload.photoBase64,
        }),
        timeoutMs: 20000,
      });
    } else if (payload.photoUri) {
      const formData = new FormData();
      formData.append('category', payload.category);
      formData.append('location_label', payload.location_name);
      formData.append('description', payload.description);
      formData.append('latitude', String(formattedLat));
      formData.append('longitude', String(formattedLng));

      const filename = payload.photoUri.split('/').pop()?.split('?')[0] || 'hazard_photo.jpg';
      const ext = filename.split('.').pop()?.toLowerCase();
      let mimeType = 'image/jpeg';
      if (ext === 'png') mimeType = 'image/png';
      else if (ext === 'webp') mimeType = 'image/webp';
      else if (ext === 'gif') mimeType = 'image/gif';

      try {
        // Modern Expo / WinterCG fetch expects a standard Blob
        const photoRes = await fetch(payload.photoUri);
        const photoBlob = await photoRes.blob();
        formData.append('photo', photoBlob, filename);
      } catch (blobErr) {
        console.warn('[RouteX] Blob conversion error, fallback to legacy part:', blobErr);
        formData.append('photo', {
          uri: payload.photoUri,
          name: filename,
          type: mimeType,
        } as any);
      }

      data = await apiRequest<HazardItem>('/hazards/', {
        method: 'POST',
        body: formData,
        timeoutMs: 15000,
      });
    } else {
      // Clean JSON payload for faster and guaranteed parsing
      data = await apiRequest<HazardItem>('/hazards/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category: payload.category,
          location_label: payload.location_name,
          description: payload.description,
          latitude: formattedLat,
          longitude: formattedLng,
        }),
        timeoutMs: 12000,
      });
    }

    return data;
  } catch (err: any) {
    console.error('[RouteX] Hazard submission error:', err);
    throw err;
  }
}

/**
 * Confirm hazard presence
 */
export async function confirmHazard(id: string | number): Promise<any> {
  await authService.getCsrfToken().catch(() => '');
  return await apiRequest(`/hazards/${id}/confirm/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Flag hazard report
 */
export async function flagHazard(
  id: string | number,
  data: { reason: string; notes?: string }
): Promise<any> {
  try {
    await authService.getCsrfToken().catch(() => '');
    return await apiRequest(`/hazards/${id}/flags/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  } catch (err) {
    return { status: 'flagged', id };
  }
}

/**
 * Check backend service health
 */
export async function checkHealth(): Promise<{ status: string; service: string }> {
  return apiRequest('/health/', { timeoutMs: 4000 });
}
