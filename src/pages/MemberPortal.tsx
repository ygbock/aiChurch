import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  Users, 
  Video, 
  ArrowLeftRight, 
  CheckCircle2, 
  Clock, 
  ChevronRight,
  Bell,
  Heart,
  BookOpen,
  MapPin,
  Star,
  X,
  CalendarDays,
  MessageSquare,
  Scan,
  Maximize2,
  QrCode
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { useFirebase } from '../components/FirebaseProvider';
import { collection, query, where, onSnapshot, orderBy, limit, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export default function MemberPortal() {
  const { profile } = useFirebase();
  const navigate = useNavigate();
  const [showScanner, setShowScanner] = useState(false);
  const [scannerInstance, setScannerInstance] = useState<Html5Qrcode | null>(null);

  const startScanner = async () => {
    setShowScanner(true);
    setTimeout(() => {
      const html5QrCode = new Html5Qrcode("reader");
      setScannerInstance(html5QrCode);
      html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        async (decodedText) => {
          try {
            const data = JSON.parse(decodedText);
            if (data.type === 'event-checkin') {
              await handleCheckIn(data);
              html5QrCode.stop();
              setShowScanner(false);
            }
          } catch (e) {
            console.error("Invalid QR code", e);
          }
        },
        () => {}
      ).catch(err => {
        console.error("Scanner failed to start", err);
        toast.error("Could not start camera");
      });
    }, 100);
  };

  const handleCheckIn = async (data: any) => {
    if (!profile?.uid || !db) return;
    try {
      const attendanceRef = collection(db, 'districts', data.districtId, 'branches', data.branchId, 'events', data.eventId, 'attendance');
      await updateDoc(doc(attendanceRef, profile.uid), {
        memberId: profile.uid,
        memberName: profile.fullName || 'Anonymous Member',
        timestamp: new Date().toISOString(),
        status: 'present',
        method: 'self-checkin'
      });
      // Try setDoc if updateDoc fails (it might if record doesn't exist)
    } catch (error: any) {
      // If updateDoc fails, it might be because the doc doesn't exist yet
      try {
        const attendanceRef = collection(db, 'districts', data.districtId, 'branches', data.branchId, 'events', data.eventId, 'attendance');
        const { setDoc } = await import('firebase/firestore');
        await setDoc(doc(attendanceRef, profile.uid), {
          memberId: profile.uid,
          memberName: profile.fullName || 'Anonymous Member',
          timestamp: new Date().toISOString(),
          status: 'present',
          method: 'self-checkin'
        });
        toast.success(`Check-in successful for ${data.title}`);
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `events/${data.eventId}/attendance/${profile.uid}`);
      }
    }
  };

  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const growthSteps = React.useMemo(() => {
    const steps: any[] = [];
    upcomingSessions.forEach(session => {
      if (session.growthSteps) {
        session.growthSteps.forEach((step: any) => {
          steps.push({ ...step, sessionId: session.id, sessionTitle: session.title });
        });
      }
    });
    return steps;
  }, [upcomingSessions]);

  useEffect(() => {
    if (!profile?.uid || !db) return;

    const q = query(
      collection(db, 'appointments'),
      where('requesterId', '==', profile.uid),
      where('status', 'in', ['pending', 'confirmed']),
      orderBy('date', 'asc'),
      limit(5)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sessions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUpcomingSessions(sessions);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'appointments');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profile]);

  const toggleStep = async (sessionId: string, stepId: string) => {
    if (!db) return;
    try {
      const session = upcomingSessions.find(s => s.id === sessionId);
      if (!session) return;
      
      const updatedSteps = session.growthSteps.map((s: any) => 
        s.id === stepId ? { ...s, completed: !s.completed } : s
      );
      
      await updateDoc(doc(db, 'appointments', sessionId), {
        growthSteps: updatedSteps,
        updatedAt: serverTimestamp()
      });
      toast.success('Progress updated');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `appointments/${sessionId}`);
    }
  };

  const cancelSession = async (id: string) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, 'appointments', id), {
        status: 'cancelled',
        updatedAt: serverTimestamp()
      });
      toast.success('Session cancelled');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `appointments/${id}`);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Welcome back, {profile?.fullName?.split(' ')[0] || 'Member'}!</h2>
          <p className="text-slate-500 text-sm">Here's what's happening in your church community today.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => navigate('/calendar')}
            className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg font-medium text-sm hover:bg-slate-50 transition-colors flex items-center gap-2"
          >
            <ArrowLeftRight size={18} />
            Request Transfer
          </button>
          <button 
            onClick={() => navigate('/calendar')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
          >
            <Calendar size={18} />
            Book Session
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-8">
          {/* Quick Check-in Card */}
          <section className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
              <Scan size={120} />
            </div>
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
              <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center shadow-lg shadow-blue-900/50">
                <QrCode size={40} className="text-white" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-2xl font-black uppercase tracking-tight mb-2 italic font-display">Service <span className="text-blue-500">Check-in</span></h3>
                <p className="text-slate-400 text-xs font-bold leading-relaxed max-w-sm">Scan the venue QR code to instantaneously record your presence in the digital protocols.</p>
              </div>
              <button 
                onClick={startScanner}
                className="w-full md:w-auto h-14 px-10 bg-white text-slate-900 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-blue-500 hover:text-white transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95"
              >
                <Scan size={20} />
                Initialize Scan
              </button>
            </div>
          </section>

          {/* Upcoming Sessions Widget */}
          <section>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <CalendarDays size={18} className="text-amber-500" />
                <h3 className="text-base font-bold text-slate-900">My upcoming Sessions</h3>
              </div>
              <button onClick={() => navigate('/calendar')} className="text-xs font-bold text-amber-600 hover:underline">Manage All</button>
            </div>

            <div className="space-y-3">
              {loading ? (
                <div className="bg-slate-50 rounded-2xl p-6 animate-pulse border border-slate-100 h-24"></div>
              ) : upcomingSessions.length > 0 ? (
                upcomingSessions.map((session) => (
                  <div key={session.id} className="bg-white p-4 rounded-2xl border border-slate-100 hover:border-amber-200 transition-all flex items-center gap-4 shadow-sm group relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2">
                       <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${session.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                         {session.status}
                       </span>
                    </div>
                    <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center font-black ${session.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                      <span className="text-[10px] leading-none uppercase">{format(parseISO(session.date), 'MMM')}</span>
                      <span className="text-lg leading-none">{format(parseISO(session.date), 'dd')}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 truncate">{session.title}</h4>
                      <p className="text-xs text-slate-500 flex items-center gap-2">
                        <Clock size={12} />
                        {session.time} • {session.staffName || 'Staff'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {session.status === 'pending' && (
                        <button 
                          onClick={() => cancelSession(session.id)}
                          className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                          title="Cancel Request"
                        >
                          <X size={16} />
                        </button>
                      )}
                      <ChevronRight size={16} className="text-slate-300 group-hover:text-amber-600 transition-colors" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-slate-50/50 rounded-2xl p-8 text-center border border-dashed border-slate-200">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm border border-slate-100">
                    <CalendarDays size={20} className="text-slate-300" />
                  </div>
                  <p className="text-sm font-medium text-slate-500 mb-4">No upcoming sessions scheduled.</p>
                  <button 
                    onClick={() => navigate('/calendar')}
                    className="text-xs font-bold bg-white text-amber-600 border border-amber-200 px-4 py-2 rounded-lg hover:bg-amber-50 shadow-sm transition-all active:scale-95"
                  >
                    Schedule a Session
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* Aggregated Growth Steps */}
          {growthSteps.length > 0 && (
            <section className="bg-[#2563EB]/5 p-6 rounded-[2rem] border border-[#2563EB]/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <CheckCircle2 size={120} />
              </div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Growth Tracker</h3>
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Your assigned focus steps</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-blue-600 leading-none">
                      {Math.round((growthSteps.filter(s => s.completed).length / growthSteps.length) * 100)}%
                    </p>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Completion</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {growthSteps.map((step) => (
                    <div 
                      key={`${step.sessionId}-${step.id}`}
                      className={`flex items-start gap-4 p-4 rounded-2xl border transition-all ${step.completed ? 'bg-white/50 border-emerald-100 opacity-60' : 'bg-white border-blue-100/50 shadow-sm hover:border-blue-300'}`}
                    >
                      <button 
                        onClick={() => toggleStep(step.sessionId, step.id)}
                        className={`mt-0.5 w-6 h-6 rounded-[10px] border-2 flex items-center justify-center transition-all ${step.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 hover:border-blue-400'}`}
                      >
                        {step.completed && <CheckCircle2 size={14} strokeWidth={3} />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold leading-tight ${step.completed ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{step.title}</p>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">From: {step.sessionTitle}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* My Departments & Ministries */}
          <section className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900">My Involvement</h3>
              <button className="text-xs font-bold text-blue-600">Browse More</button>
            </div>
            <div className="divide-y divide-slate-50">
              <InvolvementItem 
                title="Choir Department" 
                role="Soprano Lead" 
                nextMeeting="Tomorrow, 6:00 PM" 
                icon={<Heart className="text-rose-600" size={18} />}
              />
              <InvolvementItem 
                title="Youth Ministry" 
                role="Volunteer Mentor" 
                nextMeeting="Saturday, 2:00 PM" 
                icon={<Star className="text-blue-600" size={18} />}
              />
              <InvolvementItem 
                title="Bible School" 
                role="Student (Level 1)" 
                nextMeeting="Monday, 7:00 PM" 
                icon={<BookOpen className="text-emerald-600" size={18} />}
              />
            </div>
          </section>

          {/* Attendance History */}
          <section className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">My Attendance History</h3>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex gap-4">
                  <AttendanceStat label="Services" value="12/12" color="text-emerald-600" />
                  <AttendanceStat label="Meetings" value="8/10" color="text-blue-600" />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-slate-900">92%</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Overall Rate</p>
                </div>
              </div>
              <div className="flex gap-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-[75%]"></div>
                <div className="h-full bg-blue-500 w-[17%]"></div>
                <div className="h-full bg-slate-200 w-[8%]"></div>
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar Area */}
        <div className="space-y-6">
          {/* Announcements */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900">Announcements</h3>
              <Bell size={16} className="text-slate-400" />
            </div>
            <div className="p-4 space-y-4">
              <AnnouncementItem 
                title="New Service Times" 
                desc="Starting next month, we'll have 3 services at 8am, 10am, and 12pm." 
                time="2 hours ago" 
              />
              <AnnouncementItem 
                title="Building Project Update" 
                desc="Phase 2 of the sanctuary expansion is now complete. Thank you for your giving!" 
                time="Yesterday" 
              />
            </div>
          </div>

          {/* Live Stream Quick Access */}
          <div className="bg-red-600 rounded-xl p-6 text-white shadow-lg relative overflow-hidden group cursor-pointer">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <span className="text-[10px] font-bold uppercase tracking-widest">Live Now</span>
              </div>
              <h4 className="text-lg font-bold mb-1">Mid-week Bible Study</h4>
              <p className="text-red-100 text-sm mb-4">Join 1,240 others online</p>
              <button className="bg-white text-red-600 px-4 py-2 rounded-lg text-xs font-bold hover:bg-red-50 transition-colors flex items-center gap-2">
                Watch Stream
                <ChevronRight size={14} />
              </button>
            </div>
            <Video className="absolute -right-4 -bottom-4 text-white/10 w-32 h-32 group-hover:scale-110 transition-transform" />
          </div>

          {/* Quick Links */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Quick Links</h3>
            <div className="grid grid-cols-2 gap-3">
              <QuickLink icon={<Users size={16} />} label="Directory" onClick={() => navigate('/directory')} />
              <QuickLink icon={<MessageSquare size={16} />} label="Signals" onClick={() => navigate('/messages')} />
              <QuickLink icon={<Heart size={16} />} label="Give" />
              <QuickLink icon={<Clock size={16} />} label="History" />
              <QuickLink icon={<MapPin size={16} />} label="Branches" />
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showScanner && (
          <div className="fixed inset-0 z-[100] bg-slate-900 flex flex-col">
            <div className="p-6 flex items-center justify-between border-b border-slate-800 shrink-0">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                   <Scan size={20} className="text-white" />
                 </div>
                 <div>
                   <h3 className="text-white font-black text-lg uppercase tracking-tight">Active Scan</h3>
                   <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Mark Attendance Protocol</p>
                 </div>
               </div>
               <button 
                 onClick={() => {
                   scannerInstance?.stop();
                   setShowScanner(false);
                 }}
                 className="p-3 bg-slate-800 text-slate-400 hover:text-white rounded-2xl transition-all"
               >
                 <X size={24} />
               </button>
            </div>
            
            <div className="flex-1 relative flex items-center justify-center p-4">
              <div id="reader" className="w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl border-4 border-blue-600/20" />
              
              {/* Target Overlay */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-64 h-64 border-2 border-white/20 rounded-3xl flex items-center justify-center">
                   <div className="w-full h-[1px] bg-blue-500/50 absolute animate-[scan_2s_infinite]" />
                </div>
              </div>
            </div>

            <div className="p-10 border-t border-slate-800 text-center">
              <p className="text-slate-400 text-sm font-medium mb-2">Align the QR code within the frame</p>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Powered by FaithFlow Security</p>
            </div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function EventCard({ title, date, location, img }: { title: string, date: string, location: string, img: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm group cursor-pointer hover:border-blue-200 transition-all">
      <div className="h-32 overflow-hidden relative">
        <img src={img} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-1 rounded text-[10px] font-bold text-blue-600">
          Featured
        </div>
      </div>
      <div className="p-4">
        <h4 className="text-sm font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">{title}</h4>
        <div className="space-y-1">
          <p className="text-[10px] text-slate-500 flex items-center gap-1">
            <Calendar size={10} />
            {date}
          </p>
          <p className="text-[10px] text-slate-500 flex items-center gap-1">
            <MapPin size={10} />
            {location}
          </p>
        </div>
      </div>
    </div>
  );
}

function InvolvementItem({ title, role, nextMeeting, icon }: { title: string, role: string, nextMeeting: string, icon: React.ReactNode }) {
  return (
    <div className="px-6 py-4 hover:bg-slate-50 transition-colors flex items-center gap-4 group cursor-pointer">
      <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-white transition-colors border border-transparent group-hover:border-slate-200">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-bold text-slate-900">{title}</h4>
        <p className="text-xs text-slate-500">{role}</p>
      </div>
      <div className="text-right">
        <p className="text-[10px] font-bold text-slate-400 uppercase">Next Meeting</p>
        <p className="text-xs font-semibold text-slate-700">{nextMeeting}</p>
      </div>
      <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-600 transition-colors" />
    </div>
  );
}

function AttendanceStat({ label, value, color }: { label: string, value: string, color: string }) {
  return (
    <div>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
      <p className="text-[10px] font-bold text-slate-400 uppercase">{label}</p>
    </div>
  );
}

function AnnouncementItem({ title, desc, time }: { title: string, desc: string, time: string }) {
  return (
    <div className="space-y-1">
      <h4 className="text-xs font-bold text-slate-900">{title}</h4>
      <p className="text-[10px] text-slate-500 leading-relaxed">{desc}</p>
      <p className="text-[10px] text-slate-400 font-medium">{time}</p>
    </div>
  );
}

function QuickLink({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="flex flex-col items-center justify-center p-3 bg-slate-50 rounded-lg border border-slate-100 hover:border-blue-200 hover:bg-blue-50 transition-all group"
    >
      <div className="text-slate-400 group-hover:text-blue-600 transition-colors mb-1">
        {icon}
      </div>
      <span className="text-[10px] font-bold text-slate-600 group-hover:text-blue-600 transition-colors uppercase tracking-wider">{label}</span>
    </button>
  );
}
