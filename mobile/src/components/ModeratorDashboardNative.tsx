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
  Search,
  Maximize2,
  Sparkles,
  ArrowUpDown,
  ChevronDown,
} from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { HazardItem } from '../constants/hazardTypes';
import { moderationService } from '../services/apiClient';
import {
  aiService,
  SummarizeReportResult,
  CheckDuplicatesResult,
} from '../services/aiService';
import { PaginationControlsNative } from './PaginationControlsNative';
import { ImageViewerModalNative } from './ImageViewerModalNative';
import { AISuggestionCardNative } from './AISuggestionCardNative';

interface ModeratorDashboardNativeProps {
  hazards: HazardItem[];
  onOpenReport: () => void;
  onOpenMap: (hazard?: any) => void;
  onSelectHazard?: (hazard: any) => void;
  onOpenAuth?: () => void;
}

export const ModeratorDashboardNative: React.FC<ModeratorDashboardNativeProps> = ({
  hazards,
  onOpenReport,
  onOpenMap,
  onSelectHazard,
  onOpenAuth,
}) => {
  const { isDark, theme } = useTheme();
  const { user, isModerator, isAdmin } = useAuth();
  const { width: windowWidth } = useWindowDimensions();

  const [activeTab, setActiveTab] = useState<'queue' | 'history'>('queue');
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [totalCount, setTotalCount] = useState(0);
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [ordering, setOrdering] = useState('-flags_count');
  const [orderingModalOpen, setOrderingModalOpen] = useState(false);
  const [stats, setStats] = useState<any>(null);

  // Moderation Audit History State
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Action Modal State
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [actionType, setActionType] = useState<'confirm' | 'resolve' | 'review'>('confirm');
  const [actionReason, setActionReason] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [selectedPreviewImage, setSelectedPreviewImage] = useState<{ url: string; title: string; subtitle: string } | null>(null);

  // AI Assistant States for Moderator
  const [aiSummary, setAiSummary] = useState<SummarizeReportResult | null>(null);
  const [loadingAiSummary, setLoadingAiSummary] = useState(false);
  const [aiDuplicates, setAiDuplicates] = useState<CheckDuplicatesResult | null>(null);
  const [loadingAiDuplicates, setLoadingAiDuplicates] = useState(false);
  const [aiModalNotice, setAiModalNotice] = useState<string | null>(null);

  // Inline AI card state for triage cards (summary on card directly)
  const [cardAiSummaries, setCardAiSummaries] = useState<Record<number, SummarizeReportResult>>({});
  const [loadingCardSummary, setLoadingCardSummary] = useState<number | null>(null);

  const loadQueueData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page, page_size: pageSize };
      if (flaggedOnly) params.flagged_only = true;
      if (statusFilter && statusFilter !== 'all') params.status = statusFilter;
      if (categoryFilter && categoryFilter !== 'all') params.category = categoryFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (ordering) params.ordering = ordering;

      const [queueData, statsData] = await Promise.all([
        moderationService.getReports(params),
        moderationService.getStats().catch(() => null),
      ]);
      const items = Array.isArray(queueData) ? queueData : queueData?.results || [];
      const count = Array.isArray(queueData) ? queueData.length : queueData?.count ?? items.length;
      setReports(items);
      setTotalCount(count);
      if (statsData) setStats(statsData);
    } catch {
      setReports([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, flaggedOnly, statusFilter, categoryFilter, searchQuery, ordering]);

  const loadHistoryData = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const historyData = await moderationService.getAllHistory();
      setHistory(Array.isArray(historyData) ? historyData : historyData?.results || []);
    } catch {
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  const clearFilters = () => {
    setFlaggedOnly(false);
    setStatusFilter('all');
    setCategoryFilter('all');
    setSearchQuery('');
    setOrdering('-flags_count');
    setPage(1);
  };

  const hasActiveFilters =
    flaggedOnly ||
    statusFilter !== 'all' ||
    categoryFilter !== 'all' ||
    searchQuery.trim() !== '' ||
    ordering !== '-flags_count';

  useEffect(() => {
    loadQueueData();
  }, [loadQueueData]);

  useEffect(() => {
    if (activeTab === 'history') {
      loadHistoryData();
    }
  }, [activeTab, loadHistoryData]);

  const handleOpenActionModal = (report: any, action: 'confirm' | 'resolve' | 'review') => {
    setSelectedReport(report);
    setActionType(action);
    setActionReason('');
    setActionError('');
    setActionSuccess('');
    setAiSummary(null);
    setAiDuplicates(null);
    setAiModalNotice(null);
    setActionModalOpen(true);
  };

  const handleFetchAiSummary = async (reportId: number) => {
    try {
      setLoadingAiSummary(true);
      setAiModalNotice(null);
      const res = await aiService.summarizeReport(reportId);
      setAiSummary(res);
    } catch (err: any) {
      const msg = err?.data?.error || err?.message || 'AI incident summarizer is temporarily unavailable.';
      setAiModalNotice(msg);
    } finally {
      setLoadingAiSummary(false);
    }
  };

  const handleFetchAiDuplicates = async (report: any) => {
    try {
      setLoadingAiDuplicates(true);
      setAiModalNotice(null);
      const res = await aiService.checkDuplicates({
        latitude: report.latitude,
        longitude: report.longitude,
        description: report.description,
        category: report.category,
        radius_km: 1.0,
        exclude_report_id: report.id,
      });
      setAiDuplicates(res);
    } catch (err: any) {
      const msg = err?.data?.error || err?.message || 'Duplicate scanner is temporarily unavailable.';
      setAiModalNotice(msg);
    } finally {
      setLoadingAiDuplicates(false);
    }
  };

  const handleFetchInlineSummary = async (reportId: number) => {
    if (cardAiSummaries[reportId]) {
      // Toggle off
      setCardAiSummaries((prev) => {
        const copy = { ...prev };
        delete copy[reportId];
        return copy;
      });
      return;
    }

    try {
      setLoadingCardSummary(reportId);
      const res = await aiService.summarizeReport(reportId);
      setCardAiSummaries((prev) => ({ ...prev, [reportId]: res }));
    } catch (err: any) {
      Alert.alert('AI Summarizer', err?.data?.error || err?.message || 'AI incident summarizer is temporarily unavailable.');
    } finally {
      setLoadingCardSummary(null);
    }
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

  const pendingCount = stats?.active_reported ?? stats?.pending_count ?? hazards.filter((h) => h.status === 'reported').length;
  const underReviewCount = stats?.under_review ?? hazards.filter((h) => h.status === 'under_review').length;
  const confirmedCount = stats?.confirmed ?? stats?.confirmed_count ?? hazards.filter((h) => h.status === 'community_confirmed').length;
  const flaggedCount = stats?.pending_flags ?? stats?.flagged_count ?? hazards.filter((h) => (h.flags_count || 0) > 0).length;
  const resolvedCount = stats?.resolved ?? stats?.resolved_count ?? hazards.filter((h) => h.status === 'resolved').length;

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
            <Text style={[styles.metricLabel, { color: theme.textMuted }]}>PENDING FLAGS</Text>
            <AlertTriangle size={15} color="#DC2626" />
          </View>
          <Text style={[styles.metricValue, { color: '#DC2626' }]}>{flaggedCount}</Text>
          <Text style={[styles.metricSub, { color: theme.textMuted }]}>Require urgent check</Text>
        </View>

        <View
          style={[
            styles.metricCard,
            { width: isWide ? '23.5%' : '48%', backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <View style={styles.metricHeader}>
            <Text style={[styles.metricLabel, { color: theme.textMuted }]}>UNDER REVIEW</Text>
            <Clock size={15} color="#FB923C" />
          </View>
          <Text style={[styles.metricValue, { color: '#FB923C' }]}>{underReviewCount}</Text>
          <Text style={[styles.metricSub, { color: theme.textMuted }]}>Investigating conditions</Text>
        </View>

        <View
          style={[
            styles.metricCard,
            { width: isWide ? '23.5%' : '48%', backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <View style={styles.metricHeader}>
            <Text style={[styles.metricLabel, { color: theme.textMuted }]}>ACTIVE REPORTED</Text>
            <CheckCircle2 size={15} color={theme.teal} />
          </View>
          <Text style={[styles.metricValue, { color: theme.teal }]}>{pendingCount}</Text>
          <Text style={[styles.metricSub, { color: theme.textMuted }]}>Ground observations</Text>
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

      {/* Tab Bar Underline */}
      <View style={[styles.tabBarWrapper, { borderBottomColor: theme.border }]}>
        <View style={styles.tabsRow}>
          <TouchableOpacity
            style={[
              styles.navTab,
              activeTab === 'queue' && [styles.activeNavTab, { borderBottomColor: '#FBBF24' }],
            ]}
            onPress={() => setActiveTab('queue')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.navTabText,
                { color: activeTab === 'queue' ? '#FBBF24' : theme.textMuted },
                activeTab === 'queue' && styles.activeNavTabText,
              ]}
            >
              Triage Queue ({totalCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.navTab,
              activeTab === 'history' && [styles.activeNavTab, { borderBottomColor: '#FBBF24' }],
            ]}
            onPress={() => setActiveTab('history')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.navTabText,
                { color: activeTab === 'history' ? '#FBBF24' : theme.textMuted },
                activeTab === 'history' && styles.activeNavTabText,
              ]}
            >
              Moderation History ({history.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 3. Queue Report Feed */}
      {activeTab === 'queue' && (
      <View style={styles.queueSection}>
        {/* Enhanced Moderation Filter Card */}
        <View style={[styles.filterCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.filterCardHeader}>
            <View style={styles.filterCardTitleRow}>
              <View style={[styles.filterIconBadge, { backgroundColor: 'rgba(251, 191, 36, 0.15)' }]}>
                <Filter size={14} color="#D97706" />
              </View>
              <View>
                <Text style={[styles.filterCardTitle, { color: theme.textPrimary }]}>Queue Triage Filters</Text>
                <Text style={[styles.filterCardSubtitle, { color: theme.textMuted }]}>
                  Showing {reports.length} of {totalCount} incidents from live moderation queue
                </Text>
              </View>
            </View>

            <View style={styles.filterActionsRow}>
              {hasActiveFilters && (
                <TouchableOpacity
                  style={[styles.clearFilterBtn, { borderColor: '#F87171', backgroundColor: isDark ? '#3D1B1B' : '#FEF2F2' }]}
                  onPress={clearFilters}
                  activeOpacity={0.7}
                >
                  <X size={11} color="#EF4444" />
                  <Text style={styles.clearFilterText}>Reset</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={loadQueueData}
                style={[styles.refreshIconBtn, { backgroundColor: theme.surfaceSubtle, borderColor: theme.border }]}
                activeOpacity={0.7}
              >
                <RefreshCw size={12} color={theme.teal} />
                <Text style={[styles.refreshText, { color: theme.teal }]}>Sync</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Search bar & Sort Ordering Row */}
          <View style={styles.searchAndSortRow}>
            <View style={[styles.searchInputWrapper, { backgroundColor: theme.surfaceSubtle, borderColor: theme.border, flex: 1 }]}>
              <Search size={14} color={theme.textMuted} />
              <TextInput
                style={[styles.searchInputText, { color: theme.textPrimary }]}
                placeholder="Search landmark, street, or description..."
                placeholderTextColor={theme.textMuted}
                value={searchQuery}
                onChangeText={(t) => {
                  setSearchQuery(t);
                  setPage(1);
                }}
                returnKeyType="search"
              />
              {searchQuery ? (
                <TouchableOpacity
                  onPress={() => {
                    setSearchQuery('');
                    setPage(1);
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <X size={14} color={theme.textMuted} />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Ordering Selector Trigger */}
            <TouchableOpacity
              style={[
                styles.orderingSelectBtn,
                { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
              ]}
              onPress={() => setOrderingModalOpen(true)}
              activeOpacity={0.7}
              accessibilityLabel="Change sort order"
            >
              <Text style={[styles.orderingSelectText, { color: theme.textPrimary }]} numberOfLines={1}>
                {ordering === '-flags_count'
                  ? 'Most Flagged First'
                  : ordering === '-created_at'
                  ? 'Newest First'
                  : ordering === 'created_at'
                  ? 'Oldest First'
                  : ordering === '-confirmations_count'
                  ? 'Most Confirmed'
                  : 'Sort'}
              </Text>
              <ArrowUpDown size={13} color={theme.teal} />
            </TouchableOpacity>
          </View>

          {/* Quick Filter: All vs Flagged Only */}
          <View style={styles.flaggedToggleRow}>
            <TouchableOpacity
              style={[
                styles.quickToggleChip,
                !flaggedOnly
                  ? [styles.quickToggleActive, { backgroundColor: theme.teal }]
                  : [styles.quickToggleInactive, { backgroundColor: theme.surfaceSubtle, borderColor: theme.border }],
              ]}
              onPress={() => {
                setFlaggedOnly(false);
                setPage(1);
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.quickToggleText, { color: !flaggedOnly ? '#FFFFFF' : theme.textSecondary }]}>
                All Reports
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.quickToggleChip,
                flaggedOnly
                  ? [styles.quickToggleActive, { backgroundColor: '#DC2626' }]
                  : [styles.quickToggleInactive, { backgroundColor: theme.surfaceSubtle, borderColor: theme.border }],
              ]}
              onPress={() => {
                setFlaggedOnly(true);
                setPage(1);
              }}
              activeOpacity={0.7}
            >
              <AlertTriangle size={12} color={flaggedOnly ? '#FFFFFF' : '#DC2626'} />
              <Text style={[styles.quickToggleText, { color: flaggedOnly ? '#FFFFFF' : '#DC2626' }]}>
                Flagged Only ({flaggedCount})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Category Chips Scroller */}
          <View style={styles.categoryChipsSection}>
            <Text style={[styles.filterSectionLabel, { color: theme.textMuted }]}>CATEGORY</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryChipsScroll}>
              {[
                { id: 'all', label: 'All Categories' },
                { id: 'pothole', label: 'Pothole' },
                { id: 'flooding', label: 'Flooding' },
                { id: 'blocked_road', label: 'Blocked Road' },
                { id: 'fallen_tree', label: 'Fallen Tree' },
                { id: 'street_light_out', label: 'Street Light Out' },
                { id: 'dangerous_debris', label: 'Debris' },
                { id: 'traffic_signal_failure', label: 'Traffic Signal' },
                { id: 'construction_hazard', label: 'Construction' },
                { id: 'other', label: 'Other' },
              ].map((cat) => {
                const isSelected = categoryFilter === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryChip,
                      isSelected
                        ? [styles.categoryChipActive, { backgroundColor: theme.teal, borderColor: theme.teal }]
                        : [styles.categoryChipInactive, { backgroundColor: theme.surfaceSubtle, borderColor: theme.border }],
                    ]}
                    onPress={() => {
                      setCategoryFilter(cat.id);
                      setPage(1);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        { color: isSelected ? '#FFFFFF' : theme.textSecondary },
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Status Chips Scroller */}
          <View style={styles.statusChipsSection}>
            <Text style={[styles.filterSectionLabel, { color: theme.textMuted }]}>STATUS</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statusChipsScroll}>
              {[
                { id: 'all', label: 'All Statuses' },
                { id: 'under_review', label: 'Under Review' },
                { id: 'reported', label: 'Reported' },
                { id: 'community_confirmed', label: 'Confirmed' },
                { id: 'resolved', label: 'Resolved' },
                { id: 'rejected', label: 'Rejected' },
              ].map((st) => {
                const isSelected = statusFilter === st.id;
                return (
                  <TouchableOpacity
                    key={st.id}
                    style={[
                      styles.statusChip,
                      isSelected
                        ? [styles.statusChipActive, { backgroundColor: isDark ? '#FFFFFF' : '#142B3B', borderColor: isDark ? '#FFFFFF' : '#142B3B' }]
                        : [styles.statusChipInactive, { backgroundColor: theme.surfaceSubtle, borderColor: theme.border }],
                    ]}
                    onPress={() => {
                      setStatusFilter(st.id);
                      setPage(1);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.statusChipText,
                        {
                          color: isSelected
                            ? isDark
                              ? '#142B3B'
                              : '#FFFFFF'
                            : theme.textSecondary,
                        },
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

        <View style={styles.sectionTitleRow}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            Active Triage Queue ({totalCount})
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator size="small" color={theme.teal} style={{ marginVertical: 24 }} />
        ) : reports.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <CheckCircle2 size={36} color="#16A34A" />
            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
              {!(isModerator || isAdmin) ? 'Moderator Access Required' : 'Queue Completely Clear'}
            </Text>
            <Text style={[styles.emptySub, { color: theme.textMuted }]}>
              {!(isModerator || isAdmin)
                ? 'Sign in with safety moderator credentials to triage citizen flags, verify hazard clearance, or issue notices.'
                : 'No incidents requiring moderation action currently match the selected criteria.'}
            </Text>
            {!(isModerator || isAdmin) && onOpenAuth && (
              <TouchableOpacity
                style={[styles.primaryActionBtn, { backgroundColor: '#FBBF24', marginTop: 10 }]}
                onPress={onOpenAuth}
                activeOpacity={0.8}
              >
                <Text style={[styles.primaryActionText, { color: '#1E293B' }]}>Sign In as Moderator</Text>
              </TouchableOpacity>
            )}
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
                <TouchableOpacity
                  style={[styles.photoWrapper, { borderColor: theme.border, backgroundColor: theme.surfaceSubtle }]}
                  activeOpacity={0.85}
                  onPress={() =>
                    setSelectedPreviewImage({
                      url: report.photo as string,
                      title: report.location_name || report.location_label || 'Reported Incident',
                      subtitle: `${report.category?.replace('_', ' ')?.toUpperCase() || 'HAZARD'} \u2022 ${report.status?.replace('_', ' ')?.toUpperCase() || 'REPORTED'}`,
                    })
                  }
                >
                  <Image source={{ uri: report.photo }} style={styles.photo} resizeMode="cover" />
                  <View style={styles.zoomPill}>
                    <Maximize2 size={11} color="#FFFFFF" />
                    <Text style={styles.zoomPillText}>Tap to expand</Text>
                  </View>
                </TouchableOpacity>
              )}

              {/* Inline AI Summary Card if requested */}
              {cardAiSummaries[report.id] && (
                <View style={{ marginTop: 8 }}>
                  <AISuggestionCardNative
                    title={`Incident Summary (${cardAiSummaries[report.id].urgency_level.toUpperCase()})`}
                    subtitle={cardAiSummaries[report.id].category_display}
                    content={cardAiSummaries[report.id].summary}
                    onDismiss={() => handleFetchInlineSummary(report.id)}
                    disclaimer={cardAiSummaries[report.id].disclaimer}
                  />
                </View>
              )}

              {/* Action Buttons - 2 Clean Responsive Rows */}
              <View style={[styles.actionsContainer, { borderTopColor: theme.borderSubtle }]}>
                {/* Top Row: AI Summary and View Map */}
                <View style={styles.actionsTopRow}>
                  <TouchableOpacity
                    style={[
                      styles.actionBtnWide,
                      {
                        backgroundColor: cardAiSummaries[report.id]
                          ? theme.teal
                          : isDark
                          ? 'rgba(8, 127, 140, 0.2)'
                          : '#E0F2FE',
                        borderColor: theme.teal,
                      },
                    ]}
                    onPress={() => handleFetchInlineSummary(report.id)}
                    disabled={loadingCardSummary === report.id}
                    activeOpacity={0.8}
                  >
                    {loadingCardSummary === report.id ? (
                      <ActivityIndicator size="small" color={cardAiSummaries[report.id] ? '#FFFFFF' : theme.teal} />
                    ) : (
                      <Sparkles size={13} color={cardAiSummaries[report.id] ? '#FFFFFF' : theme.teal} />
                    )}
                    <Text
                      style={[
                        styles.actionBtnWideText,
                        { color: cardAiSummaries[report.id] ? '#FFFFFF' : theme.teal },
                      ]}
                    >
                      AI Summary
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.mapInspectBtn, { backgroundColor: theme.surfaceSubtle, borderColor: theme.border }]}
                    onPress={() => {
                      if (onSelectHazard) onSelectHazard(report);
                      onOpenMap(report);
                    }}
                    activeOpacity={0.7}
                    accessibilityLabel="View hazard on map"
                  >
                    <ExternalLink size={13} color={theme.teal} />
                    <Text style={[styles.mapInspectBtnText, { color: theme.teal }]}>View Map</Text>
                  </TouchableOpacity>
                </View>

                {/* Bottom Row: Confirm, Resolve, Flag/Review */}
                <View style={styles.actionsBottomRow}>
                  <TouchableOpacity
                    style={[styles.actionBtnTriage, { backgroundColor: '#16A34A' }]}
                    onPress={() => handleOpenActionModal(report, 'confirm')}
                    activeOpacity={0.8}
                  >
                    <Check size={13} color="#FFFFFF" />
                    <Text style={styles.actionBtnText}>Confirm</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtnTriage, { backgroundColor: '#2563EB' }]}
                    onPress={() => handleOpenActionModal(report, 'resolve')}
                    activeOpacity={0.8}
                  >
                    <CheckCircle2 size={13} color="#FFFFFF" />
                    <Text style={styles.actionBtnText}>Resolve</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtnTriage, { backgroundColor: '#DC2626' }]}
                    onPress={() => handleOpenActionModal(report, 'review')}
                    activeOpacity={0.8}
                  >
                    <AlertTriangle size={13} color="#FFFFFF" />
                    <Text style={styles.actionBtnText}>Flag/Review</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}

        <PaginationControlsNative
          currentPage={page}
          totalPages={Math.max(1, Math.ceil(totalCount / pageSize))}
          totalCount={totalCount}
          pageSize={pageSize}
          onPageChange={(p) => setPage(p)}
          loading={loading}
        />
      </View>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <View style={styles.historySection}>
          <View style={styles.historySectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              Moderation Audit History
            </Text>
            <TouchableOpacity onPress={loadHistoryData} style={styles.refreshBtn} activeOpacity={0.7}>
              <RefreshCw size={12} color="#FBBF24" />
              <Text style={[styles.refreshText, { color: '#FBBF24' }]}>Refresh</Text>
            </TouchableOpacity>
          </View>

          {loadingHistory ? (
            <ActivityIndicator size="small" color="#FBBF24" style={{ marginVertical: 24 }} />
          ) : history.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Shield size={36} color="#FBBF24" />
              <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
                {!(isModerator || isAdmin) ? 'Moderator Access Required' : 'No History Recorded'}
              </Text>
              <Text style={[styles.emptySub, { color: theme.textMuted }]}>
                {!(isModerator || isAdmin)
                  ? 'Sign in with a moderator account to inspect the platform moderation action log.'
                  : 'No moderation actions have been recorded yet.'}
              </Text>
              {!(isModerator || isAdmin) && onOpenAuth && (
                <TouchableOpacity
                  style={[styles.primaryActionBtn, { backgroundColor: '#FBBF24', marginTop: 10 }]}
                  onPress={onOpenAuth}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.primaryActionText, { color: '#1E293B' }]}>Sign In as Moderator</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            history.map((item) => {
              const actionLabel = item.action?.toUpperCase() || 'MODERATED';
              const moderator = item.moderator_name || 'System';
              let formattedDate = 'Recently';
              if (item.created_at) {
                try {
                  formattedDate = new Date(item.created_at).toLocaleString([], {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  });
                } catch {
                  formattedDate = String(item.created_at);
                }
              }

              return (
                <View
                  key={item.id}
                  style={[styles.historyCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
                >
                  <View style={styles.historyTopRow}>
                    <View
                      style={[
                        styles.historyActionBadge,
                        {
                          backgroundColor:
                            item.action === 'confirm'
                              ? 'rgba(39, 134, 91, 0.15)'
                              : item.action === 'resolve'
                              ? 'rgba(37, 99, 235, 0.15)'
                              : 'rgba(245, 158, 11, 0.15)',
                          borderColor:
                            item.action === 'confirm'
                              ? '#27865B'
                              : item.action === 'resolve'
                              ? '#2563EB'
                              : '#F59E0B',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.historyActionText,
                          {
                            color:
                              item.action === 'confirm'
                                ? '#27865B'
                                : item.action === 'resolve'
                                ? '#2563EB'
                                : '#D97706',
                          },
                        ]}
                      >
                        {actionLabel}
                      </Text>
                    </View>
                    <Text style={[styles.historyTime, { color: theme.textMuted }]}>
                      {formattedDate}
                    </Text>
                  </View>

                  <View style={styles.historyMetaRow}>
                    <Text style={[styles.historyModerator, { color: theme.textPrimary }]}>
                      By {moderator}
                    </Text>
                    {item.report && (
                      <Text style={[styles.historyReportLink, { color: theme.teal }]}>
                        Report #{item.report}
                      </Text>
                    )}
                  </View>

                  <Text style={[styles.historyReason, { color: theme.textSecondary }]}>
                    {item.reason || 'No additional note recorded.'}
                  </Text>
                </View>
              );
            })
          )}
        </View>
      )}

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
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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
                    {selectedReport?.location_name || selectedReport?.location_label || 'Selected Report'}
                  </Text>
                </Text>

                {/* AI Assistant Moderator Tools */}
                <View style={styles.aiModalToolRow}>
                  <TouchableOpacity
                    style={[
                      styles.aiModalToolBtn,
                      {
                        backgroundColor: isDark ? 'rgba(8, 127, 140, 0.15)' : '#F0FDFA',
                        borderColor: isDark ? 'rgba(8, 127, 140, 0.4)' : '#99F6E4',
                      },
                    ]}
                    onPress={() => selectedReport?.id && handleFetchAiSummary(selectedReport.id)}
                    disabled={loadingAiSummary}
                    activeOpacity={0.7}
                  >
                    {loadingAiSummary ? (
                      <ActivityIndicator size="small" color={theme.teal} />
                    ) : (
                      <Sparkles size={12} color={theme.teal} />
                    )}
                    <Text style={[styles.aiModalToolBtnText, { color: theme.teal }]}>
                      AI Summary
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.aiModalToolBtn,
                      {
                        backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FEF3C7',
                        borderColor: isDark ? 'rgba(245, 158, 11, 0.4)' : '#FDE68A',
                      },
                    ]}
                    onPress={() => selectedReport && handleFetchAiDuplicates(selectedReport)}
                    disabled={loadingAiDuplicates}
                    activeOpacity={0.7}
                  >
                    {loadingAiDuplicates ? (
                      <ActivityIndicator size="small" color="#D97706" />
                    ) : (
                      <Sparkles size={12} color="#D97706" />
                    )}
                    <Text style={[styles.aiModalToolBtnText, { color: isDark ? '#FCD34D' : '#B45309' }]}>
                      Scan Duplicates
                    </Text>
                  </TouchableOpacity>
                </View>

                {aiSummary && (
                  <AISuggestionCardNative
                    title={`Incident Summary (Urgency: ${aiSummary.urgency_level.toUpperCase()})`}
                    subtitle={aiSummary.category_display}
                    content={aiSummary.summary}
                    onDismiss={() => setAiSummary(null)}
                    disclaimer={aiSummary.disclaimer}
                  />
                )}

                {aiDuplicates && (
                  <AISuggestionCardNative
                    title={
                      aiDuplicates.is_possible_duplicate
                        ? 'Potential Duplicate Detected'
                        : 'Deduplication Clear'
                    }
                    subtitle={`${aiDuplicates.nearby_count} active reports nearby`}
                    content={
                      <View style={{ gap: 6 }}>
                        <Text style={{ fontSize: 11.5, fontWeight: '700', color: isDark ? '#FCD34D' : '#92400E' }}>
                          {aiDuplicates.analysis}
                        </Text>
                        {aiDuplicates.candidates.map((cand) => (
                          <View
                            key={cand.id}
                            style={{
                              padding: 6,
                              borderRadius: 6,
                              backgroundColor: isDark ? '#142533' : '#F8FAFC',
                              borderWidth: 1,
                              borderColor: theme.border,
                              flexDirection: 'row',
                              justifyContent: 'space-between',
                            }}
                          >
                            <Text style={{ fontSize: 10.5, fontWeight: '600', color: theme.textPrimary }}>
                              #{cand.id} {cand.category_display}
                            </Text>
                            <Text style={{ fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', color: theme.teal }}>
                              {cand.distance_meters}m
                            </Text>
                          </View>
                        ))}
                      </View>
                    }
                    onDismiss={() => setAiDuplicates(null)}
                    disclaimer={aiDuplicates.disclaimer}
                  />
                )}

                {aiModalNotice && (
                  <View
                    style={{
                      padding: 8,
                      borderRadius: 8,
                      backgroundColor: isDark ? '#3D2808' : '#FEF3C7',
                      borderWidth: 1,
                      borderColor: '#F59E0B',
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 11, color: isDark ? '#FCD34D' : '#92400E', flex: 1 }}>
                      {aiModalNotice}
                    </Text>
                    <TouchableOpacity onPress={() => setAiModalNotice(null)} style={{ padding: 2 }}>
                      <X size={12} color={isDark ? '#FCD34D' : '#92400E'} />
                    </TouchableOpacity>
                  </View>
                )}

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

      {/* Ordering Selection Modal */}
      <Modal
        visible={orderingModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setOrderingModalOpen(false)}
      >
        <TouchableOpacity
          style={styles.orderingModalOverlay}
          activeOpacity={1}
          onPress={() => setOrderingModalOpen(false)}
        >
          <View
            style={[
              styles.orderingModalCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <View style={[styles.orderingModalHeader, { borderBottomColor: theme.borderSubtle }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <ArrowUpDown size={15} color={theme.teal} />
                <Text style={[styles.orderingModalTitle, { color: theme.textPrimary }]}>Sort Triage Queue</Text>
              </View>
              <TouchableOpacity
                onPress={() => setOrderingModalOpen(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={16} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            {[
              { id: '-flags_count', label: 'Most Flagged First' },
              { id: '-created_at', label: 'Newest First' },
              { id: 'created_at', label: 'Oldest First' },
              { id: '-confirmations_count', label: 'Most Confirmed' },
            ].map((opt) => {
              const isSelected = ordering === opt.id;
              return (
                <TouchableOpacity
                  key={opt.id}
                  style={[
                    styles.orderingOptionRow,
                    {
                      backgroundColor: isSelected
                        ? isDark
                          ? 'rgba(8, 127, 140, 0.2)'
                          : '#E0F2FE'
                        : theme.surfaceSubtle,
                      borderColor: isSelected ? theme.teal : theme.border,
                    },
                  ]}
                  onPress={() => {
                    setOrdering(opt.id);
                    setPage(1);
                    setOrderingModalOpen(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.orderingOptionText,
                      { color: isSelected ? theme.teal : theme.textPrimary },
                    ]}
                  >
                    {opt.label}
                  </Text>
                  {isSelected && <Check size={16} color={theme.teal} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Fullscreen Photo Modal */}
      {selectedPreviewImage ? (
        <ImageViewerModalNative
          visible={Boolean(selectedPreviewImage)}
          imageUrl={selectedPreviewImage?.url || null}
          title={selectedPreviewImage?.title}
          subtitle={selectedPreviewImage?.subtitle}
          onClose={() => setSelectedPreviewImage(null)}
        />
      ) : null}
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
    gap: 12,
  },
  filterCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  filterCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  filterCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterCardTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  filterCardSubtitle: {
    fontSize: 10,
    marginTop: 1,
  },
  filterActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  clearFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  clearFilterText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#EF4444',
  },
  refreshIconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    gap: 8,
  },
  searchInputText: {
    flex: 1,
    fontSize: 12,
    padding: 0,
  },
  flaggedToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quickToggleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  quickToggleActive: {},
  quickToggleInactive: {
    borderWidth: 1,
  },
  quickToggleText: {
    fontSize: 11,
    fontWeight: '700',
  },
  categoryChipsSection: {
    gap: 6,
  },
  filterSectionLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  categoryChipsScroll: {
    gap: 6,
    paddingVertical: 2,
  },
  categoryChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  categoryChipActive: {},
  categoryChipInactive: {},
  categoryChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusChipsSection: {
    gap: 6,
  },
  statusChipsScroll: {
    gap: 6,
    paddingVertical: 2,
  },
  statusChip: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusChipActive: {},
  statusChipInactive: {},
  statusChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
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
    height: 180,
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: 6,
    marginBottom: 6,
    borderWidth: 1,
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  zoomPill: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  zoomPillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  searchAndSortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderingSelectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    minWidth: 130,
    justifyContent: 'space-between',
  },
  orderingSelectText: {
    fontSize: 11,
    fontWeight: '700',
    flexShrink: 1,
  },
  orderingModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  orderingModalCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  orderingModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 8,
    borderBottomWidth: 1,
  },
  orderingModalTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  orderingOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 4,
  },
  orderingOptionText: {
    fontSize: 12,
    fontWeight: '700',
  },
  actionsContainer: {
    borderTopWidth: 1,
    paddingTop: 10,
    marginTop: 4,
    gap: 8,
  },
  actionsTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtnWide: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionBtnWideText: {
    fontSize: 11,
    fontWeight: '700',
  },
  mapInspectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  mapInspectBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  actionsBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionBtnTriage: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    borderRadius: 8,
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
  historySection: {
    gap: 10,
  },
  historyCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  historyTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyActionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  historyActionText: {
    fontSize: 11,
    fontWeight: '800',
  },
  historyTime: {
    fontSize: 11,
  },
  historyMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyModerator: {
    fontSize: 12,
    fontWeight: '700',
  },
  historyReportLink: {
    fontSize: 12,
    fontWeight: '700',
  },
  historyReason: {
    fontSize: 12,
    lineHeight: 16,
  },
  historySectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  tabBarWrapper: {
    borderBottomWidth: 1,
    marginHorizontal: -2,
  },
  tabsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  navTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeNavTab: {
    borderBottomWidth: 2,
  },
  navTabText: {
    fontSize: 12,
    fontWeight: '600',
  },
  activeNavTabText: {
    fontWeight: '800',
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  aiModalToolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 4,
  },
  aiModalToolBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  aiModalToolBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
