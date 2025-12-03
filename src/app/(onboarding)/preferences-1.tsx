import PreferenceScreen from '@/components/features/onboarding/PreferenceScreen';

export default function Preferences1() {
  return (
    <PreferenceScreen
      question="What's your travel style?"
      options={[
        { id: 'adventure', label: '🏔️ Adventure' },
        { id: 'relaxation', label: '🏖️ Relaxation' },
        { id: 'cultural', label: '🏛️ Cultural' },
        { id: 'business', label: '💼 Business' },
        { id: 'mix', label: '🎯 Mix of Everything' },
      ]}
      currentStep={1}
      totalSteps={4}
      nextRoute="/(onboarding)/preferences-2"
    />
  );
}
