import { Tabs } from 'expo-router';
import { View, Platform } from 'react-native';
import { useTheme } from '../../src/context/ThemeContext';
import { NavigationHeader } from '../../src/components/NavigationHeader';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function TabLayout() {
  const { colors } = useTheme();

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <NavigationHeader />
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarStyle: { 
              display: 'none',
              height: 0,
              opacity: 0,
              position: 'absolute',
              bottom: -100,
            },
            tabBarActiveTintColor: colors.accent,
            tabBarInactiveTintColor: colors.textTertiary,
          }}
        >
          <Tabs.Screen name="index" options={{ title: 'Home' }} />
          <Tabs.Screen name="calculator" options={{ title: 'Calculator' }} />
          <Tabs.Screen name="research" options={{ title: 'Research' }} />
          <Tabs.Screen name="journal" options={{ title: 'Journal' }} />
          <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
        </Tabs>
      </View>
    </SafeAreaProvider>
  );
}
