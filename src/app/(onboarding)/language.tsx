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
        'Arabic',
        'Bengali',
        'Chinese',
        'Czech',
        'Danish',
        'Dutch',
        'English',
        'Finnish',
        'French',
        'German',
        'Greek',
        'Hebrew',
        'Hindi',
        'Hungarian',
        'Indonesian',
        'Italian',
        'Japanese',
        'Korean',
        'Malay',
        'Norwegian',
        'Persian (Farsi)',
        'Polish',
        'Portuguese',
        'Romanian',
        'Russian',
        'Spanish',
        'Swahili',
        'Swedish',
        'Tagalog',
        'Thai',
        'Turkish',
        'Ukrainian',
        'Vietnamese',
      ]}
      minSelections={1}
      currentStep={6}
      totalSteps={11}
      nextRoute="/(onboarding)/emergency-contact"
      showBackButton={true}
      fieldName="languages"
    />
  );
}
