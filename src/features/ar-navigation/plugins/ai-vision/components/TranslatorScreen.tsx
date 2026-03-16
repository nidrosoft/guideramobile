/**
 * TRANSLATOR SCREEN
 *
 * Main container for the AI Vision Translator feature.
 * Manages mode switching between Live, Snapshot, Menu Scan, and Order Builder.
 * Handles language preference persistence and mode transitions.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CloseCircle } from 'iconsax-react-native';
import { TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Localization from 'expo-localization';

import ModeSelector from './ModeSelector';
import LiveCameraMode from './LiveCameraMode';
import SnapshotMode from './SnapshotMode';
import MenuScanMode from './MenuScanMode';
import OrderBuilder from './OrderBuilder';
import {
  loadLanguagePreference,
  saveLanguagePreference,
  loadCache,
} from '../services/translationCache';
import type { VisionMode, MenuItem } from '../types/aiVision.types';

interface TranslatorScreenProps {
  onClose: () => void;
  initialMode?: VisionMode;
}

export default function TranslatorScreen({ onClose, initialMode }: TranslatorScreenProps) {
  const insets = useSafeAreaInsets();
  const [activeMode, setActiveMode] = useState<VisionMode>(initialMode || 'live');
  const [userLanguage, setUserLanguage] = useState('en');

  // Order builder state (passed between menu scan → order builder)
  const [orderItems, setOrderItems] = useState<MenuItem[]>([]);
  const [menuBase64, setMenuBase64] = useState<string | undefined>();

  // Destination context (from active trip or default)
  const [localLanguage, setLocalLanguage] = useState('en');
  const [destinationCountry, setDestinationCountry] = useState('');

  // Initialize language from preference or device locale
  useEffect(() => {
    (async () => {
      await loadCache();

      const saved = await loadLanguagePreference();
      if (saved) {
        setUserLanguage(saved);
      } else {
        // Use device locale
        const deviceLocale = Localization.getLocales()?.[0]?.languageCode;
        if (deviceLocale) {
          setUserLanguage(deviceLocale);
        }
      }
    })();
  }, []);

  const handleLanguageChange = useCallback(async (lang: string) => {
    setUserLanguage(lang);
    await saveLanguagePreference(lang);
  }, []);

  const handleModeChange = useCallback((mode: VisionMode) => {
    setActiveMode(mode);
  }, []);

  // Bridge: Snapshot → Menu Scan (when menu detected)
  const handleSwitchToMenu = useCallback((base64: string) => {
    setMenuBase64(base64);
    setActiveMode('menu-scan');
  }, []);

  // Bridge: Menu Scan → Order Builder (with selected items)
  const handleBuildOrder = useCallback((items: MenuItem[]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setOrderItems(items);
    setActiveMode('order-builder');
  }, []);

  // Bridge: Order Builder → back to Menu Scan
  const handleBackFromOrder = useCallback(() => {
    setActiveMode('menu-scan');
  }, []);

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onClose();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Close button (top-right, shared across all modes) */}
      <TouchableOpacity
        style={[styles.closeButton, { top: insets.top + 8 }]}
        onPress={handleClose}
        activeOpacity={0.7}
      >
        <CloseCircle size={36} color="rgba(255,255,255,0.8)" variant="Bold" />
      </TouchableOpacity>

      {/* Active mode content */}
      {activeMode === 'live' && (
        <LiveCameraMode
          userLanguage={userLanguage}
          onLanguageChange={handleLanguageChange}
        />
      )}

      {activeMode === 'snapshot' && (
        <SnapshotMode
          userLanguage={userLanguage}
          onLanguageChange={handleLanguageChange}
          onSwitchToMenu={handleSwitchToMenu}
        />
      )}

      {activeMode === 'menu-scan' && (
        <MenuScanMode
          userLanguage={userLanguage}
          onLanguageChange={handleLanguageChange}
          onBuildOrder={handleBuildOrder}
          initialBase64={menuBase64}
        />
      )}

      {activeMode === 'order-builder' && (
        <OrderBuilder
          initialItems={orderItems}
          localLanguage={localLanguage || userLanguage}
          destinationCountry={destinationCountry || 'the local country'}
          onBack={handleBackFromOrder}
        />
      )}

      {/* Mode selector (bottom tabs, visible on all modes) */}
      <ModeSelector activeMode={activeMode} onModeChange={handleModeChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    zIndex: 999,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
