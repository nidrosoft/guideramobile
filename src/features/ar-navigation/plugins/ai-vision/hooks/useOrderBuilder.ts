/**
 * USE ORDER BUILDER HOOK
 *
 * Manages the order compilation flow:
 * 1. User selects menu items with quantities
 * 2. Gemini generates a natural spoken order in the local language
 * 3. expo-speech reads it aloud for the waiter
 */

import { useState, useCallback, useRef } from 'react';
import { generateOrder } from '../services/gemini.service';
import { speak, stopSpeaking, isSpeaking } from '../services/tts.service';
import type { OrderItem, GeneratedOrder, OrderBuilderState } from '../types/aiVision.types';

// Map common destination countries to their primary language code for TTS
const COUNTRY_TO_LANG: Record<string, string> = {
  france: 'fr', spain: 'es', italy: 'it', germany: 'de', portugal: 'pt',
  brazil: 'pt', japan: 'ja', korea: 'ko', china: 'zh', thailand: 'th',
  vietnam: 'vi', turkey: 'tr', russia: 'ru', india: 'hi', indonesia: 'id',
  malaysia: 'ms', netherlands: 'nl', poland: 'pl', sweden: 'sv',
  greece: 'el', israel: 'he', ukraine: 'uk', 'czech republic': 'cs',
  mexico: 'es', colombia: 'es', argentina: 'es', peru: 'es', chile: 'es',
  morocco: 'ar', egypt: 'ar', 'saudi arabia': 'ar', uae: 'ar',
  cameroon: 'fr', senegal: 'fr', 'ivory coast': 'fr', belgium: 'fr',
  switzerland: 'de', austria: 'de', canada: 'en', australia: 'en',
  usa: 'en', uk: 'en', ireland: 'en', 'new zealand': 'en',
};

interface UseOrderBuilderReturn extends OrderBuilderState {
  addItem: (item: OrderItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearItems: () => void;
  generate: (localLanguage: string, destinationCountry: string) => Promise<void>;
  playOrder: () => Promise<void>;
  stopOrder: () => Promise<void>;
  totalItems: number;
}

export function useOrderBuilder(): UseOrderBuilderReturn {
  const [items, setItems] = useState<OrderItem[]>([]);
  const [generatedOrder, setGeneratedOrder] = useState<GeneratedOrder | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addItem = useCallback((item: OrderItem) => {
    setItems(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    // Invalidate previously generated order
    setGeneratedOrder(null);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
    setGeneratedOrder(null);
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity <= 0) {
      setItems(prev => prev.filter(i => i.id !== id));
    } else {
      setItems(prev =>
        prev.map(i => (i.id === id ? { ...i, quantity } : i)),
      );
    }
    setGeneratedOrder(null);
  }, []);

  const clearItems = useCallback(() => {
    setItems([]);
    setGeneratedOrder(null);
    setError(null);
  }, []);

  const generate = useCallback(
    async (localLanguage: string, destinationCountry: string) => {
      if (items.length === 0) {
        setError('No items selected. Add items to your order first.');
        return;
      }

      setIsGenerating(true);
      setError(null);

      try {
        const result = await generateOrder(
          items.map(i => ({
            nameOriginal: i.nameOriginal,
            nameTranslated: i.nameTranslated,
            quantity: i.quantity,
            price: i.price,
          })),
          localLanguage,
          destinationCountry,
        );

        // Determine the TTS language: use AI-returned code, or infer from destination country
        const spokenLang = result.spokenLanguageCode
          || COUNTRY_TO_LANG[destinationCountry.toLowerCase()]
          || localLanguage;

        setGeneratedOrder({
          spokenOrder: result.spokenOrder,
          englishTranslation: result.englishTranslation,
          localLanguage: spokenLang,
          timestamp: Date.now(),
        });
      } catch (e: any) {
        setError(e?.message || 'Failed to generate order. Please try again.');
        if (__DEV__) console.warn('[useOrderBuilder] Generate error:', e);
      } finally {
        setIsGenerating(false);
      }
    },
    [items],
  );

  const playOrder = useCallback(async () => {
    if (!generatedOrder?.spokenOrder) {
      setError('No order generated yet.');
      return;
    }

    setIsPlaying(true);
    setError(null);

    try {
      // Use a timeout to detect if speech never starts (silent mode / audio issue)
      let speechStarted = false;
      const silentModeTimeout = setTimeout(() => {
        if (!speechStarted) {
          setError('No audio? Turn off silent mode (flip the switch on the side of your phone) and try again.');
        }
      }, 2000);

      await speak(generatedOrder.spokenOrder, {
        language: generatedOrder.localLanguage,
        rate: 1.1, // Natural conversational pace
        onDone: () => {
          speechStarted = true;
          clearTimeout(silentModeTimeout);
          setIsPlaying(false);
        },
        onError: (err) => {
          clearTimeout(silentModeTimeout);
          if (__DEV__) console.warn('[OrderBuilder] TTS error:', err);
          setIsPlaying(false);
          setError('Audio playback failed. Turn off silent mode and make sure volume is up.');
        },
      });

      // If speak resolves without calling onDone (some edge cases), mark started
      speechStarted = true;
      clearTimeout(silentModeTimeout);
    } catch (err) {
      if (__DEV__) console.warn('[OrderBuilder] TTS catch:', err);
      setIsPlaying(false);
      setError('Could not play audio. Turn off silent mode (side switch) and increase volume.');
    }
  }, [generatedOrder]);

  const stopOrder = useCallback(async () => {
    await stopSpeaking();
    setIsPlaying(false);
  }, []);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);

  return {
    items,
    generatedOrder,
    isGenerating,
    isPlaying,
    error,
    addItem,
    removeItem,
    updateQuantity,
    clearItems,
    generate,
    playOrder,
    stopOrder,
    totalItems,
  };
}
