import React from 'react';
import { Pressable, View } from 'react-native';
import { AppText } from '../../../components/ui/AppText';
import { useAppTheme } from '../../../theme/theme';
import { LedgerIcon } from '../LedgerIcon';
import { NAV, Tab } from '../navigation';
import { styles } from '../styles';

export function LedgerTabBar({
  tab,
  onSelectTab,
  bottomInset,
}: {
  tab: Tab;
  onSelectTab: (tab: Tab) => void;
  bottomInset: number;
}) {
  const { colors } = useAppTheme();
  return (
    <View
      style={[
        styles.nav,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          paddingBottom: Math.max(bottomInset, 8),
        },
      ]}>
      {NAV.map(item => (
        <Pressable
          key={item.id}
          accessibilityRole="tab"
          accessibilityState={{ selected: tab === item.id }}
          onPress={() => onSelectTab(item.id)}
          style={({ pressed }) => [
            styles.navItem,
            { opacity: pressed ? 0.6 : 1 },
          ]}>
          <LedgerIcon
            name={item.icon}
            color={tab === item.id ? colors.primary : colors.muted}
            size={21}
          />
          <AppText
            style={[
              styles.navLabel,
              tab === item.id && styles.navLabelSelected,
              { color: tab === item.id ? colors.primary : colors.muted },
            ]}
            numberOfLines={1}>
            {item.label}
          </AppText>
        </Pressable>
      ))}
    </View>
  );
}
