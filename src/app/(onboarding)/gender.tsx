import PreferenceScreen from '@/components/features/onboarding/PreferenceScreen';
import { Profile2User } from 'iconsax-react-native';

export default function GenderScreen() {
  return (
    <PreferenceScreen
      icon={Profile2User}
      title="What's your gender?"
      description="This helps us personalize recommendations"
      inputType="select"
      options={[
        'Woman',
        'Man',
        'Non-binary',
        'Gender Fluid',
        'Genderqueer',
        'Prefer not to say',
      ]}
      currentStep={3}
      totalSteps={10}
      nextRoute="/(onboarding)/ethnicity"
      fieldName="gender"
    />
  );
}
