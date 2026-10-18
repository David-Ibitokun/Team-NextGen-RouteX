import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
  Image,
} from 'react-native';
import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Filter,
  Check,
  X,
  ExternalLink,
  Sliders,
  Droplets,
  CircleDot,
  TreePine,
  HelpCircle,
} from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { HazardItem } from '../constants/hazardTypes';
import { moderationService } from '../services/apiClient';

interface ModeratorDashboardNativeProps {
  hazards: HazardItem[];
  onOpenReport: () => void;
  onOpenMap: () => void;
  onOpenAuth?: () => void;
}

export const ModeratorDashboardNative: React.FC<ModeratorDashboardNativeProps> = ({
  hazards,
  onOpenReport,
  onOpenMap,
  onOpenAuth,
}) => {
  const { isDark, theme } = useTheme();
  const { user, isModerator, isAdmin } = useAuth();
  const { width: windowWidth } = useWindowDimensions();

  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [stats, setStats] = useState<any>(null);

  // Action Modal State
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [actionType, setActionType] = useState<'confirm' | 'resolve' | 'review'>('confirm');
  const [actionReason, setActionReason] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const loadQueueData = useCallback(async () => {
    setLoading(true);
    try {
      const [queueData, statsData] = await Promise.all([
        moderationService.getReports(flaggedOnly ? { flagged_only: true } : {}),
        moderationService.getStats().catch(() => null),
      ]);
      const items = Array.isArray(queueData) ? queueData : queueData?.results || [];
      setReports(items);
      if (statsData) setStats(statsData);
    } catch {
      // Fallback filter over hazards
      const fallback = hazards.filter((h) => {
        if (flaggedOnly) return (h.flags_count || 0) > 0;
        return h.status === 'under_review' || h.status === 'reported';
      });
      setReports(fallback);
    } finally {
      setLoading(false);
    }
  }, [flaggedOnly, hazards]);

  useEffect(() => {
    loadQueueData();
  }, [loadQueueData]);

  const handleOpenActionModal = (report: any, action: 'confirm' | 'resolve' | 'review') => {
    setSelectedReport(report);
    setActionType(action);
    setActionReason('');
    setActionError('');
    setActionSuccess('');
    setActionModalOpen(true);
  };

  const handleSubmitAction = async () => {
    if (!actionReason.trim() || actionReason.trim().length < 3) {
      setActionError('Please provide a note for this moderation action (min 3 chars).');
      return;
    }
    setSubmittingAction(true);
    setActionError('');
    try {
      await moderationService.takeAction(selectedReport.id, {
        action: actionType,
        reason: actionReason.trim(),
      });
      setActionSuccess('Action recorded in safety log.');
      setTimeout(() => {
        setActionModalOpen(false);
        loadQueueData();
      }, 1000);
    } catch (err: any) {
      setActionError(err?.message || 'Failed to submit action. Verify permissions.');
    } finally {
      setSubmittingAction(false);
    }
  };

  const isWide = windowWidth > 500;

  const pendingCount = stats?.pending_count ?? hazards.filter((h) => h.status === 'under_review' || h.status === 'reported').length;
  const confirmedCount = stats?.confirmed_count ?? hazards.filter((h) => h.status === 'community_confirmed').length;
  const flaggedCount = stats?.flagged_count ?? hazards.filter((h) => (h.flags_count || 0) > 0).length;
  const resolvedCount = stats?.resolved_count ?? hazards.filter((h) => h.status === 'resolved').length;

  const renderCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'flooding':
        return <Droplets size={14} color="#087F8C" />;
      case 'pothole':
        return <CircleDot size={14} color="#F2B544" />;
      case 'blocked_road':
        return <AlertTriangle size={14} color="#D64545" />;
      case 'fallen_tree':
        return <TreePine size={14} color="#27865B" />;
      default:
        return <HelpCircle size={14} color="#667784" />;
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* 1. Header Banner */}
      <View style={[styles.welcomeCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.welcomeTop}>
          {/* <View style={[styles.avatarBox, { backgroundColor: isDark ? '#3D2F12' : '#FEF7E6' }]}>
            <Shield size={26} color="#FBBF24" />
          </View> */}

          <View style={styles.welcomeMeta}>
            <View style={styles.nameRow}>
              <Text style={[styles.userName, { color: theme.textPrimary }]}>
                Safety Moderation Queue
              </Text>
              <View style={[styles.rolePill, { backgroundColor: 'rgba(251, 191, 36, 0.15)', borderColor: '#FBBF24' }]}>
                <Text style={[styles.rolePillText, { color: '#FBBF24' }]}>
                  {isModerator || isAdmin ? 'Active Moderator' : 'Observer View'}
                </Text>
              </View>
            </View>
            <Text style={[styles.userSubTitle, { color: theme.textMuted }]}>
              Review pending citizen submissions, investigate flagged reports, and verify road clearance.
            </Text>
          </View>
        </View>

        <View style={styles.bannerActions}>
          <TouchableOpacity
            style={[
              styles.filterChip,
              !flaggedOnly
                ? [styles.filterChipActive, { backgroundColor: theme.teal }]
                : [styles.filterChipInactive, { backgroundColor: theme.surfaceSubtle, borderColor: theme.border }],
            ]}
            onPress={() => setFlaggedOnly(false)}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterChipText, { color: !flaggedOnly ? '#FFFFFF' : theme.textSecondary }]}>
              All Queue ({reports.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              flaggedOnly
                ? [styles.filterChipActive, { backgroundColor: '#F59E0B' }]
                : [styles.filterChipInactive, { backgroundColor: theme.surfaceSubtle, borderColor: theme.border }],
            ]}
            onPress={() => setFlaggedOnly(true)}
            activeOpacity={0.7}
          >
            <AlertTriangle size={12} color={flaggedOnly ? '#FFFFFF' : '#D97706'} />
            <Text style={[styles.filterChipText, { color: flaggedOnly ? '#FFFFFF' : theme.textSecondary }]}>
              Flagged Only
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={loadQueueData} style={styles.refreshBtn} activeOpacity={0.7}>
            <RefreshCw size={13} color={theme.teal} />
            <Text style={[styles.refreshText, { color: theme.teal }]}>Sync</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. Metrics Cards */}
      <View style={styles.metricsGrid}>
        <View
          style={[
            styles.metricCard,
            { width: isWide ? '23.5%' : '48%', backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <View style={styles.metricHeader}>
            <Text style={[styles.metricLabel, { color: theme.textMuted }]}>PENDING REVIEW</Text>
            <Clock size={15} color="#FB923C" />
          </View>
          <Text style={[styles.metricValue, { color: '#FB923C' }]}>{pendingCount}</Text>
          <Text style={[styles.metricSub, { color: theme.textMuted }]}>Awaiting staff check</Text>
        </View>

        <View
          style={[
            styles.metricCard,
            { width: isWide ? '23.5%' : '48%', backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <View style={styles.metricHeader}>
            <Text style={[styles.metricLabel, { color: theme.textMuted }]}>CONFIRMED</Text>
            <CheckCircle2 size={15} color={theme.teal} />
          </View>
          <Text style={[styles.metricValue, { color: theme.teal }]}>{confirmedCount}</Text>
          <Text style={[styles.metricSub, { color: theme.textMuted }]}>Verified accurate</Text>
        </View>

        <View
          style={[
            styles.metricCard,
            { width: isWide ? '23.5%' : '48%', backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <View style={styles.metricHeader}>
            <Text style={[styles.metricLabel, { color: theme.textMuted }]}>FLAGGED</Text>
            <AlertTriangle size={15} color="#DC2626" />
          </View>
          <Text style={[styles.metricValue, { color: '#DC2626' }]}>{flaggedCount}</Text>
          <Text style={[styles.metricSub, { color: theme.textMuted }]}>Community concerns</Text>
        </View>

        <View
          style={[
            styles.metricCard,
            { width: isWide ? '23.5%' : '48%', backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <View style={styles.metricHeader}>
            <Text style={[styles.metricLabel, { color: theme.textMuted }]}>RESOLVED</Text>
            <CheckCircle2 size={15} color="#27865B" />
          </View>
          <Text style={[styles.metricValue, { color: '#27865B' }]}>{resolvedCount}</Text>
          <Text style={[styles.metricSub, { color: theme.textMuted }]}>Roadways reopened</Text>
        </View>
      </View>

      {/* 3. Queue Report Feed */}
      <View style={styles.queueSection}>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
          Active Triage Queue ({reports.length})
        </Text>

        {loading ? (
          <ActivityIndicator size="small" color={theme.teal} style={{ marginVertical: 24 }} />
        ) : reports.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <CheckCircle2 size={36} color="#16A34A" />
            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
              Queue Completely Clear
            </Text>
            <Text style={[styles.emptySub, { color: theme.textMuted }]}>
              No items requiring moderation action currently match the selected criteria.
            </Text>
          </View>
        ) : (
          reports.map((report) => (
            <View
              key={report.id}
              style={[styles.reportCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
            >
              <View style={styles.reportTopRow}>
                <View style={styles.catBadge}>
                  {renderCategoryIcon(report.category)}
                  <Text style={[styles.catText, { color: theme.textPrimary }]}>
                    {report.category?.replace('_', ' ')?.toUpperCase() || 'HAZARD'}
                  </Text>
                </View>

                <View style={styles.statusPillGroup}>
                  {(report.flags_count || 0) > 0 && (
                    <View style={styles.flagPill}>
                      <AlertTriangle size={10} color="#DC2626" />
                      <Text style={styles.flagText}>{report.flags_count} Flags</Text>
                    </View>
                  )}
                  <View
                    style={[
                      styles.statusPill,
                      {
                        backgroundColor:
                          report.status === 'resolved'
                            ? 'rgba(39, 134, 91, 0.15)'
                            : report.status === 'community_confirmed'
                            ? 'rgba(8, 127, 140, 0.15)'
                            : 'rgba(251, 191, 36, 0.15)',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusPillText,
                        {
                          color:
                            report.status === 'resolved'
                              ? '#27865B'
                              : report.status === 'community_confirmed'
                              ? theme.teal
                              : '#D97706',
                        },
                      ]}
                    >
                      {report.status?.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>

              <Text style={[styles.locationTitle, { color: theme.textPrimary }]}>
                {report.location_name || report.location_label || 'Reported Hazard'}
              </Text>
              <Text style={[styles.descText, { color: theme.textSecondary }]} numberOfLines={2}>
                {report.description}
              </Text>

              {report.photo && (
                <View style={styles.photoWrapper}>
                  <Image source={{ uri: report.photo }} style={styles.photo} />
                </View>
              )}

              {/* Action Buttons */}
              <View style={[styles.actionsRow, { borderTopColor: theme.borderSubtle }]}>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: '#16A34A' }]}
                  onPress={() => handleOpenActionModal(report, 'confirm')}
                  activeOpacity={0.8}
                >
                  <Check size={13} color="#FFFFFF" />
                  <Text style={styles.actionBtnText}>Confirm</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: '#2563EB' }]}
                  onPress={() => handleOpenActionModal(report, 'resolve')}
                  activeOpacity={0.8}
                >
                  <CheckCircle2 size={13} color="#FFFFFF" />
                  <Text style={styles.actionBtnText}>Resolve</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: '#DC2626' }]}
                  onPress={() => handleOpenActionModal(report, 'review')}
                  activeOpacity={0.8}
                >
                  <AlertTriangle size={13} color="#FFFFFF" />
                  <Text style={styles.actionBtnText}>Flag/Review</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.mapLinkBtn} onPress={onOpenMap} activeOpacity={0.7}>
                  <ExternalLink size={14} color={theme.teal} />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>

      {/* 4. Action Modal with Keyboard Avoidance */}
      <Modal
        visible={actionModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setActionModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            style={styles.keyboardAvoider}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
          >
            <View style={[styles.actionModalCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={[styles.actionModalHeader, { borderBottomColor: theme.borderSubtle }]}>
                <View style={styles.actionTitleGroup}>
                  <Shield size={18} color={theme.teal} />
                  <Text style={[styles.actionTitle, { color: theme.textPrimary }]}>
                    Moderation: {actionType.toUpperCase()}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setActionModalOpen(false)} style={styles.modalCloseBtn}>
                  <X size={18} color={theme.textMuted} />
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={styles.actionModalBody} keyboardShouldPersistTaps="handled">
                {actionSuccess ? (
                  <View style={[styles.bannerSuccess, { backgroundColor: isDark ? '#143826' : '#DCFCE7' }]}>
                    <CheckCircle2 size={15} color="#16A34A" />
                    <Text style={styles.bannerSuccessText}>{actionSuccess}</Text>
                  </View>
                ) : null}

                {actionError ? (
                  <View style={[styles.bannerError, { backgroundColor: isDark ? '#3D1B1B' : '#FDF0F0' }]}>
                    <AlertTriangle size={15} color="#F87171" />
                    <Text style={styles.bannerErrorText}>{actionError}</Text>
                  </View>
                ) : null}

                <Text style={[styles.targetLabel, { color: theme.textSecondary }]}>
                  Corridor Target:{' '}
                  <Text style={{ fontWeight: '700', color: theme.textPrimary }}>
                    {selectedReport?.location_name || 'Selected Report'}
                  </Text>
                </Text>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>
                    Action Reason / Safety Note <Text style={{ color: '#DC2626' }}>*</Text>
                  </Text>
                  <TextInput
                    style={[
                      styles.textArea,
                      {
                        backgroundColor: theme.surfaceSubtle,
                        borderColor: theme.border,
                        color: theme.textPrimary,
                      },
                    ]}
                    value={actionReason}
                    onChangeText={setActionReason}
                    placeholder="Provide explanatory context for the safety audit log..."
                    placeholderTextColor={theme.textMuted}
                    multiline
                    numberOfLines={3}
                  />
                </View>

                <View style={styles.modalBtnRow}>
                  <TouchableOpacity
                    style={[styles.cancelBtn, { backgroundColor: theme.surfaceSubtle, borderColor: theme.border }]}
                    onPress={() => setActionModalOpen(false)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.cancelBtnText, { color: theme.textPrimary }]}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.submitActionBtn, { backgroundColor: theme.teal }]}
                    onPress={handleSubmitAction}
                    disabled={submittingAction}
                    activeOpacity={0.8}
                  >
                    {submittingAction ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.submitActionBtnText}>Apply Decision</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 14,
    gap: 14,
    paddingBottom: 36,
  },
  welcomeCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  welcomeTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeMeta: {
    flex: 1,
    gap: 3,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  userName: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  rolePill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
  },
  rolePillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  userSubTitle: {
    fontSize: 11,
    lineHeight: 15,
  },
  bannerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 8,
  },
  filterChipActive: {},
  filterChipInactive: {
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 'auto',
  },
  refreshText: {
    fontSize: 11,
    fontWeight: '700',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  metricCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 13,
    gap: 4,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  metricSub: {
    fontSize: 10,
  },
  queueSection: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  emptyCard: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  emptySub: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  reportCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  reportTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  catBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  catText: {
    fontSize: 11,
    fontWeight: '800',
  },
  statusPillGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  flagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(220, 38, 38, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  flagText: {
    color: '#DC2626',
    fontSize: 9,
    fontWeight: '800',
  },
  statusPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusPillText: {
    fontSize: 9,
    fontWeight: '900',
  },
  locationTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  descText: {
    fontSize: 12,
    lineHeight: 17,
  },
  photoWrapper: {
    height: 120,
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: 2,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderTopWidth: 1,
    paddingTop: 8,
    marginTop: 2,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 6,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  mapLinkBtn: {
    marginLeft: 'auto',
    padding: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  keyboardAvoider: {
    flex: 1,
    justifyContent: 'flex-end',
    width: '100%',
  },
  actionModalCard: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  actionModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  actionTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  modalCloseBtn: {
    padding: 4,
  },
  actionModalBody: {
    gap: 12,
    paddingBottom: 16,
  },
  bannerSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 10,
    borderRadius: 8,
  },
  bannerSuccessText: {
    color: '#16A34A',
    fontSize: 12,
    fontWeight: '700',
  },
  bannerError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 10,
    borderRadius: 8,
  },
  bannerErrorText: {
    color: '#F87171',
    fontSize: 12,
    fontWeight: '700',
  },
  targetLabel: {
    fontSize: 12,
  },
  inputGroup: {
    gap: 5,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  submitActionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitActionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
