import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable } from 'react-native';
import { useRouter, usePathname, useSegments } from 'expo-router';
import { useTheme } from '../context/ThemeContext';
import { typography, spacing } from '../theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { VendorManagement } from './VendorManagement';

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
  const segments = useSegments();
  const insets = useSafeAreaInsets();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showVendorManagement, setShowVendorManagement] = useState(false);

  // Get current page name using segments (more reliable than pathname)
  const getCurrentPageName = () => {
    const lastSegment = segments[segments.length - 1];
    if (!lastSegment || lastSegment === '(tabs)' || lastSegment === 'index') return 'Home';
    if (lastSegment === 'calculator') return 'Calculator';
    if (lastSegment === 'research') return 'Research';
    if (lastSegment === 'journal') return 'Journal';
    if (lastSegment === 'profile') return 'Profile';
    return 'Home';
  };

  const getCurrentEmoji = () => {
    const lastSegment = segments[segments.length - 1];
    if (!lastSegment || lastSegment === '(tabs)' || lastSegment === 'index') return '🏋️';
    if (lastSegment === 'calculator') return '🧮';
    if (lastSegment === 'research') return '🔬';
    if (lastSegment === 'journal') return '📓';
    if (lastSegment === 'profile') return '⚙️';
    return '🏋️';
  };

  const navigateTo = (path: string) => {
    setMenuOpen(false);
    router.push(path as any);
  };

  const isActive = (itemPath: string) => {
    const lastSegment = segments[segments.length - 1];
    if (itemPath === '/(tabs)') {
      return !lastSegment || lastSegment === '(tabs)' || lastSegment === 'index';
    }
    const itemName = itemPath.replace('/(tabs)/', '');
    return lastSegment === itemName;
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
                <Text style={{ fontSize: 20, color: colors.textTertiary }}>✕</Text>
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
                    <Text style={{ fontSize: 16, color: colors.accent, marginLeft: 8 }}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
              
              {/* Divider */}
              <View style={styles.menuDivider} />
              
              {/* Vendor Management */}
              <TouchableOpacity
                testID="nav-vendors"
                style={styles.menuItem}
                onPress={() => {
                  setMenuOpen(false);
                  setShowVendorManagement(true);
                }}
              >
                <Text style={styles.menuEmoji}>🏪</Text>
                <Text style={styles.menuItemText}>Vendor Management</Text>
              </TouchableOpacity>
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
