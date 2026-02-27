/**
 * STRIPE PAYMENT SERVICE
 * 
 * Handles Stripe payment integration for flight bookings
 */

import { supabase } from '@/lib/supabase/client';

export interface PaymentIntentResponse {
  success: boolean;
  clientSecret?: string;
  paymentIntentId?: string;
  customerId?: string;
  error?: string;
}

export interface CreatePaymentIntentParams {
  amount: number; // in cents
  currency: string;
  userId: string;
  metadata?: {
    bookingToken?: string;
    flightOfferId?: string;
    travelers?: string;
  };
}

export const stripeService = {
  /**
   * Create a payment intent via Edge Function
   */
  async createPaymentIntent(params: CreatePaymentIntentParams): Promise<PaymentIntentResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          amount: params.amount,
          currency: params.currency,
          metadata: {
            userId: params.userId,
            ...params.metadata,
          },
        },
      });

      if (error) {
        console.error('Payment intent error:', error);
        return {
          success: false,
          error: error.message || 'Failed to create payment intent',
        };
      }

      return {
        success: true,
        clientSecret: data.clientSecret,
        paymentIntentId: data.paymentIntentId,
        customerId: data.customerId,
      };
    } catch (error) {
      console.error('Stripe service error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment failed',
      };
    }
  },

  /**
   * Convert price to cents for Stripe
   */
  toCents(amount: number): number {
    return Math.round(amount * 100);
  },

  /**
   * Format price for display
   */
  formatPrice(amountInCents: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amountInCents / 100);
  },
};
