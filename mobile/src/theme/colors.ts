/**
 * RouteX Design Tokens & Dynamic Theme Engine
 * Source of truth: docs/BRAND.md & docs/STYLE.md
 */

export const COLORS = {
  navy: '#142B3B',
  navyDark: '#0D1E2A',
  teal: '#087F8C',
  tealLight: '#E6F4F6',
  offWhite: '#F7F9FA',
  white: '#FFFFFF',
  amber: '#F2B544',
  amberLight: '#FEF7E6',
  red: '#D64545',
  redLight: '#FDF0F0',
  green: '#27865B',
  greenLight: '#EAF6F0',
  slate: '#667784',
  slateLight: '#94A3B8',
  border: '#DCE4E8',
};

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceCard: string;
  surfaceSubtle: string;
  border: string;
  borderSubtle: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  headerBg: string;
  headerText: string;
  teal: string;
  tealDark: string;
  tealLight: string;
  navy: string;
  navyDark: string;
  amber: string;
  amberLight: string;
  red: string;
  redLight: string;
  green: string;
  greenLight: string;
  slate: string;
  white: string;
  cardShadow: string;
  tabBarBg: string;
  tabBarBorder: string;
}

export const lightTheme: ThemeColors = {
  background: '#F7F9FA',
  surface: '#FFFFFF',
  surfaceCard: '#FFFFFF',
  surfaceSubtle: '#F0F4F7',
  border: '#DCE4E8',
  borderSubtle: '#E2E8F0',
  textPrimary: '#142B3B',
  textSecondary: '#4A5D6E',
  textMuted: '#667784',
  headerBg: '#142B3B',
  headerText: '#FFFFFF',
  teal: '#087F8C',
  tealDark: '#06626C',
  tealLight: '#E6F4F6',
  navy: '#142B3B',
  navyDark: '#0D1E2A',
  amber: '#F2B544',
  amberLight: '#FEF7E6',
  red: '#D64545',
  redLight: '#FDF0F0',
  green: '#27865B',
  greenLight: '#EAF6F0',
  slate: '#667784',
  white: '#FFFFFF',
  cardShadow: 'rgba(20, 43, 59, 0.08)',
  tabBarBg: '#FFFFFF',
  tabBarBorder: '#DCE4E8',
};

export const darkTheme: ThemeColors = {
  background: '#0B161E',
  surface: '#142533',
  surfaceCard: '#12202C',
  surfaceSubtle: '#1C3144',
  border: '#2A4356',
  borderSubtle: '#1F3445',
  textPrimary: '#F1F5F9',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  headerBg: '#081118',
  headerText: '#FFFFFF',
  teal: '#2DD4BF',
  tealDark: '#087F8C',
  tealLight: '#13353A',
  navy: '#142B3B',
  navyDark: '#070D12',
  amber: '#FBBF24',
  amberLight: '#3D3114',
  red: '#F87171',
  redLight: '#3B1818',
  green: '#34D399',
  greenLight: '#133827',
  slate: '#94A3B8',
  white: '#FFFFFF',
  cardShadow: 'rgba(0, 0, 0, 0.4)',
  tabBarBg: '#0E1C27',
  tabBarBorder: '#1E3342',
};

export const BRAND = {
  name: 'RouteX',
  tagline: 'Know the Road Ahead.',
  team: 'NextGen',
};
