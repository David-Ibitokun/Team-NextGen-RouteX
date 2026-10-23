import React from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  CircleHelp,
  MapPin,
  ShieldCheck,
  TriangleAlert,
  Users,
  EyeOff,
  Lock,
  Camera,
  Cpu,
  Trash2,
  Mail,
} from 'lucide-react-native';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { BRAND } from '../theme/colors';

export type InfoScreenType = 'about' | 'how-to-use' | 'privacy';

interface InfoScreenNativeProps {
  type: InfoScreenType;
  onBack: () => void;
}

const aboutHighlights = [
  ['community', 'Community knowledge', 'Share timely, local observations with the people who use the same roads.'],
  ['trust', 'Clear context', 'See timestamps, freshness, and confirmations so you can judge a report for yourself.'],
  ['roads', 'Practical awareness', 'Turn scattered observations into a useful view of the roads ahead.'],
] as const;

const steps = [
  ['Explore', 'Browse the map and filter reports by category or status.'],
  ['Check details', 'Review the location, description, photo, timestamp, and confirmation activity.'],
  ['Share safely', 'Sign in, place a pin, choose a category, and describe what you see.'],
  ['Keep it current', 'Confirm a listed hazard when you can safely verify that it is still present.'],
] as const;

const privacyHighlights = [
  ['tracking', 'Zero background tracking', 'GPS coordinates are only requested on-demand when you tap "Near Me" or drop a pin. We never track your movement in the background.'],
  ['selling', 'No data selling or brokers', 'We never sell, monetize, or trade your personal information, account details, or commute history to data brokers or advertisers.'],
  ['camera', 'Camera metadata scrubbed', 'When photos are uploaded, all camera model and device GPS EXIF tags are automatically scrubbed during client-side compression.'],
  ['ai', 'AI text safety (Zero PII)', 'Google Gemini AI evaluates only report descriptions for category and clarity. No usernames, emails, or personal identifiers are ever sent.'],
  ['erasure', 'Self-service account deletion', 'You can permanently delete your account anytime in Dashboard Settings. Submitted hazard pins remain anonymized to keep roads safe.'],
] as const;

export const InfoScreenNative: React.FC<InfoScreenNativeProps> = ({ type, onBack }) => {
  const { theme } = useTheme();
  const isAbout = type === 'about';
  const isPrivacy = type === 'privacy';

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <View style={[styles.topBar, { backgroundColor: theme.headerBg, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton} accessibilityRole="button" accessibilityLabel="Back">
          <ArrowLeft size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>
          {isAbout ? 'About Us' : isPrivacy ? 'Data & Privacy' : 'How to Use'}
        </Text>
        <View style={styles.topBarSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.eyebrow, { color: theme.teal }]}>
          {isAbout ? 'ABOUT ROUTEX' : isPrivacy ? 'DATA & PRIVACY POLICY' : 'HOW TO USE ROUTEX'}
        </Text>
        <Text style={[styles.title, { color: theme.textPrimary }]}>
          {isAbout
            ? 'A clearer view of the roads we share.'
            : isPrivacy
            ? 'Your privacy matters on every route.'
            : 'From road observation to useful update.'}
        </Text>
        <Text style={[styles.intro, { color: theme.textSecondary }]}>
          {isAbout
            ? 'RouteX is a community-powered road awareness platform for people who want better information before and during a journey.'
            : isPrivacy
            ? 'We believe road safety tools should protect personal privacy, not track commuters. Learn how we handle your data with transparent safeguards.'
            : 'Check the map, understand how fresh a report is, and contribute a careful update when it is safe to do so.'}
        </Text>

        {isAbout ? (
          <>
            <View style={styles.cardList}>
              {aboutHighlights.map(([icon, heading, text]) => {
                const Icon = icon === 'community' ? Users : icon === 'trust' ? ShieldCheck : MapPin;
                return (
                  <View key={heading} style={[styles.card, { backgroundColor: theme.surfaceCard, borderColor: theme.border }]}>
                    <Icon size={21} color={theme.teal} />
                    <View style={styles.cardCopy}>
                      <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>{heading}</Text>
                      <Text style={[styles.cardText, { color: theme.textSecondary }]}>{text}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
            <View style={[styles.notice, { backgroundColor: theme.amberLight, borderColor: theme.amber + '80' }]}>
              <TriangleAlert size={20} color={theme.amber} />
              <Text style={[styles.noticeText, { color: theme.textPrimary }]}>
                RouteX reports are community-submitted, not official inspections. Check timestamps and current conditions before acting.
              </Text>
            </View>
          </>
        ) : isPrivacy ? (
          <>
            <View style={styles.cardList}>
              {privacyHighlights.map(([icon, heading, text]) => {
                const Icon =
                  icon === 'tracking'
                    ? EyeOff
                    : icon === 'selling'
                    ? Lock
                    : icon === 'camera'
                    ? Camera
                    : icon === 'ai'
                    ? Cpu
                    : Trash2;
                return (
                  <View key={heading} style={[styles.card, { backgroundColor: theme.surfaceCard, borderColor: theme.border }]}>
                    <Icon size={21} color={theme.teal} />
                    <View style={styles.cardCopy}>
                      <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>{heading}</Text>
                      <Text style={[styles.cardText, { color: theme.textSecondary }]}>{text}</Text>
                    </View>
                  </View>
                );
              })}
            </View>

            <View style={[styles.notice, { backgroundColor: theme.tealLight, borderColor: theme.teal + '60' }]}>
              <ShieldCheck size={20} color={theme.teal} />
              <Text style={[styles.noticeText, { color: theme.textPrimary }]}>
                Have data concerns or privacy inquiries? Contact our team anytime at privacy@routex.org.
              </Text>
            </View>
          </>
        ) : (
          <View style={styles.cardList}>
            {steps.map(([heading, text], index) => (
              <View key={heading} style={[styles.card, { backgroundColor: theme.surfaceCard, borderColor: theme.border }]}>
                <View style={[styles.stepNumber, { backgroundColor: theme.teal }]}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>
                <View style={styles.cardCopy}>
                  <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>{heading}</Text>
                  <Text style={[styles.cardText, { color: theme.textSecondary }]}>{text}</Text>
                </View>
              </View>
            ))}
            <View style={[styles.notice, { backgroundColor: theme.tealLight, borderColor: theme.teal + '60' }]}>
              <CircleHelp size={20} color={theme.teal} />
              <Text style={[styles.noticeText, { color: theme.textPrimary }]}>
                Never browse or report while driving. Pull over safely first.
              </Text>
            </View>
          </View>
        )}

        <View style={styles.footerMark}>
          <CheckCircle2 size={17} color={theme.teal} />
          <Text style={[styles.footerText, { color: theme.textMuted }]}>{BRAND.tagline}</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: { minHeight: 56, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1 },
  backButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: '#1E293B' },
  topBarTitle: { flex: 1, textAlign: 'center', color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  topBarSpacer: { width: 36 },
  content: { padding: 20, paddingBottom: 36 },
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1.4 },
  title: { fontSize: 28, lineHeight: 34, fontWeight: '900', marginTop: 8 },
  intro: { fontSize: 15, lineHeight: 23, marginTop: 12, marginBottom: 24 },
  cardList: { gap: 12 },
  card: { flexDirection: 'row', gap: 13, padding: 16, borderRadius: 12, borderWidth: 1 },
  cardCopy: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '800', marginBottom: 5 },
  cardText: { fontSize: 13, lineHeight: 20 },
  stepNumber: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  stepNumberText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  notice: { flexDirection: 'row', gap: 11, padding: 15, borderRadius: 12, borderWidth: 1, marginTop: 4 },
  noticeText: { flex: 1, fontSize: 13, lineHeight: 20 },
  footerMark: { flexDirection: 'row', alignItems: 'center', gap: 7, justifyContent: 'center', marginTop: 28 },
  footerText: { fontSize: 12, fontWeight: '600' },
});
