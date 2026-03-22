import PreferenceScreen from '@/components/features/onboarding/PreferenceScreen';
import { Call } from 'iconsax-react-native';

export default function EmergencyContactScreen() {
  return (
    <PreferenceScreen
      icon={Call}
      title="Emergency contact"
      description="This can be a family member, best friend, or anyone you trust. We'll only contact them if something happens to you while traveling — your safety is our priority."
      placeholder="Enter phone number"
      inputType="text"
      keyboardType="phone-pad"
      currentStep={7}
      totalSteps={11}
      nextRoute="/(onboarding)/travel-preferences"
      showBackButton={true}
      fieldName="emergencyContactPhone"
    />
  );
}
