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
import { colors, spacing, typography, borderRadius } from '@/styles';
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
        <View style={styles.successContainer}>
          <View style={styles.successIconContainer}>
            <TickCircle size={64} color={colors.success} variant="Bold" />
          </View>
          <Text style={styles.successTitle}>Successfully Submitted!</Text>
          <Text style={styles.successSubtitle}>
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
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingPercentage}>25%</Text>
          <Text style={styles.loadingText}>Submitting Compensation</Text>
        </View>
      </BlurView>
    );
  }

  return (
    <BlurView intensity={20} style={styles.overlay}>
      <View style={styles.bottomSheet}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>New Compensation</Text>
            <Text style={styles.subtitle}>Step {currentStep} of 3</Text>
          </View>
          <TouchableOpacity onPress={handleClose}>
            <CloseCircle size={28} color={colors.gray400} />
          </TouchableOpacity>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: `${progressPercentage}%` }]} />
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Step 1: Claim Details */}
          {currentStep === 1 && (
            <View style={styles.stepContainer}>
              <Text style={styles.label}>Incident</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your incident"
                placeholderTextColor={colors.gray400}
                value={incident}
                onChangeText={setIncident}
              />

              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>ID</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter ID"
                    placeholderTextColor={colors.gray400}
                    value={claimId}
                    onChangeText={setClaimId}
                  />
                </View>

                <View style={styles.halfInput}>
                  <Text style={styles.label}>Provider</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter provider"
                    placeholderTextColor={colors.gray400}
                    value={provider}
                    onChangeText={setProvider}
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>Estimated Claim</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter estimated"
                    placeholderTextColor={colors.gray400}
                    value={estimatedClaim}
                    onChangeText={setEstimatedClaim}
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.halfInput}>
                  <Text style={styles.label}>Date</Text>
                  <TouchableOpacity
                    style={styles.dateInput}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Calendar size={20} color={colors.gray600} />
                    <Text style={styles.dateText}>
                      {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={styles.label}>Accuracy</Text>
              <View style={styles.sliderContainer}>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={100}
                  value={accuracy}
                  onValueChange={setAccuracy}
                  minimumTrackTintColor={colors.primary}
                  maximumTrackTintColor={colors.gray200}
                  thumbTintColor={colors.primary}
                  step={1}
                />
                <Text style={styles.accuracyText}>{Math.round(accuracy)}%</Text>
              </View>
            </View>
          )}

          {/* Step 2: Upload Documents */}
          {currentStep === 2 && (
            <View style={styles.stepContainer}>
              <Text style={styles.sectionTitle}>Add Photos / Videos</Text>
              
              <View style={styles.photosGrid}>
                {photos.map((photo, index) => (
                  <Image key={index} source={{ uri: photo }} style={styles.photoThumbnail} />
                ))}
                <TouchableOpacity style={styles.addPhotoButton} onPress={handlePickImage}>
                  <Add size={32} color={colors.primary} />
                </TouchableOpacity>
              </View>

              <Text style={styles.sectionTitle}>Add Additional Document</Text>
              <TextInput
                style={styles.input}
                placeholder="Additional document"
                placeholderTextColor={colors.gray400}
                value={additionalDocument}
                onChangeText={setAdditionalDocument}
              />

              {documents.length > 0 && (
                <View style={styles.documentsContainer}>
                  {documents.map((doc, index) => (
                    <View key={index} style={styles.documentItem}>
                      <DocumentUpload size={20} color={colors.primary} />
                      <Text style={styles.documentName}>{doc.name}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Step 3: Summary */}
          {currentStep === 3 && (
            <View style={styles.stepContainer}>
              <Text style={styles.sectionTitle}>Summary</Text>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Incident</Text>
                <Text style={styles.summaryValue}>{incident || 'N/A'}</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>ID</Text>
                <Text style={styles.summaryValue}>{claimId || 'N/A'}</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Provider</Text>
                <Text style={styles.summaryValue}>{provider || 'N/A'}</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Estimated Claim</Text>
                <Text style={styles.summaryValue}>${estimatedClaim || '0'}</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Accuracy</Text>
                <Text style={styles.summaryValue}>{accuracy}%</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Media & Document</Text>
                <Text style={styles.summaryValue}>{photos.length + documents.length} Item</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Date</Text>
                <Text style={styles.summaryValue}>
                  {date.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Footer Buttons */}
        <View style={styles.footer}>
          {currentStep > 1 && (
            <TouchableOpacity style={styles.backButton} onPress={handlePreviousStep}>
              <Text style={styles.backButtonText}>Back</Text>
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
          <View style={styles.datePickerModal}>
            <Text style={styles.datePickerTitle}>Select Date</Text>
            <DateTimePicker
              value={date}
              mode="date"
              display="spinner"
              onChange={(event, selectedDate) => {
                if (selectedDate) setDate(selectedDate);
              }}
              textColor={colors.gray900}
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
    backgroundColor: colors.white,
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
    color: colors.gray900,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.gray500,
  },
  progressBarContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: colors.gray100,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
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
    color: colors.gray700,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  input: {
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.gray900,
    borderWidth: 1,
    borderColor: colors.gray200,
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
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  dateText: {
    fontSize: typography.fontSize.base,
    color: colors.gray900,
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
    color: colors.gray900,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.gray700,
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
    backgroundColor: `${colors.primary}10`,
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
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  documentName: {
    fontSize: typography.fontSize.sm,
    color: colors.gray900,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  summaryLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.gray500,
  },
  summaryValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.gray900,
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
    backgroundColor: colors.gray100,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.gray700,
  },
  nextButton: {
    flex: 2,
    paddingVertical: spacing.md + 2,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
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
  loadingContainer: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.xl * 2,
    marginHorizontal: spacing.xl,
    alignItems: 'center',
  },
  loadingPercentage: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: '700',
    color: colors.primary,
    marginTop: spacing.lg,
  },
  loadingText: {
    fontSize: typography.fontSize.base,
    color: colors.gray600,
    marginTop: spacing.sm,
  },
  successContainer: {
    backgroundColor: colors.white,
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
    color: colors.gray900,
    marginBottom: spacing.md,
  },
  successSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.gray600,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 20,
  },
  continueButton: {
    width: '100%',
    paddingVertical: spacing.md + 2,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: '700',
    color: colors.white,
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
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginHorizontal: spacing.xl,
    width: '85%',
  },
  datePickerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: colors.gray900,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  datePickerButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md + 2,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  datePickerButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: '700',
    color: colors.white,
  },
});
