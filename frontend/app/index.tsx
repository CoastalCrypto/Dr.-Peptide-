import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Storage, KEYS } from '../src/utils/storage';
import { colors } from '../src/theme';

export default function Entry() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const check = async () => {
      const onboarded = await Storage.get<boolean>(KEYS.ONBOARDED);
      if (onboarded) {
        router.replace('/(tabs)');
      } else {
        router.replace('/onboarding');
      }
      setChecking(false);
    };
    check();
  }, []);

  if (checking) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }
  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
