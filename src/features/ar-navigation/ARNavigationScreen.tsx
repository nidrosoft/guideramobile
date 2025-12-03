/**
 * AR NAVIGATION SCREEN
 * 
 * Main entry point for AR navigation feature.
 * Triggered from the AR tab in bottom navigation.
 * Full-screen camera view with AR overlays and plugins.
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Camera, Location } from 'iconsax-react-native';
import ARContainer from './components/ARContainer';
import { colors, spacing, typography } from '@/styles';
import { Camera as ExpoCamera } from 'expo-camera';
import * as ExpoLocation from 'expo-location';

interface ARNavigationScreenProps {
  visible: boolean;
  onClose: () => void;
}

export default function ARNavigationScreen({ visible, onClose }: ARNavigationScreenProps) {
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);
  const [locationPermission, setLocationPermission] = useState<boolean | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    if (visible) {
      checkPermissions();
    }
  }, [visible]);

  const checkPermissions = async () => {
    try {
      const cameraStatus = await ExpoCamera.getCameraPermissionsAsync();
      const locationStatus = await ExpoLocation.getForegroundPermissionsAsync();
      
      setCameraPermission(cameraStatus.granted);
      setLocationPermission(locationStatus.granted);
    } catch (error) {
      console.error('Permission check error:', error);
      // Fallback: assume permissions not granted
      setCameraPermission(false);
      setLocationPermission(false);
    }
  };

  const requestPermissions = async () => {
    setIsRequesting(true);
    
    try {
      const cameraResult = await ExpoCamera.requestCameraPermissionsAsync();
      const locationResult = await ExpoLocation.requestForegroundPermissionsAsync();
      
      setCameraPermission(cameraResult.granted);
      setLocationPermission(locationResult.granted);
    } catch (error) {
      console.error('Permission request error:', error);
    } finally {
      setIsRequesting(false);
    }
  };

  if (!visible) return null;

  // Show permission request screen
  if (cameraPermission === false || locationPermission === false || cameraPermission === null) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <View style={styles.iconContainer}>
            <Camera size={64} color={colors.primary} variant="Bold" />
          </View>
          
          <Text style={styles.permissionTitle}>Camera & Location Access</Text>
          <Text style={styles.permissionDescription}>
            AR Navigation needs access to your camera and location to provide augmented reality features and help you navigate.
          </Text>

          <View style={styles.permissionList}>
            <View style={styles.permissionItem}>
              <Camera size={24} color={colors.primary} variant="Bold" />
              <Text style={styles.permissionItemText}>Camera for AR scanning</Text>
            </View>
            <View style={styles.permissionItem}>
              <Location size={24} color={colors.primary} variant="Bold" />
              <Text style={styles.permissionItemText}>Location for navigation</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestPermissions}
            disabled={isRequesting}
          >
            {isRequesting ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.permissionButtonText}>Grant Access</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose} style={styles.skipButton}>
            <Text style={styles.skipButtonText}>Maybe Later</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ARContainer onClose={onClose} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: `${colors.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  permissionTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  permissionDescription: {
    fontSize: typography.fontSize.base,
    color: colors.gray300,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  permissionList: {
    width: '100%',
    gap: spacing.md,
    marginBottom: spacing['2xl'],
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: spacing.md,
    borderRadius: 12,
  },
  permissionItemText: {
    fontSize: typography.fontSize.base,
    color: colors.white,
    fontWeight: typography.fontWeight.medium,
  },
  permissionButton: {
    width: '100%',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  permissionButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  skipButton: {
    paddingVertical: spacing.sm,
  },
  skipButtonText: {
    fontSize: typography.fontSize.base,
    color: colors.gray400,
  },
});
