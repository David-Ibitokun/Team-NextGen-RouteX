import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Sparkles, Check, X, AlertCircle } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';

export interface AISuggestionCardNativeProps {
  title?: string;
  subtitle?: string;
  content?: string | React.ReactNode;
  reason?: string;
  onApply?: () => void;
  onDismiss?: () => void;
  applyLabel?: string;
  dismissLabel?: string;
  isApplying?: boolean;
  badgeText?: string;
  disclaimer?: string;
}

export const AISuggestionCardNative: React.FC<AISuggestionCardNativeProps> = ({
  title = 'AI Suggestion',
  subtitle = 'Generated to assist your report',
  content,
  reason,
  onApply,
  onDismiss,
  applyLabel = 'Apply Suggestion',
  dismissLabel = 'Dismiss',
  isApplying = false,
  badgeText = 'Gemini AI',
  disclaimer = 'AI suggestions are advisory only. Confirm that details match your observations.',
}) => {
  const { isDark, theme } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? 'rgba(8, 127, 140, 0.08)' : '#F0FDFA',
          borderColor: isDark ? 'rgba(8, 127, 140, 0.35)' : '#99F6E4',
        },
      ]}
    >
      {/* Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View
            style={[
              styles.iconWrapper,
              {
                backgroundColor: isDark
                  ? 'rgba(45, 212, 191, 0.2)'
                  : 'rgba(8, 127, 140, 0.12)',
              },
            ]}
          >
            <Sparkles size={14} color={isDark ? '#2DD4BF' : '#087F8C'} />
          </View>
          <View style={styles.titleCol}>
            <View style={styles.titleBadgeRow}>
              <Text style={[styles.title, { color: theme.textPrimary }]}>
                {title}
              </Text>
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: isDark
                      ? 'rgba(19, 78, 74, 0.8)'
                      : '#CCFBF1',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    { color: isDark ? '#5EEAD4' : '#115E59' },
                  ]}
                >
                  {badgeText}
                </Text>
              </View>
            </View>
            {subtitle ? (
              <Text style={[styles.subtitle, { color: theme.textMuted }]}>
                {subtitle}
              </Text>
            ) : null}
          </View>
        </View>

        {onDismiss ? (
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onDismiss}
            activeOpacity={0.7}
            accessibilityLabel="Dismiss suggestion"
          >
            <X size={15} color={theme.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Content Block */}
      {content ? (
        <View
          style={[
            styles.contentBox,
            {
              backgroundColor: isDark ? '#142533' : '#FFFFFF',
              borderColor: theme.border,
            },
          ]}
        >
          {typeof content === 'string' ? (
            <Text style={[styles.contentText, { color: theme.textPrimary }]}>
              {content}
            </Text>
          ) : (
            content
          )}
        </View>
      ) : null}

      {/* Reason / Context */}
      {reason ? (
        <View style={styles.reasonRow}>
          <AlertCircle
            size={13}
            color={isDark ? '#2DD4BF' : '#087F8C'}
            style={styles.reasonIcon}
          />
          <Text style={[styles.reasonText, { color: theme.textSecondary }]}>
            {reason}
          </Text>
        </View>
      ) : null}

      {/* Footer Row */}
      <View
        style={[
          styles.footerRow,
          {
            borderTopColor: isDark
              ? 'rgba(255, 255, 255, 0.08)'
              : 'rgba(8, 127, 140, 0.15)',
          },
        ]}
      >
        <Text style={[styles.disclaimerText, { color: theme.textMuted }]}>
          {disclaimer}
        </Text>

        <View style={styles.actionButtonsRow}>
          {onDismiss ? (
            <TouchableOpacity
              style={styles.dismissBtn}
              onPress={onDismiss}
              activeOpacity={0.7}
            >
              <Text
                style={[styles.dismissBtnText, { color: theme.textSecondary }]}
              >
                {dismissLabel}
              </Text>
            </TouchableOpacity>
          ) : null}

          {onApply ? (
            <TouchableOpacity
              style={[
                styles.applyBtn,
                { backgroundColor: isDark ? '#0D9488' : '#087F8C' },
              ]}
              onPress={onApply}
              disabled={isApplying}
              activeOpacity={0.8}
            >
              {isApplying ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Check size={12} color="#FFFFFF" />
                  <Text style={styles.applyBtnText}>{applyLabel}</Text>
                </>
              )}
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 9,
    marginVertical: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  iconWrapper: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleCol: {
    flex: 1,
  },
  titleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  title: {
    fontSize: 12,
    fontWeight: '700',
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 10,
    marginTop: 1,
  },
  closeBtn: {
    padding: 4,
  },
  contentBox: {
    padding: 9,
    borderRadius: 8,
    borderWidth: 1,
  },
  contentText: {
    fontSize: 11.5,
    lineHeight: 16.5,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 5,
  },
  reasonIcon: {
    marginTop: 1.5,
  },
  reasonText: {
    fontSize: 10.5,
    lineHeight: 14.5,
    flex: 1,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 7,
    borderTopWidth: 1,
    gap: 6,
  },
  disclaimerText: {
    fontSize: 9.5,
    fontStyle: 'italic',
    flex: 1,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dismissBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  dismissBtnText: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  applyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 7,
  },
  applyBtnText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '700',
  },
});
