import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../src/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.secondary,
          borderTopColor: 'rgba(255,255,255,0.05)',
          height: 80,
          paddingBottom: 16,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="view-dashboard" size={size} color={color} />
          ),
          tabBarTestID: 'tab-home',
        }}
      />
      <Tabs.Screen
        name="calculator"
        options={{
          title: 'Calculator',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="needle" size={size} color={color} />
          ),
          tabBarTestID: 'tab-calculator',
        }}
      />
      <Tabs.Screen
        name="research"
        options={{
          title: 'Research',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="book-search" size={size} color={color} />
          ),
          tabBarTestID: 'tab-research',
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          title: 'Journal',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="heart-pulse" size={size} color={color} />
          ),
          tabBarTestID: 'tab-journal',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-circle" size={size} color={color} />
          ),
          tabBarTestID: 'tab-profile',
        }}
      />
    </Tabs>
  );
}
