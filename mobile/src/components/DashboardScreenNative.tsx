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
  User,
  ShieldCheck,
  AlertTriangle,
  HeartHandshake,
  Clock,
  CheckCircle2,
  Sliders,
  Settings,
  PlusCircle,
  MapPin,
  LogIn,
  LogOut,
  RefreshCw,
  Flame,
  Check,
  Edit3,
  Shield,
  ExternalLink,
  FileText,
  X,
  Droplets,
  CircleDot,
  TreePine,
  HelpCircle,
} from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { HazardItem } from '../constants/hazardTypes';
import { authService, moderationService, adminService } from '../services/apiClient';

interface DashboardScreenNativeProps {
  hazards: HazardItem[];
  onOpenReport: () => void;
  onOpenMap: () => void;
  onOpenAuth?: () => void;
}

type DashboardTab = 'reports' | 'impact' | 'settings' | 'moderator' | 'admin';

export const DashboardScreenNative: React.FC<DashboardScreenNativeProps> = ({
  hazards,
  onOpenReport,
  onOpenMap,
  onOpenAuth,
}) => {
  const { isDark, theme } = useTheme();
  const { user, isAuthenticated, isAdmin, isModerator, logout, refreshMe } = useAuth();
  const { width: windowWidth } = useWindowDimensions();

  const [activeTab, setActiveTab] = useState<DashboardTab>('reports');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [ordering, setOrdering] = useState('-created_at');

  // Commuter's personal reports
  const [myReports, setMyReports] = useState<HazardItem[]>([]);
  const [loadingMyReports, setLoadingMyReports] = useState(false);
  const [summaryData, setSummaryData] = useState<any>(null);

  // Profile Edit State
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Moderator Queue State
  const [moderationReports, setModerationReports] = useState<any[]>([]);
  const [loadingModeration, setLoadingModeration] = useState(false);
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [moderationStats, setModerationStats] = useState<any>(null);

  // Moderation Action Modal
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [selectedHazardForAction, setSelectedHazardForAction] = useState<any>(null);
  const [actionType, setActionType] = useState<'confirm' | 'resolve' | 'review'>('confirm');
  const [actionReason, setActionReason] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Admin Operational Settings
  const [adminStats, setAdminStats] = useState<any>(null);
  const [adminSettings, setAdminSettings] = useState<any>({
    confirmation_threshold: 3,
    freshness_hours: 48,
    max_upload_size_mb: 5,
  });
  const [loadingAdmin, setLoadingAdmin] = useState(false);

  // Populate profile fields from auth
  useEffect(() => {
    if (user) {
      setDisplayName(user.display_name || user.username || '');
      setEmail(user.email || '');
    }
  }, [user]);

  // Load My Reports and Summary
  const loadPersonalReports = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoadingMyReports(true);
    try {
      const params: Record<string, any> = {};
      if (statusFilter && statusFilter !== 'all') params.status = statusFilter;
      if (categoryFilter && categoryFilter !== 'all') params.category = categoryFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (ordering) params.ordering = ordering;

      const [reportsResp, summaryResp] = await Promise.all([
        authService.getMyReports(params).catch(() => []),
        authService.getDashboardSummary().catch(() => null),
      ]);
      setMyReports(Array.isArray(reportsResp) ? reportsResp : []);
      if (summaryResp) setSummaryData(summaryResp);
    } catch {
      // Handled in catch
    } finally {
      setLoadingMyReports(false);
    }
  }, [isAuthenticated, statusFilter, categoryFilter, searchQuery, ordering]);

  useEffect(() => {
    if (isAuthenticated) {
      loadPersonalReports();
    }
  }, [isAuthenticated, loadPersonalReports]);

  // Load Moderation Queue
  const loadModerationData = useCallback(async () => {
    if (!isModerator && !isAdmin) return;
    setLoadingModeration(true);
    try {
      const [queueData, stats] = await Promise.all([
        moderationService.getReports(flaggedOnly ? { flagged_only: true } : {}),
        moderationService.getStats().catch(() => null),
      ]);
      const items = Array.isArray(queueData)
        ? queueData
        : queueData?.results || [];
      setModerationReports(items);
      if (stats) setModerationStats(stats);
    } catch {
      // Fallback to community hazards under review
      const filtered = hazards.filter(
        (h) => h.status === 'under_review' || (flaggedOnly && (h.flags_count || 0) > 0)
      );
      setModerationReports(filtered);
    } finally {
      setLoadingModeration(false);
    }
  }, [isModerator, isAdmin, flaggedOnly, hazards]);

  useEffect(() => {
    if (activeTab === 'moderator') {
      loadModerationData();
    }
  }, [activeTab, loadModerationData]);

  // Load Admin Data
  const loadAdminData = useCallback(async () => {
    if (!isAdmin) return;
    setLoadingAdmin(true);
    try {
      const [stats, settings] = await Promise.all([
        adminService.getStats().catch(() => null),
        adminService.getSettings().catch(() => null),
      ]);
      if (stats) setAdminStats(stats);
      if (settings) setAdminSettings(settings);
    } catch {
      // Fallback
    } finally {
      setLoadingAdmin(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (activeTab === 'admin') {
      loadAdminData();
    }
  }, [activeTab, loadAdminData]);

  // Handle Profile Update
  const handleProfileSave = async () => {
    setProfileError('');
    setProfileSuccess('');
    if (!displayName.trim()) {
      setProfileError('Please enter a valid display name.');
      return;
    }
    setUpdatingProfile(true);
    try {
      await authService.updateProfile({
        display_name: displayName.trim(),
        email: email.trim().toLowerCase(),
      });
      await refreshMe();
      setProfileSuccess('Profile updated successfully.');
      setTimeout(() => setProfileSuccess(''), 4000);
    } catch (err: any) {
      setProfileError(err?.message || 'Could not update profile. Try again.');
    } finally {
      setUpdatingProfile(false);
    }
  };

  // Moderation Action Handler
  const handleOpenActionModal = (hazard: any, type: 'confirm' | 'resolve' | 'review') => {
    setSelectedHazardForAction(hazard);
    setActionType(type);
    setActionReason('');
    setActionError('');
    setActionSuccess('');
    setActionModalVisible(true);
  };

  const handleSubmitModerationAction = async () => {
    if (!actionReason.trim() || actionReason.trim().length < 3) {
      setActionError('Please provide an explanatory reason (minimum 3 characters).');
      return;
    }
    setSubmittingAction(true);
    setActionError('');
    try {
      await moderationService.takeAction(selectedHazardForAction.id, {
        action: actionType,
        reason: actionReason.trim(),
      });
      setActionSuccess('Action recorded successfully.');
      setTimeout(() => {
        setActionModalVisible(false);
        loadModerationData();
      }, 1000);
    } catch (err: any) {
      setActionError(err?.message || 'Failed to submit action.');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Metrics computation (using user reports or global community hazards)
  const displayedReports = isAuthenticated ? myReports : hazards;
  const metrics = summaryData?.metrics || {
    total_reports: displayedReports.length,
    active_reports: displayedReports.filter((r) => r.status === 'reported' || r.status === 'community_confirmed').length,
    confirmed_reports: displayedReports.filter((r) => r.status === 'community_confirmed').length,
    resolved_reports: displayedReports.filter((r) => r.status === 'resolved').length,
    confirmations_received: displayedReports.reduce((acc, r) => acc + (r.confirmations_count || 0), 0),
  };

  // Filter personal reports
  const filteredPersonalReports = myReports.filter((r) => {
    if (statusFilter === 'all') return true;
    return r.status === statusFilter;
  });

  const isWide = windowWidth > 500;

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
      {/* 1. Welcome User Banner matching Web App Header */}
      <View
        style={[
          styles.welcomeCard,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
          },
        ]}
      >
        <View style={styles.welcomeTop}>
          <View style={[styles.avatarBox, { backgroundColor: isDark ? '#13353A' : '#E6F4F6' }]}>
            {user ? (
              <Text style={[styles.avatarInitial, { color: theme.teal }]}>
                {(user.display_name || user.username).substring(0, 2).toUpperCase()}
              </Text>
            ) : (
              <User size={28} color={theme.teal} />
            )}
          </View>

          <View style={styles.welcomeMeta}>
            <View style={styles.nameRow}>
              <Text style={[styles.userName, { color: theme.textPrimary }]} numberOfLines={1}>
                {user ? user.display_name || user.username : 'Guest Commuter'}
              </Text>
              <View
                style={[
                  styles.rolePill,
                  {
                    backgroundColor: isAdmin
                      ? 'rgba(129, 140, 248, 0.15)'
                      : isModerator
                      ? 'rgba(251, 191, 36, 0.15)'
                      : 'rgba(39, 134, 91, 0.12)',
                    borderColor: isAdmin ? '#818CF8' : isModerator ? '#FBBF24' : '#27865B',
                  },
                ]}
              >
                <ShieldCheck
                  size={12}
                  color={isAdmin ? '#818CF8' : isModerator ? '#FBBF24' : '#27865B'}
                />
                <Text
                  style={[
                    styles.rolePillText,
                    { color: isAdmin ? '#818CF8' : isModerator ? '#FBBF24' : '#27865B' },
                  ]}
                >
                  {isAdmin
                    ? 'Platform Administrator'
                    : isModerator
                    ? 'Safety Moderator'
                    : isAuthenticated
                    ? 'Citizen Contributor'
                    : 'Community Guest'}
                </Text>
              </View>
            </View>

            <Text style={[styles.userSubTitle, { color: theme.textMuted }]}>
              {user
                ? `@${user.username} \u2022 RouteX Verified Contributor`
                : 'Browse live hazards \u2022 Sign in to track reports & earn badges'}
            </Text>
          </View>
        </View>

        {/* Action Buttons Row */}
        <View style={styles.bannerActions}>
          <TouchableOpacity
            style={[styles.primaryActionBtn, { backgroundColor: theme.teal }]}
            onPress={onOpenReport}
            activeOpacity={0.85}
          >
            <PlusCircle size={15} color="#FFFFFF" strokeWidth={2.5} />
            <Text style={styles.primaryActionText}>Report Hazard</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.secondaryActionBtn,
              { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
            ]}
            onPress={onOpenMap}
            activeOpacity={0.8}
          >
            <MapPin size={15} color={theme.teal} />
            <Text style={[styles.secondaryActionText, { color: theme.textPrimary }]}>Live Map</Text>
          </TouchableOpacity>

          {!isAuthenticated && onOpenAuth && (
            <TouchableOpacity
              style={[
                styles.secondaryActionBtn,
                { backgroundColor: theme.surfaceSubtle, borderColor: theme.teal },
              ]}
              onPress={onOpenAuth}
              activeOpacity={0.8}
            >
              <LogIn size={15} color={theme.teal} />
              <Text style={[styles.secondaryActionText, { color: theme.teal }]}>Sign In</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 2. Web App Style 2x2 Metrics Overview Cards */}
      <View style={styles.metricsGrid}>
        {/* Card 1: Total Submissions */}
        <View
          style={[
            styles.metricCard,
            { width: isWide ? '23.5%' : '48%', backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <View style={styles.metricHeader}>
            <Text style={[styles.metricLabel, { color: theme.textMuted }]}>TOTAL SUBMISSIONS</Text>
            <AlertTriangle size={15} color="#F2B544" />
          </View>
          <Text style={[styles.metricValue, { color: theme.textPrimary }]}>
            {metrics.total_reports}
          </Text>
          <Text style={[styles.metricSub, { color: theme.textMuted }]}>
            Ground observations shared
          </Text>
        </View>

        {/* Card 2: Confirmations Received */}
        <View
          style={[
            styles.metricCard,
            { width: isWide ? '23.5%' : '48%', backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <View style={styles.metricHeader}>
            <Text style={[styles.metricLabel, { color: theme.textMuted }]}>CONFIRMATIONS</Text>
            <HeartHandshake size={15} color={theme.teal} />
          </View>
          <Text style={[styles.metricValue, { color: theme.teal }]}>
            {metrics.confirmations_received}
          </Text>
          <Text style={[styles.metricSub, { color: theme.textMuted }]}>
            Verified by commuters
          </Text>
        </View>

        {/* Card 3: Active Hazards */}
        <View
          style={[
            styles.metricCard,
            { width: isWide ? '23.5%' : '48%', backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <View style={styles.metricHeader}>
            <Text style={[styles.metricLabel, { color: theme.textMuted }]}>ACTIVE HAZARDS</Text>
            <Clock size={15} color="#FB923C" />
          </View>
          <Text style={[styles.metricValue, { color: theme.textPrimary }]}>
            {metrics.active_reports}
          </Text>
          <Text style={[styles.metricSub, { color: theme.textMuted }]}>
            Alerting road users
          </Text>
        </View>

        {/* Card 4: Resolved / Cleared */}
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
          <Text style={[styles.metricValue, { color: '#27865B' }]}>
            {metrics.resolved_reports}
          </Text>
          <Text style={[styles.metricSub, { color: theme.textMuted }]}>
            Corridors cleared
          </Text>
        </View>
      </View>

      {/* 3. Tab Bar Navigation (Underline Style like Web App) */}
      <View style={[styles.tabBarWrapper, { borderBottomColor: theme.border }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScroll}
        >
          {/* Tab 1: My Reports */}
          <TouchableOpacity
            style={[
              styles.navTab,
              activeTab === 'reports' && [styles.activeNavTab, { borderBottomColor: theme.teal }],
            ]}
            onPress={() => setActiveTab('reports')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.navTabText,
                { color: activeTab === 'reports' ? theme.teal : theme.textMuted },
                activeTab === 'reports' && styles.activeNavTabText,
              ]}
            >
              My Road Reports ({isAuthenticated ? myReports.length : hazards.length})
            </Text>
          </TouchableOpacity>

          {/* Tab 2: Community Impact & Badges */}
          <TouchableOpacity
            style={[
              styles.navTab,
              activeTab === 'impact' && [styles.activeNavTab, { borderBottomColor: theme.teal }],
            ]}
            onPress={() => setActiveTab('impact')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.navTabText,
                { color: activeTab === 'impact' ? theme.teal : theme.textMuted },
                activeTab === 'impact' && styles.activeNavTabText,
              ]}
            >
              Impact & Badges
            </Text>
          </TouchableOpacity>

          {/* Tab 3: Account & Profile */}
          <TouchableOpacity
            style={[
              styles.navTab,
              activeTab === 'settings' && [styles.activeNavTab, { borderBottomColor: theme.teal }],
            ]}
            onPress={() => setActiveTab('settings')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.navTabText,
                { color: activeTab === 'settings' ? theme.teal : theme.textMuted },
                activeTab === 'settings' && styles.activeNavTabText,
              ]}
            >
              Account & Profile
            </Text>
          </TouchableOpacity>

          {/* Tab 4: Moderator Queue (if Moderator or Admin) */}
          {(isModerator || isAdmin) && (
            <TouchableOpacity
              style={[
                styles.navTab,
                activeTab === 'moderator' && [styles.activeNavTab, { borderBottomColor: '#FBBF24' }],
              ]}
              onPress={() => setActiveTab('moderator')}
              activeOpacity={0.7}
            >
              <Shield size={14} color={activeTab === 'moderator' ? '#FBBF24' : theme.textMuted} />
              <Text
                style={[
                  styles.navTabText,
                  { color: activeTab === 'moderator' ? '#FBBF24' : theme.textMuted },
                  activeTab === 'moderator' && styles.activeNavTabText,
                ]}
              >
                Moderator Queue
              </Text>
            </TouchableOpacity>
          )}

          {/* Tab 5: Admin Operations (if Admin) */}
          {isAdmin && (
            <TouchableOpacity
              style={[
                styles.navTab,
                activeTab === 'admin' && [styles.activeNavTab, { borderBottomColor: '#818CF8' }],
              ]}
              onPress={() => setActiveTab('admin')}
              activeOpacity={0.7}
            >
              <Sliders size={14} color={activeTab === 'admin' ? '#818CF8' : theme.textMuted} />
              <Text
                style={[
                  styles.navTabText,
                  { color: activeTab === 'admin' ? '#818CF8' : theme.textMuted },
                  activeTab === 'admin' && styles.activeNavTabText,
                ]}
              >
                Admin Portal
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      {/* 4. Tab 1: My Road Reports Content */}
      {activeTab === 'reports' && (
        <View style={styles.tabSection}>
          {/* Status Filter Buttons Bar */}
          <View style={styles.filterRow}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statusChips}>
              {['all', 'reported', 'community_confirmed', 'resolved'].map((st) => (
                <TouchableOpacity
                  key={st}
                  style={[
                    styles.statusChip,
                    statusFilter === st
                      ? [styles.statusChipActive, { backgroundColor: isDark ? '#FFFFFF' : '#142B3B' }]
                      : [styles.statusChipInactive, { backgroundColor: theme.surface, borderColor: theme.border }],
                  ]}
                  onPress={() => setStatusFilter(st)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.statusChipText,
                      {
                        color:
                          statusFilter === st
                            ? isDark
                              ? '#142B3B'
                              : '#FFFFFF'
                            : theme.textSecondary,
                      },
                    ]}
                  >
                    {st === 'all'
                      ? 'All Reports'
                      : st === 'community_confirmed'
                      ? 'Confirmed'
                      : st.charAt(0).toUpperCase() + st.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {isAuthenticated && (
              <TouchableOpacity
                onPress={loadPersonalReports}
                style={styles.refreshBtn}
                activeOpacity={0.7}
              >
                <RefreshCw size={13} color={theme.textMuted} />
                <Text style={[styles.refreshText, { color: theme.textMuted }]}>Refresh</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Reports Feed */}
          {!isAuthenticated ? (
            <View style={[styles.guestCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={[styles.guestIconBox, { backgroundColor: theme.tealLight }]}>
                <User size={32} color={theme.teal} />
              </View>
              <Text style={[styles.guestTitle, { color: theme.textPrimary }]}>
                Track Your Road Hazard Submissions
              </Text>
              <Text style={[styles.guestSub, { color: theme.textMuted }]}>
                Sign in or register for a free RouteX account to monitor peer confirmations, track clearances, and build your civic score.
              </Text>
              <TouchableOpacity
                style={[styles.primaryActionBtn, { backgroundColor: theme.teal, width: '100%', marginTop: 8 }]}
                onPress={onOpenAuth}
                activeOpacity={0.8}
              >
                <LogIn size={15} color="#FFFFFF" />
                <Text style={styles.primaryActionText}>Sign In / Register</Text>
              </TouchableOpacity>
            </View>
          ) : loadingMyReports ? (
            <ActivityIndicator size="small" color={theme.teal} style={{ marginVertical: 24 }} />
          ) : filteredPersonalReports.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <CheckCircle2 size={36} color={theme.teal} style={{ marginBottom: 6 }} />
              <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
                {myReports.length === 0 ? 'No Reports Submitted Yet' : 'No Matching Reports'}
              </Text>
              <Text style={[styles.emptySub, { color: theme.textMuted }]}>
                {myReports.length === 0
                  ? 'Help fellow commuters by reporting floodwaters, potholes, or blockages on your route.'
                  : 'No submitted hazards match the current filter.'}
              </Text>
              <TouchableOpacity
                style={[styles.primaryActionBtn, { backgroundColor: theme.teal, marginTop: 10 }]}
                onPress={onOpenReport}
                activeOpacity={0.8}
              >
                <PlusCircle size={15} color="#FFFFFF" />
                <Text style={styles.primaryActionText}>Submit First Hazard</Text>
              </TouchableOpacity>
            </View>
          ) : (
            filteredPersonalReports.map((report) => (
              <View
                key={report.id}
                style={[styles.reportItemCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
              >
                {/* Header row */}
                <View style={styles.reportTopRow}>
                  <View style={styles.reportCatBadge}>
                    {renderCategoryIcon(report.category)}
                    <Text style={[styles.reportCatText, { color: theme.textPrimary }]}>
                      {report.category?.replace('_', ' ')?.toUpperCase() || 'HAZARD'}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusPillBadge,
                      {
                        backgroundColor:
                          report.status === 'resolved'
                            ? 'rgba(39, 134, 91, 0.15)'
                            : report.status === 'community_confirmed'
                            ? 'rgba(8, 127, 140, 0.15)'
                            : 'rgba(242, 181, 68, 0.15)',
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
                      {report.status === 'community_confirmed' ? 'CONFIRMED' : report.status?.toUpperCase()}
                    </Text>
                  </View>
                </View>

                {/* Title & Description */}
                <Text style={[styles.reportLocation, { color: theme.textPrimary }]}>
                  {report.location_name || report.location_label || 'Reported Location'}
                </Text>
                <Text style={[styles.reportDesc, { color: theme.textSecondary }]} numberOfLines={2}>
                  {report.description}
                </Text>

                {/* Optional photo */}
                {report.photo && (
                  <View style={styles.reportThumbWrapper}>
                    <Image source={{ uri: report.photo }} style={styles.reportThumb} />
                  </View>
                )}

                {/* Footer metrics & map link */}
                <View style={[styles.reportFooter, { borderTopColor: theme.borderSubtle }]}>
                  <View style={styles.confirmationsRow}>
                    <CheckCircle2 size={13} color={theme.teal} />
                    <Text style={[styles.confirmationsText, { color: theme.teal }]}>
                      {report.confirmations_count || 0} confirmation{report.confirmations_count !== 1 ? 's' : ''}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.inspectMapBtn}
                    onPress={onOpenMap}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.inspectMapText, { color: theme.teal }]}>Inspect on Map</Text>
                    <ExternalLink size={12} color={theme.teal} />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      )}

      {/* 5. Tab 2: Community Impact & Badges */}
      {activeTab === 'impact' && (
        <View style={styles.tabSection}>
          <View style={[styles.impactCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.impactTitleRow}>
              <Flame size={20} color="#F59E0B" />
              <Text style={[styles.impactTitle, { color: theme.textPrimary }]}>
                Your Civic Road Contribution
              </Text>
            </View>
            <Text style={[styles.impactDesc, { color: theme.textSecondary }]}>
              Every hazard you document alerts fellow commuters and transit operators. Community ground truth helps everyone make safer travel choices.
            </Text>

            {/* 3 Impact Stat Boxes */}
            <View style={styles.impactGrid}>
              <View
                style={[
                  styles.impactBox,
                  { backgroundColor: isDark ? 'rgba(8, 127, 140, 0.15)' : '#E6F4F6', borderColor: theme.teal },
                ]}
              >
                <Text style={[styles.impactBoxLabel, { color: theme.teal }]}>VERIFICATION RATE</Text>
                <Text style={[styles.impactBoxValue, { color: theme.teal }]}>
                  {myReports.length > 0
                    ? `${Math.round((metrics.confirmed_reports / myReports.length) * 100)}%`
                    : '100%'}
                </Text>
                <Text style={[styles.impactBoxSub, { color: theme.textMuted }]}>
                  Confirmed by peers
                </Text>
              </View>

              <View
                style={[
                  styles.impactBox,
                  { backgroundColor: isDark ? 'rgba(242, 181, 68, 0.15)' : '#FEF7E6', borderColor: '#F2B544' },
                ]}
              >
                <Text style={[styles.impactBoxLabel, { color: '#D97706' }]}>COMMUNITY BADGE</Text>
                <Text style={[styles.impactBoxValue, { color: '#D97706', fontSize: 16 }]}>
                  {myReports.length >= 10
                    ? 'Corridor Sentinel'
                    : myReports.length >= 3
                    ? 'Active Scout'
                    : 'Civic Observer'}
                </Text>
                <Text style={[styles.impactBoxSub, { color: theme.textMuted }]}>
                  Based on reports
                </Text>
              </View>

              <View
                style={[
                  styles.impactBox,
                  { backgroundColor: isDark ? 'rgba(39, 134, 91, 0.15)' : '#EAF6F0', borderColor: '#27865B' },
                ]}
              >
                <Text style={[styles.impactBoxLabel, { color: '#27865B' }]}>CLEARED IMPACT</Text>
                <Text style={[styles.impactBoxValue, { color: '#27865B' }]}>
                  {metrics.resolved_reports}
                </Text>
                <Text style={[styles.impactBoxSub, { color: theme.textMuted }]}>
                  Corridors restored
                </Text>
              </View>
            </View>
          </View>

          {/* Citizen Road Safety Pledge Guidelines */}
          <View style={[styles.guidelinesCard, { backgroundColor: theme.surfaceSubtle, borderColor: theme.border }]}>
            <View style={styles.guidelineHeader}>
              <ShieldCheck size={18} color={theme.teal} />
              <Text style={[styles.guidelineTitle, { color: theme.textPrimary }]}>
                RouteX Citizen Observer Guidelines
              </Text>
            </View>

            <View style={styles.guidelinesList}>
              <View style={styles.guidelineItem}>
                <Check size={16} color="#16A34A" style={styles.checkIcon} />
                <Text style={[styles.guidelineText, { color: theme.textSecondary }]}>
                  <Text style={{ fontWeight: '700', color: theme.textPrimary }}>Never report while driving:</Text>{' '}
                  Only take photos and mark coordinates when parked safely or as a passenger.
                </Text>
              </View>

              <View style={styles.guidelineItem}>
                <Check size={16} color="#16A34A" style={styles.checkIcon} />
                <Text style={[styles.guidelineText, { color: theme.textSecondary }]}>
                  <Text style={{ fontWeight: '700', color: theme.textPrimary }}>Factual descriptions:</Text>{' '}
                  Note exact road conditions (e.g. "Water 15cm deep over right 2 lanes") rather than guessing.
                </Text>
              </View>

              <View style={styles.guidelineItem}>
                <Check size={16} color="#16A34A" style={styles.checkIcon} />
                <Text style={[styles.guidelineText, { color: theme.textSecondary }]}>
                  <Text style={{ fontWeight: '700', color: theme.textPrimary }}>Accurate corridor pinning:</Text>{' '}
                  Ensure the GPS anchor is aligned to the road corridor to trigger timely proximity alerts.
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* 6. Tab 3: Account & Profile Settings */}
      {activeTab === 'settings' && (
        <View style={styles.tabSection}>
          <View style={[styles.formCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.formHeader}>
              <Edit3 size={18} color={theme.teal} />
              <Text style={[styles.formTitle, { color: theme.textPrimary }]}>
                Personal Profile Details
              </Text>
            </View>

            {profileSuccess ? (
              <View style={[styles.bannerSuccess, { backgroundColor: isDark ? '#143826' : '#DCFCE7' }]}>
                <CheckCircle2 size={15} color="#16A34A" />
                <Text style={styles.bannerSuccessText}>{profileSuccess}</Text>
              </View>
            ) : null}

            {profileError ? (
              <View style={[styles.bannerError, { backgroundColor: isDark ? '#3D1B1B' : '#FDF0F0' }]}>
                <AlertTriangle size={15} color="#F87171" />
                <Text style={styles.bannerErrorText}>{profileError}</Text>
              </View>
            ) : null}

            {/* Display Name Field */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>Display Name</Text>
              <TextInput
                style={[
                  styles.inputField,
                  {
                    backgroundColor: theme.surfaceSubtle,
                    borderColor: theme.border,
                    color: theme.textPrimary,
                  },
                ]}
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Your preferred commuter name"
                placeholderTextColor={theme.textMuted}
                editable={isAuthenticated}
              />
            </View>

            {/* Email Field */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>Email Address</Text>
              <TextInput
                style={[
                  styles.inputField,
                  {
                    backgroundColor: theme.surfaceSubtle,
                    borderColor: theme.border,
                    color: theme.textPrimary,
                  },
                ]}
                value={email}
                onChangeText={setEmail}
                placeholder="name@example.com"
                placeholderTextColor={theme.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={isAuthenticated}
              />
            </View>

            {isAuthenticated ? (
              <TouchableOpacity
                style={[styles.primaryActionBtn, { backgroundColor: theme.teal, marginTop: 4 }]}
                onPress={handleProfileSave}
                disabled={updatingProfile}
                activeOpacity={0.8}
              >
                {updatingProfile ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Check size={15} color="#FFFFFF" />
                    <Text style={styles.primaryActionText}>Save Profile Changes</Text>
                  </>
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.primaryActionBtn, { backgroundColor: theme.teal, marginTop: 4 }]}
                onPress={onOpenAuth}
                activeOpacity={0.8}
              >
                <LogIn size={15} color="#FFFFFF" />
                <Text style={styles.primaryActionText}>Sign In to Manage Profile</Text>
              </TouchableOpacity>
            )}

            {/* Sign Out Button */}
            {isAuthenticated && (
              <TouchableOpacity
                style={[styles.signOutOutlineBtn, { borderColor: '#F87171', marginTop: 10 }]}
                onPress={() => {
                  Alert.alert('Sign Out', 'Sign out of your current RouteX session?', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Sign Out', style: 'destructive', onPress: logout },
                  ]);
                }}
                activeOpacity={0.8}
              >
                <LogOut size={15} color="#DC2626" />
                <Text style={styles.signOutOutlineText}>Sign Out of RouteX</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* 7. Tab 4: Moderator Queue (for Moderators & Admins) */}
      {activeTab === 'moderator' && (
        <View style={styles.tabSection}>
          <View style={[styles.formCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.formHeader}>
              <Shield size={18} color="#FBBF24" />
              <Text style={[styles.formTitle, { color: theme.textPrimary }]}>
                Safety Team Moderation Queue
              </Text>
            </View>
            <Text style={[styles.impactDesc, { color: theme.textSecondary }]}>
              Verify reported conditions, inspect flagged hazards, and mark corridors resolved.
            </Text>

            {/* Filter Toggle */}
            <View style={styles.modFilterRow}>
              <TouchableOpacity
                style={[
                  styles.statusChip,
                  !flaggedOnly
                    ? [styles.statusChipActive, { backgroundColor: theme.teal }]
                    : [styles.statusChipInactive, { backgroundColor: theme.surfaceSubtle, borderColor: theme.border }],
                ]}
                onPress={() => setFlaggedOnly(false)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.statusChipText,
                    { color: !flaggedOnly ? '#FFFFFF' : theme.textSecondary },
                  ]}
                >
                  All Queue Items
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.statusChip,
                  flaggedOnly
                    ? [styles.statusChipActive, { backgroundColor: '#F59E0B' }]
                    : [styles.statusChipInactive, { backgroundColor: theme.surfaceSubtle, borderColor: theme.border }],
                ]}
                onPress={() => setFlaggedOnly(true)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.statusChipText,
                    { color: flaggedOnly ? '#FFFFFF' : theme.textSecondary },
                  ]}
                >
                  Flagged Only
                </Text>
              </TouchableOpacity>
            </View>

            {/* Queue Items */}
            {loadingModeration ? (
              <ActivityIndicator size="small" color={theme.teal} style={{ marginVertical: 20 }} />
            ) : moderationReports.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: theme.surfaceSubtle, borderColor: theme.border }]}>
                <CheckCircle2 size={32} color="#16A34A" />
                <Text style={[styles.emptyTitle, { color: theme.textPrimary, marginTop: 4 }]}>
                  Queue Clean & Up-to-Date
                </Text>
                <Text style={[styles.emptySub, { color: theme.textMuted }]}>
                  All reports in the active window have been verified or resolved.
                </Text>
              </View>
            ) : (
              moderationReports.slice(0, 10).map((item) => (
                <View
                  key={item.id}
                  style={[styles.queueItemCard, { backgroundColor: theme.surfaceSubtle, borderColor: theme.border }]}
                >
                  <View style={styles.queueItemHeader}>
                    <Text style={[styles.queueItemTitle, { color: theme.textPrimary }]}>
                      {item.location_name || item.location_label || 'Reported Hazard'}
                    </Text>
                    <Text style={[styles.queueItemCat, { color: theme.teal }]}>
                      {item.category?.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={[styles.queueItemDesc, { color: theme.textSecondary }]} numberOfLines={2}>
                    {item.description}
                  </Text>

                  {/* Moderation Action Buttons */}
                  <View style={styles.queueActionsRow}>
                    <TouchableOpacity
                      style={[styles.modActionBtn, { backgroundColor: '#16A34A' }]}
                      onPress={() => handleOpenActionModal(item, 'confirm')}
                      activeOpacity={0.8}
                    >
                      <Check size={12} color="#FFFFFF" />
                      <Text style={styles.modActionText}>Confirm</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.modActionBtn, { backgroundColor: '#2563EB' }]}
                      onPress={() => handleOpenActionModal(item, 'resolve')}
                      activeOpacity={0.8}
                    >
                      <CheckCircle2 size={12} color="#FFFFFF" />
                      <Text style={styles.modActionText}>Resolve</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.modActionBtn, { backgroundColor: '#DC2626' }]}
                      onPress={() => handleOpenActionModal(item, 'review')}
                      activeOpacity={0.8}
                    >
                      <AlertTriangle size={12} color="#FFFFFF" />
                      <Text style={styles.modActionText}>Flag/Review</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>
      )}

      {/* 8. Tab 5: Admin Operations (for Admins) */}
      {activeTab === 'admin' && (
        <View style={styles.tabSection}>
          <View style={[styles.formCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.formHeader}>
              <Sliders size={18} color="#818CF8" />
              <Text style={[styles.formTitle, { color: theme.textPrimary }]}>
                Platform Operational Parameters
              </Text>
            </View>

            <View style={styles.adminParamsGrid}>
              <View style={[styles.adminParamCard, { backgroundColor: theme.surfaceSubtle }]}>
                <Text style={[styles.adminParamTitle, { color: theme.textPrimary }]}>
                  Auto-Confirmation Threshold
                </Text>
                <Text style={[styles.adminParamVal, { color: theme.teal }]}>
                  {adminSettings.confirmation_threshold || 3} Votes
                </Text>
                <Text style={[styles.adminParamSub, { color: theme.textMuted }]}>
                  Peer validations to promote hazard
                </Text>
              </View>

              <View style={[styles.adminParamCard, { backgroundColor: theme.surfaceSubtle }]}>
                <Text style={[styles.adminParamTitle, { color: theme.textPrimary }]}>
                  Hazard Freshness Window
                </Text>
                <Text style={[styles.adminParamVal, { color: theme.teal }]}>
                  {adminSettings.freshness_hours || 48} Hours
                </Text>
                <Text style={[styles.adminParamSub, { color: theme.textMuted }]}>
                  Duration before reports expire
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.primaryActionBtn, { backgroundColor: '#818CF8', marginTop: 12 }]}
              onPress={() =>
                Alert.alert(
                  'Admin Operational Status',
                  `Platform backend: Active & Synchronized\nThreshold: ${adminSettings.confirmation_threshold || 3} votes\nWindow: ${adminSettings.freshness_hours || 48} hours`
                )
              }
              activeOpacity={0.8}
            >
              <Settings size={15} color="#FFFFFF" />
              <Text style={styles.primaryActionText}>View System Telemetry</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 9. Moderation Action Modal with Safe Keyboard Avoidance */}
      <Modal
        visible={actionModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setActionModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            style={styles.keyboardAvoider}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
          >
            <View style={[styles.actionModalCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              {/* Header */}
              <View style={[styles.actionModalHeader, { borderBottomColor: theme.borderSubtle }]}>
                <View style={styles.actionModalTitleRow}>
                  <Shield size={18} color={theme.teal} />
                  <Text style={[styles.actionModalTitle, { color: theme.textPrimary }]}>
                    Moderation Action: {actionType.toUpperCase()}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setActionModalVisible(false)}
                  style={styles.modalCloseBtn}
                  activeOpacity={0.7}
                >
                  <X size={18} color={theme.textMuted} />
                </TouchableOpacity>
              </View>

              <ScrollView
                contentContainerStyle={styles.actionModalBody}
                keyboardShouldPersistTaps="handled"
              >
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

                <Text style={[styles.actionModalTarget, { color: theme.textSecondary }]}>
                  Target Hazard: <Text style={{ fontWeight: '700', color: theme.textPrimary }}>{selectedHazardForAction?.location_name || 'Selected Report'}</Text>
                </Text>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>
                    Action Reason / Moderator Note <Text style={{ color: '#DC2626' }}>*</Text>
                  </Text>
                  <TextInput
                    style={[
                      styles.textAreaField,
                      {
                        backgroundColor: theme.surfaceSubtle,
                        borderColor: theme.border,
                        color: theme.textPrimary,
                      },
                    ]}
                    value={actionReason}
                    onChangeText={setActionReason}
                    placeholder="Provide explanatory note for audit log..."
                    placeholderTextColor={theme.textMuted}
                    multiline
                    numberOfLines={3}
                  />
                </View>

                <View style={styles.actionModalBtnRow}>
                  <TouchableOpacity
                    style={[styles.cancelBtn, { backgroundColor: theme.surfaceSubtle, borderColor: theme.border }]}
                    onPress={() => setActionModalVisible(false)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.cancelBtnText, { color: theme.textPrimary }]}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.primaryActionBtn, { backgroundColor: theme.teal, flex: 1 }]}
                    onPress={handleSubmitModerationAction}
                    disabled={submittingAction}
                    activeOpacity={0.8}
                  >
                    {submittingAction ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.primaryActionText}>Apply Action</Text>
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
    gap: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
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
  avatarInitial: {
    fontSize: 17,
    fontWeight: '900',
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
  secondaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
  secondaryActionText: {
    fontSize: 12,
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
    marginTop: 1,
  },
  tabBarWrapper: {
    borderBottomWidth: 1,
    marginHorizontal: -2,
  },
  tabsScroll: {
    gap: 16,
    paddingHorizontal: 2,
  },
  navTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeNavTab: {
    borderBottomWidth: 2,
  },
  navTabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  activeNavTabText: {
    fontWeight: '800',
  },
  tabSection: {
    gap: 12,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  statusChips: {
    gap: 6,
  },
  statusChip: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusChipActive: {},
  statusChipInactive: {
    borderWidth: 1,
  },
  statusChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  refreshText: {
    fontSize: 11,
    fontWeight: '600',
  },
  guestCard: {
    alignItems: 'center',
    padding: 22,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  guestIconBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  guestTitle: {
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
  guestSub: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
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
  reportItemCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  reportTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reportCatBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reportCatText: {
    fontSize: 11,
    fontWeight: '800',
  },
  statusPillBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusPillText: {
    fontSize: 9,
    fontWeight: '900',
  },
  reportLocation: {
    fontSize: 14,
    fontWeight: '800',
  },
  reportDesc: {
    fontSize: 12,
    lineHeight: 17,
  },
  reportThumbWrapper: {
    height: 120,
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: 2,
  },
  reportThumb: {
    width: '100%',
    height: '100%',
  },
  reportFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: 8,
    marginTop: 2,
  },
  confirmationsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  confirmationsText: {
    fontSize: 11,
    fontWeight: '700',
  },
  inspectMapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  inspectMapText: {
    fontSize: 11,
    fontWeight: '700',
  },
  impactCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  impactTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  impactTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  impactDesc: {
    fontSize: 12,
    lineHeight: 17,
  },
  impactGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  impactBox: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 2,
  },
  impactBoxLabel: {
    fontSize: 9,
    fontWeight: '800',
  },
  impactBoxValue: {
    fontSize: 18,
    fontWeight: '900',
  },
  impactBoxSub: {
    fontSize: 9,
  },
  guidelinesCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  guidelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  guidelineTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  guidelinesList: {
    gap: 8,
  },
  guidelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  checkIcon: {
    marginTop: 2,
    flexShrink: 0,
  },
  guidelineText: {
    fontSize: 12,
    lineHeight: 17,
    flex: 1,
  },
  formCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  formTitle: {
    fontSize: 15,
    fontWeight: '800',
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
  inputGroup: {
    gap: 5,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  inputField: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
  },
  textAreaField: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  signOutOutlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  signOutOutlineText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '700',
  },
  modFilterRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 4,
  },
  queueItemCard: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    gap: 6,
  },
  queueItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  queueItemTitle: {
    fontSize: 13,
    fontWeight: '800',
    flex: 1,
  },
  queueItemCat: {
    fontSize: 10,
    fontWeight: '800',
  },
  queueItemDesc: {
    fontSize: 12,
  },
  queueActionsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  modActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  modActionText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  adminParamsGrid: {
    gap: 8,
    marginTop: 4,
  },
  adminParamCard: {
    padding: 12,
    borderRadius: 10,
    gap: 2,
  },
  adminParamTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  adminParamVal: {
    fontSize: 14,
    fontWeight: '900',
  },
  adminParamSub: {
    fontSize: 10,
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
  actionModalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionModalTitle: {
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
  actionModalTarget: {
    fontSize: 12,
  },
  actionModalBtnRow: {
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
});
