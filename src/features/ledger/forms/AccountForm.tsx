import React, { useState } from 'react';
import { View } from 'react-native';
import { AppButton } from '../../../components/ui/AppButton';
import { AppText } from '../../../components/ui/AppText';
import { AppTextInput } from '../../../components/forms/AppTextInput';
import { Account, AccountType, newId } from '../model';
import { ChoiceRow } from './ChoiceRow';
import { ErrorText } from './FormControls';
import { styles } from './styles';

export function AccountForm({
  initial,
  onSave,
}: {
  initial?: Account;
  onSave: (account: Account) => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [type, setType] = useState<AccountType>(
    initial?.type ?? 'mobile_money',
  );
  const [opening, setOpening] = useState(
    initial ? String(initial.openingBalance) : '0',
  );
  const [error, setError] = useState('');
  const submit = () => {
    const amount = Number(opening.replace(/,/g, ''));
    if (!name.trim()) return setError('Enter an account name.');
    if (!Number.isSafeInteger(amount) || amount < 0)
      return setError('Enter a valid opening balance.');
    onSave({
      id: initial?.id ?? newId(),
      name: name.trim(),
      type,
      openingBalance: amount,
    });
  };
  return (
    <View style={styles.form}>
      <AppTextInput
        label="Account name"
        value={name}
        onChangeText={setName}
        placeholder="e.g. MTN Mobile Money"
        required
      />
      <ChoiceRow
        label="Account type"
        options={[
          { label: 'Mobile money', value: 'mobile_money' },
          { label: 'Bank', value: 'bank' },
          { label: 'Cash', value: 'cash' },
          { label: 'Business', value: 'business' },
          { label: 'Loan', value: 'loan' },
          { label: 'Other', value: 'other' },
        ]}
        value={type}
        onChange={setType}
      />
      <AppTextInput
        label="Opening balance (UGX)"
        value={opening}
        onChangeText={setOpening}
        keyboardType="numeric"
      />
      <AppText muted variant="caption">
        Opening balance is the amount this account held before you started
        tracking here.
      </AppText>
      <ErrorText message={error} />
      <AppButton
        title={initial ? 'Save changes' : 'Add account'}
        onPress={submit}
      />
    </View>
  );
}
