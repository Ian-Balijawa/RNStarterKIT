import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { AppBottomSheet } from '../src/components/overlays/AppBottomSheet';

const mockPresent = jest.fn();
const mockDismiss = jest.fn();

jest.mock('../src/theme/theme', () => ({
  useAppTheme: () => ({
    colors: { surface: '#fff', muted: '#888', border: '#ddd' },
    radius: { lg: 16 },
  }),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 24, bottom: 16, left: 0, right: 0 }),
}));

jest.mock('@gorhom/bottom-sheet', () => {
  const ReactModule = require('react');
  const MockView = require('react-native').View;
  return {
    BottomSheetModal: ReactModule.forwardRef(
      ({ onDismiss, children }: { onDismiss: () => void; children: React.ReactNode }, ref: React.Ref<unknown>) => {
        ReactModule.useImperativeHandle(ref, () => ({
          present: mockPresent,
          dismiss: mockDismiss,
        }));
        return ReactModule.createElement(MockView, { onDismiss }, children);
      },
    ),
    BottomSheetBackdrop: MockView,
    BottomSheetFooter: MockView,
    BottomSheetScrollView: MockView,
    BottomSheetView: MockView,
  };
});

test('opens from an initially hidden state and reopens after a gesture dismissal', async () => {
  const onDismiss = jest.fn();
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  const renderSheet = (visible: boolean) => (
    <AppBottomSheet visible={visible} onDismiss={onDismiss}>
      Sheet content
    </AppBottomSheet>
  );

  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(renderSheet(false));
  });
  expect(mockDismiss).not.toHaveBeenCalled();

  await ReactTestRenderer.act(() => {
    renderer.update(renderSheet(true));
  });
  expect(mockPresent).toHaveBeenCalledTimes(1);

  await ReactTestRenderer.act(() => {
    renderer.root.findByType(require('react-native').View).props.onDismiss();
  });
  expect(onDismiss).toHaveBeenCalledTimes(1);

  await ReactTestRenderer.act(() => {
    renderer.update(renderSheet(false));
  });
  expect(mockDismiss).not.toHaveBeenCalled();

  await ReactTestRenderer.act(() => {
    renderer.update(renderSheet(true));
  });
  expect(mockPresent).toHaveBeenCalledTimes(2);

  await ReactTestRenderer.act(() => {
    renderer.update(renderSheet(false));
  });
  expect(mockDismiss).toHaveBeenCalledTimes(1);
});
