import React from 'react';
import { ScrollView, View } from 'react-native';
import { AppButton } from '../../../components/ui/AppButton';
import { AppText } from '../../../components/ui/AppText';
import { useAppTheme } from '../../../theme/theme';
import { LedgerIcon } from '../LedgerIcon';
import { LedgerState } from '../model';
import { Dialog } from '../navigation';
import { Surface } from '../components/Surface';
import { SectionTitle } from '../components/SectionTitle';
import { EmptyNote } from '../components/EmptyNote';
import { BudgetCard } from '../components/BudgetCard';
import { styles } from '../styles';

type Props = {
  header: React.ReactNode;
  ledger: LedgerState;
  onOpenDialog: (dialog: Dialog) => void;
};

export function BudgetsScreen({ header, ledger, onOpenDialog }: Props) {
  const { colors } = useAppTheme();
  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}>
      {header}
      <Surface style={styles.introCard}>
        <View
          style={[
            styles.introIcon,
            { backgroundColor: colors.successSurface },
          ]}>
          <LedgerIcon name="budget" color={colors.primary} />
        </View>
        <AppText variant="heading">Give every shilling a plan.</AppText>
        <AppText muted>
          Set limits for a whole category or one specific subcategory. Spending
          updates when you record an expense.
        </AppText>
        <AppButton
          title="Create a budget"
          onPress={() => onOpenDialog({ kind: 'budget' })}
        />
      </Surface>
      <SectionTitle title="Your budgets" />
      {ledger.budgets.length ? (
        ledger.budgets.map(item => (
          <BudgetCard
            key={item.id}
            budget={item}
            ledger={ledger}
            onPress={() => onOpenDialog({ kind: 'budget', item })}
          />
        ))
      ) : (
        <EmptyNote
          title="No budgets yet"
          body="Start with an amount for food, transport, rent, or anything else."
        />
      )}
    </ScrollView>
  );
}
