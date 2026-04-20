import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Filter, 
  UserPlus, 
  MoreVertical, 
  Mail, 
  Phone,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Users as UsersIcon,
  History,
  Check,
  CheckSquare,
  Square,
  Download,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useRole } from '../components/Layout';
import { collection, onSnapshot, query, orderBy, limit, collectionGroup, where, writeBatch, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useFirebase } from '../components/FirebaseProvider';

interface MemberData {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  branchId: string;
  districtId: string;
  level: string;
  status: string;
  baptismStatus?: string;
  isBaptised?: boolean;
}

export default function Members() {
  const navigate = useNavigate();
  const { role } = useRole();
  const { profile } = useFirebase();
  const [members, setMembers] = useState<MemberData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [baptismFilter, setBaptismFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  
  const isBranchAdmin = role === 'admin';
  const isSuperAdmin = role === 'superadmin';

  useEffect(() => {
    let q;
    if (isSuperAdmin) {
      // Superadmins see everything via collectionGroup
      q = query(
        collectionGroup(db, 'members'),
        orderBy('createdAt', 'desc'),
        limit(100)
      );
    } else {
      const districtId = profile?.districtId || 'default-district';
      const branchId = profile?.branchId || 'default-branch';
      const path = `/districts/${districtId}/branches/${branchId}/members`;
      
      q = query(
        collection(db, path),
        orderBy('createdAt', 'desc'),
        limit(100)
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MemberData[];
      
      setMembers(docs);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'members');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profile]);

  const filteredMembers = members.filter(m => {
    const matchesSearch = (
      m.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      m.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.phone?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    const matchesLevel = levelFilter === 'all' || m.level === levelFilter;
    
    const matchesBaptism = baptismFilter === 'all' || 
      (baptismFilter === 'baptised' && m.isBaptised) ||
      (baptismFilter === 'awaiting' && !m.isBaptised) ||
      (baptismFilter === 'pending' && m.baptismStatus === 'Pending');

    const matchesStatus = statusFilter === 'all' || m.status === statusFilter;

    return matchesSearch && matchesLevel && matchesBaptism && matchesStatus;
  });

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredMembers.map(m => m.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkUpdate = async (field: 'level' | 'status', value: string) => {
    if (selectedIds.length === 0) return;
    setIsBulkUpdating(true);
    try {
      const batch = writeBatch(db);
      
      // We need to find the full path for each member
      // Since they are from snapshot, we can find them in the 'members' array
      for (const id of selectedIds) {
        const member = members.find(m => m.id === id);
        if (member) {
          const path = `/districts/${member.districtId}/branches/${member.branchId}/members/${id}`;
          batch.update(doc(db, path), { [field]: value, updatedAt: new Date() });
        }
      }
      
      await batch.commit();
      setSelectedIds([]);
      // Success toast would be nice here, but we'll stick to basic state update
    } catch (error) {
      console.error("Bulk update failed:", error);
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const handleExport = () => {
    if (selectedIds.length === 0) return;
    
    const selectedMembers = members.filter(m => selectedIds.includes(m.id));
    const headers = ['FullName', 'Email', 'Phone', 'Level', 'Status', 'Baptised', 'BaptismStatus'];
    const csvContent = [
      headers.join(','),
      ...selectedMembers.map(m => [
        `"${m.fullName}"`,
        `"${m.email || ''}"`,
        `"${m.phone || ''}"`,
        `"${m.level}"`,
        `"${m.status}"`,
        `"${m.isBaptised ? 'Yes' : 'No'}"`,
        `"${m.baptismStatus || 'N/A'}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `members_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const appendParams = (path: string) => path;

  const canAddMember = ['admin', 'district', 'superadmin'].includes(role);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <button 
            onClick={() => window.history.length > 1 ? window.history.back() : window.location.href = '/'}
            className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-blue-600 mb-2 transition-colors"
          >
            <ChevronLeft size={16} />
            Back
          </button>
          <h2 className="text-2xl font-bold text-slate-900">Member Directory</h2>
          <p className="text-slate-500 text-sm max-w-xl">
            {role === 'admin' ? 'Manage members in Main Campus branch.' : 
             role === 'district' ? 'Manage members across North America District.' :
             'Manage and view all registered members across branches.'}
          </p>
        </div>
        {canAddMember && (
          <button 
            onClick={() => navigate(appendParams('/members/new'))}
            className="w-full lg:w-auto bg-blue-600 text-white px-6 py-3 lg:py-2 rounded-xl lg:rounded-lg font-bold lg:font-medium text-sm hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-md lg:shadow-sm active:scale-95"
          >
            <UserPlus size={18} />
            Add New Member
          </button>
        )}
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, or phone..." 
              className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition-all outline-none"
            />
          </div>
          <div className="flex flex-wrap gap-2 w-full lg:w-auto">
            <div className="relative flex-1 lg:flex-none min-w-[140px]">
              <select 
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 outline-none focus:ring-1 focus:ring-blue-600 appearance-none"
              >
                <option value="all">All Levels</option>
                <option value="Convert">Convert</option>
                <option value="Disciple">Disciple</option>
                <option value="Worker">Worker</option>
                <option value="Leader">Leader</option>
              </select>
              <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
            </div>

            <div className="relative flex-1 lg:flex-none min-w-[160px]">
              <select 
                value={baptismFilter}
                onChange={(e) => setBaptismFilter(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 outline-none focus:ring-1 focus:ring-blue-600 appearance-none"
              >
                <option value="all">Baptism Status</option>
                <option value="baptised">Baptised</option>
                <option value="awaiting">Awaiting Baptism</option>
                <option value="pending">Pending Approval</option>
              </select>
              <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
            </div>

            <div className="relative flex-1 lg:flex-none min-w-[120px]">
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 outline-none focus:ring-1 focus:ring-blue-600 appearance-none"
              >
                <option value="all">Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Archived">Archived</option>
              </select>
              <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
            </div>
          </div>
        </div>

        {/* Bulk Action Bar */}
        <AnimatePresence>
          {selectedIds.length > 0 && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-600 text-white w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shadow-sm">
                    {selectedIds.length}
                  </div>
                  <span className="text-sm font-bold text-blue-900">Members Selected</span>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <div className="relative">
                    <select 
                      onChange={(e) => handleBulkUpdate('level', e.target.value)}
                      className="bg-white border border-blue-200 rounded-lg px-4 py-2 text-xs font-bold text-blue-700 outline-none hover:bg-blue-100 transition-colors cursor-pointer appearance-none pr-8"
                      defaultValue=""
                    >
                      <option value="" disabled>Assign Level</option>
                      <option value="Convert">Convert</option>
                      <option value="Disciple">Disciple</option>
                      <option value="Worker">Worker</option>
                      <option value="Leader">Leader</option>
                    </select>
                    <ShieldCheck className="absolute right-2.5 top-1/2 -translate-y-1/2 text-blue-400 pointer-events-none" size={14} />
                  </div>

                  <div className="relative">
                    <select 
                      onChange={(e) => handleBulkUpdate('status', e.target.value)}
                      className="bg-white border border-blue-200 rounded-lg px-4 py-2 text-xs font-bold text-blue-700 outline-none hover:bg-blue-100 transition-colors cursor-pointer appearance-none pr-8"
                      defaultValue=""
                    >
                      <option value="" disabled>Change Status</option>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Archived">Archived</option>
                    </select>
                    <Zap className="absolute right-2.5 top-1/2 -translate-y-1/2 text-blue-400 pointer-events-none" size={14} />
                  </div>

                  <button 
                    onClick={handleExport}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-blue-200 rounded-lg text-xs font-bold text-blue-700 hover:bg-blue-100 transition-colors"
                  >
                    <Download size={14} />
                    Export CSV
                  </button>
                  
                  <button 
                    onClick={() => setSelectedIds([])}
                    className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="animate-spin text-blue-600" size={32} />
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Initialising Directory...</p>
          </div>
        ) : members.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4 border border-slate-100">
              <UsersIcon size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No Members Found</h3>
            <p className="text-slate-500 text-sm max-w-sm mt-1 mb-6">There are no registered members for this branch yet. Get started by adding your first congregant.</p>
            {canAddMember && (
              <button 
                onClick={() => navigate(appendParams('/members/new'))}
                className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all"
              >
                Register First Member
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="pl-6 py-4 w-10">
                    <input 
                      type="checkbox" 
                      onChange={handleSelectAll}
                      checked={selectedIds.length === filteredMembers.length && filteredMembers.length > 0}
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                    />
                  </th>
                  <th className="px-4 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Member</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Contact Info</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    {isBranchAdmin ? 'Level' : 'Branch'}
                  </th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 italic">
                <AnimatePresence mode="popLayout">
                  {filteredMembers.map((member: MemberData) => (
                      <MemberTableRow 
                        key={member.id}
                        id={member.id}
                        name={member.fullName || 'Unknown'} 
                        email={member.email || 'N/A'} 
                        phone={member.phone || 'N/A'} 
                        branch={member.level || 'Convert'} 
                        branchId={member.branchId}
                        districtId={member.districtId}
                        status={member.status || 'Pending'} 
                        baptismStatus={member.baptismStatus}
                        statusType={member.status === 'Active' ? 'success' : member.status === 'Pending' ? 'warning' : 'info'}
                        isSelected={selectedIds.includes(member.id)}
                        onToggleSelect={() => handleToggleSelect(member.id)}
                      />
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <p className="text-xs text-slate-500 font-medium">Showing 1 to 5 of 1,248 members</p>
          <div className="flex items-center gap-2">
            <button className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-50" disabled>
              <ChevronLeft size={20} />
            </button>
            <div className="flex items-center gap-1">
              <button className="w-8 h-8 rounded-lg bg-blue-600 text-white text-xs font-bold">1</button>
              <button className="w-8 h-8 rounded-lg hover:bg-slate-200 text-slate-600 text-xs font-bold">2</button>
              <button className="w-8 h-8 rounded-lg hover:bg-slate-200 text-slate-600 text-xs font-bold">3</button>
              <span className="text-slate-400 px-1">...</span>
              <button className="w-8 h-8 rounded-lg hover:bg-slate-200 text-slate-600 text-xs font-bold">250</button>
            </div>
            <button className="p-1 text-slate-400 hover:text-slate-600">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

interface MemberTableRowProps {
  id: string;
  name: string;
  email: string;
  phone: string;
  branch: string;
  branchId?: string;
  districtId?: string;
  status: string;
  baptismStatus?: string;
  statusType: 'success' | 'warning' | 'info';
  isSelected: boolean;
  onToggleSelect: () => void;
}

const MemberTableRow: React.FC<MemberTableRowProps> = ({ 
  id, name, email, phone, branch, branchId, districtId, status, baptismStatus, statusType, isSelected, onToggleSelect 
}) => {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const statusClasses = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    warning: 'bg-orange-50 text-orange-700 border-orange-100',
    info: 'bg-slate-100 text-slate-600 border-slate-200'
  };

  const handleEdit = () => {
    let url = `/members/edit/${id}`;
    if (districtId && branchId) {
      url += `?districtId=${districtId}&branchId=${branchId}`;
    }
    navigate(url);
  };

  return (
    <motion.tr 
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`transition-colors group min-h-[64px] ${isSelected ? 'bg-blue-50/50 hover:bg-blue-50' : 'hover:bg-slate-50'}`}
    >
      <td className="pl-6 py-4">
        <input 
          type="checkbox" 
          checked={isSelected}
          onChange={onToggleSelect}
          className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
        />
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-sm">
            {name.charAt(0)}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">{name}</p>
            <p className="text-[10px] text-slate-400">ID: {id.slice(0, 8).toUpperCase()}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Mail size={12} className="text-slate-400" />
            {email}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Phone size={12} className="text-slate-400" />
            {phone}
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-slate-600">{branch}</td>
      <td className="px-6 py-4">
        <div className="flex flex-col gap-1">
          <span className={`w-fit px-2.5 py-1 rounded-full text-[10px] font-bold border ${statusClasses[statusType]}`}>
            {status}
          </span>
          {baptismStatus && baptismStatus !== 'Approved' && (
            <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 uppercase tracking-tighter">
              Baptism: {baptismStatus}
            </span>
          )}
        </div>
      </td>
      <td className="px-6 py-4 text-right relative">
        <button 
          onClick={() => setShowMenu(!showMenu)}
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <MoreVertical size={18} />
        </button>

        <AnimatePresence>
          {showMenu && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setShowMenu(false)}
              ></div>
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                className="absolute right-6 top-14 w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-20 overflow-hidden"
              >
                <div className="py-1">
                  <button 
                    onClick={handleEdit}
                    className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2"
                  >
                    <UserPlus size={14} className="text-slate-400" />
                    Edit Member
                  </button>
                  <button className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2">
                    <History size={14} className="text-slate-400" />
                    View History
                  </button>
                  <button className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2 border-t border-slate-50 mt-1">
                    <MoreVertical size={14} className="text-red-400 rotate-90" />
                    Archive Member
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </td>
    </motion.tr>
  );
};
