import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AppState, StatusBar, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppDialog } from '../../components/overlays/AppDialog';
import { OfflineBanner } from '../../components/feedback/OfflineBanner';
import { AppRefreshProvider } from '../../components/layout/AppScreen';
import { useAppTheme } from '../../theme/theme';
import { usePersistedState } from '../../hooks/usePersistedState';
import { preferences } from '../../services/storage/mmkv';
import { useOfflineLedger } from './offline';
import {
  EntryKind,
  Account,
  Period,
  Schedule,
  Transaction,
  accountBalance,
  budgetSpent,
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
import { ProfileScreen } from './screens/ProfileScreen';
import { LedgerProfile } from './profile';
import { styles } from './styles';
import {
  RecordActionsProvider,
  RecordActions,
} from './components/RecordActions';
import { NotificationSheet } from './components/NotificationSheet';
import {
  LedgerNotice,
  createNotice,
  displayDeviceNotice,
  scheduleDeviceReminder,
  cancelDeviceReminder,
} from './notifications';
import { formatUGX } from './model';

export function LedgerApp() {
  const { colors, dark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { ledger, setLedger, pendingCount, refreshLocal } = useOfflineLedger();
  const [profile, setProfile] = usePersistedState<LedgerProfile | null>(
    preferences,
    'ledger.profile.v1',
    null,
  );
  const [notices, setNotices] = usePersistedState<LedgerNotice[]>(
    preferences,
    'ledger.notifications.v1',
    [],
  );
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [activeTick, setActiveTick] = useState(0);
  const previousScheduleIds = useRef(
    new Set(ledger.schedules.filter(item => !item.archivedAt).map(item => item.id)),
  );
  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') setActiveTick(value => value + 1);
    });
    return () => subscription.remove();
  }, []);
  const [tab, setTab] = useState<Tab>('home');
  const [previousTab, setPreviousTab] = useState<Tab>('home');
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [sheetPresented, setSheetPresented] = useState(false);
  const showFloatingActions = !dialog && !sheetPresented && !notificationOpen;
  useEffect(() => {
    if (dialog) setSheetPresented(true);
  }, [dialog]);
  const [period, setPeriod] = useState<Period>('monthly');
  const [anchorDate, setAnchorDate] = useState(new Date());
  const [activityKind, setActivityKind] = useState<'all' | EntryKind>('all');
  const addNotice = (title: string, body: string, sourceId?: string) => {
    const notice = createNotice(title, body, sourceId);
    setNotices(current => [notice, ...current].slice(0, 200));
    displayDeviceNotice(notice).catch(() => {});
  };
  const [refreshing, setRefreshing] = useState(false);
  const [confirmation, setConfirmation] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
    destructive?: boolean;
    onConfirm: () => void;
  } | null>(null);
  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      refreshLocal();
      setRefreshing(false);
    }, 300);
  };
  const totals = totalsFor(ledger.transactions, period, anchorDate);
  const balances = useMemo(
    () =>
      ledger.accounts
        .filter(account => !account.archivedAt)
        .map(account => ({
          account,
          balance: accountBalance(account, ledger.transactions),
        })),
    [ledger.accounts, ledger.transactions],
  );
  const totalBalance = balances.reduce((sum, item) => sum + item.balance, 0);
  const recent = useMemo(
    () =>
      ledger.transactions
        .filter(item => !item.archivedAt)
        .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)),
    [ledger.transactions],
  );
  const periodTransactions = recent.filter(item =>
    inPeriod(item.occurredAt, period, anchorDate),
  );
  useEffect(() => {
    const activeSchedules = ledger.schedules.filter(item => !item.archivedAt);
    const currentIds = new Set(activeSchedules.map(item => item.id));
    previousScheduleIds.current.forEach(id => {
      if (!currentIds.has(id)) cancelDeviceReminder(id).catch(() => {});
    });
    previousScheduleIds.current = currentIds;
    const due = activeSchedules.filter(
      item => new Date(item.nextAt).getTime() <= Date.now(),
    );
    if (due.length)
      setNotices(current => {
        const additions = due
          .filter(
            item =>
              !current.some(
                notice => notice.sourceId === `due-${item.id}-${item.nextAt}`,
              ),
          )
          .map(item =>
            createNotice(
              'Scheduled entry is due',
              `${item.note || item.kind} · ${formatUGX(item.amount)}`,
              `due-${item.id}-${item.nextAt}`,
            ),
          );
        return additions.length
          ? [...additions, ...current].slice(0, 200)
          : current;
      });
    activeSchedules.forEach(item => {
      scheduleDeviceReminder(item).catch(() => {});
    });
  }, [activeTick, ledger.schedules, setNotices]);
  const archiveAccount = (account: Account) => {
    setLedger(current => ({
      ...current,
      accounts: current.accounts.map(item =>
        item.id === account.id
          ? { ...item, archivedAt: new Date().toISOString() }
          : item,
      ),
    }));
  };
  const archiveTransaction = (transaction: Transaction) => {
    setLedger(current => ({
      ...current,
      transactions: current.transactions.map(item =>
        item.id === transaction.id
          ? { ...item, archivedAt: new Date().toISOString() }
          : item,
      ),
    }));
  };
  const recordActions: RecordActions = {
    archiveAccount,
    archiveTransaction,
    restoreAccount: account =>
      setLedger(current => ({
        ...current,
        accounts: current.accounts.map(item =>
          item.id === account.id ? { ...item, archivedAt: undefined } : item,
        ),
      })),
    restoreTransaction: transaction =>
      setLedger(current => ({
        ...current,
        transactions: current.transactions.map(item =>
          item.id === transaction.id
            ? { ...item, archivedAt: undefined }
            : item,
        ),
      })),
    archiveSchedule: schedule =>
      setLedger(current => ({
        ...current,
        schedules: current.schedules.map(item =>
          item.id === schedule.id
            ? { ...item, archivedAt: new Date().toISOString() }
            : item,
        ),
      })),
    restoreSchedule: schedule =>
      setLedger(current => ({
        ...current,
        schedules: current.schedules.map(item =>
          item.id === schedule.id ? { ...item, archivedAt: undefined } : item,
        ),
      })),
    deleteSchedule: schedule =>
      setConfirmation({
        title: 'Delete schedule?',
        message: 'This scheduled entry will be removed. It cannot be undone.',
        confirmLabel: 'Delete',
        destructive: true,
        onConfirm: () =>
          setLedger(current => ({
            ...current,
            schedules: current.schedules.filter(item => item.id !== schedule.id),
          })),
      }),
    archiveBudget: budget =>
      setLedger(current => ({
        ...current,
        budgets: current.budgets.map(item =>
          item.id === budget.id
            ? { ...item, archivedAt: new Date().toISOString() }
            : item,
        ),
      })),
    restoreBudget: budget =>
      setLedger(current => ({
        ...current,
        budgets: current.budgets.map(item =>
          item.id === budget.id ? { ...item, archivedAt: undefined } : item,
        ),
      })),
    deleteBudget: budget =>
      setConfirmation({
        title: 'Delete budget?',
        message: 'This budget will be removed. It cannot be undone.',
        confirmLabel: 'Delete',
        destructive: true,
        onConfirm: () =>
          setLedger(current => ({
            ...current,
            budgets: current.budgets.filter(item => item.id !== budget.id),
          })),
      }),
    deleteAccount: account => {
      const linked =
        ledger.transactions.some(
          item =>
            item.accountId === account.id || item.toAccountId === account.id,
        ) ||
        ledger.schedules.some(
          item =>
            item.accountId === account.id || item.toAccountId === account.id,
        );
      setConfirmation(
        linked
          ? {
              title: 'Archive account?',
              message:
                'This account has recorded activity. Archive it to keep those records and balances intact.',
              confirmLabel: 'Archive',
              onConfirm: () => archiveAccount(account),
            }
          : {
              title: `Delete ${account.name}?`,
              message:
                'This account has no recorded activity. Deleting it cannot be undone.',
              confirmLabel: 'Delete',
              destructive: true,
              onConfirm: () =>
                setLedger(current => ({
                  ...current,
                  accounts: current.accounts.filter(
                    item => item.id !== account.id,
                  ),
                })),
            },
      );
    },
    deleteTransaction: transaction =>
      setConfirmation({
        title: 'Delete transaction?',
        message:
          'This will update account balances and totals. It cannot be undone.',
        confirmLabel: 'Delete',
        destructive: true,
        onConfirm: () =>
          setLedger(current => ({
            ...current,
            transactions: current.transactions.filter(
              item => item.id !== transaction.id,
            ),
          })),
      }),
  };

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
    if (scheduled) {
      addNotice(
        'Reminder scheduled',
        `${entry.note || entry.kind} · ${formatUGX(entry.amount)}`,
        entry.id,
      );
    } else {
      const transaction = entry as Transaction;
      addNotice(
        `${
          transaction.kind === 'transfer'
            ? 'Transfer'
            : transaction.kind === 'income'
            ? 'Income'
            : 'Expense'
        } recorded`,
        `${transaction.note || 'Ledger entry'} · ${formatUGX(
          transaction.amount,
        )}`,
        transaction.id,
      );
      if (transaction.kind === 'expense') {
        const date = new Date(transaction.occurredAt);
        ledger.budgets.filter(budget => !budget.archivedAt).forEach(budget => {
          const before = budgetSpent(budget, ledger.transactions, date);
          const after = budgetSpent(
            budget,
            [...ledger.transactions, transaction],
            date,
          );
          if (before < budget.amount && after >= budget.amount) {
            addNotice(
              'Budget limit reached',
              `${budget.name} · ${formatUGX(after)} spent`,
              budget.id,
            );
          }
        });
      }
    }
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
    cancelDeviceReminder(item.id).catch(() => {});
    addNotice(
      'Scheduled entry recorded',
      `${item.note || item.kind} · ${formatUGX(item.amount)}`,
      item.id,
    );
    setDialog(null);
  };
  const header = (
    <LedgerHeader
      title={NAV.find(item => item.id === tab)?.label ?? ''}
      profileName={profile?.name}
      onPressProfile={() => {
        setPreviousTab(tab);
        setTab('profile');
      }}
      onPressNotifications={() => setNotificationOpen(true)}
      unreadCount={notices.filter(item => !item.readAt).length}
    />
  );

  return (
    <View
      style={[
        styles.root,
        { backgroundColor: colors.background, paddingTop: insets.top },
      ]}>
      <StatusBar barStyle={dark ? 'light-content' : 'dark-content'} />
      <OfflineBanner pendingCount={pendingCount} />
      <AppRefreshProvider value={{ onRefresh, refreshing }}>
        <RecordActionsProvider value={recordActions}>
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
                showFloatingActions={showFloatingActions}
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
                showFloatingActions={showFloatingActions}
              />
            ) : tab === 'budgets' ? (
              <BudgetsScreen
                header={header}
                ledger={ledger}
                onOpenDialog={setDialog}
                showFloatingActions={showFloatingActions}
              />
            ) : tab === 'accounts' ? (
              <AccountsScreen
                header={header}
                balances={balances}
                totalBalance={totalBalance}
                onOpenDialog={setDialog}
                showFloatingActions={showFloatingActions}
              />
            ) : tab === 'profile' ? (
              <ProfileScreen
                profile={profile}
                ledger={ledger}
                balances={balances}
                totalBalance={totalBalance}
                recent={recent}
                onSave={setProfile}
                onBack={() => setTab(previousTab)}
                onOpenNotifications={() => setNotificationOpen(true)}
                unreadCount={notices.filter(item => !item.readAt).length}
                pendingCount={pendingCount}
                onSelectTab={setTab}
                onOpenDialog={setDialog}
              />
            ) : (
              <CategoriesScreen
                header={header}
                ledger={ledger}
                onOpenDialog={setDialog}
                showFloatingActions={showFloatingActions}
              />
            )}
          </View>
        </RecordActionsProvider>
      </AppRefreshProvider>
      {tab !== 'profile' ? (
        <LedgerTabBar
          tab={tab}
          onSelectTab={setTab}
          bottomInset={insets.bottom}
        />
      ) : null}
      <LedgerDialog
        dialog={dialog}
        ledger={ledger}
        setLedger={setLedger}
        onClose={() => setDialog(null)}
        onSheetDismissed={() => setSheetPresented(false)}
        onAddCategory={addCategory}
        onAddSubcategory={addSubcategory}
        onSaveEntry={saveEntry}
        onRecordSchedule={recordSchedule}
      />
      <NotificationSheet
        visible={notificationOpen}
        notices={notices}
        onClose={() => setNotificationOpen(false)}
        onRead={id =>
          setNotices(current =>
            current.map(item =>
              item.id === id
                ? { ...item, readAt: new Date().toISOString() }
                : item,
            ),
          )
        }
        onReadAll={() =>
          setNotices(current =>
            current.map(item =>
              item.readAt
                ? item
                : { ...item, readAt: new Date().toISOString() },
            ),
          )
        }
        onEnabled={() =>
          ledger.schedules.filter(item => !item.archivedAt).forEach(item => {
            scheduleDeviceReminder(item).catch(() => {});
          })
        }
      />
      <AppDialog
        visible={!!confirmation}
        title={confirmation?.title ?? ''}
        message={confirmation?.message}
        confirmLabel={confirmation?.confirmLabel}
        destructive={confirmation?.destructive}
        onCancel={() => setConfirmation(null)}
        onConfirm={() => {
          confirmation?.onConfirm();
          setConfirmation(null);
        }}
      />
    </View>
  );
}
