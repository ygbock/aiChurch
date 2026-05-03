import { useState, useMemo } from 'react';
import { MemberData } from '@/types/membership';

export function useMemberFilters(members: MemberData[], role: string = 'member') {
  const isSuperadmin = role === 'superadmin';
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState(isSuperadmin ? 'All Member' : 'Member');
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
      // Tab filter
      if (isSuperadmin) {
        // Superadmin tabs: All Member, Leader, Worker, Disciple
        // We only show members (exclude Convert and Visitor)
        if (member.level === 'Visitor' || member.level === 'Convert') return false;
        
        if (activeTab !== 'All Member') {
          // activeTab is 'Leader', 'Worker', or 'Disciple'
          if (member.baptizedSubLevel?.toLowerCase() !== activeTab.toLowerCase()) return false;
        }
      } else {
        // Normal Tabs: Member, Visitor, Convert
        if (activeTab === 'Member') {
          if (member.level === 'Visitor' || member.level === 'Convert') return false;
        } else {
          if (member.level !== activeTab) return false;
        }
      }

      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        member.fullName.toLowerCase().includes(searchLower) ||
        member.email?.toLowerCase().includes(searchLower) ||
        member.phone.includes(searchQuery);
      
      if (!matchesSearch) return false;

      // Status filter
      if (filters.status !== 'All' && member.status !== filters.status) return false;

      // Baptism filter
      if (filters.baptism !== 'All' && member.baptismStatus !== filters.baptism) return false;

      // Category filter (Adult/Youth/etc)
      if (filters.category !== 'All' && member.category !== filters.category) return false;

      // Level filter
      if (filters.level !== 'All' && member.baptizedSubLevel !== filters.level.toLowerCase() && member.level !== filters.level) return false;
      
      // District filter
      if (filters.district !== 'All' && member.districtId !== filters.district) return false;

      // Branch filter
      if (filters.branch !== 'All' && member.branchId !== filters.branch) return false;

      return true;
    });
  }, [members, activeTab, searchQuery, filters, isSuperadmin]);

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
