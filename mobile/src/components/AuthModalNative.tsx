import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X,
  LogIn,
  UserPlus,
  AlertCircle,
  Eye,
  EyeOff,
  User,
  ShieldCheck,
  Mail,
  Lock,
  KeyRound,
  CheckCircle2,
  LogOut,
  Zap,
} from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { RouteXLogoMark } from './RouteXLogoMark';
import { authService } from '../services/apiClient';

interface AuthModalNativeProps {
  visible: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

export const AuthModalNative: React.FC<AuthModalNativeProps> = ({
  visible,
  onClose,
  initialMode = 'login',
}) => {
  const insets = useSafeAreaInsets();
  const { isDark, theme } = useTheme();
  const { user, isAuthenticated, login, register, logout } = useAuth();
  const { height: windowHeight } = useWindowDimensions();

  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const bottomSafePadding = Math.max(insets.bottom, Platform.OS === 'android' ? 24 : 16);

  const modalMaxHeight = useMemo(() => {
    if (keyboardHeight > 0) {
      return Math.max(windowHeight - keyboardHeight - (Platform.OS === 'android' ? 44 : 20), 240);
    }
    return Math.min(windowHeight * 0.90, 750);
  }, [windowHeight, keyboardHeight]);

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);

  // Form Fields
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  // Status
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const resetForm = () => {
    setUsername('');
    setEmail('');
    setDisplayName('');
    setPassword('');
    setPasswordConfirm('');
    setShowPassword(false);
    setShowPasswordConfirm(false);
    setServerError('');
    setForgotSuccess(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const fillDemoAccount = (demoRole: 'citizen' | 'moderator' | 'admin') => {
    if (demoRole === 'citizen') {
      setUsername('citizen');
      setPassword('CitizenPassword123!');
    } else if (demoRole === 'moderator') {
      setUsername('moderator');
      setPassword('ModPassword123!');
    } else {
      setUsername('admin');
      setPassword('AdminPassword123!');
    }
    setServerError('');
  };

  const handleLogin = async () => {
    setServerError('');
    if (!username.trim() || !password) {
      setServerError('Please enter your username (or email) and password.');
      return;
    }

    setSubmitting(true);
    try {
      await login(username.trim(), password);
      handleClose();
    } catch (err: any) {
      if (err.data?.detail) {
        setServerError(err.data.detail);
      } else if (err.message) {
        setServerError(err.message);
      } else {
        setServerError('Unable to sign in. Please verify your credentials.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async () => {
    setServerError('');
    if (!username.trim() || username.trim().length < 3) {
      setServerError('Username must be at least 3 characters.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setServerError('Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 8) {
      setServerError('Password must be at least 8 characters long.');
      return;
    }
    if (password !== passwordConfirm) {
      setServerError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await register({
        username: username.trim(),
        email: email.trim().toLowerCase(),
        display_name: displayName.trim() || undefined,
        password,
        password_confirm: passwordConfirm,
      });
      handleClose();
    } catch (err: any) {
      if (err.data) {
        if (typeof err.data === 'object' && !err.data.detail) {
          const firstErrKey = Object.keys(err.data)[0];
          const val = err.data[firstErrKey];
          setServerError(`${firstErrKey}: ${Array.isArray(val) ? val.join(' ') : String(val)}`);
        } else {
          setServerError(err.data.detail || 'Registration failed. Please check inputs.');
        }
      } else {
        setServerError(err.message || 'Could not complete registration. Check your connection.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    setServerError('');
    if (!email.trim() || !email.includes('@')) {
      setServerError('Please provide your registered email address.');
      return;
    }

    setSubmitting(true);
    try {
      await authService.requestPasswordReset(email.trim().toLowerCase());
      setForgotSuccess(true);
    } catch (err: any) {
      setServerError(err.data?.detail || 'Could not send reset link. Please check your email address.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of RouteX?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          handleClose();
        },
      },
    ]);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      statusBarTranslucent={false}
      onRequestClose={handleClose}
    >
      <View
        style={[
          styles.modalOverlay,
          {
            paddingBottom: keyboardHeight > 0 ? keyboardHeight : 0,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.backdropPressable}
          activeOpacity={1}
          onPress={() => {
            if (keyboardHeight > 0) {
              Keyboard.dismiss();
            } else {
              handleClose();
            }
          }}
        />
        <View
          style={[
            styles.modalCard,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              maxHeight: modalMaxHeight,
              paddingBottom: keyboardHeight > 0 ? 8 : bottomSafePadding,
            },
          ]}
        >
          {/* Header */}
          <View style={[styles.headerRow, { borderBottomColor: theme.borderSubtle }]}>
            <View style={styles.headerLeft}>
              <RouteXLogoMark size={28} />
              <View>
                <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                  {isAuthenticated
                    ? 'Account Profile'
                    : mode === 'forgot'
                    ? 'Reset Password'
                    : mode === 'login'
                    ? 'Sign In to RouteX'
                    : 'Create RouteX Account'}
                </Text>
                <Text style={[styles.modalSubtitle, { color: theme.textMuted }]}>
                  {isAuthenticated
                    ? 'Manage your active community session'
                    : mode === 'forgot'
                    ? 'We will send a password reset link'
                    : 'Access road reporting and verify hazards'}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={20} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          {/* If already authenticated, show user profile & logout options */}
          {isAuthenticated && user ? (
            <ScrollView contentContainerStyle={styles.formContent}>
              <View style={[styles.profileCard, { backgroundColor: theme.surfaceSubtle, borderColor: theme.border }]}>
                <View style={[styles.profileAvatar, { backgroundColor: theme.teal }]}>
                  <Text style={styles.profileAvatarText}>
                    {(user.display_name || user.username).substring(0, 2).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.profileDetails}>
                  <View style={styles.nameRow}>
                    <Text style={[styles.profileName, { color: theme.textPrimary }]}>
                      {user.display_name || user.username}
                    </Text>
                    <View style={[styles.roleBadge, { backgroundColor: theme.teal + '22', borderColor: theme.teal }]}>
                      <ShieldCheck size={11} color={theme.teal} />
                      <Text style={[styles.roleBadgeText, { color: theme.teal }]}>
                        {user.role.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.profileUsername, { color: theme.textMuted }]}>
                    @{user.username} &bull; {user.email}
                  </Text>
                </View>
              </View>

              <View style={styles.profileInfoList}>
                <View style={[styles.infoItem, { borderBottomColor: theme.borderSubtle }]}>
                  <Text style={[styles.infoLabel, { color: theme.textMuted }]}>Account Status</Text>
                  <Text style={[styles.infoValue, { color: theme.green }]}>Active & Verified</Text>
                </View>
                <View style={[styles.infoItem, { borderBottomColor: theme.borderSubtle }]}>
                  <Text style={[styles.infoLabel, { color: theme.textMuted }]}>Access Role</Text>
                  <Text style={[styles.infoValue, { color: theme.textPrimary }]}>
                    {user.role === 'admin' ? 'Administrator' : user.role === 'moderator' ? 'Moderator' : 'Citizen Commuter'}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.logoutBtn, { borderColor: '#F87171' }]}
                onPress={handleLogout}
                activeOpacity={0.8}
              >
                <LogOut size={16} color="#DC2626" />
                <Text style={styles.logoutBtnText}>Sign Out</Text>
              </TouchableOpacity>
            </ScrollView>
          ) : (
            <ScrollView
              contentContainerStyle={styles.formContent}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              showsVerticalScrollIndicator={false}
            >
              {/* Tab Selector (Sign In vs Register) when not in forgot mode */}
              {mode !== 'forgot' && (
                <View style={[styles.tabSelector, { backgroundColor: theme.surfaceSubtle }]}>
                  <TouchableOpacity
                    style={[
                      styles.tabButton,
                      mode === 'login' && [styles.activeTabButton, { backgroundColor: theme.surface }],
                    ]}
                    onPress={() => {
                      setMode('login');
                      setServerError('');
                    }}
                    activeOpacity={0.8}
                  >
                    <LogIn size={14} color={mode === 'login' ? theme.teal : theme.textMuted} />
                    <Text
                      style={[
                        styles.tabButtonText,
                        { color: mode === 'login' ? theme.teal : theme.textMuted },
                      ]}
                    >
                      Sign In
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.tabButton,
                      mode === 'register' && [styles.activeTabButton, { backgroundColor: theme.surface }],
                    ]}
                    onPress={() => {
                      setMode('register');
                      setServerError('');
                    }}
                    activeOpacity={0.8}
                  >
                    <UserPlus size={14} color={mode === 'register' ? theme.teal : theme.textMuted} />
                    <Text
                      style={[
                        styles.tabButtonText,
                        { color: mode === 'register' ? theme.teal : theme.textMuted },
                      ]}
                    >
                      Create Account
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Server Error Alert Banner */}
              {serverError ? (
                <View style={[styles.errorBox, { backgroundColor: isDark ? '#3D1B1B' : '#FDF0F0' }]}>
                  <AlertCircle size={15} color="#F87171" />
                  <Text style={styles.errorText}>{serverError}</Text>
                </View>
              ) : null}

              {/* Forgot Mode Success Screen */}
              {mode === 'forgot' && forgotSuccess ? (
                <View style={styles.successBox}>
                  <CheckCircle2 size={36} color="#16A34A" />
                  <Text style={[styles.successTitle, { color: theme.textPrimary }]}>
                    Reset Link Dispatched
                  </Text>
                  <Text style={[styles.successSub, { color: theme.textMuted }]}>
                    If an account with that email exists, password reset instructions have been sent.
                  </Text>
                  <TouchableOpacity
                    style={[styles.primaryBtn, { backgroundColor: theme.teal, marginTop: 14 }]}
                    onPress={() => {
                      setMode('login');
                      setForgotSuccess(false);
                    }}
                  >
                    <Text style={styles.primaryBtnText}>Return to Sign In</Text>
                  </TouchableOpacity>
                </View>
              ) : mode === 'forgot' ? (
                /* Forgot Password Form */
                <View style={styles.fieldsContainer}>
                  <View style={styles.fieldGroup}>
                    <Text style={[styles.fieldLabel, { color: theme.textPrimary }]}>
                      Registered Email Address <Text style={{ color: '#D64545' }}>*</Text>
                    </Text>
                    <View
                      style={[
                        styles.inputWrapper,
                        { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
                      ]}
                    >
                      <Mail size={16} color={theme.textMuted} style={styles.inputIcon} />
                      <TextInput
                        style={[styles.inputField, { color: theme.textPrimary }]}
                        placeholder="e.g. user@example.com"
                        placeholderTextColor={theme.textMuted}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        value={email}
                        onChangeText={setEmail}
                      />
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[styles.primaryBtn, { backgroundColor: theme.teal, opacity: submitting ? 0.7 : 1 }]}
                    onPress={handleForgotPassword}
                    disabled={submitting}
                    activeOpacity={0.8}
                  >
                    {submitting ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <KeyRound size={16} color="#FFFFFF" />
                        <Text style={styles.primaryBtnText}>Send Reset Link</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      setMode('login');
                      setServerError('');
                    }}
                    style={styles.backLink}
                  >
                    <Text style={[styles.linkText, { color: theme.teal }]}>Back to Sign In</Text>
                  </TouchableOpacity>
                </View>
              ) : mode === 'login' ? (
                /* Login Form */
                <View style={styles.fieldsContainer}>
                  <View style={styles.fieldGroup}>
                    <Text style={[styles.fieldLabel, { color: theme.textPrimary }]}>
                      Username or Email <Text style={{ color: '#D64545' }}>*</Text>
                    </Text>
                    <View
                      style={[
                        styles.inputWrapper,
                        { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
                      ]}
                    >
                      <User size={16} color={theme.textMuted} style={styles.inputIcon} />
                      <TextInput
                        style={[styles.inputField, { color: theme.textPrimary }]}
                        placeholder="e.g. citizen or user@example.com"
                        placeholderTextColor={theme.textMuted}
                        autoCapitalize="none"
                        value={username}
                        onChangeText={setUsername}
                      />
                    </View>
                  </View>

                  <View style={styles.fieldGroup}>
                    <View style={styles.labelRow}>
                      <Text style={[styles.fieldLabel, { color: theme.textPrimary }]}>
                        Password <Text style={{ color: '#D64545' }}>*</Text>
                      </Text>
                      <TouchableOpacity
                        onPress={() => {
                          setMode('forgot');
                          setServerError('');
                        }}
                      >
                        <Text style={[styles.forgotLinkText, { color: theme.teal }]}>Forgot?</Text>
                      </TouchableOpacity>
                    </View>
                    <View
                      style={[
                        styles.inputWrapper,
                        { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
                      ]}
                    >
                      <Lock size={16} color={theme.textMuted} style={styles.inputIcon} />
                      <TextInput
                        style={[styles.inputField, { color: theme.textPrimary }]}
                        placeholder="Enter your password"
                        placeholderTextColor={theme.textMuted}
                        secureTextEntry={!showPassword}
                        value={password}
                        onChangeText={setPassword}
                      />
                      <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        style={styles.eyeBtn}
                      >
                        {showPassword ? (
                          <EyeOff size={16} color={theme.textMuted} />
                        ) : (
                          <Eye size={16} color={theme.textMuted} />
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[styles.primaryBtn, { backgroundColor: theme.teal, opacity: submitting ? 0.7 : 1 }]}
                    onPress={handleLogin}
                    disabled={submitting}
                    activeOpacity={0.8}
                  >
                    {submitting ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <LogIn size={16} color="#FFFFFF" />
                        <Text style={styles.primaryBtnText}>Sign In</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  {/* One-Tap Demo Account Quick Fill */}
                  <View style={[styles.demoBox, { backgroundColor: theme.surfaceSubtle, borderColor: theme.border }]}>
                    <View style={styles.demoHeader}>
                      <Zap size={13} color={theme.teal} />
                      <Text style={[styles.demoTitle, { color: theme.textPrimary }]}>
                        One-Tap Demo Accounts
                      </Text>
                    </View>
                    <View style={styles.demoButtonsRow}>
                      <TouchableOpacity
                        style={[styles.demoBtn, { borderColor: theme.border }]}
                        onPress={() => fillDemoAccount('citizen')}
                      >
                        <Text style={[styles.demoBtnText, { color: theme.textPrimary }]}>Citizen</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.demoBtn, { borderColor: theme.border }]}
                        onPress={() => fillDemoAccount('moderator')}
                      >
                        <Text style={[styles.demoBtnText, { color: theme.textPrimary }]}>Moderator</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.demoBtn, { borderColor: theme.border }]}
                        onPress={() => fillDemoAccount('admin')}
                      >
                        <Text style={[styles.demoBtnText, { color: theme.textPrimary }]}>Admin</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ) : (
                /* Register Form */
                <View style={styles.fieldsContainer}>
                  <View style={styles.fieldGroup}>
                    <Text style={[styles.fieldLabel, { color: theme.textPrimary }]}>
                      Username <Text style={{ color: '#D64545' }}>*</Text>
                    </Text>
                    <View
                      style={[
                        styles.inputWrapper,
                        { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
                      ]}
                    >
                      <User size={16} color={theme.textMuted} style={styles.inputIcon} />
                      <TextInput
                        style={[styles.inputField, { color: theme.textPrimary }]}
                        placeholder="e.g. adetola (min 3 chars)"
                        placeholderTextColor={theme.textMuted}
                        autoCapitalize="none"
                        value={username}
                        onChangeText={setUsername}
                      />
                    </View>
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={[styles.fieldLabel, { color: theme.textPrimary }]}>
                      Display Name <Text style={{ color: theme.textMuted }}>(optional)</Text>
                    </Text>
                    <View
                      style={[
                        styles.inputWrapper,
                        { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
                      ]}
                    >
                      <User size={16} color={theme.textMuted} style={styles.inputIcon} />
                      <TextInput
                        style={[styles.inputField, { color: theme.textPrimary }]}
                        placeholder="e.g. Adetola Adeyemi"
                        placeholderTextColor={theme.textMuted}
                        value={displayName}
                        onChangeText={setDisplayName}
                      />
                    </View>
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={[styles.fieldLabel, { color: theme.textPrimary }]}>
                      Email Address <Text style={{ color: '#D64545' }}>*</Text>
                    </Text>
                    <View
                      style={[
                        styles.inputWrapper,
                        { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
                      ]}
                    >
                      <Mail size={16} color={theme.textMuted} style={styles.inputIcon} />
                      <TextInput
                        style={[styles.inputField, { color: theme.textPrimary }]}
                        placeholder="user@example.com"
                        placeholderTextColor={theme.textMuted}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        value={email}
                        onChangeText={setEmail}
                      />
                    </View>
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={[styles.fieldLabel, { color: theme.textPrimary }]}>
                      Password <Text style={{ color: '#D64545' }}>* (min 8 characters)</Text>
                    </Text>
                    <View
                      style={[
                        styles.inputWrapper,
                        { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
                      ]}
                    >
                      <Lock size={16} color={theme.textMuted} style={styles.inputIcon} />
                      <TextInput
                        style={[styles.inputField, { color: theme.textPrimary }]}
                        placeholder="Minimum 8 characters"
                        placeholderTextColor={theme.textMuted}
                        secureTextEntry={!showPassword}
                        value={password}
                        onChangeText={setPassword}
                      />
                      <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        style={styles.eyeBtn}
                      >
                        {showPassword ? (
                          <EyeOff size={16} color={theme.textMuted} />
                        ) : (
                          <Eye size={16} color={theme.textMuted} />
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={[styles.fieldLabel, { color: theme.textPrimary }]}>
                      Confirm Password <Text style={{ color: '#D64545' }}>*</Text>
                    </Text>
                    <View
                      style={[
                        styles.inputWrapper,
                        { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
                      ]}
                    >
                      <Lock size={16} color={theme.textMuted} style={styles.inputIcon} />
                      <TextInput
                        style={[styles.inputField, { color: theme.textPrimary }]}
                        placeholder="Re-enter password"
                        placeholderTextColor={theme.textMuted}
                        secureTextEntry={!showPasswordConfirm}
                        value={passwordConfirm}
                        onChangeText={setPasswordConfirm}
                      />
                      <TouchableOpacity
                        onPress={() => setShowPasswordConfirm(!showPasswordConfirm)}
                        style={styles.eyeBtn}
                      >
                        {showPasswordConfirm ? (
                          <EyeOff size={16} color={theme.textMuted} />
                        ) : (
                          <Eye size={16} color={theme.textMuted} />
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[styles.primaryBtn, { backgroundColor: theme.teal, opacity: submitting ? 0.7 : 1 }]}
                    onPress={handleRegister}
                    disabled={submitting}
                    activeOpacity={0.8}
                  >
                    {submitting ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <UserPlus size={16} color="#FFFFFF" />
                        <Text style={styles.primaryBtnText}>Create Account</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <Text style={[styles.privacyConsentText, { color: theme.textMuted }]}>
                    By creating an account, you agree to RouteX's Terms of Service and Privacy Policy. We never track background location or sell personal data.
                  </Text>
                </View>
              )}
            </ScrollView>
          )}
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
  backdropPressable: {
    ...StyleSheet.absoluteFill,
  },
  modalCard: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    maxHeight: '90%',
    width: '100%',
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
  formContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 16,
  },
  tabSelector: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 3,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
  },
  activeTabButton: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: '700',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 8,
  },
  errorText: {
    color: '#F87171',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  fieldsContainer: {
    gap: 12,
  },
  fieldGroup: {
    gap: 5,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  forgotLinkText: {
    fontSize: 11,
    fontWeight: '700',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 44,
  },
  inputIcon: {
    marginRight: 8,
  },
  inputField: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 8,
  },
  eyeBtn: {
    padding: 6,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 6,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  backLink: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  linkText: {
    fontSize: 12,
    fontWeight: '700',
  },
  privacyConsentText: {
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
    marginTop: 12,
  },
  demoBox: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    gap: 8,
    marginTop: 4,
  },
  demoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  demoTitle: {
    fontSize: 11,
    fontWeight: '700',
  },
  demoButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  demoBtn: {
    flex: 1,
    paddingVertical: 6,
    borderWidth: 1,
    borderRadius: 6,
    alignItems: 'center',
  },
  demoBtnText: {
    fontSize: 11,
    fontWeight: '600',
  },
  successBox: {
    alignItems: 'center',
    padding: 24,
    gap: 8,
  },
  successTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  successSub: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  profileAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  profileDetails: {
    flex: 1,
    gap: 3,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  profileName: {
    fontSize: 14,
    fontWeight: '800',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
  },
  roleBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  profileUsername: {
    fontSize: 11,
  },
  profileInfoList: {
    gap: 8,
    marginTop: 6,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 14,
  },
  logoutBtnText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '800',
  },
});
