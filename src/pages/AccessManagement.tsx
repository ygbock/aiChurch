import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Shield, Plus, X, Search, Trash2, Mail, CheckCircle2 } from 'lucide-react';
import { db } from '../lib/firebase';
import { useFirebase } from '../components/FirebaseProvider';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';

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

      // 1. Create access record
      await setDoc(doc(db, 'accessControl', emailLower), payload);
      
      // 2. Mark request as approved
      await setDoc(doc(db, 'adminRequests', request.id), {
        ...request,
        status: 'approved',
        approvedAt: new Date().toISOString()
      });

      alert(`Access approved for ${request.fullName}`);
    } catch (error) {
      console.error('Failed to approve request', error);
      alert('Failed to approve request.');
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
      
      let payload: any = {
        email: emailLower,
        role: newRole,
        grantedAt: new Date().toISOString(),
        grantedBy: profile?.uid
      };

      if (newRole === 'admin' || newRole === 'member') {
        payload.districtId = profile?.role === 'district' ? profile.districtId : newDistrictId;
      }
      if (newRole === 'member') {
        payload.branchId = profile?.role === 'admin' ? profile.branchId : newBranchId;
      }

      await setDoc(doc(db, 'accessControl', emailLower), payload);
      setShowModal(false);
      setNewEmail('');
      setSaving(false);
    } catch (error) {
      console.error('Failed to grant access', error);
      alert('Failed to grant access. Please check your administrative permissions.');
      setSaving(false);
    }
  };

  const handleRevokeAccess = async (email: string) => {
    if (confirm(`Are you sure you want to revoke access for ${email}?`)) {
      try {
        await deleteDoc(doc(db, 'accessControl', email));
      } catch (error) {
        console.error('Failed to revoke access', error);
        alert('Failed to revoke access.');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Shield size={18} className="text-blue-600" />
            Provisioned Access
          </h3>
          <p className="text-sm text-slate-500 mt-1">Manage which emails are allowed to register and their respective roles.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors shadow-sm"
        >
          <Plus size={16} />
          Provision User
        </button>
      </div>

      {requests.length > 0 && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-blue-100 bg-blue-100/50 flex items-center justify-between">
            <h4 className="text-sm font-bold text-blue-900 flex items-center gap-2">
              <Plus className="text-blue-600" size={16} />
              Pending Admin Requests ({requests.length})
            </h4>
            <span className="text-[10px] font-bold text-blue-700 bg-blue-200/50 px-2 py-0.5 rounded uppercase">Needs Approval</span>
          </div>
          <ul className="divide-y divide-blue-100">
            {requests.map((request) => (
              <li key={request.id} className="p-4 flex items-center justify-between hover:bg-blue-100/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-white text-blue-600 flex items-center justify-center border border-blue-200 shadow-sm">
                    <Shield size={16} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-blue-900">{request.fullName}</h4>
                    <p className="text-xs text-blue-700">{request.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-white border border-blue-200 px-2 py-0.5 rounded">
                        Requested: {request.role}
                      </span>
                      {request.districtId && <span className="text-[10px] text-blue-600/70">District: {request.districtId}</span>}
                      {request.branchId && <span className="text-[10px] text-blue-600/70">&bull; Branch: {request.branchId}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleRejectRequest(request.id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-100 rounded-lg transition-all"
                    title="Reject Request"
                  >
                    <X size={18} />
                  </button>
                  <button 
                    onClick={() => handleApproveRequest(request)}
                    className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-all flex items-center gap-2 shadow-sm"
                  >
                    <CheckCircle2 size={16} />
                    Approve
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search by email..." 
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 justify-start rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm font-medium">Loading provisioned users...</div>
        ) : accessList.length === 0 ? (
          <div className="p-12 pl-12 pr-12 text-center flex flex-col justify-center items-center">
             <Shield className="text-slate-200 mb-4 h-12 w-12" />
             <p className="text-slate-500 text-sm font-medium">No provisioned users found.</p>
             <p className="text-slate-400 text-xs mt-1">Users added here will be able to log in securely.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {accessList.map((access) => (
              <li key={access.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Mail size={16} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{access.id}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded text-blue-600 bg-blue-50">
                        {access.role}
                      </span>
                      {access.status && (
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                          access.status === 'pre-authorized' 
                            ? 'text-orange-600 bg-orange-50 border border-orange-100' 
                            : 'text-emerald-600 bg-emerald-50 border border-emerald-100'
                        }`}>
                          {access.status}
                        </span>
                      )}
                      {access.districtId && <span className="text-[10px] text-slate-400">District: {access.districtId}</span>}
                      {access.branchId && <span className="text-[10px] text-slate-400">&bull; Branch: {access.branchId}</span>}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => handleRevokeAccess(access.id)}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative"
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900">Provision Login Access</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleGrantAccess} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">User's Google Email</label>
                <input 
                  type="email" 
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Granted Role</label>
                <select 
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-600 bg-white"
                >
                  <option value="member">Church Member / Volunteer</option>
                  {(profile?.role === 'superadmin' || profile?.role === 'district') && (
                    <option value="admin">Branch Admin</option>
                  )}
                  {profile?.role === 'superadmin' && (
                    <option value="district">District Leader</option>
                  )}
                </select>
              </div>

              {(newRole === 'admin' || newRole === 'member') && profile?.role === 'superadmin' && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">District ID</label>
                  <input 
                    type="text" 
                    value={newDistrictId}
                    onChange={(e) => setNewDistrictId(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-600"
                    placeholder="Enter district ID"
                    required
                  />
                </div>
              )}

              {newRole === 'member' && (profile?.role === 'superadmin' || profile?.role === 'district') && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Branch ID</label>
                  <input 
                    type="text" 
                    value={newBranchId}
                    onChange={(e) => setNewBranchId(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-600"
                    placeholder="Enter branch ID"
                    required
                  />
                </div>
              )}

              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={saving}
                  className="px-6 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm disabled:opacity-50"
                >
                  {saving ? 'Creating Access...' : 'Grant Access'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
