import React from 'react';
import { 
  MoreHorizontal, 
  ExternalLink, 
  Edit, 
  Trash,
  Flame,
  Calendar,
  UserCheck
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
  viewMode
}: MemberTableProps) => {
  if (loading) {
    return <div className="p-20 text-center text-slate-400 font-medium">Loading data...</div>;
  }

  if (members.length === 0) {
    return <div className="p-20 text-center text-slate-400 font-medium">No records found.</div>;
  }

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

  const MemberCard = ({ member }: { member: MemberData }) => (
    <div 
      onClick={() => onView(member)}
      className="bg-white p-5 rounded-2xl border border-slate-100 flex flex-col gap-4 relative group hover:shadow-xl hover:translate-y-[-2px] transition-all cursor-pointer"
    >
      <div className="absolute top-3 right-3" onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger className="h-8 w-8 p-0 hover:bg-slate-100 rounded-full flex items-center justify-center border-none shadow-none">
            <MoreHorizontal className="h-4 w-4 text-slate-400" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 rounded-xl border-slate-200 shadow-xl">
            <DropdownMenuItem onClick={() => onView(member)} className="font-bold text-xs uppercase tracking-widest py-3">
              <ExternalLink className="mr-2 h-4 w-4" /> View Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(member)} className="font-bold text-xs uppercase tracking-widest py-3">
              <Edit className="mr-2 h-4 w-4" /> Edit Record
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-red-600 font-bold text-xs uppercase tracking-widest py-3"
              onClick={() => onDelete(member)}
            >
              <Trash className="mr-2 h-4 w-4" /> Delete Record
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex flex-col items-center text-center">
        <Avatar className="h-20 w-20 border-4 border-slate-50 shadow-sm mb-4">
          <AvatarImage src={member.photoUrl} alt={member.fullName} />
          <AvatarFallback className="bg-slate-100 text-slate-400 font-black text-xl">{member.fullName?.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="space-y-1">
          <h4 className="text-base font-black text-slate-900 uppercase tracking-tight line-clamp-1">{member.fullName}</h4>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
            {activeTab === 'Member' ? member.level || 'Member' : activeTab === 'Visitor' ? 'First Timer' : 'Convert'}
          </p>
        </div>
      </div>

      <div className="space-y-3 pt-2">
        <div className="flex flex-col gap-2">
          {activeTab === 'Member' && (
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-50 py-2 rounded-xl">
              <Calendar size={12} className="text-slate-400" />
              Joined {safeFormat(member.joinDate, "MMM yyyy")}
            </div>
          )}
          {activeTab === 'Convert' && (
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-orange-600 bg-orange-50 py-2 rounded-xl">
              <Flame size={12} />
              {safeFormat(member.conversionDate, "do MMM yyyy")}
            </div>
          )}
          {activeTab === 'Visitor' && (
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-50 py-2 rounded-xl">
              <Calendar size={12} className="text-slate-400" />
              {safeFormat(member.visitDate || member.firstVisit, "do MMM yyyy")}
            </div>
          )}
          
          <div className="flex flex-wrap gap-2 justify-center">
            <StatusBadge variant={member.status === 'Active' ? 'success' : 'warning'}>
              {member.status}
            </StatusBadge>
            <StatusBadge variant="info">{member.branch || 'Main Branch'}</StatusBadge>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={cn(
      "overflow-hidden",
      viewMode === 'list' && "md:bg-white md:rounded-2xl md:border md:border-slate-200 md:shadow-sm"
    )}>
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 p-4 md:p-0">
          {members.map((member) => (
            <MemberCard key={member.id} member={member} />
          ))}
        </div>
      ) : (
        <>
          {/* Mobile grid view (always grid on mobile) */}
          <div className="md:hidden grid grid-cols-2 gap-4 p-4">
            {members.map((member) => (
              <MemberCard key={member.id} member={member} />
            ))}
          </div>

          {/* Desktop view table */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 py-4 pl-6">Identity</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 py-4">Contact</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 py-4">Joined Date</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 py-4">Level</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 py-4">Status</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 py-4 pr-6 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
        <TableBody>
          {members.map((member) => (
            <TableRow key={member.id} className="hover:bg-slate-50 transition-colors group">
              <TableCell className="py-4 pl-6">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border border-slate-200">
                    <AvatarImage src={member.photoUrl} alt={member.fullName} />
                    <AvatarFallback className="bg-slate-100 text-slate-500 font-bold">{member.fullName?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="text-sm font-bold text-slate-900 leading-none">{member.fullName}</div>
                </div>
              </TableCell>
              
              <TableCell className="py-4">
                <div className="flex flex-col text-xs font-bold text-slate-700">
                  <span className="text-slate-900">{member.email}</span>
                  <span className="text-slate-500 mt-0.5">{member.phone}</span>
                </div>
              </TableCell>

              <TableCell className="py-4">
                <div className="text-xs font-semibold text-slate-700">{safeFormat(member.joinDate, "MMM dd, yyyy")}</div>
              </TableCell>

              <TableCell className="py-4">
                <StatusBadge variant="info">{member.baptizedSubLevel || member.level}</StatusBadge>
              </TableCell>

              <TableCell className="py-4">
                <StatusBadge variant={member.status === 'Active' ? 'success' : 'warning'}>
                  {member.status}
                </StatusBadge>
              </TableCell>

              <TableCell className="py-4 pr-6 text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger className="h-8 w-8 p-0 hover:bg-slate-100 rounded-lg flex items-center justify-center border-none shadow-none">
                    <MoreHorizontal className="h-4 w-4 text-slate-500" />
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
          ))}
        </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
};
