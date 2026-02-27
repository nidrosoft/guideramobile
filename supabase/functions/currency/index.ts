/**
 * CURRENCY EXCHANGE EDGE FUNCTION
 * 
 * Integrates with CurrencyLayer API for real-time exchange rates.
 * Supports conversion, historical rates, and multi-currency queries.
 * 
 * Environment Variables Required:
 * - CURRENCYLAYER_API_KEY
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

// Types
interface CurrencyRequest {
  action: 'rates' | 'convert' | 'historical';
  baseCurrency?: string;
  targetCurrencies?: string[];
  amount?: number;
  fromCurrency?: string;
  toCurrency?: string;
  date?: string; // YYYY-MM-DD for historical
}

interface ExchangeRate {
  currency: string;
  rate: number;
  name: string;
  symbol: string;
}

interface ConversionResult {
  from: {
    currency: string;
    amount: number;
  };
  to: {
    currency: string;
    amount: number;
    rate: number;
  };
  timestamp: string;
}

// Currency metadata
const CURRENCY_INFO: Record<string, { name: string; symbol: string }> = {
  USD: { name: 'US Dollar', symbol: '$' },
  EUR: { name: 'Euro', symbol: '€' },
  GBP: { name: 'British Pound', symbol: '£' },
  JPY: { name: 'Japanese Yen', symbol: '¥' },
  AUD: { name: 'Australian Dollar', symbol: 'A$' },
  CAD: { name: 'Canadian Dollar', symbol: 'C$' },
  CHF: { name: 'Swiss Franc', symbol: 'CHF' },
  CNY: { name: 'Chinese Yuan', symbol: '¥' },
  INR: { name: 'Indian Rupee', symbol: '₹' },
  MXN: { name: 'Mexican Peso', symbol: '$' },
  SGD: { name: 'Singapore Dollar', symbol: 'S$' },
  HKD: { name: 'Hong Kong Dollar', symbol: 'HK$' },
  NOK: { name: 'Norwegian Krone', symbol: 'kr' },
  SEK: { name: 'Swedish Krona', symbol: 'kr' },
  DKK: { name: 'Danish Krone', symbol: 'kr' },
  NZD: { name: 'New Zealand Dollar', symbol: 'NZ$' },
  ZAR: { name: 'South African Rand', symbol: 'R' },
  BRL: { name: 'Brazilian Real', symbol: 'R$' },
  KRW: { name: 'South Korean Won', symbol: '₩' },
  THB: { name: 'Thai Baht', symbol: '฿' },
  MYR: { name: 'Malaysian Ringgit', symbol: 'RM' },
  PHP: { name: 'Philippine Peso', symbol: '₱' },
  IDR: { name: 'Indonesian Rupiah', symbol: 'Rp' },
  VND: { name: 'Vietnamese Dong', symbol: '₫' },
  AED: { name: 'UAE Dirham', symbol: 'د.إ' },
  SAR: { name: 'Saudi Riyal', symbol: '﷼' },
  TRY: { name: 'Turkish Lira', symbol: '₺' },
  PLN: { name: 'Polish Zloty', symbol: 'zł' },
  CZK: { name: 'Czech Koruna', symbol: 'Kč' },
  HUF: { name: 'Hungarian Forint', symbol: 'Ft' },
  ILS: { name: 'Israeli Shekel', symbol: '₪' },
  CLP: { name: 'Chilean Peso', symbol: '$' },
  COP: { name: 'Colombian Peso', symbol: '$' },
  PEN: { name: 'Peruvian Sol', symbol: 'S/' },
  ARS: { name: 'Argentine Peso', symbol: '$' },
  EGP: { name: 'Egyptian Pound', symbol: '£' },
  NGN: { name: 'Nigerian Naira', symbol: '₦' },
  KES: { name: 'Kenyan Shilling', symbol: 'KSh' },
  GHS: { name: 'Ghanaian Cedi', symbol: '₵' },
  MAD: { name: 'Moroccan Dirham', symbol: 'د.م.' },
  TWD: { name: 'Taiwan Dollar', symbol: 'NT$' },
};

function getCurrencyInfo(code: string): { name: string; symbol: string } {
  return CURRENCY_INFO[code] || { name: code, symbol: code };
}

// Get live exchange rates from CurrencyLayer
async function getLiveRates(
  apiKey: string,
  baseCurrency: string,
  targetCurrencies?: string[]
): Promise<Record<string, number>> {
  const params = new URLSearchParams({
    access_key: apiKey,
    source: baseCurrency,
  });

  if (targetCurrencies?.length) {
    params.append('currencies', targetCurrencies.join(','));
  }

  const response = await fetch(
    `https://api.currencylayer.com/live?${params}`,
    {
      headers: { 'Accept': 'application/json' },
    }
  );

  if (!response.ok) {
    throw new Error(`CurrencyLayer API error: ${response.status}`);
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error?.info || 'CurrencyLayer API error');
  }

  // CurrencyLayer returns rates as USDEUR, USDGBP, etc.
  // We need to extract just the target currency code
  const rates: Record<string, number> = {};
  const quotes = data.quotes || {};

  for (const [key, value] of Object.entries(quotes)) {
    const targetCurrency = key.substring(3); // Remove base currency prefix
    rates[targetCurrency] = value as number;
  }

  return rates;
}

// Get historical rates
async function getHistoricalRates(
  apiKey: string,
  baseCurrency: string,
  date: string,
  targetCurrencies?: string[]
): Promise<Record<string, number>> {
  const params = new URLSearchParams({
    access_key: apiKey,
    source: baseCurrency,
    date,
  });

  if (targetCurrencies?.length) {
    params.append('currencies', targetCurrencies.join(','));
  }

  const response = await fetch(
    `https://api.currencylayer.com/historical?${params}`,
    {
      headers: { 'Accept': 'application/json' },
    }
  );

  if (!response.ok) {
    throw new Error(`CurrencyLayer API error: ${response.status}`);
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error?.info || 'CurrencyLayer API error');
  }

  const rates: Record<string, number> = {};
  const quotes = data.quotes || {};

  for (const [key, value] of Object.entries(quotes)) {
    const targetCurrency = key.substring(3);
    rates[targetCurrency] = value as number;
  }

  return rates;
}

// Fallback rates (updated periodically - for demo/testing)
const FALLBACK_RATES: Record<string, number> = {
  EUR: 0.92,
  GBP: 0.79,
  JPY: 149.50,
  AUD: 1.53,
  CAD: 1.36,
  CHF: 0.88,
  CNY: 7.24,
  INR: 83.12,
  MXN: 17.15,
  SGD: 1.34,
  HKD: 7.82,
  KRW: 1320.50,
  THB: 35.20,
  MYR: 4.72,
  PHP: 55.80,
  IDR: 15650,
  VND: 24350,
  AED: 3.67,
  SAR: 3.75,
  TRY: 32.15,
  BRL: 4.97,
  ZAR: 18.65,
  NZD: 1.64,
};

function getFallbackRates(baseCurrency: string): Record<string, number> {
  if (baseCurrency === 'USD') {
    return { ...FALLBACK_RATES, USD: 1 };
  }

  // Convert from USD base to requested base
  const usdToBase = FALLBACK_RATES[baseCurrency] || 1;
  const rates: Record<string, number> = { USD: 1 / usdToBase };

  for (const [currency, usdRate] of Object.entries(FALLBACK_RATES)) {
    if (currency !== baseCurrency) {
      rates[currency] = usdRate / usdToBase;
    }
  }

  rates[baseCurrency] = 1;
  return rates;
}

// Main handler
serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const apiKey = Deno.env.get('CURRENCYLAYER_API_KEY');
    const request: CurrencyRequest = await req.json();

    const baseCurrency = request.baseCurrency || 'USD';
    let rates: Record<string, number>;
    let source = 'currencylayer';

    // Try to get rates from API, fall back to static rates
    if (apiKey) {
      try {
        if (request.action === 'historical' && request.date) {
          rates = await getHistoricalRates(
            apiKey,
            baseCurrency,
            request.date,
            request.targetCurrencies
          );
        } else {
          rates = await getLiveRates(
            apiKey,
            baseCurrency,
            request.targetCurrencies
          );
        }
      } catch (error) {
        console.warn('CurrencyLayer API failed, using fallback:', error);
        rates = getFallbackRates(baseCurrency);
        source = 'fallback';
      }
    } else {
      console.log('No CurrencyLayer API key, using fallback rates');
      rates = getFallbackRates(baseCurrency);
      source = 'fallback';
    }

    let response: unknown;

    switch (request.action) {
      case 'convert': {
        const fromCurrency = request.fromCurrency || 'USD';
        const toCurrency = request.toCurrency || 'EUR';
        const amount = request.amount || 1;

        // Get rate for conversion
        let rate: number;
        if (fromCurrency === baseCurrency) {
          rate = rates[toCurrency] || 1;
        } else if (toCurrency === baseCurrency) {
          rate = 1 / (rates[fromCurrency] || 1);
        } else {
          // Cross-rate calculation
          const fromRate = rates[fromCurrency] || 1;
          const toRate = rates[toCurrency] || 1;
          rate = toRate / fromRate;
        }

        const convertedAmount = amount * rate;

        response = {
          conversion: {
            from: {
              currency: fromCurrency,
              amount,
              ...getCurrencyInfo(fromCurrency),
            },
            to: {
              currency: toCurrency,
              amount: Math.round(convertedAmount * 100) / 100,
              rate: Math.round(rate * 10000) / 10000,
              ...getCurrencyInfo(toCurrency),
            },
            timestamp: new Date().toISOString(),
          },
        };
        break;
      }

      case 'historical':
      case 'rates':
      default: {
        const exchangeRates: ExchangeRate[] = Object.entries(rates)
          .filter(([currency]) => {
            if (!request.targetCurrencies?.length) return true;
            return request.targetCurrencies.includes(currency);
          })
          .map(([currency, rate]) => ({
            currency,
            rate: Math.round(rate * 10000) / 10000,
            ...getCurrencyInfo(currency),
          }))
          .sort((a, b) => a.currency.localeCompare(b.currency));

        response = {
          baseCurrency,
          rates: exchangeRates,
          timestamp: new Date().toISOString(),
          date: request.date || new Date().toISOString().split('T')[0],
        };
        break;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: response,
        meta: {
          source,
          requestDuration: Date.now() - startTime,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Currency function error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: 'CURRENCY_ERROR',
          message: (error as Error).message || 'Currency request failed',
        },
        meta: {
          requestDuration: Date.now() - startTime,
        },
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
