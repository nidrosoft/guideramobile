/**
 * TRANSLATOR SCREEN
 *
 * Main container for the AI Vision Translator feature.
 * Manages mode switching between Live, Snapshot, Menu Scan, and Order Builder.
 * Handles language preference persistence and mode transitions.
 *
 * The persistent close (X) button is rendered here at the container level
 * so it appears on ALL tabs (Live, Translate, Menu, Order, Interpret).
 * Design: light gray circle + red X icon, aligned with language pills.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, StatusBar, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Add } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import * as Localization from 'expo-localization';
import { useTheme } from '@/context/ThemeContext';

import ModeSelector from './ModeSelector';
import LiveCameraMode from './LiveCameraMode';
import SnapshotMode from './SnapshotMode';
import MenuScanMode from './MenuScanMode';
import OrderBuilder from './OrderBuilder';
import InterpreterMode from './InterpreterMode';
import VoiceSettingsSheet from './VoiceSettingsSheet';
import {
  loadLanguagePreference,
  saveLanguagePreference,
  loadCache,
} from '../services/translationCache';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { VisionMode, MenuItem } from '../types/aiVision.types';
import { GeminiLiveSession } from '../services/geminiLive.service';

const VOICE_SETUP_DONE_KEY = '@guidera_voice_setup_done';

interface TranslatorScreenProps {
  onClose: () => void;
  initialMode?: VisionMode;
}

export default function TranslatorScreen({ onClose, initialMode }: TranslatorScreenProps) {
  const insets = useSafeAreaInsets();
  const { isDark, colors: tc } = useTheme();
  const [activeMode, setActiveMode] = useState<VisionMode>(initialMode || 'live');
  const [userLanguage, setUserLanguage] = useState('en');

  // Order builder state (passed between menu scan → order builder)
  const [orderItems, setOrderItems] = useState<MenuItem[]>([]);
  const [menuBase64, setMenuBase64] = useState<string | undefined>();

  // Destination context (from active trip or default)
  const [localLanguage, setLocalLanguage] = useState('en');
  const [destinationCountry, setDestinationCountry] = useState('');
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);

  useEffect(() => {
    GeminiLiveSession.warmUp();
  }, []);

  useEffect(() => {
    (async () => {
      await loadCache();

      const saved = await loadLanguagePreference();
      if (saved) {
        setUserLanguage(saved);
      } else {
        const deviceLocale = Localization.getLocales()?.[0]?.languageCode;
        if (deviceLocale) {
          setUserLanguage(deviceLocale);
        }
      }

      try {
        const setupDone = await AsyncStorage.getItem(VOICE_SETUP_DONE_KEY);
        if (!setupDone) {
          setTimeout(() => setShowVoiceSettings(true), 1200);
        }
      } catch {}
    })();
  }, []);

  const handleLanguageChange = useCallback(async (lang: string) => {
    setUserLanguage(lang);
    await saveLanguagePreference(lang);
  }, []);

  const handleModeChange = useCallback((mode: VisionMode) => {
    setActiveMode(mode);
  }, []);

  const handleSwitchToMenu = useCallback((base64: string) => {
    setMenuBase64(base64);
    setActiveMode('menu-scan');
  }, []);

  const handleBuildOrder = useCallback((items: MenuItem[], detectedLang?: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setOrderItems(items);
    if (detectedLang) {
      setLocalLanguage(detectedLang);
    }
    setActiveMode('order-builder');
  }, []);

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

      {/* Active mode content */}
      {activeMode === 'live' && (
        <LiveCameraMode
          userLanguage={userLanguage}
          onLanguageChange={handleLanguageChange}
          onClose={handleClose}
          onVoiceSettings={() => setShowVoiceSettings(true)}
        />
      )}

      {activeMode === 'snapshot' && (
        <SnapshotMode
          userLanguage={userLanguage}
          onLanguageChange={handleLanguageChange}
          onSwitchToMenu={handleSwitchToMenu}
          onClose={handleClose}
        />
      )}

      {activeMode === 'menu-scan' && (
        <MenuScanMode
          userLanguage={userLanguage}
          onLanguageChange={handleLanguageChange}
          onBuildOrder={handleBuildOrder}
          initialBase64={menuBase64}
          onClose={handleClose}
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

      {activeMode === 'interpreter' && (
        <InterpreterMode
          onClose={handleClose}
        />
      )}

      {/* ═══ Persistent Close (X) — theme-aware ═══ */}
      <TouchableOpacity
        style={[
          styles.closeBtn,
          { top: insets.top + 8, backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : '#FFFFFF' },
        ]}
        onPress={handleClose}
        activeOpacity={0.7}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Add size={18} color={isDark ? '#FFFFFF' : '#000000'} style={{ transform: [{ rotate: '45deg' }] }} />
      </TouchableOpacity>

      {/* Mode selector (bottom tabs, visible on all modes) */}
      <ModeSelector
        activeMode={activeMode}
        onModeChange={handleModeChange}
        onVoiceSettings={() => setShowVoiceSettings(true)}
      />

      {/* Voice Settings Bottom Sheet */}
      <VoiceSettingsSheet
        visible={showVoiceSettings}
        onClose={() => setShowVoiceSettings(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  closeBtn: {
    position: 'absolute',
    right: 16,
    zIndex: 999,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    // shadow for light mode visibility
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
});
