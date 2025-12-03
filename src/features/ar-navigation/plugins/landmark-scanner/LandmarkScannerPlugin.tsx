/**
 * LANDMARK SCANNER PLUGIN
 * 
 * AR plugin for scanning and learning about landmarks.
 * Uses image recognition to identify buildings, monuments, and points of interest.
 */

import React, { useState } from 'react';
import { ARPlugin, ARContext } from '../../types/ar-plugin.types';
import { Building } from 'iconsax-react-native';
import { colors } from '@/styles';
import LandmarkOverlay from './components/LandmarkOverlay';
import LandmarkInfoSheet from './components/LandmarkInfoSheet';
import BottomSheetInfo from '../../components/shared/BottomSheetInfo';
import { useLandmarkRecognition } from './hooks/useLandmarkRecognition';

// Plugin overlay component with state
function LandmarkScannerOverlay() {
  const { isScanning, landmark, scanLandmark, clearLandmark } = useLandmarkRecognition();
  const [showBottomSheet, setShowBottomSheet] = useState(false);

  const handleCapture = async () => {
    await scanLandmark();
    setShowBottomSheet(true);
  };

  const handleCloseSheet = () => {
    setShowBottomSheet(false);
    clearLandmark();
  };

  return (
    <>
      <LandmarkOverlay 
        isScanning={isScanning}
        onCapture={handleCapture}
      />
      
      {landmark && (
        <BottomSheetInfo
          visible={showBottomSheet}
          title={landmark.name}
          onClose={handleCloseSheet}
        >
          <LandmarkInfoSheet landmark={landmark} />
        </BottomSheetInfo>
      )}
    </>
  );
}

export const landmarkScannerPlugin: ARPlugin = {
  id: 'landmark-scanner',
  name: 'Landmark Scanner',
  icon: <Building size={24} color={colors.primary} variant="Bold" />,
  description: 'Scan landmarks to learn their history and details',
  
  requiresCamera: true,
  requiresLocation: true,
  requiresInternet: true,
  
  renderOverlay: (context: ARContext) => {
    return <LandmarkScannerOverlay />;
  },
  
  onActivate: () => {
    console.log('Landmark Scanner activated');
  },
  
  onDeactivate: () => {
    console.log('Landmark Scanner deactivated');
  },
};

export default landmarkScannerPlugin;
