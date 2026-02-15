import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { useTheme } from '../../src/context/ThemeContext';
import { NavigationHeader } from '../../src/components/NavigationHeader';

export default function TabLayout() {
  const { colors } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <NavigationHeader />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: 'none' }, // Hide bottom tabs
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.textTertiary,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{ title: 'Home' }}
        />
        <Tabs.Screen
          name="calculator"
          options={{ title: 'Calculator' }}
        />
        <Tabs.Screen
          name="research"
          options={{ title: 'Research' }}
        />
        <Tabs.Screen
          name="journal"
          options={{ title: 'Journal' }}
        />
        <Tabs.Screen
          name="profile"
          options={{ title: 'Profile' }}
        />
      </Tabs>
    </View>
  );
}
