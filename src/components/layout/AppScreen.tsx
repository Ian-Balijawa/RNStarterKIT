import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import {
  AccessibilityInfo,
  Animated,
  KeyboardAvoidingView,
  LayoutChangeEvent,
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
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { spacing as space, useAppTheme } from '../../theme/theme'
import { AppText } from '../ui/AppText'

type ScrollEvent = NativeSyntheticEvent<NativeScrollEvent>

type Props = {
  children?: React.ReactNode
  scroll?: boolean
  keyboardAware?: boolean
  padded?: boolean
  safeTop?: boolean
  contentBottomPadding?: number
  contentContainerStyle?: StyleProp<ViewStyle>
  /** The heading shared between the expanded and pinned compact header. */
  title?: string
  subtitle?: string
  eyebrow?: string
  headerLeading?: React.ReactNode
  headerAction?: React.ReactNode
  /** Legacy compact summary for screens that supply their own expanded heading. */
  collapsedHeader?: React.ReactNode
  collapseThreshold?: number
  /** Insert expandedHeader at the beginning of the list's header. The list must be animated. */
  renderScrollable?: (
    onScroll: (event: ScrollEvent) => void,
    expandedHeader: React.ReactNode,
    minimumContentHeight: number | undefined,
  ) => React.ReactNode
  onRefresh?: () => void
  refreshing?: boolean
}

export function AppScreen({
  children,
  scroll = false,
  keyboardAware = false,
  padded = true,
  safeTop = true,
  contentBottomPadding,
  contentContainerStyle,
  title,
  subtitle,
  eyebrow,
  headerLeading,
  headerAction,
  collapsedHeader,
  collapseThreshold = 80,
  renderScrollable,
  onRefresh,
  refreshing = false,
}: Props) {
  const sharedRefresh = useAppRefresh()
  const refresh = onRefresh ?? sharedRefresh?.onRefresh
  const isRefreshing = onRefresh
    ? refreshing
    : sharedRefresh?.refreshing ?? false
  const insets = useSafeAreaInsets()
  const { colors, spacing } = useAppTheme()
  const scrollY = useRef(new Animated.Value(0)).current
  const [reducedMotion, setReducedMotion] = useState(false)
  const [compactVisible, setCompactVisible] = useState(false)
  const [viewportHeight, setViewportHeight] = useState(0)
  const visibleRef = useRef(false)
  useEffect(() => {
    let mounted = true
    AccessibilityInfo.isReduceMotionEnabled().then(value => {
      if (mounted) setReducedMotion(value)
    })
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReducedMotion,
    )
    return () => {
      mounted = false
      subscription.remove()
    }
  }, [])
  const onScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: true,
      listener: (event: ScrollEvent) => {
        const visible =
          event.nativeEvent.contentOffset.y >= collapseThreshold - 20
        if (visible !== visibleRef.current) {
          visibleRef.current = visible
          setCompactVisible(visible)
        }
      },
    },
  )
  const fadeStart = Math.max(0, collapseThreshold - 40)
  const compactOpacity = scrollY.interpolate({
    inputRange: [fadeStart, collapseThreshold],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  })
  const expandedOpacity = scrollY.interpolate({
    inputRange: [fadeStart, collapseThreshold],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  })
  const expandedTranslateY = scrollY.interpolate({
    inputRange: [0, collapseThreshold],
    outputRange: [0, -12],
    extrapolate: 'clamp',
  })
  const expandedScale = scrollY.interpolate({
    inputRange: [0, collapseThreshold],
    outputRange: [1, 0.94],
    extrapolate: 'clamp',
  })
  const compactTop = safeTop ? insets.top : 0
  const compactTranslateY = scrollY.interpolate({
    inputRange: [fadeStart, collapseThreshold],
    outputRange: [-8, 0],
    extrapolate: 'clamp',
  })
  const expandedHeader = title ? (
    <Animated.View
      pointerEvents={compactVisible ? 'none' : 'auto'}
      accessibilityElementsHidden={compactVisible}
      importantForAccessibility={
        compactVisible ? 'no-hide-descendants' : 'auto'
      }
      style={[
        styles.expandedHeader,
        {
          marginBottom: spacing.lg,
          opacity: reducedMotion ? (compactVisible ? 0 : 1) : expandedOpacity,
        },
        !reducedMotion && {
          transform: [
            { translateY: expandedTranslateY },
            { scale: expandedScale },
          ],
        },
      ]}>
      <View style={styles.headerRow}>
        {headerLeading ? (
          <View style={styles.leading}>{headerLeading}</View>
        ) : null}
        <View style={styles.headingText}>
          {eyebrow ? (
            <AppText
              variant="caption"
              style={[styles.eyebrow, { color: colors.primary }]}>
              {eyebrow}
            </AppText>
          ) : null}
          <AppText variant="display" accessibilityRole="header">
            {title}
          </AppText>
          {subtitle ? <AppText muted>{subtitle}</AppText> : null}
        </View>
        {headerAction ? (
          <View style={styles.trailing}>{headerAction}</View>
        ) : null}
      </View>
    </Animated.View>
  ) : null
  const compactHeader = title ? (
    <View style={styles.headerRow}>
      {headerLeading ? (
        <View style={styles.leading}>{headerLeading}</View>
      ) : null}
      <AppText
        variant="label"
        accessibilityRole="header"
        numberOfLines={1}
        style={styles.headingText}>
        {title}
      </AppText>
      {headerAction ? (
        <View style={styles.trailing}>{headerAction}</View>
      ) : null}
    </View>
  ) : (
    collapsedHeader
  )
  const content = renderScrollable ? (
    renderScrollable(
      onScroll,
      expandedHeader,
      title || collapsedHeader ? viewportHeight + collapseThreshold : undefined,
    )
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
          minHeight:
            title || collapsedHeader
              ? viewportHeight + collapseThreshold
              : undefined,
        },
        contentContainerStyle,
        contentBottomPadding === undefined
          ? undefined
          : { paddingBottom: contentBottomPadding },
      ]}>
      {expandedHeader}
      {children}
    </Animated.ScrollView>
  ) : (
    <View
      style={[
        styles.fill,
        padded && styles.padded,
        { paddingTop: spacing.lg, paddingBottom: spacing.lg },
      ]}>
      {expandedHeader}
      {children}
    </View>
  )
  return (
    <KeyboardAvoidingView
      onLayout={(event: LayoutChangeEvent) => {
        const height = Math.max(
          0,
          event.nativeEvent.layout.height - (safeTop ? insets.top : 0),
        )
        setViewportHeight(current => (current === height ? current : height))
      }}
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
      {(scroll || renderScrollable) && compactHeader ? (
        <Animated.View
          pointerEvents={compactVisible ? 'auto' : 'none'}
          accessibilityElementsHidden={!compactVisible}
          importantForAccessibility={
            compactVisible ? 'auto' : 'no-hide-descendants'
          }
          style={[
            styles.collapsedHeader,
            {
              backgroundColor: colors.background,
              borderColor: colors.border,
              top: compactTop,
              paddingStart: spacing.lg + insets.left,
              paddingEnd: spacing.lg + insets.right,
              opacity: reducedMotion
                ? compactVisible
                  ? 1
                  : 0
                : compactOpacity,
            },
            !reducedMotion && {
              transform: [{ translateY: compactTranslateY }],
            },
          ]}>
          {compactHeader}
        </Animated.View>
      ) : null}
    </KeyboardAvoidingView>
  )
}
type RefreshState = { onRefresh: () => void; refreshing: boolean }
const RefreshContext = createContext<RefreshState | null>(null)
export function AppRefreshProvider({
  value,
  children,
}: {
  value: RefreshState
  children: React.ReactNode
}) {
  return (
    <RefreshContext.Provider value={value}>{children}</RefreshContext.Provider>
  )
}
export function useAppRefresh() {
  return useContext(RefreshContext)
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
  )
}
const styles = StyleSheet.create({
  fill: { flex: 1 },
  padded: { paddingHorizontal: space.lg },
  appScrollContent: { paddingBottom: 16 },
  expandedHeader: { zIndex: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  headingText: { flex: 1, flexShrink: 1 },
  eyebrow: { fontWeight: '700', letterSpacing: 1.2, marginBottom: space.xs },
  leading: { flexShrink: 0 },
  trailing: { flexShrink: 0 },
  collapsedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: space.sm,
    minHeight: 48,
    justifyContent: 'center',
    zIndex: 2,
    elevation: 2,
  },
})
