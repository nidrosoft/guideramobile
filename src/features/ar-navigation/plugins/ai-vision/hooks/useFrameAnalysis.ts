/**
 * USE FRAME ANALYSIS HOOK
 *
 * Manages live camera frame capture at 1fps with pixel-diff detection.
 * Only sends frames to Gemini when significant visual change is detected.
 * Uses expo-camera CameraView ref for snapshots (no react-native-vision-camera needed).
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { FRAME_DIFF_CONFIG, MAX_IDLE_FRAMES } from '../constants/translatorConfig';
import { analyzeLiveFrame } from '../services/gemini.service';
import type { LiveFrameResult } from '../types/aiVision.types';

const ExpoFileSystem = require('expo-file-system');

interface UseFrameAnalysisReturn {
  isActive: boolean;
  isProcessing: boolean;
  currentResult: LiveFrameResult | null;
  error: string | null;
  start: (cameraRef: any, userLanguage: string) => void;
  stop: () => void;
}

/**
 * Simple pixel-diff check by comparing base64 string lengths + sampling.
 * This is a lightweight heuristic — not pixel-perfect but cost-effective.
 */
function hasSignificantChange(prev: string | null, current: string): boolean {
  if (!prev) return true;

  // Quick length-based check (significant size change = different content)
  const lengthDiff = Math.abs(prev.length - current.length) / Math.max(prev.length, 1);
  if (lengthDiff > 0.05) return true;

  // Sample comparison: check every Nth character
  const sampleRate = Math.max(1, Math.floor(current.length / 200));
  let diffs = 0;
  const totalSamples = Math.min(200, current.length);

  for (let i = 0; i < totalSamples; i++) {
    const idx = i * sampleRate;
    if (idx < prev.length && idx < current.length && prev[idx] !== current[idx]) {
      diffs++;
    }
  }

  return diffs / totalSamples > FRAME_DIFF_CONFIG.changeThreshold;
}

export function useFrameAnalysis(): UseFrameAnalysisReturn {
  const [isActive, setIsActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentResult, setCurrentResult] = useState<LiveFrameResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevFrameRef = useRef<string | null>(null);
  const idleCountRef = useRef(0);
  const cameraRefHolder = useRef<any>(null);
  const languageRef = useRef('en');
  const isProcessingRef = useRef(false);

  const captureAndAnalyze = useCallback(async () => {
    const camera = cameraRefHolder.current;
    if (!camera || isProcessingRef.current) return;

    try {
      // Capture a low-res snapshot from the camera
      // Use minimal quality to prevent memory crashes on devices with less RAM (e.g. iPhone 12)
      let photo: any;
      try {
        photo = await camera.takePictureAsync({
          quality: 0.1,          // Minimal quality — live analysis doesn't need high-res
          base64: true,
          skipProcessing: true,
          shutterSound: false,
          imageType: 'jpg',      // Force JPEG for smaller memory footprint
        });
      } catch (captureErr) {
        // Camera capture can fail on older devices under memory pressure — skip this frame
        if (__DEV__) console.warn('[useFrameAnalysis] Capture failed:', captureErr);
        return;
      }

      if (!photo?.base64) {
        // Clean up temp file even if base64 failed
        if (photo?.uri) ExpoFileSystem.deleteAsync(photo.uri, { idempotent: true }).catch(() => {});
        return;
      }

      // Check if frame has changed significantly
      if (!hasSignificantChange(prevFrameRef.current, photo.base64)) {
        idleCountRef.current++;
        // If too many idle frames, pause API calls
        if (idleCountRef.current > MAX_IDLE_FRAMES) return;
        return;
      }

      idleCountRef.current = 0;
      prevFrameRef.current = photo.base64;
      isProcessingRef.current = true;
      setIsProcessing(true);

      const result = await analyzeLiveFrame(photo.base64, languageRef.current);
      setCurrentResult(result);
      setError(null);

      // Clean up temp file immediately to free memory
      if (photo.uri) {
        ExpoFileSystem.deleteAsync(photo.uri, { idempotent: true }).catch(() => {});
      }
      // Release base64 ref to help GC on low-memory devices
      prevFrameRef.current = photo.base64.substring(0, 500); // Keep only a sample for diff check
    } catch (e: any) {
      if (__DEV__) console.warn('[useFrameAnalysis] Error:', e);
      setError(e?.message || 'Frame analysis failed');
    } finally {
      isProcessingRef.current = false;
      setIsProcessing(false);
    }
  }, []);

  const start = useCallback(
    (cameraRef: any, userLanguage: string) => {
      if (intervalRef.current) return; // Already running

      cameraRefHolder.current = cameraRef;
      languageRef.current = userLanguage;
      prevFrameRef.current = null;
      idleCountRef.current = 0;
      setIsActive(true);
      setError(null);

      // Start frame capture interval
      intervalRef.current = setInterval(captureAndAnalyze, FRAME_DIFF_CONFIG.captureIntervalMs);
    },
    [captureAndAnalyze],
  );

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    cameraRefHolder.current = null;
    prevFrameRef.current = null;
    idleCountRef.current = 0;
    isProcessingRef.current = false;
    setIsActive(false);
    setIsProcessing(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return { isActive, isProcessing, currentResult, error, start, stop };
}
