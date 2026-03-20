/**
 * RECEIPT SCANNER SERVICE
 * 
 * Client-side service for the scan-receipt edge function.
 * Takes a photo, sends it to AI vision for expense extraction,
 * and bulk-inserts parsed items into the expense tracker.
 */

import { supabase } from '@/lib/supabase/client';
import { invokeWithRetry } from '@/utils/retry';
import { expenseService } from '@/services/expense.service';
import { Expense } from '@/features/trips/plugins/expenses/types/expense.types';

// ─── Types ──────────────────────────────────────

export interface ScannedExpenseItem {
  description: string;
  amount: number;
  currency: string;
  category: string;
  date: string;
  paymentMethod: string;
  notes?: string;
}

export interface ReceiptScanResult {
  success: boolean;
  error?: string;
  merchant?: string;
  date?: string;
  currency?: string;
  items: ScannedExpenseItem[];
  subtotal?: number;
  tax?: number;
  tip?: number;
  total?: number;
  paymentMethod?: string;
  confidence?: number;
  modelUsed?: string;
  itemCount?: number;
}

// ─── Service ──────────────────────────────────────

class ReceiptScannerService {
  /**
   * Scan a receipt image and extract expense items.
   * Returns the parsed result but does NOT insert into DB yet.
   */
  async scanReceipt(
    imageBase64: string,
    mediaType: string = 'image/jpeg',
    currency: string = 'USD',
  ): Promise<ReceiptScanResult> {
    const data = await invokeWithRetry(supabase, 'scan-receipt', { imageBase64, mediaType, currency }, 'slow');
    if (!data?.success) throw new Error(data?.error || 'Failed to scan receipt');

    return data as ReceiptScanResult;
  }

  /**
   * Scan a receipt AND immediately add all items to the expense tracker.
   * Returns the created expense records.
   */
  async scanAndAddExpenses(
    imageBase64: string,
    tripId: string,
    userId: string,
    options?: {
      mediaType?: string;
      currency?: string;
      receiptUrl?: string;
    },
  ): Promise<{ scanResult: ReceiptScanResult; expenses: Expense[] }> {
    const scanResult = await this.scanReceipt(
      imageBase64,
      options?.mediaType || 'image/jpeg',
      options?.currency || 'USD',
    );

    if (!scanResult.items || scanResult.items.length === 0) {
      return { scanResult, expenses: [] };
    }

    // Bulk insert all scanned items into expenses
    const expenses = await expenseService.addBulkExpenses(
      tripId,
      userId,
      scanResult.items.map(item => ({
        amount: item.amount,
        currency: item.currency,
        category: item.category,
        description: item.description,
        date: item.date || new Date().toISOString().split('T')[0],
        paymentMethod: item.paymentMethod || 'other',
        notes: item.notes,
        receiptUrl: options?.receiptUrl,
      })),
    );

    return { scanResult, expenses };
  }
}

export const receiptScannerService = new ReceiptScannerService();
export default receiptScannerService;
