import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Switch, Alert, Linking, Modal, TextInput, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import { typography, spacing, DISCLAIMER } from '../../src/theme';
import { Storage, KEYS } from '../../src/utils/storage';
import { api } from '../../src/utils/api';
import { useRouter } from 'expo-router';
import { Platform } from 'react-native';
import { NotificationService } from '../../src/services/notifications';
import { AppLockService } from '../../src/services/appLock';
import { CloudSyncService } from '../../src/services/cloudSync';
import { VendorManagement } from '../../src/components/VendorManagement';

interface Settings {
  weightUnit: string;
  measureUnit: string;
  notifications: boolean;
}

export default function ProfileScreen() {
  const { colors, mode, setMode, isDark } = useTheme();
  const { user, isAuthenticated, login, logout, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [settings, setSettings] = useState<Settings>({ weightUnit: 'lbs', measureUnit: 'inches', notifications: true });
  
  // Security state
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [hasPIN, setHasPIN] = useState(false);
  const [showPINModal, setShowPINModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [biometricName, setBiometricName] = useState('Biometrics');
  
  // AI Summary state
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [weeklyRecap, setWeeklyRecap] = useState<any>(null);
  
  // Vendor Management state
  const [showVendorManagement, setShowVendorManagement] = useState(false);
  
  // Cloud Sync state
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [hasCloudData, setHasCloudData] = useState(false);

  useEffect(() => {
    Storage.get<Settings>(KEYS.SETTINGS).then(s => { if (s) setSettings(s); });
    loadSecuritySettings();
    loadWorkoutRecap();
  }, []);
  
  // Check sync status when user logs in
  useEffect(() => {
    if (isAuthenticated && user?.user_id) {
      checkSyncStatus();
    }
  }, [isAuthenticated, user?.user_id]);
  
  const loadSecuritySettings = async () => {
    const { supported, types } = await AppLockService.checkBiometricSupport();
    setBiometricSupported(supported);
    if (supported) {
      setBiometricName(AppLockService.getBiometricTypeName(types));
    }
    setBiometricEnabled(await AppLockService.isBiometricEnabled());
    setHasPIN(await AppLockService.hasPIN());
  };
  
  const loadWorkoutRecap = async () => {
    const entries = await Storage.get<any[]>(KEYS.JOURNAL_ENTRIES) || [];
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const weekEntries = entries.filter(e => new Date(e.date) >= weekAgo);
    const gymEntries = weekEntries.filter(e => e.gym_activity);
    
    if (gymEntries.length > 0) {
      const totalMins = gymEntries.reduce((sum, e) => sum + (e.gym_activity?.duration_mins || 0), 0);
      const workoutTypes: Record<string, number> = {};
      gymEntries.forEach(e => {
        const type = e.gym_activity?.type || 'other';
        workoutTypes[type] = (workoutTypes[type] || 0) + 1;
      });
      const mostFrequent = Object.entries(workoutTypes).sort((a, b) => b[1] - a[1])[0];
      
      setWeeklyRecap({
        totalWorkouts: gymEntries.length,
        totalMinutes: totalMins,
        mostFrequentType: mostFrequent ? mostFrequent[0] : null,
        streak: gymEntries.length,
      });
    }
  };

  const updateSetting = async (key: keyof Settings, value: any) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    await Storage.set(KEYS.SETTINGS, updated);
    
    if (key === 'notifications') {
      if (value) {
        const granted = await NotificationService.requestPermissions();
        if (!granted) {
          Alert.alert('Permissions Required', 'Please enable notifications in your device settings.');
          setSettings({ ...settings, notifications: false });
        }
      }
    }
  };
  
  const toggleBiometric = async (enabled: boolean) => {
    if (enabled) {
      const success = await AppLockService.authenticateWithBiometrics('Verify to enable ' + biometricName);
      if (success) {
        await AppLockService.setBiometricEnabled(true);
        setBiometricEnabled(true);
      }
    } else {
      await AppLockService.setBiometricEnabled(false);
      setBiometricEnabled(false);
    }
  };
  
  const savePIN = async () => {
    if (pinInput.length < 4) {
      Alert.alert('Invalid PIN', 'PIN must be at least 4 digits.');
      return;
    }
    if (pinInput !== pinConfirm) {
      Alert.alert('PIN Mismatch', 'PINs do not match. Please try again.');
      setPinInput('');
      setPinConfirm('');
      return;
    }
    
    const success = await AppLockService.savePIN(pinInput);
    if (success) {
      await AppLockService.setLockEnabled(true);
      setHasPIN(true);
      setShowPINModal(false);
      setPinInput('');
      setPinConfirm('');
      Alert.alert('Success', 'PIN has been set successfully.');
    }
  };
  
  const removePIN = async () => {
    Alert.alert('Remove PIN', 'Are you sure you want to remove your PIN?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        await AppLockService.removePIN();
        await AppLockService.setLockEnabled(false);
        setHasPIN(false);
      }},
    ]);
  };
  
  const generateAISummary = async () => {
    setLoadingSummary(true);
    try {
      const journal = await Storage.get<any[]>(KEYS.JOURNAL_ENTRIES) || [];
      const items = await Storage.get<any[]>(KEYS.RECURRING_ITEMS) || [];
      const response = await api.post('/api/ai/summary', {
        journal_data: journal.slice(0, 10),
        tracked_items: items.slice(0, 10),
      });
      Alert.alert('Weekly Health Summary', response.summary);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to generate summary. Please try again.');
    } finally {
      setLoadingSummary(false);
    }
  };
  
  // Cloud Sync Functions
  const checkSyncStatus = async () => {
    if (!user?.user_id) return;
    try {
      const status = await CloudSyncService.getSyncInfo(user.user_id);
      setLastSyncTime(status.lastSync);
      setHasCloudData(status.hasCloudData);
    } catch (error) {
      console.error('Failed to check sync status:', error);
    }
  };
  
  const handleBackupToCloud = async () => {
    if (!user?.user_id) {
      Alert.alert('Sign In Required', 'Please sign in with Google to backup your data.');
      return;
    }
    
    setSyncStatus('syncing');
    try {
      const result = await CloudSyncService.syncToCloud(user.user_id);
      if (result.success) {
        setSyncStatus('synced');
        setLastSyncTime(new Date().toISOString());
        setHasCloudData(true);
        Alert.alert('Backup Complete', 'Your data has been backed up to the cloud successfully.');
      } else {
        setSyncStatus('error');
        Alert.alert('Backup Failed', result.error || 'Failed to backup data. Please try again.');
      }
    } catch (error) {
      setSyncStatus('error');
      Alert.alert('Backup Failed', 'An error occurred while backing up your data.');
    }
  };
  
  const handleRestoreFromCloud = async () => {
    if (!user?.user_id) {
      Alert.alert('Sign In Required', 'Please sign in with Google to restore your data.');
      return;
    }
    
    Alert.alert(
      'Restore from Cloud',
      'This will replace your local data with data from the cloud. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Restore', onPress: async () => {
          setSyncStatus('syncing');
          try {
            const result = await CloudSyncService.syncFromCloud(user.user_id);
            if (result.success) {
              setSyncStatus('synced');
              Alert.alert('Restore Complete', 'Your data has been restored from the cloud.');
            } else {
              setSyncStatus('error');
              Alert.alert('Restore Failed', result.error || 'Failed to restore data.');
            }
          } catch (error) {
            setSyncStatus('error');
            Alert.alert('Restore Failed', 'An error occurred while restoring your data.');
          }
        }},
      ]
    );
  };
  
  const handleMergeData = async () => {
    if (!user?.user_id) {
      Alert.alert('Sign In Required', 'Please sign in with Google to merge your data.');
      return;
    }
    
    setSyncStatus('syncing');
    try {
      const result = await CloudSyncService.mergeData(user.user_id);
      if (result.success) {
        setSyncStatus('synced');
        Alert.alert('Merge Complete', `Data merged successfully. ${result.merged} new items added.`);
      } else {
        setSyncStatus('error');
        Alert.alert('Merge Failed', 'Failed to merge data. Please try again.');
      }
    } catch (error) {
      setSyncStatus('error');
      Alert.alert('Merge Failed', 'An error occurred while merging your data.');
    }
  };

  const handleGoogleAuth = () => {
    // Use the login function from AuthContext
    login();
  };

  const handleLogout = async () => {
    // Use the logout function from AuthContext
    await logout();
    setSyncStatus('idle');
    setLastSyncTime(null);
    setHasCloudData(false);
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
            // Clear cloud sync data too
            if (user?.user_id) {
              await CloudSyncService.clearCloudData(user.user_id);
            }
          } catch {}
          // Clear all local data
          const allKeys = Object.values(KEYS);
          for (const key of allKeys) {
            await Storage.remove(key);
          }
          // Log the user out
          await logout();
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

        {/* Cloud Sync Section - Only visible when authenticated */}
        {isAuthenticated && (
          <>
            <Text style={styles.sectionTitle}>Cloud Sync</Text>
            <View style={styles.settingsCard}>
              {/* Sync Status */}
              <View style={styles.syncStatusRow}>
                <View style={styles.settingInfo}>
                  <MaterialCommunityIcons 
                    name={syncStatus === 'syncing' ? 'cloud-sync' : syncStatus === 'synced' ? 'cloud-check' : 'cloud-outline'} 
                    size={24} 
                    color={syncStatus === 'synced' ? colors.success : syncStatus === 'error' ? colors.error : colors.accent} 
                  />
                  <View>
                    <Text style={styles.settingLabel}>
                      {syncStatus === 'syncing' ? 'Syncing...' : 
                       syncStatus === 'synced' ? 'Data Synced' : 
                       syncStatus === 'error' ? 'Sync Error' : 'Cloud Backup'}
                    </Text>
                    {lastSyncTime && (
                      <Text style={styles.syncTimeText}>
                        Last sync: {new Date(lastSyncTime).toLocaleDateString()} {new Date(lastSyncTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    )}
                  </View>
                </View>
                {syncStatus === 'syncing' && (
                  <ActivityIndicator size="small" color={colors.accent} />
                )}
              </View>
              <View style={styles.divider} />
              
              {/* Backup Button */}
              <TouchableOpacity 
                testID="backup-to-cloud-btn" 
                style={styles.settingRow} 
                onPress={handleBackupToCloud}
                disabled={syncStatus === 'syncing'}
              >
                <View style={styles.settingInfo}>
                  <MaterialCommunityIcons name="cloud-upload" size={22} color={colors.accent} />
                  <Text style={styles.settingLabel}>Backup to Cloud</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textTertiary} />
              </TouchableOpacity>
              <View style={styles.divider} />
              
              {/* Restore Button */}
              <TouchableOpacity 
                testID="restore-from-cloud-btn" 
                style={styles.settingRow} 
                onPress={handleRestoreFromCloud}
                disabled={syncStatus === 'syncing' || !hasCloudData}
              >
                <View style={styles.settingInfo}>
                  <MaterialCommunityIcons name="cloud-download" size={22} color={hasCloudData ? colors.accent : colors.textTertiary} />
                  <Text style={[styles.settingLabel, !hasCloudData && { color: colors.textTertiary }]}>
                    Restore from Cloud
                  </Text>
                </View>
                {hasCloudData ? (
                  <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textTertiary} />
                ) : (
                  <Text style={styles.noDataText}>No backup</Text>
                )}
              </TouchableOpacity>
              <View style={styles.divider} />
              
              {/* Merge Button */}
              <TouchableOpacity 
                testID="merge-data-btn" 
                style={styles.settingRow} 
                onPress={handleMergeData}
                disabled={syncStatus === 'syncing' || !hasCloudData}
              >
                <View style={styles.settingInfo}>
                  <MaterialCommunityIcons name="merge" size={22} color={hasCloudData ? colors.accent : colors.textTertiary} />
                  <Text style={[styles.settingLabel, !hasCloudData && { color: colors.textTertiary }]}>
                    Merge Local & Cloud Data
                  </Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textTertiary} />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.syncHint}>
              Your data is stored locally. Use Cloud Sync to backup and restore across devices.
            </Text>
          </>
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

        <Text style={styles.sectionTitle}>Vendors & Orders</Text>
        <View style={styles.settingsCard}>
          <TouchableOpacity testID="vendor-management-btn" style={styles.settingRow} onPress={() => setShowVendorManagement(true)}>
            <View style={styles.settingInfo}>
              <MaterialCommunityIcons name="store" size={22} color={colors.accent} />
              <Text style={styles.settingLabel}>Manage Vendors & Orders</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textTertiary} />
          </TouchableOpacity>
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
        
        <Text style={styles.sectionTitle}>Security</Text>
        <View style={styles.settingsCard}>
          {biometricSupported && (
            <>
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <MaterialCommunityIcons name="fingerprint" size={22} color={colors.accent} />
                  <Text style={styles.settingLabel}>{biometricName}</Text>
                </View>
                <Switch 
                  testID="biometric-switch"
                  value={biometricEnabled} 
                  onValueChange={toggleBiometric} 
                  trackColor={{ true: colors.accent, false: colors.secondary }} 
                  thumbColor={colors.primaryForeground} 
                />
              </View>
              <View style={styles.divider} />
            </>
          )}
          <TouchableOpacity testID="pin-setup-btn" style={styles.settingRow} onPress={() => hasPIN ? removePIN() : setShowPINModal(true)}>
            <View style={styles.settingInfo}>
              <MaterialCommunityIcons name="lock" size={22} color={colors.accent} />
              <Text style={styles.settingLabel}>{hasPIN ? 'Remove PIN Lock' : 'Set PIN Lock'}</Text>
            </View>
            <MaterialCommunityIcons name={hasPIN ? 'check-circle' : 'chevron-right'} size={22} color={hasPIN ? colors.success : colors.textTertiary} />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.sectionTitle}>AI Features</Text>
        <View style={styles.settingsCard}>
          <TouchableOpacity testID="ai-summary-btn" style={styles.settingRow} onPress={generateAISummary} disabled={loadingSummary}>
            <View style={styles.settingInfo}>
              <MaterialCommunityIcons name="brain" size={22} color={colors.accent} />
              <Text style={styles.settingLabel}>{loadingSummary ? 'Generating...' : 'Generate Weekly Health Summary'}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>
        
        {weeklyRecap && (
          <>
            <Text style={styles.sectionTitle}>Weekly Workout Recap</Text>
            <View style={styles.recapCard}>
              <View style={styles.recapRow}>
                <View style={styles.recapItem}>
                  <MaterialCommunityIcons name="dumbbell" size={28} color={colors.accent} />
                  <Text style={styles.recapValue}>{weeklyRecap.totalWorkouts}</Text>
                  <Text style={styles.recapLabel}>Workouts</Text>
                </View>
                <View style={styles.recapItem}>
                  <MaterialCommunityIcons name="clock-outline" size={28} color={colors.accent} />
                  <Text style={styles.recapValue}>{weeklyRecap.totalMinutes}</Text>
                  <Text style={styles.recapLabel}>Minutes</Text>
                </View>
                <View style={styles.recapItem}>
                  <MaterialCommunityIcons name="fire" size={28} color={colors.accent} />
                  <Text style={styles.recapValue}>{weeklyRecap.streak}</Text>
                  <Text style={styles.recapLabel}>Streak</Text>
                </View>
              </View>
              {weeklyRecap.mostFrequentType && (
                <View style={styles.recapBadge}>
                  <Text style={styles.recapBadgeText}>Most Active: {weeklyRecap.mostFrequentType.charAt(0).toUpperCase() + weeklyRecap.mostFrequentType.slice(1)}</Text>
                </View>
              )}
            </View>
          </>
        )}

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
      
      {/* PIN Setup Modal */}
      <Modal visible={showPINModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.pinModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Set PIN Lock</Text>
              <TouchableOpacity onPress={() => { setShowPINModal(false); setPinInput(''); setPinConfirm(''); }}>
                <MaterialCommunityIcons name="close" size={24} color={colors.textTertiary} />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.pinLabel}>Enter PIN (min 4 digits)</Text>
            <TextInput
              testID="pin-input"
              style={styles.pinInput}
              value={pinInput}
              onChangeText={setPinInput}
              keyboardType="numeric"
              secureTextEntry
              maxLength={6}
              placeholder="Enter PIN"
              placeholderTextColor={colors.textTertiary}
            />
            
            <Text style={styles.pinLabel}>Confirm PIN</Text>
            <TextInput
              testID="pin-confirm"
              style={styles.pinInput}
              value={pinConfirm}
              onChangeText={setPinConfirm}
              keyboardType="numeric"
              secureTextEntry
              maxLength={6}
              placeholder="Confirm PIN"
              placeholderTextColor={colors.textTertiary}
            />
            
            <TouchableOpacity testID="save-pin-btn" style={styles.savePinBtn} onPress={savePIN}>
              <Text style={styles.savePinBtnText}>Save PIN</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      {/* Vendor Management Modal */}
      <VendorManagement 
        visible={showVendorManagement} 
        onClose={() => setShowVendorManagement(false)} 
      />
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
  // Workout recap styles
  recapCard: { backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.md },
  recapRow: { flexDirection: 'row', justifyContent: 'space-around' },
  recapItem: { alignItems: 'center' },
  recapValue: { ...typography.h2, color: colors.textPrimary, marginTop: 4 },
  recapLabel: { ...typography.caption, color: colors.textTertiary },
  recapBadge: { backgroundColor: colors.accent, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, alignSelf: 'center', marginTop: spacing.md },
  recapBadgeText: { ...typography.bodySm, color: colors.primaryForeground, fontWeight: '700' },
  // PIN Modal styles
  modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  pinModal: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.lg, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  modalTitle: { ...typography.h2, color: colors.textPrimary },
  pinLabel: { ...typography.caption, color: colors.textTertiary, marginBottom: spacing.xs, marginTop: spacing.sm },
  pinInput: { height: 52, backgroundColor: colors.secondary, borderRadius: 12, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, color: colors.textPrimary, fontSize: 24, textAlign: 'center', letterSpacing: 8 },
  savePinBtn: { backgroundColor: colors.primary, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center', marginTop: spacing.lg },
  savePinBtnText: { ...typography.bodyBase, color: colors.primaryForeground, fontWeight: '700' },
});
