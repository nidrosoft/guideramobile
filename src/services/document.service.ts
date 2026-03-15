import { supabase } from '@/lib/supabase/client';
import {
  DocumentChecklist,
  DocumentItem,
  DocumentGroup,
  DocumentGroupId,
  DOCUMENT_GROUP_ORDER,
  GROUP_META,
} from '@/features/trips/plugins/documents/types/document.types';

// ─── Row Mappers ────────────────────────────────────────

function mapChecklist(row: any): DocumentChecklist {
  return {
    id: row.id,
    tripId: row.trip_id,
    userId: row.user_id,
    destination: row.destination ?? null,
    destinationCountry: row.destination_country ?? null,
    destinations: row.destinations ?? [],
    totalDocuments: row.total_documents ?? 0,
    actionRequiredCount: row.action_required_count ?? 0,
    checkedCount: row.checked_count ?? 0,
    criticalAlerts: row.critical_alerts ?? [],
    insuranceAnalysis: row.insurance_analysis ?? {},
    digitalBackupChecklist: row.digital_backup_checklist ?? [],
    borderEntryNotes: row.border_entry_notes ?? [],
    generatedBy: row.generated_by ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapItem(row: any): DocumentItem {
  return {
    id: row.id,
    checklistId: row.checklist_id,
    tripId: row.trip_id,
    groupId: row.group_id,
    groupTitle: row.group_title,
    groupIcon: row.group_icon ?? '📄',
    name: row.name,
    status: row.status ?? 'not_started',
    statusLabel: row.status_label ?? null,
    priority: row.priority ?? 'medium',
    expiry: row.expiry ?? null,
    validityNote: row.validity_note ?? null,
    deadlineDaysBeforeDeparture: row.deadline_days_before_departure ?? null,
    url: row.url ?? null,
    processingTime: row.processing_time ?? null,
    cost: row.cost ?? null,
    notes: row.notes ?? null,
    actionRequired: row.action_required ?? false,
    packReminder: row.pack_reminder ?? false,
    isChecked: row.is_checked ?? false,
    displayOrder: row.display_order ?? 0,
    createdAt: row.created_at,
  };
}

// ─── Service ────────────────────────────────────────────

class DocumentService {
  async generateDocuments(tripId: string): Promise<{
    success: boolean;
    totalDocuments?: number;
    actionRequired?: number;
    modelUsed?: string;
    error?: string;
  }> {
    const { data, error } = await supabase.functions.invoke('generate-documents', {
      body: { tripId },
    });
    if (error) throw new Error(`Document generation failed: ${error.message}`);
    if (data?.error) throw new Error(data.error);
    return data;
  }

  async getChecklist(tripId: string): Promise<DocumentChecklist | null> {
    const { data, error } = await supabase
      .from('document_checklists')
      .select('*')
      .eq('trip_id', tripId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) return null;
    return mapChecklist(data);
  }

  async getItems(tripId: string): Promise<DocumentItem[]> {
    const { data: checklist } = await supabase
      .from('document_checklists')
      .select('id')
      .eq('trip_id', tripId)
      .maybeSingle();

    if (!checklist) return [];

    const { data, error } = await supabase
      .from('document_items')
      .select('*')
      .eq('checklist_id', checklist.id)
      .order('display_order', { ascending: true });

    if (error) throw new Error(error.message);
    return (data ?? []).map(mapItem);
  }

  async getItemsByGroup(tripId: string, groupId: DocumentGroupId): Promise<DocumentItem[]> {
    const { data: checklist } = await supabase
      .from('document_checklists')
      .select('id')
      .eq('trip_id', tripId)
      .maybeSingle();

    if (!checklist) return [];

    const { data, error } = await supabase
      .from('document_items')
      .select('*')
      .eq('checklist_id', checklist.id)
      .eq('group_id', groupId)
      .order('display_order', { ascending: true });

    if (error) throw new Error(error.message);
    return (data ?? []).map(mapItem);
  }

  async toggleItemChecked(itemId: string, isChecked: boolean): Promise<void> {
    const { error } = await supabase
      .from('document_items')
      .update({ is_checked: isChecked })
      .eq('id', itemId);
    if (error) throw new Error(error.message);
  }

  async getGroupedItems(tripId: string): Promise<DocumentGroup[]> {
    const items = await this.getItems(tripId);
    const groupMap = new Map<DocumentGroupId, DocumentItem[]>();

    for (const item of items) {
      const list = groupMap.get(item.groupId) || [];
      list.push(item);
      groupMap.set(item.groupId, list);
    }

    const groups: DocumentGroup[] = [];
    for (const groupId of DOCUMENT_GROUP_ORDER) {
      const groupItems = groupMap.get(groupId);
      if (!groupItems || groupItems.length === 0) continue;
      const meta = GROUP_META[groupId];
      groups.push({
        groupId,
        title: groupItems[0].groupTitle || meta?.label || groupId,
        icon: meta?.icon || '📄',
        items: groupItems,
        totalCount: groupItems.length,
        checkedCount: groupItems.filter(i => i.isChecked).length,
        actionRequiredCount: groupItems.filter(i => i.actionRequired).length,
      });
    }

    return groups;
  }

  async updateCheckedCount(tripId: string): Promise<void> {
    const items = await this.getItems(tripId);
    const checkedCount = items.filter(i => i.isChecked).length;
    await supabase
      .from('document_checklists')
      .update({ checked_count: checkedCount })
      .eq('trip_id', tripId);
  }

  async clearDocuments(tripId: string): Promise<void> {
    const { data: checklist } = await supabase
      .from('document_checklists')
      .select('id')
      .eq('trip_id', tripId)
      .maybeSingle();

    if (checklist) {
      await supabase.from('document_items').delete().eq('checklist_id', checklist.id);
      await supabase.from('document_checklists').delete().eq('id', checklist.id);
    }
  }
}

export const documentService = new DocumentService();
export default documentService;
