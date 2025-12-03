import { View, StyleSheet } from 'react-native';
import { colors } from '@/styles';

interface ProgressStepperProps {
  totalSteps: number;
  currentStep: number;
}

export default function ProgressStepper({ totalSteps, currentStep }: ProgressStepperProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: totalSteps }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            index === currentStep && styles.dotActive,
            index < currentStep && styles.dotCompleted,
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
    backgroundColor: colors.gray300,
  },
  dotActive: {
    width: 32,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.black,
  },
  dotCompleted: {
    backgroundColor: colors.black,
  },
});
