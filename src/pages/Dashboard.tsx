import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
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
  ArrowRight
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Modal from '../components/Modal';
import { useFirebase } from '../components/FirebaseProvider';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function Dashboard() {
  const navigate = useNavigate();
  const { profile, memberProfile } = useFirebase();
  const [branchName, setBranchName] = useState('Loading Branch...');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

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

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    // Logic to create task
    setIsTaskModalOpen(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Profile Completion Nudge */}
      {memberProfile && memberProfile.isProfileComplete === false && (
        <motion.div 
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="bg-blue-600 rounded-2xl p-4 md:p-6 text-white shadow-xl shadow-blue-200 relative overflow-hidden"
        >
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <AlertCircle size={24} />
              </div>
              <div>
                <h3 className="font-bold text-lg">Complete Your Member Profile</h3>
                <p className="text-blue-100 text-sm">Your administrative account is ready, but your record in the member registry is incomplete.</p>
              </div>
            </div>
            <button 
              onClick={() => navigate(`/members/edit/${memberProfile.id}`)}
              className="bg-white text-blue-600 px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all flex items-center gap-2 whitespace-nowrap"
            >
              Complete Registration
              <ArrowRight size={16} />
            </button>
          </div>
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
        </motion.div>
      )}

      {/* Branch Admin Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{branchName}</h2>
          <p className="text-slate-500 text-sm">Managing branch departments, ministries, and daily tasks.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => navigate('/departments')}
            className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg font-medium text-sm hover:bg-slate-50 transition-colors flex items-center gap-2"
          >
            <Briefcase size={18} />
            Manage Departments
          </button>
          <button 
            onClick={() => setIsTaskModalOpen(true)}
            className="bg-slate-900 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-slate-800 transition-colors flex items-center gap-2 shadow-sm"
          >
            <CheckSquare size={18} />
            Assign Task
          </button>
        </div>
      </div>

      {/* Modals */}

      <Modal 
        isOpen={isTaskModalOpen} 
        onClose={() => setIsTaskModalOpen(false)} 
        title="Assign New Task"
      >
        <form onSubmit={handleCreateTask} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Task Title</label>
            <input type="text" placeholder="e.g. Setup for Sunday Service" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" required />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Assign To</label>
            <select className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
              <option>Media Team</option>
              <option>Ushering Dept</option>
              <option>Pastoral Care</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Priority</label>
            <div className="flex gap-2">
              {['Low', 'Medium', 'High'].map(p => (
                <button key={p} type="button" className="flex-1 py-2 border border-slate-200 rounded-lg text-xs font-bold hover:bg-slate-50">{p}</button>
              ))}
            </div>
          </div>
          <button type="submit" className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold text-sm shadow-lg hover:bg-slate-800 transition-all">
            Assign Task
          </button>
        </form>
      </Modal>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Total Members" 
          value="12,482" 
          trend="+240 this month" 
          trendUp={true}
          icon={<Users className="text-blue-600" size={20} />}
        />
        <StatCard 
          label="Monthly Tithes" 
          value="$45,210" 
          trend="8% increase" 
          trendUp={true}
          icon={<Banknote className="text-emerald-600" size={20} />}
        />
        <StatCard 
          label="Active Ministries" 
          value="24" 
          trend="District-wide" 
          icon={<Network className="text-purple-600" size={20} />}
        />
        <StatCard 
          label="Branches" 
          value="08" 
          trend="Active locations" 
          icon={<Building2 className="text-orange-600" size={20} />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Members */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
            <h3 className="text-base font-semibold text-slate-900">Recent New Members</h3>
            <button className="text-sm font-semibold text-blue-600 hover:text-blue-700">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Member Name</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Branch</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Join Date</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <MemberRow name="Sarah Jenkins" branch="Central Cathedral" date="Oct 12, 2023" status="Verified" statusType="success" />
                <MemberRow name="David Oloyede" branch="Eastside Ministry" date="Oct 11, 2023" status="Verified" statusType="success" />
                <MemberRow name="Maria Garcia" branch="Grace Chapel" date="Oct 10, 2023" status="Pending Info" statusType="warning" />
                <MemberRow name="James Wilson" branch="Central Cathedral" date="Oct 08, 2023" status="Verified" statusType="success" />
                <MemberRow name="Linh Nguyen" branch="Grace Chapel" date="Oct 05, 2023" status="Verified" statusType="success" />
                <MemberRow name="Robert Chen" branch="North Point" date="Oct 03, 2023" status="Assigned" statusType="info" />
              </tbody>
            </table>
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-200">
            <h3 className="text-base font-semibold text-slate-900">Upcoming Events</h3>
          </div>
          <div className="p-2 divide-y divide-slate-50">
            <EventItem day="15" month="Oct" title="Sunday Service" location="Central Cathedral" time="09:00 AM" />
            <EventItem day="18" month="Oct" title="Mid-week Bible Study" location="Online / All Branches" time="07:00 PM" />
            <EventItem day="22" month="Oct" title="Youth Outreach Rally" location="City Park Arena" time="02:00 PM" />
            <EventItem day="25" month="Oct" title="Leadership Training" location="District Office" time="10:00 AM" />
          </div>
          <div className="p-4 mt-auto border-t border-slate-100">
            <button className="w-full py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-lg transition-colors flex items-center justify-center gap-2">
              View Calendar
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function StatCard({ label, value, trend, trendUp, icon }: { label: string, value: string, trend: string, trendUp?: boolean, icon: React.ReactNode }) {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-slate-50 rounded-lg">
          {icon}
        </div>
        {trendUp !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-bold ${trendUp ? 'text-emerald-600' : 'text-slate-500'}`}>
            {trendUp && <TrendingUp size={12} />}
            {trend}
          </div>
        )}
        {trendUp === undefined && (
          <div className="text-xs font-bold text-slate-500">
            {trend}
          </div>
        )}
      </div>
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{label}</p>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
      </div>
    </div>
  );
}

function MemberRow({ name, branch, date, status, statusType }: { name: string, branch: string, date: string, status: string, statusType: 'success' | 'warning' | 'info' }) {
  const statusClasses = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    warning: 'bg-orange-50 text-orange-700 border-orange-100',
    info: 'bg-blue-50 text-blue-700 border-blue-100'
  };

  return (
    <tr className="hover:bg-slate-50 transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs">
            {name.charAt(0)}
          </div>
          <span className="text-sm font-semibold text-slate-800">{name}</span>
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-slate-600">{branch}</td>
      <td className="px-6 py-4 text-sm text-slate-600">{date}</td>
      <td className="px-6 py-4">
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${statusClasses[statusType]}`}>
          {status}
        </span>
      </td>
    </tr>
  );
}

function EventItem({ day, month, title, location, time }: { day: string, month: string, title: string, location: string, time: string }) {
  return (
    <div className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors rounded-lg group">
      <div className="w-12 h-12 bg-slate-100 rounded-lg flex flex-col items-center justify-center flex-shrink-0 group-hover:bg-white transition-colors border border-transparent group-hover:border-slate-200">
        <span className="text-sm font-bold text-slate-900 leading-none">{day}</span>
        <span className="text-[10px] font-bold text-slate-500 uppercase mt-0.5">{month}</span>
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-slate-900 truncate">{title}</h4>
        <p className="text-xs text-slate-500 truncate">{location} • {time}</p>
      </div>
      <button className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
