import React, { useState, useEffect, useCallback } from 'react';
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
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { AppHeaderNative } from './src/components/AppHeaderNative';
import { MobileBottomNavNative, ActiveTab } from './src/components/MobileBottomNavNative';
import { HazardFiltersNative } from './src/components/HazardFiltersNative';
import { HazardCardNative } from './src/components/HazardCardNative';
import { NativeMapScreen } from './src/components/NativeMapScreen';
import { DashboardScreenNative } from './src/components/DashboardScreenNative';
import { ReportModalNative } from './src/components/ReportModalNative';
import { HazardListSkeletonNative } from './src/components/HazardSkeletonNative';
import { ShieldCheck } from 'lucide-react-native';
import { HazardItem } from './src/constants/hazardTypes';
import { fetchHazards } from './src/services/hazardService';

function RouteXNativeMain() {
  const { isDark, theme } = useTheme();

  const [activeTab, setActiveTab] = useState<ActiveTab>('list');
  const [hazards, setHazards] = useState<HazardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showReportModal, setShowReportModal] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const items = await fetchHazards({
        category: selectedCategory,
        status: selectedStatus,
      });
      setHazards(items);
    } catch {
      // Handled in service fallback
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCategory, selectedStatus]);

  useEffect(() => {
    let isMounted = true;
    fetchHazards({
      category: selectedCategory,
      status: selectedStatus,
    }).then((items) => {
      if (isMounted) {
        setHazards(items);
        setLoading(false);
      }
    }).catch(() => {
      if (isMounted) {
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [selectedCategory, selectedStatus]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Hardware Back Button listener
  useEffect(() => {
    const onBackPress = () => {
      if (showReportModal) {
        setShowReportModal(false);
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
  }, [showReportModal, activeTab]);

  const handleTabChange = (tab: ActiveTab) => {
    if (tab === 'report') {
      setShowReportModal(true);
    } else {
      setActiveTab(tab);
    }
  };

  const handleConfirm = (id: string | number) => {
    setHazards((prev) =>
      prev.map((h) =>
        h.id === id ? { ...h, confirmations_count: (h.confirmations_count ?? 1) + 1 } : h
      )
    );
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]} edges={['top', 'left', 'right']}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'light-content'}
        backgroundColor={theme.headerBg}
      />

      {/* App Header with Logo & Theme Switch */}
      <AppHeaderNative
        onRefresh={onRefresh}
        refreshing={refreshing}
        onOpenDashboard={() => setActiveTab(activeTab === 'dashboard' ? 'list' : 'dashboard')}
        isDashboardActive={activeTab === 'dashboard'}
      />

      {/* Active Tab View */}
      <View style={styles.content}>
        {activeTab === 'map' ? (
          <NativeMapScreen hazards={hazards} />
        ) : activeTab === 'dashboard' ? (
          <DashboardScreenNative
            hazards={hazards}
            onOpenReport={() => setShowReportModal(true)}
            onOpenMap={() => setActiveTab('map')}
          />
        ) : (
          <View style={styles.listContainer}>
            {/* Category and Status Filter bar */}
            <HazardFiltersNative
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              selectedStatus={selectedStatus}
              onSelectStatus={setSelectedStatus}
              totalCount={hazards.length}
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
                      {selectedCategory !== 'all'
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
      <MobileBottomNavNative activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Report Modal */}
      <ReportModalNative
        visible={showReportModal}
        onClose={() => setShowReportModal(false)}
        onSuccess={() => {
          setShowReportModal(false);
          loadData();
        }}
      />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <RouteXNativeMain />
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
});
