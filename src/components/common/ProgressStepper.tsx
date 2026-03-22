import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

interface ProgressStepperProps {
  totalSteps: number;
  currentStep: number;
}

export default function ProgressStepper({ totalSteps, currentStep }: ProgressStepperProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      {Array.from({ length: totalSteps }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            { backgroundColor: colors.gray300 },
            index === currentStep && [styles.dotActive, { backgroundColor: colors.black }],
            index < currentStep && { backgroundColor: colors.black },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 32,
    height: 8,
    borderRadius: 4,
  },
});
