/**
 * SaveButton — Reusable bookmark/heart button wired to user_saved_items.
 * Drop into any card that needs save functionality.
 */

import { TouchableOpacity, StyleSheet } from 'react-native';
import { Bookmark } from 'iconsax-react-native';
import { useSaveDestination } from '@/hooks/useSaveDestination';
import { useTheme } from '@/context/ThemeContext';

interface SaveButtonProps {
  destinationId: string;
  size?: number;
  style?: object;
}

export default function SaveButton({ destinationId, size = 20, style }: SaveButtonProps) {
  const { isSaved, toggleSave } = useSaveDestination(destinationId);
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={toggleSave}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      activeOpacity={0.7}
    >
      <Bookmark
        size={size}
        color={isSaved ? colors.primary : colors.textSecondary}
        variant={isSaved ? 'Bold' : 'Outline'}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    marginLeft: 'auto',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
