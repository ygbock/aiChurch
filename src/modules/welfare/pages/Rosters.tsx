import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  Users, 
  ChevronRight, 
  ChevronLeft, 
  Plus, 
  Search, 
  Mail, 
  Bell, 
  MoreVertical,
  CheckCircle2,
  Clock,
  UserPlus,
  Shield,
  Music,
  Tv,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';

interface Volunteer {
  id: string;
  name: string;
  role: string;
  department: string;
  avatar?: string;
}

interface RosterEntry {
  id: string;
  serviceDate: string;
  serviceType: string;
  status: 'Draft' | 'Published';
  assignments: {
    department: string;
    volunteers: Volunteer[];
  }[];
}

const DEPARTMENTS = [
  { name: 'Choir', icon: <Music size={16} /> },
  { name: 'Ushers', icon: <Eye size={16} /> },
  { name: 'Protocols', icon: <Shield size={16} /> },
  { name: 'Technical', icon: <Tv size={16} /> },
];

const INITIAL_ROSTERS: RosterEntry[] = [
  {
    id: '1',
    serviceDate: '2024-05-12',
    serviceType: 'Sunday Service',
    status: 'Published',
    assignments: [
      {
        department: 'Choir',
        volunteers: [
          { id: 'v1', name: 'Sarah Jenkins', role: 'Lead Vocals', department: 'Choir' },
          { id: 'v2', name: 'John Peterson', role: 'Keyboard', department: 'Choir' }
        ]
      },
      {
        department: 'Ushers',
        volunteers: [
          { id: 'v3', name: 'David Oloyede', role: 'Head Usher', department: 'Ushers' },
          { id: 'v4', name: 'Hannah Adams', role: 'Floor Usher', department: 'Ushers' }
        ]
      },
      {
        department: 'Technical',
        volunteers: [
          { id: 'v5', name: 'James Wilson', role: 'Sound Engineer', department: 'Technical' }
        ]
      }
    ]
  },
  {
    id: '2',
    serviceDate: '2024-05-19',
    serviceType: 'Sunday Service',
    status: 'Draft',
    assignments: [
      {
        department: 'Choir',
        volunteers: [
          { id: 'v1', name: 'Sarah Jenkins', role: 'Lead Vocals', department: 'Choir' }
        ]
      }
    ]
  }
];

export default function Rosters() {
  const [rosters, setRosters] = useState<RosterEntry[]>(INITIAL_ROSTERS);
  const [selectedRoster, setSelectedRoster] = useState<RosterEntry | null>(INITIAL_ROSTERS[0]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleSendReminder = (rosterId: string) => {
    toast.success('Reminders sent to all scheduled volunteers via SMS and Email');
  };

  const handlePublish = (rosterId: string) => {
    setRosters(prev => prev.map(r => r.id === rosterId ? { ...r, status: 'Published' as const } : r));
    toast.success('Roster published and volunteers notified');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Ministry Rosters</h2>
          <p className="text-slate-500 text-sm">Coordinate volunteer teams for upcoming services and events.</p>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm"
        >
          <Plus size={18} />
          Create New Roster
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Roster List Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Upcoming Services</h3>
            </div>
            <div className="divide-y divide-slate-50">
              {rosters.map((roster) => (
                <div 
                  key={roster.id}
                  onClick={() => setSelectedRoster(roster)}
                  className={`p-4 cursor-pointer transition-all hover:bg-slate-50 ${selectedRoster?.id === roster.id ? 'bg-indigo-50 border-l-4 border-indigo-600' : ''}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-bold text-slate-900">
                      {new Date(roster.serviceDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <span className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded ${roster.status === 'Published' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                      {roster.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{roster.serviceType}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-indigo-600 rounded-xl p-5 text-white shadow-lg relative overflow-hidden group">
            <div className="relative z-10">
              <h4 className="text-sm font-bold mb-1">Auto-Reminders</h4>
              <p className="text-[10px] text-indigo-100 mb-3">Enable automatic SMS reminders 24h before service.</p>
              <button className="bg-white/20 hover:bg-white/30 text-white border border-white/30 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-colors">
                Configure Settings
              </button>
            </div>
            <Bell className="absolute -right-2 -bottom-2 text-white/10 w-16 h-16 group-hover:scale-110 transition-transform" />
          </div>
        </div>

        {/* Roster Details */}
        <div className="lg:col-span-3">
          {selectedRoster ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[600px] flex flex-col">
              {/* Detail Header */}
              <div className="px-8 py-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="text-indigo-600" size={18} />
                    <h3 className="text-lg font-bold text-slate-900">
                      {new Date(selectedRoster.serviceDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">{selectedRoster.serviceType} • {selectedRoster.assignments.reduce((acc, curr) => acc + curr.volunteers.length, 0)} Volunteers Scheduled</p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <button 
                    onClick={() => {
                      toast.info('Cloning layout from previous service...');
                    }}
                    className="flex-1 sm:flex-none px-4 py-2 border border-slate-200 text-slate-600 rounded-lg font-bold text-xs hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                  >
                    <Users size={14} /> Clone Last
                  </button>
                  <button 
                    onClick={() => handleSendReminder(selectedRoster.id)}
                    className="flex-1 sm:flex-none px-4 py-2 border border-slate-200 text-slate-600 rounded-lg font-bold text-xs hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                  >
                    <Mail size={14} /> Send Reminders
                  </button>
                  {selectedRoster.status === 'Draft' && (
                    <button 
                      onClick={() => handlePublish(selectedRoster.id)}
                      className="flex-1 sm:flex-none px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold text-xs hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-md shadow-indigo-100"
                    >
                      <CheckCircle2 size={14} /> Publish Roster
                    </button>
                  )}
                </div>
              </div>

              {/* Assignments Grid */}
              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 bg-slate-50/30">
                {DEPARTMENTS.map((dept) => {
                  const assignment = selectedRoster.assignments.find(a => a.department === dept.name);
                  return (
                    <div key={dept.name} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                      <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-white rounded-lg border border-slate-200 text-indigo-600">
                            {dept.icon}
                          </div>
                          <span className="text-xs font-black text-slate-900 uppercase tracking-widest">{dept.name}</span>
                        </div>
                        <button className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                          <UserPlus size={12} /> Add
                        </button>
                      </div>
                      <div className="p-4 flex-1 space-y-3">
                        {assignment && assignment.volunteers.length > 0 ? (
                          assignment.volunteers.map((v) => (
                            <div key={v.id} className="flex items-center justify-between group">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 text-[10px] font-bold">
                                  {v.name.charAt(0)}
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-slate-900">{v.name}</p>
                                  <p className="text-[10px] text-slate-500 font-medium">{v.role}</p>
                                </div>
                              </div>
                              <button className="p-1 text-slate-300 opacity-0 group-hover:opacity-100 hover:text-rose-500 transition-all">
                                <MoreVertical size={14} />
                              </button>
                            </div>
                          ))
                        ) : (
                          <div className="h-full flex flex-col items-center justify-center py-8 text-center">
                            <Users className="text-slate-200 mb-2" size={32} />
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">No Volunteers Assigned</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 flex flex-col items-center justify-center p-12 text-center h-full min-h-[600px]">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                <Calendar className="text-slate-300" size={40} />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Select a Service Roster</h3>
              <p className="text-slate-500 max-w-sm mt-2">
                Choose a service from the sidebar to view detailed team assignments or create a new one.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Basic Create Roster Modal Placeholder */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="font-bold text-slate-900">Initialize New Roster</h3>
                <button onClick={() => setIsCreateModalOpen(false)} className="p-1.5 hover:bg-slate-200 rounded-full text-slate-400 transition-colors">
                  <Plus size={20} className="rotate-45" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Service Date</label>
                  <input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-indigo-100 outline-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Service Type</label>
                  <select className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-indigo-100 outline-none appearance-none">
                    <option>Sunday Morning Service</option>
                    <option>Mid-week Bible Study</option>
                    <option>Special Event / Revival</option>
                    <option>Youth Night</option>
                  </select>
                </div>
                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 mt-2">
                  <div className="flex gap-3">
                    <Clock size={16} className="text-indigo-600 shrink-0" />
                    <p className="text-[10px] text-indigo-700 font-medium leading-relaxed">
                      Pro Tip: You can auto-populate the roster based on the previous week's attendance or established rotations.
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                <button 
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 py-3 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    toast.info('Roster templates coming soon!');
                    setIsCreateModalOpen(false);
                  }}
                  className="flex-[2] py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
                >
                  Create Schedule
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
