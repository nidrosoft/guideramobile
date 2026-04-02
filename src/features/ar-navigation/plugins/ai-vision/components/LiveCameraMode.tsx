/**
 * LIVE CAMERA MODE
 *
 * Real-time AI travel companion powered by the Gemini Live API.
 * Uses a persistent WebSocket connection for bidirectional voice + vision.
 *
 * Dark ambient screen by default — camera only activates when user taps the camera icon.
 * Audio streams continuously via WebSocket (raw PCM) — no separate STT/TTS services needed.
 * Gemini has built-in Voice Activity Detection (VAD) for natural turn-taking.
 * When camera is active, JPEG frames are streamed at ~1fps over the same WebSocket.
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView } from 'expo-camera';
import {
  Microphone2,
  MicrophoneSlash,
  Video,
  CloseCircle,
  Send2,
  Eye,
  EyeSlash,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import LanguagePicker from './LanguagePicker';
import { useGeminiLive } from '../hooks/useGeminiLive';

interface LiveCameraModeProps {
  userLanguage: string;
  onLanguageChange: (lang: string) => void;
  onClose?: () => void;
  onVoiceSettings?: () => void;
}

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// Camera frame streaming interval (ms) — max 1fps per Google's spec
const FRAME_STREAM_INTERVAL_MS = 1000;

export default function LiveCameraMode({
  userLanguage,
  onLanguageChange,
  onClose,
}: LiveCameraModeProps) {
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<any>(null);
  const scrollRef = useRef<ScrollView>(null);
  const frameTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isCameraOnRef = useRef(false);

  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);

  const {
    isConnected,
    isConnecting,
    isRecording,
    isSpeaking,
    streamingText,
    conversations,
    error,
    connect,
    disconnect,
    toggleMic,
    interruptAI,
    sendVideoFrame,
    sendText,
    clearConversations,
  } = useGeminiLive();

  useEffect(() => { isCameraOnRef.current = isCameraOn; }, [isCameraOn]);

  // Auto-scroll when conversations or streaming text updates
  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [conversations, streamingText]);

  // ─── Session Lifecycle ─────────────────────────────────────

  useEffect(() => {
    // Connect to Gemini Live on mount
    connect(userLanguage);

    return () => {
      // Clean up on unmount
      stopFrameStreaming();
      disconnect();
    };
  }, []);

  // Hook now handles initial greeting + mic start internally

  // ─── Camera Frame Streaming ────────────────────────────────

  const startFrameStreaming = useCallback(() => {
    if (frameTimerRef.current) return;

    frameTimerRef.current = setInterval(async () => {
      if (!isCameraOnRef.current || !cameraRef.current) return;

      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.15,
          base64: true,
          skipProcessing: true,
          shutterSound: false,
          imageType: 'jpg',
        });

        if (photo?.base64) {
          sendVideoFrame(photo.base64);
        }

        // Clean up temp file immediately
        if (photo?.uri) {
          const ExpoFileSystem = require('expo-file-system');
          ExpoFileSystem.deleteAsync(photo.uri, { idempotent: true }).catch(() => {});
        }
      } catch (err) {
        if (__DEV__) console.warn('[LiveMode] Frame capture error:', err);
      }
    }, FRAME_STREAM_INTERVAL_MS);
  }, [sendVideoFrame]);

  const stopFrameStreaming = useCallback(() => {
    if (frameTimerRef.current) {
      clearInterval(frameTimerRef.current);
      frameTimerRef.current = null;
    }
  }, []);

  // ─── Camera Controls ────────────────────────────────────────

  const handleCameraReady = useCallback(() => {
    if (isCameraOnRef.current && isConnected) {
      startFrameStreaming();
    }
  }, [isConnected, startFrameStreaming]);

  const toggleCamera = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const nextState = !isCameraOn;
    setIsCameraOn(nextState);

    if (!nextState) {
      stopFrameStreaming();
    }
    // Frame streaming starts in handleCameraReady when camera mounts
  }, [isCameraOn, stopFrameStreaming]);

  // ─── Mute Toggle ────────────────────────────────────────────

  const toggleMute = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const newMuted = !isMuted;
    setIsMuted(newMuted);

    // Pass explicit mute state so hook doesn't desync when mic is auto-paused during AI speech
    await toggleMic(newMuted);
  }, [isMuted, toggleMic]);

  // ─── Render ─────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      {isCameraOn ? (
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing="back"
          onCameraReady={handleCameraReady}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.darkBg]}>
          <LinearGradient
            colors={['transparent', 'rgba(25,80,180,0.12)', 'rgba(35,110,210,0.22)', 'rgba(40,120,230,0.18)', 'transparent']}
            locations={[0, 0.35, 0.55, 0.7, 1]}
            style={styles.ambientGlow}
          />
        </View>
      )}

      {/* Connecting overlay */}
      {isConnecting && (
        <View style={styles.connectingOverlay}>
          <ActivityIndicator size="large" color="#3FC39E" />
          <Text style={styles.connectingText}>Connecting to Guidera Live...</Text>
        </View>
      )}

      {/* Fixed Header Bar */}
      <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
        <LinearGradient
          colors={['rgba(10,10,15,1)', 'rgba(10,10,15,0.95)', 'rgba(10,10,15,0)']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.topBar}>
          <View style={styles.liveIndicator}>
            <View style={[
              styles.liveDot,
              isRecording && styles.liveDotListening,
              isSpeaking && styles.liveDotSpeaking,
              (isCameraOn || isConnected) && styles.liveDotActive,
            ]} />
            <Text style={styles.liveText}>
              {isRecording ? 'Listening...' : isSpeaking ? 'Speaking...' : isConnected ? 'Live' : 'Offline'}
            </Text>
          </View>

          <View style={{ flex: 1 }} />

          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowTranscript(!showTranscript);
            }}
            style={styles.transcriptToggle}
            activeOpacity={0.7}
          >
            {showTranscript ? (
              <Eye size={20} color="rgba(255,255,255,0.85)" variant="Bold" />
            ) : (
              <EyeSlash size={20} color="rgba(255,255,255,0.4)" variant="Bold" />
            )}
          </TouchableOpacity>

          <LanguagePicker selectedLanguage={userLanguage} onSelect={onLanguageChange} />
        </View>
      </View>

      {/* Conversation transcript — hidden by default, toggle with eye icon */}
      {showTranscript && <ScrollView
        ref={scrollRef}
        style={styles.conversationArea}
        contentContainerStyle={[
          styles.conversationContent,
          { paddingTop: insets.top + 70, paddingBottom: 180 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {conversations.map((entry, i) => (
          <View
            key={i}
            style={[
              styles.chatBubble,
              entry.role === 'user' ? styles.userBubble : styles.aiBubble,
            ]}
          >
            {entry.role === 'user' && (
              <Text style={styles.chatLabel}>You:</Text>
            )}
            <Text style={[
              styles.chatText,
              entry.role === 'user' && styles.userChatText,
            ]}>
              {entry.text}
            </Text>
          </View>
        ))}

        {/* Live streaming transcription */}
        {streamingText ? (
          <View style={[styles.chatBubble, styles.aiBubble, styles.streamingBubble]}>
            <Text style={styles.streamingText}>{streamingText}</Text>
            <View style={styles.cursorBlink}>
              <Text style={styles.cursorChar}>▍</Text>
            </View>
          </View>
        ) : isSpeaking ? (
          <View style={[styles.chatBubble, styles.aiBubble]}>
            <View style={styles.speakingIndicator}>
              <View style={styles.speakingDot} />
              <View style={[styles.speakingDot, { opacity: 0.8 }]} />
              <View style={[styles.speakingDot, { opacity: 1.0 }]} />
            </View>
          </View>
        ) : null}
      </ScrollView>}

      {/* Text input fallback */}
      {showTextInput && (
        <View style={[styles.textInputBar, { bottom: insets.bottom + 130 }]}>
          <TextInput
            style={styles.textInputField}
            placeholder="Type a message..."
            placeholderTextColor="rgba(255,255,255,0.3)"
            value={textInput}
            onChangeText={setTextInput}
            onSubmitEditing={() => {
              if (textInput.trim()) {
                sendText(textInput.trim());
                setTextInput('');
              }
            }}
            returnKeyType="send"
          />
          <TouchableOpacity
            style={styles.sendBtn}
            onPress={() => {
              if (textInput.trim()) {
                sendText(textInput.trim());
                setTextInput('');
              }
            }}
            activeOpacity={0.7}
          >
            <Send2 size={20} color="#3FC39E" variant="Bold" />
          </TouchableOpacity>
        </View>
      )}

      {/* Bottom controls bar */}
      <View style={[styles.bottomBar, { bottom: insets.bottom + 70 }]}>
        <View style={styles.controlsRow}>
          <TouchableOpacity
            style={[styles.controlBtn, isCameraOn && styles.controlBtnActive]}
            onPress={toggleCamera}
            activeOpacity={0.7}
          >
            <Video
              size={22}
              color={isCameraOn ? '#FFFFFF' : 'rgba(255,255,255,0.7)'}
              variant="Bold"
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlBtn, isMuted && styles.controlBtnMuted]}
            onPress={toggleMute}
            activeOpacity={0.7}
          >
            {isMuted ? (
              <MicrophoneSlash size={22} color="#EF4444" variant="Bold" />
            ) : (
              <Microphone2
                size={22}
                color={isRecording ? '#3FC39E' : 'rgba(255,255,255,0.7)'}
                variant="Bold"
              />
            )}
          </TouchableOpacity>

          {/* Text input toggle — fallback for voice */}
          <TouchableOpacity
            style={[styles.controlBtn, showTextInput && styles.controlBtnActive]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowTextInput(!showTextInput);
            }}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 18, color: showTextInput ? '#FFFFFF' : 'rgba(255,255,255,0.7)' }}>Aa</Text>
          </TouchableOpacity>


        </View>
      </View>

      {error && (
        <View style={[styles.errorBanner, { bottom: insets.bottom + 140 }]}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  darkBg: {
    backgroundColor: '#0A0A0F',
  },
  ambientGlow: {
    position: 'absolute',
    bottom: 0,
    left: -SCREEN_W * 0.3,
    right: -SCREEN_W * 0.3,
    height: SCREEN_H * 0.65,
    borderTopLeftRadius: SCREEN_W,
    borderTopRightRadius: SCREEN_W,
  },

  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    paddingBottom: 16,
  },
  topBar: {
    paddingHorizontal: 16,
    paddingRight: 52,
    paddingTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  liveDotListening: {
    backgroundColor: '#3FC39E',
  },
  liveDotActive: {
    backgroundColor: '#3FC39E',
  },
  liveDotSpeaking: {
    backgroundColor: '#818CF8',
  },
  liveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  transcriptToggle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },

  conversationArea: {
    flex: 1,
    zIndex: 10,
  },
  conversationContent: {
    paddingHorizontal: 20,
  },
  chatBubble: {
    marginBottom: 12,
    maxWidth: '90%',
  },
  userBubble: {
    alignSelf: 'flex-end',
  },
  aiBubble: {
    alignSelf: 'flex-start',
  },
  chatLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 4,
    textAlign: 'right',
  },
  chatText: {
    fontSize: 16,
    lineHeight: 24,
    color: 'rgba(255,255,255,0.85)',
  },
  userChatText: {
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'right',
  },
  interimText: {
    color: 'rgba(255,255,255,0.4)',
    fontStyle: 'italic',
    textAlign: 'right',
  },

  connectingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,10,15,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
    gap: 16,
  },
  connectingText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
  },

  speakingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  speakingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3FC39E',
    opacity: 0.6,
  },

  streamingBubble: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
  },
  streamingText: {
    fontSize: 16,
    lineHeight: 24,
    color: 'rgba(255,255,255,0.85)',
  },
  cursorBlink: {
    marginLeft: 2,
    marginBottom: -1,
  },
  cursorChar: {
    fontSize: 18,
    color: '#818CF8',
    fontWeight: '300',
  },

  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(30,30,40,0.9)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 32,
  },
  controlBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlBtnActive: {
    backgroundColor: 'rgba(63,195,158,0.35)',
  },
  controlBtnMuted: {
    backgroundColor: 'rgba(239,68,68,0.15)',
  },
  closeBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(239,68,68,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  errorBanner: {
    position: 'absolute',
    left: 20,
    right: 20,
    backgroundColor: 'rgba(239,68,68,0.9)',
    borderRadius: 12,
    padding: 12,
    zIndex: 100,
  },
  errorText: {
    fontSize: 13,
    color: '#FFFFFF',
    textAlign: 'center',
  },

  textInputBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 100,
  },
  textInputField: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(63,195,158,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
