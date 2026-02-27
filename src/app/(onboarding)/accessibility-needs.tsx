import PreferenceScreen from '@/components/features/onboarding/PreferenceScreen';
import { Health } from 'iconsax-react-native';

export default function AccessibilityNeedsScreen() {
  return (
    <PreferenceScreen
      icon={Health}
      title="Any accessibility needs?"
      description="We'll ensure your travel is comfortable and accessible"
      inputType="select"
      options={[
        'None',
        'Wheelchair accessible',
        'Hearing assistance',
        'Visual assistance',
        'Mobility assistance',
        'Service animal',
        'Other',
      ]}
      currentStep={10}
      totalSteps={10}
      nextRoute="/(onboarding)/setup"
      isLast={true}
      fieldName="accessibilityNeeds"
    />
  );
}
