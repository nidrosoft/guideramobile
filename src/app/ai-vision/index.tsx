/**
 * AI Vision Translator Route
 *
 * Standalone full-screen route for the AI Vision Translator feature.
 * Accessible from ScanBottomSheet → "AI Vision" action.
 */

import React from 'react';
import { useRouter } from 'expo-router';
import { TranslatorScreen } from '@/features/ar-navigation/plugins/ai-vision';

export default function AIVisionRoute() {
  const router = useRouter();

  const handleClose = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push('/(tabs)');
    }
  };

  return <TranslatorScreen onClose={handleClose} />;
}
