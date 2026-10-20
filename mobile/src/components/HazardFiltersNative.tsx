import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Navigation, X } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { HAZARD_CATEGORIES, HAZARD_STATUSES } from '../constants/hazardTypes';

export const RADIUS_OPTIONS = [2, 5, 10, 25, 50];

interface HazardFiltersNativeProps {
  selectedCategory: string;
  onSelectCategory: (catId: string) => void;
  selectedStatus: string;
  onSelectStatus: (statusId: string) => void;
  totalCount: number;
  nearMeActive?: boolean;
  onToggleNearMe?: () => void;
  locating?: boolean;
  radiusKm?: number;
  onSelectRadius?: (radius: number) => void;
}

export const HazardFiltersNative: React.FC<HazardFiltersNativeProps> = ({
  selectedCategory,
  onSelectCategory,
  selectedStatus,
  onSelectStatus,
  totalCount,
  nearMeActive = false,
  onToggleNearMe,
  locating = false,
  radiusKm = 10,
  onSelectRadius,
}) => {
  const { isDark, theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
      {/* Category Pills and Near Me toggle */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {onToggleNearMe && (
          <TouchableOpacity
            onPress={onToggleNearMe}
            disabled={locating}
            style={[
              styles.pill,
              {
                backgroundColor: nearMeActive ? theme.teal : isDark ? '#0C2E42' : '#E0F2FE',
                borderColor: nearMeActive ? theme.tealDark : theme.teal,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
              },
            ]}
            activeOpacity={0.7}
          >
            {locating ? (
              <ActivityIndicator size="small" color={nearMeActive ? '#FFFFFF' : theme.teal} />
            ) : (
              <Navigation size={12} color={nearMeActive ? '#FFFFFF' : theme.teal} />
            )}
            <Text
              style={[
                styles.pillText,
                { color: nearMeActive ? '#FFFFFF' : theme.teal, fontWeight: '700' },
              ]}
            >
              {nearMeActive ? `Near Me (${radiusKm} km)` : 'Near Me'}
            </Text>
            {nearMeActive && <X size={12} color="#FFFFFF" />}
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={() => onSelectCategory('all')}
          style={[
            styles.pill,
            {
              backgroundColor: selectedCategory === 'all' && !nearMeActive ? theme.teal : theme.surfaceSubtle,
              borderColor: selectedCategory === 'all' && !nearMeActive ? theme.tealDark : theme.borderSubtle,
            },
          ]}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.pillText,
              { color: selectedCategory === 'all' && !nearMeActive ? '#FFFFFF' : theme.textPrimary },
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

      {/* Radius Selector Row (Visible when Near Me is active) */}
      {nearMeActive && onSelectRadius && (
        <View style={styles.radiusRow}>
          <Text style={[styles.radiusLabel, { color: theme.textMuted }]}>Radius:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.radiusPills}>
            {RADIUS_OPTIONS.map((r) => {
              const isSelected = radiusKm === r;
              return (
                <TouchableOpacity
                  key={r}
                  onPress={() => onSelectRadius(r)}
                  style={[
                    styles.radiusPill,
                    {
                      backgroundColor: isSelected ? theme.teal : isDark ? '#1C3144' : '#E6F4F6',
                      borderColor: isSelected ? theme.tealDark : theme.teal + '55',
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.radiusPillText,
                      { color: isSelected ? '#FFFFFF' : theme.teal, fontWeight: isSelected ? '700' : '500' },
                    ]}
                  >
                    {r} km
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

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
  radiusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 8,
  },
  radiusLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginRight: 8,
  },
  radiusPills: {
    gap: 6,
  },
  radiusPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  radiusPillText: {
    fontSize: 11,
  },
});
