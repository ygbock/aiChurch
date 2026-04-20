import React from 'react';
import { motion } from 'motion/react';
import { 
  Heart, 
  Plus, 
  Search, 
  Filter, 
  ChevronRight,
  CheckCircle2,
  Clock,
  MoreVertical,
  Users,
  Calendar,
  Award
} from 'lucide-react';

export default function Volunteers() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Volunteers Coordination</h2>
          <p className="text-slate-500 text-sm">Manage volunteer assignments, availability, and service hours.</p>
        </div>
        <div className="flex gap-2">
          <button className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg font-medium text-sm hover:bg-slate-50 transition-colors flex items-center gap-2">
            <Award size={18} />
            Recognition
          </button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm">
            <Plus size={18} />
            Recruit Volunteer
          </button>
        </div>
      </div>

      {/* Volunteer Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label="Total Volunteers" value="248" icon={<Users className="text-blue-600" size={20} />} trend="Active this month" />
        <StatCard label="Service Hours" value="1,240" icon={<Clock className="text-emerald-600" size={20} />} trend="MTD total" />
        <StatCard label="Active Roles" value="42" icon={<Heart className="text-purple-600" size={20} />} trend="Across departments" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Volunteer List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900">Volunteer Registry</h3>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input type="text" placeholder="Search volunteers..." className="bg-slate-50 border border-slate-200 rounded-lg py-1.5 pl-8 pr-3 text-xs focus:ring-1 focus:ring-blue-600 outline-none" />
                </div>
                <button className="p-1.5 text-slate-400 hover:text-slate-600 border border-slate-200 rounded-lg">
                  <Filter size={14} />
                </button>
              </div>
            </div>
            <div className="divide-y divide-slate-50">
              <VolunteerItem 
                name="Sarah Jenkins" 
                dept="Choir" 
                hours={120} 
                status="Active" 
                rating={5}
              />
              <VolunteerItem 
                name="David Oloyede" 
                dept="Ushering" 
                hours={85} 
                status="Active" 
                rating={4}
              />
              <VolunteerItem 
                name="Maria Garcia" 
                dept="Prayer Team" 
                hours={45} 
                status="On Leave" 
                rating={5}
              />
              <VolunteerItem 
                name="James Wilson" 
                dept="Technical" 
                hours={210} 
                status="Active" 
                rating={5}
              />
            </div>
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100">
              <button className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                View All Volunteers
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* Availability Calendar Placeholder */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-base font-bold text-slate-900">Availability Overview</h3>
              <div className="flex gap-2">
                <button className="text-xs font-bold text-slate-400 hover:text-blue-600">Week</button>
                <button className="text-xs font-bold text-blue-600">Month</button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
                <div key={day} className="text-center text-[10px] font-bold text-slate-400 uppercase mb-2">{day}</div>
              ))}
              {Array.from({ length: 31 }, (_, i) => (
                <div key={i} className={`aspect-square rounded-lg border border-slate-100 flex items-center justify-center text-xs font-bold transition-colors cursor-pointer ${i === 14 ? 'bg-blue-600 text-white' : 'hover:bg-slate-50 text-slate-600'}`}>
                  {i + 1}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Volunteer Opportunities Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">Open Roles</h3>
            </div>
            <div className="p-4 space-y-4">
              <OpportunityItem 
                title="Sunday School Teacher" 
                dept="Children's Ministry" 
                spots={2} 
              />
              <OpportunityItem 
                title="Sound Technician" 
                dept="Technical Dept" 
                spots={1} 
              />
              <OpportunityItem 
                title="Welcome Team" 
                dept="Ushering Dept" 
                spots={5} 
              />
            </div>
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100">
              <button className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                Post New Opportunity
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          <div className="bg-purple-600 rounded-xl p-6 text-white shadow-lg relative overflow-hidden group">
            <div className="relative z-10">
              <h4 className="text-lg font-bold mb-2">Volunteer Rewards</h4>
              <p className="text-purple-100 text-sm mb-4 leading-relaxed">Acknowledge and reward your most dedicated servants.</p>
              <button className="bg-white text-purple-600 px-4 py-2 rounded-lg text-xs font-bold hover:bg-purple-50 transition-colors">
                View Rewards
              </button>
            </div>
            <Award className="absolute -right-4 -bottom-4 text-white/10 w-32 h-32 group-hover:scale-110 transition-transform" />
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

function VolunteerItem({ name, dept, hours, status, rating }: { name: string, dept: string, hours: number, status: string, rating: number }) {
  return (
    <div className="px-6 py-4 hover:bg-slate-50 transition-colors group">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-sm">
            {name.charAt(0)}
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{name}</h4>
            <p className="text-xs text-slate-500 mt-0.5">{dept} • {hours} total hours</p>
          </div>
        </div>
        <div className="text-right">
          <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
            {status}
          </span>
          <div className="flex items-center gap-0.5 mt-2 justify-end">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < rating ? 'bg-blue-600' : 'bg-slate-200'}`}></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function OpportunityItem({ title, dept, spots }: { title: string, dept: string, spots: number }) {
  return (
    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 hover:border-blue-200 transition-colors cursor-pointer group">
      <div className="flex justify-between items-start mb-1">
        <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{title}</h4>
        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{spots} spots</span>
      </div>
      <p className="text-xs text-slate-500">{dept}</p>
    </div>
  );
}
