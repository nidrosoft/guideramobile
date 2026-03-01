/**
 * SCAN CAMERA STEP
 * 
 * Step 2 in scan import flow - Camera view for scanning tickets/QR codes.
 * User scans their booking document to extract details.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Scan, Gallery, InfoCircle } from 'iconsax-react-native';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { StepComponentProps } from '../../types/import-flow.types';

export default function ScanCameraStep({ onNext }: StepComponentProps) {
  const [isScanning, setIsScanning] = useState(false);

  const handleScan = () => {
    setIsScanning(true);
    // Simulate scanning
    setTimeout(() => {
      onNext({ scannedData: { type: 'flight', code: 'ABC123' } });
    }, 1500);
  };

  const handleGallery = () => {
    // TODO: Implement image picker
    onNext({ scannedData: { type: 'hotel', code: 'HTL456' } });
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Scan Your Ticket</Text>
        <Text style={styles.description}>
          Position your ticket, boarding pass, or booking QR code within the frame
        </Text>

        {/* Camera Placeholder */}
        <View style={styles.cameraContainer}>
          <View style={styles.scanFrame}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
            
            <Scan size={80} color={colors.primary} variant="Bold" />
            <Text style={styles.scanText}>
              {isScanning ? 'Scanning...' : 'Align ticket within frame'}
            </Text>
          </View>
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <InfoCircle size={20} color={colors.primary} variant="Bold" />
          <Text style={styles.infoText}>
            We support boarding passes, hotel vouchers, rental car confirmations, and booking QR codes
          </Text>
        </View>
      </View>

      {/* Fixed Footer Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.galleryButton}
          onPress={handleGallery}
        >
          <Gallery size={20} color={colors.textPrimary} variant="Bold" />
          <Text style={styles.galleryButtonText}>Choose from Gallery</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.scanButton, isScanning && styles.scanButtonDisabled]}
          onPress={handleScan}
          disabled={isScanning}
        >
          <Text style={styles.scanButtonText}>
            {isScanning ? 'Scanning...' : 'Scan Now'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingTop: spacing.xl,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  description: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.xl,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: colors.gray900,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  scanFrame: {
    width: 280,
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: colors.primary,
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 12,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 12,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 12,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 12,
  },
  scanText: {
    fontSize: typography.fontSize.sm,
    color: colors.white,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: `${colors.primary}10`,
    padding: spacing.md,
    borderRadius: 12,
    gap: spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  footer: {
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    gap: spacing.sm,
  },
  galleryButton: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  galleryButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  scanButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    alignItems: 'center',
  },
  scanButtonDisabled: {
    backgroundColor: colors.gray300,
  },
  scanButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
});
