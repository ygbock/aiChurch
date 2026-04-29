import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Map, 
  Building2, 
  Users, 
  User,
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
  ArrowRight,
  MoreVertical,
  LayoutGrid
} from 'lucide-react';
import Modal from '../components/Modal';
import CollapsibleSection from '../components/CollapsibleSection';
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
  isBaptised: boolean;
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
  const [activeTab, setActiveTab] = useState<'overview' | 'branches' | 'leadership' | 'members' | 'baptism' | 'security'>('overview');
  const [members, setMembers] = useState<MemberData[]>([]);
  const [baptismRequests, setBaptismRequests] = useState<any[]>([]);
  const [memberSearchTerm, setMemberSearchTerm] = useState('');
  const [branchFilter, setBranchFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [baptismFilter, setBaptismFilter] = useState('all');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [isBulkRoleModalOpen, setIsBulkRoleModalOpen] = useState(false);
  const [isBulkStatusModalOpen, setIsBulkStatusModalOpen] = useState(false);
  const [bulkRole, setBulkRole] = useState('Member');
  const [bulkStatus, setBulkStatus] = useState('Active');

  // Leadership Provisioning State
  const [provisionType, setProvisionType] = useState<'existing' | 'new'>('existing');
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [leaderRole, setLeaderRole] = useState('admin');
  const [leaderBranchId, setLeaderBranchId] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
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

  const handleBulkRoleUpdate = async () => {
    if (selectedMembers.length === 0) return;
    setSaving(true);
    try {
      for (const memberId of selectedMembers) {
        const member = members.find(m => m.id === memberId);
        if (member) {
          const path = `districts/${districtId}/branches/${member.branchId}/members/${memberId}`;
          await updateDoc(doc(db, path), {
            level: bulkRole,
            updatedAt: serverTimestamp()
          });
        }
      }
      setSelectedMembers([]);
      setIsBulkRoleModalOpen(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleBulkStatusUpdate = async () => {
    if (selectedMembers.length === 0) return;
    setSaving(true);
    try {
      for (const memberId of selectedMembers) {
        const member = members.find(m => m.id === memberId);
        if (member) {
          const path = `districts/${districtId}/branches/${member.branchId}/members/${memberId}`;
          await updateDoc(doc(db, path), {
            status: bulkStatus,
            updatedAt: serverTimestamp()
          });
        }
      }
      setSelectedMembers([]);
      setIsBulkStatusModalOpen(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleExport = () => {
    if (selectedMembers.length === 0) return;
    const selectedData = members.filter(m => selectedMembers.includes(m.id));
    const headers = ["Full Name", "Email", "Phone", "Branch", "Level", "Status"];
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + selectedData.map(m => {
        const branchName = branches.find(b => b.id === m.branchId)?.name || 'Central';
        return `"${m.fullName || ''}","${m.email || ''}","${m.phone || ''}","${branchName}","${m.level || ''}","${m.status || ''}"`;
      }).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `members_export_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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

    // Listen to baptism requests (members in this district with baptismStatus)
    const baptismQuery = query(
      collectionGroup(db, 'members'),
      where('districtId', '==', districtId),
      where('isBaptised', '==', false)
    );
    const unsubscribeBaptism = onSnapshot(baptismQuery, (snapshot) => {
      const results: any[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.baptismStatus && data.baptismStatus !== 'Approved') {
          results.push({ id: doc.id, refPath: doc.ref.path, ...data });
        }
      });
      setBaptismRequests(results);
    }, (error) => {
      console.warn("Snapshot error (baptism):", error);
    });

    return () => {
      unsubscribeBranches();
      unsubscribeDistrict();
      unsubscribeLeaders();
      unsubscribeMembers();
      unsubscribeBaptism();
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
          grantedBy: profile?.uid || 'system',
          status: 'active'
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
          status: 'pending',
          email: inviteEmail.toLowerCase().trim() || null
        };
        
        const docRef = await addDoc(collection(db, 'invites'), invitePayload);
        
        // PRE-AUTHORIZE: If email provided, create access record immediately
        if (inviteEmail) {
          const emailLower = inviteEmail.toLowerCase().trim();
          await setDoc(doc(db, 'accessControl', emailLower), {
            email: emailLower,
            role: leaderRole,
            districtId: districtId,
            branchId: leaderBranchId || null,
            grantedAt: serverTimestamp(),
            grantedBy: profile?.uid || 'system',
            inviteId: docRef.id,
            status: 'pre-authorized'
          });
        }

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

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="w-full lg:w-auto">
          <button 
            onClick={() => window.history.length > 1 ? window.history.back() : window.location.href = '/'}
            className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-blue-600 mb-2 transition-colors"
          >
            <ChevronRight size={16} className="rotate-180" />
            Back
          </button>
          <div className="flex items-center justify-between lg:justify-start gap-3">
            <h2 className="text-2xl font-bold text-slate-900">{districtData?.name || 'District Oversight'}</h2>
            <button 
              onClick={() => setIsDistrictEditModalOpen(true)}
              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
              title="Edit District Details"
            >
              <Settings size={18} />
            </button>
          </div>
          <p className="text-slate-500 text-sm mt-1">Managing {branches.length} branches across the {districtData?.name || 'District'}.</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full lg:w-auto">
          <button 
            onClick={() => {
              setEditingBranchId(null);
              setBranchForm({ name: '', location: '', capacity: '' });
              setIsBranchModalOpen(true);
            }}
            className="flex-1 lg:flex-none group relative bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-200"
          >
            <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
            Establish Branch
          </button>
          <button className="flex-1 lg:flex-none bg-white border border-slate-200 text-slate-700 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2 shadow-sm">
            <FileText size={18} className="text-blue-600" />
            Report
          </button>
        </div>
      </div>

      {/* Navigation Tabs - Responsive Scrollable */}
      <div className="relative">
        <div className="overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex border-b border-slate-200 gap-6 sm:gap-8 min-w-max">
            {[
              { id: 'overview', label: 'Overview', icon: <BarChart3 size={18} /> },
              { id: 'branches', label: 'Branches', icon: <Building2 size={18} /> },
              { id: 'members', label: 'Members', icon: <Users size={18} /> },
              { id: 'leadership', label: 'Leadership', icon: <Shield size={18} /> },
              { id: 'baptism', label: 'Baptism', icon: <div className="relative"><CheckCircle2 size={18} />{baptismRequests.length > 0 && <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white">{baptismRequests.length}</span>}</div> }
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
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* District Stats Grid - Collapsible */}
          <CollapsibleSection title="District Key Metrics" icon={<LayoutGrid size={20} />}>
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
          </CollapsibleSection>

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
        </div>
      )}

      {activeTab === 'branches' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-6 py-5 border-b border-slate-200 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
              <div className="w-full xl:w-auto">
                <h3 className="text-lg font-bold text-slate-900">Branch Performance</h3>
                <p className="text-sm text-slate-500">Live summary of all satellite locations</p>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
                <div className="relative w-full sm:flex-1 xl:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="text" 
                    value={searchTerm} 
                    onChange={e => setSearchTerm(e.target.value)} 
                    placeholder="Search branches..." 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" 
                  />
                </div>
                <button className="w-full sm:w-auto px-4 py-2 text-slate-600 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 border border-slate-200 rounded-xl font-bold transition-all flex items-center justify-center gap-2">
                  <Filter size={18} />
                  <span className="sm:hidden">Filters</span>
                </button>
              </div>
            </div>
            <div className="overflow-hidden">
              <div className="grid grid-cols-2 md:table w-full text-left border-collapse gap-3 md:gap-0 p-3 md:p-0">
                <div className="hidden md:table-header-group">
                  <div className="md:table-row bg-slate-50/50">
                    <div className="md:table-cell px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Branch Details</div>
                    <div className="md:table-cell px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Location</div>
                    <div className="md:table-cell px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Capacity</div>
                    <div className="md:table-cell px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Actions</div>
                  </div>
                </div>
                <div className="lg:table-row-group col-span-2 contents">
                  {branches.length === 0 ? (
                    <div className="lg:table-row col-span-2">
                        <div className="lg:table-cell px-6 py-12 text-center text-slate-400">
                          <div className="flex flex-col items-center gap-2">
                            <Building2 size={40} className="text-slate-200" />
                            <p className="text-sm font-medium">No branches established in this district yet.</p>
                            <button onClick={() => setIsBranchModalOpen(true)} className="text-blue-600 font-bold text-xs hover:underline">Create First Branch</button>
                          </div>
                        </div>
                    </div>
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
                        onView={() => navigate(`/branches/${branch.id}`)} 
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'members' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-6 py-5 border-b border-slate-200 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
              <div className="w-full xl:w-auto">
                <h3 className="text-lg font-bold text-slate-900">District Members</h3>
                <p className="text-sm text-slate-500">Complete directory of members across all branches</p>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
                <div className="relative w-full sm:flex-1 xl:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="text" 
                    value={memberSearchTerm} 
                    onChange={e => setMemberSearchTerm(e.target.value)} 
                    placeholder="Search name, level..." 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" 
                  />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                  <select 
                    value={branchFilter}
                    onChange={e => setBranchFilter(e.target.value)}
                    className="min-w-[120px] bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-bold uppercase tracking-wider outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="all">Branch: All</option>
                    {branches.map(branch => (
                      <option key={branch.id} value={branch.id}>{branch.name}</option>
                    ))}
                  </select>
                  <select 
                    value={levelFilter}
                    onChange={e => setLevelFilter(e.target.value)}
                    className="min-w-[120px] bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-bold uppercase tracking-wider outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="all">Level: All</option>
                    <option value="Convert">Convert</option>
                    <option value="Disciple">Disciple</option>
                    <option value="Worker">Worker</option>
                    <option value="Leader">Leader</option>
                    <option value="Visitor">Visitor</option>
                  </select>
                  <select 
                    value={baptismFilter}
                    onChange={e => setBaptismFilter(e.target.value)}
                    className="min-w-[120px] bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-bold uppercase tracking-wider outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="all">Baptism: All</option>
                    <option value="baptised">Baptised</option>
                    <option value="pending">Awaiting</option>
                  </select>
                </div>
              </div>
            </div>

            {selectedMembers.length > 0 && (
              <div className="px-6 py-3 bg-blue-50 border-b border-blue-100 flex items-center justify-between animate-in slide-in-from-top duration-300">
                <div className="flex items-center gap-2">
                  <div className="bg-blue-600 text-white w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold">
                    {selectedMembers.length}
                  </div>
                  <span className="text-xs font-bold text-blue-700">Members Selected</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setIsBulkRoleModalOpen(true)} className="px-3 py-1 bg-white border border-blue-200 rounded-lg text-[10px] font-bold text-blue-600 hover:bg-blue-600 hover:text-white transition-all">Assign Role</button>
                  <button onClick={() => setIsBulkStatusModalOpen(true)} className="px-3 py-1 bg-white border border-blue-200 rounded-lg text-[10px] font-bold text-blue-600 hover:bg-blue-600 hover:text-white transition-all">Change Status</button>
                  <button onClick={handleExport} className="px-3 py-1 bg-white border border-blue-200 rounded-lg text-[10px] font-bold text-blue-600 hover:bg-blue-600 hover:text-white transition-all">Export</button>
                  <button onClick={() => setSelectedMembers([])} className="p-1 px-2 text-blue-400 hover:text-blue-600 text-[10px] uppercase font-bold">Cancel</button>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <div className="grid grid-cols-2 md:table w-full text-left border-collapse gap-4 md:gap-0 p-4 md:p-0">
                <div className="hidden md:table-header-group">
                  <div className="md:table-row bg-slate-50/50">
                    <div className="md:table-cell px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                      <div className="flex items-center gap-3">
                        <input 
                          type="checkbox" 
                          checked={selectedMembers.length === members.length && members.length > 0} 
                          onChange={(e) => setSelectedMembers(e.target.checked ? members.map(m => m.id) : [])}
                          className="rounded border-slate-300 text-blue-600"
                        />
                        Member
                      </div>
                    </div>
                    <div className="md:table-cell px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Branch</div>
                    <div className="md:table-cell px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Contact</div>
                    <div className="md:table-cell px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Status</div>
                    <div className="md:table-cell px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Actions</div>
                  </div>
                </div>
                <div className="md:table-row-group col-span-2 contents md:block">
                  {members.length === 0 ? (
                    <div className="md:table-row col-span-2">
                      <div className="md:table-cell px-6 py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center gap-2">
                          <Users size={40} className="text-slate-200" />
                          <p className="text-sm font-medium">No members found in this district.</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    members
                      .filter(m => {
                        const matchesSearch = (m.fullName || '').toLowerCase().includes(memberSearchTerm.toLowerCase()) || 
                                           (m.email || '').toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
                                           (m.level || '').toLowerCase().includes(memberSearchTerm.toLowerCase());
                        const matchesBranch = branchFilter === 'all' || m.branchId === branchFilter;
                        const matchesLevel = levelFilter === 'all' || m.level === levelFilter;
                        const matchesBaptism = baptismFilter === 'all' || 
                                             (baptismFilter === 'baptised' ? m.isBaptised : !m.isBaptised);
                        return matchesSearch && matchesBranch && matchesLevel && matchesBaptism;
                      })
                      .map(member => (
                        <div key={member.id} className="bg-white border border-slate-100 rounded-2xl md:rounded-none md:border-none p-3 md:p-0 hover:bg-slate-50 transition-all flex flex-col md:table-row min-w-0">
                          <div className="px-0 md:px-6 py-2 md:py-4 block md:table-cell">
                            <div className="flex items-center gap-3">
                              <input 
                                type="checkbox" 
                                checked={selectedMembers.includes(member.id)} 
                                onChange={(e) => {
                                  if (e.target.checked) setSelectedMembers([...selectedMembers, member.id]);
                                  else setSelectedMembers(selectedMembers.filter(id => id !== member.id));
                                }}
                                className="hidden md:block rounded border-slate-300 text-blue-600"
                              />
                              {member.photoUrl ? (
                                <img src={member.photoUrl} alt="" className="w-8 h-8 md:w-10 md:h-10 rounded-full md:rounded-xl object-cover border-2 border-slate-100 shrink-0" referrerPolicy="no-referrer" />
                              ) : (
                                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full md:rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs shrink-0">
                                  {(member.fullName || '?').charAt(0)}
                                </div>
                              )}
                              <div className="flex flex-col min-w-0">
                                <h4 className="text-sm font-bold text-slate-900 truncate">{member.fullName}</h4>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[9px] font-bold text-blue-600 uppercase tracking-widest">{member.level || 'Member'}</span>
                                  <span className="text-[9px] text-slate-300 md:hidden">•</span>
                                  <span className="text-[9px] text-slate-500 md:hidden truncate">
                                    {branches.find(b => b.id === member.branchId)?.name || 'Central'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="hidden md:table-cell px-6 py-4">
                            <span className="text-sm text-slate-600 font-medium">
                              {branches.find(b => b.id === member.branchId)?.name || 'Central'}
                            </span>
                          </div>
                          <div className="px-0 md:px-6 py-2 md:py-4 block md:table-cell">
                            <div className="flex flex-row md:flex-col gap-3 md:gap-1">
                              {member.email && (
                                <span className="text-xs text-slate-500 flex items-center gap-1.5 min-w-0 lg:max-w-[150px] xl:max-w-none truncate">
                                  <Mail size={12} className="text-slate-400 shrink-0" />
                                  <span className="truncate">{member.email}</span>
                                </span>
                              )}
                              {member.phone && (
                                <span className="text-xs text-slate-500 flex items-center gap-1.5">
                                  <Phone size={12} className="text-slate-400 shrink-0" />
                                  {member.phone}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="px-0 md:px-6 py-2 md:py-4 block md:table-cell">
                            <div className="flex items-center justify-between md:inline-block">
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                member.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                              }`}>
                                {member.status}
                              </span>
                              <div className="md:hidden flex items-center gap-2">
                                <button onClick={() => navigate(`/members/edit/${member.id}`)} className="p-2 text-slate-400 hover:text-blue-600 bg-slate-50 rounded-lg">
                                  <Edit2 size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                          <div className="relative md:table-cell px-6 py-4 text-right">
                            <MemberActionDropdown 
                              member={member} 
                              onEdit={() => navigate(`/members/edit/${member.id}?districtId=${member.districtId || profile?.districtId}&branchId=${member.branchId}`)}
                              onView={() => navigate(`/members/profile/${member.id}?districtId=${member.districtId || profile?.districtId}&branchId=${member.branchId}`)}
                            />
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'baptism' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-6 py-5 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">Baptism Approval Workflow</h3>
              <p className="text-sm text-slate-500">Review candidates submitted by branches for baptism approval.</p>
            </div>
            
            <div className="p-6">
              {baptismRequests.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 size={32} className="text-slate-200" />
                  </div>
                  <p className="text-slate-500 font-medium">No pending baptism requests.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {baptismRequests.map(req => (
                    <div key={req.id} className="group bg-slate-50 rounded-2xl border border-slate-100 p-4 hover:border-blue-200 transition-all">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex items-center gap-4">
                          {req.photoUrl ? (
                            <img src={req.photoUrl} alt="" className="w-12 h-12 rounded-xl object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400">
                              <Users size={20} />
                            </div>
                          )}
                          <div>
                            <h4 className="font-bold text-slate-900 tracking-tight">{req.fullName}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase truncate max-w-[100px]">{req.branch || 'Unknown Branch'}</span>
                              <span className="text-[10px] font-bold text-slate-500 bg-slate-200/50 px-2 py-0.5 rounded-full uppercase">{req.baptismStatus}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 w-full md:w-auto">
                          {req.baptismStatus === 'Submitted to District' ? (
                            <button 
                              onClick={async () => {
                                try {
                                  await updateDoc(doc(db, req.refPath), {
                                    baptismStatus: 'Submitted to HQ',
                                    districtReviewedAt: serverTimestamp(),
                                    districtReviewedBy: profile?.uid
                                  });
                                } catch (e) {
                                  console.error(e);
                                }
                              }}
                              className="flex-1 md:flex-none px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                            >
                              Approve & Forward to HQ
                              <ChevronRight size={14} />
                            </button>
                          ) : (
                            <span className="text-xs font-bold text-slate-400 bg-slate-100 px-4 py-2 rounded-xl">Wait for HQ Final Approval</span>
                          )}
                          <button 
                            onClick={() => navigate(`/members/edit/${req.memberId}?districtId=${req.districtId}&branchId=${req.branchId}`)}
                            className="p-2 text-slate-400 hover:text-slate-600 bg-white border border-slate-200 rounded-xl transition-all"
                          >
                            <Edit2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'security' && (
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
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-2">
                  <p className="text-xs text-blue-700 font-medium leading-relaxed">
                    Provide the user's email below to <span className="font-bold underline">pre-authorize</span> their admin access. They will be able to start managing their branch immediately after setting their password.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Invitee Email (Optional)</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      type="email" 
                      value={inviteEmail}
                      onChange={e => setInviteEmail(e.target.value)}
                      placeholder="admin@example.com"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1.5 ml-1">If blank, they will need manual approval after registration.</p>
                </div>
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
    <div className="bg-white hover:bg-slate-50 transition-colors group flex flex-col md:table-row border border-slate-100 md:border-none rounded-2xl md:rounded-none p-4 md:p-0 h-full overflow-hidden shadow-sm md:shadow-none">
      <div className="px-0 md:px-6 py-2 md:py-4 block md:table-cell min-w-0">
        <div className="flex items-center gap-3 md:gap-3">
          <div className="w-10 h-10 md:w-10 md:h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs shrink-0 border border-slate-200 shadow-sm">
            {name.charAt(0)}
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-sm md:text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-all truncate">{name}</span>
            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider truncate block md:hidden">{location}</span>
          </div>
        </div>
      </div>
      <div className="hidden md:table-cell px-6 py-4 text-sm text-slate-600">{location}</div>
      <div className="hidden md:table-cell px-6 py-4 text-sm font-bold text-emerald-600">{capacity}</div>
      <div className="px-0 md:px-6 py-2 md:py-3 text-right block md:table-cell mt-3 md:mt-0 border-t border-slate-50 md:border-none pt-3 md:pt-4">
        <div className="flex items-center justify-between md:justify-end gap-2">
          <div className="md:hidden flex flex-col items-start gap-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Capacity</span>
            <span className="text-sm font-bold text-emerald-600">{capacity}</span>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={onEdit}
              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all border border-slate-100 bg-white shadow-sm md:border-none md:bg-transparent md:shadow-none"
              title="Edit Branch"
            >
              <Edit2 size={16} />
            </button>
            <button 
              onClick={onAssign}
              className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all border border-slate-100 bg-white shadow-sm md:border-none md:bg-transparent md:shadow-none"
              title="Provision Admin Access"
            >
              <UserPlus size={16} />
            </button>
            <button 
              onClick={onDelete}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all border border-slate-100 bg-white shadow-sm md:border-none md:bg-transparent md:shadow-none"
              title="Delete Branch"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MemberActionDropdown({ member, onEdit, onView }: { member: any, onEdit: () => void, onView: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg transition-all"
      >
        <MoreVertical size={18} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden py-1"
          >
            <button
              onClick={() => {
                onView();
                setIsOpen(false);
              }}
              className="w-full px-4 py-2 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
            >
              <User size={14} className="text-blue-500" />
              View Profile
            </button>
            <button
              onClick={() => {
                onEdit();
                setIsOpen(false);
              }}
              className="w-full px-4 py-2 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
            >
              <Edit2 size={14} className="text-slate-400" />
              Edit Member
            </button>
            <div className="h-px bg-slate-100 my-1 mx-2" />
            <button
              onClick={() => {
                // handle delete or other actions
                setIsOpen(false);
              }}
              className="w-full px-4 py-2 text-left text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
            >
              <Trash2 size={14} />
              Remove Member
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
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
