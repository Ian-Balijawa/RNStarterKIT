import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  form: { gap: 20 },
  field: { gap: 10 },
  choices: { flexDirection: 'row', width: '100%', gap: 8, alignItems: 'stretch' },
  choice: {
    flex: 1,
    minWidth: 0,
    minHeight: 48,
    paddingHorizontal: 6,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  link: { minHeight: 48, justifyContent: 'center', alignSelf: 'flex-start' },
  inline: { gap: 12 },
});
