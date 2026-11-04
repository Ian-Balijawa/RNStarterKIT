import React, { createContext, useContext } from 'react';
import { Account, Transaction } from '../model';

export type RecordActions = {
  archiveAccount: (account: Account) => void;
  deleteAccount: (account: Account) => void;
  restoreAccount: (account: Account) => void;
  archiveTransaction: (transaction: Transaction) => void;
  deleteTransaction: (transaction: Transaction) => void;
  restoreTransaction: (transaction: Transaction) => void;
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
