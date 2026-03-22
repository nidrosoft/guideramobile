import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function EditProfile() {
  const router = useRouter();
  useEffect(() => { router.replace('/account/edit-profile'); }, []);
  return null;
}
// Redirects to the real edit-profile screen at /account/edit-profile
