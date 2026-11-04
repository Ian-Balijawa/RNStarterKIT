import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  AppBottomSheet,
  DEFAULT_SNAP_POINTS,
} from '../../../components/overlays/AppBottomSheet';
import { AppButton } from '../../../components/ui/AppButton';
import { AppText } from '../../../components/ui/AppText';
import { useAppTheme } from '../../../theme/theme';
import {
  LedgerState,
  Schedule,
  Transaction,
  accountBalance,
  openingBalanceForCurrentBalance,
} from '../model';
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
import { LedgerFormHandle } from '../forms/types';

type Props = {
  dialog: Dialog | null;
  ledger: LedgerState;
  setLedger: React.Dispatch<React.SetStateAction<LedgerState>>;
  onClose: () => void;
  onSheetDismissed?: () => void;
  onAddCategory: (
    name: string,
    kind: 'expense' | 'income',
    subcategories?: string[],
  ) => string;
  onAddSubcategory: (categoryId: string, name: string) => void;
  onSaveEntry: (entry: Transaction | Schedule, scheduled: boolean) => void;
  onRecordSchedule: (item: Schedule) => void;
};

export function LedgerDialog({
  dialog,
  ledger,
  setLedger,
  onClose,
  onSheetDismissed,
  onAddCategory,
  onAddSubcategory,
  onSaveEntry,
  onRecordSchedule,
}: Props) {
  const formRef = useRef<LedgerFormHandle>(null);
  const [transactionActionTitle, setTransactionActionTitle] =
    useState('Save expense');
  const [formError, setFormError] = useState('');
  const { colors } = useAppTheme();
  useEffect(() => setFormError(''), [dialog]);
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
  const actionTitle =
    dialog?.kind === 'transaction'
      ? transactionActionTitle
      : dialog?.kind === 'account'
      ? dialog.item
        ? 'Save changes'
        : 'Add account'
      : dialog?.kind === 'budget'
      ? dialog.item
        ? 'Save budget'
        : 'Create budget'
      : dialog?.kind === 'category'
      ? 'Save category'
      : dialog?.kind === 'subcategory'
      ? 'Add subcategory'
      : null;

  return (
    <AppBottomSheet
      visible={!!dialog}
      onDismiss={() => {
        onClose();
        onSheetDismissed?.();
      }}
      title={dialogTitle}
      scrollable
      // snapPoints={['65%', '100%']}
      snapPoints={DEFAULT_SNAP_POINTS}
      footer={
        actionTitle ? (
          <View style={footerStyles.content}>
            {formError ? (
              <AppText
                variant="caption"
                accessibilityLiveRegion="polite"
                style={{ color: colors.danger }}>
                {formError}
              </AppText>
            ) : null}
            <View style={footerStyles.actions}>
              <AppButton
                title={actionTitle}
                style={footerStyles.action}
                onPress={() => formRef.current?.submit()}
              />
            </View>
          </View>
        ) : undefined
      }>
      {dialog?.kind === 'transaction' ? (
        <TransactionForm
          ledger={ledger}
          initialKind={dialog.initialKind}
          onSave={onSaveEntry}
          onAddCategory={(name, kind) => onAddCategory(name, kind)}
          onAddSubcategory={onAddSubcategory}
          submitRef={formRef}
          onActionTitleChange={setTransactionActionTitle}
          onErrorChange={setFormError}
        />
      ) : null}
      {dialog?.kind === 'account' ? (
        <AccountForm
          initial={dialog.item}
          currentBalance={
            dialog.item
              ? accountBalance(dialog.item, ledger.transactions)
              : undefined
          }
          submitRef={formRef}
          onErrorChange={setFormError}
          onSave={account => {
            setLedger(current => ({
              ...current,
              accounts: current.accounts.some(item => item.id === account.id)
                ? current.accounts.map(item =>
                    item.id === account.id
                      ? {
                          ...account,
                          openingBalance: openingBalanceForCurrentBalance(
                            item,
                            current.transactions,
                            account.openingBalance,
                          ),
                        }
                      : item,
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
          submitRef={formRef}
          onErrorChange={setFormError}
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
        />
      ) : null}
      {dialog?.kind === 'category' ? (
        <CategoryForm
          existing={ledger.categories}
          submitRef={formRef}
          onErrorChange={setFormError}
          onSave={(name, kind, subs) => {
            onAddCategory(name, kind, subs);
            onClose();
          }}
        />
      ) : null}
      {dialog?.kind === 'subcategory' ? (
        <SubcategoryForm
          category={dialog.item}
          submitRef={formRef}
          onErrorChange={setFormError}
          onSave={name => {
            onAddSubcategory(dialog.item.id, name);
            onClose();
          }}
        />
      ) : null}
      {dialog?.kind === 'transactionDetail' ? (
        <TransactionDetail item={dialog.item} ledger={ledger} />
      ) : null}
      {dialog?.kind === 'scheduleDetail' ? (
        <ScheduleDetail
          item={dialog.item}
          onRecord={() => onRecordSchedule(dialog.item)}
        />
      ) : null}
    </AppBottomSheet>
  );
}

const footerStyles = StyleSheet.create({
  content: { gap: 8, alignSelf: 'stretch' },
  actions: { flexDirection: 'row', gap: 8 },
  action: { flex: 1 },
});
