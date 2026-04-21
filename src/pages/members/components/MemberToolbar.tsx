import React from 'react';
import { Search, Filter, Plus, Send, ArrowDownToLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface MemberToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onAddClick: () => void;
  onBulkUpdate: () => void;
}

export const MemberToolbar = ({ 
  searchQuery, 
  onSearchChange, 
  onAddClick,
  onBulkUpdate
}: MemberToolbarProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-center bg-white p-4 rounded-xl border border-slate-200">
      <div className="relative flex-1 w-full">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        <Input 
          placeholder="Search members by name, email or phone..." 
          className="pl-10 bg-slate-50 border-slate-200 rounded-xl"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <Button variant="outline" className="rounded-xl flex items-center gap-2 border-slate-200 flex-1 sm:flex-auto">
          <Filter size={16} />
          Filter
        </Button>
        <Button 
          variant="outline" 
          onClick={onBulkUpdate}
          className="rounded-xl flex items-center gap-2 border-slate-200 flex-1 sm:flex-auto"
        >
          <ArrowDownToLine size={16} />
          Batch Info
        </Button>
      </div>
    </div>
  );
};
