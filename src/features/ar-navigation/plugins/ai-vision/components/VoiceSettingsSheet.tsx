/**
 * VOICE SETTINGS SHEET
 *
 * Bottom sheet for selecting TTS voice preference.
 * Shows all available OpenAI gpt-4o-mini-tts voices with preview.
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
import { speak, stopSpeaking, getVoiceGender, setVoiceGender } from '../services/tts.service';
import AsyncStorage from '@react-native-async-storage/async-storage';

const VOICE_KEY = '@guidera_tts_voice_id';
const SPEED_KEY = '@guidera_tts_speed';

interface VoiceOption {
  id: string;
  name: string;
  description: string;
  gender: 'FEMALE' | 'MALE' | 'NEUTRAL';
  previewText: string;
}

const VOICES: VoiceOption[] = [
  { id: 'coral', name: 'Coral', description: 'Warm & friendly', gender: 'FEMALE', previewText: 'Hi there! I\'m Coral, your travel companion.' },
  { id: 'nova', name: 'Nova', description: 'Bright & energetic', gender: 'FEMALE', previewText: 'Hello! I\'m Nova — let me help you order!' },
  { id: 'sage', name: 'Sage', description: 'Calm & composed', gender: 'FEMALE', previewText: 'Good evening. I\'m Sage, ready to assist you.' },
  { id: 'shimmer', name: 'Shimmer', description: 'Soft & gentle', gender: 'FEMALE', previewText: 'Hi, I\'m Shimmer. Let me read that for you.' },
  { id: 'marin', name: 'Marin', description: 'Young & fresh', gender: 'FEMALE', previewText: 'Hey! I\'m Marin — let\'s explore this menu!' },
  { id: 'echo', name: 'Echo', description: 'Clear & articulate', gender: 'MALE', previewText: 'Hello, I\'m Echo. I\'ll help you place your order.' },
  { id: 'onyx', name: 'Onyx', description: 'Deep & confident', gender: 'MALE', previewText: 'Good evening. I\'m Onyx, at your service.' },
  { id: 'ash', name: 'Ash', description: 'Mature & steady', gender: 'MALE', previewText: 'Hi there. I\'m Ash — let\'s get you sorted.' },
  { id: 'fable', name: 'Fable', description: 'Expressive & warm', gender: 'MALE', previewText: 'Hello! I\'m Fable. What a lovely menu this is!' },
  { id: 'verse', name: 'Verse', description: 'Versatile & smooth', gender: 'MALE', previewText: 'Hey, I\'m Verse. Ready when you are.' },
  { id: 'cedar', name: 'Cedar', description: 'Warm & rich', gender: 'MALE', previewText: 'Good evening. I\'m Cedar — pleasure to help.' },
  { id: 'alloy', name: 'Alloy', description: 'Neutral & balanced', gender: 'NEUTRAL', previewText: 'Hi, I\'m Alloy. Let me translate for you.' },
  { id: 'ballad', name: 'Ballad', description: 'Expressive & dynamic', gender: 'NEUTRAL', previewText: 'Hello! I\'m Ballad — this looks delicious!' },
];

const SPEED_OPTIONS = [
  { value: 0.8, label: 'Slow' },
  { value: 1.0, label: 'Normal' },
  { value: 1.1, label: 'Natural' },
  { value: 1.25, label: 'Fast' },
];

interface VoiceSettingsSheetProps {
  visible: boolean;
  onClose: () => void;
}

export default function VoiceSettingsSheet({ visible, onClose }: VoiceSettingsSheetProps) {
  const insets = useSafeAreaInsets();
  const { colors: tc, isDark } = useTheme();
  const [selectedVoice, setSelectedVoice] = useState('coral');
  const [selectedSpeed, setSelectedSpeed] = useState(1.1);
  const [previewingId, setPreviewingId] = useState<string | null>(null);

  // Load saved preferences
  useEffect(() => {
    if (!visible) return;
    (async () => {
      try {
        const savedVoice = await AsyncStorage.getItem(VOICE_KEY);
        if (savedVoice) setSelectedVoice(savedVoice);
        const savedSpeed = await AsyncStorage.getItem(SPEED_KEY);
        if (savedSpeed) setSelectedSpeed(parseFloat(savedSpeed));
      } catch {}
    })();
  }, [visible]);

  const handleSelectVoice = useCallback(async (voiceId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedVoice(voiceId);
    const voice = VOICES.find(v => v.id === voiceId);
    if (voice) {
      await AsyncStorage.setItem(VOICE_KEY, voiceId);
      await setVoiceGender(voice.gender === 'MALE' ? 'MALE' : 'FEMALE');
    }
  }, []);

  const handlePreview = useCallback(async (voice: VoiceOption) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (previewingId === voice.id) {
      await stopSpeaking();
      setPreviewingId(null);
      return;
    }
    setPreviewingId(voice.id);
    try {
      await speak(voice.previewText, {
        language: 'en',
        rate: selectedSpeed,
        voiceGender: voice.gender === 'MALE' ? 'MALE' : 'FEMALE',
        onDone: () => setPreviewingId(null),
        onError: () => setPreviewingId(null),
      });
    } catch {
      setPreviewingId(null);
    }
  }, [previewingId, selectedSpeed]);

  const handleSpeedChange = useCallback(async (speed: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedSpeed(speed);
    await AsyncStorage.setItem(SPEED_KEY, String(speed));
  }, []);

  const handleClose = useCallback(() => {
    stopSpeaking();
    setPreviewingId(null);
    onClose();
  }, [onClose]);

  const femaleVoices = VOICES.filter(v => v.gender === 'FEMALE');
  const maleVoices = VOICES.filter(v => v.gender === 'MALE');
  const neutralVoices = VOICES.filter(v => v.gender === 'NEUTRAL');

  const renderVoiceCard = (voice: VoiceOption) => {
    const isSelected = selectedVoice === voice.id;
    const isPreviewing = previewingId === voice.id;

    return (
      <TouchableOpacity
        key={voice.id}
        style={[
          styles.voiceCard,
          { backgroundColor: tc.bgElevated, borderColor: isSelected ? tc.primary : tc.borderSubtle },
          isSelected && { borderWidth: 2 },
        ]}
        onPress={() => handleSelectVoice(voice.id)}
        activeOpacity={0.7}
      >
        <View style={styles.voiceInfo}>
          <View style={styles.voiceNameRow}>
            <Text style={[styles.voiceName, { color: tc.textPrimary }]}>{voice.name}</Text>
            {isSelected && <TickCircle size={18} color={tc.primary} variant="Bold" />}
          </View>
          <Text style={[styles.voiceDesc, { color: tc.textSecondary }]}>{voice.description}</Text>
        </View>

        <TouchableOpacity
          style={[styles.previewBtn, { backgroundColor: isPreviewing ? tc.primary : tc.primary + '15' }]}
          onPress={() => handlePreview(voice)}
          activeOpacity={0.7}
        >
          {isPreviewing ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <VolumeHigh size={18} color={isPreviewing ? '#FFFFFF' : tc.primary} variant="Bold" />
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
              <Text style={[styles.headerTitle, { color: tc.textPrimary }]}>Voice Settings</Text>
            </View>
            <TouchableOpacity onPress={handleClose} activeOpacity={0.7}>
              <CloseCircle size={28} color={tc.textSecondary} variant="Bold" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            {/* Speed Selection */}
            <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>Speaking Speed</Text>
            <View style={styles.speedRow}>
              {SPEED_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.speedChip,
                    { backgroundColor: tc.bgElevated, borderColor: selectedSpeed === opt.value ? tc.primary : tc.borderSubtle },
                    selectedSpeed === opt.value && { borderWidth: 2, backgroundColor: tc.primary + '15' },
                  ]}
                  onPress={() => handleSpeedChange(opt.value)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.speedLabel,
                    { color: selectedSpeed === opt.value ? tc.primary : tc.textSecondary },
                    selectedSpeed === opt.value && { fontWeight: '700' },
                  ]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Female Voices */}
            <Text style={[styles.sectionTitle, { color: tc.textPrimary, marginTop: 20 }]}>Female Voices</Text>
            {femaleVoices.map(renderVoiceCard)}

            {/* Male Voices */}
            <Text style={[styles.sectionTitle, { color: tc.textPrimary, marginTop: 16 }]}>Male Voices</Text>
            {maleVoices.map(renderVoiceCard)}

            {/* Neutral Voices */}
            <Text style={[styles.sectionTitle, { color: tc.textPrimary, marginTop: 16 }]}>Neutral Voices</Text>
            {neutralVoices.map(renderVoiceCard)}

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
    fontSize: 20,
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  speedRow: {
    flexDirection: 'row',
    gap: 8,
  },
  speedChip: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
  },
  speedLabel: {
    fontSize: 14,
    fontWeight: '500',
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
    fontSize: 16,
    fontWeight: '600',
  },
  voiceDesc: {
    fontSize: 13,
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
