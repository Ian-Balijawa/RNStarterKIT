import React, { useEffect, useImperativeHandle, useState } from 'react';
import { View } from 'react-native';
import { AppButton } from '../../../components/ui/AppButton';
import { AppText } from '../../../components/ui/AppText';
import { AppTextInput } from '../../../components/forms/AppTextInput';
import { Budget, LedgerState, newId, parseAmount } from '../model';
import { LedgerChoiceField } from './LedgerChoiceField';
import { ErrorText } from './FormControls';
import { styles } from './styles';
import { LedgerFormHandle } from './types';

export function BudgetForm({
  ledger,
  initial,
  onSave,
  submitRef,
  onErrorChange,
}: {
  ledger: LedgerState;
  initial?: Budget;
  onSave: (budget: Budget) => void;
  submitRef?: React.Ref<LedgerFormHandle>;
  onErrorChange?: (message: string) => void;
}) {
  const categories = ledger.categories.filter(item => item.kind === 'expense');
  const [name, setName] = useState(initial?.name ?? '');
  const [categoryId, setCategoryId] = useState(
    initial?.categoryId ?? categories[0]?.id ?? '',
  );
  const [subcategory, setSubcategory] = useState(initial?.subcategory ?? '');
  const [amount, setAmount] = useState(initial ? String(initial.amount) : '');
  const [period, setPeriod] = useState<Budget['period']>(
    initial?.period ?? 'monthly',
  );
  const [error, setError] = useState('');
  const category = categories.find(item => item.id === categoryId);
  const submit = () => {
    const parsed = parseAmount(amount);
    if (!category) return setError('Choose a category.');
    if (parsed === null)
      return setError('Enter a whole UGX amount greater than zero.');
    onSave({
      id: initial?.id ?? newId(),
      name: name.trim() || subcategory || category.name,
      categoryId,
      ...(subcategory ? { subcategory } : {}),
      amount: parsed,
      period,
    });
  };
  useImperativeHandle(submitRef, () => ({ submit }));
  useEffect(() => {
    onErrorChange?.(error);
  }, [error, onErrorChange]);
  return (
    <View style={styles.form}>
      <AppTextInput
        label="Budget name (optional)"
        value={name}
        onChangeText={setName}
        placeholder="e.g. Fuel for work"
      />
      <LedgerChoiceField
        label="Category"
        options={categories.map(item => ({ label: item.name, value: item.id }))}
        value={categoryId}
        onChange={value => {
          setCategoryId(value);
          setSubcategory('');
        }}
      />
      {category ? (
        <LedgerChoiceField
          label="Subcategory"
          options={[
            { label: 'Entire category', value: '' },
            ...category.subcategories.map(item => ({
              label: item,
              value: item,
            })),
          ]}
          value={subcategory}
          onChange={setSubcategory}
        />
      ) : null}
      <AppTextInput
        label="Limit (UGX)"
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
        currency
        required
      />
      <LedgerChoiceField
        label="Budget period"
        options={[
          { label: 'Weekly', value: 'weekly' },
          { label: 'Monthly', value: 'monthly' },
          { label: 'Yearly', value: 'yearly' },
        ]}
        value={period}
        onChange={setPeriod}
      />
      <AppText muted variant="caption">
        Spending resets each{' '}
        {period === 'weekly'
          ? 'Monday'
          : period === 'monthly'
          ? 'month'
          : 'year'}
        . Budgets never change account balances.
      </AppText>
      {!submitRef ? <ErrorText message={error} /> : null}
      {!submitRef ? (
        <AppButton
          title={initial ? 'Save budget' : 'Create budget'}
          onPress={submit}
        />
      ) : null}
    </View>
  );
}
