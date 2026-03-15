import PreferenceScreen from '@/components/features/onboarding/PreferenceScreen';
import { Cup } from 'iconsax-react-native';

export default function DietaryRestrictionsScreen() {
  return (
    <PreferenceScreen
      icon={Cup}
      title="Any dietary restrictions?"
      description="Select all that apply — we'll find suitable dining options"
      inputType="multiselect"
      options={[
        'None',
        'Vegetarian',
        'Vegan',
        'Halal',
        'Kosher',
        'Gluten-free',
        'Dairy-free',
        'Nut allergies',
        'Shellfish allergy',
        'Lactose intolerant',
      ]}
      minSelections={1}
      currentStep={9}
      totalSteps={10}
      nextRoute="/(onboarding)/accessibility-needs"
      fieldName="dietaryRestrictions"
    />
  );
}
