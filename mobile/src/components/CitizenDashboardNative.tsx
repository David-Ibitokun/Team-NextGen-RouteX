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
  Image,
  useWindowDimensions,
} from 'react-native';
import {
  User,
  ShieldCheck,
  AlertTriangle,
  HeartHandshake,
  Clock,
  CheckCircle2,
  PlusCircle,
  MapPin,
  LogIn,
  LogOut,
  RefreshCw,
  Flame,
  Check,
  Edit3,
  ExternalLink,
  Droplets,
  CircleDot,
  TreePine,
  HelpCircle,
  Search,
  Filter,
  X,
} from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { HazardItem } from '../constants/hazardTypes';
import { authService } from '../services/apiClient';
import { PaginationControlsNative } from './PaginationControlsNative';

interface CitizenDashboardNativeProps {
  hazards: HazardItem[];
  onOpenReport: () => void;
  onOpenMap: () => void;
  onOpenAuth?: () => void;
}

type TabType = 'reports' | 'impact' | 'settings';

export const CitizenDashboardNative: React.FC<CitizenDashboardNativeProps> = ({
  hazards,
  onOpenReport,
  onOpenMap,
  onOpenAuth,
}) => {
  const { isDark, theme } = useTheme();
  const { user, isAuthenticated, logout, deleteAccount, refreshMe } = useAuth();
  const { width: windowWidth } = useWindowDimensions();

  const [activeTab, setActiveTab] = useState<TabType>('reports');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [ordering, setOrdering] = useState('-created_at');

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [totalCount, setTotalCount] = useState(0);

  const [myReports, setMyReports] = useState<HazardItem[]>([]);
  const [loadingMyReports, setLoadingMyReports] = useState(false);
  const [summaryData, setSummaryData] = useState<any>(null);

  // Profile Edit State
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.display_name || user.username || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const loadPersonalReports = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoadingMyReports(true);
    try {
      const params: Record<string, any> = { page, page_size: pageSize };
      if (statusFilter && statusFilter !== 'all') params.status = statusFilter;
      if (categoryFilter && categoryFilter !== 'all') params.category = categoryFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (ordering) params.ordering = ordering;

      const [reportsResp, summaryResp] = await Promise.all([
        authService.getMyReports(params).catch(() => []),
        authService.getDashboardSummary().catch(() => null),
      ]);
      const items = Array.isArray(reportsResp) ? reportsResp : reportsResp?.results || [];
      const count = Array.isArray(reportsResp) ? reportsResp.length : reportsResp?.count ?? items.length;
      setMyReports(items);
      setTotalCount(count);
      if (summaryResp) setSummaryData(summaryResp);
    } catch {
      // Ignored
    } finally {
      setLoadingMyReports(false);
    }
  }, [isAuthenticated, page, pageSize, statusFilter, categoryFilter, searchQuery, ordering]);

  useEffect(() => {
    if (isAuthenticated) {
      loadPersonalReports();
    }
  }, [isAuthenticated, loadPersonalReports]);

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
      setProfileSuccess('Your profile details were updated successfully.');
      setTimeout(() => setProfileSuccess(''), 4000);
    } catch (err: any) {
      setProfileError(err?.message || 'Could not update profile.');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Permanently delete your RouteX account and profile? This cannot be undone. Your submitted road reports will remain publicly useful without your account attribution.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: async () => {
            setDeletingAccount(true);
            setProfileError('');
            try {
              await deleteAccount();
              setActiveTab('reports');
            } catch (err: any) {
              setProfileError(err?.message || 'Could not delete your account.');
            } finally {
              setDeletingAccount(false);
            }
          },
        },
      ],
    );
  };

  const displayedReports = isAuthenticated ? myReports : hazards;
  const metrics = summaryData?.metrics || {
    total_reports: displayedReports.length,
    active_reports: displayedReports.filter((r) => r.status === 'reported' || r.status === 'community_confirmed').length,
    confirmed_reports: displayedReports.filter((r) => r.status === 'community_confirmed').length,
    resolved_reports: displayedReports.filter((r) => r.status === 'resolved').length,
    confirmations_received: displayedReports.reduce((acc, r) => acc + (r.confirmations_count || 0), 0),
  };

  const clearFilters = () => {
    setStatusFilter('all');
    setCategoryFilter('all');
    setSearchQuery('');
    setOrdering('-created_at');
    setPage(1);
  };

  const hasActiveFilters =
    statusFilter !== 'all' ||
    categoryFilter !== 'all' ||
    searchQuery.trim() !== '' ||
    ordering !== '-created_at';

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
      {/* 1. Welcome User Banner */}
      <View style={[styles.welcomeCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.welcomeTop}>
          {/* <View style={[styles.avatarBox, { backgroundColor: isDark ? '#13353A' : '#E6F4F6' }]}>
            {user ? (
              <Text style={[styles.avatarInitial, { color: theme.teal }]}>
                {(user.display_name || user.username).substring(0, 2).toUpperCase()}
              </Text>
            ) : (
              <User size={28} color={theme.teal} />
            )}
          </View> */}

          <View style={styles.welcomeMeta}>
            <View style={styles.nameRow}>
              <Text style={[styles.userName, { color: theme.textPrimary }]} numberOfLines={1}>
                {user ? user.display_name || user.username : 'Guest Commuter'}
              </Text>
              <View
                style={[
                  styles.rolePill,
                  {
                    backgroundColor: 'rgba(39, 134, 91, 0.12)',
                    borderColor: '#27865B',
                  },
                ]}
              >
                <ShieldCheck size={12} color="#27865B" />
                <Text style={[styles.rolePillText, { color: '#27865B' }]}>
                  {isAuthenticated ? 'Citizen Contributor' : 'Community Guest'}
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

      {/* 2. Web App Style 2x2 Metrics Overview Grid */}
      <View style={styles.metricsGrid}>
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
          <Text style={[styles.metricValue, { color: theme.textPrimary }]}>{metrics.total_reports}</Text>
          <Text style={[styles.metricSub, { color: theme.textMuted }]}>Ground observations shared</Text>
        </View>

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
          <Text style={[styles.metricValue, { color: theme.teal }]}>{metrics.confirmations_received}</Text>
          <Text style={[styles.metricSub, { color: theme.textMuted }]}>Verified by commuters</Text>
        </View>

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
          <Text style={[styles.metricValue, { color: theme.textPrimary }]}>{metrics.active_reports}</Text>
          <Text style={[styles.metricSub, { color: theme.textMuted }]}>Alerting road users</Text>
        </View>

        <View
          style={[
            styles.metricCard,
            { width: isWide ? '23.5%' : '48%', backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <View style={styles.metricHeader}>
            <Text style={[styles.metricLabel, { color: theme.textMuted }]}>RESOLVED / CLEARED</Text>
            <CheckCircle2 size={15} color="#27865B" />
          </View>
          <Text style={[styles.metricValue, { color: '#27865B' }]}>{metrics.resolved_reports}</Text>
          <Text style={[styles.metricSub, { color: theme.textMuted }]}>Corridors cleared</Text>
        </View>
      </View>

      {/* 3. Underline Tab Bar */}
      <View style={[styles.tabBarWrapper, { borderBottomColor: theme.border }]}>
        <View style={styles.tabsRow}>
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
              My Road Reports ({isAuthenticated ? totalCount : hazards.length})
            </Text>
          </TouchableOpacity>

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
              Community Impact
            </Text>
          </TouchableOpacity>

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
        </View>
      </View>

      {/* 4. Tab 1: My Reports Content */}
      {activeTab === 'reports' && (
        <View style={styles.tabSection}>
          {/* Enhanced Filter & Search Card */}
          <View style={[styles.filterCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            {/* Header: Title, Live Database Count, Clear & Refresh */}
            <View style={styles.filterCardHeader}>
              <View style={styles.filterCardTitleRow}>
                <View style={[styles.filterIconBadge, { backgroundColor: theme.tealLight }]}>
                  <Filter size={14} color={theme.teal} />
                </View>
                <View>
                  <Text style={[styles.filterCardTitle, { color: theme.textPrimary }]}>Filter & Search</Text>
                  <Text style={[styles.filterCardSubtitle, { color: theme.textMuted }]}>
                    Showing {myReports.length} of {totalCount} reports from live database
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

                {isAuthenticated && (
                  <TouchableOpacity
                    onPress={loadPersonalReports}
                    style={[styles.refreshIconBtn, { backgroundColor: theme.surfaceSubtle, borderColor: theme.border }]}
                    activeOpacity={0.7}
                  >
                    <RefreshCw size={12} color={theme.teal} />
                    <Text style={[styles.refreshText, { color: theme.teal }]}>Sync</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Keyword Search Input */}
            <View style={[styles.searchInputWrapper, { backgroundColor: theme.surfaceSubtle, borderColor: theme.border }]}>
              <Search size={14} color={theme.textMuted} />
              <TextInput
                style={[styles.searchInputText, { color: theme.textPrimary }]}
                placeholder="Search street landmark or details..."
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

            {/* Category Filter Chips Horizontal Scroller */}
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

            {/* Status Filter Chips Row */}
            <View style={styles.statusChipsSection}>
              <Text style={[styles.filterSectionLabel, { color: theme.textMuted }]}>STATUS</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statusChipsScroll}>
                {[
                  { id: 'all', label: 'All Reports', count: summaryData?.metrics?.total_reports ?? myReports.length },
                  { id: 'reported', label: 'Reported', count: summaryData?.metrics?.active_reports ?? 0 },
                  { id: 'community_confirmed', label: 'Confirmed', count: summaryData?.metrics?.confirmed_reports ?? 0 },
                  { id: 'resolved', label: 'Resolved', count: summaryData?.metrics?.resolved_reports ?? 0 },
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
                        {st.label} ({st.count})
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>

          {!isAuthenticated ? (
            <View style={[styles.guestCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={[styles.guestIconBox, { backgroundColor: theme.tealLight }]}>
                <User size={32} color={theme.teal} />
              </View>
              <Text style={[styles.guestTitle, { color: theme.textPrimary }]}>
                Track Your Road Hazard Submissions
              </Text>
              <Text style={[styles.guestSub, { color: theme.textMuted }]}>
                Sign in to RouteX to monitor commuter verifications, clearance updates, and earn community badges.
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
          ) : myReports.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <CheckCircle2 size={36} color={theme.teal} style={{ marginBottom: 6 }} />
              <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
                {hasActiveFilters ? 'No Matching Reports Found' : 'No Reports Submitted Yet'}
              </Text>
              <Text style={[styles.emptySub, { color: theme.textMuted }]}>
                {hasActiveFilters
                  ? 'Try clearing or modifying your status, category, or search keywords.'
                  : 'Help fellow commuters by reporting floodwaters or potholes on your route.'}
              </Text>
              <TouchableOpacity
                style={[styles.primaryActionBtn, { backgroundColor: theme.teal, marginTop: 10 }]}
                onPress={hasActiveFilters ? clearFilters : onOpenReport}
                activeOpacity={0.8}
              >
                {hasActiveFilters ? <X size={15} color="#FFFFFF" /> : <PlusCircle size={15} color="#FFFFFF" />}
                <Text style={styles.primaryActionText}>
                  {hasActiveFilters ? 'Reset All Filters' : 'Submit First Hazard'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            myReports.map((report) => (
              <View
                key={report.id}
                style={[styles.reportItemCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
              >
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

                <Text style={[styles.reportLocation, { color: theme.textPrimary }]}>
                  {report.location_name || report.location_label || 'Reported Location'}
                </Text>
                <Text style={[styles.reportDesc, { color: theme.textSecondary }]} numberOfLines={2}>
                  {report.description}
                </Text>

                {report.photo && (
                  <View style={styles.reportThumbWrapper}>
                    <Image source={{ uri: report.photo }} style={styles.reportThumb} />
                  </View>
                )}

                <View style={[styles.reportFooter, { borderTopColor: theme.borderSubtle }]}>
                  <View style={styles.confirmationsRow}>
                    <CheckCircle2 size={13} color={theme.teal} />
                    <Text style={[styles.confirmationsText, { color: theme.teal }]}>
                      {report.confirmations_count || 0} confirmation{report.confirmations_count !== 1 ? 's' : ''}
                    </Text>
                  </View>

                  <TouchableOpacity style={styles.inspectMapBtn} onPress={onOpenMap} activeOpacity={0.7}>
                    <Text style={[styles.inspectMapText, { color: theme.teal }]}>Inspect on Map</Text>
                    <ExternalLink size={12} color={theme.teal} />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}

          {isAuthenticated && (
            <PaginationControlsNative
              currentPage={page}
              totalPages={Math.max(1, Math.ceil(totalCount / pageSize))}
              totalCount={totalCount}
              pageSize={pageSize}
              onPageChange={(p) => setPage(p)}
              loading={loadingMyReports}
            />
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
                <Text style={[styles.impactBoxSub, { color: theme.textMuted }]}>Confirmed by peers</Text>
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
                <Text style={[styles.impactBoxSub, { color: theme.textMuted }]}>Based on genuine reports</Text>
              </View>

              <View
                style={[
                  styles.impactBox,
                  { backgroundColor: isDark ? 'rgba(39, 134, 91, 0.15)' : '#EAF6F0', borderColor: '#27865B' },
                ]}
              >
                <Text style={[styles.impactBoxLabel, { color: '#27865B' }]}>CLEARED IMPACT</Text>
                <Text style={[styles.impactBoxValue, { color: '#27865B' }]}>{metrics.resolved_reports}</Text>
                <Text style={[styles.impactBoxSub, { color: theme.textMuted }]}>Corridors restored</Text>
              </View>
            </View>
          </View>

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
                  Only take photos and mark coordinates when safely parked or as a passenger.
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
                  Align the GPS anchor to the exact road corridor for reliable route alerts.
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
                placeholder="Your preferred name"
                placeholderTextColor={theme.textMuted}
                editable={isAuthenticated}
              />
            </View>

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

            {isAuthenticated && (
              <TouchableOpacity
                style={[styles.signOutOutlineBtn, { borderColor: '#B91C1C', marginTop: 10, opacity: deletingAccount ? 0.5 : 1 }]}
                onPress={handleDeleteAccount}
                disabled={deletingAccount}
                activeOpacity={0.8}
              >
                {deletingAccount ? <ActivityIndicator size="small" color="#B91C1C" /> : <AlertTriangle size={15} color="#B91C1C" />}
                <Text style={[styles.signOutOutlineText, { color: '#B91C1C' }]}>{deletingAccount ? 'Deleting Account...' : 'Delete My Account'}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
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
  tabSection: {
    gap: 12,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
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
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  refreshText: {
    fontSize: 11,
    fontWeight: '700',
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
});
