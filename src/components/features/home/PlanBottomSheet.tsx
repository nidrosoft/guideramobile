import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { useState, useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { typography, spacing, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { Global, Briefcase, SearchNormal1 } from 'iconsax-react-native';
import ImportTripFlow from '@/features/trip-import/components/ImportTripFlow';
import { useTripStore } from '@/features/trips/stores/trip.store';
import { useAuth } from '@/context/AuthContext';

interface PlanBottomSheetProps {
  visible: boolean;
  onClose: () => void;
}

export default function PlanBottomSheet({ visible, onClose }: PlanBottomSheetProps) {
  const { colors } = useTheme();
  const router = useRouter();
  const { fetchTrips } = useTripStore();
  const { profile } = useAuth();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showImportFlow, setShowImportFlow] = useState(false);

  // Reset selection when bottom sheet opens
  useEffect(() => {
    if (visible) {
      setSelectedOption(null);
    }
  }, [visible]);

  const handleSelectOption = (option: string) => {
    // Haptic feedback works on both iOS and Android
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedOption(option);
    
    // Handle preview option — navigates to home tab and opens the search overlay
    if (option === 'preview') {
      setTimeout(() => {
        onClose();
        router.push({ pathname: '/(tabs)', params: { openSearch: 'true' } } as any);
      }, 300);
    }
    
    // Handle import option
    if (option === 'import') {
      // Close current sheet and open import flow
      setTimeout(() => {
        onClose();
        setShowImportFlow(true);
      }, 300);
    }
  };

  return (
    <>
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={[styles.overlay, { backgroundColor: colors.bgOverlay }]}>
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1} 
          onPress={onClose}
        />
        
        <View style={[styles.bottomSheet, { backgroundColor: colors.bgModal }]}>
          {/* Dent Handle */}
          <View style={styles.handleContainer}>
            <View style={[styles.handle, { backgroundColor: colors.borderSubtle }]} />
          </View>

          {/* Close Button */}
          <TouchableOpacity style={[styles.closeButton, { backgroundColor: colors.bgElevated }]} onPress={onClose}>
            <Text style={[styles.closeIcon, { color: colors.textSecondary }]}>✕</Text>
          </TouchableOpacity>

          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Title */}
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              Start Your Next{' '}
              <Text style={[styles.titleAccent, { color: colors.primary }]}>Adventure</Text>
            </Text>
            
            {/* Description */}
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              Explore a destination before you commit, or import a trip you've already booked.
            </Text>

            {/* Options */}
            <View style={styles.optionsContainer}>
              {/* Trip Preview */}
              <TouchableOpacity 
                style={[
                  styles.optionCard,
                  { backgroundColor: colors.bgElevated, borderColor: colors.borderSubtle },
                  selectedOption === 'preview' && { backgroundColor: colors.primary + '10', borderColor: colors.primary, borderWidth: 2 }
                ]}
                onPress={() => handleSelectOption('preview')}
                activeOpacity={0.7}
              >
                <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}12` }]}>
                  <Global size={22} color={colors.primary} variant="Bold" />
                </View>
                <View style={styles.optionContent}>
                  <Text style={[styles.optionTitle, { color: colors.textPrimary }, selectedOption === 'preview' && { color: colors.primary }]}>
                    Explore a Destination
                  </Text>
                  <Text style={[styles.optionDescription, { color: colors.textSecondary }]}>
                    Get AI-powered insights, estimated costs, where to stay, and top experiences for any destination before you book.
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Import Trip */}
              <TouchableOpacity 
                style={[
                  styles.optionCard,
                  { backgroundColor: colors.bgElevated, borderColor: colors.borderSubtle },
                  selectedOption === 'import' && { backgroundColor: colors.primary + '10', borderColor: colors.primary, borderWidth: 2 }
                ]}
                onPress={() => handleSelectOption('import')}
                activeOpacity={0.7}
              >
                <View style={[styles.iconContainer, { backgroundColor: `${colors.info}12` }]}>
                  <Briefcase size={22} color={colors.info} variant="Bold" />
                </View>
                <View style={styles.optionContent}>
                  <Text style={[styles.optionTitle, { color: colors.textPrimary }, selectedOption === 'import' && { color: colors.primary }]}>
                    Import a Trip
                  </Text>
                  <Text style={[styles.optionDescription, { color: colors.textSecondary }]}>
                    Already booked? Scan a ticket, enter details manually, or link your booking account and we'll build your trip for you.
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>

    {/* Import Trip Flow */}
    <ImportTripFlow
      visible={showImportFlow}
      onClose={() => setShowImportFlow(false)}
      onComplete={(tripData) => {
        setShowImportFlow(false);
        // Refresh trips from DB and navigate to Trips tab with scrollTo
        if (profile?.id) fetchTrips(profile.id);
        const tripId = tripData?.importResult?.tripId || tripData?.importResult?.trips?.[0]?.id;
        setTimeout(() => {
          router.push(tripId
            ? { pathname: '/(tabs)/trips', params: { scrollToTripId: tripId } } as any
            : '/(tabs)/trips' as any
          );
        }, 300);
      }}
    />
  </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  bottomSheet: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing['2xl'],
    maxHeight: '90%',
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  closeButton: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.xl,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  closeIcon: {
    fontSize: typography.fontSize.heading2,
    fontWeight: typography.fontWeight.semibold,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    textAlign: 'center',
    marginBottom: spacing.xs,
    lineHeight: typography.fontSize.xl * 1.3,
  },
  titleAccent: {
    fontWeight: typography.fontWeight.bold,
  },
  description: {
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.xl,
  },
  optionsContainer: {
    gap: spacing.md,
  },
  optionCard: {
    flexDirection: 'row',
    borderRadius: 20,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    minHeight: 90,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: typography.fontSize.xs,
    lineHeight: 18,
  },
});
