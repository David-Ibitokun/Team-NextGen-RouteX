import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  RefreshControl,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X,
  Bell,
  BellRing,
  CheckCheck,
  Trash2,
  AlertTriangle,
  FileText,
  ShieldCheck,
  Send,
  MapPin,
} from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import {
  RouteXNotification,
  getNotificationHistory,
  markAllNotificationsRead,
  markNotificationRead,
  clearAllNotifications,
  notifySafetyAdvisory,
  requestNotificationPermission,
} from '../services/notificationService';

interface NotificationsModalNativeProps {
  visible: boolean;
  onClose: () => void;
  onNotificationsChanged?: () => void;
  onSelectHazardId?: (hazardId: number) => void;
}

export const NotificationsModalNative: React.FC<NotificationsModalNativeProps> = ({
  visible,
  onClose,
  onNotificationsChanged,
  onSelectHazardId,
}) => {
  const insets = useSafeAreaInsets();
  const { isDark, theme } = useTheme();
  const [notifications, setNotifications] = useState<RouteXNotification[]>([]);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const bottomSafePadding = Math.max(insets.bottom, Platform.OS === 'android' ? 24 : 16);

  const loadNotifications = async () => {
    const list = await getNotificationHistory();
    setNotifications(list);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
    onNotificationsChanged?.();
  };

  useEffect(() => {
    if (visible) {
      loadNotifications();
    }
  }, [visible]);

  const handleNotificationPress = async (item: RouteXNotification) => {
    if (!item.read) {
      await markNotificationRead(item.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, read: true } : n))
      );
      onNotificationsChanged?.();
    }
    const targetId = item.data?.targetHazardId;
    if (targetId && onSelectHazardId) {
      onClose();
      onSelectHazardId(Number(targetId));
    }
  };

  const handleMarkAllRead = async () => {
    const updated = await markAllNotificationsRead();
    setNotifications(updated);
    onNotificationsChanged?.();
  };

  const handleClearAll = async () => {
    await clearAllNotifications();
    setNotifications([]);
    onNotificationsChanged?.();
  };

  const handleSendTestAdvisory = async () => {
    const granted = await requestNotificationPermission();
    setPermissionGranted(granted);
    await notifySafetyAdvisory(
      'Lekki-Epe Corridor',
      'Heavy flash flooding observed around KM 14 Chevron. Proceed with caution and use alternative inner routes.'
    );
    await loadNotifications();
    onNotificationsChanged?.();
  };

  const renderIcon = (type: RouteXNotification['type']) => {
    switch (type) {
      case 'report':
        return <FileText size={16} color={theme.teal} />;
      case 'confirmation':
        return <ShieldCheck size={16} color={theme.green} />;
      case 'alert':
        return <AlertTriangle size={16} color="#EAB308" />;
      default:
        return <Bell size={16} color={theme.teal} />;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalCard,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              paddingBottom: bottomSafePadding,
            },
          ]}
        >
          {/* Header */}
          <View style={[styles.headerRow, { borderBottomColor: theme.borderSubtle }]}>
            <View style={styles.headerLeft}>
              <View style={[styles.bellBox, { backgroundColor: theme.teal + '22' }]}>
                <BellRing size={18} color={theme.teal} />
              </View>
              <View>
                <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                  Road Alerts & Notifications
                </Text>
                <Text style={[styles.modalSubtitle, { color: theme.textMuted }]}>
                  {notifications.length} alerts &bull; Instant hazard updates
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={20} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Quick Actions Row */}
          <View style={[styles.actionsBar, { borderBottomColor: theme.borderSubtle, backgroundColor: theme.surfaceSubtle }]}>
            <TouchableOpacity
              style={styles.actionItem}
              onPress={handleMarkAllRead}
              disabled={notifications.length === 0}
            >
              <CheckCheck size={14} color={notifications.length > 0 ? theme.teal : theme.textMuted} />
              <Text
                style={[
                  styles.actionText,
                  { color: notifications.length > 0 ? theme.teal : theme.textMuted },
                ]}
              >
                Mark Read
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionItem}
              onPress={handleClearAll}
              disabled={notifications.length === 0}
            >
              <Trash2 size={14} color={notifications.length > 0 ? '#DC2626' : theme.textMuted} />
              <Text
                style={[
                  styles.actionText,
                  { color: notifications.length > 0 ? '#DC2626' : theme.textMuted },
                ]}
              >
                Clear
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.testAlertBtn, { backgroundColor: theme.teal }]}
              onPress={handleSendTestAdvisory}
              activeOpacity={0.8}
            >
              <Send size={12} color="#FFFFFF" />
              <Text style={styles.testAlertBtnText}>Test Road Alert</Text>
            </TouchableOpacity>
          </View>

          {/* Notifications List */}
          <ScrollView
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[theme.teal]}
                tintColor={theme.teal}
              />
            }
          >
            {notifications.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Bell size={40} color={theme.textMuted} style={{ marginBottom: 10, opacity: 0.6 }} />
                <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>No Alerts Yet</Text>
                <Text style={[styles.emptySub, { color: theme.textMuted }]}>
                  You will receive real-time notifications when hazards are reported or verified along your routes.
                </Text>
                <TouchableOpacity
                  style={[styles.testPromptBtn, { borderColor: theme.teal }]}
                  onPress={handleSendTestAdvisory}
                >
                  <Text style={[styles.testPromptText, { color: theme.teal }]}>
                    Trigger a test notification
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              notifications.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.7}
                  onPress={() => handleNotificationPress(item)}
                  style={[
                    styles.notificationItem,
                    {
                      backgroundColor: item.read ? theme.surface : (isDark ? '#102A35' : '#E6F4F6'),
                      borderColor: item.read ? theme.borderSubtle : theme.teal,
                    },
                  ]}
                >
                  <View style={styles.itemHeader}>
                    <View style={styles.typeBadge}>
                      {renderIcon(item.type)}
                      <Text style={[styles.itemTitle, { color: theme.textPrimary }]}>
                        {item.title}
                      </Text>
                    </View>
                    {!item.read && <View style={[styles.unreadDot, { backgroundColor: theme.teal }]} />}
                  </View>
                  <Text style={[styles.itemBody, { color: theme.textPrimary }]}>{item.body}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                    <Text style={[styles.itemDate, { color: theme.textMuted }]}>
                      {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                    {item.data?.targetHazardId && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                        <MapPin size={11} color={theme.teal} />
                        <Text style={{ fontSize: 10.5, fontWeight: '700', color: theme.teal }}>
                          View on map
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    maxHeight: '85%',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  bellBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  modalSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  closeBtn: {
    padding: 6,
  },
  actionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    gap: 12,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  actionText: {
    fontSize: 11,
    fontWeight: '700',
  },
  testAlertBtn: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  testAlertBtnText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  listContent: {
    padding: 16,
    gap: 10,
    paddingBottom: 24,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  testPromptBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  testPromptText: {
    fontSize: 12,
    fontWeight: '700',
  },
  notificationItem: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 5,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  itemTitle: {
    fontSize: 12,
    fontWeight: '800',
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  itemBody: {
    fontSize: 11,
    lineHeight: 16,
  },
  itemDate: {
    fontSize: 10,
    alignSelf: 'flex-end',
  },
});
