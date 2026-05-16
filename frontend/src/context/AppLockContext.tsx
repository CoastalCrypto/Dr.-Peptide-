import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import { AppLockService } from '../services/appLock';

interface AppLockContextType {
  isLocked: boolean;
  isLockEnabled: boolean;
  unlock: () => void;
  checkLockStatus: () => Promise<void>;
}

const AppLockContext = createContext<AppLockContextType>({
  isLocked: false,
  isLockEnabled: false,
  unlock: () => {},
  checkLockStatus: async () => {},
});

export function AppLockProvider({ children }: { children: ReactNode }) {
  const [isLocked, setIsLocked] = useState(false);
  const [isLockEnabled, setIsLockEnabled] = useState(false);
  const [hasCheckedInitial, setHasCheckedInitial] = useState(false);

  useEffect(() => {
    checkLockStatus();
  }, []);

  // Lock app when coming back from background
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && isLockEnabled && hasCheckedInitial) {
        // Re-lock when app comes to foreground
        setIsLocked(true);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [isLockEnabled, hasCheckedInitial]);

  const checkLockStatus = async () => {
    const enabled = await AppLockService.isLockEnabled();
    const hasPIN = await AppLockService.hasPIN();
    
    setIsLockEnabled(enabled && hasPIN);
    
    // Lock on initial load if lock is enabled
    if (enabled && hasPIN) {
      setIsLocked(true);
    }
    
    setHasCheckedInitial(true);
  };

  const unlock = () => {
    setIsLocked(false);
  };

  return (
    <AppLockContext.Provider value={{ isLocked, isLockEnabled, unlock, checkLockStatus }}>
      {children}
    </AppLockContext.Provider>
  );
}

export function useAppLock() {
  const context = useContext(AppLockContext);
  if (!context) {
    throw new Error('useAppLock must be used within an AppLockProvider');
  }
  return context;
}
