import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import { Storage, KEYS } from '../utils/storage';
import { api } from '../utils/api';

export interface User {
  user_id: string;
  email: string;
  name: string;
  picture?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => Promise<void>;
  processAuthCallback: (sessionId: string) => Promise<boolean>;
  refreshUser: () => Promise<void>;
  syncStatus: 'idle' | 'syncing' | 'synced' | 'error';
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const hasCheckedAuth = useRef(false);

  // Check for existing session on mount
  useEffect(() => {
    if (hasCheckedAuth.current) return;
    hasCheckedAuth.current = true;
    
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    try {
      // First check local storage
      const storedUser = await Storage.get<User>(KEYS.USER);
      if (storedUser) {
        setUser(storedUser);
      }

      // Then verify with server (if on web or connected)
      if (Platform.OS === 'web' || true) {
        try {
          const serverUser = await api.get('/api/auth/me');
          setUser(serverUser);
          await Storage.set(KEYS.USER, serverUser);
        } catch (error) {
          // Session invalid or not authenticated - that's OK for guest mode
          console.log('No active server session');
        }
      }
    } catch (error) {
      console.error('Error checking session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const serverUser = await api.get('/api/auth/me');
      setUser(serverUser);
      await Storage.set(KEYS.USER, serverUser);
    } catch (error) {
      // User not authenticated
      setUser(null);
      await Storage.remove(KEYS.USER);
    }
  };

  // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
  const login = useCallback(() => {
    if (Platform.OS === 'web') {
      const redirectUrl = window.location.origin + '/auth-callback';
      window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
    } else {
      // For native, we could use expo-auth-session or WebBrowser
      // For now, show a message to use web
      console.log('Google Auth is best experienced on web preview');
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/api/auth/logout', {});
    } catch (error) {
      console.error('Logout API error:', error);
    }
    
    setUser(null);
    await Storage.remove(KEYS.USER);
    setSyncStatus('idle');
  }, []);

  const processAuthCallback = useCallback(async (sessionId: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Exchange session_id for user data and set cookie
      const userData = await api.post('/api/auth/session', { session_id: sessionId });
      
      setUser(userData);
      await Storage.set(KEYS.USER, userData);
      
      return true;
    } catch (error) {
      console.error('Auth callback error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        processAuthCallback,
        refreshUser,
        syncStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
