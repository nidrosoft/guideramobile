/**
 * CIRCLE BUTTON ATOM
 * 
 * Reusable circular button with icon
 * Used for back, share, save buttons
 */

import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/context/ThemeContext';

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
  const { colors, isDark } = useTheme();

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <TouchableOpacity 
      style={[
        styles.button, 
        { 
          width: size, 
          height: size, 
          borderRadius: size / 2,
          backgroundColor: isDark ? '#1A1A1A' : 'rgba(255, 255, 255, 1)',
          shadowColor: colors.black,
        }, 
        style,
      ]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      {icon}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
});
