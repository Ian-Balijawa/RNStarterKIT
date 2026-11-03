import React, { useEffect, useImperativeHandle, useState } from 'react';
import { View } from 'react-native';
import { AppButton } from '../../../components/ui/AppButton';
import { AppTextInput } from '../../../components/forms/AppTextInput';
import { AppDatePicker } from '../../../components/forms/AppDatePicker';
import {
  EntryKind,
  LedgerState,
  Recurrence,
  Schedule,
  Transaction,
  newId,
  parseAmount,
} from '../model';
import { LedgerChoiceField } from './LedgerChoiceField';
import { ErrorText, LinkButton } from './FormControls';
import { styles } from './styles';
import { LedgerFormHandle } from './types';

export function TransactionForm({
  ledger,
  initialKind = 'expense',
  onSave,
  onAddCategory,
  onAddSubcategory,
  submitRef,
  onActionTitleChange,
  onErrorChange,
}: {
  ledger: LedgerState;
  initialKind?: EntryKind;
  onSave: (entry: Transaction | Schedule, scheduled: boolean) => void;
  onAddCategory: (name: string, kind: 'expense' | 'income') => string;
  onAddSubcategory: (categoryId: string, name: string) => void;
  submitRef?: React.Ref<LedgerFormHandle>;
  onActionTitleChange?: (title: string) => void;
  onErrorChange?: (message: string) => void;
}) {
  const [kind, setKind] = useState<EntryKind>(initialKind);
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState(ledger.accounts[0]?.id ?? '');
  const [toAccountId, setToAccountId] = useState(ledger.accounts[1]?.id ?? '');
  const [categoryId, setCategoryId] = useState('food');
  const [subcategory, setSubcategory] = useState('');
  const [note, setNote] = useState('');
  const [when, setWhen] = useState(new Date());
  const [scheduled, setScheduled] = useState(false);
  const [recurrence, setRecurrence] = useState<Recurrence>('daily');
  const [newCategory, setNewCategory] = useState('');
  const [addingCategory, setAddingCategory] = useState(false);
  const [newSubcategory, setNewSubcategory] = useState('');
  const [addingSubcategory, setAddingSubcategory] = useState(false);
  const [error, setError] = useState('');
  const categoryKind = kind === 'income' ? 'income' : 'expense';
  const categories = ledger.categories.filter(
    item => item.kind === categoryKind,
  );
  const currentCategory = categories.find(item => item.id === categoryId);

  const changeKind = (next: EntryKind) => {
    setKind(next);
    setCategoryId(next === 'income' ? 'salary' : 'food');
    setSubcategory('');
    setError('');
  };
  const addCategory = () => {
    const name = newCategory.trim();
    if (!name) return setError('Enter a category name.');
    const id = onAddCategory(name, categoryKind);
    setCategoryId(id);
    setSubcategory('');
    setNewCategory('');
    setAddingCategory(false);
    setError('');
  };
  const addSubcategory = () => {
    const name = newSubcategory.trim();
    if (!name || !currentCategory) return setError('Enter a subcategory name.');
    onAddSubcategory(currentCategory.id, name);
    setSubcategory(name);
    setNewSubcategory('');
    setAddingSubcategory(false);
    setError('');
  };
  const submit = () => {
    const parsed = parseAmount(amount);
    if (parsed === null)
      return setError('Enter a whole UGX amount greater than zero.');
    if (!accountId) return setError('Add an account first.');
    if (kind === 'transfer' && (!toAccountId || accountId === toAccountId)) {
      return setError('Choose two different accounts for a transfer.');
    }
    if (kind !== 'transfer' && !currentCategory)
      return setError('Choose a category.');
    const base = {
      id: newId(),
      kind,
      amount: parsed,
      accountId,
      ...(kind === 'transfer'
        ? { toAccountId }
        : { categoryId, ...(subcategory ? { subcategory } : {}) }),
      note: note.trim(),
    };
    if (scheduled)
      onSave({ ...base, nextAt: when.toISOString(), recurrence }, true);
    else onSave({ ...base, occurredAt: when.toISOString() }, false);
  };
  useImperativeHandle(submitRef, () => ({ submit }));
  const actionTitle = scheduled
    ? 'Save schedule'
    : kind === 'transfer'
    ? 'Transfer funds'
    : `Save ${kind}`;
  useEffect(() => {
    onActionTitleChange?.(actionTitle);
  }, [actionTitle, onActionTitleChange]);
  useEffect(() => {
    onErrorChange?.(error);
  }, [error, onErrorChange]);

  return (
    <View style={styles.form}>
      <LedgerChoiceField
        label="Transaction type"
        options={[
          { label: 'Expense', value: 'expense' },
          { label: 'Income', value: 'income' },
          { label: 'Transfer', value: 'transfer' },
        ]}
        value={kind}
        onChange={changeKind}
      />
      <AppTextInput
        label="Amount (UGX)"
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
        currency
        placeholder="e.g. 25,000"
        required
      />
      <LedgerChoiceField
        label={
          kind === 'transfer'
            ? 'From account'
            : kind === 'income'
            ? 'Into account'
            : 'Paid from'
        }
        options={ledger.accounts.map(item => ({
          label: item.name,
          value: item.id,
        }))}
        value={accountId}
        onChange={setAccountId}
      />
      {kind === 'transfer' ? (
        <LedgerChoiceField
          label="To account"
          options={ledger.accounts
            .filter(item => item.id !== accountId)
            .map(item => ({ label: item.name, value: item.id }))}
          value={toAccountId}
          onChange={setToAccountId}
        />
      ) : (
        <>
          <LedgerChoiceField
            label="Category"
            options={categories.map(item => ({
              label: item.name,
              value: item.id,
            }))}
            value={categoryId}
            onChange={value => {
              setCategoryId(value);
              setSubcategory('');
            }}
          />
          <LinkButton
            title="+ Add category"
            onPress={() => setAddingCategory(current => !current)}
          />
          {addingCategory ? (
            <View style={styles.inline}>
              <AppTextInput
                label="New category"
                value={newCategory}
                onChangeText={setNewCategory}
                placeholder="Category name"
              />
              <AppButton
                title="Save category"
                variant="secondary"
                onPress={addCategory}
              />
            </View>
          ) : null}
          {currentCategory ? (
            <>
              <LedgerChoiceField
                label="Subcategory (optional)"
                options={[
                  { label: 'None', value: '' },
                  ...currentCategory.subcategories.map(item => ({
                    label: item,
                    value: item,
                  })),
                ]}
                value={subcategory}
                onChange={setSubcategory}
              />
              <LinkButton
                title="+ Add subcategory"
                onPress={() => setAddingSubcategory(current => !current)}
              />
              {addingSubcategory ? (
                <View style={styles.inline}>
                  <AppTextInput
                    label="New subcategory"
                    value={newSubcategory}
                    onChangeText={setNewSubcategory}
                    placeholder="Subcategory name"
                  />
                  <AppButton
                    title="Save subcategory"
                    variant="secondary"
                    onPress={addSubcategory}
                  />
                </View>
              ) : null}
            </>
          ) : null}
        </>
      )}
      <AppTextInput
        label="Note (optional)"
        value={note}
        onChangeText={setNote}
        placeholder="What was this for?"
      />
      <LedgerChoiceField
        label="When"
        options={[
          { label: 'Now / recorded', value: 'normal' },
          { label: 'Scheduled', value: 'scheduled' },
        ]}
        value={scheduled ? 'scheduled' : 'normal'}
        onChange={value => setScheduled(value === 'scheduled')}
      />
      <AppDatePicker
        label={
          scheduled
            ? 'First scheduled date and time'
            : 'Transaction date and time'
        }
        value={when}
        onChange={setWhen}
        mode="datetime"
      />
      {scheduled ? (
        <LedgerChoiceField
          label="Repeat"
          options={[
            { label: 'Daily', value: 'daily' },
            { label: 'Weekly', value: 'weekly' },
            { label: 'Monthly', value: 'monthly' },
            { label: 'Quarterly', value: 'quarterly' },
            { label: 'Yearly', value: 'yearly' },
          ]}
          value={recurrence}
          onChange={setRecurrence}
        />
      ) : null}
      {!submitRef ? <ErrorText message={error} /> : null}
      {!submitRef ? <AppButton title={actionTitle} onPress={submit} /> : null}
    </View>
  );
}
