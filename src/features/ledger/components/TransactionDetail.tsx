import React from 'react';
import { View } from 'react-native';
import { AppButton } from '../../../components/ui/AppButton';
import { AppText } from '../../../components/ui/AppText';
import { dateLabel, timeLabel } from '../format';
import { LedgerState, Transaction, formatUGX } from '../model';
import { styles } from '../styles';
import { Surface } from './Surface';

type Props = {
  item: Transaction;
  ledger: LedgerState;
  onDelete: () => void;
};

export function TransactionDetail({ item, ledger, onDelete }: Props) {
  return (
    <View style={styles.detail}>
      <AppText variant="display">{formatUGX(item.amount)}</AppText>
      <AppText muted>
        {item.kind === 'transfer' ? 'Transfer' : item.kind} ·{' '}
        {dateLabel(item.occurredAt)} at {timeLabel(item.occurredAt)}
      </AppText>
      <Surface>
        <AppText variant="label">From / into account</AppText>
        <AppText>
          {ledger.accounts.find(account => account.id === item.accountId)
            ?.name ?? 'Unknown account'}
        </AppText>
        {item.toAccountId ? (
          <>
            <AppText variant="label">To account</AppText>
            <AppText>
              {ledger.accounts.find(account => account.id === item.toAccountId)
                ?.name ?? 'Unknown account'}
            </AppText>
          </>
        ) : null}
        {item.categoryId ? (
          <>
            <AppText variant="label">Category</AppText>
            <AppText>
              {
                ledger.categories.find(
                  category => category.id === item.categoryId,
                )?.name
              }
              {item.subcategory ? ` · ${item.subcategory}` : ''}
            </AppText>
          </>
        ) : null}
        {item.note ? (
          <>
            <AppText variant="label">Note</AppText>
            <AppText>{item.note}</AppText>
          </>
        ) : null}
      </Surface>
      <AppButton
        title="Delete transaction"
        variant="danger"
        onPress={onDelete}
      />
    </View>
  );
}
