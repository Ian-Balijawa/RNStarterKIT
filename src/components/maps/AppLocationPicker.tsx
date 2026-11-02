import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AppMapView,
  AppMapMarker,
  type AppCoordinate,
  KAMPALA_REGION,
} from './AppMapView';
import { AppText } from '../ui/AppText';
import { AppButton } from '../ui/AppButton';
import { useAppTheme } from '../../theme/theme';

export function AppCoordinateDisplay({
  coordinate,
}: {
  coordinate: AppCoordinate;
}) {
  return (
    <AppText variant="caption" selectable>
      {coordinate.latitude.toFixed(6)}, {coordinate.longitude.toFixed(6)}
    </AppText>
  );
}

/** Select a point by tapping the map. This does not request device location. */
export function AppLocationPicker({
  value,
  onChange,
  onConfirm,
  bottomOffset = 16,
}: {
  value?: AppCoordinate | null;
  onChange: (coordinate: AppCoordinate) => void;
  onConfirm?: (coordinate: AppCoordinate) => void;
  bottomOffset?: number;
}) {
  const selected = value || null;
  const { colors, radius } = useAppTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.container}>
      <AppMapView
        initialRegion={value ? { ...KAMPALA_REGION, ...value } : KAMPALA_REGION}
        onPress={event => onChange(event.nativeEvent.coordinate)}>
        {selected ? <AppMapMarker coordinate={selected} /> : null}
      </AppMapView>
      <View
        style={[
          styles.info,
          {
            backgroundColor: colors.surface,
            borderRadius: radius.md,
            bottom: insets.bottom + bottomOffset,
          },
        ]}>
        <AppText variant="label">Tap the map to choose a point</AppText>
        {selected ? <AppCoordinateDisplay coordinate={selected} /> : null}
        {onConfirm && selected ? (
          <AppButton
            title="Use this location"
            onPress={() => onConfirm(selected)}
          />
        ) : null}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1 },
  info: { position: 'absolute', left: 16, right: 16, padding: 12, gap: 8 },
});
