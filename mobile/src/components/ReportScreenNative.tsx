import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  Alert,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  AlertCircle,
  Droplets,
  CircleDot,
  AlertTriangle,
  TreePine,
  HelpCircle,
  Camera,
  ImageIcon,
  Sparkles,
  CheckCircle2,
  Sliders,
  Shield,
  X,
  MapPin,
  Loader2,
  ThumbsUp,
  LogIn,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { HAZARD_CATEGORIES } from '../constants/hazardTypes';
import { submitHazard, confirmHazard } from '../services/hazardService';
import { notifyHazardReported, notifyHazardConfirmed } from '../services/notificationService';
import {
  aiService,
  SuggestCategoryResult,
  ImproveDescriptionResult,
  CheckDuplicatesResult,
} from '../services/aiService';
import { RouteXLogoMark } from './RouteXLogoMark';
import { LocationPickerMapNative } from './LocationPickerMapNative';
import { AISuggestionCardNative } from './AISuggestionCardNative';

export interface ReportScreenNativeProps {
  onSuccess: () => void;
  onCancel: () => void;
  onOpenAuth?: (mode?: 'login' | 'register') => void;
}

const PRESET_CORRIDORS = [
  { name: 'Lekki-Epe', lat: 6.4428, lng: 3.4839, landmark: 'Lekki-Epe Expressway near Chevron' },
  { name: 'Ikeja / Maryland', lat: 6.5721, lng: 3.3672, landmark: 'Ikorodu Road, Maryland Underpass' },
  { name: 'Victoria Island', lat: 6.4355, lng: 3.4211, landmark: 'Ozumba Mbadiwe Avenue near Civic Centre' },
  { name: 'Third Mainland', lat: 6.4674, lng: 3.3982, landmark: 'Third Mainland Bridge, Adeniji Adele Ramp' },
  { name: 'Surulere', lat: 6.5012, lng: 3.3582, landmark: 'Western Avenue, Ojuelegba Flyover' },
];

export const ReportScreenNative: React.FC<ReportScreenNativeProps> = ({
  onSuccess,
  onCancel,
  onOpenAuth,
}) => {
  const { isDark, theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated } = useAuth();

  const [category, setCategory] = useState('flooding');
  const [locationName, setLocationName] = useState('');
  const [description, setDescription] = useState('');
  const [latitude, setLatitude] = useState(6.4531);
  const [longitude, setLongitude] = useState(3.3958);
  const [activeCorridor, setActiveCorridor] = useState<string | null>(null);

  // Manual Coordinates Input Toggle
  const [showCoordinateInputs, setShowCoordinateInputs] = useState(false);
  const [latInput, setLatInput] = useState('6.4531');
  const [lngInput, setLngInput] = useState('3.3958');

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [photoName, setPhotoName] = useState<string | null>(null);
  const [isMapCollapsed, setIsMapCollapsed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const isKeyboardVisible = keyboardHeight > 0;
  const scrollViewRef = useRef<ScrollView>(null);

  // AI Assistant States
  const [aiLoading, setAiLoading] = useState<'category' | 'description' | 'duplicates' | null>(null);
  const [categorySuggestion, setCategorySuggestion] = useState<SuggestCategoryResult | null>(null);
  const [descriptionSuggestion, setDescriptionSuggestion] = useState<ImproveDescriptionResult | null>(null);
  const [duplicateCheckResult, setDuplicateCheckResult] = useState<CheckDuplicatesResult | null>(null);
  const [confirmingCandidateId, setConfirmingCandidateId] = useState<number | null>(null);
  const [dismissedDuplicates, setDismissedDuplicates] = useState(false);
  const [aiNotice, setAiNotice] = useState<string | null>(null);

  // Auto-scan for nearby duplicates when coordinates and description change
  useEffect(() => {
    if (!isAuthenticated || dismissedDuplicates) return;
    if (!latitude || !longitude || !description.trim() || description.trim().length < 10) {
      return;
    }
    const timer = setTimeout(() => {
      aiService
        .checkDuplicates({
          latitude,
          longitude,
          description: description.trim(),
          category,
          radius_km: 1.0,
        })
        .then((res) => setDuplicateCheckResult(res))
        .catch(() => {});
    }, 1200);

    return () => clearTimeout(timer);
  }, [latitude, longitude, description, category, dismissedDuplicates, isAuthenticated]);

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

  const resetForm = () => {
    setCategory('flooding');
    setLocationName('');
    setDescription('');
    setLatitude(6.4531);
    setLongitude(3.3958);
    setLatInput('6.4531');
    setLngInput('3.3958');
    setActiveCorridor(null);
    setShowCoordinateInputs(false);
    setPhotoUri(null);
    setPhotoBase64(null);
    setPhotoName(null);
    setIsMapCollapsed(false);
    setServerError('');
    setIsSuccess(false);
    setAiLoading(null);
    setCategorySuggestion(null);
    setDescriptionSuggestion(null);
    setDuplicateCheckResult(null);
    setDismissedDuplicates(false);
    setConfirmingCandidateId(null);
    setAiNotice(null);
  };

  const checkAuthForAi = (featureName: string): boolean => {
    if (!isAuthenticated) {
      const authMessage = `AI ${featureName} won't work because you are not authenticated. Sign in to your RouteX account to use AI assistance.`;
      setAiNotice(authMessage);
      if (onOpenAuth) {
        Alert.alert(
          'Sign In Required for AI',
          `AI ${featureName} won't work because you are not authenticated.\n\nRouteX AI features require an authenticated account to prevent automated abuse and manage query limits. Would you like to sign in now?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign In', onPress: () => onOpenAuth('login') },
          ]
        );
      }
      return false;
    }
    return true;
  };

  const handleSuggestCategory = async () => {
    if (!checkAuthForAi('category suggestion')) {
      return;
    }
    if (!description.trim() || description.trim().length < 5) {
      setServerError('Please enter at least 5 characters in description for AI to analyze.');
      return;
    }
    setAiLoading('category');
    setAiNotice(null);
    try {
      const res = await aiService.suggestCategory(description, category);
      setCategorySuggestion(res);
    } catch (err: any) {
      const isAuthErr =
        err?.status === 401 ||
        err?.status === 403 ||
        err?.data?.code === 'not_authenticated' ||
        err?.data?.detail?.toLowerCase().includes('not authenticated') ||
        err?.message?.toLowerCase().includes('not authenticated') ||
        err?.data?.detail?.toLowerCase().includes('credentials');

      const msg = isAuthErr
        ? "AI category suggestion won't work because you are not authenticated. Please sign in to use RouteX AI assistance."
        : (err?.data?.error || err?.data?.detail || err?.message || 'AI category suggestion is temporarily unavailable.');
      setAiNotice(msg);
      if (isAuthErr && onOpenAuth) {
        Alert.alert(
          'Sign In Required for AI',
          "AI category suggestion won't work because you are not authenticated. Would you like to sign in now?",
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign In', onPress: () => onOpenAuth('login') },
          ]
        );
      }
    } finally {
      setAiLoading(null);
    }
  };

  const handleImproveDescription = async () => {
    if (!checkAuthForAi('wording refinement')) {
      return;
    }
    if (!description.trim() || description.trim().length < 5) {
      setServerError('Please enter at least 5 characters in description to refine.');
      return;
    }
    setAiLoading('description');
    setAiNotice(null);
    try {
      const res = await aiService.improveDescription(description);
      setDescriptionSuggestion(res);
    } catch (err: any) {
      const isAuthErr =
        err?.status === 401 ||
        err?.status === 403 ||
        err?.data?.code === 'not_authenticated' ||
        err?.data?.detail?.toLowerCase().includes('not authenticated') ||
        err?.message?.toLowerCase().includes('not authenticated') ||
        err?.data?.detail?.toLowerCase().includes('credentials');

      const msg = isAuthErr
        ? "AI wording refinement won't work because you are not authenticated. Please sign in to use RouteX AI assistance."
        : (err?.data?.error || err?.data?.detail || err?.message || 'AI wording helper is temporarily unavailable.');
      setAiNotice(msg);
      if (isAuthErr && onOpenAuth) {
        Alert.alert(
          'Sign In Required for AI',
          "AI wording refinement won't work because you are not authenticated. Would you like to sign in now?",
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign In', onPress: () => onOpenAuth('login') },
          ]
        );
      }
    } finally {
      setAiLoading(null);
    }
  };

  const handleCheckDuplicates = async () => {
    if (!checkAuthForAi('duplicate scanning')) {
      return;
    }
    if (!latitude || !longitude) {
      setServerError('Please pick a location on the map first.');
      return;
    }
    if (!description.trim() || description.trim().length < 5) {
      setServerError('Please enter a description to compare against existing hazards.');
      return;
    }
    setAiLoading('duplicates');
    setAiNotice(null);
    try {
      const res = await aiService.checkDuplicates({
        latitude,
        longitude,
        description,
        category,
        radius_km: 1.0,
      });
      setDuplicateCheckResult(res);
    } catch (err: any) {
      const isAuthErr =
        err?.status === 401 ||
        err?.status === 403 ||
        err?.data?.code === 'not_authenticated' ||
        err?.data?.detail?.toLowerCase().includes('not authenticated') ||
        err?.message?.toLowerCase().includes('not authenticated') ||
        err?.data?.detail?.toLowerCase().includes('credentials');

      const msg = isAuthErr
        ? "AI duplicate scanner won't work because you are not authenticated. Please sign in to use RouteX AI assistance."
        : (err?.data?.error || err?.data?.detail || err?.message || 'Duplicate scanner is temporarily unavailable.');
      setAiNotice(msg);
      if (isAuthErr && onOpenAuth) {
        Alert.alert(
          'Sign In Required for AI',
          "AI duplicate scanning won't work because you are not authenticated. Would you like to sign in now?",
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign In', onPress: () => onOpenAuth('login') },
          ]
        );
      }
    } finally {
      setAiLoading(null);
    }
  };

  const handleConfirmCandidate = async (candidateId: number) => {
    if (!isAuthenticated) {
      if (onOpenAuth) {
        Alert.alert(
          'Sign In Required',
          'Please sign in to upvote and confirm existing road hazards.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign In', onPress: () => onOpenAuth('login') },
          ]
        );
      } else {
        Alert.alert('Sign In Required', 'Please sign in to confirm existing road hazards.');
      }
      return;
    }

    setConfirmingCandidateId(candidateId);
    try {
      await confirmHazard(candidateId);
      notifyHazardConfirmed(candidateId);
      Alert.alert(
        'Hazard Confirmed',
        'Thank you! You verified this existing hazard for your fellow commuters.',
        [{ text: 'OK', onPress: onSuccess }]
      );
    } catch (err: any) {
      const msg = err?.data?.detail || err?.message || 'Could not confirm this hazard right now.';
      Alert.alert('Error', msg);
    } finally {
      setConfirmingCandidateId(null);
    }
  };

  const handleLocationChange = (lat: number, lng: number) => {
    setLatitude(lat);
    setLongitude(lng);
    setLatInput(lat.toFixed(5));
    setLngInput(lng.toFixed(5));
  };

  const handleManualCoordApply = () => {
    const lat = parseFloat(latInput);
    const lng = parseFloat(lngInput);
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      setLatitude(lat);
      setLongitude(lng);
    } else {
      Alert.alert('Invalid Coordinates', 'Please enter valid latitude (-90 to 90) and longitude (-180 to 180).');
    }
  };

  const handleSelectCorridor = (corridor: typeof PRESET_CORRIDORS[0]) => {
    setActiveCorridor(corridor.name);
    handleLocationChange(corridor.lat, corridor.lng);
    if (!locationName) {
      setLocationName(corridor.landmark);
    }
  };

  const handlePickPhoto = async () => {
    Alert.alert('Attach Photo Evidence', 'Take a new photo or select from your camera roll:', [
      {
        text: 'Camera',
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Camera permission is required to capture photos.');
            return;
          }
          const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            quality: 0.7,
            base64: true,
          });
          if (!result.canceled && result.assets?.[0]?.uri) {
            setPhotoUri(result.assets[0].uri);
            setPhotoBase64(result.assets[0].base64 ? `data:image/jpeg;base64,${result.assets[0].base64}` : null);
            setPhotoName('hazard_capture.jpg');
          }
        },
      },
      {
        text: 'Photo Library',
        onPress: async () => {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Media library permission is required to select photos.');
            return;
          }
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            quality: 0.7,
            base64: true,
          });
          if (!result.canceled && result.assets?.[0]?.uri) {
            setPhotoUri(result.assets[0].uri);
            const name = result.assets[0].fileName || 'hazard_evidence.jpg';
            setPhotoName(name);
            const ext = name.split('.').pop()?.toLowerCase() || 'jpg';
            const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
            setPhotoBase64(result.assets[0].base64 ? `data:${mime};base64,${result.assets[0].base64}` : null);
          }
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleRemovePhoto = () => {
    setPhotoUri(null);
    setPhotoBase64(null);
    setPhotoName(null);
  };

  const handleSubmit = async (bypassDuplicateCheck = false) => {
    setServerError('');
    if (!locationName.trim() || locationName.trim().length < 3) {
      setServerError('Please enter the road or landmark name (minimum 3 characters). This is compulsory for roads not named on the map.');
      return;
    }
    if (!description.trim() || description.trim().length < 5) {
      setServerError('Please describe what road condition commuters should avoid (minimum 5 characters).');
      return;
    }

    if (!bypassDuplicateCheck && !dismissedDuplicates && duplicateCheckResult?.is_possible_duplicate) {
      Alert.alert(
        'Similar Hazard Reported Nearby',
        'A matching road hazard was recently reported within 1km. You can confirm the existing report to help it gain verification or proceed with submitting yours.',
        [
          { text: 'Review Duplicates', style: 'cancel' },
          {
            text: 'Submit Anyway',
            style: 'default',
            onPress: () => {
              setDismissedDuplicates(true);
              handleSubmit(true);
            },
          },
        ]
      );
      return;
    }

    setSubmitting(true);

    try {
      const submittedLocation = locationName.trim();
      await submitHazard({
        category,
        description: description.trim(),
        location_name: submittedLocation,
        latitude,
        longitude,
        photoUri: photoUri || undefined,
        photoBase64: photoBase64 || undefined,
      });

      // Dispatch local notification
      notifyHazardReported(submittedLocation, category).catch(() => {});

      setIsSuccess(true);
      setTimeout(() => {
        resetForm();
        onSuccess();
      }, 1400);
    } catch (err: any) {
      console.error('[RouteX] Submission failed:', err);
      if (err?.data?.detail) {
        setServerError(String(err.data.detail));
      } else if (err?.data && typeof err.data === 'object') {
        const errorMsg = Object.entries(err.data)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : String(v)}`)
          .join(' | ');
        setServerError(errorMsg || 'Please correct the highlighted fields and try submitting again.');
      } else if (err?.message) {
        setServerError(err.message);
      } else {
        setServerError('We could not save the report right now. Please check your network and try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const renderCategoryIcon = (catId: string, isSelected: boolean) => {
    const size = 16;
    const color = isSelected ? theme.teal : isDark ? '#94A3B8' : '#64748B';
    switch (catId) {
      case 'flooding':
        return <Droplets size={size} color={color} />;
      case 'pothole':
        return <CircleDot size={size} color={color} />;
      case 'blocked_road':
        return <AlertTriangle size={size} color={color} />;
      case 'fallen_tree':
        return <TreePine size={size} color={color} />;
      default:
        return <HelpCircle size={size} color={color} />;
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Top Header Bar with Back Button */}
      <View
        style={[
          styles.topBar,
          {
            backgroundColor: theme.headerBg,
            borderBottomColor: isDark ? '#1E3342' : '#2A4356',
            paddingTop: 10,
          },
        ]}
      >
        <TouchableOpacity
          onPress={onCancel}
          style={styles.backBtn}
          activeOpacity={0.7}
          accessibilityLabel="Back"
        >
          <ArrowLeft size={20} color="#FFFFFF" />
          <Text style={styles.backBtnText}>Back</Text>
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <RouteXLogoMark size={22} />
          <Text style={styles.headerTitle}>Report a Road Hazard</Text>
        </View>

        <View style={{ width: 60 }} />
      </View>

      {/* Guest Notice Banner if not logged in */}
      {!isAuthenticated && (
        <View
          style={[
            styles.guestBanner,
            {
              backgroundColor: isDark ? '#2B1C0B' : '#FEF3C7',
              borderColor: isDark ? '#78350F' : '#FDE68A',
            },
          ]}
        >
          <Shield size={16} color={isDark ? '#FBBF24' : '#D97706'} />
          <Text
            style={[
              styles.guestBannerText,
              { color: isDark ? '#FDE68A' : '#92400E' },
            ]}
          >
            Reporting as Community Guest.{' '}
            {onOpenAuth && (
              <Text
                style={[styles.signInLink, { color: theme.teal }]}
                onPress={() => onOpenAuth('login')}
              >
                Sign in
              </Text>
            )}{' '}
            to track this report on your dashboard.
          </Text>
        </View>
      )}

      {/* Success State Screen */}
      {isSuccess ? (
        <View style={styles.successContainer}>
          <View style={[styles.successIconBox, { backgroundColor: isDark ? '#143826' : '#DCFCE7' }]}>
            <CheckCircle2 size={48} color="#16A34A" />
          </View>
          <Text style={[styles.successTitle, { color: theme.textPrimary }]}>Report Submitted</Text>
          <Text style={[styles.successSubtitle, { color: theme.textMuted }]}>
            Thank you for helping road users know what lies ahead. Your report is now live for the community.
          </Text>
        </View>
      ) : (
        <>
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: keyboardHeight > 0 ? keyboardHeight + 80 : Math.max(insets.bottom, 24) + 32 },
            ]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
          >
            {/* Server Error Banner */}
            {serverError ? (
              <View style={[styles.errorBox, { backgroundColor: isDark ? '#3D1B1B' : '#FDF0F0' }]}>
                <AlertCircle size={16} color="#F87171" />
                <Text style={styles.errorText}>{serverError}</Text>
              </View>
            ) : null}

            {/* 1. Category Selection */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={[styles.fieldLabel, { color: theme.textPrimary }]}>
                  Hazard category <Text style={{ color: '#D64545' }}>*</Text>
                </Text>
                <TouchableOpacity
                  style={[
                    styles.aiActionButton,
                    {
                      backgroundColor: isDark ? 'rgba(8, 127, 140, 0.18)' : '#F0FDFA',
                      borderColor: isDark ? 'rgba(8, 127, 140, 0.4)' : '#99F6E4',
                    },
                  ]}
                  onPress={handleSuggestCategory}
                  disabled={aiLoading === 'category'}
                  activeOpacity={0.7}
                >
                  {aiLoading === 'category' ? (
                    <ActivityIndicator size="small" color={theme.teal} />
                  ) : (
                    <Sparkles size={12} color={theme.teal} />
                  )}
                  <Text style={[styles.aiActionButtonText, { color: theme.teal }]}>
                    Suggest Category
                  </Text>
                </TouchableOpacity>
              </View>

              {categorySuggestion && (
                <AISuggestionCardNative
                  title={`Suggested: ${categorySuggestion.category_display}`}
                  subtitle={`${Math.round(categorySuggestion.confidence * 100)}% match confidence`}
                  reason={categorySuggestion.reason}
                  applyLabel={`Switch to ${categorySuggestion.category_display}`}
                  onApply={() => {
                    setCategory(categorySuggestion.suggested_category);
                    setCategorySuggestion(null);
                  }}
                  onDismiss={() => setCategorySuggestion(null)}
                  disclaimer={categorySuggestion.disclaimer}
                />
              )}

              <View style={styles.categoryGrid}>
                {HAZARD_CATEGORIES.map((cat) => {
                  const isSelected = category === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.categoryCard,
                        {
                          backgroundColor: isSelected
                            ? theme.teal + '18'
                            : theme.surfaceSubtle,
                          borderColor: isSelected ? theme.teal : theme.border,
                        },
                      ]}
                      onPress={() => setCategory(cat.id)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.categoryHeader}>
                        {renderCategoryIcon(cat.id, isSelected)}
                        <Text
                          style={[
                            styles.categoryName,
                            { color: isSelected ? theme.teal : theme.textPrimary },
                          ]}
                        >
                          {cat.label}
                        </Text>
                      </View>
                      <Text
                        style={[styles.categoryDesc, { color: theme.textMuted }]}
                        numberOfLines={2}
                      >
                        {cat.description}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* 2. Map Location Picker */}
            <View style={styles.section}>
              <View style={styles.labelRow}>
                <Text style={[styles.fieldLabel, { color: theme.textPrimary }]}>
                  Location on map <Text style={{ color: '#D64545' }}>*</Text>
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[styles.coordBadge, { color: theme.teal }]}>
                    {latitude.toFixed(4)}, {longitude.toFixed(4)}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setIsMapCollapsed((prev) => !prev)}
                    style={[
                      styles.collapseMapToggle,
                      { borderColor: theme.border, backgroundColor: theme.surfaceSubtle },
                    ]}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.collapseMapToggleText, { color: theme.teal }]}>
                      {isMapCollapsed ? 'Show map' : 'Collapse'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {!isMapCollapsed ? (
                <>
                  <LocationPickerMapNative
                    latitude={latitude}
                    longitude={longitude}
                    onLocationChange={handleLocationChange}
                    height={180}
                  />

                  {/* Preset Corridors Chips */}
                  <View style={styles.corridorWrap}>
                    <Text style={[styles.subLabel, { color: theme.textSecondary }]}>
                      Major Lagos Corridors:
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
                      {PRESET_CORRIDORS.map((corridor) => {
                        const isSelected = activeCorridor === corridor.name;
                        return (
                          <TouchableOpacity
                            key={corridor.name}
                            style={[
                              styles.chip,
                              {
                                backgroundColor: isSelected ? theme.teal : theme.surfaceSubtle,
                                borderColor: isSelected ? theme.teal : theme.border,
                              },
                            ]}
                            onPress={() => handleSelectCorridor(corridor)}
                            activeOpacity={0.7}
                          >
                            <Text
                              style={[
                                styles.chipText,
                                { color: isSelected ? '#FFFFFF' : theme.textPrimary },
                              ]}
                            >
                              {corridor.name}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>

                  {/* Manual Coordinates Toggle */}
                  <TouchableOpacity
                    onPress={() => setShowCoordinateInputs((prev) => !prev)}
                    style={styles.toggleCoordsRow}
                    activeOpacity={0.7}
                  >
                    <Sliders size={13} color={theme.teal} />
                    <Text style={[styles.toggleCoordsText, { color: theme.teal }]}>
                      {showCoordinateInputs ? 'Hide Coordinate Inputs' : 'Input Coordinates Manually'}
                    </Text>
                  </TouchableOpacity>

                  {showCoordinateInputs && (
                    <View
                      style={[
                        styles.coordsBox,
                        { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
                      ]}
                    >
                      <View style={styles.coordInputCol}>
                        <Text style={[styles.coordInputLabel, { color: theme.textMuted }]}>
                          Latitude
                        </Text>
                        <TextInput
                          style={[
                            styles.coordTextInput,
                            {
                              backgroundColor: theme.surface,
                              borderColor: theme.border,
                              color: theme.textPrimary,
                            },
                          ]}
                          keyboardType="numeric"
                          value={latInput}
                          onChangeText={setLatInput}
                          placeholder="e.g. 6.4531"
                          placeholderTextColor={theme.textMuted}
                          onFocus={() => {
                            setTimeout(() => {
                              scrollViewRef.current?.scrollTo({ y: 220, animated: true });
                            }, 120);
                          }}
                        />
                      </View>

                      <View style={styles.coordInputCol}>
                        <Text style={[styles.coordInputLabel, { color: theme.textMuted }]}>
                          Longitude
                        </Text>
                        <TextInput
                          style={[
                            styles.coordTextInput,
                            {
                              backgroundColor: theme.surface,
                              borderColor: theme.border,
                              color: theme.textPrimary,
                            },
                          ]}
                          keyboardType="numeric"
                          value={lngInput}
                          onChangeText={setLngInput}
                          placeholder="e.g. 3.3958"
                          placeholderTextColor={theme.textMuted}
                          onFocus={() => {
                            setTimeout(() => {
                              scrollViewRef.current?.scrollTo({ y: 220, animated: true });
                            }, 120);
                          }}
                        />
                      </View>

                      <TouchableOpacity
                        style={[styles.applyCoordBtn, { backgroundColor: theme.teal }]}
                        onPress={handleManualCoordApply}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.applyCoordBtnText}>Apply</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              ) : (
                <TouchableOpacity
                  onPress={() => setIsMapCollapsed(false)}
                  style={[
                    styles.collapsedMapBanner,
                    { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
                  ]}
                  activeOpacity={0.7}
                >
                  <MapPin size={16} color={theme.teal} />
                  <Text style={[styles.collapsedMapText, { color: theme.textPrimary }]}>
                    Pin set at ({latitude.toFixed(4)}, {longitude.toFixed(4)})
                  </Text>
                  <Text style={[styles.collapsedMapAction, { color: theme.teal }]}>
                    Tap to expand map
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* 3. Location Label / Landmark */}
            <View style={styles.section}>
              <View style={styles.labelRow}>
                <Text style={[styles.fieldLabel, { color: theme.textPrimary }]}>
                  Road or landmark name <Text style={{ color: '#D64545' }}>*</Text>
                </Text>
                <Text style={[styles.charCount, { color: theme.teal, fontWeight: '700' }]}>
                  Compulsory
                </Text>
              </View>
              <Text style={[styles.fieldHint, { color: theme.textMuted }]}>
                Important for roads without names on the map: specify street name, nearest junction, or prominent landmark.
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.surfaceSubtle,
                    borderColor: theme.border,
                    color: theme.textPrimary,
                  },
                ]}
                placeholder="e.g. Apatira Street by Market / Lekki-Epe near Jakande"
                placeholderTextColor={theme.textMuted}
                maxLength={150}
                value={locationName}
                onChangeText={setLocationName}
                onFocus={() => {
                  setIsMapCollapsed(true);
                  setTimeout(() => {
                    scrollViewRef.current?.scrollTo({ y: 320, animated: true });
                  }, 120);
                }}
              />
            </View>

            {/* 4. Hazard Description & AI Refine Wording */}
            <View style={styles.section}>
              <View style={styles.labelRow}>
                <Text style={[styles.fieldLabel, { color: theme.textPrimary }]}>
                  Hazard description <Text style={{ color: '#D64545' }}>*</Text>
                </Text>
                <View style={styles.descActionsRight}>
                  <TouchableOpacity
                    style={styles.refineWordingBtn}
                    onPress={handleImproveDescription}
                    disabled={aiLoading === 'description'}
                    activeOpacity={0.7}
                  >
                    {aiLoading === 'description' ? (
                      <ActivityIndicator size="small" color={theme.teal} />
                    ) : (
                      <Sparkles size={11} color={theme.teal} />
                    )}
                    <Text style={[styles.refineWordingText, { color: theme.teal }]}>
                      Refine wording
                    </Text>
                  </TouchableOpacity>
                  <Text style={[styles.charCount, { color: theme.textMuted }]}>
                    {description.length}/1000
                  </Text>
                </View>
              </View>
              <TextInput
                style={[
                  styles.textArea,
                  {
                    backgroundColor: theme.surfaceSubtle,
                    borderColor: theme.border,
                    color: theme.textPrimary,
                  },
                ]}
                placeholder="Describe what you see: depth of water, which lanes are affected, or dangerous road edges."
                placeholderTextColor={theme.textMuted}
                multiline
                numberOfLines={3}
                maxLength={1000}
                value={description}
                onChangeText={setDescription}
                onFocus={() => {
                  setIsMapCollapsed(true);
                  setTimeout(() => {
                    scrollViewRef.current?.scrollTo({ y: 460, animated: true });
                  }, 120);
                }}
              />

              {descriptionSuggestion && (
                <AISuggestionCardNative
                  title="Refined Description"
                  subtitle={descriptionSuggestion.changes_made}
                  content={descriptionSuggestion.suggested_description}
                  applyLabel="Use Refined Text"
                  onApply={() => {
                    setDescription(descriptionSuggestion.suggested_description);
                    setDescriptionSuggestion(null);
                  }}
                  onDismiss={() => setDescriptionSuggestion(null)}
                  disclaimer={descriptionSuggestion.disclaimer}
                />
              )}
            </View>

            {/* 5. Optional Photo Evidence */}
            <View style={styles.section}>
              <View style={styles.labelRow}>
                <Text style={[styles.fieldLabel, { color: theme.textPrimary }]}>
                  Photo evidence{' '}
                  <Text style={{ fontWeight: '400', color: theme.textMuted }}>
                    (auto-converted to WebP)
                  </Text>
                </Text>
                {photoUri && (
                  <View style={styles.webpBadge}>
                    <Sparkles size={11} color="#16A34A" />
                    <Text style={styles.webpBadgeText}>WebP Optimized</Text>
                  </View>
                )}
              </View>

              {photoUri ? (
                <View
                  style={[
                    styles.photoPreviewCard,
                    { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
                  ]}
                >
                  <Image source={{ uri: photoUri }} style={styles.photoThumbnail} />
                  <View style={styles.photoMeta}>
                    <View style={styles.photoNameRow}>
                      <Text
                        style={[styles.photoName, { color: theme.textPrimary }]}
                        numberOfLines={1}
                      >
                        {photoName || 'hazard_evidence.webp'}
                      </Text>
                      <View style={[styles.webpChip, { backgroundColor: theme.teal + '22' }]}>
                        <Text style={[styles.webpChipText, { color: theme.teal }]}>WEBP</Text>
                      </View>
                    </View>
                    <TouchableOpacity onPress={handlePickPhoto} activeOpacity={0.7}>
                      <Text style={[styles.changePhotoText, { color: theme.teal }]}>
                        Change photo
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity
                    onPress={handleRemovePhoto}
                    style={styles.photoRemoveBtn}
                    activeOpacity={0.7}
                  >
                    <X size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.photoUploadBtn,
                    { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
                  ]}
                  onPress={handlePickPhoto}
                  activeOpacity={0.7}
                >
                  <View style={styles.photoUploadIcons}>
                    <Camera size={20} color={theme.textMuted} />
                    <ImageIcon size={20} color={theme.textMuted} />
                  </View>
                  <Text style={[styles.photoUploadTitle, { color: theme.teal }]}>
                    Select or capture a photo
                  </Text>
                  <Text style={[styles.photoUploadSub, { color: theme.textMuted }]}>
                    Compressed automatically &bull; High resolution, low data
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* 6. Smart Community Deduplication Check */}
            <View style={[styles.section, styles.dedupSection, { borderTopColor: theme.borderSubtle }]}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.dedupTitleRow}>
                  <Sparkles size={13} color={theme.teal} />
                  <Text style={[styles.fieldLabel, { color: theme.textPrimary, marginBottom: 0 }]}>
                    Smart Deduplication
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.aiActionButton,
                    {
                      backgroundColor: isDark ? 'rgba(8, 127, 140, 0.18)' : '#F0FDFA',
                      borderColor: isDark ? 'rgba(8, 127, 140, 0.4)' : '#99F6E4',
                    },
                  ]}
                  onPress={handleCheckDuplicates}
                  disabled={aiLoading === 'duplicates'}
                  activeOpacity={0.7}
                >
                  {aiLoading === 'duplicates' ? (
                    <ActivityIndicator size="small" color={theme.teal} />
                  ) : (
                    <Sparkles size={12} color={theme.teal} />
                  )}
                  <Text style={[styles.aiActionButtonText, { color: theme.teal }]}>
                    Scan Nearby Duplicates
                  </Text>
                </TouchableOpacity>
              </View>

              {duplicateCheckResult && (
                <AISuggestionCardNative
                  title={
                    duplicateCheckResult.is_possible_duplicate
                      ? 'Potential Duplicate Detected'
                      : 'No Duplicates Found'
                  }
                  subtitle={`${duplicateCheckResult.nearby_count} active reports within 1km`}
                  content={
                    duplicateCheckResult.candidates.length > 0 ? (
                      <View style={styles.dedupContentContainer}>
                        <Text
                          style={[
                            styles.dedupAnalysisText,
                            { color: isDark ? '#FCD34D' : '#92400E' },
                          ]}
                        >
                          {duplicateCheckResult.analysis}
                        </Text>
                        <View style={styles.dedupCandidatesList}>
                          {duplicateCheckResult.candidates.map((cand) => (
                            <View
                              key={cand.id}
                              style={[
                                styles.candCard,
                                {
                                  backgroundColor: isDark ? '#142533' : '#F8FAFC',
                                  borderColor: theme.border,
                                },
                              ]}
                            >
                              <View style={styles.candHeaderRow}>
                                <Text
                                  style={[
                                    styles.candTitle,
                                    { color: theme.textPrimary },
                                  ]}
                                >
                                  #{cand.id} {cand.category_display}
                                </Text>
                                <Text style={[styles.candDistance, { color: theme.teal }]}>
                                  {cand.distance_meters}m away
                                </Text>
                              </View>
                              <Text
                                style={[styles.candDesc, { color: theme.textSecondary }]}
                                numberOfLines={1}
                              >
                                {cand.description}
                              </Text>
                              <Text
                                style={[
                                  styles.candRationale,
                                  { color: isDark ? '#FBBF24' : '#B45309' },
                                ]}
                              >
                                {cand.match_rationale}
                              </Text>
                              <View style={styles.candFooterRow}>
                                <Text style={{ fontSize: 9.5, color: theme.textMuted }}>
                                  Already reported nearby?
                                </Text>
                                <TouchableOpacity
                                  style={[
                                    styles.candConfirmBtn,
                                    {
                                      backgroundColor: isDark ? 'rgba(8, 127, 140, 0.2)' : '#E6FFFA',
                                      borderColor: isDark ? 'rgba(8, 127, 140, 0.4)' : '#99F6E4',
                                      borderWidth: 1,
                                    },
                                  ]}
                                  onPress={() => handleConfirmCandidate(cand.id)}
                                  disabled={confirmingCandidateId === cand.id}
                                  activeOpacity={0.7}
                                >
                                  {confirmingCandidateId === cand.id ? (
                                    <ActivityIndicator size="small" color={theme.teal} />
                                  ) : (
                                    <ThumbsUp size={11} color={theme.teal} />
                                  )}
                                  <Text style={[styles.candConfirmText, { color: theme.teal }]}>
                                    Confirm This Hazard Instead
                                  </Text>
                                </TouchableOpacity>
                              </View>
                            </View>
                          ))}
                        </View>
                      </View>
                    ) : (
                      <Text style={[styles.dedupClearText, { color: '#16A34A' }]}>
                        {duplicateCheckResult.analysis}
                      </Text>
                    )
                  }
                  onDismiss={() => setDuplicateCheckResult(null)}
                  disclaimer={duplicateCheckResult.disclaimer}
                />
              )}

              {aiNotice && (
                <View
                  style={[
                    styles.aiNoticeBox,
                    {
                      backgroundColor: isDark ? 'rgba(251, 191, 36, 0.12)' : '#FEF3C7',
                      borderColor: isDark ? 'rgba(251, 191, 36, 0.35)' : '#FDE68A',
                    },
                  ]}
                >
                  <AlertCircle size={15} color="#D97706" style={{ marginTop: 2 }} />
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={[styles.aiNoticeText, { color: isDark ? '#FCD34D' : '#92400E' }]}>
                      {aiNotice}
                    </Text>
                    {!isAuthenticated && onOpenAuth && (
                      <TouchableOpacity
                        onPress={() => onOpenAuth('login')}
                        style={styles.aiNoticeSignInBtn}
                        activeOpacity={0.7}
                      >
                        <LogIn size={12} color={isDark ? '#FCD34D' : '#92400E'} />
                        <Text style={[styles.aiNoticeSignInText, { color: isDark ? '#FCD34D' : '#92400E' }]}>
                          Sign In to Use RouteX AI
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <TouchableOpacity onPress={() => setAiNotice(null)} style={{ padding: 4 }}>
                    <X size={13} color={isDark ? '#FCD34D' : '#92400E'} />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Inline Action Buttons at bottom of form */}
            <View style={styles.inlineActionRow}>
              <TouchableOpacity
                style={[
                  styles.cancelBtn,
                  { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
                ]}
                onPress={onCancel}
                disabled={submitting}
                activeOpacity={0.7}
              >
                <Text style={[styles.cancelBtnText, { color: theme.textPrimary }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  { backgroundColor: theme.teal, opacity: submitting ? 0.7 : 1 },
                ]}
                onPress={handleSubmit}
                disabled={submitting}
                activeOpacity={0.8}
              >
                {submitting ? (
                  <View style={styles.submittingRow}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={styles.submitBtnText}>Submitting report...</Text>
                  </View>
                ) : (
                  <Text style={styles.submitBtnText}>Submit report</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    width: 60,
  },
  backBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  guestBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  guestBannerText: {
    fontSize: 11,
    flex: 1,
    lineHeight: 16,
  },
  signInLink: {
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F87171',
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
    flex: 1,
    lineHeight: 16,
  },
  section: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 6,
    marginBottom: 4,
  },
  coordBadge: {
    fontSize: 11,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  charCount: {
    fontSize: 11,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryCard: {
    width: '48.5%',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    gap: 4,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '700',
  },
  categoryDesc: {
    fontSize: 10,
    lineHeight: 14,
  },
  corridorWrap: {
    marginTop: 4,
  },
  chipsScroll: {
    flexDirection: 'row',
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 6,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  collapseMapToggle: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  collapseMapToggleText: {
    fontSize: 10,
    fontWeight: '700',
  },
  collapsedMapBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 6,
  },
  collapsedMapText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  collapsedMapAction: {
    fontSize: 11,
    fontWeight: '700',
  },
  toggleCoordsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  toggleCoordsText: {
    fontSize: 11,
    fontWeight: '700',
  },
  coordsBox: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 6,
  },
  coordInputCol: {
    flex: 1,
    gap: 4,
  },
  coordInputLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  coordTextInput: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 12,
  },
  applyCoordBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    justifyContent: 'center',
  },
  applyCoordBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  fieldHint: {
    fontSize: 11,
    lineHeight: 15,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  webpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  webpBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#16A34A',
  },
  photoUploadBtn: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  photoUploadIcons: {
    flexDirection: 'row',
    gap: 8,
  },
  photoUploadTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  photoUploadSub: {
    fontSize: 11,
    textAlign: 'center',
  },
  photoPreviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
  },
  photoThumbnail: {
    width: 50,
    height: 50,
    borderRadius: 6,
  },
  photoMeta: {
    flex: 1,
    gap: 4,
  },
  photoNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  photoName: {
    fontSize: 12,
    fontWeight: '600',
    flexShrink: 1,
  },
  webpChip: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  webpChipText: {
    fontSize: 8,
    fontWeight: '800',
  },
  changePhotoText: {
    fontSize: 11,
    fontWeight: '600',
  },
  photoRemoveBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  inlineActionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    marginBottom: 16,
  },
  cancelBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  submitBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submittingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  successContainer: {
    flex: 1,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  successIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  successSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 300,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  aiActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  aiActionButtonText: {
    fontSize: 11,
    fontWeight: '700',
  },
  descActionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  refineWordingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  refineWordingText: {
    fontSize: 11,
    fontWeight: '600',
  },
  dedupSection: {
    paddingTop: 12,
    borderTopWidth: 1,
  },
  dedupTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dedupContentContainer: {
    gap: 8,
  },
  dedupAnalysisText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  dedupCandidatesList: {
    gap: 6,
    maxHeight: 180,
  },
  candCard: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 2,
  },
  candHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  candTitle: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  candDistance: {
    fontSize: 10,
    fontWeight: '600',
  },
  candDesc: {
    fontSize: 11,
  },
  candRationale: {
    fontSize: 10,
    fontStyle: 'italic',
  },
  candFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(148, 163, 184, 0.25)',
  },
  candConfirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  candConfirmText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  dedupClearText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  aiNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
    marginTop: 6,
  },
  aiNoticeText: {
    fontSize: 11,
    flex: 1,
    lineHeight: 16,
  },
  aiNoticeSignInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(217, 119, 6, 0.18)',
  },
  aiNoticeSignInText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
