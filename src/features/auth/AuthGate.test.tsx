import React from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  ScrollView,
  TextInput,
} from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import { AuthGate } from './AuthGate';
import { AppButton } from '../../components/ui/AppButton';

const mockSignIn = jest.fn().mockResolvedValue(undefined);
jest.mock('./AuthProvider', () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    error: null,
    retry: jest.fn(),
    signIn: mockSignIn,
  }),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 24, bottom: 20, left: 0, right: 0 }),
}));
jest.mock('../../theme/theme', () => ({
  useAppTheme: () => ({
    colors: {
      background: '#fff',
      surface: '#fff',
      border: '#ddd',
      text: '#000',
      muted: '#666',
      primary: '#000',
      danger: '#900',
    },
  }),
}));
jest.mock('../../components/ui/AppButton', () => ({
  AppButton: (props: object) =>
    require('react').createElement(require('react-native').Pressable, props),
}));

test('signs in with phone and password and keeps the button in the keyboard-aware layout', async () => {
  const listeners: Record<string, () => void> = {};
  const listenerSpy = jest
    .spyOn(Keyboard, 'addListener')
    .mockImplementation((event, listener) => {
      listeners[event] = listener as () => void;
      return { remove: jest.fn() };
    });
  let tree: TestRenderer.ReactTestRenderer;
  await act(async () => {
    tree = TestRenderer.create(
      <AuthGate>
        <></>
      </AuthGate>,
    );
  });
  const inputs = tree!.root.findAllByType(TextInput);
  expect(inputs.map(input => input.props.accessibilityLabel)).toEqual([
    'Phone number',
    'Password',
  ]);
  const avoiding = tree!.root.findByType(KeyboardAvoidingView);
  expect(avoiding.findAllByType(ScrollView)).toHaveLength(1);
  const button = tree!.root.findByType(AppButton);
  expect(avoiding.findAllByType(AppButton)).toHaveLength(1);
  expect(
    tree!.root.findByType(ScrollView).findAllByType(AppButton),
  ).toHaveLength(0);
  await act(async () => {
    inputs[0].props.onChangeText('+256700000000');
    inputs[1].props.onChangeText('password');
    listeners.keyboardDidShow();
  });
  await act(async () => {
    await button.props.onPress();
  });
  expect(mockSignIn).toHaveBeenCalledWith('+256700000000', 'password');
  await act(async () => {
    tree!.unmount();
  });
  listenerSpy.mockRestore();
});
