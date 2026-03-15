/**
 * EMAIL IMPORT SERVICE
 * 
 * Client-side service for the AI-powered email import feature.
 * Users forward booking confirmations to their unique import address,
 * Resend webhook triggers AI parsing, and this service checks/imports results.
 */

import { supabase } from '@/lib/supabase/client';

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
    const { data, error } = await supabase.functions.invoke('process-email-import', {
      body: { action: 'check-imports', userId },
    });

    if (error) throw new Error(error.message);
    return (data?.imports || []).map(mapImport);
  }

  /**
   * Import a parsed booking into a new trip.
   */
  async importBooking(userId: string, importId: string): Promise<{ tripId: string; title: string }> {
    const { data, error } = await supabase.functions.invoke('process-email-import', {
      body: { action: 'import-booking', userId, importId },
    });

    if (error) throw new Error(error.message);
    if (data?.error) throw new Error(data.error);
    return { tripId: data.tripId, title: data.title };
  }

  /**
   * Poll for new imports until one is found or timeout.
   */
  async waitForImport(
    userId: string,
    onProgress?: (imports: EmailImport[]) => void,
    maxWaitMs = 60000,
    pollIntervalMs = 3000,
  ): Promise<EmailImport | null> {
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitMs) {
      const imports = await this.checkImports(userId);

      if (onProgress) onProgress(imports);

      // Find the most recent parsed import
      const parsed = imports.find(i => i.status === 'parsed');
      if (parsed) return parsed;

      // Find processing one (still working)
      const processing = imports.find(i => i.status === 'processing' || i.status === 'pending');
      if (!processing && imports.length > 0) {
        // All done but none parsed — no booking found
        return imports[0];
      }

      await new Promise(r => setTimeout(r, pollIntervalMs));
    }

    return null;
  }
}

export const emailImportService = new EmailImportService();
export default emailImportService;
