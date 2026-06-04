/**
 * Toolkit service (spec §15). Checklist templates (public-read) + per-user
 * checklist state and saved cost estimates (owner-scoped via RLS).
 */
import { supabase } from '@/lib/supabase/client';
import type { ChecklistItem, JourneyChecklist } from '../types';

async function categoryId(slug: string): Promise<string | null> {
  const { data } = await supabase.from('journey_categories').select('id').eq('slug', slug).maybeSingle();
  return data?.id ?? null;
}

export async function getChecklist(
  categorySlug: string,
  countryCode: string,
  userId?: string
): Promise<JourneyChecklist | null> {
  const catId = await categoryId(categorySlug);
  if (!catId) return null;

  const { data: template } = await supabase
    .from('journey_checklist_templates')
    .select('items')
    .eq('category_id', catId)
    .maybeSingle();
  if (!template) return null;

  let checked: Record<string, boolean> = {};
  if (userId) {
    const { data: state } = await supabase
      .from('journey_user_checklist_state')
      .select('checked')
      .eq('user_id', userId)
      .eq('category_id', catId)
      .eq('country_code', countryCode)
      .maybeSingle();
    checked = (state?.checked as Record<string, boolean>) ?? {};
  }
  return { items: (template.items as ChecklistItem[]) ?? [], checked };
}

export async function setChecklistItem(input: {
  userId: string;
  categorySlug: string;
  countryCode: string;
  key: string;
  value: boolean;
  current: Record<string, boolean>;
}): Promise<Record<string, boolean>> {
  const catId = await categoryId(input.categorySlug);
  if (!catId) throw new Error('invalid_category');
  const next = { ...input.current, [input.key]: input.value };
  const { error } = await supabase.from('journey_user_checklist_state').upsert(
    {
      user_id: input.userId,
      category_id: catId,
      country_code: input.countryCode,
      checked: next,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,category_id,country_code' }
  );
  if (error) throw error;
  return next;
}

export interface CostLineItem {
  label: string;
  amount: number;
  currency?: string;
}

export async function saveCostEstimate(input: {
  userId: string;
  guideId?: string;
  lineItems: CostLineItem[];
  total: number;
  homeCompare?: number;
  currency?: string;
}): Promise<void> {
  const { error } = await supabase.from('journey_cost_estimates').insert({
    user_id: input.userId,
    guide_id: input.guideId ?? null,
    line_items: input.lineItems,
    total_amount: input.total,
    home_compare: input.homeCompare ?? null,
    currency: input.currency ?? 'USD',
  });
  if (error) throw error;
}

export interface VisaWatch {
  nationality?: string;
  status?: Record<string, any>;
  alertsEnabled?: boolean;
  lastChecked?: string;
}

export async function getVisaWatch(
  userId: string,
  countryCode: string,
  categorySlug?: string
): Promise<VisaWatch | null> {
  const catId = categorySlug ? await categoryId(categorySlug) : null;
  let q = supabase
    .from('journey_visa_watches')
    .select('nationality, status, alerts_enabled, last_checked')
    .eq('user_id', userId)
    .eq('country_code', countryCode);
  q = catId ? q.eq('category_id', catId) : q.is('category_id', null);
  const { data } = await q.maybeSingle();
  if (!data) return null;
  return {
    nationality: data.nationality ?? undefined,
    status: data.status ?? {},
    alertsEnabled: data.alerts_enabled ?? true,
    lastChecked: data.last_checked ?? undefined,
  };
}

export async function upsertVisaWatch(input: {
  userId: string;
  countryCode: string;
  categorySlug?: string;
  nationality?: string;
  note?: string;
  alertsEnabled?: boolean;
}): Promise<void> {
  const catId = input.categorySlug ? await categoryId(input.categorySlug) : null;
  const { error } = await supabase.from('journey_visa_watches').upsert(
    {
      user_id: input.userId,
      country_code: input.countryCode,
      category_id: catId,
      nationality: input.nationality ?? null,
      status: input.note ? { note: input.note } : {},
      alerts_enabled: input.alertsEnabled ?? true,
      last_checked: new Date().toISOString(),
    },
    { onConflict: 'user_id,country_code,category_id' }
  );
  if (error) throw error;
}
