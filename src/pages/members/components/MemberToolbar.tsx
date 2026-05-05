import React from 'react';
import { Search, Plus, Send, ArrowDownToLine, LayoutGrid, List, FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface MemberToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onExport: (type: 'csv' | 'pdf') => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  filters: any;
  onFilterChange: (filters: any) => void;
  showGlobalFilters?: boolean;
  availableDistricts?: string[];
  availableBranches?: string[];
  children?: React.ReactNode;
}

export const MemberToolbar = ({ 
  searchQuery, 
  onSearchChange, 
  onExport,
  viewMode,
  onViewModeChange,
  filters,
  onFilterChange,
  showGlobalFilters,
  children
}: MemberToolbarProps) => {
  return (
    <div className="flex flex-col gap-4 bg-white p-3 rounded-2xl border border-slate-200 w-full">
      {/* Top Row: Filters & Actions */}
      <div className="flex flex-row items-center justify-between gap-2 sm:gap-4 w-full">
        {/* Filter Options Area - horizontal scrolling if needed */}
        <div className="flex-1 flex items-center gap-3 min-w-0 overflow-x-auto no-scrollbar pb-1">
          {children}
          
           {/* Filter Level Dropdown - only show if not superadmin since superadmin uses tabs for levels */}
           {!showGlobalFilters && !children && (
             <div className="shrink-0">
               <select 
                 className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                 value={filters.level}
                 onChange={(e) => onFilterChange({...filters, level: e.target.value})}
               >
                 <option value="All">All Levels</option>
                 <option value="Disciple">Disciple</option>
                 <option value="Worker">Worker</option>
                 <option value="Leader">Leader</option>
               </select>
             </div>
           )}

           <DropdownMenu>
             <DropdownMenuTrigger className="hidden sm:flex h-11 w-11 p-0 rounded-xl items-center justify-center border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shrink-0 outline-none cursor-pointer" title="Export Members">
               <ArrowDownToLine size={18} />
             </DropdownMenuTrigger>
             <DropdownMenuContent align="end" className="w-40 rounded-xl border-slate-200">
               <DropdownMenuItem onClick={() => onExport('csv')} className="cursor-pointer font-bold text-xs py-2.5">
                 <Download className="mr-2 h-4 w-4 text-slate-400" /> Export as CSV
               </DropdownMenuItem>
               <DropdownMenuItem onClick={() => onExport('pdf')} className="cursor-pointer font-bold text-xs py-2.5">
                 <FileText className="mr-2 h-4 w-4 text-slate-400" /> Export as PDF
               </DropdownMenuItem>
             </DropdownMenuContent>
           </DropdownMenu>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 justify-end">
          {/* Hide grid/list on small devices */}
          <div className="hidden sm:flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
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
        </div>
      </div>

      {/* Bottom Row: Search Input */}
      <div className="w-full shrink-0 border-t border-slate-100 pt-3 flex gap-2">
        <div className="relative min-w-0 w-full flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Search members..." 
            className="pl-9 h-11 bg-slate-50 border-slate-200/60 rounded-xl focus:bg-white transition-all text-sm w-full"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger className="flex sm:hidden h-11 w-11 p-0 rounded-xl items-center justify-center border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors shrink-0 bg-slate-50 outline-none cursor-pointer" title="Export Members">
            <ArrowDownToLine size={18} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40 rounded-xl border-slate-200">
            <DropdownMenuItem onClick={() => onExport('csv')} className="cursor-pointer font-bold text-xs py-2.5">
              <Download className="mr-2 h-4 w-4 text-slate-400" /> Export as CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onExport('pdf')} className="cursor-pointer font-bold text-xs py-2.5">
              <FileText className="mr-2 h-4 w-4 text-slate-400" /> Export as PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
