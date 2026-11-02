import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../theme/theme';
import { AppText } from '../ui/AppText';
import { BadgeTone } from '../ui/AppBadge';
type Toast = {
  message: string;
  tone: BadgeTone;
  actionLabel?: string;
  onAction?: () => void;
};
const ToastContext = createContext<{
  showToast: (toast: Toast) => void;
  hideToast: () => void;
} | null>(null);
export function AppToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { colors, radius } = useAppTheme();
  const insets = useSafeAreaInsets();
  const hideToast = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
    }
    setToast(null);
  }, []);
  const showToast = useCallback((next: Toast) => {
    if (timer.current) {
      clearTimeout(timer.current);
    }
    setToast(next);
    timer.current = setTimeout(() => setToast(null), 4000);
  }, []);
  useEffect(
    () => () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
    },
    [],
  );
  const background =
    toast?.tone === 'danger'
      ? colors.dangerSurface
      : toast?.tone === 'warning'
      ? colors.warningSurface
      : toast?.tone === 'success'
      ? colors.successSurface
      : colors.surface;
  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {toast ? (
        <View
          accessibilityRole="alert"
          style={[
            styles.toast,
            {
              bottom: insets.bottom + 16,
              backgroundColor: background,
              borderColor: colors.border,
              borderRadius: radius.md,
            },
          ]}>
          <AppText style={styles.message}>{toast.message}</AppText>
          {toast.actionLabel && toast.onAction ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                toast.onAction?.();
                hideToast();
              }}>
              <AppText variant="label" style={{ color: colors.primary }}>
                {toast.actionLabel}
              </AppText>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </ToastContext.Provider>
  );
}
export function useAppToast() {
  const value = useContext(ToastContext);
  if (!value) {
    throw new Error('Wrap your app in AppToastProvider');
  }
  return value;
}
const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: 16,
    right: 16,
    minHeight: 52,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
  },
  message: { flex: 1 },
});
