import { Tabs } from 'expo-router';
import { colors, typography } from '@/styles';
import { Home2, Airplane, Scan, People, User } from 'iconsax-react-native';
import CurvedTabBar from '@/components/common/navigation/CurvedTabBar';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <CurvedTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.white,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Home2 size={24} color={color} variant={focused ? 'Bold' : 'Outline'} />
          ),
        }}
      />
      <Tabs.Screen
        name="trips"
        options={{
          title: 'Trips',
          tabBarIcon: ({ color, focused }) => (
            <Airplane size={24} color={color} variant={focused ? 'Bold' : 'Outline'} />
          ),
        }}
      />
      <Tabs.Screen
        name="ar"
        options={{
          title: 'AR',
          tabBarIcon: ({ color, focused }) => (
            <Scan size={24} color={color} variant={focused ? 'Bold' : 'Outline'} />
          ),
          tabBarStyle: { display: 'none' },
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: 'Community',
          tabBarIcon: ({ color, focused }) => (
            <People size={24} color={color} variant={focused ? 'Bold' : 'Outline'} />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
          tabBarIcon: ({ color, focused }) => (
            <User size={24} color={color} variant={focused ? 'Bold' : 'Outline'} />
          ),
        }}
      />
      {/* Hidden tabs - no longer in navigation */}
      <Tabs.Screen name="saved" options={{ href: null }} />
      <Tabs.Screen name="inbox" options={{ href: null }} />
    </Tabs>
  );
}

