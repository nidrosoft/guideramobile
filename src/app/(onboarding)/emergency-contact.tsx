import PreferenceScreen from '@/components/features/onboarding/PreferenceScreen';
import { Call } from 'iconsax-react-native';

export default function EmergencyContactScreen() {
  return (
    <PreferenceScreen
      icon={Call}
      title="Emergency contact"
      description="Phone number of someone we can reach in case of emergency"
      placeholder="Enter phone number"
      inputType="text"
      keyboardType="phone-pad"
      currentStep={7}
      totalSteps={10}
      nextRoute="/(onboarding)/travel-preferences"
      fieldName="emergencyContactPhone"
    />
  );
}
