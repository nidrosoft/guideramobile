/**
 * USE CHECKOUT HOOK
 * 
 * React hook for managing the checkout flow.
 */

import { useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from './useCart';
import {
  CheckoutSession,
  CheckoutStatus,
  TravelerDetails,
  ContactInfo,
  BillingAddress,
  PriceVerificationResult,
  ValidationError,
  initializeCheckout,
  verifyPrices,
  acknowledgePriceChange,
  submitTravelerDetails,
  getCheckoutSession,
} from '@/services/checkout';
import {
  createPaymentIntent,
  confirmPaymentIntent,
  PaymentIntentResult,
} from '@/services/payment';
import { executeBookingFlow, BookingCoordinatorResult } from '@/services/booking';

type CheckoutStep = 'cart' | 'review' | 'travelers' | 'payment' | 'processing' | 'confirmation' | 'error';

interface UseCheckoutState {
  step: CheckoutStep;
  session: CheckoutSession | null;
  priceVerification: PriceVerificationResult | null;
  validationErrors: ValidationError[];
  paymentIntent: PaymentIntentResult | null;
  bookingResult: BookingCoordinatorResult | null;
  isLoading: boolean;
  error: string | null;
}

interface UseCheckoutActions {
  startCheckout: () => Promise<boolean>;
  verifyPricesStep: () => Promise<boolean>;
  acknowledgePriceChangeStep: (accept: boolean) => Promise<boolean>;
  submitTravelersStep: (travelers: TravelerDetails[], contact: ContactInfo, billing?: BillingAddress) => Promise<boolean>;
  createPaymentStep: (paymentMethodId?: string, saveCard?: boolean) => Promise<boolean>;
  confirmPaymentStep: (paymentMethodId: string) => Promise<boolean>;
  goToStep: (step: CheckoutStep) => void;
  reset: () => void;
}

export function useCheckout(): UseCheckoutState & UseCheckoutActions {
  const { user } = useAuth();
  const { cart, refresh: refreshCart } = useCart();

  const [step, setStep] = useState<CheckoutStep>('cart');
  const [session, setSession] = useState<CheckoutSession | null>(null);
  const [priceVerification, setPriceVerification] = useState<PriceVerificationResult | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [paymentIntent, setPaymentIntent] = useState<PaymentIntentResult | null>(null);
  const [bookingResult, setBookingResult] = useState<BookingCoordinatorResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate idempotency key
  const generateIdempotencyKey = useCallback(() => {
    return `checkout_${user?.id}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }, [user?.id]);

  // Start checkout
  const startCheckout = useCallback(async (): Promise<boolean> => {
    if (!cart || !user?.id) {
      setError('Cart or user not available');
      return false;
    }

    if (cart.items.length === 0) {
      setError('Cart is empty');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await initializeCheckout({
        cartId: cart.id,
        userId: user.id,
        idempotencyKey: generateIdempotencyKey(),
      });

      if (result.success && result.checkoutToken) {
        const checkoutSession = await getCheckoutSession(result.checkoutToken);
        setSession(checkoutSession);
        setStep('review');
        return true;
      } else {
        setError(result.error?.message || 'Failed to start checkout');
        return false;
      }
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [cart, user?.id, generateIdempotencyKey]);

  // Verify prices
  const verifyPricesStep = useCallback(async (): Promise<boolean> => {
    if (!session?.checkout_token) {
      setError('No checkout session');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await verifyPrices(session.checkout_token);
      setPriceVerification(result);

      if (result.hasUnavailableItems) {
        setError('Some items are no longer available');
        setStep('error');
        return false;
      }

      if (result.priceChanged) {
        // Stay on review step to show price change
        return true;
      }

      // Prices verified, move to travelers
      setStep('travelers');
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  // Acknowledge price change
  const acknowledgePriceChangeStep = useCallback(
    async (accept: boolean): Promise<boolean> => {
      if (!session?.checkout_token) {
        setError('No checkout session');
        return false;
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await acknowledgePriceChange({
          checkoutToken: session.checkout_token,
          acknowledged: true,
          acceptNewPrice: accept,
        });

        if (!accept) {
          // User rejected, go back to cart
          setStep('cart');
          await refreshCart();
          return false;
        }

        if (result.success) {
          setStep('travelers');
          return true;
        } else {
          setError('Failed to acknowledge price change');
          return false;
        }
      } catch (err: any) {
        setError(err.message);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [session, refreshCart]
  );

  // Submit traveler details
  const submitTravelersStep = useCallback(
    async (
      travelers: TravelerDetails[],
      contact: ContactInfo,
      billing?: BillingAddress
    ): Promise<boolean> => {
      if (!session?.checkout_token) {
        setError('No checkout session');
        return false;
      }

      setIsLoading(true);
      setError(null);
      setValidationErrors([]);

      try {
        const result = await submitTravelerDetails({
          checkoutToken: session.checkout_token,
          travelers,
          contact,
          billingAddress: billing,
        });

        if (result.success) {
          // Refresh session
          const updatedSession = await getCheckoutSession(session.checkout_token);
          setSession(updatedSession);
          setStep('payment');
          return true;
        } else {
          setValidationErrors(result.validationErrors || []);
          return false;
        }
      } catch (err: any) {
        setError(err.message);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [session]
  );

  // Create payment intent
  const createPaymentStep = useCallback(
    async (paymentMethodId?: string, saveCard?: boolean): Promise<boolean> => {
      if (!session?.checkout_token) {
        setError('No checkout session');
        return false;
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await createPaymentIntent(
          session.checkout_token,
          paymentMethodId,
          saveCard
        );

        setPaymentIntent(result);

        if (result.success) {
          // Refresh session
          const updatedSession = await getCheckoutSession(session.checkout_token);
          setSession(updatedSession);
          return true;
        } else {
          setError(result.error?.message || 'Failed to create payment');
          return false;
        }
      } catch (err: any) {
        setError(err.message);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [session]
  );

  // Confirm payment and complete booking
  const confirmPaymentStep = useCallback(
    async (paymentMethodId: string): Promise<boolean> => {
      if (!session?.checkout_token || !paymentIntent?.paymentIntentId) {
        setError('No payment intent');
        return false;
      }

      setIsLoading(true);
      setError(null);
      setStep('processing');

      try {
        // Confirm payment
        const confirmResult = await confirmPaymentIntent({
          paymentIntentId: paymentIntent.paymentIntentId,
          paymentMethodId,
        });

        if (!confirmResult.success) {
          setError(confirmResult.error?.message || 'Payment failed');
          setStep('payment');
          return false;
        }

        // Handle 3D Secure if required
        if (confirmResult.requiresAction && confirmResult.actionUrl) {
          // In a real app, this would open a WebView or redirect
          // For now, we'll just note that 3DS is required
          setError('3D Secure authentication required');
          return false;
        }

        // Execute booking flow
        const bookingRes = await executeBookingFlow(
          session.checkout_token,
          paymentIntent.paymentIntentId
        );

        setBookingResult(bookingRes);

        if (bookingRes.success) {
          setStep('confirmation');
          return true;
        } else {
          setError(bookingRes.error?.message || 'Booking failed');
          setStep('error');
          return false;
        }
      } catch (err: any) {
        setError(err.message);
        setStep('error');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [session, paymentIntent]
  );

  // Go to specific step
  const goToStep = useCallback((newStep: CheckoutStep) => {
    setStep(newStep);
    setError(null);
  }, []);

  // Reset checkout
  const reset = useCallback(() => {
    setStep('cart');
    setSession(null);
    setPriceVerification(null);
    setValidationErrors([]);
    setPaymentIntent(null);
    setBookingResult(null);
    setError(null);
    refreshCart();
  }, [refreshCart]);

  return {
    step,
    session,
    priceVerification,
    validationErrors,
    paymentIntent,
    bookingResult,
    isLoading,
    error,
    startCheckout,
    verifyPricesStep,
    acknowledgePriceChangeStep,
    submitTravelersStep,
    createPaymentStep,
    confirmPaymentStep,
    goToStep,
    reset,
  };
}
