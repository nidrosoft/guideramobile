import PreferenceScreen from '@/components/features/onboarding/PreferenceScreen';
import { LanguageSquare } from 'iconsax-react-native';

export default function LanguageScreen() {
  return (
    <PreferenceScreen
      icon={LanguageSquare}
      title="What languages do you speak?"
      description="Select your primary language"
      inputType="select"
      options={[
        'English',
        'Spanish',
        'French',
        'German',
        'Italian',
        'Portuguese',
        'Chinese',
        'Japanese',
        'Korean',
        'Arabic',
        'Hindi',
        'Other',
      ]}
      currentStep={6}
      totalSteps={10}
      nextRoute="/(onboarding)/emergency-contact"
    />
  );
}
