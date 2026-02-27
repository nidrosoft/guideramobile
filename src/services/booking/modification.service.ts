/**
 * MODIFICATION SERVICE
 * 
 * Handles booking modifications: name changes, date changes, upgrades, etc.
 */

import { supabase } from '@/lib/supabase/client';
import {
  BookingWithItems,
  BookingItem,
  BookingModification,
} from './booking.types';
import { getBookingWithItems } from './booking-lifecycle.service';

// ============================================
// TYPES
// ============================================

export interface ModificationResult {
  success: boolean;
  modificationId?: string;
  requiresPayment?: boolean;
  fee?: number;
  amount?: number;
  refundAmount?: number;
  breakdown?: {
    priceDifference: number;
    changeFee: number;
  };
  message?: string;
  error?: string;
  suggestion?: string;
  alternatives?: any[];
}

export interface NameChangeRequest {
  bookingId: string;
  itemId: string;
  travelerIndex: number;
  originalName: { firstName: string; lastName: string };
  newName: { firstName: string; lastName: string };
  reason: string;
  supportingDocument?: string;
}

export interface DateChangeRequest {
  bookingId: string;
  itemId: string;
  originalDates: { start: string; end: string };
  newDates: { start: string; end: string };
  reason: string;
}

export interface UpgradeRequest {
  bookingId: string;
  itemId: string;
  upgradeType: string;
  upgradeDetails: any;
}

// ============================================
// NAME CHANGE
// ============================================

/**
 * Request a name change for a booking
 */
export async function requestNameChange(
  request: NameChangeRequest
): Promise<ModificationResult> {
  const { bookingId, itemId, travelerIndex, originalName, newName, reason } = request;

  const booking = await getBookingWithItems(bookingId);
  if (!booking) {
    return { success: false, error: 'Booking not found' };
  }

  const item = booking.items.find((i) => i.id === itemId);
  if (!item) {
    return { success: false, error: 'Booking item not found' };
  }

  // Check if booking is modifiable
  if (!booking.is_modifiable) {
    return {
      success: false,
      error: 'This booking cannot be modified',
      suggestion: 'You may need to cancel and rebook with the correct name',
    };
  }

  // Check modification deadline
  if (booking.modification_deadline && new Date(booking.modification_deadline) < new Date()) {
    return {
      success: false,
      error: 'Modification deadline has passed',
      suggestion: 'Contact support for assistance',
    };
  }

  // Get name change policy from provider
  const policy = await getModificationPolicy(item);
  if (!policy.nameChangeAllowed) {
    return {
      success: false,
      error: 'Name changes are not allowed for this booking',
      suggestion: 'You may need to cancel and rebook with the correct name',
    };
  }

  // Calculate fee
  const fee = policy.nameChangeFee || 0;

  // Create modification request
  const { data: modification, error } = await supabase
    .from('booking_modifications')
    .insert({
      booking_id: bookingId,
      booking_item_id: itemId,
      modification_type: 'name_change',
      status: 'pending',
      requested_by: 'user',
      request_details: {
        travelerIndex,
        originalName,
        newName,
        reason,
      },
      original_data: { name: originalName },
      modified_data: { name: newName },
      provider_code: item.provider_code,
      fee_amount: fee,
      total_cost: fee,
      payment_required: fee > 0,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  // If no fee, process immediately
  if (fee === 0) {
    return await processNameChange(modification.id);
  }

  return {
    success: true,
    modificationId: modification.id,
    requiresPayment: true,
    fee,
    message: `Name change requires a fee of ${formatCurrency(fee, booking.currency)}`,
  };
}

/**
 * Process name change with provider
 */
export async function processNameChange(modificationId: string): Promise<ModificationResult> {
  const { data: modification } = await supabase
    .from('booking_modifications')
    .select('*')
    .eq('id', modificationId)
    .single();

  if (!modification) {
    return { success: false, error: 'Modification not found' };
  }

  // Update status
  await supabase
    .from('booking_modifications')
    .update({ status: 'submitted', submitted_at: new Date().toISOString() })
    .eq('id', modificationId);

  try {
    // Submit to provider
    const { data, error } = await supabase.functions.invoke('provider-manager', {
      body: {
        action: 'submitNameChange',
        provider: modification.provider_code,
        params: {
          bookingId: modification.booking_item_id,
          ...modification.request_details,
        },
      },
    });

    if (error || !data?.success) {
      await supabase
        .from('booking_modifications')
        .update({
          status: 'rejected',
          provider_response: data || { error: error?.message },
        })
        .eq('id', modificationId);

      return {
        success: false,
        error: data?.error || error?.message || 'Name change was rejected by the provider',
      };
    }

    // Update modification
    await supabase
      .from('booking_modifications')
      .update({
        status: 'confirmed',
        provider_modification_id: data.modificationId,
        provider_response: data,
        completed_at: new Date().toISOString(),
      })
      .eq('id', modificationId);

    // Update booking travelers
    const booking = await getBookingWithItems(modification.booking_id);
    if (booking) {
      const travelers = [...(booking.travelers as any[])];
      const { travelerIndex, newName } = modification.request_details;
      if (travelers[travelerIndex]) {
        travelers[travelerIndex] = {
          ...travelers[travelerIndex],
          firstName: newName.firstName,
          lastName: newName.lastName,
        };
      }

      await supabase
        .from('bookings')
        .update({
          travelers,
          modification_count: (booking.modification_count || 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', modification.booking_id);
    }

    // Send confirmation
    await supabase.from('booking_communications').insert({
      booking_id: modification.booking_id,
      type: 'modification_confirmation',
      channel: 'email',
      template_id: 'modification_confirmation',
      template_data: {
        modificationType: 'name_change',
        details: modification.request_details,
      },
      status: 'pending',
    });

    return { success: true, message: 'Name change completed successfully' };
  } catch (err: any) {
    await supabase
      .from('booking_modifications')
      .update({
        status: 'failed',
        provider_response: { error: err.message },
      })
      .eq('id', modificationId);

    return { success: false, error: `Name change failed: ${err.message}` };
  }
}

// ============================================
// DATE CHANGE
// ============================================

/**
 * Request a date change for a booking
 */
export async function requestDateChange(
  request: DateChangeRequest
): Promise<ModificationResult> {
  const { bookingId, itemId, originalDates, newDates, reason } = request;

  const booking = await getBookingWithItems(bookingId);
  if (!booking) {
    return { success: false, error: 'Booking not found' };
  }

  const item = booking.items.find((i) => i.id === itemId);
  if (!item) {
    return { success: false, error: 'Booking item not found' };
  }

  // Check if booking is modifiable
  if (!booking.is_modifiable) {
    return {
      success: false,
      error: 'This booking cannot be modified',
      suggestion: 'You may need to cancel and make a new booking',
    };
  }

  // Get date change policy
  const policy = await getModificationPolicy(item);
  if (!policy.dateChangeAllowed) {
    return {
      success: false,
      error: 'Date changes are not allowed for this booking',
      suggestion: 'You may need to cancel and make a new booking',
    };
  }

  // Check availability for new dates
  const availability = await checkAvailabilityForChange(item, newDates);
  if (!availability.available) {
    return {
      success: false,
      error: 'Not available for selected dates',
      alternatives: availability.alternatives,
    };
  }

  // Calculate price difference
  const priceDifference = availability.newPrice - item.price_amount;
  const changeFee = policy.dateChangeFee || 0;
  const totalCost = Math.max(0, priceDifference) + changeFee;

  // Create modification request
  const { data: modification, error } = await supabase
    .from('booking_modifications')
    .insert({
      booking_id: bookingId,
      booking_item_id: itemId,
      modification_type: 'date_change',
      status: 'pending',
      requested_by: 'user',
      request_details: {
        originalDates,
        newDates,
        reason,
        newPrice: availability.newPrice,
      },
      original_data: { dates: originalDates, price: item.price_amount },
      modified_data: { dates: newDates, price: availability.newPrice },
      provider_code: item.provider_code,
      price_difference: priceDifference,
      fee_amount: changeFee,
      total_cost: totalCost,
      payment_required: totalCost > 0,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  // If price decreased and no fee, might have refund
  if (priceDifference < 0 && changeFee === 0) {
    return {
      success: true,
      modificationId: modification.id,
      refundAmount: Math.abs(priceDifference),
      message: `Date change will result in a refund of ${formatCurrency(Math.abs(priceDifference), booking.currency)}`,
    };
  }

  if (totalCost > 0) {
    return {
      success: true,
      modificationId: modification.id,
      requiresPayment: true,
      amount: totalCost,
      breakdown: {
        priceDifference: Math.max(0, priceDifference),
        changeFee,
      },
    };
  }

  // No cost - process immediately
  return await processDateChange(modification.id);
}

/**
 * Process date change with provider
 */
export async function processDateChange(modificationId: string): Promise<ModificationResult> {
  const { data: modification } = await supabase
    .from('booking_modifications')
    .select('*')
    .eq('id', modificationId)
    .single();

  if (!modification) {
    return { success: false, error: 'Modification not found' };
  }

  // Update status
  await supabase
    .from('booking_modifications')
    .update({ status: 'submitted', submitted_at: new Date().toISOString() })
    .eq('id', modificationId);

  try {
    // Submit to provider
    const { data, error } = await supabase.functions.invoke('provider-manager', {
      body: {
        action: 'submitDateChange',
        provider: modification.provider_code,
        params: {
          bookingId: modification.booking_item_id,
          newDates: modification.request_details.newDates,
        },
      },
    });

    if (error || !data?.success) {
      await supabase
        .from('booking_modifications')
        .update({
          status: 'rejected',
          provider_response: data || { error: error?.message },
        })
        .eq('id', modificationId);

      return {
        success: false,
        error: data?.error || error?.message || 'Date change was rejected by the provider',
      };
    }

    // Update modification
    await supabase
      .from('booking_modifications')
      .update({
        status: 'confirmed',
        provider_modification_id: data.modificationId,
        provider_response: data,
        completed_at: new Date().toISOString(),
      })
      .eq('id', modificationId);

    // Update booking item
    await supabase
      .from('booking_items')
      .update({
        start_datetime: modification.request_details.newDates.start,
        end_datetime: modification.request_details.newDates.end,
        price_amount: modification.request_details.newPrice || modification.modified_data.price,
        item_details: {
          ...modification.original_data,
          ...modification.modified_data,
        },
        status: 'modified',
        updated_at: new Date().toISOString(),
      })
      .eq('id', modification.booking_item_id);

    // Update booking dates if needed
    const booking = await getBookingWithItems(modification.booking_id);
    if (booking) {
      const allDates = booking.items.flatMap((i) => [i.start_datetime, i.end_datetime]).filter(Boolean);
      const startDate = allDates.length > 0 ? new Date(Math.min(...allDates.map((d) => new Date(d!).getTime()))) : null;
      const endDate = allDates.length > 0 ? new Date(Math.max(...allDates.map((d) => new Date(d!).getTime()))) : null;

      await supabase
        .from('bookings')
        .update({
          travel_start_date: startDate?.toISOString().split('T')[0],
          travel_end_date: endDate?.toISOString().split('T')[0],
          modification_count: (booking.modification_count || 0) + 1,
          status: 'modified',
          updated_at: new Date().toISOString(),
        })
        .eq('id', modification.booking_id);
    }

    // Send confirmation
    await supabase.from('booking_communications').insert({
      booking_id: modification.booking_id,
      type: 'modification_confirmation',
      channel: 'email',
      template_id: 'modification_confirmation',
      template_data: {
        modificationType: 'date_change',
        details: modification.request_details,
      },
      status: 'pending',
    });

    return { success: true, message: 'Date change completed successfully' };
  } catch (err: any) {
    await supabase
      .from('booking_modifications')
      .update({
        status: 'failed',
        provider_response: { error: err.message },
      })
      .eq('id', modificationId);

    return { success: false, error: `Date change failed: ${err.message}` };
  }
}

// ============================================
// UPGRADE REQUEST
// ============================================

/**
 * Request an upgrade for a booking item
 */
export async function requestUpgrade(request: UpgradeRequest): Promise<ModificationResult> {
  const { bookingId, itemId, upgradeType, upgradeDetails } = request;

  const booking = await getBookingWithItems(bookingId);
  if (!booking) {
    return { success: false, error: 'Booking not found' };
  }

  const item = booking.items.find((i) => i.id === itemId);
  if (!item) {
    return { success: false, error: 'Booking item not found' };
  }

  // Check upgrade availability and price
  const { data: upgradeInfo, error: upgradeError } = await supabase.functions.invoke('provider-manager', {
    body: {
      action: 'checkUpgradeAvailability',
      provider: item.provider_code,
      category: item.category,
      params: {
        bookingId: item.provider_booking_id,
        upgradeType,
        upgradeDetails,
      },
    },
  });

  if (upgradeError || !upgradeInfo?.available) {
    return {
      success: false,
      error: 'Upgrade not available',
      alternatives: upgradeInfo?.alternatives,
    };
  }

  const upgradeCost = upgradeInfo.price - item.price_amount;

  // Create modification request
  const { data: modification, error } = await supabase
    .from('booking_modifications')
    .insert({
      booking_id: bookingId,
      booking_item_id: itemId,
      modification_type: 'upgrade',
      status: 'pending',
      requested_by: 'user',
      request_details: {
        upgradeType,
        upgradeDetails,
        newPrice: upgradeInfo.price,
      },
      original_data: { price: item.price_amount, details: item.item_details },
      modified_data: { price: upgradeInfo.price, details: upgradeInfo.newDetails },
      provider_code: item.provider_code,
      price_difference: upgradeCost,
      total_cost: upgradeCost,
      payment_required: upgradeCost > 0,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    modificationId: modification.id,
    requiresPayment: upgradeCost > 0,
    amount: upgradeCost,
    message: `Upgrade available for ${formatCurrency(upgradeCost, booking.currency)}`,
  };
}

// ============================================
// CONFIRM MODIFICATION WITH PAYMENT
// ============================================

/**
 * Confirm a modification after payment
 */
export async function confirmModificationWithPayment(
  modificationId: string,
  paymentTransactionId: string
): Promise<ModificationResult> {
  const { data: modification } = await supabase
    .from('booking_modifications')
    .select('*')
    .eq('id', modificationId)
    .single();

  if (!modification) {
    return { success: false, error: 'Modification not found' };
  }

  // Update with payment info
  await supabase
    .from('booking_modifications')
    .update({ payment_transaction_id: paymentTransactionId })
    .eq('id', modificationId);

  // Process based on type
  switch (modification.modification_type) {
    case 'name_change':
      return await processNameChange(modificationId);
    case 'date_change':
      return await processDateChange(modificationId);
    case 'upgrade':
      return await processUpgrade(modificationId);
    default:
      return { success: false, error: 'Unknown modification type' };
  }
}

/**
 * Process upgrade with provider
 */
async function processUpgrade(modificationId: string): Promise<ModificationResult> {
  const { data: modification } = await supabase
    .from('booking_modifications')
    .select('*')
    .eq('id', modificationId)
    .single();

  if (!modification) {
    return { success: false, error: 'Modification not found' };
  }

  try {
    const { data, error } = await supabase.functions.invoke('provider-manager', {
      body: {
        action: 'processUpgrade',
        provider: modification.provider_code,
        params: {
          bookingId: modification.booking_item_id,
          ...modification.request_details,
        },
      },
    });

    if (error || !data?.success) {
      await supabase
        .from('booking_modifications')
        .update({ status: 'failed', provider_response: data || { error: error?.message } })
        .eq('id', modificationId);

      return { success: false, error: data?.error || 'Upgrade failed' };
    }

    await supabase
      .from('booking_modifications')
      .update({
        status: 'confirmed',
        provider_response: data,
        completed_at: new Date().toISOString(),
      })
      .eq('id', modificationId);

    // Update booking item
    await supabase
      .from('booking_items')
      .update({
        price_amount: modification.request_details.newPrice,
        item_details: modification.modified_data.details,
        status: 'modified',
        updated_at: new Date().toISOString(),
      })
      .eq('id', modification.booking_item_id);

    return { success: true, message: 'Upgrade completed successfully' };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ============================================
// GET MODIFICATION HISTORY
// ============================================

/**
 * Get modification history for a booking
 */
export async function getModificationHistory(bookingId: string): Promise<BookingModification[]> {
  const { data } = await supabase
    .from('booking_modifications')
    .select('*')
    .eq('booking_id', bookingId)
    .order('created_at', { ascending: false });

  return (data || []) as BookingModification[];
}

// ============================================
// HELPER FUNCTIONS
// ============================================

async function getModificationPolicy(item: BookingItem): Promise<{
  nameChangeAllowed: boolean;
  nameChangeFee: number;
  dateChangeAllowed: boolean;
  dateChangeFee: number;
}> {
  try {
    const { data } = await supabase.functions.invoke('provider-manager', {
      body: {
        action: 'getModificationPolicy',
        provider: item.provider_code,
        category: item.category,
        params: { bookingId: item.provider_booking_id },
      },
    });

    return {
      nameChangeAllowed: data?.nameChangeAllowed ?? false,
      nameChangeFee: data?.nameChangeFee ?? 0,
      dateChangeAllowed: data?.dateChangeAllowed ?? false,
      dateChangeFee: data?.dateChangeFee ?? 0,
    };
  } catch {
    // Default policy if provider check fails
    return {
      nameChangeAllowed: false,
      nameChangeFee: 0,
      dateChangeAllowed: false,
      dateChangeFee: 0,
    };
  }
}

async function checkAvailabilityForChange(
  item: BookingItem,
  newDates: { start: string; end: string }
): Promise<{ available: boolean; newPrice: number; alternatives?: any[] }> {
  try {
    const { data } = await supabase.functions.invoke('provider-manager', {
      body: {
        action: 'checkAvailabilityForChange',
        provider: item.provider_code,
        category: item.category,
        params: {
          bookingId: item.provider_booking_id,
          newDates,
        },
      },
    });

    return {
      available: data?.available ?? false,
      newPrice: data?.newPrice ?? item.price_amount,
      alternatives: data?.alternatives,
    };
  } catch {
    return { available: false, newPrice: item.price_amount };
  }
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
  }).format(amount);
}
