import React, { useEffect, useImperativeHandle, useState } from 'react';
import { View } from 'react-native';
import { AppButton } from '../../../components/ui/AppButton';
import { AppText } from '../../../components/ui/AppText';
import { AppTextInput } from '../../../components/forms/AppTextInput';
import { Category } from '../model';
import { ErrorText } from './FormControls';
import { styles } from './styles';
import { LedgerFormHandle } from './types';

export function SubcategoryForm({
  category,
  onSave,
  submitRef,
  onErrorChange,
}: {
  category: Category;
  onSave: (name: string) => void;
  submitRef?: React.Ref<LedgerFormHandle>;
  onErrorChange?: (message: string) => void;
}) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const submit = () => {
    if (!name.trim()) return setError('Enter a subcategory name.');
    if (
      category.subcategories.some(
        item => item.toLowerCase() === name.trim().toLowerCase(),
      )
    )
      return setError('This subcategory already exists.');
    onSave(name.trim());
  };
  useImperativeHandle(submitRef, () => ({ submit }));
  useEffect(() => {
    onErrorChange?.(error);
  }, [error, onErrorChange]);
  return (
    <View style={styles.form}>
      <AppText muted>Adding to {category.name}</AppText>
      <AppTextInput
        label="Subcategory name"
        value={name}
        onChangeText={setName}
        placeholder="e.g. School fees"
        required
      />
      {!submitRef ? <ErrorText message={error} /> : null}
      {!submitRef ? <AppButton title="Add" onPress={submit} /> : null}
    </View>
  );
}
