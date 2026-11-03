import React from 'react';
import { View } from 'react-native';
import { AppButton } from '../../../components/ui/AppButton';
import { AppText } from '../../../components/ui/AppText';
import { dateLabel, timeLabel } from '../format';
import { Schedule, formatUGX } from '../model';
import { styles } from '../styles';

type Props = {
  item: Schedule;
  onRecord: () => void;
  onDelete: () => void;
};

export function ScheduleDetail({ item, onRecord, onDelete }: Props) {
  return (
    <View style={styles.detail}>
      <AppText variant="display">{formatUGX(item.amount)}</AppText>
      <AppText muted>
        {item.kind} · {item.recurrence} · next {dateLabel(item.nextAt)} at{' '}
        {timeLabel(item.nextAt)}
      </AppText>
      {item.note ? <AppText>{item.note}</AppText> : null}
      <AppButton title="Record this transaction now" onPress={onRecord} />
      <AppButton title="Delete schedule" variant="danger" onPress={onDelete} />
    </View>
  );
}
