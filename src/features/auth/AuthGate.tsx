import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppButton } from '../../components/ui/AppButton';
import { useAppTheme } from '../../theme/theme';
import { useAuth } from './AuthProvider';
import { ApiError } from '../../services/api/client';

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading, error, retry, signIn } = useAuth();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const focusedInput = useRef<'phone' | 'password' | null>(null);
  const fieldPositions = useRef({ group: 0, phone: 0, password: 0 });
  const revealInput = (input: 'phone' | 'password') => {
    const positions = fieldPositions.current;
    scrollRef.current?.scrollTo({
      y: Math.max(0, positions.group + positions[input] - 16),
      animated: true,
    });
  };
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
      if (focusedInput.current) revealInput(focusedInput.current);
    });
    const hide = Keyboard.addListener('keyboardDidHide', () =>
      setKeyboardVisible(false),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  if (loading)
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
        <Text style={{ color: colors.muted, marginTop: 12 }}>
          Checking your session…
        </Text>
      </View>
    );
  if (user) return <>{children}</>;
  if (error)
    return (
      <View
        style={[
          styles.center,
          { backgroundColor: colors.background, padding: 24 },
        ]}>
        <Text
          accessibilityRole="header"
          style={[styles.heading, { color: colors.text }]}>
          Can’t connect
        </Text>
        <Text style={[styles.description, { color: colors.muted }]}>
          {error}. Check your connection, then try again.
        </Text>
        <View style={styles.actions}>
          <AppButton title="Try again" onPress={retry} />
        </View>
      </View>
    );
  const submit = async () => {
    if (!/^\+[1-9][0-9]{7,14}$/.test(phone.trim())) {
      setMessage(
        'Enter your phone number in international format, for example +256700000000.',
      );
      return;
    }
    if (!password) {
      setMessage('Enter your password.');
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      await signIn(phone, password);
      setPassword('');
    } catch (err) {
      setMessage(
        err instanceof ApiError && err.status === 401
          ? 'Phone number or password is incorrect.'
          : err instanceof Error
          ? err.message
          : 'Sign in failed. Please try again.',
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.fill, { backgroundColor: colors.background }]}>
      <ScrollView
        ref={scrollRef}
        style={styles.fill}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.form, { paddingTop: insets.top + 32 }]}>
        <Text
          accessibilityRole="header"
          style={[styles.heading, { color: colors.text }]}>
          Welcome back
        </Text>
        <Text style={[styles.description, { color: colors.muted }]}>
          Sign in to manage your church contributions.
        </Text>
        <View
          style={styles.fields}
          onLayout={event => {
            fieldPositions.current.group = event.nativeEvent.layout.y;
          }}>
          <Text style={[styles.label, { color: colors.text }]}>
            Phone number
          </Text>
          <TextInput
            accessibilityLabel="Phone number"
            onLayout={event => {
              fieldPositions.current.phone = event.nativeEvent.layout.y;
            }}
            onFocus={() => {
              focusedInput.current = 'phone';
              if (keyboardVisible) revealInput('phone');
            }}
            value={phone}
            onChangeText={setPhone}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="phone-pad"
            placeholder="+256700000000"
            placeholderTextColor={colors.muted}
            style={[
              styles.input,
              {
                color: colors.text,
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          />
          <Text style={[styles.label, { color: colors.text }]}>Password</Text>
          <TextInput
            accessibilityLabel="Password"
            onLayout={event => {
              fieldPositions.current.password = event.nativeEvent.layout.y;
            }}
            onFocus={() => {
              focusedInput.current = 'password';
              if (keyboardVisible) revealInput('password');
            }}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            onSubmitEditing={submit}
            placeholder="Password"
            placeholderTextColor={colors.muted}
            style={[
              styles.input,
              {
                color: colors.text,
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          />
        </View>
        {message ? (
          <Text accessibilityRole="alert" style={{ color: colors.danger }}>
            {message}
          </Text>
        ) : null}
      </ScrollView>
      <View
        style={[
          styles.footer,
          { paddingBottom: keyboardVisible ? 12 : Math.max(insets.bottom, 12) },
        ]}>
        <AppButton
          title="Sign in"
          onPress={submit}
          disabled={busy}
          loading={busy}
        />
      </View>
    </KeyboardAvoidingView>
  );
}
const styles = StyleSheet.create({
  fill: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  form: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 16,
  },
  heading: { fontSize: 28, lineHeight: 34, fontWeight: '700' },
  description: { fontSize: 15, lineHeight: 22 },
  fields: { gap: 8, marginTop: 12 },
  label: { fontSize: 14, fontWeight: '600', marginTop: 8 },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 16,
  },
  actions: { width: '100%', gap: 10, marginTop: 24 },
  footer: { paddingHorizontal: 24, paddingTop: 12 },
});
