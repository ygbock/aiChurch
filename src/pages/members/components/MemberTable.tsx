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
  activeTab 
}: MemberTableProps) => {
  if (loading) {
    return <div className="p-20 text-center text-slate-400 font-medium">Loading data...</div>;
  }

  if (members.length === 0) {
    return <div className="p-20 text-center text-slate-400 font-medium">No records found.</div>;
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-slate-50">
          <TableRow>
            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 py-4 pl-6">Identity</TableHead>
            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 py-4">
              {activeTab === 'Member' ? 'Membership Info' : activeTab === 'Convert' ? 'Conversion Info' : 'Encounter Details'}
            </TableHead>
            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 py-4">Allocation</TableHead>
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
                  <div>
                    <div className="text-sm font-bold text-slate-900 leading-none mb-1">{member.fullName}</div>
                    <div className="text-[10px] text-slate-500 font-medium">{member.email || 'No email'} • {member.phone}</div>
                  </div>
                </div>
              </TableCell>
              
              <TableCell className="py-4">
                <div className="space-y-1">
                  {activeTab === 'Member' && (
                    <>
                      <div className="text-xs font-semibold text-slate-700">Joined: {member.joinDate ? format(new Date(member.joinDate), "MMM yyyy") : 'N/A'}</div>
                      <div className="text-[10px] text-slate-500">{member.baptismStatus}</div>
                    </>
                  )}
                  {activeTab === 'Convert' && (
                    <>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-orange-600">
                        <Flame size={12} />
                        {member.conversionDate ? format(new Date(member.conversionDate), "do MMM yyyy") : 'Unknown'}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                        <UserCheck size={12} className="text-slate-400" />
                        Soul Winner: {member.soulWinner || 'Anonymous'}
                      </div>
                    </>
                  )}
                  {activeTab === 'Visitor' && (
                    <>
                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <Calendar size={12} className="text-slate-400" />
                        Visited: {member.visitDate ? format(new Date(member.visitDate), "do MMM yyyy") : 'Unknown'}
                      </div>
                      <div className="text-[10px] text-slate-500">Source: {member.source || 'Direct'}</div>
                    </>
                  )}
                </div>
              </TableCell>

              <TableCell className="py-4">
                <div className="flex flex-col gap-1 items-start">
                  <StatusBadge variant="info">{member.branch || 'Main Branch'}</StatusBadge>
                  <span className="text-[10px] text-slate-500 font-medium">{member.category || 'Adult'}</span>
                </div>
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
    </div>
  );
};
