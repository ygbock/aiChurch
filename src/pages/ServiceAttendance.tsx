import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  MapPin, 
  Calendar, 
  Search, 
  CheckCircle2, 
  XCircle, 
  QrCode, 
  Loader2, 
  Scan,
  UserCheck,
  History,
  TrendingUp,
  AlertCircle,
  Menu,
  ChevronRight
} from 'lucide-react';
import { useFirebase } from '../components/FirebaseProvider';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  getDoc, 
  serverTimestamp, 
  setDoc,
  getDocs,
  orderBy,
  limit
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { format, startOfDay } from 'date-fns';
import { toast } from 'sonner';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface Member {
  id: string;
  fullName: string;
  memberId: string;
  photoUrl?: string;
  level: string;
}

interface Event {
  id: string;
  title: string;
  date: any;
  time: string;
}

export default function ServiceAttendance() {
  const { profile } = useFirebase();
  const [activeEvent, setActiveEvent] = useState<Event | null>(null);
  const [recentEvents, setRecentEvents] = useState<Event[]>([]);
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [attendance, setAttendance] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [stats, setStats] = useState({ total: 0, present: 0 });

  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    if (!profile?.districtId || !profile?.branchId) return;

    // Fetch members for quick search
    const membersPath = `districts/${profile.districtId}/branches/${profile.branchId}/members`;
    const membersQuery = query(collection(db, membersPath), orderBy('fullName', 'asc'));
    
    const unsubscribeMembers = onSnapshot(membersQuery, (snap) => {
      setAllMembers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Member)));
    });

    // Fetch recent events to select from
    const eventsPath = `districts/${profile.districtId}/branches/${profile.branchId}/events`;
    const eventsQuery = query(
      collection(db, eventsPath),
      orderBy('date', 'desc'),
      limit(5)
    );

    const unsubscribeEvents = onSnapshot(eventsQuery, (snap) => {
      const events = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event));
      setRecentEvents(events);
      if (events.length > 0 && !activeEvent) {
        setActiveEvent(events[0]);
      }
      setLoading(false);
    });

    return () => {
      unsubscribeMembers();
      unsubscribeEvents();
    };
  }, [profile]);

  useEffect(() => {
    if (!activeEvent || !profile?.districtId || !profile?.branchId) return;

    const attendancePath = `districts/${profile.districtId}/branches/${profile.branchId}/events/${activeEvent.id}/attendance`;
    const unsubscribeAttendance = onSnapshot(collection(db, attendancePath), (snap) => {
      const records: Record<string, boolean> = {};
      snap.docs.forEach(doc => {
        records[doc.id] = true;
      });
      setAttendance(records);
      setStats({ total: allMembers.length, present: snap.size });
    });

    return () => unsubscribeAttendance();
  }, [activeEvent, allMembers.length]);

  const toggleAttendance = async (member: Member) => {
    if (!activeEvent || !profile?.districtId || !profile?.branchId) return;

    const path = `districts/${profile.districtId}/branches/${profile.branchId}/events/${activeEvent.id}/attendance/${member.id}`;
    const docRef = doc(db, path);

    try {
      if (attendance[member.id]) {
        // Since we don't have a delete handler for this subpath easily, we'll just toast
        toast.info('Record already exists');
      } else {
        await setDoc(docRef, {
          memberId: member.id,
          fullName: member.fullName,
          email: '', // Should fetch if needed
          timestamp: serverTimestamp(),
          recordedBy: profile.uid,
          status: 'Present'
        });
        toast.success(`${member.fullName} marked present`);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const startScanner = () => {
    setIsScanning(true);
    setTimeout(() => {
      scannerRef.current = new Html5QrcodeScanner(
        'reader',
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );
      scannerRef.current.render(async (decodedText) => {
        // decodedText is memberId
        const member = allMembers.find(m => m.id === decodedText || m.memberId === decodedText);
        if (member) {
          await toggleAttendance(member);
          stopScanner();
        } else {
          toast.error('Identity not found in registry');
        }
      }, (err) => {
        // ignore errors
      });
    }, 100);
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear();
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  const filteredMembers = allMembers.filter(m => 
    m.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.memberId?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl shadow-slate-200 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full w-fit mb-4 border border-emerald-500/30">
               <TrendingUp size={14} />
               <span className="text-[10px] font-black uppercase tracking-widest">Real-time Stream</span>
            </div>
            <h1 className="text-4xl font-black tracking-tight italic uppercase">
              Service <span className="text-emerald-500">Attendance</span>
            </h1>
            {activeEvent && (
              <p className="text-slate-400 font-medium mt-2 flex items-center gap-2">
                <Calendar size={16} /> {activeEvent.title} — {format(new Date(activeEvent.date?.toDate ? activeEvent.date.toDate() : activeEvent.date || Date.now()), 'EEEE, MMM d')}
              </p>
            )}
          </div>

          <div className="flex items-center gap-4">
             <div className="text-center bg-white/5 border border-white/10 p-4 rounded-2xl min-w-[100px]">
                <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Present</p>
                <p className="text-2xl font-black text-emerald-400">{stats.present}</p>
             </div>
             <div className="text-center bg-white/5 border border-white/10 p-4 rounded-2xl min-w-[100px]">
                <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Rate</p>
                <p className="text-2xl font-black text-white">
                  {stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0}%
                </p>
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Column: Event Picker & Controls */}
        <div className="lg:col-span-1 space-y-6">
           <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Select Session</h3>
              <div className="space-y-2">
                 {recentEvents.map(event => (
                   <button
                     key={event.id}
                     onClick={() => setActiveEvent(event)}
                     className={`w-full p-4 rounded-2xl text-left transition-all border ${
                       activeEvent?.id === event.id 
                        ? 'bg-emerald-50 border-emerald-200' 
                        : 'bg-slate-50 border-transparent hover:bg-slate-100'
                     }`}
                   >
                     <p className={`text-sm font-bold ${activeEvent?.id === event.id ? 'text-emerald-900' : 'text-slate-900'}`}>{event.title}</p>
                     <p className="text-[10px] font-medium text-slate-500">{format(new Date(event.date?.toDate ? event.date.toDate() : event.date || Date.now()), 'MMM d, yyyy')}</p>
                   </button>
                 ))}
              </div>
           </div>

           <button 
             onClick={isScanning ? stopScanner : startScanner}
             className={`w-full py-6 rounded-[2rem] flex flex-col items-center justify-center gap-3 transition-all shadow-xl ${
               isScanning ? 'bg-rose-600 text-white shadow-rose-100' : 'bg-emerald-600 text-white shadow-emerald-100'
             }`}
           >
              {isScanning ? <XCircle size={32} /> : <Scan size={32} />}
              <span className="text-xs font-black uppercase tracking-widest">{isScanning ? 'Stop Terminal' : 'Launch Scan Radar'}</span>
           </button>
        </div>

        {/* Right Column: Registry & Search */}
        <div className="lg:col-span-3 space-y-6">
           {isScanning ? (
             <div className="bg-white p-8 rounded-[2.5rem] border-4 border-emerald-600 border-dashed flex flex-col items-center justify-center min-h-[400px]">
                <h2 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3">
                  <QrCode className="text-emerald-600 animate-pulse" />
                  IDENTITY SCANNER ACTIVE
                </h2>
                <div id="reader" className="w-full max-w-md overflow-hidden rounded-3xl" />
                <p className="mt-8 text-slate-500 font-medium italic">Place member digital ID front-and-center</p>
             </div>
           ) : (
             <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8 text-center md:text-left">
                   <div>
                     <h2 className="text-2xl font-black text-slate-900 italic uppercase">Manual <span className="text-emerald-600">Registry</span></h2>
                     <p className="text-slate-500 text-sm font-medium">Search the list of registered members to mark attendance.</p>
                   </div>
                   <div className="relative w-full md:w-80 group">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" size={18} />
                      <input 
                        type="text" 
                        placeholder="Search full name..." 
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-50 border-none rounded-2xl pl-12 pr-4 py-4 text-sm font-bold shadow-inner outline-none focus:ring-2 focus:ring-emerald-100 transition-all"
                      />
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto pr-2 no-scrollbar">
                   {filteredMembers.map(member => (
                     <div 
                       key={member.id} 
                       onClick={() => toggleAttendance(member)}
                       className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-4 group ${
                         attendance[member.id] 
                          ? 'bg-emerald-50 border-emerald-200' 
                          : 'bg-white border-slate-50 hover:border-emerald-100 hover:bg-slate-50'
                       }`}
                     >
                       <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black transition-all ${
                         attendance[member.id] ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-300 group-hover:scale-110'
                       }`}>
                         {member.fullName.charAt(0)}
                       </div>
                       <div className="flex-1 min-w-0">
                          <p className={`text-sm font-bold truncate ${attendance[member.id] ? 'text-emerald-900' : 'text-slate-900'}`}>
                            {member.fullName}
                          </p>
                          <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">{member.memberId || 'REG-ID NIL'}</p>
                       </div>
                       {attendance[member.id] && (
                         <CheckCircle2 size={24} className="text-emerald-600 shrink-0" />
                       )}
                     </div>
                   ))}
                </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
