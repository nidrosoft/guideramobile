/**
 * TRANSPORT MODE SELECTOR
 * 
 * Horizontal selector for choosing transport mode.
 * Sleek pill design with smooth selection animation.
 */

import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { 
  Category,
  Car,
  Driving,
  People,
} from 'iconsax-react-native';
import { colors, spacing, typography } from '@/styles';
import { TransportMode } from '../types/cityNavigator.types';

interface TransportModeSelectorProps {
  selectedMode: TransportMode;
  onSelectMode: (mode: TransportMode) => void;
}

const TRANSPORT_MODES: { mode: TransportMode; label: string }[] = [
  { mode: 'all', label: 'All' },
  { mode: 'car', label: 'Car' },
  { mode: 'bike', label: 'Bike' },
  { mode: 'walk', label: 'Walk' },
];

function getTransportIcon(mode: TransportMode, isSelected: boolean) {
  const iconColor = isSelected ? colors.white : colors.gray600;
  switch (mode) {
    case 'all':
      return <Category size={20} color={iconColor} variant="Bold" />;
    case 'car':
      return <Car size={20} color={iconColor} variant="Bold" />;
    case 'bike':
      return <Driving size={20} color={iconColor} variant="Bold" />;
    case 'walk':
      return <People size={20} color={iconColor} variant="Bold" />;
    default:
      return <Category size={20} color={iconColor} variant="Bold" />;
  }
}

export default function TransportModeSelector({
  selectedMode,
  onSelectMode,
}: TransportModeSelectorProps) {
  return (
    <View style={styles.container}>
      {TRANSPORT_MODES.map(({ mode, label }) => {
        const isSelected = selectedMode === mode;
        return (
          <TouchableOpacity
            key={mode}
            style={[
              styles.modeButton,
              isSelected && styles.modeButtonSelected,
            ]}
            onPress={() => onSelectMode(mode)}
            activeOpacity={0.7}
          >
            {getTransportIcon(mode, isSelected)}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.gray100,
    borderRadius: 28,
    padding: 4,
    gap: 4,
  },
  modeButton: {
    width: 48,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  modeButtonSelected: {
    backgroundColor: colors.gray800,
  },
});
