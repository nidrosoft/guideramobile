import PreferenceScreen from '@/components/features/onboarding/PreferenceScreen';

export default function Preferences4() {
  return (
    <PreferenceScreen
      question="What's your typical budget?"
      options={[
        { id: 'budget', label: '💰 Budget-Friendly' },
        { id: 'moderate', label: '💵 Moderate' },
        { id: 'comfort', label: '💳 Comfort' },
        { id: 'luxury', label: '💎 Luxury' },
      ]}
      currentStep={4}
      totalSteps={4}
      isLast
    />
  );
}
