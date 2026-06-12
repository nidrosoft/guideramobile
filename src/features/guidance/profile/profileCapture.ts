/**
 * Persists a confirmed profile fact through the existing preferences service,
 * so RLS and sync-queue behavior are unchanged.
 */
import { preferencesService, type TravelPreferences } from '@/services/preferences.service';
import { FIELD_META } from './fieldMeta';
import type { ProfileField } from '../types';

export async function applyFact(
  userId: string,
  field: ProfileField,
  value: any
): Promise<TravelPreferences | null> {
  const meta = FIELD_META[field];
  if (!meta) return null;

  const payload = meta.toPayload(value);
  if (Object.keys(payload).length === 0) return null; // e.g. languages → handled elsewhere

  const { data } = await preferencesService.updatePreferences(userId, payload);
  return data;
}

export async function loadPreferences(userId: string): Promise<TravelPreferences | null> {
  const { data } = await preferencesService.getPreferences(userId);
  return data;
}
