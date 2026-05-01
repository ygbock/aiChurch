import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Banknote, 
  Network, 
  Building2, 
  TrendingUp, 
  Calendar,
  ChevronRight,
  LayoutGrid,
  Plus,
  Briefcase,
  CheckSquare,
  AlertCircle,
  ArrowRight,
  Bell,
  Sparkles,
  Zap,
  Globe,
  Clock,
  CheckCircle2,
  X,
  Loader2
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Modal from '../components/Modal';
import CollapsibleSection from '../components/CollapsibleSection';
import { useFirebase } from '../components/FirebaseProvider';
import { doc, getDoc, collection, query, limit, onSnapshot, orderBy, where, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { toast } from 'sonner';

export default function Dashboard() {
  const navigate = useNavigate();
  const { profile, memberProfile } = useFirebase();
  const [branchName, setBranchName] = useState('Loading...');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [recentMembers, setRecentMembers] = useState<any[]>([]);
  const [myTasks, setMyTasks] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);

  // New Task Form State
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    dept: 'General',
    priority: 'Medium' as 'High' | 'Medium' | 'Low',
    dueDate: new Date().toISOString().split('T')[0],
    assigneeId: '',
    assigneeName: ''
  });
  const [isSavingTask, setIsSavingTask] = useState(false);

  useEffect(() => {
    async function fetchBranch() {
      if (!profile?.districtId || !profile?.branchId) {
        setBranchName('Branch Overview');
        return;
      }
      try {
        const branchSnap = await getDoc(doc(db, 'districts', profile.districtId, 'branches', profile.branchId));
        if (branchSnap.exists()) {
          setBranchName(branchSnap.data().name);
        } else {
          setBranchName('Branch Overview');
        }
      } catch (e) {
        setBranchName('Branch Overview');
      }
    }
    fetchBranch();
  }, [profile]);

  useEffect(() => {
    if (!profile?.districtId || !profile?.branchId) return;
    
    // Fetch Recent Members
    const membersPath = `districts/${profile.districtId}/branches/${profile.branchId}/members`;
    const membersQ = query(collection(db, membersPath), orderBy('createdAt', 'desc'), limit(5));
    const unsubscribeMembers = onSnapshot(membersQ, (snapshot) => {
      setRecentMembers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Fetch My Tasks
    const tasksPath = `districts/${profile.districtId}/branches/${profile.branchId}/tasks`;
    const tasksQ = query(
      collection(db, tasksPath), 
      where('assigneeId', '==', profile.uid),
      orderBy('createdAt', 'desc'),
      limit(5)
    );
    const unsubscribeTasks = onSnapshot(tasksQ, (snapshot) => {
      setMyTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoadingTasks(false);
    }, (error) => {
       console.error("Error fetching tasks:", error);
       setLoadingTasks(false);
    });

    // Fetch Users for task assignment
    const fetchUsers = async () => {
      try {
        const usersSnap = await getDocs(query(collection(db, 'users'), where('branchId', '==', profile.branchId)));
        setUsers(usersSnap.docs.map(doc => ({ uid: doc.id, ...doc.data() })));
      } catch (e) {}
    };
    fetchUsers();

    return () => {
      unsubscribeMembers();
      unsubscribeTasks();
    };
  }, [profile]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.title || !taskForm.assigneeId) {
      toast.error('Please fill required fields');
      return;
    }

    setIsSavingTask(true);
    try {
      const selectedUser = users.find(u => u.uid === taskForm.assigneeId);
      const path = `districts/${profile?.districtId}/branches/${profile?.branchId}/tasks`;
      
      await addDoc(collection(db, path), {
        ...taskForm,
        assigneeName: selectedUser?.fullName || 'Assigned User',
        status: 'pending',
        createdBy: profile?.uid,
        branchId: profile?.branchId,
        createdAt: serverTimestamp()
      });

      toast.success('Task assigned successfully');
      setIsTaskModalOpen(false);
      setTaskForm({
        title: '',
        description: '',
        dept: 'General',
        priority: 'Medium',
        dueDate: new Date().toISOString().split('T')[0],
        assigneeId: profile?.uid || '',
        assigneeName: profile?.fullName || ''
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'tasks');
    } finally {
      setIsSavingTask(false);
    }
  };

  const openTaskModal = () => {
    setTaskForm(prev => ({ 
      ...prev, 
      assigneeId: profile?.uid || '', 
      assigneeName: profile?.fullName || '' 
    }));
    setIsTaskModalOpen(true);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-10 pb-12"
    >
      {/* Top Banner / Welcome */}
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-[2rem] sm:rounded-[2.5rem] blur-xl sm:blur-2xl opacity-10 group-hover:opacity-20 transition-opacity" />
        <div className="relative bg-white p-6 sm:p-8 md:p-12 rounded-[2rem] sm:rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8 overflow-hidden">
          <div className="absolute top-0 right-0 w-48 sm:w-64 h-48 sm:h-64 bg-slate-50 rounded-full -mr-24 sm:-mr-32 -mt-24 sm:-mt-32 opacity-50" />
          
          <div className="relative z-10 flex-1 space-y-3 sm:space-y-4 w-full">
             <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full w-fit">
               <Sparkles size={14} />
               <span className="text-[10px] font-black uppercase tracking-widest">Active Session</span>
             </div>
             <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 leading-tight tracking-tight">
               Welcome back, <br />
               <span className="text-blue-600">{profile?.fullName?.split(' ')[0] || 'Administrator'}</span>
             </h1>
             <p className="text-slate-500 max-w-md font-medium text-sm sm:text-lg">
               Your branch control center is primed and ready. You have <span className="text-slate-900 font-bold">{myTasks.filter(t => t.status !== 'completed').length} pending tasks</span> requiring your attention.
             </p>
          </div>

          <div className="relative z-10 grid grid-cols-2 gap-3 sm:gap-4 w-full md:w-auto">
            <button 
              onClick={() => navigate('/members')}
              className="p-4 sm:p-6 bg-slate-50 hover:bg-slate-100 rounded-[1.5rem] sm:rounded-3xl transition-all group flex flex-col items-center gap-2 sm:gap-3 border border-transparent hover:border-slate-200"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-[1rem] sm:rounded-2xl flex items-center justify-center shadow-sm text-blue-600 group-hover:scale-110 transition-transform">
                <Users size={20} className="sm:w-6 sm:h-6 w-5 h-5" />
              </div>
              <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Directory</span>
            </button>
            <button 
              onClick={openTaskModal}
              className="p-4 sm:p-6 bg-slate-50 hover:bg-slate-100 rounded-[1.5rem] sm:rounded-3xl transition-all group flex flex-col items-center gap-2 sm:gap-3 border border-transparent hover:border-slate-200"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-[1rem] sm:rounded-2xl flex items-center justify-center shadow-sm text-indigo-600 group-hover:scale-110 transition-transform">
                <CheckSquare size={20} className="sm:w-6 sm:h-6 w-5 h-5" />
              </div>
              <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Assign Task</span>
            </button>
          </div>
        </div>
      </div>

      {loadingTasks ? (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin text-blue-600" size={32} />
        </div>
      ) : (
        <CollapsibleSection title="My Assigned Tasks" icon={<CheckSquare size={22} />} defaultOpen={myTasks.length > 0}>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-1">
             {myTasks.length === 0 ? (
               <div className="col-span-full py-12 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
                 <CheckCircle2 size={40} className="text-slate-300 mb-4" />
                 <p className="text-slate-400 font-bold text-sm">No tasks assigned to you yet.</p>
                 <button onClick={openTaskModal} className="mt-4 text-blue-600 font-black text-[10px] uppercase tracking-widest">Create Your First Task</button>
               </div>
             ) : (
               myTasks.map(task => (
                 <div key={task.id} onClick={() => navigate('/tasks')} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all cursor-pointer group">
                    <div className="flex justify-between items-start mb-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                        task.priority === 'High' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                        task.priority === 'Medium' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                        'bg-blue-50 text-blue-600 border border-blue-100'
                      }`}>
                        {task.priority} Priority
                      </span>
                      <div className={`w-2 h-2 rounded-full ${task.status === 'completed' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                    </div>
                    <h4 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors uppercase italic tracking-tight mb-2">
                      {task.title}
                    </h4>
                    <div className="flex items-center gap-4 mt-6 pt-4 border-t border-slate-50">
                      <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <Clock size={14} className="text-blue-600" />
                        Due: {task.dueDate}
                      </div>
                    </div>
                 </div>
               ))
             )}
           </div>
        </CollapsibleSection>
      )}

      {/* Main Stats Hub - Collapsible */}
      <CollapsibleSection title="Core Metrics" icon={<LayoutGrid size={22} />} className="!bg-transparent !border-none !shadow-none !rounded-none">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 px-1">
          <ModernStatCard label="Live Attendance" value="1,248" trend="+12%" icon={<Users />} color="blue" />
          <ModernStatCard label="Tithe Revenue" value="$42.5k" trend="+8%" icon={<Zap />} color="emerald" />
          <ModernStatCard label="Task Velocity" value="84%" trend="+5%" icon={<CheckSquare />} color="amber" />
          <ModernStatCard label="New Converts" value="42" trend="+18%" icon={<Plus />} color="rose" />
        </div>
      </CollapsibleSection>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Recent Activity List */}
        <div className="lg:col-span-2 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
          <div className="px-6 py-5 md:px-8 md:py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
            <div>
              <h3 className="text-lg md:text-xl font-bold text-slate-900">Recent Registrations</h3>
              <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Live Feed • Branch Hub</p>
            </div>
            <button 
              onClick={() => navigate('/members')}
              className="text-[10px] md:text-xs font-black text-blue-600 uppercase tracking-widest hover:text-blue-700 transition-colors"
            >
              View All
            </button>
          </div>

          <div className="flex-1 overflow-x-auto">
            {recentMembers.length === 0 ? (
               <div className="h-full flex flex-col items-center justify-center p-8 md:p-12 text-center space-y-4">
                  <div className="w-14 h-14 md:w-16 md:h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                    <Users size={28} className="md:w-8 md:h-8" />
                  </div>
                  <p className="text-xs md:text-sm font-bold text-slate-400">No recent activity detected.</p>
               </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-50">
                    <th className="px-4 py-3 md:px-8 md:py-4 text-left text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Entry</th>
                    <th className="hidden sm:table-cell px-6 py-3 md:px-8 md:py-4 text-left text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Channel</th>
                    <th className="px-4 py-3 md:px-8 md:py-4 text-left text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="px-2 py-3 md:px-8 md:py-4 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {recentMembers.map(member => (
                    <tr onClick={() => navigate(`/members/profile/${member.id}`)} key={member.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer">
                      <td className="px-4 py-4 md:px-8 md:py-5">
                        <div className="flex items-center gap-3 md:gap-4 flex-wrap sm:flex-nowrap">
                          {member.photoUrl ? (
                            <img src={member.photoUrl} alt={member.fullName} className="w-8 h-8 md:w-10 md:h-10 rounded-xl object-cover shrink-0" />
                          ) : (
                            <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-black text-[10px] md:text-xs shrink-0">
                              {member.fullName?.charAt(0)}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-xs md:text-sm font-bold text-slate-900 truncate max-w-[120px] sm:max-w-none">{member.fullName}</p>
                            <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase truncate">Reg: {branchName}</p>
                          </div>
                        </div>
                      </td>
                      <td className="hidden sm:table-cell px-6 py-4 md:px-8 md:py-5">
                         <span className="text-[10px] md:text-xs font-bold text-slate-600">Manual Entry</span>
                      </td>
                      <td className="px-4 py-4 md:px-8 md:py-5">
                        <span className={`px-2 py-1 md:px-3 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest border text-center block w-fit ${
                          member.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                        }`}>
                          {member.status || 'Pending'}
                        </span>
                      </td>
                      <td className="px-2 py-4 md:px-8 md:py-5 text-right">
                        <button className="p-1 md:p-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-blue-600 inline-flex items-center">
                          <span className="hidden md:inline font-bold text-[10px] uppercase tracking-widest mr-1">View</span>
                          <ChevronRight size={16} className="md:w-5 md:h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Action Sidebar */}
        <div className="space-y-4 md:space-y-6">
          <div className="bg-white p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden">
             <div className="relative z-10">
               <h3 className="text-lg md:text-xl font-bold text-slate-900">Weekly Target</h3>
               <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Growth Forecast</p>
               
               <div className="my-6 md:my-8 flex items-center justify-center">
                  <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-[8px] md:border-[12px] border-slate-50 border-t-blue-600 flex items-center justify-center">
                    <span className="text-xl md:text-2xl font-black text-slate-900 tracking-tighter">68%</span>
                  </div>
               </div>

               <div className="space-y-3 md:space-y-4">
                  <div className="flex justify-between items-center text-[10px] md:text-xs">
                    <span className="font-bold text-slate-500 uppercase">Member Target</span>
                    <span className="font-black text-slate-900 tracking-tighter">1,500 / 2,000</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-50 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 w-[75%]" />
                  </div>
               </div>
             </div>
          </div>

          <div className="bg-indigo-600 p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] text-white shadow-xl shadow-indigo-200 relative overflow-hidden group hover:-translate-y-1 transition-transform">
             <div className="absolute top-0 right-0 w-24 h-24 md:w-32 md:h-32 bg-white/10 rounded-full -mr-12 -mt-12 md:-mr-16 md:-mt-16 group-hover:scale-150 transition-transform duration-700" />
             <div className="relative z-10 flex flex-col h-full">
                <Bell size={20} className="mb-4 md:mb-6 opacity-60 md:w-6 md:h-6" />
                <h4 className="text-lg md:text-xl font-bold mb-2">Global Comms</h4>
                <p className="text-indigo-100 text-xs md:text-sm font-medium mb-4 md:mb-6">Send branch-wide SMS and Email alerts instantly.</p>
                <button 
                  onClick={() => navigate('/communication')}
                  className="mt-auto w-fit px-5 py-2 md:px-6 md:py-2.5 bg-white text-indigo-600 rounded-xl font-bold text-[10px] md:text-xs hover:bg-slate-50 transition-colors shadow-lg"
                >
                  Broadcast Now
                </button>
             </div>
          </div>
        </div>
      </div>

       <Modal 
        isOpen={isTaskModalOpen} 
        onClose={() => setIsTaskModalOpen(false)} 
        title="Initialize New Protocol"
      >
        <form onSubmit={handleCreateTask} className="space-y-6 p-2">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Task Definition</label>
            <input 
              type="text" 
              placeholder="e.g. Audit Sanctuary Audio Systems" 
              value={taskForm.title} onChange={e => setTaskForm({...taskForm, title: e.target.value})}
              className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold shadow-inner outline-none focus:ring-2 focus:ring-blue-100 transition-all" 
              required 
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Recipient</label>
              <select 
                value={taskForm.assigneeId} 
                onChange={e => setTaskForm({...taskForm, assigneeId: e.target.value})}
                className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-blue-100 transition-all appearance-none"
                required
              >
                <option value="">Select Assignee</option>
                {users.map(u => <option key={u.uid} value={u.uid}>{u.fullName}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Priority Matrix</label>
              <select 
                value={taskForm.priority} 
                onChange={e => setTaskForm({...taskForm, priority: e.target.value as any})}
                className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-blue-100 transition-all appearance-none"
              >
                <option value="High">High Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="Low">Low Priority</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Target Date</label>
               <input 
                  type="date"
                  value={taskForm.dueDate}
                  onChange={e => setTaskForm({...taskForm, dueDate: e.target.value})}
                  className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold shadow-inner outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                  required
               />
            </div>
            <div>
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Department</label>
               <input 
                  type="text"
                  placeholder="e.g. Technical"
                  value={taskForm.dept}
                  onChange={e => setTaskForm({...taskForm, dept: e.target.value})}
                  className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold shadow-inner outline-none focus:ring-2 focus:ring-blue-100 transition-all"
               />
            </div>
          </div>
          <button 
            disabled={isSavingTask}
            type="submit" 
            className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold text-sm shadow-2xl shadow-slate-200 hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSavingTask ? 'Assigning...' : 'Confirm Activation'}
            <ArrowRight size={18} />
          </button>
        </form>
      </Modal>
    </motion.div>
  );
}

function ModernStatCard({ label, value, trend, icon, color }: any) {
  const configs: any = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', shadow: 'shadow-blue-100' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', shadow: 'shadow-emerald-100' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', shadow: 'shadow-amber-100' },
    rose: { bg: 'bg-rose-50', text: 'text-rose-600', shadow: 'shadow-rose-100' }
  };

  const config = configs[color];

  return (
    <div className="bg-white p-4 sm:p-6 md:p-8 rounded-[1.25rem] sm:rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group hover:border-slate-300 transition-all flex flex-col justify-between">
      <div className={`p-2 w-8 h-8 sm:w-10 sm:h-10 md:p-2.5 md:w-12 md:h-12 rounded-lg sm:rounded-xl md:rounded-2xl flex items-center justify-center mb-3 sm:mb-4 md:mb-6 transition-all group-hover:scale-110 shadow-sm shrink-0 ${config.bg} ${config.text}`}>
        {React.cloneElement(icon as any, { className: "w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" })}
      </div>
      <div className="min-w-0">
        <p className="text-[8px] sm:text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5 sm:mb-1 truncate">{label}</p>
        <div className="flex flex-wrap items-baseline gap-x-1.5 sm:gap-x-2 gap-y-0.5 mt-0.5">
          <h4 className="text-lg sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-none">{value}</h4>
          <span className={`text-[8px] sm:text-[9px] md:text-[10px] font-black leading-none ${color === 'rose' ? 'text-rose-600' : 'text-emerald-600'}`}>
            {trend}
          </span>
        </div>
      </div>
    </div>
  );
}
