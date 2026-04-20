import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Map, 
  Building2, 
  Users, 
  TrendingUp, 
  ChevronRight,
  ArrowUpRight,
  Activity,
  ArrowLeftRight,
  BarChart3,
  Search,
  Filter,
  Plus,
  UserPlus,
  Edit2,
  Trash2,
  Settings,
  Calendar,
  CreditCard,
  FileText,
  Bell,
  CheckCircle2,
  Clock,
  Shield,
  Mail,
  Phone,
  Trash,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import Modal from '../components/Modal';
import { useFirebase } from '../components/FirebaseProvider';
import { collection, addDoc, onSnapshot, doc, setDoc, query, orderBy, updateDoc, deleteDoc, where, limit, collectionGroup, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Cell,
  CartesianGrid
} from 'recharts';

const mockPerformanceData = [
  { name: 'Jan', members: 400 },
  { name: 'Feb', members: 600 },
  { name: 'Mar', members: 800 },
  { name: 'Apr', members: 750 },
  { name: 'May', members: 900 },
  { name: 'Jun', members: 1100 },
];

const mockActivities = [
  { id: 1, type: 'member', text: 'New member registered in Westside branch', time: '2h ago' },
  { id: 2, type: 'leader', text: 'Admin access granted for South Valley', time: '5h ago' },
  { id: 3, type: 'branch', text: 'Quarterly report submitted by Grace Chapel', time: '1d ago' },
  { id: 4, type: 'transfer', text: 'Transfer request approved for John Doe', time: '2d ago' },
];

interface BranchData {
  id: string;
  name: string;
  location: string;
  capacity: number;
  districtId: string;
}

interface MemberData {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  branchId: string;
  districtId?: string;
  level: string;
  status: string;
  photoUrl?: string;
  createdAt?: string;
}

export default function DistrictDashboard() {
  const navigate = useNavigate();
  const { districtId: urlDistrictId } = useParams();
  const { profile, memberProfile } = useFirebase();

  const districtId = urlDistrictId || profile?.districtId;

  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [isLeadershipModalOpen, setIsLeadershipModalOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<{id: string, name: string} | null>(null);
  
  const [branches, setBranches] = useState<BranchData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [districtData, setDistrictData] = useState<any>(null);
  const [leaders, setLeaders] = useState<any[]>([]);
  const [editingBranchId, setEditingBranchId] = useState<string | null>(null);
  const [isDistrictEditModalOpen, setIsDistrictEditModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'branches' | 'leadership' | 'members'>('overview');
  const [members, setMembers] = useState<MemberData[]>([]);
  const [memberSearchTerm, setMemberSearchTerm] = useState('');
  const [branchFilter, setBranchFilter] = useState('all');

  // Leadership Provisioning State
  const [provisionType, setProvisionType] = useState<'existing' | 'new'>('existing');
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [leaderRole, setLeaderRole] = useState('admin');
  const [leaderBranchId, setLeaderBranchId] = useState('');
  const [inviteLink, setInviteLink] = useState('');

  // Form states
  const [branchForm, setBranchForm] = useState({
    name: '',
    location: '',
    capacity: ''
  });

  const [districtForm, setDistrictForm] = useState({
    name: '',
    locationCategory: 'Local',
    country: '',
    region: '',
    city: ''
  });
  
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!districtId || !profile) return;

    // Listen to branches
    const branchesRef = collection(db, 'districts', districtId, 'branches');
    const q = query(branchesRef, orderBy('name', 'asc'));
    const unsubscribeBranches = onSnapshot(q, (snapshot) => {
      const results: BranchData[] = [];
      snapshot.forEach(doc => {
        results.push({ id: doc.id, ...doc.data() } as BranchData);
      });
      setBranches(results);
    }, (error) => {
      console.warn("Snapshot error (branches):", error);
      if (!error.message.toLowerCase().includes('permission')) {
        handleFirestoreError(error, OperationType.LIST, 'branches');
      }
    });

    // Listen to district document for realtime stats
    const districtRef = doc(db, 'districts', districtId);
    const unsubscribeDistrict = onSnapshot(districtRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setDistrictData({ id: doc.id, ...data });
        setDistrictForm({
          name: data.name || '',
          locationCategory: data.locationCategory || 'Local',
          country: data.country || '',
          region: data.region || '',
          city: data.city || ''
        });
      }
    }, (error) => {
      console.warn("Snapshot error (district):", error);
      if (!error.message.toLowerCase().includes('permission')) {
        handleFirestoreError(error, OperationType.GET, 'districts');
      }
    });

    // Listen to district leadership
    const leadersRef = collection(db, 'accessControl');
    const qLeaders = query(leadersRef, where('districtId', '==', districtId));
    const unsubscribeLeaders = onSnapshot(qLeaders, (snapshot) => {
      const results: any[] = [];
      snapshot.forEach(doc => {
        results.push({ id: doc.id, ...doc.data() });
      });
      setLeaders(results);
    }, (error) => {
      console.warn("Snapshot error (accessControl):", error);
      if (!error.message.toLowerCase().includes('permission')) {
        handleFirestoreError(error, OperationType.LIST, 'accessControl');
      }
    });

    // Listen to all members in this district
    const membersQuery = query(
      collectionGroup(db, 'members'),
      where('districtId', '==', districtId)
    );
    const unsubscribeMembers = onSnapshot(membersQuery, (snapshot) => {
      const results: MemberData[] = [];
      snapshot.forEach(doc => {
        results.push({ id: doc.id, ...doc.data() } as MemberData);
      });
      setMembers(results);
    }, (error) => {
      console.warn("Snapshot error (members):", error);
      if (!error.message.toLowerCase().includes('permission')) {
        handleFirestoreError(error, OperationType.LIST, 'members');
      }
    });

    return () => {
      unsubscribeBranches();
      unsubscribeDistrict();
      unsubscribeLeaders();
      unsubscribeMembers();
    };
  }, [districtId]);


  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!districtId) {
      alert("No District ID found. Please refresh or select a district.");
      return;
    }
    setSaving(true);
    try {
      const branchData = {
        name: branchForm.name,
        location: branchForm.location,
        capacity: parseInt(branchForm.capacity) || 0,
        districtId: districtId,
        updatedAt: serverTimestamp()
      };

      if (editingBranchId) {
        await updateDoc(doc(db, 'districts', districtId, 'branches', editingBranchId), branchData);
      } else {
        await addDoc(collection(db, 'districts', districtId, 'branches'), {
          ...branchData,
          createdAt: serverTimestamp()
        });
      }

      setIsBranchModalOpen(false);
      setEditingBranchId(null);
      setBranchForm({ name: '', location: '', capacity: '' });
    } catch (error) {
      handleFirestoreError(error, editingBranchId ? OperationType.UPDATE : OperationType.CREATE, 'branches');
    } finally {
      setSaving(false);
    }
  };

  const handleEditBranch = (branch: BranchData) => {
    setEditingBranchId(branch.id);
    setBranchForm({
      name: branch.name,
      location: branch.location || '',
      capacity: branch.capacity?.toString() || ''
    });
    setIsBranchModalOpen(true);
  };

  const handleDeleteBranch = async (branchId: string) => {
    if (!districtId || !window.confirm("Are you sure you want to delete this branch? This is permanent.")) return;
    try {
      await deleteDoc(doc(db, 'districts', districtId, 'branches', branchId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'branches');
    }
  };

  const handleUpdateDistrict = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!districtId) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'districts', districtId), {
        ...districtForm,
        updatedAt: serverTimestamp()
      });
      setIsDistrictEditModalOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'districts');
    } finally {
      setSaving(false);
    }
  };

  const handleAssignLeadership = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!districtId) return;
    
    setSaving(true);
    try {
      if (provisionType === 'existing') {
        const member = members.find(m => m.id === selectedMemberId);
        if (!member || !member.email) {
          alert('Selected member does not have an email address. Please update their profile first.');
          setSaving(false);
          return;
        }

        const emailLower = member.email.toLowerCase().trim();
        const payload = {
          email: emailLower,
          role: leaderRole,
          districtId: districtId,
          branchId: leaderBranchId || member.branchId, 
          grantedAt: serverTimestamp(),
          grantedBy: profile?.uid || 'system'
        };

        await setDoc(doc(db, 'accessControl', emailLower), payload);
        setIsLeadershipModalOpen(false);
      } else {
        // Invite New User
        const invitePayload = {
          role: leaderRole,
          districtId: districtId,
          branchId: leaderBranchId,
          requestedBy: profile?.uid || 'system',
          createdAt: serverTimestamp(),
          status: 'pending'
        };
        const docRef = await addDoc(collection(db, 'invites'), invitePayload);
        const link = `${window.location.origin}/register?invite=${docRef.id}`;
        setInviteLink(link);
      }
    } catch (error) {
      handleFirestoreError(error, provisionType === 'existing' ? OperationType.UPDATE : OperationType.CREATE, provisionType === 'existing' ? 'accessControl' : 'invites');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveLeader = async (email: string) => {
    if (!window.confirm(`Are you sure you want to revoke access for ${email}?`)) return;
    try {
      await deleteDoc(doc(db, 'accessControl', email.toLowerCase()));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'accessControl');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Profile Completion Nudge */}
      {memberProfile && memberProfile.isProfileComplete === false && (
        <motion.div 
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="bg-blue-600 rounded-2xl p-4 md:p-6 text-white shadow-xl shadow-blue-200 relative overflow-hidden"
        >
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <AlertCircle size={24} />
              </div>
              <div>
                <h3 className="font-bold text-lg">Complete Your Member Profile</h3>
                <p className="text-blue-100 text-sm">Your administrative account is ready, but your record in the member registry is incomplete.</p>
              </div>
            </div>
            <button 
              onClick={() => navigate(`/members/edit/${memberProfile.id}`)}
              className="bg-white text-blue-600 px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all flex items-center gap-2 whitespace-nowrap"
            >
              Complete Registration
              <ArrowRight size={16} />
            </button>
          </div>
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
        </motion.div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <button 
            onClick={() => window.history.length > 1 ? window.history.back() : window.location.href = '/'}
            className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-blue-600 mb-2 transition-colors"
          >
            <ChevronRight size={16} className="rotate-180" />
            Back
          </button>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-slate-900">{districtData?.name || 'District Oversight'}</h2>
            <button 
              onClick={() => setIsDistrictEditModalOpen(true)}
              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
              title="Edit District Details"
            >
              <Settings size={18} />
            </button>
          </div>
          <p className="text-slate-500 text-sm">Managing {branches.length} branches across the {districtData?.name || 'District'}.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => {
              setEditingBranchId(null);
              setBranchForm({ name: '', location: '', capacity: '' });
              setIsBranchModalOpen(true);
            }}
            className="group relative bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg shadow-slate-200"
          >
            <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
            Establish Branch
          </button>
          <button className="bg-white border border-slate-200 text-slate-700 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm hidden sm:flex">
            <FileText size={18} className="text-blue-600" />
            Generate Report
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-8">
        {[
          { id: 'overview', label: 'District Overview', icon: <BarChart3 size={18} /> },
          { id: 'branches', label: 'Branch Management', icon: <Building2 size={18} /> },
          { id: 'members', label: 'Members', icon: <Users size={18} /> },
          { id: 'leadership', label: 'Leadership', icon: <Shield size={18} /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 py-4 text-sm font-bold transition-all relative ${
              activeTab === tab.id ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.icon}
            {tab.label}
            {activeTab === tab.id && (
              <motion.div 
                layoutId="activeTabIndicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" 
              />
            )}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <>
          {/* District Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <DistrictStatCard 
              label="Total District Members" 
              value={districtData?.membersCount?.toLocaleString() || "0"} 
              trend="+12%" 
              icon={<Users className="text-blue-600" size={20} />}
            />
            <DistrictStatCard 
              label="Active Branches" 
              value={branches.length.toString()} 
              trend="Live" 
              icon={<Building2 className="text-emerald-600" size={20} />}
            />
            <DistrictStatCard 
              label="Engagement Rate" 
              value="84%" 
              trend="+2.4%" 
              icon={<Activity className="text-purple-600" size={20} />}
            />
            <DistrictStatCard 
              label="Quarterly Revenue" 
              value="$124.5k" 
              trend="Target: 105%" 
              icon={<CreditCard className="text-orange-600" size={20} />}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">District Growth Analysis</h3>
                  <p className="text-sm text-slate-500">Cumulative membership growth across all branches</p>
                </div>
                <select className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold outline-none">
                  <option>Last 6 Months</option>
                  <option>Last 12 Months</option>
                </select>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mockPerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#64748b', fontSize: 12, fontWeight: 500}} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#64748b', fontSize: 12, fontWeight: 500}}
                    />
                    <Tooltip 
                      cursor={{fill: '#f8fafc'}}
                      contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px'}}
                    />
                    <Bar dataKey="members" radius={[4, 4, 0, 0]}>
                      {mockPerformanceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === mockPerformanceData.length - 1 ? '#2563eb' : '#94a3b8'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-slate-900">Recent Activity</h3>
                  <Bell size={18} className="text-slate-400" />
                </div>
                <div className="space-y-6">
                  {mockActivities.map(activity => (
                    <div key={activity.id} className="flex gap-4">
                      <div className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${
                        activity.type === 'member' ? 'bg-blue-500' :
                        activity.type === 'leader' ? 'bg-purple-500' :
                        activity.type === 'branch' ? 'bg-emerald-500' :
                        'bg-orange-500'
                      }`} />
                      <div>
                        <p className="text-sm text-slate-700 font-medium leading-relaxed">{activity.text}</p>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-1">
                          <Clock size={10} />
                          {activity.time}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="w-full mt-6 py-2.5 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors">
                  View Full Audit Log
                </button>
              </div>

              <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden group">
                <div className="relative z-10">
                  <h4 className="text-lg font-bold mb-2">District Goals</h4>
                  <p className="text-slate-400 text-sm mb-4">You are at 85% of your quarterly expansion target.</p>
                  <div className="w-full bg-white/10 rounded-full h-2 mb-6">
                    <div className="bg-blue-500 h-2 rounded-full w-[85%]" />
                  </div>
                  <button className="flex items-center gap-2 text-xs font-bold hover:text-blue-400 transition-colors">
                    View Progress Details
                    <ArrowUpRight size={14} />
                  </button>
                </div>
                <Activity className="absolute -right-4 -bottom-4 text-white/5 w-32 h-32" />
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'branches' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-6 py-5 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Branch Performance</h3>
                <p className="text-sm text-slate-500">Live summary of all satellite locations</p>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="text" 
                    value={searchTerm} 
                    onChange={e => setSearchTerm(e.target.value)} 
                    placeholder="Search branches..." 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" 
                  />
                </div>
                <button className="p-2.5 text-slate-600 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 border border-slate-200 rounded-xl font-bold transition-all">
                  <Filter size={18} />
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Branch Details</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Region</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Growth</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {branches.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center gap-2">
                          <Building2 size={40} className="text-slate-200" />
                          <p className="text-sm font-medium">No branches established in this district yet.</p>
                          <button onClick={() => setIsBranchModalOpen(true)} className="text-blue-600 font-bold text-xs hover:underline">Create First Branch</button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    branches.filter(b => b.name.toLowerCase().includes(searchTerm.toLowerCase())).map(branch => (
                      <BranchRow 
                        key={branch.id}
                        name={branch.name} 
                        location={branch.location || 'N/A'} 
                        capacity={branch.capacity?.toString() || '0'} 
                        onEdit={() => handleEditBranch(branch)}
                        onDelete={() => handleDeleteBranch(branch.id)}
                        onAssign={() => { setSelectedBranch(branch); setIsLeadershipModalOpen(true); }} 
                        onView={() => navigate('/settings')} 
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'members' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-6 py-5 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">District Members</h3>
                <p className="text-sm text-slate-500">Complete directory of members across all branches</p>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="text" 
                    value={memberSearchTerm} 
                    onChange={e => setMemberSearchTerm(e.target.value)} 
                    placeholder="Search by name or email..." 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" 
                  />
                </div>
                <select 
                  value={branchFilter}
                  onChange={e => setBranchFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="all">All Branches</option>
                  {branches.map(branch => (
                    <option key={branch.id} value={branch.id}>{branch.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Member</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Branch</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Contact</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {members.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center gap-2">
                          <Users size={40} className="text-slate-200" />
                          <p className="text-sm font-medium">No members found in this district.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    members
                      .filter(m => {
                        const matchesSearch = m.fullName.toLowerCase().includes(memberSearchTerm.toLowerCase()) || 
                                           m.email?.toLowerCase().includes(memberSearchTerm.toLowerCase());
                        const matchesBranch = branchFilter === 'all' || m.branchId === branchFilter;
                        return matchesSearch && matchesBranch;
                      })
                      .map(member => (
                        <tr key={member.id} className="hover:bg-slate-50 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {member.photoUrl ? (
                                <img src={member.photoUrl} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-slate-100" referrerPolicy="no-referrer" />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 font-bold text-sm">
                                  {member.fullName.charAt(0)}
                                </div>
                              )}
                              <div>
                                <h4 className="text-sm font-bold text-slate-900 truncate max-w-[150px]">{member.fullName}</h4>
                                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{member.level}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-slate-600 font-medium">
                              {branches.find(b => b.id === member.branchId)?.name || 'Unknown Branch'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-1">
                              {member.email && (
                                <span className="text-xs text-slate-500 flex items-center gap-1.5">
                                  <Mail size={12} className="text-slate-400" />
                                  {member.email}
                                </span>
                              )}
                              {member.phone && (
                                <span className="text-xs text-slate-500 flex items-center gap-1.5">
                                  <Phone size={12} className="text-slate-400" />
                                  {member.phone}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest ${
                              member.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {member.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button 
                              onClick={() => navigate(`/members/edit/${member.id}`)}
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            >
                              <Edit2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'leadership' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-6 py-6 border-b border-slate-200 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Leadership Roster</h3>
                  <p className="text-sm text-slate-500">Authorized administrators and branch managers</p>
                </div>
                <button 
                  onClick={() => setIsLeadershipModalOpen(true)}
                  className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-800 transition-all"
                >
                  <UserPlus size={16} />
                  Provision Admin Access
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 p-6 gap-4">
                {leaders.map((leader) => (
                  <div key={leader.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-200 transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-blue-600 font-bold text-lg uppercase shadow-sm">
                        {leader.email.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 truncate max-w-[150px]">{leader.email}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                            leader.role === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-600'
                          }`}>
                            {leader.role}
                          </span>
                          <span className="text-[10px] text-slate-400 italic">Branch ID: {leader.branchId?.slice(0, 6)}...</span>
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleRemoveLeader(leader.email)}
                      className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-red-600 transition-opacity"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-white rounded-lg text-emerald-600 shadow-sm border border-emerald-100">
                  <Activity size={20} />
                </div>
                <h4 className="text-sm font-bold text-slate-900">Security Insights</h4>
              </div>
              <ul className="space-y-3">
                <li className="flex gap-2 text-[11px] text-slate-600">
                  <CheckCircle2 size={14} className="text-emerald-600 flex-shrink-0" />
                  All branch admins have verified emails.
                </li>
                <li className="flex gap-2 text-[11px] text-slate-600">
                  <CheckCircle2 size={14} className="text-emerald-600 flex-shrink-0" />
                  MFA enabled for 8/10 branch managers.
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <Modal 
        isOpen={isBranchModalOpen} 
        onClose={() => setIsBranchModalOpen(false)} 
        title={editingBranchId ? "Edit Branch Details" : "Establish New Branch"}
      >
        <form onSubmit={handleCreateBranch} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Branch Name</label>
            <input 
              type="text" 
              value={branchForm.name} 
              onChange={e => setBranchForm({...branchForm, name: e.target.value})} 
              placeholder="e.g. Westside Grace Chapel" 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" 
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Location/City</label>
            <input 
              type="text" 
              value={branchForm.location} 
              onChange={e => setBranchForm({...branchForm, location: e.target.value})} 
              placeholder="City, State" 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" 
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Initial Capacity</label>
            <input 
              type="number" 
              value={branchForm.capacity} 
              onChange={e => setBranchForm({...branchForm, capacity: e.target.value})} 
              placeholder="500" 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" 
            />
          </div>
          <button 
            type="submit" 
            disabled={saving} 
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all disabled:opacity-50"
          >
            {saving ? 'Saving...' : (editingBranchId ? 'Update Branch' : 'Create Branch')}
          </button>
        </form>
      </Modal>

      <Modal 
        isOpen={isLeadershipModalOpen} 
        onClose={() => { setIsLeadershipModalOpen(false); setInviteLink(''); }} 
        title={`Provision Admin Access`}
      >
        {inviteLink ? (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex items-start gap-3">
              <CheckCircle2 className="text-emerald-500 mt-0.5 flex-shrink-0" size={18} />
              <div>
                <p className="text-sm font-bold text-emerald-900 leading-tight mb-1">Invite Link Generated</p>
                <p className="text-xs text-emerald-700">Share this link with the new administrator. They will use it to set up their account credentials.</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
              <input type="text" readOnly value={inviteLink} className="flex-1 bg-transparent text-sm outline-none text-slate-600 min-w-0" />
              <button 
                type="button" 
                onClick={() => {
                  navigator.clipboard.writeText(inviteLink);
                  alert('Link copied to clipboard!');
                }} 
                className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
                title="Copy to clipboard"
              >
                <FileText size={16} />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <a 
                href={`mailto:?subject=Faith Healing Bible Church Admin Invitation&body=You have been invited to be an admin on Faith Healing Bible Church. Please click here to register and set your password: ${inviteLink}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-lg text-sm font-bold transition-colors"
              >
                <Mail size={16} />
                Email Link
              </a>
              <a 
                href={`https://wa.me/?text=You have been invited to be an admin on Faith Healing Bible Church. Please click here to register and set your password: ${inviteLink}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white py-2 rounded-lg text-sm font-bold transition-colors"
              >
                <Phone size={16} />
                WhatsApp
              </a>
            </div>
            
            <button 
              type="button" 
              onClick={() => { setIsLeadershipModalOpen(false); setInviteLink(''); }} 
              className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors mt-2"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleAssignLeadership} className="space-y-6">
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button 
                type="button" 
                onClick={() => setProvisionType('existing')} 
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${provisionType === 'existing' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Existing Member
              </button>
              <button 
                type="button" 
                onClick={() => setProvisionType('new')} 
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${provisionType === 'new' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Invite New User
              </button>
            </div>

            {provisionType === 'existing' ? (
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Select Member</label>
                <select 
                  value={selectedMemberId} 
                  onChange={e => setSelectedMemberId(e.target.value)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  required
                >
                  <option value="">Choose a member...</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{m.fullName} {m.email ? `(${m.email})` : '(No Email)'}</option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500 mt-1.5 ml-1">Member must have an email address tied to their profile.</p>
              </div>
            ) : (
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                <p className="text-xs text-blue-700 font-medium">A registration link will be generated. Send this link to the new administrator so they can securely set up their account and password.</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Target Branch</label>
                <select 
                  value={leaderBranchId} 
                  onChange={e => setLeaderBranchId(e.target.value)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="">None (District Global)</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Role</label>
                <select 
                  value={leaderRole} 
                  onChange={e => setLeaderRole(e.target.value)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="admin">Branch Admin</option>
                  <option value="district">District Overseer</option>
                </select>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={saving} 
              className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold text-sm shadow-lg hover:bg-slate-800 transition-all disabled:opacity-50"
            >
              {saving ? 'Processing...' : provisionType === 'existing' ? 'Provision Access' : 'Generate Invite Link'}
            </button>
          </form>
        )}
      </Modal>

      {/* Deleted old duplicate blocks */}
    </motion.div>
  );
}

function DistrictStatCard({ label, value, trend, icon }: { label: string, value: string, trend: string, icon: React.ReactNode }) {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-slate-50 rounded-lg">
          {icon}
        </div>
        <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
          <TrendingUp size={12} />
          {trend}
        </span>
      </div>
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{label}</p>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
      </div>
    </div>
  );
}

const BranchRow: React.FC<{ 
  name: string, 
  location: string, 
  capacity: string, 
  onEdit: () => void,
  onDelete: () => void,
  onAssign: () => void, 
  onView: () => void 
}> = ({ name, location, capacity, onEdit, onDelete, onAssign, onView }) => {
  return (
    <tr className="hover:bg-slate-50 transition-colors group">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs">
            {name.charAt(0)}
          </div>
          <span className="text-sm font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">{name}</span>
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-slate-600">{location}</td>
      <td className="px-6 py-4 text-sm font-bold text-emerald-600">{capacity}</td>
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-2 text-slate-400">
          <button 
            onClick={onEdit}
            className="p-2 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
            title="Edit Branch"
          >
            <Edit2 size={16} />
          </button>
          <button 
            onClick={onDelete}
            className="p-2 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
            title="Delete Branch"
          >
            <Trash2 size={16} />
          </button>
          <button 
            onClick={onAssign}
            className="p-2 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
            title="Provision Admin Access"
          >
            <UserPlus size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
}

function DistrictAlert({ title, desc, type }: { title: string, desc: string, type: 'critical' | 'warning' | 'success' }) {
  const colors = {
    critical: 'bg-red-50 border-red-100 text-red-600',
    warning: 'bg-orange-50 border-orange-100 text-orange-600',
    success: 'bg-emerald-50 border-emerald-100 text-emerald-600'
  };

  return (
    <div className={`p-3 rounded-lg border ${colors[type]} flex gap-3`}>
      <Activity size={16} className="flex-shrink-0 mt-0.5" />
      <div>
        <h4 className="text-xs font-bold leading-none mb-1">{title}</h4>
        <p className="text-[10px] opacity-80 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
