import React from 'react';
import { Platform } from 'react-native';
import { createNativeBottomTabNavigator } from '@react-navigation/bottom-tabs/unstable';
import { useAppTheme } from '../../theme/theme';

export type AppTabParams = {
  Chats: undefined;
  Updates: undefined;
  Communities: undefined;
  Maps: undefined;
};
const Tab = createNativeBottomTabNavigator<AppTabParams>();

type TabsProps = {
  Chats: React.ComponentType;
  Updates: React.ComponentType;
  Communities: React.ComponentType;
  Maps: React.ComponentType;
  unreadChats?: number;
  unreadUpdates?: number;
};

/** Four native tabs with labels, icons, and optional unread badges. */
export function AppTabs({
  Chats,
  Updates,
  Communities,
  Maps,
  unreadChats = 0,
  unreadUpdates = 0,
}: TabsProps) {
  const { colors } = useAppTheme();
  return (
    <Tab.Navigator
      backBehavior="firstRoute"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarActiveIndicatorColor: `${colors.primary}22`,
        tabBarLabelVisibilityMode: 'labeled',
        tabBarStyle: { backgroundColor: colors.surface },
      }}>
      <Tab.Screen
        name="Chats"
        component={Chats}
        options={{
          tabBarIcon: Platform.select({
            ios: { type: 'sfSymbol', name: 'message' },
            android: {
              type: 'image',
              source: require('../../assets/tab_chats.png'),
            },
          }),
          tabBarBadge: unreadChats || undefined,
        }}
      />
      <Tab.Screen
        name="Updates"
        component={Updates}
        options={{
          tabBarIcon: Platform.select({
            ios: { type: 'sfSymbol', name: 'bell' },
            android: {
              type: 'image',
              source: require('../../assets/tab_updates.png'),
            },
          }),
          tabBarBadge: unreadUpdates || undefined,
        }}
      />
      <Tab.Screen
        name="Communities"
        component={Communities}
        options={{
          tabBarIcon: Platform.select({
            ios: { type: 'sfSymbol', name: 'person.3' },
            android: {
              type: 'image',
              source: require('../../assets/tab_communities.png'),
            },
          }),
        }}
      />
      <Tab.Screen
        name="Maps"
        component={Maps}
        options={{
          tabBarIcon: Platform.select({
            ios: { type: 'sfSymbol', name: 'map' },
            android: {
              type: 'image',
              source: require('../../assets/tab_maps.png'),
            },
          }),
        }}
      />
    </Tab.Navigator>
  );
}
