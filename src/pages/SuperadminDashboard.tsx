import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  Globe, 
  Building2, 
  Users, 
  Shield, 
  TrendingUp, 
  AlertTriangle,
  ChevronRight,
  ArrowUpRight,
  Map,
  Activity,
  Plus,
  UserPlus,
  Mail,
  MapPin,
  Loader2,
  Edit2,
  FileText,
  Phone,
  CheckCircle2,
  LayoutGrid
} from 'lucide-react';
import Modal from '../components/Modal';
import CollapsibleSection from '../components/CollapsibleSection';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip 
} from 'recharts';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, doc, updateDoc, deleteDoc, collectionGroup, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, auth } from '../lib/firebase';
import { useFirebase } from '../components/FirebaseProvider';

const globalGrowthData = [
  { name: 'Jan', members: 45000 },
  { name: 'Feb', members: 48000 },
  { name: 'Mar', members: 52000 },
  { name: 'Apr', members: 58000 },
  { name: 'May', members: 65000 },
  { name: 'Jun', members: 72000 },
];

export default function SuperadminDashboard() {
  const { profile } = useFirebase();
  const navigate = useNavigate();
  const [isDistrictModalOpen, setIsDistrictModalOpen] = useState(false);
  const [isLeadershipModalOpen, setIsLeadershipModalOpen] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [districts, setDistricts] = useState<any[]>([]);
  const [adminRequests, setAdminRequests] = useState<any[]>([]);
  const [baptismRequests, setBaptismRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'districts' | 'leadership' | 'baptism'>('overview');
  const [isCreating, setIsCreating] = useState(false);
  const [editingDistrictId, setEditingDistrictId] = useState<string | null>(null);

  // Leadership Provisioning State
  const [provisionType, setProvisionType] = useState<'existing' | 'new'>('existing');
  const [leaderRole, setLeaderRole] = useState('district');
  const [leaderDistrictId, setLeaderDistrictId] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [saving, setSaving] = useState(false);

  // New District Form State
  const [newDistrict, setNewDistrict] = useState({
    name: '',
    locationCategory: 'Local',
    country: '',
    region: '',
    city: ''
  });

  useEffect(() => {
    const q = query(collection(db, 'districts'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const districtsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setDistricts(districtsList);
      setIsLoading(false);
    }, (error) => {
      console.error("Error listening to districts:", error);
      setIsLoading(false);
    });

    const requestsQuery = query(collection(db, 'adminRequests'), orderBy('createdAt', 'desc'));
    const unsubscribeRequests = onSnapshot(requestsQuery, (snapshot) => {
      const requests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAdminRequests(requests);
    });

    // Listen to HQ baptism requests
    const baptismQuery = query(
      collectionGroup(db, 'members'),
      where('baptismStatus', 'in', ['Submitted to HQ', 'Approved'])
    );
    const unsubscribeBaptism = onSnapshot(baptismQuery, (snapshot) => {
      const results: any[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.baptismStatus === 'Submitted to HQ') {
          results.push({ id: doc.id, refPath: doc.ref.path, ...data });
        }
      });
      setBaptismRequests(results);
    });

    return () => {
      unsubscribe();
      unsubscribeRequests();
      unsubscribeBaptism();
    };
  }, []);

  const [approvingId, setApprovingId] = useState<string | null>(null);

  const handleApproveAdmin = async (request: any) => {
    setApprovingId(request.id);
    try {
      const emailLower = request.email.toLowerCase().trim();
      // 1. Create Access Control payload
      const accessPayload = {
        email: emailLower,
        role: request.role,
        districtId: request.districtId,
        branchId: request.branchId || '',
        grantedAt: serverTimestamp(),
        grantedBy: 'superadmin'
      };
      // 2. Set the document
      const { setDoc, deleteDoc } = await import('firebase/firestore');
      await setDoc(doc(db, 'accessControl', emailLower), accessPayload);
      
      // 3. Mark invite as used 
      if (request.inviteId) {
        await updateDoc(doc(db, 'invites', request.inviteId), { status: 'approved' });
      }

      // 4. Delete the request
      await deleteDoc(doc(db, 'adminRequests', request.id));
      
      console.log('Admin access granted successfully.');
    } catch (e: any) {
      console.error('Failed to approve request', e);
      alert('Failed to approve request: ' + e.message);
    } finally {
      setApprovingId(null);
    }
  };

  const handleCreateDistrict = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      if (editingDistrictId) {
        const districtRef = doc(db, 'districts', editingDistrictId);
        await updateDoc(districtRef, {
          ...newDistrict,
          updatedAt: serverTimestamp()
        });
      } else {
        const districtData = {
          ...newDistrict,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          branchesCount: 0,
          membersCount: 0,
          growth: '0%'
        };
        await addDoc(collection(db, 'districts'), districtData);
      }
      
      setIsDistrictModalOpen(false);
      setEditingDistrictId(null);
      setNewDistrict({
        name: '',
        locationCategory: 'Local',
        country: '',
        region: '',
        city: ''
      });
    } catch (error) {
      handleFirestoreError(error, editingDistrictId ? OperationType.UPDATE : OperationType.CREATE, 'districts');
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditClick = (district: any) => {
    setEditingDistrictId(district.id);
    setNewDistrict({
      name: district.name,
      locationCategory: district.locationCategory || 'Local',
      country: district.country || '',
      region: district.region || '',
      city: district.city || ''
    });
    setIsDistrictModalOpen(true);
  };

  const handleAssignLeadership = async (e: React.FormEvent) => {
    e.preventDefault();

    setSaving(true);
    try {
      if (provisionType === 'existing') {
         // Cannot provision existing member easily across all districts from this view without district lookup
         // Simplified to invite flow for global admin
         alert('Please use District Dashboard to provision existing members to local roles.');
         setIsLeadershipModalOpen(false);
      } else {
        const invitePayload = {
          role: leaderRole,
          districtId: leaderDistrictId || 'global',
          branchId: '',
          requestedBy: profile?.uid || 'system',
          createdAt: serverTimestamp(),
          status: 'pending'
        };
        const docRef = await addDoc(collection(db, 'invites'), invitePayload);
        const link = `${window.location.origin}/register?invite=${docRef.id}`;
        setInviteLink(link);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'invites');
    } finally {
      setSaving(false);
    }
  };

  const totalMembers = districts.reduce((acc, d) => acc + (d.membersCount || 0), 0);
  const totalBranches = districts.reduce((acc, d) => acc + (d.branchesCount || 0), 0);
  const totalDistrictsCount = districts.length;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Global Oversight</h2>
          <p className="text-slate-500 text-sm">System-wide statistics and metrics across all live districts.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => {
              setLeaderDistrictId('');
              setLeaderRole('superadmin');
              setIsLeadershipModalOpen(true);
            }}
            className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg font-medium text-sm hover:bg-slate-50 transition-colors flex items-center gap-2"
          >
            <Shield size={18} />
            Provision Admin Access
          </button>
          <button 
            onClick={() => setIsDistrictModalOpen(true)}
            className="bg-slate-900 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-slate-800 transition-colors flex items-center gap-2 shadow-sm"
          >
            <Plus size={18} />
            New District
          </button>
        </div>
      </div>

      {/* Modals */}
      <Modal 
        isOpen={isDistrictModalOpen} 
        onClose={() => {
          setIsDistrictModalOpen(false);
          setEditingDistrictId(null);
          setNewDistrict({
            name: '',
            locationCategory: 'Local',
            country: '',
            region: '',
            city: ''
          });
        }} 
        title={editingDistrictId ? "Edit District Information" : "Create New District"}
      >
        <form onSubmit={handleCreateDistrict} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">District Name</label>
            <input 
              type="text" 
              placeholder="e.g. East Africa District" 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" 
              value={newDistrict.name}
              onChange={(e) => setNewDistrict({ ...newDistrict, name: e.target.value })}
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Location Category</label>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center gap-2 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50">
                <input 
                  type="radio" 
                  name="locationCategory" 
                  value="Local" 
                  checked={newDistrict.locationCategory === 'Local'} 
                  onChange={() => setNewDistrict({ ...newDistrict, locationCategory: 'Local' })}
                  className="text-blue-600 focus:ring-blue-500" 
                />
                <span className="text-sm font-medium text-slate-700">Local</span>
              </label>
              <label className="flex items-center gap-2 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50">
                <input 
                  type="radio" 
                  name="locationCategory" 
                  value="International" 
                  checked={newDistrict.locationCategory === 'International'} 
                  onChange={() => setNewDistrict({ ...newDistrict, locationCategory: 'International' })}
                  className="text-blue-600 focus:ring-blue-500" 
                />
                <span className="text-sm font-medium text-slate-700">International</span>
              </label>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Country</label>
              <input 
                type="text" 
                placeholder="Country" 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" 
                value={newDistrict.country}
                onChange={(e) => setNewDistrict({ ...newDistrict, country: e.target.value })}
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Region/State</label>
              <input 
                type="text" 
                placeholder="State/Region" 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" 
                value={newDistrict.region}
                onChange={(e) => setNewDistrict({ ...newDistrict, region: e.target.value })}
                required 
              />
            </div>
          </div>
          <div>
             <label className="block text-sm font-bold text-slate-700 mb-1">City/Territory</label>
             <input 
               type="text" 
               placeholder="e.g. Nairobi" 
               className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" 
               value={newDistrict.city}
               onChange={(e) => setNewDistrict({ ...newDistrict, city: e.target.value })}
               required 
              />
          </div>
          <button 
            type="submit" 
            disabled={isCreating}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all mt-2 flex items-center justify-center gap-2"
          >
            {isCreating ? <Loader2 className="animate-spin" size={18} /> : (editingDistrictId ? 'Update District' : 'Create District')}
          </button>
        </form>
      </Modal>

      <Modal 
        isOpen={isLeadershipModalOpen} 
        onClose={() => { setIsLeadershipModalOpen(false); setInviteLink(''); }} 
        title={`Provision Admin Access: ${selectedDistrict}`}
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
        <form onSubmit={handleAssignLeadership} className="space-y-4">
            <div className="flex bg-slate-100 p-1 rounded-xl mb-4">
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
               <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl flex gap-3">
                 <AlertTriangle className="text-orange-600 flex-shrink-0" size={18} />
                 <p className="text-xs text-orange-800 leading-relaxed font-medium">To assign a local branch member to a leadership role across the district, please use the <b>District Dashboard</b> instead.</p>
               </div>
            ) : (
               <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 mb-4">
                 <p className="text-xs text-blue-700 font-medium">A registration link will be generated. Send this link to the new administrator so they can securely set up their account and password.</p>
               </div>
            )}
            
            <div className={`grid grid-cols-2 gap-4 ${provisionType === 'existing' ? 'opacity-50 pointer-events-none' : ''}`}>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Target District</label>
                <select 
                  value={leaderDistrictId} 
                  onChange={e => setLeaderDistrictId(e.target.value)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="">Global/System Wide</option>
                  {districts.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Role</label>
                <select 
                  value={leaderRole}
                  onChange={(e) => setLeaderRole(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="superadmin">Superadmin</option>
                  <option value="district">District Overseer</option>
                </select>
              </div>
            </div>

          <button 
            type="submit" 
            disabled={saving || provisionType === 'existing'}
            className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold text-sm shadow-lg hover:bg-slate-800 transition-all disabled:opacity-50 mt-4"
          >
            {saving ? 'Processing...' : 'Generate Invite Link'}
          </button>
        </form>
        )}
      </Modal>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-8">
        {[
          { id: 'overview', label: 'Global Overview', icon: <Globe size={18} /> },
          { id: 'districts', label: 'Districts', icon: <Map size={18} /> },
          { id: 'leadership', label: 'Leadership', icon: <Shield size={18} /> },
          { id: 'baptism', label: 'Baptism Queue', icon: <div className="relative"><CheckCircle2 size={18} />{baptismRequests.length > 0 && <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white">{baptismRequests.length}</span>}</div> }
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
        <div className="space-y-8">
          {/* Global Stats Grid - Collapsible */}
          <CollapsibleSection title="Global Statistics" icon={<LayoutGrid size={20} />}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <GlobalStatCard 
                label="Total Global Members" 
                value={totalMembers.toLocaleString()} 
                trend={`${totalMembers > 0 ? '+5.2%' : 'No data'}`} 
                icon={<Users className="text-blue-600" size={20} />}
              />
              <GlobalStatCard 
                label="Active Branches" 
                value={totalBranches.toString()} 
                trend="Across all districts" 
                icon={<Building2 className="text-emerald-600" size={20} />}
              />
              <GlobalStatCard 
                label="Live Districts" 
                value={totalDistrictsCount.toString()} 
                trend="System-wide" 
                icon={<Map className="text-purple-600" size={20} />}
              />
              <GlobalStatCard 
                label="System Health" 
                value="100%" 
                trend="Stable" 
                icon={<Activity className="text-orange-600" size={20} />}
              />
            </div>
          </CollapsibleSection>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Global Growth Chart */}
            <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-base font-bold text-slate-900">Global Growth Trends</h3>
                <div className="flex gap-2">
                  <button className="text-xs font-bold text-blue-600">Members</button>
                  <button className="text-xs font-bold text-slate-400">Revenue</button>
                </div>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={globalGrowthData}>
                    <defs>
                      <linearGradient id="colorGlobal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0f172a" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#0f172a" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="members" stroke="#0f172a" strokeWidth={2} fillOpacity={1} fill="url(#colorGlobal)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* System Alerts */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
              <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                <h3 className="text-base font-bold text-slate-900">System Alerts</h3>
                <span className="bg-red-50 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full">3 Critical</span>
              </div>
              <div className="p-4 space-y-4">
                <AlertItem 
                  title="Database Sync Lag" 
                  desc="District 4 branches experiencing 5s delay." 
                  type="critical" 
                />
                <AlertItem 
                  title="New License Request" 
                  desc="Lagos Central Branch awaiting activation." 
                  type="info" 
                />
                <AlertItem 
                  title="Transfer Queue High" 
                  desc="150+ transfers pending Superadmin review." 
                  type="warning" 
                />
              </div>
              <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 mt-auto">
                <button className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                  View All Alerts
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'districts' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-200">
            <h3 className="text-base font-bold text-slate-900">District Performance</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">District Name</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Branches</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Members</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Growth</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="animate-spin text-blue-600" size={24} />
                        <span className="text-sm text-slate-500">Loading districts...</span>
                      </div>
                    </td>
                  </tr>
                ) : districts.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-sm text-slate-500">
                      No districts found. Create your first district to get started.
                    </td>
                  </tr>
                ) : (
                  districts.map((district) => (
                    <DistrictRow 
                      key={district.id}
                      name={district.name} 
                      branches={district.branchesCount || 0} 
                      members={district.membersCount?.toLocaleString() || "0"} 
                      growth={district.growth || "0%"} 
                      onAssign={(name) => { setSelectedDistrict(name); setLeaderDistrictId(district.id); setIsLeadershipModalOpen(true); }}
                      onEdit={() => handleEditClick(district)}
                      onView={() => { navigate(`/district/${district.id}`); }} 
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'leadership' && adminRequests.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Pending Admin Approvals</h3>
            <span className="bg-red-50 text-red-600 text-xs font-bold px-3 py-1 rounded-full">
              {adminRequests.length} Pending
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Role Requested</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {adminRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-800">{req.fullName}</p>
                      <p className="text-xs text-slate-500">{req.phone}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{req.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${req.role === 'district' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                        {req.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleApproveAdmin(req)}
                        disabled={approvingId === req.id}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-sm shadow-emerald-200 flex items-center justify-center gap-2 ml-auto disabled:opacity-50"
                      >
                        {approvingId === req.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : null}
                        Approve Access
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'baptism' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-6 py-5 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">Final Baptism Approval</h3>
              <p className="text-sm text-slate-500">Ministry-wide candidates awaiting final headquarters approval.</p>
            </div>
            
            <div className="p-6">
              {baptismRequests.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 size={32} className="text-slate-200" />
                  </div>
                  <p className="text-slate-500 font-medium">No candidates in final approval queue.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {baptismRequests.map(req => (
                    <div key={req.id} className="group bg-slate-50 rounded-2xl border border-slate-100 p-4 hover:border-emerald-200 transition-all">
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
                              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase">{req.branch || 'Unknown Branch'}</span>
                              <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full uppercase">{req.districtId}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 w-full md:w-auto">
                          <button 
                            onClick={async () => {
                              try {
                                await updateDoc(doc(db, req.refPath), {
                                  baptismStatus: 'Approved',
                                  isBaptised: true,
                                  level: 'Disciple', // Automatically elevate to Disciple upon baptism
                                  hqApprovedAt: serverTimestamp(),
                                  hqApprovedBy: profile?.uid
                                });
                              } catch (e) {
                                console.error(e);
                              }
                            }}
                            className="flex-1 md:flex-none px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-200"
                          >
                            <CheckCircle2 size={16} />
                            Grant Final Approval
                          </button>
                          <button 
                            onClick={() => navigate(`/members/edit/${req.memberId}?districtId=${req.districtId}&branchId=${req.branchId}`)}
                            className="p-2.5 text-slate-400 hover:text-slate-600 bg-white border border-slate-200 rounded-xl transition-all"
                          >
                            <Edit2 size={18} />
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
    </motion.div>
  );
}

function GlobalStatCard({ label, value, trend, icon }: { label: string, value: string, trend: string, icon: React.ReactNode }) {
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

function AlertItem({ title, desc, type }: { title: string, desc: string, type: 'critical' | 'warning' | 'info' }) {
  const colors = {
    critical: 'bg-red-50 border-red-100 text-red-600',
    warning: 'bg-orange-50 border-orange-100 text-orange-600',
    info: 'bg-blue-50 border-blue-100 text-blue-600'
  };

  return (
    <div className={`p-3 rounded-lg border ${colors[type]} flex gap-3`}>
      <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
      <div>
        <h4 className="text-xs font-bold leading-none mb-1">{title}</h4>
        <p className="text-[10px] opacity-80 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

interface DistrictRowProps {
  name: string;
  branches: number;
  members: string;
  growth: string;
  onAssign: (name: string) => void;
  onEdit: () => void;
  onView: () => void;
}

const DistrictRow: React.FC<DistrictRowProps> = ({ name, branches, members, growth, onAssign, onEdit, onView }) => {
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
      <td className="px-6 py-4 text-sm text-slate-600">{branches}</td>
      <td className="px-6 py-4 text-sm text-slate-600">{members}</td>
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-2">
          <span className="text-sm font-bold text-emerald-600 mr-4">{growth}</span>
          <button 
            onClick={onEdit}
            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
            title="Edit District"
          >
            <Edit2 size={16} />
          </button>
          <button 
            onClick={() => onAssign(name)}
            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
            title="Assign Leadership"
          >
            <UserPlus size={16} />
          </button>
          <button 
            onClick={onView}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
            title="View District Dashboard"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
}
