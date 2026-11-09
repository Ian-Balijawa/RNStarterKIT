import React, { useEffect, useState } from 'react';
import { BackHandler, StatusBar, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Svg, { Circle, Path } from 'react-native-svg';
import { AppThemeProvider, useAppTheme } from './src/theme/theme';
import { AppBottomSheetProvider } from './src/components/overlays/AppBottomSheetProvider';
import { AppErrorBoundary } from './src/components/feedback/AppErrorBoundary';
import {
  ContributionsProvider,
  useContributions,
} from './src/features/contributions/store';
import { DashboardScreen } from './src/features/contributions/DashboardScreen';
import { PaymentsScreen } from './src/features/contributions/PaymentsScreen';
import { ReportsScreen } from './src/features/contributions/ReportsScreen';
import {
  PeopleScreen,
  ChurchesScreen,
} from './src/features/contributions/PeopleScreens';
import {
  ContributionFlow,
  ContributionSheets,
  ProjectsScreen,
} from './src/features/contributions/ProjectScreens';
import { Church, Member } from './src/features/contributions/model';

const Tabs = createBottomTabNavigator();
function TabIcon({ name, color }: { name: string; color: string }) {
  return (
    <Svg
      width={23}
      height={23}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round">
      {name === 'Overview' ? (
        <>
          <Path d="M3 10.5 12 3l9 7.5V20H3z" />
          <Path d="M9 20v-6h6v6" />
        </>
      ) : null}
      {name === 'Projects' ? (
        <>
          <Path d="M3 7h18v13H3zM3 7l2-3h14l2 3M9 12h6" />
        </>
      ) : null}
      {name === 'Members' ? (
        <>
          <Circle cx={9} cy={8} r={3} />
          <Path d="M3 20v-2a6 6 0 0 1 12 0v2M16 5a3 3 0 0 1 0 6M17 14a5 5 0 0 1 4 5v1" />
        </>
      ) : null}
      {name === 'Payments' ? (
        <>
          <Path d="M3 7h18v12H3zM3 10h18M7 15h4" />
        </>
      ) : null}
      {name === 'Churches' ? (
        <>
          <Path d="M12 2v6M9 5h6M3 21h18M5 21V11l7-4 7 4v10M10 21v-5h4v5" />
        </>
      ) : null}
    </Svg>
  );
}
function Main() {
  const { colors, dark } = useAppTheme();
  const { data, setData } = useContributions();
  const [flow, setFlow] = useState<ContributionFlow>(null);
  const [showReports, setShowReports] = useState(false);
  useEffect(() => {
    if (!showReports) return;
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        setShowReports(false);
        return true;
      },
    );
    return () => subscription.remove();
  }, [showReports]);
  const addPledge = (memberId?: string, projectId?: string) =>
    setFlow({ kind: 'pledge', memberId, projectId });
  const addContribution = (memberId?: string, projectId?: string) =>
    setFlow({ kind: 'contribution', memberId, projectId });
  const saveMember = (member: Member) =>
    setData(current => ({
      ...current,
      members: current.members.some(item => item.id === member.id)
        ? current.members.map(item => (item.id === member.id ? member : item))
        : [...current.members, member],
    }));
  const saveChurch = (church: Church) =>
    setData(current => ({
      ...current,
      churches: current.churches.some(item => item.id === church.id)
        ? current.churches.map(item => (item.id === church.id ? church : item))
        : [...current.churches, church],
    }));
  const peopleProps = {
    data,
    onSaveMember: saveMember,
    onSaveChurch: saveChurch,
    onAddPledge: addPledge,
    onAddContribution: addContribution,
  };
  return (
    <NavigationContainer
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
      <StatusBar barStyle={dark ? 'light-content' : 'dark-content'} />
      <Tabs.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.muted,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
          },
          tabBarIcon: ({ color }) => (
            <TabIcon name={route.name} color={color} />
          ),
        })}>
        <Tabs.Screen name="Overview">
          {({ navigation }) => (
            <DashboardScreen
              data={data}
              onContribution={() => addContribution()}
              onProjects={() => navigation.navigate('Projects')}
            />
          )}
        </Tabs.Screen>
        <Tabs.Screen name="Projects">
          {() => (
            <ProjectsScreen
              data={data}
              onChange={setData}
              onAddPledge={addPledge}
              onAddContribution={addContribution}
            />
          )}
        </Tabs.Screen>
        <Tabs.Screen name="Members">
          {() => <PeopleScreen {...peopleProps} />}
        </Tabs.Screen>
        <Tabs.Screen name="Payments">
          {() =>
            showReports ? (
              <ReportsScreen data={data} onBack={() => setShowReports(false)} />
            ) : (
              <PaymentsScreen
                data={data}
                onReports={() => setShowReports(true)}
                onAddContribution={() => addContribution()}
                onVoid={(id, reason) =>
                  setData(current => ({
                    ...current,
                    contributions: current.contributions.map(item =>
                      item.id === id && !item.voidedAt
                        ? {
                            ...item,
                            voidedAt: new Date().toISOString(),
                            voidReason: reason,
                          }
                        : item,
                    ),
                  }))
                }
              />
            )
          }
        </Tabs.Screen>
        <Tabs.Screen name="Churches">
          {() => <ChurchesScreen {...peopleProps} />}
        </Tabs.Screen>
      </Tabs.Navigator>
      <ContributionSheets
        data={data}
        onChange={setData}
        flow={flow}
        onDismiss={() => setFlow(null)}
      />
    </NavigationContainer>
  );
}
export default function App() {
  return (
    <GestureHandlerRootView style={styles.fill}>
      <SafeAreaProvider>
        <AppThemeProvider>
          <AppErrorBoundary>
            <AppBottomSheetProvider>
              <ContributionsProvider>
                <Main />
              </ContributionsProvider>
            </AppBottomSheetProvider>
          </AppErrorBoundary>
        </AppThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
const styles = StyleSheet.create({ fill: { flex: 1 } });
