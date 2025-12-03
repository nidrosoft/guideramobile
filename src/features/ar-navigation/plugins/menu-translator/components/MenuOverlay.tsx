/**
 * MENU OVERLAY
 * 
 * AR overlay for menu translation.
 * Shows mode selector and capture/freeze controls.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Camera, Eye, Pause, Play } from 'iconsax-react-native';
import { colors, spacing, typography } from '@/styles';

export type TranslationMode = 'scan' | 'live';

interface MenuOverlayProps {
  mode: TranslationMode;
  isLiveFrozen: boolean;
  isProcessing: boolean;
  onModeChange: (mode: TranslationMode) => void;
  onCapture: () => void;
  onToggleLive: () => void;
}

export default function MenuOverlay({
  mode,
  isLiveFrozen,
  isProcessing,
  onModeChange,
  onCapture,
  onToggleLive,
}: MenuOverlayProps) {
  return (
    <View style={styles.container}>
      {/* Scan Frame (only in Scan mode) - Smaller and centered */}
      {mode === 'scan' && (
        <View style={styles.scanFrame}>
          {/* Corner Guides */}
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />

          {/* Instruction Text */}
          <Text style={styles.instructionText}>
            {isProcessing ? 'Translating menu...' : 'Point at menu'}
          </Text>
        </View>
      )}

      {/* Live Mode Indicator */}
      {mode === 'live' && (
        <View style={styles.liveIndicator}>
          <View style={[styles.liveDot, !isLiveFrozen && styles.liveDotActive]} />
          <Text style={styles.liveText}>
            {isLiveFrozen ? 'Translation Frozen' : 'Live Translation Active'}
          </Text>
        </View>
      )}

      {/* Hint Text - Above capture button */}
      <Text style={styles.hintText}>
        {mode === 'scan'
          ? 'Capture menu to see translations'
          : 'Point at text to translate in real-time'}
      </Text>

      {/* Capture Button (Scan mode) */}
      {mode === 'scan' && (
        <TouchableOpacity
          style={[styles.captureButton, isProcessing && styles.captureButtonDisabled]}
          onPress={onCapture}
          disabled={isProcessing}
          activeOpacity={0.8}
        >
          <View style={styles.captureButtonInner}>
            <Camera size={28} color={colors.white} variant="Bold" />
          </View>
        </TouchableOpacity>
      )}

      {/* Freeze/Unfreeze Button (Live mode) */}
      {mode === 'live' && (
        <TouchableOpacity
          style={styles.freezeButton}
          onPress={onToggleLive}
          activeOpacity={0.8}
        >
          {isLiveFrozen ? (
            <Play size={24} color={colors.white} variant="Bold" />
          ) : (
            <Pause size={24} color={colors.white} variant="Bold" />
          )}
          <Text style={styles.freezeButtonText}>
            {isLiveFrozen ? 'Resume' : 'Freeze'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Mode Selector - Moved to bottom for better UX */}
      <View style={styles.modeSelector}>
        <TouchableOpacity
          style={[styles.modeButton, mode === 'scan' && styles.modeButtonActive]}
          onPress={() => onModeChange('scan')}
          activeOpacity={0.7}
        >
          <Camera
            size={20}
            color={mode === 'scan' ? colors.primary : colors.gray400}
            variant={mode === 'scan' ? 'Bold' : 'Linear'}
          />
          <Text style={[styles.modeText, mode === 'scan' && styles.modeTextActive]}>
            Scan
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.modeButton, mode === 'live' && styles.modeButtonActive]}
          onPress={() => onModeChange('live')}
          activeOpacity={0.7}
        >
          <Eye
            size={20}
            color={mode === 'live' ? colors.primary : colors.gray400}
            variant={mode === 'live' ? 'Bold' : 'Linear'}
          />
          <Text style={[styles.modeText, mode === 'live' && styles.modeTextActive]}>
            Live
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'box-none',
  },
  modeSelector: {
    position: 'absolute',
    bottom: 40, // Moved to bottom for better UX
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 24,
    padding: 4,
    gap: 4,
  },
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  modeButtonActive: {
    backgroundColor: colors.white, // White background for selected state
  },
  modeText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.gray400,
  },
  modeTextActive: {
    color: colors.primary, // Primary color text for selected state
  },
  scanFrame: {
    width: 240, // Reduced from 300 to avoid overlapping plugin icons
    height: 180, // Reduced from 200
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: '50%', // Centered vertically
    marginTop: -90, // Half of height to center perfectly
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: colors.primary,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 8,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 8,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 8,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 8,
  },
  instructionText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.white,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    marginTop: 200,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gray400,
  },
  liveDotActive: {
    backgroundColor: colors.success,
  },
  liveText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.white,
  },
  captureButton: {
    position: 'absolute',
    bottom: 140, // Moved up to make room for mode selector
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: colors.white,
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  freezeButton: {
    position: 'absolute',
    bottom: 140, // Moved up to make room for mode selector
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 28,
  },
  freezeButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  hintText: {
    position: 'absolute',
    bottom: 240, // Moved above capture button
    fontSize: typography.fontSize.sm,
    color: colors.white,
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    overflow: 'hidden',
    maxWidth: '80%',
  },
});
