/**
 * LOCATION SHARING SETTINGS
 * 
 * Settings panel for controlling location visibility on the Live Map.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
} from 'react-native';
import { 
  Location, 
  Eye, 
  EyeSlash, 
  People, 
  Global,
  Clock,
  ShieldTick,
  InfoCircle,
} from 'iconsax-react-native';
import { colors, spacing, borderRadius } from '@/styles';

export type LocationVisibility = 'everyone' | 'buddies_only' | 'nobody';
export type TravelerStatus = 'available' | 'busy' | 'invisible';

export interface LocationSettings {
  sharingEnabled: boolean;
  visibleTo: LocationVisibility;
  currentStatus: TravelerStatus;
  statusMessage?: string;
  showOnlyWhenActive: boolean;
  activeThresholdMinutes: number;
  autoDisableAfterHours?: number;
}

interface LocationSharingSettingsProps {
  settings: LocationSettings;
  onSettingsChange: (settings: LocationSettings) => void;
  onClose?: () => void;
}

const VISIBILITY_OPTIONS: { id: LocationVisibility; label: string; description: string; icon: any }[] = [
  { 
    id: 'everyone', 
    label: 'Everyone', 
    description: 'All travelers can see your location',
    icon: Global,
  },
  { 
    id: 'buddies_only', 
    label: 'Buddies Only', 
    description: 'Only your connected buddies can see you',
    icon: People,
  },
  { 
    id: 'nobody', 
    label: 'Nobody', 
    description: 'Your location is completely hidden',
    icon: EyeSlash,
  },
];

const STATUS_OPTIONS: { id: TravelerStatus; label: string; color: string }[] = [
  { id: 'available', label: 'Available', color: colors.success },
  { id: 'busy', label: 'Busy', color: colors.warning },
  { id: 'invisible', label: 'Invisible', color: colors.gray400 },
];

const AUTO_DISABLE_OPTIONS = [
  { value: undefined, label: 'Never' },
  { value: 1, label: '1 hour' },
  { value: 2, label: '2 hours' },
  { value: 4, label: '4 hours' },
  { value: 8, label: '8 hours' },
  { value: 24, label: '24 hours' },
];

export default function LocationSharingSettings({
  settings,
  onSettingsChange,
  onClose,
}: LocationSharingSettingsProps) {
  const [localSettings, setLocalSettings] = useState<LocationSettings>(settings);
  
  const updateSettings = (updates: Partial<LocationSettings>) => {
    const newSettings = { ...localSettings, ...updates };
    setLocalSettings(newSettings);
    onSettingsChange(newSettings);
  };
  
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Main Toggle */}
      <View style={styles.section}>
        <View style={styles.mainToggle}>
          <View style={styles.toggleInfo}>
            <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
              <Location size={24} color={colors.primary} variant="Bold" />
            </View>
            <View style={styles.toggleText}>
              <Text style={styles.toggleTitle}>Share My Location</Text>
              <Text style={styles.toggleDescription}>
                Let other travelers see you on the map
              </Text>
            </View>
          </View>
          <Switch
            value={localSettings.sharingEnabled}
            onValueChange={(value) => updateSettings({ sharingEnabled: value })}
            trackColor={{ false: tc.borderSubtle, true: colors.primary + '50' }}
            thumbColor={localSettings.sharingEnabled ? colors.primary : colors.gray400}
          />
        </View>
      </View>
      
      {localSettings.sharingEnabled && (
        <>
          {/* Visibility */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Who Can See Me</Text>
            {VISIBILITY_OPTIONS.map((option) => {
              const IconComponent = option.icon;
              const isSelected = localSettings.visibleTo === option.id;
              return (
                <TouchableOpacity
                  key={option.id}
                  style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                  onPress={() => updateSettings({ visibleTo: option.id })}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.optionIcon,
                    isSelected && styles.optionIconSelected,
                  ]}>
                    <IconComponent 
                      size={20} 
                      color={isSelected ? colors.primary : colors.textSecondary} 
                    />
                  </View>
                  <View style={styles.optionContent}>
                    <Text style={[
                      styles.optionLabel,
                      isSelected && styles.optionLabelSelected,
                    ]}>
                      {option.label}
                    </Text>
                    <Text style={styles.optionDescription}>{option.description}</Text>
                  </View>
                  <View style={[
                    styles.radioOuter,
                    isSelected && styles.radioOuterSelected,
                  ]}>
                    {isSelected && <View style={styles.radioInner} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
          
          {/* Status */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>My Status</Text>
            <View style={styles.statusRow}>
              {STATUS_OPTIONS.map((status) => {
                const isSelected = localSettings.currentStatus === status.id;
                return (
                  <TouchableOpacity
                    key={status.id}
                    style={[
                      styles.statusChip,
                      isSelected && { backgroundColor: status.color + '20', borderColor: status.color },
                    ]}
                    onPress={() => updateSettings({ currentStatus: status.id })}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.statusDot, { backgroundColor: status.color }]} />
                    <Text style={[
                      styles.statusLabel,
                      isSelected && { color: status.color },
                    ]}>
                      {status.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
          
          {/* Safety Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Safety & Privacy</Text>
            
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Clock size={20} color={colors.textSecondary} />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Show only when active</Text>
                  <Text style={styles.settingDescription}>
                    Hide location if app not used for 30 min
                  </Text>
                </View>
              </View>
              <Switch
                value={localSettings.showOnlyWhenActive}
                onValueChange={(value) => updateSettings({ showOnlyWhenActive: value })}
                trackColor={{ false: tc.borderSubtle, true: colors.primary + '50' }}
                thumbColor={localSettings.showOnlyWhenActive ? colors.primary : colors.gray400}
              />
            </View>
            
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Clock size={20} color={colors.textSecondary} />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Auto-disable after</Text>
                  <Text style={styles.settingDescription}>
                    Automatically stop sharing location
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.autoDisableOptions}>
              {AUTO_DISABLE_OPTIONS.map((option) => {
                const isSelected = localSettings.autoDisableAfterHours === option.value;
                return (
                  <TouchableOpacity
                    key={option.label}
                    style={[styles.autoDisableChip, isSelected && styles.autoDisableChipSelected]}
                    onPress={() => updateSettings({ autoDisableAfterHours: option.value })}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.autoDisableText,
                      isSelected && styles.autoDisableTextSelected,
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
          
          {/* Info Banner */}
          <View style={styles.infoBanner}>
            <ShieldTick size={20} color={colors.primary} />
            <Text style={styles.infoText}>
              Your exact location is never shared. Other travelers only see your approximate area (within 500m).
            </Text>
          </View>
        </>
      )}
      
      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  section: {
    backgroundColor: colors.bgElevated,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  mainToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleText: {
    marginLeft: spacing.md,
    flex: 1,
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  toggleDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionCardSelected: {
    backgroundColor: colors.primary + '08',
    borderColor: colors.primary,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIconSelected: {
    backgroundColor: colors.primary + '20',
  },
  optionContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  optionLabelSelected: {
    color: colors.primary,
  },
  optionDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.gray300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: colors.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  statusRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statusChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: spacing.md,
    flex: 1,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  settingDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  autoDisableOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  autoDisableChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.borderSubtle,
  },
  autoDisableChipSelected: {
    backgroundColor: colors.primary,
  },
  autoDisableText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  autoDisableTextSelected: {
    color: colors.white,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.primary + '10',
    marginHorizontal: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: colors.primary,
    lineHeight: 18,
  },
  bottomPadding: {
    height: spacing.xl,
  },
});
