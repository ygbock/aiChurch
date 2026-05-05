import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import firebaseConfig from '../../firebase-applet-config.json';

export const createSecondaryUser = async (email: string, password: string): Promise<string> => {
  const adminApp = initializeApp(firebaseConfig as any, "AdminApp_" + Date.now());
  const adminAuth = getAuth(adminApp);
  try {
    const userCredential = await createUserWithEmailAndPassword(adminAuth, email, password);
    const newUid = userCredential.user.uid;
    await adminAuth.signOut();
    return newUid;
  } catch (error) {
    throw error;
  }
};
