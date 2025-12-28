/**
 * TRAVELER DETAILS SHEET
 * 
 * Full bottom sheet for entering traveler information
 * Supports adding multiple travelers
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CloseCircle,
  User,
  Sms,
  Call,
  DocumentText,
  Add,
  Trash,
  TickCircle,
  Calendar,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing } from '@/styles';
import { styles } from './TravelerDetailsSheet.styles';

interface Traveler {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: Date | null;
  passport: string;
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
  dateOfBirth: null,
  passport: '',
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

  const handleUpdateTraveler = (id: string, field: keyof Traveler, value: string | Date | null) => {
    setLocalTravelers(prev =>
      prev.map(t => (t.id === id ? { ...t, [field]: value } : t))
    );
  };
  
  const [showDatePicker, setShowDatePicker] = useState<string | null>(null);
  
  const formatDateOfBirth = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
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
                    {localTravelers.length > 1 && (
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => handleRemoveTraveler(traveler.id)}
                      >
                        <Trash size={18} color={colors.error} />
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>

                  {/* Traveler Form */}
                  {isExpanded && (
                    <View style={styles.travelerForm}>
                      {/* Spacing after header */}
                      <View style={{ height: spacing.md }} />
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
                            value={traveler.phone}
                            onChangeText={(v) => handleUpdateTraveler(traveler.id, 'phone', v)}
                            placeholder="+1 (555) 000-0000"
                            placeholderTextColor={colors.gray400}
                            keyboardType="phone-pad"
                          />
                        </View>
                      </View>

                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Date of Birth *</Text>
                        <TouchableOpacity 
                          style={styles.inputContainer}
                          onPress={() => setShowDatePicker(
                            showDatePicker === traveler.id ? null : traveler.id
                          )}
                        >
                          <Calendar size={18} color={colors.gray400} />
                          <Text style={[
                            styles.dateText,
                            !traveler.dateOfBirth && styles.placeholderText,
                          ]}>
                            {traveler.dateOfBirth 
                              ? formatDateOfBirth(traveler.dateOfBirth)
                              : 'Select date of birth'
                            }
                          </Text>
                        </TouchableOpacity>
                        {showDatePicker === traveler.id && Platform.OS === 'ios' && (
                          <View style={styles.datePickerContainer}>
                            <DateTimePicker
                              value={traveler.dateOfBirth || new Date(2000, 0, 1)}
                              mode="date"
                              display="spinner"
                              maximumDate={new Date()}
                              minimumDate={new Date(1920, 0, 1)}
                              onChange={(event, date) => {
                                if (date) {
                                  handleUpdateTraveler(traveler.id, 'dateOfBirth', date);
                                }
                              }}
                              textColor={colors.textPrimary}
                            />
                            <TouchableOpacity 
                              style={styles.datePickerDoneButton}
                              onPress={() => setShowDatePicker(null)}
                            >
                              <Text style={styles.datePickerDoneText}>Done</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                        {showDatePicker === traveler.id && Platform.OS === 'android' && (
                          <DateTimePicker
                            value={traveler.dateOfBirth || new Date(2000, 0, 1)}
                            mode="date"
                            display="default"
                            maximumDate={new Date()}
                            minimumDate={new Date(1920, 0, 1)}
                            onChange={(event, date) => {
                              setShowDatePicker(null);
                              if (date && event.type === 'set') {
                                handleUpdateTraveler(traveler.id, 'dateOfBirth', date);
                              }
                            }}
                          />
                        )}
                      </View>

                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Passport Number (Optional)</Text>
                        <View style={styles.inputContainer}>
                          <DocumentText size={18} color={colors.gray400} />
                          <TextInput
                            style={styles.input}
                            value={traveler.passport}
                            onChangeText={(v) => handleUpdateTraveler(traveler.id, 'passport', v)}
                            placeholder="AB1234567"
                            placeholderTextColor={colors.gray400}
                            autoCapitalize="characters"
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
