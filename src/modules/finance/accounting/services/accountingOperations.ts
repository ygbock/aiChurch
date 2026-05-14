import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../../../lib/firebase';
import { Account, Fund, JournalEntry, Budget } from '../types';

export const createAccountingOperations = (districtId: string, branchId: string) => {
  const branchPath = `districts/${districtId}/branches/${branchId}`;

  return {
    saveAccount: async (account: Account) => {
      try {
        await setDoc(doc(db, `${branchPath}/accountingAccounts`, account.id), account);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `${branchPath}/accountingAccounts`);
      }
    },
    updateAccount: async (id: string, updates: Partial<Account>) => {
      try {
        await updateDoc(doc(db, `${branchPath}/accountingAccounts`, id), updates);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `${branchPath}/accountingAccounts`);
      }
    },
    saveFund: async (fund: Fund) => {
      try {
        await setDoc(doc(db, `${branchPath}/accountingFunds`, fund.id), fund);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `${branchPath}/accountingFunds`);
      }
    },
    saveJournalEntry: async (entry: JournalEntry) => {
      try {
        await setDoc(doc(db, `${branchPath}/journalEntries`, entry.id), entry);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `${branchPath}/journalEntries`);
      }
    },
    updateJournalStatus: async (id: string, status: string) => {
      try {
        await updateDoc(doc(db, `${branchPath}/journalEntries`, id), { status });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `${branchPath}/journalEntries`);
      }
    },
    saveBudget: async (budget: Budget) => {
      try {
        await setDoc(doc(db, `${branchPath}/accountingBudgets`, budget.id), budget);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `${branchPath}/accountingBudgets`);
      }
    }
  };
};
