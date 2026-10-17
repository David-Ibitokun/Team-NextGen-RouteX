import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Map, List, Plus } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';

export type ActiveTab = 'list' | 'map' | 'report' | 'dashboard';

interface MobileBottomNavNativeProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
}

export const MobileBottomNavNative: React.FC<MobileBottomNavNativeProps> = ({ activeTab, onTabChange }) => {
  const { isDark, theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.tabBarBg, borderTopColor: theme.tabBarBorder }]}>
      {/* Map Tab */}
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => onTabChange('map')}
        activeOpacity={0.7}
        accessibilityRole="tab"
        accessibilityLabel="Map view"
      >
        <Map
          size={22}
          color={activeTab === 'map' ? theme.teal : theme.textMuted}
          strokeWidth={activeTab === 'map' ? 2.5 : 2}
        />
        <Text
          style={[
            styles.tabLabel,
            {
              color: activeTab === 'map' ? theme.teal : theme.textMuted,
              fontWeight: activeTab === 'map' ? '700' : '500',
            },
          ]}
        >
          Map
        </Text>
      </TouchableOpacity>

      {/* Floating Center Report Button */}
      <TouchableOpacity
        style={[
          styles.reportFab,
          {
            backgroundColor: theme.teal,
            borderColor: isDark ? '#142533' : '#FFFFFF',
          },
        ]}
        onPress={() => onTabChange('report')}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Report a hazard"
      >
        <Plus size={28} color="#FFFFFF" strokeWidth={3} />
        <Text style={styles.fabText}>Report</Text>
      </TouchableOpacity>

      {/* List Tab */}
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => onTabChange('list')}
        activeOpacity={0.7}
        accessibilityRole="tab"
        accessibilityLabel="Hazards list view"
      >
        <List
          size={22}
          color={activeTab === 'list' ? theme.teal : theme.textMuted}
          strokeWidth={activeTab === 'list' ? 2.5 : 2}
        />
        <Text
          style={[
            styles.tabLabel,
            {
              color: activeTab === 'list' ? theme.teal : theme.textMuted,
              fontWeight: activeTab === 'list' ? '700' : '500',
            },
          ]}
        >
          Hazards
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: 64,
    borderTopWidth: 1,
    paddingHorizontal: 24,
    paddingBottom: 4,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    gap: 3,
  },
  tabLabel: {
    fontSize: 11,
  },
  reportFab: {
    width: 66,
    height: 66,
    borderRadius: 33,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -26,
    borderWidth: 4,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 0,
  },
});
