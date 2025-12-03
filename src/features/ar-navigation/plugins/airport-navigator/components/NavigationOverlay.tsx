/**
 * NAVIGATION OVERLAY
 * 
 * SVG-based navigation overlay showing the route path and markers.
 */

import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Circle, Line, Defs, LinearGradient, Stop } from 'react-native-svg';
import { colors } from '@/styles';

const { width, height } = Dimensions.get('window');

interface NavigationOverlayProps {
  route: any;
  progress: number;
}

export default function NavigationOverlay({ route, progress }: NavigationOverlayProps) {
  // Generate path points based on route
  const pathData = `M ${width / 2} ${height * 0.8} 
                    Q ${width * 0.3} ${height * 0.6} ${width / 2} ${height * 0.4}
                    Q ${width * 0.7} ${height * 0.2} ${width / 2} ${height * 0.1}`;

  return (
    <View style={styles.container} pointerEvents="none">
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="pathGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={colors.primary} stopOpacity="0.8" />
            <Stop offset="100%" stopColor={colors.primary} stopOpacity="0.3" />
          </LinearGradient>
        </Defs>

        {/* Route Path */}
        <Path
          d={pathData}
          stroke="url(#pathGradient)"
          strokeWidth="4"
          fill="none"
          strokeDasharray="10,5"
        />

        {/* Current Position Marker */}
        <Circle
          cx={width / 2}
          cy={height * 0.8}
          r="12"
          fill={colors.primary}
          opacity="0.9"
        />
        <Circle
          cx={width / 2}
          cy={height * 0.8}
          r="8"
          fill={colors.white}
        />

        {/* Destination Marker */}
        <Circle
          cx={width / 2}
          cy={height * 0.1}
          r="16"
          fill={colors.primary}
          opacity="0.9"
        />
        <Circle
          cx={width / 2}
          cy={height * 0.1}
          r="10"
          fill={colors.white}
        />

        {/* Direction Arrows */}
        <Path
          d={`M ${width / 2} ${height * 0.6} L ${width / 2 - 15} ${height * 0.65} L ${width / 2 + 15} ${height * 0.65} Z`}
          fill={colors.primary}
          opacity="0.7"
        />
        <Path
          d={`M ${width / 2} ${height * 0.4} L ${width / 2 - 15} ${height * 0.45} L ${width / 2 + 15} ${height * 0.45} Z`}
          fill={colors.primary}
          opacity="0.5"
        />
        <Path
          d={`M ${width / 2} ${height * 0.2} L ${width / 2 - 15} ${height * 0.25} L ${width / 2 + 15} ${height * 0.25} Z`}
          fill={colors.primary}
          opacity="0.3"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
