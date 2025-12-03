import PreferenceScreen from '@/components/features/onboarding/PreferenceScreen';
import { Airplane } from 'iconsax-react-native';

export default function TravelPreferencesScreen() {
  return (
    <PreferenceScreen
      icon={Airplane}
      title="What's your travel style?"
      description="This helps us recommend the perfect destinations"
      inputType="select"
      options={[
        'Adventure & Outdoor',
        'Relaxation & Beach',
        'Cultural & Historical',
        'Food & Culinary',
        'Nightlife & Entertainment',
        'Shopping & Luxury',
        'Nature & Wildlife',
        'Mix of Everything',
      ]}
      currentStep={8}
      totalSteps={10}
      nextRoute="/(onboarding)/dietary-restrictions"
    />
  );
}
