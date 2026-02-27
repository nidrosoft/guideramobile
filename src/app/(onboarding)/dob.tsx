import PreferenceScreen from '@/components/features/onboarding/PreferenceScreen';
import { Calendar } from 'iconsax-react-native';

export default function DOBScreen() {
  return (
    <PreferenceScreen
      icon={Calendar}
      title="When's your birthday?"
      description="We need this to personalize your experience"
      inputType="date"
      currentStep={2}
      totalSteps={10}
      nextRoute="/(onboarding)/gender"
      fieldName="dateOfBirth"
    />
  );
}
