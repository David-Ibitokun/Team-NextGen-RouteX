/**
 * RouteX Loading Screen Component
 * Accessible branded loading state for initial connection and navigation.
 */

import React from 'react';
import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { COLORS } from '../theme/colors';

interface LoadingScreenProps {
  message?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Connecting to RouteX...',
}) => {
  return (
    <View
      style={styles.container}
      accessibilityRole="progressbar"
      accessibilityLabel={message}
    >
      <View style={styles.card}>
        {/* Brand Icon */}
        <View style={styles.logoBadge}>
          <Text style={styles.logoBadgeText}>R</Text>
        </View>

        <Text style={styles.title}>RouteX</Text>
        <Text style={styles.tagline}>Know the Road Ahead.</Text>

        <View style={styles.indicatorContainer}>
          <ActivityIndicator size="large" color={COLORS.teal} />
          <Text style={styles.messageText}>{message}</Text>
        </View>

        <Text style={styles.footerNote}>Community-powered road safety</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.offWhite,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    shadowColor: COLORS.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  logoBadge: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: COLORS.navy,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  logoBadgeText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 32,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.navy,
    marginBottom: 4,
  },
  tagline: {
    fontSize: 13,
    color: COLORS.slate,
    fontWeight: '500',
    marginBottom: 24,
  },
  indicatorContainer: {
    alignItems: 'center',
    marginVertical: 12,
  },
  messageText: {
    marginTop: 14,
    fontSize: 14,
    color: COLORS.navy,
    fontWeight: '500',
  },
  footerNote: {
    marginTop: 20,
    fontSize: 11,
    color: COLORS.slate,
  },
});
