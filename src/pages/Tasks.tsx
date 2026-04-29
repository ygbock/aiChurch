import React, { useState } from 'react';
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
  Layout
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useRole } from '../components/Layout';

interface Task {
  id: string;
  title: string;
  dept: string;
  priority: 'High' | 'Medium' | 'Low';
  dueDate: string;
  assignee: string;
  status: 'pending' | 'in-progress' | 'completed';
}

const initialTasks: Task[] = [
  { id: '1', title: 'Organize Youth Outreach', dept: 'Youth Ministry', priority: 'High', dueDate: '2024-10-20', assignee: 'Mark T.', status: 'pending' },
  { id: '2', title: 'Update Member Directory', dept: 'Admin', priority: 'Medium', dueDate: '2024-10-22', assignee: 'Sarah J.', status: 'pending' },
  { id: '3', title: 'Financial Audit Q3', dept: 'Finance', priority: 'High', dueDate: '2024-10-18', assignee: 'Lydia C.', status: 'in-progress' },
  { id: '4', title: 'Sunday Service Setup', dept: 'Ushering', priority: 'Medium', dueDate: '2024-10-15', assignee: 'David O.', status: 'completed' }
];

const columns = {
  pending: { id: 'pending', title: 'Pending', color: 'bg-slate-400' },
  'in-progress': { id: 'in-progress', title: 'In Progress', color: 'bg-blue-600' },
  completed: { id: 'completed', title: 'Completed', color: 'bg-emerald-500' }
};

export default function Tasks() {
  const { role } = useRole();
  const [tasks, setTasks] = useState<Task[]>(initialTasks);

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const task = tasks.find(t => t.id === draggableId);
    if (!task) return;

    const newStatus = destination.droppableId as Task['status'];
    const updatedTasks = tasks.map(t => 
      t.id === draggableId ? { ...t, status: newStatus } : t
    );

    // Reorder within the status (if needed, but here we just move between groups)
    // Note: Simple implementation, doesn't handle index-based reordering within status perfectly
    setTasks(updatedTasks);
  };

  const getUrgency = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'overdue';
    if (diffDays <= 2) return 'near';
    return 'safe';
  };

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
             {role === 'admin' ? 'Strategic oversight of church-wide operational flows.' : 
              'Collaborative environment for ministry task execution and tracking.'}
          </p>
        </div>
        <div className="flex gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Filter tasks..."
              className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all w-48"
            />
          </div>
          <button className="bg-slate-900 text-white px-5 py-2 rounded-lg font-bold text-sm hover:bg-black transition-all flex items-center gap-2 shadow-lg shadow-slate-200">
            <Plus size={18} />
            New Task
          </button>
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {(Object.keys(columns) as (keyof typeof columns)[]).map((columnKey) => {
            const column = columns[columnKey];
            const columnTasks = tasks.filter(t => t.status === columnKey);

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
                  <button className="p-1.5 hover:bg-white rounded-lg text-slate-400 transition-colors">
                    <Plus size={16} />
                  </button>
                </div>

                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={`flex-1 space-y-4 p-2 rounded-2xl transition-colors ${snapshot.isDraggingOver ? 'bg-blue-50/50 shadow-inner' : ''}`}
                    >
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
                                <TaskCard task={task} urgency={getUrgency(task.dueDate)} />
                              </div>
                            )}
                          </Draggable>
                        ))}
                      </AnimatePresence>
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>
    </motion.div>
  );
}

function TaskCard({ task, urgency }: { task: Task, urgency: 'overdue' | 'near' | 'safe' }) {
  const priorityColors = {
    High: 'text-rose-600 bg-rose-50 border-rose-100 shadow-rose-200/50',
    Medium: 'text-amber-600 bg-amber-50 border-amber-100 shadow-amber-200/50',
    Low: 'text-blue-600 bg-blue-50 border-blue-100 shadow-blue-200/50'
  };

  const urgencyStyles = {
    overdue: 'border-rose-300 ring-2 ring-rose-100',
    near: 'border-amber-300 ring-2 ring-amber-100',
    safe: 'border-slate-200'
  };

  return (
    <div className={`bg-white p-5 rounded-2xl border-2 shadow-sm transition-all group cursor-pointer ${urgencyStyles[urgency]} ${task.status === 'completed' ? 'opacity-75 grayscale-[0.5]' : ''}`}>
      <div className="flex justify-between items-start mb-4">
        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border ${priorityColors[task.priority]}`}>
          {task.priority}
        </span>
        <button className="text-slate-300 hover:text-slate-600 transition-colors">
          <MoreVertical size={16} />
        </button>
      </div>

      <h4 className={`text-sm font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors ${task.status === 'completed' ? 'line-through text-slate-400' : ''}`}>
        {task.title}
      </h4>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">{task.dept}</p>
      
      {urgency !== 'safe' && task.status !== 'completed' && (
        <div className={`mb-4 flex items-center gap-2 p-2 rounded-lg text-[10px] font-bold ${urgency === 'overdue' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>
          <AlertCircle size={14} />
          {urgency === 'overdue' ? 'TASK OVERDUE' : 'DUE SOON'}
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-slate-50">
        <div className="flex flex-col">
          <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1">Target Date</span>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
            <Clock size={12} />
            {task.dueDate}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
             <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1">Owner</p>
             <span className="text-[10px] font-bold text-slate-700 leading-none">{task.assignee}</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-black text-slate-500 border-2 border-white shadow-sm ring-1 ring-slate-100">
            {task.assignee.charAt(0)}
          </div>
        </div>
      </div>
    </div>
  );
}
