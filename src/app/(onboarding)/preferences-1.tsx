// DEPRECATED: This screen is orphaned and not part of the active onboarding flow.
// The active flow is: intro → name → dob → gender → ethnicity → country → language → emergency-contact → travel-preferences → dietary-restrictions → accessibility-needs → setup
import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function Preferences1() {
  const router = useRouter();
  useEffect(() => { router.replace('/(onboarding)/intro'); }, []);
  return null;
}
