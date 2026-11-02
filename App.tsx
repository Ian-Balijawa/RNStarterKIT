import React, { useState } from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { useNavigation, type NavigationProp } from '@react-navigation/native';
import { AppThemeProvider, useAppTheme, useThemeMode } from './src/theme/theme';
import {
  AppToastProvider,
  useAppToast,
} from './src/components/overlays/AppToast';
import {
  RootNavigator,
  HomeProps,
  DetailsProps,
  SignInProps,
  type RootStackParams,
} from './src/app/navigation/RootNavigator';
import { AppTabs } from './src/app/navigation/AppTabs';
import { AppScreen } from './src/components/layout/AppScreen';
import { AppText } from './src/components/ui/AppText';
import { AppButton } from './src/components/ui/AppButton';
import { AppCard } from './src/components/ui/AppCard';
import { AppBadge } from './src/components/ui/AppBadge';
import { AppSelect } from './src/components/forms/AppSelect';
import { AppDialog } from './src/components/overlays/AppDialog';
import { AppErrorBoundary } from './src/components/feedback/AppErrorBoundary';
import { AppEmptyState } from './src/components/feedback/AppStates';
import {
  AppBottomSheetProvider,
  useAppBottomSheet,
} from './src/components/overlays/AppBottomSheetProvider';
import { AppFloatingActionButton } from './src/components/ui/AppFloatingActionButton';
import { AppLocationPicker } from './src/components/maps/AppLocationPicker';
import { mapsReady } from './src/app/config/maps';
import type { AppCoordinate } from './src/components/maps/AppMapView';
import { ControlledTextField } from './src/components/forms/ControlledTextField';
import { AppSubmitButton } from './src/components/forms/AppSubmitButton';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const exampleSchema = z.object({
  name: z.string().trim().min(2, 'Enter at least two characters'),
});
const quickActionSnapPoints = ['40%', '75%'];

function StarterHome() {
  const navigation = useNavigation<NavigationProp<RootStackParams>>();
  const { mode, setMode } = useThemeMode();
  const { showToast } = useAppToast();
  const { showSheet, hideSheet } = useAppBottomSheet();
  const { control, handleSubmit } = useForm<z.infer<typeof exampleSchema>>({
    resolver: zodResolver(exampleSchema),
    defaultValues: { name: '' },
  });
  const [category, setCategory] = useState<string | string[] | null>(null);
  const [dialog, setDialog] = useState(false);
  const openQuickActions = () =>
    showSheet({
      title: 'Quick actions',
      snapPoints: quickActionSnapPoints,
      scrollable: true,
      children: (
        <>
          <AppText muted>Choose an action to continue.</AppText>
          <AppButton
            title="Open details"
            onPress={() => {
              hideSheet();
              navigation.navigate('Details', { title: 'Details' });
            }}
          />
          <AppButton title="Close" variant="ghost" onPress={hideSheet} />
        </>
      ),
    });
  return (
    <View style={styles.fill}>
      <AppScreen scroll keyboardAware contentBottomPadding={150}>
        <View style={styles.heading}>
          <AppText variant="display">Starter app</AppText>
          <AppBadge label="Ready to build" tone="success" />
        </View>
        <AppText muted>
          A reusable React Native foundation for your next project.
        </AppText>
        <AppCard>
          <AppText variant="heading">Forms</AppText>
          <ControlledTextField
            control={control}
            name="name"
            label="Your name"
            placeholder="Enter a name"
            clearable
          />
          <AppSelect
            label="Project type"
            options={[
              { label: 'Business', value: 'business' },
              { label: 'Personal', value: 'personal' },
              { label: 'Other', value: 'other' },
            ]}
            value={category}
            onChange={setCategory}
          />
          <AppSubmitButton
            title="Try validation"
            onSubmit={handleSubmit(data =>
              showToast({ message: `Hello, ${data.name}!`, tone: 'success' }),
            )}
          />
        </AppCard>
        <AppCard>
          <AppText variant="heading">Interactions</AppText>
          <View style={styles.actions}>
            <AppButton
              title="Open details"
              variant="outline"
              onPress={() =>
                navigation.navigate('Details', { title: 'Details' })
              }
            />
            <AppButton
              title="Confirm"
              variant="secondary"
              onPress={() => setDialog(true)}
            />
            <AppButton
              title="Open sheet"
              variant="outline"
              onPress={openQuickActions}
            />
          </View>
        </AppCard>
        <AppCard>
          <AppText variant="heading">Appearance</AppText>
          <AppText muted>Current mode: {mode}</AppText>
          <View style={styles.actions}>
            <AppButton
              title="System"
              variant={mode === 'system' ? 'primary' : 'outline'}
              onPress={() => setMode('system')}
            />
            <AppButton
              title="Light"
              variant={mode === 'light' ? 'primary' : 'outline'}
              onPress={() => setMode('light')}
            />
            <AppButton
              title="Dark"
              variant={mode === 'dark' ? 'primary' : 'outline'}
              onPress={() => setMode('dark')}
            />
          </View>
        </AppCard>
        <AppDialog
          visible={dialog}
          title="Everything is connected"
          message="Dialogs, toasts, forms, and theme tokens are ready to reuse."
          onCancel={() => setDialog(false)}
          onConfirm={() => {
            setDialog(false);
            showToast({ message: 'Confirmed', tone: 'success' });
          }}
        />
      </AppScreen>
      <AppFloatingActionButton
        icon="check"
        // label="New item"
        bottomOffset={100}
        onPress={openQuickActions}
      />
    </View>
  );
}
function StarterUpdates() {
  return (
    <AppScreen>
      <AppEmptyState
        title="Updates"
        message="This tab is ready for activity and announcements."
      />
    </AppScreen>
  );
}
function StarterCommunities() {
  return (
    <AppScreen>
      <AppEmptyState
        title="Communities"
        message="Use this tab for groups and collaboration."
      />
    </AppScreen>
  );
}
function StarterMaps() {
  const [point, setPoint] = useState<AppCoordinate | null>(null);
  if (!mapsReady) {
    return (
      <AppScreen>
        <AppEmptyState
          title="Maps are ready to configure"
          message="Add Google Maps API keys for Android and iOS to enable this preview."
        />
      </AppScreen>
    );
  }
  return (
    <View style={styles.fill}>
      <AppLocationPicker value={point} onChange={setPoint} bottomOffset={72} />
    </View>
  );
}
function StarterTabs(_props: HomeProps) {
  return (
    <AppTabs
      Chats={StarterHome}
      Updates={StarterUpdates}
      Communities={StarterCommunities}
      Maps={StarterMaps}
    />
  );
}
function StarterDetails(_props: DetailsProps) {
  return (
    <AppScreen safeTop={false}>
      <AppText variant="heading">Details screen</AppText>
      <AppText muted>Replace this screen with your product content.</AppText>
    </AppScreen>
  );
}
function StarterSignIn(_props: SignInProps) {
  return (
    <AppScreen>
      <AppText variant="heading">Sign in</AppText>
      <AppText muted>Connect your authentication provider here.</AppText>
    </AppScreen>
  );
}
function AppContent() {
  const { dark } = useAppTheme();
  return (
    <>
      <StatusBar barStyle={dark ? 'light-content' : 'dark-content'} />
      <AppToastProvider>
        <BottomSheetModalProvider>
          <AppBottomSheetProvider>
            <RootNavigator
              authenticated
              Home={StarterTabs}
              Details={StarterDetails}
              SignIn={StarterSignIn}
            />
          </AppBottomSheetProvider>
        </BottomSheetModalProvider>
      </AppToastProvider>
    </>
  );
}
export default function App() {
  return (
    <GestureHandlerRootView style={styles.fill}>
      <SafeAreaProvider>
        <AppThemeProvider>
          <AppErrorBoundary>
            <AppContent />
          </AppErrorBoundary>
        </AppThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
const styles = StyleSheet.create({
  fill: { flex: 1 },
  heading: { gap: 8, alignItems: 'flex-start' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
