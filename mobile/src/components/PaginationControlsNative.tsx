import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';

interface PaginationControlsNativeProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (newPage: number) => void;
  loading?: boolean;
}

export const PaginationControlsNative: React.FC<PaginationControlsNativeProps> = ({
  currentPage,
  totalPages,
  totalCount,
  pageSize,
  onPageChange,
  loading = false,
}) => {
  const { theme, isDark } = useTheme();

  if (totalCount === 0 && totalPages <= 1) {
    return null;
  }

  const safeTotalPages = Math.max(1, totalPages);
  const startItem = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalCount);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#142533' : '#FFFFFF',
          borderColor: theme.border,
        },
      ]}
    >
      <View style={styles.infoCol}>
        <Text style={[styles.pageInfoText, { color: theme.textPrimary }]}>
          Page <Text style={styles.boldText}>{currentPage}</Text> of{' '}
          <Text style={styles.boldText}>{safeTotalPages}</Text>
        </Text>
        <Text style={[styles.itemCountText, { color: theme.textSecondary }]}>
          Showing {startItem}-{endItem} of {totalCount}
        </Text>
      </View>

      <View style={styles.actionsRow}>
        {loading ? (
          <ActivityIndicator size="small" color="#087F8C" style={styles.loader} />
        ) : null}

        <TouchableOpacity
          onPress={() => onPageChange(currentPage - 1)}
          disabled={loading || currentPage <= 1}
          style={[
            styles.btn,
            {
              backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
              borderColor: theme.border,
              opacity: loading || currentPage <= 1 ? 0.35 : 1,
            },
          ]}
          accessibilityLabel="Previous page"
          accessibilityRole="button"
        >
          <ChevronLeft size={18} color={theme.textPrimary} />
          <Text style={[styles.btnText, { color: theme.textPrimary }]}>Prev</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onPageChange(currentPage + 1)}
          disabled={loading || currentPage >= safeTotalPages}
          style={[
            styles.btn,
            {
              backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
              borderColor: theme.border,
              opacity: loading || currentPage >= safeTotalPages ? 0.35 : 1,
            },
          ]}
          accessibilityLabel="Next page"
          accessibilityRole="button"
        >
          <Text style={[styles.btnText, { color: theme.textPrimary }]}>Next</Text>
          <ChevronRight size={18} color={theme.textPrimary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 14,
    marginBottom: 8,
  },
  infoCol: {
    flex: 1,
  },
  pageInfoText: {
    fontSize: 13,
    fontWeight: '600',
  },
  boldText: {
    fontWeight: '800',
    color: '#087F8C',
  },
  itemCountText: {
    fontSize: 11,
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loader: {
    marginRight: 4,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  btnText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
