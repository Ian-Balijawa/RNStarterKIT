import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { AppSelect } from '../src/components/forms/AppSelect';
import { AppText } from '../src/components/ui/AppText';
import { LedgerFloatingAction } from '../src/features/ledger/components/LedgerFloatingActions';
import { INITIAL_LEDGER } from '../src/features/ledger/model';
import { AccountsScreen } from '../src/features/ledger/screens/AccountsScreen';
import { ActivityScreen } from '../src/features/ledger/screens/ActivityScreen';
import { BudgetsScreen } from '../src/features/ledger/screens/BudgetsScreen';
import { CategoriesScreen } from '../src/features/ledger/screens/CategoriesScreen';
import { AppThemeProvider } from '../src/theme/theme';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('@gorhom/bottom-sheet', () => ({
  BottomSheetTextInput: require('react-native').TextInput,
}));

test('category browsing and floating subcategory action follow the selected category', async () => {
  const onOpenDialog = jest.fn();
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  const render = (ledger = INITIAL_LEDGER) => (
    <AppThemeProvider>
      <CategoriesScreen
        header={<AppText>Categories</AppText>}
        ledger={ledger}
        onOpenDialog={onOpenDialog}
      />
    </AppThemeProvider>
  );

  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(render());
  });
  const select = (label: string) =>
    renderer.root
      .findAllByType(AppSelect)
      .find(item => item.props.label === label)!;

  await ReactTestRenderer.act(() =>
    select('Category').props.onChange('transport'),
  );
  expect(
    select('Subcategories').props.options.map(
      (item: { value: string }) => item.value,
    ),
  ).toContain('Fuel / petrol');

  await ReactTestRenderer.act(() => {
    renderer.root
      .findAllByType(LedgerFloatingAction)
      .find(item => item.props.label === 'Add subcategory')!
      .props.onPress();
  });
  expect(onOpenDialog).toHaveBeenCalledWith({
    kind: 'subcategory',
    item: INITIAL_LEDGER.categories.find(item => item.id === 'transport'),
  });

  const newCategory = {
    id: 'education',
    name: 'Education',
    kind: 'expense' as const,
    subcategories: [],
  };
  await ReactTestRenderer.act(() => {
    renderer.update(
      render({
        ...INITIAL_LEDGER,
        categories: [...INITIAL_LEDGER.categories, newCategory],
      }),
    );
  });
  expect(select('Category').props.value).toBe('education');
});

test('activity, accounts, and budgets open their create sheets from floating actions', async () => {
  const onOpenDialog = jest.fn();
  let activity!: ReactTestRenderer.ReactTestRenderer;
  let accounts!: ReactTestRenderer.ReactTestRenderer;
  let budgets!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    activity = ReactTestRenderer.create(
      <AppThemeProvider>
        <ActivityScreen
          header={<AppText>Activity</AppText>}
          ledger={INITIAL_LEDGER}
          recent={[]}
          totals={{ income: 0, expense: 0 }}
          period="monthly"
          onPeriodChange={jest.fn()}
          anchorDate={new Date()}
          onAnchorDateChange={jest.fn()}
          activityKind="all"
          onActivityKindChange={jest.fn()}
          onOpenDialog={onOpenDialog}
        />
      </AppThemeProvider>,
    );
    accounts = ReactTestRenderer.create(
      <AppThemeProvider>
        <AccountsScreen
          header={<AppText>Accounts</AppText>}
          balances={INITIAL_LEDGER.accounts.map(account => ({
            account,
            balance: 0,
          }))}
          totalBalance={0}
          onOpenDialog={onOpenDialog}
        />
      </AppThemeProvider>,
    );
    budgets = ReactTestRenderer.create(
      <AppThemeProvider>
        <BudgetsScreen
          header={<AppText>Budgets</AppText>}
          ledger={INITIAL_LEDGER}
          onOpenDialog={onOpenDialog}
        />
      </AppThemeProvider>,
    );
  });

  await ReactTestRenderer.act(() => {
    activity.root.findByType(LedgerFloatingAction).props.onPress();
    accounts.root.findByType(LedgerFloatingAction).props.onPress();
    budgets.root.findByType(LedgerFloatingAction).props.onPress();
  });
  expect(onOpenDialog).toHaveBeenCalledWith({ kind: 'transaction' });
  expect(onOpenDialog).toHaveBeenCalledWith({ kind: 'account' });
  expect(onOpenDialog).toHaveBeenCalledWith({ kind: 'budget' });
});
