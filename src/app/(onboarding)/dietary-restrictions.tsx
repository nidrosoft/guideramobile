import PreferenceScreen from '@/components/features/onboarding/PreferenceScreen';
import { Cup } from 'iconsax-react-native';

export default function DietaryRestrictionsScreen() {
  return (
    <PreferenceScreen
      icon={Cup}
      title="Any dietary restrictions?"
      description="We'll help you find suitable dining options"
      inputType="select"
      options={[
        'None',
        'Vegetarian',
        'Vegan',
        'Halal',
        'Kosher',
        'Gluten-free',
        'Dairy-free',
        'Nut allergies',
        'Other allergies',
      ]}
      currentStep={9}
      totalSteps={10}
      nextRoute="/(onboarding)/accessibility-needs"
    />
  );
}
