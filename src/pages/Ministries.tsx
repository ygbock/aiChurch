import React from 'react';
import { motion } from 'motion/react';
import { 
  Network, 
  Plus, 
  Users, 
  Calendar, 
  ArrowRight,
  Music,
  Heart,
  BookOpen,
  Users2
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Ministries() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Ministry Hub</h2>
          <p className="text-slate-500 text-sm">Oversee all spiritual and community outreach programs.</p>
        </div>
        <Link 
          to="/departments" 
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
        >
          <Plus size={18} />
          New Department
        </Link>
      </div>

      {/* Ministries Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MinistryCard 
          title="Worship & Creative Arts" 
          members="120" 
          events="4" 
          leader="Sarah Jenkins"
          icon={<Music className="text-blue-600" size={24} />}
          color="bg-blue-50"
        />
        <MinistryCard 
          title="Youth & Young Adults" 
          members="450" 
          events="2" 
          leader="Mark Thompson"
          icon={<Users2 className="text-purple-600" size={24} />}
          color="bg-purple-50"
        />
        <MinistryCard 
          title="Community Outreach" 
          members="85" 
          events="6" 
          leader="David Oloyede"
          icon={<Heart className="text-emerald-600" size={24} />}
          color="bg-emerald-50"
        />
        <MinistryCard 
          title="Bible School" 
          members="320" 
          events="12" 
          leader="Lydia Chen"
          icon={<BookOpen className="text-orange-600" size={24} />}
          color="bg-orange-50"
        />
        <MinistryCard 
          title="Pastoral Care" 
          members="45" 
          events="1" 
          leader="Maria Garcia"
          icon={<Users className="text-rose-600" size={24} />}
          color="bg-rose-50"
        />
        <div className="border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center p-8 text-center hover:border-blue-300 hover:bg-blue-50/30 transition-all group cursor-pointer">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
            <Plus size={24} />
          </div>
          <h4 className="text-sm font-bold text-slate-900">Add New Ministry</h4>
          <p className="text-xs text-slate-500 mt-1">Expand your church's reach</p>
        </div>
      </div>
    </motion.div>
  );
}

function MinistryCard({ title, members, events, leader, icon, color }: { title: string, members: string, events: string, leader: string, icon: React.ReactNode, color: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow group">
      <div className="p-6">
        <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center mb-4`}>
          {icon}
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-1">{title}</h3>
        <p className="text-xs text-slate-500 mb-6 flex items-center gap-1">
          Led by <span className="font-semibold text-slate-700">{leader}</span>
        </p>
        
        <div className="grid grid-cols-2 gap-4 py-4 border-t border-slate-50">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-slate-400" />
            <div>
              <p className="text-xs font-bold text-slate-900">{members}</p>
              <p className="text-[10px] text-slate-500 uppercase font-bold">Members</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-slate-400" />
            <div>
              <p className="text-xs font-bold text-slate-900">{events}</p>
              <p className="text-[10px] text-slate-500 uppercase font-bold">Events</p>
            </div>
          </div>
        </div>
      </div>
      <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center group-hover:bg-blue-50 transition-colors">
        <span className="text-xs font-bold text-slate-600 group-hover:text-blue-600">Manage Ministry</span>
        <ArrowRight size={16} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
      </div>
    </div>
  );
}
