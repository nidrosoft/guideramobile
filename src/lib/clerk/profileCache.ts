import AsyncStorage from '@react-native-async-storage/async-storage';
import { Profile } from '@/types/auth.types';

const CACHE_KEY = '@guidera_profile_cache';

type ProfileCacheStore = Record<string, Profile>;

async function readStore(): Promise<ProfileCacheStore> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as ProfileCacheStore;
  } catch {
    return {};
  }
}

export async function getCachedProfile(clerkUserId: string): Promise<Profile | null> {
  const store = await readStore();
  return store[clerkUserId] ?? null;
}

export async function setCachedProfile(clerkUserId: string, profile: Profile): Promise<void> {
  const store = await readStore();
  store[clerkUserId] = profile;
  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(store));
}

export async function clearCachedProfile(clerkUserId?: string): Promise<void> {
  if (!clerkUserId) {
    await AsyncStorage.removeItem(CACHE_KEY);
    return;
  }
  const store = await readStore();
  delete store[clerkUserId];
  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(store));
}
