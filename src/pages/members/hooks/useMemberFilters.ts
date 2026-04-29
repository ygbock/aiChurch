import { useState, useMemo } from 'react';
import { MemberData } from '@/types/membership';

export function useMemberFilters(members: MemberData[]) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('Member');
  const [filters, setFilters] = useState({
    status: 'All',
    baptism: 'All',
    category: 'All',
    level: 'All'
  });

  const filteredMembers = useMemo(() => {
    return members.filter(member => {
      // Tab filter (Category: Member, Visitor, Convert)
      if (activeTab === 'Member') {
        if (member.level === 'Visitor' || member.level === 'Convert') return false;
      } else {
        if (member.level !== activeTab) return false;
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
      if (filters.level !== 'All' && member.baptizedSubLevel !== filters.level.toLowerCase()) return false;

      return true;
    });
  }, [members, activeTab, searchQuery, filters]);

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
