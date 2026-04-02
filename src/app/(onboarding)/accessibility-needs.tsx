import PreferenceScreen from '@/components/features/onboarding/PreferenceScreen';
import { Health } from 'iconsax-react-native';

export default function AccessibilityNeedsScreen() {
  return (
    <PreferenceScreen
      icon={Health}
      title="Any accessibility needs?"
      description="Select all that apply — we'll make your travel comfortable"
      inputType="multiselect"
      options={[
        'None',
        'Wheelchair accessible',
        'Hearing assistance',
        'Visual assistance',
        'Mobility assistance',
        'Service animal',
        'Chronic pain management',
        'Sensory sensitivities',
      ]}
      minSelections={1}
      currentStep={10}
      totalSteps={11}
      nextRoute="/(onboarding)/location"
      showBackButton={true}
      fieldName="accessibilityNeeds"
      exclusiveOption="None"
    />
  );
}
