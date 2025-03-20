import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import useTheme from '../themes/useTheme';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  elevation?: number;
  borderRadius?: number;
  padding?: number;
  backgroundColor?: string;
}

const Card: React.FC<CardProps> = ({
  children,
  style,
  elevation = 2,
  borderRadius = 8,
  padding = 16,
  backgroundColor,
}) => {
  const { theme, isDark } = useTheme();
  
  // Use provided backgroundColor or default from theme
  const bgColor = backgroundColor || theme.colors.card.background;
  
  return (
    <View
      style={[
        styles.card,
        {
          elevation,
          borderRadius,
          padding,
          backgroundColor: bgColor,
          shadowOpacity: elevation * 0.05,
          shadowRadius: elevation * 0.75,
          shadowColor: '#000000', // Using a hardcoded shadow color
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    shadowOffset: { width: 0, height: 2 },
    marginVertical: 8,
  },
});

export default Card;