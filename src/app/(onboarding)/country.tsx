import PreferenceScreen from '@/components/features/onboarding/PreferenceScreen';
import { Global } from 'iconsax-react-native';

export default function CountryScreen() {
  return (
    <PreferenceScreen
      icon={Global}
      title="Where are you from?"
      description="Select your home country"
      inputType="select"
      options={[
        'United States',
        'United Kingdom',
        'Canada',
        'Australia',
        'Germany',
        'France',
        'Nigeria',
        'South Africa',
        'Kenya',
        'Ghana',
        'Cameroon',
        'India',
        'Brazil',
        'Mexico',
        'Japan',
        'South Korea',
        'China',
        'Philippines',
        'Italy',
        'Spain',
        'Netherlands',
        'Sweden',
        'Switzerland',
        'United Arab Emirates',
        'Saudi Arabia',
        'Singapore',
        'New Zealand',
        'Colombia',
        'Argentina',
        'Egypt',
        'Morocco',
        'Thailand',
        'Indonesia',
        'Turkey',
        'Poland',
        'Portugal',
        'Ireland',
        'Jamaica',
        'Trinidad and Tobago',
        'Ethiopia',
        'Tanzania',
      ]}
      currentStep={5}
      totalSteps={10}
      nextRoute="/(onboarding)/language"
      fieldName="country"
    />
  );
}
