/**
 * CURVED TAB BAR
 * 
 * A custom bottom navigation bar with:
 * - Pill-shaped dark container
 * - Curved notches between tabs
 * - Active tab "bubble" effect (white circle)
 * - Smooth animations
 */

import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path, Defs, Mask, Rect, Circle } from 'react-native-svg';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { colors, shadows } from '@/styles';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Tab bar dimensions
const TAB_BAR_WIDTH = SCREEN_WIDTH - 32; // 16px margin on each side
const TAB_BAR_HEIGHT = 70;
const TAB_COUNT = 5;
const TAB_WIDTH = TAB_BAR_WIDTH / TAB_COUNT;
const ACTIVE_BUBBLE_SIZE = 56;
const MIDDLE_TAB_INDEX = 2; // AR/Scan tab (0-indexed)

// Generate the curved path for the tab bar background
// Creates 3 FULLY ROUNDED pill sections connected by liquid bridges
// Middle section is a SINGLE PERFECT CIRCLE
function generateCurvedPath(): string {
  const height = TAB_BAR_HEIGHT;
  const width = TAB_BAR_WIDTH;
  const pillRadius = height / 2; // 35px - for fully rounded pill ends
  
  // Middle circle dimensions (PERFECT CIRCLE - diameter = height)
  const middleRadius = height / 2; // 35px
  const middleCenterX = width / 2;
  const middleCenterY = height / 2; // 35px - Center Y of the circle
  
  // Connection parameters
  const connectionHeight = 20; // Height/thickness of the liquid bridge
  const connectionGap = 4; // Small gap between sections
  
  // Circle edge points - LEFT and RIGHT at the vertical CENTER
  const circleLeftX = middleCenterX - middleRadius;
  const circleRightX = middleCenterX + middleRadius;
  
  // Bridge connects at the vertical center (where circle edges are)
  const bridgeTopY = middleCenterY - (connectionHeight / 2); // 25
  const bridgeBottomY = middleCenterY + (connectionHeight / 2); // 45
  
  // Left pill: ends where connection starts
  const leftPillRightEdge = circleLeftX - connectionGap;
  const leftPillRightCenter = leftPillRightEdge - pillRadius;
  
  // Right pill: starts where connection ends
  const rightPillLeftEdge = circleRightX + connectionGap;
  const rightPillLeftCenter = rightPillLeftEdge + pillRadius;
  
  let path = `M ${pillRadius} 0`;
  
  // === LEFT PILL SECTION (Home + Trips) ===
  path += ` L ${leftPillRightCenter} 0`;
  path += ` A ${pillRadius} ${pillRadius} 0 0 1 ${leftPillRightEdge} ${bridgeTopY}`;
  
  // === LEFT BRIDGE (Top) ===
  path += ` L ${circleLeftX} ${bridgeTopY}`;
  
  // === MIDDLE CIRCLE: Full top arc (from left bridge to right bridge, going over the top) ===
  // Arc from (circleLeftX, bridgeTopY) to (circleRightX, bridgeTopY) curving UP and over
  path += ` A ${middleRadius} ${middleRadius} 0 1 1 ${circleRightX} ${bridgeTopY}`;
  
  // === RIGHT BRIDGE (Top) ===
  path += ` L ${rightPillLeftEdge} ${bridgeTopY}`;
  
  // === RIGHT PILL SECTION (Community + Account) ===
  path += ` A ${pillRadius} ${pillRadius} 0 0 1 ${rightPillLeftCenter} 0`;
  path += ` L ${width - pillRadius} 0`;
  path += ` A ${pillRadius} ${pillRadius} 0 0 1 ${width - pillRadius} ${height}`;
  path += ` L ${rightPillLeftCenter} ${height}`;
  path += ` A ${pillRadius} ${pillRadius} 0 0 1 ${rightPillLeftEdge} ${bridgeBottomY}`;
  
  // === RIGHT BRIDGE (Bottom) ===
  path += ` L ${circleRightX} ${bridgeBottomY}`;
  
  // === MIDDLE CIRCLE: Full bottom arc (from right bridge to left bridge, going under the bottom) ===
  // Arc from (circleRightX, bridgeBottomY) to (circleLeftX, bridgeBottomY) curving DOWN and under
  path += ` A ${middleRadius} ${middleRadius} 0 1 1 ${circleLeftX} ${bridgeBottomY}`;
  
  // === LEFT BRIDGE (Bottom) ===
  path += ` L ${leftPillRightEdge} ${bridgeBottomY}`;
  
  // === LEFT PILL SECTION (Bottom) ===
  path += ` A ${pillRadius} ${pillRadius} 0 0 1 ${leftPillRightCenter} ${height}`;
  path += ` L ${pillRadius} ${height}`;
  path += ` A ${pillRadius} ${pillRadius} 0 0 1 ${pillRadius} 0`;
  
  path += ' Z';
  
  return path;
}

interface CurvedTabBarProps extends BottomTabBarProps {}

export default function CurvedTabBar({
  state,
  descriptors,
  navigation,
}: CurvedTabBarProps) {
  const insets = useSafeAreaInsets();
  
  // Filter out hidden tabs - check if tabBarIcon exists (hidden tabs don't have icons)
  const visibleRoutes = state.routes.filter((route) => {
    const { options } = descriptors[route.key];
    return options.tabBarIcon !== undefined;
  });
  
  // Find the active index within visible routes
  const activeVisibleIndex = visibleRoutes.findIndex(
    (route) => route.key === state.routes[state.index]?.key
  );
  
  const activeIndex = useSharedValue(activeVisibleIndex >= 0 ? activeVisibleIndex : 0);
  
  // Update active index when tab changes
  React.useEffect(() => {
    if (activeVisibleIndex >= 0) {
      activeIndex.value = activeVisibleIndex;
    }
  }, [activeVisibleIndex]);
  
  // Animated style for the active bubble
  const bubbleAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: withSpring(activeIndex.value * TAB_WIDTH + (TAB_WIDTH - ACTIVE_BUBBLE_SIZE) / 2, {
            damping: 15,
            stiffness: 150,
          }),
        },
      ],
    };
  });
  
  // Check if current tab should hide the tab bar
  const currentRoute = state.routes[state.index];
  const currentOptions = descriptors[currentRoute?.key]?.options;
  const tabBarStyle = currentOptions?.tabBarStyle as { display?: string } | undefined;
  const shouldHide = tabBarStyle?.display === 'none';
  
  const curvedPath = generateCurvedPath();
  
  // Don't render if tab bar should be hidden
  if (shouldHide) {
    return null;
  }
  
  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <View style={styles.tabBarWrapper}>
        {/* Background with curved shape */}
        <Svg
          width={TAB_BAR_WIDTH}
          height={TAB_BAR_HEIGHT}
          style={styles.svgBackground}
        >
          <Path
            d={curvedPath}
            fill="#000000"
          />
        </Svg>
        
        {/* Active bubble indicator */}
        <Animated.View style={[styles.activeBubble, bubbleAnimatedStyle]}>
          <View style={styles.bubbleInner} />
        </Animated.View>
        
        {/* Tab buttons */}
        <View style={styles.tabsContainer}>
          {visibleRoutes.map((route, index) => {
            const { options } = descriptors[route.key];
            const isFocused = index === activeVisibleIndex;
            
            const onPress = () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };
            
            const onLongPress = () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              navigation.emit({
                type: 'tabLongPress',
                target: route.key,
              });
            };
            
            // Get the icon - black on white bubble, white on black background
            const icon = options.tabBarIcon?.({
              focused: isFocused,
              color: isFocused ? '#000000' : colors.white,
              size: 24,
            });
            
            return (
              <TouchableOpacity
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                testID={options.tabBarButtonTestID}
                onPress={onPress}
                onLongPress={onLongPress}
                style={styles.tabButton}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.iconContainer,
                  isFocused && styles.iconContainerActive,
                ]}>
                  {icon}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  tabBarWrapper: {
    width: TAB_BAR_WIDTH,
    height: TAB_BAR_HEIGHT,
    position: 'relative',
    ...shadows.lg,
  },
  svgBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  activeBubble: {
    position: 'absolute',
    top: (TAB_BAR_HEIGHT - ACTIVE_BUBBLE_SIZE) / 2,
    left: 0,
    width: ACTIVE_BUBBLE_SIZE,
    height: ACTIVE_BUBBLE_SIZE,
    zIndex: 1,
  },
  bubbleInner: {
    width: ACTIVE_BUBBLE_SIZE,
    height: ACTIVE_BUBBLE_SIZE,
    borderRadius: ACTIVE_BUBBLE_SIZE / 2,
    backgroundColor: colors.white,
    ...shadows.md,
  },
  tabsContainer: {
    flexDirection: 'row',
    height: TAB_BAR_HEIGHT,
    zIndex: 2,
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainerActive: {
    // Active state styling handled by bubble
  },
});
