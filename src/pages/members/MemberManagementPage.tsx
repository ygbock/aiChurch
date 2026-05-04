import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Send, ArrowDownToLine, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { deleteDoc, doc, collectionGroup, getDocs, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useMembers } from './hooks/useMembers';
import { useMemberFilters } from './hooks/useMemberFilters';
import { MemberStats } from './components/MemberStats';
import { TabNavigation } from './components/TabNavigation';
import { MemberToolbar } from './components/MemberToolbar';
import { MemberTable } from './components/MemberTable';
import { SuperAdminAddMemberModal } from './components/SuperAdminAddMemberModal';
import { Button } from '@/components/ui/button';
import { MemberData } from '@/types/membership';
import { useFirebase } from '@/components/FirebaseProvider';

export default function MemberManagementPage() {
  const navigate = useNavigate();
  const { profile } = useFirebase();
  const { members, loading } = useMembers();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [showSuperAdminModal, setShowSuperAdminModal] = useState(false);
  const { searchQuery, setSearchQuery, activeTab, setActiveTab, filteredMembers, filters, setFilters } = useMemberFilters(members, profile?.role || 'member');
  
  // To display names instead of IDs
  const [districtMaps, setDistrictMaps] = useState<Record<string, string>>({});
  const [branchMaps, setBranchMaps] = useState<Record<string, string>>({});
  const [branchOptions, setBranchOptions] = useState<Record<string, {id: string, name: string}[]>>({});

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        if (profile?.role === 'superadmin') {
          const dSnap = await getDocs(collection(db, 'districts'));
          const dMap: Record<string, string> = {};
          dSnap.docs.forEach(d => { dMap[d.id] = d.data().name || 'Unnamed District' });
          setDistrictMaps(dMap);
          
          // Fetch all branches
          const bMap: Record<string, string> = {};
          const bOpts: Record<string, {id: string, name: string}[]> = {};
          await Promise.all(dSnap.docs.map(async (dDoc) => {
            const bSnap = await getDocs(collection(db, 'districts', dDoc.id, 'branches'));
            bOpts[dDoc.id] = [];
            bSnap.docs.forEach(b => {
              const bname = b.data().name || 'Unnamed Branch';
              bMap[b.id] = bname;
              bOpts[dDoc.id].push({ id: b.id, name: bname });
            });
          }));
          setBranchMaps(bMap);
          setBranchOptions(bOpts);
        } else if (profile?.role === 'district' && profile.districtId) {
          // Fetch branches just for this district
          const bMap: Record<string, string> = {};
          const bSnap = await getDocs(collection(db, 'districts', profile.districtId, 'branches'));
          bSnap.docs.forEach(b => {
            bMap[b.id] = b.data().name || 'Unnamed Branch';
          });
          setBranchMaps(bMap);
        }
      } catch (err: any) {
        console.error("Failed to load locations", err);
        toast.error(`Failed to load locations: ${err.message}`);
      }
    };
    if (profile?.role === 'superadmin' || profile?.role === 'district') {
      fetchLocations();
    }
  }, [profile]);

  const locationFilteredMembers = useMemo(() => {
    let baseMembers = members;
    if (profile?.role === 'superadmin' || profile?.role === 'district') {
      if (filters.district !== 'All') {
        baseMembers = baseMembers.filter(m => m.districtId === filters.district);
      }
      if (filters.branch !== 'All') {
        baseMembers = baseMembers.filter(m => m.branchId === filters.branch);
      }
    }
    return baseMembers;
  }, [members, profile, filters.district, filters.branch]);

  const counts = useMemo(() => {
    let baseMembers = locationFilteredMembers;
    
    // For superadmin and district leaders, the tabs serve as sub-filters for the member list
    if (profile?.role === 'superadmin' || profile?.role === 'district') {
      const activeMembers = baseMembers.filter(m => m.level !== 'Visitor' && m.membershipLevel !== 'visitor' && m.level !== 'Convert' && m.membershipLevel !== 'convert');
      return {
        'All Member': activeMembers.length,
        Member: activeMembers.length,
        Visitor: baseMembers.filter(m => m.level === 'Visitor' || m.membershipLevel === 'visitor').length,
        Convert: baseMembers.filter(m => m.level === 'Convert' || m.membershipLevel === 'convert').length,
        Leader: activeMembers.filter(m => {
          const ml = m.baptizedSubLevel?.toLowerCase() || m.level?.toLowerCase();
          return ['leader', 'admin', 'district', 'superadmin'].includes(ml || '');
        }).length,
        Worker: activeMembers.filter(m => {
          const ml = m.baptizedSubLevel?.toLowerCase() || m.level?.toLowerCase();
          return ml === 'worker';
        }).length,
        Disciple: activeMembers.filter(m => {
          const ml = m.baptizedSubLevel?.toLowerCase() || m.level?.toLowerCase() || 'disciple';
          return ml === 'disciple' || !['leader', 'admin', 'district', 'superadmin', 'worker'].includes(ml);
        }).length,
      };
    }
    
    return {
      'All Member': baseMembers.length,
      Member: baseMembers.filter(m => m.level !== 'Visitor' && m.membershipLevel !== 'visitor' && m.level !== 'Convert' && m.membershipLevel !== 'convert').length,
      Visitor: baseMembers.filter(m => m.level === 'Visitor' || m.membershipLevel === 'visitor').length,
      Convert: baseMembers.filter(m => m.level === 'Convert' || m.membershipLevel === 'convert').length,
    };
  }, [locationFilteredMembers, profile?.role]);

  const uniqueDistricts = useMemo(() => Array.from(new Set(members.map(m => m.districtId).filter(Boolean))), [members]);
  const uniqueBranches = useMemo(() => {
    let bps = members;
    if (filters.district !== 'All') {
      bps = members.filter(m => m.districtId === filters.district);
    }
    return Array.from(new Set(bps.map(m => m.branchId).filter(Boolean)));
  }, [members, filters.district]);

  const handleDelete = async (member: MemberData) => {
    if (!window.confirm(`Are you sure you want to delete ${member.fullName}?`)) return;
    
    try {
      if (member.path) {
        await deleteDoc(doc(db, member.path));
        toast.success("Record deleted successfully");
      }
    } catch (error) {
      console.error("Delete failed:", error);
      toast.error("Failed to delete record");
    }
  };

  const handleEdit = (member: MemberData) => {
    navigate(`/members/edit/${member.id}?districtId=${member.districtId}&branchId=${member.branchId}`);
  };

  const handleView = (member: MemberData) => {
    navigate(`/members/profile/${member.id}?districtId=${member.districtId}&branchId=${member.branchId}`);
  };

  const handleAddClick = () => {
    if (activeTab === 'Convert') {
      navigate('/members/new-convert');
    } else if (activeTab === 'Visitor') {
      navigate('/members/new-first-timer');
    } else {
      navigate(`/members/new?level=${activeTab}`);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold border border-blue-100 flex items-center gap-1">
              <Sparkles size={10} />
              Unified Module
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">People Management</h1>
          <p className="text-slate-500 text-sm mt-1">
            Seamlessly managing members, first-timers, and new converts across the ministry.
          </p>
        </div>
        
        <div className="flex flex-row md:flex-row items-center gap-3 w-full md:w-auto">
          <Button 
            variant="outline"
            className="hidden sm:flex flex-1 md:flex-none rounded-xl px-5 font-bold border-slate-200 items-center justify-center gap-2 h-11"
          >
            <Send size={18} />
            Bulk Notify
          </Button>
          {profile?.role !== 'superadmin' && (
            <Button 
              onClick={handleAddClick}
              className="w-full sm:flex-1 md:flex-none justify-center bg-slate-900 text-white rounded-xl px-6 h-11 font-bold flex items-center gap-2 shadow-lg shadow-slate-200 hover:shadow-xl hover:translate-y-[-1px] transition-all"
            >
              <Plus size={18} />
              {activeTab === 'Member' ? 'Add Member' : activeTab === 'Visitor' ? 'Add First Timer' : 'Add Convert'}
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <MemberStats members={locationFilteredMembers} />

      {/* Main Content Area */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col w-full gap-4">
          <MemberToolbar 
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onBulkUpdate={() => toast.info("Bulk update coming soon")}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            filters={filters}
            onFilterChange={setFilters}
            showGlobalFilters={profile?.role === 'superadmin' || profile?.role === 'district'}
          >
            {profile?.role === 'superadmin' || profile?.role === 'district' ? (
              <div className="flex flex-row flex-nowrap items-center gap-3 sm:gap-4 px-1 sm:px-4 w-full overflow-x-auto no-scrollbar">
                {profile?.role === 'superadmin' && (
                  <>
                    <div className="flex flex-col shrink-0 min-w-[120px]">
                      <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider mb-px">District</label>
                      <select 
                        className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer w-full"
                        value={filters.district}
                        onChange={(e) => setFilters({...filters, district: e.target.value, branch: 'All'})}
                      >
                        <option value="All">All Districts</option>
                        {Object.entries(districtMaps).map(([id, name]) => <option key={id} value={id}>{name}</option>)}
                      </select>
                    </div>
                    <div className="h-8 w-px bg-slate-200 shrink-0"></div>
                  </>
                )}
                <div className="flex flex-col shrink-0 min-w-[120px]">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider mb-px">Branch</label>
                  <select 
                    className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer w-full disabled:opacity-40"
                    value={filters.branch}
                    onChange={(e) => setFilters({...filters, branch: e.target.value})}
                    disabled={profile?.role === 'superadmin' && filters.district === 'All'}
                  >
                    <option value="All">All Branches</option>
                    {profile?.role === 'superadmin' && filters.district !== 'All' ? 
                      branchOptions[filters.district]?.map(b => <option key={b.id} value={b.id}>{b.name}</option>) :
                     profile?.role === 'district' ?
                      uniqueBranches.map(b => <option key={b} value={b}>{branchMaps[b] || b}</option>) :
                      null
                    }
                  </select>
                </div>
                <div className="h-8 w-px bg-slate-200 shrink-0"></div>
                <div className="flex flex-col shrink-0 min-w-[140px]">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider mb-px">Level</label>
                  <select 
                    className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer w-full"
                    value={activeTab}
                    onChange={(e) => setActiveTab(e.target.value)}
                  >
                    <option value="All Member">All Members ({counts['All Member']})</option>
                    <option value="Leader">Leaders ({counts['Leader']})</option>
                    <option value="Worker">Workers ({counts['Worker']})</option>
                    <option value="Disciple">Disciples ({counts['Disciple']})</option>
                  </select>
                </div>
              </div>
            ) : (
              <TabNavigation 
                activeTab={activeTab} 
                onTabChange={setActiveTab} 
                counts={counts}
              />
            )}
          </MemberToolbar>
        </div>

        <motion.div
          key={activeTab + viewMode}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          <MemberTable 
            members={filteredMembers}
            loading={loading}
            activeTab={activeTab}
            viewMode={viewMode}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onView={handleView}
          />
        </motion.div>
      </div>

      {profile?.role === 'superadmin' && (
        <>
          <button 
            onClick={() => setShowSuperAdminModal(true)}
            className="fixed bottom-8 right-8 h-14 w-14 bg-slate-900 text-white rounded-full shadow-2xl shadow-slate-900/20 flex items-center justify-center hover:scale-105 transition-all z-40 hidden sm:flex"
          >
            <Plus size={24} />
          </button>
          
          {/* Mobile FAB */}
          <button 
            onClick={() => setShowSuperAdminModal(true)}
            className="fixed bottom-20 right-6 h-12 w-12 bg-slate-900 text-white rounded-full shadow-2xl shadow-slate-900/20 flex items-center justify-center hover:scale-105 transition-all z-40 sm:hidden"
          >
            <Plus size={20} />
          </button>

          <SuperAdminAddMemberModal 
            isOpen={showSuperAdminModal}
            onClose={() => setShowSuperAdminModal(false)}
            onSuccess={() => {
              // Note: the useMembers hook listens to snap changes so it will auto-update.
            }}
          />
        </>
      )}
    </div>
  );
}
