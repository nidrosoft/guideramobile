/**
 * CIRCLE BUTTON ATOM
 * 
 * Reusable circular button with icon
 * Used for back, share, save buttons
 */

import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '@/styles';

interface CircleButtonProps {
  icon: React.ReactNode;
  onPress: () => void;
  style?: ViewStyle;
  size?: number;
}

export default function CircleButton({ 
  icon, 
  onPress, 
  style,
  size = 44 
}: CircleButtonProps) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <TouchableOpacity 
      style={[styles.button, { width: size, height: size, borderRadius: size / 2 }, style]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      {icon}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: 'rgba(255, 255, 255, 1)', // 100% opacity - fully white
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
});
