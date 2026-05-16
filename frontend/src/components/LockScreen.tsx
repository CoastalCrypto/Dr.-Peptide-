import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { typography, spacing } from '../theme';
import { AppLockService } from '../services/appLock';

interface LockScreenProps {
  onUnlock: () => void;
}

export function LockScreen({ onUnlock }: LockScreenProps) {
  const { colors } = useTheme();
  const [pin, setPin] = useState('');
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricName, setBiometricName] = useState('Biometrics');
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    checkBiometrics();
  }, []);

  const checkBiometrics = async () => {
    const { supported, types } = await AppLockService.checkBiometricSupport();
    setBiometricSupported(supported);
    if (supported) {
      setBiometricName(AppLockService.getBiometricTypeName(types));
    }
    
    const enabled = await AppLockService.isBiometricEnabled();
    setBiometricEnabled(enabled);
    
    // Auto-trigger biometric auth if supported and enabled
    if (supported && enabled) {
      setTimeout(() => authenticateWithBiometrics(), 500);
    }
  };

  const authenticateWithBiometrics = async () => {
    if (!biometricSupported || !biometricEnabled) return;
    
    const success = await AppLockService.authenticateWithBiometrics();
    if (success) {
      onUnlock();
    }
  };

  const handlePinInput = (digit: string) => {
    if (isLocked || pin.length >= 6) return;
    
    const newPin = pin + digit;
    setPin(newPin);
    
    // Auto-verify when 4 or 6 digits entered
    if (newPin.length === 4 || newPin.length === 6) {
      verifyPin(newPin);
    }
  };

  const handleBackspace = () => {
    if (isLocked) return;
    setPin(prev => prev.slice(0, -1));
  };

  const verifyPin = async (inputPin: string) => {
    const isValid = await AppLockService.verifyPIN(inputPin);
    
    if (isValid) {
      setAttempts(0);
      onUnlock();
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setPin('');
      
      if (newAttempts >= 5) {
        setIsLocked(true);
        Alert.alert(
          'Too Many Attempts',
          'Please wait 30 seconds before trying again.',
          [{ text: 'OK' }]
        );
        setTimeout(() => {
          setIsLocked(false);
          setAttempts(0);
        }, 30000);
      } else {
        Alert.alert('Incorrect PIN', `${5 - newAttempts} attempts remaining`);
      }
    }
  };

  const styles = createStyles(colors);

  const PinDots = () => (
    <View style={styles.pinDotsRow}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <View
          key={i}
          style={[
            styles.pinDot,
            pin.length > i && styles.pinDotFilled,
            isLocked && styles.pinDotLocked,
          ]}
        />
      ))}
    </View>
  );

  const Keypad = () => (
    <View style={styles.keypad}>
      {[[1, 2, 3], [4, 5, 6], [7, 8, 9], ['bio', 0, 'del']].map((row, ri) => (
        <View key={ri} style={styles.keypadRow}>
          {row.map((item) => {
            if (item === 'bio') {
              if (!biometricSupported || !biometricEnabled) {
                return <View key={item} style={styles.keypadPlaceholder} />;
              }
              return (
                <TouchableOpacity
                  key={item}
                  style={styles.keypadBtn}
                  onPress={authenticateWithBiometrics}
                  testID="biometric-btn"
                >
                  <MaterialCommunityIcons
                    name={biometricName.includes('Face') ? 'face-recognition' : 'fingerprint'}
                    size={28}
                    color={colors.accent}
                  />
                </TouchableOpacity>
              );
            }
            if (item === 'del') {
              return (
                <TouchableOpacity
                  key={item}
                  style={styles.keypadBtn}
                  onPress={handleBackspace}
                  testID="backspace-btn"
                  disabled={isLocked}
                >
                  <MaterialCommunityIcons name="backspace-outline" size={28} color={colors.textSecondary} />
                </TouchableOpacity>
              );
            }
            return (
              <TouchableOpacity
                key={item}
                style={styles.keypadBtn}
                onPress={() => handlePinInput(item.toString())}
                testID={`key-${item}`}
                disabled={isLocked}
              >
                <Text style={styles.keypadText}>{item}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <MaterialCommunityIcons name="shield-lock" size={64} color={colors.accent} />
        <Text style={styles.title}>PepTrack Pro</Text>
        <Text style={styles.subtitle}>Enter your PIN to unlock</Text>
        
        <PinDots />
        
        {isLocked && (
          <Text style={styles.lockedText}>Too many attempts. Please wait...</Text>
        )}
        
        <Keypad />
      </View>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.bodyBase,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  pinDotsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: spacing.xl,
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: 'transparent',
  },
  pinDotFilled: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  pinDotLocked: {
    borderColor: colors.error,
  },
  lockedText: {
    ...typography.bodySm,
    color: colors.error,
    marginBottom: spacing.md,
  },
  keypad: {
    gap: 16,
  },
  keypadRow: {
    flexDirection: 'row',
    gap: 24,
  },
  keypadBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  keypadPlaceholder: {
    width: 72,
    height: 72,
  },
  keypadText: {
    ...typography.h2,
    color: colors.textPrimary,
    fontSize: 28,
  },
});

export default LockScreen;
