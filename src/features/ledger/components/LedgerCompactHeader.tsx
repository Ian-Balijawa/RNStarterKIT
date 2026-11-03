import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../../../components/ui/AppText';
import { useAppTheme } from '../../../theme/theme';

type Props = {
  title: string;
  summary: string;
  detail?: string;
};

export function LedgerCompactHeader({ title, summary, detail }: Props) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.root}>
      <AppText variant="heading" numberOfLines={1} style={styles.title}>
        {title}
      </AppText>
      <View style={styles.stats}>
        <AppText
          variant="label"
          numberOfLines={1}
          adjustsFontSizeToFit
          style={{ color: colors.primary }}>
          {summary}
        </AppText>
        {detail ? (
          <AppText
            variant="caption"
            muted
            numberOfLines={1}
            adjustsFontSizeToFit>
            {detail}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: { flex: 1, minWidth: 0, fontSize: 18 },
  stats: { maxWidth: '67%', alignItems: 'flex-end', gap: 2 },
});
