import React from 'react'
import { Animated } from 'react-native'
import TestRenderer, { act } from 'react-test-renderer'
import { AppScreen } from './AppScreen'

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 24, bottom: 0, left: 0, right: 0 }),
}))
jest.mock('../../theme/theme', () => ({
  spacing: { xs: 4, sm: 8, lg: 16 },
  useAppTheme: () => ({
    colors: {
      background: '#fff',
      border: '#ddd',
      primary: '#000',
      text: '#000',
      muted: '#666',
    },
    spacing: { xs: 4, sm: 8, lg: 16 },
  }),
}))

test('keeps the compact heading below the safe area and switches it on scroll', async () => {
  let tree: TestRenderer.ReactTestRenderer
  await act(async () => {
    tree = TestRenderer.create(<AppScreen scroll title="Members" />)
  })
  const headers = () => tree!.root.findAllByType(Animated.View)
  expect(headers()).toHaveLength(2)
  expect(headers()[1].props.accessibilityElementsHidden).toBe(true)
  expect(
    headers()[1]
      .props.style.flat()
      .some((style: { top?: number }) => style?.top === 24),
  ).toBe(true)
  const scroll = tree!.root.findByType(Animated.ScrollView)
  await act(async () => {
    const event = scroll.props.onScroll
    const handler = typeof event === 'function' ? event : event.__getHandler()
    handler({ nativeEvent: { contentOffset: { y: 80 } } })
  })
  expect(headers()[0].props.accessibilityElementsHidden).toBe(true)
  expect(headers()[1].props.accessibilityElementsHidden).toBe(false)
  await act(async () => {
    tree!.unmount()
  })
})
