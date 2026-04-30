import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Award, 
  Activity, 
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  MapPin,
  ClipboardList,
  Target
} from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useFirebase } from '../components/FirebaseProvider';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const performanceData = [
  { name: 'Jan', attendance: 85, timeliness: 90 },
  { name: 'Feb', attendance: 92, timeliness: 88 },
  { name: 'Mar', attendance: 88, timeliness: 95 },
  { name: 'Apr', attendance: 95, timeliness: 92 },
  { name: 'May', attendance: 90, timeliness: 89 },
  { name: 'Jun', attendance: 98, timeliness: 94 },
];

export default function DepartmentMemberProfile() {
  const { departmentId, memberId } = useParams();
  const navigate = useNavigate();
  const { profile } = useFirebase();
  const [member, setMember] = useState<any>(null);
  const [department, setDepartment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.districtId || !profile?.branchId || !departmentId || !memberId) return;

    const fetchData = async () => {
      try {
        const deptRef = doc(db, 'districts', profile.districtId, 'branches', profile.branchId, 'departments', departmentId);
        const memberRef = doc(db, 'districts', profile.districtId, 'branches', profile.branchId, 'members', memberId);
        
        const [deptSnap, memberSnap] = await Promise.all([
          getDoc(deptRef),
          getDoc(memberRef)
        ]);

        if (deptSnap.exists()) setDepartment({ id: deptSnap.id, ...deptSnap.data() });
        if (memberSnap.exists()) setMember({ id: memberSnap.id, ...memberSnap.data() });
      } catch (err) {
        console.error("Failed to fetch member details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [departmentId, memberId, profile]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8 pb-12"
    >
      {/* Header */}
      <div className="flex flex-col space-y-4">
        <button 
          onClick={() => navigate(`/departments/${departmentId}`)}
          className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors text-sm font-medium w-fit"
        >
          <ArrowLeft size={16} />
          Back to {department?.name || 'Department'}
        </button>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full -mr-32 -mt-32 opacity-50 z-0" />
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 relative z-10 w-full md:w-auto">
            <div className="w-16 h-16 sm:w-24 sm:h-24 shrink-0 rounded-3xl bg-blue-600 flex items-center justify-center text-2xl sm:text-3xl font-bold text-white shadow-xl shadow-blue-200">
              {member?.fullName?.[0]}
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{member?.fullName}</h1>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2">
                <span className="px-2 sm:px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-wider">
                  {department?.name} Member
                </span>
                <span className="flex items-center gap-1.5 text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-widest">
                  <Clock size={14} />
                  Joined Jan 2024
                </span>
                <span className="flex items-center gap-1.5 text-[10px] sm:text-xs text-emerald-500 font-bold uppercase tracking-widest">
                  <CheckCircle2 size={14} />
                  Active Status
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 relative z-10 w-full md:w-auto mt-2 md:mt-0">
            <button 
              onClick={() => navigate(`/members/edit/${memberId}`)}
              className="flex-1 md:flex-none justify-center px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200"
            >
              Edit Profile
            </button>
            <button className="p-2.5 border border-slate-200 rounded-xl text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-all flex items-center justify-center shrink-0">
              <ArrowLeft size={20} className="rotate-180" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
        {/* Left Column: Stats & Info */}
        <div className="lg:col-span-1 space-y-4 sm:space-y-8">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-4">Personal Information</h3>
            <div className="space-y-4">
              <InfoRow icon={<Mail size={18} />} label="Email Address" value={member?.email || 'N/A'} />
              <InfoRow icon={<Phone size={18} />} label="Phone Number" value={member?.phoneNumber || 'N/A'} />
              <InfoRow icon={<MapPin size={18} />} label="Location / Station" value="Main Sanctuary" />
              <InfoRow icon={<Award size={18} />} label="Specialization" value="Lead Usher" />
            </div>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-4">Departmental Stats</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center text-center">
                <span className="text-xl sm:text-2xl font-bold text-slate-900">92%</span>
                <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-tighter">Attendance</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center text-center">
                <span className="text-xl sm:text-2xl font-bold text-slate-900">4.8</span>
                <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-tighter">Performance</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center text-center">
                <span className="text-xl sm:text-2xl font-bold text-slate-900">24</span>
                <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-tighter">Services</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center text-center">
                <span className="text-xl sm:text-2xl font-bold text-slate-900">2</span>
                <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-tighter">Certificates</span>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-100 p-5 sm:p-6 rounded-3xl flex items-start gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 shrink-0">
              <Target size={20} className="sm:w-6 sm:h-6" />
            </div>
            <div>
              <p className="font-bold text-amber-900 text-sm sm:text-base">Next Milestone</p>
              <p className="text-[10px] sm:text-xs text-amber-700 mt-1">5 more services to earn "Senior Usher" recognition.</p>
              <div className="mt-3 h-1.5 w-full bg-amber-200/50 rounded-full overflow-hidden">
                <div className="h-full w-3/4 bg-amber-500 rounded-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Performance & History */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-8">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900 leading-none">Performance Trends</h3>
                <p className="text-[10px] sm:text-sm text-slate-500 mt-2">Attendance and timeliness over last 6 months</p>
              </div>
              <div className="flex flex-wrap gap-3 sm:gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-600 rounded-full" />
                  <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase">Attendance</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                  <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase">Timeliness</span>
                </div>
              </div>
            </div>

            <div className="h-48 sm:h-64 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} 
                    dy={10}
                  />
                  <YAxis 
                    hide 
                    domain={[0, 100]}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="attendance" 
                    stroke="#2563eb" 
                    strokeWidth={4} 
                    dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} 
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="timeliness" 
                    stroke="#10b981" 
                    strokeWidth={4} 
                    dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} 
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-none text-display">Assignment History</h3>
              <button className="text-[10px] sm:text-xs font-black text-blue-600 uppercase tracking-widest hover:text-blue-700">View All</button>
            </div>

            <div className="space-y-4">
              <HistoryRow 
                title="Divine Service - Main Entrance" 
                date="Sunday, Jan 21, 2026" 
                time="08:00 AM" 
                status="Ontime" 
              />
              <HistoryRow 
                title="Weekly Prayer Meeting - Sanctuary" 
                date="Wednesday, Jan 17, 2026" 
                time="06:15 PM" 
                status="Delayed" 
              />
              <HistoryRow 
                title="Combined Service - Overflow" 
                date="Sunday, Jan 14, 2026" 
                time="07:55 AM" 
                status="Ontime" 
              />
              <HistoryRow 
                title="Special Vigil - Main Entrance" 
                date="Friday, Jan 12, 2026" 
                time="10:00 PM" 
                status="Ontime" 
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-sm font-bold text-slate-700">{value}</p>
      </div>
    </div>
  );
}

function HistoryRow({ title, date, time, status }: { title: string, date: string, time: string, status: 'Ontime' | 'Delayed' | 'Absent' }) {
  const colors = {
    Ontime: 'text-emerald-600 bg-emerald-50',
    Delayed: 'text-amber-600 bg-amber-50',
    Absent: 'text-rose-600 bg-rose-50'
  };

  return (
    <div className="flex items-center justify-between p-5 rounded-2xl border border-slate-50 bg-slate-50/30 hover:border-slate-200 transition-all group">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all">
          <ClipboardList size={20} />
        </div>
        <div>
          <h5 className="text-sm font-bold text-slate-900">{title}</h5>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{date} • {time}</p>
        </div>
      </div>
      <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${colors[status]}`}>
        {status}
      </span>
    </div>
  );
}
