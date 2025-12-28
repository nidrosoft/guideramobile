/**
 * GUEST DETAILS SHEET
 * 
 * Bottom sheet for entering guest information
 * Matches the TravelerDetailsSheet style from flight flow
 * Supports adding multiple guests
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
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
  Calendar,
  Add,
  Trash,
  TickCircle,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing } from '@/styles';
import { useHotelStore } from '../../../stores/useHotelStore';
import { styles } from './GuestDetailsSheet.styles';

interface Guest {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: Date | null;
}

interface GuestDetailsSheetProps {
  visible: boolean;
  onClose: () => void;
}

const createEmptyGuest = (): Guest => ({
  id: Date.now().toString(),
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  dateOfBirth: null,
});

export default function GuestDetailsSheet({
  visible,
  onClose,
}: GuestDetailsSheetProps) {
  const insets = useSafeAreaInsets();
  const {
    primaryGuest,
    contactInfo,
    setPrimaryGuest,
    setContactInfo,
  } = useHotelStore();

  // Initialize with existing guest data or empty guest
  const [localGuests, setLocalGuests] = useState<Guest[]>(() => {
    if (primaryGuest && contactInfo) {
      return [{
        id: 'guest-1',
        firstName: primaryGuest.firstName || '',
        lastName: primaryGuest.lastName || '',
        email: contactInfo.email || '',
        phone: contactInfo.phone || '',
        dateOfBirth: primaryGuest.dateOfBirth || null,
      }];
    }
    return [createEmptyGuest()];
  });
  
  const [expandedGuest, setExpandedGuest] = useState<string | null>(
    localGuests[0]?.id || null
  );
  const [showDatePicker, setShowDatePicker] = useState<string | null>(null);

  const handleAddGuest = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newGuest = createEmptyGuest();
    setLocalGuests(prev => [...prev, newGuest]);
    setExpandedGuest(newGuest.id);
  };

  const handleRemoveGuest = (id: string) => {
    if (localGuests.length <= 1) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLocalGuests(prev => prev.filter(g => g.id !== id));
    if (expandedGuest === id) {
      setExpandedGuest(localGuests[0]?.id || null);
    }
  };

  const handleUpdateGuest = (id: string, field: keyof Guest, value: string | Date | null) => {
    setLocalGuests(prev =>
      prev.map(g => (g.id === id ? { ...g, [field]: value } : g))
    );
  };

  const formatDateOfBirth = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const isGuestComplete = (guest: Guest) => {
    return !!(guest.firstName && guest.lastName && guest.email && guest.dateOfBirth);
  };

  const allGuestsComplete = localGuests.every(isGuestComplete);

  const handleConfirm = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Save primary guest (first guest)
    const primary = localGuests[0];
    if (primary) {
      setPrimaryGuest({
        id: primary.id,
        firstName: primary.firstName.trim(),
        lastName: primary.lastName.trim(),
        dateOfBirth: primary.dateOfBirth || new Date(),
        type: 'adult',
        gender: 'other',
        nationality: 'US',
      });

      setContactInfo({
        email: primary.email.trim(),
        phone: primary.phone.trim(),
        countryCode: '+1',
      });
    }
    
    onClose();
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
            <Text style={styles.headerTitle}>Guest Details</Text>
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
            {localGuests.map((guest, index) => {
              const isExpanded = expandedGuest === guest.id;
              const isComplete = isGuestComplete(guest);

              return (
                <View key={guest.id} style={styles.guestCard}>
                  {/* Guest Header */}
                  <TouchableOpacity
                    style={styles.guestHeader}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setExpandedGuest(isExpanded ? null : guest.id);
                    }}
                  >
                    <View style={styles.guestHeaderLeft}>
                      <View style={[styles.guestIcon, isComplete && styles.guestIconComplete]}>
                        {isComplete ? (
                          <TickCircle size={20} color={colors.white} variant="Bold" />
                        ) : (
                          <User size={20} color={colors.white} variant="Bold" />
                        )}
                      </View>
                      <View>
                        <Text style={styles.guestTitle}>
                          {guest.firstName && guest.lastName
                            ? `${guest.firstName} ${guest.lastName}`
                            : `Guest ${index + 1}`}
                        </Text>
                        {isComplete && (
                          <Text style={styles.guestEmail}>{guest.email}</Text>
                        )}
                      </View>
                    </View>
                    {localGuests.length > 1 && (
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => handleRemoveGuest(guest.id)}
                      >
                        <Trash size={18} color={colors.error} />
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>

                  {/* Guest Form */}
                  {isExpanded && (
                    <View style={styles.guestForm}>
                      <View style={{ height: spacing.md }} />
                      
                      {/* Name Row */}
                      <View style={styles.inputRow}>
                        <View style={[styles.inputGroup, { flex: 1, marginRight: spacing.sm }]}>
                          <Text style={styles.inputLabel}>First Name *</Text>
                          <View style={styles.inputContainer}>
                            <User size={18} color={colors.gray400} />
                            <TextInput
                              style={styles.input}
                              value={guest.firstName}
                              onChangeText={(v) => handleUpdateGuest(guest.id, 'firstName', v)}
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
                              value={guest.lastName}
                              onChangeText={(v) => handleUpdateGuest(guest.id, 'lastName', v)}
                              placeholder="Doe"
                              placeholderTextColor={colors.gray400}
                            />
                          </View>
                        </View>
                      </View>

                      {/* Email */}
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Email *</Text>
                        <View style={styles.inputContainer}>
                          <Sms size={18} color={colors.gray400} />
                          <TextInput
                            style={styles.input}
                            value={guest.email}
                            onChangeText={(v) => handleUpdateGuest(guest.id, 'email', v)}
                            placeholder="john@example.com"
                            placeholderTextColor={colors.gray400}
                            keyboardType="email-address"
                            autoCapitalize="none"
                          />
                        </View>
                      </View>

                      {/* Phone */}
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Phone (Optional)</Text>
                        <View style={styles.inputContainer}>
                          <Call size={18} color={colors.gray400} />
                          <TextInput
                            style={styles.input}
                            value={guest.phone}
                            onChangeText={(v) => handleUpdateGuest(guest.id, 'phone', v)}
                            placeholder="+1 (555) 000-0000"
                            placeholderTextColor={colors.gray400}
                            keyboardType="phone-pad"
                          />
                        </View>
                      </View>

                      {/* Date of Birth */}
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Date of Birth *</Text>
                        <TouchableOpacity
                          style={styles.inputContainer}
                          onPress={() => setShowDatePicker(
                            showDatePicker === guest.id ? null : guest.id
                          )}
                        >
                          <Calendar size={18} color={colors.gray400} />
                          <Text style={[
                            styles.dateText,
                            !guest.dateOfBirth && styles.placeholderText,
                          ]}>
                            {guest.dateOfBirth
                              ? formatDateOfBirth(guest.dateOfBirth)
                              : 'Select date of birth'
                            }
                          </Text>
                        </TouchableOpacity>
                        {showDatePicker === guest.id && Platform.OS === 'ios' && (
                          <View style={styles.datePickerContainer}>
                            <DateTimePicker
                              value={guest.dateOfBirth || new Date(2000, 0, 1)}
                              mode="date"
                              display="spinner"
                              maximumDate={new Date()}
                              minimumDate={new Date(1920, 0, 1)}
                              onChange={(event, date) => {
                                if (date) {
                                  handleUpdateGuest(guest.id, 'dateOfBirth', date);
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
                        {showDatePicker === guest.id && Platform.OS === 'android' && (
                          <DateTimePicker
                            value={guest.dateOfBirth || new Date(2000, 0, 1)}
                            mode="date"
                            display="default"
                            maximumDate={new Date()}
                            minimumDate={new Date(1920, 0, 1)}
                            onChange={(event, date) => {
                              setShowDatePicker(null);
                              if (date && event.type === 'set') {
                                handleUpdateGuest(guest.id, 'dateOfBirth', date);
                              }
                            }}
                          />
                        )}
                      </View>
                    </View>
                  )}
                </View>
              );
            })}

            {/* Add Guest Button */}
            <TouchableOpacity style={styles.addGuestButton} onPress={handleAddGuest}>
              <Add size={20} color={colors.primary} />
              <Text style={styles.addGuestText}>Add Another Guest</Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Footer */}
          <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
            <TouchableOpacity
              style={[
                styles.confirmButton,
                !allGuestsComplete && styles.confirmButtonDisabled,
              ]}
              onPress={handleConfirm}
              disabled={!allGuestsComplete}
            >
              <Text style={styles.confirmButtonText}>
                {allGuestsComplete ? 'Save Guests' : 'Complete Required Fields'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
