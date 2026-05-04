import React, { useState, createContext, useContext, useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
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
  Clock,
  Settings,
  UserPlus,
  Shield,
  User,
  Map,
  ChevronDown,
  LayoutGrid,
  TrendingUp,
  X,
  Flame,
  CheckCircle2,
  CalendarDays,
  Droplets,
  ClipboardList,
} from "lucide-react";
import { APP_MODULES, Role } from "../constants/modules";
import { useFirebase } from "./FirebaseProvider";
import Login from "../pages/Login";
import {
  setDoc,
  doc,
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  orderBy,
  limit,
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import NotificationManager from "./NotificationManager";
import { format } from "date-fns";

interface RoleContextType {
  role: Role;
  setRole: (role: Role) => void;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) throw new Error("useRole must be used within a RoleProvider");
  return context;
}

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    user,
    profile,
    memberProfile,
    loading,
    provisioningStatus,
    login,
    loginWithEmail,
    signUpWithEmail,
    logout,
  } = useFirebase();
  const rawRole = profile?.role || "member";
  const role = rawRole === "branch_admin" ? "admin" : rawRole;
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const roles: { [key: string]: { label: string; icon: React.ReactNode } } = {
    admin: { label: "Branch Admin", icon: <Building2 size={14} /> },
    superadmin: { label: "Super Admin", icon: <Shield size={14} /> },
    district: { label: "District Leader", icon: <Map size={14} /> },
    member: { label: "Church Member", icon: <User size={14} /> },
  };

  const allowedModules = APP_MODULES.filter((m) =>
    m.allowedRoles.includes(role),
  );
  const currentModule = APP_MODULES.find(
    (m) =>
      location.pathname === m.path ||
      (m.path !== "/" && location.pathname.startsWith(m.path)),
  );

  const isAdmin =
    role === "admin" || role === "superadmin" || role === "district";
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    // Subscribe to central notifications
    const q = query(
      collection(db, `users/${user.uid}/notifications`),
      where("read", "==", false),
      orderBy("createdAt", "desc"),
      limit(20),
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setNotifications(data);
        setUnreadCount(snapshot.size);
      },
      (error) => {
        handleFirestoreError(
          error,
          OperationType.LIST,
          `users/${user.uid}/notifications`,
        );
      },
    );
  }, [user]);

  const handleNotificationClick = async (notif: any) => {
    setShowNotifications(false);

    try {
      if (user) {
        await updateDoc(doc(db, `users/${user.uid}/notifications`, notif.id), {
          read: true,
        });
      }
    } catch (e) {
      console.error("Failed to mark notification as read", e);
    }

    if (notif.link) {
      navigate(notif.link);
    }
  };

  // Close menus when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      // Don't close if clicking inside a menu button or the menu itself
      const target = e.target as HTMLElement;
      if (target.closest(".menu-trigger") || target.closest(".menu-content"))
        return;

      setShowUserMenu(false);
      setShowNotifications(false);
      setShowRoleMenu(false);
    };
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

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
              {provisioningStatus || "Initialising FaithFlow..."}
            </p>
            {provisioningStatus && (
              <p className="text-slate-500 text-sm leading-relaxed">
                We're setting up your administrative environment. This may take
                a few seconds during your first login.
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
      <NotificationManager />
      <div className="min-h-screen bg-slate-50 flex font-sans text-slate-800">
        {/* Sidebar Overlay */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`
          fixed inset-y-0 left-0 z-50 bg-white flex flex-col h-screen border-r border-slate-200 transition-all duration-300 lg:translate-x-0 lg:sticky lg:top-0 
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
          ${isCollapsed ? "lg:w-[80px]" : "lg:w-[260px]"}
          ${!isSidebarOpen && !isCollapsed ? "w-[260px]" : ""}
          ${isSidebarOpen ? "w-[260px]" : ""}
          overflow-hidden
        `}
        >
          <div
            className={`p-6 border-b border-slate-100 flex items-center shrink-0 ${isCollapsed ? "justify-center px-0" : "justify-between"}`}
          >
            <div
              className={`flex items-center gap-2.5 ${isCollapsed ? "hidden" : "flex"}`}
            >
              <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white font-bold text-xl shrink-0">
                <Landmark size={18} />
              </div>
              <div className="overflow-hidden">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight leading-none truncate underline decoration-blue-500/30">
                  FaithFlow
                </h2>
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mt-1 truncate">
                  {role === "superadmin"
                    ? "Global System"
                    : role === "district"
                      ? "North America"
                      : "Main Campus"}
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
                {isCollapsed ? (
                  <LayoutGrid size={18} />
                ) : (
                  <ArrowLeftRight size={18} className="opacity-50" />
                )}
              </button>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="lg:hidden p-2 hover:bg-slate-100 rounded-lg text-slate-400"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div
            className={`flex-1 space-y-6 overflow-y-auto no-scrollbar py-4 ${isCollapsed ? "px-2" : "p-4"}`}
          >
            {/* Core Section */}
            <div>
              {!isCollapsed && (
                <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 mt-1">
                  Core Modules
                </p>
              )}
              <nav className="space-y-0.5">
                <NavItem
                  to="/dashboard"
                  icon={<LayoutDashboard size={18} />}
                  label="Dashboard"
                  active={location.pathname === "/dashboard"}
                  isCollapsed={isCollapsed}
                  onClick={() => setIsSidebarOpen(false)}
                />
                <NavItem
                  to="/members"
                  icon={<Users size={18} />}
                  label="Members"
                  active={location.pathname.startsWith("/members")}
                  isCollapsed={isCollapsed}
                  onClick={() => setIsSidebarOpen(false)}
                />
                <NavItem
                  to="/departments"
                  icon={<Building2 size={18} />}
                  label="Departments"
                  active={location.pathname.startsWith("/departments")}
                  isCollapsed={isCollapsed}
                  onClick={() => setIsSidebarOpen(false)}
                />
                <NavItem
                  to="/ministries"
                  icon={<Network size={18} />}
                  label="Ministries"
                  active={location.pathname.startsWith("/ministries")}
                  isCollapsed={isCollapsed}
                  onClick={() => setIsSidebarOpen(false)}
                />
              </nav>
            </div>

            {/* Spiritual Section */}
            <div>
              {!isCollapsed && (
                <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Spiritual
                </p>
              )}
              <nav className="space-y-0.5">
                <NavItem
                  to="/calendar"
                  icon={<Calendar size={18} />}
                  label="Calendar"
                  active={location.pathname === "/calendar"}
                  isCollapsed={isCollapsed}
                  onClick={() => setIsSidebarOpen(false)}
                />
                <NavItem
                  to="/events"
                  icon={<Flame size={18} />}
                  label="Live Events"
                  active={location.pathname === "/events"}
                  isCollapsed={isCollapsed}
                  onClick={() => setIsSidebarOpen(false)}
                />
                <NavItem
                  to="/baptism"
                  icon={<Droplets size={18} />}
                  label="Baptism Workflows"
                  active={location.pathname === "/baptism"}
                  isCollapsed={isCollapsed}
                  onClick={() => setIsSidebarOpen(false)}
                />
                {(memberProfile?.isBaptismInterviewer ||
                  profile?.role === "superadmin" ||
                  profile?.role === "district") && (
                  <NavItem
                    to="/baptism/interviews"
                    icon={<ClipboardList size={18} />}
                    label="Interview Portal"
                    active={location.pathname === "/baptism/interviews"}
                    isCollapsed={isCollapsed}
                    onClick={() => setIsSidebarOpen(false)}
                  />
                )}
                <NavItem
                  to="/bible-school"
                  icon={<BookOpen size={18} />}
                  label="Bible School"
                  active={location.pathname.startsWith("/bible-school")}
                  isCollapsed={isCollapsed}
                  onClick={() => setIsSidebarOpen(false)}
                />
                <NavItem
                  to="/streaming"
                  icon={<Video size={18} />}
                  label="Live Stream"
                  active={location.pathname.startsWith("/streaming")}
                  isCollapsed={isCollapsed}
                  onClick={() => setIsSidebarOpen(false)}
                />
              </nav>
            </div>

            {/* Operational Section */}
            <div>
              {!isCollapsed && (
                <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Operations
                </p>
              )}
              <nav className="space-y-0.5">
                <NavItem
                  to="/financials"
                  icon={<Banknote size={18} />}
                  label="Financials"
                  active={location.pathname.startsWith("/financials")}
                  isCollapsed={isCollapsed}
                  onClick={() => setIsSidebarOpen(false)}
                />
                <NavItem
                  to="/volunteers"
                  icon={<Heart size={18} />}
                  label="Volunteers"
                  active={location.pathname.startsWith("/volunteers")}
                  isCollapsed={isCollapsed}
                  onClick={() => setIsSidebarOpen(false)}
                />
                <NavItem
                  to="/tasks"
                  icon={<CheckSquare size={18} />}
                  label="Tasks"
                  active={location.pathname.startsWith("/tasks")}
                  isCollapsed={isCollapsed}
                  onClick={() => setIsSidebarOpen(false)}
                />
                <NavItem
                  to="/communication"
                  icon={<MessageSquare size={18} />}
                  label="Communication"
                  active={location.pathname.startsWith("/communication")}
                  isCollapsed={isCollapsed}
                  onClick={() => setIsSidebarOpen(false)}
                />
              </nav>
            </div>

            {/* Admin Section */}
            {isAdmin && (
              <div>
                {!isCollapsed && (
                  <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                    Administration
                  </p>
                )}
                <nav className="space-y-0.5">
                  <NavItem
                    to="/transfers"
                    icon={<ArrowLeftRight size={18} />}
                    label="Transfers"
                    active={location.pathname.startsWith("/transfers")}
                    isCollapsed={isCollapsed}
                    onClick={() => setIsSidebarOpen(false)}
                  />
                  <NavItem
                    to="/cms"
                    icon={<Globe size={18} />}
                    label="CMS"
                    active={location.pathname.startsWith("/cms")}
                    isCollapsed={isCollapsed}
                    onClick={() => setIsSidebarOpen(false)}
                  />
                  <NavItem
                    to="/reports"
                    icon={<BarChart3 size={18} />}
                    label="Reports"
                    active={location.pathname.startsWith("/reports")}
                    isCollapsed={isCollapsed}
                    onClick={() => setIsSidebarOpen(false)}
                  />
                  <NavItem
                    to="/settings"
                    icon={<Settings size={18} />}
                    label="Settings"
                    active={location.pathname.startsWith("/settings")}
                    isCollapsed={isCollapsed}
                    onClick={() => setIsSidebarOpen(false)}
                  />
                </nav>
              </div>
            )}
          </div>

          <div
            className={`p-4 border-t border-slate-100 ${isCollapsed ? "px-2" : ""}`}
          >
            <NavItem
              to="/help"
              icon={<HelpCircle size={18} />}
              label="Help"
              active={location.pathname === "/help"}
              isCollapsed={isCollapsed}
              onClick={() => setIsSidebarOpen(false)}
            />
            <button
              onClick={logout}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all group duration-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 ${isCollapsed ? "justify-center" : ""}`}
            >
              <div className="relative group-hover:scale-110 transition-transform duration-200 shrink-0">
                <LogOut size={18} />
              </div>
              {!isCollapsed && <span className="flex-1 text-left">Logout</span>}
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main
          className={`flex-1 flex flex-col min-h-screen min-w-0 px-4 pt-0 pb-4 md:px-8 md:pb-8`}
        >
          {/* Topbar */}
          <header className="sticky top-0 z-40 flex justify-between items-center py-4 md:py-6 mb-6 md:mb-8 gap-4 bg-slate-50/90 backdrop-blur-md -mx-4 px-4 md:-mx-8 md:px-8 shadow-sm">
            <div className="flex items-center gap-3 md:gap-6 flex-1">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-blue-600 transition-all shadow-sm"
              >
                <LayoutGrid size={20} />
              </button>
              <div className="max-w-[400px] w-full relative hidden sm:block">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Search commands or data..."
                  className="w-full bg-white border border-slate-200 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition-all outline-none"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setShowNotifications(!showNotifications);
                    setShowUserMenu(false);
                  }}
                  className={`p-2 transition-colors rounded-full relative menu-trigger ${showNotifications ? "bg-blue-50 text-blue-600" : "text-slate-500 hover:bg-slate-100"}`}
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[9px] font-black flex items-center justify-center rounded-full border-2 border-white animate-in zoom-in slide-in-from-top-1">
                      {unreadCount}
                    </span>
                  )}
                </button>

                <AnimatePresence>
                  {showNotifications && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      onClick={(e) => e.stopPropagation()}
                      className="fixed inset-x-4 top-[72px] sm:absolute sm:inset-auto sm:right-0 sm:top-[120%] sm:mt-2 sm:w-80 bg-white border border-slate-200 rounded-2xl shadow-xl z-[100] overflow-hidden flex flex-col max-h-[80vh] sm:max-h-[480px] menu-content"
                    >
                      <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">
                          System Notifications
                        </h3>
                        <span className="text-[10px] font-black bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                          {unreadCount} Active
                        </span>
                      </div>

                      <div className="flex-1 overflow-y-auto no-scrollbar py-2">
                        {notifications.length > 0 ? (
                          notifications.map((notif) => (
                            <div
                              key={notif.id}
                              onClick={() => handleNotificationClick(notif)}
                              className="px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer border-b border-slate-50 last:border-0 group"
                            >
                              <div className="flex gap-3">
                                <div
                                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-sm ${
                                    notif.category === "event"
                                      ? "bg-amber-100 text-amber-600"
                                      : notif.category === "task"
                                        ? "bg-emerald-100 text-emerald-600"
                                        : notif.category === "chat"
                                          ? "bg-indigo-100 text-indigo-600"
                                          : notif.category === "alert"
                                            ? "bg-rose-100 text-rose-600"
                                            : "bg-blue-100 text-blue-600"
                                  }`}
                                >
                                  {notif.category === "event" ? (
                                    <CalendarDays size={18} />
                                  ) : notif.category === "task" ? (
                                    <CheckCircle2 size={18} />
                                  ) : notif.category === "chat" ? (
                                    <MessageSquare size={18} />
                                  ) : notif.category === "alert" ? (
                                    <Shield size={18} />
                                  ) : (
                                    <Clock size={18} />
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex justify-between items-start mb-0.5">
                                    <p className="text-xs font-black text-slate-900 uppercase tracking-tight truncate">
                                      {notif.title}
                                    </p>
                                    <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">
                                      {notif.createdAt
                                        ? format(
                                            notif.createdAt.toDate
                                              ? notif.createdAt.toDate()
                                              : new Date(notif.createdAt),
                                            "HH:mm",
                                          )
                                        : "NOW"}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-500 leading-tight line-clamp-2">
                                    {notif.message ||
                                      notif.description ||
                                      "Notification summary"}
                                  </p>
                                  <div className="flex items-center justify-between mt-2">
                                    <div className="flex items-center gap-1.5">
                                      <div
                                        className={`w-1 h-1 rounded-full ${
                                          notif.category === "event"
                                            ? "bg-amber-400"
                                            : notif.category === "task"
                                              ? "bg-emerald-400"
                                              : "bg-blue-400"
                                        }`}
                                      />
                                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                        {notif.category || "System"}
                                      </p>
                                    </div>
                                    <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                                      Interact
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="py-16 px-6 text-center space-y-3">
                            <div className="w-14 h-14 bg-slate-50 rounded-[1.5rem] flex items-center justify-center mx-auto text-slate-200 border border-slate-100">
                              <Bell size={28} />
                            </div>
                            <div>
                              <p className="text-sm font-black text-slate-900 uppercase tracking-tight">
                                Void State
                              </p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                No active notifications detected
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => {
                          setShowNotifications(false);
                          navigate("/calendar");
                        }}
                        className="p-4 bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 hover:bg-blue-100/50 transition-all border-t border-slate-100 text-center flex items-center justify-center gap-2"
                      >
                        <LayoutGrid size={12} />
                        Protocol History
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <Link
                to="/settings"
                className="p-2 text-slate-500 hover:bg-slate-100 transition-colors rounded-full"
              >
                <Settings size={20} />
              </Link>
              <div className="h-8 w-[1px] bg-slate-200 mx-2"></div>
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setShowUserMenu(!showUserMenu);
                    setShowNotifications(false);
                  }}
                  className="flex items-center gap-3 pl-2 hover:bg-slate-50 p-1 rounded-xl transition-colors group menu-trigger cursor-pointer"
                >
                  <div className="text-right hidden xl:block">
                    <p className="text-sm font-semibold text-slate-800 leading-none group-hover:text-blue-600 transition-colors">
                      {profile?.fullName || "FaithFlow User"}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {roles[role]?.label}
                    </p>
                  </div>
                  <div className="relative">
                    <img
                      src={
                        user?.photoURL ||
                        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                      }
                      alt="Profile"
                      className="w-10 h-10 rounded-full object-cover bg-slate-300 ring-2 ring-white shadow-sm group-hover:ring-blue-100 transition-all"
                    />
                    <div className="absolute -bottom-1 -right-1 p-0.5 bg-white rounded-full shadow-sm border border-slate-100">
                      <ChevronDown
                        size={12}
                        className={`text-slate-400 transition-transform ${showUserMenu ? "rotate-180" : ""}`}
                      />
                    </div>
                  </div>
                </button>

                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      key="usermenu"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 top-[120%] mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl z-[100] overflow-hidden py-2 menu-content"
                    >
                      <div className="px-4 py-3 border-b border-slate-50 mb-1">
                        <p className="text-xs font-bold text-slate-800">
                          {user.displayName}
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium">
                          {user.email}
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          navigate("/settings");
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <Settings size={18} />
                        Profile Settings
                      </button>

                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors border-t border-slate-50 mt-1"
                      >
                        <LogOut size={18} />
                        Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </header>

          <Outlet />
        </main>
      </div>
    </RoleContext.Provider>
  );
}

function NavItem({
  to,
  icon,
  label,
  active = false,
  isCollapsed = false,
  onClick,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  isCollapsed?: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      to={to}
      title={isCollapsed ? label : undefined}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium mb-1 ${
        active
          ? "bg-blue-50 text-blue-600"
          : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
      } ${isCollapsed ? "justify-center" : ""}`}
    >
      <div className="shrink-0">{icon}</div>
      {!isCollapsed && <span className="truncate">{label}</span>}
    </Link>
  );
}
