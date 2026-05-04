import { useState, useEffect } from 'react';
import { 
  collection, 
  collectionGroup, 
  query, 
  where, 
  onSnapshot,
  doc,
  getDocs,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { useFirebase } from '@/components/FirebaseProvider';
import { MemberData } from '@/types/membership';

export function useMembers() {
  const { profile } = useFirebase();
  const [members, setMembers] = useState<MemberData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Auto-sync admins to members if superadmin
  useEffect(() => {
    if (profile?.role !== 'superadmin') return;
    
    const syncMissingAdmins = async () => {
      try {
        // 1. Sync from users collection
        const usersSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'admin')));
        for (const userDoc of usersSnap.docs) {
          const userData = userDoc.data();
          if (userData.districtId && userData.branchId && userData.email) {
            const mQuery = query(collectionGroup(db, 'members'), where('email', '==', userData.email));
            const mSnap = await getDocs(mQuery);
            if (mSnap.empty) {
              const memberRef = doc(collection(db, 'districts', userData.districtId, 'branches', userData.branchId, 'members'));
              await setDoc(memberRef, {
                uid: userDoc.id,
                fullName: userData.fullName || userData.email.split('@')[0],
                email: userData.email,
                role: 'admin',
                level: 'Worker',
                districtId: userData.districtId,
                branchId: userData.branchId,
                status: 'Active',
                baptismStatus: 'Baptised',
                isBaptised: true,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
              });
              console.log(`Synced missing admin ${userData.email} from users to members`);
            }
          }
        }

        // 2. Sync from accessControl collection (for users who haven't logged in yet)
        const accessSnap = await getDocs(query(collection(db, 'accessControl'), where('role', '==', 'admin')));
        for (const accDoc of accessSnap.docs) {
          const accData = accDoc.data();
          if (accData.districtId && accData.branchId && accData.email) {
            const mQuery = query(collectionGroup(db, 'members'), where('email', '==', accData.email));
            const mSnap = await getDocs(mQuery);
            if (mSnap.empty) {
              const memberRef = doc(collection(db, 'districts', accData.districtId, 'branches', accData.branchId, 'members'));
              await setDoc(memberRef, {
                uid: accData.uid || null,
                fullName: accData.fullName || accData.email.split('@')[0],
                email: accData.email,
                role: 'admin',
                level: 'Worker',
                districtId: accData.districtId,
                branchId: accData.branchId,
                status: 'Active',
                baptismStatus: 'Baptised',
                isBaptised: true,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
              });
              console.log(`Synced missing admin ${accData.email} from accessControl to members`);
            }
          }
        }
      } catch (e) {
        console.warn("Could not sync admins:", e);
      }
    };
    syncMissingAdmins();
  }, [profile]);

  useEffect(() => {
    if (!profile) return;
    if (profile.role !== 'superadmin' && !profile.districtId) return;

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
        let extractedDistrictId, extractedBranchId;
        if (pathSegments.length >= 6 && pathSegments[0] === 'districts' && pathSegments[2] === 'branches') {
          extractedDistrictId = pathSegments[1];
          extractedBranchId = pathSegments[3];
        }
        
        return {
          id: d.id,
          path: d.ref.path,
          ...d.data(),
          districtId: d.data().districtId || extractedDistrictId,
          branchId: d.data().branchId || extractedBranchId
        };
      }) as MemberData[];
      
      let finalMembers = mList;
      if (profile?.role === 'superadmin' || profile?.role === 'district') {
        finalMembers = mList.filter(m => {
          const isVisitor = m.level === 'Visitor' || m.membershipLevel === 'visitor';
          const isConvert = m.level === 'Convert' || m.membershipLevel === 'convert';
          return !isVisitor && !isConvert;
        });
      }
      
      setMembers(finalMembers);
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
