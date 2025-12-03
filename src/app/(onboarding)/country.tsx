import PreferenceScreen from '@/components/features/onboarding/PreferenceScreen';
import { Global } from 'iconsax-react-native';

export default function CountryScreen() {
  return (
    <PreferenceScreen
      icon={Global}
      title="Where are you from?"
      description="Your home country"
      placeholder="Enter your country"
      inputType="text"
      currentStep={5}
      totalSteps={10}
      nextRoute="/(onboarding)/language"
    />
  );
}
