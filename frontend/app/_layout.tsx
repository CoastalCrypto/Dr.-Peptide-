import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#1B3A5C' } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="peptide/[id]"
          options={{
            headerShown: true,
            headerStyle: { backgroundColor: '#152E48' },
            headerTintColor: '#FFFFFF',
            headerTitle: 'Peptide Details',
            presentation: 'card',
          }}
        />
      </Stack>
    </>
  );
}
