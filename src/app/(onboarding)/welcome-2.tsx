import { View, StyleSheet } from 'react-native';
import WalkthroughScreen from '@/components/features/onboarding/WalkthroughScreen';
import { colors } from '@/styles';

export default function Welcome2() {
  return (
    <WalkthroughScreen
      title="Stay Safe Everywhere"
      description="Real-time safety alerts and emergency assistance wherever you travel"
      illustration={
        <View style={styles.illustration}>
          <View style={styles.iconCircle}>
            <View style={styles.shieldIcon} />
          </View>
        </View>
      }
      currentStep={2}
      totalSteps={4}
      nextRoute="/(onboarding)/welcome-3"
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
    backgroundColor: colors.success + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shieldIcon: {
    width: 80,
    height: 100,
    borderRadius: 40,
    backgroundColor: colors.success,
  },
});
