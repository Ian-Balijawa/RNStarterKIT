import { View } from 'react-native';

export function TrashIcon({
  color,
  size = 22,
}: {
  color: string;
  size?: number;
}) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center' }}>
      <View
        style={{
          width: size * 0.36,
          height: size * 0.12,
          borderTopLeftRadius: 2,
          borderTopRightRadius: 2,
          backgroundColor: color,
        }}
      />
      <View
        style={{
          width: size * 0.86,
          height: 2,
          borderRadius: 1,
          backgroundColor: color,
        }}
      />
      <View
        style={{
          width: size * 0.64,
          height: size * 0.62,
          marginTop: 2,
          borderWidth: 2,
          borderColor: color,
          borderBottomLeftRadius: 4,
          borderBottomRightRadius: 4,
          flexDirection: 'row',
          justifyContent: 'space-evenly',
          paddingVertical: 2,
        }}>
        <View style={{ width: 2, backgroundColor: color }} />
        <View style={{ width: 2, backgroundColor: color }} />
      </View>
    </View>
  );
}
