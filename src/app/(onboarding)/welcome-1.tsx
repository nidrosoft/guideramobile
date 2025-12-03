import { View, StyleSheet } from 'react-native';
import WalkthroughScreen from '@/components/features/onboarding/WalkthroughScreen';
import { colors } from '@/styles';

export default function Welcome1() {
  return (
    <WalkthroughScreen
      title="Plan Your Perfect Trip"
      description="Let AI help you create personalized itineraries tailored to your interests and budget"
      illustration={
        <View style={styles.illustration}>
          <View style={styles.iconCircle}>
            <View style={styles.mapIcon} />
          </View>
        </View>
      }
      currentStep={1}
      totalSteps={4}
      nextRoute="/(onboarding)/welcome-2"
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
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapIcon: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
});
