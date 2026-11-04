import React from 'react';
import { View } from 'react-native';
import { AppButton } from '../../../components/ui/AppButton';
import { AppText } from '../../../components/ui/AppText';
import { dateLabel, timeLabel } from '../format';
import { Schedule, formatUGX } from '../model';
import { styles } from '../styles';
import { Surface } from './Surface';

type Props = {
  item: Schedule;
  onRecord: () => void;
};

const capitalize = (value: string) =>
  value.charAt(0).toUpperCase() + value.slice(1);

export function ScheduleDetail({ item, onRecord }: Props) {
  return (
    <View style={styles.detail}>
      <AppText variant="display">{formatUGX(item.amount)}</AppText>
      <AppText muted>
        {capitalize(item.kind)} · Repeats {item.recurrence}
      </AppText>
      <Surface>
        <AppText variant="label">Next</AppText>
        <AppText>
          {dateLabel(item.nextAt)} at {timeLabel(item.nextAt)}
        </AppText>
        {item.note ? (
          <>
            <AppText variant="label">Note</AppText>
            <AppText>{item.note}</AppText>
          </>
        ) : null}
      </Surface>
      <AppButton title="Record this transaction now" onPress={onRecord} />
    </View>
  );
}
