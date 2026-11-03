# Pesa Ledger

A personal expense tracker for Uganda, built with React Native. Amounts are recorded in whole Uganda shillings (UGX). The app works offline and stores its ledger locally on the device.

## What you can track

- **Overview:** total across accounts, income and spending by day, week, or month, category breakdown, budgets, and recent transactions. Browse earlier periods with the arrow controls.
- **Activity:** income, expenses, and transfers with their actual date and time. Filter by period and transaction type; open an entry to inspect or delete it.
- **Accounts:** Cash, Mobile money, and Bank are included with zero opening balances. Add or edit accounts for other banks, businesses, loans, and more. Transfers move money between accounts without counting as income or spending.
- **Categories:** expense and income categories have subcategories. Add your own categories and subcategories in the Categories tab or while recording a transaction.
- **Budgets:** weekly or monthly limits for a category or specific subcategory. Spending is calculated from recorded expenses in the current period. Tap a budget to edit or delete it.
- **Scheduled transactions:** choose a first date and time and a daily, weekly, monthly, quarterly, or yearly recurrence. A schedule is a plan; it does not change balances or budgets until you tap **Record this transaction now** in Activity. Recording advances its next occurrence.

Salary, Business, and Loan are included as income categories. You can record that income into any account.

## Run

```sh
npm install
npm start
npm run android
# On macOS, in another terminal:
cd ios && pod install && cd ..
npm run ios
```

## Check

```sh
npx tsc --noEmit
npm run lint
npm test -- --runInBand --watchman=false
```

The ledger model and calculations live in `src/features/ledger/model.ts`. Screens and interactions live in `src/features/ledger/LedgerApp.tsx`; entry forms live in `LedgerForms.tsx`. Data is saved through the project's MMKV adapter under `ledger.v1`. This is a local ledger: there is no bank or mobile money connection, cloud sync, or automatic payment execution. The original reusable starter components and services remain in `src/` and are described in [`setup.md`](setup.md).
