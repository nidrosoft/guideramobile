import PreferenceScreen from '@/components/features/onboarding/PreferenceScreen';

export default function Preferences3() {
  return (
    <PreferenceScreen
      question="How do you usually travel?"
      options={[
        { id: 'solo', label: '🚶 Solo Traveler' },
        { id: 'couple', label: '💑 Couple' },
        { id: 'family', label: '👨‍👩‍👧‍👦 Family' },
        { id: 'friends', label: '👥 Friends' },
        { id: 'group', label: '🚌 Group Tours' },
      ]}
      currentStep={3}
      totalSteps={4}
      nextRoute="/(onboarding)/preferences-4"
    />
  );
}
