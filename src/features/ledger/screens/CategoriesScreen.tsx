import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { AppButton } from '../../../components/ui/AppButton';
import { AppText } from '../../../components/ui/AppText';
import { useAppTheme } from '../../../theme/theme';
import { LedgerState } from '../model';
import { Dialog } from '../navigation';
import { Surface } from '../components/Surface';
import { SectionTitle } from '../components/SectionTitle';
import { styles } from '../styles';

type Props = {
  header: React.ReactNode;
  ledger: LedgerState;
  onOpenDialog: (dialog: Dialog) => void;
};

export function CategoriesScreen({ header, ledger, onOpenDialog }: Props) {
  const { colors } = useAppTheme();
  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}>
      {header}
      <AppText muted>
        Organise every transaction in a category, then use subcategories for the
        exact thing you bought or earned.
      </AppText>
      <AppButton
        title="Add category"
        onPress={() => onOpenDialog({ kind: 'category' })}
      />
      {(['expense', 'income'] as const).map(kind => (
        <View key={kind} style={styles.categoryGroup}>
          <SectionTitle
            title={
              kind === 'expense' ? 'Expense categories' : 'Income categories'
            }
          />
          {ledger.categories
            .filter(item => item.kind === kind)
            .map(category => (
              <Surface key={category.id}>
                <View style={styles.categoryHeading}>
                  <AppText variant="label" style={styles.cardTitle}>
                    {category.name}
                  </AppText>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() =>
                      onOpenDialog({ kind: 'subcategory', item: category })
                    }
                    style={styles.addSubButton}>
                    <AppText variant="label" style={{ color: colors.primary }}>
                      + Add
                    </AppText>
                  </Pressable>
                </View>
                <View style={styles.subcategories}>
                  {category.subcategories.length ? (
                    category.subcategories.map(sub => (
                      <View
                        key={sub}
                        style={[
                          styles.subcategoryPill,
                          {
                            backgroundColor: colors.background,
                            borderColor: colors.border,
                          },
                        ]}>
                        <AppText variant="caption">{sub}</AppText>
                      </View>
                    ))
                  ) : (
                    <AppText muted variant="caption">
                      No subcategories yet
                    </AppText>
                  )}
                </View>
              </Surface>
            ))}
        </View>
      ))}
    </ScrollView>
  );
}
