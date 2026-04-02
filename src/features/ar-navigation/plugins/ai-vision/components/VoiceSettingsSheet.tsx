/**
 * VOICE SETTINGS SHEET
 *
 * Bottom sheet for selecting Gemini TTS voice.
 * Two tabs: Female and Male. User taps a voice to select, taps speaker icon to preview.
 * Persists selection to AsyncStorage.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { CloseCircle, VolumeHigh, TickCircle, Microphone2 } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import { typography } from '@/styles';
import { speak, stopSpeaking, getVoiceName, setVoiceName } from '../services/tts.service';
import { GEMINI_VOICES, DEFAULT_GEMINI_VOICE } from '../constants/translatorConfig';
import type { GeminiVoiceOption } from '../constants/translatorConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

type VoiceTab = 'female' | 'male';

interface VoiceSettingsSheetProps {
  visible: boolean;
  onClose: () => void;
}

export default function VoiceSettingsSheet({ visible, onClose }: VoiceSettingsSheetProps) {
  const insets = useSafeAreaInsets();
  const { colors: tc } = useTheme();
  const [selectedVoice, setSelectedVoice] = useState(DEFAULT_GEMINI_VOICE);
  const [activeTab, setActiveTab] = useState<VoiceTab>('female');
  const [previewingId, setPreviewingId] = useState<string | null>(null);

  const femaleVoices = GEMINI_VOICES.filter(v => v.category === 'feminine');
  const maleVoices = GEMINI_VOICES.filter(v => v.category === 'masculine');

  useEffect(() => {
    if (!visible) return;
    (async () => {
      try {
        const savedVoice = await getVoiceName();
        if (savedVoice) {
          setSelectedVoice(savedVoice);
          const isMale = maleVoices.some(v => v.name === savedVoice);
          setActiveTab(isMale ? 'male' : 'female');
        }
      } catch {}
    })();
  }, [visible]);

  const handleSelectVoice = useCallback(async (voiceName: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedVoice(voiceName);
    await setVoiceName(voiceName);
  }, []);

  const handlePreview = useCallback(async (voice: GeminiVoiceOption) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (previewingId === voice.name) {
      await stopSpeaking();
      setPreviewingId(null);
      return;
    }
    setPreviewingId(voice.name);
    try {
      await speak(voice.previewText, {
        language: 'en',
        voiceName: voice.name,
        onDone: () => setPreviewingId(null),
        onError: () => setPreviewingId(null),
      });
    } catch {
      setPreviewingId(null);
    }
  }, [previewingId]);

  const handleClose = useCallback(async () => {
    stopSpeaking();
    setPreviewingId(null);
    try {
      await AsyncStorage.setItem('@guidera_voice_setup_done', 'true');
    } catch {}
    onClose();
  }, [onClose]);

  const handleTabSwitch = useCallback((tab: VoiceTab) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(tab);
  }, []);

  const voices = activeTab === 'female' ? femaleVoices : maleVoices;

  const renderVoiceCard = (voice: GeminiVoiceOption) => {
    const isSelected = selectedVoice === voice.name;
    const isPreviewing = previewingId === voice.name;

    return (
      <TouchableOpacity
        key={voice.name}
        style={[
          styles.voiceCard,
          { backgroundColor: tc.bgElevated, borderColor: isSelected ? tc.primary : tc.borderSubtle },
          isSelected && { borderWidth: 2 },
        ]}
        onPress={() => handleSelectVoice(voice.name)}
        activeOpacity={0.7}
      >
        <View style={styles.voiceInfo}>
          <View style={styles.voiceNameRow}>
            <Text style={[styles.voiceName, { color: tc.textPrimary }]}>{voice.name}</Text>
            {isSelected && <TickCircle size={18} color={tc.primary} variant="Bold" />}
          </View>
          <Text style={[styles.voiceDesc, { color: tc.textSecondary }]}>{voice.trait}</Text>
        </View>

        <TouchableOpacity
          style={[styles.previewBtn, { backgroundColor: isPreviewing ? tc.primary : tc.primary + '15' }]}
          onPress={() => handlePreview(voice)}
          activeOpacity={0.7}
        >
          {isPreviewing ? (
            <ActivityIndicator size="small" color={tc.white} />
          ) : (
            <VolumeHigh size={18} color={isPreviewing ? tc.white : tc.primary} variant="Bold" />
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
        <View style={[styles.sheet, { backgroundColor: tc.bgPrimary || tc.background, paddingBottom: insets.bottom + 16 }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Microphone2 size={22} color={tc.primary} variant="Bold" />
              <Text style={[styles.headerTitle, { color: tc.textPrimary }]}>Choose a Voice</Text>
            </View>
            <TouchableOpacity onPress={handleClose} activeOpacity={0.7}>
              <CloseCircle size={28} color={tc.textSecondary} variant="Bold" />
            </TouchableOpacity>
          </View>

          {/* Tab Selector */}
          <View style={[styles.tabRow, { backgroundColor: tc.bgElevated }]}>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'female' && [styles.tabActive, { backgroundColor: tc.primary }],
              ]}
              onPress={() => handleTabSwitch('female')}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.tabText,
                { color: activeTab === 'female' ? '#FFFFFF' : tc.textSecondary },
              ]}>
                Female
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'male' && [styles.tabActive, { backgroundColor: tc.primary }],
              ]}
              onPress={() => handleTabSwitch('male')}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.tabText,
                { color: activeTab === 'male' ? '#FFFFFF' : tc.textSecondary },
              ]}>
                Male
              </Text>
            </TouchableOpacity>
          </View>

          {/* Powered by */}
          <View style={styles.poweredByRow}>
            <Text style={[styles.poweredByText, { color: tc.textSecondary }]}>
              Powered by Guidera Engine
            </Text>
          </View>

          {/* Voice List */}
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            {voices.map(renderVoiceCard)}
            <View style={{ height: 20 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '85%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: typography.fontSize.kpiValue,
    fontWeight: typography.fontWeight.bold,
  },
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    borderRadius: 14,
    padding: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
  },
  tabActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tabText: {
    fontSize: typography.fontSize.bodyLg,
    fontWeight: typography.fontWeight.semibold,
  },
  poweredByRow: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 8,
  },
  poweredByText: {
    fontSize: typography.fontSize.body,
    fontStyle: 'italic',
  },
  content: {
    paddingHorizontal: 20,
  },
  voiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  voiceInfo: {
    flex: 1,
  },
  voiceNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  voiceName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  voiceDesc: {
    fontSize: typography.fontSize.body,
    marginTop: 2,
  },
  previewBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
