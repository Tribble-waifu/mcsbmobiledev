import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  ViewStyle, 
  TextStyle, 
  TouchableOpacityProps 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useTheme from '../themes/useTheme';

type ButtonSize = 'small' | 'medium' | 'large';
type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'text';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: string;
  iconPosition?: 'left' | 'right';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  icon,
  iconPosition = 'left',
  disabled = false,
  loading = false,
  style,
  textStyle,
  ...rest
}) => {
  const { theme } = useTheme();
  
  // Determine button styles based on variant
  const getButtonStyles = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: theme.borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
    };
    
    // Size styles
    switch (size) {
      case 'small':
        baseStyle.paddingVertical = theme.spacing.xs;
        baseStyle.paddingHorizontal = theme.spacing.sm;
        break;
      case 'large':
        baseStyle.paddingVertical = theme.spacing.md;
        baseStyle.paddingHorizontal = theme.spacing.lg;
        break;
      default: // medium
        baseStyle.paddingVertical = theme.spacing.sm;
        baseStyle.paddingHorizontal = theme.spacing.md;
    }
    
    // Variant styles
    switch (variant) {
      case 'secondary':
        baseStyle.backgroundColor = theme.colors.button.secondary;
        break;
      case 'outline':
        baseStyle.backgroundColor = 'transparent';
        baseStyle.borderWidth = 1;
        baseStyle.borderColor = theme.colors.primary;
        break;
      case 'text':
        baseStyle.backgroundColor = 'transparent';
        break;
      default: // primary
        baseStyle.backgroundColor = theme.colors.button.primary;
    }
    
    // Disabled state
    if (disabled) {
      baseStyle.backgroundColor = theme.colors.button.disabled;
      baseStyle.borderColor = theme.colors.button.disabled;
      baseStyle.opacity = 0.7;
    }
    
    return baseStyle;
  };
  
  // Determine text styles based on variant
  const getTextStyles = (): TextStyle => {
    const baseStyle: TextStyle = {
      fontWeight: '600',
      textAlign: 'center',
    };
    
    // Size styles
    switch (size) {
      case 'small':
        baseStyle.fontSize = theme.typography.fontSize.sm;
        break;
      case 'large':
        baseStyle.fontSize = theme.typography.fontSize.lg;
        break;
      default: // medium
        baseStyle.fontSize = theme.typography.fontSize.md;
    }
    
    // Variant styles
    switch (variant) {
      case 'outline':
      case 'text':
        baseStyle.color = theme.colors.primary;
        break;
      default: // primary, secondary
        baseStyle.color = theme.colors.text.inverse;
    }
    
    // Disabled state
    if (disabled) {
      baseStyle.color = variant === 'outline' || variant === 'text' 
        ? theme.colors.text.tertiary 
        : theme.colors.text.inverse;
    }
    
    return baseStyle;
  };
  
  // Get icon color based on variant
  const getIconColor = (): string => {
    if (disabled) {
      return variant === 'outline' || variant === 'text' 
        ? theme.colors.text.tertiary 
        : theme.colors.text.inverse;
    }
    
    return variant === 'outline' || variant === 'text' 
      ? theme.colors.primary 
      : theme.colors.text.inverse;
  };
  
  // Get icon size based on button size
  const getIconSize = (): number => {
    switch (size) {
      case 'small':
        return 16;
      case 'large':
        return 24;
      default: // medium
        return 20;
    }
  };
  
  return (
    <TouchableOpacity
      style={[getButtonStyles(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator 
          size={size === 'small' ? 'small' : 'small'} 
          color={getIconColor()} 
          style={styles.loadingIndicator} 
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <Ionicons 
              name={icon as any} 
              size={getIconSize()} 
              color={getIconColor()} 
              style={styles.leftIcon} 
            />
          )}
          
          <Text style={[getTextStyles(), textStyle]}>
            {title}
          </Text>
          
          {icon && iconPosition === 'right' && (
            <Ionicons 
              name={icon as any} 
              size={getIconSize()} 
              color={getIconColor()} 
              style={styles.rightIcon} 
            />
          )}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  leftIcon: {
    marginRight: 8,
  },
  rightIcon: {
    marginLeft: 8,
  },
  loadingIndicator: {
    marginRight: 8,
  },
});

export default Button;