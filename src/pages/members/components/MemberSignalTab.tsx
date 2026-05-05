import React, { useState, useEffect } from 'react';
import { MemberData } from '@/types/membership';
import { CalendarDays, MapPin, CheckCircle, Clock, Plus, Tag, ArrowRight } from 'lucide-react';
import { collection, query, getDocs, orderBy, limit, doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface MemberSignalTabProps {
  member: MemberData;
}

export const MemberSignalTab: React.FC<MemberSignalTabProps> = ({ member }) => {
  const [signals, setSignals] = useState<any[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  useEffect(() => {
    fetchSignals();
    fetchUpcomingEvents();
  }, [member]);

  const fetchUpcomingEvents = async () => {
    if (!member.branchId || !member.districtId) return;
    try {
      const q = query(
        collection(db, `districts/${member.districtId}/branches/${member.branchId}/events`),
        orderBy('date', 'asc'),
        limit(5)
      );
      const snapshot = await getDocs(q);
      setUpcomingEvents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error(error);
    }
  };

  const fetchSignals = async () => {
    if (!member.branchId || !member.districtId || !member.id) {
       setLoading(false);
       return;
    }
    
    setLoading(true);
    // Since Firebase doesn't easily let us query "all events this member attended" without a reverse index
    // we will simulate fetching signals from a subcollection on the member
    try {
       const q = query(
         collection(db, `districts/${member.districtId}/branches/${member.branchId}/members/${member.id}/signals`),
         orderBy('timestamp', 'desc')
       );
       const snapshot = await getDocs(q);
       setSignals(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error(error);
    } finally {
       setLoading(false);
    }
  };

  const logSignal = async (eventId: string, eventName: string, eventDate: string, rsvpType: string) => {
     if (!member.branchId || !member.districtId || !member.id) return;
     try {
        const signalRef = doc(db, `districts/${member.districtId}/branches/${member.branchId}/members/${member.id}/signals`, eventId);
        await setDoc(signalRef, {
           eventId,
           eventName,
           eventDate,
           type: rsvpType,
           timestamp: serverTimestamp()
        });

        // Also add to event attendance path (simulate check-in / RSVP)
        const eventAttendancePath = `districts/${member.districtId}/branches/${member.branchId}/events/${eventId}/attendance`;
        await setDoc(doc(db, eventAttendancePath, member.id), {
           date: new Date().toISOString(),
           timestamp: serverTimestamp(),
           status: rsvpType,
           service: eventName,
           method: 'RSVP Module',
           recordedBy: 'system'
        });

        toast.success(`RSVP updated to ${rsvpType} for ${eventName}`);
        fetchSignals();
        setExpandedEventId(null);
     } catch (error) {
       handleFirestoreError(error, OperationType.WRITE, 'signals');
     }
  };

  const cancelSignal = async (signalId: string, eventId: string) => {
     if (!member.branchId || !member.districtId || !member.id) return;
     try {
        const signalRef = doc(db, `districts/${member.districtId}/branches/${member.branchId}/members/${member.id}/signals`, signalId);
        await deleteDoc(signalRef);

        const eventAttendancePath = `districts/${member.districtId}/branches/${member.branchId}/events/${eventId}/attendance`;
        await deleteDoc(doc(db, eventAttendancePath, member.id));

        toast.success(`RSVP cancelled`);
        fetchSignals();
     } catch (error) {
       handleFirestoreError(error, OperationType.DELETE, 'signals');
     }
  };


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
          <div className="bg-blue-50 w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-blue-600 shrink-0">
             <CalendarDays className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Event Signals & RSVPs</p>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{signals.length} Signals</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         
         {/* Signals Feed */}
         <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
               <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wide">Historical Signals</h4>
            </div>
            
            {loading ? (
              <div className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">Loading...</div>
            ) : signals.length === 0 ? (
               <div className="py-20 flex flex-col items-center justify-center text-center px-4">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
                    <CalendarDays size={32} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-1">No Event Signals</h3>
                  <p className="text-slate-500 text-sm max-w-sm">
                    This member has not RSVP'd or shown active signals for any specific upcoming events.
                  </p>
               </div>
            ) : (
                <div className="divide-y divide-slate-100">
                    {signals.map(signal => {
                        let bgColor = "bg-blue-100 text-blue-600";
                        let badgeBg = "bg-blue-50 text-blue-700";
                        let statusText = "RSVP Confirmed";

                        if (signal.type === 'Attending') {
                          bgColor = "bg-emerald-100 text-emerald-600";
                          badgeBg = "bg-emerald-50 text-emerald-700";
                          statusText = "Attending";
                        } else if (signal.type === 'Interested') {
                          bgColor = "bg-amber-100 text-amber-600";
                          badgeBg = "bg-amber-50 text-amber-700";
                          statusText = "Interested";
                        } else if (signal.type === 'Not Attending') {
                          bgColor = "bg-rose-100 text-rose-600";
                          badgeBg = "bg-rose-50 text-rose-700";
                          statusText = "Declined";
                        }

                        return (
                        <div key={signal.id} className="p-5 flex items-start gap-4 hover:bg-slate-50 transition-colors border-l-2 border-transparent hover:border-blue-500 group">
                           <div className={`w-10 h-10 rounded-full ${bgColor} flex items-center justify-center shrink-0`}>
                               <CheckCircle size={18} />
                           </div>
                           <div className="flex-1 min-w-0 pt-0.5">
                              <h5 className="font-bold text-slate-900 truncate">{signal.eventName}</h5>
                              <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-1 text-xs font-medium text-slate-500">
                                 <span className="flex items-center gap-1"><Clock size={12} /> {signal.timestamp ? new Date(signal.timestamp.toMillis()).toLocaleString() : 'Just now'}</span>
                                 <span className="flex items-center gap-1"><Tag size={12} /> {signal.type || 'RSVP'}</span>
                              </div>
                           </div>
                           <div className="text-right shrink-0 flex flex-col items-end gap-2">
                              <div className={`px-3 py-1 ${badgeBg} rounded-lg text-[10px] font-black uppercase tracking-widest`}>
                                  {statusText}
                              </div>
                              <button 
                                onClick={() => cancelSignal(signal.id, signal.eventId)} 
                                className="text-[10px] text-rose-500 hover:text-rose-700 font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                Cancel
                              </button>
                           </div>
                        </div>
                    )})}
                </div>
            )}
         </div>

         {/* Upcoming Events Column */}
         <div className="space-y-6">
             <div className="bg-slate-900 rounded-3xl p-6 text-white border border-slate-800 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl -mr-16 -mt-16"></div>
                <h4 className="font-black font-display tracking-wide uppercase text-sm mb-4">Quick Engage</h4>
                <p className="text-slate-400 text-xs mb-6 font-medium">Log an interest signal or RSVP for upcoming events directly from here.</p>
                
                <div className="space-y-3 relative z-10">
                   {upcomingEvents.length === 0 ? (
                      <p className="text-slate-500 text-xs text-center py-4">No upcoming events found.</p>
                   ) : upcomingEvents.map(event => (
                      <div key={event.id} className="w-full bg-slate-800 border border-slate-700 rounded-xl overflow-hidden transition-all">
                        <button 
                           onClick={() => setExpandedEventId(expandedEventId === event.id ? null : event.id)}
                           className="w-full p-3 flex items-center justify-between text-left hover:bg-slate-700 transition-colors"
                        >
                           <div className="min-w-0 pr-2">
                               <h5 className="font-bold text-sm truncate text-slate-200">{event.name || event.title}</h5>
                               <p className="text-[10px] text-slate-400 tracking-wider uppercase mt-1">
                                  {event.date ? format(new Date(event.date), 'MMM d') : 'No Date'}
                               </p>
                           </div>
                           <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all ${expandedEventId === event.id ? 'bg-blue-500 text-white rotate-45' : 'bg-slate-700 text-slate-300 group-hover:bg-blue-500 group-hover:text-white'}`}>
                              <Plus size={16} />
                           </div>
                        </button>
                        
                        {expandedEventId === event.id && (
                           <div className="p-3 pt-0 border-t border-slate-700 flex gap-2">
                              <button onClick={() => logSignal(event.id, event.name || event.title, event.date, 'Attending')} className="flex-1 py-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors">
                                Attending
                              </button>
                              <button onClick={() => logSignal(event.id, event.name || event.title, event.date, 'Interested')} className="flex-1 py-2 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors">
                                Interested
                              </button>
                              <button onClick={() => logSignal(event.id, event.name || event.title, event.date, 'Not Attending')} className="flex-1 py-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors">
                                Decline
                              </button>
                           </div>
                        )}
                      </div>
                   ))}
                </div>
             </div>
         </div>
         
      </div>
    </div>
  );
};
