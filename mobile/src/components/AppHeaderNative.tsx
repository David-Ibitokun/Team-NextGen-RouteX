import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  Alert,
  ActivityIndicator,
  Animated,
} from 'react-native';
import {
  Sun,
  Moon,
  RotateCw,
  LayoutDashboard,
  Bell,
  Menu,
  X,
  PlusCircle,
  MapPin,
  Shield,
  Sliders,
  LogOut,
  UserCircle,
  CheckCircle2,
  Info,
  CircleHelp,
} from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { BRAND } from '../theme/colors';
import { RouteXLogoMark } from './RouteXLogoMark';

export interface AppHeaderNativeProps {
  onRefresh?: () => void;
  refreshing?: boolean;
  onOpenDashboard?: (role?: 'citizen' | 'moderator' | 'admin') => void;
  isDashboardActive?: boolean;
  onOpenAuth?: (initialMode?: 'login' | 'register') => void;
  onOpenNotifications?: () => void;
  unreadNotificationsCount?: number;
  onOpenReport?: () => void;
  onOpenMap?: () => void;
  onOpenAbout?: () => void;
  onOpenHowToUse?: () => void;
  onOpenPrivacy?: () => void;
}

export const AppHeaderNative: React.FC<AppHeaderNativeProps> = ({
  onRefresh,
  refreshing = false,
  onOpenDashboard,
  isDashboardActive = false,
  onOpenAuth,
  onOpenNotifications,
  unreadNotificationsCount = 0,
  onOpenReport,
  onOpenMap,
  onOpenAbout,
  onOpenHowToUse,
  onOpenPrivacy,
}) => {
  const { isDark, toggleTheme, theme } = useTheme();
  const { user, isAuthenticated, isAdmin, isModerator, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => setMobileMenuOpen((prev) => !prev);
  const closeMobileMenu = () => setMobileMenuOpen(false);

  const handleSignOut = () => {
    closeMobileMenu();
    Alert.alert('Sign Out', 'Are you sure you want to sign out of RouteX?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => logout(),
      },
    ]);
  };

  const handleReportPress = () => {
    closeMobileMenu();
    if (onOpenReport) {
      onOpenReport();
    }
  };

  const handleDashboardPress = (role?: 'citizen' | 'moderator' | 'admin') => {
    closeMobileMenu();
    if (onOpenDashboard) {
      onOpenDashboard(role);
    }
  };

  const handleMapPress = () => {
    closeMobileMenu();
    if (onOpenMap) {
      onOpenMap();
    }
  };

  const handleInfoPress = (handler?: () => void) => {
    closeMobileMenu();
    handler?.();
  };

  const handleAuthPress = (mode: 'login' | 'register' = 'login') => {
    closeMobileMenu();
    if (onOpenAuth) {
      onOpenAuth(mode);
    }
  };

  const handleRefreshPress = () => {
    closeMobileMenu();
    if (onRefresh) {
      onRefresh();
    }
  };

  return (
    <>
      {/* Sticky Main Header Bar matching Web App styling */}
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.headerBg,
            borderBottomColor: isDark ? '#1E3342' : '#2A4356',
          },
        ]}
      >
        {/* Left: Brand with Logo & Tagline */}
        <TouchableOpacity
          style={styles.brandRow}
          onPress={() => {
            if (isDashboardActive && onOpenDashboard) {
              onOpenDashboard();
            } else if (onOpenMap) {
              onOpenMap();
            }
          }}
          activeOpacity={0.8}
        >
          <RouteXLogoMark size={32} />
          <View style={styles.titleCol}>
            <View style={styles.brandNameRow}>
              <Text style={styles.brandTitle}>{BRAND.name}</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Right Action Cluster */}
        <View style={styles.actionsRow}>
          {/* Notifications Bell */}
          {onOpenNotifications && (
            <TouchableOpacity
              onPress={onOpenNotifications}
              activeOpacity={0.7}
              style={styles.iconBtn}
              accessibilityLabel="Notifications"
              accessibilityRole="button"
            >
              <Bell size={16} color="#E2E8F0" />
              {unreadNotificationsCount > 0 && (
                <View style={[styles.badgeIndicator, { backgroundColor: theme.teal }]}>
                  <Text style={styles.badgeText}>
                    {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )}

          {/* Theme Toggle Button */}
          <TouchableOpacity
            onPress={toggleTheme}
            activeOpacity={0.7}
            style={styles.iconBtn}
            accessibilityLabel={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            accessibilityRole="button"
          >
            {isDark ? <Sun size={16} color="#F2B544" /> : <Moon size={16} color="#E2E8F0" />}
          </TouchableOpacity>

          {/* Primary Report Action Button (like Web App) */}
          {/* {onOpenReport && (
            <TouchableOpacity
              onPress={handleReportPress}
              activeOpacity={0.8}
              style={[styles.reportBtn, { backgroundColor: theme.teal }]}
              accessibilityLabel="Report a hazard"
              accessibilityRole="button"
            >
              <PlusCircle size={14} color="#FFFFFF" strokeWidth={2.5} />
              <Text style={styles.reportBtnText}>Report</Text>
            </TouchableOpacity>
          )} */}

          {/* Mobile Menu Hamburger Toggle Button */}
          <TouchableOpacity
            onPress={toggleMobileMenu}
            activeOpacity={0.7}
            style={styles.menuToggleBtn}
            accessibilityLabel={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            accessibilityRole="button"
          >
            {mobileMenuOpen ? <X size={20} color="#FFFFFF" /> : <Menu size={20} color="#FFFFFF" />}
          </TouchableOpacity>
        </View>
      </View>

      {/* Web App Style Mobile Drawer Dropdown Modal */}
      <Modal
        visible={mobileMenuOpen}
        transparent
        animationType="fade"
        onRequestClose={closeMobileMenu}
      >
        <View style={styles.drawerOverlay}>
          {/* Backdrop dismissal */}
          <Pressable style={StyleSheet.absoluteFill} onPress={closeMobileMenu} />

          {/* Drawer Content Card attached under header */}
          <View
            style={[
              styles.drawerSheet,
              {
                backgroundColor: isDark ? '#0B161E' : '#142B3B',
                borderColor: isDark ? '#1E3342' : '#2A4356',
              },
            ]}
          >
            {/* Top Navigation Links */}
            <View style={styles.drawerNav}>
              {/* Citizen Dashboard */}
              <TouchableOpacity
                style={styles.navItem}
                onPress={() => handleDashboardPress('citizen')}
                activeOpacity={0.7}
              >
                <LayoutDashboard size={18} color="#2DD4BF" />
                <Text style={[styles.navItemText, { color: '#2DD4BF' }]}>
                  Citizen Dashboard
                </Text>
              </TouchableOpacity>

              {/* Moderator Queue (if Moderator or Admin) */}
              {isModerator && (
                <TouchableOpacity
                  style={styles.navItem}
                  onPress={() => handleDashboardPress('moderator')}
                  activeOpacity={0.7}
                >
                  <Shield size={18} color="#FBBF24" />
                  <Text style={[styles.navItemText, { color: '#FBBF24' }]}>
                    Moderator Queue
                  </Text>
                </TouchableOpacity>
              )}

              {/* Admin Operations (if Admin) */}
              {isAdmin && (
                <TouchableOpacity
                  style={styles.navItem}
                  onPress={() => handleDashboardPress('admin')}
                  activeOpacity={0.7}
                >
                  <Sliders size={18} color="#818CF8" />
                  <Text style={[styles.navItemText, { color: '#818CF8' }]}>
                    Admin Operations
                  </Text>
                </TouchableOpacity>
              )}

              {/* Explore Map */}
              {onOpenMap && (
                <TouchableOpacity
                  style={styles.navItem}
                  onPress={handleMapPress}
                  activeOpacity={0.7}
                >
                  <MapPin size={18} color="#E2E8F0" />
                  <Text style={[styles.navItemText, { color: '#E2E8F0' }]}>
                    Explore Map
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={styles.navItem} onPress={() => handleInfoPress(onOpenAbout)} activeOpacity={0.7}>
                <Info size={18} color="#E2E8F0" />
                <Text style={[styles.navItemText, { color: '#E2E8F0' }]}>About Us</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.navItem} onPress={() => handleInfoPress(onOpenHowToUse)} activeOpacity={0.7}>
                <CircleHelp size={18} color="#2DD4BF" />
                <Text style={[styles.navItemText, { color: '#2DD4BF' }]}>How to Use</Text>
              </TouchableOpacity>

              {onOpenPrivacy && (
                <TouchableOpacity style={styles.navItem} onPress={() => handleInfoPress(onOpenPrivacy)} activeOpacity={0.7}>
                  <ShieldCheck size={18} color="#2DD4BF" />
                  <Text style={[styles.navItemText, { color: '#2DD4BF' }]}>Data & Privacy</Text>
                </TouchableOpacity>
              )}

              {/* Refresh Feed */}
              {onRefresh && (
                <TouchableOpacity
                  style={styles.navItem}
                  onPress={handleRefreshPress}
                  activeOpacity={0.7}
                  disabled={refreshing}
                >
                  {refreshing ? (
                    <ActivityIndicator size="small" color="#2DD4BF" />
                  ) : (
                    <RotateCw size={17} color="#94A3B8" />
                  )}
                  <Text style={[styles.navItemText, { color: '#94A3B8' }]}>
                    {refreshing ? 'Updating Hazards...' : 'Refresh Hazards Feed'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Account & Profile Section */}
            <View style={[styles.drawerFooter, { borderTopColor: isDark ? '#1E3342' : '#2A4356' }]}>
              {isAuthenticated && user ? (
                <>
                  {/* Signed-in identity summary */}
                  <View style={styles.userBanner}>
                    <View style={[styles.userAvatar, { backgroundColor: theme.teal }]}>
                      <Text style={styles.userAvatarText}>
                        {(user.display_name || user.username).substring(0, 1).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.userInfo}>
                      <Text style={styles.userName} numberOfLines={1}>
                        {user.display_name || user.username}
                      </Text>
                      <Text style={styles.userSub} numberOfLines={1}>
                        {user.email || `@${user.username}`}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.roleBadge,
                        {
                          backgroundColor: isAdmin
                            ? 'rgba(129, 140, 248, 0.2)'
                            : isModerator
                            ? 'rgba(251, 191, 36, 0.2)'
                            : 'rgba(45, 212, 191, 0.2)',
                          borderColor: isAdmin ? '#818CF8' : isModerator ? '#FBBF24' : '#2DD4BF',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.roleBadgeText,
                          { color: isAdmin ? '#818CF8' : isModerator ? '#FBBF24' : '#2DD4BF' },
                        ]}
                      >
                        {isAdmin ? 'ADMIN' : isModerator ? 'MOD' : 'CITIZEN'}
                      </Text>
                    </View>
                  </View>

                  {/* Actions: Profile & Sign Out */}
                  <TouchableOpacity
                    style={styles.drawerActionBtn}
                    onPress={() => handleAuthPress('login')}
                    activeOpacity={0.7}
                  >
                    <UserCircle size={17} color="#2DD4BF" />
                    <Text style={styles.drawerActionText}>Account Profile & Settings</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.drawerActionBtn, styles.signOutBtn]}
                    onPress={handleSignOut}
                    activeOpacity={0.7}
                  >
                    <LogOut size={17} color="#F87171" />
                    <Text style={[styles.drawerActionText, { color: '#F87171' }]}>Sign Out</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  {/* Guest Commuter Banner */}
                  <Text style={styles.guestNote}>
                    Sign in to track your road reports and earn citizen badges.
                  </Text>
                  <View style={styles.guestActionsRow}>
                    <TouchableOpacity
                      style={styles.guestSignInBtn}
                      onPress={() => handleAuthPress('login')}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.guestSignInText}>Sign In</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.guestRegisterBtn, { backgroundColor: theme.teal }]}
                      onPress={() => handleAuthPress('register')}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.guestRegisterText}>Register</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  titleCol: {
    justifyContent: 'center',
  },
  brandNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandTitle: {
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.4,
    color: '#FFFFFF',
  },
  tagline: {
    fontSize: 10,
    fontWeight: '500',
    color: '#94A3B8',
    marginTop: -1,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    position: 'relative',
  },
  badgeIndicator: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#142B3B',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  reportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 8,
    shadowColor: '#087F8C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 2,
  },
  reportBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  menuToggleBtn: {
    width: 36,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  drawerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    paddingTop: 56,
  },
  drawerSheet: {
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    borderBottomWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 16,
    gap: 12,
  },
  drawerNav: {
    gap: 6,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  navItemText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  drawerFooter: {
    borderTopWidth: 1,
    paddingTop: 12,
    gap: 10,
  },
  userBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  userSub: {
    color: '#94A3B8',
    fontSize: 11,
  },
  roleBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  roleBadgeText: {
    fontSize: 9,
    fontWeight: '900',
  },
  drawerActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  drawerActionText: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '600',
  },
  signOutBtn: {
    marginTop: 2,
  },
  guestNote: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 16,
  },
  guestActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  guestSignInBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  guestSignInText: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '700',
  },
  guestRegisterBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  guestRegisterText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
