/**
 * AIRPORT NAVIGATION HOOK
 * 
 * Hook for airport navigation functionality with mock data.
 */

import { useState, useEffect, useRef } from 'react';
import { NavigationRoute, NavigationStep } from '../types/navigation.types';

// Mock routes for different destinations
const MOCK_ROUTES: Record<string, NavigationRoute> = {
  'gate-23D': {
    destination: 'Gate 23D',
    destinationType: 'gate',
    currentStep: 1,
    totalSteps: 5,
    totalDistance: 450,
    estimatedTime: 8,
    steps: [
      {
        id: '1',
        instruction: 'Head straight towards Terminal 2',
        distance: 150,
        direction: 'straight',
      },
      {
        id: '2',
        instruction: 'Turn right at the duty-free shop',
        distance: 80,
        direction: 'right',
      },
      {
        id: '3',
        instruction: 'Continue straight past Gate 20',
        distance: 120,
        direction: 'straight',
      },
      {
        id: '4',
        instruction: 'Turn left towards Gates 21-25',
        distance: 60,
        direction: 'left',
      },
      {
        id: '5',
        instruction: 'Gate 23D is on your right',
        distance: 40,
        direction: 'slight_right',
      },
    ],
  },
  'gate-15A': {
    destination: 'Gate 15A',
    destinationType: 'gate',
    currentStep: 1,
    totalSteps: 4,
    totalDistance: 310,
    estimatedTime: 6,
    steps: [
      {
        id: '1',
        instruction: 'Head towards Terminal 1',
        distance: 100,
        direction: 'straight',
      },
      {
        id: '2',
        instruction: 'Turn left at the information desk',
        distance: 70,
        direction: 'left',
      },
      {
        id: '3',
        instruction: 'Continue straight past security',
        distance: 90,
        direction: 'straight',
      },
      {
        id: '4',
        instruction: 'Gate 15A is ahead',
        distance: 50,
        direction: 'straight',
      },
    ],
  },
  'restroom': {
    destination: 'Restroom',
    destinationType: 'restroom',
    currentStep: 1,
    totalSteps: 2,
    totalDistance: 50,
    estimatedTime: 2,
    steps: [
      {
        id: '1',
        instruction: 'Turn right ahead',
        distance: 30,
        direction: 'right',
      },
      {
        id: '2',
        instruction: 'Restroom on your left',
        distance: 20,
        direction: 'left',
      },
    ],
  },
};

export function useAirportNavigation() {
  const [isNavigating, setIsNavigating] = useState(false);
  const [route, setRoute] = useState<NavigationRoute | null>(null);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<NavigationStep | null>(null);
  const [remainingDistance, setRemainingDistance] = useState(0);
  const [currentFloor, setCurrentFloor] = useState(1);
  const [floorChanged, setFloorChanged] = useState(false);
  
  const progressInterval = useRef<any>(null);

  const startNavigation = (destination: string, type: 'gate' | 'flight' | 'poi') => {
    // Get mock route based on destination
    let mockRoute: NavigationRoute | null = null;
    
    if (type === 'gate' || type === 'flight') {
      const routeKey = `gate-${destination}`;
      mockRoute = MOCK_ROUTES[routeKey] || MOCK_ROUTES['gate-23D'];
    } else {
      mockRoute = MOCK_ROUTES[destination.toLowerCase()] || MOCK_ROUTES['restroom'];
    }

    setRoute(mockRoute);
    setCurrentStep(mockRoute.steps[0]);
    setIsNavigating(true);
    setProgress(0);
    
    // Calculate total distance
    const totalDist = mockRoute.steps.reduce((sum, step) => sum + step.distance, 0);
    setRemainingDistance(totalDist);

    console.log('🚀 Navigation started:', mockRoute.destination);
    
    // Start progress simulation
    startProgressSimulation(mockRoute);
  };

  const stopNavigation = () => {
    setIsNavigating(false);
    setRoute(null);
    setCurrentStep(null);
    setProgress(0);
    setRemainingDistance(0);
    setCurrentFloor(1);
    setFloorChanged(false);
    
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }

    console.log('🛑 Navigation stopped');
  };

  const startProgressSimulation = (mockRoute: NavigationRoute) => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }

    let currentProgress = 0;
    let currentStepIndex = 0;
    const totalSteps = mockRoute.steps.length;
    const stepIncrement = 100 / totalSteps;

    progressInterval.current = setInterval(() => {
      currentProgress += 2; // Increment by 2% every interval

      if (currentProgress >= 100) {
        currentProgress = 100;
        setProgress(100);
        setRemainingDistance(0);
        
        if (progressInterval.current) {
          clearInterval(progressInterval.current);
          progressInterval.current = null;
        }
        
        console.log('✅ Destination reached!');
        return;
      }

      setProgress(currentProgress);

      // Update current step based on progress
      const newStepIndex = Math.floor(currentProgress / stepIncrement);
      if (newStepIndex !== currentStepIndex && newStepIndex < totalSteps) {
        currentStepIndex = newStepIndex;
        setCurrentStep(mockRoute.steps[currentStepIndex]);
        
        // Simulate floor change occasionally
        if (currentStepIndex === Math.floor(totalSteps / 2)) {
          setCurrentFloor(2);
          setFloorChanged(true);
          setTimeout(() => setFloorChanged(false), 3000);
        }
      }

      // Update remaining distance
      const totalDistance = mockRoute.steps.reduce((sum, step) => sum + step.distance, 0);
      const remainingDist = Math.max(0, totalDistance * (1 - currentProgress / 100));
      setRemainingDistance(Math.round(remainingDist));

    }, 500); // Update every 500ms
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, []);

  return {
    isNavigating,
    route,
    progress,
    currentStep,
    remainingDistance,
    currentFloor,
    floorChanged,
    startNavigation,
    stopNavigation,
  };
}
