export type AccountType =
  | 'bank'
  | 'mobile_money'
  | 'cash'
  | 'business'
  | 'loan'
  | 'other';
export type EntryKind = 'expense' | 'income' | 'transfer';
export type Recurrence =
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'quarterly'
  | 'yearly';
export type Period = 'daily' | 'weekly' | 'monthly' | 'yearly';

export type Account = {
  id: string;
  name: string;
  type: AccountType;
  openingBalance: number;
};
export type Category = {
  id: string;
  name: string;
  kind: 'expense' | 'income';
  subcategories: string[];
};
export type Transaction = {
  id: string;
  kind: EntryKind;
  amount: number;
  accountId: string;
  toAccountId?: string;
  categoryId?: string;
  subcategory?: string;
  note: string;
  occurredAt: string;
};
export type Schedule = Omit<Transaction, 'occurredAt'> & {
  nextAt: string;
  recurrence: Recurrence;
};
export type Budget = {
  id: string;
  name: string;
  categoryId: string;
  subcategory?: string;
  amount: number;
  period: 'weekly' | 'monthly' | 'yearly';
};
export type LedgerState = {
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  schedules: Schedule[];
  budgets: Budget[];
};

export const INITIAL_LEDGER: LedgerState = {
  accounts: [
    { id: 'cash', name: 'Cash', type: 'cash', openingBalance: 0 },
    {
      id: 'mobile-money',
      name: 'Mobile money',
      type: 'mobile_money',
      openingBalance: 0,
    },
    { id: 'bank', name: 'Bank', type: 'bank', openingBalance: 0 },
  ],
  categories: [
    {
      id: 'food',
      name: 'Food & drinks',
      kind: 'expense',
      subcategories: ['Groceries', 'Restaurants', 'Coffee & snacks'],
    },
    {
      id: 'transport',
      name: 'Transportation',
      kind: 'expense',
      subcategories: [
        'Fuel / petrol',
        'Public transport',
        'Ride hailing',
        'Vehicle maintenance',
      ],
    },
    {
      id: 'utilities',
      name: 'Utilities',
      kind: 'expense',
      subcategories: ['Power', 'Water', 'Gas', 'Internet', 'Airtime'],
    },
    {
      id: 'housing',
      name: 'Housing',
      kind: 'expense',
      subcategories: ['Rent', 'Home maintenance', 'Furniture & appliances'],
    },
    {
      id: 'health',
      name: 'Health',
      kind: 'expense',
      subcategories: ['Medicine', 'Clinic', 'Insurance'],
    },
    {
      id: 'shopping',
      name: 'Shopping',
      kind: 'expense',
      subcategories: ['Clothing', 'Household', 'Personal care'],
    },
    {
      id: 'other-expense',
      name: 'Other',
      kind: 'expense',
      subcategories: ['General'],
    },
    {
      id: 'salary',
      name: 'Salary',
      kind: 'income',
      subcategories: ['Monthly pay', 'Bonus'],
    },
    {
      id: 'business-income',
      name: 'Business',
      kind: 'income',
      subcategories: ['Sales', 'Services'],
    },
    {
      id: 'loan-income',
      name: 'Loan',
      kind: 'income',
      subcategories: ['Borrowed funds'],
    },
    {
      id: 'other-income',
      name: 'Other income',
      kind: 'income',
      subcategories: ['Gift', 'Refund', 'Other'],
    },
  ],
  transactions: [],
  schedules: [],
  budgets: [],
};

export const newId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export function parseAmount(value: string): number | null {
  const cleaned = value.replace(/[\s,]/g, '');
  if (!/^\d+(?:\.\d{1,2})?$/.test(cleaned)) return null;
  const amount = Number(cleaned);
  return Number.isSafeInteger(amount) && amount > 0 ? amount : null;
}

export function formatUGX(amount: number) {
  return `UGX ${Math.round(amount).toLocaleString('en-UG')}`;
}

export function accountBalance(account: Account, transactions: Transaction[]) {
  return transactions.reduce((balance, item) => {
    if (item.kind === 'transfer') {
      return (
        balance +
        (item.toAccountId === account.id ? item.amount : 0) -
        (item.accountId === account.id ? item.amount : 0)
      );
    }
    if (item.accountId !== account.id) return balance;
    return balance + (item.kind === 'income' ? item.amount : -item.amount);
  }, account.openingBalance);
}

export function periodStart(period: Period, date: Date): Date {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  if (period === 'weekly')
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  if (period === 'monthly') start.setDate(1);
  if (period === 'yearly') start.setMonth(0, 1);
  return start;
}

export function inPeriod(iso: string, period: Period, date: Date): boolean {
  const start = periodStart(period, date);
  const end = new Date(start);
  if (period === 'daily') end.setDate(end.getDate() + 1);
  if (period === 'weekly') end.setDate(end.getDate() + 7);
  if (period === 'monthly') end.setMonth(end.getMonth() + 1);
  if (period === 'yearly') end.setFullYear(end.getFullYear() + 1);
  const value = new Date(iso).getTime();
  return value >= start.getTime() && value < end.getTime();
}

export function totalsFor(
  transactions: Transaction[],
  period: Period,
  date: Date,
) {
  return transactions
    .filter(item => inPeriod(item.occurredAt, period, date))
    .reduce(
      (totals, item) => {
        if (item.kind === 'income') totals.income += item.amount;
        if (item.kind === 'expense') totals.expense += item.amount;
        return totals;
      },
      { income: 0, expense: 0 },
    );
}

export function budgetSpent(
  budget: Budget,
  transactions: Transaction[],
  date: Date,
) {
  return transactions.reduce(
    (spent, item) =>
      spent +
      (item.kind === 'expense' &&
      item.categoryId === budget.categoryId &&
      (!budget.subcategory || item.subcategory === budget.subcategory) &&
      inPeriod(item.occurredAt, budget.period, date)
        ? item.amount
        : 0),
    0,
  );
}

export function nextOccurrence(iso: string, recurrence: Recurrence): string {
  const date = new Date(iso);
  if (recurrence === 'daily') date.setDate(date.getDate() + 1);
  if (recurrence === 'weekly') date.setDate(date.getDate() + 7);
  if (
    recurrence === 'monthly' ||
    recurrence === 'quarterly' ||
    recurrence === 'yearly'
  ) {
    const months =
      recurrence === 'monthly' ? 1 : recurrence === 'quarterly' ? 3 : 12;
    const day = date.getDate();
    date.setDate(1);
    date.setMonth(date.getMonth() + months);
    const lastDay = new Date(
      date.getFullYear(),
      date.getMonth() + 1,
      0,
    ).getDate();
    date.setDate(Math.min(day, lastDay));
  }
  return date.toISOString();
}
