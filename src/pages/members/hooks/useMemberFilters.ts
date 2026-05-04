import { useState, useMemo } from 'react';
import { MemberData } from '@/types/membership';

export function useMemberFilters(members: MemberData[], role: string = 'member') {
  const isHighLevelAdmin = role === 'superadmin' || role === 'district';
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState(isHighLevelAdmin ? 'All Member' : 'Member');
  const [filters, setFilters] = useState({
    status: 'All',
    baptism: 'All',
    category: 'All',
    level: 'All',
    district: 'All',
    branch: 'All'
  });

  const filteredMembers = useMemo(() => {
    return members.filter(member => {
      
      const isVisitor = member.level === 'Visitor' || member.membershipLevel === 'visitor';
      const isConvert = member.level === 'Convert' || member.membershipLevel === 'convert';

      // Tab filter
      if (isHighLevelAdmin) {
        // High level admins: All Member, Leader, Worker, Disciple
        // We only show members (exclude Convert and Visitor)
        if (isVisitor || isConvert) return false;
        
        if (activeTab !== 'All Member') {
          // activeTab is 'Leader', 'Worker', or 'Disciple'
          let memberLvl = member.baptizedSubLevel?.toLowerCase() || member.level?.toLowerCase() || 'disciple';
          
          if (['admin', 'district', 'superadmin', 'leader'].includes(memberLvl)) {
            memberLvl = 'leader';
          } else if (memberLvl !== 'worker') {
            memberLvl = 'disciple'; 
          }
          if (memberLvl !== activeTab.toLowerCase()) return false;
        }
      } else {
        // Normal Tabs: Member, Visitor, Convert
        if (activeTab === 'Member') {
          if (isVisitor || isConvert) return false;
        } else if (activeTab === 'Visitor') {
          if (!isVisitor) return false;
        } else if (activeTab === 'Convert') {
          if (!isConvert) return false;
        }
      }

      // Search filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch = 
          member.fullName?.toLowerCase().includes(searchLower) ||
          member.email?.toLowerCase().includes(searchLower) ||
          member.phone?.includes(searchQuery);
        
        if (!matchesSearch) return false;
      }

      // Status filter
      if (filters.status !== 'All' && member.status !== filters.status) return false;

      // Baptism filter
      if (filters.baptism !== 'All' && member.baptismStatus !== filters.baptism) return false;

      // Category filter (Adult/Youth/etc)
      if (filters.category !== 'All' && member.category !== filters.category) return false;

      // Level filter
      if (filters.level !== 'All') {
        const targetLvl = filters.level.toLowerCase();
        const bLvl = member.baptizedSubLevel?.toLowerCase();
        const mLvl = member.level?.toLowerCase();
        if (bLvl !== targetLvl && mLvl !== targetLvl) return false;
      }
      
      // District filter
      if (filters.district !== 'All' && member.districtId !== filters.district) return false;

      // Branch filter
      if (filters.branch !== 'All' && member.branchId !== filters.branch) return false;

      return true;
    });
  }, [members, activeTab, searchQuery, filters, isHighLevelAdmin]);

  return {
    searchQuery,
    setSearchQuery,
    activeTab,
    setActiveTab,
    filters,
    setFilters,
    filteredMembers
  };
}
