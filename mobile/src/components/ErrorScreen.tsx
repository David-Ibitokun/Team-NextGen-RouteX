/**
 * RouteX Recoverable Error Screen Component
 * Renders user-friendly failure feedback with diagnostic guidance and retry action.
 */

import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { COLORS } from '../theme/colors';

interface ErrorScreenProps {
  title?: string;
  description?: string;
  targetUrl?: string;
  onRetry: () => void;
}

export const ErrorScreen: React.FC<ErrorScreenProps> = ({
  title = 'Unable to Load RouteX',
  description = 'Could not establish a connection to the RouteX platform.',
  targetUrl,
  onRetry,
}) => {
  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <Text style={styles.iconText}>!</Text>
        </View>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>

        {targetUrl ? (
          <View style={styles.urlBox}>
            <Text style={styles.urlLabel}>Target Address:</Text>
            <Text style={styles.urlValue} numberOfLines={2}>
              {targetUrl}
            </Text>
          </View>
        ) : null}

        <View style={styles.tipsBox}>
          <Text style={styles.tipsHeading}>Troubleshooting tips:</Text>
          <Text style={styles.tipItem}>
            • <Text style={styles.bold}>Internet connection:</Text> Ensure Wi-Fi or mobile data is active.
          </Text>
          <Text style={styles.tipItem}>
            • <Text style={styles.bold}>Android Emulator:</Text> Use <Text style={styles.code}>http://10.0.2.2:5173</Text> instead of localhost to reach your computer.
          </Text>
          <Text style={styles.tipItem}>
            • <Text style={styles.bold}>Physical Device:</Text> Use your computer&apos;s LAN IP (e.g. <Text style={styles.code}>http://192.168.1.X:5173</Text>) on the same Wi-Fi.
          </Text>
          <Text style={styles.tipItem}>
            • <Text style={styles.bold}>Web Server:</Text> Verify the Vite development server is running (<Text style={styles.code}>run_frontend.bat</Text>).
          </Text>
        </View>

        <TouchableOpacity
          style={styles.retryButton}
          onPress={onRetry}
          accessibilityRole="button"
          accessibilityLabel="Retry connecting to RouteX"
        >
          <Text style={styles.retryButtonText}>Retry Connection</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    backgroundColor: COLORS.offWhite,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.redLight,
    borderWidth: 2,
    borderColor: COLORS.red,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  iconText: {
    color: COLORS.red,
    fontSize: 26,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.navy,
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: COLORS.slate,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  urlBox: {
    width: '100%',
    backgroundColor: COLORS.offWhite,
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  urlLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.slate,
    marginBottom: 2,
  },
  urlValue: {
    fontSize: 12,
    color: COLORS.navy,
    fontFamily: 'monospace',
  },
  tipsBox: {
    width: '100%',
    backgroundColor: COLORS.amberLight,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(242, 181, 68, 0.4)',
    marginBottom: 20,
  },
  tipsHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.navy,
    marginBottom: 6,
  },
  tipItem: {
    fontSize: 12,
    color: COLORS.navy,
    lineHeight: 18,
    marginBottom: 4,
  },
  bold: {
    fontWeight: '600',
  },
  code: {
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  retryButton: {
    width: '100%',
    height: 46,
    backgroundColor: COLORS.teal,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },
});
