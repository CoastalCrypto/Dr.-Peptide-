import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { useTheme } from '../context/ThemeContext';
import { typography, spacing } from '../theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface NavItem {
  name: string;
  path: string;
  icon: string;
  emoji: string;
}

const NAV_ITEMS: NavItem[] = [
  { name: 'Home', path: '/(tabs)', icon: 'home', emoji: '🏋️' },
  { name: 'Calculator', path: '/(tabs)/calculator', icon: 'calculator', emoji: '🧮' },
  { name: 'Research', path: '/(tabs)/research', icon: 'flask', emoji: '🔬' },
  { name: 'Journal', path: '/(tabs)/journal', icon: 'book-open-page-variant', emoji: '📓' },
  { name: 'Profile', path: '/(tabs)/profile', icon: 'cog', emoji: '⚙️' },
];

export function NavigationHeader() {
  const { colors } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const [menuOpen, setMenuOpen] = useState(false);

  // Get current page name
  const getCurrentPageName = () => {
    if (pathname === '/' || pathname === '/(tabs)' || pathname === '/(tabs)/index' || pathname.endsWith('/index')) return 'Home';
    if (pathname.includes('/calculator')) return 'Calculator';
    if (pathname.includes('/research')) return 'Research';
    if (pathname.includes('/journal')) return 'Journal';
    if (pathname.includes('/profile')) return 'Profile';
    return 'Home';
  };

  const getCurrentEmoji = () => {
    if (pathname === '/' || pathname === '/(tabs)' || pathname === '/(tabs)/index' || pathname.endsWith('/index')) return '🏋️';
    if (pathname.includes('/calculator')) return '🧮';
    if (pathname.includes('/research')) return '🔬';
    if (pathname.includes('/journal')) return '📓';
    if (pathname.includes('/profile')) return '⚙️';
    return '🏋️';
  };

  const navigateTo = (path: string) => {
    setMenuOpen(false);
    router.push(path as any);
  };

  const isActive = (path: string) => {
    if (path === '/(tabs)') {
      return pathname === '/(tabs)' || pathname === '/(tabs)/index';
    }
    return pathname.includes(path.replace('/(tabs)', ''));
  };

  const styles = createStyles(colors, insets.top);

  return (
    <>
      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity 
          testID="nav-menu-btn"
          style={styles.menuButton} 
          onPress={() => setMenuOpen(true)}
        >
          <Text style={{ fontSize: 22 }}>☰</Text>
        </TouchableOpacity>
        
        <View style={styles.titleContainer}>
          <Text style={styles.emoji}>{getCurrentEmoji()}</Text>
          <Text style={styles.title}>{getCurrentPageName()}</Text>
        </View>
        
        <View style={styles.spacer} />
      </View>

      {/* Dropdown Menu Modal */}
      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setMenuOpen(false)}>
          <View style={[styles.menuContainer, { paddingTop: insets.top }]}>
            <View style={styles.menuHeader}>
              <Text style={styles.menuTitle}>PepTrack Pro</Text>
              <TouchableOpacity 
                testID="nav-menu-close"
                onPress={() => setMenuOpen(false)}
              >
                <MaterialCommunityIcons name="close" size={24} color={colors.textTertiary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.menuItems}>
              {NAV_ITEMS.map((item) => (
                <TouchableOpacity
                  key={item.path}
                  testID={`nav-${item.name.toLowerCase()}`}
                  style={[
                    styles.menuItem,
                    isActive(item.path) && styles.menuItemActive
                  ]}
                  onPress={() => navigateTo(item.path)}
                >
                  <Text style={styles.menuEmoji}>{item.emoji}</Text>
                  <Text style={[
                    styles.menuItemText,
                    isActive(item.path) && styles.menuItemTextActive
                  ]}>
                    {item.name}
                  </Text>
                  {isActive(item.path) && (
                    <MaterialCommunityIcons 
                      name="check" 
                      size={20} 
                      color={colors.accent} 
                      style={styles.checkIcon}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const createStyles = (colors: any, topInset: number) => StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: topInset + 8,
    paddingBottom: 12,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emoji: {
    fontSize: 24,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  spacer: {
    width: 44,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  menuContainer: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuTitle: {
    ...typography.h2,
    color: colors.accent,
  },
  menuItems: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    marginBottom: 4,
  },
  menuItemActive: {
    backgroundColor: colors.accent + '15',
  },
  menuEmoji: {
    fontSize: 22,
    marginRight: 14,
  },
  menuItemText: {
    ...typography.bodyLg,
    color: colors.textPrimary,
    flex: 1,
  },
  menuItemTextActive: {
    color: colors.accent,
    fontWeight: '700',
  },
  checkIcon: {
    marginLeft: 8,
  },
});

export default NavigationHeader;
