/**
 * RouteX Mobile Header Component
 * Provides a native branded top bar with reload and navigation controls.
 */

import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { COLORS } from '../theme/colors';

interface RouteXHeaderProps {
  canGoBack: boolean;
  onGoBack: () => void;
  onReload: () => void;
  isLoading: boolean;
}

export const RouteXHeader: React.FC<RouteXHeaderProps> = ({
  canGoBack,
  onGoBack,
  onReload,
  isLoading,
}) => {
  return (
    <View style={styles.header}>
      <View style={styles.brandContainer}>
        {/* RouteX Brand Pin/Curve Icon */}
        <View style={styles.logoBadge}>
          <Text style={styles.logoBadgeText}>R</Text>
        </View>
        <View style={styles.textGroup}>
          <Text style={styles.brandTitle}>RouteX</Text>
          <Text style={styles.brandTagline}>Know the Road Ahead.</Text>
        </View>
      </View>

      <View style={styles.actionsContainer}>
        {canGoBack && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={onGoBack}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Text style={styles.actionButtonText}>‹ Back</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.actionButton, styles.reloadButton]}
          onPress={onReload}
          accessibilityLabel={isLoading ? 'Loading page' : 'Refresh page'}
          accessibilityRole="button"
        >
          <Text style={styles.actionButtonText}>{isLoading ? '...' : '↻'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    height: 54,
    backgroundColor: COLORS.navy,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBadge: {
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: COLORS.teal,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  logoBadgeText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  textGroup: {
    justifyContent: 'center',
  },
  brandTitle: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.3,
  },
  brandTagline: {
    color: COLORS.slateLight,
    fontSize: 10,
    fontWeight: '500',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  reloadButton: {
    width: 32,
    alignItems: 'center',
  },
  actionButtonText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '600',
  },
});
