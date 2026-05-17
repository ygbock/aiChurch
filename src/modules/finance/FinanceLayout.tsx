import React, { useState } from 'react';
import { Outlet, NavLink, Link, useLocation } from 'react-router-dom';
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
  Moon,
  Menu,
  X
} from 'lucide-react';
import { useFirebase } from '../../components/FirebaseProvider';
import { useTheme } from '../../components/ThemeProvider';
import { motion, AnimatePresence } from 'motion/react';

const FINANCE_NAV = [
  { name: 'Overview', path: '/finance/dashboard', icon: <LayoutDashboard size={18} /> },
  { name: "Treasurer's Desk", path: '/finance/treasurer', icon: <Building2 size={18} /> },
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Close mobile menu on route change
  React.useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Top Navbar */}
      <header className="h-16 bg-[#0B1E36] text-white flex items-center justify-between px-4 sm:px-6 shrink-0 sticky top-0 z-50">
        <div className="flex items-center gap-4 sm:gap-6">
          <button 
            className="lg:hidden p-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu size={24} />
          </button>
          
          <Link to="/dashboard" className="hidden sm:flex items-center gap-2 text-slate-300 hover:text-white transition-colors text-sm font-medium">
            <ArrowLeft size={16} /> <span className="hidden sm:inline">Back to CMS</span>
          </Link>
          <div className="hidden sm:block w-px h-6 bg-slate-700"></div>
          <div className="flex items-center gap-2 font-bold text-lg tracking-tight">
            <Church size={20} className="text-emerald-400" />
            <span>Finance<span className="font-light text-emerald-400">Hub</span></span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <div className="relative hidden md:block">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search transactions..."
              className="pl-9 pr-4 py-1.5 bg-[#152a4a] border border-[#1e3a63] rounded-full text-sm text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 w-48 lg:w-64"
            />
          </div>
          <button 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 text-slate-300 hover:text-white hover:bg-[#152a4a] rounded-full transition-colors hidden sm:block"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button className="p-2 text-slate-300 hover:text-white hover:bg-[#152a4a] rounded-full relative">
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border border-[#0B1E36]" />
          </button>
          <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-sm tracking-tighter shadow-sm border border-emerald-500">
            {profile?.fullName?.charAt(0) || 'U'}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Desktop Sidebar */}
        <aside className="w-64 bg-white border-r border-slate-200 flex-col shrink-0 overflow-y-auto hidden lg:flex">
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

        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileMenuOpen(false)}
                className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] lg:hidden"
              />
              {/* Drawer */}
              <motion.aside
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed inset-y-0 left-0 w-[280px] bg-white border-r border-slate-200 z-[70] flex flex-col shadow-2xl lg:hidden"
              >
                <div className="p-4 flex items-center justify-between border-b border-slate-100">
                  <div className="flex items-center gap-2 font-bold text-lg tracking-tight">
                    <Church size={20} className="text-emerald-600" />
                    <span>Finance<span className="font-light text-emerald-600">Hub</span></span>
                  </div>
                  <button 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
                
                <div className="p-4 flex-col flex gap-2 border-b border-slate-100 shrink-0">
                  <Link to="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors">
                    <LayoutDashboard size={18} className="text-slate-400" />
                    Back to Core CMS
                  </Link>
                </div>

                <div className="p-4 overflow-y-auto flex-1 pb-24">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 px-2">Navigation</p>
                  <nav className="space-y-1">
                    {FINANCE_NAV.map((item) => (
                      <NavLink
                        key={item.name}
                        to={item.path}
                        className={({ isActive }) => `
                          flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold transition-all
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
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Workspace Content */}
        <main className="flex-1 overflow-y-auto bg-slate-50 relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
