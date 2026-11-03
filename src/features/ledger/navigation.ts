import type {
  Account,
  Budget,
  Category,
  EntryKind,
  Schedule,
  Transaction,
} from './model';
import type { LedgerIconName } from './LedgerIcon';

export type Tab = 'home' | 'activity' | 'budgets' | 'accounts' | 'categories';
export type Dialog =
  | { kind: 'transaction'; initialKind?: EntryKind }
  | { kind: 'account'; item?: Account }
  | { kind: 'budget'; item?: Budget }
  | { kind: 'category' }
  | { kind: 'subcategory'; item: Category }
  | { kind: 'transactionDetail'; item: Transaction }
  | { kind: 'scheduleDetail'; item: Schedule };

export const NAV: { id: Tab; label: string; icon: LedgerIconName }[] = [
  { id: 'home', label: 'Overview', icon: 'home' },
  { id: 'activity', label: 'Activity', icon: 'activity' },
  { id: 'budgets', label: 'Budgets', icon: 'budget' },
  { id: 'accounts', label: 'Accounts', icon: 'wallet' },
  { id: 'categories', label: 'Categories', icon: 'categories' },
];
