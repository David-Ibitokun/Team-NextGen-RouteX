import { HazardItem } from '../constants/hazardTypes';

// Use local Django API via 10.0.2.2 (emulator) or LAN IP for physical device
const DEFAULT_API_HOST = 'http://192.168.0.178:8000';

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || `${DEFAULT_API_HOST}/api/v1`;

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

export async function fetchHazards(params: { category?: string; status?: string } = {}): Promise<HazardItem[]> {
  try {
    const queryParts: string[] = [];
    if (params.category && params.category !== 'all') {
      queryParts.push(`category=${encodeURIComponent(params.category)}`);
    }
    if (params.status && params.status !== 'all') {
      queryParts.push(`status=${encodeURIComponent(params.status)}`);
    }
    const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(`${API_BASE_URL}/hazards/${queryString}`, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Server returned HTTP ${response.status}`);
    }

    const data = await response.json();
    const items: HazardItem[] = Array.isArray(data) ? data : data.results || [];
    return items.length > 0 ? items : MOCK_HAZARDS;
  } catch {
    // Graceful offline fallback with mock data for smooth offline demo
    let filtered = [...MOCK_HAZARDS];
    if (params.category && params.category !== 'all') {
      filtered = filtered.filter((h) => h.category === params.category);
    }
    if (params.status && params.status !== 'all') {
      filtered = filtered.filter((h) => h.status === params.status);
    }
    return filtered;
  }
}

export async function submitHazard(payload: {
  category: string;
  description: string;
  location_name: string;
  latitude: number;
  longitude: number;
  photoUri?: string;
}): Promise<HazardItem> {
  const newHazard: HazardItem = {
    id: `native-${Date.now()}`,
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
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const formData = new FormData();
    formData.append('category', payload.category);
    formData.append('location_label', payload.location_name);
    formData.append('location_name', payload.location_name);
    formData.append('description', payload.description);
    formData.append('latitude', String(payload.latitude));
    formData.append('longitude', String(payload.longitude));

    if (payload.photoUri) {
      const filename = payload.photoUri.split('/').pop() || 'hazard_photo.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const mimeType = match ? `image/${match[1]}` : 'image/jpeg';
      formData.append('photo', {
        uri: payload.photoUri,
        name: filename,
        type: mimeType,
      } as any);
    }

    const response = await fetch(`${API_BASE_URL}/hazards/`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
      body: formData,
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      return data;
    }
  } catch {
    // If backend offline or network unreachable, accept locally
  }

  return newHazard;
}
