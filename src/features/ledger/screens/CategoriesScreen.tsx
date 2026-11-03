import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppScreen } from '../../../components/layout/AppScreen';
import { AppSelect } from '../../../components/forms/AppSelect';
import { AppText } from '../../../components/ui/AppText';
import { useAppTheme } from '../../../theme/theme';
import { LedgerState } from '../model';
import { Dialog } from '../navigation';
import { ChoiceRow } from '../forms/ChoiceRow';
import { LedgerIcon } from '../LedgerIcon';
import { Surface } from '../components/Surface';
import { EmptyNote } from '../components/EmptyNote';
import { LedgerCompactHeader } from '../components/LedgerCompactHeader';
import {
  LedgerFloatingAction,
  LedgerFloatingActions,
} from '../components/LedgerFloatingActions';
import { styles } from '../styles';

type Props = {
  header: React.ReactNode;
  ledger: LedgerState;
  onOpenDialog: (dialog: Dialog) => void;
  showFloatingActions?: boolean;
};

type CategoryKind = 'expense' | 'income';

export function CategoriesScreen({ header, ledger, onOpenDialog, showFloatingActions = true }: Props) {
  const { colors } = useAppTheme();
  const [kind, setKind] = useState<CategoryKind>('expense');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const previousCategoryIds = useRef(
    new Set(ledger.categories.map(item => item.id)),
  );
  useEffect(() => {
    const added = ledger.categories.filter(
      item => !previousCategoryIds.current.has(item.id),
    );
    const newest = added[added.length - 1];
    if (newest) {
      setKind(newest.kind);
      setSelectedCategoryId(newest.id);
      setSelectedSubcategory('');
    }
    previousCategoryIds.current = new Set(
      ledger.categories.map(item => item.id),
    );
  }, [ledger.categories]);
  const categories = ledger.categories.filter(item => item.kind === kind);
  const activeCategory =
    categories.find(item => item.id === selectedCategoryId) ?? categories[0];
  const expenseCount = ledger.categories.filter(
    item => item.kind === 'expense',
  ).length;
  const incomeCount = ledger.categories.length - expenseCount;

  return (
    <View style={styles.flex}>
      <AppScreen
        scroll
        padded={false}
        safeTop={false}
        contentContainerStyle={[
          styles.scrollContent,
          localStyles.scrollContent,
        ]}
        collapseThreshold={110}
        collapsedHeader={
          <LedgerCompactHeader
            title="Categories"
            summary={`${expenseCount} expense · ${incomeCount} income`}
          />
        }>
        {header}
        <View style={localStyles.intro}>
          <AppText variant="heading">Keep every entry in its place.</AppText>
          <AppText muted>
            Browse expense and income categories, then choose one to see its
            subcategories.
          </AppText>
        </View>
        <ChoiceRow
          label="Used for"
          options={[
            { label: `Expenses (${expenseCount})`, value: 'expense' },
            { label: `Income (${incomeCount})`, value: 'income' },
          ]}
          value={kind}
          onChange={next => {
            setKind(next);
            setSelectedCategoryId('');
            setSelectedSubcategory('');
          }}
        />
        <AppSelect
          label="Category"
          options={categories.map(item => ({
            label: item.name,
            value: item.id,
          }))}
          value={activeCategory?.id ?? null}
          onChange={next => {
            if (typeof next === 'string') {
              setSelectedCategoryId(next);
              setSelectedSubcategory('');
            }
          }}
          searchable={categories.length > 6}
          placeholder="Choose a category"
        />
        {activeCategory ? (
          <Surface style={localStyles.focusCard}>
            <View style={localStyles.focusHeading}>
              <View style={localStyles.focusTitle}>
                <AppText variant="heading">{activeCategory.name}</AppText>
                <AppText variant="caption" muted>
                  {activeCategory.subcategories.length}{' '}
                  {activeCategory.subcategories.length === 1
                    ? 'subcategory'
                    : 'subcategories'}
                </AppText>
              </View>
              <View
                style={[
                  localStyles.focusIcon,
                  { backgroundColor: colors.successSurface },
                ]}>
                <LedgerIcon
                  name="categories"
                  color={colors.primary}
                  size={22}
                />
              </View>
            </View>
            {activeCategory.subcategories.length ? (
              <AppSelect
                label="Subcategories"
                options={activeCategory.subcategories.map(item => ({
                  label: item,
                  value: item,
                }))}
                value={selectedSubcategory || null}
                onChange={next => {
                  if (typeof next === 'string') setSelectedSubcategory(next);
                }}
                searchable={activeCategory.subcategories.length > 6}
                placeholder="Browse subcategories"
              />
            ) : (
              <EmptyNote
                title="No subcategories yet"
                body="Use Add subcategory to create the first one."
              />
            )}
          </Surface>
        ) : (
          <EmptyNote
            title={`No ${kind} categories`}
            body="Add a category to organise your entries."
          />
        )}
      </AppScreen>
      <LedgerFloatingActions visible={showFloatingActions}>
        <LedgerFloatingAction
          label="Add subcategory"
          accessibilityLabel={
            activeCategory
              ? `Add subcategory to ${activeCategory.name}`
              : 'Add subcategory'
          }
          secondary
          disabled={!activeCategory}
          onPress={() => {
            if (activeCategory) {
              onOpenDialog({ kind: 'subcategory', item: activeCategory });
            }
          }}
        />
        <LedgerFloatingAction
          label="Add category"
          accessibilityLabel="Add category"
          onPress={() => onOpenDialog({ kind: 'category' })}
        />
      </LedgerFloatingActions>
    </View>
  );
}

const localStyles = StyleSheet.create({
  scrollContent: { paddingBottom: 176 },
  intro: { gap: 8 },
  focusCard: { gap: 18 },
  focusHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  focusTitle: { flex: 1, gap: 4 },
  focusIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
