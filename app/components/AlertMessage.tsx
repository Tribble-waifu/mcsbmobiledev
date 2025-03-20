import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useTheme from '../themes/useTheme';

type AlertType = 'success' | 'error' | 'warning' | 'info';

interface AlertMessageProps {
  visible: boolean;
  type?: AlertType;
  message: string;
  duration?: number;
  onClose?: () => void;
}

const AlertMessage: React.FC<AlertMessageProps> = ({
  visible,
  type = 'info',
  message,
  duration = 3000,
  onClose,
}) => {
  const { theme } = useTheme();
  const [slideAnim] = useState(new Animated.Value(-100));
  const [opacity] = useState(new Animated.Value(0));
  const isHidden = useRef(true);

  useEffect(() => {
    if (visible) {
      isHidden.current = false;
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      if (duration > 0) {
        const timer = setTimeout(() => {
          handleClose();
        }, duration);
        return () => clearTimeout(timer);
      }
    } else {
      handleClose();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      isHidden.current = true;
      if (onClose) onClose();
    });
  };

  if (!visible && isHidden.current) return null;

  const getAlertStyle = () => {
    switch (type) {
      case 'success':
        return { 
          backgroundColor: theme.colors.status.success, 
          icon: 'checkmark-circle-outline' as const 
        };
      case 'error':
        return { 
          backgroundColor: theme.colors.status.error, 
          icon: 'close-circle-outline' as const 
        };
      case 'warning':
        return { 
          backgroundColor: theme.colors.status.warning, 
          icon: 'alert-circle-outline' as const 
        };
      case 'info':
      default:
        return { 
          backgroundColor: theme.colors.status.info, 
          icon: 'information-circle-outline' as const 
        };
    }
  };

  const alertStyle = getAlertStyle();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: alertStyle.backgroundColor,
          transform: [{ translateY: slideAnim }],
          opacity: opacity,
          shadowColor: theme.colors.text.primary, // Using theme text color for shadow
        },
      ]}
    >
      <View style={styles.content}>
        <Ionicons name={alertStyle.icon} size={24} color={theme.colors.text.inverse} style={styles.icon} />
        <Text style={[styles.message, { color: theme.colors.text.inverse }]}>
          {message}
        </Text>
      </View>
      <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
        <Ionicons name="close" size={20} color={theme.colors.text.inverse} />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 40,
    left: 16,
    right: 16,
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 10,
  },
  message: {
    fontSize: 16,
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
});

export default AlertMessage;