import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Animated,
} from 'react-native';
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Info,
  LogOut,
  Trash2,
  X,
} from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

export interface CustomAlertOptions {
  title?: string;
  message?: string;
  buttons?: AlertButton[];
  type?: 'default' | 'destructive' | 'warning' | 'info' | 'success';
}

interface AlertContextType {
  showAlert: (title: string, message?: string, buttons?: AlertButton[]) => void;
  hideAlert: () => void;
}

const AlertContext = createContext<AlertContextType>({
  showAlert: () => {},
  hideAlert: () => {},
});

export const AlertProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isDark, theme } = useTheme();
  const [visible, setVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState<CustomAlertOptions>({
    title: '',
    message: '',
    buttons: [],
  });

  const showAlert = useCallback(
    (title: string, message?: string, buttons?: AlertButton[]) => {
      let resolvedButtons = buttons && buttons.length > 0 ? buttons : [{ text: 'OK', style: 'default' as const }];
      setAlertConfig({
        title,
        message,
        buttons: resolvedButtons,
      });
      setVisible(true);
    },
    []
  );

  const hideAlert = useCallback(() => {
    setVisible(false);
  }, []);

  const handleButtonPress = (btn?: AlertButton) => {
    hideAlert();
    if (btn?.onPress) {
      setTimeout(() => {
        btn.onPress?.();
      }, 50);
    }
  };

  // Determine icon & theme based on title and buttons
  const isDestructive =
    alertConfig.buttons?.some((b) => b.style === 'destructive') ||
    alertConfig.title?.toLowerCase().includes('delete') ||
    alertConfig.title?.toLowerCase().includes('sign out') ||
    alertConfig.title?.toLowerCase().includes('exit') ||
    alertConfig.title?.toLowerCase().includes('remove');

  const isWarning =
    alertConfig.title?.toLowerCase().includes('permission') ||
    alertConfig.title?.toLowerCase().includes('invalid') ||
    alertConfig.title?.toLowerCase().includes('unavailable') ||
    alertConfig.title?.toLowerCase().includes('required');

  const renderIcon = () => {
    const titleLower = alertConfig.title?.toLowerCase() || '';
    if (titleLower.includes('delete') || titleLower.includes('remove')) {
      return (
        <View style={[styles.iconCircle, { backgroundColor: isDark ? '#3D1414' : '#FEE2E2' }]}>
          <Trash2 size={24} color="#EF4444" />
        </View>
      );
    }
    if (titleLower.includes('sign out') || titleLower.includes('exit')) {
      return (
        <View style={[styles.iconCircle, { backgroundColor: isDark ? '#3A2012' : '#FEF3C7' }]}>
          <LogOut size={24} color="#F59E0B" />
        </View>
      );
    }
    if (isDestructive) {
      return (
        <View style={[styles.iconCircle, { backgroundColor: isDark ? '#3D1414' : '#FEE2E2' }]}>
          <AlertCircle size={24} color="#EF4444" />
        </View>
      );
    }
    if (isWarning) {
      return (
        <View style={[styles.iconCircle, { backgroundColor: isDark ? '#3A2808' : '#FEF3C7' }]}>
          <AlertTriangle size={24} color="#F59E0B" />
        </View>
      );
    }
    return (
      <View style={[styles.iconCircle, { backgroundColor: isDark ? '#113539' : '#CCFBF1' }]}>
        <Info size={24} color={theme.teal} />
      </View>
    );
  };

  const cancelBtn = alertConfig.buttons?.find((b) => b.style === 'cancel');
  const actionBtns = alertConfig.buttons?.filter((b) => b.style !== 'cancel') || [];

  return (
    <AlertContext.Provider value={{ showAlert, hideAlert }}>
      {children}

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={hideAlert}
      >
        <View style={styles.overlay}>
          {/* Backdrop */}
          <Pressable style={styles.backdrop} onPress={hideAlert} />

          {/* Dialog Card */}
          <View
            style={[
              styles.dialogCard,
              {
                backgroundColor: isDark ? '#142533' : '#FFFFFF',
                borderColor: isDark ? '#2A4356' : '#E2E8F0',
                shadowColor: '#000000',
              },
            ]}
          >
            {/* Header with Icon and Close Button */}
            <View style={styles.dialogHeader}>
              {renderIcon()}
              <TouchableOpacity
                onPress={hideAlert}
                style={[styles.closeIconBtn, { backgroundColor: isDark ? '#1F3445' : '#F1F5F9' }]}
                activeOpacity={0.7}
              >
                <X size={16} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Title & Message */}
            <View style={styles.textContainer}>
              <Text style={[styles.alertTitle, { color: theme.textPrimary }]}>
                {alertConfig.title}
              </Text>
              {alertConfig.message ? (
                <Text style={[styles.alertMessage, { color: theme.textSecondary }]}>
                  {alertConfig.message}
                </Text>
              ) : null}
            </View>

            {/* Button Actions */}
            <View style={styles.actionsContainer}>
              {cancelBtn && (
                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.cancelButton,
                    {
                      backgroundColor: isDark ? '#1E3342' : '#F1F5F9',
                      borderColor: isDark ? '#2A4356' : '#CBD5E1',
                    },
                  ]}
                  onPress={() => handleButtonPress(cancelBtn)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.cancelButtonText, { color: theme.textSecondary }]}>
                    {cancelBtn.text}
                  </Text>
                </TouchableOpacity>
              )}

              {actionBtns.map((btn, idx) => {
                const btnDestructive = btn.style === 'destructive' || isDestructive;
                const bgColor = btnDestructive ? '#DC2626' : theme.teal;
                return (
                  <TouchableOpacity
                    key={`alert-btn-${idx}`}
                    style={[
                      styles.button,
                      styles.actionButton,
                      { backgroundColor: bgColor },
                      actionBtns.length === 1 && !cancelBtn && { flex: 1 },
                    ]}
                    onPress={() => handleButtonPress(btn)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.actionButtonText}>{btn.text}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </AlertContext.Provider>
  );
};

export const useAlert = (): AlertContextType => {
  return useContext(AlertContext);
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 20,
    borderWidth: 1,
    padding: 22,
    elevation: 24,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    gap: 16,
  },
  dialogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    gap: 8,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.2,
    lineHeight: 24,
  },
  alertMessage: {
    fontSize: 13.5,
    lineHeight: 20,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 6,
  },
  button: {
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 12,
    minWidth: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 1,
    flex: 1,
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
  actionButton: {
    flex: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
