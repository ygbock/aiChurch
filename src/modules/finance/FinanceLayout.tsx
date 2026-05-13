import React from 'react';
import { Outlet, NavLink, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Wallet, 
  ArrowLeftRight, 
  BookOpen, 
  CreditCard, 
  PieChart, 
  Users, 
  Building2, 
  FileText, 
  ShieldAlert, 
  Settings, 
  ArrowLeft,
  Bell,
  Search,
  Church,
  Sun,
  Moon
} from 'lucide-react';
import { useFirebase } from '../../components/FirebaseProvider';
import { useTheme } from '../../components/ThemeProvider';

const FINANCE_NAV = [
  { name: 'Overview', path: '/finance/dashboard', icon: <LayoutDashboard size={18} /> },
  { name: 'Donations', path: '/finance/donations', icon: <Wallet size={18} /> },
  { name: 'Transactions', path: '/finance/transactions', icon: <ArrowLeftRight size={18} /> },
  { name: 'Accounting', path: '/finance/accounting', icon: <BookOpen size={18} /> },
  { name: 'Expenses', path: '/finance/expenses', icon: <CreditCard size={18} /> },
  { name: 'Budgets', path: '/finance/budgets', icon: <PieChart size={18} /> },
  { name: 'Payroll', path: '/finance/payroll', icon: <Users size={18} /> },
  { name: 'Assets', path: '/finance/assets', icon: <Building2 size={18} /> },
  { name: 'Reports', path: '/finance/reports', icon: <FileText size={18} /> },
  { name: 'Audit Logs', path: '/finance/audit', icon: <ShieldAlert size={18} /> },
  { name: 'Integrations', path: '/finance/integrations', icon: <Settings size={18} /> },
];

export default function FinanceLayout() {
  const { profile } = useFirebase();
  const { theme, setTheme } = useTheme();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Top Navbar */}
      <header className="h-16 bg-[#0B1E36] text-white flex items-center justify-between px-6 shrink-0 sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <Link to="/dashboard" className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors text-sm font-medium">
            <ArrowLeft size={16} /> Back to CMS
          </Link>
          <div className="w-px h-6 bg-slate-700"></div>
          <div className="flex items-center gap-2 font-bold text-lg tracking-tight">
            <Church size={20} className="text-emerald-400" />
            <span>Finance<span className="font-light text-emerald-400">Hub</span></span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative hidden md:block">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search transactions..."
              className="pl-9 pr-4 py-1.5 bg-[#152a4a] border border-[#1e3a63] rounded-full text-sm text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 w-64"
            />
          </div>
          <button 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 text-slate-300 hover:text-white hover:bg-[#152a4a] rounded-full transition-colors"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button className="p-2 text-slate-300 hover:text-white hover:bg-[#152a4a] rounded-full relative">
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border border-[#0B1E36]" />
          </button>
          <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-sm tracking-tighter shadow-sm border border-emerald-500">
            {profile?.firstName?.charAt(0)}{profile?.lastName?.charAt(0)}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 overflow-y-auto hidden lg:flex">
          <div className="p-6">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Workspace</p>
            <nav className="space-y-1">
              {FINANCE_NAV.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.path}
                  className={({ isActive }) => `
                    flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all
                    ${isActive 
                      ? 'bg-emerald-50 text-emerald-700' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                  `}
                >
                  {item.icon}
                  {item.name}
                </NavLink>
              ))}
            </nav>
          </div>
        </aside>

        {/* Workspace Content */}
        <main className="flex-1 overflow-y-auto bg-slate-50 relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
