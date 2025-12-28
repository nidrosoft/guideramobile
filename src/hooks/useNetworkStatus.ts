import { useState, useEffect, useCallback, useRef } from 'react';
import * as Network from 'expo-network';
import { logger } from '@/services/logging';

type NetworkType = 'wifi' | 'cellular' | 'unknown' | 'none';

interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean;
  type: NetworkType;
  isWifi: boolean;
  isCellular: boolean;
  isOffline: boolean;
}

/**
 * Hook to monitor network connectivity status
 * 
 * Usage:
 * const { isConnected, isOffline, type } = useNetworkStatus();
 * 
 * Note: Requires expo-network package
 * Install: npx expo install expo-network
 */
export function useNetworkStatus() {
  const [status, setStatus] = useState<NetworkStatus>({
    isConnected: true,
    isInternetReachable: true,
    type: 'unknown',
    isWifi: false,
    isCellular: false,
    isOffline: false,
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const previousStatusRef = useRef<boolean>(true);

  const checkNetworkStatus = useCallback(async () => {
    try {
      const networkState = await Network.getNetworkStateAsync();
      
      const newStatus: NetworkStatus = {
        isConnected: networkState.isConnected ?? false,
        isInternetReachable: networkState.isInternetReachable ?? false,
        type: (networkState.type as string) as NetworkType,
        isWifi: networkState.type === Network.NetworkStateType.WIFI,
        isCellular: networkState.type === Network.NetworkStateType.CELLULAR,
        isOffline: !networkState.isConnected || !networkState.isInternetReachable,
      };

      setStatus(newStatus);

      // Log network status changes
      if (newStatus.isOffline && previousStatusRef.current) {
        logger.warn('Network offline', { type: networkState.type });
      } else if (!newStatus.isOffline && !previousStatusRef.current) {
        logger.info('Network restored', { type: networkState.type });
      }

      previousStatusRef.current = !newStatus.isOffline;
    } catch (error) {
      logger.error('Failed to check network status', error);
    }
  }, []);

  useEffect(() => {
    // Check initial state
    checkNetworkStatus();

    // Poll for network changes (expo-network doesn't have event listener)
    intervalRef.current = setInterval(checkNetworkStatus, 5000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [checkNetworkStatus]);

  // Manual refresh function
  const refresh = useCallback(() => {
    checkNetworkStatus();
  }, [checkNetworkStatus]);

  return { ...status, refresh };
}

export default useNetworkStatus;
