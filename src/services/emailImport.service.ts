/**
 * EMAIL IMPORT SERVICE
 * 
 * Client-side service for the AI-powered email import feature.
 * Users forward booking confirmations to their unique import address,
 * Resend webhook triggers AI parsing, and this service checks/imports results.
 */

import { supabase } from '@/lib/supabase/client';
import { invokeEdgeFn } from '@/utils/retry';

export interface EmailImport {
  id: string;
  userId: string;
  fromEmail: string;
  subject: string;
  status: 'pending' | 'processing' | 'parsed' | 'imported' | 'failed' | 'no_booking';
  parsedBooking: any;
  tripId: string | null;
  error: string | null;
  modelUsed: string | null;
  confidence: number | null;
  createdAt: string;
  processedAt: string | null;
  importedAt: string | null;
}

function mapImport(row: any): EmailImport {
  return {
    id: row.id,
    userId: row.user_id,
    fromEmail: row.from_email,
    subject: row.subject,
    status: row.status,
    parsedBooking: row.parsed_booking,
    tripId: row.trip_id,
    error: row.error,
    modelUsed: row.model_used,
    confidence: row.confidence ? parseFloat(row.confidence) : null,
    createdAt: row.created_at,
    processedAt: row.processed_at,
    importedAt: row.imported_at,
  };
}

class EmailImportService {
  /**
   * Generate the unique import email address for a user.
   * Format: import+{userId}@guidera.one
   */
  getImportAddress(userId: string): string {
    return `import+${userId}@guidera.one`;
  }

  /**
   * Check for pending/parsed email imports for the current user.
   * The app polls this after the user forwards an email.
   */
  async checkImports(userId: string): Promise<EmailImport[]> {
    const { data, error } = await invokeEdgeFn(supabase, 'process-email-import', { action: 'check-imports', userId }, 'slow');

    if (error) throw new Error(error.message);
    return (data?.imports || []).map(mapImport);
  }

  /**
   * Import a parsed booking into a new trip.
   */
  async importBooking(userId: string, importId: string): Promise<{ tripId: string; title: string }> {
    const { data, error } = await invokeEdgeFn(supabase, 'process-email-import', { action: 'import-booking', userId, importId }, 'slow');

    if (error) throw new Error(error.message);
    if (data?.error) throw new Error(data.error);
    return { tripId: data.tripId, title: data.title };
  }

  /**
   * Poll for a forwarded import until one is found or timeout.
   *
   * Uses a recency window rather than a snapshot of pre-existing IDs: the user
   * often forwards the email BEFORE opening this screen, so by the time we poll
   * the booking may already be parsed. We accept any not-yet-imported import
   * created within `freshnessMs`, which handles that case while still ignoring
   * stale bookings left over from previous sessions.
   */
  async waitForImport(
    userId: string,
    onProgress?: (imports: EmailImport[]) => void,
    maxWaitMs = 120000,
    pollIntervalMs = 4000,
    freshnessMs = 30 * 60 * 1000,
  ): Promise<EmailImport | null> {
    const startTime = Date.now();
    const cutoff = startTime - freshnessMs;

    while (Date.now() - startTime < maxWaitMs) {
      const all = await this.checkImports(userId);

      // Only react to recent, not-yet-imported emails.
      const fresh = all.filter(i => {
        if (i.status === 'imported') return false;
        const t = i.createdAt ? new Date(i.createdAt).getTime() : NaN;
        return Number.isNaN(t) ? true : t >= cutoff;
      });

      if (onProgress) onProgress(fresh);

      // A booking was parsed — done.
      const parsed = fresh.find(i => i.status === 'parsed' && i.parsedBooking);
      if (parsed) return parsed;

      // An email arrived but had no booking — surface that result.
      const noBooking = fresh.find(i => i.status === 'no_booking');
      if (noBooking) return noBooking;

      // Otherwise keep waiting (pending/processing, or nothing yet).
      await new Promise(r => setTimeout(r, pollIntervalMs));
    }

    return null;
  }
}

export const emailImportService = new EmailImportService();
export default emailImportService;
