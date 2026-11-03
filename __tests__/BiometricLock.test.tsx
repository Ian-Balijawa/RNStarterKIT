import React from 'react';
import { AppState, AppStateStatus, Text } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import Biometrics from 'react-native-simple-biometrics';
import { BiometricLock } from '../src/components/security/BiometricLock';
import { AppThemeProvider } from '../src/theme/theme';

jest.mock('react-native-simple-biometrics', () => ({
  __esModule: true,
  default: {
    canAuthenticate: jest.fn(),
    requestBioAuth: jest.fn(),
  },
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

const canAuthenticateMock = Biometrics.canAuthenticate as jest.Mock;
const requestBioAuthMock = Biometrics.requestBioAuth as jest.Mock;
let onAppStateChange: (state: AppStateStatus) => void;

beforeEach(() => {
  jest.clearAllMocks();
  Object.defineProperty(AppState, 'currentState', { configurable: true, value: 'active' });
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, listener) => {
    onAppStateChange = listener as (state: AppStateStatus) => void;
    return { remove: jest.fn() };
  });
  canAuthenticateMock.mockResolvedValue(true);
});

afterEach(() => {
  jest.restoreAllMocks();
});

test('keeps the ledger hidden until device authentication succeeds and locks on background', async () => {
  let finishAuthentication: (success: boolean) => void = () => {};
  requestBioAuthMock.mockImplementation(() => new Promise<boolean>(resolve => {
    finishAuthentication = resolve;
  }));

  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(
      <AppThemeProvider>
        <BiometricLock><Text>Private ledger</Text></BiometricLock>
      </AppThemeProvider>,
    );
  });

  expect(JSON.stringify(renderer.toJSON())).not.toContain('Private ledger');
  expect(requestBioAuthMock).toHaveBeenCalledWith(expect.objectContaining({
    allowDeviceCredentials: true,
  }));

  await ReactTestRenderer.act(async () => finishAuthentication(true));
  expect(JSON.stringify(renderer.toJSON())).toContain('Private ledger');

  await ReactTestRenderer.act(async () => onAppStateChange('background'));
  expect(JSON.stringify(renderer.toJSON())).not.toContain('Private ledger');

  await ReactTestRenderer.act(async () => onAppStateChange('active'));
  expect(requestBioAuthMock).toHaveBeenCalledTimes(2);
  expect(JSON.stringify(renderer.toJSON())).not.toContain('Private ledger');
  await ReactTestRenderer.act(async () => finishAuthentication(true));
  expect(JSON.stringify(renderer.toJSON())).toContain('Private ledger');

  await ReactTestRenderer.act(async () => renderer.unmount());
});

test('stays locked when the phone has no configured authentication', async () => {
  canAuthenticateMock.mockResolvedValue(false);
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(
      <AppThemeProvider>
        <BiometricLock><Text>Private ledger</Text></BiometricLock>
      </AppThemeProvider>,
    );
  });

  expect(JSON.stringify(renderer.toJSON())).not.toContain('Private ledger');
  expect(JSON.stringify(renderer.toJSON())).toContain('Set up a fingerprint');
  expect(requestBioAuthMock).not.toHaveBeenCalled();
  await ReactTestRenderer.act(async () => renderer.unmount());
});
