/**
 * USE PRICING HOOK
 * 
 * Handles price calculations, formatting, and currency display.
 */

import { useMemo, useCallback } from 'react';
import { PriceBreakdown, PriceDisplay, PromoCode } from '../types/booking.types';
import { PRICING_CONFIG } from '../config/booking.config';

interface UsePricingOptions {
  currency?: string;
  locale?: string;
}

interface UsePricingReturn {
  // Formatting
  formatPrice: (amount: number, options?: FormatOptions) => string;
  formatPriceDisplay: (price: PriceDisplay) => string;
  
  // Calculations
  calculateTotal: (breakdown: Partial<PriceBreakdown>) => number;
  applyDiscount: (amount: number, promoCode: PromoCode) => number;
  calculateTaxes: (basePrice: number, taxRate?: number) => number;
  calculateServiceFee: (basePrice: number) => number;
  
  // Price breakdown
  createBreakdown: (params: BreakdownParams) => PriceBreakdown;
  
  // Comparisons
  calculateSavings: (originalPrice: number, currentPrice: number) => {
    amount: number;
    percentage: number;
    formatted: string;
  };
  
  // Per-unit calculations
  calculatePerPerson: (total: number, passengers: number) => number;
  calculatePerNight: (total: number, nights: number) => number;
  calculatePerDay: (total: number, days: number) => number;
}

interface FormatOptions {
  showCurrency?: boolean;
  showDecimals?: boolean;
  compact?: boolean;
}

interface BreakdownParams {
  basePrice: number;
  taxes?: number;
  fees?: number;
  extras?: number;
  discount?: number;
  currency?: string;
}

export function usePricing(options: UsePricingOptions = {}): UsePricingReturn {
  const { 
    currency = 'USD', 
    locale = 'en-US' 
  } = options;
  
  // Create number formatter
  const formatter = useMemo(() => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  }, [locale, currency]);
  
  // Compact formatter for large numbers
  const compactFormatter = useMemo(() => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      notation: 'compact',
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    });
  }, [locale, currency]);
  
  // Format price
  const formatPrice = useCallback((
    amount: number, 
    formatOptions: FormatOptions = {}
  ): string => {
    const { 
      showCurrency = true, 
      showDecimals = true,
      compact = false,
    } = formatOptions;
    
    // Round to nearest cent
    const rounded = Math.round(amount * 100) / 100;
    
    if (compact && amount >= 1000) {
      return compactFormatter.format(rounded);
    }
    
    if (!showCurrency) {
      return showDecimals 
        ? rounded.toFixed(2) 
        : Math.round(rounded).toString();
    }
    
    if (!showDecimals) {
      return formatter.format(Math.round(rounded));
    }
    
    return formatter.format(rounded);
  }, [formatter, compactFormatter]);
  
  // Format PriceDisplay object
  const formatPriceDisplay = useCallback((price: PriceDisplay): string => {
    if (price.formatted) return price.formatted;
    return formatPrice(price.amount);
  }, [formatPrice]);
  
  // Calculate total from breakdown
  const calculateTotal = useCallback((breakdown: Partial<PriceBreakdown>): number => {
    const {
      basePrice = 0,
      taxes = 0,
      fees = 0,
      extras = 0,
      discount = 0,
    } = breakdown;
    
    return basePrice + taxes + fees + extras - discount;
  }, []);
  
  // Apply promo code discount
  const applyDiscount = useCallback((amount: number, promoCode: PromoCode): number => {
    if (promoCode.discountType === 'percentage') {
      return amount * (promoCode.discount / 100);
    }
    return Math.min(promoCode.discount, amount); // Can't discount more than total
  }, []);
  
  // Calculate taxes
  const calculateTaxes = useCallback((basePrice: number, taxRate = 0.12): number => {
    return basePrice * taxRate;
  }, []);
  
  // Calculate service fee
  const calculateServiceFee = useCallback((basePrice: number): number => {
    return basePrice * PRICING_CONFIG.serviceFeePercentage;
  }, []);
  
  // Create full price breakdown
  const createBreakdown = useCallback((params: BreakdownParams): PriceBreakdown => {
    const {
      basePrice,
      taxes = calculateTaxes(basePrice),
      fees = 0,
      extras = 0,
      discount = 0,
      currency: breakdownCurrency = currency,
    } = params;
    
    const total = basePrice + taxes + fees + extras - discount;
    
    return {
      basePrice,
      taxes,
      fees,
      extras,
      discount,
      total,
      currency: breakdownCurrency,
    };
  }, [calculateTaxes, currency]);
  
  // Calculate savings
  const calculateSavings = useCallback((
    originalPrice: number, 
    currentPrice: number
  ) => {
    const amount = originalPrice - currentPrice;
    const percentage = originalPrice > 0 
      ? Math.round((amount / originalPrice) * 100) 
      : 0;
    
    return {
      amount,
      percentage,
      formatted: formatPrice(amount),
    };
  }, [formatPrice]);
  
  // Per-unit calculations
  const calculatePerPerson = useCallback((total: number, passengers: number): number => {
    return passengers > 0 ? total / passengers : total;
  }, []);
  
  const calculatePerNight = useCallback((total: number, nights: number): number => {
    return nights > 0 ? total / nights : total;
  }, []);
  
  const calculatePerDay = useCallback((total: number, days: number): number => {
    return days > 0 ? total / days : total;
  }, []);
  
  return {
    formatPrice,
    formatPriceDisplay,
    calculateTotal,
    applyDiscount,
    calculateTaxes,
    calculateServiceFee,
    createBreakdown,
    calculateSavings,
    calculatePerPerson,
    calculatePerNight,
    calculatePerDay,
  };
}
