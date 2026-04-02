/**
 * INTERPRETER MODE
 *
 * Real-time language interpreter using Gemini Live API.
 * Two people speak in their own languages — the AI translates in real-time.
 *
 * UI: Language pair selector → Start button → Live conversation view
 * with streaming translations and audio output.
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Translate,
  Microphone2,
  MicrophoneSlash,
  ArrowSwapHorizontal,
  VolumeHigh,
  CloseCircle,
  Pause,
  Play,
  MessageText,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/context/ThemeContext';
import { useInterpreter } from '../hooks/useInterpreter';
import { SUPPORTED_LANGUAGES, getLanguageName, getLanguageFlag } from '../constants/translatorConfig';

const { width: SCREEN_W } = Dimensions.get('window');

interface InterpreterModeProps {
  onClose?: () => void;
}

export default function InterpreterMode({ onClose }: InterpreterModeProps) {
  const insets = useSafeAreaInsets();
  const { isDark, colors: tc } = useTheme();
  const scrollRef = useRef<ScrollView>(null);

  // Language selection
  const [myLang, setMyLang] = useState('en');
  const [theirLang, setTheirLang] = useState('fr');
  const [showLangPicker, setShowLangPicker] = useState<'me' | 'them' | null>(null);
  const [isSessionActive, setIsSessionActive] = useState(false);

  // Pulse animation for recording indicator
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const {
    isConnected,
    isConnecting,
    isRecording,
    isSpeaking,
    streamingText,
    entries,
    error,
    connect,
    disconnect,
    toggleMic,
    interruptAI,
    clearEntries,
  } = useInterpreter();

  // Pulse animation
  useEffect(() => {
    if (isRecording && isConnected) {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.3, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ]),
      );
      anim.start();
      return () => anim.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording, isConnected]);

  // Auto-scroll on new entries
  useEffect(() => {
    if (entries.length > 0 || streamingText) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [entries, streamingText]);

  const handleStart = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setIsSessionActive(true);
    clearEntries();
    await connect(myLang, theirLang);
  };

  const handleStop = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    disconnect();
    setIsSessionActive(false);
  };

  const handleSwapLanguages = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setMyLang(theirLang);
    setTheirLang(myLang);
  };

  const handleSelectLang = (code: string) => {
    if (showLangPicker === 'me') {
      setMyLang(code);
    } else {
      setTheirLang(code);
    }
    setShowLangPicker(null);
  };

  // Theme colors
  const bg = isDark ? '#111' : tc.bgPrimary;
  const cardBg = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)';
  const cardBorder = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)';
  const textMain = tc.textPrimary;
  const textSub = tc.textSecondary;
  const textMuted = tc.textTertiary;

  // ─── Language Picker Modal ───────────────────────────────
  if (showLangPicker) {
    return (
      <View style={[styles.container, { backgroundColor: bg }]}>
        <View style={[styles.langPickerHeader, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={() => setShowLangPicker(null)} activeOpacity={0.7}>
            <CloseCircle size={28} color={textSub} variant="Bold" />
          </TouchableOpacity>
          <Text style={[styles.langPickerTitle, { color: textMain }]}>
            {showLangPicker === 'me' ? 'Your Language' : "Their Language"}
          </Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView style={styles.langList} contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}>
          {SUPPORTED_LANGUAGES.map(lang => {
            const isSelected = showLangPicker === 'me' ? lang.code === myLang : lang.code === theirLang;
            const isDisabled = showLangPicker === 'me' ? lang.code === theirLang : lang.code === myLang;
            return (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.langOption,
                  { backgroundColor: isSelected ? 'rgba(63,195,158,0.12)' : cardBg, borderColor: isSelected ? 'rgba(63,195,158,0.3)' : cardBorder },
                  isDisabled && { opacity: 0.3 },
                ]}
                onPress={() => !isDisabled && handleSelectLang(lang.code)}
                disabled={isDisabled}
                activeOpacity={0.7}
              >
                <Text style={styles.langFlag}>{lang.flag}</Text>
                <View style={styles.langInfo}>
                  <Text style={[styles.langName, { color: textMain }]}>{lang.name}</Text>
                  <Text style={[styles.langNative, { color: textMuted }]}>{lang.nativeName}</Text>
                </View>
                {isSelected && (
                  <View style={styles.langCheck}>
                    <Text style={{ color: '#3FC39E', fontSize: 16 }}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  }

  // ─── Main UI ──────────────────────────────────────────────
  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Translate size={24} color="#3FC39E" variant="Bold" />
        <Text style={[styles.headerTitle, { color: textMain }]}>Interpreter</Text>
        {isSessionActive && (
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        )}
      </View>

      {/* Language Pair Selector */}
      {!isSessionActive && (
        <View style={styles.langPairContainer}>
          <Text style={[styles.langPairLabel, { color: textMuted }]}>Select languages for your conversation</Text>

          <View style={styles.langPairRow}>
            {/* My Language */}
            <TouchableOpacity
              style={[styles.langCard, { backgroundColor: 'rgba(63,195,158,0.08)', borderColor: 'rgba(63,195,158,0.2)' }]}
              onPress={() => setShowLangPicker('me')}
              activeOpacity={0.7}
            >
              <Text style={styles.langCardLabel}>YOU</Text>
              <Text style={styles.langCardFlag}>
                {getLanguageFlag(myLang)}
              </Text>
              <Text style={[styles.langCardName, { color: textMain }]}>
                {getLanguageName(myLang)}
              </Text>
            </TouchableOpacity>

            {/* Swap Button */}
            <TouchableOpacity
              style={styles.swapBtn}
              onPress={handleSwapLanguages}
              activeOpacity={0.7}
            >
              <ArrowSwapHorizontal size={24} color="#3FC39E" variant="Bold" />
            </TouchableOpacity>

            {/* Their Language */}
            <TouchableOpacity
              style={[styles.langCard, { backgroundColor: 'rgba(168,85,247,0.08)', borderColor: 'rgba(168,85,247,0.2)' }]}
              onPress={() => setShowLangPicker('them')}
              activeOpacity={0.7}
            >
              <Text style={[styles.langCardLabel, { color: '#A855F7' }]}>THEM</Text>
              <Text style={styles.langCardFlag}>
                {getLanguageFlag(theirLang)}
              </Text>
              <Text style={[styles.langCardName, { color: textMain }]}>
                {getLanguageName(theirLang)}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Start Button */}
          <TouchableOpacity
            style={[styles.startBtn, isConnecting && { opacity: 0.6 }]}
            onPress={handleStart}
            disabled={isConnecting}
            activeOpacity={0.8}
          >
            {isConnecting ? (
              <>
                <ActivityIndicator color="#FFFFFF" size="small" />
                <Text style={styles.startBtnText}>Connecting...</Text>
              </>
            ) : (
              <>
                <Microphone2 size={24} color="#FFFFFF" variant="Bold" />
                <Text style={styles.startBtnText}>Start Interpreting</Text>
              </>
            )}
          </TouchableOpacity>

          {/* How it works */}
          <View style={[styles.howItWorks, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <Text style={[styles.howTitle, { color: textMain }]}>How it works</Text>
            <View style={styles.howStep}>
              <View style={styles.howIcon}>
                <Microphone2 size={18} color="#3FC39E" variant="Bold" />
              </View>
              <Text style={[styles.howText, { color: textSub }]}>Hold your phone between you and the other person</Text>
            </View>
            <View style={styles.howStep}>
              <View style={styles.howIcon}>
                <MessageText size={18} color="#3FC39E" variant="Bold" />
              </View>
              <Text style={[styles.howText, { color: textSub }]}>Speak naturally in your language — the AI detects who's speaking</Text>
            </View>
            <View style={styles.howStep}>
              <View style={styles.howIcon}>
                <VolumeHigh size={18} color="#3FC39E" variant="Bold" />
              </View>
              <Text style={[styles.howText, { color: textSub }]}>The AI translates and speaks the translation aloud instantly</Text>
            </View>
          </View>
        </View>
      )}

      {/* Active Session — Conversation View */}
      {isSessionActive && (
        <>
          {/* Language badges */}
          <View style={styles.activeLangRow}>
            <View style={[styles.activeLangBadge, { backgroundColor: 'rgba(63,195,158,0.1)' }]}>
              <Text style={{ fontSize: 14 }}>{getLanguageFlag(myLang)}</Text>
              <Text style={[styles.activeLangText, { color: '#3FC39E' }]}>{getLanguageName(myLang)}</Text>
            </View>
            <ArrowSwapHorizontal size={16} color={textMuted} variant="Bold" />
            <View style={[styles.activeLangBadge, { backgroundColor: 'rgba(168,85,247,0.1)' }]}>
              <Text style={{ fontSize: 14 }}>{getLanguageFlag(theirLang)}</Text>
              <Text style={[styles.activeLangText, { color: '#A855F7' }]}>{getLanguageName(theirLang)}</Text>
            </View>
          </View>

          {/* Conversation scroll */}
          <ScrollView
            ref={scrollRef}
            style={styles.conversationScroll}
            contentContainerStyle={[styles.conversationContent, { paddingBottom: insets.bottom + 140 }]}
            showsVerticalScrollIndicator={false}
          >
            {entries.length === 0 && !streamingText && (
              <View style={styles.waitingState}>
                <Animated.View style={[styles.waitingPulse, { transform: [{ scale: pulseAnim }] }]}>
                  <Microphone2 size={40} color="#3FC39E" variant="Bold" />
                </Animated.View>
                <Text style={[styles.waitingTitle, { color: textMain }]}>Listening...</Text>
                <Text style={[styles.waitingSubtext, { color: textMuted }]}>
                  Start speaking in {getLanguageName(myLang)} or {getLanguageName(theirLang)}
                </Text>
              </View>
            )}

            {entries.map((entry) => (
              <View key={entry.id} style={[styles.entryCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <View style={styles.entryHeader}>
                  <Translate size={16} color="#3FC39E" variant="Bold" />
                  <Text style={[styles.entryTime, { color: textMuted }]}>
                    {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                <Text style={[styles.entryText, { color: textMain }]}>{entry.originalText}</Text>
              </View>
            ))}

            {/* Streaming text */}
            {streamingText ? (
              <View style={[styles.entryCard, styles.streamingCard]}>
                <View style={styles.entryHeader}>
                  <VolumeHigh size={16} color="#A855F7" variant="Bold" />
                  <Text style={[styles.entryTime, { color: '#A855F7' }]}>translating...</Text>
                </View>
                <Text style={[styles.entryText, { color: textMain }]}>
                  {streamingText}
                  <Text style={styles.streamingCursor}>|</Text>
                </Text>
              </View>
            ) : null}
          </ScrollView>

          {/* Bottom controls */}
          <View style={[styles.controlsBar, { paddingBottom: insets.bottom + 70 }]}>
            {/* Mic mute/unmute */}
            <TouchableOpacity
              style={[styles.controlBtn, !isRecording && styles.controlBtnMuted]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); toggleMic(); }}
              activeOpacity={0.7}
            >
              {isRecording ? (
                <Microphone2 size={24} color="#FFFFFF" variant="Bold" />
              ) : (
                <MicrophoneSlash size={24} color="#FFFFFF" variant="Bold" />
              )}
            </TouchableOpacity>

            {/* Speaking indicator */}
            {isSpeaking && (
              <View style={styles.speakingIndicator}>
                <VolumeHigh size={18} color="#A855F7" variant="Bold" />
                <Text style={styles.speakingText}>Speaking translation...</Text>
              </View>
            )}

            {/* Stop session */}
            <TouchableOpacity
              style={styles.stopBtn}
              onPress={handleStop}
              activeOpacity={0.7}
            >
              <CloseCircle size={24} color="#FFFFFF" variant="Bold" />
              <Text style={styles.stopBtnText}>End</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Error */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 20, paddingRight: 52, paddingBottom: 12,
  },
  headerTitle: { fontSize: 22, fontWeight: '700', flex: 1 },
  liveIndicator: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(239,68,68,0.15)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12,
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444' },
  liveText: { fontSize: 11, fontWeight: '800', color: '#EF4444', letterSpacing: 1 },

  // Language Pair Selector
  langPairContainer: { paddingHorizontal: 20, paddingTop: 8 },
  langPairLabel: { fontSize: 14, textAlign: 'center', marginBottom: 20 },
  langPairRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 24,
  },
  langCard: {
    flex: 1, alignItems: 'center', gap: 8,
    paddingVertical: 20, borderRadius: 20, borderWidth: 1.5,
  },
  langCardLabel: { fontSize: 11, fontWeight: '800', color: '#3FC39E', letterSpacing: 1 },
  langCardFlag: { fontSize: 36 },
  langCardName: { fontSize: 15, fontWeight: '600' },
  swapBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(63,195,158,0.12)', justifyContent: 'center', alignItems: 'center',
  },

  // Start Button
  startBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#3FC39E', borderRadius: 20, paddingVertical: 18, marginBottom: 24,
    shadowColor: '#3FC39E', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 16,
    elevation: 8,
  },
  startBtnText: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },

  // How it works
  howItWorks: {
    borderRadius: 20, padding: 20, gap: 14, borderWidth: 1,
  },
  howTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  howStep: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  howIcon: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(63,195,158,0.1)', justifyContent: 'center', alignItems: 'center',
  },
  howText: { fontSize: 14, flex: 1, lineHeight: 20 },

  // Active session
  activeLangRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    paddingHorizontal: 20, paddingBottom: 12,
  },
  activeLangBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14,
  },
  activeLangText: { fontSize: 13, fontWeight: '600' },

  // Conversation
  conversationScroll: { flex: 1 },
  conversationContent: { paddingHorizontal: 16, paddingTop: 8 },
  waitingState: { alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 12 },
  waitingPulse: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(63,195,158,0.1)', justifyContent: 'center', alignItems: 'center',
  },
  waitingTitle: { fontSize: 20, fontWeight: '700' },
  waitingSubtext: { fontSize: 14, textAlign: 'center', paddingHorizontal: 32 },

  entryCard: {
    borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1,
  },
  streamingCard: {
    backgroundColor: 'rgba(168,85,247,0.06)', borderColor: 'rgba(168,85,247,0.15)',
  },
  entryHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6,
  },
  entryTime: { fontSize: 11, fontWeight: '600' },
  entryText: { fontSize: 16, lineHeight: 24, fontWeight: '500' },
  streamingCursor: { color: '#A855F7', fontWeight: '300' },

  // Controls
  controlsBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16,
    paddingHorizontal: 20, paddingTop: 12,
  },
  controlBtn: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#3FC39E', justifyContent: 'center', alignItems: 'center',
  },
  controlBtnMuted: {
    backgroundColor: '#EF4444',
  },
  speakingIndicator: {
    flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1,
    backgroundColor: 'rgba(168,85,247,0.1)', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16,
  },
  speakingText: { fontSize: 13, fontWeight: '600', color: '#A855F7' },
  stopBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(239,68,68,0.2)', paddingHorizontal: 18, paddingVertical: 14, borderRadius: 18,
  },
  stopBtnText: { fontSize: 15, fontWeight: '700', color: '#EF4444' },

  // Error
  errorBanner: {
    position: 'absolute', top: 100, left: 20, right: 20,
    backgroundColor: 'rgba(239,68,68,0.15)', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)',
  },
  errorText: { fontSize: 13, color: '#EF4444', textAlign: 'center' },

  // Language picker
  langPickerHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 16,
  },
  langPickerTitle: { fontSize: 18, fontWeight: '700' },
  langList: { flex: 1, paddingHorizontal: 16 },
  langOption: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 14, borderRadius: 14, marginBottom: 6, borderWidth: 1,
  },
  langFlag: { fontSize: 24 },
  langInfo: { flex: 1 },
  langName: { fontSize: 15, fontWeight: '600' },
  langNative: { fontSize: 12, marginTop: 2 },
  langCheck: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(63,195,158,0.15)', justifyContent: 'center', alignItems: 'center',
  },
});
