import React from 'react';
import { Pressable, View } from 'react-native';
import { AppText } from '../../../components/ui/AppText';
import { useAppTheme } from '../../../theme/theme';
import { LedgerIcon } from '../LedgerIcon';
import { Budget, LedgerState, budgetSpent, formatUGX } from '../model';
import { styles } from '../styles';
import { useRecordActions } from './RecordActions';
import { Surface } from './Surface';
import { SwipeActionRow } from './SwipeActionRow';

export function BudgetCard({
  budget,
  ledger,
  onPress,
}: {
  budget: Budget;
  ledger: LedgerState;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();
  const actions = useRecordActions();
  const spent = budgetSpent(budget, ledger.transactions, new Date());
  const ratio = Math.min(spent / budget.amount, 1);
  const over = spent > budget.amount;
  const category = ledger.categories.find(
    item => item.id === budget.categoryId,
  )?.name;
  const card = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${budget.name}, ${formatUGX(budget.amount)} budget`}
      accessibilityActions={
        actions
          ? [
              { name: 'archive', label: 'Archive' },
              { name: 'delete', label: 'Delete' },
            ]
          : undefined
      }
      onAccessibilityAction={
        actions
          ? event => {
              if (event.nativeEvent.actionName === 'archive')
                actions.archiveBudget(budget);
              if (event.nativeEvent.actionName === 'delete')
                actions.deleteBudget(budget);
            }
          : undefined
      }
      onPress={onPress}
      style={({ pressed }) => [{ opacity: pressed ? 0.75 : 1 }]}>
      <Surface>
        <View style={styles.budgetTop}>
          <View style={styles.flex}>
            <AppText variant="label" style={styles.cardTitle}>
              {budget.name}
            </AppText>
            <AppText variant="caption" muted>
              {category}
              {budget.subcategory ? ` · ${budget.subcategory}` : ''} ·{' '}
              {budget.period}
            </AppText>
          </View>
          <LedgerIcon name="chevron" color={colors.muted} size={18} />
        </View>
        <View style={styles.budgetNumbers}>
          <AppText variant="label">{formatUGX(spent)} spent</AppText>
          <AppText variant="caption" muted>
            of {formatUGX(budget.amount)}
          </AppText>
        </View>
        <View style={[styles.track, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.trackFill,
              {
                width: `${ratio * 100}%`,
                backgroundColor: over ? colors.danger : colors.primary,
              },
            ]}
          />
        </View>
        <AppText
          variant="caption"
          style={{ color: over ? colors.danger : colors.muted }}>
          {over
            ? `${formatUGX(spent - budget.amount)} over budget`
            : `${formatUGX(budget.amount - spent)} remaining`}
        </AppText>
      </Surface>
    </Pressable>
  );
  return actions ? (
    <SwipeActionRow
      label={budget.name}
      onArchive={() => actions.archiveBudget(budget)}
      onDelete={() => actions.deleteBudget(budget)}>
      {card}
    </SwipeActionRow>
  ) : (
    card
  );
}
