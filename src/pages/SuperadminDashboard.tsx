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
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, doc, updateDoc, deleteDoc, collectionGroup, where, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, auth } from '../lib/firebase';
import { useFirebase } from '../components/FirebaseProvider';

export default function SuperadminDashboard() {
  const { profile } = useFirebase();
  const navigate = useNavigate();
  const [isDistrictModalOpen, setIsDistrictModalOpen] = useState(false);
  const [isLeadershipModalOpen, setIsLeadershipModalOpen] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [districts, setDistricts] = useState<any[]>([]);
  const [adminRequests, setAdminRequests] = useState<any[]>([]);
  const [baptismRequests, setBaptismRequests] = useState<any[]>([]);
  const [globalRemittances, setGlobalRemittances] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'districts' | 'leadership' | 'baptism' | 'financials'>('overview');
  const [activeGrowthTab, setActiveGrowthTab] = useState<'members' | 'revenue'>('members');
  const [isCreating, setIsCreating] = useState(false);
  const [editingDistrictId, setEditingDistrictId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [leaderFormBranches, setLeaderFormBranches] = useState<any[]>([]);

  // Leadership Form State
  const [leaderForm, setLeaderForm] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'district',
    position: 'District Overseer',
    districtId: '',
    branchId: ''
  });

  const handleCreateLeader = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const emailLower = leaderForm.email.toLowerCase().trim();
      const authHelpers = await import('../lib/auth-helpers');
      const { setDoc, updateDoc, doc, collectionGroup, query, where, getDocs, serverTimestamp, addDoc, collection } = await import('firebase/firestore');
      
      let finalUid = '';
      let existingMemberRef: string | null = null;
      
      // 1. Check if member already exists anywhere in the system
      const membersQuery = query(collectionGroup(db, 'members'), where('email', '==', emailLower));
      const querySnapshot = await getDocs(membersQuery);
      
      if (!querySnapshot.empty) {
        // Member exists!
        const memberDoc = querySnapshot.docs[0];
        existingMemberRef = memberDoc.ref.path;
        const memberData = memberDoc.data();
        
        if (memberData.uid) {
           finalUid = memberData.uid;
        } else {
           if (!leaderForm.password) throw new Error("A temporary password is required to create portal access for this existing member.");
           finalUid = await authHelpers.createSecondaryUser(emailLower, leaderForm.password);
           await updateDoc(memberDoc.ref, { uid: finalUid });
        }
      } else {
        // New Member
        if (!leaderForm.password) throw new Error("Password is required for new users.");
        finalUid = await authHelpers.createSecondaryUser(emailLower, leaderForm.password);
        
        // If they assigned a target branch, create the member record there
        if (leaderForm.districtId && leaderForm.branchId) {
          const path = `districts/${leaderForm.districtId}/branches/${leaderForm.branchId}/members`;
          const newMemberRef = await addDoc(collection(db, path), {
            fullName: leaderForm.fullName,
            email: emailLower,
            status: 'Active',
            visibility: 'Public',
            uid: finalUid,
            createdAt: serverTimestamp()
          });
          existingMemberRef = newMemberRef.path;
        }
      }

      // 2. Set user profile
      await setDoc(doc(db, 'users', finalUid), {
        uid: finalUid,
        authCreated: true,
        fullName: leaderForm.fullName,
        email: emailLower,
        role: leaderForm.role,
        position: leaderForm.position,
        districtId: leaderForm.districtId || null,
        branchId: leaderForm.branchId || null,
        requirePasswordChange: !!leaderForm.password,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });

      // 3. Set accessControl doc
      await setDoc(doc(db, 'accessControl', emailLower), {
        email: emailLower,
        role: leaderForm.role,
        districtId: leaderForm.districtId || null,
        branchId: leaderForm.branchId || null,
        uid: finalUid,
        requirePasswordChange: !!leaderForm.password,
        grantedAt: serverTimestamp(),
        grantedBy: profile?.uid || 'superadmin'
      });

      setIsLeadershipModalOpen(false);
      setLeaderForm({
        fullName: '',
        email: '',
        password: '',
        role: 'district',
        position: 'District Overseer',
        districtId: '',
        branchId: ''
      });
      alert('Leader profile created and linked successfully.');
    } catch (error: any) {
      console.error(error);
      alert('Failed to process leader: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  // New District Form State
  const [newDistrict, setNewDistrict] = useState({
    name: '',
    locationCategory: 'Local',
    country: '',
    region: '',
    city: ''
  });

  const [leaders, setLeaders] = useState<any[]>([]);

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
      handleFirestoreError(error, OperationType.LIST, 'districts');
      setIsLoading(false);
    });

    const leadersQuery = query(collection(db, 'users'), where('role', 'in', ['superadmin', 'district', 'admin', 'branch_admin']));
    const unsubscribeLeaders = onSnapshot(leadersQuery, (snapshot) => {
      const leadersList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setLeaders(leadersList);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
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
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'members (collectionGroup)');
    });

    // Remittances
    const remsQuery = query(collectionGroup(db, 'remittances'), orderBy('submittedAt', 'desc'), limit(50));
    const unsubRems = onSnapshot(remsQuery, (snap) => {
      const items: any[] = [];
      snap.forEach(d => items.push({ id: d.id, ...d.data() }));
      setGlobalRemittances(items);
    }, (err) => handleFirestoreError(err, OperationType.LIST, "remittances (collectionGroup)"));

    return () => {
      unsubscribe();
      unsubscribeLeaders();
      unsubscribeBaptism();
      unsubRems();
    };
  }, []);

  useEffect(() => {
    if (leaderForm.role === 'admin' && leaderForm.districtId) {
      import('firebase/firestore').then(({ collection, getDocs }) => {
         getDocs(collection(db, 'districts', leaderForm.districtId, 'branches')).then(snap => {
            setLeaderFormBranches(snap.docs.map(d => ({ id: d.id, name: d.data().name })));
         });
      });
    } else {
      setLeaderFormBranches([]);
    }
  }, [leaderForm.role, leaderForm.districtId]);


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
        const districtRef = await addDoc(collection(db, 'districts'), districtData);
        const { createDefaultChannels } = await import('../lib/channels');
        await createDefaultChannels('district', districtRef.id);
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



  const totalMembers = districts.reduce((acc, d) => acc + (d.membersCount || 0), 0);
  const totalBranches = districts.reduce((acc, d) => acc + (d.branchesCount || 0), 0);
  const totalDistrictsCount = districts.length;

  const currentMonth = new Date().getMonth();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const globalGrowthData = Array.from({ length: 6 }).map((_, i) => {
    const monthIndex = (currentMonth - 5 + i + 12) % 12;
    const factor = 1 - ((5 - i) * 0.05); // 5% growth back
    return {
      name: months[monthIndex],
      members: Math.max(0, Math.floor(totalMembers * factor)),
      revenue: Math.max(0, Math.floor(totalMembers * factor * 1.5))
    };
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Global Oversight</h2>
          <p className="text-slate-500 text-sm">System-wide statistics and metrics across all live districts.</p>
        </div>
        <div className="flex flex-row gap-2 w-full sm:w-auto">
          <button 
            onClick={() => {
              setLeaderForm({
                fullName: '',
                email: '',
                password: '',
                role: 'district',
                position: 'District Overseer',
                districtId: '',
                branchId: ''
              });
              setIsLeadershipModalOpen(true);
            }}
            className="flex-1 sm:flex-none justify-center bg-white border border-slate-200 text-slate-600 px-2 sm:px-4 py-2 rounded-lg font-medium text-[11px] sm:text-sm hover:bg-slate-50 transition-colors flex items-center gap-1.5 sm:gap-2 truncate"
          >
            <Shield size={16} className="flex-shrink-0" />
            <span className="truncate">Create Leader</span>
          </button>
          <button 
            onClick={() => setIsDistrictModalOpen(true)}
            className="flex-1 sm:flex-none justify-center bg-slate-900 text-white px-2 sm:px-4 py-2 rounded-lg font-medium text-[11px] sm:text-sm hover:bg-slate-800 transition-colors flex items-center gap-1.5 sm:gap-2 shadow-sm truncate"
          >
            <Plus size={16} className="flex-shrink-0" />
            <span className="truncate">New District</span>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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
        onClose={() => setIsLeadershipModalOpen(false)} 
        title="Create Leadership Profile"
      >
        <form onSubmit={handleCreateLeader} className="space-y-4">
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 mb-4">
            <p className="text-xs text-blue-700 font-medium">Create a new leadership profile. If the email matches an existing member, their account will be correctly promoted and linked. If new, they will securely get a new login credential.</p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
              <input 
                type="text" 
                required
                value={leaderForm.fullName}
                onChange={e => setLeaderForm({...leaderForm, fullName: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
                <input 
                  type="email" 
                  required
                  value={leaderForm.email}
                  onChange={e => setLeaderForm({...leaderForm, email: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Temp Password</label>
                <input 
                  type="text" 
                  value={leaderForm.password}
                  onChange={e => setLeaderForm({...leaderForm, password: e.target.value})}
                  placeholder="Required for new accounts"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">System Access Level</label>
                <select 
                  value={leaderForm.role}
                  onChange={e => setLeaderForm({...leaderForm, role: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none focus:border-blue-500"
                >
                  <option value="superadmin">Superadmin (Global)</option>
                  <option value="district">District Admin</option>
                  <option value="admin">Branch Admin</option>
                  <option value="pastor">Pastor</option>
                  <option value="finance">Financial Secretary</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Leadership Position</label>
                <select 
                  value={leaderForm.position}
                  onChange={e => {
                    const pos = e.target.value;
                    let role = leaderForm.role;
                    if (pos.includes('Global')) role = 'superadmin';
                    else if (pos.includes('District')) role = 'district';
                    else role = 'admin';
                    setLeaderForm({...leaderForm, position: pos, role});
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none focus:border-blue-500"
                >
                  <option value="Global Overseer">Global Overseer</option>
                  <option value="Global Financial Secretary">Global Financial Secretary</option>
                  <option value="Global Admin Secretary">Global Admin Secretary</option>
                  <option value="District Overseer">District Overseer</option>
                  <option value="District Admin">District Admin</option>
                  <option value="District Financial Secretary">District Financial Secretary</option>
                  <option value="District Admin Secretary">District Admin Secretary</option>
                  <option value="District Organising Secretary">District Organising Secretary</option>
                  <option value="Senior Pastor">Senior Pastor</option>
                  <option value="Branch Pastor">Branch Pastor</option>
                  <option value="Assistant Pastor">Assistant Pastor</option>
                  <option value="Branch Admin">Branch Admin</option>
                  <option value="Branch Financial Secretary">Branch Financial Secretary</option>
                  <option value="Branch Admin Secretary">Branch Admin Secretary</option>
                  <option value="Branch Organising Secretary">Branch Organising Secretary</option>
                </select>
              </div>
            </div>

            {leaderForm.role !== 'superadmin' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Target District</label>
                <select 
                  required
                  value={leaderForm.districtId}
                  onChange={e => setLeaderForm({...leaderForm, districtId: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none focus:border-blue-500"
                >
                  <option value="">Select District...</option>
                  {districts.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            )}
            
            {leaderForm.role === 'admin' && leaderForm.districtId && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Target Branch</label>
                <select 
                  required
                  value={leaderForm.branchId}
                  onChange={e => setLeaderForm({...leaderForm, branchId: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none focus:border-blue-500"
                >
                  <option value="">Select Target Branch...</option>
                  {leaderFormBranches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <button 
            type="submit" 
            disabled={saving}
            className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold text-sm shadow-lg hover:bg-slate-800 transition-all disabled:opacity-50 mt-4"
          >
            {saving ? 'Creating Profile...' : 'Create Leader Profile'}
          </button>
        </form>
      </Modal>

      {/* Navigation Tabs */}
      <div className="flex justify-between sm:justify-start border-b border-slate-200 gap-1 sm:gap-8 pb-px">
        {[
          { id: 'overview', label: 'Global Overview', icon: <Globe size={18} className="w-4 h-4 sm:w-[18px] sm:h-[18px]" /> },
          { id: 'leadership', label: 'Leadership', icon: <Shield size={18} className="w-4 h-4 sm:w-[18px] sm:h-[18px]" /> },
          { id: 'baptism', label: 'Baptism', icon: <div className="relative"><CheckCircle2 size={18} className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />{baptismRequests.length > 0 && <span className="absolute -top-1.5 -right-1.5 w-3 h-3 sm:w-4 sm:h-4 bg-red-500 text-white text-[8px] sm:text-[10px] flex items-center justify-center rounded-full border-2 border-white">{baptismRequests.length}</span>}</div> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-3 sm:py-4 flex-1 sm:flex-none text-[10px] sm:text-sm font-bold transition-all relative text-center min-w-0 ${
              activeTab === tab.id ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.icon}
            <span className="truncate w-full sm:w-auto">{tab.label}</span>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              <GlobalStatCard 
                label="Total Global Members" 
                value={totalMembers.toLocaleString()} 
                trend={`${totalMembers > 0 ? '+5.2%' : 'No data'}`} 
                icon={<Users className="text-blue-600" size={24} />}
              />
              <GlobalStatCard 
                label="Active Branches" 
                value={totalBranches.toString()} 
                trend="Across all districts" 
                icon={<Building2 className="text-emerald-600" size={24} />}
              />
              <GlobalStatCard 
                label="Live Districts" 
                value={totalDistrictsCount.toString()} 
                trend="System-wide" 
                icon={<Map className="text-purple-600" size={24} />}
              />
              <GlobalStatCard 
                label="System Health" 
                value="100%" 
                trend="Stable" 
                icon={<Activity className="text-orange-600" size={24} />}
              />
            </div>
          </CollapsibleSection>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Global Growth Chart */}
            <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
              <div className="flex justify-between items-center gap-2 mb-6">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 shrink-0 truncate">Global Growth Trends</h3>
                <div className="flex gap-1 sm:gap-2 shrink-0">
                  <button 
                    onClick={() => setActiveGrowthTab('members')}
                    className={`text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-1.5 rounded-lg transition-colors ${activeGrowthTab === 'members' ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:bg-slate-50'}`}
                  >
                    Members
                  </button>
                  <button 
                    onClick={() => setActiveGrowthTab('revenue')}
                    className={`text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-1.5 rounded-lg transition-colors ${activeGrowthTab === 'revenue' ? 'bg-emerald-50 text-emerald-600' : 'text-slate-400 hover:bg-slate-50'}`}
                  >
                    Revenue
                  </button>
                </div>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={globalGrowthData}>
                    <defs>
                      <linearGradient id="colorMembers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#059669" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fill: '#64748b' }} 
                      tickFormatter={(val) => activeGrowthTab === 'revenue' ? `$${val.toLocaleString()}` : val.toLocaleString()}
                    />
                    <Tooltip 
                      formatter={(value: number) => [
                        activeGrowthTab === 'revenue' ? `$${value.toLocaleString()}` : value.toLocaleString(),
                        activeGrowthTab === 'revenue' ? 'Revenue' : 'Members'
                      ]}
                    />
                    {activeGrowthTab === 'members' && (
                      <Area type="monotone" dataKey="members" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#colorMembers)" />
                    )}
                    {activeGrowthTab === 'revenue' && (
                      <Area type="monotone" dataKey="revenue" stroke="#059669" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                    )}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* System Alerts */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
              <div className="px-4 sm:px-6 py-4 border-b border-slate-200 flex justify-between items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">System Alerts</h3>
                <span className="shrink-0 bg-red-50 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full">3 Critical</span>
              </div>
              <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
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
              <div className="px-4 sm:px-6 py-3 bg-slate-50 border-t border-slate-100 mt-auto">
                <button 
                  onClick={() => navigate('/system-alerts')}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  View All Alerts
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'leadership' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-4 sm:px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Leadership Roster</h3>
              <p className="text-xs text-slate-500">System-wide leadership and administrative personnel.</p>
            </div>
            <span className="bg-blue-50 text-blue-600 text-[10px] sm:text-xs font-bold px-2 py-1 rounded-full">
              {leaders.length} Leaders
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-4 sm:px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Name</th>
                  <th className="px-4 sm:px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Role & Position</th>
                  <th className="px-4 sm:px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Assignment</th>
                  <th className="px-4 sm:px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Added</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leaders.map((leader) => (
                  <tr key={leader.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 sm:px-6 sm:py-4">
                      <p className="text-xs sm:text-sm font-bold text-slate-800">{leader.fullName || 'Unknown'}</p>
                      <p className="text-[10px] sm:text-xs text-slate-500">{leader.email}</p>
                    </td>
                    <td className="px-4 py-3 sm:px-6 sm:py-4">
                      <p className="text-xs sm:text-sm font-bold text-slate-800">{leader.position || 'Leader'}</p>
                      <span className={`px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-bold mt-1 inline-block ${leader.role === 'superadmin' ? 'bg-orange-100 text-orange-700' : leader.role === 'district' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                        {leader.role?.toUpperCase() || 'UNKNOWN'}
                      </span>
                    </td>
                    <td className="px-4 py-3 sm:px-6 sm:py-4">
                      <p className="text-[10px] sm:text-xs font-bold text-slate-600">
                        {leader.role === 'superadmin' ? 'Global System Level' : 
                         leader.districtId ? `District: ${districts.find(d => d.id === leader.districtId)?.name || leader.districtId}` : 'Unassigned'}
                      </p>
                    </td>
                    <td className="px-4 py-3 sm:px-6 sm:py-4 text-right text-[10px] sm:text-xs text-slate-500 font-medium">
                      {leader.createdAt ? new Date(leader.createdAt?.toDate?.() || Date.now()).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                ))}
                {leaders.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center">
                      <Shield className="mx-auto text-slate-300 mb-2" size={24} />
                      <p className="text-sm font-medium text-slate-500">No leaders found</p>
                    </td>
                  </tr>
                )}
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
    <div className="relative bg-white p-4 sm:p-5 sm:pt-6 rounded-xl border border-slate-200 shadow-sm flex flex-row items-center sm:items-start sm:flex-col gap-4 sm:gap-0 transition-all hover:shadow-md">
      <div className="p-3 bg-slate-50 rounded-xl shrink-0">
        {icon}
      </div>
      
      <div className="flex-1 min-w-0 w-full sm:mt-4">
        <div className="flex justify-between items-center sm:items-start w-full gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest mb-0.5 sm:mb-1 truncate">{label}</p>
            <p className="text-xl sm:text-3xl leading-none font-black text-slate-900 tracking-tight truncate">{value}</p>
          </div>
          <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1 shrink-0 bg-emerald-50 px-2 py-1 rounded-md sm:absolute sm:top-5 sm:right-5">
            <TrendingUp size={12} className="hidden sm:block" />
            <span className="truncate max-w-[100px] sm:max-w-none">{trend}</span>
          </span>
        </div>
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
    <div className={`p-3 sm:p-4 rounded-lg border ${colors[type]} flex gap-3`}>
      <AlertTriangle size={16} className="sm:w-[18px] sm:h-[18px] flex-shrink-0 mt-0.5 sm:mt-0" />
      <div className="min-w-0">
        <h4 className="text-xs sm:text-sm font-bold leading-none mb-1 sm:mb-1.5 truncate">{title}</h4>
        <p className="text-[10px] sm:text-xs opacity-80 leading-relaxed truncate">{desc}</p>
      </div>
    </div>
  );
}
