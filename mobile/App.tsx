import React, { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import {
  StyleSheet,
  View,
  FlatList,
  Text,
  RefreshControl,
  StatusBar,
  BackHandler,
  Alert,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView, initialWindowMetrics } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { AppHeaderNative } from './src/components/AppHeaderNative';
import { MobileBottomNavNative, ActiveTab } from './src/components/MobileBottomNavNative';
import { HazardFiltersNative } from './src/components/HazardFiltersNative';
import { HazardCardNative } from './src/components/HazardCardNative';
import { NativeMapScreen } from './src/components/NativeMapScreen';
import { CitizenDashboardNative } from './src/components/CitizenDashboardNative';
import { ModeratorDashboardNative } from './src/components/ModeratorDashboardNative';
import { AdminDashboardNative } from './src/components/AdminDashboardNative';
import { ReportScreenNative } from './src/components/ReportScreenNative';
import { AuthModalNative } from './src/components/AuthModalNative';
import { NotificationsModalNative } from './src/components/NotificationsModalNative';
import { InfoScreenNative, InfoScreenType } from './src/components/InfoScreenNative';
import { HazardListSkeletonNative } from './src/components/HazardSkeletonNative';
import { ShieldCheck, LayoutDashboard, Shield, Sliders } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';
import { HazardItem } from './src/constants/hazardTypes';
import { fetchHazards, confirmHazard } from './src/services/hazardService';
import {
  setupNotificationChannels,
  getNotificationHistory,
  notifyHazardConfirmed,
} from './src/services/notificationService';

type AppView = ActiveTab | InfoScreenType;

function RouteXNativeMain() {
  const { isDark, theme } = useTheme();
  const { isAuthenticated, isModerator, isAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState<AppView>('list');
  const [activeDashboard, setActiveDashboard] = useState<'citizen' | 'moderator' | 'admin'>('citizen');
  const [hazards, setHazards] = useState<HazardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedHazardToView, setSelectedHazardToView] = useState<HazardItem | any | null>(null);

  // Near Me & Geolocation State
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [nearMeActive, setNearMeActive] = useState(false);
  const [nearMeRadiusKm, setNearMeRadiusKm] = useState<number>(10);
  const [locating, setLocating] = useState(false);

  // Modals
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  // Load unread notifications count
  const refreshNotificationsCount = useCallback(async () => {
    const list = await getNotificationHistory();
    const unread = list.filter((n) => !n.read).length;
    setUnreadNotificationsCount(unread);
  }, []);

  // Initialize notification channels & listeners
  useEffect(() => {
    setupNotificationChannels().catch(() => {});
    refreshNotificationsCount();
  }, [refreshNotificationsCount]);

  const handleToggleNearMe = async () => {
    if (nearMeActive) {
      setNearMeActive(false);
      setUserLocation(null);
      return;
    }

    try {
      setLocating(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocating(false);
        Alert.alert(
          'Location Permission Required',
          `RouteX needs access to your location to find road hazards within ${nearMeRadiusKm} km. Please grant location permission in your device settings.`
        );
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setUserLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      });
      setNearMeActive(true);
    } catch (err: any) {
      console.warn('[RouteX] Geolocation error:', err?.message || err);
      Alert.alert(
        'Location Unavailable',
        'Unable to detect your device coordinates. Please ensure GPS/location services are turned on.'
      );
    } finally {
      setLocating(false);
    }
  };

  const loadData = useCallback(async () => {
    try {
      const items = await fetchHazards({
        category: selectedCategory,
        status: selectedStatus,
        lat: nearMeActive && userLocation ? userLocation.lat : undefined,
        lng: nearMeActive && userLocation ? userLocation.lng : undefined,
        radius_km: nearMeActive ? nearMeRadiusKm : undefined,
      });
      setHazards(items);
    } catch {
      // Handled in service fallback
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCategory, selectedStatus, nearMeActive, userLocation, nearMeRadiusKm]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    fetchHazards({
      category: selectedCategory,
      status: selectedStatus,
      lat: nearMeActive && userLocation ? userLocation.lat : undefined,
      lng: nearMeActive && userLocation ? userLocation.lng : undefined,
      radius_km: nearMeActive ? nearMeRadiusKm : undefined,
    })
      .then((items) => {
        if (isMounted) {
          setHazards(items);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedCategory, selectedStatus, nearMeActive, userLocation, nearMeRadiusKm]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
    refreshNotificationsCount();
  };

  // Hardware Back Button listener
  useEffect(() => {
    const onBackPress = () => {
      if (showNotificationsModal) {
        setShowNotificationsModal(false);
        return true;
      }
      if (showAuthModal) {
        setShowAuthModal(false);
        return true;
      }
      if (activeTab === 'about' || activeTab === 'how-to-use') {
        setActiveTab('list');
        return true;
      }
      if (activeTab === 'report') {
        setActiveTab('list');
        return true;
      }
      if (activeTab !== 'list') {
        setActiveTab('list');
        return true;
      }
      Alert.alert('Exit RouteX', 'Are you sure you want to exit?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Exit', onPress: () => BackHandler.exitApp() },
      ]);
      return true;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [showAuthModal, showNotificationsModal, activeTab]);

  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
  };

  if (activeTab === 'about' || activeTab === 'how-to-use') {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: theme.headerBg }]} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="light-content" backgroundColor={theme.headerBg} hidden={false} translucent={false} />
        <InfoScreenNative type={activeTab} onBack={() => setActiveTab('list')} />
      </SafeAreaView>
    );
  }

  const handleConfirm = async (id: string | number) => {
    try {
      const resp = await confirmHazard(id);
      setHazards((prev) =>
        prev.map((h) =>
          h.id === id
            ? {
                ...h,
                confirmations_count: resp?.confirmations_count ?? (h.confirmations_count ?? 0) + 1,
                status: resp?.status ?? h.status,
              }
            : h
        )
      );

      // Dispatch local notification alert
      const targetHazard = hazards.find((h) => h.id === id);
      if (targetHazard) {
        await notifyHazardConfirmed(targetHazard.category, targetHazard.location_name);
        refreshNotificationsCount();
      }
    } catch (err: any) {
      console.warn('[RouteX] Confirm hazard error:', err?.message || err);
    }
  };

  if (activeTab === 'report') {
    return (
      <SafeAreaView
        style={[styles.root, { backgroundColor: theme.headerBg }]}
        edges={['top', 'left', 'right']}
      >
        <StatusBar
          barStyle="light-content"
          backgroundColor={theme.headerBg}
          hidden={false}
          translucent={false}
        />
        <ReportScreenNative
          onSuccess={() => {
            setActiveTab('list');
            loadData();
            refreshNotificationsCount();
          }}
          onCancel={() => setActiveTab('list')}
          onOpenAuth={(mode = 'login') => {
            setAuthMode(mode);
            setShowAuthModal(true);
          }}
        />
        {/* Authentication Modal */}
        <AuthModalNative
          visible={showAuthModal}
          initialMode={authMode}
          onClose={() => setShowAuthModal(false)}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: theme.headerBg }]}
      edges={['top', 'left', 'right']}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor={theme.headerBg}
        hidden={false}
        translucent={false}
      />

      {/* App Header with Logo, Web-App Drawer, Notifications Bell, Report & Theme Switch */}
      <AppHeaderNative
        onRefresh={onRefresh}
        refreshing={refreshing}
        onOpenDashboard={(role: 'citizen' | 'moderator' | 'admin' = 'citizen') => {
          setActiveDashboard(role);
          setActiveTab('dashboard');
        }}
        isDashboardActive={activeTab === 'dashboard'}
        onOpenAuth={(mode = 'login') => {
          setAuthMode(mode);
          setShowAuthModal(true);
        }}
        onOpenNotifications={() => setShowNotificationsModal(true)}
        unreadNotificationsCount={unreadNotificationsCount}
        onOpenReport={() => setActiveTab('report')}
        onOpenMap={() => setActiveTab('map')}
        onOpenAbout={() => setActiveTab('about')}
        onOpenHowToUse={() => setActiveTab('how-to-use')}
      />

      {/* Active Tab View */}
      <View style={[styles.content, { backgroundColor: theme.background }]}>
        {activeTab === 'map' ? (
          <NativeMapScreen
            hazards={hazards}
            userLocation={userLocation}
            radiusKm={nearMeRadiusKm}
            selectedHazard={selectedHazardToView}
            onSelectHazard={(hazard) => setSelectedHazardToView(hazard)}
            onClearSelectedHazard={() => setSelectedHazardToView(null)}
          />
        ) : activeTab === 'dashboard' ? (
          <View style={{ flex: 1 }}>
            {/* Top Role Switcher if Moderator or Admin */}
            {(isModerator || isAdmin) && (
              <View style={[styles.dashboardSwitcher, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
                <TouchableOpacity
                  style={[
                    styles.switcherTab,
                    activeDashboard === 'citizen' && [styles.switcherTabActive, { backgroundColor: theme.teal + '20', borderColor: theme.teal }],
                  ]}
                  onPress={() => setActiveDashboard('citizen')}
                  activeOpacity={0.7}
                >
                  <LayoutDashboard size={13} color={activeDashboard === 'citizen' ? theme.teal : theme.textMuted} />
                  <Text style={[styles.switcherText, { color: activeDashboard === 'citizen' ? theme.teal : theme.textMuted }]}>
                    Citizen
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.switcherTab,
                    activeDashboard === 'moderator' && [styles.switcherTabActive, { backgroundColor: 'rgba(251, 191, 36, 0.2)', borderColor: '#FBBF24' }],
                  ]}
                  onPress={() => setActiveDashboard('moderator')}
                  activeOpacity={0.7}
                >
                  <Shield size={13} color={activeDashboard === 'moderator' ? '#FBBF24' : theme.textMuted} />
                  <Text style={[styles.switcherText, { color: activeDashboard === 'moderator' ? '#FBBF24' : theme.textMuted }]}>
                    Moderator
                  </Text>
                </TouchableOpacity>

                {isAdmin && (
                  <TouchableOpacity
                    style={[
                      styles.switcherTab,
                      activeDashboard === 'admin' && [styles.switcherTabActive, { backgroundColor: 'rgba(129, 140, 248, 0.2)', borderColor: '#818CF8' }],
                    ]}
                    onPress={() => setActiveDashboard('admin')}
                    activeOpacity={0.7}
                  >
                    <Sliders size={13} color={activeDashboard === 'admin' ? '#818CF8' : theme.textMuted} />
                    <Text style={[styles.switcherText, { color: activeDashboard === 'admin' ? '#818CF8' : theme.textMuted }]}>
                      Admin
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Render Specific Dedicated Dashboard */}
            {activeDashboard === 'moderator' ? (
              <ModeratorDashboardNative
                hazards={hazards}
                onOpenReport={() => setActiveTab('report')}
                onOpenMap={(hazard) => {
                  if (hazard) setSelectedHazardToView(hazard);
                  setActiveTab('map');
                }}
                onSelectHazard={(hazard) => setSelectedHazardToView(hazard)}
                onOpenAuth={() => {
                  setAuthMode('login');
                  setShowAuthModal(true);
                }}
              />
            ) : activeDashboard === 'admin' ? (
              <AdminDashboardNative
                hazards={hazards}
                onOpenReport={() => setActiveTab('report')}
                onOpenMap={() => setActiveTab('map')}
                onOpenAuth={() => {
                  setAuthMode('login');
                  setShowAuthModal(true);
                }}
              />
            ) : (
              <CitizenDashboardNative
                hazards={hazards}
                onOpenReport={() => setActiveTab('report')}
                onOpenMap={() => setActiveTab('map')}
                onOpenAuth={() => {
                  setAuthMode('login');
                  setShowAuthModal(true);
                }}
              />
            )}
          </View>
        ) : (
          <View style={styles.listContainer}>
            {/* Category and Status Filter bar */}
            <HazardFiltersNative
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              selectedStatus={selectedStatus}
              onSelectStatus={setSelectedStatus}
              totalCount={hazards.length}
              nearMeActive={nearMeActive}
              onToggleNearMe={handleToggleNearMe}
              locating={locating}
              radiusKm={nearMeRadiusKm}
              onSelectRadius={setNearMeRadiusKm}
            />

            {/* Hazard Feed */}
            {loading && !refreshing ? (
              <HazardListSkeletonNative count={4} />
            ) : (
              <FlatList
                data={hazards}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => (
                  <HazardCardNative
                    hazard={item}
                    onConfirm={() => handleConfirm(item.id)}
                  />
                )}
                contentContainerStyle={styles.listContent}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    colors={[theme.teal]}
                    tintColor={theme.teal}
                  />
                }
                ListEmptyComponent={
                  <View style={styles.centerContainer}>
                    <ShieldCheck size={44} color={theme.teal} style={{ marginBottom: 12 }} />
                    <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
                      No Hazards Found
                    </Text>
                    <Text style={[styles.emptySubtitle, { color: theme.textMuted }]}>
                      {nearMeActive
                        ? `No hazards reported within ${nearMeRadiusKm} km of your current location. Route is clear!`
                        : selectedCategory !== 'all'
                        ? 'No reports match the selected filters.'
                        : 'Great news! All monitored routes are currently clear.'}
                    </Text>
                  </View>
                }
              />
            )}
          </View>
        )}
      </View>

      {/* Bottom Navigation with Center Report FAB */}
      <MobileBottomNavNative activeTab={activeTab as ActiveTab} onTabChange={handleTabChange} />

      {/* Authentication Modal */}
      <AuthModalNative
        visible={showAuthModal}
        initialMode={authMode}
        onClose={() => setShowAuthModal(false)}
      />

      {/* Notifications Modal */}
      <NotificationsModalNative
        visible={showNotificationsModal}
        onClose={() => setShowNotificationsModal(false)}
        onNotificationsChanged={refreshNotificationsCount}
      />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <ThemeProvider>
        <AuthProvider>
          <RouteXNativeMain />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    marginTop: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: '500',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  dashboardSwitcher: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
    gap: 8,
  },
  switcherTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  switcherTabActive: {
    borderWidth: 1,
  },
  switcherText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
