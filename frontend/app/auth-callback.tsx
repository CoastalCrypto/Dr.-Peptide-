import { useEffect, useRef } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { useTheme } from '../src/context/ThemeContext';

/**
 * AuthCallback handles the OAuth redirect from Emergent Auth
 * Processes the session_id from URL fragment and exchanges it for user data
 */
export default function AuthCallback() {
  const router = useRouter();
  const { processAuthCallback } = useAuth();
  const { colors } = useTheme();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Use ref to prevent double processing in StrictMode
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const handleCallback = async () => {
      try {
        // Extract session_id from URL fragment
        // URL will be like: /auth-callback#session_id=xxx
        let sessionId: string | null = null;

        if (typeof window !== 'undefined') {
          const hash = window.location.hash;
          if (hash) {
            const params = new URLSearchParams(hash.substring(1));
            sessionId = params.get('session_id');
          }
        }

        if (sessionId) {
          const success = await processAuthCallback(sessionId);
          
          if (success) {
            // Clear the hash from URL for cleanliness
            if (typeof window !== 'undefined') {
              window.history.replaceState(null, '', window.location.pathname);
            }
            
            // Redirect to profile with success
            router.replace('/(tabs)/profile');
          } else {
            // Auth failed, redirect to profile anyway
            router.replace('/(tabs)/profile');
          }
        } else {
          // No session_id, redirect to profile
          router.replace('/(tabs)/profile');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        router.replace('/(tabs)/profile');
      }
    };

    handleCallback();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.accent} />
      <Text style={[styles.text, { color: colors.textPrimary }]}>Signing you in...</Text>
      <Text style={[styles.subtext, { color: colors.textSecondary }]}>Please wait while we complete authentication</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  text: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 24,
  },
  subtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
});
