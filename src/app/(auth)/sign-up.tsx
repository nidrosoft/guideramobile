// DEPRECATED: This screen's functionality is now on the landing page (SSO + email/phone buttons).
// Redirects to landing to avoid breaking any existing deep links.
import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function SignUp() {
  const router = useRouter();
  useEffect(() => { router.replace('/(auth)/landing'); }, []);
  return null;
}
