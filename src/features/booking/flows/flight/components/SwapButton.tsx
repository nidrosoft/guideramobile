/**
 * SWAP BUTTON
 * 
 * Animated button to swap origin/destination
 */

import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { ArrowSwapVertical } from 'iconsax-react-native';
import { colors, spacing } from '@/styles';

interface SwapButtonProps {
  onPress: () => void;
}

export default function SwapButton({ onPress }: SwapButtonProps) {
  const rotation = useSharedValue(0);

  const handlePress = () => {
    rotation.value = withSpring(rotation.value + 180, { damping: 15 });
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <TouchableOpacity
        style={styles.button}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <ArrowSwapVertical size={20} color={colors.white} variant="Bold" />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: spacing.lg,
    top: '50%',
    marginTop: -20,
    zIndex: 10,
  },
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray900,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
});
