import { Tabs } from 'expo-router';
import { Text, StyleSheet } from 'react-native';
import { useTheme } from '../../src/context/ThemeContext';
import { FONT_MARKER } from '../../src/theme';

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return <Text style={[styles.emoji, focused && styles.emojiFocused]}>{emoji}</Text>;
}

export default function TabLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.secondary,
          borderTopColor: colors.border,
          height: 82,
          paddingBottom: 18,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏋️" focused={focused} />,
          tabBarTestID: 'tab-home',
        }}
      />
      <Tabs.Screen
        name="calculator"
        options={{
          title: 'Calculator',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🧮" focused={focused} />,
          tabBarTestID: 'tab-calculator',
        }}
      />
      <Tabs.Screen
        name="research"
        options={{
          title: 'Research',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🔬" focused={focused} />,
          tabBarTestID: 'tab-research',
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          title: 'Journal',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📓" focused={focused} />,
          tabBarTestID: 'tab-journal',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon emoji="⚙️" focused={focused} />,
          tabBarTestID: 'tab-profile',
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  emoji: { fontSize: 24 },
  emojiFocused: { fontSize: 28, transform: [{ scale: 1.15 }] },
});
