import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import ARNavigationScreen from '@/features/ar-navigation/ARNavigationScreen';
import { ScanActionType } from '@/components/features/ar/ScanBottomSheet';
import { useTheme } from '@/context/ThemeContext';

const NAV_TABS = [
  { id: 'city-navigator', label: 'City' },
  { id: 'airport-navigator', label: 'Airport' },
  { id: 'landmark-scanner', label: 'Landmarks' },
] as const;

export default function AR() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors: tc } = useTheme();
  const params = useLocalSearchParams<{ action?: string; navigateMode?: string }>();

  const isNavigateMode = params.navigateMode === 'true';
  const [activeNavTab, setActiveNavTab] = useState(params.action || 'city-navigator');

  const handleClose = () => {
    router.push('/(tabs)');
  };

  const selectedAction = isNavigateMode ? activeNavTab : (params.action || 'landmark-scanner');

  return (
    <View style={styles.container}>
      {/* Navigate mode: show top toggle tabs */}
      {isNavigateMode && (
        <View style={[styles.tabBar, { paddingTop: insets.top + 8, backgroundColor: 'rgba(0,0,0,0.85)' }]}>
          <View style={[styles.tabRow, { backgroundColor: tc.bgElevated }]}>
            {NAV_TABS.map(tab => {
              const isActive = activeNavTab === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={[styles.tab, isActive && { backgroundColor: tc.primary }]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setActiveNavTab(tab.id);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.tabText, { color: isActive ? '#FFFFFF' : tc.textSecondary }]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      <ARNavigationScreen
        visible={true}
        onClose={handleClose}
        initialPlugin={selectedAction}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  tabBar: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    zIndex: 999,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  tabRow: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 3,
    gap: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
