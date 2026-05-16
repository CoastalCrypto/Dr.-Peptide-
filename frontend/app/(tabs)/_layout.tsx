import React, { useState, useCallback, lazy, Suspense } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../../src/context/ThemeContext';
import { SwipeableNavigation } from '../../src/components/SwipeableNavigation';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Lazy load page components for better performance
const HomeScreen = lazy(() => import('./index'));
const CalculatorScreen = lazy(() => import('./calculator'));
const ResearchScreen = lazy(() => import('./research'));
const JournalScreen = lazy(() => import('./journal'));
const ProfileScreen = lazy(() => import('./profile'));

function LoadingFallback() {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
      <ActivityIndicator size="large" color={colors.accent} />
    </View>
  );
}

export default function TabLayout() {
  const { colors } = useTheme();
  const [refreshKey, setRefreshKey] = useState(0);

  // Refresh handlers for each page
  const handleHomeRefresh = useCallback(async () => {
    setRefreshKey(prev => prev + 1);
    await new Promise(resolve => setTimeout(resolve, 800));
  }, []);

  const handleJournalRefresh = useCallback(async () => {
    setRefreshKey(prev => prev + 1);
    await new Promise(resolve => setTimeout(resolve, 800));
  }, []);

  const handleResearchRefresh = useCallback(async () => {
    await new Promise(resolve => setTimeout(resolve, 600));
  }, []);

  const pages = [
    {
      key: 'home',
      title: 'Home',
      emoji: '🏋️',
      component: (
        <Suspense fallback={<LoadingFallback />}>
          <HomeScreen key={`home-${refreshKey}`} embedded />
        </Suspense>
      ),
      onRefresh: handleHomeRefresh,
    },
    {
      key: 'calculator',
      title: 'Calculator',
      emoji: '🧮',
      component: (
        <Suspense fallback={<LoadingFallback />}>
          <CalculatorScreen embedded />
        </Suspense>
      ),
    },
    {
      key: 'research',
      title: 'Research',
      emoji: '🔬',
      component: (
        <Suspense fallback={<LoadingFallback />}>
          <ResearchScreen embedded />
        </Suspense>
      ),
      onRefresh: handleResearchRefresh,
    },
    {
      key: 'journal',
      title: 'Journal',
      emoji: '📓',
      component: (
        <Suspense fallback={<LoadingFallback />}>
          <JournalScreen key={`journal-${refreshKey}`} embedded />
        </Suspense>
      ),
      onRefresh: handleJournalRefresh,
    },
    {
      key: 'profile',
      title: 'Profile',
      emoji: '⚙️',
      component: (
        <Suspense fallback={<LoadingFallback />}>
          <ProfileScreen embedded />
        </Suspense>
      ),
    },
  ];

  return (
    <SafeAreaProvider>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <SwipeableNavigation pages={pages} initialPage={0} />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
