import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AppState,
  AppStateStatus,
  StyleSheet,
  View,
} from 'react-native';
import Biometrics from 'react-native-simple-biometrics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../theme/theme';
import { AppButton } from '../ui/AppButton';
import { AppText } from '../ui/AppText';

export function BiometricLock({ children }: { children: React.ReactNode }) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [unlocked, setUnlocked] = useState(false);
  const [concealed, setConcealed] = useState(
    AppState.currentState === 'inactive' || AppState.currentState === 'background',
  );
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const appState = useRef<AppStateStatus>((AppState.currentState as AppStateStatus | null) ?? 'active');
  const attemptInProgress = useRef(false);
  const generation = useRef(0);
  const pendingSuccess = useRef(false);
  const unlockedRef = useRef(false);

  const unlock = useCallback(async () => {
    if (attemptInProgress.current || appState.current !== 'active') return;
    attemptInProgress.current = true;
    const currentGeneration = generation.current;
    setChecking(true);
    setMessage(null);

    try {
      const available = await Biometrics.canAuthenticate({ allowDeviceCredentials: true });
      if (generation.current !== currentGeneration) return;
      if (!available) {
        setMessage('Set up a fingerprint, face unlock, or screen lock in your phone settings to open Pesa Ledger.');
        return;
      }
      if (appState.current !== 'active') return;

      const success = await Biometrics.requestBioAuth({
        promptTitle: 'Unlock Pesa Ledger',
        promptMessage: 'Confirm your identity to view your ledger',
        allowDeviceCredentials: true,
      });
      if (!success || generation.current !== currentGeneration) return;
      if (appState.current === 'active') {
        unlockedRef.current = true;
        setUnlocked(true);
      } else if (appState.current === 'inactive') {
        pendingSuccess.current = true;
      }
    } catch {
      if (generation.current === currentGeneration) {
        setMessage('Authentication was cancelled or failed. Try again to unlock.');
      }
    } finally {
      if (generation.current === currentGeneration) {
        attemptInProgress.current = false;
        setChecking(false);
      }
    }
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextState => {
      appState.current = nextState;
      if (nextState === 'background') {
        generation.current += 1;
        pendingSuccess.current = false;
        attemptInProgress.current = false;
        unlockedRef.current = false;
        setChecking(false);
        setUnlocked(false);
        setConcealed(true);
      } else if (nextState === 'inactive') {
        setConcealed(true);
      } else if (nextState === 'active') {
        setConcealed(false);
        if (pendingSuccess.current) {
          pendingSuccess.current = false;
          unlockedRef.current = true;
          setUnlocked(true);
        } else if (!unlockedRef.current) {
          unlock();
        }
      }
    });

    if (appState.current === 'active') unlock();
    return () => {
      generation.current += 1;
      subscription.remove();
    };
  }, [unlock]);

  return (
    <View style={[styles.fill, { backgroundColor: colors.background }]}>
      {unlocked ? children : (
        <View style={[styles.lockScreen, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
          <View style={[styles.emblem, { backgroundColor: colors.successSurface }]}>
            <AppText style={styles.emblemText}>🔒</AppText>
          </View>
          <AppText variant="display" style={styles.title}>Pesa Ledger is locked</AppText>
          <AppText muted style={styles.description}>
            Use your phone’s fingerprint, face unlock, or screen lock to continue.
          </AppText>
          {message ? <AppText style={[styles.message, { color: colors.danger }]}>{message}</AppText> : null}
          <AppButton title="Unlock Pesa Ledger" onPress={unlock} loading={checking} style={styles.button} />
        </View>
      )}
      {concealed && unlocked ? <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  lockScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emblem: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  emblemText: { fontSize: 36 },
  title: { textAlign: 'center' },
  description: { textAlign: 'center', marginTop: 12, maxWidth: 300 },
  message: { textAlign: 'center', marginTop: 24, maxWidth: 320 },
  button: { marginTop: 32, minWidth: 220 },
});
