import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Network, Building2, Eye, EyeOff, Mail, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { useFirebase } from '../components/FirebaseProvider';

export default function Login() {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const { login, loginWithEmail, signUpWithEmail, resetPassword } = useFirebase();

  const clearMessages = () => {
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleGoogleLogin = async () => {
    setIsAuthenticating(true);
    clearMessages();
    try {
      await login();
    } catch (e: any) {
      console.error("Login failed", e);
      setErrorMsg(e.message || "Failed to log in with Google.");
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg('Please enter your email address.');
      return;
    }
    
    if (isForgotPassword) {
      setIsAuthenticating(true);
      clearMessages();
      try {
        await resetPassword(email);
        setSuccessMsg('A password reset link has been sent to your email.');
        setIsForgotPassword(false);
      } catch (err: any) {
        setErrorMsg(translateAuthError(err));
      } finally {
        setIsAuthenticating(false);
      }
      return;
    }

    if (!password) {
      setErrorMsg('Please enter your password.');
      return;
    }
    
    setIsAuthenticating(true);
    clearMessages();
    try {
      if (isSignUp) {
        await signUpWithEmail(email, password);
      } else {
        await loginWithEmail(email, password);
      }
    } catch (err: any) {
      console.error("Email Auth failed", err);
      setErrorMsg(translateAuthError(err));
    } finally {
      setIsAuthenticating(false);
    }
  };

  const translateAuthError = (err: any) => {
    switch (err.code) {
      case 'auth/invalid-credential':
        return 'Invalid credentials. Please check your email and password, and ensure Email/Password login is enabled in your Firebase Console.';
      case 'auth/email-already-in-use':
        return 'An account already exists with this email.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters.';
      case 'auth/invalid-email':
        return 'The email address is not valid.';
      case 'auth/user-disabled':
        return 'This user account has been disabled.';
      case 'auth/operation-not-allowed':
        return 'Email/Password login is not enabled in the Firebase Console. Please enable it in Authentication > Sign-in method.';
      case 'auth/user-not-found':
        return 'No user found with this email address.';
      default:
        return err.message || "Authentication failed.";
    }
  };

  const toggleMode = (mode: 'login' | 'signup' | 'forgot') => {
    clearMessages();
    setIsForgotPassword(mode === 'forgot');
    setIsSignUp(mode === 'signup');
    setPassword('');
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-8 geometric-pattern font-sans overflow-hidden">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-6xl h-auto lg:h-[700px] flex flex-col lg:flex-row bg-white rounded-[40px] shadow-2xl shadow-blue-900/40 overflow-hidden"
      >
        {/* Left Side: Brand & Visuals */}
        <div className="w-full lg:w-1/2 relative min-h-[300px] lg:h-full">
          <img 
            src="https://images.unsplash.com/photo-1438232992991-995b7058bbb3?q=80&w=2673&auto=format&fit=crop" 
            alt="Church" 
            className="absolute inset-0 w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-blue-900/20 backdrop-blur-[2px]"></div>
          
          <div className="relative z-10 h-full flex flex-col items-center justify-start p-10 lg:p-16 text-center">
            <motion.h1 
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-5xl lg:text-7xl font-script text-white mb-4 drop-shadow-lg"
            >
              FaithFlow
            </motion.h1>
            <motion.p 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-white/90 text-sm lg:text-base font-medium max-w-md leading-relaxed drop-shadow-md"
            >
              Empowering ministries with clarity and scale across every campus and congregation.
            </motion.p>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="w-full lg:w-1/2 flex flex-col p-8 lg:p-12 bg-white relative">
          <div className="absolute top-6 right-8 hidden lg:block">
            <div className="flex items-center gap-1 text-blue-500">
               <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-dashed animate-spin-slow"></div>
               <span className="text-[10px] font-black uppercase tracking-tighter">System Active</span>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
            <div className="text-center mb-8">
              <h2 className="text-4xl lg:text-5xl font-display font-extrabold text-blue-500 tracking-tight mb-2">
                Welcome
              </h2>
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em]">
                {isForgotPassword ? 'Reset Password' : (isSignUp ? 'Setup Account' : 'Login with Email')}
              </p>
            </div>

            <div className="space-y-6">
              <AnimatePresence mode="popLayout">
                {errorMsg && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-rose-50 text-rose-600 p-3 rounded-2xl text-xs font-bold border border-rose-100 flex items-start gap-3 w-full"
                  >
                    <AlertCircle size={14} className="shrink-0 mt-0.5 text-rose-500" />
                    <p className="flex-1 leading-relaxed">{errorMsg}</p>
                  </motion.div>
                )}
                {successMsg && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-emerald-50 text-emerald-700 p-3 rounded-2xl text-xs font-bold border border-emerald-100 flex items-start gap-3 w-full"
                  >
                    <CheckCircle2 size={14} className="shrink-0 mt-0.5 text-emerald-600" />
                    <p className="flex-1 leading-relaxed">{successMsg}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleEmailAuth} className="space-y-4">
                <div className="relative group">
                  <div className="absolute -top-2 left-4 bg-white px-2 z-10 text-[9px] font-black uppercase tracking-widest text-slate-400 group-focus-within:text-blue-500 transition-colors">
                    Email ID
                  </div>
                  <div className="flex items-center border-2 border-slate-100 group-focus-within:border-blue-500 rounded-2xl overflow-hidden bg-slate-50/30 transition-all">
                    <div className="pl-4 text-slate-300 group-focus-within:text-blue-500 transition-colors">
                      <Mail size={18} />
                    </div>
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@faithflow.net" 
                      className="w-full bg-transparent p-4 text-sm outline-none font-bold text-slate-900 placeholder:text-slate-300"
                      required 
                      disabled={isAuthenticating}
                    />
                  </div>
                </div>

                {!isForgotPassword && (
                  <div className="relative group">
                    <div className="absolute -top-2 left-4 bg-white px-2 z-10 text-[9px] font-black uppercase tracking-widest text-slate-400 group-focus-within:text-blue-500 transition-colors">
                      Password
                    </div>
                    <div className="flex items-center border-2 border-slate-100 group-focus-within:border-blue-500 rounded-2xl overflow-hidden bg-slate-50/30 transition-all">
                      <div className="pl-4 text-slate-300 group-focus-within:text-blue-500 transition-colors">
                        <Lock size={18} />
                      </div>
                      <input 
                        type={showPassword ? "text" : "password"} 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••" 
                        className="w-full bg-transparent p-4 text-sm outline-none font-bold text-slate-900 placeholder:text-slate-300"
                        required 
                        disabled={isAuthenticating}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="pr-4 text-slate-300 hover:text-blue-500 transition-colors"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex justify-end pr-1">
                  {!isSignUp && !isForgotPassword && (
                    <button 
                      type="button"
                      onClick={() => toggleMode('forgot')}
                      className="text-[10px] font-bold text-slate-400 hover:text-blue-500 transition-colors"
                    >
                      Forgot your password?
                    </button>
                  )}
                </div>

                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isAuthenticating || !email || (!isForgotPassword && !password)}
                  className="w-full bg-blue-500 text-white rounded-2xl py-4 font-black uppercase tracking-[0.1em] text-xs hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                >
                  {isAuthenticating ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>
                  ) : (
                    isForgotPassword ? 'Send Reset Link' : (isSignUp ? 'Register Account' : 'Login')
                  )}
                </motion.button>
              </form>

              {!isForgotPassword && (
                <>
                  <div className="relative flex items-center justify-center py-2">
                    <div className="absolute inset-x-0 border-t border-slate-100"></div>
                    <span className="relative bg-white px-4 text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none">or</span>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <button 
                      onClick={handleGoogleLogin} 
                      disabled={isAuthenticating}
                      className="flex items-center justify-center p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-200 transition-all group"
                    >
                      <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/pwa/google.svg" alt="Google" className="w-6 h-6 grayscale group-hover:grayscale-0 transition-all" />
                    </button>
                    <button className="flex items-center justify-center p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-200 transition-all cursor-not-allowed opacity-50">
                      <svg className="w-6 h-6 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                    </button>
                    <button className="flex items-center justify-center p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-200 transition-all cursor-not-allowed opacity-50">
                      <svg className="w-6 h-6 text-black" fill="currentColor" viewBox="0 0 24 24"><path d="M17.073 21.376c-2.291 0-3.633-1.585-5.426-1.585-1.846 0-3.403 1.56-5.338 1.56-2.435 0-4.63-1.561-6.136-4.089C-1.411 14.134-1.025 9.46 1.287 5.642c1.155-1.905 3.034-3.111 5.094-3.111 2.291 0 3.513 1.252 5.253 1.252 1.734 0 2.827-1.252 5.253-1.252 1.707 0 3.493.856 4.605 2.215-3.858 1.65-3.235 7.55 1.082 8.861-.83 1.942-1.97 3.844-3.834 6.208-1.154 1.488-2.314 1.561-3.667 1.561zM12.003 4.512c0-2.484 2.131-4.512 4.661-4.512 0 2.484-2.131 4.512-4.661 4.512z"/></svg>
                    </button>
                  </div>

                  <div className="text-center mt-6">
                    <button 
                      onClick={() => toggleMode(isSignUp ? 'login' : 'signup')}
                      className="text-[11px] font-bold text-slate-400 hover:text-blue-500 transition-colors"
                      type="button"
                    >
                      {isSignUp ? 'Already have an account? Log In' : "Don't have an account? Register Now"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Landmarks silhouettes at bottom */}
          <div className="mt-auto pt-8 flex items-end justify-center gap-4 lg:gap-8 opacity-20 pointer-events-none grayscale">
            <Building2 size={64} />
            <Network size={80} />
            <Shield size={72} />
            <div className="w-16 h-24 bg-current rounded-t-full"></div>
            <div className="w-12 h-32 bg-current rounded-t-full"></div>
            <div className="w-20 h-16 bg-current rounded-t-lg"></div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
