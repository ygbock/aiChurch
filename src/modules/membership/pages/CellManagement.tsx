import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Plus, 
  Search, 
  MapPin, 
  Calendar as CalendarIcon, 
  Clock, 
  ChevronRight, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  UserPlus, 
  Filter,
  CheckCircle2,
  X,
  Loader2,
  Settings
} from 'lucide-react';
import { useFirebase } from '../../../components/FirebaseProvider';
import { collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, getDocs, where, writeBatch, collectionGroup } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../../lib/firebase';
import Modal from '../../../components/Modal';
import { toast } from 'sonner';
import { useRole } from '../../../components/Layout';

interface Cell {
  id: string;
  name: string;
  location: string;
  leaderId: string;
  leaderName: string;
  meetingDay: string;
  meetingTime: string;
  memberCount?: number;
}

interface Member {
  id: string;
  fullName: string;
  cellId?: string;
  cellName?: string;
}

export default function CellManagement() {
  const { profile } = useFirebase();
  const { role } = useRole();
  const isSuperAdmin = role === 'superadmin';
  const [cells, setCells] = useState<Cell[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState<Cell | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [availableMembers, setAvailableMembers] = useState<Member[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    leaderId: '',
    leaderName: '',
    meetingDay: 'Sunday',
    meetingTime: '18:00'
  });

  const cellsPath = `districts/${profile?.districtId}/branches/${profile?.branchId}/cells`;
  const membersPath = `districts/${profile?.districtId}/branches/${profile?.branchId}/members`;

  useEffect(() => {
    let q;
    
    if (isSuperAdmin) {
      q = query(collectionGroup(db, 'cells'));
    } else {
      if (!profile?.districtId || !profile?.branchId) {
        setLoading(false);
        return;
      }
      q = query(collection(db, cellsPath));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCells(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Cell)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, isSuperAdmin ? 'cells (collectionGroup)' : cellsPath);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profile, isSuperAdmin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.districtId || !profile?.branchId) return;

    try {
      if (selectedCell) {
        await updateDoc(doc(db, cellsPath, selectedCell.id), {
          ...formData,
          updatedAt: serverTimestamp()
        });
        toast.success('Cell updated successfully');
      } else {
        await addDoc(collection(db, cellsPath), {
          ...formData,
          branchId: profile.branchId,
          districtId: profile.districtId,
          createdAt: serverTimestamp()
        });
        toast.success('New Cell created successfully');
      }
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      handleFirestoreError(error, selectedCell ? OperationType.UPDATE : OperationType.CREATE, cellsPath);
    }
  };

  const handleDelete = async (cellId: string) => {
    if (!window.confirm('Are you sure you want to delete this cell?')) return;
    try {
      await deleteDoc(doc(db, cellsPath, cellId));
      toast.success('Cell deleted');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, cellsPath);
    }
  };

  const openAssignModal = async (cell: Cell) => {
    setSelectedCell(cell);
    setIsAssignModalOpen(true);
    setLoadingMembers(true);
    try {
      const snap = await getDocs(query(collection(db, membersPath)));
      const members = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Member));
      setAvailableMembers(members);
      
      // Pre-select members already in this cell
      const inCell = members.filter(m => m.cellId === cell.id).map(m => m.id);
      setSelectedMembers(inCell);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, membersPath);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleAssignMembers = async () => {
    if (!selectedCell || !profile?.districtId || !profile?.branchId) return;

    setLoadingMembers(true);
    try {
      const batch = writeBatch(db);
      
      // Update each selected member
      for (const memberId of selectedMembers) {
        const memberRef = doc(db, membersPath, memberId);
        batch.update(memberRef, {
          cellId: selectedCell.id,
          cellName: selectedCell.name
        });
      }

      // Find members that were removed from this cell
      const removedMembers = availableMembers.filter(m => m.cellId === selectedCell.id && !selectedMembers.includes(m.id));
      for (const m of removedMembers) {
        const memberRef = doc(db, membersPath, m.id);
        batch.update(memberRef, {
          cellId: null,
          cellName: null
        });
      }

      await batch.commit();
      toast.success(`Updated assignments for ${selectedCell.name}`);
      setIsAssignModalOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'members assignment');
    } finally {
      setLoadingMembers(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      location: '',
      leaderId: '',
      leaderName: '',
      meetingDay: 'Sunday',
      meetingTime: '18:00'
    });
    setSelectedCell(null);
  };

  const filteredCells = cells.filter(cell => 
    cell.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cell.leaderName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cell.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
        <div>
           <div className="flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full w-fit mb-4">
             <Users size={14} />
             <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Phase 3: Branch Operations</span>
           </div>
           <h1 className="text-4xl font-black text-slate-900 tracking-tight italic">HOME CELL <span className="text-indigo-600">MANAGEMENT</span></h1>
           <p className="text-slate-500 font-medium mt-2">Manage small groups and care units within your branch.</p>
        </div>
        {!isSuperAdmin && (
          <button 
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="flex items-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
          >
            <Plus size={18} />
            CREATE NEW CELL
          </button>
        )}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar / Filters */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Filter size={14} /> Search & Filter
            </h3>
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Search cells..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border-none rounded-2xl pl-12 pr-4 py-4 text-sm font-bold shadow-inner outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            </div>
          </div>

          <div className="bg-indigo-600 p-6 rounded-[2rem] text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12" />
             <div className="relative z-10">
                <Settings size={24} className="mb-4 opacity-60" />
                <h4 className="text-lg font-bold mb-1">Cell Strategy</h4>
                <p className="text-indigo-100 text-xs font-medium mb-4">Every member should belong to a care unit to ensure spiritual oversight.</p>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                  <CheckCircle2 size={14} /> Global Mandate
                </div>
             </div>
          </div>
        </div>

        {/* Cells List */}
        <div className="lg:col-span-3">
          {loading ? (
             <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2.5rem] border border-slate-50">
               <Loader2 className="animate-spin text-indigo-600 mb-4" size={32} />
               <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest italic">Scanning Records...</p>
             </div>
          ) : filteredCells.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2.5rem] border border-slate-100 text-center px-6">
               <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-6">
                 <Users size={40} />
               </div>
               <h3 className="text-xl font-bold text-slate-900 mb-2">No Cells Found</h3>
               <p className="text-slate-500 max-w-sm font-medium italic">Transform your branch into a network of small care groups.</p>
               {!isSuperAdmin && (
                 <button 
                   onClick={() => { resetForm(); setIsModalOpen(true); }}
                   className="mt-8 text-indigo-600 font-black text-xs uppercase tracking-widest hover:underline"
                 >
                   Create Your First Home Cell
                 </button>
               )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredCells.map(cell => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  key={cell.id} 
                  className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                      <Users size={28} />
                    </div>
                    {!isSuperAdmin && (
                      <div className="flex gap-2">
                        <button 
                           onClick={() => { setSelectedCell(cell); setFormData({...cell}); setIsModalOpen(true); }}
                           className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                           onClick={() => handleDelete(cell.id)}
                           className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>

                  <h3 className="text-2xl font-black text-slate-900 tracking-tight italic uppercase mb-4">{cell.name}</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-black text-[10px]">
                         {cell.leaderName?.charAt(0)}
                       </div>
                       <div>
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Leader</p>
                         <p className="text-sm font-bold text-slate-900 uppercase">{cell.leaderName}</p>
                       </div>
                    </div>

                    <div className="flex flex-wrap gap-4 pt-4 border-t border-slate-50">
                       <div className="flex items-center gap-1.5 text-slate-500">
                         <MapPin size={14} className="text-indigo-500" />
                         <span className="text-[10px] font-bold uppercase">{cell.location}</span>
                       </div>
                       <div className="flex items-center gap-1.5 text-slate-500">
                         <CalendarIcon size={14} className="text-indigo-500" />
                         <span className="text-[10px] font-bold uppercase">{cell.meetingDay} @ {cell.meetingTime}</span>
                       </div>
                    </div>

                    {!isSuperAdmin && (
                      <button 
                        onClick={() => openAssignModal(cell)}
                        className="w-full mt-6 py-4 bg-slate-50 group-hover:bg-indigo-600 group-hover:text-white text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                      >
                        <UserPlus size={16} />
                        Assign Members
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={selectedCell ? "Refine Cell Parameters" : "Initialize New Care Unit"}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Cell Name</label>
                <input 
                  type="text" 
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g. Grace Fellowship"
                  className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold shadow-inner outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Location / Host</label>
                <input 
                  type="text" 
                  value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})}
                  placeholder="e.g. 12 Main St / Sis Mary"
                  className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold shadow-inner outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                  required
                />
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Cell Leader Name</label>
                <input 
                  type="text" 
                  value={formData.leaderName} onChange={e => setFormData({...formData, leaderName: e.target.value})}
                  placeholder="e.g. Deacon John Doe"
                  className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold shadow-inner outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Leader UID (Optional)</label>
                <input 
                  type="text" 
                  value={formData.leaderId} onChange={e => setFormData({...formData, leaderId: e.target.value})}
                  placeholder="Leader UID"
                  className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold shadow-inner outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                  required
                />
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Meeting Day</label>
                <select 
                  value={formData.meetingDay} onChange={e => setFormData({...formData, meetingDay: e.target.value})}
                  className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 transition-all appearance-none shadow-inner"
                >
                  {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Meeting Time</label>
                <input 
                  type="time" 
                  value={formData.meetingTime} onChange={e => setFormData({...formData, meetingTime: e.target.value})}
                  className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold shadow-inner outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                  required
                />
              </div>
           </div>

           <button 
             type="submit"
             className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 mt-4"
           >
             {selectedCell ? 'Confirm Update' : 'Initialize Cell'}
           </button>
        </form>
      </Modal>

      {/* Member Assignment Modal */}
      <Modal 
        isOpen={isAssignModalOpen} 
        onClose={() => setIsAssignModalOpen(false)} 
        title={`Assign Members to ${selectedCell?.name}`}
      >
        <div className="space-y-6">
           <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Find members by name..." 
                className="w-full bg-slate-50 border-none rounded-2xl pl-12 pr-4 py-4 text-sm font-bold shadow-inner outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
              />
           </div>

           <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
              {loadingMembers ? (
                 <div className="flex justify-center py-10">
                   <Loader2 className="animate-spin text-indigo-600" size={24} />
                 </div>
              ) : availableMembers.length === 0 ? (
                <p className="text-center text-slate-400 text-sm italic py-10">No members found in this branch.</p>
              ) : (
                availableMembers.map(member => (
                   <div 
                     key={member.id} 
                     onClick={() => {
                        setSelectedMembers(prev => 
                          prev.includes(member.id) ? prev.filter(id => id !== member.id) : [...prev, member.id]
                        );
                     }}
                     className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all border ${
                       selectedMembers.includes(member.id) 
                        ? 'bg-indigo-50 border-indigo-200' 
                        : 'bg-white border-transparent hover:bg-slate-50'
                     }`}
                   >
                      <div className="flex items-center gap-3">
                         <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black ${
                            selectedMembers.includes(member.id) ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'
                         }`}>
                           {member.fullName.charAt(0)}
                         </div>
                         <div>
                            <p className={`text-sm font-bold ${selectedMembers.includes(member.id) ? 'text-indigo-900' : 'text-slate-900'}`}>
                              {member.fullName}
                            </p>
                            {member.cellName && member.cellId !== selectedCell?.id && (
                              <p className="text-[9px] font-black uppercase text-amber-600">Currently in {member.cellName}</p>
                            )}
                         </div>
                      </div>
                      {selectedMembers.includes(member.id) && <CheckCircle2 size={18} className="text-indigo-600" />}
                   </div>
                ))
              )}
           </div>

           <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
              <button 
                onClick={() => setIsAssignModalOpen(false)}
                className="flex-1 py-4 bg-slate-50 text-slate-600 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-100 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleAssignMembers}
                disabled={loadingMembers}
                className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50"
              >
                {loadingMembers ? 'Saving...' : 'Confirm Assignments'}
              </button>
           </div>
        </div>
      </Modal>
    </div>
  );
}
