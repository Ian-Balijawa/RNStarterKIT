import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AppState,
  AppStateStatus,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import Biometrics from 'react-native-simple-biometrics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../theme/theme';
import { AppButton } from '../ui/AppButton';
import { AppText } from '../ui/AppText';

type IconName = 'wallet' | 'receipt' | 'target' | 'shield';

function Glyph({
  name,
  color,
  size = 22,
}: {
  name: IconName;
  color: string;
  size?: number;
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round">
      {name === 'wallet' ? (
        <>
          <Path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4" />
          <Path d="M4 6v12c0 1.1.9 2 2 2h14v-4" />
          <Path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z" />
        </>
      ) : null}
      {name === 'receipt' ? (
        <>
          <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <Path d="M14 2v6h6" />
          <Path d="M16 13H8" />
          <Path d="M16 17H8" />
          <Path d="M10 9H8" />
        </>
      ) : null}
      {name === 'target' ? (
        <>
          <Circle cx={12} cy={12} r={10} />
          <Circle cx={12} cy={12} r={6} />
          <Circle cx={12} cy={12} r={2} />
        </>
      ) : null}
      {name === 'shield' ? (
        <>
          <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <Rect x={9.5} y={10.5} width={5} height={4} rx={1} />
          <Path d="M10.5 10.5V9.5a1.5 1.5 0 0 1 3 0v1" />
        </>
      ) : null}
    </Svg>
  );
}

type Props = {
  children: React.ReactNode;
  userName?: string;
  lockAfterMs?: number;
};

type LockProps = Props & {
  enabledInDev?: boolean;
};

export function BiometricLock({ enabledInDev = false, ...props }: LockProps) {
  if (__DEV__ && !enabledInDev) {
    return <>{props.children}</>;
  }
  return <BiometricGate {...props} />;
}

function BiometricGate({ children, userName, lockAfterMs = 0 }: Props) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [unlocked, setUnlocked] = useState(false);
  const [concealed, setConcealed] = useState(
    AppState.currentState === 'inactive' ||
      AppState.currentState === 'background',
  );
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const appState = useRef<AppStateStatus>(
    (AppState.currentState as AppStateStatus | null) ?? 'active',
  );
  const attemptInProgress = useRef(false);
  const generation = useRef(0);
  const pendingSuccess = useRef(false);
  const unlockedRef = useRef(false);
  const backgroundedAt = useRef<number | null>(null);

  const lock = useCallback(() => {
    unlockedRef.current = false;
    setUnlocked(false);
  }, []);

  const unlock = useCallback(async () => {
    if (attemptInProgress.current || appState.current !== 'active') return;
    attemptInProgress.current = true;
    const currentGeneration = generation.current;
    setChecking(true);
    setMessage(null);
    setUnavailable(false);

    try {
      const available = await Biometrics.canAuthenticate({
        allowDeviceCredentials: true,
      });
      if (generation.current !== currentGeneration) return;
      if (!available) {
        setUnavailable(true);
        setMessage(
          'Set up a fingerprint, face unlock, or screen lock in your phone settings to open Pesa Ledger.',
        );
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
        setMessage('Authentication cancelled or failed');
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
        setChecking(false);
        backgroundedAt.current = unlockedRef.current ? Date.now() : null;
        if (lockAfterMs <= 0) lock();
        setConcealed(true);
      } else if (nextState === 'inactive') {
        setConcealed(true);
      } else if (nextState === 'active') {
        setConcealed(false);
        if (pendingSuccess.current) {
          pendingSuccess.current = false;
          unlockedRef.current = true;
          setUnlocked(true);
        } else if (
          unlockedRef.current &&
          backgroundedAt.current !== null &&
          Date.now() - backgroundedAt.current >= lockAfterMs
        ) {
          lock();
        }
        backgroundedAt.current = null;
        if (!unlockedRef.current) unlock();
      }
    });

    if (appState.current === 'active') unlock();
    return () => {
      generation.current += 1;
      attemptInProgress.current = false;
      subscription.remove();
    };
  }, [unlock, lock, lockAfterMs]);

  const openSettings = () => {
    Linking.openSettings().catch(() => {});
  };

  const greeting = userName?.trim()
    ? `Welcome back, ${userName.trim()}`
    : 'Welcome back';

  return (
    <View style={[styles.fill, { backgroundColor: colors.background }]}>
      {unlocked ? (
        children
      ) : (
        <ScrollView
          bounces={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.landing,
            { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
          ]}>
          <View style={styles.content}>
            <View style={styles.brandRow}>
              <View
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                style={[styles.logo, { backgroundColor: colors.hero }]}>
                <Glyph name="wallet" color="#FFFFFF" size={22} />
              </View>
              <AppText variant="label" style={styles.brandName}>
                Pesa Ledger
              </AppText>
            </View>

            <View style={styles.headline}>
              <AppText variant="caption" muted style={styles.eyebrow}>
                YOUR PRIVATE LEDGER
              </AppText>
              <AppText
                variant="display"
                accessibilityRole="header"
                style={styles.title}>
                Your money, for your eyes only.
              </AppText>
              <AppText muted style={styles.subtitle}>
                {greeting}. Unlock to see your balances and activity.
              </AppText>
            </View>

            <View
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              style={[styles.previewCard, { backgroundColor: colors.hero }]}>
              <AppText style={styles.previewKicker}>
                TOTAL ACROSS ACCOUNTS
              </AppText>
              <AppText style={styles.previewAmount}>UGX ••••••</AppText>
              <View style={styles.previewDivider} />
              <AppText style={styles.previewSmall}>
                Balances stay hidden until you unlock.
              </AppText>
            </View>

            <View
              style={[
                styles.securityNote,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}>
              <View
                style={[
                  styles.securityIcon,
                  { backgroundColor: colors.successSurface },
                ]}>
                <Glyph name="shield" color={colors.primary} size={22} />
              </View>
              <View style={styles.featureText}>
                <AppText variant="label">Protected by your device</AppText>
                <AppText variant="caption" muted>
                  Use your fingerprint, face, or screen lock. Your ledger stays
                  available offline.
                </AppText>
              </View>
            </View>

            {message ? (
              <AppText
                accessibilityRole="alert"
                accessibilityLiveRegion="polite"
                style={[styles.message]}>
                {message}
              </AppText>
            ) : null}

            <AppButton
              title={
                message && !unavailable ? 'Try again' : 'Unlock Pesa Ledger'
              }
              onPress={unlock}
              loading={checking}
              style={styles.button}
            />
            {unavailable ? (
              <Pressable
                accessibilityRole="link"
                accessibilityLabel="Open phone settings"
                onPress={openSettings}
                style={styles.settingsLink}>
                <AppText variant="label" style={{ color: colors.primary }}>
                  Open phone settings
                </AppText>
              </Pressable>
            ) : null}
            <AppText variant="caption" muted style={styles.footnote}>
              Secured with your fingerprint, face unlock, or screen lock.
            </AppText>
          </View>
        </ScrollView>
      )}
      {concealed && unlocked ? (
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: colors.background },
          ]}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  landing: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  content: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    gap: 24,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: { fontWeight: '800', fontSize: 16 },
  headline: { gap: 8 },
  eyebrow: { fontWeight: '800', letterSpacing: 1.6 },
  title: { fontSize: 34, lineHeight: 40, maxWidth: 330 },
  subtitle: { fontSize: 15 },
  previewCard: { borderRadius: 24, padding: 20, gap: 12 },
  previewKicker: {
    color: '#D8E8DD',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  previewAmount: {
    color: '#FFFFFF',
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '800',
    letterSpacing: 1,
  },
  previewDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.23)' },
  previewSmall: { color: '#D8E8DD', fontSize: 13 },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
  },
  securityIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: { flex: 1, minWidth: 0, gap: 2 },
  message: { textAlign: 'center' },
  button: { alignSelf: 'stretch' },
  settingsLink: {
    minHeight: 44,
    paddingHorizontal: 12,
    alignSelf: 'center',
    justifyContent: 'center',
  },
  footnote: { textAlign: 'center' },
});
