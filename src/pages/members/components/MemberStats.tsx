import React from 'react';
import { motion } from 'framer-motion';
import { Users, UserPlus, Flame } from 'lucide-react';
import { MemberData } from '@/types/membership';

interface MemberStatsProps {
  members: MemberData[];
}

export const MemberStats = ({ members }: MemberStatsProps) => {
  const stats = [
    {
      label: 'Total Membership',
      value: members.filter(m => m.level === 'Member').length,
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'First Timers',
      value: members.filter(m => m.level === 'Visitor').length,
      icon: UserPlus,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'New Converts',
      value: members.filter(m => m.level === 'Convert').length,
      icon: Flame,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm"
        >
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">{stat.label}</p>
              <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};
