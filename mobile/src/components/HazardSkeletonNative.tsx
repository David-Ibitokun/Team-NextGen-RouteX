import React, { useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

export const HazardCardSkeletonNative: React.FC = () => {
  const { isDark, theme } = useTheme();
  const [pulseAnim] = React.useState(() => new Animated.Value(0.3));

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.85,
          duration: 850,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 850,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  const highlightColor = isDark ? '#2E4354' : '#E2E8F0';

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.surfaceCard,
          borderColor: theme.border,
        },
      ]}
    >
      {/* Header row skeleton */}
      <View style={styles.headerRow}>
        <Animated.View
          style={[
            styles.skeletonPill,
            { width: 90, height: 22, backgroundColor: highlightColor, opacity: pulseAnim },
          ]}
        />
        <Animated.View
          style={[
            styles.skeletonBadge,
            { width: 65, height: 18, backgroundColor: highlightColor, opacity: pulseAnim },
          ]}
        />
      </View>

      {/* Location row skeleton */}
      <View style={styles.locationRow}>
        <Animated.View
          style={[
            styles.skeletonCircle,
            { width: 14, height: 14, backgroundColor: highlightColor, opacity: pulseAnim },
          ]}
        />
        <Animated.View
          style={[
            styles.skeletonBar,
            { width: '70%', height: 14, backgroundColor: highlightColor, opacity: pulseAnim },
          ]}
        />
      </View>

      {/* Description lines skeleton */}
      <View style={styles.descContainer}>
        <Animated.View
          style={[
            styles.skeletonBar,
            { width: '100%', height: 11, backgroundColor: highlightColor, opacity: pulseAnim, marginBottom: 6 },
          ]}
        />
        <Animated.View
          style={[
            styles.skeletonBar,
            { width: '85%', height: 11, backgroundColor: highlightColor, opacity: pulseAnim },
          ]}
        />
      </View>

      {/* Footer row skeleton */}
      <View style={[styles.footerRow, { borderTopColor: theme.borderSubtle }]}>
        <Animated.View
          style={[
            styles.skeletonBar,
            { width: 80, height: 12, backgroundColor: highlightColor, opacity: pulseAnim },
          ]}
        />
        <Animated.View
          style={[
            styles.skeletonPill,
            { width: 45, height: 22, backgroundColor: highlightColor, opacity: pulseAnim },
          ]}
        />
      </View>
    </View>
  );
};

export const HazardListSkeletonNative: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, idx) => (
        <HazardCardSkeletonNative key={`native-skel-${idx}`} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 6,
  },
  descContainer: {
    marginBottom: 12,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
  },
  skeletonBar: {
    borderRadius: 4,
  },
  skeletonPill: {
    borderRadius: 11,
  },
  skeletonBadge: {
    borderRadius: 6,
  },
  skeletonCircle: {
    borderRadius: 7,
  },
});
