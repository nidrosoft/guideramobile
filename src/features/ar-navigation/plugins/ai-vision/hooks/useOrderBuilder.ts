/**
 * USE ORDER BUILDER HOOK
 *
 * Manages the order compilation flow:
 * 1. User selects menu items with quantities
 * 2. Gemini generates a natural spoken order in the local language
 * 3. Gemini TTS reads it aloud for the waiter
 *
 * Tracks isLoadingAudio separately so the UI can show a buffering state
 * while the TTS call is in-flight (before audio actually starts playing).
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
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
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

    // Show loading state immediately (TTS network call takes time)
    setIsLoadingAudio(true);
    setError(null);

    try {
      await speak(generatedOrder.spokenOrder, {
        language: generatedOrder.localLanguage,
        rate: 1.1, // Natural conversational pace
        onStart: () => {
          // Audio actually started playing — switch from loading to playing
          setIsLoadingAudio(false);
          setIsPlaying(true);
        },
        onDone: () => {
          setIsPlaying(false);
          setIsLoadingAudio(false);
        },
        onError: (err) => {
          if (__DEV__) console.warn('[OrderBuilder] TTS error:', err);
          setIsPlaying(false);
          setIsLoadingAudio(false);
          setError('Audio playback failed. Turn off silent mode and make sure volume is up.');
        },
      });

      // If speak resolves without onStart (some edge cases), clear loading
      if (isLoadingAudio) {
        setIsLoadingAudio(false);
        setIsPlaying(true);
      }
    } catch (err) {
      if (__DEV__) console.warn('[OrderBuilder] TTS catch:', err);
      setIsPlaying(false);
      setIsLoadingAudio(false);
      setError('Could not play audio. Turn off silent mode (side switch) and increase volume.');
    }
  }, [generatedOrder]);

  const stopOrder = useCallback(async () => {
    await stopSpeaking();
    setIsPlaying(false);
    setIsLoadingAudio(false);
  }, []);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);

  return {
    items,
    generatedOrder,
    isGenerating,
    isPlaying,
    isLoadingAudio,
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
