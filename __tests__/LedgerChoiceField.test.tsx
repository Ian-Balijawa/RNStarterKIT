import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { LedgerChoiceField } from '../src/features/ledger/forms/LedgerChoiceField';
import { AppThemeProvider } from '../src/theme/theme';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('@gorhom/bottom-sheet', () => ({
  BottomSheetTextInput: require('react-native').TextInput,
}));

test('keeps short choices visible and condenses longer choices into a select', async () => {
  const options = ['Cash', 'Bank', 'Mobile money', 'Business'].map(value => ({
    label: value,
    value,
  }));
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  const render = (count: number) => (
    <AppThemeProvider>
      <LedgerChoiceField
        label="Account"
        options={options.slice(0, count)}
        value="Cash"
        onChange={jest.fn()}
      />
    </AppThemeProvider>
  );

  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(render(3));
  });
  expect(
    renderer.root.findAll(node => node.props.accessibilityRole === 'radio')
      .length,
  ).toBeGreaterThan(0);

  await ReactTestRenderer.act(() => renderer.update(render(4)));
  expect(
    renderer.root.findAll(
      node => node.props.accessibilityLabel === 'Account: Cash',
    ).length,
  ).toBeGreaterThan(0);
  expect(
    renderer.root.findAll(node => node.props.accessibilityRole === 'radio'),
  ).toHaveLength(0);
});
