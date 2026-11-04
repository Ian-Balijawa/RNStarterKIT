/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { AppButton } from '../src/components/ui/AppButton';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppThemeProvider } from '../src/theme/theme';
import { AppBottomSheetProvider } from '../src/components/overlays/AppBottomSheetProvider';
import { LedgerApp } from '../src/features/ledger/LedgerApp';

jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);

jest.mock('react-native-simple-biometrics', () => ({
  __esModule: true,
  default: {
    canAuthenticate: jest.fn().mockResolvedValue(false),
    requestBioAuth: jest.fn(),
  },
}));

jest.mock('react-native-gesture-handler', () => ({
  GestureHandlerRootView: require('react-native').View,
}));
jest.mock('react-native-mmkv', () => ({
  createMMKV: () => {
    const values = new Map<string, string>();
    return {
      getString: (key: string) => values.get(key),
      set: (key: string, value: string) => values.set(key, value),
      remove: (key: string) => values.delete(key),
    };
  },
}));
jest.mock('@gorhom/bottom-sheet', () => {
  const MockView = require('react-native').View;
  return {
    __esModule: true,
    default: MockView,
    BottomSheetModalProvider: MockView,
    BottomSheetModal: () => null,
    BottomSheetBackdrop: () => null,
    BottomSheetView: MockView,
    BottomSheetScrollView: MockView,
  };
});
jest.mock('@react-navigation/bottom-tabs/unstable', () => {
  const ReactModule = require('react');
  return {
    createNativeBottomTabNavigator: () => ({
      Navigator: require('react-native').View,
      Screen: ({
        name,
        component,
      }: {
        name: string;
        component: React.ComponentType;
      }) => (name === 'Chats' ? ReactModule.createElement(component) : null),
    }),
  };
});
jest.mock('react-native-maps', () => {
  const MockView = require('react-native').View;
  return {
    __esModule: true,
    default: MockView,
    Marker: MockView,
    Polyline: MockView,
    PROVIDER_GOOGLE: 'google',
  };
});

import App from '../App';

const globalWithDev = global as unknown as { __DEV__: boolean };
const originalDev = globalWithDev.__DEV__;

afterEach(() => {
  globalWithDev.__DEV__ = originalDev;
});

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});

test('skips the lock in development builds', async () => {
  globalWithDev.__DEV__ = true;
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(<App />);
  });

  expect(JSON.stringify(renderer.toJSON())).not.toContain(
    'PERSONAL EXPENSE TRACKER',
  );
  expect(
    renderer.root.findAllByProps({ accessibilityLabel: 'Open profile' }).length,
  ).toBeGreaterThan(0);
  await ReactTestRenderer.act(async () => renderer.unmount());
});

test('skips the lock in development builds', async () => {
  globalWithDev.__DEV__ = true;
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(<App />);
  });

  expect(JSON.stringify(renderer.toJSON())).not.toContain(
    'PERSONAL EXPENSE TRACKER',
  );
  await ReactTestRenderer.act(async () => renderer.unmount());
});

test('creates a profile from the overview avatar and shows its initials', async () => {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider
        initialMetrics={{
          frame: { x: 0, y: 0, width: 375, height: 812 },
          insets: { top: 0, right: 0, bottom: 0, left: 0 },
        }}>
        <AppThemeProvider>
          <AppBottomSheetProvider>
            <LedgerApp />
          </AppBottomSheetProvider>
        </AppThemeProvider>
      </SafeAreaProvider>,
    );
  });
  await ReactTestRenderer.act(() => {
    renderer.root
      .findByProps({ accessibilityLabel: 'Open profile' })
      .props.onPress();
  });
  const input = (label: string) =>
    renderer.root.findByProps({ accessibilityLabel: label });
  await ReactTestRenderer.act(() => {
    input('Full name').props.onChangeText('Amina N.');
    input('Phone number').props.onChangeText('+256 700 000 000');
  });
  await ReactTestRenderer.act(() => {
    renderer.root
      .findAllByType(AppButton)
      .find(item => item.props.title === 'Create profile')!
      .props.onPress();
  });
  // The profile screen now has two back buttons: the top bar and the
  // collapsed header. Both call onBack, so press the first one.
  await ReactTestRenderer.act(() => {
    renderer.root
      .findAllByProps({ accessibilityLabel: 'Back to overview' })[0]
      .props.onPress();
  });
  expect(
    renderer.root.findAllByProps({ accessibilityLabel: 'Open profile' }).length,
  ).toBeGreaterThan(0);
  expect(JSON.stringify(renderer.toJSON())).toContain('AN');
});
