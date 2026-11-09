import React from 'react'
import { Animated } from 'react-native'
import TestRenderer, { act } from 'react-test-renderer'
import { PaymentsScreen } from './PaymentsScreen'
import { ReportsScreen } from './ReportsScreen'
import { EMPTY_DATA } from './model'

jest.mock('../../components/layout/AppScreen', () => {
  const ReactModule = require('react')
  const { Animated: RNAnimated, Text: RNText } = require('react-native')
  return {
    AppScreen: ({
      renderScrollable,
    }: {
      renderScrollable: (
        event: unknown,
        header: React.ReactNode,
        height: number,
      ) => React.ReactNode
    }) => {
      const scroll = RNAnimated.event(
        [{ nativeEvent: { contentOffset: { y: new RNAnimated.Value(0) } } }],
        { useNativeDriver: true },
      )
      return renderScrollable(
        scroll,
        ReactModule.createElement(RNText, null, 'Header'),
        400,
      )
    },
  }
})
jest.mock('../../components/overlays/AppBottomSheet', () => ({
  AppBottomSheet: () => null,
}))
jest.mock('../../components/forms/SheetField', () => ({
  SheetField: () => null,
}))
jest.mock('../../components/ui/AppButton', () => ({ AppButton: () => null }))
jest.mock('../../components/ui/AppChip', () => ({ AppChip: () => null }))
jest.mock('../../components/ui/AppCard', () => ({
  AppCard: ({ children }: { children: React.ReactNode }) =>
    require('react').createElement(
      require('react-native').View,
      null,
      children,
    ),
}))
jest.mock('../../components/ui/AppText', () => ({
  AppText: ({ children }: { children: React.ReactNode }) =>
    require('react').createElement(
      require('react-native').Text,
      null,
      children,
    ),
}))
jest.mock('../../theme/theme', () => ({
  useAppTheme: () => ({
    colors: {
      surface: '#fff',
      primary: '#000',
      border: '#ddd',
      danger: '#f00',
      text: '#000',
    },
    radius: { md: 12 },
  }),
}))

test.each([
  [
    'payments',
    <PaymentsScreen
      data={EMPTY_DATA}
      onAddContribution={() => {}}
      onReports={() => {}}
      onVoid={() => {}}
    />,
  ],
  ['reports', <ReportsScreen data={EMPTY_DATA} onBack={() => {}} />],
])('%s list accepts a native animated scroll event', async (_name, screen) => {
  let tree: TestRenderer.ReactTestRenderer | undefined
  await act(async () => {
    tree = TestRenderer.create(screen)
  })
  expect(tree?.root.findAllByType(Animated.FlatList)).toHaveLength(1)
  await act(async () => {
    tree?.unmount()
  })
})
