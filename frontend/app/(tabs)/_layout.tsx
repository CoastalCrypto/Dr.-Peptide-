import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform } from 'react-native';
import { useTheme } from '../../src/context/ThemeContext';
import { NavigationHeader } from '../../src/components/NavigationHeader';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Empty component to hide tab bar
const HiddenTabBar = () => null;

export default function TabLayout() {
  const { colors } = useTheme();

  return (
    <SafeAreaProvider>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <NavigationHeader />
        <Tabs
          tabBar={HiddenTabBar}
          screenOptions={{
            headerShown: false,
          }}
          sceneContainerStyle={[styles.sceneContainer, { backgroundColor: colors.background }]}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sceneContainer: {
    flex: 1,
  },
});
