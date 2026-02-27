/**
 * LOCATION SETTINGS SCREEN ROUTE
 * 
 * Route for the location sharing settings modal.
 */

import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing } from '@/styles';
import LocationSharingSettings, { 
  LocationSettings 
} from '@/features/community/components/LocationSharingSettings';

const DEFAULT_SETTINGS: LocationSettings = {
  sharingEnabled: true,
  visibleTo: 'buddies_only',
  currentStatus: 'available',
  statusMessage: '',
  showOnlyWhenActive: true,
  activeThresholdMinutes: 30,
  autoDisableAfterHours: 8,
};

export default function LocationSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [settings, setSettings] = useState<LocationSettings>(DEFAULT_SETTINGS);
  
  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };
  
  const handleSettingsChange = (newSettings: LocationSettings) => {
    setSettings(newSettings);
    // TODO: Save to database
  };
  
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Location Settings</Text>
        <View style={styles.placeholder} />
      </View>
      
      {/* Settings */}
      <LocationSharingSettings
        settings={settings}
        onSettingsChange={handleSettingsChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  backButton: {
    padding: spacing.xs,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  placeholder: {
    width: 40,
  },
});
