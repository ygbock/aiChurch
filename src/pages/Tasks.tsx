import React from 'react';
import { motion } from 'motion/react';
import { 
  CheckSquare, 
  Plus, 
  Search, 
  Filter, 
  ChevronRight,
  Clock,
  MoreVertical,
  Users,
  Calendar,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { useRole } from '../components/Layout';

export default function Tasks() {
  const { role } = useRole();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Task Management</h2>
          <p className="text-slate-500 text-sm">
            {role === 'admin' ? 'Track Main Campus operations and ministry projects.' : 
             role === 'district' ? 'District-wide project tracking and branch task oversight.' :
             'Track church operations and ministry projects with a digital task board.'}
          </p>
        </div>
        <div className="flex gap-2">
          <button className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg font-medium text-sm hover:bg-slate-50 transition-colors flex items-center gap-2">
            <Filter size={18} />
            Filter Board
          </button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm">
            <Plus size={18} />
            Create Task
          </button>
        </div>
      </div>

      {/* Task Board (Kanban Style) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Pending Column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-slate-400"></div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Pending</h3>
              <span className="text-xs font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">04</span>
            </div>
            <button className="text-slate-400 hover:text-slate-600">
              <Plus size={16} />
            </button>
          </div>
          <div className="space-y-3">
            <TaskCard 
              title="Organize Youth Outreach" 
              dept="Youth Ministry" 
              priority="High" 
              date="Oct 20" 
              assignee="Mark T."
            />
            <TaskCard 
              title="Update Member Directory" 
              dept="Admin" 
              priority="Medium" 
              date="Oct 22" 
              assignee="Sarah J."
            />
            <TaskCard 
              title="Sound System Maintenance" 
              dept="Technical" 
              priority="Low" 
              date="Oct 25" 
              assignee="James W."
            />
          </div>
        </div>

        {/* In Progress Column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-600"></div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">In Progress</h3>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">02</span>
            </div>
            <button className="text-slate-400 hover:text-slate-600">
              <Plus size={16} />
            </button>
          </div>
          <div className="space-y-3">
            <TaskCard 
              title="Financial Audit Q3" 
              dept="Finance" 
              priority="High" 
              date="Oct 18" 
              assignee="Lydia C."
              inProgress
            />
            <TaskCard 
              title="Choir Rehearsal Schedule" 
              dept="Choir" 
              priority="Medium" 
              date="Oct 19" 
              assignee="Sarah J."
              inProgress
            />
          </div>
        </div>

        {/* Completed Column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Completed</h3>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">12</span>
            </div>
            <button className="text-slate-400 hover:text-slate-600">
              <Plus size={16} />
            </button>
          </div>
          <div className="space-y-3">
            <TaskCard 
              title="Sunday Service Setup" 
              dept="Ushering" 
              priority="Medium" 
              date="Oct 15" 
              assignee="David O."
              completed
            />
            <TaskCard 
              title="New Member Welcome Emails" 
              dept="Admin" 
              priority="Low" 
              date="Oct 14" 
              assignee="Sarah J."
              completed
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function TaskCard({ title, dept, priority, date, assignee, inProgress, completed }: { title: string, dept: string, priority: 'High' | 'Medium' | 'Low', date: string, assignee: string, inProgress?: boolean, completed?: boolean }) {
  const priorityColors = {
    High: 'text-red-600 bg-red-50',
    Medium: 'text-orange-600 bg-orange-50',
    Low: 'text-blue-600 bg-blue-50'
  };

  return (
    <div className={`bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-blue-200 transition-all group cursor-pointer ${completed ? 'opacity-75' : ''}`}>
      <div className="flex justify-between items-start mb-3">
        <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${priorityColors[priority]}`}>
          {priority}
        </span>
        <button className="text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
          <MoreVertical size={14} />
        </button>
      </div>
      <h4 className={`text-sm font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors ${completed ? 'line-through text-slate-500' : ''}`}>
        {title}
      </h4>
      <p className="text-xs text-slate-500 mb-4">{dept}</p>
      
      <div className="flex items-center justify-between pt-3 border-t border-slate-50">
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase">
          <Calendar size={12} />
          {date}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-600">{assignee}</span>
          <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 border border-white">
            {assignee.charAt(0)}
          </div>
        </div>
      </div>
    </div>
  );
}
