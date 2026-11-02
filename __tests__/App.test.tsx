/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

jest.mock('react-native-gesture-handler', () => ({
  GestureHandlerRootView: require('react-native').View,
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

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});
