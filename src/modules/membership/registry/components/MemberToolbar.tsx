import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ArrowDownToLine, ArrowUpToLine, LayoutGrid, List, FileText, Download, SortAsc, SortDesc, PieChart, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface MemberToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onExport: (type: 'csv' | 'pdf') => void;
  onImport?: () => void;
  viewMode: 'grid' | 'list' | 'insights';
  onViewModeChange: (mode: 'grid' | 'list' | 'insights') => void;
  sortField?: 'name' | 'joinDate' | 'status';
  onSortFieldChange?: (val: 'name' | 'joinDate' | 'status') => void;
  sortOrder?: 'asc' | 'desc';
  onSortOrderChange?: (val: 'asc' | 'desc') => void;
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
  onImport,
  viewMode,
  onViewModeChange,
  sortField = 'name',
  onSortFieldChange,
  sortOrder = 'asc',
  onSortOrderChange,
  filters,
  onFilterChange,
  showGlobalFilters,
  children
}: MemberToolbarProps) => {
  const [isViewModeExpanded, setIsViewModeExpanded] = useState(false);

  // Count active filters
  let activeFilterCount = 0;
  if (filters.category && filters.category !== 'All') activeFilterCount++;
  if (filters.status && filters.status !== 'All') activeFilterCount++;
  if (filters.baptism && filters.baptism !== 'All') activeFilterCount++;
  if (filters.level && filters.level !== 'All') activeFilterCount++;

  return (
    <div className="flex flex-col gap-4 bg-white p-3 rounded-2xl border border-slate-200 w-full">
      {/* Top Row: Filters & Actions */}
      <div className="flex flex-row items-center justify-between gap-2 sm:gap-4 w-full">
        {/* Filter Options Area - horizontal scrolling if needed */}
        <div className="flex-1 flex items-center gap-3 min-w-0 overflow-x-auto no-scrollbar pb-1">
          {children}
          
           {/* Filtering Menu (Advanced Filters) */}
           {!children && (
             <Popover>
               <PopoverTrigger className={cn("h-11 px-4 inline-flex items-center justify-center rounded-xl font-bold bg-white outline-none cursor-pointer border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors shadow-sm", activeFilterCount > 0 && "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:text-blue-800")}>
                 <Filter size={18} className="mr-2" />
                 Filters
                 {activeFilterCount > 0 && (
                   <span className="ml-2 bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px]">
                     {activeFilterCount}
                   </span>
                 )}
               </PopoverTrigger>
               <PopoverContent className="w-80 p-4 rounded-2xl border-slate-200 shadow-xl" align="start">
                 <div className="space-y-4">
                   <h4 className="font-bold text-sm text-slate-900">Filter Cohorts</h4>
                   
                   <div className="space-y-3">
                     {!showGlobalFilters && (
                       <div className="flex flex-col gap-1">
                         <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Level</label>
                         <select 
                           className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-blue-500 transition-all w-full"
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

                     <div className="flex flex-col gap-1">
                       <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Category</label>
                       <select 
                         className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-blue-500 transition-all w-full"
                         value={filters.category}
                         onChange={(e) => onFilterChange({...filters, category: e.target.value})}
                       >
                         <option value="All">All Categories</option>
                         <option value="Adult">Adult</option>
                         <option value="Youth">Youth</option>
                         <option value="Child">Child</option>
                         <option value="Senior">Senior</option>
                       </select>
                     </div>

                     <div className="flex flex-col gap-1">
                       <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Status</label>
                       <select 
                         className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-blue-500 transition-all w-full"
                         value={filters.status}
                         onChange={(e) => onFilterChange({...filters, status: e.target.value})}
                       >
                         <option value="All">All Statuses</option>
                         <option value="Active">Active</option>
                         <option value="Inactive">Inactive</option>
                         <option value="Pending">Pending</option>
                         <option value="Transferred">Transferred</option>
                       </select>
                     </div>

                     <div className="flex flex-col gap-1">
                       <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Baptism</label>
                       <select 
                         className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-blue-500 transition-all w-full"
                         value={filters.baptism}
                         onChange={(e) => onFilterChange({...filters, baptism: e.target.value})}
                       >
                         <option value="All">All Baptism Statuses</option>
                         <option value="Baptised">Baptised</option>
                         <option value="Not Baptised">Not Baptised</option>
                         <option value="Pending">Pending</option>
                         <option value="In Foundation Class">In Foundation Class</option>
                       </select>
                     </div>
                   </div>
                   
                   <div className="pt-2 border-t border-slate-100 flex justify-end">
                     <Button 
                       variant="ghost" 
                       size="sm" 
                       className="text-[10px] uppercase font-bold tracking-widest text-slate-500 hover:text-slate-900"
                       onClick={() => onFilterChange({...filters, level: 'All', category: 'All', status: 'All', baptism: 'All'})}
                     >
                       Clear Filters
                     </Button>
                   </div>
                 </div>
               </PopoverContent>
             </Popover>
           )}

           {/* Sorting */}
           {onSortFieldChange && (
             <div className="hidden md:flex shrink-0 items-center bg-white border border-slate-200 rounded-xl overflow-hidden h-11">
               <select
                 className="h-full pl-3 pr-1 text-xs sm:text-sm font-bold text-slate-600 outline-none bg-transparent cursor-pointer"
                 value={sortField}
                 onChange={(e) => onSortFieldChange(e.target.value as any)}
               >
                 <option value="name">Sort: Name</option>
                 <option value="joinDate">Sort: Date</option>
                 <option value="status">Sort: Status</option>
               </select>
               <button 
                 type="button"
                 onMouseDown={(e) => { 
                   e.preventDefault(); 
                   e.stopPropagation();
                   onSortOrderChange?.(sortOrder === 'asc' ? 'desc' : 'asc'); 
                 }}
                 className="h-full px-2 border-l border-slate-200 hover:bg-slate-50 text-slate-500 transition-colors"
               >
                 {sortOrder === 'asc' ? <SortAsc size={16} /> : <SortDesc size={16} />}
               </button>
             </div>
           )}

           {onImport && (
             <Button
               variant="outline"
               onClick={onImport}
               className="hidden sm:flex lg:px-3 h-11 w-11 lg:w-auto p-0 rounded-xl items-center justify-center border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shrink-0 outline-none cursor-pointer lg:gap-2"
               title="Import Members"
             >
               <ArrowUpToLine size={18} />
               <span className="hidden lg:inline text-sm font-bold truncate">Import</span>
             </Button>
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
          {/* View Mode controls with collapsing animation */}
          <motion.div layout className="hidden sm:flex flex-row items-center bg-slate-100 p-1 rounded-xl overflow-hidden h-[44px]">
            <AnimatePresence mode="popLayout" initial={false}>
              {(isViewModeExpanded || viewMode === 'list') && (
                <motion.div
                  layout
                  key="list"
                  initial={{ opacity: 0, width: 0, marginRight: 0, scale: 0.8 }}
                  animate={{ opacity: 1, width: 36, scale: 1, marginRight: isViewModeExpanded ? 4 : 0 }}
                  exit={{ opacity: 0, width: 0, marginRight: 0, scale: 0.8 }}
                  transition={{ type: "spring", stiffness: 350, damping: 28 }}
                  style={{ overflow: 'hidden', flexShrink: 0 }}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (!isViewModeExpanded) {
                        setIsViewModeExpanded(true);
                      } else {
                        onViewModeChange('list');
                        setIsViewModeExpanded(false);
                      }
                    }}
                    className={cn(
                      "h-9 w-9 p-0 rounded-lg transition-all",
                      viewMode === 'list' && !isViewModeExpanded ? "bg-white text-slate-900 shadow-sm" : viewMode === 'list' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-700"
                    )}
                    title="List View"
                  >
                    <List size={18} />
                  </Button>
                </motion.div>
              )}

              {(isViewModeExpanded || viewMode === 'grid') && (
                <motion.div
                  layout
                  key="grid"
                  initial={{ opacity: 0, width: 0, marginRight: 0, scale: 0.8 }}
                  animate={{ opacity: 1, width: 36, scale: 1, marginRight: isViewModeExpanded ? 4 : 0 }}
                  exit={{ opacity: 0, width: 0, marginRight: 0, scale: 0.8 }}
                  transition={{ type: "spring", stiffness: 350, damping: 28 }}
                  style={{ overflow: 'hidden', flexShrink: 0 }}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (!isViewModeExpanded) {
                        setIsViewModeExpanded(true);
                      } else {
                        onViewModeChange('grid');
                        setIsViewModeExpanded(false);
                      }
                    }}
                    className={cn(
                      "h-9 w-9 p-0 rounded-lg transition-all",
                      viewMode === 'grid' && !isViewModeExpanded ? "bg-white text-slate-900 shadow-sm" : viewMode === 'grid' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-700"
                    )}
                    title="Grid View"
                  >
                    <LayoutGrid size={18} />
                  </Button>
                </motion.div>
              )}

              {(isViewModeExpanded || viewMode === 'insights') && (
                <motion.div
                  layout
                  key="insights"
                  initial={{ opacity: 0, width: 0, scale: 0.8 }}
                  animate={{ opacity: 1, width: 36, scale: 1 }}
                  exit={{ opacity: 0, width: 0, scale: 0.8 }}
                  transition={{ type: "spring", stiffness: 350, damping: 28 }}
                  style={{ overflow: 'hidden', flexShrink: 0 }}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (!isViewModeExpanded) {
                        setIsViewModeExpanded(true);
                      } else {
                        onViewModeChange('insights');
                        setIsViewModeExpanded(false);
                      }
                    }}
                    className={cn(
                      "h-9 w-9 p-0 rounded-lg transition-all",
                      viewMode === 'insights' && !isViewModeExpanded ? "bg-blue-600 text-white shadow-sm hover:bg-blue-700 hover:text-white" : viewMode === 'insights' ? "bg-blue-600 text-white shadow-sm hover:bg-blue-700 hover:text-white" : "text-slate-400 hover:text-slate-700"
                    )}
                    title="Visual Insights"
                  >
                    <PieChart size={18} />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
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
