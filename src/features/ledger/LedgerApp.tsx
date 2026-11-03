import React, { useMemo, useState } from 'react';
import { StatusBar, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../theme/theme';
import { usePersistedState } from '../../hooks/usePersistedState';
import { preferences } from '../../services/storage/mmkv';
import {
  EntryKind,
  INITIAL_LEDGER,
  LedgerState,
  Period,
  Schedule,
  Transaction,
  accountBalance,
  inPeriod,
  newId,
  nextOccurrence,
  totalsFor,
} from './model';
import { Dialog, NAV, Tab } from './navigation';
import { LedgerHeader } from './components/LedgerHeader';
import { LedgerTabBar } from './components/LedgerTabBar';
import { LedgerDialog } from './components/LedgerDialog';
import { OverviewScreen } from './screens/OverviewScreen';
import { ActivityScreen } from './screens/ActivityScreen';
import { BudgetsScreen } from './screens/BudgetsScreen';
import { AccountsScreen } from './screens/AccountsScreen';
import { CategoriesScreen } from './screens/CategoriesScreen';
import { styles } from './styles';

export function LedgerApp() {
  const { colors, dark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [ledger, setLedger] = usePersistedState<LedgerState>(
    preferences,
    'ledger.v1',
    INITIAL_LEDGER,
  );
  const [tab, setTab] = useState<Tab>('home');
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [period, setPeriod] = useState<Period>('monthly');
  const [anchorDate, setAnchorDate] = useState(new Date());
  const [activityKind, setActivityKind] = useState<'all' | EntryKind>('all');
  const totals = totalsFor(ledger.transactions, period, anchorDate);
  const balances = useMemo(
    () =>
      ledger.accounts.map(account => ({
        account,
        balance: accountBalance(account, ledger.transactions),
      })),
    [ledger.accounts, ledger.transactions],
  );
  const totalBalance = balances.reduce((sum, item) => sum + item.balance, 0);
  const recent = useMemo(
    () =>
      [...ledger.transactions].sort((a, b) =>
        b.occurredAt.localeCompare(a.occurredAt),
      ),
    [ledger.transactions],
  );
  const periodTransactions = recent.filter(item =>
    inPeriod(item.occurredAt, period, anchorDate),
  );

  const addCategory = (
    name: string,
    kind: 'expense' | 'income',
    subcategories: string[] = [],
  ) => {
    const existing = ledger.categories.find(
      item =>
        item.kind === kind && item.name.toLowerCase() === name.toLowerCase(),
    );
    if (existing) return existing.id;
    const id = newId();
    setLedger(current => ({
      ...current,
      categories: [...current.categories, { id, name, kind, subcategories }],
    }));
    return id;
  };
  const addSubcategory = (categoryId: string, name: string) => {
    setLedger(current => ({
      ...current,
      categories: current.categories.map(category =>
        category.id === categoryId &&
        !category.subcategories.some(
          item => item.toLowerCase() === name.toLowerCase(),
        )
          ? { ...category, subcategories: [...category.subcategories, name] }
          : category,
      ),
    }));
  };
  const saveEntry = (entry: Transaction | Schedule, scheduled: boolean) => {
    setLedger(current =>
      scheduled
        ? { ...current, schedules: [entry as Schedule, ...current.schedules] }
        : {
            ...current,
            transactions: [entry as Transaction, ...current.transactions],
          },
    );
    setDialog(null);
  };
  const recordSchedule = (item: Schedule) => {
    const occurredAt = new Date().toISOString();
    const { nextAt, recurrence, ...rest } = item;
    let next = nextOccurrence(nextAt, recurrence);
    while (new Date(next).getTime() <= Date.now())
      next = nextOccurrence(next, recurrence);
    setLedger(current => ({
      ...current,
      transactions: [
        { ...rest, id: newId(), occurredAt },
        ...current.transactions,
      ],
      schedules: current.schedules.map(schedule =>
        schedule.id === item.id ? { ...schedule, nextAt: next } : schedule,
      ),
    }));
    setDialog(null);
  };
  const header = (
    <LedgerHeader title={NAV.find(item => item.id === tab)?.label ?? ''} />
  );

  return (
    <View
      style={[
        styles.root,
        { backgroundColor: colors.background, paddingTop: insets.top },
      ]}>
      <StatusBar barStyle={dark ? 'light-content' : 'dark-content'} />
      <View style={styles.flex}>
        {tab === 'home' ? (
          <OverviewScreen
            header={header}
            ledger={ledger}
            totalBalance={totalBalance}
            totals={totals}
            recent={recent}
            periodTransactions={periodTransactions}
            period={period}
            onPeriodChange={setPeriod}
            anchorDate={anchorDate}
            onAnchorDateChange={setAnchorDate}
            onSelectTab={setTab}
            onOpenDialog={setDialog}
          />
        ) : tab === 'activity' ? (
          <ActivityScreen
            header={header}
            ledger={ledger}
            recent={recent}
            totals={totals}
            period={period}
            onPeriodChange={setPeriod}
            anchorDate={anchorDate}
            onAnchorDateChange={setAnchorDate}
            activityKind={activityKind}
            onActivityKindChange={setActivityKind}
            onOpenDialog={setDialog}
          />
        ) : tab === 'budgets' ? (
          <BudgetsScreen
            header={header}
            ledger={ledger}
            onOpenDialog={setDialog}
          />
        ) : tab === 'accounts' ? (
          <AccountsScreen
            header={header}
            balances={balances}
            totalBalance={totalBalance}
            onOpenDialog={setDialog}
          />
        ) : (
          <CategoriesScreen
            header={header}
            ledger={ledger}
            onOpenDialog={setDialog}
          />
        )}
      </View>
      <LedgerTabBar
        tab={tab}
        onSelectTab={setTab}
        bottomInset={insets.bottom}
      />
      <LedgerDialog
        dialog={dialog}
        ledger={ledger}
        setLedger={setLedger}
        onClose={() => setDialog(null)}
        onAddCategory={addCategory}
        onAddSubcategory={addSubcategory}
        onSaveEntry={saveEntry}
        onRecordSchedule={recordSchedule}
      />
    </View>
  );
}
