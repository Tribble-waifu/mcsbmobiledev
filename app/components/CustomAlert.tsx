import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal,
  Animated,
  Dimensions,
  TouchableWithoutFeedback
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useTheme from '../themes/useTheme';

interface AlertMessageProps {
  visible: boolean;
  type?: 'success' | 'error' | 'warning' | 'info';
  message: string;
  onClose: () => void;
  duration?: number;
  showConfirmButton?: boolean;
  confirmText?: string;
}

const AlertMessage: React.FC<AlertMessageProps> = ({
  visible,
  type = 'info',
  message,
  onClose,
  duration = 3000,
  showConfirmButton = true,
  confirmText = 'OK'
}) => {
  const { theme } = useTheme();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    if (visible) {
      setModalVisible(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      if (!showConfirmButton) {
        const timer = setTimeout(() => {
          handleClose();
        }, duration);
        return () => clearTimeout(timer);
      }
    }
  }, [visible]);

  const handleClose = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setModalVisible(false);
      onClose();
    });
  };

  const getIconName = () => {
    switch (type) {
      case 'success':
        return 'checkmark-circle';
      case 'error':
        return 'alert-circle';
      case 'warning':
        return 'warning';
      case 'info':
      default:
        return 'information-circle';
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'success':
        return theme.colors.status.success;
      case 'error':
        return theme.colors.status.error;
      case 'warning':
        return theme.colors.status.warning;
      case 'info':
      default:
        return theme.colors.status.info;
    }
  };

  return (
    <Modal
      transparent={true}
      visible={modalVisible}
      animationType="none"
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={showConfirmButton ? undefined : handleClose}>
        <View style={styles.modalOverlay}>
          <Animated.View 
            style={[
              styles.alertContainer,
              { 
                opacity: fadeAnim, 
                transform: [{ scale: fadeAnim }],
                backgroundColor: theme.colors.card.background,
                shadowColor: theme.colors.border.dark // Changed from theme.colors.shadow to theme.colors.border.dark
              }
            ]}
          >
            <View style={styles.alertContent}>
              <Ionicons 
                name={getIconName()} 
                size={28} 
                color={getIconColor()} 
                style={styles.icon} 
              />
              <Text style={[styles.message, { color: theme.colors.text.primary }]}>
                {message}
              </Text>
            </View>
            
            {showConfirmButton && (
              <TouchableOpacity 
                style={[styles.confirmButton, { borderTopColor: theme.colors.border.medium }]} 
                onPress={handleClose}
                activeOpacity={0.7}
              >
                <Text style={[styles.confirmText, { color: theme.colors.primary }]}>
                  {confirmText}
                </Text>
              </TouchableOpacity>
            )}
          </Animated.View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertContainer: {
    width: width * 0.85,
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 5,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  alertContent: {
    padding: 20,
    alignItems: 'center',
  },
  icon: {
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  confirmButton: {
    borderTopWidth: 1,
    padding: 12,
    alignItems: 'center',
  },
  confirmText: {
    fontSize: 16,
    fontWeight: '500',
  }
});

export default AlertMessage;