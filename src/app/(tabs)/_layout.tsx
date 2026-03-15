import { Tabs, useRouter } from 'expo-router';
import { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, LayoutChangeEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { colors as staticColors } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { Home2, Airplane, Category, People, User } from 'iconsax-react-native';
import ScanBottomSheet, { ScanActionType } from '@/components/features/ar/ScanBottomSheet';
import AIChatSheet from '@/components/features/ai/AIChatSheet';
import { useNotifications } from '@/hooks/useNotifications';

// Custom Tab Bar with launcher button and bottom sheet
function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [showScanSheet, setShowScanSheet] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const { unreadCount: communityUnread } = useNotifications({ category: 'social', autoRefresh: true });

  // Dynamic styles based on theme
  const dynamicStyles = useMemo(() => ({
    tabBar: {
      backgroundColor: isDark ? '#1A1A1A' : colors.white,
      borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : colors.gray200,
    },
    launcherButton: {
      backgroundColor: colors.primary,
      shadowColor: colors.primary,
    },
  }), [colors, isDark]);

  // Define the order of visible tabs (excluding hidden ones like saved, inbox)
  const visibleTabNames = ['index', 'trips', 'ar', 'community', 'account'];

  // Animated indicator
  const indicatorLeft = useSharedValue(0);
  const indicatorWidth = useSharedValue(0);
  const [tabLayouts, setTabLayouts] = useState<Record<number, { x: number; width: number }>>({});

  const handleTabLayout = (index: number, event: LayoutChangeEvent) => {
    const { x, width } = event.nativeEvent.layout;
    setTabLayouts(prev => ({ ...prev, [index]: { x, width } }));
  };

  // Compute the focused visible index
  const focusedVisibleIndex = useMemo(() => {
    const focusedRoute = state.routes[state.index];
    return visibleTabNames.indexOf(focusedRoute?.name);
  }, [state.index, state.routes]);

  // Update indicator position when focused tab or layouts change
  useEffect(() => {
    const layout = tabLayouts[focusedVisibleIndex];
    if (layout) {
      // Indicator bar: 40px wide, centered within the tab
      const barWidth = 40;
      indicatorLeft.value = withTiming(layout.x + (layout.width - barWidth) / 2, { duration: 300 });
      indicatorWidth.value = withTiming(barWidth, { duration: 300 });
    }
  }, [focusedVisibleIndex, tabLayouts]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorLeft.value }],
    width: indicatorWidth.value,
  }));
  
  // Filter and sort routes to match our desired order
  const visibleRoutes = visibleTabNames
    .map(name => state.routes.find(route => route.name === name))
    .filter(Boolean) as typeof state.routes;

  const handleScanAction = (action: ScanActionType) => {
    setShowScanSheet(false);

    // Each action routes to its proper screen
    switch (action) {
      case 'ask-ai':
        setTimeout(() => setShowAIChat(true), 300);
        return;

      case 'receipt':
        router.push({ pathname: '/expenses/scan-receipt' } as any);
        return;

      case 'scan-document':
        // Route to the trip import scan flow (ticket/boarding pass scanner)
        router.push({ pathname: '/expenses/scan-receipt', params: { mode: 'document' } } as any);
        return;

      case 'navigate':
        // Combined navigator with top toggle tabs (City/Airport/Landmarks)
        router.push({ pathname: '/(tabs)/ar', params: { action: 'city-navigator', navigateMode: 'true' } });
        return;

      case 'danger-alerts':
      case 'menu-translator':
      case 'landmark-scanner':
      case 'city-navigator':
      case 'airport-navigator':
        // AR plugins — route to AR tab with the specific plugin
        router.push({ pathname: '/(tabs)/ar', params: { action } });
        return;

      default:
        router.push({ pathname: '/(tabs)/ar', params: { action } });
    }
  };

  const icons: Record<string, (color: string, focused: boolean) => React.ReactNode> = {
    index: (color, focused) => <Home2 size={24} color={color} variant={focused ? 'Bold' : 'Outline'} />,
    trips: (color, focused) => <Airplane size={24} color={color} variant={focused ? 'Bold' : 'Outline'} />,
    ar: () => null, // Handled separately
    community: (color, focused) => <People size={24} color={color} variant={focused ? 'Bold' : 'Outline'} />,
    account: (color, focused) => <User size={24} color={color} variant={focused ? 'Bold' : 'Outline'} />,
  };

  // Tab labels using translations
  const labels: Record<string, string> = {
    index: t('tabs.explore'),
    trips: t('tabs.trips'),
    ar: '',
    community: 'Connect',
    account: t('tabs.profile'),
  };

  return (
    <>
      <View style={[styles.tabBar, dynamicStyles.tabBar, { paddingBottom: insets.bottom || 4 }]}>
        {/* Animated indicator bar */}
        <Animated.View
          style={[
            styles.indicator,
            { backgroundColor: colors.primary },
            indicatorStyle,
          ]}
        />

        {visibleRoutes.map((route, index) => {
          const isFocused = state.index === state.routes.findIndex(r => r.key === route.key);
          const isLauncher = route.name === 'ar';

          const onPress = () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

            if (isLauncher) {
              // Show bottom sheet instead of navigating
              setShowScanSheet(true);
              return;
            }

            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          if (isLauncher) {
            return (
              <View
                key={route.key}
                style={styles.tabItem}
                onLayout={(e) => handleTabLayout(index, e)}
              >
                <TouchableOpacity
                  style={styles.tabItemInner}
                  onPress={onPress}
                  activeOpacity={0.8}
                >
                  <View style={styles.launcherContainer}>
                    <View style={[styles.launcherButton, dynamicStyles.launcherButton]}>
                      <Category size={24} color={staticColors.white} variant="Bold" />
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            );
          }

          const color = isFocused ? colors.primary : colors.gray400;

          return (
            <View
              key={route.key}
              style={styles.tabItem}
              onLayout={(e) => handleTabLayout(index, e)}
            >
              <TouchableOpacity
                style={styles.tabItemInner}
                onPress={onPress}
                activeOpacity={0.7}
              >
                <View style={styles.iconContainer}>
                  {icons[route.name]?.(color, isFocused)}
                  {route.name === 'community' && communityUnread > 0 && (
                    <View style={[styles.badge, { backgroundColor: colors.error }]}>
                      <Text style={styles.badgeText}>{communityUnread > 9 ? '9+' : communityUnread}</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.tabLabel, { color }]}>{labels[route.name]}</Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>

      {/* Scan Bottom Sheet - renders as overlay */}
      <ScanBottomSheet
        visible={showScanSheet}
        onClose={() => setShowScanSheet(false)}
        onSelectAction={handleScanAction}
      />

      {/* Global AI Chat Sheet */}
      <AIChatSheet
        visible={showAIChat}
        onClose={() => setShowAIChat(false)}
        contextType="global"
      />
    </>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="trips" />
      <Tabs.Screen name="ar" />
      <Tabs.Screen name="community" />
      <Tabs.Screen name="account" />
      {/* Hidden tabs */}
      <Tabs.Screen name="saved" options={{ href: null }} />
      <Tabs.Screen name="inbox" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 2,
    position: 'relative',
  },
  indicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 3,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabItemInner: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 6,
    paddingBottom: 2,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },
  iconContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -10,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  launcherContainer: {
    position: 'relative',
    top: -20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  launcherButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

