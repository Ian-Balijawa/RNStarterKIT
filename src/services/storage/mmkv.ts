import { createMMKV } from 'react-native-mmkv';
import { createStorage } from './storage';

// Create once per app process. Keep tokens and other secrets in platform secure storage.
const mmkv = createMMKV({ id: 'starterapp.preferences' });
export const preferences = createStorage(
  {
    getString: key => mmkv.getString(key),
    set: (key, value) => mmkv.set(key, value),
    delete: key => {
      mmkv.remove(key);
    },
  },
  'preferences',
);
