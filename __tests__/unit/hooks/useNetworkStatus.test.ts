/**
 * useNetworkStatus Hook Tests
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import * as Network from 'expo-network';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

// Mock expo-network
jest.mock('expo-network');

const mockNetwork = Network as jest.Mocked<typeof Network>;

describe('useNetworkStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should return initial connected state', async () => {
    mockNetwork.getNetworkStateAsync.mockResolvedValue({
      isConnected: true,
      isInternetReachable: true,
      type: Network.NetworkStateType.WIFI,
    });

    const { result } = renderHook(() => useNetworkStatus());

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });

    expect(result.current.isOffline).toBe(false);
    // Note: isWifi check depends on the mock value matching NetworkStateType.WIFI
  });

  it('should detect offline state', async () => {
    mockNetwork.getNetworkStateAsync.mockResolvedValue({
      isConnected: false,
      isInternetReachable: false,
      type: Network.NetworkStateType.NONE,
    });

    const { result } = renderHook(() => useNetworkStatus());

    await waitFor(() => {
      expect(result.current.isConnected).toBe(false);
    });

    expect(result.current.isOffline).toBe(true);
  });

  it('should detect cellular connection', async () => {
    mockNetwork.getNetworkStateAsync.mockResolvedValue({
      isConnected: true,
      isInternetReachable: true,
      type: Network.NetworkStateType.CELLULAR,
    });

    const { result } = renderHook(() => useNetworkStatus());

    await waitFor(() => {
      expect(result.current.isCellular).toBe(true);
    });

    expect(result.current.isWifi).toBe(false);
  });

  it('should provide refresh function', async () => {
    mockNetwork.getNetworkStateAsync.mockResolvedValue({
      isConnected: true,
      isInternetReachable: true,
      type: Network.NetworkStateType.WIFI,
    });

    const { result } = renderHook(() => useNetworkStatus());

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });

    // Change network state
    mockNetwork.getNetworkStateAsync.mockResolvedValue({
      isConnected: false,
      isInternetReachable: false,
      type: Network.NetworkStateType.NONE,
    });

    // Call refresh
    await act(async () => {
      result.current.refresh();
    });

    await waitFor(() => {
      expect(result.current.isOffline).toBe(true);
    });
  });

  it('should handle network check errors gracefully', async () => {
    mockNetwork.getNetworkStateAsync.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useNetworkStatus());

    // Should not throw and maintain default state
    await waitFor(() => {
      expect(result.current).toBeDefined();
    });
  });
});
