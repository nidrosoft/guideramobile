import PreferenceScreen from '@/components/features/onboarding/PreferenceScreen';
import { User } from 'iconsax-react-native';

export default function NameScreen() {
  return (
    <PreferenceScreen
      icon={User}
      title="What's your name?"
      description="Let us know what to call you"
      placeholder="Enter your first name"
      inputType="text"
      currentStep={1}
      totalSteps={10}
      nextRoute="/(onboarding)/dob"
      fieldName="firstName"
    />
  );
}
