import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { HAZARD_CATEGORIES, HAZARD_STATUSES } from '../constants/hazardTypes';

interface HazardFiltersNativeProps {
  selectedCategory: string;
  onSelectCategory: (catId: string) => void;
  selectedStatus: string;
  onSelectStatus: (statusId: string) => void;
  totalCount: number;
}

export const HazardFiltersNative: React.FC<HazardFiltersNativeProps> = ({
  selectedCategory,
  onSelectCategory,
  selectedStatus,
  onSelectStatus,
  totalCount,
}) => {
  const { isDark, theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
      {/* Category Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <TouchableOpacity
          onPress={() => onSelectCategory('all')}
          style={[
            styles.pill,
            {
              backgroundColor: selectedCategory === 'all' ? theme.teal : theme.surfaceSubtle,
              borderColor: selectedCategory === 'all' ? theme.tealDark : theme.borderSubtle,
            },
          ]}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.pillText,
              { color: selectedCategory === 'all' ? '#FFFFFF' : theme.textPrimary },
            ]}
          >
            All Hazards ({totalCount})
          </Text>
        </TouchableOpacity>

        {HAZARD_CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              onPress={() => onSelectCategory(cat.id)}
              style={[
                styles.pill,
                {
                  backgroundColor: isSelected ? cat.color : isDark ? cat.darkBg : cat.lightBg,
                  borderColor: isSelected ? cat.color : isDark ? '#2E4C66' : '#CBD5E1',
                },
              ]}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.pillText,
                  { color: isSelected ? '#FFFFFF' : isDark ? '#E2E8F0' : '#142B3B' },
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Status Filter Row */}
      <View style={styles.statusRow}>
        <Text style={[styles.statusLabel, { color: theme.textMuted }]}>Status:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statusPills}>
          {HAZARD_STATUSES.map((st) => {
            const isSelected = selectedStatus === st.id;
            return (
              <TouchableOpacity
                key={st.id}
                onPress={() => onSelectStatus(st.id)}
                style={[
                  styles.statusPill,
                  {
                    backgroundColor: isSelected ? (isDark ? '#1C3144' : '#E6F4F6') : 'transparent',
                    borderColor: isSelected ? theme.teal : theme.borderSubtle,
                  },
                ]}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.statusPillText,
                    { color: isSelected ? theme.teal : theme.textMuted, fontWeight: isSelected ? '700' : '400' },
                  ]}
                >
                  {st.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 8,
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginRight: 8,
  },
  statusPills: {
    gap: 6,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusPillText: {
    fontSize: 11,
  },
});
