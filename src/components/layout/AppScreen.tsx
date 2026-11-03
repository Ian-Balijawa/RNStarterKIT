import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  KeyboardAvoidingView,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
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
}) {
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
      contentInsetAdjustmentBehavior="automatic"
      onScroll={onScroll}
      scrollEventThrottle={16}
      contentContainerStyle={[
        padded && styles.padded,
        {
          paddingTop: spacing.lg,
          paddingBottom: insets.bottom + (contentBottomPadding ?? spacing.xl),
          gap: spacing.lg,
        },
        contentContainerStyle,
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
          paddingBottom: insets.bottom,
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
export function AppScrollView({
  contentContainerStyle,
  ...props
}: ScrollViewProps) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      {...props}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={[
        { paddingBottom: insets.bottom + 24 },
        contentContainerStyle,
      ]}
    />
  );
}
const styles = StyleSheet.create({
  fill: { flex: 1 },
  padded: { paddingHorizontal: space.lg },
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
