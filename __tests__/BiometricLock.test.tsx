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
const globalWithDev = globalThis as unknown as { __DEV__: boolean };
const originalDev = globalWithDev.__DEV__;
let onAppStateChange: (state: AppStateStatus) => void;
let addEventListenerSpy: jest.SpyInstance;

const output = (renderer: ReactTestRenderer.ReactTestRenderer) =>
  JSON.stringify(renderer.toJSON());

async function renderLock(
  props: Partial<React.ComponentProps<typeof BiometricLock>> = {},
) {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(
      <AppThemeProvider>
        <BiometricLock enabledInDev {...props}>
          <Text>Private ledger</Text>
        </BiometricLock>
      </AppThemeProvider>,
    );
  });
  return renderer;
}

beforeEach(() => {
  jest.clearAllMocks();
  globalWithDev.__DEV__ = true;
  Object.defineProperty(AppState, 'currentState', {
    configurable: true,
    value: 'active',
  });
  addEventListenerSpy = jest
    .spyOn(AppState, 'addEventListener')
    .mockImplementation((_type, listener) => {
      onAppStateChange = listener as (state: AppStateStatus) => void;
      return { remove: jest.fn() };
    });
  canAuthenticateMock.mockResolvedValue(true);
});

afterEach(() => {
  globalWithDev.__DEV__ = originalDev;
  jest.restoreAllMocks();
});

describe('development builds', () => {
  test('skips the lock entirely in dev when enabledInDev is not set', async () => {
    let renderer!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <AppThemeProvider>
          <BiometricLock>
            <Text>Private ledger</Text>
          </BiometricLock>
        </AppThemeProvider>,
      );
    });

    expect(output(renderer)).toContain('Private ledger');
    expect(canAuthenticateMock).not.toHaveBeenCalled();
    expect(requestBioAuthMock).not.toHaveBeenCalled();
    expect(addEventListenerSpy).not.toHaveBeenCalled();
    await ReactTestRenderer.act(async () => renderer.unmount());
  });

  test('enabledInDev lets you preview the lock screen in dev', async () => {
    requestBioAuthMock.mockReturnValue(new Promise<boolean>(() => {}));
    const renderer = await renderLock();

    expect(output(renderer)).not.toContain('Private ledger');
    expect(output(renderer)).toContain('Pesa Ledger');
    expect(requestBioAuthMock).toHaveBeenCalledTimes(1);
    await ReactTestRenderer.act(async () => renderer.unmount());
  });
});

describe('release builds', () => {
  test('locks by default when __DEV__ is false', async () => {
    globalWithDev.__DEV__ = false;
    requestBioAuthMock.mockReturnValue(new Promise<boolean>(() => {}));

    let renderer!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <AppThemeProvider>
          <BiometricLock>
            <Text>Private ledger</Text>
          </BiometricLock>
        </AppThemeProvider>,
      );
    });

    expect(output(renderer)).not.toContain('Private ledger');
    expect(requestBioAuthMock).toHaveBeenCalledTimes(1);
    await ReactTestRenderer.act(async () => renderer.unmount());
  });
});

describe('locking behaviour', () => {
  test('keeps the ledger hidden until device authentication succeeds and locks on background', async () => {
    let finishAuthentication: (success: boolean) => void = () => {};
    requestBioAuthMock.mockImplementation(
      () =>
        new Promise<boolean>(resolve => {
          finishAuthentication = resolve;
        }),
    );

    const renderer = await renderLock();

    expect(output(renderer)).not.toContain('Private ledger');
    expect(requestBioAuthMock).toHaveBeenCalledWith(
      expect.objectContaining({
        allowDeviceCredentials: true,
      }),
    );

    await ReactTestRenderer.act(async () => finishAuthentication(true));
    expect(output(renderer)).toContain('Private ledger');

    await ReactTestRenderer.act(async () => onAppStateChange('background'));
    expect(output(renderer)).not.toContain('Private ledger');

    await ReactTestRenderer.act(async () => onAppStateChange('active'));
    expect(requestBioAuthMock).toHaveBeenCalledTimes(2);
    expect(output(renderer)).not.toContain('Private ledger');
    await ReactTestRenderer.act(async () => finishAuthentication(true));
    expect(output(renderer)).toContain('Private ledger');

    await ReactTestRenderer.act(async () => renderer.unmount());
  });

  test('stays locked when the phone has no configured authentication', async () => {
    canAuthenticateMock.mockResolvedValue(false);
    const renderer = await renderLock();

    expect(output(renderer)).not.toContain('Private ledger');
    expect(output(renderer)).toContain('Set up a fingerprint');
    expect(output(renderer)).toContain('Open phone settings');
    expect(requestBioAuthMock).not.toHaveBeenCalled();
    await ReactTestRenderer.act(async () => renderer.unmount());
  });

  test('shows a retry state when authentication is cancelled or fails', async () => {
    requestBioAuthMock.mockRejectedValue(new Error('user cancelled'));
    const renderer = await renderLock();

    expect(output(renderer)).not.toContain('Private ledger');
    expect(output(renderer)).toContain('Authentication cancelled or failed');
    expect(output(renderer)).toContain('Try again');
    expect(output(renderer)).not.toContain('Open phone settings');
    await ReactTestRenderer.act(async () => renderer.unmount());
  });

  test('stays locked without an error when the prompt returns false', async () => {
    requestBioAuthMock.mockResolvedValue(false);
    const renderer = await renderLock();

    expect(output(renderer)).not.toContain('Private ledger');
    expect(output(renderer)).not.toContain('Authentication cancelled');
    await ReactTestRenderer.act(async () => renderer.unmount());
  });

  test('shows a personalised greeting when userName is provided', async () => {
    requestBioAuthMock.mockReturnValue(new Promise<boolean>(() => {}));
    const renderer = await renderLock({ userName: 'Ian' });

    expect(output(renderer)).toContain('Welcome back, Ian');
    await ReactTestRenderer.act(async () => renderer.unmount());
  });

  test('lockAfterMs keeps the ledger open for short trips and locks after the grace period', async () => {
    requestBioAuthMock.mockResolvedValue(true);
    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(1_000_000);
    const renderer = await renderLock({ lockAfterMs: 30_000 });
    expect(output(renderer)).toContain('Private ledger');
    expect(requestBioAuthMock).toHaveBeenCalledTimes(1);

    // Quick trip to another app: still unlocked, no new prompt.
    await ReactTestRenderer.act(async () => onAppStateChange('background'));
    nowSpy.mockReturnValue(1_010_000);
    await ReactTestRenderer.act(async () => onAppStateChange('active'));
    expect(output(renderer)).toContain('Private ledger');
    expect(requestBioAuthMock).toHaveBeenCalledTimes(1);

    // Long absence: locks and asks again.
    requestBioAuthMock.mockReturnValue(new Promise<boolean>(() => {}));
    await ReactTestRenderer.act(async () => onAppStateChange('background'));
    nowSpy.mockReturnValue(1_100_000);
    await ReactTestRenderer.act(async () => onAppStateChange('active'));
    expect(output(renderer)).not.toContain('Private ledger');
    expect(requestBioAuthMock).toHaveBeenCalledTimes(2);

    await ReactTestRenderer.act(async () => renderer.unmount());
  });
});
