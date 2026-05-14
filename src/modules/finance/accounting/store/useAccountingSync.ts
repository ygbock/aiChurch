import { useEffect } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../../../lib/firebase';
import { useAccountingStore } from './accountingStore';
import { Account, Fund, JournalEntry, Budget } from '../types';
import { useFirebase } from '../../../../components/FirebaseProvider';

export function useAccountingSync() {
  const { setAccounts, setFunds, setJournals, setBudgets, setInitialized } = useAccountingStore();
  const { profile } = useFirebase();
  
  useEffect(() => {
    if (!profile || !profile.districtId || !profile.branchId) return;
    
    // In a real app we'd scope this by branch:
    // /districts/${profile.districtId}/branches/${profile.branchId}/accountingAccounts
    const branchPath = `districts/${profile.districtId}/branches/${profile.branchId}`;
    
    let isSubscribed = true;

    const unsubs: (() => void)[] = [];

    try {
      const qAccounts = query(collection(db, `${branchPath}/accountingAccounts`));
      unsubs.push(onSnapshot(qAccounts, (snapshot) => {
        if (!isSubscribed) return;
        const accounts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Account));
        setAccounts(accounts);
      }, (err) => handleFirestoreError(err, OperationType.LIST, `${branchPath}/accountingAccounts`)));

      const qFunds = query(collection(db, `${branchPath}/accountingFunds`));
      unsubs.push(onSnapshot(qFunds, (snapshot) => {
        if (!isSubscribed) return;
        const funds = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Fund));
        setFunds(funds);
      }, (err) => handleFirestoreError(err, OperationType.LIST, `${branchPath}/accountingFunds`)));

      const qJournals = query(collection(db, `${branchPath}/journalEntries`));
      unsubs.push(onSnapshot(qJournals, (snapshot) => {
        if (!isSubscribed) return;
        const journals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as JournalEntry));
        setJournals(journals);
      }, (err) => handleFirestoreError(err, OperationType.LIST, `${branchPath}/journalEntries`)));

      const qBudgets = query(collection(db, `${branchPath}/accountingBudgets`));
      unsubs.push(onSnapshot(qBudgets, (snapshot) => {
        if (!isSubscribed) return;
        const budgets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Budget));
        setBudgets(budgets);
      }, (err) => handleFirestoreError(err, OperationType.LIST, `${branchPath}/accountingBudgets`)));
      
      setInitialized(true);

    } catch (err) {
      console.error("Failed to set up accounting listeners:", err);
    }

    return () => {
      isSubscribed = false;
      unsubs.forEach(unsub => unsub());
    };
  }, [profile, setAccounts, setFunds, setJournals, setBudgets, setInitialized]);
}
