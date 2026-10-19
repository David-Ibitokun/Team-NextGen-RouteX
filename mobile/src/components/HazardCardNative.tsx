import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { MapPin, Clock, ThumbsUp, Droplets, CircleDot, AlertTriangle, TreePine, HelpCircle, Maximize2 } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { HazardItem, getCategoryConfig, getStatusColor } from '../constants/hazardTypes';
import { ImageViewerModalNative } from './ImageViewerModalNative';

interface HazardCardNativeProps {
  hazard: HazardItem;
  onPress?: () => void;
  onConfirm?: () => void;
}

export const HazardCardNative: React.FC<HazardCardNativeProps> = ({ hazard, onPress, onConfirm }) => {
  const { isDark, theme } = useTheme();
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const categoryConfig = getCategoryConfig(hazard.category);
  const statusColors = getStatusColor(hazard.status, isDark);
  const photoUri = hazard.photo || hazard.photo_url;

  const rawDate = hazard.created_at ? new Date(hazard.created_at) : new Date();
  const formattedDate = isNaN(rawDate.getTime())
    ? 'Recently'
    : rawDate.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        day: 'numeric',
        month: 'short',
      });

  const renderCategoryIcon = () => {
    const iconSize = 13;
    const iconColor = categoryConfig.color;
    switch (hazard.category) {
      case 'flooding':
        return <Droplets size={iconSize} color={iconColor} />;
      case 'pothole':
        return <CircleDot size={iconSize} color={iconColor} />;
      case 'blocked_road':
        return <AlertTriangle size={iconSize} color={iconColor} />;
      case 'fallen_tree':
        return <TreePine size={iconSize} color={iconColor} />;
      default:
        return <HelpCircle size={iconSize} color={iconColor} />;
    }
  };

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        style={[
          styles.card,
          {
            backgroundColor: theme.surfaceCard,
            borderColor: theme.border,
            shadowColor: theme.cardShadow,
          },
        ]}
      >
        {/* Category Strip & Status Badge */}
        <View style={styles.headerRow}>
          <View
            style={[
              styles.categoryBadge,
              {
                backgroundColor: isDark ? categoryConfig.darkBg : categoryConfig.lightBg,
                borderColor: categoryConfig.color,
              },
            ]}
          >
            {renderCategoryIcon()}
            <Text style={[styles.categoryText, { color: isDark ? '#E2E8F0' : '#142B3B' }]}>
              {categoryConfig.label}
            </Text>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: statusColors.bg, borderColor: statusColors.border }]}>
            <Text style={[styles.statusText, { color: statusColors.text }]}>
              {(hazard.status || 'reported').replace('_', ' ').toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Location */}
        <View style={styles.locationRow}>
          <MapPin size={14} color={theme.teal} />
          <Text style={[styles.locationText, { color: theme.textPrimary }]} numberOfLines={1}>
            {hazard.location_name ||
              (hazard.latitude != null && hazard.longitude != null
                ? `Lat: ${Number(hazard.latitude).toFixed(4)}, Lng: ${Number(hazard.longitude).toFixed(4)}`
                : 'Reported Location')}
          </Text>
        </View>

        {/* Description */}
        <Text style={[styles.description, { color: theme.textSecondary }]} numberOfLines={3}>
          {hazard.description}
        </Text>

        {/* Photo Attachment if present */}
        {photoUri ? (
          <TouchableOpacity
            style={[styles.photoCardWrapper, { borderColor: theme.border, backgroundColor: theme.surfaceSubtle }]}
            activeOpacity={0.85}
            onPress={() => setImageModalVisible(true)}
          >
            <Image
              source={{ uri: photoUri }}
              style={styles.photoCard}
              resizeMode="cover"
            />
            <View style={styles.zoomPill}>
              <Maximize2 size={11} color="#FFFFFF" />
              <Text style={styles.zoomPillText}>Tap to expand</Text>
            </View>
          </TouchableOpacity>
        ) : null}

        {/* Footer Info & Confirm Action */}
        <View style={[styles.footerRow, { borderTopColor: theme.borderSubtle }]}>
          <View style={styles.timeWrapper}>
            <Clock size={12} color={theme.textMuted} />
            <Text style={[styles.timeText, { color: theme.textMuted }]}>
              {formattedDate}
            </Text>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.confirmBtn, { backgroundColor: isDark ? '#13353A' : '#E6F4F6', borderColor: theme.teal }]}
              onPress={onConfirm}
              activeOpacity={0.7}
            >
              <ThumbsUp size={12} color={theme.teal} />
              <Text style={[styles.confirmCount, { color: theme.teal }]}>
                {hazard.confirmations_count ?? 1}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>

      {/* Fullscreen Photo Modal */}
      {photoUri ? (
        <ImageViewerModalNative
          visible={imageModalVisible}
          imageUrl={photoUri}
          title={hazard.location_name}
          subtitle={`${categoryConfig.label} \u2022 ${(hazard.status || 'reported').replace('_', ' ')}`}
          onClose={() => setImageModalVisible(false)}
        />
      ) : null}
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    gap: 5,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 5,
  },
  locationText: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  description: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 10,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
  },
  timeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 11,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    gap: 5,
  },
  confirmCount: {
    fontSize: 11,
    fontWeight: '700',
  },
  photoCardWrapper: {
    height: 180,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    marginBottom: 10,
    position: 'relative',
  },
  photoCard: {
    width: '100%',
    height: '100%',
  },
  zoomPill: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  zoomPillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
});
