import React, { useState } from 'react';
import { View } from 'react-native';
import { AppButton } from '../../../components/ui/AppButton';
import { AppText } from '../../../components/ui/AppText';
import { AppTextInput } from '../../../components/forms/AppTextInput';
import { Category } from '../model';
import { ErrorText } from './FormControls';
import { styles } from './styles';

export function SubcategoryForm({
  category,
  onSave,
}: {
  category: Category;
  onSave: (name: string) => void;
}) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
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
      <ErrorText message={error} />
      <AppButton
        title="Add"
        onPress={() => {
          if (!name.trim()) return setError('Enter a subcategory name.');
          if (
            category.subcategories.some(
              item => item.toLowerCase() === name.trim().toLowerCase(),
            )
          )
            return setError('This subcategory already exists.');
          onSave(name.trim());
        }}
      />
    </View>
  );
}
