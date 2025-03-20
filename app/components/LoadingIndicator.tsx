import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Text } from 'react-native';
import useTheme from '../themes/useTheme';

interface LoadingIndicatorProps {
  size?: number;
  primaryColor?: string;
  secondaryColor?: string;
  duration?: number;
  showText?: boolean;
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  size = 80,
  primaryColor,
  secondaryColor,
  duration = 600,
  showText = true
}) => {
  const { theme } = useTheme();
  const spinValue = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0.3)).current;
  
  // Use provided colors or default to the colors from the logo
  const dotPrimaryColor = primaryColor || '#2B3990'; // Dark blue
  const dotSecondaryColor = secondaryColor || '#30BEC1'; // Teal/turquoise
  
  // Calculate dot sizes based on container size
  const dotSize = size * 0.2;
  // Define orbit radius - this is the key to making dots move in a circle
  const orbitRadius = (size / 2) - dotSize;

  useEffect(() => {
    // Create spinning animation that loops seamlessly
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: duration,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
    
    // Create text opacity pulsing animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(textOpacity, {
          toValue: 0.3,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        })
      ])
    ).start();
    
    return () => {
      // Clean up animations
      spinValue.stopAnimation();
      textOpacity.stopAnimation();
    };
  }, [spinValue, textOpacity, duration]);

  // Create rotation interpolation for counterclockwise spin
  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['360deg', '0deg'],
  });

  // Function to generate tail segments
  const generateTailSegments = (color: string, isRight: boolean) => {
    const segments = [];
    const numSegments = 18; // Number of segments for nearly semicircular arc
    
    for (let i = 0; i < numSegments; i++) {
      // Calculate position along the semicircular arc
      const progress = i / (numSegments - 1);
      // Rotate the angle by 90 degrees (π/2) to position dots on left and right
      const angle = Math.PI * progress + (isRight ? Math.PI/2 : -Math.PI/2);
      
      // Calculate position using parametric equation of circle
      const xOffset = Math.cos(angle) * orbitRadius * 1.2;
      const yOffset = Math.sin(angle) * orbitRadius * 1.2;
      
      // Size and opacity decrease as we move away from the dot
      const segmentSize = dotSize * (1 - (progress * 0.8));
      const segmentOpacity = 0.4 - (progress * 0.35);
      
      segments.push(
        <View 
          key={`tail-${isRight ? 'right' : 'left'}-${i}`}
          style={[
            styles.tailSegment, 
            { 
              width: segmentSize,
              height: segmentSize,
              backgroundColor: color,
              opacity: segmentOpacity,
              position: 'absolute',
              left: size / 2 - segmentSize / 2 + xOffset,
              top: size / 2 - segmentSize / 2 + yOffset,
              borderRadius: segmentSize / 2,
            }
          ]} 
        />
      );
    }
    
    return segments;
  };

  return (
    <View style={styles.wrapper}>
      <View style={[styles.container, { width: size, height: size }]}>
        <Animated.View
          style={[
            styles.dotsContainer,
            {
              width: size,
              height: size,
              transform: [{ rotate: spin }],
            },
          ]}
        >
          {/* First dot (dark blue) positioned on the right */}
          <View style={styles.dotWithTailContainer}>
            {generateTailSegments(dotPrimaryColor, true)}
            <View 
              style={[
                styles.dot, 
                { 
                  width: dotSize, 
                  height: dotSize, 
                  backgroundColor: dotPrimaryColor,
                  position: 'absolute',
                  left: size / 2 - dotSize / 2,
                  top: size / 2 - dotSize / 2 + orbitRadius,
                  borderRadius: dotSize / 2,
                }
              ]} 
            />
          </View>
          
          {/* Second dot (teal) positioned on the left */}
          <View style={styles.dotWithTailContainer}>
            {generateTailSegments(dotSecondaryColor, false)}
            <View 
              style={[
                styles.dot, 
                { 
                  width: dotSize, 
                  height: dotSize, 
                  backgroundColor: dotSecondaryColor,
                  position: 'absolute',
                  left: size / 2 - dotSize / 2,
                  top: size / 2 - dotSize / 2 - orbitRadius,
                  borderRadius: dotSize / 2,
                }
              ]} 
            />
          </View>
        </Animated.View>
      </View>
      
      {showText && (
        <Animated.Text 
          style={[
            styles.loadingText, 
            { 
              opacity: textOpacity,
              color: dotPrimaryColor
            }
          ]}
        >
          Loading...
        </Animated.Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotsContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotWithTailContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  dot: {
    position: 'absolute',
    borderRadius: 50,
  },
  tailSegment: {
    position: 'absolute',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '600',
  }
});

export default LoadingIndicator;