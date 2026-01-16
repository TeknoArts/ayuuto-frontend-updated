import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { IconSymbol } from './icon-symbol';

interface LoadingSpinnerProps {
  size?: number;
  color?: string;
  text?: string;
  fullScreen?: boolean;
}

export function LoadingSpinner({ 
  size = 32, 
  color = '#FFD700', 
  text,
  fullScreen = false 
}: LoadingSpinnerProps) {
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const spin = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    spin.start();
    return () => spin.stop();
  }, []);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const containerStyle = fullScreen 
    ? [styles.container, styles.fullScreen]
    : styles.container;

  return (
    <View style={containerStyle}>
      <Animated.View style={{ transform: [{ rotate: spin }] }}>
        <IconSymbol name="arrow.clockwise" size={size} color={color} />
      </Animated.View>
      {text && <Text style={[styles.text, { color }]}>{text}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 12,
  },
  fullScreen: {
    flex: 1,
    minHeight: 200,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
  },
});
