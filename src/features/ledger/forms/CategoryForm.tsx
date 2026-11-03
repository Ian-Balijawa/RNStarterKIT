import React, { useEffect, useImperativeHandle, useState } from 'react';
import { View } from 'react-native';
import { AppButton } from '../../../components/ui/AppButton';
import { AppTextInput } from '../../../components/forms/AppTextInput';
import { Category } from '../model';
import { LedgerChoiceField } from './LedgerChoiceField';
import { ErrorText } from './FormControls';
import { styles } from './styles';
import { LedgerFormHandle } from './types';

export function CategoryForm({
  existing,
  onSave,
  submitRef,
  onErrorChange,
}: {
  existing: Category[];
  onSave: (
    name: string,
    kind: 'expense' | 'income',
    subcategories: string[],
  ) => void;
  submitRef?: React.Ref<LedgerFormHandle>;
  onErrorChange?: (message: string) => void;
}) {
  const [name, setName] = useState('');
  const [kind, setKind] = useState<'expense' | 'income'>('expense');
  const [subcategories, setSubcategories] = useState('');
  const [error, setError] = useState('');
  const submit = () => {
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
  };
  useImperativeHandle(submitRef, () => ({ submit }));
  useEffect(() => {
    onErrorChange?.(error);
  }, [error, onErrorChange]);
  return (
    <View style={styles.form}>
      <LedgerChoiceField
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
      {!submitRef ? <ErrorText message={error} /> : null}
      {!submitRef ? <AppButton title="Save category" onPress={submit} /> : null}
    </View>
  );
}
