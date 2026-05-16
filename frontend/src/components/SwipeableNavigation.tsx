import React, { useRef, useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, Platform, RefreshControl, ScrollView, FlatList } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { typography, spacing } from '../theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface PageInfo {
  key: string;
  title: string;
  emoji: string;
  component: React.ReactNode;
  onRefresh?: () => Promise<void>;
}

interface SwipeableNavigationProps {
  pages: PageInfo[];
  initialPage?: number;
}

export function SwipeableNavigation({ pages, initialPage = 0 }: SwipeableNavigationProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [refreshing, setRefreshing] = useState(false);
  const scrollX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Scroll to initial page
    if (initialPage > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({ index: initialPage, animated: false });
      }, 100);
    }
  }, []);

  const handleRefresh = async () => {
    const currentPageInfo = pages[currentPage];
    if (currentPageInfo.onRefresh) {
      setRefreshing(true);
      try {
        await currentPageInfo.onRefresh();
      } finally {
        setRefreshing(false);
      }
    }
  };

  const goToPage = (index: number) => {
    flatListRef.current?.scrollToIndex({ index, animated: true });
  };

  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentPage(viewableItems[0].index || 0);
    }
  }, []);

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const styles = createStyles(colors, insets);

  const renderPage = useCallback(({ item, index }: { item: PageInfo; index: number }) => (
    <View key={item.key} style={[styles.page, { width: SCREEN_WIDTH }]}>
      {item.component}
    </View>
  ), [styles.page]);

  return (
    <View style={styles.container}>
      {/* Header with title */}
      <View style={styles.header}>
        <Text style={styles.emoji}>{pages[currentPage]?.emoji}</Text>
        <Text style={styles.title}>{pages[currentPage]?.title}</Text>
      </View>

      {/* Swipeable Pages using FlatList */}
      <Animated.FlatList
        ref={flatListRef}
        data={pages}
        renderItem={renderPage}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(data, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
        initialScrollIndex={initialPage}
        style={styles.flatList}
      />

      {/* Page Indicator Dots */}
      <View style={styles.indicatorContainer}>
        {pages.map((page, index) => {
          const inputRange = [
            (index - 1) * SCREEN_WIDTH,
            index * SCREEN_WIDTH,
            (index + 1) * SCREEN_WIDTH,
          ];

          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [8, 24, 8],
            extrapolate: 'clamp',
          });

          const dotOpacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.4, 1, 0.4],
            extrapolate: 'clamp',
          });

          const dotColor = scrollX.interpolate({
            inputRange,
            outputRange: [colors.textTertiary, colors.accent, colors.textTertiary],
            extrapolate: 'clamp',
          });

          return (
            <TouchableOpacity
              key={page.key}
              testID={`nav-dot-${page.key}`}
              onPress={() => goToPage(index)}
              style={styles.dotTouchable}
            >
              <Animated.View
                style={[
                  styles.dot,
                  {
                    width: dotWidth,
                    opacity: dotOpacity,
                    backgroundColor: dotColor,
                  },
                ]}
              />
              <Text style={[
                styles.dotLabel,
                currentPage === index && styles.dotLabelActive
              ]}>
                {page.title}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const createStyles = (colors: any, insets: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: insets.top + 12,
    paddingBottom: 12,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 10,
  },
  emoji: {
    fontSize: 26,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  flatList: {
    flex: 1,
  },
  page: {
    flex: 1,
    backgroundColor: colors.background,
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingBottom: insets.bottom + 12,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 8,
  },
  dotTouchable: {
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  dotLabel: {
    fontSize: 10,
    color: colors.textTertiary,
    fontWeight: '500',
  },
  dotLabelActive: {
    color: colors.accent,
    fontWeight: '700',
  },
});

export default SwipeableNavigation;
