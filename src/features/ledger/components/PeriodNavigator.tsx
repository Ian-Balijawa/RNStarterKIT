import React from 'react';
import { Pressable, View } from 'react-native';
import { AppText } from '../../../components/ui/AppText';
import { useAppTheme } from '../../../theme/theme';
import { Period, periodStart } from '../model';
import { dateLabel } from '../format';
import { styles } from '../styles';

function shiftPeriod(date: Date, period: Period, step: number) {
  const next = new Date(date);
  if (period === 'daily') next.setDate(next.getDate() + step);
  if (period === 'weekly') next.setDate(next.getDate() + step * 7);
  if (period === 'monthly') {
    next.setDate(1);
    next.setMonth(next.getMonth() + step);
  }
  return next;
}

export function PeriodNavigator({
  period,
  date,
  onChange,
}: {
  period: Period;
  date: Date;
  onChange: (date: Date) => void;
}) {
  const { colors } = useAppTheme();
  const start = periodStart(period, date);
  const todayStart = periodStart(period, new Date());
  const label =
    period === 'monthly'
      ? start.toLocaleDateString('en-UG', { month: 'long', year: 'numeric' })
      : period === 'weekly'
      ? `Week of ${dateLabel(start.toISOString())}`
      : dateLabel(start.toISOString());
  const canAdvance = start.getTime() < todayStart.getTime();
  return (
    <View style={[styles.periodNav, { borderColor: colors.border }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Previous period"
        onPress={() => onChange(shiftPeriod(date, period, -1))}
        style={styles.periodArrow}>
        <AppText variant="heading" style={{ color: colors.primary }}>
          ‹
        </AppText>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Showing ${label}. Go to current period`}
        onPress={() => onChange(new Date())}
        style={styles.periodCenter}>
        <AppText variant="label">{label}</AppText>
        <AppText variant="caption" muted>
          Tap for current period
        </AppText>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Next period"
        accessibilityState={{ disabled: !canAdvance }}
        disabled={!canAdvance}
        onPress={() => onChange(shiftPeriod(date, period, 1))}
        style={styles.periodArrow}>
        <AppText
          variant="heading"
          style={{ color: canAdvance ? colors.primary : colors.muted }}>
          ›
        </AppText>
      </Pressable>
    </View>
  );
}
