import React from 'react';
import { 
  Calendar, 
  BookOpen, 
  Video, 
  Banknote, 
  CheckSquare, 
  MessageSquare, 
  Globe,
  Users,
  LayoutDashboard,
  Shield,
  Map,
  User
} from 'lucide-react';

export type Role = 'superadmin' | 'admin' | 'district' | 'member';

export interface AppModule {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  color: string;
  allowedRoles: Role[];
}

export const APP_MODULES: AppModule[] = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    description: 'Main overview and analytics hub.',
    icon: <LayoutDashboard size={24} />,
    path: '/dashboard',
    color: 'bg-blue-600',
    allowedRoles: ['superadmin', 'admin', 'district']
  },
  {
    id: 'members',
    name: 'Members',
    description: 'Manage congregation registry and profiles.',
    icon: <Users size={24} />,
    path: '/members',
    color: 'bg-indigo-600',
    allowedRoles: ['superadmin', 'admin', 'district']
  },
  {
    id: 'events',
    name: 'Events App',
    description: 'Schedule services, conferences, and track attendance.',
    icon: <Calendar size={24} />,
    path: '/events',
    color: 'bg-rose-600',
    allowedRoles: ['superadmin', 'admin', 'district', 'member']
  },
  {
    id: 'bible-school',
    name: 'Bible School',
    description: 'Spiritual growth cohorts and leadership training.',
    icon: <BookOpen size={24} />,
    path: '/bible-school',
    color: 'bg-emerald-600',
    allowedRoles: ['superadmin', 'admin', 'district', 'member']
  },
  {
    id: 'streaming',
    name: 'Live Stream',
    description: 'Broadcast services and manage video archives.',
    icon: <Video size={24} />,
    path: '/streaming',
    color: 'bg-red-600',
    allowedRoles: ['superadmin', 'admin', 'district', 'member']
  },
  {
    id: 'financials',
    name: 'Financials',
    description: 'Ledger, tithes, offerings, and budget management.',
    icon: <Banknote size={24} />,
    path: '/financials',
    color: 'bg-orange-600',
    allowedRoles: ['superadmin', 'admin', 'district']
  },
  {
    id: 'tasks',
    name: 'Tasks App',
    description: 'Operational task tracking and project management.',
    icon: <CheckSquare size={24} />,
    path: '/tasks',
    color: 'bg-cyan-600',
    allowedRoles: ['superadmin', 'admin']
  },
  {
    id: 'communication',
    name: 'Comm Hub',
    description: 'SMS, Email, and In-app notification center.',
    icon: <MessageSquare size={24} />,
    path: '/communication',
    color: 'bg-purple-600',
    allowedRoles: ['superadmin', 'admin']
  },
  {
    id: 'cms',
    name: 'CMS App',
    description: 'Manage website content and media library.',
    icon: <Globe size={24} />,
    path: '/cms',
    color: 'bg-slate-800',
    allowedRoles: ['superadmin', 'admin']
  }
];
