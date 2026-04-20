import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, sendPasswordResetEmail } from 'firebase/auth';
import { doc, onSnapshot, getDoc, setDoc, collection, query, where, getDocs, collectionGroup, serverTimestamp, addDoc, limit } from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../lib/firebase';
import { Role } from '../constants/modules';

interface UserProfile {
  uid: string;
  fullName: string;
  email: string;
  role: Role;
  districtId?: string;
  branchId?: string;
}

interface FirebaseContextType {
  user: User | null;
  profile: UserProfile | null;
  memberProfile: any | null;
  loading: boolean;
  provisioningStatus: string | null;
  login: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

const isPermissionError = (err: any) => {
  if (!err) return false;
  
  // Extract standard properties
  const message = (err.message || String(err)).toLowerCase();
  const code = (err.code || "").toLowerCase();
  const name = (err.name || "").toLowerCase();
  
  const keywords = ['permission', 'insufficient', 'access-denied', 'unauthenticated', 'permission-denied'];
  
  // Check substrings in all common error fields
  const isMatch = keywords.some(k => 
    message.includes(k) || 
    code.includes(k) || 
    name.includes(k)
  );

  // Fallback for serialized objects
  if (!isMatch) {
    try {
      const stringified = JSON.stringify(err).toLowerCase();
      return keywords.some(k => stringified.includes(k));
    } catch {
      return false;
    }
  }

  return isMatch;
};

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [memberProfile, setMemberProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [provisioningStatus, setProvisioningStatus] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setProfile(null);
        setLoading(false);
      } else {
        // We handle user profile subscription in the next effect.
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      const unsubscribeProfile = onSnapshot(userRef, async (snapshot) => {
        if (snapshot.exists()) {
          const profileData = snapshot.data() as UserProfile;
          setProfile(profileData);
          
          // Fetch member profile if available
          if (profileData.email) {
            const membersQuery = query(
              collectionGroup(db, 'members'),
              where('email', '==', profileData.email.toLowerCase().trim()),
              limit(1)
            );
            
            const unsubscribeMembers = onSnapshot(membersQuery, (mSnap) => {
              if (!mSnap.empty) {
                setMemberProfile({ id: mSnap.docs[0].id, ...mSnap.docs[0].data() });
              } else {
                setMemberProfile(null);
              }
              setLoading(false);
            }, (err) => {
              console.warn("Failed to listen to member profile:", err);
              setLoading(false);
            });

            return () => {
              unsubscribeMembers();
            };
          } else {
            setLoading(false);
          }
        } else {
          // If the profile doesn't exist, we must attempt to provision it.
          await attemptProvisioning(user);
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
      });

      return () => unsubscribeProfile();
    }
  }, [user]);

  const attemptProvisioning = async (authUser: User, retryCount = 0) => {
    try {
      if (!authUser.email) throw new Error("No email associated with account.");
      
      const emailLower = authUser.email.toLowerCase().trim();
      console.log(`[Attempt ${retryCount + 1}] Provisioning for: ${emailLower}`);
      
      const accessRef = doc(db, 'accessControl', emailLower);
      
      setProvisioningStatus('Verifying registration and permissions...');
      let accessData: any = null;
      try {
        const accessSnap = await getDoc(accessRef);
        if (accessSnap.exists()) {
          accessData = accessSnap.data();
        }
      } catch (accessError: any) {
        if (emailLower === 'ygbock@gmail.com') {
          console.log('Continuing super admin bootstrapping...');
        } else if (isPermissionError(accessError)) {
          if (retryCount < 3) {
            console.log('Permission issue. Retrying in 2s...');
            setTimeout(() => attemptProvisioning(authUser, retryCount + 1), 2000);
            return;
          }
          console.error('Max retries reached for permission error.');
          return;
        } else {
          throw accessError;
        }
      }

      const userRef = doc(db, 'users', authUser.uid);
      
      if (accessData || emailLower === 'ygbock@gmail.com') {
        const role = (accessData?.role || 'superadmin') as Role;
        const districtId = accessData?.districtId || null;
        const branchId = accessData?.branchId || null;

        setProvisioningStatus('Finalizing your administrator profile...');
        const newProfile: UserProfile = {
          uid: authUser.uid,
          fullName: authUser.displayName || emailLower.split('@')[0],
          email: emailLower,
          role: role,
          districtId: districtId,
          branchId: branchId
        };
        // Use a retry block for profile creation as rules propagation can be slow
        let success = false;
        let pRetryCount = 0;
        while (!success && pRetryCount < 3) {
          try {
            await setDoc(userRef, newProfile);
            success = true;
          } catch (err) {
            if (isPermissionError(err) && pRetryCount < 2) {
              console.log(`Profile creation permission issue. Retrying in 2s... (pRetry ${pRetryCount + 1})`);
              await new Promise(resolve => setTimeout(resolve, 2000));
              pRetryCount++;
            } else {
              throw err;
            }
          }
        }

        // SYNC TO MEMBER REGISTRY
        if (districtId) {
          try {
            setProvisioningStatus('Synchronizing with member registry...');
            console.log('Synchronizing member registry record...');
            // Check if they are already in the registry
            const membersQuery = query(
              collectionGroup(db, 'members'),
              where('email', '==', emailLower),
              limit(1)
            );
            const memberSnap = await getDocs(membersQuery);

            if (memberSnap.empty) {
              console.log('Creating initial member registry record...');
              
              let targetBranchId = branchId;
              
              if (!targetBranchId) {
                try {
                  const branchesRef = collection(db, 'districts', districtId, 'branches');
                  const branchesSnap = await getDocs(query(branchesRef, limit(1)));
                  if (!branchesSnap.empty) {
                    targetBranchId = branchesSnap.docs[0].id;
                  }
                } catch (err) {
                  console.warn('Could not auto-detect branch for sync:', err);
                }
              }

              if (targetBranchId) {
                const memberRef = doc(db, `districts/${districtId}/branches/${targetBranchId}/members`, authUser.uid);
                const memberData = {
                  uid: authUser.uid,
                  fullName: newProfile.fullName,
                  email: emailLower,
                  phone: authUser.phoneNumber || null,
                  districtId: districtId,
                  branchId: targetBranchId,
                  level: 'Leader',
                  status: 'Active',
                  createdAt: serverTimestamp(),
                  updatedAt: serverTimestamp(),
                  isProfileComplete: false
                };
                await setDoc(memberRef, memberData);
                console.log('Member record created.');
              }
            } else {
              console.log('Member record already exists.');
            }
          } catch (memberErr) {
            // Log as warning - don't crash provisioning if member sync fails
            console.warn('Member registry sync skipped due to permissions or error:', memberErr);
          }
        }
        setProvisioningStatus(null);
      } else {
        if (retryCount < 2) {
          setProvisioningStatus('Waiting for registration approval (Retrying)...');
          console.log('Access record not found. Retrying in 3s...');
          setTimeout(() => attemptProvisioning(authUser, retryCount + 1), 3000);
          return;
        }
        setProvisioningStatus(null);
        setLoading(false);
        alert(`Access Denied (${emailLower}).\n\nYour account has not yet been provisioned. Please contact support.`);
        await logout();
      }
    } catch (error: any) {
      setProvisioningStatus(null);
      setLoading(false);
      console.error('Provisioning process encountered an error:', error);
      
      const isPerm = isPermissionError(error);
      
      // We only alert if it's NOT a permission error OR if it's a superadmin who really should have access
      if (!isPerm || (authUser.email === 'ygbock@gmail.com' && retryCount >= 2)) {
        const errorMsg = error.message || String(error);
        const errorCode = error.code ? ` (${error.code})` : '';
        
        // Final attempt to suppress if it's likely transient permission issue
        if (isPerm) {
          console.warn('Suppressing terminal permission alert for superadmin - system may still be propagating rules.');
          return;
        }

        alert(`Provisioning failed: ${errorMsg}${errorCode}\n\nThis usually resolves itself within a few seconds. Please try refreshing the page.`);
      } else {
        console.warn('Provisioning stalled due to permissions (will retry background sync on next refresh):', error);
      }
    }
  };

  const login = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Login failed', error);
      throw error;
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
      console.error('Email Login failed', error);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, pass: string) => {
    try {
      // Create user credential (user will be automatically logged in)
      await createUserWithEmailAndPassword(auth, email, pass);
    } catch (error) {
      console.error('Email Signup failed', error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('Password reset failed', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
       console.error('Logout failed', error);
    }
  };

  return (
    <FirebaseContext.Provider value={{ user, profile, memberProfile, loading, provisioningStatus, login, loginWithEmail, signUpWithEmail, resetPassword, logout }}>
      {children}
    </FirebaseContext.Provider>
  );
}

export function useFirebase() {
  const context = useContext(FirebaseContext);
  if (!context) throw new Error('useFirebase must be used within a FirebaseProvider');
  return context;
}

