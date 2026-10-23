import React, { useState, useEffect, useMemo } from 'react';
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
  Modal,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X,
  AlertCircle,
  Droplets,
  CircleDot,
  AlertTriangle,
  TreePine,
  HelpCircle,
  MapPin,
  Camera,
  ImageIcon,
  Sparkles,
  CheckCircle2,
  Navigation,
  Sliders,
  ShieldCheck,
  Loader2,
  ThumbsUp,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
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

interface ReportModalNativeProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onOpenAuth?: (mode?: 'login' | 'register') => void;
}

const PRESET_CORRIDORS = [
  { name: 'Lekki-Epe', lat: 6.4428, lng: 3.4839, landmark: 'Lekki-Epe Expressway near Chevron' },
  { name: 'Ikeja / Maryland', lat: 6.5721, lng: 3.3672, landmark: 'Ikorodu Road, Maryland Underpass' },
  { name: 'Victoria Island', lat: 6.4355, lng: 3.4211, landmark: 'Ozumba Mbadiwe Avenue near Civic Centre' },
  { name: 'Third Mainland', lat: 6.4674, lng: 3.3982, landmark: 'Third Mainland Bridge, Adeniji Adele Ramp' },
  { name: 'Surulere', lat: 6.5012, lng: 3.3582, landmark: 'Western Avenue, Ojuelegba Flyover' },
];

export const ReportModalNative: React.FC<ReportModalNativeProps> = ({
  visible,
  onClose,
  onSuccess,
  onOpenAuth,
}) => {
  const insets = useSafeAreaInsets();
  const { isDark, theme } = useTheme();
  const { isAuthenticated } = useAuth();
  const { showAlert } = useAlert();
  const { height: windowHeight } = useWindowDimensions();

  const bottomSafePadding = Math.max(insets.bottom, Platform.OS === 'android' ? 24 : 16);

  // Dynamic keyboard inset tracking to prevent keyboard overlap on Android and iOS
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const modalMaxHeight = useMemo(() => {
    if (keyboardHeight > 0) {
      return Math.max(windowHeight - keyboardHeight - 16, 260);
    }
    return Math.min(windowHeight * 0.94, 820);
  }, [windowHeight, keyboardHeight]);

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
  const [photoName, setPhotoName] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

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
    setPhotoName(null);
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
        showAlert(
          'Sign In Required for AI',
          `AI ${featureName} won't work because you are not authenticated.\n\nRouteX AI features require an authenticated account to prevent automated abuse and manage query limits. Would you like to sign in now?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Sign In',
              onPress: () => {
                handleClose();
                onOpenAuth('login');
              },
            },
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
        showAlert(
          'Sign In Required for AI',
          "AI category suggestion won't work because you are not authenticated. Would you like to sign in now?",
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Sign In',
              onPress: () => {
                handleClose();
                onOpenAuth('login');
              },
            },
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
        showAlert(
          'Sign In Required for AI',
          "AI wording refinement won't work because you are not authenticated. Would you like to sign in now?",
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Sign In',
              onPress: () => {
                handleClose();
                onOpenAuth('login');
              },
            },
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
      setServerError('Please select a valid location on the map first.');
      return;
    }
    if (!description.trim() || description.trim().length < 5) {
      setServerError('Please enter a description to compare against existing hazard reports.');
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
        showAlert(
          'Sign In Required for AI',
          "AI duplicate scanning won't work because you are not authenticated. Would you like to sign in now?",
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Sign In',
              onPress: () => {
                handleClose();
                onOpenAuth('login');
              },
            },
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
        showAlert(
          'Sign In Required',
          'Please sign in to upvote and confirm existing road hazards.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Sign In',
              onPress: () => {
                handleClose();
                onOpenAuth('login');
              },
            },
          ]
        );
      } else {
        showAlert('Sign In Required', 'Please sign in to confirm existing road hazards.');
      }
      return;
    }

    setConfirmingCandidateId(candidateId);
    try {
      await confirmHazard(candidateId);
      notifyHazardConfirmed('hazard');
      showAlert(
        'Hazard Confirmed',
        'Thank you! You verified this existing hazard for your fellow commuters.',
        [
          {
            text: 'OK',
            onPress: () => {
              handleClose();
              onSuccess();
            },
          },
        ]
      );
    } catch (err: any) {
      const msg = err?.data?.detail || err?.message || 'Could not confirm this hazard right now.';
      showAlert('Error', msg);
    } finally {
      setConfirmingCandidateId(null);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
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
      showAlert('Invalid Coordinates', 'Please enter valid latitude (-90 to 90) and longitude (-180 to 180).');
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
    showAlert('Attach Photo Evidence', 'Take a new photo or select from your camera roll:', [
      {
        text: 'Camera',
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') {
            showAlert('Permission Denied', 'Camera permission is required to capture photos.');
            return;
          }
          const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            quality: 0.8,
          });
          if (!result.canceled && result.assets?.[0]?.uri) {
            setPhotoUri(result.assets[0].uri);
            setPhotoName('hazard_capture.webp');
          }
        },
      },
      {
        text: 'Photo Library',
        onPress: async () => {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') {
            showAlert('Permission Denied', 'Media library permission is required to select photos.');
            return;
          }
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            quality: 0.8,
          });
          if (!result.canceled && result.assets?.[0]?.uri) {
            setPhotoUri(result.assets[0].uri);
            const name = result.assets[0].fileName || 'hazard_evidence.webp';
            setPhotoName(name);
          }
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleRemovePhoto = () => {
    setPhotoUri(null);
    setPhotoName(null);
  };

  const handleSubmit = async (bypassDuplicateCheck = false) => {
    setServerError('');
    if (!description.trim() || description.trim().length < 5) {
      setServerError('Please describe what road condition commuters should avoid (minimum 5 characters).');
      return;
    }

    if (!bypassDuplicateCheck && !dismissedDuplicates && duplicateCheckResult?.is_possible_duplicate) {
      showAlert(
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
      const submittedLocation = locationName.trim() || 'Reported Location';
      await submitHazard({
        category,
        description: description.trim(),
        location_name: submittedLocation,
        latitude,
        longitude,
        photoUri: photoUri || undefined,
      });

      // Dispatch local notification
      notifyHazardReported(submittedLocation, category).catch(() => {});

      setIsSuccess(true);
      setTimeout(() => {
        resetForm();
        onSuccess();
      }, 1400);
    } catch (err: any) {
      if (err?.status === 401 || err?.status === 403) {
        setServerError('You must be signed in to submit a hazard report. Please sign in and try again.');
      } else if (err?.data?.description) {
        setServerError(Array.isArray(err.data.description) ? err.data.description[0] : String(err.data.description));
      } else if (err?.data?.detail) {
        setServerError(String(err.data.detail));
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
        <KeyboardAvoidingView
          style={styles.keyboardAvoider}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
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
            {/* Pinned Sticky Header */}
            <View style={[styles.headerRow, { borderBottomColor: theme.borderSubtle, backgroundColor: theme.surface }]}>
              <View style={styles.headerLeft}>
                <RouteXLogoMark size={30} />
                <View style={styles.headerMeta}>
                  <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                    Report a Road Hazard
                  </Text>
                  <Text style={[styles.modalSubtitle, { color: theme.textMuted }]}>
                    Share timely road conditions to help fellow road users.
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={handleClose}
                style={styles.closeBtn}
                accessibilityLabel="Close dialog"
                activeOpacity={0.7}
              >
                <X size={20} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Form Content / Success Screen / Auth Required Screen */}
            {isSuccess ? (
              <View style={styles.successContainer}>
                <View style={[styles.successIconBox, { backgroundColor: isDark ? '#143826' : '#DCFCE7' }]}>
                  <CheckCircle2 size={42} color="#16A34A" />
                </View>
                <Text style={[styles.successTitle, { color: theme.textPrimary }]}>Report Submitted</Text>
                <Text style={[styles.successSubtitle, { color: theme.textMuted }]}>
                  Thank you for helping road users know what lies ahead. Your report is now live for the community.
                </Text>
              </View>
            ) : !isAuthenticated ? (
              <View style={styles.authPromptContainer}>
                <View style={[styles.authIconBox, { backgroundColor: isDark ? '#113540' : '#E0F2FE' }]}>
                  <ShieldCheck size={42} color={theme.teal} />
                </View>
                <Text style={[styles.authPromptTitle, { color: theme.textPrimary }]}>
                  Sign in to report a road hazard
                </Text>
                <Text style={[styles.authPromptSubtitle, { color: theme.textMuted }]}>
                  RouteX requires an account to submit hazard reports to maintain community trust, prevent abuse, and allow updates to be tracked transparently.
                </Text>
                <View style={styles.authBtnRow}>
                  <TouchableOpacity
                    style={[styles.authPrimaryBtn, { backgroundColor: theme.teal }]}
                    onPress={() => {
                      handleClose();
                      if (onOpenAuth) onOpenAuth('login');
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.authPrimaryBtnText}>Sign In</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.authSecondaryBtn,
                      { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
                    ]}
                    onPress={() => {
                      handleClose();
                      if (onOpenAuth) onOpenAuth('register');
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.authSecondaryBtnText, { color: theme.textPrimary }]}>
                      Create an account
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <>
                <ScrollView
                  contentContainerStyle={styles.formContent}
                  keyboardShouldPersistTaps="handled"
                  automaticallyAdjustKeyboardInsets={true}
                  keyboardDismissMode="interactive"
                  showsVerticalScrollIndicator={false}
                >
                  {/* Server Error Banner */}
                  {serverError ? (
                    <View style={[styles.errorBox, { backgroundColor: isDark ? '#3D1B1B' : '#FDF0F0' }]}>
                      <AlertCircle size={15} color="#F87171" />
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
                            <View style={styles.catHeader}>
                              {renderCategoryIcon(cat.id, isSelected)}
                              <Text
                                style={[
                                  styles.catLabel,
                                  { color: isSelected ? theme.teal : theme.textPrimary },
                                ]}
                                numberOfLines={1}
                              >
                                {cat.label}
                              </Text>
                            </View>
                            <Text style={[styles.catDesc, { color: theme.textMuted }]} numberOfLines={1}>
                              {cat.description}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  {/* 2. Interactive Map Location Picker & GPS Current Location */}
                  <View style={styles.section}>
                    <Text style={[styles.fieldLabel, { color: theme.textPrimary }]}>
                      Location on map <Text style={{ color: '#D64545' }}>*</Text>
                    </Text>

                    {/* Interactive Leaflet Map Preview */}
                    <LocationPickerMapNative
                      latitude={latitude}
                      longitude={longitude}
                      onLocationChange={handleLocationChange}
                      height={185}
                    />

                    {/* Coordinates Readout & Manual Coordinates Input Toggle */}
                    <View style={styles.coordBar}>
                      <View style={styles.gpsCoordBadge}>
                        <MapPin size={11} color={theme.teal} />
                        <Text style={[styles.gpsCoordText, { color: theme.teal }]}>
                          GPS: {latitude.toFixed(4)}, {longitude.toFixed(4)}
                        </Text>
                      </View>

                      <TouchableOpacity
                        style={styles.toggleCoordBtn}
                        onPress={() => setShowCoordinateInputs((prev) => !prev)}
                        activeOpacity={0.7}
                      >
                        <Sliders size={12} color={theme.teal} />
                        <Text style={[styles.toggleCoordText, { color: theme.teal }]}>
                          {showCoordinateInputs ? 'Hide Input' : 'Input Position'}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* Option to Input Position Manually */}
                    {showCoordinateInputs && (
                      <View style={[styles.coordInputsBox, { backgroundColor: theme.surfaceSubtle, borderColor: theme.border }]}>
                        <Text style={[styles.coordInputsTitle, { color: theme.textPrimary }]}>
                          Direct Coordinates Entry (Latitude & Longitude)
                        </Text>
                        <View style={styles.coordInputsRow}>
                          <View style={styles.coordCol}>
                            <Text style={[styles.coordSubLabel, { color: theme.textMuted }]}>Latitude</Text>
                            <TextInput
                              style={[
                                styles.coordInput,
                                {
                                  backgroundColor: theme.surface,
                                  borderColor: theme.border,
                                  color: theme.textPrimary,
                                },
                              ]}
                              value={latInput}
                              onChangeText={setLatInput}
                              keyboardType="numeric"
                              placeholder="e.g. 6.4531"
                              placeholderTextColor={theme.textMuted}
                            />
                          </View>

                          <View style={styles.coordCol}>
                            <Text style={[styles.coordSubLabel, { color: theme.textMuted }]}>Longitude</Text>
                            <TextInput
                              style={[
                                styles.coordInput,
                                {
                                  backgroundColor: theme.surface,
                                  borderColor: theme.border,
                                  color: theme.textPrimary,
                                },
                              ]}
                              value={lngInput}
                              onChangeText={setLngInput}
                              keyboardType="numeric"
                              placeholder="e.g. 3.3958"
                              placeholderTextColor={theme.textMuted}
                            />
                          </View>

                          <TouchableOpacity
                            style={[styles.applyCoordBtn, { backgroundColor: theme.teal }]}
                            onPress={handleManualCoordApply}
                            activeOpacity={0.8}
                          >
                            <Text style={styles.applyCoordText}>Apply</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}

                    {/* Preset Corridors Horizontal Slider */}
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.corridorsScroll}
                    >
                      {PRESET_CORRIDORS.map((c) => {
                        const isMatch = activeCorridor === c.name;
                        return (
                          <TouchableOpacity
                            key={c.name}
                            style={[
                              styles.corridorChip,
                              {
                                backgroundColor: isMatch ? theme.teal : theme.surfaceSubtle,
                                borderColor: isMatch ? theme.teal : theme.border,
                              },
                            ]}
                            onPress={() => handleSelectCorridor(c)}
                            activeOpacity={0.7}
                          >
                            <Navigation size={11} color={isMatch ? '#FFFFFF' : theme.textMuted} />
                            <Text
                              style={[
                                styles.corridorChipText,
                                { color: isMatch ? '#FFFFFF' : theme.textPrimary },
                              ]}
                            >
                              {c.name}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>

                  {/* 3. Landmark / Street Name */}
                  <View style={styles.section}>
                    <Text style={[styles.fieldLabel, { color: theme.textPrimary }]}>
                      Street name or landmark{' '}
                      <Text style={{ fontWeight: '400', color: theme.textMuted }}>(optional)</Text>
                    </Text>
                    <TextInput
                      style={[
                        styles.textInput,
                        {
                          backgroundColor: theme.surfaceSubtle,
                          borderColor: theme.border,
                          color: theme.textPrimary,
                        },
                      ]}
                      placeholder="e.g. Lekki-Epe Expressway by Jakande Roundabout"
                      placeholderTextColor={theme.textMuted}
                      maxLength={150}
                      value={locationName}
                      onChangeText={setLocationName}
                    />
                  </View>

                  {/* 4. Description with Character Counter & AI Refine Wording */}
                  <View style={styles.section}>
                    <View style={styles.labelRow}>
                      <Text style={[styles.fieldLabel, { color: theme.textPrimary }]}>
                        Description <Text style={{ color: '#D64545' }}>*</Text>
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
                        <Text style={[styles.charCounter, { color: theme.textMuted }]}>
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
                        Optional photo evidence{' '}
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
                          Automatically compressed to WebP &bull; High resolution, low data
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
                        <AlertCircle size={13} color="#D97706" />
                        <Text style={[styles.aiNoticeText, { color: isDark ? '#FCD34D' : '#92400E' }]}>
                          {aiNotice}
                        </Text>
                        <TouchableOpacity onPress={() => setAiNotice(null)} style={{ padding: 2 }}>
                          <X size={12} color={isDark ? '#FCD34D' : '#92400E'} />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </ScrollView>

                {/* Pinned Sticky Footer */}
                <View
                  style={[
                    styles.footerRow,
                    { borderTopColor: theme.borderSubtle, backgroundColor: theme.surface },
                  ]}
                >
                  <TouchableOpacity
                    style={[
                      styles.cancelBtn,
                      { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
                    ]}
                    onPress={handleClose}
                    disabled={submitting}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.cancelBtnText, { color: theme.textPrimary }]}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.submitButton,
                      { backgroundColor: theme.teal, opacity: submitting ? 0.7 : 1 },
                    ]}
                    onPress={() => handleSubmit()}
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
              </>
            )}
          </View>
        </KeyboardAvoidingView>
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
  keyboardAvoider: {
    flex: 1,
    justifyContent: 'flex-end',
    width: '100%',
  },
  modalCard: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    flexShrink: 1,
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
  headerMeta: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 16,
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
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
    paddingBottom: 20,
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
  section: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  charCounter: {
    fontSize: 10,
    fontWeight: '500',
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
    borderWidth: 1,
    gap: 2,
  },
  catHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  catLabel: {
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  catDesc: {
    fontSize: 9,
    marginTop: 2,
  },
  coordBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  gpsCoordBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  gpsCoordText: {
    fontSize: 11,
    fontWeight: '700',
  },
  toggleCoordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  toggleCoordText: {
    fontSize: 11,
    fontWeight: '700',
  },
  coordInputsBox: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    gap: 8,
    marginTop: 4,
  },
  coordInputsTitle: {
    fontSize: 11,
    fontWeight: '700',
  },
  coordInputsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  coordCol: {
    flex: 1,
    gap: 3,
  },
  coordSubLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  coordInput: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 11,
  },
  applyCoordBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyCoordText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  corridorsScroll: {
    gap: 6,
    paddingTop: 4,
  },
  corridorChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  corridorChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 12,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 12,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  webpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  webpBadgeText: {
    color: '#16A34A',
    fontSize: 9,
    fontWeight: '700',
  },
  photoUploadBtn: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  photoUploadIcons: {
    flexDirection: 'row',
    gap: 8,
  },
  photoUploadTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  photoUploadSub: {
    fontSize: 10,
  },
  photoPreviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    padding: 8,
    gap: 10,
  },
  photoThumbnail: {
    width: 52,
    height: 52,
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
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  webpChip: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  webpChipText: {
    fontSize: 8,
    fontWeight: '800',
  },
  changePhotoText: {
    fontSize: 11,
    fontWeight: '700',
  },
  photoRemoveBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submittingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  successContainer: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  successIconBox: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  successSubtitle: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  authPromptContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  authIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  authPromptTitle: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  authPromptSubtitle: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 320,
  },
  authBtnRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginTop: 8,
  },
  authPrimaryBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  authSecondaryBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authSecondaryBtnText: {
    fontSize: 13,
    fontWeight: '600',
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
  },
});
