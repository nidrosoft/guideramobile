import { supabase } from '@/lib/supabase/client';
import {
  JournalEntry,
  ContentBlock,
} from '@/features/trips/plugins/journal/types/journal.types';

function mapBlock(row: any): ContentBlock {
  return {
    id: row.id,
    position: row.position,
    size: row.size,
    content: row.content,
  };
}

function mapEntry(row: any, blocks?: any[]): JournalEntry {
  const entryBlocks = blocks ?? row.journal_blocks ?? row.blocks ?? [];
  return {
    id: row.id,
    tripId: row.trip_id,
    title: row.title,
    date: new Date(row.date),
    layout: row.layout,
    blocks: Array.isArray(entryBlocks)
      ? entryBlocks.map(mapBlock).sort((a, b) => a.position - b.position)
      : [],
    wordCount: row.word_count ?? 0,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

class JournalService {
  async getEntries(tripId: string): Promise<JournalEntry[]> {
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*, journal_blocks(*)')
      .eq('trip_id', tripId)
      .order('date', { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => mapEntry(row));
  }

  async getEntry(entryId: string): Promise<JournalEntry | null> {
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*, journal_blocks(*)')
      .eq('id', entryId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(error.message);
    }
    return data ? mapEntry(data) : null;
  }

  async createEntry(
    tripId: string,
    userId: string,
    data: { title: string; date: string; layout: string },
  ): Promise<JournalEntry> {
    const { data: entry, error } = await supabase
      .from('journal_entries')
      .insert({
        trip_id: tripId,
        user_id: userId,
        title: data.title,
        date: data.date,
        layout: data.layout,
        word_count: 0,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return mapEntry(entry, []);
  }

  async updateEntry(
    entryId: string,
    updates: Partial<{ title: string; layout: string; word_count: number }>,
  ): Promise<JournalEntry> {
    const { data, error } = await supabase
      .from('journal_entries')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', entryId)
      .select('*, journal_blocks(*)')
      .single();

    if (error) throw new Error(error.message);
    return mapEntry(data);
  }

  async deleteEntry(entryId: string): Promise<void> {
    // Delete blocks first (child rows)
    const { error: blocksError } = await supabase
      .from('journal_blocks')
      .delete()
      .eq('entry_id', entryId);

    if (blocksError) throw new Error(blocksError.message);

    const { error } = await supabase
      .from('journal_entries')
      .delete()
      .eq('id', entryId);

    if (error) throw new Error(error.message);
  }

  async saveBlocks(
    entryId: string,
    blocks: { type: string; content: any; position: number; size: string }[],
  ): Promise<void> {
    // Replace strategy: delete existing, insert new
    const { error: deleteError } = await supabase
      .from('journal_blocks')
      .delete()
      .eq('entry_id', entryId);

    if (deleteError) throw new Error(deleteError.message);

    if (blocks.length === 0) return;

    const rows = blocks.map((block) => ({
      entry_id: entryId,
      type: block.type,
      content: block.content,
      position: block.position,
      size: block.size,
    }));

    const { error: insertError } = await supabase
      .from('journal_blocks')
      .insert(rows);

    if (insertError) throw new Error(insertError.message);

    // Recalculate word count from text blocks
    const wordCount = blocks
      .filter((b) => b.type === 'text' && b.content?.data?.text)
      .reduce((sum, b) => {
        const text: string = b.content.data.text;
        return sum + text.trim().split(/\s+/).filter(Boolean).length;
      }, 0);

    await supabase
      .from('journal_entries')
      .update({ word_count: wordCount, updated_at: new Date().toISOString() })
      .eq('id', entryId);
  }
}

export const journalService = new JournalService();
export default journalService;
