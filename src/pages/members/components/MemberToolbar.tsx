import React from 'react';
import { Search, Filter, Plus, Send, ArrowDownToLine, LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface MemberToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onBulkUpdate: () => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  filters: any;
  onFilterChange: (filters: any) => void;
}

export const MemberToolbar = ({ 
  searchQuery, 
  onSearchChange, 
  onBulkUpdate,
  viewMode,
  onViewModeChange,
  filters,
  onFilterChange
}: MemberToolbarProps) => {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 bg-white p-2 sm:p-3 rounded-2xl border border-slate-200 w-full lg:w-auto">
      <div className="relative flex-1 min-w-0 w-full sm:w-64">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input 
          placeholder="Search members..." 
          className="pl-9 h-11 bg-slate-50 border-transparent rounded-xl focus:bg-white transition-all text-sm w-full"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      
      <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-between sm:justify-end">
         {/* Filter Level Dropdown */}
         <div className="hidden md:block">
           <select 
             className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-600 outline-none"
             value={filters.level}
             onChange={(e) => onFilterChange({...filters, level: e.target.value})}
           >
             <option value="All">All Levels</option>
             <option value="Disciple">Disciple</option>
             <option value="Worker">Worker</option>
             <option value="Leader">Leader</option>
           </select>
         </div>
         {/* ... other filters ... */}

        <div className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-xl mr-auto sm:mr-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewModeChange('list')}
            className={cn(
              "h-9 w-9 p-0 rounded-lg transition-all",
              viewMode === 'list' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400"
            )}
          >
            <List size={18} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewModeChange('grid')}
            className={cn(
              "h-9 w-9 p-0 rounded-lg transition-all",
              viewMode === 'grid' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400"
            )}
          >
            <LayoutGrid size={18} />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" className="h-11 px-4 rounded-xl flex items-center justify-center gap-2 border-slate-200 text-slate-600 font-bold text-xs flex-1 sm:flex-none">
            <Filter size={18} />
            <span className="hidden sm:inline">Filter</span>
          </Button>
          <Button 
            variant="outline" 
            onClick={onBulkUpdate}
            className="h-11 px-4 rounded-xl flex items-center justify-center gap-2 border-slate-200 text-slate-600 font-bold text-xs flex-1 sm:flex-none"
          >
            <ArrowDownToLine size={18} />
            <span className="hidden sm:inline">Batch</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
