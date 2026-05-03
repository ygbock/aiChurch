import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Filter, 
  Calendar, 
  AlertCircle,
  MoreVertical,
  Users,
  Search,
  CheckCircle2,
  Clock,
  Layout,
  X,
  Loader2,
  Trash2
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useRole } from '../components/Layout';
import { useFirebase } from '../components/FirebaseProvider';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, deleteDoc, doc, updateDoc, where, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { toast } from 'sonner';

interface TaskData {
  id: string;
  title: string;
  description: string;
  dept: string;
  priority: 'High' | 'Medium' | 'Low';
  dueDate: string;
  assigneeId: string;
  assigneeName: string;
  status: 'pending' | 'in-progress' | 'completed';
  createdBy: string;
  createdAt?: any;
}

interface UserSummary {
  uid: string;
  fullName: string;
  role: string;
}

const columns = {
  pending: { id: 'pending', title: 'Pending', color: 'bg-slate-400' },
  'in-progress': { id: 'in-progress', title: 'In Progress', color: 'bg-blue-600' },
  completed: { id: 'completed', title: 'Completed', color: 'bg-emerald-500' }
};

export default function Tasks() {
  const { role } = useRole();
  const { profile } = useFirebase();
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Task Form State
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    dept: 'General',
    priority: 'Medium' as 'High' | 'Medium' | 'Low',
    dueDate: new Date().toISOString().split('T')[0],
    assigneeId: '',
    assigneeName: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    const districtId = profile?.districtId || 'default-district';
    const branchId = profile?.branchId || 'default-branch';
    const path = `districts/${districtId}/branches/${branchId}/tasks`;
    
    // Fetch Tasks
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));
    const unsubscribeTasks = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as TaskData[];
      setTasks(docs);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'tasks');
      setLoading(false);
    });

    // Fetch Users for assignment
    const fetchUsers = async () => {
      try {
        const usersRef = collection(db, 'users');
        const usersQuery = query(usersRef, where('branchId', '==', branchId));
        const usersSnap = await getDocs(usersQuery);
        const usersList = usersSnap.docs.map(doc => ({
          uid: doc.id,
          fullName: doc.data().fullName,
          role: doc.data().role
        })) as UserSummary[];
        setUsers(usersList);
        
        // Default assignee to current user if empty
        if (taskForm.assigneeId === '' && profile.uid) {
           setTaskForm(prev => ({ ...prev, assigneeId: profile.uid || '', assigneeName: profile.fullName || '' }));
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };
    fetchUsers();

    return () => unsubscribeTasks();
  }, [profile]);

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const task = tasks.find(t => t.id === draggableId);
    if (!task) return;

    const newStatus = destination.droppableId as TaskData['status'];
    const districtId = profile?.districtId || 'default-district';
    const branchId = profile?.branchId || 'default-branch';
    const path = `districts/${districtId}/branches/${branchId}/tasks`;

    try {
      await updateDoc(doc(db, path, draggableId), { status: newStatus });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `tasks/${draggableId}`);
    }
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.title || !taskForm.assigneeId) {
      toast.error('Please fill in required fields');
      return;
    }

    setIsSaving(true);
    try {
      const districtId = profile?.districtId || 'default-district';
      const branchId = profile?.branchId || 'default-branch';
      const path = `districts/${districtId}/branches/${branchId}/tasks`;
      
      const selectedUser = users.find(u => u.uid === taskForm.assigneeId);

      const data = {
        ...taskForm,
        assigneeName: selectedUser?.fullName || 'Unknown User',
        updatedAt: serverTimestamp()
      };

      if (editingTask) {
        await updateDoc(doc(db, path, editingTask.id), data);
        toast.success('Task updated');
      } else {
        const newTaskRef = await addDoc(collection(db, path), {
          ...data,
          status: 'pending',
          createdBy: profile?.uid,
          branchId,
          createdAt: serverTimestamp()
        });
        
        // Send notification to assignee if not sending to self
        if (taskForm.assigneeId !== profile?.uid) {
          await addDoc(collection(db, `users/${taskForm.assigneeId}/reminders`), {
            title: 'New Task Assigned',
            description: `You have been assigned a new task: "${taskForm.title}"`,
            date: taskForm.dueDate,
            time: '09:00',
            status: 'pending',
            userId: taskForm.assigneeId,
            category: 'task',
            targetPath: '/tasks',
            createdAt: serverTimestamp()
          });
        }
        
        toast.success('Task created');
      }

      setShowModal(false);
      setEditingTask(null);
    } catch (error) {
       handleFirestoreError(error, editingTask ? OperationType.UPDATE : OperationType.WRITE, 'tasks');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      const districtId = profile?.districtId || 'default-district';
      const branchId = profile?.branchId || 'default-branch';
      const path = `districts/${districtId}/branches/${branchId}/tasks`;
      await deleteDoc(doc(db, path, id));
      toast.success('Task deleted');
    } catch (error) {
       handleFirestoreError(error, OperationType.DELETE, `tasks/${id}`);
    }
  };

  const handleToggleComplete = async (task: TaskData) => {
    try {
      const districtId = profile?.districtId || 'default-district';
      const branchId = profile?.branchId || 'default-branch';
      const path = `districts/${districtId}/branches/${branchId}/tasks`;
      const newStatus = task.status === 'completed' ? 'in-progress' : 'completed';
      
      await updateDoc(doc(db, path, task.id), { 
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      
      if (newStatus === 'completed') {
        toast.success('Task finalized');
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `tasks/${task.id}`);
    }
  };

  const getUrgency = (dueDate: string) => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const due = new Date(dueDate);
    const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'overdue';
    if (diffDays <= 2) return 'near';
    return 'safe';
  };

  const filteredTasks = tasks.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.assigneeName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
               <Layout size={20} />
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Ministry Kanban</h2>
          </div>
          <p className="text-slate-500 text-sm font-medium">
             Manage and track operational workflows across the ministry departments.
          </p>
        </div>
        <div className="flex gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all w-48"
            />
          </div>
          <button 
            onClick={() => {
              setEditingTask(null);
              setTaskForm({
                title: '',
                description: '',
                dept: 'General',
                priority: 'Medium',
                dueDate: new Date().toISOString().split('T')[0],
                assigneeId: profile?.uid || '',
                assigneeName: profile?.fullName || ''
              });
              setShowModal(true);
            }}
            className="bg-slate-900 text-white px-5 py-2 rounded-lg font-bold text-sm hover:bg-black transition-all flex items-center gap-2 shadow-lg shadow-slate-200"
          >
            <Plus size={18} />
            New Task
          </button>
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {(Object.keys(columns) as (keyof typeof columns)[]).map((columnKey) => {
            const column = columns[columnKey];
            const columnTasks = filteredTasks.filter(t => t.status === columnKey);

            return (
              <div key={column.id} className="flex flex-col h-full min-h-[600px] bg-slate-50/50 rounded-[2rem] border border-slate-100 p-4">
                <div className="flex items-center justify-between px-4 py-4 mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${column.color}`}></div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">{column.title}</h3>
                    <span className="text-[10px] font-black text-slate-400 bg-white border border-slate-100 px-2 py-0.5 rounded-full shadow-sm">
                      {String(columnTasks.length).padStart(2, '0')}
                    </span>
                  </div>
                </div>

                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={`flex-1 space-y-4 p-2 rounded-2xl transition-colors ${snapshot.isDraggingOver ? 'bg-blue-50/50 shadow-inner' : ''}`}
                    >
                      {loading ? (
                         <div className="flex flex-col items-center justify-center h-40 space-y-2 opacity-50">
                           <Loader2 size={24} className="animate-spin text-blue-600" />
                           <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Loading Data...</span>
                         </div>
                      ) : (
                        <AnimatePresence>
                          {columnTasks.map((task, index) => (
                            <Draggable key={task.id} draggableId={task.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`transform transition-all ${snapshot.isDragging ? 'rotate-2 scale-105 z-50' : ''}`}
                                >
                                  <TaskCard 
                                    task={task} 
                                    urgency={getUrgency(task.dueDate)} 
                                    onToggleComplete={() => handleToggleComplete(task)}
                                    onEdit={() => {
                                      setEditingTask(task);
                                      setTaskForm({
                                        title: task.title,
                                        description: task.description || '',
                                        dept: task.dept || 'General',
                                        priority: task.priority,
                                        dueDate: task.dueDate,
                                        assigneeId: task.assigneeId,
                                        assigneeName: task.assigneeName
                                      });
                                      setShowModal(true);
                                    }}
                                  />
                                </div>
                              )}
                            </Draggable>
                          ))}
                        </AnimatePresence>
                      )}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {/* Task Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden relative"
            >
              <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-xl font-black text-slate-900 italic font-display">
                  <span className="not-italic text-blue-600 mr-2">::</span>
                  {editingTask ? 'Edit Task' : 'New Assignment'}
                </h3>
                <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-slate-600 bg-white border border-slate-200 rounded-xl transition-all">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveTask} className="p-8 space-y-5">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Title</label>
                  <input 
                    required type="text"
                    value={taskForm.title} onChange={e => setTaskForm({...taskForm, title: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm"
                    placeholder="Briefly describe the task..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Assignee</label>
                    <select 
                      required
                      value={taskForm.assigneeId} 
                      onChange={e => setTaskForm({...taskForm, assigneeId: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm appearance-none"
                    >
                      <option value="">Select User</option>
                      {users.map(u => <option key={u.uid} value={u.uid}>{u.fullName}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Priority</label>
                    <select 
                      value={taskForm.priority} 
                      onChange={e => setTaskForm({...taskForm, priority: e.target.value as 'High' | 'Medium' | 'Low'})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm appearance-none"
                    >
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Due Date</label>
                    <input 
                      required type="date"
                      value={taskForm.dueDate} onChange={e => setTaskForm({...taskForm, dueDate: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Department</label>
                    <input 
                      type="text"
                      value={taskForm.dept} onChange={e => setTaskForm({...taskForm, dept: e.target.value})}
                      placeholder="e.g. Finance, Youth"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Description</label>
                  <textarea 
                    rows={3}
                    value={taskForm.description} onChange={e => setTaskForm({...taskForm, description: e.target.value})}
                    placeholder="Additional context or requirements..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm resize-none"
                  ></textarea>
                </div>

                <div className="pt-6 border-t border-slate-100 flex justify-between items-center bg-white">
                  {editingTask && (
                    <button 
                      type="button" 
                      onClick={() => handleDeleteTask(editingTask.id)}
                      className="text-rose-500 flex items-center gap-2 hover:text-rose-700 transition-colors"
                    >
                      <Trash2 size={18} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Delete</span>
                    </button>
                  )}
                  <div className="flex gap-3 ml-auto">
                    <button 
                      type="button" 
                      onClick={() => setShowModal(false)}
                      className="px-6 py-3 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-2xl transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      disabled={isSaving}
                      type="submit"
                      className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-50 active:scale-95"
                    >
                      {isSaving ? 'Processing...' : (editingTask ? 'Apply Changes' : 'Initialize Task')}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function TaskCard({ task, urgency, onEdit, onToggleComplete }: { 
  task: TaskData, 
  urgency: 'overdue' | 'near' | 'safe', 
  onEdit: () => void,
  onToggleComplete: () => void 
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const priorityColors = {
    High: 'text-rose-600 bg-rose-50 border-rose-100 shadow-rose-200/50',
    Medium: 'text-amber-600 bg-amber-50 border-amber-100 shadow-amber-200/50',
    Low: 'text-blue-600 bg-blue-50 border-blue-100 shadow-blue-200/50'
  };

  const urgencyStyles = {
    overdue: 'border-rose-300 ring-2 ring-rose-100',
    near: 'border-amber-300 ring-2 ring-amber-100',
    safe: 'border-slate-200 hover:border-blue-400'
  };

  const formattedDate = task.createdAt?.toDate 
    ? new Date(task.createdAt.toDate()).toLocaleDateString()
    : 'Recently';

  return (
    <motion.div 
      layout
      className={`bg-white rounded-[1.5rem] border-2 shadow-sm transition-all group overflow-hidden ${urgencyStyles[urgency]} ${task.status === 'completed' ? 'grayscale-[0.5]' : ''}`}
    >
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-5 cursor-pointer"
      >
        <div className="flex justify-between items-start mb-4">
          <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border ${priorityColors[task.priority]}`}>
            {task.priority} Priority
          </span>
          <div className="flex items-center gap-1">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onToggleComplete();
              }}
              className={`p-1.5 rounded-lg transition-all ${
                task.status === 'completed' 
                  ? 'bg-emerald-500 text-white' 
                  : 'bg-slate-100 text-slate-400 hover:bg-emerald-100 hover:text-emerald-600'
              }`}
            >
              <CheckCircle2 size={16} />
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="p-1.5 text-slate-300 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <MoreVertical size={16} />
            </button>
          </div>
        </div>

        <h4 className={`text-sm font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors ${task.status === 'completed' ? 'line-through text-slate-400' : ''}`}>
          {task.title}
        </h4>
        
        <div className="flex items-center gap-3">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all">
            <Users size={12} />
            {task.dept}
          </p>
          {task.status === 'completed' && (
            <motion.span 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-[9px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1"
            >
              <CheckCircle2 size={10} />
              Finalized
            </motion.span>
          )}
        </div>
        
        {urgency !== 'safe' && task.status !== 'completed' && !isExpanded && (
          <div className={`mt-4 flex items-center gap-2 p-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${urgency === 'overdue' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>
            <AlertCircle size={14} />
            {urgency === 'overdue' ? 'TASK OVERDUE' : 'DUE SOON'}
          </div>
        )}

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-4 pt-4 border-t border-slate-50 space-y-4">
                <div className="space-y-1.5">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Requirement Detail</span>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    {task.description || "No specific instructions provided for this assignment."}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Initiated</span>
                    <span className="text-[10px] font-bold text-slate-600">{formattedDate}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Assigned To</span>
                    <span className="text-[10px] font-bold text-slate-600 truncate block">{task.assigneeName}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-50">
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1.5">Target Date</span>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase">
              <Clock size={12} className="text-blue-600" />
              {task.dueDate}
            </div>
          </div>
          <div className="flex items-center gap-2 group/user transition-transform hover:translate-x-[-4px]">
            <div className="text-right">
               <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1">Owner</p>
               <span className="text-[10px] font-black text-slate-700 leading-none truncate max-w-[80px] block uppercase tracking-tighter">{task.assigneeName}</span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500 border-2 border-white shadow-sm ring-1 ring-slate-100 group-hover:bg-blue-600 group-hover:text-white transition-all">
              {task.assigneeName.charAt(0)}
            </div>
          </div>
        </div>
      </div>

      {/* Completion Overlay Flash */}
      <AnimatePresence>
        {task.status === 'completed' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none bg-emerald-500/5 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 0] }}
              transition={{ duration: 0.8, times: [0, 0.4, 1] }}
              className="bg-white/80 p-6 rounded-full"
            >
              <CheckCircle2 size={48} className="text-emerald-500" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

