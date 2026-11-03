import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppThemeProvider } from './src/theme/theme';
import { AppErrorBoundary } from './src/components/feedback/AppErrorBoundary';
import { LedgerApp } from './src/features/ledger/LedgerApp';
import { BiometricLock } from './src/components/security/BiometricLock';
import { AppBottomSheetProvider } from './src/components/overlays/AppBottomSheetProvider';

export default function App() {
  return (
    <GestureHandlerRootView style={styles.fill}>
      <SafeAreaProvider>
        <AppThemeProvider>
          <AppErrorBoundary>
            <AppBottomSheetProvider>
              <BiometricLock>
                <LedgerApp />
              </BiometricLock>
            </AppBottomSheetProvider>
          </AppErrorBoundary>
        </AppThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({ fill: { flex: 1 } });
