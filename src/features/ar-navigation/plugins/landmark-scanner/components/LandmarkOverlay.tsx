/**
 * LANDMARK OVERLAY
 * 
 * AR overlay for landmark scanning.
 * Shows scan frame and capture button.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Scan, Camera } from 'iconsax-react-native';
import { colors, spacing, typography } from '@/styles';

interface LandmarkOverlayProps {
  isScanning: boolean;
  onCapture: () => void;
}

export default function LandmarkOverlay({ isScanning, onCapture }: LandmarkOverlayProps) {
  return (
    <View style={styles.container}>
      {/* Scan Frame */}
      <View style={styles.scanFrame}>
        {/* Corner Guides */}
        <View style={[styles.corner, styles.topLeft]} />
        <View style={[styles.corner, styles.topRight]} />
        <View style={[styles.corner, styles.bottomLeft]} />
        <View style={[styles.corner, styles.bottomRight]} />
        
        {/* Center Icon */}
        {isScanning ? (
          <ActivityIndicator size="large" color={colors.primary} />
        ) : (
          <Scan size={60} color={colors.primary} variant="Bold" />
        )}
        
        {/* Instruction Text */}
        <Text style={styles.instructionText}>
          {isScanning ? 'Analyzing landmark...' : 'Point camera at landmark'}
        </Text>
      </View>

      {/* Capture Button */}
      <TouchableOpacity
        style={[styles.captureButton, isScanning && styles.captureButtonDisabled]}
        onPress={onCapture}
        disabled={isScanning}
        activeOpacity={0.8}
      >
        <View style={styles.captureButtonInner}>
          <Camera size={28} color={colors.white} variant="Bold" />
        </View>
      </TouchableOpacity>

      {/* Hint Text */}
      <Text style={styles.hintText}>
        Tap to scan landmark and learn its history
      </Text>
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
    pointerEvents: 'box-none', // Allow touches to pass through to camera
  },
  scanFrame: {
    width: 280,
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: spacing.xl,
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: colors.primary,
    borderWidth: 4,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 16,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 16,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 16,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 16,
  },
  instructionText: {
    fontSize: typography.fontSize.base,
    color: colors.white,
    marginTop: spacing.md,
    textAlign: 'center',
    fontWeight: typography.fontWeight.semibold,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
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
  hintText: {
    fontSize: typography.fontSize.sm,
    color: colors.white,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
