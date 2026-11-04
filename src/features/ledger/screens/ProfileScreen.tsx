import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppScreen } from '../../../components/layout/AppScreen';
import { AppTextInput } from '../../../components/forms/AppTextInput';
import { AppBottomSheet } from '../../../components/overlays/AppBottomSheet';
import { AppButton } from '../../../components/ui/AppButton';
import { AppText } from '../../../components/ui/AppText';
import { useAppTheme } from '../../../theme/theme';
import { LedgerIcon } from '../LedgerIcon';
import { EntryRow } from '../components/EntryRow';
import { ProfileAvatar } from '../components/ProfileAvatar';
import { SectionTitle } from '../components/SectionTitle';
import { Surface } from '../components/Surface';
import { useRecordActions } from '../components/RecordActions';
import { Account, LedgerState, Transaction, formatUGX } from '../model';
import { Dialog, Tab } from '../navigation';
import { LedgerProfile, validateProfile } from '../profile';
import { styles as ledgerStyles } from '../styles';

export function ProfileScreen({
  profile,
  ledger,
  balances,
  totalBalance,
  recent,
  onSave,
  onBack,
  onOpenNotifications,
  unreadCount,
  pendingCount,
  onSelectTab,
  onOpenDialog,
}: {
  profile: LedgerProfile | null;
  ledger: LedgerState;
  balances: { account: Account; balance: number }[];
  totalBalance: number;
  recent: Transaction[];
  onSave: (profile: LedgerProfile) => void;
  onBack: () => void;
  onOpenNotifications?: () => void;
  unreadCount?: number;
  pendingCount?: number;
  onSelectTab: (tab: Tab) => void;
  onOpenDialog: (dialog: Dialog) => void;
}) {
  const { colors } = useAppTheme();
  const recordActions = useRecordActions();
  const [name, setName] = useState(profile?.name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const displayName = profile?.name.trim() || 'Your profile';
  const gross = ledger.transactions.reduce(
    (totals, item) => {
      if (item.kind === 'income') totals.income += item.amount;
      if (item.kind === 'expense') totals.expense += item.amount;
      return totals;
    },
    { income: 0, expense: 0 },
  );
  const recentActivity = recent.slice(0, 3);
  const latestExpense = recent.find(item => item.kind === 'expense');
  const showSeparateExpense =
    latestExpense && !recentActivity.some(item => item.id === latestExpense.id);
  const submit = () => {
    const message = validateProfile(name, phone);
    if (message) {
      setError(message);
      setSaved(false);
      return;
    }
    onSave({ name: name.trim(), phone: phone.trim() });
    setError('');
    setSaved(true);
    setEditOpen(false);
  };
  return (
    <>
      <AppScreen
        scroll
        padded={false}
        safeTop={false}
        contentContainerStyle={ledgerStyles.scrollContent}
        collapseThreshold={120}
        collapsedHeader={
          <View style={styles.collapsed}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back to previous screen"
              onPress={onBack}
              style={styles.collapsedBack}>
              <AppText variant="heading" style={{ color: colors.primary }}>
                ‹
              </AppText>
            </Pressable>
            <ProfileAvatar name={profile?.name ?? name} size={32} />
            <View style={styles.collapsedName}>
              <AppText variant="label" numberOfLines={1}>
                {displayName}
              </AppText>
            </View>
            <View style={styles.collapsedBalance}>
              <AppText variant="caption" muted>
                TOTAL BALANCE
              </AppText>
              <AppText variant="label" numberOfLines={1} adjustsFontSizeToFit>
                {formatUGX(totalBalance)}
              </AppText>
            </View>
          </View>
        }>
        <View style={styles.topBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back to previous screen"
            onPress={onBack}
            style={styles.backButton}>
            <AppText variant="label" style={{ color: colors.primary }}>
              ‹ Back
            </AppText>
          </Pressable>
          {onOpenNotifications ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Open notifications${
                unreadCount ? `, ${unreadCount} unread` : ''
              }`}
              onPress={onOpenNotifications}
              style={styles.notificationButton}>
              <LedgerIcon name="bell" color={colors.primary} size={23} />
              {unreadCount ? (
                <View
                  style={[
                    styles.notificationDot,
                    { backgroundColor: colors.danger },
                  ]}
                />
              ) : null}
            </Pressable>
          ) : null}
        </View>
        <View style={styles.intro}>
          <ProfileAvatar name={profile?.name ?? name} size={72} />
          <View style={styles.introText}>
            <AppText variant="caption" muted style={styles.eyebrow}>
              MY LEDGER
            </AppText>
            <AppText variant="display" numberOfLines={2}>
              {displayName}
            </AppText>
            <AppText muted>
              {profile
                ? 'Your money at a glance'
                : 'Add your details to make this ledger yours.'}
            </AppText>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={profile ? 'Edit profile' : 'Create profile'}
            onPress={() => {
              setName(profile?.name ?? '');
              setPhone(profile?.phone ?? '');
              setError('');
              setEditOpen(true);
            }}
            style={[
              styles.editButton,
              { backgroundColor: colors.successSurface },
            ]}>
            <LedgerIcon name="edit" color={colors.primary} size={20} />
          </Pressable>
        </View>
        {saved ? (
          <AppText
            variant="caption"
            accessibilityLiveRegion="polite"
            style={{ color: colors.success }}>
            Profile saved on this device.
          </AppText>
        ) : null}
        {pendingCount ? (
          <AppText variant="caption" muted>
            {pendingCount} local changes ready for future sync.
          </AppText>
        ) : null}
        <View style={[styles.balanceCard, { backgroundColor: colors.hero }]}>
          <AppText style={styles.balanceLabel}>TOTAL ACROSS ACCOUNTS</AppText>
          <AppText
            style={styles.balanceAmount}
            numberOfLines={1}
            adjustsFontSizeToFit>
            {formatUGX(totalBalance)}
          </AppText>
          <AppText style={styles.balanceDetail}>
            {balances.length} {balances.length === 1 ? 'account' : 'accounts'} ·
            Current balance
          </AppText>
        </View>
        <View style={styles.grossRow}>
          <View
            style={[
              styles.grossCard,
              { backgroundColor: colors.successSurface },
            ]}>
            <LedgerIcon name="income" color={colors.success} size={19} />
            <AppText variant="caption" muted>
              GROSS INCOME · ALL TIME
            </AppText>
            <AppText
              variant="heading"
              style={styles.grossAmount}
              numberOfLines={1}
              adjustsFontSizeToFit>
              {formatUGX(gross.income)}
            </AppText>
          </View>
          <View
            style={[
              styles.grossCard,
              { backgroundColor: colors.dangerSurface },
            ]}>
            <LedgerIcon name="expense" color={colors.danger} size={19} />
            <AppText variant="caption" muted>
              GROSS EXPENSES · ALL TIME
            </AppText>
            <AppText
              variant="heading"
              style={styles.grossAmount}
              numberOfLines={1}
              adjustsFontSizeToFit>
              {formatUGX(gross.expense)}
            </AppText>
          </View>
        </View>
        <View style={styles.section}>
          <SectionTitle
            title="Accounts"
            action="View all"
            onPress={() => onSelectTab('accounts')}
          />
          {balances.length ? (
            <Surface style={styles.listSurface}>
              {balances.slice(0, 3).map(({ account, balance }, index) => (
                <Pressable
                  key={account.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${account.name}, ${formatUGX(balance)}`}
                  onPress={() =>
                    onOpenDialog({ kind: 'account', item: account })
                  }
                  style={({ pressed }) => [
                    styles.accountRow,
                    index < Math.min(balances.length, 3) - 1 && {
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderColor: colors.border,
                    },
                    { opacity: pressed ? 0.65 : 1 },
                  ]}>
                  <View
                    style={[
                      styles.accountIcon,
                      { backgroundColor: colors.successSurface },
                    ]}>
                    <LedgerIcon
                      name="wallet"
                      color={colors.primary}
                      size={20}
                    />
                  </View>
                  <AppText
                    variant="label"
                    style={styles.accountName}
                    numberOfLines={1}>
                    {account.name}
                  </AppText>
                  <AppText
                    variant="label"
                    numberOfLines={1}
                    adjustsFontSizeToFit>
                    {formatUGX(balance)}
                  </AppText>
                </Pressable>
              ))}
              {balances.length > 3 ? (
                <AppText variant="caption" muted style={styles.moreAccounts}>
                  {balances.length - 3} more{' '}
                  {balances.length - 3 === 1 ? 'account' : 'accounts'}
                </AppText>
              ) : null}
            </Surface>
          ) : (
            <Surface>
              <AppText muted>No accounts yet. Add one from Accounts.</AppText>
            </Surface>
          )}
        </View>
        <View style={styles.section}>
          <SectionTitle
            title="Recent activity"
            action="View all"
            onPress={() => onSelectTab('activity')}
          />
          {recentActivity.length ? (
            <Surface style={styles.listSurface}>
              {recentActivity.map(item => (
                <EntryRow
                  key={item.id}
                  item={item}
                  ledger={ledger}
                  onPress={() =>
                    onOpenDialog({ kind: 'transactionDetail', item })
                  }
                />
              ))}
              {showSeparateExpense ? (
                <View>
                  <AppText
                    variant="caption"
                    muted
                    style={styles.latestExpenseLabel}>
                    LATEST EXPENSE
                  </AppText>
                  <EntryRow
                    item={latestExpense}
                    ledger={ledger}
                    onPress={() =>
                      onOpenDialog({
                        kind: 'transactionDetail',
                        item: latestExpense,
                      })
                    }
                  />
                </View>
              ) : null}
            </Surface>
          ) : (
            <Surface>
              <AppText muted>
                Your latest transactions and expenses will appear here.
              </AppText>
            </Surface>
          )}
        </View>
        {ledger.accounts.some(item => item.archivedAt) ||
        ledger.transactions.some(item => item.archivedAt) ? (
          <View style={styles.section}>
            <SectionTitle title="Archived records" />
            <Surface>
              {ledger.accounts
                .filter(item => item.archivedAt)
                .map(item => (
                  <View key={item.id} style={styles.archiveRow}>
                    <View style={styles.accountName}>
                      <AppText variant="label" numberOfLines={1}>
                        {item.name}
                      </AppText>
                      <AppText variant="caption" muted>
                        Account
                      </AppText>
                    </View>
                    <AppButton
                      title="Restore"
                      variant="ghost"
                      onPress={() => recordActions?.restoreAccount(item)}
                    />
                  </View>
                ))}
              {ledger.transactions
                .filter(item => item.archivedAt)
                .map(item => (
                  <View key={item.id} style={styles.archiveRow}>
                    <View style={styles.accountName}>
                      <AppText variant="label" numberOfLines={1}>
                        {item.note || item.kind}
                      </AppText>
                      <AppText variant="caption" muted>
                        {formatUGX(item.amount)} · Transaction
                      </AppText>
                    </View>
                    <AppButton
                      title="Restore"
                      variant="ghost"
                      onPress={() => recordActions?.restoreTransaction(item)}
                    />
                  </View>
                ))}
            </Surface>
          </View>
        ) : null}
      </AppScreen>
      <AppBottomSheet
        visible={editOpen}
        onDismiss={() => setEditOpen(false)}
        title={profile ? 'Edit profile' : 'Create profile'}
        snapPoints={['55%', '85%']}
        scrollable
        footer={
          <AppButton
            title={profile ? 'Save changes' : 'Create profile'}
            onPress={submit}
          />
        }>
        <View style={styles.formHeading}>
          <AppText variant="heading">
            {profile ? 'Your details' : 'Create your profile'}
          </AppText>
          <AppText variant="caption" muted>
            {profile
              ? 'Saved on this device.'
              : 'Add your name and phone number to personalize your ledger.'}
          </AppText>
        </View>
        <AppTextInput
          label="Full name"
          value={name}
          onChangeText={value => {
            setName(value);
            setSaved(false);
          }}
          autoCapitalize="words"
          autoComplete="name"
          returnKeyType="next"
          required
        />
        <AppTextInput
          label="Phone number"
          value={phone}
          onChangeText={value => {
            setPhone(value);
            setSaved(false);
          }}
          keyboardType="phone-pad"
          autoComplete="tel"
          placeholder="e.g. +256 700 000 000"
          required
        />
        {error ? (
          <AppText
            variant="caption"
            accessibilityLiveRegion="polite"
            style={{ color: colors.danger }}>
            {error}
          </AppText>
        ) : null}
      </AppBottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: { minHeight: 44, justifyContent: 'center' },
  notificationButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  collapsed: {
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  collapsedBack: {
    minWidth: 32,
    minHeight: 44,
    justifyContent: 'center',
  },
  collapsedName: { flex: 1, minWidth: 0 },
  collapsedBalance: { alignItems: 'flex-end', gap: 2, maxWidth: '45%' },
  intro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 8,
  },
  introText: { flex: 1, minWidth: 0, gap: 3 },
  editButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: { fontWeight: '700', letterSpacing: 1.5 },
  balanceCard: { borderRadius: 24, padding: 22, gap: 8 },
  balanceLabel: {
    color: '#D8E8DD',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  balanceAmount: {
    color: '#FFFFFF',
    fontSize: 34,
    lineHeight: 42,
    fontWeight: '800',
    letterSpacing: -1,
  },
  balanceDetail: { color: '#D8E8DD', fontSize: 13 },
  grossRow: { flexDirection: 'row', gap: 10 },
  grossCard: { flex: 1, minWidth: 0, borderRadius: 18, padding: 14, gap: 7 },
  grossAmount: { fontSize: 18, lineHeight: 24 },
  section: { gap: 10 },
  listSurface: { paddingVertical: 2, paddingHorizontal: 16, gap: 0 },
  accountRow: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  accountIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountName: { flex: 1, minWidth: 0 },
  archiveRow: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  moreAccounts: { paddingVertical: 12 },
  latestExpenseLabel: { paddingTop: 14, fontWeight: '700', letterSpacing: 1.2 },
  formHeading: { gap: 3 },
});
