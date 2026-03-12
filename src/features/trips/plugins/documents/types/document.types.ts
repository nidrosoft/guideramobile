/**
 * DOCUMENTS PLUGIN - TYPE DEFINITIONS
 *
 * AI-generated document intelligence for trip preparation.
 * Covers identity/entry, bookings, driving, health, children,
 * profession/activity, and financial document groups.
 */

// ─── Enums / Constants ────────────────────────────────────

export type DocumentStatus =
  | 'ok'
  | 'warning'
  | 'critical'
  | 'action_required'
  | 'not_required'
  | 'not_started';

export type DocumentPriority = 'critical' | 'high' | 'medium' | 'low';

export type AlertSeverity = 'critical' | 'warning' | 'info';

export type InsuranceCoverageStatus = 'adequate' | 'gaps_detected' | 'no_coverage';

export type DocumentGroupId =
  | 'grp_identity'
  | 'grp_bookings'
  | 'grp_driving'
  | 'grp_health'
  | 'grp_children'
  | 'grp_profession'
  | 'grp_financial';

export const DOCUMENT_GROUP_ORDER: DocumentGroupId[] = [
  'grp_identity',
  'grp_bookings',
  'grp_driving',
  'grp_health',
  'grp_children',
  'grp_profession',
  'grp_financial',
];

export const GROUP_META: Record<DocumentGroupId, { label: string; icon: string }> = {
  grp_identity: { label: 'Identity & Entry', icon: '🛂' },
  grp_bookings: { label: 'Travel Bookings', icon: '✈️' },
  grp_driving: { label: 'Driving', icon: '🚗' },
  grp_health: { label: 'Health & Medical', icon: '💊' },
  grp_children: { label: 'Children', icon: '👶' },
  grp_profession: { label: 'Profession & Activity', icon: '💼' },
  grp_financial: { label: 'Financial', icon: '💳' },
};

// ─── Core Interfaces ──────────────────────────────────────

export interface DocumentChecklist {
  id: string;
  tripId: string;
  userId: string;
  destination: string | null;
  destinationCountry: string | null;
  destinations: string[];
  totalDocuments: number;
  actionRequiredCount: number;
  checkedCount: number;
  criticalAlerts: CriticalAlert[];
  insuranceAnalysis: InsuranceAnalysis;
  digitalBackupChecklist: DigitalBackupItem[];
  borderEntryNotes: BorderEntryNote[];
  generatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentItem {
  id: string;
  checklistId: string;
  tripId: string;
  groupId: DocumentGroupId;
  groupTitle: string;
  groupIcon: string;
  name: string;
  status: DocumentStatus;
  statusLabel: string | null;
  priority: DocumentPriority;
  expiry: string | null;
  validityNote: string | null;
  deadlineDaysBeforeDeparture: number | null;
  url: string | null;
  processingTime: string | null;
  cost: string | null;
  notes: string | null;
  actionRequired: boolean;
  packReminder: boolean;
  isChecked: boolean;
  displayOrder: number;
  createdAt: string;
}

// ─── AI Output Sub-Types ──────────────────────────────────

export interface CriticalAlert {
  type: string;
  severity: AlertSeverity;
  title: string;
  detail: string;
  action: string;
  deadline: string | null;
}

export interface InsuranceAnalysis {
  overall_coverage_status: InsuranceCoverageStatus;
  gaps: InsuranceGap[];
  confirmed_coverages: string[];
  credit_card_check_note: string;
}

export interface InsuranceGap {
  gap_type: string;
  severity: 'high' | 'medium' | 'low';
  title: string;
  explanation: string;
  what_you_need: string;
  recommended_providers: InsuranceProvider[];
  action_required: boolean;
  deadline_note: string | null;
}

export interface InsuranceProvider {
  name: string;
  url: string;
  best_for: string;
  approx_cost: string;
}

export interface DigitalBackupItem {
  item: string;
  priority: 1 | 2;
  storage_methods: string[];
  is_complete: boolean;
}

export interface BorderEntryNote {
  country: string;
  entry_type: string;
  common_questions: string[];
  bring_to_immigration: string[];
  specific_notes: string;
}

// ─── Grouped View Helper ──────────────────────────────────

export interface DocumentGroup {
  groupId: DocumentGroupId;
  title: string;
  icon: string;
  items: DocumentItem[];
  totalCount: number;
  checkedCount: number;
  actionRequiredCount: number;
}

// ─── Status Helpers ───────────────────────────────────────

export const STATUS_CONFIG: Record<DocumentStatus, { color: string; label: string; sortOrder: number }> = {
  critical: { color: '#EF4444', label: 'Critical', sortOrder: 0 },
  action_required: { color: '#F59E0B', label: 'Action Required', sortOrder: 1 },
  warning: { color: '#F97316', label: 'Warning', sortOrder: 2 },
  not_started: { color: '#6B7280', label: 'Not Started', sortOrder: 3 },
  ok: { color: '#22C55E', label: 'Ready', sortOrder: 4 },
  not_required: { color: '#9CA3AF', label: 'Not Required', sortOrder: 5 },
};

export const PRIORITY_CONFIG: Record<DocumentPriority, { color: string; label: string }> = {
  critical: { color: '#EF4444', label: 'Critical' },
  high: { color: '#F59E0B', label: 'High' },
  medium: { color: '#3B82F6', label: 'Medium' },
  low: { color: '#9CA3AF', label: 'Low' },
};
