import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  form: { gap: 20, paddingBottom: 24 },
  field: { gap: 10 },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: {
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 12,
    justifyContent: 'center',
  },
  link: { minHeight: 48, justifyContent: 'center', alignSelf: 'flex-start' },
  inline: { gap: 12 },
});
