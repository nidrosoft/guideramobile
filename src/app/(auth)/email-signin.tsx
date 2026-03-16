// DEPRECATED: Email sign-in is now handled by the unified sign-in screen (sign-in.tsx).
// This file redirects to sign-in to avoid breaking any existing deep links.
import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function EmailSignIn() {
  const router = useRouter();
  useEffect(() => { router.replace('/(auth)/sign-in'); }, []);
  return null;
}
