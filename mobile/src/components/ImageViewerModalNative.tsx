import React from 'react';
import {
  Modal,
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, MapPin } from 'lucide-react-native';

interface ImageViewerModalNativeProps {
  visible: boolean;
  imageUrl: string | null;
  title?: string;
  subtitle?: string;
  onClose: () => void;
}

export const ImageViewerModalNative: React.FC<ImageViewerModalNativeProps> = ({
  visible,
  imageUrl,
  title,
  subtitle,
  onClose,
}) => {
  const insets = useSafeAreaInsets();

  if (!visible || !imageUrl) return null;

  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 0
  );
  const bottomInset = Math.max(insets.bottom, 16);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <StatusBar barStyle="light-content" translucent={true} backgroundColor="transparent" />

        {/* Top Header Bar with Safe Inset */}
        <View style={[styles.header, { paddingTop: topInset + 10 }]}>
          <View style={styles.titleWrapper}>
            {title ? (
              <View style={styles.titleRow}>
                <MapPin size={16} color="#087F8C" />
                <Text style={styles.title} numberOfLines={1}>
                  {title}
                </Text>
              </View>
            ) : null}
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>

          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.8}
            accessibilityLabel="Close image modal"
          >
            <X size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Image Content Area */}
        <TouchableOpacity
          style={styles.imageBackdrop}
          activeOpacity={1}
          onPress={onClose}
        >
          <Image
            source={{ uri: imageUrl }}
            style={styles.fullImage}
            resizeMode="contain"
          />
        </TouchableOpacity>

        {/* Footer Hint with Bottom Safe Inset */}
        <View style={[styles.footer, { paddingBottom: bottomInset + 10 }]}>
          <Text style={styles.footerHint}>Tap anywhere to dismiss</Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.96)',
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    zIndex: 10,
  },
  titleWrapper: {
    flex: 1,
    marginRight: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageBackdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
  footer: {
    alignItems: 'center',
    paddingTop: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  footerHint: {
    color: '#94A3B8',
    fontSize: 11,
  },
});
