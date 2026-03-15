import PreferenceScreen from '@/components/features/onboarding/PreferenceScreen';
import { LanguageSquare } from 'iconsax-react-native';

export default function LanguageScreen() {
  return (
    <PreferenceScreen
      icon={LanguageSquare}
      title="What languages do you speak?"
      description="Select all languages you're comfortable with"
      inputType="multiselect"
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
        'Swahili',
        'Russian',
        'Dutch',
      ]}
      minSelections={1}
      currentStep={6}
      totalSteps={10}
      nextRoute="/(onboarding)/emergency-contact"
      fieldName="languages"
    />
  );
}
