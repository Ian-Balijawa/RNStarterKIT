import React, { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../theme/theme';
import { AppFormField } from './AppFormField';
import { AppTextInput } from './AppTextInput';
import { AppText } from '../ui/AppText';
import { AppIcon } from '../ui/AppIcon';
import { AppButton } from '../ui/AppButton';
import { BottomSheetInputContext } from '../overlays/BottomSheetInputContext';
export type SelectOption = { label: string; value: string };
export function AppSelect({
  label,
  options,
  value,
  onChange,
  multiple = false,
  searchable = true,
  error,
  disabled,
  placeholder = 'Select an option',
}: {
  label: string;
  options: SelectOption[];
  value: string | string[] | null;
  onChange: (value: string | string[]) => void;
  multiple?: boolean;
  searchable?: boolean;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const { colors, radius } = useAppTheme();
  const insets = useSafeAreaInsets();
  const selected = Array.isArray(value) ? value : value === null ? [] : [value];
  const visible = useMemo(
    () =>
      options.filter(option =>
        option.label.toLowerCase().includes(query.toLowerCase()),
      ),
    [options, query],
  );
  const display =
    options
      .filter(option => selected.includes(option.value))
      .map(option => option.label)
      .join(', ') || placeholder;
  const select = (option: SelectOption) => {
    if (multiple) {
      onChange(
        selected.includes(option.value)
          ? selected.filter(item => item !== option.value)
          : [...selected, option.value],
      );
    } else {
      onChange(option.value);
      setOpen(false);
    }
  };
  return (
    <AppFormField label={label} error={error}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${display}`}
        disabled={disabled}
        onPress={() => setOpen(true)}
        style={[
          styles.trigger,
          {
            backgroundColor: colors.surface,
            borderColor: error ? colors.danger : colors.border,
            borderRadius: radius.md,
          },
        ]}>
        <AppText style={styles.flex}>{display}</AppText>
        <AppIcon name="chevron" color={colors.muted} />
      </Pressable>
      <Modal
        visible={open}
        animationType="slide"
        onRequestClose={() => setOpen(false)}>
        <BottomSheetInputContext.Provider value={false}>
          <View
            style={[
              styles.modal,
              {
                backgroundColor: colors.background,
                paddingTop: insets.top + 16,
                paddingBottom: insets.bottom + 16,
              },
            ]}>
            <View style={styles.header}>
              <AppText variant="heading">{label}</AppText>
              <AppButton
                icon="close"
                variant="ghost"
                accessibilityLabel="Close"
                onPress={() => setOpen(false)}
              />
            </View>
            {searchable ? (
              <AppTextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search options"
                prefixIcon="search"
                clearable
              />
            ) : null}
            <FlatList
              data={visible}
              keyExtractor={item => item.value}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <Pressable
                  accessibilityRole={multiple ? 'checkbox' : 'radio'}
                  accessibilityState={
                    multiple
                      ? { checked: selected.includes(item.value) }
                      : { selected: selected.includes(item.value) }
                  }
                  onPress={() => select(item)}
                  style={styles.option}>
                  <AppText style={styles.flex}>{item.label}</AppText>
                  {selected.includes(item.value) ? (
                    <AppIcon name="check" color={colors.primary} />
                  ) : null}
                </Pressable>
              )}
              ListEmptyComponent={<AppText muted>No matching options</AppText>}
            />
            {multiple ? (
              <AppButton title="Done" onPress={() => setOpen(false)} />
            ) : null}
          </View>
        </BottomSheetInputContext.Provider>
      </Modal>
    </AppFormField>
  );
}
const styles = StyleSheet.create({
  flex: { flex: 1 },
  modal: { flex: 1, paddingHorizontal: 16, gap: 16 },
  trigger: {
    minHeight: 48,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  option: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
});
