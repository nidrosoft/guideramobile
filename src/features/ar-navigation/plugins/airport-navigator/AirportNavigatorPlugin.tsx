/**
 * AIRPORT NAVIGATOR PLUGIN
 * 
 * AR plugin for navigating airports to find gates.
 */

import React, { useState } from 'react';
import { TouchableOpacity, StyleSheet, View, Text } from 'react-native';
import { ARPlugin, ARContext } from '../../types/ar-plugin.types';
import { Airplane, CloseCircle } from 'iconsax-react-native';
import { colors, spacing, typography } from '@/styles';
import NavigationOverlay from './components/NavigationOverlay';
import InstructionBanner from './components/InstructionBanner';
import NavigationCard from './components/NavigationCard';
import NavigationInfoCard from './components/NavigationInfoCard';
import DestinationInputSheet from './components/DestinationInputSheet';
import BottomSheetInfo from '../../components/shared/BottomSheetInfo';
import { useAirportNavigation } from './hooks/useAirportNavigation';

// Plugin overlay component with state
function AirportNavigatorOverlay({ arContext }: { arContext: ARContext }) {
  const {
    isNavigating,
    route,
    progress,
    currentStep,
    remainingDistance,
    currentFloor,
    floorChanged,
    startNavigation,
    stopNavigation,
  } = useAirportNavigation();

  const [showInputSheet, setShowInputSheet] = useState(true);
  const [isNavCardCollapsed, setIsNavCardCollapsed] = useState(false);

  const handleStartNavigation = (destination: string, type: 'gate' | 'flight' | 'poi') => {
    startNavigation(destination, type);
    setShowInputSheet(false);
    setIsNavCardCollapsed(false);
    // Hide search bar during navigation
    arContext.setHideSearch?.(true);
  };

  const handleExit = () => {
    stopNavigation();
    setShowInputSheet(true);
    setIsNavCardCollapsed(false);
    // Show search bar when navigation ends
    arContext.setHideSearch?.(false);
  };

  const handleCollapseNavCard = () => {
    setIsNavCardCollapsed(true);
  };

  const handleExpandNavCard = () => {
    setIsNavCardCollapsed(false);
  };

  const handleToggleSidePanel = () => {
    // Call the toggle function from ARContext
    arContext.toggleSidePanel?.();
  };

  return (
    <>
      {/* AR Navigation Overlay */}
      {isNavigating && route && (
        <>
          <NavigationOverlay route={route} progress={progress} />
          
          {currentStep && (
            <InstructionBanner 
              step={currentStep} 
              remainingDistance={remainingDistance}
            />
          )}

          {/* Floor Change Indicator */}
          {floorChanged && (
            <View style={styles.floorChangeIndicator}>
              <Text style={styles.floorChangeText}>
                Floor {currentFloor}
              </Text>
            </View>
          )}

          {/* Navigation Info Card - Transparent overlay */}
          <NavigationInfoCard
            destination={route.destination}
            distance={`${remainingDistance}m`}
            estimatedTime={`${route.estimatedTime} min`}
            currentFloor={`Floor ${currentFloor}`}
            onToggleSidePanel={handleToggleSidePanel}
            sidePanelVisible={arContext.sidePanelVisible ?? true}
            currentStep={route.currentStep}
            totalSteps={route.totalSteps}
          />
        </>
      )}

      {/* Destination Input Sheet */}
      {showInputSheet && !isNavigating && (
        <BottomSheetInfo
          visible={true}
          title="Airport Navigation"
          onClose={() => setShowInputSheet(false)}
        >
          <DestinationInputSheet onStartNavigation={handleStartNavigation} />
        </BottomSheetInfo>
      )}

      {/* Navigation Card - Collapsible */}
      {isNavigating && route && !isNavCardCollapsed && (
        <BottomSheetInfo
          visible={true}
          title=""
          onClose={handleCollapseNavCard}
        >
          <NavigationCard route={route} onExit={handleExit} />
        </BottomSheetInfo>
      )}

    </>
  );
}


export const airportNavigatorPlugin: ARPlugin = {
  id: 'airport-navigator',
  name: 'Airport Navigator',
  icon: <Airplane size={24} color={colors.primary} variant="Bold" />,
  description: 'Navigate airports and find your gate',
  
  requiresCamera: true,
  requiresLocation: true,
  requiresInternet: true,
  
  renderOverlay: (context: ARContext) => {
    return <AirportNavigatorOverlay arContext={context} />;
  },
  
  onActivate: () => {
    console.log('Airport Navigator activated');
  },
  
  onDeactivate: () => {
    console.log('Airport Navigator deactivated');
  },
};

const styles = StyleSheet.create({
  floorChangeIndicator: {
    position: 'absolute',
    top: 200,
    alignSelf: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  floorChangeText: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
});

export default airportNavigatorPlugin;
