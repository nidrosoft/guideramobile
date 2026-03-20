/**
 * SCAN RECEIPT SCREEN
 * 
 * Camera-based receipt scanner that uses AI vision to extract expense items.
 * Takes a photo → sends to scan-receipt edge function → shows parsed items →
 * user confirms → items inserted into expense tracker.
 * 
 * Accessed from the AR launcher "Scan Receipt" action.
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Image,
  ActivityIndicator, Alert, Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import {
  ArrowLeft2, Camera, Gallery, TickCircle, CloseCircle,
  Receipt1, Trash, Add,
} from 'iconsax-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { typography, spacing, borderRadius } from '@/styles';
import { useToast } from '@/contexts/ToastContext';
import { receiptScannerService, ScannedExpenseItem } from '@/services/receiptScanner.service';
import { expenseService } from '@/services/expense.service';
import { useTripStore } from '@/features/trips/stores/trip.store';
import { Trip, TripState } from '@/features/trips/types/trip.types';

type ScreenState = 'camera' | 'processing' | 'review' | 'success';

const CATEGORY_EMOJIS: Record<string, string> = {
  food: '🍔',
  transport: '🚗',
  accommodation: '🏨',
  activities: '🎭',
  shopping: '🛍️',
  entertainment: '🎬',
  health: '💊',
  communication: '📱',
  tips: '💰',
  other: '📦',
};

// General expense sentinel — used when user has no trip context
const GENERAL_EXPENSE_ID = '__general__';

export default function ScanReceiptScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors: tc, isDark } = useTheme();
  const { profile } = useAuth();
  const { showSuccess, showError } = useToast();
  const params = useLocalSearchParams<{ tripId?: string }>();
  const cameraRef = useRef<CameraView>(null);

  // Trip store
  const allTrips = useTripStore(state => state.trips);
  const fetchTrips = useTripStore(state => state.fetchTrips);

  const [permission, requestPermission] = useCameraPermissions();
  const [screenState, setScreenState] = useState<ScreenState>('camera');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [scannedItems, setScannedItems] = useState<ScannedExpenseItem[]>([]);
  const [merchant, setMerchant] = useState<string>('');
  const [total, setTotal] = useState<number>(0);
  const [confidence, setConfidence] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(params.tripId || null);
  // Whether this screen was opened from within a specific trip (locked context)
  const isLockedToTrip = !!params.tripId;

  // Fetch trips on mount if not loaded
  useEffect(() => {
    if (allTrips.length === 0 && profile?.id) {
      fetchTrips(profile.id);
    }
  }, [profile?.id]);

  // Eligible trips: ongoing + upcoming + recently completed (within 14 days)
  const eligibleTrips = useMemo(() => {
    const now = new Date();
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    return allTrips
      .filter(trip => {
        if (!trip.state) return false;
        if (trip.state === TripState.ONGOING || trip.state === TripState.UPCOMING) return true;
        // Include recently completed trips (ended within last 14 days)
        if (trip.state === TripState.PAST && trip.endDate) {
          const endDate = trip.endDate instanceof Date ? trip.endDate : new Date(trip.endDate);
          return endDate >= twoWeeksAgo;
        }
        return false;
      })
      .slice(0, 5); // Max 5 trips
  }, [allTrips]);

  // Auto-select if tripId was passed or only one eligible trip
  useEffect(() => {
    if (params.tripId) {
      setSelectedTripId(params.tripId);
    } else if (!selectedTripId && eligibleTrips.length === 1) {
      // Only one trip available — auto-select it for convenience
      setSelectedTripId(eligibleTrips[0].id);
    }
  }, [params.tripId, eligibleTrips]);

  // Request camera permission on mount
  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  const handleCapture = async () => {
    if (!cameraRef.current) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.8,
      });
      if (photo?.uri) setCapturedImage(photo.uri);
      if (photo?.base64) {
        await processBase64(photo.base64, 'image/jpeg');
      }
    } catch (err) {
      console.error('Camera capture error:', err);
      showError('Failed to take photo');
    }
  };

  const handlePickImage = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      if (asset.uri) setCapturedImage(asset.uri);
      if (asset.base64) {
        const mediaType = asset.uri?.toLowerCase().includes('.png') ? 'image/png' : 'image/jpeg';
        await processBase64(asset.base64, mediaType);
      }
    }
  };

  const processBase64 = async (base64: string, mediaType: string) => {
    setScreenState('processing');
    try {
      const result = await receiptScannerService.scanReceipt(base64, mediaType);

      if (result.items && result.items.length > 0) {
        setScannedItems(result.items);
        setMerchant(result.merchant || 'Unknown');
        setTotal(result.total || 0);
        setConfidence(result.confidence || 0);
        setScreenState('review');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Alert.alert(
          'No Items Found',
          'Could not identify expense items in this image. Please try again with a clearer photo.',
          [{ text: 'Try Again', onPress: () => resetCamera() }],
        );
      }
    } catch (err: any) {
      console.error('Receipt scan error:', err);
      Alert.alert(
        'Scan Failed',
        err.message || 'Failed to process receipt. Please try again.',
        [{ text: 'Try Again', onPress: () => resetCamera() }],
      );
    }
  };

  const resetCamera = () => {
    setCapturedImage(null);
    setScannedItems([]);
    setMerchant('');
    setTotal(0);
    setConfidence(0);
    setScreenState('camera');
  };

  const handleRemoveItem = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setScannedItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleConfirmExpenses = async () => {
    if (!profile?.id || scannedItems.length === 0) return;

    // Must select a trip (or general)
    if (!selectedTripId) {
      showError('Please select a trip or choose "General Expense"');
      return;
    }

    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // Determine target trip
      let targetTripId: string | null = selectedTripId;
      let isGeneralExpense = false;

      if (selectedTripId === GENERAL_EXPENSE_ID) {
        isGeneralExpense = true;
        // For general expenses, we still need a trip_id (DB constraint).
        // Use the first ongoing trip, or first eligible trip.
        const ongoingTrip = eligibleTrips.find(t => t.state === TripState.ONGOING);
        targetTripId = ongoingTrip?.id || eligibleTrips[0]?.id || null;

        if (!targetTripId) {
          showError('Create a trip first to track expenses.');
          setSaving(false);
          return;
        }
      }

      if (!targetTripId) {
        showError('Please select a trip to attach expenses to.');
        setSaving(false);
        return;
      }

      await expenseService.addBulkExpenses(
        targetTripId,
        profile.id,
        scannedItems.map(item => ({
          amount: item.amount,
          currency: item.currency,
          category: item.category,
          description: item.description,
          date: item.date || new Date().toISOString().split('T')[0],
          paymentMethod: item.paymentMethod || 'other',
          notes: isGeneralExpense
            ? `${item.notes ? item.notes + ' · ' : ''}General expense (via receipt scan)`
            : item.notes,
        })),
      );

      setScreenState('success');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const tripName = isGeneralExpense
        ? 'General'
        : (allTrips.find(t => t.id === targetTripId)?.destination?.city || eligibleTrips.find(t => t.id === targetTripId)?.destination?.city || 'your trip');
      showSuccess(`${scannedItems.length} expense${scannedItems.length > 1 ? 's' : ''} added to ${tripName}!`);

      setTimeout(() => router.back(), 1500);
    } catch (err: any) {
      console.error('Failed to save expenses:', err);
      showError('Failed to save expenses. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ─── No Permission ───
  if (!permission?.granted) {
    return (
      <View style={[styles.center, { backgroundColor: tc.background, paddingTop: insets.top }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <Receipt1 size={48} color={tc.textSecondary} variant="Bold" />
        <Text style={[styles.permTitle, { color: tc.textPrimary }]}>Camera Access Needed</Text>
        <Text style={[styles.permSub, { color: tc.textSecondary }]}>
          Allow camera access to scan receipts
        </Text>
        <TouchableOpacity style={[styles.permBtn, { backgroundColor: tc.primary }]} onPress={requestPermission}>
          <Text style={styles.permBtnText}>Allow Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: spacing.md }}>
          <Text style={[{ color: tc.textSecondary }]}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ─── Success State ───
  if (screenState === 'success') {
    return (
      <View style={[styles.center, { backgroundColor: tc.background, paddingTop: insets.top }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <View style={[styles.successIcon, { backgroundColor: `${tc.success}15` }]}>
          <TickCircle size={48} color={tc.success} variant="Bold" />
        </View>
        <Text style={[styles.successTitle, { color: tc.textPrimary }]}>Expenses Added!</Text>
        <Text style={[styles.successSub, { color: tc.textSecondary }]}>
          {scannedItems.length} item{scannedItems.length > 1 ? 's' : ''} from {merchant}
        </Text>
      </View>
    );
  }

  // ─── Processing State ───
  if (screenState === 'processing') {
    return (
      <View style={[styles.center, { backgroundColor: tc.background, paddingTop: insets.top }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        {capturedImage && (
          <Image source={{ uri: capturedImage }} style={styles.processingThumb} />
        )}
        <ActivityIndicator size="large" color={tc.primary} style={{ marginTop: spacing.xl }} />
        <Text style={[styles.processingTitle, { color: tc.textPrimary }]}>Analyzing Receipt...</Text>
        <Text style={[styles.processingSub, { color: tc.textSecondary }]}>
          AI is reading your receipt and extracting items
        </Text>
      </View>
    );
  }

  // ─── Review State ───
  if (screenState === 'review') {
    const itemsTotal = scannedItems.reduce((sum, item) => sum + item.amount, 0);

    return (
      <View style={[styles.container, { backgroundColor: tc.background }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />

        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + spacing.sm, borderBottomColor: tc.borderSubtle }]}>
          <TouchableOpacity onPress={resetCamera} style={[styles.backBtn, { backgroundColor: tc.bgSunken }]}>
            <ArrowLeft2 size={20} color={tc.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: tc.textPrimary }]}>Review Expenses</Text>
            <Text style={[styles.headerSub, { color: tc.textSecondary }]}>
              {merchant} · {scannedItems.length} item{scannedItems.length > 1 ? 's' : ''}
            </Text>
          </View>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Trip Selector — two modes */}
          {isLockedToTrip ? (
            /* Locked mode: from trip plugin — show a simple context banner */
            <View style={[styles.tripSelector, { backgroundColor: `${tc.primary}08`, borderColor: `${tc.primary}20` }]}>
              <Text style={[styles.tripSelectorLabel, { color: tc.primary }]}>Adding to trip:</Text>
              <View style={[styles.tripChip, { borderColor: tc.primary, backgroundColor: `${tc.primary}12` }]}>
                <Text style={styles.tripChipEmoji}>🟢</Text>
                <Text style={[styles.tripChipText, { color: tc.primary }]} numberOfLines={1}>
                  {allTrips.find(t => t.id === params.tripId)?.destination?.city
                    || allTrips.find(t => t.id === params.tripId)?.title
                    || 'Current Trip'}
                </Text>
              </View>
            </View>
          ) : (
            /* Open mode: from explore — user picks a trip or General */
            <View style={[styles.tripSelector, { backgroundColor: tc.bgCard, borderColor: tc.borderSubtle }]}>
              <Text style={[styles.tripSelectorLabel, { color: tc.textSecondary }]}>Add to:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tripChips}>
                {eligibleTrips.map(trip => {
                  const isSelected = selectedTripId === trip.id;
                  const tripName = trip.destination?.city || trip.title || 'Trip';
                  const stateLabel = trip.state === TripState.ONGOING ? '🟢' : trip.state === TripState.UPCOMING ? '📅' : '✅';
                  return (
                    <TouchableOpacity
                      key={trip.id}
                      style={[
                        styles.tripChip,
                        { borderColor: isSelected ? tc.primary : tc.borderSubtle, backgroundColor: isSelected ? `${tc.primary}12` : tc.bgSunken },
                      ]}
                      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSelectedTripId(trip.id); }}
                    >
                      <Text style={styles.tripChipEmoji}>{stateLabel}</Text>
                      <Text style={[styles.tripChipText, { color: isSelected ? tc.primary : tc.textPrimary }]} numberOfLines={1}>
                        {tripName}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
                {/* General Expense option — attaches to ongoing trip with "General expense" tag */}
                <TouchableOpacity
                  style={[
                    styles.tripChip,
                    { borderColor: selectedTripId === GENERAL_EXPENSE_ID ? tc.primary : tc.borderSubtle, backgroundColor: selectedTripId === GENERAL_EXPENSE_ID ? `${tc.primary}12` : tc.bgSunken },
                  ]}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSelectedTripId(GENERAL_EXPENSE_ID); }}
                >
                  <Text style={styles.tripChipEmoji}>💼</Text>
                  <Text style={[styles.tripChipText, { color: selectedTripId === GENERAL_EXPENSE_ID ? tc.primary : tc.textPrimary }]}>General</Text>
                </TouchableOpacity>
              </ScrollView>
              {eligibleTrips.length === 0 && (
                <Text style={[styles.noTripsHint, { color: tc.textTertiary }]}>
                  No active trips. Choose "General" or create a trip first.
                </Text>
              )}
            </View>
          )}

          {/* Confidence Badge */}
          <View style={[styles.confBadge, { backgroundColor: `${tc.primary}10` }]}>
            <Receipt1 size={16} color={tc.primary} variant="Bold" />
            <Text style={[styles.confText, { color: tc.primary }]}>
              {Math.round(confidence * 100)}% confidence · Tap items to remove
            </Text>
          </View>

          {/* Items List */}
          {scannedItems.map((item, index) => (
            <View
              key={index}
              style={[styles.itemCard, { backgroundColor: tc.bgCard, borderColor: tc.borderSubtle }]}
            >
              <View style={styles.itemLeft}>
                <Text style={styles.itemEmoji}>{CATEGORY_EMOJIS[item.category] || '📦'}</Text>
                <View style={styles.itemInfo}>
                  <Text style={[styles.itemDesc, { color: tc.textPrimary }]} numberOfLines={2}>
                    {item.description}
                  </Text>
                  <Text style={[styles.itemCat, { color: tc.textTertiary }]}>
                    {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                  </Text>
                </View>
              </View>
              <View style={styles.itemRight}>
                <Text style={[styles.itemAmount, { color: tc.textPrimary }]}>
                  ${item.amount.toFixed(2)}
                </Text>
                <TouchableOpacity onPress={() => handleRemoveItem(index)} style={styles.removeBtn}>
                  <Trash size={16} color={tc.error} variant="Bold" />
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {/* Total */}
          <View style={[styles.totalCard, { backgroundColor: tc.bgCard, borderColor: tc.borderSubtle }]}>
            <Text style={[styles.totalLabel, { color: tc.textSecondary }]}>Total</Text>
            <Text style={[styles.totalAmount, { color: tc.textPrimary }]}>
              ${itemsTotal.toFixed(2)}
            </Text>
          </View>
        </ScrollView>

        {/* Confirm Button */}
        <View style={[styles.bottomBar, { backgroundColor: tc.background, borderTopColor: tc.borderSubtle, paddingBottom: insets.bottom + spacing.sm }]}>
          <TouchableOpacity
            style={[styles.scanAgainBtn, { borderColor: tc.borderSubtle, backgroundColor: tc.bgCard }]}
            onPress={resetCamera}
          >
            <Camera size={18} color={tc.textPrimary} variant="Bold" />
            <Text style={[styles.scanAgainText, { color: tc.textPrimary }]}>Retake</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.confirmBtn, { backgroundColor: tc.primary, opacity: saving ? 0.6 : 1 }]}
            onPress={handleConfirmExpenses}
            disabled={saving || scannedItems.length === 0}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Add size={18} color="#FFF" variant="Bold" />
                <Text style={styles.confirmText}>
                  Add {scannedItems.length} Expense{scannedItems.length > 1 ? 's' : ''}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ─── Camera State ───
  return (
    <View style={[styles.container, { backgroundColor: '#000' }]}>
      <StatusBar style="light" />

      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
      >
        {/* Camera overlay */}
        <View style={[styles.cameraOverlay, { paddingTop: insets.top }]}>
          {/* Top bar */}
          <View style={styles.cameraTopBar}>
            <TouchableOpacity onPress={() => router.back()} style={styles.cameraBack}>
              <CloseCircle size={32} color="#FFF" variant="Bold" />
            </TouchableOpacity>
            <Text style={styles.cameraTitle}>Scan Receipt</Text>
            <View style={{ width: 32 }} />
          </View>

          {/* Guide text */}
          <View style={styles.cameraGuide}>
            <Text style={styles.cameraGuideText}>
              Position the receipt within the frame
            </Text>
          </View>

          {/* Frame guide */}
          <View style={styles.frameGuide}>
            <View style={[styles.frameCorner, styles.frameTopLeft]} />
            <View style={[styles.frameCorner, styles.frameTopRight]} />
            <View style={[styles.frameCorner, styles.frameBottomLeft]} />
            <View style={[styles.frameCorner, styles.frameBottomRight]} />
          </View>

          {/* Bottom controls */}
          <View style={[styles.cameraControls, { paddingBottom: insets.bottom + spacing.lg }]}>
            <TouchableOpacity onPress={handlePickImage} style={styles.galleryBtn}>
              <Gallery size={28} color="#FFF" variant="Bold" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleCapture} style={styles.captureBtn}>
              <View style={styles.captureBtnInner} />
            </TouchableOpacity>
            <View style={{ width: 48 }} />
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },

  // Permission
  permTitle: { fontSize: typography.fontSize.xl, fontWeight: '700', marginTop: spacing.lg, textAlign: 'center' },
  permSub: { fontSize: typography.fontSize.sm, marginTop: spacing.sm, textAlign: 'center' },
  permBtn: { marginTop: spacing.xl, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: 14 },
  permBtnText: { color: '#FFF', fontWeight: '700', fontSize: typography.fontSize.base },

  // Success
  successIcon: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center' },
  successTitle: { fontSize: typography.fontSize.xl, fontWeight: '700', marginTop: spacing.lg },
  successSub: { fontSize: typography.fontSize.sm, marginTop: spacing.sm },

  // Processing
  processingThumb: { width: 120, height: 160, borderRadius: 12, opacity: 0.6 },
  processingTitle: { fontSize: typography.fontSize.lg, fontWeight: '700', marginTop: spacing.md },
  processingSub: { fontSize: typography.fontSize.sm, marginTop: spacing.xs, textAlign: 'center' },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingBottom: spacing.md, gap: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: typography.fontSize.lg, fontWeight: '700' },
  headerSub: { fontSize: typography.fontSize.xs, marginTop: 2 },

  scroll: { flex: 1 },
  scrollContent: { padding: spacing.md, gap: 10 },

  // Confidence badge
  confBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: spacing.md, paddingVertical: 10, borderRadius: 12,
  },
  confText: { fontSize: typography.fontSize.xs, fontWeight: '600' },

  // Item cards
  itemCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: spacing.md, borderRadius: 14, borderWidth: 1,
  },
  itemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: spacing.sm },
  itemEmoji: { fontSize: 24 },
  itemInfo: { flex: 1 },
  itemDesc: { fontSize: typography.fontSize.sm, fontWeight: '600', lineHeight: 18 },
  itemCat: { fontSize: typography.fontSize.xs, marginTop: 2 },
  itemRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  itemAmount: { fontSize: typography.fontSize.base, fontWeight: '700' },
  removeBtn: { padding: 4 },

  // Trip selector
  tripSelector: {
    borderRadius: 14, borderWidth: 1, padding: spacing.md,
  },
  tripSelectorLabel: { fontSize: typography.fontSize.xs, fontWeight: '600', marginBottom: spacing.sm, letterSpacing: 0.3, textTransform: 'uppercase' },
  tripChips: { gap: 8 },
  tripChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5,
  },
  tripChipEmoji: { fontSize: 14 },
  tripChipText: { fontSize: typography.fontSize.sm, fontWeight: '600', maxWidth: 120 },
  noTripsHint: { fontSize: typography.fontSize.xs, marginTop: spacing.sm, textAlign: 'center' as const },

  // Total
  totalCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: spacing.md, borderRadius: 14, borderWidth: 1, marginTop: spacing.xs,
  },
  totalLabel: { fontSize: typography.fontSize.base, fontWeight: '600' },
  totalAmount: { fontSize: typography.fontSize.xl, fontWeight: '800' },

  // Bottom bar
  bottomBar: {
    flexDirection: 'row', gap: spacing.sm,
    paddingHorizontal: spacing.md, paddingTop: spacing.md, borderTopWidth: 1,
  },
  scanAgainBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 14, paddingHorizontal: spacing.lg, borderRadius: 14, borderWidth: 1,
  },
  scanAgainText: { fontWeight: '600', fontSize: typography.fontSize.sm },
  confirmBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, paddingVertical: 14, borderRadius: 14,
  },
  confirmText: { color: '#FFF', fontWeight: '700', fontSize: typography.fontSize.sm },

  // Camera
  camera: { flex: 1 },
  cameraOverlay: { flex: 1, justifyContent: 'space-between' },
  cameraTopBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingTop: spacing.md,
  },
  cameraBack: { padding: 4 },
  cameraTitle: { color: '#FFF', fontSize: typography.fontSize.lg, fontWeight: '700' },
  cameraGuide: { alignItems: 'center', paddingVertical: spacing.md },
  cameraGuideText: {
    color: 'rgba(255,255,255,0.8)', fontSize: typography.fontSize.sm,
    fontWeight: '500', textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm, borderRadius: 20,
  },

  // Frame guide corners
  frameGuide: {
    position: 'absolute', top: '20%', left: '10%', right: '10%', bottom: '30%',
  },
  frameCorner: {
    position: 'absolute', width: 30, height: 30,
    borderColor: '#FFF',
  },
  frameTopLeft: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 8 },
  frameTopRight: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 8 },
  frameBottomLeft: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 8 },
  frameBottomRight: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 8 },

  // Camera controls
  cameraControls: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    paddingHorizontal: spacing.xl,
  },
  galleryBtn: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  captureBtn: {
    width: 72, height: 72, borderRadius: 36,
    borderWidth: 4, borderColor: '#FFF',
    justifyContent: 'center', alignItems: 'center',
  },
  captureBtnInner: {
    width: 58, height: 58, borderRadius: 29,
    backgroundColor: '#FFF',
  },
});
