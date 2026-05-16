import React, { useState } from 'react';
import { useFirebase } from '../../../components/FirebaseProvider';
import { motion } from 'motion/react';
import { Lock, CheckCircle2, ShieldAlert, ArrowRight } from 'lucide-react';
import { updatePassword } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { toast } from 'sonner';

export default function ForcePasswordChange() {
  const { user, logout } = useFirebase();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      // Update Firebase Auth password
      await updatePassword(user, password);
      
      // Update the user profile in Firestore to remove the flag
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        requirePasswordChange: false
      });
      
      toast.success('Password updated successfully!');
      // The Layout should automatically re-render and let them in due to the profile change
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50"
      >
        <div className="flex flex-col items-center gap-6 mb-8">
          <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center">
            <ShieldAlert size={32} />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Security Protocol</h1>
            <p className="text-slate-500 text-sm font-medium">For security reasons, you must change your password before continuing to the platform.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">New Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-14 pl-12 pr-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all outline-none text-sm font-medium"
                placeholder="Minimum 8 characters"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirm New Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full h-14 pl-12 pr-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all outline-none text-sm font-medium"
                placeholder="Confirm secret key"
                required
              />
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
             <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                <CheckCircle2 size={12} className={password.length >= 8 ? 'text-emerald-500' : 'text-slate-300'} />
                At least 8 characters
             </div>
             <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                <CheckCircle2 size={12} className={password && password === confirmPassword ? 'text-emerald-500' : 'text-slate-300'} />
                Passwords match
             </div>
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center gap-3 font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95 disabled:opacity-50"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Update Password & Access
                <ArrowRight size={18} />
              </>
            )}
          </button>

          <button 
            type="button"
            onClick={logout}
            className="w-full text-center text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors"
          >
            Sign out and change later
          </button>
        </form>
      </motion.div>
    </div>
  );
}
