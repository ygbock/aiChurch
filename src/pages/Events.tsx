import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  MapPin,
  Filter,
  MoreVertical,
  X,
  Loader2
} from 'lucide-react';
import { useRole } from '../components/Layout';
import { useFirebase } from '../components/FirebaseProvider';
import { collection, addDoc, onSnapshot, query, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { getScheduledEvents, ChurchEvent } from '../lib/churchSchedule';

interface EventData {
  id: string;
  title: string;
  description: string;
  date: any;
  location: string;
  type: string;
}

export default function Events() {
  const { role } = useRole();
  const { profile } = useFirebase();
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  const daysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (month: number, year: number) => new Date(year, month, 1).getDay();

  const totalDays = daysInMonth(currentDate.getMonth(), currentDate.getFullYear());
  const offset = firstDayOfMonth(currentDate.getMonth(), currentDate.getFullYear());
  
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Event Form State
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    type: 'service'
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const districtId = profile?.districtId || 'default-district';
    const branchId = profile?.branchId || 'default-branch';
    const path = `districts/${districtId}/branches/${branchId}/events`;
    
    const q = query(collection(db, path), orderBy('date', 'asc'), limit(30));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as EventData[];
      setEvents(docs);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'events');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profile]);

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title || !newEvent.date || !newEvent.time) return;

    setIsSaving(true);
    try {
      const districtId = profile?.districtId || 'default-district';
      const branchId = profile?.branchId || 'default-branch';
      const path = `districts/${districtId}/branches/${branchId}/events`;
      
      const eventDateTime = new Date(`${newEvent.date}T${newEvent.time}`);

      await addDoc(collection(db, path), {
        title: newEvent.title,
        description: newEvent.description,
        date: eventDateTime,
        location: newEvent.location,
        type: newEvent.type,
        branchId: branchId,
        createdAt: serverTimestamp()
      });

      setShowModal(false);
      setNewEvent({ title: '', description: '', date: '', time: '', location: '', type: 'service' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'events');
    } finally {
      setIsSaving(false);
    }
  };

  const calendarDays = [];
  for (let i = 0; i < offset; i++) calendarDays.push(null);
  for (let i = 1; i <= totalDays; i++) calendarDays.push(i);

  const getDayContent = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const recurring = getScheduledEvents(date);
    const custom = events.filter(e => {
      if (!e.date?.seconds) return false;
      const d = new Date(e.date.seconds * 1000);
      return d.getDate() === day && d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
    });

    return { recurring, custom };
  };

  const isToday = (day: number) => {
    const today = new Date();
    return today.getDate() === day && 
           today.getMonth() === currentDate.getMonth() && 
           today.getFullYear() === currentDate.getFullYear();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Events Calendar</h2>
          <p className="text-slate-500 text-sm">
            {role === 'admin' ? 'Schedule and manage Main Campus services and activities.' : 
             role === 'district' ? 'District-wide event coordination for North America branches.' :
             'Schedule and manage church-wide services and activities.'}
          </p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
        >
          <Plus size={18} />
          Create Event
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Calendar View */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col shadow-sm">
          <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
            <h3 className="text-base font-bold text-slate-900">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h3>
            <div className="flex items-center gap-2">
              <button 
                onClick={prevMonth}
                className="p-1.5 hover:bg-white rounded-md border border-slate-200 text-slate-600 transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <button 
                onClick={() => setCurrentDate(new Date())}
                className="px-3 py-1.5 hover:bg-white rounded-md border border-slate-200 text-xs font-bold text-slate-600 transition-colors"
              >
                Today
              </button>
              <button 
                onClick={nextMonth}
                className="p-1.5 hover:bg-white rounded-md border border-slate-200 text-slate-600 transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-7 border-b border-slate-200">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="py-3 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest border-r border-slate-100 last:border-r-0">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 flex-1">
            {calendarDays.map((day, i) => {
              if (day === null) return <div key={`empty-${i}`} className="aspect-square border-r border-b border-slate-100 bg-slate-50/50"></div>;
              
              const { recurring, custom } = getDayContent(day);
              const hasEvents = recurring.length > 0 || custom.length > 0;
              const today = isToday(day);

              return (
                <div key={day} className="aspect-square border-r border-b border-slate-100 p-2 hover:bg-slate-50 transition-colors group relative cursor-pointer">
                  <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full transition-colors ${
                    today ? 'bg-blue-600 text-white' : hasEvents ? 'text-blue-600' : 'text-slate-600'
                  }`}>
                    {day}
                  </span>
                  
                  <div className="mt-1 space-y-1">
                    {recurring.map((e, idx) => (
                      <div 
                        key={`rec-${idx}`} 
                        className="h-1 rounded-full w-full bg-blue-400/50"
                        title={e.title}
                      ></div>
                    ))}
                    {custom.map(e => (
                      <div 
                        key={e.id} 
                        className={`h-1 rounded-full w-full ${e.type === 'youth' ? 'bg-emerald-400' : e.type === 'conference' ? 'bg-purple-400' : 'bg-amber-400'}`}
                        title={e.title}
                      ></div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Event List / Sidebar */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Clock size={16} className="text-blue-600" />
              Upcoming Schedule
            </h3>
            <div className="space-y-4">
              {loading ? (
                <div className="flex justify-center p-4"><Loader2 className="animate-spin text-slate-400" /></div>
              ) : (
                <>
                  {/* Today's Recurring */}
                  {getScheduledEvents(new Date()).map((e, i) => (
                    <ScheduleItem 
                      key={`rec-today-${i}`}
                      time={e.time} 
                      title={e.title} 
                      color="bg-blue-600" 
                    />
                  ))}
                  {/* Plus custom events */}
                  {events.slice(0, 3).map(e => (
                    <ScheduleItem 
                      key={e.id}
                      time={e.date?.seconds ? new Date(e.date.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'N/A'} 
                      title={e.title} 
                      color={e.type === 'youth' ? 'bg-emerald-500' : e.type === 'conference' ? 'bg-purple-500' : 'bg-amber-500'} 
                    />
                  ))}
                  {getScheduledEvents(new Date()).length === 0 && events.length === 0 && (
                    <p className="text-xs text-slate-400">No events scheduled.</p>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Filter size={16} className="text-slate-400" />
              Categories
            </h3>
            <div className="space-y-2">
              <CategoryToggle label="Main Services" color="bg-blue-600" checked={true} />
              <CategoryToggle label="Youth Events" color="bg-emerald-500" checked={true} />
              <CategoryToggle label="Conference" color="bg-purple-500" checked={true} />
              <CategoryToggle label="Recurring Schedule" color="bg-slate-300" checked={true} />
            </div>
          </div>
        </div>
      </div>
      {/* Create Event Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-slate-900">Create New Event</h3>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSaveEvent} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Event Title *</label>
                  <input 
                    required type="text"
                    value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})}
                    placeholder="e.g. Sunday Celebration" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Date *</label>
                    <input 
                      required type="date"
                      value={newEvent.date} onChange={e => setNewEvent({...newEvent, date: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Time *</label>
                    <input 
                      required type="time"
                      value={newEvent.time} onChange={e => setNewEvent({...newEvent, time: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Type *</label>
                  <select 
                    value={newEvent.type} onChange={e => setNewEvent({...newEvent, type: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500"
                  >
                    <option value="service">Main Service</option>
                    <option value="conference">Conference</option>
                    <option value="youth">Youth Event</option>
                    <option value="meeting">Meeting</option>
                  </select>
                </div>
                <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-lg">
                    Cancel
                  </button>
                  <button disabled={isSaving} type="submit" className="px-4 py-2 text-sm font-bold bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 disabled:opacity-50">
                    {isSaving ? 'Saving...' : 'Save Event'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

interface ScheduleItemProps {
  time: string;
  title: string;
  color: string;
}

const ScheduleItem: React.FC<ScheduleItemProps> = ({ time, title, color }) => {
  return (
    <div className="flex items-start gap-3">
      <div className={`w-1 h-10 ${color} rounded-full flex-shrink-0`}></div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase">{time}</p>
        <p className="text-sm font-semibold text-slate-800">{title}</p>
      </div>
    </div>
  );
};

function CategoryToggle({ label, color, checked }: { label: string, color: string, checked: boolean }) {
  return (
    <label className="flex items-center justify-between cursor-pointer group">
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${color}`}></div>
        <span className="text-xs font-medium text-slate-600 group-hover:text-slate-900 transition-colors">{label}</span>
      </div>
      <div className={`w-8 h-4 rounded-full transition-colors relative ${checked ? 'bg-blue-100' : 'bg-slate-100'}`}>
        <div className={`absolute top-0.5 w-3 h-3 rounded-full transition-all ${checked ? 'right-0.5 bg-blue-600' : 'left-0.5 bg-slate-300'}`}></div>
      </div>
    </label>
  );
}
