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

        setGeneratedOrder({
          spokenOrder: result.spokenOrder,
          englishTranslation: result.englishTranslation,
          localLanguage,
          timestamp: Date.now(),
        });
      } catch (e: any) {
        setError(e?.message || 'Failed to generate order. Please try again.');
        console.warn('[useOrderBuilder] Generate error:', e);
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
    try {
      await speak(generatedOrder.spokenOrder, {
        language: generatedOrder.localLanguage,
        rate: 0.85, // Slightly slower for clarity
        onDone: () => setIsPlaying(false),
        onError: () => {
          setIsPlaying(false);
          setError('Audio playback failed. Try again.');
        },
      });
    } catch {
      setIsPlaying(false);
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
