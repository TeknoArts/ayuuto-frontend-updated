import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';

interface LoadingBarProps {
  height?: number;
  color?: string;
  backgroundColor?: string;
}

export function LoadingBar({ 
  height = 3, 
  color = '#FFD700',
  backgroundColor = '#1a2332'
}: LoadingBarProps) {
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const progress = Animated.loop(
      Animated.sequence([
        Animated.timing(progressAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(progressAnim, {
          toValue: 0,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ])
    );
    progress.start();
    return () => progress.stop();
  }, []);

  const width = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['20%', '80%'],
  });

  const left = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '20%'],
  });

  return (
    <View style={[styles.container, { height, backgroundColor }]}>
      <Animated.View
        style={[
          styles.bar,
          {
            width,
            left,
            backgroundColor: color,
            height,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
    borderRadius: 2,
  },
  bar: {
    position: 'absolute',
    borderRadius: 2,
  },
});
