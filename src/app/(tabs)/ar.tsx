import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import ARNavigationScreen from '@/features/ar-navigation/ARNavigationScreen';
import { ScanActionType } from '@/components/features/ar/ScanBottomSheet';

export default function AR() {
  const router = useRouter();
  const params = useLocalSearchParams<{ action?: ScanActionType }>();
  
  const handleClose = () => {
    // Navigate back to home tab
    router.push('/(tabs)');
  };

  // Get action from params (passed from bottom sheet in tab bar)
  const selectedAction = params.action || 'landmark-scanner';

  return (
    <View style={styles.container}>
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
});
