import { View, StyleSheet } from 'react-native';
import WalkthroughScreen from '@/components/features/onboarding/WalkthroughScreen';
import { colors } from '@/styles';

export default function Welcome3() {
  return (
    <WalkthroughScreen
      title="Understand Every Culture"
      description="Get AI-powered cultural insights and local customs for authentic experiences"
      illustration={
        <View style={styles.illustration}>
          <View style={styles.iconCircle}>
            <View style={styles.globeIcon} />
          </View>
        </View>
      }
      currentStep={3}
      totalSteps={4}
      nextRoute="/(onboarding)/welcome-4"
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
    backgroundColor: colors.info + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  globeIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.info,
  },
});
