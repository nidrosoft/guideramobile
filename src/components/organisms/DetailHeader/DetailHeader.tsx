/**
 * DETAIL HEADER ORGANISM
 * 
 * Header for detail pages with back, title, share, and save buttons
 * Positioned absolutely over the hero image
 */

import { View, Text, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Heart } from 'iconsax-react-native';
import CircleButton from '@/components/atoms/CircleButton/CircleButton';
import ShareIcon from '@/components/atoms/ShareIcon/ShareIcon';
import { colors, typography, spacing } from '@/styles';

interface DetailHeaderProps {
  title: string;
  isSaved?: boolean;
  onSave?: () => void;
  onShare?: () => void;
}

export default function DetailHeader({ 
  title, 
  isSaved = false,
  onSave,
  onShare 
}: DetailHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    router.back();
  };

  const handleShare = () => {
    onShare?.();
    // TODO: Implement share functionality
  };

  const handleSave = () => {
    onSave?.();
    // TODO: Implement save functionality
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      {/* Back Button */}
      <CircleButton
        icon={<ArrowLeft size={24} color={colors.textPrimary} />}
        onPress={handleBack}
      />

      {/* Spacer to push buttons to edges */}
      <View style={styles.spacer} />

      {/* Action Buttons */}
      <View style={styles.actions}>
        <CircleButton
          icon={<ShareIcon size={22} color={colors.textPrimary} />}
          onPress={handleShare}
          style={styles.actionButton}
        />
        <CircleButton
          icon={
            <Heart 
              size={22} 
              color={isSaved ? colors.error : colors.textPrimary} 
              variant={isSaved ? "Bold" : "Outline"}
            />
          }
          onPress={handleSave}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    zIndex: 10,
    gap: spacing.md,
  },
  spacer: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    marginRight: 0,
  },
});
