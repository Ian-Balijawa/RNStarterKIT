import React from 'react';
import { Alert, Modal, Pressable, ScrollView, View } from 'react-native';
import { AppText } from '../../../components/ui/AppText';
import { useAppTheme } from '../../../theme/theme';
import { LedgerState, Schedule, Transaction } from '../model';
import { Dialog } from '../navigation';
import {
  AccountForm,
  BudgetForm,
  CategoryForm,
  SubcategoryForm,
  TransactionForm,
} from '../LedgerForms';
import { TransactionDetail } from './TransactionDetail';
import { ScheduleDetail } from './ScheduleDetail';
import { styles } from '../styles';

type Props = {
  dialog: Dialog | null;
  ledger: LedgerState;
  setLedger: React.Dispatch<React.SetStateAction<LedgerState>>;
  onClose: () => void;
  onAddCategory: (
    name: string,
    kind: 'expense' | 'income',
    subcategories?: string[],
  ) => string;
  onAddSubcategory: (categoryId: string, name: string) => void;
  onSaveEntry: (entry: Transaction | Schedule, scheduled: boolean) => void;
  onRecordSchedule: (item: Schedule) => void;
  topInset: number;
  bottomInset: number;
};

export function LedgerDialog({
  dialog,
  ledger,
  setLedger,
  onClose,
  onAddCategory,
  onAddSubcategory,
  onSaveEntry,
  onRecordSchedule,
  topInset,
  bottomInset,
}: Props) {
  const { colors } = useAppTheme();
  const confirmDelete = (title: string, onConfirm: () => void) => {
    Alert.alert(title, 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: onConfirm },
    ]);
  };
  const dialogTitle =
    dialog?.kind === 'transaction'
      ? 'New transaction'
      : dialog?.kind === 'account'
      ? dialog.item
        ? 'Edit account'
        : 'New account'
      : dialog?.kind === 'budget'
      ? dialog.item
        ? 'Manage budget'
        : 'New budget'
      : dialog?.kind === 'category'
      ? 'New category'
      : dialog?.kind === 'subcategory'
      ? 'New subcategory'
      : dialog?.kind === 'scheduleDetail'
      ? 'Scheduled transaction'
      : 'Transaction details';
  return (
    <Modal
      visible={!!dialog}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => onClose()}>
      <View
        style={[
          styles.modal,
          { backgroundColor: colors.background, paddingTop: topInset },
        ]}>
        <View style={[styles.modalHeader, { borderColor: colors.border }]}>
          <AppText variant="heading">{dialogTitle}</AppText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close"
            onPress={() => onClose()}
            style={styles.closeButton}>
            <AppText variant="label" style={{ color: colors.primary }}>
              Done
            </AppText>
          </Pressable>
        </View>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.modalContent,
            { paddingBottom: bottomInset + 32 },
          ]}>
          {dialog?.kind === 'transaction' ? (
            <TransactionForm
              ledger={ledger}
              initialKind={dialog.initialKind}
              onSave={onSaveEntry}
              onAddCategory={(name, kind) => onAddCategory(name, kind)}
              onAddSubcategory={onAddSubcategory}
            />
          ) : null}
          {dialog?.kind === 'account' ? (
            <AccountForm
              initial={dialog.item}
              onSave={account => {
                setLedger(current => ({
                  ...current,
                  accounts: current.accounts.some(
                    item => item.id === account.id,
                  )
                    ? current.accounts.map(item =>
                        item.id === account.id ? account : item,
                      )
                    : [...current.accounts, account],
                }));
                onClose();
              }}
            />
          ) : null}
          {dialog?.kind === 'budget' ? (
            <BudgetForm
              ledger={ledger}
              initial={dialog.item}
              onSave={budget => {
                setLedger(current => ({
                  ...current,
                  budgets: current.budgets.some(item => item.id === budget.id)
                    ? current.budgets.map(item =>
                        item.id === budget.id ? budget : item,
                      )
                    : [...current.budgets, budget],
                }));
                onClose();
              }}
              onDelete={
                dialog.item
                  ? () =>
                      confirmDelete('Delete budget?', () => {
                        setLedger(current => ({
                          ...current,
                          budgets: current.budgets.filter(
                            item => item.id !== dialog.item?.id,
                          ),
                        }));
                        onClose();
                      })
                  : undefined
              }
            />
          ) : null}
          {dialog?.kind === 'category' ? (
            <CategoryForm
              existing={ledger.categories}
              onSave={(name, kind, subs) => {
                onAddCategory(name, kind, subs);
                onClose();
              }}
            />
          ) : null}
          {dialog?.kind === 'subcategory' ? (
            <SubcategoryForm
              category={dialog.item}
              onSave={name => {
                onAddSubcategory(dialog.item.id, name);
                onClose();
              }}
            />
          ) : null}
          {dialog?.kind === 'transactionDetail' ? (
            <TransactionDetail
              item={dialog.item}
              ledger={ledger}
              onDelete={() =>
                confirmDelete('Delete transaction?', () => {
                  setLedger(current => ({
                    ...current,
                    transactions: current.transactions.filter(
                      item => item.id !== dialog.item.id,
                    ),
                  }));
                  onClose();
                })
              }
            />
          ) : null}
          {dialog?.kind === 'scheduleDetail' ? (
            <ScheduleDetail
              item={dialog.item}
              onRecord={() => onRecordSchedule(dialog.item)}
              onDelete={() =>
                confirmDelete('Delete schedule?', () => {
                  setLedger(current => ({
                    ...current,
                    schedules: current.schedules.filter(
                      item => item.id !== dialog.item.id,
                    ),
                  }));
                  onClose();
                })
              }
            />
          ) : null}
        </ScrollView>
      </View>
    </Modal>
  );
}
