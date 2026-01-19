import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { IconSymbol } from './icon-symbol';

const { width } = Dimensions.get('window');

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  buttons?: AlertButton[];
  onDismiss?: () => void;
}

let alertInstance: {
  show: (title: string, message: string, buttons?: AlertButton[]) => void;
  hide: () => void;
} | null = null;

export function CustomAlert({ visible, title, message, buttons = [], onDismiss }: CustomAlertProps) {
  const defaultButtons: AlertButton[] = buttons.length > 0 
    ? buttons 
    : [{ text: 'OK', onPress: onDismiss }];

  // Determine icon based on title and message
  const getIcon = () => {
    const titleLower = title.toLowerCase();
    const messageLower = message.toLowerCase();
    const combined = `${titleLower} ${messageLower}`;
    
    if (combined.includes('error') || combined.includes('failed') || combined.includes('invalid')) {
      return { name: 'exclamationmark.triangle.fill' as const, color: '#FF6B6B' };
    } else if (combined.includes('success') || combined.includes('successfully')) {
      return { name: 'checkmark.circle.fill' as const, color: '#4CAF50' };
    } else if (combined.includes('warning') || combined.includes('limit') || combined.includes('required')) {
      return { name: 'exclamationmark.circle.fill' as const, color: '#FFD700' };
    } else {
      return { name: 'info.circle.fill' as const, color: '#4FC3F7' };
    }
  };

  const icon = getIcon();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <TouchableOpacity 
          style={styles.overlayTouchable}
          activeOpacity={1}
          onPress={onDismiss}>
          <TouchableOpacity 
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}>
            <View style={styles.alertContainer}>
              {/* Icon */}
              <View style={styles.iconContainer}>
                <View style={[styles.iconCircle, { backgroundColor: `${icon.color}20` }]}>
                  <IconSymbol name={icon.name} size={48} color={icon.color} />
                </View>
              </View>

              {/* Title */}
              <Text style={styles.title}>{title}</Text>

              {/* Message */}
              <Text style={styles.message}>{message}</Text>

              {/* Buttons */}
              <View style={[styles.buttonContainer, defaultButtons.length === 1 && styles.buttonContainerSingle]}>
                {defaultButtons.map((button, index) => {
                  const isDestructive = button.style === 'destructive';
                  const isCancel = button.style === 'cancel';
                  const isPrimary = !isDestructive && !isCancel && (defaultButtons.length === 1 || index === 0);

                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.button,
                        defaultButtons.length > 1 && styles.buttonMultiple,
                        isPrimary && styles.buttonPrimary,
                        isDestructive && styles.buttonDestructive,
                        isCancel && styles.buttonCancel,
                      ]}
                      onPress={() => {
                        if (button.onPress) {
                          button.onPress();
                        }
                        if (onDismiss) {
                          onDismiss();
                        }
                      }}
                      activeOpacity={0.8}>
                      <Text
                        style={[
                          styles.buttonText,
                          isPrimary && styles.buttonTextPrimary,
                          isDestructive && styles.buttonTextDestructive,
                          isCancel && styles.buttonTextCancel,
                        ]}>
                        {button.text.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

// Global alert function to match Alert.alert API
export const showCustomAlert = (
  title: string,
  message: string,
  buttons?: AlertButton[]
): void => {
  if (alertInstance) {
    alertInstance.show(title, message, buttons);
  }
};

export const setAlertInstance = (instance: typeof alertInstance) => {
  alertInstance = instance;
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  overlayTouchable: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertContainer: {
    backgroundColor: '#001327',
    borderRadius: 24,
    padding: 32,
    width: width * 0.88,
    maxWidth: 420,
    borderWidth: 3,
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 25,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 1.5,
  },
  message: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 24,
    paddingHorizontal: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  buttonContainerSingle: {
    justifyContent: 'center',
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    minHeight: 50,
  },
  buttonMultiple: {
    flex: 1,
  },
  buttonPrimary: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
    shadowColor: '#4CAF50',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonDestructive: {
    backgroundColor: 'transparent',
    borderColor: '#FF6B6B',
  },
  buttonCancel: {
    backgroundColor: 'transparent',
    borderColor: '#9BA1A6',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1.2,
  },
  buttonTextPrimary: {
    color: '#FFFFFF',
  },
  buttonTextDestructive: {
    color: '#FF6B6B',
  },
  buttonTextCancel: {
    color: '#9BA1A6',
  },
});
