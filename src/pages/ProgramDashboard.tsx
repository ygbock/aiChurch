import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useZxing } from 'react-zxing';
import { useRole } from '../components/Layout';
import { useFirebase } from '../components/FirebaseProvider';
import { collection, onSnapshot, query, setDoc, doc, serverTimestamp, getDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { QRCodeSVG } from 'qrcode.react';
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import CollapsibleSection from '../components/CollapsibleSection';
import { 
  BarChart3, 
  Users, 
  Settings, 
  ChevronRight, 
  Plus, 
  ClipboardList, 
  LayoutDashboard, 
  FileText, 
  UserPlus, 
  Shield, 
  Play, 
  CreditCard, 
  Target, 
  TrendingUp,
  Search, 
  Download, 
  Filter,
  Mail, 
  Eye, 
  MoreVertical, 
  ArrowLeft,
  BookOpen,
  Bell,
  MessageSquare,
  Command,
  Zap,
  Heart,
  Stethoscope,
  Bed,
  ListOrdered,
  Scan,
  Monitor,
  CheckCircle2,
  AlertCircle,
  Clock,
  Trash2,
  Copy,
  ChevronDown,
  LayoutGrid,
  ArrowUpDown,
  X
} from 'lucide-react';

// --- Types ---
interface ProgramModule {
  id: string;
  name: string;
  icon: React.ReactNode;
  enabled: boolean;
  description: string;
  stations: string[];
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
  status: 'ACTIVE' | 'OFF-DUTY' | 'ON-BREAK';
  assignedModule: string;
  post: string;
  checkInTime: string;
}

interface AuditEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  module: string;
  details: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
}

interface FormField {
  id: string;
  type: 'text' | 'number' | 'select' | 'date' | 'tel' | 'email';
  label: string;
  required: boolean;
  options?: string[];
}

// --- Main Page Component ---
export default function ProgramDashboard() {
  const { role } = useRole();
  const isAdmin = role === 'admin' || role === 'superadmin' || role === 'district';
  const { programId } = useParams();
  const { profile } = useFirebase();
  const navigate = useNavigate();
  const location = useLocation();
  const fromMinistry = location.state?.fromMinistry || 'youth';
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const [isMarketplaceOpen, setIsMarketplaceOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
  const [isStationModalOpen, setIsStationModalOpen] = useState(false);
  const [moduleToEditStations, setModuleToEditStations] = useState<ProgramModule | null>(null);

  const getProgramName = (id: string | undefined) => {
    if (location.state?.programName) return location.state.programName;
    if (!id) return "Operational Console";
    if (id === 'leadership-base') return "Leadership Excellence Program";
    if (id === 'discipleship-track') return "Foundations of Faith";
    if (id === 'special-workshop') return "Skills Acquisition Workshop";
    if (id === 'devine-service') return "Divine Service Operations";
    return id.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const programName = getProgramName(programId);
  const [eventDetails, setEventDetails] = useState<any>(null);
  const programStatus = "PUBLISHED";

  useEffect(() => {
    if (!profile?.districtId || !profile?.branchId || !programId) return;
    const fetchEvent = async () => {
      const eventRef = doc(db, `districts/${profile.districtId}/branches/${profile.branchId}/events/${programId}`);
      try {
        const snap = await getDoc(eventRef);
        if (snap.exists()) {
          setEventDetails({ id: snap.id, ...snap.data() });
        }
      } catch (err) {}
    };
    fetchEvent();
  }, [profile, programId]);

  // Modules state (normally this would be fetched based on programId)
  const [modules, setModules] = useState<ProgramModule[]>([
    { id: 'registration', name: 'Registration System', icon: <ClipboardList />, enabled: true, description: 'Manage signups and custom forms', stations: ['Front Desk', 'VIP Desk'] },
    { id: 'attendance', name: 'Attendance System', icon: <Scan />, enabled: true, description: 'Track presence with QR or lists', stations: ['Entrance A', 'Entrance B'] },
    { id: 'queue', name: 'Queue Manager', icon: <ListOrdered />, enabled: true, description: 'Manage flow and waiting lines', stations: ['Queue A', 'Queue B'] },
    { id: 'accommodation', name: 'Accommodation', icon: <Bed />, enabled: true, description: 'Room allocation and boarding', stations: ['Room A', 'Room B'] },
    { id: 'healthcare', name: 'Emergency Response', icon: <Stethoscope />, enabled: true, description: 'Medical logs and health support', stations: ['Triage'] },
    { id: 'transportation', name: 'Fleet Logistics', icon: <Monitor />, enabled: false, description: 'Track shuttle movements and schedules', stations: [] },
  ]);

  const toggleModule = (id: string) => {
    setModules(prev => prev.map(m => m.id === id ? { ...m, enabled: !m.enabled } : m));
  };

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    { id: 'tm1', name: 'Marcus Chen', role: 'Supervisor', avatar: 'https://i.pravatar.cc/150?u=marcus', status: 'ACTIVE', assignedModule: 'Registration System', post: 'Main Gate A', checkInTime: '08:15 AM' },
    { id: 'tm2', name: 'Sarah Jenkins', role: 'Attendant', avatar: 'https://i.pravatar.cc/150?u=sarah', status: 'ACTIVE', assignedModule: 'Attendance System', post: 'Hall Entrance 2', checkInTime: '08:45 AM' },
    { id: 'tm3', name: 'David Okafor', role: 'Medic', avatar: 'https://i.pravatar.cc/150?u=david', status: 'ON-BREAK', assignedModule: 'Accommodation', post: 'Medical Bay 1', checkInTime: '07:30 AM' },
  ]);

  const [auditLogs] = useState<AuditEntry[]>([
    { id: 'log1', timestamp: '10:42:15 AM', user: 'Marcus Chen', action: 'Approved Registration', module: 'Registration', details: 'Manual override for guest ID #8821', severity: 'INFO' },
    { id: 'log2', timestamp: '10:38:02 AM', user: 'System', action: 'Capacity Alert', module: 'Queue Manager', details: 'Hall A reached 90% capacity threshold', severity: 'WARNING' },
    { id: 'log3', timestamp: '10:35:44 AM', user: 'Sarah Jenkins', action: 'Batch Check-in', module: 'Attendance', details: '15 users checked in via NFC group scan', severity: 'INFO' },
    { id: 'log4', timestamp: '10:30:12 AM', user: 'System', action: 'Module Enabled', module: 'Dashboard', details: 'Healthcare Module was activated by Admin', severity: 'INFO' },
  ]);

  const handleDeployMember = (newMember: { name: string, role: string, module: string, post: string }) => {
    const member: TeamMember = {
      id: `tm-${Date.now()}`,
      name: newMember.name,
      role: newMember.role,
      avatar: `https://i.pravatar.cc/150?u=${Math.random()}`,
      status: 'ACTIVE',
      assignedModule: newMember.module,
      post: newMember.post,
      checkInTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setTeamMembers(prev => [...prev, member]);
    setIsDeployModalOpen(false);
  };

  const handleUpdateStations = (moduleId: string, newStations: string[]) => {
    setModules(prev => prev.map(m => m.id === moduleId ? { ...m, stations: newStations } : m));
  };

  const handleExportData = async () => {
    if (!profile?.districtId || !profile?.branchId || !programId) return;
    
    try {
        if (activeModule === 'registration' || activeModule === 'attendance') {
            const membersRef = collection(db, `districts/${profile.districtId}/branches/${profile.branchId}/members`);
            const membersSnap = await getDocs(membersRef);
            const membersList = membersSnap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));

            let csvContent = '';

            if (activeModule === 'attendance') {
                const attendanceRef = collection(db, `districts/${profile.districtId}/branches/${profile.branchId}/events/${programId}/attendance`);
                const attSnap = await getDocs(attendanceRef);
                const attRecords = attSnap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));

                csvContent = 'ID,Name,Email,Status,Time\n';
                membersList.forEach(m => {
                    const record = attRecords.find(r => r.id === m.id);
                    const status = record ? 'Present' : 'Pending';
                    const time = record && record.timestamp?.toDate ? record.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
                    csvContent += `"${m.id}","${m.fullName || ''}","${m.email || ''}","${status}","${time}"\n`;
                });
            } else if (activeModule === 'registration') {
                csvContent = 'ID,Name,Email,Type,Status,Paid\n';
                membersList.forEach(m => {
                    csvContent += `"${m.id}","${m.fullName || ''}","${m.email || ''}","Member","Verified","Yes"\n`;
                });
            }
            
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.setAttribute('download', `${activeModule}_data_${new Date().getTime()}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            alert("Export not implemented for this module yet.");
        }
    } catch (error) {
        console.error("Export error:", error);
        alert("Failed to export data.");
    }
  };

  return (
    <>
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8 pb-12"
    >
      {/* Breadcrumb / Top Bar */}
      <div className="flex items-center gap-2 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
        <button 
          onClick={() => {
            if (location.state?.fromEvent) {
              navigate('/events');
            } else {
              navigate(`/ministries/${fromMinistry}`, { state: { initialTab: 'Programs' } });
            }
          }} 
          className="hover:text-blue-600 transition-colors flex items-center gap-1"
        >
          <ArrowLeft size={14} />
          {location.state?.fromEvent ? 'Events' : 'Command Center'}
        </button>
      </div>

      {/* Header Profile Style as in image */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-5">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg relative shrink-0">
            <Command size={24} />
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full border-2 border-blue-600 flex items-center justify-center">
              <Zap size={10} className="text-blue-600" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="px-3 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-full border border-blue-100 uppercase tracking-wider">Branch Protocol</span>
              <span className="px-3 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-full border border-emerald-100 uppercase tracking-wider">{programStatus}</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 font-display tracking-tight">{programName}</h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto mt-4 md:mt-0">
          {isAdmin && (
            <button 
              onClick={() => setIsMarketplaceOpen(true)}
              className="flex-1 md:flex-none justify-center bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold text-xs hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-200/50 flex items-center gap-2 uppercase tracking-widest shrink-0 whitespace-nowrap min-w-fit"
            >
              <Plus size={16} />
              Activate Modules
            </button>
          )}
          <div className="flex items-center gap-2 shrink-0 md:justify-end">
             <IconButton icon={<MessageSquare size={18} />} badge />
             <IconButton icon={<Bell size={18} />} badge />
             <IconButton icon={<Settings size={18} />} />
             {isAdmin && (
               <button 
                 id="delete-program-btn"
                 onClick={() => setIsDeleteModalOpen(true)}
                 className="w-10 h-10 bg-white rounded-2xl border border-rose-100 flex items-center justify-center text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-all shadow-sm shrink-0"
                 title="Delete Program"
               >
                 <Trash2 size={18} />
               </button>
             )}
          </div>
        </div>
      </div>

      {/* Protocol Details Summary */}
      {eventDetails && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 group hover:border-blue-200 transition-colors">
             <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shadow-sm">
                <Users size={18} />
             </div>
             <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Attendance Mode</p>
                <p className="text-xs font-bold text-slate-900">{eventDetails.attendanceRequirement || 'Not Specified'}</p>
             </div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 group hover:border-rose-200 transition-colors">
             <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center shadow-sm">
                <Shield size={18} />
             </div>
             <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Registration</p>
                <p className="text-xs font-bold text-slate-900">{eventDetails.registrationRequired ? 'REQUIRED' : 'OPEN ACCESS'}</p>
             </div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 group hover:border-amber-200 transition-colors">
             <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shadow-sm">
                <CreditCard size={18} />
             </div>
             <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Protocol Fee</p>
                <p className="text-xs font-bold text-slate-900">{eventDetails.cost || 'FREE'}</p>
             </div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 group hover:border-emerald-200 transition-colors">
             <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shadow-sm">
                <Bed size={18} />
             </div>
             <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Food & Lodging</p>
                <p className="text-xs font-bold text-slate-900">{eventDetails.hasFoodLodging ? 'PROVIDED' : 'NOT APPLICABLE'}</p>
             </div>
          </div>
        </motion.div>
      )}

      {/* Navigation Tabs */}
      <div className="bg-white/50 backdrop-blur-sm p-1 rounded-2xl border border-slate-200 flex flex-wrap gap-1">
        {(isAdmin ? ['Dashboard', 'Analytics', 'Command Team', 'Audit Log'] : ['Dashboard']).map(tab => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setActiveModule(null); }}
            className={`px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
              activeTab === tab && !activeModule ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <AnimatePresence mode="wait">
        {!activeModule ? (
          <motion.div 
            key={activeTab} // Unique key based on tab
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full"
          >
            {activeTab === 'Dashboard' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Active Modules Cards */}
                {modules.filter(mod => mod.enabled).map(mod => (
                  <ModuleCard 
                    key={mod.id} 
                    module={mod} 
                    onClick={() => mod.enabled && setActiveModule(mod.id)}
                    onToggle={() => isAdmin && toggleModule(mod.id)}
                    onManageStations={() => { setModuleToEditStations(mod); setIsStationModalOpen(true); }}
                    isAdmin={isAdmin}
                  />
                ))}

                {/* Placeholder for Provisioning */}
                {isAdmin && (
                  <div 
                    onClick={() => setIsMarketplaceOpen(true)}
                    className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-6 flex flex-col items-center justify-center text-center group cursor-pointer hover:bg-blue-50 hover:border-blue-200 transition-all"
                  >
                    <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center text-blue-500 mb-4 group-hover:scale-110 transition-transform">
                      <Command size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 font-display">Provision Module</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Expand event operations</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'Analytics' && <PerformanceAnalytics programId={programId} />}
            {activeTab === 'Command Team' && (
              <CommandTeamManagement 
                members={teamMembers} 
                modules={modules} 
                onDeploy={() => setIsDeployModalOpen(true)}
                onEditMember={(id) => console.log('Edit member', id)}
                onDeleteMember={(id) => console.log('Delete member', id)}
              />
            )}
            {activeTab === 'Audit Log' && <AuditLogViewer logs={auditLogs} />}
          </motion.div>
        ) : (
          <motion.div
            key={`module-${activeModule}`}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden min-h-[600px] flex flex-col"
          >
            <div className="px-4 sm:px-8 py-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50/50 gap-4">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setActiveModule(null)}
                  className="p-2 hover:bg-white rounded-xl border border-slate-200 text-slate-400 hover:text-blue-600 transition-all"
                >
                  <ArrowLeft size={18} />
                </button>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 font-display flex items-center gap-2">
                    {modules.find(m => m.id === activeModule)?.name}
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[9px] font-bold rounded-full">ACTIVE</span>
                  </h2>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest hidden sm:block">Operational Console</p>
                </div>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                 {isAdmin && (
                   <button onClick={handleExportData} className="flex-1 sm:flex-none justify-center px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2">
                     <Download size={16} /> Export Data
                   </button>
                 )}
              </div>
            </div>

            <div className="flex-1 p-4 sm:p-8 overflow-x-hidden">
              {activeModule === 'registration' && <RegistrationModule />}
              {activeModule === 'attendance' && <AttendanceModule />}
              {activeModule === 'queue' && <QueueModule />}
              {activeModule === 'accommodation' && <AccommodationModule />}
              {activeModule === 'healthcare' && <HealthCareModule />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
    {/* Marketplace Modal */}
    <ModuleMarketplace 
      isOpen={isMarketplaceOpen} 
      onClose={() => setIsMarketplaceOpen(false)} 
      modules={modules}
      onToggle={toggleModule}
    />
    {/* Deploy Member Modal */}
    <DeployMemberModal 
      isOpen={isDeployModalOpen}
      onClose={() => setIsDeployModalOpen(false)}
      onDeploy={handleDeployMember}
      modules={modules}
    />
    {/* Delete Confirmation Modal */}
    <AnimatePresence>
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsDeleteModalOpen(false)}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 text-center"
          >
            <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mx-auto mb-6">
              <Trash2 size={40} />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2 font-display">Delete Program?</h3>
            <p className="text-slate-500 mb-8">
              This action is permanent and will remove all operational data, registrants, and logs associated with <span className="font-bold text-slate-900">"{programName}"</span>.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setIsDeleteModalOpen(false)}
                className="py-3 px-6 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-all uppercase tracking-widest text-[10px]"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  if (location.state?.fromEvent) {
                    setIsDeleteModalOpen(false);
                    navigate('/events');
                    return;
                  }
                  const storageKey = `ministry_programs_${fromMinistry}`;
                  const savedPrograms = localStorage.getItem(storageKey);
                  if (savedPrograms) {
                    try {
                      const programs = JSON.parse(savedPrograms);
                      const filtered = programs.filter((p: any) => p.id !== programId);
                      localStorage.setItem(storageKey, JSON.stringify(filtered));
                    } catch (e) {
                      console.error("Failed to delete program from storage", e);
                    }
                  }
                  setIsDeleteModalOpen(false);
                  navigate(`/ministries/${fromMinistry}`, { state: { initialTab: 'Programs' } });
                }}
                className="py-3 px-6 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-all uppercase tracking-widest text-[10px] shadow-lg shadow-rose-200"
              >
                Permanently Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
    {/* Manage Stations Modal */}
    <ManageStationsModal
      isOpen={isStationModalOpen}
      onClose={() => setIsStationModalOpen(false)}
      module={moduleToEditStations}
      onUpdate={handleUpdateStations}
    />
    </>
  );
}

function ManageStationsModal({ isOpen, onClose, module, onUpdate }: any) {
  const [stationName, setStationName] = useState('');
  const [stations, setStations] = useState<string[]>([]);
  
  useEffect(() => {
    if (module) setStations(module.stations || []);
  }, [module]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4">
       <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
       <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-8">
         <h3 className="text-xl font-bold text-slate-900 mb-6">Manage {module?.name} Stations</h3>
         <div className="space-y-4 mb-6">
           {stations.map((s, i) => (
             <div key={i} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
               <span className="text-sm font-bold text-slate-700">{s}</span>
               <button onClick={() => setStations(stations.filter((_, idx) => idx !== i))} className="text-rose-500"><X size={16} /></button>
             </div>
           ))}
           <div className="flex gap-2">
             <input 
               placeholder="New Station Name" 
               value={stationName} 
               onChange={e => setStationName(e.target.value)} 
               className="flex-1 p-3 rounded-xl border border-slate-200 text-sm font-bold"
             />
             <button onClick={() => { if(stationName) { setStations([...stations, stationName]); setStationName(''); } }} className="bg-slate-900 text-white p-3 rounded-xl"><Plus size={16} /></button>
           </div>
         </div>
         <button onClick={() => { onUpdate(module.id, stations); onClose(); }} className="w-full bg-blue-600 text-white rounded-2xl py-3 text-xs font-black uppercase tracking-widest hover:bg-blue-700">Save Stations</button>
       </motion.div>
    </div>
  );
}

// --- Module Marketplace Component ---
function ModuleMarketplace({ 
  isOpen, 
  onClose, 
  modules,
  onToggle 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  modules: ProgramModule[],
  onToggle: (id: string) => void 
}) {
  const marketplaceModules = [
    { id: 'attendance', title: 'Attendance Manager', desc: 'Digital check-ins and real-time tracking.', icon: <Scan size={20} />, category: 'OPERATIONS' },
    { id: 'registration', title: 'Registration System', desc: 'Customizable forms and capacity limits.', icon: <ClipboardList size={20} />, category: 'OPERATIONS' },
    { id: 'queue', title: 'Queue Manager', desc: 'Virtual queuing and crowd flow monitoring.', icon: <ListOrdered size={20} />, category: 'OPERATIONS' },
    { id: 'accommodation', title: 'Accommodation Manager', desc: 'Room allocation and lodging logistics.', icon: <Bed size={20} />, category: 'OPERATIONS' },
    { id: 'healthcare', title: 'Emergency Response', desc: 'Medical logs and incident tracking.', icon: <Stethoscope size={20} />, category: 'HEALTH' },
    { id: 'transportation', title: 'Fleet Logistics', desc: 'Track shuttle movements and schedules.', icon: <Monitor size={20} />, category: 'LOGISTICS' },
  ];

  return (
    <>
    {isOpen && (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        >
            {/* Header */}
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex gap-4 items-center">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                  <LayoutGrid size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 font-display tracking-tight">Module Marketplace</h2>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Provision functional units</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto p-8 no-scrollbar bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {marketplaceModules.map(mod => {
                  const isEnabled = modules.find(m => m.id === mod.id)?.enabled;
                  return (
                    <button 
                      key={mod.id}
                      onClick={() => onToggle(mod.id)}
                      className={`flex gap-4 p-5 rounded-2xl border transition-all text-left group relative ${
                        isEnabled
                          ? 'bg-blue-50/50 border-blue-200 shadow-sm' 
                          : 'bg-white border-slate-100 hover:border-blue-100 hover:bg-slate-50/50'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                        isEnabled ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-400'
                      }`}>
                        {mod.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="text-sm font-bold text-slate-900 truncate leading-none">{mod.title}</h3>
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none shrink-0">{mod.category}</span>
                        </div>
                        <p className="text-xs text-slate-500 leading-snug font-medium line-clamp-2">
                          {mod.desc}
                        </p>
                      </div>
                      {isEnabled && (
                        <div className="absolute top-4 right-4 w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse"></div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="px-8 py-5 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
              <p className="text-[10px] font-bold text-slate-400 italic tracking-tight">Toggle modules to adjust your operational capabilities.</p>
              <button 
                onClick={onClose}
                className="px-8 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all"
              >
                Save & Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}

// --- Sub-Components ---

function IconButton({ icon, badge }: { icon: React.ReactNode, badge?: boolean }) {
  return (
    <button className="w-10 h-10 bg-white rounded-2xl border border-slate-200 flex items-center justify-center text-slate-400 hover:text-blue-600 transition-all shadow-sm hover:shadow-md relative shrink-0">
      {icon}
      {badge && (
        <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 border-2 border-white rounded-full"></span>
      )}
    </button>
  );
}

function ModuleCard({ module, onClick, onToggle, onManageStations, isAdmin }: { module: ProgramModule, onClick: () => void, onToggle: () => void, onManageStations: () => void, isAdmin?: boolean }) {
  return (
    <div className={`bg-white rounded-3xl border border-slate-100 shadow-sm p-5 flex flex-col justify-between group transition-all ${module.enabled ? 'hover:shadow-xl hover:-translate-y-1' : 'opacity-60 overflow-hidden'}`}>
       <div className="space-y-3">
         <div className="flex justify-between items-start">
           <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-blue-600 border border-blue-50 shadow-sm ${module.enabled ? 'bg-blue-50' : 'bg-slate-100 text-slate-400'}`}>
             {React.cloneElement(module.icon as React.ReactElement<any>, { size: 20 })}
           </div>
           <div className="flex items-center gap-2">
             <span className={`text-[9px] font-bold uppercase tracking-widest ${module.enabled ? 'text-emerald-500' : 'text-slate-400'}`}>
                {module.enabled ? '● Online' : '○ Offline'}
             </span>
             {isAdmin && (
               <button 
                 onClick={(e) => { e.stopPropagation(); onToggle(); }}
                 className="p-1 hover:text-blue-600"
               >
                  <ChevronRight size={16} className={module.enabled ? 'text-slate-300' : 'text-slate-200'} />
               </button>
             )}
           </div>
         </div>

         <div>
           <h3 className="text-sm font-bold text-slate-900 font-display tracking-tight mb-1 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{module.name}</h3>
           <div className="grid grid-cols-2 gap-2 mt-3">
              <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Status</p>
                <p className="text-[10px] font-bold text-slate-900">{module.enabled ? 'Operational' : 'Disabled'}</p>
              </div>
              <div className={`bg-slate-50 p-2.5 rounded-2xl border border-slate-100 col-span-2 ${isAdmin ? 'cursor-pointer hover:bg-slate-100' : ''}`} onClick={() => isAdmin && onManageStations()}>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Stations ({module.stations.length})</p>
                {isAdmin ? (
                  <p className="text-[10px] font-bold text-blue-600 underline">Manage Stations</p>
                ) : (
                  <p className="text-[10px] font-bold text-slate-600">{module.stations.join(', ')}</p>
                )}
              </div>
           </div>
         </div>
       </div>

       <div className="mt-4">
         <button 
           onClick={onClick}
           disabled={!module.enabled}
           className={`w-full py-2.5 rounded-2xl text-[9px] font-bold uppercase tracking-widest transition-all ${
             module.enabled 
               ? 'bg-slate-50 text-slate-500 hover:bg-slate-900 hover:text-white' 
               : 'bg-slate-100 text-slate-300 cursor-not-allowed'
           }`}
         >
           Open Console
         </button>
       </div>
    </div>
  );
}

// --- PERFORMANCE ANALYTICS COMPONENT ---
function PerformanceAnalytics({ programId }: { programId: string | undefined }) {
  const checkinData = [
    { time: '09:00', arrivals: 45 },
    { time: '09:15', arrivals: 120 },
    { time: '09:30', arrivals: 340 },
    { time: '09:45', arrivals: 580 },
    { time: '10:00', arrivals: 220 },
    { time: '10:15', arrivals: 85 },
    { time: '10:30', arrivals: 42 },
  ];

  const financialData = [
    { name: 'Offering', budget: 15000, actual: 18250 },
    { name: 'Pledges', budget: 50000, actual: 32400 },
    { name: 'Merch', budget: 2000, actual: 2800 },
  ];

  return (
    <div className="space-y-8">
      {/* Analytics Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-4xl font-black text-slate-900 font-display tracking-tight leading-none mb-1 uppercase italic">Performance Analytics</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Real-time operational insights</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-900 shadow-sm flex items-center gap-2 hover:bg-slate-50 transition-all">
            Last 24 Hours <ChevronDown size={14} className="text-slate-400" />
          </button>
          <button className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-900 shadow-sm flex items-center gap-2 hover:bg-slate-50 transition-all">
            <Download size={16} className="text-slate-400" /> Export
          </button>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Check-in Velocity */}
        <div className="lg:col-span-2 bg-white rounded-[40px] border border-slate-100 shadow-sm p-10 relative overflow-hidden group hover:shadow-xl transition-all duration-500">
           <div className="flex justify-between items-start mb-8 relative z-10">
              <div className="flex gap-4 items-center">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                  <Users size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 font-display leading-none mb-1">Check-in Velocity</h3>
                  <p className="text-xs text-slate-400 font-medium tracking-tight">Arrival rate per 15 mins</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-full border border-blue-100 uppercase tracking-widest">
                +12% vs Last Event
              </span>
           </div>
           
           <div className="h-64 mt-10">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={checkinData}>
                  <defs>
                    <linearGradient id="colorCheckin" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="time" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 600}} 
                    dy={10} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 600}} 
                  />
                  <Tooltip 
                    contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}} 
                    cursor={{stroke: '#3b82f6', strokeWidth: 2}}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="arrivals" 
                    stroke="#3b82f6" 
                    strokeWidth={4} 
                    fillOpacity={1} 
                    fill="url(#colorCheckin)" 
                    animationDuration={2000}
                  />
                </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* Impact Funnel */}
        <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm p-10 flex flex-col hover:shadow-xl transition-all duration-500">
           <div className="flex gap-4 items-center mb-8">
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                <TrendingUp size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 font-display leading-none mb-1">Impact Funnel</h3>
                <p className="text-xs text-slate-400 font-medium tracking-tight">Engagement metrics</p>
              </div>
           </div>

           <div className="space-y-8 flex-1">
              <FunnelStep label="TOTAL REGISTRATIONS" value="1,850" percent={95} color="bg-blue-600" />
              <FunnelStep label="CHECKED IN" value="1,475" percent={75} color="bg-emerald-500" />
              <FunnelStep label="FIRST TIMERS" value="142" percent={20} color="bg-orange-500" />
              <FunnelStep label="NEW CONVERTS" value="38" percent={8} color="bg-rose-500" />
           </div>

           <div className="mt-8 pt-8 border-t border-slate-100 text-center">
              <p className="text-[10px] font-bold text-slate-400">
                <span className="text-blue-600">2.6%</span> of attendees made a first-time commitment today.
              </p>
           </div>
        </div>
      </div>

      {/* Row 2: Financials */}
      <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm p-10 flex flex-col lg:flex-row gap-12 group hover:shadow-xl transition-all duration-500">
        {/* Left Chart */}
        <div className="flex-1">
           <div className="flex gap-4 items-center mb-8">
              <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
                <CreditCard size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 font-display leading-none mb-1">Financial Performance</h3>
                <p className="text-xs text-slate-400 font-medium tracking-tight">Budget vs Actuals</p>
              </div>
           </div>

           <div className="h-64 mt-6">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={financialData} barGap={12}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 600}} 
                    dy={10} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 600}} 
                    tickFormatter={(val) => `$${val/1000}k`}
                  />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}} 
                  />
                  <Bar dataKey="budget" name="Budget" fill="#cbd5e1" radius={[6, 6, 0, 0]} barSize={24} />
                  <Bar dataKey="actual" name="Actual" fill="#f59e0b" radius={[6, 6, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* Right Stats Breakdown */}
        <div className="w-full lg:w-96 space-y-4">
           <FinanceCard label="OFFERING" current={18250} target={15000} color="text-emerald-500" />
           <FinanceCard label="PLEDGES" current={32400} target={50000} color="text-rose-500" />
           <FinanceCard label="MERCH" current={2800} target={2000} color="text-emerald-500" />
        </div>
      </div>
    </div>
  );
}

function FunnelStep({ label, value, percent, color }: any) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-end">
        <span className="text-[10px] font-black text-slate-400 tracking-widest">{label}</span>
        <span className="text-sm font-black text-slate-900 tracking-tighter">{value}</span>
      </div>
      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 1.5, ease: "circOut" }}
          className={`h-full ${color}`}
        />
      </div>
    </div>
  );
}

function FinanceCard({ label, current, target, color }: any) {
  const percent = Math.round((current / target) * 100);
  return (
    <div className="bg-slate-50/50 border border-slate-100 rounded-3xl p-6 flex justify-between items-center group/card hover:bg-white hover:shadow-lg transition-all duration-300" id={label.toLowerCase()+'-finance'}>
      <div className="space-y-0.5">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-2xl font-black text-slate-900 tracking-tighter">${current.toLocaleString()}</p>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">/ ${target.toLocaleString()}</p>
      </div>
      <div className="text-right">
        <p className={`text-sm font-black ${color}`}>{percent}%</p>
      </div>
    </div>
  );
}

// --- COMMAND TEAM MANAGEMENT ---
function CommandTeamManagement({ members, modules, onDeploy, onEditMember, onDeleteMember }: { members: TeamMember[], modules: ProgramModule[], onDeploy: () => void, onEditMember?: (id: string) => void, onDeleteMember?: (id: string) => void }) {
  const [sortBy, setSortBy] = useState<'module' | 'name'>('module');
  const [filterModule, setFilterModule] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilter, setShowFilter] = useState(false);

  const displayedMembers = [...members]
    .filter(m => filterModule === 'all' || m.assignedModule === filterModule)
    .filter(m => searchQuery === '' || m.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'module') return a.assignedModule.localeCompare(b.assignedModule);
      return a.name.localeCompare(b.name);
    });

  const uniqueModules = Array.from(new Set(members.map(m => m.assignedModule)));
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 font-display tracking-tight leading-none mb-1 uppercase italic">Command Team</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Personnel & Station Assignment</p>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search members..."
              className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs font-bold text-slate-700"
            />
          </div>
          
          <div className="relative">
            <button 
              onClick={() => setShowFilter(!showFilter)}
              className={`p-2.5 rounded-xl border ${showFilter ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-slate-200 text-slate-400'}`}
            >
              <Filter size={18} />
            </button>
            {showFilter && (
              <div className="absolute right-0 top-full mt-2 bg-white border border-slate-200 rounded-xl shadow-lg z-50 p-2 w-40">
                <button onClick={() => { setFilterModule('all'); setShowFilter(false); }} className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-lg">All Modules</button>
                {uniqueModules.map(m => (
                  <button key={m} onClick={() => { setFilterModule(m); setShowFilter(false); }} className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-lg">{m}</button>
                ))}
              </div>
            )}
          </div>

          <button 
            onClick={() => setSortBy(sortBy === 'module' ? 'name' : 'module')}
            className={`p-2.5 rounded-xl border bg-white border-slate-200 text-slate-400`}
            title={`Sorting by ${sortBy}`}
          >
            <ArrowUpDown size={18} />
          </button>
         
        </div>
      </div>
      
      {/* Floating Action Button */}
      <button 
        onClick={onDeploy}
        className="fixed bottom-6 right-6 sm:hidden bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-all z-50"
      >
        <Plus size={24} />
      </button>

      {/* Deploy Button for Desktop */}
      <div className="hidden sm:flex justify-end">
        <button 
            onClick={onDeploy}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold text-xs hover:bg-blue-700 transition-all shadow-lg flex items-center gap-2 uppercase tracking-widest"
          >
            <Plus size={16} /> Deploy Member
        </button>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        {/* Mobile View: Cards */}
        <div className="block sm:hidden p-4 space-y-4">
            {displayedMembers.map(member => (
              <div key={member.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                 <div className="flex items-center gap-3">
                    <img src={member.avatar} alt={member.name} className="w-10 h-10 rounded-xl object-cover ring-2 ring-white shadow-sm" />
                    <div>
                      <p className="text-sm font-bold text-slate-900 leading-none mb-1">{member.name}</p>
                      <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">{member.role}</p>
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase">Module</p>
                        <p className="font-bold text-slate-700">{member.assignedModule}</p>
                    </div>
                    <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase">Station</p>
                        <p className="font-bold text-slate-700">{member.post}</p>
                    </div>
                </div>
                 <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        member.status === 'ACTIVE' ? 'bg-emerald-500 shadow-sm shadow-emerald-200' : 
                        member.status === 'ON-BREAK' ? 'bg-amber-500 shadow-sm shadow-amber-200' : 'bg-slate-300'
                      }`} />
                      <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{member.status}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button className="p-2 text-slate-400 hover:text-blue-600" onClick={() => onEditMember?.(member.id)}><Settings size={14} /></button>
                      <button className="p-2 text-slate-400 hover:text-rose-600" onClick={() => onDeleteMember?.(member.id)}><Trash2 size={14} /></button>
                    </div>
                 </div>
              </div>
            ))}
        </div>

        {/* Desktop View: Table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Member / Role</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Module Assignment</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Station/Post</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {displayedMembers.map(member => (
                <tr key={member.id} className="hover:bg-slate-50/30 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <img src={member.avatar} alt={member.name} className="w-10 h-10 rounded-xl object-cover ring-2 ring-white shadow-sm" />
                      <div>
                        <p className="text-sm font-bold text-slate-900 leading-none mb-1">{member.name}</p>
                        <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">{member.role}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                        {modules.find(m => m.name === member.assignedModule)?.icon || <LayoutGrid size={14} />}
                      </span>
                      <span className="text-xs font-bold text-slate-700">{member.assignedModule}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="px-3 py-1 bg-slate-100 rounded-full inline-block border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-600 uppercase italic tracking-tight">{member.post}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        member.status === 'ACTIVE' ? 'bg-emerald-500 shadow-sm shadow-emerald-200' : 
                        member.status === 'ON-BREAK' ? 'bg-amber-500 shadow-sm shadow-amber-200' : 'bg-slate-300'
                      }`} />
                      <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{member.status}</span>
                    </div>
                    <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase">Checked in @ {member.checkInTime}</p>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" onClick={() => onEditMember?.(member.id)}><Settings size={16} /></button>
                        <button className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" onClick={() => onDeleteMember?.(member.id)}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// --- COMMAND TEAM MANAGEMENT ---
function DeployMemberModal({ isOpen, onClose, onDeploy, modules }: any) {
  const [activeTab, setActiveTab] = useState<'personal' | 'batch'>('personal');
  const [formData, setFormData] = useState({
    name: '',
    role: 'Attendant',
    module: modules[0]?.name || '',
    post: ''
  });
  
  const [batchDeployments, setBatchDeployments] = useState<any[]>([{ id: Date.now(), name: '', role: 'Attendant', module: modules[0]?.name || '', post: '' }]);

  // Mock list of available members
  const availableMembers = [
    { id: 'm1', name: 'James Wilson' },
    { id: 'm2', name: 'Maria Garcia' },
    { id: 'm3', name: 'Robert Smith' },
    { id: 'm4', name: 'Emily Davis' },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="p-8 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="text-2xl font-bold text-slate-900 font-display tracking-tight">Deploy Personnel</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Assign members to stations</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100">
           <button 
             onClick={() => setActiveTab('personal')}
             className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest ${activeTab === 'personal' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-400'}`}
           >
             Personal
           </button>
           <button 
             onClick={() => setActiveTab('batch')}
             className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest ${activeTab === 'batch' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-400'}`}
           >
             Batch
           </button>
        </div>

        <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto">
          {activeTab === 'personal' ? (
            /* Personal Tab Fields */
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select Member</label>
                <select 
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                >
                  <option value="">Select a member</option>
                  {availableMembers.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Duty Role</label>
                    <select 
                       value={formData.role}
                       onChange={e => setFormData({ ...formData, role: e.target.value })}
                       className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500/20 outline-none"
                    >
                      <option>Supervisor</option>
                      <option>Attendant</option>
                      <option>Medic</option>
                      <option>Security</option>
                      <option>Logistics</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Post/Station</label>
                    <select 
                       value={formData.post}
                       onChange={e => setFormData({ ...formData, post: e.target.value })}
                       className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500/20 outline-none"
                    >
                        <option value="">Select Station</option>
                        <option value="Main Gate A">Main Gate A</option>
                        <option value="Hall Entrance 2">Hall Entrance 2</option>
                        <option value="Medical Bay 1">Medical Bay 1</option>
                    </select>
                  </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Module Assignment</label>
                <select 
                   value={formData.module}
                   onChange={e => setFormData({ ...formData, module: e.target.value })}
                   className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500/20 outline-none"
                >
                  <option value="">Select a module</option>
                  {modules.filter((m: any) => m.enabled).map((m: any) => (
                    <option key={m.id} value={m.name}>{m.name}</option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
             /* Batch Tab Fields */
             <div className="space-y-6">
                {batchDeployments.map((deployment, index) => (
                  <div key={deployment.id} className="grid grid-cols-[2fr,1.5fr,1.5fr,1.5fr,auto] gap-3 items-end bg-slate-50 p-2 rounded-2xl border border-slate-100">
                     <select value={deployment.name} onChange={e => {
                        const newBatch = [...batchDeployments];
                        newBatch[index].name = e.target.value;
                        setBatchDeployments(newBatch);
                     }} className="p-2 rounded-xl border border-slate-200 text-xs font-bold">
                        <option value="">Member</option>
                        {availableMembers.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                     </select>
                     <select value={deployment.module} onChange={e => {
                        const newBatch = [...batchDeployments];
                        newBatch[index].module = e.target.value;
                        setBatchDeployments(newBatch);
                     }} className="p-2 rounded-xl border border-slate-200 text-xs font-bold">
                        {modules.filter((m: any) => m.enabled).map((m: any) => <option key={m.id} value={m.name}>{m.name}</option>)}
                     </select>
                     <select value={deployment.role} onChange={e => {
                          const newBatch = [...batchDeployments];
                          newBatch[index].role = e.target.value;
                          setBatchDeployments(newBatch);
                       }} className="p-2 rounded-xl border border-slate-200 text-xs font-bold">
                         <option>Supervisor</option>
                         <option>Attendant</option>
                         <option>Medic</option>
                         <option>Security</option>
                         <option>Logistics</option>
                     </select>
                     <select value={deployment.post} onChange={e => {
                          const newBatch = [...batchDeployments];
                          newBatch[index].post = e.target.value;
                          setBatchDeployments(newBatch);
                       }} className="p-2 rounded-xl border border-slate-200 text-xs font-bold">
                         <option value="">Station</option>
                         <option value="Main Gate A">Main Gate A</option>
                         <option value="Hall Entrance 2">Hall Entrance 2</option>
                         <option value="Medical Bay 1">Medical Bay 1</option>
                     </select>
                     <button onClick={() => setBatchDeployments(batchDeployments.filter((_, i) => i !== index))} className="text-rose-500 hover:text-rose-700 p-2"><X size={16} /></button>
                  </div>
                ))}
                <button onClick={() => setBatchDeployments([...batchDeployments, { id: Date.now(), name: '', role: 'Attendant', module: modules[0]?.name || '', post: '' }])} className="text-[10px] font-black uppercase text-blue-600 flex items-center gap-2">
                    <Plus size={14} /> Add Row
                </button>
             </div>
          )}
        </div>

        <div className="p-8 bg-slate-50 flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all"
          >
            Cancel
          </button>
          <button 
            onClick={() => {
              if (activeTab === 'personal') {
                onDeploy(formData);
              } else {
                batchDeployments.forEach(onDeploy);
                onClose();
              }
            }}
            disabled={activeTab === 'personal' ? (!formData.name || !formData.module) : batchDeployments.some(d => !d.name || !d.module)}
            className="flex-[2] bg-blue-600 text-white rounded-2xl py-4 text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-50 disabled:shadow-none"
          >
            {activeTab === 'personal' ? 'Confirm & Deploy' : 'Confirm & Deploy All'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// --- AUDIT LOG VIEWER ---
function AuditLogViewer({ logs }: { logs: AuditEntry[] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'INFO' | 'WARNING' | 'CRITICAL'>('all');
  const [showFilter, setShowFilter] = useState(false);

  const filteredLogs = logs
    .filter(log => filterSeverity === 'all' || log.severity === filterSeverity)
    .filter(log => log.details.toLowerCase().includes(searchQuery.toLowerCase()) || log.action.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-4xl font-black text-slate-900 font-display tracking-tight leading-none mb-1 uppercase italic">Operational Audit Log</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Immutable Event Activity Stream</p>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search logs..."
              className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs font-bold text-slate-700"
            />
          </div>
          
          <div className="relative">
            <button 
              onClick={() => setShowFilter(!showFilter)}
              className={`p-2.5 rounded-xl border ${showFilter ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-slate-200 text-slate-400'}`}
            >
              <Filter size={18} />
            </button>
            {showFilter && (
              <div className="absolute right-0 top-full mt-2 bg-white border border-slate-200 rounded-xl shadow-lg z-50 p-2 w-40">
                <button onClick={() => { setFilterSeverity('all'); setShowFilter(false); }} className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-lg">All Severities</button>
                {(['INFO', 'WARNING', 'CRITICAL'] as const).map(sev => (
                  <button key={sev} onClick={() => { setFilterSeverity(sev); setShowFilter(false); }} className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-lg">{sev}</button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-slate-900 rounded-[32px] shadow-2xl p-2 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-rose-500" />
        <div className="custom-scroll max-h-[600px] overflow-y-auto">
          <div className="divide-y divide-white/5">
            {filteredLogs.length > 0 ? filteredLogs.map((log, idx) => (
              <div key={log.id} className="p-6 hover:bg-white/5 transition-all flex gap-8 items-start relative group">
                <div className="w-24 shrink-0 pt-1">
                   <p className="text-[10px] font-black font-mono text-blue-400/80 uppercase tracking-widest">{log.timestamp}</p>
                </div>
                <div className="flex-1 space-y-2">
                   <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${
                        log.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                        log.severity === 'WARNING' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                        'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      }`}>
                        {log.severity}
                      </span>
                      <h4 className="text-sm font-bold text-white tracking-tight">{log.action}</h4>
                      <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest px-2 border-l border-white/10">{log.module}</span>
                   </div>
                   <p className="text-xs text-white/50 leading-relaxed max-w-2xl">{log.details}</p>
                   <div className="flex items-center gap-2 pt-1">
                      <div className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center">
                         <Users size={8} className="text-white/40" />
                      </div>
                      <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">{log.user}</span>
                   </div>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-all pr-4">
                   <button className="text-[9px] font-black text-blue-400 uppercase tracking-widest hover:underline px-4 py-1.5 bg-blue-400/10 rounded-full">Details</button>
                </div>
              </div>
            )) : <p className="text-white/40 p-8 text-center text-xs">No logs found.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- MODULE: REGISTRATION ---
function RegistrationModule() {
  const { profile } = useFirebase();
  const { programId } = useParams();
  const [view, setView] = useState<'Registrants' | 'FormDesigner'>('Registrants');
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddManualModalOpen, setIsAddManualModalOpen] = useState(false);
  const [newMember, setNewMember] = useState({ fullName: '', email: '', phone: '', gender: 'Male', status: 'Active', level: 'Convert' });

  useEffect(() => {
    if (!profile?.districtId || !profile?.branchId) return;

    const membersRef = collection(db, `districts/${profile.districtId}/branches/${profile.branchId}/members`);
    const unsub = onSnapshot(membersRef, (snap) => {
        setMembers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.LIST, `districts/${profile.districtId}/branches/${profile.branchId}/members`));

    return () => unsub();
  }, [profile?.districtId, profile?.branchId]);

  const handleAddManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.districtId || !profile?.branchId || !newMember.fullName) return;

    const membersRef = collection(db, `districts/${profile.districtId}/branches/${profile.branchId}/members`);
    try {
        await setDoc(doc(membersRef), {
            ...newMember,
            branchId: profile.branchId,
            createdAt: serverTimestamp()
        });
        setIsAddManualModalOpen(false);
        setNewMember({ fullName: '', email: '', phone: '', gender: 'Male', status: 'Active', level: 'Convert' });
    } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, membersRef.path);
    }
  };

  const filteredMembers = members.filter(m => 
    (m.fullName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (m.email?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );
  
  const exportRegistrants = () => {
    let csvContent = 'ID,Name,Email,Type,Status,Paid\n';
    filteredMembers.forEach(m => {
        csvContent += `"${m.id}","${m.fullName || ''}","${m.email || ''}","Member","Verified","Yes"\n`;
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `registrants_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <div className="space-y-8 flex flex-col h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex gap-2 sm:gap-4 p-1 bg-slate-100 rounded-xl w-fit overflow-x-auto">
          {['Registrants', 'FormDesigner'].map(v => (
            <button
              key={v}
              onClick={() => setView(v as any)}
              className={`px-4 sm:px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                view === v ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {v === 'FormDesigner' ? 'Form Designer' : 'Registrant List'}
            </button>
          ))}
        </div>
        {view === 'Registrants' && (
          <div className="flex gap-2 sm:gap-4 items-center">
             <div className="relative flex-1 sm:w-64">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
               <input 
                 type="text" 
                 placeholder="Search registrants..." 
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="w-full pl-9 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
               />
             </div>
             <button 
               onClick={() => setIsAddManualModalOpen(true)}
               className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-colors flex items-center gap-2 whitespace-nowrap"
             >
               <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Add Manual</span>
             </button>
          </div>
        )}
      </div>

      <div className="flex-1">
        {view === 'Registrants' ? (
          <div className="space-y-6">
            <CollapsibleSection title="Reporting Summaries" icon={<LayoutGrid size={20} />} className="!bg-slate-50/50">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl">
                  <p className="text-[9px] font-bold text-blue-500 uppercase tracking-widest mb-0.5">Total Registered</p>
                  <p className="text-xl font-black text-blue-900">{filteredMembers.length}</p>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl">
                  <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest mb-0.5">Paid Status</p>
                  <p className="text-xl font-black text-emerald-900">{filteredMembers.length}</p>
                </div>
                <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl">
                  <p className="text-[9px] font-bold text-amber-500 uppercase tracking-widest mb-0.5">Pending Review</p>
                  <p className="text-xl font-black text-amber-900">0</p>
                </div>
                <div className="bg-white border border-slate-100 p-4 rounded-2xl flex flex-col justify-center items-center text-center">
                   <button onClick={exportRegistrants} className="text-blue-600 font-bold flex items-center gap-2 hover:underline text-[10px] uppercase">
                     <Download size={14} /> CSV
                   </button>
                </div>
              </div>
            </CollapsibleSection>

            <div className="bg-white border border-slate-200 rounded-2xl overflow-x-auto shadow-sm">
              <table className="w-full min-w-[600px] text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Registrant</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr><td colSpan={5} className="text-center py-8 text-slate-400 text-xs">Loading...</td></tr>
                  ) : filteredMembers.map(member => (
                    <RegistrantRow 
                        key={member.id}
                        name={member.fullName || 'Unknown'} 
                        email={member.email || 'No email'} 
                        type="Member" 
                        status="Verified" 
                        paid={true} 
                        onView={() => setSelectedMember(member)}
                    />
                  ))}
                  {filteredMembers.length === 0 && !loading && (
                    <tr><td colSpan={5} className="text-center py-8 text-slate-400 text-xs">No registrants found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {selectedMember && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative">
                  <div className="bg-blue-600 p-6 text-center">
                    <h2 className="text-white font-display text-2xl font-black uppercase tracking-wider">Event Pass</h2>
                    <p className="text-blue-200 text-[10px] uppercase tracking-widest font-bold mt-1">Official Participant</p>
                  </div>
                  <div className="p-8 flex flex-col items-center">
                    <div className="w-48 h-48 bg-white border-4 border-slate-50 rounded-2xl p-4 shadow-sm mb-6 flex items-center justify-center">
                      <QRCodeSVG value={selectedMember.id} size={160} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-1 text-center">{selectedMember.fullName || 'Unknown'}</h3>
                    <p className="text-slate-500 text-xs text-center mb-6">{selectedMember.email || 'No email'}</p>
                    
                    <div className="w-full space-y-3">
                      <button 
                        onClick={() => window.print()}
                        className="w-full bg-slate-900 text-white font-bold text-xs uppercase tracking-widest py-3 rounded-xl hover:bg-slate-800 transition-colors"
                      >
                        Download / Print ID
                      </button>
                      <button 
                        onClick={() => setSelectedMember(null)}
                        className="w-full bg-slate-100 text-slate-600 font-bold text-xs uppercase tracking-widest py-3 rounded-xl hover:bg-slate-200 transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Add Manual Modal */}
            <AnimatePresence>
              {isAddManualModalOpen && (
                <div className="fixed inset-0 z-[10002] flex items-center justify-center p-4">
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }} 
                    onClick={() => setIsAddManualModalOpen(false)} 
                    className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
                  />
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }} 
                    animate={{ opacity: 1, scale: 1, y: 0 }} 
                    exit={{ opacity: 0, scale: 0.95, y: 20 }} 
                    className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-8"
                  >
                    <h3 className="text-2xl font-bold text-slate-900 mb-6 font-display">Add Manual Registrant</h3>
                    <form onSubmit={handleAddManual} className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Full Name</label>
                        <input required value={newMember.fullName} onChange={e => setNewMember({...newMember, fullName: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 text-sm font-bold bg-slate-50 focus:bg-white transition-all" placeholder="John Doe" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Email</label>
                          <input type="email" value={newMember.email} onChange={e => setNewMember({...newMember, email: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 text-sm font-bold bg-slate-50 focus:bg-white transition-all" placeholder="john@example.com" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Phone</label>
                          <input type="tel" value={newMember.phone} onChange={e => setNewMember({...newMember, phone: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 text-sm font-bold bg-slate-50 focus:bg-white transition-all" placeholder="+123..." />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Level</label>
                          <select value={newMember.level} onChange={e => setNewMember({...newMember, level: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 text-sm font-bold bg-slate-50 focus:bg-white transition-all">
                            {['Convert', 'Disciple', 'Worker', 'Leader'].map(l => <option key={l} value={l}>{l}</option>)}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Status</label>
                          <select value={newMember.status} onChange={e => setNewMember({...newMember, status: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 text-sm font-bold bg-slate-50 focus:bg-white transition-all">
                            {['Active', 'Pending', 'Inactive'].map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="pt-4 flex gap-4">
                        <button type="button" onClick={() => setIsAddManualModalOpen(false)} className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600">Cancel</button>
                        <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-200 hover:bg-blue-700">Add Member</button>
                      </div>
                    </form>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <FormDesigner />
        )}
      </div>
    </div>
  );
}

function RegistrantRow({ name, email, type, status, paid, onView }: any) {
  return (
    <tr className="hover:bg-slate-50 transition-colors">
      <td className="px-6 py-4">
        <div>
          <p className="text-sm font-bold text-slate-900">{name}</p>
          <p className="text-xs text-slate-500">{email}</p>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className="text-xs font-bold text-slate-700">{type}</span>
      </td>
      <td className="px-6 py-4">
        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${status === 'Verified' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
          {status}
        </span>
      </td>
      <td className="px-6 py-4">
        {paid ? (
          <span className="flex items-center gap-1.5 text-emerald-600 text-[10px] font-black uppercase">
            <CheckCircle2 size={14} /> Received
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-rose-500 text-[10px] font-black uppercase tracking-widest">
            <CreditCard size={14} /> Outstanding
          </span>
        )}
      </td>
      <td className="px-6 py-4 text-right">
        <button onClick={onView} className="text-blue-600 font-bold hover:underline py-1 px-3 rounded-lg hover:bg-blue-50 text-xs">View Pass</button>
      </td>
    </tr>
  );
}

// --- MODULE: FORM DESIGNER ---
function FormDesigner() {
  const [fields, setFields] = useState<FormField[]>([
    { id: '1', type: 'text', label: 'Full Name', required: true },
    { id: '2', type: 'email', label: 'Email Address', required: true },
    { id: '3', type: 'select', label: 'Membership Status', required: true, options: ['Member', 'Visitor'] },
  ]);

  const addField = (type: FormField['type']) => {
    const newField: FormField = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      label: 'New Question',
      required: false,
      options: type === 'select' ? ['Option 1', 'Option 2'] : undefined
    };
    setFields([...fields, newField]);
  };

  const removeField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
      {/* Field Library */}
      <div className="space-y-6">
        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
          <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">Field Library</h4>
          <div className="space-y-3">
             <FieldTool label="Short Text" icon={<FileText size={18} />} onClick={() => addField('text')} />
             <FieldTool label="Number Input" icon={<Target size={18} />} onClick={() => addField('number')} />
             <FieldTool label="Dropdown Menu" icon={<ChevronDown size={18} />} onClick={() => addField('select')} />
             <FieldTool label="Date Picker" icon={<Clock size={18} />} onClick={() => addField('date')} />
             <FieldTool label="Phone Number" icon={<Mail size={18} />} onClick={() => addField('tel')} />
          </div>
        </div>

        <div className="bg-blue-600 p-6 rounded-3xl text-white shadow-xl shadow-blue-200">
          <h4 className="text-sm font-black uppercase tracking-widest mb-1 opacity-75">Live Form Link</h4>
          <p className="text-xs font-medium mb-4 italic">Share this with invitees</p>
          <div className="flex bg-white/10 rounded-xl p-3 items-center justify-between">
            <span className="text-[10px] font-bold overflow-hidden text-ellipsis whitespace-nowrap">fhbc.church/reg/divine-s...</span>
            <button className="p-1 hover:bg-white/20 rounded-lg transition-all"><Copy size={14} /></button>
          </div>
          <button className="w-full mt-4 py-3 bg-white text-blue-600 rounded-xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all">
            Open Web Preview
          </button>
        </div>
      </div>

      {/* Editor Canvas */}
      <div className="lg:col-span-2 bg-slate-50 rounded-3xl border border-dashed border-slate-200 p-8 min-h-[500px]">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-xl mx-auto space-y-8">
          <div className="text-center">
            <h3 className="text-2xl font-black text-slate-900 font-display">Registration Form</h3>
            <p className="text-sm text-slate-500 font-medium">Please fill out the details for the Devine Service</p>
          </div>

          <div className="space-y-6">
            {fields.map((field, index) => (
              <div key={field.id} className="group relative p-4 rounded-xl border-2 border-transparent hover:border-blue-100 hover:bg-blue-50/10 transition-all">
                 <div className="flex justify-between items-start mb-2">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-black rounded uppercase">Step {index + 1}</span>
                    <button onClick={() => removeField(field.id)} className="opacity-0 group-hover:opacity-100 p-1.5 text-rose-400 hover:bg-rose-50 rounded-lg transition-all">
                      <Trash2 size={16} />
                    </button>
                 </div>
                 <div className="space-y-2">
                    <input 
                      className="text-lg font-bold text-slate-800 bg-transparent border-none p-0 w-full focus:ring-0"
                      value={field.label}
                      onChange={(e) => {
                        const newFields = [...fields];
                        newFields[index].label = e.target.value;
                        setFields(newFields);
                      }}
                    />
                    <div className="h-10 bg-slate-50 border border-slate-100 rounded-lg flex items-center px-4 text-slate-300 text-sm">
                       {field.type === 'select' ? 'User selects an option...' : `User enters ${field.type} content...`}
                    </div>
                 </div>
              </div>
            ))}
          </div>

          <button className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-emerald-200 hover:bg-emerald-600 transition-all">
            Save Form Structure
          </button>
        </div>
      </div>
    </div>
  );
}

function FieldTool({ label, icon, onClick }: { label: string, icon: React.ReactNode, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="w-full p-4 bg-white border border-slate-200 rounded-2xl flex items-center gap-4 hover:border-blue-500 hover:shadow-lg transition-all group"
    >
      <div className="text-slate-400 group-hover:text-blue-600 transition-colors">
        {icon}
      </div>
      <span className="text-sm font-bold text-slate-700">{label}</span>
    </button>
  );
}

function BarcodeScanner({ onScan, onBack, scannedResult }: { onScan: (code: string) => void, onBack: () => void, scannedResult: string }) {
  const { ref } = useZxing({
    onDecodeResult(result) {
      onScan(result.getText());
    },
    onError(err) {
      console.warn("Scanner Error:", err);
    }
  });

  return (
    <>
      <div className="relative z-10 w-full max-w-sm aspect-square bg-black rounded-3xl overflow-hidden mb-6 border-4 border-slate-700">
        <video ref={ref} className="w-full h-full object-cover" />
        <div className="absolute inset-0 border-2 border-blue-500/50 rounded-3xl pointer-events-none"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 border-2 border-blue-500 pointer-events-none z-20"></div>
      </div>
      <h2 className="text-xl font-black text-white font-display uppercase tracking-widest mb-4">Scanning...</h2>
      {scannedResult && (
        <motion.div 
          key={scannedResult}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-6 py-3 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-400 font-bold text-sm mb-6 z-10"
        >
          {scannedResult}
        </motion.div>
      )}
      <button 
        onClick={onBack}
        className="relative z-10 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all"
      >
        Back to manual
      </button>
    </>
  );
}

// --- MODULE: ATTENDANCE ---
function AttendanceModule() {
  const { profile } = useFirebase();
  const { programId } = useParams();
  const [sessionInfo, setSessionInfo] = useState('General Session');
  const [searchQuery, setSearchQuery] = useState('');
  const [isKioskMode, setIsKioskMode] = useState(false);
  const [useCamera, setUseCamera] = useState(false);
  const [kioskCode, setKioskCode] = useState('');
  const [scannedResult, setScannedResult] = useState('');

  const [members, setMembers] = useState<any[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.districtId || !profile?.branchId || !programId) return;

    const membersRef = collection(db, `districts/${profile.districtId}/branches/${profile.branchId}/members`);
    const attendanceRef = collection(db, `districts/${profile.districtId}/branches/${profile.branchId}/events/${programId}/attendance`);

    const unsubMembers = onSnapshot(membersRef, (snap) => {
        setMembers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.LIST, `districts/${profile.districtId}/branches/${profile.branchId}/members`));

    const unsubAttendance = onSnapshot(attendanceRef, (snap) => {
        setAttendanceRecords(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, `districts/${profile.districtId}/branches/${profile.branchId}/events/${programId}/attendance`));

    return () => {
        unsubMembers();
        unsubAttendance();
    };
  }, [profile?.districtId, profile?.branchId, programId]);

  const attendees = members.map(m => {
     const record = attendanceRecords.find(r => r.id === m.id);
     return {
         id: m.id,
         name: m.fullName || 'Unknown',
         email: m.email || '',
         status: record ? 'present' : 'pending',
         time: record ? new Date(record.timestamp?.toDate ? record.timestamp.toDate() : Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null
     };
  });

  const toggleStatus = async (id: string, currentStatus: string) => {
    if (!profile?.districtId || !profile?.branchId || !programId) return;
    const ref = doc(db, `districts/${profile.districtId}/branches/${profile.branchId}/events/${programId}/attendance`, id);
    try {
        if (currentStatus === 'pending') {
            await setDoc(ref, { timestamp: serverTimestamp(), recordedBy: profile.uid });
        } else {
            await deleteDoc(ref);
        }
    } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, ref.path);
    }
  };

  const processScannedCode = (code: string) => {
    const attendee = attendees.find(a => a.id === code || a.email.toLowerCase().includes(code.toLowerCase()) || a.name.toLowerCase().includes(code.toLowerCase()));
    if (attendee) {
       if (attendee.status !== 'present') {
         toggleStatus(attendee.id, 'pending');
         setScannedResult(`Checked in: ${attendee.name}`);
       } else {
         setScannedResult(`${attendee.name} is already checked in.`);
       }
    } else {
       setScannedResult(`Attendee not found: ${code}`);
    }
  };

  const handleKioskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!kioskCode) return;
    processScannedCode(kioskCode);
    setKioskCode('');
  };

  const filteredAttendees = attendees.filter(a => 
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    a.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const presentCount = attendees.filter(a => a.status === 'present').length;
  const metrics = [
    { label: "Overall Attendance", percent: Math.round((presentCount / attendees.length) * 100) || 0, count: presentCount, color: "bg-blue-500" },
    { label: "Main Service", percent: 82, count: 370, color: "bg-emerald-500" }
  ];

  if (isKioskMode) {
    return (
       <div className="absolute inset-0 z-50 bg-slate-900 flex items-center justify-center p-4">
          <button 
            onClick={() => { setIsKioskMode(false); setUseCamera(false); setScannedResult(''); }}
            className="absolute top-8 right-8 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all font-bold text-xl"
          >
            <X size={24} />
          </button>
          <div className="bg-slate-800 p-8 sm:p-12 rounded-[2rem] max-w-lg w-full text-center relative overflow-hidden flex flex-col items-center">
             <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
             
             {!useCamera ? (
               <>
                 <Scan size={80} className="mx-auto text-blue-500 mb-8 opacity-80" />
                 <h2 className="text-2xl sm:text-3xl font-black text-white font-display uppercase tracking-widest mb-2">Check-in Scanner</h2>
                 <p className="text-slate-400 mb-8 font-medium text-xs sm:text-sm">Scan QR code or barcode to record attendance instantly.</p>
                 
                 <form onSubmit={handleKioskSubmit} className="relative z-10 w-full mb-6">
                    <input 
                      type="text" 
                      autoFocus 
                      value={kioskCode} 
                      onChange={e => setKioskCode(e.target.value)} 
                      placeholder="Waiting for scanner input..." 
                      className="w-full bg-slate-900/50 border-2 border-slate-700 rounded-2xl px-4 sm:px-6 py-4 sm:py-5 text-lg sm:text-xl font-black text-white text-center focus:outline-none focus:border-blue-500 focus:bg-slate-900 transition-all placeholder:text-slate-600 tracking-widest"
                    />
                    <button type="submit" className="hidden">Submit</button>
                 </form>
                 <p className="text-[9px] sm:text-[10px] uppercase font-black tracking-widest text-slate-500 mb-6">Keyboard wedge simulated</p>

                 <div className="relative z-10 w-full flex flex-col gap-4">
                   <div className="flex items-center gap-4 w-full">
                     <div className="h-px bg-slate-700 flex-1"></div>
                     <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">OR</span>
                     <div className="h-px bg-slate-700 flex-1"></div>
                   </div>
                   <button 
                     onClick={() => { setUseCamera(true); setScannedResult(''); }}
                     className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg flex justify-center items-center gap-2"
                   >
                     Use Device Camera
                   </button>
                 </div>
               </>
             ) : (
               <BarcodeScanner 
                 onScan={(code) => processScannedCode(code)} 
                 onBack={() => { setUseCamera(false); setScannedResult(''); }} 
                 scannedResult={scannedResult} 
               />
             )}
             
          </div>
       </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 min-h-[600px] h-full">
      {/* Left Sidebar: Scan & Status */}
      <div className="w-full lg:w-[350px] shrink-0 flex flex-col gap-6">
        
        <div className="bg-slate-900 rounded-[2rem] p-6 sm:p-8 text-white relative overflow-hidden shadow-xl shadow-slate-200/50">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <div className="relative z-10 flex flex-col h-full">
            <h4 className="text-[10px] font-black uppercase tracking-widest mb-4 opacity-80">Check-in Terminal</h4>
            
            <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
              <div className="w-20 sm:w-24 h-20 sm:h-24 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 flex items-center justify-center mb-4 sm:mb-6 shadow-inner">
                <Scan size={40} className="text-blue-400" />
              </div>
              <h3 className="text-base sm:text-lg font-black font-display mb-2">Ready to Scan</h3>
              <p className="text-[10px] sm:text-[11px] font-bold text-white/50 px-2 sm:px-4">Connect a barcode scanner or launch kiosk mode to use camera/device scanner.</p>
            </div>
            
            <button 
              onClick={() => setIsKioskMode(true)}
              className="mt-4 w-full py-3 sm:py-4 bg-white text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 active:scale-[0.98] transition-all shadow-lg flex justify-center items-center gap-2"
            >
              Launch Kiosk Mode
            </button>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] p-6 lg:p-8 border border-slate-200 shadow-sm flex flex-col">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 block">Real-time Metrics</h4>
          
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Present</p>
              <h3 className="text-3xl sm:text-4xl font-black font-display text-slate-900 leading-none">{presentCount}<span className="text-base sm:text-lg text-slate-400 ml-1">/ {attendees.length}</span></h3>
            </div>
            <div className="text-right">
              <div className="inline-flex items-center justify-center w-10 sm:w-12 h-10 sm:h-12 rounded-full bg-blue-50 text-blue-600 font-black text-sm">
                {Math.round((presentCount / attendees.length) * 100) || 0}%
              </div>
            </div>
          </div>
          
          <div className="space-y-4 sm:space-y-5">
             {metrics.map((m, i) => <AttendanceBar key={i} {...m} />)}
          </div>
        </div>
      </div>

      {/* Main List Area: Search & Attendance Roster */}
      <div className="flex-1 bg-white border border-slate-200 rounded-[2rem] shadow-sm flex flex-col overflow-hidden relative">
        {/* Header / Tools */}
        <div className="px-5 sm:px-8 py-4 sm:py-5 border-b border-slate-100 bg-slate-50/50 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 shrink-0 relative z-20">
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 font-display">Target Audience</h3>
            <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Manual Entry & Roster</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch gap-3 w-full xl:w-auto">
             <select 
               value={sessionInfo} 
               onChange={e => setSessionInfo(e.target.value)} 
               className="bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none shadow-sm cursor-pointer"
             >
               <option>General Session</option>
               <option>Breakout: Leaders</option>
               <option>Evening Service</option>
             </select>
             
             <div className="relative w-full sm:flex-1 xl:w-64">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search name or ID..." 
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                />
             </div>
          </div>
        </div>
        
        {/* Table / List */}
        <div className="flex-1 overflow-auto relative z-10">
           <table className="w-full text-left border-collapse">
             <thead className="sticky top-0 bg-slate-50/95 backdrop-blur-sm z-30 border-b border-slate-200 hidden sm:table-header-group">
               <tr>
                 <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-16">No.</th>
                 <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Participant</th>
                 <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Check-In</th>
                 <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Status</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-100 flex flex-col sm:table-row-group">
               {filteredAttendees.length === 0 ? (
                 <tr className="block sm:table-row">
                   <td colSpan={4} className="px-8 py-16 text-center text-slate-500 font-bold block sm:table-cell">
                     No participants found matching "{searchQuery}"
                   </td>
                 </tr>
               ) : (
                 filteredAttendees.map((attendee, index) => (
                   <tr key={attendee.id} className="group hover:bg-slate-50/50 transition-colors flex flex-col sm:table-row p-4 sm:p-0 relative">
                     <td className="px-4 tracking-widest sm:px-8 sm:py-4 hidden sm:table-cell">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{index + 1}</span>
                     </td>
                     <td className="sm:px-8 sm:py-4 flex flex-row items-center justify-between sm:table-cell w-full mb-3 sm:mb-0">
                       <div className="flex items-center gap-3 w-full">
                         <div className={`w-10 h-10 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-black text-[12px] sm:text-[10px] shrink-0 transition-colors shadow-sm ${attendee.status === 'present' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                           {attendee.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                         </div>
                         <div className="flex-1 min-w-0">
                           <p className="text-sm font-bold text-slate-900 truncate">{attendee.name}</p>
                           <p className="text-[11px] sm:text-[10px] md:text-xs text-slate-500 font-medium truncate">{attendee.email}</p>
                         </div>
                       </div>
                     </td>
                     <td className="sm:px-8 sm:py-4 flex items-center gap-2 mb-3 sm:mb-0 sm:table-cell">
                       <span className="sm:hidden text-[10px] font-black text-slate-400 uppercase tracking-widest">Time:</span>
                       {attendee.time ? (
                         <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100/80 text-slate-600 text-[10px] font-black tracking-widest uppercase border border-slate-200/50">
                           <Clock size={12} /> {attendee.time}
                         </span>
                       ) : (
                         <span className="text-[10px] font-bold text-slate-400 italic">--</span>
                       )}
                     </td>
                     <td className="sm:px-8 sm:py-4 sm:text-right flex justify-end sm:table-cell w-full">
                       <button 
                         onClick={() => toggleStatus(attendee.id, attendee.status)}
                         className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-3 sm:px-4 sm:py-2 rounded-xl text-[10px] sm:text-[10px] font-black uppercase tracking-widest transition-all ${
                           attendee.status === 'present' 
                             ? 'bg-emerald-50 text-emerald-700 hover:bg-rose-50 hover:text-rose-600 border border-emerald-100 hover:border-rose-100' 
                             : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-900 hover:text-white hover:border-slate-900 shadow-sm'
                         }`}
                       >
                         {attendee.status === 'present' ? (
                           <>
                             <CheckCircle2 size={16} className="sm:w-[14px] sm:h-[14px] group-hover:hidden" />
                             <X size={16} className="sm:w-[14px] sm:h-[14px] hidden group-hover:block" />
                             <span className="group-hover:hidden">Present</span>
                             <span className="hidden group-hover:inline">Undo Check-in</span>
                           </>
                         ) : 'Mark Present'}
                       </button>
                     </td>
                   </tr>
                 ))
               )}
             </tbody>
           </table>
        </div>
      </div>
    </div>
  );
}

function AttendanceBar({ label, percent, count, color }: any) {
  return (
    <div className="space-y-2 sm:space-y-1.5">
       <div className="flex justify-between items-end text-[10px] font-black uppercase tracking-widest">
         <span className="text-slate-500">{label}</span>
         <span className="text-slate-900">{count}</span>
       </div>
       <div className="h-2.5 sm:h-2 bg-slate-100 rounded-full overflow-hidden">
         <motion.div 
           initial={{ width: 0 }}
           animate={{ width: `${percent}%` }}
           transition={{ duration: 1, ease: "easeOut" }}
           className={`h-full ${color}`}
         ></motion.div>
       </div>
    </div>
  );
}

// --- MODULE: QUEUE ---
function QueueModule() {
  const { profile } = useFirebase();
  const { programId } = useParams();
  const [queueEntries, setQueueEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.districtId || !profile?.branchId || !programId) return;

    const queueRef = collection(db, `districts/${profile.districtId}/branches/${profile.branchId}/events/${programId}/queueEntries`);
    const unsub = onSnapshot(queueRef, (snap) => {
        setQueueEntries(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.LIST, `districts/${profile.districtId}/branches/${profile.branchId}/events/${programId}/queueEntries`));

    return () => unsub();
  }, [profile?.districtId, profile?.branchId, programId]);

  const waiting = queueEntries.filter(q => q.status === 'waiting').sort((a, b) => (a.timestamp?.toMillis?.() || 0) - (b.timestamp?.toMillis?.() || 0));
  const serving = queueEntries.filter(q => q.status === 'serving').sort((a, b) => (b.servedAt?.toMillis?.() || 0) - (a.servedAt?.toMillis?.() || 0));
  const completed = queueEntries.filter(q => q.status === 'completed');

  const currentlyServing = serving[0];

  const addToQueue = async () => {
     if (!profile?.districtId || !profile?.branchId || !programId) return;
     const number = 'A-' + (queueEntries.length + 100);
     const ref = doc(collection(db, `districts/${profile.districtId}/branches/${profile.branchId}/events/${programId}/queueEntries`));
     try {
         await setDoc(ref, {
             ticketNumber: number,
             status: 'waiting',
             timestamp: serverTimestamp()
         });
     } catch (err) {
         handleFirestoreError(err, OperationType.WRITE, ref.path);
     }
  };

  const advanceQueue = async () => {
     if (!profile?.districtId || !profile?.branchId || !programId) return;
     if (waiting.length === 0) return;
     
     const next = waiting[0];
     const ref = doc(db, `districts/${profile.districtId}/branches/${profile.branchId}/events/${programId}/queueEntries`, next.id);
     
     if (currentlyServing) {
         const currRef = doc(db, `districts/${profile.districtId}/branches/${profile.branchId}/events/${programId}/queueEntries`, currentlyServing.id);
         try { await setDoc(currRef, { status: 'completed' }, { merge: true }); } catch (err) {}
     }

     try {
         await setDoc(ref, {
             status: 'serving',
             servedAt: serverTimestamp(),
             counter: `Counter ${Math.floor(Math.random() * 5) + 1}`
         }, { merge: true });
     } catch (err) {
         handleFirestoreError(err, OperationType.WRITE, ref.path);
     }
  };

  if (loading) return <div className="p-8 text-center text-slate-400">Loading queue data...</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 text-white p-8 rounded-3xl flex flex-col items-center justify-center text-center">
           <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Currently Serving</p>
           {currentlyServing ? (
             <>
               <h3 className="text-6xl font-black font-display text-blue-400">{currentlyServing.ticketNumber}</h3>
               <p className="text-xs mt-4 font-bold opacity-80">Proceed to {currentlyServing.counter || 'Counter'}</p>
             </>
           ) : (
             <h3 className="text-2xl font-black font-display text-slate-400 mt-2">Queue Empty</h3>
           )}
        </div>
        <div className="bg-white border border-slate-200 p-8 rounded-3xl md:col-span-2">
           <div className="flex justify-between items-center mb-6">
             <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Queue Overview</h4>
             <button onClick={addToQueue} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-700 transition-colors">
               + Add Walk-in
             </button>
           </div>
           <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Waiting</p>
                 <p className="text-2xl font-black text-slate-900">{waiting.length}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Avg Wait</p>
                 <p className="text-2xl font-black text-slate-900">{waiting.length * 2}m</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Served</p>
                 <p className="text-2xl font-black text-slate-900">{completed.length}</p>
              </div>
           </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="px-8 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
           <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Next in Line</h4>
           <button onClick={advanceQueue} disabled={waiting.length === 0} className="text-white bg-blue-600 px-4 py-2 rounded-lg text-xs font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors">Advance Queue</button>
        </div>
        <div className="divide-y divide-slate-100">
          {waiting.map((entry, idx) => (
            <div key={entry.id} className="px-8 py-4 flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <span className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-black text-slate-900 text-sm">{entry.ticketNumber}</span>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Walk-in Attendee</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Priority: Standard</p>
                  </div>
               </div>
               <span className="text-xs text-slate-400 font-bold italic">Wait: {idx * 2}m</span>
            </div>
          ))}
          {waiting.length === 0 && (
            <div className="p-8 text-center text-slate-400 text-sm">No one is waiting in the queue.</div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- MODULE: ACCOMMODATION ---
function AccommodationModule() {
  return (
    <div className="space-y-8">
       <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 border border-slate-200 rounded-2xl shadow-sm">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Capacity</p>
             <p className="text-2xl font-black text-slate-900">200 Beds</p>
          </div>
          <div className="bg-white p-6 border border-slate-200 rounded-2xl shadow-sm">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Reserved</p>
             <p className="text-2xl font-black text-blue-600">185</p>
          </div>
          <div className="bg-white p-6 border border-slate-200 rounded-2xl shadow-sm">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Available</p>
             <p className="text-2xl font-black text-emerald-500">15</p>
          </div>
          <div className="bg-white p-6 border border-slate-200 rounded-2xl shadow-sm">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Checked In</p>
             <p className="text-2xl font-black text-slate-900">42</p>
          </div>
       </div>

       <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
          <div className="p-8 border-b border-slate-100 flex justify-between items-center">
             <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Room Allocation</h4>
             <div className="flex gap-2">
                <button className="px-4 py-2 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50">Filter</button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-200">Auto Allocate</button>
             </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 divide-x divide-y divide-slate-100">
             {[...Array(6)].map((_, i) => (
                <div key={i} className="p-8 hover:bg-slate-50 transition-colors group">
                   <div className="flex justify-between items-start mb-6">
                      <h5 className="text-xl font-black font-display text-slate-800">Room {101 + i}</h5>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${i % 2 === 0 ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                         {i % 2 === 0 ? 'MALE' : 'FEMALE'}
                      </span>
                   </div>
                   <div className="space-y-2">
                     <p className="text-xs font-bold text-slate-500">Beds: 4 / 4 Filled</p>
                     <div className="flex -space-x-2">
                        {[...Array(4)].map((_, j) => (
                          <div key={j} className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-600">
                            {['JD', 'PC', 'MT', 'AL'][j]}
                          </div>
                        ))}
                     </div>
                   </div>
                   <button className="w-full mt-6 py-2 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Manage Allocation</button>
                </div>
             ))}
          </div>
       </div>
    </div>
  );
}

// --- MODULE: HEALTHCARE ---
function HealthCareModule() {
  return (
    <div className="space-y-8">
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
             <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
                <div className="flex justify-between items-center mb-8">
                   <h4 className="text-lg font-black text-slate-900 font-display">Medical Incident Log</h4>
                   <button className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-rose-200 flex items-center gap-2">
                      <AlertCircle size={16} /> Log Incident
                   </button>
                </div>
                <div className="space-y-4">
                   <IncidentRow 
                     title="Minor Burn (Kitchen)" 
                     severity="Low" 
                     patient="Staff Member" 
                     time="10:30 AM" 
                     status="Treated"
                   />
                   <IncidentRow 
                     title="Heat Exhaustion" 
                     severity="Medium" 
                     patient="Guest-142" 
                     time="11:45 AM" 
                     status="Under Observation"
                   />
                   <IncidentRow 
                     title="Allergic Reaction" 
                     severity="High" 
                     patient="Youth-22" 
                     time="12:15 PM" 
                     status="Escalated"
                   />
                </div>
             </div>
          </div>

          <div className="space-y-6">
             <div className="bg-slate-900 text-white rounded-3xl p-8 shadow-xl">
                <h4 className="text-sm font-black uppercase tracking-widest mb-6 opacity-60">Ready Response</h4>
                <div className="space-y-6">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-rose-500">
                         <Stethoscope size={24} />
                      </div>
                      <div>
                         <p className="text-sm font-bold">2 Medics On Duty</p>
                         <p className="text-[10px] opacity-60 font-medium">Station 1 & Station 2</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-blue-400">
                         <Shield size={24} />
                      </div>
                      <div>
                         <p className="text-sm font-bold">Ambulance Standby</p>
                         <p className="text-[10px] opacity-60 font-medium">South Gate Entrance</p>
                      </div>
                   </div>
                </div>
                <button className="w-full mt-8 py-4 bg-rose-600 text-white rounded-2xl font-black uppercase tracking-widest">
                   Broadcast Medical Alert
                </button>
             </div>
             
             <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">First Aid Inventory</h4>
                <div className="space-y-3">
                   <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-600">Bandages (Large)</span>
                      <span className="text-xs font-bold text-slate-900">42 Units</span>
                   </div>
                   <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-600">EpiPens</span>
                      <span className="text-xs font-bold text-slate-900">5 Units</span>
                   </div>
                   <div className="flex justify-between items-center text-rose-500">
                      <span className="text-xs font-bold">Pain Relief (Tabs)</span>
                      <span className="text-xs font-bold italic">Low Stock (8)</span>
                   </div>
                </div>
             </div>
          </div>
       </div>
    </div>
  );
}

function IncidentRow({ title, severity, patient, time, status }: any) {
  const getSeverityColor = () => {
    switch (severity) {
      case 'High': return 'text-rose-500';
      case 'Medium': return 'text-amber-500';
      case 'Low': return 'text-blue-500';
      default: return 'text-slate-500';
    }
  };

  return (
    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group hover:border-blue-200 transition-colors">
       <div className="flex items-center gap-4">
          <div className={`w-2 h-2 rounded-full bg-current ${getSeverityColor()}`}></div>
          <div>
             <p className="text-sm font-bold text-slate-900">{title}</p>
             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{patient} • {time}</p>
          </div>
       </div>
       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{status}</span>
    </div>
  );
}
