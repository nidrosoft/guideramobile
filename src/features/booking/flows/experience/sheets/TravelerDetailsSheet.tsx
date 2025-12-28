/**
 * TRAVELER DETAILS SHEET
 * 
 * Full bottom sheet for entering traveler information.
 * Supports adding multiple travelers - matches flight TravelerDetailsSheet.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CloseCircle,
  User,
  Sms,
  Call,
  Add,
  Trash,
  TickCircle,
  ArrowDown2,
  ArrowUp2,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography, borderRadius } from '@/styles';

interface Traveler {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface TravelerDetailsSheetProps {
  visible: boolean;
  onClose: () => void;
  travelers: Traveler[];
  onSaveTravelers: (travelers: Traveler[]) => void;
}

const createEmptyTraveler = (): Traveler => ({
  id: Date.now().toString(),
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
});

export default function TravelerDetailsSheet({
  visible,
  onClose,
  travelers,
  onSaveTravelers,
}: TravelerDetailsSheetProps) {
  const insets = useSafeAreaInsets();
  const [localTravelers, setLocalTravelers] = useState<Traveler[]>(
    travelers.length > 0 ? travelers : [createEmptyTraveler()]
  );
  const [expandedTraveler, setExpandedTraveler] = useState<string | null>(
    localTravelers[0]?.id || null
  );

  const handleAddTraveler = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newTraveler = createEmptyTraveler();
    setLocalTravelers(prev => [...prev, newTraveler]);
    setExpandedTraveler(newTraveler.id);
  };

  const handleRemoveTraveler = (id: string) => {
    if (localTravelers.length <= 1) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLocalTravelers(prev => prev.filter(t => t.id !== id));
    if (expandedTraveler === id) {
      setExpandedTraveler(localTravelers[0]?.id || null);
    }
  };

  const handleUpdateTraveler = (id: string, field: keyof Traveler, value: string) => {
    setLocalTravelers(prev =>
      prev.map(t => (t.id === id ? { ...t, [field]: value } : t))
    );
  };

  const handleConfirm = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSaveTravelers(localTravelers);
    onClose();
  };

  const isTravelerComplete = (traveler: Traveler) => {
    return !!(traveler.firstName && traveler.lastName && traveler.email);
  };

  const allTravelersComplete = localTravelers.every(isTravelerComplete);

  const formatPhone = (value: string): string => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.innerContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Traveler Details</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <CloseCircle size={28} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {localTravelers.map((traveler, index) => {
              const isExpanded = expandedTraveler === traveler.id;
              const isComplete = isTravelerComplete(traveler);
              
              return (
                <View key={traveler.id} style={styles.travelerCard}>
                  {/* Traveler Header */}
                  <TouchableOpacity
                    style={styles.travelerHeader}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setExpandedTraveler(isExpanded ? null : traveler.id);
                    }}
                  >
                    <View style={styles.travelerHeaderLeft}>
                      <View style={[styles.travelerIcon, isComplete && styles.travelerIconComplete]}>
                        {isComplete ? (
                          <TickCircle size={20} color={colors.white} variant="Bold" />
                        ) : (
                          <User size={20} color={colors.white} variant="Bold" />
                        )}
                      </View>
                      <View>
                        <Text style={styles.travelerTitle}>
                          {traveler.firstName && traveler.lastName
                            ? `${traveler.firstName} ${traveler.lastName}`
                            : `Traveler ${index + 1}`}
                        </Text>
                        {isComplete && (
                          <Text style={styles.travelerEmail}>{traveler.email}</Text>
                        )}
                      </View>
                    </View>
                    <View style={styles.travelerHeaderRight}>
                      {localTravelers.length > 1 && (
                        <TouchableOpacity
                          style={styles.removeButton}
                          onPress={() => handleRemoveTraveler(traveler.id)}
                        >
                          <Trash size={18} color={colors.error} />
                        </TouchableOpacity>
                      )}
                      {isExpanded ? (
                        <ArrowUp2 size={20} color={colors.gray400} />
                      ) : (
                        <ArrowDown2 size={20} color={colors.gray400} />
                      )}
                    </View>
                  </TouchableOpacity>

                  {/* Traveler Form */}
                  {isExpanded && (
                    <View style={styles.travelerForm}>
                      <View style={styles.inputRow}>
                        <View style={[styles.inputGroup, { flex: 1, marginRight: spacing.sm }]}>
                          <Text style={styles.inputLabel}>First Name *</Text>
                          <View style={styles.inputContainer}>
                            <User size={18} color={colors.gray400} />
                            <TextInput
                              style={styles.input}
                              value={traveler.firstName}
                              onChangeText={(v) => handleUpdateTraveler(traveler.id, 'firstName', v)}
                              placeholder="John"
                              placeholderTextColor={colors.gray400}
                              autoCapitalize="words"
                            />
                          </View>
                        </View>
                        <View style={[styles.inputGroup, { flex: 1 }]}>
                          <Text style={styles.inputLabel}>Last Name *</Text>
                          <View style={styles.inputContainer}>
                            <User size={18} color={colors.gray400} />
                            <TextInput
                              style={styles.input}
                              value={traveler.lastName}
                              onChangeText={(v) => handleUpdateTraveler(traveler.id, 'lastName', v)}
                              placeholder="Doe"
                              placeholderTextColor={colors.gray400}
                              autoCapitalize="words"
                            />
                          </View>
                        </View>
                      </View>

                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Email *</Text>
                        <View style={styles.inputContainer}>
                          <Sms size={18} color={colors.gray400} />
                          <TextInput
                            style={styles.input}
                            value={traveler.email}
                            onChangeText={(v) => handleUpdateTraveler(traveler.id, 'email', v)}
                            placeholder="john@example.com"
                            placeholderTextColor={colors.gray400}
                            keyboardType="email-address"
                            autoCapitalize="none"
                          />
                        </View>
                      </View>

                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Phone (Optional)</Text>
                        <View style={styles.inputContainer}>
                          <Call size={18} color={colors.gray400} />
                          <TextInput
                            style={styles.input}
                            value={formatPhone(traveler.phone)}
                            onChangeText={(v) => handleUpdateTraveler(traveler.id, 'phone', v.replace(/\D/g, ''))}
                            placeholder="+1 (555) 000-0000"
                            placeholderTextColor={colors.gray400}
                            keyboardType="phone-pad"
                          />
                        </View>
                      </View>
                    </View>
                  )}
                </View>
              );
            })}

            {/* Add Traveler Button */}
            <TouchableOpacity style={styles.addTravelerButton} onPress={handleAddTraveler}>
              <Add size={20} color={colors.primary} />
              <Text style={styles.addTravelerText}>Add Another Traveler</Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Footer */}
          <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
            <TouchableOpacity
              style={[
                styles.confirmButton,
                !allTravelersComplete && styles.confirmButtonDisabled,
              ]}
              onPress={handleConfirm}
              disabled={!allTravelersComplete}
            >
              <Text style={styles.confirmButtonText}>
                {allTravelersComplete ? 'Save Travelers' : 'Complete Required Fields'}
              </Text>
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
    backgroundColor: colors.background,
  },
  innerContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
    backgroundColor: colors.white,
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  closeButton: {
    padding: spacing.xs,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
  },
  travelerCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  travelerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  travelerHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  travelerHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  travelerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray400,
    justifyContent: 'center',
    alignItems: 'center',
  },
  travelerIconComplete: {
    backgroundColor: colors.success,
  },
  travelerTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  travelerEmail: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  removeButton: {
    padding: spacing.xs,
  },
  travelerForm: {
    padding: spacing.md,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  inputRow: {
    flexDirection: 'row',
    marginTop: spacing.md,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    height: 48,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  addTravelerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    gap: spacing.sm,
  },
  addTravelerText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.primary,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  confirmButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: colors.gray300,
  },
  confirmButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
});
