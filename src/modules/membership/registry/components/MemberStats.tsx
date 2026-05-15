import React from 'react';
import { motion } from 'motion/react';
import { Users, UserPlus, Flame } from 'lucide-react';
import { MemberData } from '@/types/membership';

interface MemberStatsProps {
  members: MemberData[];
}

export const MemberStats = ({ members }: MemberStatsProps) => {
  const activeMembers = members.filter(m => {
    const isVisitor = m.level === 'Visitor' || m.membershipLevel === 'visitor';
    const isConvert = m.level === 'Convert' || m.membershipLevel === 'convert';
    return !isVisitor && !isConvert;
  });

  const stats = [
    {
      label: 'Total Membership',
      value: activeMembers.length,
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Workers',
      value: activeMembers.filter(m => {
        const ml = m.baptizedSubLevel?.toLowerCase() || m.level?.toLowerCase();
        return ml === 'leader' || ml === 'worker';
      }).length,
      icon: UserPlus,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Disciples',
      value: activeMembers.filter(m => {
        const ml = m.baptizedSubLevel?.toLowerCase() || m.level?.toLowerCase() || 'disciple';
        return ml === 'disciple' || !['leader', 'worker'].includes(ml);
      }).length,
      icon: Flame,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-6">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white p-2.5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm"
        >
          <div className="flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-4 text-center sm:text-left">
            <div className={`p-2 sm:p-3 rounded-xl ${stat.bg} ${stat.color} shrink-0`}>
              <stat.icon size={20} className="sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-sm font-medium text-slate-500 truncate">{stat.label}</p>
              <h3 className="text-sm sm:text-2xl font-bold text-slate-900">{stat.value}</h3>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};
