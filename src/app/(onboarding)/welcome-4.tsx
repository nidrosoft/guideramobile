import { View, StyleSheet } from 'react-native';
import WalkthroughScreen from '@/components/features/onboarding/WalkthroughScreen';
import { colors } from '@/styles';

export default function Welcome4() {
  return (
    <WalkthroughScreen
      title="Book Everything in One Place"
      description="Flights, hotels, activities, and car rentals - all seamlessly integrated"
      illustration={
        <View style={styles.illustration}>
          <View style={styles.iconCircle}>
            <View style={styles.ticketIcon} />
          </View>
        </View>
      }
      currentStep={4}
      totalSteps={4}
      isLast
    />
  );
}

const styles = StyleSheet.create({
  illustration: {
    width: 280,
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.warning + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ticketIcon: {
    width: 120,
    height: 80,
    borderRadius: 12,
    backgroundColor: colors.warning,
  },
});
