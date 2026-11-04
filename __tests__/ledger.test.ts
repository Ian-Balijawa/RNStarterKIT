import {
  accountBalance,
  budgetSpent,
  inPeriod,
  nextOccurrence,
  parseAmount,
  periodStart,
  totalsFor,
  type Account,
  type Budget,
  type Transaction,
} from '../src/features/ledger/model';

const cash: Account = {
  id: 'cash',
  name: 'Cash',
  type: 'cash',
  openingBalance: 100000,
};
const bank: Account = {
  id: 'bank',
  name: 'Bank',
  type: 'bank',
  openingBalance: 50000,
};
const entries: Transaction[] = [
  {
    id: 'income',
    kind: 'income',
    amount: 40000,
    accountId: 'bank',
    categoryId: 'salary',
    note: '',
    occurredAt: '2026-11-03T09:00:00+03:00',
  },
  {
    id: 'food',
    kind: 'expense',
    amount: 15000,
    accountId: 'cash',
    categoryId: 'food',
    subcategory: 'Groceries',
    note: '',
    occurredAt: '2026-11-03T12:00:00+03:00',
  },
  {
    id: 'transfer',
    kind: 'transfer',
    amount: 20000,
    accountId: 'bank',
    toAccountId: 'cash',
    note: '',
    occurredAt: '2026-11-03T14:00:00+03:00',
  },
];

test('transfers move funds without counting as income or spending', () => {
  expect(accountBalance(cash, entries)).toBe(105000);
  expect(accountBalance(bank, entries)).toBe(70000);
  expect(
    totalsFor(entries, 'daily', new Date('2026-11-03T18:00:00+03:00')),
  ).toEqual({ income: 40000, expense: 15000 });
});

test('budgets count only matching expenses in their period', () => {
  const budget: Budget = {
    id: '1',
    name: 'Groceries',
    categoryId: 'food',
    subcategory: 'Groceries',
    amount: 30000,
    period: 'monthly',
  };
  expect(
    budgetSpent(budget, entries, new Date('2026-11-15T12:00:00+03:00')),
  ).toBe(15000);
  expect(
    budgetSpent(budget, entries, new Date('2026-12-01T12:00:00+03:00')),
  ).toBe(0);
  expect(
    inPeriod(
      entries[1].occurredAt,
      'weekly',
      new Date('2026-11-09T12:00:00+03:00'),
    ),
  ).toBe(false);
});

test('yearly periods include the full calendar year and reset at January', () => {
  const anchor = new Date(2026, 6, 15);
  expect(periodStart('yearly', anchor)).toEqual(new Date(2026, 0, 1));
  const first = new Date(2026, 0, 1, 0, 0, 0).toISOString();
  const last = new Date(2026, 11, 31, 23, 59, 59).toISOString();
  const next = new Date(2027, 0, 1, 0, 0, 0).toISOString();
  expect(inPeriod(first, 'yearly', anchor)).toBe(true);
  expect(inPeriod(last, 'yearly', anchor)).toBe(true);
  expect(inPeriod(next, 'yearly', anchor)).toBe(false);
  const yearlyBudget: Budget = {
    id: 'annual',
    name: 'Food',
    categoryId: 'food',
    amount: 100000,
    period: 'yearly',
  };
  const yearlyEntries: Transaction[] = [
    { ...entries[1], id: 'year-end', occurredAt: last },
    { ...entries[1], id: 'next-year', occurredAt: next },
  ];
  expect(budgetSpent(yearlyBudget, yearlyEntries, anchor)).toBe(15000);
  expect(totalsFor(yearlyEntries, 'yearly', anchor)).toEqual({
    income: 0,
    expense: 15000,
  });
});

test('scheduled recurrence and UGX input are valid', () => {
  expect(nextOccurrence('2026-01-31T12:00:00.000Z', 'monthly')).toBe(
    '2026-02-28T12:00:00.000Z',
  );
  expect(nextOccurrence('2026-11-03T12:00:00.000Z', 'quarterly')).toBe(
    '2027-02-03T12:00:00.000Z',
  );
  expect(parseAmount('25,000')).toBe(25000);
  expect(parseAmount('0')).toBeNull();
});
