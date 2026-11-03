import React from 'react';
import { Pressable, View } from 'react-native';
import { AppText } from '../../../components/ui/AppText';
import { useAppTheme } from '../../../theme/theme';
import { LedgerIcon } from '../LedgerIcon';
import { LedgerState, Transaction, formatUGX } from '../model';
import { dateLabel, timeLabel } from '../format';
import { styles } from '../styles';

export function EntryRow({
  item,
  ledger,
  onPress,
}: {
  item: Transaction;
  ledger: LedgerState;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();
  const category = ledger.categories.find(
    value => value.id === item.categoryId,
  );
  const from =
    ledger.accounts.find(value => value.id === item.accountId)?.name ??
    'Account';
  const to =
    ledger.accounts.find(value => value.id === item.toAccountId)?.name ??
    'Account';
  const title =
    item.note ||
    (item.kind === 'transfer'
      ? `${from} to ${to}`
      : item.subcategory || category?.name || item.kind);
  const subtitle = `${
    item.kind === 'transfer' ? 'Transfer' : category?.name ?? item.kind
  } · ${dateLabel(item.occurredAt)} · ${timeLabel(item.occurredAt)}`;
  const tone =
    item.kind === 'income'
      ? colors.success
      : item.kind === 'expense'
      ? colors.danger
      : colors.primary;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${item.kind}, ${formatUGX(item.amount)}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.entry,
        { opacity: pressed ? 0.65 : 1, borderColor: colors.border },
      ]}>
      <View
        style={[
          styles.entryIcon,
          {
            backgroundColor:
              item.kind === 'income'
                ? colors.successSurface
                : item.kind === 'expense'
                ? colors.dangerSurface
                : colors.background,
          },
        ]}>
        <LedgerIcon name={item.kind} color={tone} size={20} />
      </View>
      <View style={styles.entryBody}>
        <AppText variant="label" numberOfLines={1}>
          {title}
        </AppText>
        <AppText variant="caption" muted numberOfLines={1}>
          {subtitle}
        </AppText>
      </View>
      <AppText
        variant="label"
        style={{ color: tone }}
        numberOfLines={1}
        adjustsFontSizeToFit>
        {item.kind === 'expense' ? '−' : item.kind === 'income' ? '+' : ''}
        {formatUGX(item.amount)}
      </AppText>
    </Pressable>
  );
}
