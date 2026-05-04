import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Shield, 
  Plus, 
  X, 
  Search, 
  Trash2, 
  Mail, 
  CheckCircle2, 
  Sparkles,
  ArrowRight,
  ShieldCheck,
  UserPlus,
  ArrowUpRight,
  Fingerprint,
  Lock,
  Ghost,
  Clock
} from 'lucide-react';
import { db } from '../lib/firebase';
import { useFirebase } from '../components/FirebaseProvider';
import { collection, onSnapshot, doc, setDoc, deleteDoc, where } from 'firebase/firestore';

export default function AccessManagement() {
  const { profile } = useFirebase();
  const [accessList, setAccessList] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('member');
  const [newDistrictId, setNewDistrictId] = useState('');
  const [newBranchId, setNewBranchId] = useState('');
  const [saving, setSaving] = useState(false);
  
  useEffect(() => {
    // Listen to accessControl
    const unsubscribeAccess = onSnapshot(collection(db, 'accessControl'), (snapshot) => {
      const results: any[] = [];
      snapshot.forEach((doc) => {
        results.push({ id: doc.id, ...doc.data() });
      });
      setAccessList(results);
      if (!requests.length) setLoading(false);
    }, (error) => {
      console.warn('Failed to load access list:', error);
    });

    // Listen to pending admin requests
    const unsubscribeRequests = onSnapshot(collection(db, 'adminRequests'), (snapshot) => {
      const results: any[] = [];
      snapshot.forEach((doc) => {
        results.push({ id: doc.id, ...doc.data() });
      });
      setRequests(results.filter(r => r.status === 'pending_approval'));
      setLoading(false);
    }, (error) => {
      console.warn('Failed to load admin requests:', error);
    });

    return () => {
      unsubscribeAccess();
      unsubscribeRequests();
    };
  }, [profile]);

  const handleApproveRequest = async (request: any) => {
    try {
      setSaving(true);
      const emailLower = request.email.toLowerCase().trim();
      
      const payload = {
        email: emailLower,
        role: request.role,
        uid: request.uid,
        districtId: request.districtId || null,
        branchId: request.branchId || null,
        grantedAt: new Date().toISOString(),
        grantedBy: profile?.uid
      };

      await setDoc(doc(db, 'accessControl', emailLower), payload);
      
      await setDoc(doc(db, 'adminRequests', request.id), {
        ...request,
        status: 'approved',
        approvedAt: new Date().toISOString()
      });

    } catch (error) {
      console.error('Failed to approve request', error);
    } finally {
      setSaving(false);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    if (confirm('Are you sure you want to reject this request?')) {
      try {
        await deleteDoc(doc(db, 'adminRequests', requestId));
      } catch (error) {
        console.error('Failed to reject request', error);
      }
    }
  };

  const handleGrantAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail) return;
    try {
      setSaving(true);
      const emailLower = newEmail.toLowerCase().trim();
      const grantedRole = newRole;
      
      let payload: any = {
        email: emailLower,
        role: grantedRole,
        grantedAt: new Date().toISOString(),
        grantedBy: profile?.uid
      };

      const finalDistrictId = profile?.role === 'district' ? profile.districtId : newDistrictId;
      const finalBranchId = profile?.role === 'admin' ? profile.branchId : newBranchId;

      if (grantedRole === 'admin' || grantedRole === 'member') {
        payload.districtId = finalDistrictId;
      }
      if (grantedRole === 'member' || grantedRole === 'admin') {
        payload.branchId = finalBranchId;
      }

      await setDoc(doc(db, 'accessControl', emailLower), payload);

      // Opportunistically create a member record so they appear in People Management immediately
      if (finalDistrictId && finalBranchId) {
        const { query, collectionGroup, getDocs, serverTimestamp, collection } = await import('firebase/firestore');
        const mQuery = query(collectionGroup(db, 'members'), where('email', '==', emailLower));
        const mSnap = await getDocs(mQuery);
        
        if (mSnap.empty) {
          const memberRef = doc(collection(db, 'districts', finalDistrictId, 'branches', finalBranchId, 'members'));
          await setDoc(memberRef, {
            email: emailLower,
            fullName: emailLower.split('@')[0], // placeholder name
            role: grantedRole,
            level: 'Worker',
            districtId: finalDistrictId,
            branchId: finalBranchId,
            status: 'Active',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        }
      }

      setShowModal(false);
      setNewEmail('');
      setSaving(false);
    } catch (error) {
      console.error('Failed to grant access', error);
      setSaving(false);
    }
  };

  const handleRevokeAccess = async (email: string) => {
    if (confirm(`Are you sure you want to revoke access for ${email}?`)) {
      try {
        await deleteDoc(doc(db, 'accessControl', email));
      } catch (error) {
        console.error('Failed to revoke access', error);
      }
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-10 pb-12"
    >
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
           <div className="flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full w-fit mb-4">
             <ShieldCheck size={14} />
             <span className="text-[10px] font-black uppercase tracking-widest">Security & RBAC</span>
           </div>
           <h2 className="text-4xl font-black text-slate-900 tracking-tight">Access Management</h2>
           <p className="text-slate-500 font-medium mt-1">
             Provision logins, manage permissions, and audit system entry points.
           </p>
        </div>
        <div className="flex gap-3 w-full lg:w-auto">
          <button 
            onClick={() => setShowModal(true)}
            className="flex-1 lg:flex-none px-8 py-3 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95"
          >
            <UserPlus size={18} />
            Provision User
          </button>
        </div>
      </div>

      {/* Modern Stats Layer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ModernAccessStat label="Provisioned Users" value={accessList.length.toString()} icon={<Fingerprint />} color="blue" />
        <ModernAccessStat label="Avg Approval Time" value="4.2h" icon={<Clock />} color="emerald" />
        <ModernAccessStat label="Security Level" value="High" icon={<Lock />} color="amber" />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Core List */}
        <div className="lg:col-span-2 space-y-8">
           <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm flex flex-col min-h-[500px]">
              <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/30 flex justify-between items-center">
                 <div>
                    <h3 className="text-xl font-bold text-slate-900">Authorized Personnel</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Registry of Approved Consoles</p>
                 </div>
                 <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input 
                      type="text" 
                      placeholder="Filter directory..." 
                      className="bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-100 transition-all font-mono"
                    />
                 </div>
              </div>

              {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-400">
                   <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4" />
                   <span className="text-xs font-black uppercase tracking-widest">Decoding Registry...</span>
                </div>
              ) : accessList.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-300">
                   <Ghost size={64} strokeWidth={1} className="mb-4 opacity-20" />
                   <p className="text-sm font-bold uppercase tracking-widest">No Active Authorizations</p>
                </div>
              ) : (
                <div className="flex-1 divide-y divide-slate-50">
                   {accessList.map((access) => (
                      <ModernAccessItem 
                        key={access.id} 
                        access={access} 
                        onRevoke={handleRevokeAccess} 
                      />
                   ))}
                </div>
              )}

              <div className="px-8 py-4 bg-slate-50 border-t border-slate-100">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                    System utilizes Google OAuth 2.0 for all entry points.
                 </p>
              </div>
           </div>
        </div>

        {/* Action Sidebar */}
        <div className="space-y-6">
           {/* Approval Queue */}
           <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/30 flex justify-between items-center">
                 <div>
                    <h3 className="text-lg font-bold text-slate-900">Queue</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Pending Gatekeeper</p>
                 </div>
                 {requests.length > 0 && (
                    <span className="px-2 py-1 bg-indigo-600 text-white rounded-lg text-[10px] font-black font-mono">
                       {requests.length}
                    </span>
                 )}
              </div>

              <div className="p-6 space-y-6">
                 {requests.length === 0 ? (
                    <div className="py-8 text-center">
                       <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No Incoming Requests</p>
                    </div>
                 ) : (
                    requests.map((request) => (
                       <ModernPendingRequest 
                          key={request.id}
                          request={request}
                          onApprove={handleApproveRequest}
                          onReject={handleRejectRequest}
                       />
                    ))
                 )}
              </div>
           </div>

           {/* Security Banner */}
           <div className="bg-gradient-to-br from-slate-800 to-slate-950 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
              <div className="relative z-10">
                 <Sparkles className="mb-6 text-indigo-400" size={24} />
                 <h4 className="text-xl font-bold mb-2">IAM Compliance</h4>
                 <p className="text-slate-400 text-sm font-medium mb-8 leading-relaxed">
                    Identity and Access Management policies are enforced globally. Ensure roles are assigned strictly on a need-to-know basis.
                 </p>
                 <button className="w-full py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                    Policy Documentation
                    <ArrowRight size={14} />
                 </button>
              </div>
           </div>
        </div>
      </div>

      {/* Provisioning Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100"
          >
            <div className="px-10 py-8 border-b border-slate-50 flex items-center justify-between">
              <div>
                 <h3 className="text-2xl font-black text-slate-900 tracking-tight">Provision Console</h3>
                 <p className="text-xs font-medium text-slate-400 mt-1">Authorize a new system stakeholder.</p>
              </div>
              <button onClick={() => setShowModal(false)} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-rose-600 transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleGrantAccess} className="p-10 space-y-6">
              <div className="space-y-4">
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Stakeholder Email</label>
                   <input 
                     type="email" 
                     value={newEmail}
                     onChange={(e) => setNewEmail(e.target.value)}
                     placeholder="stakeholder@ministry.org"
                     className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-indigo-100 outline-none transition-all placeholder:text-slate-300 font-mono"
                     required
                   />
                 </div>

                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Access Protocol (Role)</label>
                   <select 
                     value={newRole}
                     onChange={(e) => setNewRole(e.target.value)}
                     className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-indigo-100 outline-none transition-all appearance-none"
                   >
                     <option value="member">Church Member / Volunteer</option>
                     {(profile?.role === 'superadmin' || profile?.role === 'district') && (
                       <option value="admin">Branch Administrator</option>
                     )}
                     {profile?.role === 'superadmin' && (
                       <option value="district">District Overseer</option>
                     )}
                   </select>
                 </div>

                  {(newRole === 'admin' || newRole === 'member') && profile?.role === 'superadmin' && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Assigned District</label>
                      <input 
                        type="text" 
                        value={newDistrictId}
                        onChange={(e) => setNewDistrictId(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-indigo-100 outline-none transition-all font-mono"
                        placeholder="NA-DIST-01"
                        required
                      />
                    </div>
                 )}

                 {(newRole === 'member' || newRole === 'admin') && (profile?.role === 'superadmin' || profile?.role === 'district') && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Assigned Branch</label>
                      <input 
                        type="text" 
                        value={newBranchId}
                        onChange={(e) => setNewBranchId(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-indigo-100 outline-none transition-all font-mono"
                        placeholder="PHASE-6-MAIN"
                        required
                      />
                    </div>
                 )}
              </div>

              <div className="pt-6 flex gap-4">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:bg-slate-50 rounded-2xl transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={saving}
                  className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 disabled:opacity-50"
                >
                  {saving ? 'Validating...' : 'Authorize Entry'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

function ModernAccessStat({ label, value, icon, color }: any) {
  const themes: any = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600' }
  };
  const theme = themes[color];

  return (
    <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-all group-hover:scale-110 ${theme.bg} ${theme.text}`}>
         {React.cloneElement(icon, { size: 24 })}
      </div>
      <div>
         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
         <div className="flex items-baseline gap-2">
            <h4 className="text-3xl font-black text-slate-900 tracking-tight">{value}</h4>
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1">
               <ArrowUpRight size={12} />
               Active
            </span>
         </div>
      </div>
    </div>
  );
}

function ModernAccessItem({ access, onRevoke }: any) {
  return (
    <div className="px-8 py-5 hover:bg-slate-50/50 transition-all group flex items-center justify-between">
       <div className="flex items-center gap-5">
          <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 group-hover:border-indigo-100 shadow-sm transition-all">
             <Mail size={18} />
          </div>
          <div>
             <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors font-mono tracking-tight">{access.id}</h4>
             <div className="flex items-center gap-3 mt-1">
                <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase tracking-widest">{access.role}</span>
                {access.status && (
                   <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{access.status}</span>
                )}
                {access.branchId && (
                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">&bull; {access.branchId}</span>
                )}
             </div>
          </div>
       </div>

       <button 
          onClick={() => onRevoke(access.id)}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-all"
       >
          <Trash2 size={18} />
       </button>
    </div>
  );
}

function ModernPendingRequest({ request, onApprove, onReject }: any) {
  return (
    <div className="flex gap-4 group">
       <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-lg shadow-sm">
          {request.fullName.charAt(0)}
       </div>
       <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-slate-900 truncate">{request.fullName}</h4>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 font-mono">{request.email}</p>
          <div className="flex items-center gap-2 mt-2">
             <span className="text-[9px] font-black text-indigo-600 border border-indigo-100 px-2 py-1 rounded-lg uppercase tracking-widest">
                REQ: {request.role}
             </span>
          </div>
          <div className="flex gap-3 mt-4">
             <button 
                onClick={() => onApprove(request)}
                className="flex-1 py-1.5 bg-indigo-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
             >
                Approve
             </button>
             <button 
                onClick={() => onReject(request.id)}
                className="py-1.5 px-3 bg-slate-50 text-slate-400 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-rose-50 hover:text-rose-600 transition-all"
             >
                 Reject
             </button>
          </div>
       </div>
    </div>
  );
}
