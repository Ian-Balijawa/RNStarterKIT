import React, { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import DateTimePicker, {
  DateTimePickerAndroid,
} from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../theme/theme';
import { AppFormField } from './AppFormField';
import { AppText } from '../ui/AppText';
import { AppIcon } from '../ui/AppIcon';
import { AppButton } from '../ui/AppButton';

export function AppDatePicker({
  label,
  value,
  onChange,
  mode = 'date',
  minimumDate,
  maximumDate,
  error,
  disabled,
}: {
  label: string;
  value: Date | null;
  onChange: (value: Date) => void;
  mode?: 'date' | 'time' | 'datetime';
  minimumDate?: Date;
  maximumDate?: Date;
  error?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const { colors, radius } = useAppTheme();
  const insets = useSafeAreaInsets();
  const show = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: value || new Date(),
        mode: mode === 'datetime' ? 'date' : mode,
        minimumDate,
        maximumDate,
        onChange: (event, selected) => {
          if (event.type !== 'set' || !selected) {
            return;
          }
          if (mode !== 'datetime') {
            onChange(selected);
            return;
          }
          const date = selected;
          setTimeout(
            () =>
              DateTimePickerAndroid.open({
                value: date,
                mode: 'time',
                onChange: (timeEvent, time) => {
                  if (timeEvent.type === 'set' && time) {
                    const combined = new Date(date);
                    combined.setHours(time.getHours(), time.getMinutes());
                    onChange(combined);
                  }
                },
              }),
            0,
          );
        },
      });
    } else {
      setOpen(true);
    }
  };
  const display = value
    ? mode === 'time'
      ? value.toLocaleTimeString(undefined, {
          hour: 'numeric',
          minute: '2-digit',
        })
      : value.toLocaleDateString()
    : `Choose ${mode === 'time' ? 'a time' : 'a date'}`;
  return (
    <AppFormField label={label} error={error}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${display}`}
        disabled={disabled}
        onPress={show}
        style={[
          styles.trigger,
          {
            backgroundColor: colors.surface,
            borderColor: error ? colors.danger : colors.border,
            borderRadius: radius.md,
          },
        ]}>
        <AppText style={styles.flex}>{display}</AppText>
        <AppIcon
          name={mode === 'time' ? 'clock' : 'calendar'}
          color={colors.muted}
        />
      </Pressable>
      {Platform.OS === 'ios' ? (
        <Modal
          visible={open}
          transparent
          animationType="slide"
          onRequestClose={() => setOpen(false)}>
          <View style={[styles.backdrop, { backgroundColor: colors.overlay }]}>
            <View
              style={[
                styles.sheet,
                {
                  backgroundColor: colors.surface,
                  paddingBottom: insets.bottom + 16,
                  borderTopLeftRadius: radius.lg,
                  borderTopRightRadius: radius.lg,
                },
              ]}>
              <View style={styles.header}>
                <AppText variant="heading">{label}</AppText>
                <AppButton
                  title="Done"
                  variant="ghost"
                  onPress={() => setOpen(false)}
                />
              </View>
              <DateTimePicker
                value={value || new Date()}
                mode={mode}
                display="spinner"
                minimumDate={minimumDate}
                maximumDate={maximumDate}
                onValueChange={(_event, selected) => onChange(selected)}
              />
            </View>
          </View>
        </Modal>
      ) : null}
    </AppFormField>
  );
}
export function AppDateRangePicker({
  label = 'Date range',
  start,
  end,
  onChange,
  minimumDate,
  maximumDate,
}: {
  label?: string;
  start: Date | null;
  end: Date | null;
  onChange: (range: { start: Date | null; end: Date | null }) => void;
  minimumDate?: Date;
  maximumDate?: Date;
}) {
  return (
    <View style={styles.range}>
      <AppDatePicker
        label={`${label} start`}
        value={start}
        minimumDate={minimumDate}
        maximumDate={end || maximumDate}
        onChange={date => onChange({ start: date, end })}
      />
      <AppDatePicker
        label={`${label} end`}
        value={end}
        minimumDate={start || minimumDate}
        maximumDate={maximumDate}
        onChange={date => onChange({ start, end: date })}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  trigger: {
    minHeight: 48,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  flex: { flex: 1 },
  range: { gap: 12 },
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  sheet: { padding: 16 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
