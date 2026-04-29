import { useState, useEffect } from 'react';
import { 
  collection, 
  collectionGroup, 
  query, 
  where, 
  onSnapshot,
  doc
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
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
    } else if (profile.role === 'district' && profile.districtId) {
      mQuery = query(collectionGroup(db, 'members'), where('districtId', '==', profile.districtId));
    } else if (profile.branchId) {
      // For branch admins, usage of collectionGroup is now allowed by our updated rules
      mQuery = query(collectionGroup(db, 'members'), where('branchId', '==', profile.branchId));
    } else {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(mQuery, (snapshot) => {
      const mList = snapshot.docs.map(d => {
        const pathSegments = d.ref.path.split('/');
        // Path is districts/{districtId}/branches/{branchId}/members/{memberId}
        const extractedDistrictId = pathSegments[1];
        const extractedBranchId = pathSegments[3];
        
        return {
          id: d.id,
          path: d.ref.path,
          districtId: extractedDistrictId,
          branchId: extractedBranchId,
          ...d.data()
        };
      }) as MemberData[];
      
      setMembers(mList);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching members:", err);
      handleFirestoreError(err, OperationType.LIST, 'members (collectionGroup)');
      setError(err.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profile]);

  return { members, loading, error };
}
