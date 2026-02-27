import PreferenceScreen from '@/components/features/onboarding/PreferenceScreen';
import { People } from 'iconsax-react-native';

export default function EthnicityScreen() {
  return (
    <PreferenceScreen
      icon={People}
      title="What's your ethnicity?"
      description="Optional - helps us provide culturally relevant recommendations"
      inputType="select"
      options={[
        'Asian',
        'Black or African',
        'Hispanic or Latino',
        'White or Caucasian',
        'Middle Eastern',
        'Pacific Islander',
        'Mixed',
        'Prefer not to say',
      ]}
      currentStep={4}
      totalSteps={10}
      nextRoute="/(onboarding)/country"
      fieldName="ethnicity"
    />
  );
}
