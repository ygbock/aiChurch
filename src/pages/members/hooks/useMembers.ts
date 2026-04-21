import { useState, useEffect } from 'react';
import { 
  collection, 
  collectionGroup, 
  query, 
  where, 
  onSnapshot,
  doc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useFirebase } from '@/components/FirebaseProvider';
import { MemberData } from '@/types/membership';

export function useMembers() {
  const { profile } = useFirebase();
  const [members, setMembers] = useState<MemberData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile?.districtId) return;

    setLoading(true);
    let mQuery: any;

    if (profile.role === 'superadmin') {
      mQuery = query(collectionGroup(db, 'members'));
    } else if (profile.role === 'district') {
      mQuery = query(collectionGroup(db, 'members'), where('districtId', '==', profile.districtId));
    } else if (profile.branchId && profile.districtId) {
      // For branch admins, use the direct subcollection to align with Firestore rules
      mQuery = collection(db, 'districts', profile.districtId, 'branches', profile.branchId, 'members');
    } else {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(mQuery, (snapshot) => {
      const mList = snapshot.docs.map(d => ({
        id: d.id,
        path: d.ref.path,
        ...d.data()
      })) as MemberData[];
      
      setMembers(mList);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching members:", err);
      setError(err.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profile]);

  return { members, loading, error };
}
