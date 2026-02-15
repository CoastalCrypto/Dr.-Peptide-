import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../src/context/ThemeContext';
import { NavigationHeader } from '../../src/components/NavigationHeader';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function TabLayout() {
  const { colors } = useTheme();

  return (
    <SafeAreaProvider>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <NavigationHeader />
        <View style={styles.content}>
          <Tabs
            screenOptions={{
              headerShown: false,
              tabBarStyle: styles.hiddenTabBar,
            }}
          >
            <Tabs.Screen name="index" options={{ title: 'Home' }} />
            <Tabs.Screen name="calculator" options={{ title: 'Calculator' }} />
            <Tabs.Screen name="research" options={{ title: 'Research' }} />
            <Tabs.Screen name="journal" options={{ title: 'Journal' }} />
            <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
          </Tabs>
        </View>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  hiddenTabBar: {
    display: 'none',
    height: 0,
    overflow: 'hidden',
    opacity: 0,
    position: 'absolute',
    bottom: -1000,
    left: -1000,
  },
});
