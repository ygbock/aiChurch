import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Lock, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useFirebase } from '../components/FirebaseProvider';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

export default function ForcePasswordChange() {
  const { user, profile } = useFirebase();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    if (newPassword !== confirmPassword) {
      setErrorMsg("New passwords do not match.");
      return;
    }
    
    if (newPassword.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }

    setIsAuthenticating(true);
    setErrorMsg('');

    try {
      // Re-authenticate first
      if (user.email) {
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);
      }
      
      // Update password
      await updatePassword(user, newPassword);
      
      // Clear flag from user doc and access control doc
      if (profile?.uid) {
        await updateDoc(doc(db, 'users', profile.uid), {
          requirePasswordChange: false
        });
      }
      
      if (user.email) {
         try {
           await updateDoc(doc(db, 'accessControl', user.email.toLowerCase().trim()), {
             requirePasswordChange: false
           });
         } catch(e) {
           // accessControl write might fail depending on rules for regular members, meaning the user doc is primary
           console.log("AccessControl update bypassed or failed", e);
         }
      }
      
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-credential') {
        setErrorMsg("Incorrect current password.");
      } else {
        setErrorMsg(err.message || 'Failed to update password.');
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-8 geometric-pattern font-sans bg-slate-50">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-xl bg-white rounded-[40px] shadow-2xl overflow-hidden p-8 lg:p-12"
      >
        <div className="flex justify-center mb-8">
           <div className="w-20 h-20 rounded-full border-4 border-blue-100 bg-blue-50 flex items-center justify-center text-blue-500">
             <Shield size={36} />
           </div>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
            Secure Your Account
          </h2>
          <p className="text-slate-500 font-medium">
            For your security, please change the temporary password provided to you by your administrator.
          </p>
        </div>

        <div className="space-y-6">
          <AnimatePresence mode="popLayout">
            {errorMsg && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-rose-50 text-rose-600 p-4 rounded-2xl text-sm font-bold border border-rose-100 flex items-start gap-3 w-full"
              >
                <AlertCircle size={18} className="shrink-0 mt-0.5 text-rose-500" />
                <p className="flex-1 leading-relaxed">{errorMsg}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-4">Current Password</label>
              <div className="flex items-center border-2 border-slate-100 group-focus-within:border-blue-500 rounded-2xl overflow-hidden bg-slate-50 transition-all">
                <input 
                  type="password" 
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter temporary password" 
                  className="w-full bg-transparent p-4 text-sm outline-none font-bold text-slate-900"
                  required 
                  disabled={isAuthenticating}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-4">New Password</label>
              <div className="flex items-center border-2 border-slate-100 group-focus-within:border-blue-500 rounded-2xl overflow-hidden bg-slate-50 transition-all">
                <input 
                  type={showPwd ? "text" : "password"} 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters" 
                  className="w-full bg-transparent p-4 text-sm outline-none font-bold text-slate-900"
                  required 
                  disabled={isAuthenticating}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="pr-4 text-slate-300 hover:text-blue-500 transition-colors"
                >
                  {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-4">Confirm New Password</label>
              <div className="flex items-center border-2 border-slate-100 group-focus-within:border-blue-500 rounded-2xl overflow-hidden bg-slate-50 transition-all">
                <input 
                  type={showPwd ? "text" : "password"} 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password" 
                  className="w-full bg-transparent p-4 text-sm outline-none font-bold text-slate-900"
                  required 
                  disabled={isAuthenticating}
                />
              </div>
            </div>

            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isAuthenticating || !currentPassword || !newPassword || !confirmPassword}
              className="w-full bg-blue-500 text-white rounded-2xl py-4 font-black uppercase tracking-[0.1em] text-sm hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed mt-4 flex justify-center"
            >
              {isAuthenticating ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                'Update Password Securely'
              )}
            </motion.button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
