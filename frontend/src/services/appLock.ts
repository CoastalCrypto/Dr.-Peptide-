import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const PIN_KEY = 'peptrack_pin_code';
const LOCK_ENABLED_KEY = 'peptrack_lock_enabled';
const BIOMETRIC_ENABLED_KEY = 'peptrack_biometric_enabled';

export const AppLockService = {
  // Check if device supports biometrics
  checkBiometricSupport: async (): Promise<{
    supported: boolean;
    types: LocalAuthentication.AuthenticationType[];
  }> => {
    if (Platform.OS === 'web') {
      return { supported: false, types: [] };
    }
    
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    
    return {
      supported: compatible && enrolled,
      types,
    };
  },

  // Authenticate with biometrics
  authenticateWithBiometrics: async (promptMessage: string = 'Authenticate to access PepTrack Pro'): Promise<boolean> => {
    if (Platform.OS === 'web') {
      return true; // Skip on web
    }
    
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        fallbackLabel: 'Use PIN',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });
      
      return result.success;
    } catch (error) {
      console.error('Biometric auth error:', error);
      return false;
    }
  },

  // Save PIN code securely
  savePIN: async (pin: string): Promise<boolean> => {
    if (Platform.OS === 'web') {
      // Use localStorage on web (less secure but functional)
      localStorage.setItem(PIN_KEY, pin);
      return true;
    }
    
    try {
      await SecureStore.setItemAsync(PIN_KEY, pin);
      return true;
    } catch (error) {
      console.error('Failed to save PIN:', error);
      return false;
    }
  },

  // Verify PIN code
  verifyPIN: async (inputPin: string): Promise<boolean> => {
    if (Platform.OS === 'web') {
      const storedPin = localStorage.getItem(PIN_KEY);
      return storedPin === inputPin;
    }
    
    try {
      const storedPin = await SecureStore.getItemAsync(PIN_KEY);
      return storedPin === inputPin;
    } catch (error) {
      console.error('Failed to verify PIN:', error);
      return false;
    }
  },

  // Check if PIN is set
  hasPIN: async (): Promise<boolean> => {
    if (Platform.OS === 'web') {
      return localStorage.getItem(PIN_KEY) !== null;
    }
    
    try {
      const pin = await SecureStore.getItemAsync(PIN_KEY);
      return pin !== null;
    } catch (error) {
      return false;
    }
  },

  // Remove PIN
  removePIN: async (): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.removeItem(PIN_KEY);
      return;
    }
    
    try {
      await SecureStore.deleteItemAsync(PIN_KEY);
    } catch (error) {
      console.error('Failed to remove PIN:', error);
    }
  },

  // Get lock enabled status
  isLockEnabled: async (): Promise<boolean> => {
    if (Platform.OS === 'web') {
      return localStorage.getItem(LOCK_ENABLED_KEY) === 'true';
    }
    
    try {
      const enabled = await SecureStore.getItemAsync(LOCK_ENABLED_KEY);
      return enabled === 'true';
    } catch (error) {
      return false;
    }
  },

  // Set lock enabled status
  setLockEnabled: async (enabled: boolean): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.setItem(LOCK_ENABLED_KEY, enabled.toString());
      return;
    }
    
    try {
      await SecureStore.setItemAsync(LOCK_ENABLED_KEY, enabled.toString());
    } catch (error) {
      console.error('Failed to set lock enabled:', error);
    }
  },

  // Get biometric enabled status
  isBiometricEnabled: async (): Promise<boolean> => {
    if (Platform.OS === 'web') {
      return false;
    }
    
    try {
      const enabled = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
      return enabled === 'true';
    } catch (error) {
      return false;
    }
  },

  // Set biometric enabled status
  setBiometricEnabled: async (enabled: boolean): Promise<void> => {
    if (Platform.OS === 'web') {
      return;
    }
    
    try {
      await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, enabled.toString());
    } catch (error) {
      console.error('Failed to set biometric enabled:', error);
    }
  },

  // Get biometric type name
  getBiometricTypeName: (types: LocalAuthentication.AuthenticationType[]): string => {
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return 'Face ID';
    }
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return 'Touch ID / Fingerprint';
    }
    if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      return 'Iris Scan';
    }
    return 'Biometrics';
  },
};
