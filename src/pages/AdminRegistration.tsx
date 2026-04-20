import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Building2, 
  Map, 
  Shield, 
  User, 
  Mail, 
  Phone, 
  Lock, 
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { doc, getDoc, setDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';

export default function AdminRegistration() {
  const [searchParams] = useSearchParams();
  const inviteId = searchParams.get('invite');
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteData, setInviteData] = useState<any>(null);
  const [isPreAuthorized, setIsPreAuthorized] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchInvite() {
      if (!inviteId) {
        setInviteError("No invitation code provided. Please use the link sent to you.");
        setLoading(false);
        return;
      }

      try {
        const inviteDocRef = doc(db, 'invites', inviteId);
        const inviteDoc = await getDoc(inviteDocRef);

        if (!inviteDoc.exists()) {
          setInviteError("Invalid or expired invitation code.");
        } else {
          const data = inviteDoc.data();
          if (data.status !== 'pending') {
            setInviteError("This invitation has already been used or revoked.");
          } else {
            setInviteData(data);
          }
        }
      } catch (err: any) {
        setInviteError("Failed to verify invitation: " + err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchInvite();
  }, [inviteId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (formData.password !== formData.confirmPassword) {
      setSubmitError("Passwords do not match.");
      return;
    }

    if (formData.password.length < 6) {
      setSubmitError("Password must be at least 6 characters long.");
      return;
    }

    // Verify email matches invite if invite has one
    if (inviteData?.email && formData.email.toLowerCase().trim() !== inviteData.email.toLowerCase().trim()) {
      setSubmitError(`This invitation was sent to ${inviteData.email}. Please use that email to register.`);
      return;
    }

    setSubmitting(true);
    try {
      // 1. Create the Firebase Auth account
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      // 2. Create the user profile in Firestore
      const emailLower = formData.email.toLowerCase().trim();
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        fullName: formData.fullName,
        email: emailLower,
        phone: formData.phone,
        role: inviteData.role,
        districtId: inviteData.districtId,
        branchId: inviteData.branchId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // 3. Check if already pre-authorized in accessControl
      const accessRef = doc(db, 'accessControl', emailLower);
      const accessSnap = await getDoc(accessRef);
      
      const preAuthorized = accessSnap.exists() && accessSnap.data().status === 'pre-authorized';
      setIsPreAuthorized(preAuthorized);

      // 4. Submit the admin request for Superadmin approval (if not pre-authorized)
      const requestPayload = {
        uid: user.uid,
        fullName: formData.fullName,
        email: emailLower,
        phone: formData.phone,
        role: inviteData.role,
        districtId: inviteData.districtId,
        branchId: inviteData.branchId,
        inviteId: inviteId,
        status: preAuthorized ? 'approved' : 'pending_approval',
        approvedAt: preAuthorized ? serverTimestamp() : null,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'adminRequests'), requestPayload);
      
      // Update accessControl if pre-authorized to set to active
      if (preAuthorized) {
        await setDoc(accessRef, {
          ...accessSnap.data(),
          uid: user.uid,
          status: 'active',
          updatedAt: serverTimestamp()
        });
      }
      
      // Update invite status
      const inviteRef = doc(db, 'invites', inviteId);
      await setDoc(inviteRef, { ...inviteData, status: 'used', usedAt: serverTimestamp(), usedBy: user.uid });

      setSuccess(true);
    } catch (err: any) {
      console.error(err);
      setSubmitError(translateAuthError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const translateAuthError = (err: any) => {
    switch (err.code) {
      case 'auth/email-already-in-use':
        return "An account with this email address already exists. If this is your account, please contact the super administrator.";
      case 'auth/weak-password':
        return "Password should be at least 6 characters.";
      case 'auth/operation-not-allowed':
        return "Email/Password registration is not enabled in the Firebase Console. A Superadmin must enable it in the Firebase Console under Authentication > Sign-in method.";
      case 'auth/invalid-email':
        return "The email address is invalid.";
      default:
        return err.message || "Failed to create account. Please try again.";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-blue-600 mb-4" size={32} />
        <p className="text-slate-500 font-medium tracking-widest uppercase text-sm">Verifying Invitation...</p>
      </div>
    );
  }

  if (inviteError) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-slate-200">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100">
            <AlertTriangle size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h2>
          <p className="text-slate-600 mb-6">{inviteError}</p>
          <button 
            onClick={() => window.location.href = '/'}
            className="w-full bg-slate-900 text-white rounded-xl py-3 font-bold hover:bg-slate-800 transition-colors"
          >
            Return to Homepage
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-slate-200"
        >
          <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-100">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Registration Complete</h2>
          <p className="text-slate-600 mb-6">
            {isPreAuthorized ? (
              <>Your administrator account has been created and <strong className="text-emerald-500">Auto-Approved</strong>.</>
            ) : (
              <>Your administrator account has been created and is currently <strong className="text-orange-500">Pending Approval</strong>.</>
            )}
          </p>
          
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 mb-6 text-left">
            <h4 className="text-sm font-bold text-blue-900 mb-1">What's Next?</h4>
            <ul className="text-xs text-blue-800 space-y-2 list-disc pl-4">
              {isPreAuthorized ? (
                <>
                  <li>You can now log in and start managing your dashboard.</li>
                  <li>Go back to the homepage and click "Login".</li>
                  <li>Our systems are currently provisioning your profile.</li>
                </>
              ) : (
                <>
                  <li>Your account will be reviewed shortly by an administrator.</li>
                  <li>Once approved, you will be able to log in.</li>
                  <li>You will receive a notification upon approval.</li>
                </>
              )}
            </ul>
          </div>

          <button 
            onClick={() => window.location.href = '/'}
            className="w-full bg-slate-900 text-white rounded-xl py-3 font-bold hover:bg-slate-800 transition-colors"
          >
            Return to Homepage
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 md:p-8">
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-4xl bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden flex flex-col md:flex-row"
      >
        {/* Left Column - Branding & Info */}
        <div className="w-full md:w-1/3 bg-slate-900 text-white p-8 md:p-12 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Shield size={200} />
          </div>
          
          <div className="relative z-10">
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md mb-8 border border-white/20">
              <Building2 className="text-blue-400" size={24} />
            </div>
            
            <h1 className="text-3xl font-bold mb-4 tracking-tight">Admin<br />Registration</h1>
            <p className="text-slate-400 text-sm leading-relaxed mb-8">
              Welcome to the Faith Healing Bible Church platform. You have been invited to join the administration team.
            </p>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Shield size={14} className="text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Requested Role</p>
                  <p className="text-sm font-medium capitalize">{inviteData?.role === 'district' ? 'District Overseer' : 'Branch Admin'}</p>
                </div>
              </div>
              {inviteData?.location && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <Map size={14} className="text-purple-400" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Assignment</p>
                    <p className="text-sm font-medium">{inviteData?.branchId ? 'Branch level' : 'District level'}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="relative z-10 mt-12 text-xs text-slate-500 font-medium">
            &copy; {new Date().getFullYear()} Faith Healing Bible Church. All rights reserved.
          </div>
        </div>

        {/* Right Column - Form */}
        <div className="w-full md:w-2/3 p-8 md:p-12">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Create Your Account</h2>
            <p className="text-slate-500 text-sm">Please provide your details to set up your administrator credentials.</p>
          </div>

          {submitError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
              <AlertTriangle className="text-red-500 mt-0.5 flex-shrink-0" size={18} />
              <p className="text-sm text-red-800">{submitError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="relative">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Full legal name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    required
                    value={formData.fullName}
                    onChange={e => setFormData({...formData, fullName: e.target.value})}
                    placeholder="John Doe" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="email" 
                      required
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                      placeholder="john@example.com" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all" 
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1.5 ml-1">This will be your login username.</p>
                </div>
                <div className="relative">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="tel" 
                      required
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                      placeholder="+1 (555) 000-0000" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all" 
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Set Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="password" 
                      required
                      value={formData.password}
                      onChange={e => setFormData({...formData, password: e.target.value})}
                      placeholder="••••••••" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all" 
                    />
                  </div>
                </div>
                <div className="relative">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="password" 
                      required
                      value={formData.confirmPassword}
                      onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                      placeholder="••••••••" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all" 
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button 
                type="submit" 
                disabled={submitting}
                className="w-full bg-blue-600 text-white rounded-xl py-4 font-bold text-sm shadow-xl shadow-blue-600/20 hover:bg-blue-700 hover:shadow-blue-600/30 transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Creating Account...
                  </>
                ) : (
                  <>
                    Submit Registration
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
            
            <p className="text-center text-xs text-slate-400">
              By registering, you agree to our Terms of Service and Privacy Policy. Your account will undergo a security review prior to activation.
            </p>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
