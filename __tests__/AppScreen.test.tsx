import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { Animated } from 'react-native';
import { AppScreen } from '../src/components/layout/AppScreen';
import { AppText } from '../src/components/ui/AppText';
import { AppThemeProvider } from '../src/theme/theme';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

test('reveals the compact header after the expanded header scrolls away', async () => {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(
      <AppThemeProvider>
        <AppScreen
          scroll
          collapseThreshold={100}
          collapsedHeader={<AppText>Balance</AppText>}>
          <AppText>Full header and content</AppText>
        </AppScreen>
      </AppThemeProvider>,
    );
  });

  const compactHeader = () =>
    renderer.root.find(
      node =>
        node.props.importantForAccessibility === 'no-hide-descendants' ||
        node.props.importantForAccessibility === 'auto',
    );
  expect(compactHeader().props.importantForAccessibility).toBe(
    'no-hide-descendants',
  );

  const scroll = renderer.root.find(
    node => typeof node.props.onScroll === 'function',
  );
  await ReactTestRenderer.act(() => {
    scroll.props.onScroll({ nativeEvent: { contentOffset: { y: 120 } } });
  });
  expect(compactHeader().props.importantForAccessibility).toBe('auto');
});

test('supports the same compact header with a virtualized scroll surface', async () => {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(
      <AppThemeProvider>
        <AppScreen
          collapseThreshold={100}
          collapsedHeader={<AppText>Activity totals</AppText>}
          renderScrollable={onScroll => (
            <Animated.ScrollView onScroll={onScroll}>
              <AppText>Activity list</AppText>
            </Animated.ScrollView>
          )}
        />
      </AppThemeProvider>,
    );
  });

  const compactHeader = () =>
    renderer.root.find(
      node =>
        node.props.importantForAccessibility === 'no-hide-descendants' ||
        node.props.importantForAccessibility === 'auto',
    );
  expect(compactHeader().props.importantForAccessibility).toBe(
    'no-hide-descendants',
  );
  await ReactTestRenderer.act(() => {
    renderer.root
      .find(node => typeof node.props.onScroll === 'function')
      .props.onScroll({ nativeEvent: { contentOffset: { y: 120 } } });
  });
  expect(compactHeader().props.importantForAccessibility).toBe('auto');
});
