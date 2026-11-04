import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { TextInput } from 'react-native';
import { AppThemeProvider } from '../src/theme/theme';
import { AppButton } from '../src/components/ui/AppButton';
import { AppDialog } from '../src/components/overlays/AppDialog';
import { AppText } from '../src/components/ui/AppText';
import { LedgerDialog } from '../src/features/ledger/components/LedgerDialog';
import { INITIAL_LEDGER } from '../src/features/ledger/model';

jest.mock('@gorhom/bottom-sheet', () => ({
  BottomSheetTextInput: require('react-native').TextInput,
}));

jest.mock('../src/components/overlays/AppBottomSheet', () => {
  const ReactModule = require('react');
  const MockView = require('react-native').View;
  return {
    AppBottomSheet: ({
      children,
      footer,
      visible,
    }: {
      children: React.ReactNode;
      footer?: React.ReactNode;
      visible: boolean;
    }) =>
      visible
        ? ReactModule.createElement(MockView, null, children, footer)
        : null,
  };
});

test('category form submits from its floating sheet action and shows validation there', async () => {
  const onAddCategory = jest.fn(() => 'education');
  const onClose = jest.fn();
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(
      <AppThemeProvider>
        <LedgerDialog
          dialog={{ kind: 'category' }}
          ledger={INITIAL_LEDGER}
          setLedger={jest.fn()}
          onClose={onClose}
          onAddCategory={onAddCategory}
          onAddSubcategory={jest.fn()}
          onSaveEntry={jest.fn()}
          onRecordSchedule={jest.fn()}
        />
      </AppThemeProvider>,
    );
  });

  const submit = () =>
    renderer.root
      .findAllByType(AppButton)
      .find(button => button.props.title === 'Save category')!;
  expect(
    renderer.root
      .findAllByType(AppButton)
      .filter(button => button.props.title === 'Save category'),
  ).toHaveLength(1);

  await ReactTestRenderer.act(() => submit().props.onPress());
  expect(
    renderer.root
      .findAllByType(AppText)
      .some(text => text.props.children === 'Enter a category name.'),
  ).toBe(true);

  await ReactTestRenderer.act(() => {
    renderer.root
      .findAllByType(TextInput)
      .find(input => input.props.accessibilityLabel === 'Category name')!
      .props.onChangeText('Education');
  });
  await ReactTestRenderer.act(() => submit().props.onPress());
  expect(onAddCategory).toHaveBeenCalledWith('Education', 'expense', []);
  expect(onClose).toHaveBeenCalledTimes(1);
});

test('scheduled entry can be deleted through a custom confirmation', async () => {
  const schedule = {
    id: 'rent-reminder',
    kind: 'expense' as const,
    amount: 100000,
    accountId: 'cash',
    note: 'Rent',
    nextAt: '2027-01-01T09:00:00.000Z',
    recurrence: 'monthly' as const,
  };
  const ledger = { ...INITIAL_LEDGER, schedules: [schedule] };
  const setLedger = jest.fn();
  const onClose = jest.fn();
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(
      <AppThemeProvider>
        <LedgerDialog
          dialog={{ kind: 'scheduleDetail', item: schedule }}
          ledger={ledger}
          setLedger={setLedger}
          onClose={onClose}
          onAddCategory={jest.fn()}
          onAddSubcategory={jest.fn()}
          onSaveEntry={jest.fn()}
          onRecordSchedule={jest.fn()}
        />
      </AppThemeProvider>,
    );
  });

  const deleteButton = renderer.root
    .findAllByType(AppButton)
    .find(button => button.props.title === 'Delete schedule')!;
  await ReactTestRenderer.act(() => deleteButton.props.onPress());
  const confirmation = renderer.root.findByType(AppDialog);
  expect(confirmation.props.visible).toBe(true);
  await ReactTestRenderer.act(() => confirmation.props.onConfirm());
  expect(setLedger).toHaveBeenCalledTimes(1);
  expect(setLedger.mock.calls[0][0](ledger).schedules).toEqual([]);
  expect(onClose).toHaveBeenCalledTimes(1);
});
