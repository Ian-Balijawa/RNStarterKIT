import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../../../components/ui/AppText';
import { dateLabel, timeLabel } from '../format';
import { LedgerState, Transaction, formatUGX } from '../model';
import { styles } from '../styles';
import { Surface } from './Surface';

type Props = {
  item: Transaction;
  ledger: LedgerState;
};

const kindLabel = (kind: string) =>
  kind.charAt(0).toUpperCase() + kind.slice(1);

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={local.row}>
      <AppText variant="label" muted>
        {label}
      </AppText>
      <AppText style={local.value}>{children}</AppText>
    </View>
  );
}

export function TransactionDetail({ item, ledger }: Props) {
  const accountName = (id?: string | null) =>
    ledger.accounts.find(account => account.id === id)?.name ??
    'Unknown account';

  const categoryName = ledger.categories.find(
    category => category.id === item.categoryId,
  )?.name;

  return (
    <View style={styles.detail}>
      <AppText variant="display">{formatUGX(item.amount)}</AppText>
      <AppText muted>
        {kindLabel(item.kind)} · {dateLabel(item.occurredAt)} at{' '}
        {timeLabel(item.occurredAt)}
      </AppText>
      <Surface>
        <Row label={item.toAccountId ? 'From' : 'Account'}>
          {accountName(item.accountId)}
        </Row>
        {item.toAccountId ? (
          <Row label="To">{accountName(item.toAccountId)}</Row>
        ) : null}
        {item.categoryId ? (
          <Row label="Category">
            {categoryName ?? 'Uncategorised'}
            {item.subcategory ? ` · ${item.subcategory}` : ''}
          </Row>
        ) : null}
        {item.note ? <Row label="Note">{item.note}</Row> : null}
      </Surface>
    </View>
  );
}

const local = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    paddingVertical: 6,
  },
  value: {
    flex: 1,
    textAlign: 'right',
  },
});
