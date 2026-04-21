import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Send, ArrowDownToLine, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useMembers } from './hooks/useMembers';
import { useMemberFilters } from './hooks/useMemberFilters';
import { MemberStats } from './components/MemberStats';
import { TabNavigation } from './components/TabNavigation';
import { MemberToolbar } from './components/MemberToolbar';
import { MemberTable } from './components/MemberTable';
import { Button } from '@/components/ui/button';
import { MemberData } from '@/types/membership';

export default function MemberManagementPage() {
  const navigate = useNavigate();
  const { members, loading } = useMembers();
  const { 
    searchQuery, 
    setSearchQuery, 
    activeTab, 
    setActiveTab, 
    filteredMembers 
  } = useMemberFilters(members);

  const counts = useMemo(() => ({
    Member: members.filter(m => m.level !== 'Visitor' && m.level !== 'Convert').length,
    Visitor: members.filter(m => m.level === 'Visitor').length,
    Convert: members.filter(m => m.level === 'Convert').length,
  }), [members]);

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
    navigate(`/members/new?level=${activeTab}`);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
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
        
        <div className="flex items-center gap-3">
          <Button 
            variant="outline"
            className="rounded-xl px-5 font-bold border-slate-200 hidden sm:flex items-center gap-2"
          >
            <Send size={18} />
            Bulk Notify
          </Button>
          <Button 
            onClick={handleAddClick}
            className="bg-slate-900 text-white rounded-xl px-6 h-11 font-bold flex items-center gap-2 shadow-lg shadow-slate-200 hover:shadow-xl hover:translate-y-[-1px] transition-all"
          >
            <Plus size={18} />
            {activeTab === 'Member' ? 'Add Member' : activeTab === 'Visitor' ? 'Add Visitor' : 'Add Convert'}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <MemberStats members={members} />

      {/* Main Content Area */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <TabNavigation 
            activeTab={activeTab} 
            onTabChange={setActiveTab} 
            counts={counts}
          />
          <MemberToolbar 
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onAddClick={handleAddClick}
            onBulkUpdate={() => toast.info("Bulk update coming soon")}
          />
        </div>

        <motion.div
          key={activeTab}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          <MemberTable 
            members={filteredMembers}
            loading={loading}
            activeTab={activeTab}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onView={handleView}
          />
        </motion.div>
      </div>
    </div>
  );
}
