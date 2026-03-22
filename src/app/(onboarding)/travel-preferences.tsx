import PreferenceScreen from '@/components/features/onboarding/PreferenceScreen';
import { Airplane } from 'iconsax-react-native';

export default function TravelPreferencesScreen() {
  return (
    <PreferenceScreen
      icon={Airplane}
      title="What's your travel style?"
      description="Pick at least 3 that match your vibe"
      inputType="multiselect"
      options={[
        'Adventure & Outdoor',
        'Relaxation & Beach',
        'Cultural & Historical',
        'Food & Culinary',
        'Nightlife & Entertainment',
        'Shopping & Luxury',
        'Nature & Wildlife',
        'Wellness & Spa',
        'Road Trips',
        'Backpacking',
      ]}
      minSelections={3}
      currentStep={8}
      totalSteps={11}
      nextRoute="/(onboarding)/dietary-restrictions"
      showBackButton={true}
      fieldName="travelStyles"
    />
  );
}
