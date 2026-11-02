import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { AppTextInput } from './AppTextInput';
import { useAppTheme } from '../../theme/theme';
export function AppSearchBar({
  value,
  onSearch,
  delay = 300,
  loading,
  placeholder = 'Search',
}: {
  value?: string;
  onSearch: (query: string) => void;
  delay?: number;
  loading?: boolean;
  placeholder?: string;
}) {
  const [query, setQuery] = useState(value ?? '');
  const { colors } = useAppTheme();
  useEffect(() => {
    setQuery(value ?? '');
  }, [value]);
  useEffect(() => {
    const timeout = setTimeout(() => onSearch(query), delay);
    return () => clearTimeout(timeout);
  }, [query, delay, onSearch]);
  return (
    <View>
      <AppTextInput
        value={query}
        onChangeText={setQuery}
        prefixIcon="search"
        clearable
        placeholder={placeholder}
        accessibilityLabel="Search"
      />
      {loading ? (
        <ActivityIndicator color={colors.primary} style={styles.loading} />
      ) : null}
    </View>
  );
}
const styles = StyleSheet.create({
  loading: { position: 'absolute', right: 42, top: 14 },
});
