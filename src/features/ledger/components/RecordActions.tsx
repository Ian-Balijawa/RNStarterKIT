import React, { createContext, useContext } from 'react';
import { Account, Budget, Schedule, Transaction } from '../model';

export type RecordActions = {
  archiveAccount: (account: Account) => void;
  deleteAccount: (account: Account) => void;
  restoreAccount: (account: Account) => void;
  archiveTransaction: (transaction: Transaction) => void;
  deleteTransaction: (transaction: Transaction) => void;
  restoreTransaction: (transaction: Transaction) => void;
  archiveSchedule: (schedule: Schedule) => void;
  deleteSchedule: (schedule: Schedule) => void;
  restoreSchedule: (schedule: Schedule) => void;
  archiveBudget: (budget: Budget) => void;
  deleteBudget: (budget: Budget) => void;
  restoreBudget: (budget: Budget) => void;
};
const Context = createContext<RecordActions | null>(null);
export function RecordActionsProvider({
  value,
  children,
}: {
  value: RecordActions;
  children: React.ReactNode;
}) {
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useRecordActions() {
  return useContext(Context);
}
