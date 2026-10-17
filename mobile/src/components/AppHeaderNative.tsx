import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Sun, Moon, RotateCw, LayoutDashboard } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { BRAND } from '../theme/colors';
import { RouteXLogoMark } from './RouteXLogoMark';

interface AppHeaderNativeProps {
  onRefresh?: () => void;
  refreshing?: boolean;
  onOpenDashboard?: () => void;
  isDashboardActive?: boolean;
}

export const AppHeaderNative: React.FC<AppHeaderNativeProps> = ({
  onRefresh,
  refreshing,
  onOpenDashboard,
  isDashboardActive = false,
}) => {
  const { isDark, toggleTheme, theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.headerBg, borderBottomColor: theme.border }]}>
      <View style={styles.brandRow}>
        <RouteXLogoMark size={34} />
        <View style={styles.titleCol}>
          <Text style={[styles.brandTitle, { color: theme.headerText }]}>{BRAND.name}</Text>
          <Text style={[styles.tagline, { color: isDark ? '#94A3B8' : '#B2C5D4' }]}>{BRAND.tagline}</Text>
        </View>
      </View>

      <View style={styles.actionsRow}>
        {/* Dashboard Header Button */}
        {onOpenDashboard && (
          <TouchableOpacity
            onPress={onOpenDashboard}
            activeOpacity={0.7}
            style={[
              styles.dashboardBtn,
              {
                backgroundColor: isDashboardActive ? theme.teal : (isDark ? '#1C3144' : '#1D3B50'),
                borderColor: isDashboardActive ? theme.tealDark : (isDark ? '#2E4C66' : '#2A4E68'),
              },
            ]}
            accessibilityLabel="Open Dashboards"
            accessibilityRole="button"
          >
            <LayoutDashboard size={16} color={isDashboardActive ? '#FFFFFF' : theme.teal} />
            <Text style={[styles.dashboardText, { color: isDashboardActive ? '#FFFFFF' : '#E2E8F0' }]}>
              Dashboard
            </Text>
          </TouchableOpacity>
        )}

        {/* Theme Toggle Button with Lucide Icons */}
        <TouchableOpacity
          onPress={toggleTheme}
          activeOpacity={0.7}
          style={[
            styles.iconBtn,
            { backgroundColor: isDark ? '#1C3144' : '#1D3B50', borderColor: isDark ? '#2E4C66' : '#2A4E68' },
          ]}
          accessibilityLabel={`Switch to ${isDark ? 'light' : 'dark'} mode`}
          accessibilityRole="button"
        >
          {isDark ? (
            <Sun size={18} color="#FBBF24" />
          ) : (
            <Moon size={18} color="#E2E8F0" />
          )}
        </TouchableOpacity>

        {/* Refresh Button with Lucide RotateCw */}
        {onRefresh && (
          <TouchableOpacity
            onPress={onRefresh}
            activeOpacity={0.7}
            disabled={refreshing}
            style={[
              styles.iconBtn,
              { backgroundColor: isDark ? '#1C3144' : '#1D3B50', borderColor: isDark ? '#2E4C66' : '#2A4E68' },
            ]}
            accessibilityLabel="Refresh reports"
            accessibilityRole="button"
          >
            <RotateCw size={17} color={refreshing ? '#64748B' : '#E2E8F0'} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  titleCol: {
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  tagline: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: -1,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dashboardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: 1,
  },
  dashboardText: {
    fontSize: 12,
    fontWeight: '700',
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});
