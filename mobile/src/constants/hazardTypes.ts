export interface HazardCategoryConfig {
  id: string;
  label: string;
  description: string;
  color: string;
  iconName: string;
  lightBg: string;
  darkBg: string;
}

export const HAZARD_CATEGORIES: HazardCategoryConfig[] = [
  {
    id: 'flooding',
    label: 'Flooding',
    description: 'Deep standing water, impassable road, or drainage overflow',
    color: '#087F8C',
    iconName: 'water',
    lightBg: '#E0F2FE',
    darkBg: '#0C2E42',
  },
  {
    id: 'pothole',
    label: 'Pothole',
    description: 'Deep crater, road surface damage, or sinkhole',
    color: '#F2B544',
    iconName: 'warning',
    lightBg: '#FEF3C7',
    darkBg: '#3F2C0B',
  },
  {
    id: 'blocked_road',
    label: 'Blocked Road',
    description: 'Broken vehicle, accident, or road obstruction',
    color: '#D64545',
    iconName: 'close-circle',
    lightBg: '#FEE2E2',
    darkBg: '#441414',
  },
  {
    id: 'fallen_tree',
    label: 'Fallen Tree',
    description: 'Fallen tree, hanging branch, or fallen pole/cables',
    color: '#27865B',
    iconName: 'leaf',
    lightBg: '#D1FAE5',
    darkBg: '#0E3B24',
  },
  {
    id: 'other',
    label: 'Other Hazard',
    description: 'Dangerous road situation not covered above',
    color: '#667784',
    iconName: 'alert-circle',
    lightBg: '#F1F5F9',
    darkBg: '#1E293B',
  },
];

export const HAZARD_STATUSES = [
  { id: 'all', label: 'All Statuses' },
  { id: 'reported', label: 'Reported' },
  { id: 'under_review', label: 'Under Review' },
  { id: 'community_confirmed', label: 'Confirmed' },
  { id: 'resolved', label: 'Resolved' },
];

export interface HazardItem {
  id: string | number;
  title?: string;
  category: 'flooding' | 'pothole' | 'blocked_road' | 'fallen_tree' | 'other';
  status: 'reported' | 'under_review' | 'community_confirmed' | 'resolved' | 'rejected';
  location_name?: string;
  description: string;
  latitude: number;
  longitude: number;
  photo?: string | null;
  photo_url?: string | null;
  created_at: string;
  confirmations_count?: number;
  flags_count?: number;
  is_demo?: boolean;
}

export function getCategoryConfig(categoryId: string): HazardCategoryConfig {
  return (
    HAZARD_CATEGORIES.find((c) => c.id === categoryId) || {
      id: categoryId,
      label: categoryId.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      description: 'Road hazard',
      color: '#667784',
      iconName: 'alert-circle',
      lightBg: '#F1F5F9',
      darkBg: '#1E293B',
    }
  );
}

export function getStatusColor(status: string, isDark: boolean = false): { bg: string; text: string; border: string } {
  switch (status) {
    case 'community_confirmed':
      return {
        bg: isDark ? '#0C353B' : '#E6F4F6',
        text: isDark ? '#2DD4BF' : '#087F8C',
        border: isDark ? '#115E59' : '#B2E2E8',
      };
    case 'under_review':
      return {
        bg: isDark ? '#3D2F12' : '#FEF7E6',
        text: isDark ? '#FBBF24' : '#B45309',
        border: isDark ? '#78350F' : '#FDE68A',
      };
    case 'resolved':
      return {
        bg: isDark ? '#113524' : '#EAF6F0',
        text: isDark ? '#34D399' : '#27865B',
        border: isDark ? '#065F46' : '#A7F3D0',
      };
    case 'rejected':
      return {
        bg: isDark ? '#3B1515' : '#FDF0F0',
        text: isDark ? '#F87171' : '#D64545',
        border: isDark ? '#7F1D1D' : '#FECACA',
      };
    case 'reported':
    default:
      return {
        bg: isDark ? '#1E293B' : '#F1F5F9',
        text: isDark ? '#94A3B8' : '#475569',
        border: isDark ? '#334155' : '#CBD5E1',
      };
  }
}
