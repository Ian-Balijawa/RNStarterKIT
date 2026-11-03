import React, { useState } from 'react';
import { View } from 'react-native';
import { AppButton } from '../../../components/ui/AppButton';
import { AppTextInput } from '../../../components/forms/AppTextInput';
import { Category } from '../model';
import { ChoiceRow } from './ChoiceRow';
import { ErrorText } from './FormControls';
import { styles } from './styles';

export function CategoryForm({
  existing,
  onSave,
}: {
  existing: Category[];
  onSave: (
    name: string,
    kind: 'expense' | 'income',
    subcategories: string[],
  ) => void;
}) {
  const [name, setName] = useState('');
  const [kind, setKind] = useState<'expense' | 'income'>('expense');
  const [subcategories, setSubcategories] = useState('');
  const [error, setError] = useState('');
  return (
    <View style={styles.form}>
      <ChoiceRow
        label="Used for"
        options={[
          { label: 'Expenses', value: 'expense' },
          { label: 'Income', value: 'income' },
        ]}
        value={kind}
        onChange={setKind}
      />
      <AppTextInput
        label="Category name"
        value={name}
        onChangeText={setName}
        placeholder="e.g. Education"
        required
      />
      <AppTextInput
        label="Subcategories"
        value={subcategories}
        onChangeText={setSubcategories}
        placeholder="e.g. Tuition, Books, Supplies"
        hint="Separate names with commas. You can add more later."
      />
      <ErrorText message={error} />
      <AppButton
        title="Save category"
        onPress={() => {
          if (!name.trim()) return setError('Enter a category name.');
          if (
            existing.some(
              item =>
                item.kind === kind &&
                item.name.toLowerCase() === name.trim().toLowerCase(),
            )
          )
            return setError('This category already exists.');
          onSave(
            name.trim(),
            kind,
            subcategories
              .split(',')
              .map(item => item.trim())
              .filter(Boolean),
          );
        }}
      />
    </View>
  );
}
