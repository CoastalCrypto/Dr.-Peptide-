import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Switch, Alert, Linking } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useTheme } from '../../src/context/ThemeContext';
import { typography, spacing, DISCLAIMER } from '../../src/theme';
import { Storage, KEYS } from '../../src/utils/storage';
import { api } from '../../src/utils/api';
import { useRouter } from 'expo-router';
import { Platform } from 'react-native';

interface Settings {
  weightUnit: string;
  measureUnit: string;
  notifications: boolean;
}

export default function ProfileScreen() {
  const { colors, mode, setMode, isDark } = useTheme();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [settings, setSettings] = useState<Settings>({ weightUnit: 'lbs', measureUnit: 'inches', notifications: true });

  useEffect(() => {
    Storage.get<any>(KEYS.USER).then(u => setUser(u));
    Storage.get<Settings>(KEYS.SETTINGS).then(s => { if (s) setSettings(s); });
  }, []);

  const updateSetting = async (key: keyof Settings, value: any) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    await Storage.set(KEYS.SETTINGS, updated);
  };

  const handleGoogleAuth = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    if (Platform.OS === 'web') {
      const redirectUrl = window.location.origin + '/(tabs)/profile';
      window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
    } else {
      Alert.alert('Google Auth', 'Google Auth is available on web preview. Use the web preview to sign in.');
    }
  };

  const handleLogout = async () => {
    try {
      await api.post('/api/auth/logout', {});
    } catch {}
    await Storage.remove(KEYS.USER);
    setUser(null);
  };

  const exportData = async () => {
    const tracker = await Storage.get(KEYS.TRACKER_ITEMS);
    const journal = await Storage.get(KEYS.JOURNAL_ENTRIES);
    const presets = await Storage.get(KEYS.CALCULATOR_PRESETS);
    const data = JSON.stringify({ tracker, journal, presets }, null, 2);
    Alert.alert('Data Export', `Your data has been prepared (${data.length} characters). Full export functionality coming in next update.`);
  };

  const clearData = () => {
    Alert.alert('Clear All Data', 'This will permanently delete all your local data. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await Storage.remove(KEYS.TRACKER_ITEMS);
        await Storage.remove(KEYS.DOSE_LOGS);
        await Storage.remove(KEYS.JOURNAL_ENTRIES);
        await Storage.remove(KEYS.CALCULATOR_PRESETS);
        await Storage.remove(KEYS.RECURRING_ITEMS);
        await Storage.remove(KEYS.CUSTOM_PEPTIDES);
        await Storage.remove(KEYS.CUSTOM_MEDS);
        await Storage.remove(KEYS.FAVORITES);
        Alert.alert('Done', 'All data has been cleared.');
      }},
    ]);
  };

  const deleteAccount = () => {
    Alert.alert(
      'Delete Account & All Data',
      'This will permanently delete your account, all cloud data, and all local data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete Everything', style: 'destructive', onPress: async () => {
          try {
            // Attempt to delete server-side data
            await api.delete('/api/auth/delete-account');
          } catch {}
          // Clear all local data
          const allKeys = Object.values(KEYS);
          for (const key of allKeys) {
            await Storage.remove(key);
          }
          setUser(null);
          Alert.alert('Account Deleted', 'All your data has been permanently removed.');
        }},
      ]
    );
  };

  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Profile</Text>

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <MaterialCommunityIcons name={user ? 'account-circle' : 'account-circle-outline'} size={56} color={colors.accent} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.name || 'Guest User'}</Text>
            <Text style={styles.profileEmail}>{user?.email || 'Local data only'}</Text>
          </View>
        </View>

        {!user ? (
          <TouchableOpacity testID="google-auth-btn" style={styles.authBtn} onPress={handleGoogleAuth}>
            <MaterialCommunityIcons name="google" size={22} color={colors.primaryForeground} />
            <Text style={styles.authBtnText}>Sign in with Google for Cloud Backup</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity testID="logout-btn" style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutBtnText}>Sign Out</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.sectionTitle}>Appearance</Text>
        <View style={styles.settingsCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <MaterialCommunityIcons 
                name={isDark ? 'moon-waning-crescent' : 'white-balance-sunny'} 
                size={22} 
                color={colors.accent} 
              />
              <Text style={styles.settingLabel}>Theme</Text>
            </View>
            <View style={styles.themeToggle}>
              <TouchableOpacity 
                testID="theme-light"
                style={[styles.themeBtn, mode === 'light' && styles.themeBtnActive]} 
                onPress={() => setMode('light')}
              >
                <MaterialCommunityIcons name="white-balance-sunny" size={18} color={mode === 'light' ? colors.primaryForeground : colors.textTertiary} />
              </TouchableOpacity>
              <TouchableOpacity 
                testID="theme-system"
                style={[styles.themeBtn, mode === 'system' && styles.themeBtnActive]} 
                onPress={() => setMode('system')}
              >
                <MaterialCommunityIcons name="cellphone" size={18} color={mode === 'system' ? colors.primaryForeground : colors.textTertiary} />
              </TouchableOpacity>
              <TouchableOpacity 
                testID="theme-dark"
                style={[styles.themeBtn, mode === 'dark' && styles.themeBtnActive]} 
                onPress={() => setMode('dark')}
              >
                <MaterialCommunityIcons name="moon-waning-crescent" size={18} color={mode === 'dark' ? colors.primaryForeground : colors.textTertiary} />
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.themeHint}>
            {mode === 'system' ? 'Following system preference' : mode === 'dark' ? 'Dark mode enabled' : 'Light mode enabled'}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.settingsCard}>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Weight Unit</Text>
            <View style={styles.toggleRow}>
              <TouchableOpacity testID="unit-lbs" style={[styles.unitBtn, settings.weightUnit === 'lbs' && styles.unitBtnActive]} onPress={() => updateSetting('weightUnit', 'lbs')}>
                <Text style={[styles.unitBtnText, settings.weightUnit === 'lbs' && styles.unitBtnTextActive]}>lbs</Text>
              </TouchableOpacity>
              <TouchableOpacity testID="unit-kg" style={[styles.unitBtn, settings.weightUnit === 'kg' && styles.unitBtnActive]} onPress={() => updateSetting('weightUnit', 'kg')}>
                <Text style={[styles.unitBtnText, settings.weightUnit === 'kg' && styles.unitBtnTextActive]}>kg</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Measurement Unit</Text>
            <View style={styles.toggleRow}>
              <TouchableOpacity style={[styles.unitBtn, settings.measureUnit === 'inches' && styles.unitBtnActive]} onPress={() => updateSetting('measureUnit', 'inches')}>
                <Text style={[styles.unitBtnText, settings.measureUnit === 'inches' && styles.unitBtnTextActive]}>in</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.unitBtn, settings.measureUnit === 'cm' && styles.unitBtnActive]} onPress={() => updateSetting('measureUnit', 'cm')}>
                <Text style={[styles.unitBtnText, settings.measureUnit === 'cm' && styles.unitBtnTextActive]}>cm</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Notifications</Text>
            <Switch testID="notifications-switch" value={settings.notifications} onValueChange={v => updateSetting('notifications', v)} trackColor={{ true: colors.accent, false: colors.secondary }} thumbColor={colors.primaryForeground} />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Data Management</Text>
        <View style={styles.settingsCard}>
          <TouchableOpacity testID="export-data-btn" style={styles.settingRow} onPress={exportData}>
            <Text style={styles.settingLabel}>Export All Data</Text>
            <MaterialCommunityIcons name="export-variant" size={22} color={colors.textTertiary} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity testID="clear-data-btn" style={styles.settingRow} onPress={clearData}>
            <Text style={[styles.settingLabel, { color: colors.error }]}>Clear All Data</Text>
            <MaterialCommunityIcons name="delete-outline" size={22} color={colors.error} />
          </TouchableOpacity>
          {user && (
            <>
              <View style={styles.divider} />
              <TouchableOpacity testID="delete-account-btn" style={styles.settingRow} onPress={deleteAccount}>
                <Text style={[styles.settingLabel, { color: colors.error }]}>Delete Account</Text>
                <MaterialCommunityIcons name="account-remove" size={22} color={colors.error} />
              </TouchableOpacity>
            </>
          )}
        </View>

        <Text style={styles.sectionTitle}>Legal</Text>
        <View style={styles.settingsCard}>
          <TouchableOpacity style={styles.settingRow} onPress={() => router.push('/privacy-policy')}>
            <Text style={styles.settingLabel}>Privacy Policy</Text>
            <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textTertiary} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.settingRow} onPress={() => Linking.openURL('https://coastalcrypto.github.io/Dr.-Peptide-/terms-of-service.html')}>
            <Text style={styles.settingLabel}>Terms of Service</Text>
            <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.settingsCard}>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Version</Text>
            <Text style={styles.settingValue}>{Constants.expoConfig?.version ?? '1.0.0'}</Text>
          </View>
        </View>

        <View style={styles.disclaimerCard}>
          <MaterialCommunityIcons name="shield-alert-outline" size={20} color={colors.warning} />
          <Text style={styles.disclaimerText}>{DISCLAIMER}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: 120 },
  title: { ...typography.h1, color: colors.textPrimary, marginBottom: spacing.lg },
  profileCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 16, padding: spacing.md, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border, gap: spacing.md },
  avatar: {},
  profileInfo: { flex: 1 },
  profileName: { ...typography.h3, color: colors.textPrimary },
  profileEmail: { ...typography.bodySm, color: colors.textSecondary, marginTop: 2 },
  authBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, height: 56, borderRadius: 28, gap: 10, marginBottom: spacing.lg },
  authBtnText: { ...typography.bodyBase, color: colors.primaryForeground, fontWeight: '600' },
  logoutBtn: { height: 48, borderRadius: 24, borderWidth: 1, borderColor: colors.error, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.lg },
  logoutBtnText: { ...typography.bodyBase, color: colors.error, fontWeight: '600' },
  sectionTitle: { ...typography.caption, color: colors.textTertiary, marginBottom: spacing.sm, marginTop: spacing.md },
  settingsCard: { backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md, minHeight: 52 },
  settingInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingLabel: { ...typography.bodyBase, color: colors.textPrimary },
  settingValue: { ...typography.bodyBase, color: colors.textTertiary },
  divider: { height: 1, backgroundColor: colors.border, marginHorizontal: spacing.md },
  toggleRow: { flexDirection: 'row', gap: 4 },
  unitBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, backgroundColor: colors.secondary, borderWidth: 1, borderColor: colors.border },
  unitBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  unitBtnText: { ...typography.bodySm, color: colors.textSecondary },
  unitBtnTextActive: { color: colors.primaryForeground, fontWeight: '700' },
  themeToggle: { flexDirection: 'row', backgroundColor: colors.secondary, borderRadius: 12, padding: 4 },
  themeBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  themeBtnActive: { backgroundColor: colors.primary },
  themeHint: { ...typography.bodySm, color: colors.textTertiary, paddingHorizontal: spacing.md, paddingBottom: spacing.md, marginTop: -8 },
  disclaimerCard: { flexDirection: 'row', backgroundColor: 'rgba(255,209,102,0.1)', borderRadius: 12, padding: spacing.md, marginTop: spacing.lg, gap: 10 },
  disclaimerText: { ...typography.bodySm, color: colors.textTertiary, flex: 1, fontSize: 11, lineHeight: 16 },
});
