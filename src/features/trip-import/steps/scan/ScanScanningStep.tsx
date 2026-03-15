/**
 * SCAN SCANNING STEP
 * 
 * Step 3 in scan import flow - Calls scan-ticket edge function with
 * Claude Sonnet vision to extract booking data from the image.
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { spacing, typography } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { StepComponentProps } from '../../types/import-flow.types';
import { tripImportEngine } from '@/services/trip/trip-import-engine.service';
import { useAuth } from '@/context/AuthContext';

const SCAN_STAGES = [
  'Uploading your image...',
  'Analyzing ticket with AI vision...',
  'Reading text and barcodes...',
  'Identifying booking provider...',
  'Extracting flight details...',
  'Structuring your booking data...',
  'Almost done — verifying details...',
];

export default function ScanScanningStep({ onNext, data }: StepComponentProps) {
  const { colors: tc } = useTheme();
  const { profile } = useAuth();
  const [message, setMessage] = useState(SCAN_STAGES[0]);
  const [stageIndex, setStageIndex] = useState(0);

  // Cycle through stages every 2 seconds for UX engagement
  useEffect(() => {
    const interval = setInterval(() => {
      setStageIndex(prev => {
        const next = Math.min(prev + 1, SCAN_STAGES.length - 1);
        setMessage(SCAN_STAGES[next]);
        return next;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const MAX_RETRIES = 3;

    const processScan = async () => {
      const imageBase64 = data.scannedData?.imageBase64;
      const mediaType = data.scannedData?.mediaType || 'image/jpeg';

      if (!imageBase64) {
        onNext({ scanError: 'No image data found. Please try scanning again.' });
        return;
      }

      let lastError = '';

      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        if (cancelled) return;

        try {
          if (attempt > 1) {
            setMessage(`Retrying... (attempt ${attempt}/${MAX_RETRIES})`);
            await new Promise(r => setTimeout(r, 2000));
          }

          const result = await tripImportEngine.scanTicket(
            imageBase64,
            mediaType,
            profile?.id,
          );

          if (cancelled) return;

          if (result.success && result.booking) {
            onNext({ scannedBooking: result.booking });
            return;
          }

          lastError = result.error || 'Could not extract booking information from this image.';
        } catch (error: any) {
          if (cancelled) return;
          lastError = error.message || 'Failed to process the image.';
          console.warn(`[Scan] Attempt ${attempt}/${MAX_RETRIES} failed:`, lastError);
        }
      }

      // All retries exhausted
      onNext({
        scanError: 'We couldn\'t read this ticket after multiple attempts. Try taking a clearer photo or uploading a screenshot instead.',
        scannedBooking: null,
      });
    };

    processScan();
    return () => { cancelled = true; };
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <ActivityIndicator size="large" color={tc.primary} />
        <Text style={[styles.title, { color: tc.textPrimary }]}>Processing Your Ticket</Text>
        <Text style={[styles.description, { color: tc.textSecondary }]}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    marginTop: spacing.xl,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  description: {
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
});
