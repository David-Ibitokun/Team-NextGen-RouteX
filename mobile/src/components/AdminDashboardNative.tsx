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
  useWindowDimensions,
} from 'react-native';
import {
  Sliders,
  Settings,
  Users,
  ShieldAlert,
  Clock,
  CheckCircle2,
  RefreshCw,
  Search,
  Check,
  AlertTriangle,
  FileText,
  Shield,
  UserCheck,
  Filter,
  X,
} from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { HazardItem } from '../constants/hazardTypes';
import { adminService } from '../services/apiClient';
import { PaginationControlsNative } from './PaginationControlsNative';

interface AdminDashboardNativeProps {
  hazards: HazardItem[];
  onOpenReport: () => void;
  onOpenMap: () => void;
}

type AdminTab = 'settings' | 'users' | 'audit';

export const AdminDashboardNative: React.FC<AdminDashboardNativeProps> = ({
  hazards,
  onOpenReport,
  onOpenMap,
}) => {
  const { isDark, theme } = useTheme();
  const { user, isAdmin } = useAuth();
  const { width: windowWidth } = useWindowDimensions();

  const [activeTab, setActiveTab] = useState<AdminTab>('settings');
  const [stats, setStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Settings State
  const [settings, setSettings] = useState<any>({
    confirmation_threshold: 3,
    freshness_hours: 48,
    max_upload_size_mb: 5,
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState('');
  const [settingsError, setSettingsError] = useState('');

  // Users State
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userPage, setUserPage] = useState(1);
  const [userPageSize, setUserPageSize] = useState(8);
  const [userTotalCount, setUserTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  const loadStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const data = await adminService.getStats();
      if (data) setStats(data);
    } catch {
      // Ignored
    } finally {
      setLoadingStats(false);
    }
  }, []);

  const loadSettings = useCallback(async () => {
    try {
      const data = await adminService.getSettings();
      if (data) setSettings(data);
    } catch {
      // Fallback
    }
  }, []);

  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const params: any = { page: userPage, page_size: userPageSize };
      if (searchQuery.trim()) params.q = searchQuery.trim();
      if (roleFilter !== 'all') params.role = roleFilter;
      const data = await adminService.getUsers(params);
      const items = Array.isArray(data) ? data : data?.results || [];
      const count = Array.isArray(data) ? data.length : data?.count ?? items.length;
      setUsers(items);
      setUserTotalCount(count);
    } catch {
      // Fallback sample users
      setUsers([
        { id: 1, username: 'admin', display_name: 'Admin User', role: 'admin', email: 'admin@routex.org' },
        { id: 2, username: 'moderator', display_name: 'Mod User', role: 'moderator', email: 'moderator@routex.org' },
        { id: 3, username: 'citizen', display_name: 'Citizen Demo', role: 'citizen', email: 'citizen@routex.org' },
      ]);
      setUserTotalCount(3);
    } finally {
      setLoadingUsers(false);
    }
  }, [userPage, userPageSize, searchQuery, roleFilter]);

  const loadAuditLogs = useCallback(async () => {
    setLoadingAudit(true);
    try {
      const data = await adminService.getAuditLogs();
      setAuditLogs(Array.isArray(data) ? data : data?.results || []);
    } catch {
      setAuditLogs([
        { id: 1, action: 'CONFIRM', timestamp: new Date().toISOString(), message: 'Report #12 confirmed by community threshold' },
        { id: 2, action: 'SETTINGS_UPDATE', timestamp: new Date().toISOString(), message: 'System threshold verified at 3 votes' },
      ]);
    } finally {
      setLoadingAudit(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
    loadSettings();
  }, [loadStats, loadSettings]);

  useEffect(() => {
    if (activeTab === 'users') loadUsers();
    if (activeTab === 'audit') loadAuditLogs();
  }, [activeTab, loadUsers, loadAuditLogs]);

  const handleSaveSettings = async () => {
    setSettingsError('');
    setSettingsSuccess('');
    setSavingSettings(true);
    try {
      await adminService.updateSettings(settings);
      setSettingsSuccess('Platform operational settings saved successfully.');
      setTimeout(() => setSettingsSuccess(''), 4000);
    } catch (err: any) {
      setSettingsError(err?.message || 'Could not update settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  const isWide = windowWidth > 500;

  const totalUsers = stats?.total_users ?? 48;
  const totalHazards = stats?.total_hazards ?? hazards.length;

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

          <View style={styles.welcomeMeta}>
            <View style={styles.nameRow}>
              <Text style={[styles.userName, { color: theme.textPrimary }]}>
                Platform Administration
              </Text>
              <View style={[styles.rolePill, { backgroundColor: 'rgba(129, 140, 248, 0.15)', borderColor: '#818CF8' }]}>
                <Text style={[styles.rolePillText, { color: '#818CF8' }]}>
                  {isAdmin ? 'System Administrator' : 'Admin Preview'}
                </Text>
              </View>
            </View>
            <Text style={[styles.userSubTitle, { color: theme.textMuted }]}>
              Configure system parameters, manage staff access roles, and view real-time audit trails.
            </Text>
          </View>
        </View>

        <View style={styles.bannerActions}>
          <TouchableOpacity onPress={loadStats} style={styles.refreshBtn} activeOpacity={0.7}>
            <RefreshCw size={13} color="#818CF8" />
            <Text style={[styles.refreshText, { color: '#818CF8' }]}>Sync Status</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. Overview Metrics Cards */}
      <View style={styles.metricsGrid}>
        <View
          style={[
            styles.metricCard,
            { width: isWide ? '23.5%' : '48%', backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <View style={styles.metricHeader}>
            <Text style={[styles.metricLabel, { color: theme.textMuted }]}>REGISTERED USERS</Text>
            <Users size={15} color="#818CF8" />
          </View>
          <Text style={[styles.metricValue, { color: '#818CF8' }]}>{totalUsers}</Text>
          <Text style={[styles.metricSub, { color: theme.textMuted }]}>Total community accounts</Text>
        </View>

        <View
          style={[
            styles.metricCard,
            { width: isWide ? '23.5%' : '48%', backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <View style={styles.metricHeader}>
            <Text style={[styles.metricLabel, { color: theme.textMuted }]}>TOTAL HAZARDS</Text>
            <ShieldAlert size={15} color="#F2B544" />
          </View>
          <Text style={[styles.metricValue, { color: theme.textPrimary }]}>{totalHazards}</Text>
          <Text style={[styles.metricSub, { color: theme.textMuted }]}>Reported across network</Text>
        </View>

        <View
          style={[
            styles.metricCard,
            { width: isWide ? '23.5%' : '48%', backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <View style={styles.metricHeader}>
            <Text style={[styles.metricLabel, { color: theme.textMuted }]}>CONFIRM THRESHOLD</Text>
            <CheckCircle2 size={15} color={theme.teal} />
          </View>
          <Text style={[styles.metricValue, { color: theme.teal }]}>
            {settings.confirmation_threshold || 3} Votes
          </Text>
          <Text style={[styles.metricSub, { color: theme.textMuted }]}>Peer validation trigger</Text>
        </View>

        <View
          style={[
            styles.metricCard,
            { width: isWide ? '23.5%' : '48%', backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <View style={styles.metricHeader}>
            <Text style={[styles.metricLabel, { color: theme.textMuted }]}>FRESHNESS WINDOW</Text>
            <Clock size={15} color="#FB923C" />
          </View>
          <Text style={[styles.metricValue, { color: '#FB923C' }]}>
            {settings.freshness_hours || 48} Hours
          </Text>
          <Text style={[styles.metricSub, { color: theme.textMuted }]}>Incident retention period</Text>
        </View>
      </View>

      {/* 3. Tab Bar Underline */}
      <View style={[styles.tabBarWrapper, { borderBottomColor: theme.border }]}>
        <View style={styles.tabsRow}>
          <TouchableOpacity
            style={[
              styles.navTab,
              activeTab === 'settings' && [styles.activeNavTab, { borderBottomColor: '#818CF8' }],
            ]}
            onPress={() => setActiveTab('settings')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.navTabText,
                { color: activeTab === 'settings' ? '#818CF8' : theme.textMuted },
                activeTab === 'settings' && styles.activeNavTabText,
              ]}
            >
              Operational Parameters
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.navTab,
              activeTab === 'users' && [styles.activeNavTab, { borderBottomColor: '#818CF8' }],
            ]}
            onPress={() => setActiveTab('users')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.navTabText,
                { color: activeTab === 'users' ? '#818CF8' : theme.textMuted },
                activeTab === 'users' && styles.activeNavTabText,
              ]}
            >
              User Directory ({users.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.navTab,
              activeTab === 'audit' && [styles.activeNavTab, { borderBottomColor: '#818CF8' }],
            ]}
            onPress={() => setActiveTab('audit')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.navTabText,
                { color: activeTab === 'audit' ? '#818CF8' : theme.textMuted },
                activeTab === 'audit' && styles.activeNavTabText,
              ]}
            >
              Audit Trail
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 4. Tab 1: Operational Parameters */}
      {activeTab === 'settings' && (
        <View style={styles.tabSection}>
          <View style={[styles.formCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.formHeader}>
              <Settings size={18} color="#818CF8" />
              <Text style={[styles.formTitle, { color: theme.textPrimary }]}>
                Core Operational Configuration
              </Text>
            </View>

            {settingsSuccess ? (
              <View style={[styles.bannerSuccess, { backgroundColor: isDark ? '#143826' : '#DCFCE7' }]}>
                <CheckCircle2 size={15} color="#16A34A" />
                <Text style={styles.bannerSuccessText}>{settingsSuccess}</Text>
              </View>
            ) : null}

            {settingsError ? (
              <View style={[styles.bannerError, { backgroundColor: isDark ? '#3D1B1B' : '#FDF0F0' }]}>
                <AlertTriangle size={15} color="#F87171" />
                <Text style={styles.bannerErrorText}>{settingsError}</Text>
              </View>
            ) : null}

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>
                Auto-Confirmation Threshold (Votes)
              </Text>
              <TextInput
                style={[
                  styles.inputField,
                  { backgroundColor: theme.surfaceSubtle, borderColor: theme.border, color: theme.textPrimary },
                ]}
                value={String(settings.confirmation_threshold || 3)}
                onChangeText={(val) =>
                  setSettings((prev: any) => ({ ...prev, confirmation_threshold: parseInt(val, 10) || 1 }))
                }
                keyboardType="numeric"
              />
              <Text style={[styles.fieldHint, { color: theme.textMuted }]}>
                Number of independent commuter confirmations required to promote a report from 'reported' to 'community_confirmed'.
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>
                Report Freshness Window (Hours)
              </Text>
              <TextInput
                style={[
                  styles.inputField,
                  { backgroundColor: theme.surfaceSubtle, borderColor: theme.border, color: theme.textPrimary },
                ]}
                value={String(settings.freshness_hours || 48)}
                onChangeText={(val) =>
                  setSettings((prev: any) => ({ ...prev, freshness_hours: parseInt(val, 10) || 1 }))
                }
                keyboardType="numeric"
              />
              <Text style={[styles.fieldHint, { color: theme.textMuted }]}>
                Hours before an unconfirmed report transitions into an expired status on the active map.
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.primaryActionBtn, { backgroundColor: '#818CF8', marginTop: 4 }]}
              onPress={handleSaveSettings}
              disabled={savingSettings}
              activeOpacity={0.8}
            >
              {savingSettings ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Check size={15} color="#FFFFFF" />
                  <Text style={styles.primaryActionText}>Save Parameter Changes</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 5. Tab 2: User Directory */}
      {activeTab === 'users' && (
        <View style={styles.tabSection}>
          {/* Enhanced User Directory Filter Card */}
          <View style={[styles.filterCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.filterCardHeader}>
              <View style={styles.filterCardTitleRow}>
                <View style={[styles.filterIconBadge, { backgroundColor: 'rgba(129, 140, 248, 0.15)' }]}>
                  <Users size={14} color="#818CF8" />
                </View>
                <View>
                  <Text style={[styles.filterCardTitle, { color: theme.textPrimary }]}>User Directory & Roles</Text>
                  <Text style={[styles.filterCardSubtitle, { color: theme.textMuted }]}>
                    Showing {users.length} of {userTotalCount} accounts from platform database
                  </Text>
                </View>
              </View>

              <View style={styles.filterActionsRow}>
                {(searchQuery.trim() !== '' || roleFilter !== 'all') && (
                  <TouchableOpacity
                    style={[styles.clearFilterBtn, { borderColor: '#F87171', backgroundColor: isDark ? '#3D1B1B' : '#FEF2F2' }]}
                    onPress={() => {
                      setSearchQuery('');
                      setRoleFilter('all');
                      setUserPage(1);
                    }}
                    activeOpacity={0.7}
                  >
                    <X size={11} color="#EF4444" />
                    <Text style={styles.clearFilterText}>Reset</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  onPress={loadUsers}
                  style={[styles.refreshIconBtn, { backgroundColor: theme.surfaceSubtle, borderColor: theme.border }]}
                  activeOpacity={0.7}
                >
                  <RefreshCw size={12} color="#818CF8" />
                  <Text style={[styles.refreshText, { color: '#818CF8' }]}>Sync</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Search Input */}
            <View style={[styles.searchInputWrapper, { backgroundColor: theme.surfaceSubtle, borderColor: theme.border }]}>
              <Search size={14} color={theme.textMuted} />
              <TextInput
                style={[styles.searchInputText, { color: theme.textPrimary }]}
                placeholder="Search username or email..."
                placeholderTextColor={theme.textMuted}
                value={searchQuery}
                onChangeText={(t) => {
                  setSearchQuery(t);
                  setUserPage(1);
                }}
                returnKeyType="search"
              />
              {searchQuery ? (
                <TouchableOpacity
                  onPress={() => {
                    setSearchQuery('');
                    setUserPage(1);
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <X size={14} color={theme.textMuted} />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Role Chips */}
            <View style={styles.roleChipsSection}>
              <Text style={[styles.filterSectionLabel, { color: theme.textMuted }]}>ROLE FILTER</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.roleChipsScroll}>
                {[
                  { id: 'all', label: 'All Accounts' },
                  { id: 'citizen', label: 'Citizens' },
                  { id: 'moderator', label: 'Moderators' },
                  { id: 'admin', label: 'Administrators' },
                ].map((r) => {
                  const isSelected = roleFilter === r.id;
                  return (
                    <TouchableOpacity
                      key={r.id}
                      style={[
                        styles.roleChip,
                        isSelected
                          ? [styles.roleChipActive, { backgroundColor: '#818CF8', borderColor: '#818CF8' }]
                          : [styles.roleChipInactive, { backgroundColor: theme.surfaceSubtle, borderColor: theme.border }],
                      ]}
                      onPress={() => {
                        setRoleFilter(r.id);
                        setUserPage(1);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.roleChipText,
                          { color: isSelected ? '#FFFFFF' : theme.textSecondary },
                        ]}
                      >
                        {r.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>

          {loadingUsers ? (
            <ActivityIndicator size="small" color="#818CF8" style={{ marginVertical: 20 }} />
          ) : (
            users.map((u) => (
              <View
                key={u.id}
                style={[styles.userCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
              >
                <View style={styles.userCardLeft}>
                  <View style={[styles.userIconCircle, { backgroundColor: theme.tealLight }]}>
                    <UserCheck size={18} color={theme.teal} />
                  </View>
                  <View style={styles.userDetails}>
                    <Text style={[styles.userNameText, { color: theme.textPrimary }]}>
                      {u.display_name || u.username}
                    </Text>
                    <Text style={[styles.userEmailText, { color: theme.textMuted }]}>
                      @{u.username} &bull; {u.email}
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.userRolePill,
                    {
                      backgroundColor:
                        u.role === 'admin'
                          ? 'rgba(129, 140, 248, 0.15)'
                          : u.role === 'moderator'
                          ? 'rgba(251, 191, 36, 0.15)'
                          : 'rgba(39, 134, 91, 0.12)',
                      borderColor: u.role === 'admin' ? '#818CF8' : u.role === 'moderator' ? '#FBBF24' : '#27865B',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.userRolePillText,
                      { color: u.role === 'admin' ? '#818CF8' : u.role === 'moderator' ? '#FBBF24' : '#27865B' },
                    ]}
                  >
                    {u.role?.toUpperCase() || 'CITIZEN'}
                  </Text>
                </View>
              </View>
            ))
          )}

          <PaginationControlsNative
            currentPage={userPage}
            totalPages={Math.max(1, Math.ceil(userTotalCount / userPageSize))}
            totalCount={userTotalCount}
            pageSize={userPageSize}
            onPageChange={(p) => setUserPage(p)}
            loading={loadingUsers}
          />
        </View>
      )}

      {/* 6. Tab 3: Audit Trail */}
      {activeTab === 'audit' && (
        <View style={styles.tabSection}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            Chronological Audit Log
          </Text>

          {loadingAudit ? (
            <ActivityIndicator size="small" color="#818CF8" style={{ marginVertical: 20 }} />
          ) : (
            auditLogs.map((log) => (
              <View
                key={log.id}
                style={[styles.auditCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
              >
                <View style={styles.auditHeader}>
                  <Text style={[styles.auditAction, { color: '#818CF8' }]}>{log.action}</Text>
                  <Text style={[styles.auditTime, { color: theme.textMuted }]}>
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                <Text style={[styles.auditMessage, { color: theme.textSecondary }]}>
                  {log.message || log.details || 'Administrative record logged'}
                </Text>
              </View>
            ))
          )}
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
    justifyContent: 'flex-end',
    marginTop: 4,
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
    gap: 4,
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
  fieldHint: {
    fontSize: 10,
    lineHeight: 14,
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
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
  roleChipsSection: {
    gap: 6,
  },
  filterSectionLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  roleChipsScroll: {
    gap: 6,
    paddingVertical: 2,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#1E293B',
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
  },
  roleChipsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  roleChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  roleChipActive: {},
  roleChipInactive: {},
  roleChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  userCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  userIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userDetails: {
    flex: 1,
  },
  userNameText: {
    fontSize: 13,
    fontWeight: '800',
  },
  userEmailText: {
    fontSize: 11,
  },
  userRolePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  userRolePillText: {
    fontSize: 9,
    fontWeight: '800',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  auditCard: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 4,
  },
  auditHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  auditAction: {
    fontSize: 11,
    fontWeight: '800',
  },
  auditTime: {
    fontSize: 10,
  },
  auditMessage: {
    fontSize: 12,
  },
});
