import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { CloseCircle, Calendar } from 'iconsax-react-native';
import { spacing, typography, colors } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import DateTimePicker from '@react-native-community/datetimepicker';

const CLAIM_TYPES = [
  { id: 'flight_delay', name: 'Flight Delay', emoji: '⏰', color: '#F59E0B' },
  { id: 'flight_cancellation', name: 'Cancellation', emoji: '❌', color: '#EF4444' },
  { id: 'overbooking', name: 'Overbooking', emoji: '🎫', color: '#8B5CF6' },
  { id: 'denied_boarding', name: 'Denied Boarding', emoji: '🚫', color: '#DC2626' },
  { id: 'missed_connection', name: 'Missed Connection', emoji: '🔗', color: '#F97316' },
  { id: 'downgrade', name: 'Downgrade', emoji: '⬇️', color: '#A855F7' },
  { id: 'lost_baggage', name: 'Lost Baggage', emoji: '🧳', color: '#EC4899' },
  { id: 'damaged_baggage', name: 'Damaged Baggage', emoji: '💼', color: '#F97316' },
  { id: 'hotel_issue', name: 'Hotel Issue', emoji: '🏨', color: '#06B6D4' },
  { id: 'other', name: 'Other', emoji: '📋', color: '#6B7280' },
];

const CURRENCIES = [
  { code: 'USD', symbol: '$' },
  { code: 'EUR', symbol: '€' },
  { code: 'GBP', symbol: '£' },
  { code: 'CAD', symbol: 'C$' },
  { code: 'AUD', symbol: 'A$' },
];

interface AddClaimBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (claimData: any) => void;
}

export default function AddClaimBottomSheet({ visible, onClose, onSubmit }: AddClaimBottomSheetProps) {
  const { colors: tc } = useTheme();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1 — Type & Flight Details
  const [type, setType] = useState('flight_delay');
  const [provider, setProvider] = useState('');
  const [flightNumber, setFlightNumber] = useState('');
  const [bookingReference, setBookingReference] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Step 2 — Details & Amount
  const [description, setDescription] = useState('');
  const [reason, setReason] = useState('');
  const [estimatedAmount, setEstimatedAmount] = useState('');
  const [currency, setCurrency] = useState('USD');

  const resetForm = () => {
    setCurrentStep(1);
    setType('flight_delay');
    setProvider('');
    setFlightNumber('');
    setBookingReference('');
    setDate(new Date());
    setDescription('');
    setReason('');
    setEstimatedAmount('');
    setCurrency('USD');
    setIsSubmitting(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const canProceedStep1 = type && provider.trim();
  const canSubmit = description.trim();

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        type,
        provider: provider.trim(),
        flightNumber: flightNumber.trim() || undefined,
        bookingReference: bookingReference.trim() || undefined,
        date,
        estimatedAmount: estimatedAmount ? parseFloat(estimatedAmount) : 0,
        currency,
        description: description.trim(),
        reason: reason.trim() || description.trim(),
      });
      resetForm();
    } catch (err) {
      setIsSubmitting(false);
      console.error('Failed to submit claim:', err);
    }
  };

  const selectedType = CLAIM_TYPES.find(t => t.id === type);
  const progressPercentage = (currentStep / 2) * 100;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        />

        <View style={[styles.bottomSheet, { backgroundColor: tc.bgModal }]}>
          {/* Handle Bar */}
          <View style={[styles.handleBar, { backgroundColor: tc.borderMedium }]} />

          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.title, { color: tc.textPrimary }]}>New Claim</Text>
              <Text style={[styles.subtitle, { color: tc.textSecondary }]}>Step {currentStep} of 2</Text>
            </View>
            <TouchableOpacity onPress={handleClose}>
              <CloseCircle size={28} color={tc.textTertiary} />
            </TouchableOpacity>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBarBg, { backgroundColor: tc.bgInput }]}>
              <View style={[styles.progressBarFill, { width: `${progressPercentage}%`, backgroundColor: tc.primary }]} />
            </View>
          </View>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* ── Step 1: Type + Flight Info ── */}
            {currentStep === 1 && (
              <View style={styles.stepContainer}>
                <Text style={[styles.label, { color: tc.textPrimary }]}>Claim Type</Text>
                <View style={styles.typeGrid}>
                  {CLAIM_TYPES.map(ct => (
                    <TouchableOpacity
                      key={ct.id}
                      style={[
                        styles.typeChip,
                        { backgroundColor: tc.bgInput, borderColor: 'transparent' },
                        type === ct.id && { borderColor: ct.color, backgroundColor: `${ct.color}15` },
                      ]}
                      onPress={() => setType(ct.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.typeEmoji}>{ct.emoji}</Text>
                      <Text style={[
                        styles.typeChipText,
                        { color: tc.textSecondary },
                        type === ct.id && { color: ct.color },
                      ]}>{ct.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={[styles.label, { color: tc.textPrimary, marginTop: spacing.lg }]}>Airline / Provider</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: tc.bgInput, borderColor: tc.borderMedium, color: tc.textPrimary }]}
                  placeholder="e.g. British Airways, Lufthansa"
                  placeholderTextColor={tc.textTertiary}
                  value={provider}
                  onChangeText={setProvider}
                />

                <View style={styles.row}>
                  <View style={styles.halfInput}>
                    <Text style={[styles.label, { color: tc.textPrimary }]}>Flight Number</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: tc.bgInput, borderColor: tc.borderMedium, color: tc.textPrimary }]}
                      placeholder="e.g. BA437"
                      placeholderTextColor={tc.textTertiary}
                      value={flightNumber}
                      onChangeText={setFlightNumber}
                      autoCapitalize="characters"
                    />
                  </View>
                  <View style={styles.halfInput}>
                    <Text style={[styles.label, { color: tc.textPrimary }]}>Booking Ref</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: tc.bgInput, borderColor: tc.borderMedium, color: tc.textPrimary }]}
                      placeholder="e.g. ABC123"
                      placeholderTextColor={tc.textTertiary}
                      value={bookingReference}
                      onChangeText={setBookingReference}
                      autoCapitalize="characters"
                    />
                  </View>
                </View>

                <Text style={[styles.label, { color: tc.textPrimary }]}>Date of Incident</Text>
                <TouchableOpacity
                  style={[styles.dateInput, { backgroundColor: tc.bgInput, borderColor: tc.borderMedium }]}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Calendar size={20} color={tc.textSecondary} />
                  <Text style={[styles.dateText, { color: tc.textPrimary }]}>
                    {date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </Text>
                </TouchableOpacity>

                {showDatePicker && (
                  <View style={[styles.datePickerInline, { backgroundColor: tc.bgInput, borderColor: tc.borderMedium }]}>
                    <DateTimePicker
                      value={date}
                      mode="date"
                      display="spinner"
                      onChange={(event, selectedDate) => {
                        if (selectedDate) setDate(selectedDate);
                      }}
                      textColor={tc.textPrimary}
                      maximumDate={new Date()}
                    />
                    <TouchableOpacity
                      style={[styles.datePickerDone, { backgroundColor: tc.primary }]}
                      onPress={() => setShowDatePicker(false)}
                    >
                      <Text style={styles.datePickerDoneText}>Done</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            {/* ── Step 2: Description + Amount ── */}
            {currentStep === 2 && (
              <View style={styles.stepContainer}>
                {/* Selected type badge */}
                {selectedType && (
                  <View style={[styles.selectedTypeBadge, { backgroundColor: `${selectedType.color}15` }]}>
                    <Text style={styles.typeEmoji}>{selectedType.emoji}</Text>
                    <Text style={[styles.selectedTypeText, { color: selectedType.color }]}>{selectedType.name}</Text>
                    {flightNumber ? <Text style={[styles.selectedTypeFlight, { color: tc.textSecondary }]}> — {flightNumber}</Text> : null}
                  </View>
                )}

                <Text style={[styles.label, { color: tc.textPrimary }]}>What happened?</Text>
                <TextInput
                  style={[styles.input, styles.multilineInput, { backgroundColor: tc.bgInput, borderColor: tc.borderMedium, color: tc.textPrimary }]}
                  placeholder="Describe the incident — e.g. Flight was delayed 4 hours at departure, no communication from airline..."
                  placeholderTextColor={tc.textTertiary}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />

                <Text style={[styles.label, { color: tc.textPrimary }]}>Reason Given by Airline (Optional)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: tc.bgInput, borderColor: tc.borderMedium, color: tc.textPrimary }]}
                  placeholder="e.g. Technical issue, weather, operational reasons"
                  placeholderTextColor={tc.textTertiary}
                  value={reason}
                  onChangeText={setReason}
                />

                <Text style={[styles.label, { color: tc.textPrimary }]}>Estimated Compensation</Text>
                <View style={styles.amountRow}>
                  <View style={styles.currencyPicker}>
                    {CURRENCIES.map(cur => (
                      <TouchableOpacity
                        key={cur.code}
                        style={[
                          styles.currencyChip,
                          { backgroundColor: tc.bgInput, borderColor: tc.borderMedium },
                          currency === cur.code && { backgroundColor: `${tc.primary}15`, borderColor: tc.primary },
                        ]}
                        onPress={() => setCurrency(cur.code)}
                      >
                        <Text style={[
                          styles.currencyChipText,
                          { color: tc.textSecondary },
                          currency === cur.code && { color: tc.primary },
                        ]}>{cur.code}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TextInput
                    style={[styles.input, styles.amountInput, { backgroundColor: tc.bgInput, borderColor: tc.borderMedium, color: tc.textPrimary }]}
                    placeholder="0.00"
                    placeholderTextColor={tc.textTertiary}
                    value={estimatedAmount}
                    onChangeText={setEstimatedAmount}
                    keyboardType="decimal-pad"
                  />
                </View>

                <View style={[styles.infoBox, { backgroundColor: `${tc.info}10`, borderColor: `${tc.info}20` }]}>
                  <Text style={[styles.infoText, { color: tc.textSecondary }]}>
                    Not sure about the amount? Leave it empty — our AI will calculate your eligible compensation based on the applicable regulation (EU261, UK261, APPR, etc.) once the claim is analyzed.
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Footer Buttons */}
          <View style={styles.footer}>
            {currentStep > 1 && (
              <TouchableOpacity
                style={[styles.backButton, { backgroundColor: tc.bgInput }]}
                onPress={() => setCurrentStep(1)}
              >
                <Text style={[styles.backButtonText, { color: tc.textSecondary }]}>Back</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                styles.nextButton,
                { backgroundColor: tc.primary },
                currentStep === 1 && styles.nextButtonFull,
                currentStep === 1 && !canProceedStep1 && { opacity: 0.5 },
                currentStep === 2 && !canSubmit && { opacity: 0.5 },
              ]}
              onPress={currentStep === 2 ? handleSubmit : () => setCurrentStep(2)}
              disabled={
                isSubmitting ||
                (currentStep === 1 && !canProceedStep1) ||
                (currentStep === 2 && !canSubmit)
              }
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color={tc.white} />
              ) : (
                <Text style={styles.nextButtonText}>
                  {currentStep === 2 ? 'Submit Claim' : 'Next'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  bottomSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: spacing.xl,
    maxHeight: '90%',
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
  },
  progressBarContainer: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  content: {
    maxHeight: 500,
  },
  stepContainer: {
    paddingHorizontal: spacing.xl,
  },
  label: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  input: {
    borderRadius: 12,
    padding: spacing.md,
    fontSize: typography.fontSize.base,
    borderWidth: 1,
  },
  multilineInput: {
    minHeight: 100,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  halfInput: {
    flex: 1,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeEmoji: {
    fontSize: 16,
    marginRight: spacing.xs,
  },
  typeChipText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '500',
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
  },
  dateText: {
    fontSize: typography.fontSize.base,
  },
  datePickerInline: {
    marginTop: spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    paddingBottom: spacing.sm,
  },
  datePickerDone: {
    marginHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 10,
    alignItems: 'center',
  },
  datePickerDoneText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
    color: colors.white,
  },
  selectedTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    marginBottom: spacing.sm,
  },
  selectedTypeText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
  selectedTypeFlight: {
    fontSize: typography.fontSize.sm,
  },
  amountRow: {
    gap: spacing.sm,
  },
  currencyPicker: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  currencyChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    borderWidth: 1,
  },
  currencyChipText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
  },
  amountInput: {
    flex: 1,
  },
  infoBox: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
  },
  infoText: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  backButton: {
    flex: 1,
    paddingVertical: spacing.md + 2,
    borderRadius: 16,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
  },
  nextButton: {
    flex: 2,
    paddingVertical: spacing.md + 2,
    borderRadius: 16,
    alignItems: 'center',
  },
  nextButtonFull: {
    flex: 1,
  },
  nextButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: '700',
    color: colors.white,
  },
});
