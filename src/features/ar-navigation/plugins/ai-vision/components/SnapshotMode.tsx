/**
 * SNAPSHOT MODE
 *
 * Photo capture → OCR → full translation display.
 * User captures a photo (or picks from gallery), Vision API extracts text,
 * Translation API translates it, and a scrollable card shows the result.
 * Includes "Ask Gemini" follow-up and "Build Order" bridge to menu scan.
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { CameraView } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import {
  Camera,
  Gallery,
  DocumentCopy,
  Send2,
  Receipt21,
  LanguageSquare,
  ArrowLeft2,
} from 'iconsax-react-native';
import LanguagePicker from './LanguagePicker';
import { useVisionOCR } from '../hooks/useVisionOCR';
import { useTranslation } from '../hooks/useTranslation';
import { askFollowUp, isMenuImage } from '../services/gemini.service';
import { getLanguageName, getLanguageFlag } from '../constants/translatorConfig';

const ExpoFileSystem = require('expo-file-system');

interface SnapshotModeProps {
  userLanguage: string;
  onLanguageChange: (lang: string) => void;
  onSwitchToMenu: (base64: string) => void;
}

export default function SnapshotMode({
  userLanguage,
  onLanguageChange,
  onSwitchToMenu,
}: SnapshotModeProps) {
  const cameraRef = useRef<any>(null);
  const { ocrResult, isProcessing: isOCRProcessing, error: ocrError, extractText, clear: clearOCR } = useVisionOCR();
  const { translation, isTranslating, error: transError, translate, clear: clearTrans } = useTranslation();

  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [base64Image, setBase64Image] = useState<string | null>(null);
  const [isMenuDetected, setIsMenuDetected] = useState(false);
  const [followUpQuestion, setFollowUpQuestion] = useState('');
  const [followUpAnswer, setFollowUpAnswer] = useState('');
  const [isAskingFollowUp, setIsAskingFollowUp] = useState(false);
  const [showCamera, setShowCamera] = useState(true);

  const processImage = useCallback(
    async (uri: string) => {
      setShowCamera(false);
      setCapturedImage(uri);

      // Read base64
      let b64: string | null = null;
      try {
        b64 = await ExpoFileSystem.readAsStringAsync(uri, { encoding: 'base64' });
        setBase64Image(b64);
      } catch {}

      // OCR
      const ocr = await extractText(uri);
      if (!ocr) return;

      // Translate
      await translate(ocr.fullText, userLanguage);

      // Check if it's a menu (non-blocking)
      if (b64) {
        isMenuImage(b64).then(setIsMenuDetected).catch(() => {});
      }
    },
    [userLanguage, extractText, translate],
  );

  const handleCapture = async () => {
    if (!cameraRef.current) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8, base64: false });
      if (photo?.uri) {
        processImage(photo.uri);
      }
    } catch (e) {
      if (__DEV__) console.warn('[SnapshotMode] Capture error:', e);
    }
  };

  const handlePickImage = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      processImage(result.assets[0].uri);
    }
  };

  const handleReset = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCapturedImage(null);
    setBase64Image(null);
    setIsMenuDetected(false);
    setFollowUpQuestion('');
    setFollowUpAnswer('');
    clearOCR();
    clearTrans();
    setShowCamera(true);
  };

  const handleCopy = async () => {
    if (translation?.translatedText) {
      await Clipboard.setStringAsync(translation.translatedText);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleAskFollowUp = async () => {
    if (!followUpQuestion.trim() || !base64Image || !translation) return;
    setIsAskingFollowUp(true);
    try {
      const answer = await askFollowUp(
        base64Image,
        translation.translatedText,
        followUpQuestion,
        userLanguage,
      );
      setFollowUpAnswer(answer);
      setFollowUpQuestion('');
    } catch (e: any) {
      setFollowUpAnswer('Sorry, I could not answer that. Please try again.');
    } finally {
      setIsAskingFollowUp(false);
    }
  };

  const handleBuildOrder = () => {
    if (base64Image) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onSwitchToMenu(base64Image);
    }
  };

  const error = ocrError || transError;
  const isLoading = isOCRProcessing || isTranslating;

  // ── Camera View ──────────────────────────────────────────
  if (showCamera) {
    return (
      <View style={styles.container}>
        <CameraView ref={cameraRef} style={styles.camera} facing="back" />

        {/* Top bar */}
        <View style={styles.topBar}>
          <View style={styles.modeLabel}>
            <Camera size={16} color="#3FC39E" variant="Bold" />
            <Text style={styles.modeLabelText}>Translate Text</Text>
          </View>
          <LanguagePicker selectedLanguage={userLanguage} onSelect={onLanguageChange} />
        </View>

        {/* Scan frame */}
        <View style={styles.scanFrame}>
          <View style={[styles.corner, styles.tl]} />
          <View style={[styles.corner, styles.tr]} />
          <View style={[styles.corner, styles.bl]} />
          <View style={[styles.corner, styles.br]} />
          <Text style={styles.frameHint}>Frame the text you want to translate</Text>
        </View>

        {/* Bottom controls */}
        <View style={styles.captureRow}>
          <TouchableOpacity style={styles.galleryBtn} onPress={handlePickImage} activeOpacity={0.7}>
            <Gallery size={24} color="#FFFFFF" variant="Bold" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.captureBtn} onPress={handleCapture} activeOpacity={0.8}>
            <View style={styles.captureBtnInner} />
          </TouchableOpacity>

          <View style={{ width: 48 }} />
        </View>
      </View>
    );
  }

  // ── Results View ─────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.resultsScroll}
        contentContainerStyle={styles.resultsContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Back / retake */}
        <TouchableOpacity style={styles.backBtn} onPress={handleReset} activeOpacity={0.7}>
          <ArrowLeft2 size={20} color="#FFFFFF" variant="Bold" />
          <Text style={styles.backText}>New Scan</Text>
        </TouchableOpacity>

        {/* Captured image thumbnail */}
        {capturedImage && (
          <Image source={{ uri: capturedImage }} style={styles.thumbnail} resizeMode="cover" />
        )}

        {/* Loading state */}
        {isLoading && (
          <View style={styles.loadingCard}>
            <ActivityIndicator color="#3FC39E" size="small" />
            <Text style={styles.loadingText}>
              {isOCRProcessing ? 'Extracting text...' : 'Translating...'}
            </Text>
          </View>
        )}

        {/* Error */}
        {error && !isLoading && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Translation result */}
        {translation && !isLoading && (
          <>
            {/* Language detected */}
            <View style={styles.langBar}>
              <View style={styles.langTag}>
                <Text style={styles.langTagText}>
                  {getLanguageFlag(translation.sourceLanguage)} {getLanguageName(translation.sourceLanguage)}
                </Text>
              </View>
              <Text style={styles.langArrow}>→</Text>
              <View style={styles.langTag}>
                <Text style={styles.langTagText}>
                  {getLanguageFlag(translation.targetLanguage)} {getLanguageName(translation.targetLanguage)}
                </Text>
              </View>
            </View>

            {/* Original text */}
            <View style={styles.textCard}>
              <Text style={styles.textLabel}>ORIGINAL</Text>
              <Text style={styles.originalText}>{translation.originalText}</Text>
            </View>

            {/* Translated text */}
            <View style={[styles.textCard, styles.translatedCard]}>
              <Text style={[styles.textLabel, { color: '#3FC39E' }]}>TRANSLATION</Text>
              <Text style={styles.translatedText}>{translation.translatedText}</Text>
            </View>

            {/* Actions */}
            <View style={styles.actionsRow}>
              <TouchableOpacity style={styles.actionBtn} onPress={handleCopy} activeOpacity={0.7}>
                <DocumentCopy size={18} color="#3FC39E" variant="Bold" />
                <Text style={styles.actionText}>Copy</Text>
              </TouchableOpacity>

              {isMenuDetected && (
                <TouchableOpacity style={styles.actionBtn} onPress={handleBuildOrder} activeOpacity={0.7}>
                  <Receipt21 size={18} color="#EC4899" variant="Bold" />
                  <Text style={[styles.actionText, { color: '#EC4899' }]}>Build Order</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Follow-up answer */}
            {followUpAnswer ? (
              <View style={styles.followUpCard}>
                <Text style={styles.followUpLabel}>Guidera AI</Text>
                <Text style={styles.followUpText}>{followUpAnswer}</Text>
              </View>
            ) : null}

            {/* Ask Gemini */}
            <View style={styles.askRow}>
              <TextInput
                style={styles.askInput}
                placeholder="Ask about this text..."
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={followUpQuestion}
                onChangeText={setFollowUpQuestion}
                returnKeyType="send"
                onSubmitEditing={handleAskFollowUp}
                editable={!isAskingFollowUp}
              />
              <TouchableOpacity
                style={styles.askBtn}
                onPress={handleAskFollowUp}
                disabled={isAskingFollowUp || !followUpQuestion.trim()}
                activeOpacity={0.7}
              >
                {isAskingFollowUp ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Send2 size={20} color="#FFFFFF" variant="Bold" />
                )}
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  topBar: {
    position: 'absolute',
    top: 56,
    left: 60,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 100,
  },
  modeLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  modeLabelText: { fontSize: 13, fontWeight: '600', color: '#FFFFFF' },
  scanFrame: {
    position: 'absolute',
    top: '30%',
    alignSelf: 'center',
    width: 280,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: '#3FC39E',
  },
  tl: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 8 },
  tr: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 8 },
  bl: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 8 },
  br: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 8 },
  frameHint: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  captureRow: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 40,
    zIndex: 100,
  },
  galleryBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureBtnInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
  },
  // ── Results ──
  resultsScroll: { flex: 1, backgroundColor: '#111' },
  resultsContent: { padding: 16, paddingBottom: 120 },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
    paddingTop: 44,
  },
  backText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
  thumbnail: { width: '100%', height: 180, borderRadius: 16, marginBottom: 16 },
  loadingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  loadingText: { fontSize: 14, color: 'rgba(255,255,255,0.7)' },
  errorCard: {
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  errorText: { fontSize: 13, color: '#EF4444' },
  langBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 16,
  },
  langTag: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  langTagText: { fontSize: 13, fontWeight: '600', color: '#FFFFFF' },
  langArrow: { fontSize: 16, color: 'rgba(255,255,255,0.4)', fontWeight: '700' },
  textCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  translatedCard: {
    backgroundColor: 'rgba(63,195,158,0.08)',
    borderColor: 'rgba(63,195,158,0.2)',
  },
  textLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  originalText: { fontSize: 15, color: 'rgba(255,255,255,0.8)', lineHeight: 22 },
  translatedText: { fontSize: 16, fontWeight: '500', color: '#FFFFFF', lineHeight: 24 },
  actionsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  actionText: { fontSize: 13, fontWeight: '600', color: '#3FC39E' },
  followUpCard: {
    backgroundColor: 'rgba(63,195,158,0.06)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(63,195,158,0.15)',
  },
  followUpLabel: { fontSize: 11, fontWeight: '700', color: '#3FC39E', marginBottom: 6 },
  followUpText: { fontSize: 14, color: 'rgba(255,255,255,0.85)', lineHeight: 21 },
  askRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  askInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  askBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#3FC39E',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
