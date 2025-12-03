/**
 * DESTINATION INPUT SHEET
 * 
 * Bottom sheet for entering destination (gate number or flight number).
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { Airplane, Location, Cup, SecurityUser, LogoutCurve, Box } from 'iconsax-react-native';
import { colors, spacing, typography } from '@/styles';
import { QuickDestination } from '../types/navigation.types';

interface DestinationInputSheetProps {
  onStartNavigation: (destination: string, type: 'gate' | 'flight' | 'poi') => void;
}

const QUICK_DESTINATIONS: QuickDestination[] = [
  { id: 'restroom', name: 'Restroom', icon: '🚻', type: 'restroom' },
  { id: 'food', name: 'Food Court', icon: '🍔', type: 'food' },
  { id: 'baggage', name: 'Baggage Claim', icon: '🧳', type: 'baggage' },
  { id: 'exit', name: 'Exit', icon: '🚪', type: 'exit' },
  { id: 'security', name: 'Security', icon: '🔒', type: 'security' },
  { id: 'checkin', name: 'Check-in', icon: '✅', type: 'checkin' },
];

export default function DestinationInputSheet({ onStartNavigation }: DestinationInputSheetProps) {
  const [inputMode, setInputMode] = useState<'gate' | 'flight'>('gate');
  const [inputValue, setInputValue] = useState('');

  const handleQuickDestination = (destination: QuickDestination) => {
    onStartNavigation(destination.name, 'poi');
  };

  const handleStartNavigation = () => {
    if (inputValue.trim()) {
      onStartNavigation(inputValue.trim(), inputMode);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Title */}
      <Text style={styles.title}>Where are you going?</Text>
      <Text style={styles.subtitle}>Enter your destination to start navigation</Text>

      {/* Input Mode Toggle */}
      <View style={styles.modeToggle}>
        <TouchableOpacity
          style={[styles.modeButton, inputMode === 'gate' && styles.modeButtonActive]}
          onPress={() => setInputMode('gate')}
        >
          <Location
            size={20}
            color={inputMode === 'gate' ? colors.primary : colors.gray400}
            variant={inputMode === 'gate' ? 'Bold' : 'Linear'}
          />
          <Text style={[styles.modeText, inputMode === 'gate' && styles.modeTextActive]}>
            Gate Number
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.modeButton, inputMode === 'flight' && styles.modeButtonActive]}
          onPress={() => setInputMode('flight')}
        >
          <Airplane
            size={20}
            color={inputMode === 'flight' ? colors.primary : colors.gray400}
            variant={inputMode === 'flight' ? 'Bold' : 'Linear'}
          />
          <Text style={[styles.modeText, inputMode === 'flight' && styles.modeTextActive]}>
            Flight Number
          </Text>
        </TouchableOpacity>
      </View>

      {/* Input Field */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder={inputMode === 'gate' ? 'e.g., 23D' : 'e.g., AA1234'}
          placeholderTextColor={colors.gray400}
          value={inputValue}
          onChangeText={setInputValue}
          autoCapitalize="characters"
          autoCorrect={false}
        />
      </View>

      {/* Start Button */}
      <TouchableOpacity
        style={[styles.startButton, !inputValue.trim() && styles.startButtonDisabled]}
        onPress={handleStartNavigation}
        disabled={!inputValue.trim()}
      >
        <Text style={styles.startButtonText}>Start Navigation</Text>
      </TouchableOpacity>

      {/* Divider */}
      <View style={styles.dividerContainer}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>Or select destination</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* Quick Destinations */}
      <View style={styles.quickDestinations}>
        {QUICK_DESTINATIONS.map((destination) => (
          <TouchableOpacity
            key={destination.id}
            style={styles.quickDestinationButton}
            onPress={() => handleQuickDestination(destination)}
          >
            <Text style={styles.quickDestinationIcon}>{destination.icon}</Text>
            <Text style={styles.quickDestinationText}>{destination.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.gray600,
    marginBottom: spacing.xl,
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: colors.gray100,
    borderRadius: 12,
    padding: 4,
    marginBottom: spacing.lg,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  modeButtonActive: {
    backgroundColor: colors.white,
  },
  modeText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.gray400,
  },
  modeTextActive: {
    color: colors.primary,
    fontWeight: typography.fontWeight.bold,
  },
  inputContainer: {
    marginBottom: spacing.lg,
  },
  input: {
    backgroundColor: colors.gray50,
    borderRadius: 12,
    padding: spacing.md,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
    borderWidth: 2,
    borderColor: colors.gray200,
  },
  startButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  startButtonDisabled: {
    backgroundColor: colors.gray300,
  },
  startButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.gray300,
  },
  dividerText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray600,
    marginHorizontal: spacing.md,
  },
  quickDestinations: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  quickDestinationButton: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: colors.gray50,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.gray200,
  },
  quickDestinationIcon: {
    fontSize: 32,
    marginBottom: spacing.xs,
  },
  quickDestinationText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
    textAlign: 'center',
  },
});
