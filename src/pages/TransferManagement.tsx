import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, collectionGroup, where, getDocs, doc, updateDoc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useFirebase } from '../components/FirebaseProvider';
import { 
  ArrowLeftRight, 
  Plus, 
  Search, 
  Filter, 
  ChevronRight,
  CheckCircle2,
  Clock,
  Building2,
  User,
  ArrowRight,
  X,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface TransferRequest {
  id: string;
  memberId: string;
  memberName: string;
  fromBranchId: string;
  fromBranchName: string;
  fromDistrictId: string;
  toBranchId: string;
  toBranchName: string;
  toDistrictId: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedBy: string;
  requestedAt: any;
}

interface Member {
  id: string;
  fullName: string;
  branchId: string;
  districtId: string;
}

interface Branch {
  id: string;
  name: string;
  districtId: string;
}

interface District {
  id: string;
  name: string;
}

export default function TransferManagement() {
  const { profile } = useFirebase();
  const [transfers, setTransfers] = useState<TransferRequest[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    memberId: '',
    toDistrictId: '',
    toBranchId: '',
    reason: ''
  });

  useEffect(() => {
    if (!profile) return;

    // Listen to transfers
    // District leaders and branch admins should only see relevant transfers
    const transfersRef = collection(db, 'transfers');
    const transferConstraints = [];
    if (profile.role !== 'superadmin') {
      transferConstraints.push(where('fromDistrictId', '==', profile.districtId));
    }
    const q = query(transfersRef, ...transferConstraints, orderBy('requestedAt', 'desc'));
    
    const unsubscribeTransfers = onSnapshot(q, (snapshot) => {
      const results: TransferRequest[] = [];
      snapshot.forEach(doc => {
        results.push({ id: doc.id, ...doc.data() } as TransferRequest);
      });
      setTransfers(results);
    }, (error) => {
      console.error("Transfers snapshot error:", error);
      handleFirestoreError(error, OperationType.LIST, 'transfers');
    });

    // Fetch members (Collection Group) - Filter by district for performance and permissions
    const fetchMembers = async () => {
      try {
        const memberConstraints = [];
        if (profile.role !== 'superadmin') {
          memberConstraints.push(where('districtId', '==', profile.districtId));
        }
        const q = query(collectionGroup(db, 'members'), ...memberConstraints);
        const snapshot = await getDocs(q);
        const results: Member[] = [];
        snapshot.forEach(doc => {
          results.push({ id: doc.id, ...doc.data() } as Member);
        });
        setMembers(results);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'members');
      }
    };

    // Fetch districts
    const fetchDistricts = async () => {
      try {
        const q = query(collection(db, 'districts'));
        const snapshot = await getDocs(q);
        const results: District[] = [];
        snapshot.forEach(doc => {
          results.push({ id: doc.id, ...doc.data() } as District);
        });
        setDistricts(results);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'districts');
      }
    };

    // Fetch all branches (Collection Group)
    const fetchBranches = async () => {
      try {
        const branchConstraints = [];
        if (profile.role !== 'superadmin') {
          branchConstraints.push(where('districtId', '==', profile.districtId));
        }
        const q = query(collectionGroup(db, 'branches'), ...branchConstraints);
        const snapshot = await getDocs(q);
        const results: Branch[] = [];
        snapshot.forEach(doc => {
          results.push({ id: doc.id, ...doc.data() } as Branch);
        });
        setBranches(results);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'branches');
      }
    };

    fetchMembers();
    fetchDistricts();
    fetchBranches();

    return () => unsubscribeTransfers();
  }, [profile]);

  const handleInitiateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !formData.memberId || !formData.toBranchId) return;

    setSaving(true);
    try {
      const member = members.find(m => m.id === formData.memberId);
      const toBranch = branches.find(b => b.id === formData.toBranchId);
      const toDistrict = districts.find(d => d.id === formData.toDistrictId);
      
      // Get 'from' details
      const fromBranch = branches.find(b => b.id === member?.branchId);
      
      const transferData = {
        memberId: formData.memberId,
        memberName: member?.fullName,
        fromBranchId: member?.branchId,
        fromBranchName: fromBranch?.name || 'Unknown',
        fromDistrictId: member?.districtId,
        toBranchId: formData.toBranchId,
        toBranchName: toBranch?.name || 'Unknown',
        toDistrictId: formData.toDistrictId,
        reason: formData.reason,
        status: 'pending',
        requestedBy: profile.uid,
        requestedAt: serverTimestamp()
      };

      await addDoc(collection(db, 'transfers'), transferData);
      setIsModalOpen(false);
      setFormData({ memberId: '', toDistrictId: '', toBranchId: '', reason: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'transfers');
    } finally {
      setSaving(false);
    }
  };

  const pendingRequests = transfers.filter(t => t.status === 'pending');
  const completedHistory = transfers.filter(t => t.status !== 'pending');

  const filteredMembers = members.filter(m => 
    m.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedMember = members.find(m => m.id === formData.memberId);
  const currentBranch = branches.find(b => b.id === selectedMember?.branchId);
  const currentDistrict = districts.find(d => d.id === selectedMember?.districtId);
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <button 
            onClick={() => window.history.length > 1 ? window.history.back() : window.location.href = '/'}
            className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-blue-600 mb-2 transition-colors"
          >
            <ChevronRight size={16} className="rotate-180" />
            Back
          </button>
          <h2 className="text-2xl font-bold text-slate-900">Transfer Management</h2>
          <p className="text-slate-500 text-sm">Manage member transfer requests between branches and districts.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
          >
            <Plus size={18} />
            Initiate Transfer
          </button>
        </div>
      </div>

      {/* Transfer Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label="Pending Requests" value={pendingRequests.length.toString()} icon={<Clock className="text-orange-600" size={20} />} trend="Awaiting approval" />
        <StatCard label="Completed History" value={completedHistory.length.toString()} icon={<CheckCircle2 className="text-emerald-600" size={20} />} trend="Lifetime transfers" />
        <StatCard label="Available Branches" value={branches.length.toString()} icon={<Building2 className="text-blue-600" size={20} />} trend="Cross-district" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Approval Queue */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900">Approval Queue</h3>
            </div>
            <div className="divide-y divide-slate-50">
              {pendingRequests.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Clock size={24} className="text-slate-300" />
                  </div>
                  <p className="text-slate-500 font-medium">No pending transfers</p>
                </div>
              ) : (
                pendingRequests.map(req => (
                  <TransferRequestItem 
                    key={req.id}
                    request={req}
                  />
                ))
              )}
            </div>
          </div>

          {/* Transfer History */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">Recent History</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Member</th>
                    <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Requested At</th>
                    <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Route</th>
                    <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {completedHistory.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-slate-400 text-sm italic">
                        No transfer history found
                      </td>
                    </tr>
                  ) : (
                    completedHistory.map(row => (
                      <HistoryRow 
                        key={row.id}
                        member={row.memberName} 
                        date={row.requestedAt?.toDate ? row.requestedAt.toDate().toLocaleDateString() : 'N/A'}
                        from={row.fromBranchName} 
                        to={row.toBranchName} 
                        status={row.status} 
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Transfer Guidelines Sidebar */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <ArrowLeftRight size={16} className="text-blue-600" />
              Transfer Policy
            </h3>
            <ul className="space-y-3">
              <PolicyItem text="Requests must be approved by both sending and receiving branch admins." />
              <PolicyItem text="Member records are automatically synced upon final approval." />
              <PolicyItem text="District leaders must review cross-district transfers." />
              <PolicyItem text="Financial records remain at the original branch for the current fiscal year." />
            </ul>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Initiate Transfer</h3>
                  <p className="text-xs text-slate-500">Request a member move to a different branch.</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg text-slate-400"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleInitiateTransfer} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Member Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      type="text"
                      placeholder="Search members by name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                    />
                  </div>
                  {searchTerm && (
                    <div className="mt-2 max-h-40 overflow-y-auto border border-slate-100 rounded-xl divide-y divide-slate-50 bg-white shadow-sm">
                      {filteredMembers.map(m => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, memberId: m.id });
                            setSearchTerm('');
                          }}
                          className="w-full text-left px-4 py-3 text-sm hover:bg-blue-50 flex items-center justify-between group"
                        >
                          <span className="font-medium text-slate-700">{m.fullName}</span>
                          <span className="text-[10px] text-slate-400 group-hover:text-blue-600">Select Member</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {selectedMember && (
                  <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 flex items-center gap-3">
                    <User className="text-blue-600" size={18} />
                    <div>
                      <p className="text-xs font-bold text-blue-900">{selectedMember.fullName}</p>
                      <p className="text-[10px] text-blue-700">Currently at: {currentBranch?.name} ({currentDistrict?.name})</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Target District</label>
                    <select
                      required
                      value={formData.toDistrictId}
                      onChange={(e) => setFormData({ ...formData, toDistrictId: e.target.value, toBranchId: '' })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                    >
                      <option value="">Select District</option>
                      {districts.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Target Branch</label>
                    <select
                      required
                      value={formData.toBranchId}
                      onChange={(e) => setFormData({ ...formData, toBranchId: e.target.value })}
                      disabled={!formData.toDistrictId}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-600 outline-none disabled:opacity-50"
                    >
                      <option value="">Select Branch</option>
                      {branches
                        .filter(b => b.districtId === formData.toDistrictId)
                        .map(b => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))
                      }
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Transfer Reason</label>
                  <textarea
                    required
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    placeholder="Briefly explain why this transfer is necessary..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-600 outline-none h-24 resize-none"
                  />
                </div>

                <div className="p-4 bg-orange-50 rounded-xl border border-orange-100 flex gap-3">
                  <AlertCircle className="text-orange-600 flex-shrink-0" size={18} />
                  <p className="text-[10px] text-orange-800 leading-relaxed">
                    Once submitted, this request will appear in the queue for the target branch and district leadership to review. The member will not be moved until approved.
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving || !formData.memberId || !formData.toBranchId}
                    className="flex text-center justify-center items-center gap-2 flex-2 bg-blue-600 text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/20"
                  >
                    {saving && <Loader2 className="animate-spin" size={16} />}
                    {saving ? 'Initiating...' : 'Submit Request'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}


const StatCard: React.FC<{ label: string, value: string, icon: React.ReactNode, trend: string }> = ({ label, value, icon, trend }) => {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-slate-50 rounded-lg">
          {icon}
        </div>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{trend}</span>
      </div>
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{label}</p>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
      </div>
    </div>
  );
}


const TransferRequestItem: React.FC<{ request: TransferRequest }> = ({ request }) => {
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleAction = async (newStatus: 'approved' | 'rejected', request: TransferRequest) => {
    setProcessingId(request.id);
    try {
      if (newStatus === 'approved') {
        // 1. Get member data from source
        const sourcePath = `/districts/${request.fromDistrictId}/branches/${request.fromBranchId}/members/${request.memberId}`;
        const memberSnap = await getDoc(doc(db, sourcePath));
        
        if (!memberSnap.exists()) {
          throw new Error("Source member record not found.");
        }
        
        const memberData = memberSnap.data();
        
        // 2. Create in target
        const targetPath = `/districts/${request.toDistrictId}/branches/${request.toBranchId}/members/${request.memberId}`;
        await setDoc(doc(db, targetPath), {
          ...memberData,
          branchId: request.toBranchId,
          districtId: request.toDistrictId,
          updatedAt: serverTimestamp()
        });
        
        // 3. Delete from source
        await deleteDoc(doc(db, sourcePath));

        // 4. If the user has accessControl, update that too
        const emailLower = memberData.email?.toLowerCase();
        if (emailLower) {
          const accessDoc = await getDoc(doc(db, 'accessControl', emailLower));
          if (accessDoc.exists()) {
            await updateDoc(doc(db, 'accessControl', emailLower), {
              branchId: request.toBranchId,
              districtId: request.toDistrictId
            });
          }
        }
      }

      await updateDoc(doc(db, 'transfers', request.id), {
        status: newStatus,
        resolvedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'transfers');
    }
  };

  return (
    <div className="px-6 py-4 hover:bg-slate-50 transition-colors group">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-sm">
            {request.memberName.charAt(0)}
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{request.memberName}</h4>
            <p className="text-xs text-slate-500 mt-0.5">{request.reason}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-slate-400 flex items-center gap-1 justify-end">
            <Clock size={10} />
            {request.requestedAt?.toDate ? request.requestedAt.toDate().toLocaleDateString() : 'Just now'}
          </p>
          <div className="flex gap-2 mt-2">
            <button 
              disabled={processingId === request.id}
              onClick={() => handleAction('approved', request)}
              className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-100 transition-colors disabled:opacity-50 flex items-center gap-1"
            >
              {processingId === request.id && <Loader2 size={10} className="animate-spin" />}
              Approve
            </button>
            <button 
              disabled={processingId === request.id}
              onClick={() => handleAction('rejected', request)}
              className="text-[10px] font-bold text-red-600 hover:text-red-700 bg-red-50 px-2 py-1 rounded border border-red-100 transition-colors disabled:opacity-50 flex items-center gap-1"
            >
              {processingId === request.id && <Loader2 size={10} className="animate-spin" />}
              Reject
            </button>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg border border-slate-100">
        <div className="flex-1 text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase">From</p>
          <p className="text-xs font-semibold text-slate-700">{request.fromBranchName}</p>
        </div>
        <ArrowRight size={14} className="text-slate-300" />
        <div className="flex-1 text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase">To</p>
          <p className="text-xs font-semibold text-slate-700">{request.toBranchName}</p>
        </div>
      </div>
    </div>
  );
}

const HistoryRow: React.FC<{ member: string; date: string; from: string; to: string; status: string }> = ({ member, date, from, to, status }) => {
  const statusClasses = {
    approved: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    pending: 'text-orange-600 bg-orange-50 border-orange-100',
    rejected: 'text-red-600 bg-red-50 border-red-100'
  };

  return (
    <tr className="hover:bg-slate-50 transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <User size={14} className="text-slate-400" />
          <span className="text-sm font-semibold text-slate-800">{member}</span>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Clock size={12} className="text-slate-400" />
          <span>{date}</span>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>{from}</span>
          <ArrowRight size={10} />
          <span>{to}</span>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className={`text-[10px] font-bold uppercase border px-2 py-1 rounded ${statusClasses[status as keyof typeof statusClasses]}`}>
          {status}
        </span>
      </td>
    </tr>
  );
}

const PolicyItem: React.FC<{ text: string }> = ({ text }) => {
  return (
    <li className="flex gap-2 text-xs text-slate-600 leading-relaxed">
      <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 flex-shrink-0"></div>
      {text}
    </li>
  );
}
