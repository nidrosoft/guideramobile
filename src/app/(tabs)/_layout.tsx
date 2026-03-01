import { Tabs, useRouter } from 'expo-router';
import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { colors as staticColors } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { Home2, Airplane, Category, People, User } from 'iconsax-react-native';
import ScanBottomSheet, { ScanActionType } from '@/components/features/ar/ScanBottomSheet';

// Custom Tab Bar with launcher button and bottom sheet
function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [showScanSheet, setShowScanSheet] = useState(false);
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();

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
  
  // Filter and sort routes to match our desired order
  const visibleRoutes = visibleTabNames
    .map(name => state.routes.find(route => route.name === name))
    .filter(Boolean) as typeof state.routes;

  const handleScanAction = (action: ScanActionType) => {
    setShowScanSheet(false);
    router.push({ pathname: '/(tabs)/ar', params: { action } });
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
    community: t('tabs.community'),
    account: t('tabs.profile'),
  };

  return (
    <>
      <View style={[styles.tabBar, dynamicStyles.tabBar, { paddingBottom: insets.bottom || 8 }]}>
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
              <TouchableOpacity
                key={route.key}
                style={styles.tabItem}
                onPress={onPress}
                activeOpacity={0.8}
              >
                <View style={styles.launcherContainer}>
                  <View style={[styles.launcherButton, dynamicStyles.launcherButton]}>
                    <Category size={24} color={staticColors.white} variant="Bold" />
                  </View>
                </View>
              </TouchableOpacity>
            );
          }

          const color = isFocused ? colors.primary : colors.gray400;

          return (
            <TouchableOpacity
              key={route.key}
              style={styles.tabItem}
              onPress={onPress}
              activeOpacity={0.7}
            >
              {icons[route.name]?.(color, isFocused)}
              <Text style={[styles.tabLabel, { color }]}>{labels[route.name]}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Scan Bottom Sheet - renders as overlay */}
      <ScanBottomSheet
        visible={showScanSheet}
        onClose={() => setShowScanSheet(false)}
        onSelectAction={handleScanAction}
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
    paddingTop: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
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

