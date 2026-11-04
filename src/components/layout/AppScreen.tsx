import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  AccessibilityInfo,
  Animated,
  KeyboardAvoidingView,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  RefreshControl,
  ScrollView,
  ScrollViewProps,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing as space, useAppTheme } from '../../theme/theme';
export function AppScreen({
  children,
  scroll = false,
  keyboardAware = false,
  padded = true,
  safeTop = true,
  contentBottomPadding,
  contentContainerStyle,
  collapsedHeader,
  collapseThreshold = 140,
  renderScrollable,
  onRefresh,
  refreshing = false,
}: {
  children?: React.ReactNode;
  scroll?: boolean;
  keyboardAware?: boolean;
  padded?: boolean;
  safeTop?: boolean;
  contentBottomPadding?: number;
  contentContainerStyle?: StyleProp<ViewStyle>;
  /** A compact summary that appears as the scroll content's header leaves view. */
  collapsedHeader?: React.ReactNode;
  collapseThreshold?: number;
  /** Keep virtualized lists intact while sharing the collapse animation. */
  renderScrollable?: (
    onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void,
  ) => React.ReactNode;
  onRefresh?: () => void;
  refreshing?: boolean;
}) {
  const sharedRefresh = useAppRefresh();
  const refresh = onRefresh ?? sharedRefresh?.onRefresh;
  const isRefreshing = onRefresh
    ? refreshing
    : sharedRefresh?.refreshing ?? false;
  const insets = useSafeAreaInsets();
  const { colors, spacing } = useAppTheme();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [reducedMotion, setReducedMotion] = useState(false);
  const [compactVisible, setCompactVisible] = useState(false);
  const visibleRef = useRef(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReducedMotion);
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReducedMotion,
    );
    return () => subscription.remove();
  }, []);
  const onScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: true,
      listener: (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const visible = event.nativeEvent.contentOffset.y >= collapseThreshold;
        if (visible !== visibleRef.current) {
          visibleRef.current = visible;
          setCompactVisible(visible);
        }
      },
    },
  );
  const opacity = scrollY.interpolate({
    inputRange: [collapseThreshold - 40, collapseThreshold],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const translateY = scrollY.interpolate({
    inputRange: [collapseThreshold - 40, collapseThreshold],
    outputRange: [-12, 0],
    extrapolate: 'clamp',
  });
  const content = renderScrollable ? (
    renderScrollable(onScroll)
  ) : scroll ? (
    <Animated.ScrollView
      keyboardShouldPersistTaps="handled"
      contentInsetAdjustmentBehavior="never"
      refreshControl={
        refresh ? (
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refresh}
            tintColor={colors.primary}
          />
        ) : undefined
      }
      onScroll={onScroll}
      scrollEventThrottle={16}
      contentContainerStyle={[
        padded && styles.padded,
        {
          paddingTop: spacing.lg,
          paddingBottom: spacing.lg,
          gap: spacing.lg,
        },
        contentContainerStyle,
        contentBottomPadding === undefined
          ? undefined
          : { paddingBottom: contentBottomPadding },
      ]}>
      {children}
    </Animated.ScrollView>
  ) : (
    <View
      style={[
        styles.fill,
        padded && styles.padded,
        {
          paddingTop: spacing.lg,
          paddingBottom: spacing.lg,
        },
      ]}>
      {children}
    </View>
  );
  return (
    <KeyboardAvoidingView
      behavior={
        keyboardAware
          ? Platform.OS === 'ios'
            ? 'padding'
            : 'height'
          : undefined
      }
      style={[
        styles.fill,
        { backgroundColor: colors.background },
        safeTop ? { paddingTop: insets.top } : undefined,
      ]}>
      {content}
      {(scroll || renderScrollable) && collapsedHeader ? (
        <Animated.View
          pointerEvents="none"
          importantForAccessibility={
            compactVisible ? 'auto' : 'no-hide-descendants'
          }
          style={[
            styles.collapsedHeader,
            { backgroundColor: colors.background, borderColor: colors.border },
            {
              opacity,
              transform: [{ translateY: reducedMotion ? 0 : translateY }],
            },
          ]}>
          {collapsedHeader}
        </Animated.View>
      ) : null}
    </KeyboardAvoidingView>
  );
}
type RefreshState = { onRefresh: () => void; refreshing: boolean };
const RefreshContext = createContext<RefreshState | null>(null);
export function AppRefreshProvider({
  value,
  children,
}: {
  value: RefreshState;
  children: React.ReactNode;
}) {
  return (
    <RefreshContext.Provider value={value}>{children}</RefreshContext.Provider>
  );
}
export function useAppRefresh() {
  return useContext(RefreshContext);
}
export function AppScrollView({
  contentContainerStyle,
  ...props
}: ScrollViewProps) {
  return (
    <ScrollView
      {...props}
      contentInsetAdjustmentBehavior="never"
      contentContainerStyle={[styles.appScrollContent, contentContainerStyle]}
    />
  );
}
const styles = StyleSheet.create({
  fill: { flex: 1 },
  padded: { paddingHorizontal: space.lg },
  appScrollContent: { paddingBottom: 16 },
  collapsedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 20,
    paddingVertical: 10,
    zIndex: 2,
    elevation: 2,
  },
});
