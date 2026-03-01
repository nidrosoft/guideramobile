import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { CloseCircle, Calendar, Add, DocumentUpload, TickCircle } from 'iconsax-react-native';
import { spacing, typography, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import Slider from '@react-native-community/slider';

interface AddClaimBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (claimData: any) => void;
}

export default function AddClaimBottomSheet({ visible, onClose, onSubmit }: AddClaimBottomSheetProps) {
  const { colors, isDark } = useTheme();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Step 1 - Claim Details
  const [incident, setIncident] = useState('');
  const [claimId, setClaimId] = useState('');
  const [provider, setProvider] = useState('');
  const [estimatedClaim, setEstimatedClaim] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [accuracy, setAccuracy] = useState(20);
  
  // Step 2 - Documents
  const [photos, setPhotos] = useState<string[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [additionalDocument, setAdditionalDocument] = useState('');

  if (!visible) return null;

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (!result.canceled) {
      setPhotos([...photos, ...result.assets.map(asset => asset.uri)]);
    }
  };

  const handlePickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      copyToCacheDirectory: true,
    });

    if (!result.canceled) {
      setDocuments([...documents, result.assets[0]]);
    }
  };

  const handleNextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setShowSuccess(true);
      
      // Auto close after success
      setTimeout(() => {
        onSubmit({
          incident,
          claimId,
          provider,
          estimatedClaim,
          date,
          accuracy,
          photos,
          documents,
          additionalDocument,
        });
        handleClose();
      }, 2000);
    }, 2000);
  };

  const handleClose = () => {
    setCurrentStep(1);
    setIncident('');
    setClaimId('');
    setProvider('');
    setEstimatedClaim('');
    setDate(new Date());
    setAccuracy(20);
    setPhotos([]);
    setDocuments([]);
    setAdditionalDocument('');
    setShowSuccess(false);
    onClose();
  };

  const progressPercentage = (currentStep / 3) * 100;

  // Success Screen
  if (showSuccess) {
    return (
      <BlurView intensity={20} style={styles.overlay}>
        <View style={[styles.successContainer, { backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF' }]}>
          <View style={styles.successIconContainer}>
            <TickCircle size={64} color="#10B981" variant="Bold" />
          </View>
          <Text style={[styles.successTitle, { color: colors.textPrimary }]}>Successfully Submitted!</Text>
          <Text style={[styles.successSubtitle, { color: colors.textSecondary }]}>
            You successfully submit your compensation, it will go to active later and our team will check it for you ASAP!
          </Text>
          <TouchableOpacity style={styles.continueButton} onPress={handleClose}>
            <Text style={styles.continueButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </BlurView>
    );
  }

  // Loading Screen
  if (isSubmitting) {
    return (
      <BlurView intensity={20} style={styles.overlay}>
        <View style={[styles.loadingContainer, { backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF' }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingPercentage, { color: colors.primary }]}>25%</Text>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Submitting Compensation</Text>
        </View>
      </BlurView>
    );
  }

  return (
    <BlurView intensity={20} style={styles.overlay}>
      <View style={[styles.bottomSheet, { backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF' }]}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: colors.textPrimary }]}>New Compensation</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Step {currentStep} of 3</Text>
          </View>
          <TouchableOpacity onPress={handleClose}>
            <CloseCircle size={28} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBarBackground, { backgroundColor: isDark ? '#2A2A2A' : '#F3F4F6' }]}>
            <View style={[styles.progressBarFill, { width: `${progressPercentage}%` }]} />
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Step 1: Claim Details */}
          {currentStep === 1 && (
            <View style={styles.stepContainer}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Incident</Text>
              <TextInput
                style={[styles.input, { backgroundColor: isDark ? '#2A2A2A' : '#F9FAFB', color: colors.textPrimary, borderColor: colors.borderSubtle }]}
                placeholder="Enter your incident"
                placeholderTextColor={colors.textTertiary}
                value={incident}
                onChangeText={setIncident}
              />

              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>ID</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: isDark ? '#2A2A2A' : '#F9FAFB', color: colors.textPrimary, borderColor: colors.borderSubtle }]}
                    placeholder="Enter ID"
                    placeholderTextColor={colors.textTertiary}
                    value={claimId}
                    onChangeText={setClaimId}
                  />
                </View>

                <View style={styles.halfInput}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Provider</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: isDark ? '#2A2A2A' : '#F9FAFB', color: colors.textPrimary, borderColor: colors.borderSubtle }]}
                    placeholder="Enter provider"
                    placeholderTextColor={colors.textTertiary}
                    value={provider}
                    onChangeText={setProvider}
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Estimated Claim</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: isDark ? '#2A2A2A' : '#F9FAFB', color: colors.textPrimary, borderColor: colors.borderSubtle }]}
                    placeholder="Enter estimated"
                    placeholderTextColor={colors.textTertiary}
                    value={estimatedClaim}
                    onChangeText={setEstimatedClaim}
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.halfInput}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Date</Text>
                  <TouchableOpacity
                    style={[styles.dateInput, { backgroundColor: isDark ? '#2A2A2A' : '#F9FAFB', borderColor: colors.borderSubtle }]}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Calendar size={20} color={colors.textSecondary} />
                    <Text style={[styles.dateText, { color: colors.textPrimary }]}>
                      {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={[styles.label, { color: colors.textSecondary }]}>Accuracy</Text>
              <View style={styles.sliderContainer}>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={100}
                  value={accuracy}
                  onValueChange={setAccuracy}
                  minimumTrackTintColor={colors.primary}
                  maximumTrackTintColor={isDark ? '#2A2A2A' : '#E5E7EB'}
                  thumbTintColor={colors.primary}
                  step={1}
                />
                <Text style={[styles.accuracyText, { color: colors.textPrimary }]}>{Math.round(accuracy)}%</Text>
              </View>
            </View>
          )}

          {/* Step 2: Upload Documents */}
          {currentStep === 2 && (
            <View style={styles.stepContainer}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Add Photos / Videos</Text>
              
              <View style={styles.photosGrid}>
                {photos.map((photo, index) => (
                  <Image key={index} source={{ uri: photo }} style={styles.photoThumbnail} />
                ))}
                <TouchableOpacity style={[styles.addPhotoButton, { backgroundColor: `${colors.primary}10` }]} onPress={handlePickImage}>
                  <Add size={32} color={colors.primary} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Add Additional Document</Text>
              <TextInput
                style={[styles.input, { backgroundColor: isDark ? '#2A2A2A' : '#F9FAFB', color: colors.textPrimary, borderColor: colors.borderSubtle }]}
                placeholder="Additional document"
                placeholderTextColor={colors.textTertiary}
                value={additionalDocument}
                onChangeText={setAdditionalDocument}
              />

              {documents.length > 0 && (
                <View style={styles.documentsContainer}>
                  {documents.map((doc, index) => (
                    <View key={index} style={[styles.documentItem, { backgroundColor: isDark ? '#2A2A2A' : '#F9FAFB' }]}>
                      <DocumentUpload size={20} color={colors.primary} />
                      <Text style={[styles.documentName, { color: colors.textPrimary }]}>{doc.name}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Step 3: Summary */}
          {currentStep === 3 && (
            <View style={styles.stepContainer}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Summary</Text>
              
              <View style={[styles.summaryRow, { borderBottomColor: colors.borderSubtle }]}>
                <Text style={[styles.summaryLabel, { color: colors.textTertiary }]}>Incident</Text>
                <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>{incident || 'N/A'}</Text>
              </View>

              <View style={[styles.summaryRow, { borderBottomColor: colors.borderSubtle }]}>
                <Text style={[styles.summaryLabel, { color: colors.textTertiary }]}>ID</Text>
                <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>{claimId || 'N/A'}</Text>
              </View>

              <View style={[styles.summaryRow, { borderBottomColor: colors.borderSubtle }]}>
                <Text style={[styles.summaryLabel, { color: colors.textTertiary }]}>Provider</Text>
                <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>{provider || 'N/A'}</Text>
              </View>

              <View style={[styles.summaryRow, { borderBottomColor: colors.borderSubtle }]}>
                <Text style={[styles.summaryLabel, { color: colors.textTertiary }]}>Estimated Claim</Text>
                <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>${estimatedClaim || '0'}</Text>
              </View>

              <View style={[styles.summaryRow, { borderBottomColor: colors.borderSubtle }]}>
                <Text style={[styles.summaryLabel, { color: colors.textTertiary }]}>Accuracy</Text>
                <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>{accuracy}%</Text>
              </View>

              <View style={[styles.summaryRow, { borderBottomColor: colors.borderSubtle }]}>
                <Text style={[styles.summaryLabel, { color: colors.textTertiary }]}>Media & Document</Text>
                <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>{photos.length + documents.length} Item</Text>
              </View>

              <View style={[styles.summaryRow, { borderBottomColor: colors.borderSubtle }]}>
                <Text style={[styles.summaryLabel, { color: colors.textTertiary }]}>Date</Text>
                <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>
                  {date.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Footer Buttons */}
        <View style={styles.footer}>
          {currentStep > 1 && (
            <TouchableOpacity style={[styles.backButton, { backgroundColor: isDark ? '#2A2A2A' : '#F3F4F6' }]} onPress={handlePreviousStep}>
              <Text style={[styles.backButtonText, { color: colors.textSecondary }]}>Back</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.nextButton, currentStep === 1 && styles.nextButtonFull]}
            onPress={currentStep === 3 ? handleSubmit : handleNextStep}
          >
            <Text style={styles.nextButtonText}>
              {currentStep === 3 ? 'Submit' : 'Next Step'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <BlurView intensity={20} style={styles.datePickerOverlay}>
          <View style={[styles.datePickerModal, { backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF' }]}>
            <Text style={[styles.datePickerTitle, { color: colors.textPrimary }]}>Select Date</Text>
            <DateTimePicker
              value={date}
              mode="date"
              display="spinner"
              onChange={(event, selectedDate) => {
                if (selectedDate) setDate(selectedDate);
              }}
              textColor={colors.textPrimary}
            />
            <TouchableOpacity
              style={styles.datePickerButton}
              onPress={() => setShowDatePicker(false)}
            >
              <Text style={styles.datePickerButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </BlurView>
      )}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  bottomSheet: {
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingBottom: spacing.xl,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: spacing.lg,
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
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  progressBarBackground: {
    height: 6,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#7C3AED',
    borderRadius: borderRadius.full,
  },
  content: {
    maxHeight: 500,
  },
  stepContainer: {
    paddingHorizontal: spacing.lg,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  input: {
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.fontSize.base,
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  halfInput: {
    flex: 1,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
  },
  dateText: {
    fontSize: typography.fontSize.base,
  },
  sliderContainer: {
    marginTop: spacing.md,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  accuracyText: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    marginBottom: spacing.md,
    marginTop: spacing.md,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  photoThumbnail: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.lg,
  },
  addPhotoButton: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  documentsContainer: {
    marginTop: spacing.md,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  documentName: {
    fontSize: typography.fontSize.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  summaryLabel: {
    fontSize: typography.fontSize.sm,
  },
  summaryValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  backButton: {
    flex: 1,
    paddingVertical: spacing.md + 2,
    borderRadius: borderRadius.full,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
  },
  nextButton: {
    flex: 2,
    paddingVertical: spacing.md + 2,
    borderRadius: borderRadius.full,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
  },
  nextButtonFull: {
    flex: 1,
  },
  nextButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  loadingContainer: {
    borderRadius: borderRadius.xl,
    padding: spacing.xl * 2,
    marginHorizontal: spacing.xl,
    alignItems: 'center',
  },
  loadingPercentage: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: '700',
    marginTop: spacing.lg,
  },
  loadingText: {
    fontSize: typography.fontSize.base,
    marginTop: spacing.sm,
  },
  successContainer: {
    borderRadius: borderRadius.xl,
    padding: spacing.xl * 2,
    marginHorizontal: spacing.xl,
    alignItems: 'center',
  },
  successIconContainer: {
    marginBottom: spacing.lg,
  },
  successTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  successSubtitle: {
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 20,
  },
  continueButton: {
    width: '100%',
    paddingVertical: spacing.md + 2,
    borderRadius: borderRadius.full,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  datePickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
  },
  datePickerModal: {
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginHorizontal: spacing.xl,
    width: '85%',
  },
  datePickerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  datePickerButton: {
    backgroundColor: '#7C3AED',
    paddingVertical: spacing.md + 2,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  datePickerButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
