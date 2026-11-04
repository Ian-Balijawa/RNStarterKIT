import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { AppThemeProvider } from '../src/theme/theme';
import { EntryRow } from '../src/features/ledger/components/EntryRow';
import { RecordActionsProvider } from '../src/features/ledger/components/RecordActions';
import { INITIAL_LEDGER, Transaction } from '../src/features/ledger/model';

test('transaction swipe actions also have accessible archive and delete commands', async () => {
  const item: Transaction = {
    id: 'lunch',
    kind: 'expense',
    amount: 1000,
    accountId: 'cash',
    categoryId: 'food',
    note: 'Lunch',
    occurredAt: '2026-11-03T10:00:00Z',
  };
  const archiveTransaction = jest.fn();
  const deleteTransaction = jest.fn();
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(
      <AppThemeProvider>
        <RecordActionsProvider
          value={{
            archiveAccount: jest.fn(),
            deleteAccount: jest.fn(),
            restoreAccount: jest.fn(),
            archiveTransaction,
            deleteTransaction,
            restoreTransaction: jest.fn(),
          }}>
          <EntryRow item={item} ledger={INITIAL_LEDGER} onPress={jest.fn()} />
        </RecordActionsProvider>
      </AppThemeProvider>,
    );
  });
  const row = renderer.root.findByProps({
    accessibilityLabel: 'Lunch, expense, UGX 1,000',
  });
  await ReactTestRenderer.act(() =>
    row.props.onAccessibilityAction({ nativeEvent: { actionName: 'archive' } }),
  );
  await ReactTestRenderer.act(() =>
    row.props.onAccessibilityAction({ nativeEvent: { actionName: 'delete' } }),
  );
  expect(archiveTransaction).toHaveBeenCalledWith(item);
  expect(deleteTransaction).toHaveBeenCalledWith(item);
});
