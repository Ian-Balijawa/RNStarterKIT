import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { AppText } from '../../../components/ui/AppText';
import { useAppTheme } from '../../../theme/theme';

const ACTION_WIDTH = 88;

export function SwipeActionRow({
  children,
  onArchive,
  onDelete,
  label,
}: {
  children: React.ReactNode;
  onArchive?: () => void;
  onDelete?: () => void;
  label: string;
}) {
  const { colors } = useAppTheme();
  const position = useRef(new Animated.Value(0)).current;
  const archiveOpacity = position.interpolate({
    inputRange: [0, 8],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const deleteOpacity = position.interpolate({
    inputRange: [-8, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });
  const resting = useRef(0);
  const [open, setOpen] = useState<'archive' | 'delete' | null>(null);
  const settle = useCallback(
    (value: number) => {
      resting.current = value;
      setOpen(value > 0 ? 'archive' : value < 0 ? 'delete' : null);
      Animated.spring(position, {
        toValue: value,
        useNativeDriver: true,
        friction: 8,
        tension: 80,
      }).start();
    },
    [position],
  );
  const pan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          Math.abs(gesture.dx) > 12 &&
          Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.5,
        onPanResponderMove: (_, gesture) => {
          const next = Math.max(
            -ACTION_WIDTH,
            Math.min(ACTION_WIDTH, resting.current + gesture.dx),
          );
          position.setValue(next);
        },
        onPanResponderRelease: (_, gesture) => {
          const next = resting.current + gesture.dx;
          settle(next > 48 ? ACTION_WIDTH : next < -48 ? -ACTION_WIDTH : 0);
        },
        onPanResponderTerminate: () => settle(resting.current),
      }),
    [position, settle],
  );
  if (!onArchive && !onDelete) return <>{children}</>;
  return (
    <View style={styles.container} accessibilityLabel={label}>
      <Animated.View
        pointerEvents={open === 'archive' ? 'auto' : 'none'}
        style={[
          styles.action,
          styles.left,
          { backgroundColor: colors.successSurface, opacity: archiveOpacity },
        ]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Archive ${label}`}
          importantForAccessibility={
            open === 'archive' ? 'auto' : 'no-hide-descendants'
          }
          onPress={() => {
            settle(0);
            onArchive?.();
          }}
          style={styles.actionPress}>
          <AppText variant="label" style={{ color: colors.primary }}>
            Archive
          </AppText>
        </Pressable>
      </Animated.View>
      <Animated.View
        pointerEvents={open === 'delete' ? 'auto' : 'none'}
        style={[
          styles.action,
          styles.right,
          { backgroundColor: colors.dangerSurface, opacity: deleteOpacity },
        ]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Delete ${label}`}
          importantForAccessibility={
            open === 'delete' ? 'auto' : 'no-hide-descendants'
          }
          onPress={() => {
            settle(0);
            onDelete?.();
          }}
          style={styles.actionPress}>
          <AppText variant="label" style={{ color: colors.danger }}>
            Delete
          </AppText>
        </Pressable>
      </Animated.View>

      <Animated.View
        {...pan.panHandlers}
        style={[
          styles.content,
          {
            backgroundColor: colors.surface,
            transform: [{ translateX: position }],
          },
        ]}>
        {children}
      </Animated.View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { overflow: 'hidden' },
  content: {},
  action: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: ACTION_WIDTH,
  },
  actionPress: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  left: { left: 0 },
  right: { right: 0 },
});
