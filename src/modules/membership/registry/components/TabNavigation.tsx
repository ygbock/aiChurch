import React from 'react';
import { motion } from 'motion/react';
import { Users, UserPlus, Flame, Shield, Briefcase, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MemberLevel } from '@/types/membership';

interface TabNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  counts: {
    Member: number;
    Visitor: number;
    Convert: number;
    [key: string]: number;
  };
}

export const TabNavigation = ({ activeTab, onTabChange, counts }: TabNavigationProps) => {
  const tabs = [
    { id: 'Member', label: 'Members', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 'Visitor', label: 'First Timers', icon: UserPlus, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { id: 'Convert', label: 'New Converts', icon: Flame, color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  return (
    <div className="flex flex-nowrap overflow-x-auto no-scrollbar items-center gap-1 w-full max-w-full justify-start">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;
        
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap",
              isActive ? "text-slate-900" : "text-slate-500 hover:text-slate-700"
            )}
          >
            {isActive && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-white rounded-lg shadow-sm"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative flex items-center gap-2">
              <Icon size={16} className={cn(isActive ? tab.color : "text-slate-400")} />
              {tab.label}
              <span className={cn(
                "px-1.5 py-0.5 rounded-md text-[10px] font-bold",
                isActive ? cn(tab.bg, tab.color) : "bg-slate-200 text-slate-500"
              )}>
                {counts[tab.id as keyof typeof counts] || 0}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
};
