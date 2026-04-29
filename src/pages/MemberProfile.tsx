import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Users, 
  Clock, 
  History,
  CreditCard,
  Download,
  Share2,
  CalendarDays,
  CircleDollarSign,
  ArrowRightLeft,
  ChevronRight,
  User,
  Shield,
  Zap,
  Target,
  Layout,
  Star,
  Activity,
  Award,
  Edit
} from 'lucide-react';
import { doc, getDoc, collection, query, where, getDocs, limit, orderBy, collectionGroup } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import IDCardGenerator from '../components/IDCardGenerator';

interface MemberData {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  address?: string;
  createdAt?: any;
  level: string;
  status: string;
  baptismStatus?: string;
  isBaptised?: boolean;
  branchId?: string;
  districtId?: string;
  photoUrl?: string;
}

export default function MemberProfile() {
  const { memberId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [member, setMember] = useState<MemberData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('attendance');
  const [isIDCardModalOpen, setIsIDCardModalOpen] = useState(false);

  useEffect(() => {
    const fetchMember = async () => {
      if (!memberId) return;

      try {
        setLoading(true);
        setMember(null);
        const d = searchParams.get('districtId');
        const b = searchParams.get('branchId');

        if (d && b) {
          const docRef = doc(db, 'districts', d, 'branches', b, 'members', memberId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setMember({ id: docSnap.id, ...docSnap.data() } as MemberData);
            setLoading(false);
            return;
          }
        }

        const qByMemberId = query(collectionGroup(db, 'members'), where('memberId', '==', memberId));
        const qByUid = query(collectionGroup(db, 'members'), where('uid', '==', memberId));
        const qById = query(collectionGroup(db, 'members'), where('id', '==', memberId));

        const [snapMemberId, snapUid, snapId] = await Promise.all([
          getDocs(qByMemberId),
          getDocs(qByUid),
          getDocs(qById)
        ]);
        
        const snapshot = !snapMemberId.empty ? snapMemberId : (!snapUid.empty ? snapUid : snapId);

        if (!snapshot.empty) {
          const doc = snapshot.docs[0];
          setMember({ id: doc.id, ...doc.data() } as MemberData);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'member profile');
      } finally {
        setLoading(false);
      }
    };

    fetchMember();
  }, [memberId, searchParams]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="relative">
           <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
           <Users size={24} className="absolute inset-0 m-auto text-indigo-600" />
        </div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Retrieving Profile Integrity...</p>
      </div>
    );
  }

  if (!member) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-12 text-center bg-white rounded-[2.5rem] border border-slate-200">
        <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-300">
          <User size={40} />
        </div>
        <h3 className="text-2xl font-black text-slate-900 mb-2">Member Not Found</h3>
        <p className="text-slate-500 font-medium mb-8 max-w-sm mx-auto">The member repository does not contain an entry matching this identifier.</p>
        <button 
          onClick={() => navigate('/members/registry')}
          className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 active:scale-95"
        >
          Back to Registry
        </button>
      </motion.div>
    );
  }

  const tabs = [
    { id: 'attendance', label: 'Attendance Telemetry', icon: Activity },
    { id: 'rsvps', label: 'Event Signal', icon: CalendarDays },
    { id: 'giving', label: 'Fiscal Contributions', icon: CircleDollarSign },
    { id: 'transfers', label: 'Relocation Log', icon: ArrowRightLeft },
    { id: 'timeline', label: 'Historical Record', icon: History }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 pb-12"
    >
      {/* Top Header Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2">
        <button 
          onClick={() => navigate('/members/registry')}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-semibold">Back to Members</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <button 
            onClick={() => navigate(`/members/edit/${memberId}?districtId=${searchParams.get('districtId')}&branchId=${searchParams.get('branchId')}`)}
            className="flex items-center gap-2 px-4 sm:px-6 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-bold hover:bg-slate-50 transition-all shadow-sm flex-1 sm:flex-none justify-center"
          >
            <Edit size={14} className="sm:w-4 sm:h-4" />
            <span className="whitespace-nowrap">Edit</span>
          </button>
          <button className="flex items-center gap-2 px-4 sm:px-6 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-bold hover:bg-slate-50 transition-all shadow-sm flex-1 sm:flex-none justify-center">
            <ArrowRightLeft size={14} className="sm:w-4 sm:h-4" />
            <span className="whitespace-nowrap">Transfer</span>
          </button>
          <button className="flex items-center gap-2 px-4 sm:px-6 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-bold hover:bg-slate-50 transition-all shadow-sm flex-1 sm:flex-none justify-center">
            <Download size={14} className="sm:w-4 sm:h-4" />
            <span className="whitespace-nowrap">Export</span>
          </button>
          <button 
            onClick={() => setIsIDCardModalOpen(true)}
            className="flex items-center gap-2 px-5 sm:px-6 py-2.5 bg-[#0052cc] text-white rounded-xl text-xs sm:text-sm font-bold hover:bg-[#0047b3] transition-all shadow-md group w-full sm:w-auto justify-center"
          >
            <CreditCard size={14} className="sm:w-4 sm:h-4" />
            <span>Digital ID Card</span>
          </button>
        </div>
      </div>

      {member && (
        <IDCardGenerator 
          isOpen={isIDCardModalOpen}
          onClose={() => setIsIDCardModalOpen(false)}
          member={{
             fullName: member.fullName,
             photoUrl: member.photoUrl,
             level: member.level
          }}
        />
      )}

      {/* Main Profile Header Card */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-12">
        <div className="flex flex-col md:flex-row gap-6 sm:gap-8 items-center md:items-start tracking-tight">
          {/* Profile Image */}
          <div className="relative shrink-0">
            <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden border border-slate-100">
              {member.photoUrl ? (
                <img src={member.photoUrl} alt={member.fullName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-300">
                  <User size={64} />
                </div>
              )}
            </div>
          </div>

      <div className="flex-1 space-y-4 sm:space-y-6 text-center md:text-left w-full">
            <div>
              <div className="flex flex-col md:flex-row md:items-baseline gap-2 sm:gap-3 justify-center md:justify-start mb-3 sm:mb-4">
                <h1 className="text-3xl sm:text-5xl font-black text-[#001f3f] font-serif tracking-tight leading-none truncate">{member.fullName}</h1>
              </div>
              
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2 justify-center md:justify-start">
                <span className="px-5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold uppercase tracking-wide">
                  {member.status || "active"}
                </span>
                <span className="px-5 py-1 border border-blue-200 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wide">
                   {member.level === 'Pastor' ? 'PASTOR' : member.baptismStatus === 'Approved' ? `Baptized - ${member.level}` : member.level}
                </span>
              </div>
            </div>

            {/* Contact & Location Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 sm:gap-y-4 gap-x-12">
              <div className="flex items-center gap-3 text-slate-600 justify-center md:justify-start">
                <div className="text-blue-600 shrink-0"><Mail size={16} className="sm:w-[18px] sm:h-[18px]" /></div>
                <span className="text-xs sm:text-sm font-medium tracking-wide truncate">{member.email}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600 justify-center md:justify-start">
                <div className="text-blue-600 shrink-0"><Phone size={16} className="sm:w-[18px] sm:h-[18px]" /></div>
                <span className="text-xs sm:text-sm font-medium tracking-wide">{member.phone}</span>
              </div>
              <div className="flex items-start gap-3 text-slate-600 justify-center md:justify-start">
                <div className="text-blue-600 shrink-0 pt-0.5"><MapPin size={16} className="sm:w-[18px] sm:h-[18px]" /></div>
                <span className="text-xs sm:text-sm font-medium tracking-wide leading-relaxed text-center md:text-left">
                  {member.address || "Caritas Road Upper Allentown, Freetown, Hackney, Allentown, Freetown"}
                </span>
              </div>
              <div className="flex items-center gap-3 text-slate-600 justify-center md:justify-start">
                <div className="text-blue-600 shrink-0"><Calendar size={16} className="sm:w-[18px] sm:h-[18px]" /></div>
                <span className="text-xs sm:text-sm font-medium tracking-wide">Joined {member.createdAt ? (
                  member.createdAt.toDate ? format(member.createdAt.toDate(), 'MMM d, yyyy') : 
                  member.createdAt instanceof Date ? format(member.createdAt, 'MMM d, yyyy') :
                  typeof member.createdAt === 'string' ? format(new Date(member.createdAt), 'MMM d, yyyy') :
                  'Jan 1, 2026'
                ) : 'Jan 1, 2026'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-3 gap-2 sm:gap-6">
        <StatsCard 
          label="Attendance" 
          value="0" 
          icon={<Users size={32} className="text-blue-600" />} 
        />
        <StatsCard 
          label="Event RSVPs" 
          value="0" 
          icon={<CalendarDays size={32} className="text-blue-600" />} 
        />
        <StatsCard 
          label="Giving" 
          value="GHS 0" 
          icon={<CircleDollarSign size={32} className="text-blue-600" />} 
        />
      </div>

      {/* Tabs Menu */}
      <div className="bg-slate-100/80 rounded-2xl p-1.5 flex overflow-x-auto no-scrollbar gap-1">
        {['Attendance', 'RSVPs', 'Giving', 'Transfers'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab.toLowerCase())}
            className={`flex-1 py-3 px-6 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === tab.toLowerCase() 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-12 min-h-[400px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="mb-12">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-[0.15em] block mb-2 px-1">Timeline</span>
              <h2 className="text-4xl font-black text-[#001f3f] font-serif tracking-tight">
                {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} History
              </h2>
            </div>
            
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
               <p className="text-lg font-medium">No {activeTab} records</p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function StatsCard({ label, value, icon }: { label: string, value: string, icon: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm p-4 sm:p-8 flex justify-between items-center group hover:shadow-md transition-shadow cursor-default">
      <div className="min-w-0">
        <p className="text-slate-500 text-[10px] sm:text-sm font-semibold mb-1 sm:mb-2 truncate uppercase tracking-wider">{label}</p>
        <p className="text-xl sm:text-4xl font-black text-slate-900 leading-none">{value}</p>
      </div>
      <div className="p-2 sm:p-4 bg-slate-50 rounded-xl sm:rounded-2xl group-hover:bg-blue-50 transition-colors shrink-0 flex items-center justify-center text-blue-600 [&_svg]:w-6 [&_svg]:h-6 sm:[&_svg]:w-8 sm:[&_svg]:h-8">
        {icon}
      </div>
    </div>
  );
}

