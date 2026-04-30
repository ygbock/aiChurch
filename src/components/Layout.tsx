import React, { useState, createContext, useContext, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Landmark,
  LayoutDashboard,
  Network,
  Building2,
  Users,
  Banknote,
  BarChart3,
  Calendar,
  Video,
  BookOpen,
  MessageSquare,
  Globe,
  Heart,
  CheckSquare,
  ArrowLeftRight,
  HelpCircle,
  LogOut,
  Search,
  Bell,
  Settings,
  UserPlus,
  Shield,
  User,
  Map,
  ChevronDown,
  LayoutGrid,
  TrendingUp,
  X,
  Flame
} from 'lucide-react';
import { APP_MODULES, Role } from '../constants/modules';
import { useFirebase } from './FirebaseProvider';
import Login from '../pages/Login';
import { setDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface RoleContextType {
  role: Role;
  setRole: (role: Role) => void;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) throw new Error('useRole must be used within a RoleProvider');
  return context;
}

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, loading, provisioningStatus, login, loginWithEmail, signUpWithEmail, logout } = useFirebase();
  const role = profile?.role || 'member';
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const roles: { [key: string]: { label: string; icon: React.ReactNode } } = {
    'admin': { label: 'Branch Admin', icon: <Building2 size={14} /> },
    'superadmin': { label: 'Super Admin', icon: <Shield size={14} /> },
    'district': { label: 'District Leader', icon: <Map size={14} /> },
    'member': { label: 'Church Member', icon: <User size={14} /> },
  };

  const allowedModules = APP_MODULES.filter(m => m.allowedRoles.includes(role));
  const currentModule = APP_MODULES.find(m => location.pathname === m.path || (m.path !== '/' && location.pathname.startsWith(m.path)));
  
  const isAdmin = role === 'admin' || role === 'superadmin' || role === 'district';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="flex flex-col items-center gap-6 max-w-sm text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-600/20 rounded-full animate-[spin_2s_linear_infinite]"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <div className="space-y-2">
            <p className="text-slate-900 font-bold text-base tracking-tight">
              {provisioningStatus || 'Initialising FaithFlow...'}
            </p>
            {provisioningStatus && (
              <p className="text-slate-500 text-sm leading-relaxed">
                We're setting up your administrative environment. This may take a few seconds during your first login.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <RoleContext.Provider value={{ role, setRole: () => {} }}>
      <div className="min-h-screen bg-slate-50 flex font-sans text-slate-800">
        {/* Sidebar Overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={`
          fixed inset-y-0 left-0 z-50 bg-white flex flex-col h-screen border-r border-slate-200 transition-all duration-300 lg:translate-x-0 lg:sticky lg:top-0 
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          ${isCollapsed ? 'lg:w-[80px]' : 'lg:w-[260px]'}
          ${!isSidebarOpen && !isCollapsed ? 'w-[260px]' : ''}
          ${isSidebarOpen ? 'w-[260px]' : ''}
          overflow-hidden
        `}>
          <div className={`p-6 border-b border-slate-100 flex items-center shrink-0 ${isCollapsed ? 'justify-center px-0' : 'justify-between'}`}>
            <div className={`flex items-center gap-2.5 ${isCollapsed ? 'hidden' : 'flex'}`}>
              <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white font-bold text-xl shrink-0">
                <Landmark size={18} />
              </div>
              <div className="overflow-hidden">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight leading-none truncate underline decoration-blue-500/30">FaithFlow</h2>
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mt-1 truncate">
                  {role === 'superadmin' ? 'Global System' : role === 'district' ? 'North America' : 'Main Campus'}
                </p>
              </div>
            </div>
            
            {isCollapsed && (
              <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-slate-200">
                <Landmark size={20} />
              </div>
            )}

            <div className="flex items-center gap-1">
              <button 
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="hidden lg:flex p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
              >
                {isCollapsed ? <LayoutGrid size={18} /> : <ArrowLeftRight size={18} className="opacity-50" />}
              </button>
              <button 
                onClick={() => setIsSidebarOpen(false)}
                className="lg:hidden p-2 hover:bg-slate-100 rounded-lg text-slate-400"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div className={`flex-1 space-y-6 overflow-y-auto no-scrollbar py-4 ${isCollapsed ? 'px-2' : 'p-4'}`}>
            {/* Core Section */}
            <div>
              {!isCollapsed && <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 mt-1">Core Modules</p>}
              <nav className="space-y-0.5">
                <NavItem 
                  to="/dashboard" 
                  icon={<LayoutDashboard size={18} />} 
                  label="Dashboard" 
                  active={location.pathname === '/dashboard'}
                  isCollapsed={isCollapsed}
                  onClick={() => setIsSidebarOpen(false)}
                />
                <NavItem to="/members" icon={<Users size={18} />} label="Members" active={location.pathname.startsWith('/members')} isCollapsed={isCollapsed} onClick={() => setIsSidebarOpen(false)} />
                <NavItem to="/departments" icon={<Building2 size={18} />} label="Departments" active={location.pathname.startsWith('/departments')} isCollapsed={isCollapsed} onClick={() => setIsSidebarOpen(false)} />
                <NavItem to="/ministries" icon={<Network size={18} />} label="Ministries" active={location.pathname.startsWith('/ministries')} isCollapsed={isCollapsed} onClick={() => setIsSidebarOpen(false)} />
              </nav>
            </div>

            {/* Spiritual Section */}
            <div>
              {!isCollapsed && <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Spiritual</p>}
              <nav className="space-y-0.5">
                <NavItem to="/events" icon={<Calendar size={18} />} label="Events" active={location.pathname.startsWith('/events')} isCollapsed={isCollapsed} onClick={() => setIsSidebarOpen(false)} />
                <NavItem to="/bible-school" icon={<BookOpen size={18} />} label="Bible School" active={location.pathname.startsWith('/bible-school')} isCollapsed={isCollapsed} onClick={() => setIsSidebarOpen(false)} />
                <NavItem to="/streaming" icon={<Video size={18} />} label="Live Stream" active={location.pathname.startsWith('/streaming')} isCollapsed={isCollapsed} onClick={() => setIsSidebarOpen(false)} />
              </nav>
            </div>

            {/* Operational Section */}
            <div>
              {!isCollapsed && <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Operations</p>}
              <nav className="space-y-0.5">
                <NavItem to="/financials" icon={<Banknote size={18} />} label="Financials" active={location.pathname.startsWith('/financials')} isCollapsed={isCollapsed} onClick={() => setIsSidebarOpen(false)} />
                <NavItem to="/volunteers" icon={<Heart size={18} />} label="Volunteers" active={location.pathname.startsWith('/volunteers')} isCollapsed={isCollapsed} onClick={() => setIsSidebarOpen(false)} />
                <NavItem to="/tasks" icon={<CheckSquare size={18} />} label="Tasks" active={location.pathname.startsWith('/tasks')} isCollapsed={isCollapsed} onClick={() => setIsSidebarOpen(false)} />
                <NavItem to="/communication" icon={<MessageSquare size={18} />} label="Communication" active={location.pathname.startsWith('/communication')} isCollapsed={isCollapsed} onClick={() => setIsSidebarOpen(false)} />
              </nav>
            </div>

            {/* Admin Section */}
            {isAdmin && (
              <div>
                {!isCollapsed && <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Administration</p>}
                <nav className="space-y-0.5">
                  <NavItem to="/transfers" icon={<ArrowLeftRight size={18} />} label="Transfers" active={location.pathname.startsWith('/transfers')} isCollapsed={isCollapsed} onClick={() => setIsSidebarOpen(false)} />
                  <NavItem to="/cms" icon={<Globe size={18} />} label="CMS" active={location.pathname.startsWith('/cms')} isCollapsed={isCollapsed} onClick={() => setIsSidebarOpen(false)} />
                  <NavItem to="/reports" icon={<BarChart3 size={18} />} label="Reports" active={location.pathname.startsWith('/reports')} isCollapsed={isCollapsed} onClick={() => setIsSidebarOpen(false)} />
                  <NavItem to="/settings" icon={<Settings size={18} />} label="Settings" active={location.pathname.startsWith('/settings')} isCollapsed={isCollapsed} onClick={() => setIsSidebarOpen(false)} />
                </nav>
              </div>
            )}
          </div>

          <div className={`p-4 border-t border-slate-100 ${isCollapsed ? 'px-2' : ''}`}>
            <NavItem to="/help" icon={<HelpCircle size={18} />} label="Help" active={location.pathname === '/help'} isCollapsed={isCollapsed} onClick={() => setIsSidebarOpen(false)} />
            <button 
              onClick={logout}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all group duration-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 ${isCollapsed ? 'justify-center' : ''}`}
            >
              <div className="relative group-hover:scale-110 transition-transform duration-200 shrink-0">
                <LogOut size={18} />
              </div>
              {!isCollapsed && <span className="flex-1 text-left">Logout</span>}
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className={`flex-1 flex flex-col min-h-screen min-w-0 p-4 md:p-8`}>
          {/* Topbar */}
          <header className="flex justify-between items-center mb-6 md:mb-8 gap-4">
            <div className="flex items-center gap-3 md:gap-6 flex-1">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-blue-600 transition-all shadow-sm"
              >
                <LayoutGrid size={20} />
              </button>
              <div className="max-w-[400px] w-full relative hidden sm:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Search commands or data..." 
                  className="w-full bg-white border border-slate-200 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition-all outline-none"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button className="p-2 text-slate-500 hover:bg-slate-100 transition-colors rounded-full relative">
                <Bell size={20} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-blue-600 rounded-full"></span>
              </button>
              <Link to="/settings" className="p-2 text-slate-500 hover:bg-slate-100 transition-colors rounded-full">
                <Settings size={20} />
              </Link>
              <div className="h-8 w-[1px] bg-slate-200 mx-2"></div>
              <div className="relative">
                <button 
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-3 pl-2 hover:bg-slate-50 p-1 rounded-xl transition-colors group"
                >
                  <div className="text-right hidden xl:block">
                    <p className="text-sm font-semibold text-slate-800 leading-none group-hover:text-blue-600 transition-colors">{profile?.fullName || 'FaithFlow User'}</p>
                    <p className="text-xs text-slate-500 mt-1">{roles[role]?.label}</p>
                  </div>
                  <div className="relative">
                    <img 
                      src={user?.photoURL || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"} 
                      alt="Profile" 
                      className="w-10 h-10 rounded-full object-cover bg-slate-300 ring-2 ring-white shadow-sm group-hover:ring-blue-100 transition-all"
                    />
                    <div className="absolute -bottom-1 -right-1 p-0.5 bg-white rounded-full shadow-sm border border-slate-100">
                      <ChevronDown size={12} className={`text-slate-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                    </div>
                  </div>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-3 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl z-[100] overflow-hidden py-2 animate-in fade-in zoom-in duration-200">
                    <div className="px-4 py-3 border-b border-slate-50 mb-1">
                      <p className="text-xs font-bold text-slate-800">{user.displayName}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{user.email}</p>
                    </div>
                    
                    <button 
                      onClick={() => navigate('/settings')}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <Settings size={18} />
                      Profile Settings
                    </button>

                    <button 
                      onClick={logout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors border-t border-slate-50 mt-1"
                    >
                      <LogOut size={18} />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          <Outlet />
        </main>
      </div>
    </RoleContext.Provider>
  );
}

function NavItem({ to, icon, label, active = false, isCollapsed = false, onClick }: { to: string, icon: React.ReactNode, label: string, active?: boolean, isCollapsed?: boolean, onClick?: () => void }) {
  return (
    <Link 
      to={to} 
      title={isCollapsed ? label : undefined}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium mb-1 ${
        active 
          ? 'bg-blue-50 text-blue-600' 
          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
      } ${isCollapsed ? 'justify-center' : ''}`}
    >
      <div className="shrink-0">{icon}</div>
      {!isCollapsed && <span className="truncate">{label}</span>}
    </Link>
  );
}
