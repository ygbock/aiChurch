import React from 'react';
import { 
  MoreHorizontal, 
  ExternalLink, 
  Edit, 
  Trash,
  Flame,
  Calendar,
  UserCheck,
  CheckSquare,
  Square
} from 'lucide-react';
import { format } from 'date-fns';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MemberData } from '@/types/membership';
import { cn } from '@/lib/utils';

interface MemberTableProps {
  members: MemberData[];
  loading: boolean;
  onEdit: (member: MemberData) => void;
  onDelete: (member: MemberData) => void;
  onView: (member: MemberData) => void;
  activeTab: string;
  viewMode: 'grid' | 'list';
  selectedIds?: string[];
  onToggleSelect?: (id: string, e: React.MouseEvent) => void;
  onToggleSelectAll?: () => void;
}

const StatusBadge = ({ children, variant = 'default' }: { children: React.ReactNode, variant?: string }) => {
  const styles: any = {
    default: 'bg-slate-100 text-slate-700',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    info: 'bg-blue-50 text-blue-700 border-blue-100',
    warning: 'bg-orange-50 text-orange-700 border-orange-100',
    conversion: 'bg-orange-50 text-orange-700 border-orange-100',
  };
  return (
    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold border", styles[variant] || styles.default)}>
      {children}
    </span>
  );
};

export const MemberTable = ({ 
  members, 
  loading, 
  onEdit, 
  onDelete, 
  onView,
  activeTab,
  viewMode,
  selectedIds = [],
  onToggleSelect = () => {},
  onToggleSelectAll = () => {}
}: MemberTableProps) => {
  const [visibleCount, setVisibleCount] = React.useState(50);
  const observerRef = React.useRef<IntersectionObserver | null>(null);
  
  React.useEffect(() => {
    setVisibleCount(50);
  }, [members]);

  const loadMoreRef = React.useCallback((node: HTMLDivElement | null) => {
    if (loading) return;
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && visibleCount < members.length) {
        setVisibleCount(prev => Math.min(prev + 50, members.length));
      }
    });
    if (node) observerRef.current.observe(node);
  }, [loading, visibleCount, members.length]);

  if (loading) {
    return <div className="p-20 text-center text-slate-400 font-medium">Loading data...</div>;
  }

  if (members.length === 0) {
    return <div className="p-20 text-center text-slate-400 font-medium">No records found.</div>;
  }

  const visibleMembers = members.slice(0, visibleCount);
  const isAllSelected = selectedIds.length > 0 && selectedIds.length === members.length;

  const safeFormat = (dateStr: string | undefined | null, formatStr: string) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return 'N/A';
      return format(date, formatStr);
    } catch (e) {
      return 'N/A';
    }
  };

  const MemberCard = ({ member }: { member: MemberData }) => {
    const isSelected = selectedIds.includes(member.id);
    
    return (
    <div 
      onClick={() => onView(member)}
      className={cn(
        "bg-white p-3 sm:p-5 rounded-2xl border flex flex-col gap-3 sm:gap-4 relative group hover:shadow-xl hover:translate-y-[-2px] transition-all cursor-pointer",
        isSelected ? "border-blue-500 ring-1 ring-blue-500 bg-blue-50/10" : "border-slate-100"
      )}
    >
      <div className="absolute top-2 left-2 z-10" onClick={(e) => { e.stopPropagation(); onToggleSelect(member.id, e); }}>
        <button className="p-1 rounded hover:bg-slate-100 text-slate-400 transition-colors">
          {isSelected ? <CheckSquare size={18} className="text-blue-600" /> : <Square size={18} />}
        </button>
      </div>
      <div className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10" onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger className="h-8 w-8 p-0 hover:bg-slate-100 rounded-full flex items-center justify-center border-none shadow-none text-slate-500">
            <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 rounded-xl border-slate-200 shadow-xl">
            <DropdownMenuItem onClick={() => onView(member)} className="font-bold text-xs uppercase tracking-widest py-3 cursor-pointer">
              <ExternalLink className="mr-2 h-4 w-4" /> View Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(member)} className="font-bold text-xs uppercase tracking-widest py-3 cursor-pointer">
              <Edit className="mr-2 h-4 w-4" /> Edit Record
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-red-600 focus:text-red-600 focus:bg-red-50 font-bold text-xs uppercase tracking-widest py-3 cursor-pointer"
              onClick={() => onDelete(member)}
            >
              <Trash className="mr-2 h-4 w-4" /> Delete Record
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex flex-col items-center text-center mt-2">
        <Avatar className={cn("h-14 w-14 sm:h-20 sm:w-20 border-2 sm:border-4 shadow-sm mb-2 sm:mb-4 transition-colors", isSelected ? "border-blue-100" : "border-slate-50")}>
          <AvatarImage src={member.photoUrl} alt={member.fullName} />
          <AvatarFallback className="bg-slate-100 text-slate-400 font-black text-lg sm:text-xl">{member.fullName?.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="space-y-1 w-full px-1">
          <h4 className="text-[13px] sm:text-base font-black text-slate-900 uppercase tracking-tight truncate">{member.fullName}</h4>
          <p className="text-[9px] sm:text-[10px] text-slate-500 font-bold uppercase tracking-widest truncate">
            {member.level === 'Visitor' || member.membershipLevel === 'visitor' ? 'First Timer' : 
             member.level === 'Convert' || member.membershipLevel === 'convert' ? 'Convert' : 
             member.baptizedSubLevel || member.level || 'Member'}
          </p>
        </div>
      </div>

      <div className="space-y-2 sm:space-y-3 pt-1 sm:pt-2">
        <div className="flex flex-col gap-1.5 sm:gap-2">
          {activeTab === 'Member' && (
            <div className="flex items-center justify-center gap-1.5 text-[10px] sm:text-xs font-bold text-slate-700 bg-slate-50 py-1.5 sm:py-2 rounded-xl truncate px-1">
              <Calendar size={12} className="text-slate-400 shrink-0" />
              <span className="truncate">Joined {safeFormat(member.joinDate, "MMM yy")}</span>
            </div>
          )}
          {activeTab === 'Convert' && (
            <div className="flex items-center justify-center gap-1.5 text-[10px] sm:text-xs font-bold text-orange-600 bg-orange-50 py-1.5 sm:py-2 rounded-xl truncate px-1">
              <Flame size={12} className="shrink-0" />
              <span className="truncate">{safeFormat(member.conversionDate, "dd MMM yy")}</span>
            </div>
          )}
          {activeTab === 'Visitor' && (
            <div className="flex items-center justify-center gap-1.5 text-[10px] sm:text-xs font-bold text-slate-700 bg-slate-50 py-1.5 sm:py-2 rounded-xl truncate px-1">
              <Calendar size={12} className="text-slate-400 shrink-0" />
              <span className="truncate">{safeFormat(member.visitDate || member.firstVisit, "dd MMM yy")}</span>
            </div>
          )}
          
          <div className="flex flex-wrap gap-1 sm:gap-2 justify-center">
            <StatusBadge variant={member.status === 'Active' ? 'success' : 'warning'}>
              {member.status}
            </StatusBadge>
            <StatusBadge variant="info">{member.branch || 'Main Branch'}</StatusBadge>
            
            {member.tags && member.tags.length > 0 && (
               <StatusBadge variant="default">
                 +{member.tags.length} Tag{member.tags.length !== 1 && 's'}
               </StatusBadge>
            )}
          </div>
        </div>
      </div>
    </div>
    );
  };

  return (
    <div className={cn(
      "overflow-hidden pb-[80px]",
      viewMode === 'list' && "md:bg-white md:rounded-2xl md:border md:border-slate-200 md:shadow-sm"
    )}>
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6 p-0">
          {visibleMembers.map((member) => (
            <MemberCard key={member.id} member={member} />
          ))}
        </div>
      ) : (
        <>
          {/* Mobile grid view (always grid on mobile) */}
          <div className="md:hidden grid grid-cols-2 sm:grid-cols-2 gap-3 sm:gap-4 p-0">
            {visibleMembers.map((member) => (
              <MemberCard key={member.id} member={member} />
            ))}
          </div>

          {/* Desktop view table */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-12 pl-6">
                    <button 
                      onClick={onToggleSelectAll}
                      className="p-1 rounded hover:bg-slate-200 text-slate-400 transition-colors flex items-center justify-center mt-1"
                    >
                      {isAllSelected ? (
                        <CheckSquare size={18} className="text-blue-600" />
                      ) : selectedIds.length > 0 ? (
                        <div className="w-[18px] h-[18px] rounded-[3px] border border-blue-600 bg-blue-600 flex items-center justify-center">
                          <div className="w-2.5 h-0.5 bg-white rounded-sm"></div>
                        </div>
                      ) : (
                        <Square size={18} />
                      )}
                    </button>
                  </TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 py-4">Identity</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 py-4">Contact</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 py-4">Joined Date</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 py-4">Level</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 py-4">Status</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 py-4 pr-6 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
        <TableBody>
          {visibleMembers.map((member) => {
            const isSelected = selectedIds.includes(member.id);
            return (
            <TableRow 
              key={member.id} 
              className={cn("hover:bg-slate-50 transition-colors group cursor-pointer", isSelected && "bg-blue-50/30 hover:bg-blue-50/50")}
              onClick={() => onView(member)}
            >
              <TableCell className="pl-6" onClick={(e) => { e.stopPropagation(); onToggleSelect(member.id, e); }}>
                <button className="p-1 rounded text-slate-400 transition-colors hover:bg-slate-200 flex items-center justify-center">
                  {isSelected ? <CheckSquare size={18} className="text-blue-600" /> : <Square size={18} />}
                </button>
              </TableCell>
              <TableCell className="py-4">
                <div className="flex items-center gap-3">
                  <Avatar className={cn("h-10 w-10 border shrink-0", isSelected ? "border-blue-200" : "border-slate-200")}>
                    <AvatarImage src={member.photoUrl} alt={member.fullName} />
                    <AvatarFallback className="bg-slate-100 text-slate-500 font-bold">{member.fullName?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-sm font-bold text-slate-900 leading-tight mb-1">{member.fullName}</div>
                    {member.tags && member.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {member.tags.slice(0, 2).map((tag, i) => (
                           <span key={i} className="px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded text-[9px] font-bold uppercase tracking-wider border border-amber-100">
                             {tag}
                           </span>
                        ))}
                        {member.tags.length > 2 && (
                           <span className="px-1.5 py-0.5 bg-slate-50 text-slate-500 rounded text-[9px] font-bold uppercase tracking-wider border border-slate-200">
                             +{member.tags.length - 2}
                           </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </TableCell>
              
              <TableCell className="py-4">
                <div className="flex flex-col text-xs font-bold text-slate-700">
                  <span className="text-slate-900">{member.email || '-'}</span>
                  <span className="text-slate-500 mt-0.5">{member.phone || '-'}</span>
                </div>
              </TableCell>

              <TableCell className="py-4">
                <div className="text-xs font-semibold text-slate-700">{safeFormat(member.joinDate, "MMM dd, yyyy")}</div>
              </TableCell>

              <TableCell className="py-4">
                <StatusBadge variant="info">
                  {member.level === 'Visitor' || member.membershipLevel === 'visitor' ? 'First Timer' : 
                   member.level === 'Convert' || member.membershipLevel === 'convert' ? 'Convert' : 
                   member.baptizedSubLevel || member.level || 'Member'}
                </StatusBadge>
              </TableCell>

              <TableCell className="py-4">
                <StatusBadge variant={member.status === 'Active' ? 'success' : 'warning'}>
                  {member.status || 'Active'}
                </StatusBadge>
              </TableCell>

              <TableCell className="py-4 pr-6 text-right" onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger className="h-8 w-8 p-0 hover:bg-slate-100 rounded-lg inline-flex items-center justify-center border-none shadow-none text-slate-500 transition-colors">
                    <MoreHorizontal className="h-4 w-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 rounded-xl border-slate-200 shadow-xl">
                    <div className="px-2 py-1.5 text-xs font-semibold text-slate-400">Actions</div>
                    <DropdownMenuItem onClick={() => onView(member)} className="cursor-pointer">
                      <ExternalLink className="mr-2 h-4 w-4" /> View Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(member)} className="cursor-pointer">
                      <Edit className="mr-2 h-4 w-4" /> Edit Record
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                      onClick={() => onDelete(member)}
                    >
                      <Trash className="mr-2 h-4 w-4" /> Delete Record
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
            );
          })}
        </TableBody>
            </Table>
          </div>
        </>
      )}

      {visibleCount < members.length && (
        <div ref={loadMoreRef} className="py-8 flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  );
};

