import { View, Text, StyleSheet, TouchableOpacity, Image, Modal, ScrollView } from 'react-native';
import { useState, useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import { typography, spacing, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { Flash, Airplane, Briefcase } from 'iconsax-react-native';
import ImportTripFlow from '@/features/trip-import/components/ImportTripFlow';
import { QuickTripFlow, AdvancedTripFlow } from '@/features/planning';

interface PlanBottomSheetProps {
  visible: boolean;
  onClose: () => void;
}

export default function PlanBottomSheet({ visible, onClose }: PlanBottomSheetProps) {
  const { colors } = useTheme();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showImportFlow, setShowImportFlow] = useState(false);
  const [showQuickTripFlow, setShowQuickTripFlow] = useState(false);
  const [showAdvancedTripFlow, setShowAdvancedTripFlow] = useState(false);

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
    
    // Handle quick trip option
    if (option === 'quick') {
      setTimeout(() => {
        onClose();
        setShowQuickTripFlow(true);
      }, 300);
    }
    
    // Handle advanced trip option
    if (option === 'advanced') {
      setTimeout(() => {
        onClose();
        setShowAdvancedTripFlow(true);
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
            {/* Illustration */}
            <View style={styles.imageContainer}>
              <Image 
                source={require('../../../../assets/images/plan.png')}
                style={styles.illustration}
                resizeMode="contain"
              />
            </View>

            {/* Title */}
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              Plan Your Own Adventure{'\n'}
              <Text style={[styles.titleSecondary, { color: colors.primary }]}>Your Way!</Text>
            </Text>
            
            {/* Description */}
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              Choose the trip creation style that suits your vibe. Whether you want to get going quickly or dive deep into the details, we've got you covered!
            </Text>

            {/* Planning Options */}
            <View style={styles.optionsContainer}>
              {/* Quick Trip */}
              <TouchableOpacity 
                style={[
                  styles.optionCard,
                  { backgroundColor: colors.bgElevated, borderColor: colors.borderSubtle },
                  selectedOption === 'quick' && { backgroundColor: colors.primary + '10', borderColor: colors.primary, borderWidth: 2 }
                ]}
                onPress={() => handleSelectOption('quick')}
                activeOpacity={0.7}
              >
                <View style={[styles.iconContainer, { backgroundColor: colors.bgCard }]}>
                  <Flash size={20} color={selectedOption === 'quick' ? colors.primary : colors.textPrimary} variant="Bold" />
                </View>
                <View style={styles.optionContent}>
                  <Text style={[styles.optionTitle, { color: colors.textPrimary }, selectedOption === 'quick' && { color: colors.primary }]}>
                    Quick Trip
                  </Text>
                  <Text style={[styles.optionDescription, { color: colors.textSecondary }]}>
                    Answer a few quick questions and we'll create a custom trip plan in no time. Perfect for when you need to hit the road ASAP!
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Advanced Trip */}
              <TouchableOpacity 
                style={[
                  styles.optionCard,
                  { backgroundColor: colors.bgElevated, borderColor: colors.borderSubtle },
                  selectedOption === 'advanced' && { backgroundColor: colors.primary + '10', borderColor: colors.primary, borderWidth: 2 }
                ]}
                onPress={() => handleSelectOption('advanced')}
                activeOpacity={0.7}
              >
                <View style={[styles.iconContainer, { backgroundColor: colors.bgCard }]}>
                  <Airplane size={20} color={selectedOption === 'advanced' ? colors.primary : colors.textPrimary} variant="Bold" />
                </View>
                <View style={styles.optionContent}>
                  <Text style={[styles.optionTitle, { color: colors.textPrimary }, selectedOption === 'advanced' && { color: colors.primary }]}>
                    Advanced Trip
                  </Text>
                  <Text style={[styles.optionDescription, { color: colors.textSecondary }]}>
                    Customize every detail of your journey with our advanced planner. Perfect for travelers who love a tailored experience!
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
                <View style={[styles.iconContainer, { backgroundColor: colors.bgCard }]}>
                  <Briefcase size={20} color={selectedOption === 'import' ? colors.primary : colors.textPrimary} variant="Bold" />
                </View>
                <View style={styles.optionContent}>
                  <Text style={[styles.optionTitle, { color: colors.textPrimary }, selectedOption === 'import' && { color: colors.primary }]}>
                    Import Trip
                  </Text>
                  <Text style={[styles.optionDescription, { color: colors.textSecondary }]}>
                    Already booked your trip elsewhere? Import it here, and let us enhance it with recommendations and local tips!
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
        // TODO: Handle trip creation
        console.log('Trip imported:', tripData);
      }}
    />
    
    {/* Quick Trip Flow */}
    <QuickTripFlow
      visible={showQuickTripFlow}
      onClose={() => setShowQuickTripFlow(false)}
      onComplete={(planId) => {
        setShowQuickTripFlow(false);
        console.log('Quick trip created:', planId);
        // TODO: Navigate to trip detail or trips list
      }}
    />
    
    {/* Advanced Trip Flow */}
    <AdvancedTripFlow
      visible={showAdvancedTripFlow}
      onClose={() => setShowAdvancedTripFlow(false)}
      onComplete={(planId) => {
        setShowAdvancedTripFlow(false);
        console.log('Advanced trip created:', planId);
        // TODO: Navigate to trip detail or trips list
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
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  closeIcon: {
    fontSize: 18,
    fontWeight: '600',
  },
  imageContainer: {
    alignItems: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  illustration: {
    width: 240,
    height: 160,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    textAlign: 'center',
    marginBottom: spacing.xs,
    lineHeight: typography.fontSize.xl * 1.3,
  },
  titleSecondary: {
    fontSize: typography.fontSize.xl,
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
