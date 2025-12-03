import React from 'react';
import { View, StyleSheet } from 'react-native';
import ARNavigationScreen from '@/features/ar-navigation/ARNavigationScreen';
import { useRouter } from 'expo-router';

export default function AR() {
  const router = useRouter();
  
  const handleClose = () => {
    // Navigate back to home tab
    router.push('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <ARNavigationScreen visible={true} onClose={handleClose} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});
