/**
 * TRIP IMPORT SERVICE
 * Email, OAuth, manual, and scan imports
 */

import { supabase } from '@/lib/supabase/client';
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
    const { data: parsed, error } = await supabase.functions.invoke('parse-booking-email', {
      body: {
        from: importRecord.email_from,
        subject: importRecord.email_subject,
        body: importRecord.raw_input_data,
        attachments: importRecord.raw_input_attachments,
      },
    });

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
// OAUTH IMPORT
// ============================================

/**
 * Initiate OAuth connection
 */
export async function initiateOAuthConnection(
  userId: string,
  provider: string
): Promise<{ authUrl: string; state: string }> {
  const state = generateRandomString(32);

  // Store state for callback verification
  await supabase.from('scheduled_jobs').insert({
    job_type: 'oauth_state',
    job_data: { userId, provider, state },
    scheduled_for: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // Expires in 10 min
    status: 'pending',
  });

  // Build OAuth URL based on provider
  const authUrl = buildOAuthUrl(provider, state);

  return { authUrl, state };
}

/**
 * Handle OAuth callback
 */
export async function handleOAuthCallback(
  code: string,
  state: string
): Promise<LinkedAccount> {
  // Verify state
  const { data: stateRecord } = await supabase
    .from('scheduled_jobs')
    .select('job_data')
    .eq('job_type', 'oauth_state')
    .eq('status', 'pending')
    .single();

  if (!stateRecord || stateRecord.job_data.state !== state) {
    throw new Error('Invalid OAuth state');
  }

  const { userId, provider } = stateRecord.job_data;

  // Exchange code for tokens (provider-specific)
  const tokens = await exchangeOAuthCode(provider, code);

  // Get account info
  const accountInfo = await getOAuthAccountInfo(provider, tokens.access_token);

  // Store linked account
  const { data: account, error } = await supabase
    .from('linked_travel_accounts')
    .upsert({
      user_id: userId,
      provider,
      access_token_encrypted: await encryptToken(tokens.access_token),
      refresh_token_encrypted: tokens.refresh_token ? await encryptToken(tokens.refresh_token) : null,
      token_expires_at: tokens.expires_at,
      provider_account_id: accountInfo.id,
      provider_email: accountInfo.email,
      provider_name: accountInfo.name,
      status: 'active',
      next_sync_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;

  // Trigger initial sync
  await syncLinkedAccount(account.id);

  return account as LinkedAccount;
}

/**
 * Sync linked account
 */
export async function syncLinkedAccount(accountId: string): Promise<{ imported: number }> {
  const { data: account } = await supabase
    .from('linked_travel_accounts')
    .select('*')
    .eq('id', accountId)
    .single();

  if (!account || account.status !== 'active') {
    return { imported: 0 };
  }

  try {
    // Decrypt access token
    const accessToken = await decryptToken(account.access_token_encrypted);

    // Fetch bookings from provider
    const bookings = await fetchProviderBookings(account.provider, accessToken);

    let imported = 0;

    for (const booking of bookings) {
      // Skip if already imported
      const { data: existing } = await supabase
        .from('trip_imports')
        .select('id')
        .eq('oauth_booking_id', booking.id)
        .single();

      if (existing) continue;

      // Create import record
      const { data: importRecord } = await supabase
        .from('trip_imports')
        .insert({
          user_id: account.user_id,
          import_method: `oauth_${account.provider}`,
          oauth_provider: account.provider,
          oauth_booking_id: booking.id,
          parsed_data: normalizeOAuthBooking(booking, account.provider),
          parse_status: 'parsed',
          overall_confidence: 0.95,
          processing_status: 'pending',
        })
        .select()
        .single();

      if (importRecord) {
        await processImport(importRecord.id);
        imported++;
      }
    }

    // Update sync status
    await supabase
      .from('linked_travel_accounts')
      .update({
        last_sync_at: new Date().toISOString(),
        last_sync_status: 'success',
        bookings_imported: account.bookings_imported + imported,
        next_sync_at: calculateNextSyncTime(account.sync_frequency),
      })
      .eq('id', accountId);

    return { imported };
  } catch (error: any) {
    await supabase
      .from('linked_travel_accounts')
      .update({
        last_sync_at: new Date().toISOString(),
        last_sync_status: 'error',
        last_sync_error: error.message,
      })
      .eq('id', accountId);

    throw error;
  }
}

/**
 * Disconnect linked account
 */
export async function disconnectLinkedAccount(userId: string, accountId: string): Promise<void> {
  await supabase
    .from('linked_travel_accounts')
    .update({
      status: 'revoked',
      access_token_encrypted: null,
      refresh_token_encrypted: null,
    })
    .eq('id', accountId)
    .eq('user_id', userId);
}

/**
 * Get user's linked accounts
 */
export async function getLinkedAccounts(userId: string): Promise<LinkedAccount[]> {
  const { data, error } = await supabase
    .from('linked_travel_accounts')
    .select('*')
    .eq('user_id', userId)
    .neq('status', 'revoked')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as LinkedAccount[];
}

// ============================================
// IMPORT PROCESSING
// ============================================

/**
 * Process an import (create trip/booking)
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

function buildOAuthUrl(provider: string, state: string): string {
  // Provider-specific OAuth URLs
  const configs: Record<string, { authUrl: string; clientId: string; scopes: string[] }> = {
    expedia: {
      authUrl: 'https://www.expedia.com/oauth/authorize',
      clientId: process.env.EXPEDIA_CLIENT_ID || '',
      scopes: ['bookings.read'],
    },
    booking: {
      authUrl: 'https://account.booking.com/oauth2/authorize',
      clientId: process.env.BOOKING_CLIENT_ID || '',
      scopes: ['bookings.read'],
    },
    google: {
      authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      scopes: ['https://www.googleapis.com/auth/gmail.readonly'],
    },
  };

  const config = configs[provider];
  if (!config) {
    throw new Error(`Unknown OAuth provider: ${provider}`);
  }

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: `${process.env.APP_URL}/api/import/oauth/callback`,
    response_type: 'code',
    scope: config.scopes.join(' '),
    state,
  });

  return `${config.authUrl}?${params.toString()}`;
}

async function exchangeOAuthCode(provider: string, code: string): Promise<{
  access_token: string;
  refresh_token?: string;
  expires_at?: string;
}> {
  // This would call the provider's token endpoint
  // Placeholder implementation
  return {
    access_token: 'mock_access_token',
    refresh_token: 'mock_refresh_token',
    expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
  };
}

async function getOAuthAccountInfo(provider: string, accessToken: string): Promise<{
  id: string;
  email?: string;
  name?: string;
}> {
  // This would call the provider's user info endpoint
  // Placeholder implementation
  return {
    id: 'mock_account_id',
    email: 'user@example.com',
    name: 'User Name',
  };
}

async function fetchProviderBookings(provider: string, accessToken: string): Promise<any[]> {
  // This would call the provider's bookings API
  // Placeholder implementation
  return [];
}

function normalizeOAuthBooking(booking: any, provider: string): ParsedImportData {
  // Normalize booking data from different providers
  return {
    category: booking.type || 'other',
    confidence: 0.95,
    extracted: booking,
    destination: booking.destination,
    dates: {
      start: booking.startDate,
      end: booking.endDate,
    },
  };
}

function calculateNextSyncTime(frequency: string): string {
  const now = new Date();
  switch (frequency) {
    case 'hourly':
      now.setHours(now.getHours() + 1);
      break;
    case 'daily':
      now.setDate(now.getDate() + 1);
      break;
    case 'weekly':
      now.setDate(now.getDate() + 7);
      break;
    default:
      now.setDate(now.getDate() + 1);
  }
  return now.toISOString();
}

async function encryptToken(token: string): Promise<string> {
  // In production, use proper encryption
  return Buffer.from(token).toString('base64');
}

async function decryptToken(encrypted: string): Promise<string> {
  // In production, use proper decryption
  return Buffer.from(encrypted, 'base64').toString('utf-8');
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
  initiateOAuthConnection,
  handleOAuthCallback,
  syncLinkedAccount,
  disconnectLinkedAccount,
  getLinkedAccounts,
  processImport,
  submitImportCorrections,
  getUserImports,
};
