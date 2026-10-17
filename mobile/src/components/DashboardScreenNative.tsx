import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
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
  ExternalLink,
} from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { HazardItem } from '../constants/hazardTypes';
import { HazardCardNative } from './HazardCardNative';

interface DashboardScreenNativeProps {
  hazards: HazardItem[];
  onOpenReport: () => void;
  onOpenMap: () => void;
}

type DashboardTab = 'overview' | 'my_reports' | 'moderator' | 'admin';

export const DashboardScreenNative: React.FC<DashboardScreenNativeProps> = ({
  hazards,
  onOpenReport,
  onOpenMap,
}) => {
  const { isDark, theme } = useTheme();
  const [activeRoleTab, setActiveRoleTab] = useState<DashboardTab>('overview');

  // Computed metrics
  const totalReports = hazards.length;
  const activeHazards = hazards.filter((h) => h.status === 'reported' || h.status === 'community_confirmed').length;
  const confirmedHazards = hazards.filter((h) => h.status === 'community_confirmed').length;
  const resolvedHazards = hazards.filter((h) => h.status === 'resolved').length;
  const totalConfirmations = hazards.reduce((acc, h) => acc + (h.confirmations_count || 0), 0);

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.content}>
      {/* User Welcome Profile Card */}
      <View style={[styles.profileCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.profileHeader}>
          <View style={[styles.avatarBox, { backgroundColor: isDark ? '#13353A' : '#E6F4F6' }]}>
            <User size={28} color={theme.teal} />
          </View>
          <View style={styles.profileMeta}>
            <View style={styles.nameRow}>
              <Text style={[styles.userName, { color: theme.textPrimary }]}>Citizen Contributor</Text>
              <View style={[styles.verifiedPill, { backgroundColor: isDark ? '#0F3826' : '#EAF6F0', borderColor: theme.green }]}>
                <ShieldCheck size={12} color={theme.green} />
                <Text style={[styles.verifiedText, { color: theme.green }]}>Verified</Text>
              </View>
            </View>
            <Text style={[styles.userHandle, { color: theme.textMuted }]}>
              @citizen &bull; Community Guardian
            </Text>
          </View>
        </View>

        {/* Quick Action Buttons */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: theme.teal }]}
            onPress={onOpenReport}
            activeOpacity={0.8}
          >
            <PlusCircle size={15} color="#FFFFFF" />
            <Text style={styles.actionBtnText}>New Report</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtnSec, { backgroundColor: theme.surfaceSubtle, borderColor: theme.border }]}
            onPress={onOpenMap}
            activeOpacity={0.8}
          >
            <MapPin size={15} color={theme.teal} />
            <Text style={[styles.actionBtnSecText, { color: theme.textPrimary }]}>Live Map</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Role Navigation Pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.roleTabsContainer}>
        <TouchableOpacity
          onPress={() => setActiveRoleTab('overview')}
          style={[
            styles.rolePill,
            {
              backgroundColor: activeRoleTab === 'overview' ? theme.teal : theme.surface,
              borderColor: activeRoleTab === 'overview' ? theme.teal : theme.border,
            },
          ]}
        >
          <Text style={[styles.rolePillText, { color: activeRoleTab === 'overview' ? '#FFFFFF' : theme.textPrimary }]}>
            Citizen Overview
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveRoleTab('my_reports')}
          style={[
            styles.rolePill,
            {
              backgroundColor: activeRoleTab === 'my_reports' ? theme.teal : theme.surface,
              borderColor: activeRoleTab === 'my_reports' ? theme.teal : theme.border,
            },
          ]}
        >
          <Text style={[styles.rolePillText, { color: activeRoleTab === 'my_reports' ? '#FFFFFF' : theme.textPrimary }]}>
            My Reports ({totalReports})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveRoleTab('moderator')}
          style={[
            styles.rolePill,
            {
              backgroundColor: activeRoleTab === 'moderator' ? theme.teal : theme.surface,
              borderColor: activeRoleTab === 'moderator' ? theme.teal : theme.border,
            },
          ]}
        >
          <Text style={[styles.rolePillText, { color: activeRoleTab === 'moderator' ? '#FFFFFF' : theme.textPrimary }]}>
            Moderator Queue
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveRoleTab('admin')}
          style={[
            styles.rolePill,
            {
              backgroundColor: activeRoleTab === 'admin' ? theme.teal : theme.surface,
              borderColor: activeRoleTab === 'admin' ? theme.teal : theme.border,
            },
          ]}
        >
          <Text style={[styles.rolePillText, { color: activeRoleTab === 'admin' ? '#FFFFFF' : theme.textPrimary }]}>
            Admin Control
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Tab 1: Citizen Overview Metrics */}
      {activeRoleTab === 'overview' && (
        <View style={styles.metricsGrid}>
          <View style={[styles.metricCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.metricHeader}>
              <Text style={[styles.metricLabel, { color: theme.textMuted }]}>Total Reports</Text>
              <AlertTriangle size={15} color="#F2B544" />
            </View>
            <Text style={[styles.metricValue, { color: theme.textPrimary }]}>{totalReports}</Text>
            <Text style={[styles.metricSubtitle, { color: theme.textMuted }]}>Community hazards shared</Text>
          </View>

          <View style={[styles.metricCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.metricHeader}>
              <Text style={[styles.metricLabel, { color: theme.textMuted }]}>Confirmations</Text>
              <HeartHandshake size={15} color={theme.teal} />
            </View>
            <Text style={[styles.metricValue, { color: theme.teal }]}>{totalConfirmations}</Text>
            <Text style={[styles.metricSubtitle, { color: theme.textMuted }]}>Verified by commuters</Text>
          </View>

          <View style={[styles.metricCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.metricHeader}>
              <Text style={[styles.metricLabel, { color: theme.textMuted }]}>Active Alerts</Text>
              <Clock size={15} color="#FB923C" />
            </View>
            <Text style={[styles.metricValue, { color: theme.textPrimary }]}>{activeHazards}</Text>
            <Text style={[styles.metricSubtitle, { color: theme.textMuted }]}>Currently alerting drivers</Text>
          </View>

          <View style={[styles.metricCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.metricHeader}>
              <Text style={[styles.metricLabel, { color: theme.textMuted }]}>Resolved</Text>
              <CheckCircle2 size={15} color={theme.green} />
            </View>
            <Text style={[styles.metricValue, { color: theme.green }]}>{resolvedHazards}</Text>
            <Text style={[styles.metricSubtitle, { color: theme.textMuted }]}>Roadways cleared</Text>
          </View>
        </View>
      )}

      {/* Tab 2: My Reports Feed */}
      {activeRoleTab === 'my_reports' && (
        <View style={styles.reportsSection}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Submitted Ground Reports</Text>
          {hazards.map((h) => (
            <HazardCardNative key={h.id} hazard={h} />
          ))}
        </View>
      )}

      {/* Tab 3: Moderator Trust & Safety Queue */}
      {activeRoleTab === 'moderator' && (
        <View style={[styles.cardBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.cardBoxHeader}>
            <Sliders size={18} color={theme.teal} />
            <Text style={[styles.cardBoxTitle, { color: theme.textPrimary }]}>Moderator Review Queue</Text>
          </View>
          <Text style={[styles.cardBoxDesc, { color: theme.textSecondary }]}>
            Review pending and flagged reports to ensure road safety data accuracy across the network.
          </Text>

          <View style={[styles.statRow, { borderTopColor: theme.borderSubtle }]}>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>Pending Review</Text>
            <Text style={[styles.statBadge, { color: '#F2B544' }]}>{hazards.filter((h) => h.status === 'under_review').length} items</Text>
          </View>
          <View style={[styles.statRow, { borderTopColor: theme.borderSubtle }]}>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>Community Confirmed</Text>
            <Text style={[styles.statBadge, { color: theme.teal }]}>{confirmedHazards} items</Text>
          </View>

          <TouchableOpacity
            style={[styles.outlineBtn, { borderColor: theme.teal }]}
            onPress={() => Alert.alert('Moderator Queue', 'All pending reports are synced with the live verification queue.')}
            activeOpacity={0.8}
          >
            <Text style={[styles.outlineBtnText, { color: theme.teal }]}>Launch Moderator Workbench</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Tab 4: Platform Admin Controls */}
      {activeRoleTab === 'admin' && (
        <View style={[styles.cardBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.cardBoxHeader}>
            <Settings size={18} color={theme.teal} />
            <Text style={[styles.cardBoxTitle, { color: theme.textPrimary }]}>Platform Administration</Text>
          </View>
          <Text style={[styles.cardBoxDesc, { color: theme.textSecondary }]}>
            Manage operational parameters, threshold triggers, and system audit trails.
          </Text>

          <View style={[styles.paramBox, { backgroundColor: theme.surfaceSubtle }]}>
            <Text style={[styles.paramTitle, { color: theme.textPrimary }]}>Confirmation Threshold</Text>
            <Text style={[styles.paramValue, { color: theme.teal }]}>3 votes (Auto-confirm)</Text>
          </View>

          <View style={[styles.paramBox, { backgroundColor: theme.surfaceSubtle }]}>
            <Text style={[styles.paramTitle, { color: theme.textPrimary }]}>Report Freshness Window</Text>
            <Text style={[styles.paramValue, { color: theme.teal }]}>24 hours</Text>
          </View>

          <TouchableOpacity
            style={[styles.outlineBtn, { borderColor: theme.teal }]}
            onPress={() => Alert.alert('Admin Settings', 'System parameters are synchronized with the RouteX platform.')}
            activeOpacity={0.8}
          >
            <ExternalLink size={14} color={theme.teal} />
            <Text style={[styles.outlineBtnText, { color: theme.teal }]}>Open Full Admin Portal</Text>
          </TouchableOpacity>
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
    padding: 16,
    paddingBottom: 32,
    gap: 16,
  },
  profileCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  avatarBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileMeta: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userName: {
    fontSize: 16,
    fontWeight: '800',
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '700',
  },
  userHandle: {
    fontSize: 12,
    marginTop: 2,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  actionBtnSec: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  actionBtnSecText: {
    fontSize: 13,
    fontWeight: '700',
  },
  roleTabsContainer: {
    gap: 8,
    paddingVertical: 2,
  },
  rolePill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  rolePillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    width: '48%',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    elevation: 1,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 2,
  },
  metricSubtitle: {
    fontSize: 10,
  },
  reportsSection: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  cardBox: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    gap: 12,
  },
  cardBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardBoxTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  cardBoxDesc: {
    fontSize: 12,
    lineHeight: 18,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  statBadge: {
    fontSize: 12,
    fontWeight: '800',
  },
  outlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 6,
  },
  outlineBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  paramBox: {
    padding: 12,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paramTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  paramValue: {
    fontSize: 12,
    fontWeight: '800',
  },
});
