import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Map, 
  Plus, 
  Loader2,
  Edit2,
  ChevronRight,
  UserPlus,
  Users
} from 'lucide-react';
import Modal from '../components/Modal';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, doc, updateDoc, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useFirebase } from '../components/FirebaseProvider';

interface DistrictRowProps {
  name: string;
  branches: number;
  members: string;
  growth: string;
  region?: string;
  city?: string;
  onAssign: (name: string) => void;
  onEdit: () => void;
  onView: () => void;
}

const DistrictCard: React.FC<DistrictRowProps> = ({ name, branches, members, growth, region, city, onAssign, onEdit, onView }) => {
  const isPositive = growth.startsWith('+');
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col gap-4 group" onClick={onView}>
      <div className="flex items-start justify-between gap-3 min-w-0">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
            <Map className="text-purple-600" size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-slate-800 truncate">{name}</p>
            <p className="text-[10px] sm:text-xs text-slate-500 flex items-center gap-1 group-hover:text-blue-600 transition-colors mt-0.5 truncate">
              {city || region || 'No location set'}
            </p>
          </div>
        </div>
        <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-1 shrink-0 bg-slate-50 rounded-lg p-0.5 border border-slate-100">
          <button 
            onClick={() => onAssign(name)}
            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-white rounded-md transition-all"
            title="Assign Administrator"
          >
            <UserPlus size={14} />
          </button>
          <button 
            onClick={onEdit}
            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-white rounded-md transition-all"
            title="Edit District"
          >
            <Edit2 size={14} />
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Branches</span>
          <div className="flex items-center gap-1.5 text-slate-700">
            <Building2 size={12} className="text-slate-400" />
            <span className="text-xs font-bold leading-none">{branches}</span>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Members</span>
          <span className="text-xs font-bold text-slate-700 leading-none">{members}</span>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Growth</span>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md leading-none flex items-center justify-center ${
            isPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
          }`}>
            {growth}
          </span>
        </div>
      </div>
    </div>
  );
};

const DistrictRow: React.FC<DistrictRowProps> = ({ name, branches, members, growth, onAssign, onEdit, onView }) => {
  const isPositive = growth.startsWith('+');
  return (
    <tr className="hover:bg-slate-50 transition-colors group cursor-pointer" onClick={onView}>
      <td className="px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
            <Map className="text-purple-600" size={16} />
          </div>
          <div>
            <p className="text-xs sm:text-sm font-bold text-slate-800">{name}</p>
            <p className="text-[10px] sm:text-xs text-slate-500 flex items-center gap-1 group-hover:text-blue-600 transition-colors">
              View Dashboard <ChevronRight size={12} />
            </p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex items-center gap-1.5 text-slate-600">
          <Building2 size={14} className="text-slate-400" />
          <span className="text-xs sm:text-sm font-bold">{branches}</span>
        </div>
      </td>
      <td className="px-4 py-3 sm:px-6 sm:py-4">
        <span className="text-xs sm:text-sm font-bold text-slate-700">{members}</span>
      </td>
      <td className="px-4 py-3 sm:px-6 sm:py-4 text-right">
        <div className="flex items-center justify-end gap-3 sm:gap-4">
          <span className={`text-[10px] sm:text-xs font-bold px-2 py-1 rounded-md ${
            isPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
          }`}>
            {growth}
          </span>
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => onAssign(name)}
              className="p-1.5 sm:p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
              title="Assign Administrator"
            >
              <UserPlus size={16} className="sm:w-[18px] sm:h-[18px]" />
            </button>
            <button 
              onClick={onEdit}
              className="p-1.5 sm:p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
              title="Edit District"
            >
              <Edit2 size={16} className="sm:w-[18px] sm:h-[18px]" />
            </button>
          </div>
        </div>
      </td>
    </tr>
  );
};

export default function AdminDistricts() {
  const { profile } = useFirebase();
  const navigate = useNavigate();
  const [districts, setDistricts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDistrictModalOpen, setIsDistrictModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingDistrictId, setEditingDistrictId] = useState<string | null>(null);

  const [newDistrict, setNewDistrict] = useState({
    name: '',
    locationCategory: 'Local',
    country: '',
    region: '',
    city: ''
  });

  useEffect(() => {
    let isMounted = true;
    const q = query(collection(db, 'districts'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      try {
        const districtsList = await Promise.all(snapshot.docs.map(async docSnap => {
          const dData = docSnap.data();
          let branchesCount = dData.branchesCount || 0;
          let membersCount = dData.membersCount || 0;
          
          try {
            const bSnap = await getDocs(collection(db, 'districts', docSnap.id, 'branches'));
            branchesCount = bSnap.size;
            
            const membersPromises = bSnap.docs.map(async (branchDoc) => {
              const mSnap = await getDocs(collection(db, 'districts', docSnap.id, 'branches', branchDoc.id, 'members'));
              return mSnap.size;
            });
            
            const memberCounts = await Promise.all(membersPromises);
            membersCount = memberCounts.reduce((a, b) => a + b, 0);
          } catch (e) {
            console.error("Error fetching branches/members count", e);
          }

          return {
            id: docSnap.id,
            ...dData,
            branchesCount,
            membersCount
          };
        }));
        
        if (isMounted) {
          setDistricts(districtsList);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error processing districts:", error);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'districts');
      if (isMounted) setIsLoading(false);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

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

  const totalDistricts = districts.length;
  const totalBranches = districts.reduce((sum, d) => sum + (d.branchesCount || 0), 0);
  const totalMembers = districts.reduce((sum, d) => sum + (d.membersCount || 0), 0);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-7xl mx-auto pb-24 md:pb-12 w-full"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight uppercase">Districts</h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">Manage districts and territories.</p>
        </div>
        
        <button 
          onClick={() => setIsDistrictModalOpen(true)}
          className="hidden md:flex bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold text-sm tracking-wide hover:bg-slate-800 transition-all shadow-sm items-center justify-center gap-2"
        >
          <Plus size={18} />
          New District
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Map size={16} />
          </div>
          <div>
            <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest leading-tight mb-0.5">Total Districts</p>
            <p className="text-xl sm:text-2xl font-black text-slate-800">{totalDistricts}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Building2 size={16} />
          </div>
          <div>
            <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest leading-tight mb-0.5">Total Branches</p>
            <p className="text-xl sm:text-2xl font-black text-slate-800">{totalBranches}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
            <Users size={16} />
          </div>
          <div>
            <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest leading-tight mb-0.5">Total Members</p>
            <p className="text-xl sm:text-2xl font-black text-slate-800">{totalMembers.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Floating Action Button (Mobile Only) */}
      <div className="fixed bottom-6 right-6 md:hidden z-50">
        <button 
          onClick={() => setIsDistrictModalOpen(true)}
          className="w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition-transform active:scale-95"
        >
          <Plus size={24} />
        </button>
      </div>

      {/* Mobile/Tablet Card View */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden">
        {isLoading ? (
          <div className="col-span-1 sm:col-span-2 py-8 flex flex-col items-center gap-2">
            <Loader2 className="animate-spin text-blue-600" size={24} />
            <span className="text-sm text-slate-500">Loading districts...</span>
          </div>
        ) : districts.length === 0 ? (
          <div className="col-span-1 sm:col-span-2 bg-white rounded-xl border border-slate-200 py-8 text-center text-sm text-slate-500 shadow-sm">
            No districts found. Create your first district to get started.
          </div>
        ) : (
          districts.map((district) => (
            <DistrictCard
              key={district.id}
              name={district.name} 
              branches={district.branchesCount || 0} 
              members={district.membersCount?.toLocaleString() || "0"} 
              growth={district.growth || "0%"} 
              region={district.region}
              city={district.city}
              onAssign={(name) => { navigate('/dashboard'); }}
              onEdit={() => handleEditClick(district)}
              onView={() => { navigate(`/district/${district.id}`); }} 
            />
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[500px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 sm:px-6 sm:py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">District Name</th>
                <th className="px-4 py-3 sm:px-6 sm:py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Branches</th>
                <th className="px-4 py-3 sm:px-6 sm:py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Members</th>
                <th className="px-4 py-3 sm:px-6 sm:py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Growth</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 sm:px-6 text-center">
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
                    region={district.region}
                    city={district.city}
                    onAssign={(name) => { 
                      navigate('/dashboard'); // Direct them back to the dashboard leadership section
                    }}
                    onEdit={() => handleEditClick(district)}
                    onView={() => { navigate(`/district/${district.id}`); }} 
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

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
    </motion.div>
  );
}
