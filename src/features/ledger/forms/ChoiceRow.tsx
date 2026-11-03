import React from 'react';
import { Pressable, View } from 'react-native';
import { AppText } from '../../../components/ui/AppText';
import { useAppTheme } from '../../../theme/theme';
import { styles } from './styles';

export function ChoiceRow<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { label: string; value: T }[];
  value: T;
  onChange: (value: T) => void;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.field}>
      <AppText variant="label">{label}</AppText>
      <View style={styles.choices}>
        {options.map(option => (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ selected: value === option.value }}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [
              styles.choice,
              {
                backgroundColor:
                  value === option.value ? colors.primary : colors.surface,
                borderColor:
                  value === option.value ? colors.primary : colors.border,
                opacity: pressed ? 0.76 : 1,
              },
            ]}>
            <AppText
              variant="label"
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
              style={{
                textAlign: 'center',
                color:
                  value === option.value ? colors.primaryText : colors.text,
              }}>
              {option.label}
            </AppText>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
