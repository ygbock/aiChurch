import React, { useState } from 'react';
import { useFirebase } from '../../../components/FirebaseProvider';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, LogIn, ChevronRight, Sparkles, Shield, Landmark } from 'lucide-react';
import { toast } from 'sonner';

export default function Login() {
  const { loginWithEmail, login } = useFirebase();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [authMode, setAuthMode] = useState<'email' | 'options'>('options');

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Email and password are required');
      return;
    }
    
    setIsLoading(true);
    try {
      await loginWithEmail(email, password);
      toast.success('Sign in successful');
    } catch (err: any) {
      toast.error(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await login();
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[5%] w-[40%] h-[40%] bg-blue-600/5 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[10%] -right-[5%] w-[40%] h-[40%] bg-indigo-600/5 blur-[120px] rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="flex flex-col items-center gap-6 mb-12">
          <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-slate-200">
            <Landmark size={32} />
          </div>
          <div className="text-center">
            <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">FaithFlow</h1>
            <p className="text-slate-500 font-medium uppercase tracking-[0.2em] text-xs">Church Management Operating System</p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 relative overflow-hidden">
          <AnimatePresence mode="wait">
            {authMode === 'options' ? (
              <motion.div 
                key="options"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-slate-900">Welcome Administrative Access</h2>
                  <p className="text-slate-500 text-sm mt-1">Please authenticate to continue to the platform.</p>
                </div>

                <button 
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="w-full h-14 bg-white border border-slate-200 rounded-2xl flex items-center justify-center gap-3 text-slate-700 font-bold hover:bg-slate-50 transition-all group active:scale-95 disabled:opacity-50"
                >
                  <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                  Continue with Workspace Account
                </button>

                <div className="flex items-center gap-4 py-2">
                  <div className="flex-1 h-[1px] bg-slate-100" />
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest text-center">or use credentials</span>
                  <div className="flex-1 h-[1px] bg-slate-100" />
                </div>

                <button 
                  onClick={() => setAuthMode('email')}
                  className="w-full h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center gap-3 font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 active:scale-95"
                >
                  <Mail size={18} />
                  Login with Email
                </button>
              </motion.div>
            ) : (
              <motion.div 
                key="email"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <button 
                  onClick={() => setAuthMode('options')}
                  className="mb-8 text-slate-400 hover:text-slate-900 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest transition-colors"
                >
                  <ChevronRight size={14} className="rotate-180" />
                  Back to options
                </button>

                <form onSubmit={handleEmailLogin} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Work Email</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full h-14 pl-12 pr-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all outline-none text-sm font-medium"
                        placeholder="name@church.org"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center px-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Secret Key</label>
                      <button type="button" className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">Forgot?</button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full h-14 pl-12 pr-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all outline-none text-sm font-medium"
                        placeholder="••••••••"
                        required
                      />
                    </div>
                  </div>

                  <button 
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center gap-3 font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 active:scale-95 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <LogIn size={18} />
                        Authenticate
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-12 flex items-center justify-center gap-6">
          <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <Shield size={14} />
            Secure Access
          </div>
          <div className="w-1 h-1 bg-slate-200 rounded-full" />
          <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <Sparkles size={14} />
            AI Enabled
          </div>
        </div>
      </motion.div>
    </div>
  );
}
