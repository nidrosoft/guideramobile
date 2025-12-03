import PreferenceScreen from '@/components/features/onboarding/PreferenceScreen';

export default function Preferences2() {
  return (
    <PreferenceScreen
      question="What interests you most?"
      options={[
        { id: 'food', label: '🍜 Food & Cuisine' },
        { id: 'history', label: '📚 History & Museums' },
        { id: 'nature', label: '🌿 Nature & Wildlife' },
        { id: 'nightlife', label: '🎉 Nightlife & Entertainment' },
        { id: 'shopping', label: '🛍️ Shopping' },
        { id: 'art', label: '🎨 Art & Architecture' },
      ]}
      currentStep={2}
      totalSteps={4}
      nextRoute="/(onboarding)/preferences-3"
      multiSelect
    />
  );
}
