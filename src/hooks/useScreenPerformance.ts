/**
 * useScreenPerformance Hook
 * 
 * Automatically tracks screen load time and time to interactive.
 * Use this hook in screen components to monitor performance.
 * 
 * Usage:
 * function MyScreen() {
 *   useScreenPerformance('MyScreen');
 *   return <View>...</View>;
 * }
 */

import { useEffect, useRef } from 'react';
import { startScreenLoad, endScreenLoad, performanceMonitor } from '@/services/performance';

export function useScreenPerformance(screenName: string) {
  const hasTracked = useRef(false);

  useEffect(() => {
    if (hasTracked.current) return;
    
    // Start tracking on mount
    startScreenLoad(screenName);

    // End tracking after first render
    const timeoutId = setTimeout(() => {
      endScreenLoad(screenName);
      performanceMonitor.trackTimeToInteractive(screenName);
      hasTracked.current = true;
    }, 0);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [screenName]);
}

export default useScreenPerformance;
