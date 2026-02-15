import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform } from 'react-native';
import { useTheme } from '../../src/context/ThemeContext';
import { NavigationHeader } from '../../src/components/NavigationHeader';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect } from 'react';

export default function TabLayout() {
  const { colors } = useTheme();

  // Inject CSS to hide tab bar on web
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof document !== 'undefined') {
      const style = document.createElement('style');
      style.id = 'hide-tabbar-style';
      style.textContent = `
        [role="tablist"], 
        nav[role="tablist"],
        div[role="tablist"] {
          display: none !important;
          height: 0 !important;
          max-height: 0 !important;
          overflow: hidden !important;
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }
      `;
      if (!document.getElementById('hide-tabbar-style')) {
        document.head.appendChild(style);
      }
      return () => {
        const existingStyle = document.getElementById('hide-tabbar-style');
        if (existingStyle) {
          document.head.removeChild(existingStyle);
        }
      };
    }
  }, []);

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
            sceneContainerStyle={{ backgroundColor: colors.background }}
          >
            <Tabs.Screen name="index" options={{ title: 'Home', tabBarButton: () => null }} />
            <Tabs.Screen name="calculator" options={{ title: 'Calculator', tabBarButton: () => null }} />
            <Tabs.Screen name="research" options={{ title: 'Research', tabBarButton: () => null }} />
            <Tabs.Screen name="journal" options={{ title: 'Journal', tabBarButton: () => null }} />
            <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarButton: () => null }} />
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
