import React, { forwardRef } from 'react';
import { StyleSheet } from 'react-native';
import MapView, {
  Marker,
  Polyline,
  PROVIDER_GOOGLE,
  type LatLng,
  type MapMarkerProps,
  type MapPolylineProps,
  type MapViewProps,
  type Region,
} from 'react-native-maps';

export const KAMPALA_REGION: Region = {
  latitude: 0.3476,
  longitude: 32.5825,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

/** Google Maps on Android and iOS. The parent must give this view a height. */
export const AppMapView = forwardRef<MapView, Omit<MapViewProps, 'provider'>>(
  function GoogleMapView(
    { initialRegion = KAMPALA_REGION, style, showsCompass = true, ...props },
    ref,
  ) {
    return (
      <MapView
        {...props}
        ref={ref}
        provider={PROVIDER_GOOGLE}
        initialRegion={initialRegion}
        showsCompass={showsCompass}
        style={[styles.map, style]}
      />
    );
  },
);

export function AppMapMarker(props: MapMarkerProps) {
  return <Marker {...props} />;
}
export function AppMapRoute(props: MapPolylineProps) {
  return <Polyline {...props} />;
}
export type AppCoordinate = LatLng;

const styles = StyleSheet.create({ map: { flex: 1 } });
