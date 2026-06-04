/**
 * AI concierge chat service (spec §14.2). Threads + messages are owner-scoped
 * (RLS via requesting_user_id); the assistant reply is produced and persisted
 * by the journeys-chat edge function (service role).
 */
import { supabase } from '@/lib/supabase/client';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
}

async function categoryId(slug: string): Promise<string | null> {
  const { data } = await supabase.from('journey_categories').select('id').eq('slug', slug).maybeSingle();
  return data?.id ?? null;
}

export async function getOrCreateThread(input: {
  userId: string;
  categorySlug: string;
  countryCode: string;
}): Promise<string> {
  const catId = await categoryId(input.categorySlug);
  // reuse an existing thread for this user x journey x country
  const existing = await supabase
    .from('journey_chat_threads')
    .select('id')
    .eq('user_id', input.userId)
    .eq('category_id', catId)
    .eq('country_code', input.countryCode)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existing.data?.id) return existing.data.id;

  const { data, error } = await supabase
    .from('journey_chat_threads')
    .insert({ user_id: input.userId, category_id: catId, country_code: input.countryCode })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

export async function getMessages(threadId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('journey_chat_messages')
    .select('id, role, content, created_at')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((m: any) => ({ id: m.id, role: m.role, content: m.content, createdAt: m.created_at }));
}

export async function sendMessage(threadId: string, text: string): Promise<string> {
  // persist the user's message (RLS: caller owns the thread)
  await supabase.from('journey_chat_messages').insert({ thread_id: threadId, role: 'user', content: text });
  // the edge function generates + persists the assistant reply
  const { data, error } = await supabase.functions.invoke('journeys-chat', {
    body: { threadId, message: text },
  });
  if (error) throw error;
  return (data as any)?.reply ?? '';
}
