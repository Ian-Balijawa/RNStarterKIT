import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppText } from '../src/components/ui/AppText';
import { AppThemeProvider } from '../src/theme/theme';
import { EntryRow } from '../src/features/ledger/components/EntryRow';
import { INITIAL_LEDGER, Transaction } from '../src/features/ledger/model';
import { ProfileScreen } from '../src/features/ledger/screens/ProfileScreen';

jest.mock('react-native-gesture-handler', () => ({
  GestureHandlerRootView: require('react-native').View,
}));
jest.mock('@gorhom/bottom-sheet', () => ({
  BottomSheetTextInput: require('react-native').TextInput,
}));
jest.mock('../src/components/overlays/AppBottomSheet', () => ({
  AppBottomSheet: ({
    visible,
    children,
    footer,
  }: {
    visible: boolean;
    children: React.ReactNode;
    footer?: React.ReactNode;
  }) =>
    visible
      ? require('react').createElement(
          require('react-native').View,
          null,
          children,
          footer,
        )
      : null,
}));

test('shows the saved name, ledger totals, account preview, and latest expense', async () => {
  const transactions: Transaction[] = [
    {
      id: '4',
      kind: 'income',
      amount: 2000,
      accountId: 'cash',
      note: 'Pay',
      occurredAt: '2026-11-04T10:00:00Z',
    },
    {
      id: '3',
      kind: 'transfer',
      amount: 500,
      accountId: 'cash',
      toAccountId: 'bank',
      note: '',
      occurredAt: '2026-11-03T10:00:00Z',
    },
    {
      id: '2',
      kind: 'income',
      amount: 1000,
      accountId: 'bank',
      note: 'Sale',
      occurredAt: '2026-11-02T10:00:00Z',
    },
    {
      id: '1',
      kind: 'expense',
      amount: 700,
      accountId: 'cash',
      categoryId: 'food',
      note: 'Groceries',
      occurredAt: '2026-11-01T10:00:00Z',
    },
  ];
  const ledger = {
    ...INITIAL_LEDGER,
    accounts: [
      ...INITIAL_LEDGER.accounts,
      {
        id: 'extra',
        name: 'Savings',
        type: 'bank' as const,
        openingBalance: 0,
      },
    ],
    transactions,
  };
  const onOpenDialog = jest.fn();
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider
        initialMetrics={{
          frame: { x: 0, y: 0, width: 375, height: 812 },
          insets: { top: 0, right: 0, bottom: 0, left: 0 },
        }}>
        <AppThemeProvider>
          <ProfileScreen
            profile={{ name: 'Amina N.', phone: '+256 700 000 000' }}
            ledger={ledger}
            balances={ledger.accounts.map(account => ({
              account,
              balance: account.openingBalance,
            }))}
            totalBalance={2300}
            recent={transactions}
            onSave={jest.fn()}
            onBack={jest.fn()}
            onSelectTab={jest.fn()}
            onOpenDialog={onOpenDialog}
          />
        </AppThemeProvider>
      </SafeAreaProvider>,
    );
  });

  const output = JSON.stringify(renderer.toJSON());
  expect(output).toContain('Amina N.');
  expect(output).toContain('UGX 2,300');
  expect(output).toContain('UGX 3,000');
  expect(output).toContain('UGX 700');
  const labels = renderer.root
    .findAllByType(AppText)
    .map(node =>
      Array.isArray(node.props.children)
        ? node.props.children.join('')
        : node.props.children,
    );
  expect(labels).toContain('1 more account');
  expect(output).toContain('LATEST EXPENSE');
  const rows = renderer.root.findAllByType(EntryRow);
  expect(rows.map(row => row.props.item.id)).toEqual(['4', '3', '2', '1']);
  rows[3].props.onPress();
  expect(onOpenDialog).toHaveBeenCalledWith({
    kind: 'transactionDetail',
    item: transactions[3],
  });
});
