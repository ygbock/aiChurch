import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
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
  User
} from 'lucide-react';
import { doc, getDoc, collection, query, where, getDocs, limit, orderBy, collectionGroup } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { format } from 'date-fns';

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
  profileImage?: string;
}

export default function MemberProfile() {
  const { memberId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [member, setMember] = useState<MemberData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('attendance');

  useEffect(() => {
    const fetchMember = async () => {
      if (!memberId) return;

      try {
        setLoading(true);
        setMember(null);
        const d = searchParams.get('districtId');
        const b = searchParams.get('branchId');

        if (d && b) {
          // Direct fetch is preferred and faster
          const docRef = doc(db, 'districts', d, 'branches', b, 'members', memberId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setMember({ id: docSnap.id, ...docSnap.data() } as MemberData);
            setLoading(false);
            return;
          }
        }

        // Fallback: search via collectionGroup logic across different possible ID fields
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <h3 className="text-xl font-bold text-slate-900 mb-2">Member Not Found</h3>
        <p className="text-slate-500 mb-6">The member you are looking for does not exist or has been removed.</p>
        <button 
          onClick={() => navigate('/members/registry')}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Back to Members
        </button>
      </div>
    );
  }

  const tabs = [
    { id: 'attendance', label: 'Attendance', icon: Users },
    { id: 'rsvps', label: 'RSVPs', icon: CalendarDays },
    { id: 'giving', label: 'Giving', icon: CircleDollarSign },
    { id: 'transfers', label: 'Transfers', icon: ArrowRightLeft },
    { id: 'timeline', label: 'Timeline', icon: History }
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <button 
          onClick={() => navigate('/members/registry')}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors group w-fit"
        >
          <div className="p-1 rounded-md group-hover:bg-slate-100">
            <ArrowLeft size={18} />
          </div>
          <span className="font-medium">Back to Members</span>
        </button>

        <div className="flex flex-wrap items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all shadow-sm">
            <ArrowRightLeft size={16} className="text-blue-500" />
            Transfer Member
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all shadow-sm">
            <Download size={16} className="text-emerald-500" />
            Export Data
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-100">
            <CreditCard size={16} />
            Digital ID Card
          </button>
        </div>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="relative group">
              <div className="w-24 md:w-32 h-24 md:h-32 rounded-3xl bg-slate-100 overflow-hidden border-4 border-white shadow-lg ring-1 ring-slate-100">
                {member.profileImage ? (
                  <img src={member.profileImage} alt={member.fullName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <Users size={48} />
                  </div>
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 p-2 bg-white rounded-xl shadow-md border border-slate-100 md:hidden">
                <Share2 size={16} className="text-slate-400" />
              </div>
            </div>

            <div className="flex-1 space-y-6">
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-center gap-3">
                  <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{member.fullName}</h1>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold border border-emerald-100 uppercase tracking-wider">
                      {member.status || 'Active'}
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold border border-blue-100 uppercase tracking-wider">
                      {member.baptismStatus === 'Approved' ? 'Baptized - DISCIPLE' : `LEVEL - ${member.level}`}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-12">
                  <div className="flex items-center gap-3 text-slate-600">
                    <div className="p-1.5 bg-slate-50 rounded-lg">
                      <Mail size={16} className="text-slate-400" />
                    </div>
                    <span className="text-sm font-medium">{member.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-600">
                    <div className="p-1.5 bg-slate-50 rounded-lg">
                      <Phone size={16} className="text-slate-400" />
                    </div>
                    <span className="text-sm font-medium">{member.phone}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-600">
                    <div className="p-1.5 bg-slate-50 rounded-lg">
                      <MapPin size={16} className="text-slate-400" />
                    </div>
                    <span className="text-sm font-medium">{member.address || 'No address provided'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-600">
                    <div className="p-1.5 bg-slate-50 rounded-lg">
                      <Calendar size={16} className="text-slate-400" />
                    </div>
                    <span className="text-sm font-medium">Joined {member.createdAt ? format(member.createdAt.toDate(), 'MMM d, yyyy') : 'Recently'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Attendance', value: '0', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Event RSVPs', value: '0', icon: CalendarDays, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Total Giving', value: 'GHS 0.00', icon: CircleDollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
            </div>
            <div className={`p-4 ${stat.bg} rounded-2xl`}>
              <stat.icon size={24} className={stat.color} />
            </div>
          </div>
        ))}
      </div>

      {/* Tabs Section */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden min-h-[400px]">
        <div className="border-b border-slate-100 bg-slate-50/50">
          <div className="flex overflow-x-auto no-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${
                  activeTab === tab.id 
                    ? 'border-blue-600 text-blue-600 bg-white' 
                    : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="text-center py-20"
            >
              <h3 className="text-2xl font-bold text-slate-900 mb-2">
                {tabs.find(t => t.id === activeTab)?.label} History
              </h3>
              <p className="text-slate-500">No {activeTab} records found for this member.</p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
