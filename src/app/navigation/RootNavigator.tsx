import React from 'react';
import {
  NavigationContainer,
  createNavigationContainerRef,
} from '@react-navigation/native';
import {
  createNativeStackNavigator,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { useAppTheme } from '../../theme/theme';

export type RootStackParams = {
  Home: undefined;
  Details: { title: string };
  SignIn: undefined;
};
export type HomeProps = NativeStackScreenProps<RootStackParams, 'Home'>;
export type DetailsProps = NativeStackScreenProps<RootStackParams, 'Details'>;
export type SignInProps = NativeStackScreenProps<RootStackParams, 'SignIn'>;
export const navigationRef = createNavigationContainerRef<RootStackParams>();
const Stack = createNativeStackNavigator<RootStackParams>();

export function RootNavigator({
  authenticated,
  Home,
  Details,
  SignIn,
}: {
  authenticated: boolean;
  Home: React.ComponentType<HomeProps>;
  Details: React.ComponentType<DetailsProps>;
  SignIn: React.ComponentType<SignInProps>;
}) {
  const { colors, dark } = useAppTheme();
  return (
    <NavigationContainer
      ref={navigationRef}
      theme={{
        dark,
        colors: {
          primary: colors.primary,
          background: colors.background,
          card: colors.surface,
          text: colors.text,
          border: colors.border,
          notification: colors.danger,
        },
        fonts: {
          regular: { fontFamily: 'System', fontWeight: '400' },
          medium: { fontFamily: 'System', fontWeight: '500' },
          bold: { fontFamily: 'System', fontWeight: '700' },
          heavy: { fontFamily: 'System', fontWeight: '900' },
        },
      }}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
          contentStyle: { backgroundColor: colors.background },
        }}>
        {authenticated ? (
          <Stack.Group navigationKey="app">
            <Stack.Screen
              name="Home"
              component={Home}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Details"
              component={Details}
              options={({ route }) => ({ title: route.params.title })}
            />
          </Stack.Group>
        ) : (
          <Stack.Group navigationKey="auth">
            <Stack.Screen
              name="SignIn"
              component={SignIn}
              options={{ headerShown: false }}
            />
          </Stack.Group>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
