/**
 * TRIP IMPORT SERVICE
 * Email, OAuth, manual, and scan imports
 */

import { supabase } from '@/lib/supabase/client';
import { invokeEdgeFn } from '@/utils/retry';
import { TripCoreService } from './trip-core.service';

// ============================================
// TYPES
// ============================================

export type ImportMethod =
  | 'email'
  | 'oauth_expedia'
  | 'oauth_booking'
  | 'oauth_airbnb'
  | 'oauth_google'
  | 'manual'
  | 'scan_qr'
  | 'scan_barcode'
  | 'scan_ocr';

export type ParseStatus = 'pending' | 'parsing' | 'parsed' | 'needs_review' | 'failed';
export type ProcessingStatus = 'pending' | 'processing' | 'processed' | 'merged' | 'skipped' | 'failed';

export interface TripImport {
  id: string;
  trip_id?: string;
  user_id: string;
  import_method: ImportMethod;
  raw_input_type?: string;
  raw_input_data?: string;
  raw_input_attachments: any[];
  email_from?: string;
  email_subject?: string;
  email_received_at?: string;
  email_message_id?: string;
  oauth_provider?: string;
  oauth_booking_id?: string;
  oauth_last_sync_at?: string;
  scan_image_url?: string;
  scan_confidence?: number;
  parse_status: ParseStatus;
  parsed_at?: string;
  parse_error?: string;
  parsed_data?: ParsedImportData;
  overall_confidence?: number;
  field_confidences?: Record<string, number>;
  processing_status: ProcessingStatus;
  created_booking_id?: string;
  created_activity_id?: string;
  merged_with_booking_id?: string;
  user_reviewed: boolean;
  user_reviewed_at?: string;
  user_corrections?: any;
  created_at: string;
  updated_at: string;
}

export interface ParsedImportData {
  category?: string;
  confidence: number;
  extracted?: any;
  destination?: {
    code?: string;
    name?: string;
    country?: string;
  };
  dates?: {
    start?: string;
    end?: string;
  };
  travelers?: any[];
  bookingData?: any;
  importMethod?: string;
  importId?: string;
}

export interface ManualEntryData {
  category: 'flight' | 'hotel' | 'car' | 'experience' | 'other';
  title: string;
  confirmationNumber?: string;
  provider?: string;
  startDate: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  destination?: {
    name: string;
    code?: string;
    country?: string;
  };
  origin?: {
    name: string;
    code?: string;
  };
  price?: {
    amount: number;
    currency: string;
  };
  details?: any;
  notes?: string;
  tripId?: string;
}

export interface LinkedAccount {
  id: string;
  user_id: string;
  provider: string;
  provider_account_id?: string;
  provider_email?: string;
  provider_name?: string;
  auto_sync_enabled: boolean;
  sync_frequency: string;
  last_sync_at?: string;
  last_sync_status?: string;
  last_sync_error?: string;
  next_sync_at?: string;
  import_flights: boolean;
  import_hotels: boolean;
  import_cars: boolean;
  import_experiences: boolean;
  bookings_imported: number;
  status: string;
  created_at: string;
  updated_at: string;
}

// ============================================
// EMAIL IMPORT
// ============================================

/**
 * Get or create user's import email alias
 */
export async function getImportEmail(userId: string): Promise<string> {
  // Check existing
  const { data: existing } = await supabase
    .from('user_email_aliases')
    .select('alias_email')
    .eq('user_id', userId)
    .eq('is_active', true)
    .single();

  if (existing) {
    return existing.alias_email;
  }

  // Generate new
  const prefix = `import-${generateRandomString(12)}`;
  const email = `${prefix}@trips.guidera.com`;

  await supabase.from('user_email_aliases').insert({
    user_id: userId,
    alias_email: email,
    alias_prefix: prefix,
    is_active: true,
  });

  return email;
}

/**
 * Process incoming email (webhook handler)
 */
export async function processIncomingEmail(
  recipient: string,
  emailData: {
    from: string;
    subject: string;
    body: string;
    attachments?: any[];
    messageId?: string;
    receivedAt?: string;
  }
): Promise<TripImport> {
  // Find user by alias
  const { data: alias } = await supabase
    .from('user_email_aliases')
    .select('user_id')
    .eq('alias_email', recipient)
    .eq('is_active', true)
    .single();

  if (!alias) {
    throw new Error('Unknown import email address');
  }

  // Update alias stats
  await supabase
    .from('user_email_aliases')
    .update({
      emails_received: supabase.rpc('increment', { x: 1 }),
      last_email_at: new Date().toISOString(),
    })
    .eq('alias_email', recipient);

  // Create import record
  const { data: importRecord, error } = await supabase
    .from('trip_imports')
    .insert({
      user_id: alias.user_id,
      import_method: 'email',
      raw_input_type: 'email',
      raw_input_data: emailData.body,
      raw_input_attachments: emailData.attachments || [],
      email_from: emailData.from,
      email_subject: emailData.subject,
      email_received_at: emailData.receivedAt || new Date().toISOString(),
      email_message_id: emailData.messageId,
      parse_status: 'pending',
      processing_status: 'pending',
    })
    .select()
    .single();

  if (error) throw error;

  // Queue for async parsing
  await supabase.from('scheduled_jobs').insert({
    job_type: 'parse_email_import',
    job_data: { importId: importRecord.id },
    scheduled_for: new Date().toISOString(),
    status: 'pending',
  });

  return importRecord as TripImport;
}

/**
 * Parse email content (called by scheduled job)
 */
export async function parseEmailImport(importId: string): Promise<void> {
  const { data: importRecord } = await supabase
    .from('trip_imports')
    .select('*')
    .eq('id', importId)
    .single();

  if (!importRecord) return;

  // Update status
  await supabase
    .from('trip_imports')
    .update({ parse_status: 'parsing' })
    .eq('id', importId);

  try {
    // Call AI parsing edge function
    const { data: parsed, error } = await invokeEdgeFn(supabase, 'parse-booking-email', {
        from: importRecord.email_from,
        subject: importRecord.email_subject,
        body: importRecord.raw_input_data,
        attachments: importRecord.raw_input_attachments,
    }, 'slow');

    if (error) throw error;

    // Update with parsed data
    const parseStatus = parsed.confidence > 0.7 ? 'parsed' : 'needs_review';

    await supabase
      .from('trip_imports')
      .update({
        parse_status: parseStatus,
        parsed_at: new Date().toISOString(),
        parsed_data: parsed,
        overall_confidence: parsed.confidence,
        field_confidences: parsed.fieldConfidences,
      })
      .eq('id', importId);

    // Auto-process if high confidence
    if (parsed.confidence > 0.85) {
      await processImport(importId);
    } else {
      // Notify user to review
      await notifyImportNeedsReview(importRecord.user_id, importId);
    }
  } catch (error: any) {
    await supabase
      .from('trip_imports')
      .update({
        parse_status: 'failed',
        parse_error: error.message,
      })
      .eq('id', importId);
  }
}

// ============================================
// MANUAL IMPORT
// ============================================

/**
 * Submit manual entry
 */
export async function submitManualEntry(
  userId: string,
  data: ManualEntryData
): Promise<TripImport> {
  // Create import record
  const { data: importRecord, error } = await supabase
    .from('trip_imports')
    .insert({
      user_id: userId,
      trip_id: data.tripId,
      import_method: 'manual',
      raw_input_type: 'manual',
      raw_input_data: JSON.stringify(data),
      parse_status: 'parsed',
      parsed_data: {
        category: data.category,
        confidence: 1.0,
        extracted: {
          title: data.title,
          confirmationNumber: data.confirmationNumber,
          provider: data.provider,
          startDate: data.startDate,
          endDate: data.endDate,
          startTime: data.startTime,
          endTime: data.endTime,
          price: data.price,
          ...data.details,
        },
        destination: data.destination,
        dates: {
          start: data.startDate,
          end: data.endDate,
        },
      },
      overall_confidence: 1.0,
      processing_status: 'pending',
    })
    .select()
    .single();

  if (error) throw error;

  // Process immediately
  await processImport(importRecord.id);

  return importRecord as TripImport;
}

// ============================================
// SCAN IMPORT
// ============================================

/**
 * Process scanned ticket/QR/barcode
 */
export async function processScan(
  userId: string,
  scanData: {
    type: 'qr' | 'barcode' | 'ocr';
    imageUrl?: string;
    rawData?: string;
    tripId?: string;
  }
): Promise<TripImport> {
  const importMethod = `scan_${scanData.type}` as ImportMethod;

  // Create import record
  const { data: importRecord, error } = await supabase
    .from('trip_imports')
    .insert({
      user_id: userId,
      trip_id: scanData.tripId,
      import_method: importMethod,
      raw_input_type: scanData.type,
      raw_input_data: scanData.rawData,
      scan_image_url: scanData.imageUrl,
      parse_status: 'pending',
      processing_status: 'pending',
    })
    .select()
    .single();

  if (error) throw error;

  // Queue for parsing
  await supabase.from('scheduled_jobs').insert({
    job_type: 'parse_scan_import',
    job_data: { importId: importRecord.id },
    scheduled_for: new Date().toISOString(),
    status: 'pending',
  });

  return importRecord as TripImport;
}

// ============================================
// OAUTH IMPORT — DEPRECATED
// ============================================
// OAuth-based import (Traxo, Expedia, Booking.com) has been replaced by
// email-based import (forward booking emails to import+{userId}@guidera.one).
// See: src/services/emailImport.service.ts and supabase/functions/process-email-import/
//
// The linked_travel_accounts table still exists in the DB but is no longer used.
// This section is intentionally empty — all OAuth functions have been removed.

/**
 * Get user's linked accounts (legacy — returns empty for backward compat)
 */
export async function getLinkedAccounts(userId: string): Promise<LinkedAccount[]> {
  return [];
}

// ============================================
// IMPORT PROCESSING
// ============================================

// PLACEHOLDER: syncLinkedAccount removed (was Traxo OAuth)
// The import processing below is still used by the email import + scan flows.

/**
 * Sync linked account — DEPRECATED (no-op)
 */
export async function syncLinkedAccount(_accountId: string): Promise<{ imported: number }> {
  return { imported: 0 };
}

/**
 * Process an import (create trip/booking) — used by email + scan flows
 */
export async function processImport(importId: string): Promise<void> {
  const { data: importRecord } = await supabase
    .from('trip_imports')
    .select('*')
    .eq('id', importId)
    .single();

  if (!importRecord || !importRecord.parsed_data) return;

  await supabase
    .from('trip_imports')
    .update({ processing_status: 'processing' })
    .eq('id', importId);

  try {
    const parsed = importRecord.parsed_data as ParsedImportData;
    const userId = importRecord.user_id;

    // Find or create trip
    let tripId = importRecord.trip_id;

    if (!tripId) {
      // Try to find matching trip
      const existingTrip = await findMatchingTrip(userId, parsed);

      if (existingTrip) {
        tripId = existingTrip.id;
      } else {
        // Create new trip
        const trip = await TripCoreService.createTrip({
          userId,
          name: generateTripNameFromImport(parsed),
          destination: parsed.destination,
          startDate: parsed.dates?.start,
          endDate: parsed.dates?.end,
          createdVia: `import_${importRecord.import_method}`,
        });
        tripId = trip.id;
      }
    }

    // Create booking if data extracted
    let bookingId: string | undefined;
    if (parsed.extracted && parsed.category) {
      bookingId = await createBookingFromImport(userId, parsed, importId);

      if (bookingId) {
        await TripCoreService.linkBookingToTrip(tripId, bookingId, {
          source: importRecord.import_method,
          importId,
        });
      }
    }

    // Update import record
    await supabase
      .from('trip_imports')
      .update({
        trip_id: tripId,
        created_booking_id: bookingId,
        processing_status: 'processed',
      })
      .eq('id', importId);

    // Notify user
    await notifyImportProcessed(userId, tripId, !importRecord.trip_id);
  } catch (error: any) {
    await supabase
      .from('trip_imports')
      .update({
        processing_status: 'failed',
        parse_error: error.message,
      })
      .eq('id', importId);
  }
}

/**
 * Submit user corrections for an import
 */
export async function submitImportCorrections(
  userId: string,
  importId: string,
  corrections: any
): Promise<void> {
  const { data: importRecord } = await supabase
    .from('trip_imports')
    .select('*')
    .eq('id', importId)
    .eq('user_id', userId)
    .single();

  if (!importRecord) {
    throw new Error('Import not found');
  }

  // Merge corrections with parsed data
  const updatedParsedData = {
    ...importRecord.parsed_data,
    ...corrections,
    confidence: 1.0, // User-corrected = high confidence
  };

  await supabase
    .from('trip_imports')
    .update({
      parsed_data: updatedParsedData,
      user_reviewed: true,
      user_reviewed_at: new Date().toISOString(),
      user_corrections: corrections,
      parse_status: 'parsed',
    })
    .eq('id', importId);

  // Process the corrected import
  await processImport(importId);
}

/**
 * Get user's imports
 */
export async function getUserImports(
  userId: string,
  filters?: { status?: ParseStatus; tripId?: string }
): Promise<TripImport[]> {
  let query = supabase
    .from('trip_imports')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (filters?.status) {
    query = query.eq('parse_status', filters.status);
  }
  if (filters?.tripId) {
    query = query.eq('trip_id', filters.tripId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as TripImport[];
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function generateRandomString(length: number): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function findMatchingTrip(userId: string, parsed: ParsedImportData): Promise<any | null> {
  if (!parsed.destination?.name || !parsed.dates?.start) return null;

  const { data } = await supabase
    .from('trips')
    .select('*')
    .eq('owner_id', userId)
    .eq('primary_destination_name', parsed.destination.name)
    .gte('start_date', parsed.dates.start)
    .lte('end_date', parsed.dates.end || parsed.dates.start)
    .is('deleted_at', null)
    .single();

  return data;
}

function generateTripNameFromImport(parsed: ParsedImportData): string {
  const dest = parsed.destination?.name || 'Trip';
  if (parsed.dates?.start) {
    const date = new Date(parsed.dates.start);
    return `${dest} ${date.toLocaleString('en-US', { month: 'short' })} ${date.getFullYear()}`;
  }
  return `Trip to ${dest}`;
}

async function createBookingFromImport(
  userId: string,
  parsed: ParsedImportData,
  importId: string
): Promise<string | undefined> {
  // Create booking record
  const { data, error } = await supabase
    .from('bookings')
    .insert({
      user_id: userId,
      category: parsed.category,
      status: 'confirmed',
      booking_reference: parsed.extracted?.confirmationNumber,
      provider_code: parsed.extracted?.provider,
      item_details: parsed.extracted,
      total_amount: parsed.extracted?.price?.amount,
      currency: parsed.extracted?.price?.currency || 'USD',
      travel_start_date: parsed.dates?.start,
      travel_end_date: parsed.dates?.end,
      created_via: 'import',
    })
    .select('id')
    .single();

  if (error) {
    console.error('Failed to create booking from import:', error);
    return undefined;
  }

  return data?.id;
}

async function notifyImportNeedsReview(userId: string, importId: string): Promise<void> {
  await supabase.from('scheduled_jobs').insert({
    job_type: 'send_notification',
    job_data: {
      userId,
      type: 'import_needs_review',
      importId,
    },
    scheduled_for: new Date().toISOString(),
    status: 'pending',
  });
}

async function notifyImportProcessed(userId: string, tripId: string, isNewTrip: boolean): Promise<void> {
  await supabase.from('scheduled_jobs').insert({
    job_type: 'send_notification',
    job_data: {
      userId,
      type: 'import_processed',
      tripId,
      isNewTrip,
    },
    scheduled_for: new Date().toISOString(),
    status: 'pending',
  });
}

export const TripImportService = {
  getImportEmail,
  processIncomingEmail,
  parseEmailImport,
  submitManualEntry,
  processScan,
  syncLinkedAccount,
  getLinkedAccounts,
  processImport,
  submitImportCorrections,
  getUserImports,
};
