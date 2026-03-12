/**
 * SCAN CAMERA STEP
 * 
 * Step 2 in scan import flow - Camera/gallery for scanning tickets.
 * Uses expo-image-picker to capture or select an image, converts to base64.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Scan, Gallery, InfoCircle, Camera } from 'iconsax-react-native';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { StepComponentProps } from '../../types/import-flow.types';

export default function ScanCameraStep({ onNext }: StepComponentProps) {
  const { colors: tc, isDark } = useTheme();
  const [isProcessing, setIsProcessing] = useState(false);

  const processResult = (result: ImagePicker.ImagePickerResult) => {
    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    if (!asset.base64) {
      Alert.alert('Error', 'Failed to read the image. Please try again.');
      return;
    }

    setIsProcessing(true);
    const ext = (asset.uri || '').split('.').pop()?.toLowerCase() || 'jpeg';
    const mediaType = ext === 'png' ? 'image/png' : 'image/jpeg';

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onNext({ scannedData: { imageBase64: asset.base64, mediaType } });
  };

  const handleCamera = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Required', 'Camera access is needed to scan your ticket.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      base64: true,
    });
    processResult(result);
  };

  const handleGallery = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Required', 'Photo library access is needed to select your ticket.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      base64: true,
    });
    processResult(result);
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: tc.textPrimary }]}>Scan Your Ticket</Text>
        <Text style={[styles.description, { color: tc.textSecondary }]}>
          Take a photo or choose an image of your boarding pass, hotel voucher, or booking confirmation.
        </Text>

        {/* Buttons */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={[styles.scanButton, { backgroundColor: tc.primary }, isProcessing && { backgroundColor: tc.borderSubtle }]}
            onPress={handleCamera}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Camera size={20} color="#fff" variant="Bold" />
                <Text style={styles.scanButtonText}>Take Photo</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.galleryButton, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}
            onPress={handleGallery}
            disabled={isProcessing}
          >
            <Gallery size={20} color={tc.textPrimary} variant="Bold" />
            <Text style={[styles.galleryButtonText, { color: tc.textPrimary }]}>Choose from Gallery</Text>
          </TouchableOpacity>
        </View>

        {/* Helper text */}
        <View style={[styles.helperBox, { backgroundColor: tc.primary + '08' }]}>
          <InfoCircle size={18} color={tc.primary} variant="Bold" />
          <Text style={[styles.helperText, { color: tc.textSecondary }]}>
            We support boarding passes, hotel vouchers, rental car confirmations, and booking QR codes
          </Text>
        </View>
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
    paddingTop: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.xs,
  },
  description: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    marginBottom: spacing.xl,
  },
  buttonsContainer: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  scanButton: {
    flexDirection: 'row',
    height: 52,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  scanButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  galleryButton: {
    flexDirection: 'row',
    height: 52,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1,
  },
  galleryButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  helperBox: {
    flexDirection: 'row',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  helperText: {
    flex: 1,
    fontSize: typography.fontSize.xs,
    lineHeight: 18,
  },
});
