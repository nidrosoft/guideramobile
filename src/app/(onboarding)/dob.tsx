import PreferenceScreen from '@/components/features/onboarding/PreferenceScreen';
import { Calendar } from 'iconsax-react-native';

export default function DOBScreen() {
  return (
    <PreferenceScreen
      icon={Calendar}
      title="When's your birthday?"
      description="Your age helps us tailor trip recommendations, safety tips, and activity suggestions to suit you best"
      inputType="date"
      currentStep={2}
      totalSteps={11}
      nextRoute="/(onboarding)/gender"
      showBackButton={true}
      fieldName="dateOfBirth"
    />
  );
}
