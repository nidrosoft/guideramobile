/**
 * SAFETY REPORT SHEET
 *
 * Waze-style incident reporting bottom sheet.
 * User taps Report → picks incident type → adds optional note → submits.
 * Report is saved to Supabase and instantly visible to nearby users on the map.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CloseCircle, TickCircle } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { supabase } from '@/lib/supabase/client';

interface SafetyReportSheetProps {
  visible: boolean;
  userLocation: { latitude: number; longitude: number } | null;
  onClose: () => void;
  onSubmit: () => void;
}

const REPORT_TYPES = [
  { id: 'theft', emoji: String.fromCodePoint(0x1F6A8), label: 'Theft / Pickpocket', severity: 'high', defaultDuration: '1w' },
  { id: 'scam', emoji: String.fromCodePoint(0x26A0), label: 'Scam / Fraud', severity: 'medium', defaultDuration: '1w' },
  { id: 'unsafe_area', emoji: String.fromCodePoint(0x1F6AB), label: 'Unsafe Area', severity: 'high', defaultDuration: 'permanent' },
  { id: 'harassment', emoji: String.fromCodePoint(0x1F645), label: 'Harassment', severity: 'high', defaultDuration: '24h' },
  { id: 'traffic', emoji: String.fromCodePoint(0x1F6A7), label: 'Traffic Hazard', severity: 'low', defaultDuration: '2h' },
  { id: 'natural', emoji: String.fromCodePoint(0x1F30A), label: 'Natural Hazard', severity: 'critical', defaultDuration: '1w' },
  { id: 'health', emoji: String.fromCodePoint(0x1F3E5), label: 'Health Risk', severity: 'medium', defaultDuration: '1w' },
  { id: 'police', emoji: String.fromCodePoint(0x1F46E), label: 'Police Activity', severity: 'low', defaultDuration: '2h' },
  { id: 'protest', emoji: String.fromCodePoint(0x270A), label: 'Protest / Unrest', severity: 'high', defaultDuration: '6h' },
  { id: 'other', emoji: String.fromCodePoint(0x2753), label: 'Other', severity: 'low', defaultDuration: '24h' },
];

const DURATION_OPTIONS = [
  { id: '2h', label: '2 hours', hours: 2 },
  { id: '6h', label: '6 hours', hours: 6 },
  { id: '24h', label: '24 hours', hours: 24 },
  { id: '1w', label: '1 week', hours: 168 },
  { id: 'permanent', label: 'Permanent', hours: 8760 }, // ~1 year
];

export default function SafetyReportSheet({ visible, userLocation, onClose, onSubmit }: SafetyReportSheetProps) {
  const { colors: tc } = useTheme();
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const toast = useToast();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<string>('24h');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Auto-set duration when type changes
  const handleSelectType = (typeId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedType(typeId);
    const type = REPORT_TYPES.find(t => t.id === typeId);
    if (type) setSelectedDuration(type.defaultDuration);
  };

  const handleSubmit = async () => {
    if (!selectedType) {
      Alert.alert('Select Type', 'Please select the type of incident to report.');
      return;
    }
    if (!userLocation) {
      toast.showError('Could not determine your location.');
      return;
    }

    setSubmitting(true);
    try {
      const reportType = REPORT_TYPES.find(t => t.id === selectedType);

      // Calculate expiry based on selected duration
      const durationOpt = DURATION_OPTIONS.find(d => d.id === selectedDuration);
      const expiryMs = (durationOpt?.hours || 24) * 60 * 60 * 1000;
      const expiresAt = new Date(Date.now() + expiryMs).toISOString();

      // Save to safety_alerts table so it shows on the map for ALL users
      await supabase.from('safety_alerts').insert({
        user_id: profile?.id,
        type: selectedType,
        level: reportType?.severity || 'medium',
        title: `${reportType?.label || 'Incident'} reported`,
        description: note.trim() || `${reportType?.label} reported by a traveler in this area.`,
        location: 'User Report',
        coordinates: { latitude: userLocation.latitude, longitude: userLocation.longitude },
        source: 'user_report',
        ai_generated: false,
        valid_from: new Date().toISOString(),
        valid_until: expiresAt,
      });

      // Also save to safety_zone_alerts for the reporting user's history
      await supabase.from('safety_zone_alerts').insert({
        user_id: profile?.id,
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        radius_meters: 500,
        risk_level: reportType?.severity || 'medium',
        risk_score: reportType?.severity === 'critical' ? 80 : reportType?.severity === 'high' ? 60 : 30,
        alerts: [{
          id: `report-${Date.now()}`,
          type: selectedType,
          level: reportType?.severity,
          title: reportType?.label,
          description: note.trim() || reportType?.label,
          source: 'user_report',
        }],
        summary: `You reported: ${reportType?.label}`,
        source: 'user_report',
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      toast.showSuccess('Report submitted! Nearby travelers will be alerted.');
      setSelectedType(null);
      setNote('');
      onSubmit();
    } catch (err: any) {
      toast.showError(err?.message || 'Could not submit report. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!visible) return null;

  const durationLabel = DURATION_OPTIONS.find(d => d.id === selectedDuration)?.label || '24 hours';

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          style={styles.overlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={[styles.sheet, { backgroundColor: tc.background, paddingBottom: insets.bottom + spacing.md }]}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={[styles.headerTitle, { color: tc.textPrimary }]}>Report Incident</Text>
              <TouchableOpacity onPress={onClose}>
                <CloseCircle size={28} color={tc.textTertiary} variant="Bold" />
              </TouchableOpacity>
            </View>
            <Text style={[styles.headerSub, { color: tc.textSecondary }]}>
              Help keep travelers safe. Your report is visible to nearby users.
            </Text>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
              {/* Type Grid */}
              <Text style={[styles.label, { color: tc.textPrimary }]}>What happened?</Text>
              <View style={styles.typeGrid}>
                {REPORT_TYPES.map(type => {
                  const isActive = selectedType === type.id;
                  return (
                    <TouchableOpacity
                      key={type.id}
                      style={[
                        styles.typeCard,
                        { backgroundColor: tc.bgElevated, borderColor: isActive ? tc.primary : tc.borderSubtle },
                      ]}
                      onPress={() => handleSelectType(type.id)}
                    >
                      <Text style={styles.typeEmoji}>{type.emoji}</Text>
                      <Text style={[styles.typeLabel, { color: isActive ? tc.primary : tc.textSecondary }]} numberOfLines={1}>
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Duration Picker */}
              <Text style={[styles.label, { color: tc.textPrimary }]}>How long will this last?</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.durationScroll}>
                {DURATION_OPTIONS.map(opt => {
                  const isActive = selectedDuration === opt.id;
                  return (
                    <TouchableOpacity
                      key={opt.id}
                      style={[
                        styles.durationChip,
                        { backgroundColor: isActive ? tc.primary : tc.bgElevated, borderColor: isActive ? tc.primary : tc.borderSubtle },
                      ]}
                      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSelectedDuration(opt.id); }}
                    >
                      <Text style={[styles.durationText, { color: isActive ? '#FFFFFF' : tc.textSecondary }]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Note */}
              <Text style={[styles.label, { color: tc.textPrimary }]}>Add details (optional)</Text>
              <TextInput
                style={[styles.noteInput, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle, color: tc.textPrimary }]}
                placeholder="What should others know?"
                placeholderTextColor={tc.textTertiary}
                value={note}
                onChangeText={setNote}
                multiline
                numberOfLines={2}
                maxLength={200}
              />
            </ScrollView>

            {/* Submit */}
            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: selectedType ? '#EF4444' : tc.borderSubtle }]}
              onPress={handleSubmit}
              disabled={!selectedType || submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <TickCircle size={20} color="#FFFFFF" variant="Bold" />
                  <Text style={styles.submitText}>Submit Report ({durationLabel})</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.lg,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  headerSub: { fontSize: 13, marginBottom: spacing.lg, lineHeight: 18 },
  scrollContent: { paddingBottom: spacing.lg },
  label: { fontSize: 15, fontWeight: '600', marginBottom: spacing.sm },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  typeCard: {
    flexBasis: '30%',
    flexGrow: 1,
    maxWidth: '32%',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  typeEmoji: { fontSize: 24, marginBottom: 4 },
  typeLabel: { fontSize: 11, fontWeight: '500', textAlign: 'center' },
  noteInput: {
    borderRadius: 14,
    padding: spacing.md,
    fontSize: 14,
    borderWidth: 1,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
    marginTop: spacing.md,
  },
  submitText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  durationScroll: {
    gap: 8,
    marginBottom: spacing.lg,
  },
  durationChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  durationText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
