/**
 * RouteX Configuration Missing / Invalid Screen
 * Clear diagnostics shown when EXPO_PUBLIC_WEB_URL is not set or malformed.
 */

import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { COLORS } from '../theme/colors';

interface ConfigMissingScreenProps {
  errorMessage?: string;
  helperText?: string;
  onRetry: () => void;
}

export const ConfigMissingScreen: React.FC<ConfigMissingScreenProps> = ({
  errorMessage = 'Missing Web Application URL',
  helperText = 'The mobile container needs to know where the RouteX web app is hosted.',
  onRetry,
}) => {
  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.card}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>⚙️</Text>
        </View>

        <Text style={styles.title}>Configuration Required</Text>
        <Text style={styles.subtitle}>{errorMessage}</Text>
        <Text style={styles.helperText}>{helperText}</Text>

        <View style={styles.codeBox}>
          <Text style={styles.codeBoxTitle}>Setup Instructions:</Text>
          <Text style={styles.codeText}>
            1. Copy <Text style={styles.codeInline}>mobile/.env.example</Text> to <Text style={styles.codeInline}>mobile/.env</Text>
          </Text>
          <Text style={styles.codeText}>
            2. Set <Text style={styles.codeInline}>EXPO_PUBLIC_WEB_URL</Text>:
          </Text>
          <View style={styles.snippetBlock}>
            <Text style={styles.comment}># Android Emulator (default):</Text>
            <Text style={styles.snippet}>EXPO_PUBLIC_WEB_URL=http://10.0.2.2:5173</Text>
            <Text style={styles.comment}># Physical Phone on LAN:</Text>
            <Text style={styles.snippet}>EXPO_PUBLIC_WEB_URL=http://192.168.1.X:5173</Text>
            <Text style={styles.comment}># Production / Staging deployment:</Text>
            <Text style={styles.snippet}>EXPO_PUBLIC_WEB_URL=https://routex.app</Text>
          </View>
          <Text style={styles.codeText}>3. Restart Expo CLI (<Text style={styles.codeInline}>npx expo start</Text>)</Text>
        </View>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={onRetry}
          accessibilityRole="button"
          accessibilityLabel="Check configuration again"
        >
          <Text style={styles.actionButtonText}>Check Configuration Again</Text>
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
    maxWidth: 400,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  badge: {
    alignSelf: 'center',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.tealLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  badgeText: {
    fontSize: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.navy,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.red,
    textAlign: 'center',
    marginBottom: 8,
  },
  helperText: {
    fontSize: 13,
    color: COLORS.slate,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  codeBox: {
    backgroundColor: COLORS.offWhite,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
  },
  codeBoxTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.navy,
    marginBottom: 8,
  },
  codeText: {
    fontSize: 12,
    color: COLORS.navy,
    lineHeight: 18,
    marginBottom: 6,
  },
  codeInline: {
    fontFamily: 'monospace',
    fontWeight: '700',
    color: COLORS.teal,
  },
  snippetBlock: {
    backgroundColor: COLORS.navy,
    borderRadius: 6,
    padding: 10,
    marginVertical: 6,
  },
  comment: {
    fontSize: 10,
    color: COLORS.slateLight,
    fontFamily: 'monospace',
  },
  snippet: {
    fontSize: 11,
    color: '#80E5FF',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  actionButton: {
    width: '100%',
    height: 46,
    backgroundColor: COLORS.teal,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },
});
