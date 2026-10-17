import React, { useState } from 'react';
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
} from 'react-native';
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
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../theme/ThemeContext';
import { HAZARD_CATEGORIES } from '../constants/hazardTypes';
import { submitHazard } from '../services/hazardService';
import { RouteXLogoMark } from './RouteXLogoMark';

interface ReportModalNativeProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const PRESET_CORRIDORS = [
  { name: 'Lekki-Epe', lat: 6.4428, lng: 3.4839, landmark: 'Lekki-Epe Expressway near Chevron' },
  { name: 'Ikeja / Maryland', lat: 6.5721, lng: 3.3672, landmark: 'Ikorodu Road, Maryland Underpass' },
  { name: 'Victoria Island', lat: 6.4355, lng: 3.4211, landmark: 'Ozumba Mbadiwe Avenue near Civic Centre' },
  { name: 'Third Mainland', lat: 6.4674, lng: 3.3982, landmark: 'Third Mainland Bridge, Adeniji Adele Ramp' },
  { name: 'Surulere', lat: 6.5012, lng: 3.3582, landmark: 'Western Avenue, Ojuelegba Flyover' },
];

export const ReportModalNative: React.FC<ReportModalNativeProps> = ({ visible, onClose, onSuccess }) => {
  const { isDark, theme } = useTheme();

  const [category, setCategory] = useState('flooding');
  const [locationName, setLocationName] = useState('');
  const [description, setDescription] = useState('');
  const [latitude, setLatitude] = useState(6.4531);
  const [longitude, setLongitude] = useState(3.3958);
  const [activeCorridor, setActiveCorridor] = useState<string | null>(null);

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoName, setPhotoName] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const resetForm = () => {
    setCategory('flooding');
    setLocationName('');
    setDescription('');
    setLatitude(6.4531);
    setLongitude(3.3958);
    setActiveCorridor(null);
    setPhotoUri(null);
    setPhotoName(null);
    setServerError('');
    setIsSuccess(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSelectCorridor = (corridor: typeof PRESET_CORRIDORS[0]) => {
    setActiveCorridor(corridor.name);
    setLatitude(corridor.lat);
    setLongitude(corridor.lng);
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
            Alert.alert('Permission Denied', 'Media library permission is required to select photos.');
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

  const handleSubmit = async () => {
    setServerError('');
    if (!description.trim() || description.trim().length < 5) {
      setServerError('Please describe what road condition commuters should avoid (minimum 5 characters).');
      return;
    }

    setSubmitting(true);

    try {
      await submitHazard({
        category,
        description: description.trim(),
        location_name: locationName.trim() || 'Reported Location',
        latitude,
        longitude,
        photoUri: photoUri || undefined,
      });

      setIsSuccess(true);
      setTimeout(() => {
        resetForm();
        onSuccess();
      }, 1400);
    } catch {
      setServerError('We could not save the report right now. Please check your network and try again.');
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
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {/* Pinned Sticky Header */}
          <View style={[styles.headerRow, { borderBottomColor: theme.borderSubtle, backgroundColor: theme.surface }]}>
            <View style={styles.headerLeft}>
              <RouteXLogoMark size={30} />
              <View style={styles.headerMeta}>
                <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                  Report a Road Hazard
                </Text>
                <Text style={[styles.modalSubtitle, { color: theme.textMuted }]}>
                  Share timely road conditions to help fellow commuters.
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

          {/* Form Content / Success Screen */}
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
          ) : (
            <>
              <ScrollView
                contentContainerStyle={styles.formContent}
                keyboardShouldPersistTaps="handled"
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
                  <Text style={[styles.fieldLabel, { color: theme.textPrimary }]}>
                    Hazard category <Text style={{ color: '#D64545' }}>*</Text>
                  </Text>
                  <View style={styles.categoryGrid}>
                    {HAZARD_CATEGORIES.map((cat) => {
                      const isSelected = category === cat.id;
                      return (
                        <TouchableOpacity
                          key={cat.id}
                          onPress={() => setCategory(cat.id)}
                          style={[
                            styles.catCard,
                            {
                              backgroundColor: isSelected
                                ? (isDark ? '#0F2E35' : '#E6F4F6')
                                : theme.surfaceSubtle,
                              borderColor: isSelected ? theme.teal : theme.border,
                            },
                          ]}
                          activeOpacity={0.7}
                        >
                          <View style={styles.catCardTop}>
                            {renderCategoryIcon(cat.id, isSelected)}
                            <Text
                              style={[
                                styles.catLabel,
                                {
                                  color: isSelected ? theme.teal : theme.textPrimary,
                                  fontWeight: isSelected ? '800' : '600',
                                },
                              ]}
                            >
                              {cat.label}
                            </Text>
                          </View>
                          <Text
                            style={[styles.catDesc, { color: theme.textMuted }]}
                            numberOfLines={2}
                          >
                            {cat.description}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* 2. Location on Map & Corridor Presets */}
                <View style={styles.section}>
                  <View style={styles.labelRow}>
                    <Text style={[styles.fieldLabel, { color: theme.textPrimary }]}>
                      Location on map <Text style={{ color: '#D64545' }}>*</Text>
                    </Text>
                    <View style={styles.gpsCoordBadge}>
                      <MapPin size={11} color={theme.teal} />
                      <Text style={[styles.gpsCoordText, { color: theme.teal }]}>
                        {latitude.toFixed(4)}, {longitude.toFixed(4)}
                      </Text>
                    </View>
                  </View>

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

                  {/* Map Pin Target Box */}
                  <View
                    style={[
                      styles.mapTargetBox,
                      { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
                    ]}
                  >
                    <View style={[styles.mapTargetPin, { backgroundColor: theme.teal }]}>
                      <MapPin size={18} color="#FFFFFF" />
                    </View>
                    <View style={styles.mapTargetInfo}>
                      <Text style={[styles.mapTargetTitle, { color: theme.textPrimary }]}>
                        GPS Anchor: Lagos Metropolitan
                      </Text>
                      <Text style={[styles.mapTargetSub, { color: theme.textMuted }]}>
                        {activeCorridor ? `Corridor: ${activeCorridor}` : 'Tap above to lock to a corridor'}
                      </Text>
                    </View>
                  </View>
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

                {/* 4. Description with Character Counter */}
                <View style={styles.section}>
                  <View style={styles.labelRow}>
                    <Text style={[styles.fieldLabel, { color: theme.textPrimary }]}>
                      Description <Text style={{ color: '#D64545' }}>*</Text>
                    </Text>
                    <Text style={[styles.charCounter, { color: theme.textMuted }]}>
                      {description.length}/1000
                    </Text>
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
            </>
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
  modalCard: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    maxHeight: '92%',
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
    padding: 16,
    gap: 14,
    paddingBottom: 24,
  },
  section: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  charCounter: {
    fontSize: 10,
    fontFamily: 'monospace',
  },
  gpsCoordBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  gpsCoordText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'monospace',
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
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  catCard: {
    width: '48.5%',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 4,
  },
  catCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  catLabel: {
    fontSize: 12,
    flex: 1,
  },
  catDesc: {
    fontSize: 10,
    lineHeight: 14,
  },
  corridorsScroll: {
    gap: 6,
    paddingVertical: 2,
  },
  corridorChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  corridorChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  mapTargetBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
    marginTop: 4,
  },
  mapTargetPin: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapTargetInfo: {
    flex: 1,
    gap: 2,
  },
  mapTargetTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  mapTargetSub: {
    fontSize: 11,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 12,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 10,
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
  },
  webpBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#16A34A',
  },
  photoUploadBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    gap: 4,
  },
  photoUploadIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  photoUploadTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  photoUploadSub: {
    fontSize: 10,
    textAlign: 'center',
  },
  photoPreviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  photoThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
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
    fontWeight: '700',
    flex: 1,
  },
  webpChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  webpChipText: {
    fontSize: 9,
    fontWeight: '800',
  },
  changePhotoText: {
    fontSize: 11,
    fontWeight: '600',
  },
  photoRemoveBtn: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  submitButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
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
    padding: 36,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  successIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
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
    maxWidth: 260,
  },
});
