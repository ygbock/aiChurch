import React from 'react';
import { motion } from 'motion/react';
import { 
  BookOpen, 
  Users, 
  GraduationCap, 
  Plus, 
  Search, 
  Filter, 
  ChevronRight,
  CheckCircle2,
  Clock,
  MoreVertical
} from 'lucide-react';
import { useRole } from '../components/Layout';

export default function BibleSchool() {
  const { role } = useRole();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Bible School Academy</h2>
          <p className="text-slate-500 text-sm">
            {role === 'admin' ? 'Manage spiritual growth cohorts and training for Main Campus.' : 
             role === 'district' ? 'District-wide leadership training and academy oversight.' :
             'Manage spiritual growth cohorts and leadership training programs.'}
          </p>
        </div>
        <div className="flex gap-2">
          <button className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg font-medium text-sm hover:bg-slate-50 transition-colors flex items-center gap-2">
            <GraduationCap size={18} />
            Generate Certificates
          </button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm">
            <Plus size={18} />
            New Cohort
          </button>
        </div>
      </div>

      {/* Training Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label="Active Students" value="342" icon={<Users className="text-blue-600" size={20} />} trend="+12% this month" />
        <StatCard label="Current Cohorts" value="14" icon={<BookOpen className="text-emerald-600" size={20} />} trend="Across 4 levels" />
        <StatCard label="Completion Rate" value="88%" icon={<CheckCircle2 className="text-purple-600" size={20} />} trend="Avg. per cohort" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active Cohorts */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900">Active Cohorts</h3>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input type="text" placeholder="Search cohorts..." className="bg-slate-50 border border-slate-200 rounded-lg py-1.5 pl-8 pr-3 text-xs focus:ring-1 focus:ring-blue-600 outline-none" />
                </div>
                <button className="p-1.5 text-slate-400 hover:text-slate-600 border border-slate-200 rounded-lg">
                  <Filter size={14} />
                </button>
              </div>
            </div>
            <div className="divide-y divide-slate-50">
              <CohortItem 
                title="Foundation Class - Oct '23" 
                level="Level 0" 
                students={45} 
                progress={65} 
                instructor="Pastor James" 
                status="In Progress"
              />
              <CohortItem 
                title="Discipleship Level 1" 
                level="Level 1" 
                students={32} 
                progress={40} 
                instructor="Elder Sarah" 
                status="In Progress"
              />
              <CohortItem 
                title="Leadership Training 2023" 
                level="Leadership" 
                students={18} 
                progress={90} 
                instructor="Rev. David" 
                status="Final Week"
              />
              <CohortItem 
                title="Pastoral Prep Cohort B" 
                level="Pastoral" 
                students={12} 
                progress={25} 
                instructor="Bishop Wilson" 
                status="In Progress"
              />
            </div>
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100">
              <button className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                View All Cohorts
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* Training Levels Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <LevelCard 
              title="Foundation" 
              desc="The basics of faith and church doctrine." 
              count={124} 
              color="bg-blue-600"
            />
            <LevelCard 
              title="Discipleship" 
              desc="Deepening spiritual walk and service." 
              count={156} 
              color="bg-emerald-500"
            />
            <LevelCard 
              title="Leadership" 
              desc="Preparing workers for ministry roles." 
              count={42} 
              color="bg-purple-500"
            />
            <LevelCard 
              title="Pastoral" 
              desc="Advanced training for clergy roles." 
              count={20} 
              color="bg-orange-500"
            />
          </div>
        </div>

        {/* Recent Student Activity */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">Recent Activity</h3>
            </div>
            <div className="p-4 space-y-4">
              <ActivityItem 
                user="Mark Thompson" 
                action="completed" 
                target="Discipleship Level 1" 
                time="2 hours ago" 
              />
              <ActivityItem 
                user="Lydia Chen" 
                action="enrolled in" 
                target="Foundation Class" 
                time="5 hours ago" 
              />
              <ActivityItem 
                user="Sarah Jenkins" 
                action="submitted" 
                target="Leadership Final Essay" 
                time="Yesterday" 
              />
              <ActivityItem 
                user="David Oloyede" 
                action="graded" 
                target="Pastoral Ethics Quiz" 
                time="Yesterday" 
              />
            </div>
          </div>

          <div className="bg-blue-600 rounded-xl p-6 text-white shadow-lg relative overflow-hidden group">
            <div className="relative z-10">
              <h4 className="text-lg font-bold mb-2">Curriculum Builder</h4>
              <p className="text-blue-100 text-sm mb-4 leading-relaxed">Design custom courses and lesson plans for your academy.</p>
              <button className="bg-white text-blue-600 px-4 py-2 rounded-lg text-xs font-bold hover:bg-blue-50 transition-colors">
                Open Builder
              </button>
            </div>
            <BookOpen className="absolute -right-4 -bottom-4 text-white/10 w-32 h-32 group-hover:scale-110 transition-transform" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function StatCard({ label, value, icon, trend }: { label: string, value: string, icon: React.ReactNode, trend: string }) {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-slate-50 rounded-lg">
          {icon}
        </div>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{trend}</span>
      </div>
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{label}</p>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
      </div>
    </div>
  );
}

function CohortItem({ title, level, students, progress, instructor, status }: { title: string, level: string, students: number, progress: number, instructor: string, status: string }) {
  return (
    <div className="px-6 py-4 hover:bg-slate-50 transition-colors group">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{title}</h4>
          <p className="text-xs text-slate-500 mt-0.5">{level} • Instructor: {instructor}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase bg-slate-100 px-2 py-1 rounded">{status}</span>
          <button className="text-slate-400 hover:text-slate-600">
            <MoreVertical size={16} />
          </button>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-blue-600 rounded-full" style={{ width: `${progress}%` }}></div>
        </div>
        <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
          <span className="flex items-center gap-1">
            <Users size={12} />
            {students}
          </span>
          <span>{progress}%</span>
        </div>
      </div>
    </div>
  );
}

function LevelCard({ title, desc, count, color }: { title: string, desc: string, count: number, color: string }) {
  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-blue-200 transition-colors group">
      <div className="flex justify-between items-start mb-3">
        <div className={`w-2 h-10 ${color} rounded-full`}></div>
        <div className="text-right">
          <p className="text-lg font-bold text-slate-900">{count}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase">Students</p>
        </div>
      </div>
      <h4 className="text-sm font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">{title}</h4>
      <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
    </div>
  );
}

function ActivityItem({ user, action, target, time }: { user: string, action: string, target: string, time: string }) {
  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs flex-shrink-0">
        {user.charAt(0)}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-600 leading-tight">
          <span className="font-bold text-slate-900">{user}</span> {action} <span className="font-bold text-slate-900">{target}</span>
        </p>
        <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
          <Clock size={10} />
          {time}
        </p>
      </div>
    </div>
  );
}
