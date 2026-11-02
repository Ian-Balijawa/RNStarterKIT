import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useAppTheme } from '../../theme/theme';
export function AppProgress({
  value,
  circular = false,
  size = 32,
}: {
  value?: number;
  circular?: boolean;
  size?: number;
}) {
  const { colors, radius } = useAppTheme();
  const progress = Math.max(0, Math.min(1, value ?? 0));
  if (value === undefined) {
    return (
      <ActivityIndicator
        size={circular ? 'large' : 'small'}
        color={colors.primary}
        accessibilityLabel="Loading"
      />
    );
  }
  if (circular) {
    const stroke = Math.max(3, size / 10);
    const ringRadius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * ringRadius;
    return (
      <View
        accessibilityRole="progressbar"
        accessibilityValue={{
          min: 0,
          max: 100,
          now: Math.round(progress * 100),
        }}>
        <Svg width={size} height={size} style={styles.ring}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={ringRadius}
            stroke={colors.border}
            strokeWidth={stroke}
            fill="none"
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={ringRadius}
            stroke={colors.primary}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={circumference * (1 - progress)}
            fill="none"
          />
        </Svg>
      </View>
    );
  }
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }}
      style={[
        styles.track,
        size > 32 ? styles.thick : styles.thin,
        { backgroundColor: colors.border, borderRadius: radius.pill },
      ]}>
      <View
        style={[
          styles.fill,
          {
            width: `${progress * 100}%`,
            backgroundColor: colors.primary,
          },
        ]}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  ring: { transform: [{ rotate: '-90deg' }] },
  track: { overflow: 'hidden' },
  thick: { height: 12 },
  thin: { height: 8 },
  fill: { height: '100%' },
});
