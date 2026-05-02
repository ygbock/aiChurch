import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  MapPin,
  Search,
  X,
  Loader2,
  ChevronDown,
  Trash2,
  Database,
  ArrowLeft
} from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, isToday, parseISO } from 'date-fns';
import { useFirebase } from '../components/FirebaseProvider';
import { useRole } from '../components/Layout';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { toast } from 'sonner';

interface EventData {
  id: string;
  title: string;
  description: string;
  date: any;
  time: string;
  location: string;
  type: string;
}

export default function Calendar() {
  const navigate = useNavigate();
  const { role } = useRole();
  const { profile } = useFirebase();
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [editingEvent, setEditingEvent] = useState<EventData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['Service', 'Youth', 'Conference', 'Meetings', 'Outreach']);

  // Event Form State
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    time: '09:00',
    location: '',
    type: 'Service'
  });
  const [isSaving, setIsSaving] = useState(false);

  const isAdmin = role === 'admin' || role === 'superadmin' || role === 'district';

  const categories = [
    { label: 'Service', color: 'bg-blue-500', text: 'text-blue-700' },
    { label: 'Youth', color: 'bg-emerald-500', text: 'text-emerald-700' },
    { label: 'Conference', color: 'bg-purple-500', text: 'text-purple-700' },
    { label: 'Meetings', color: 'bg-amber-500', text: 'text-amber-700' },
    { label: 'Outreach', color: 'bg-rose-500', text: 'text-rose-700' }
  ];

  useEffect(() => {
    if (!profile) return;
    const districtId = profile?.districtId || 'default-district';
    const branchId = profile?.branchId || 'default-branch';
    const path = `districts/${districtId}/branches/${branchId}/events`;
    
    const q = query(collection(db, path), orderBy('date', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => {
        const data = doc.data();
        let eventDate = data.date;
        if (eventDate?.toDate) eventDate = eventDate.toDate();
        else if (eventDate?.seconds) eventDate = new Date(eventDate.seconds * 1000);
        else if (typeof eventDate === 'string') eventDate = parseISO(eventDate);

        return {
          id: doc.id,
          ...data,
          date: eventDate
        };
      }) as EventData[];
      setEvents(docs);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'calendar_events');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profile]);

  const toggleCategory = (label: string) => {
    setSelectedCategories(prev => 
      prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
    );
  };

  const renderMiniCalendar = () => {
    const monthStart = startOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart);
    const rows = [];
    let days = [];
    let day = startDate;

    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < 7; j++) {
        const cloneDay = day;
        days.push(
          <div 
            key={day.toString()}
            onClick={() => setCurrentMonth(cloneDay)}
            className={`w-8 h-8 flex items-center justify-center text-[10px] font-medium cursor-pointer rounded-full transition-all hover:bg-slate-100 ${!isSameMonth(day, monthStart) ? 'text-slate-300' : isToday(day) ? 'bg-blue-600 text-white font-bold' : 'text-slate-600'}`}
          >
            {format(day, 'd')}
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(<div key={i} className="flex justify-between">{days}</div>);
      days = [];
    }
    return <div className="space-y-1">{rows}</div>;
  };

  const handleOpenCreateModal = (date?: Date) => {
    if (!isAdmin) return;
    setEditingEvent(null);
    setEventForm({
      title: '',
      description: '',
      date: date ? format(date, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      time: '09:00',
      location: '',
      type: 'Service'
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (event: EventData) => {
    if (!isAdmin) return;
    setEditingEvent(event);
    setEventForm({
      title: event.title,
      description: event.description || '',
      date: format(event.date, 'yyyy-MM-dd'),
      time: event.time || '09:00',
      location: event.location || '',
      type: event.type || 'Service'
    });
    setShowModal(true);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventForm.title || !eventForm.date || !eventForm.time) {
      toast.error('Please fill in required fields');
      return;
    }

    setIsSaving(true);
    try {
      const districtId = profile?.districtId || 'default-district';
      const branchId = profile?.branchId || 'default-branch';
      const path = `districts/${districtId}/branches/${branchId}/events`;
      
      const eventDateTime = new Date(`${eventForm.date}T${eventForm.time}`);

      const data = {
        title: eventForm.title,
        description: eventForm.description,
        date: eventDateTime,
        time: eventForm.time,
        location: eventForm.location,
        type: eventForm.type,
        updatedAt: serverTimestamp()
      };

      if (editingEvent) {
        await updateDoc(doc(db, path, editingEvent.id), data);
        toast.success('Event updated successfully');
      } else {
        await addDoc(collection(db, path), {
          ...data,
          branchId: branchId,
          createdAt: serverTimestamp()
        });
        toast.success('Event scheduled successfully');
      }

      setShowModal(false);
    } catch (error) {
      handleFirestoreError(error, editingEvent ? OperationType.UPDATE : OperationType.WRITE, 'calendar_events');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;

    try {
      const districtId = profile?.districtId || 'default-district';
      const branchId = profile?.branchId || 'default-branch';
      const path = `districts/${districtId}/branches/${branchId}/events`;
      
      await deleteDoc(doc(db, path, eventId));
      toast.success('Event deleted');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'calendar_events');
    }
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const dayRows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = day;
        const formattedDate = format(day, "d");
        const dayEvents = events.filter(e => isSameDay(e.date, cloneDay) && selectedCategories.includes(e.type));
        
        days.push(
          <div 
            key={day.toString()} 
            onClick={() => handleOpenCreateModal(cloneDay)}
            className={`min-h-[80px] md:min-h-[140px] p-1 md:p-2 border-r border-b border-slate-100 transition-all cursor-pointer group hover:bg-slate-50/50 ${!isSameMonth(day, monthStart) ? "bg-slate-50/20 text-slate-300 pointer-events-none opacity-40" : "bg-white"} ${isToday(day) ? "bg-blue-50/20" : ""}`}
          >
            <div className="flex flex-col items-center mb-1 md:mb-2">
              <span className={`text-[10px] md:text-[11px] font-bold w-6 h-6 md:w-7 md:h-7 flex items-center justify-center rounded-full transition-all ${isToday(day) ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}>
                {formattedDate}
              </span>
            </div>
            <div className="space-y-0.5 overflow-y-auto max-h-[50px] md:max-h-[100px] no-scrollbar">
              {dayEvents.map(evt => {
                const cat = categories.find(c => c.label === evt.type);
                return (
                  <div 
                    key={evt.id} 
                    onClick={(e) => { e.stopPropagation(); handleOpenEditModal(evt); }}
                    className={`flex items-center justify-center md:justify-start gap-1.5 p-0.5 md:px-2 md:py-0.5 rounded cursor-pointer transition-all hover:bg-slate-100 group/evt`}
                    title={`${evt.time} - ${evt.title}`}
                  >
                    <div className={`w-1.5 h-1.5 md:w-2 md:h-2 shrink-0 rounded-full ${cat?.color || 'bg-blue-500'}`}></div>
                    <span className="hidden md:inline text-[10px] font-bold text-slate-700 truncate">
                      <span className="text-slate-400 font-medium mr-1">{evt.time}</span>
                      {evt.title}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      dayRows.push(
        <div key={day.toString()} className="grid grid-cols-7">
          {days}
        </div>
      );
      days = [];
    }
    return <div className="border-t border-slate-100">{dayRows}</div>;
  };

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-white overflow-hidden">
      {/* GCal Top Header */}
      <header className="h-auto md:h-16 border-b border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between p-4 md:px-6 bg-white shrink-0 gap-4">
        <div className="flex items-center gap-3">
             <button 
                onClick={() => navigate(-1)}
                className="w-10 h-10 hover:bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center transition-colors"
             >
                <ArrowLeft size={22} />
             </button>
             <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
               <CalendarIcon size={22} />
             </div>
             <h1 className="text-xl font-bold text-slate-800 tracking-tight">Ministry Calendar</h1>
        </div>
        
        <div className="flex flex-col sm:flex-row w-full md:w-auto items-center gap-4">
          <div className="flex items-center justify-between w-full sm:w-auto">
            <button 
              onClick={() => setCurrentMonth(new Date())}
              className="px-4 py-1.5 border border-slate-200 rounded text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors hidden sm:block mr-2"
            >
              Today
            </button>
            <div className="flex items-center gap-1 mx-auto">
              <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1.5 hover:bg-slate-100 rounded-full text-slate-600 transition-colors">
                <ChevronLeft size={20} />
              </button>
              <h2 className="text-sm md:text-lg font-medium text-slate-800 mx-2 text-center whitespace-nowrap">
                {format(currentMonth, 'MMMM yyyy')}
              </h2>
              <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1.5 hover:bg-slate-100 rounded-full text-slate-600 transition-colors">
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          <div className="relative w-full sm:w-auto">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search events"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-full bg-slate-100/50 border border-transparent rounded-lg text-sm focus:bg-white focus:border-blue-500 outline-none md:w-64 transition-all"
            />
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Sidebar */}
        <aside className="w-full md:w-72 border-b md:border-b-0 md:border-r border-slate-200 bg-white p-4 flex flex-col md:gap-8 shrink-0 overflow-y-auto z-20">
          {isAdmin && (
            <button 
              onClick={() => handleOpenCreateModal()}
              className="flex items-center justify-center md:justify-start gap-3 px-6 py-3 md:py-4 bg-white border border-slate-200 rounded-xl md:rounded-full shadow-sm hover:shadow-md transition-all text-sm font-medium text-slate-700 active:scale-95 group mb-4 md:mb-0"
            >
              <Plus size={20} className="text-blue-600 md:group-hover:rotate-90 transition-transform" />
              Create Event
            </button>
          )}

          <div className="hidden md:block space-y-4 px-2">
            <div className="flex items-center justify-between mb-4">
               <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{format(currentMonth, 'MMMM yyyy')}</h3>
               <div className="flex gap-1">
                 <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1 hover:bg-slate-100 rounded-full text-slate-400"><ChevronLeft size={16} /></button>
                 <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1 hover:bg-slate-100 rounded-full text-slate-400"><ChevronRight size={16} /></button>
               </div>
            </div>
            {renderMiniCalendar()}
          </div>

          <div className="space-y-2 md:space-y-4 px-1 md:px-2">
            <h3 className="hidden md:flex text-xs font-semibold text-slate-500 uppercase tracking-wider items-center justify-between">
              My Calendars
              <ChevronDown size={14} />
            </h3>
            <div className="flex md:flex-col gap-2 md:gap-1 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
              {categories.map((cat) => (
                <label key={cat.label} className="flex items-center gap-2 md:gap-3 px-3 md:px-2 py-1.5 bg-slate-50 md:bg-transparent border border-slate-100 md:border-none rounded-full md:rounded-lg cursor-pointer group whitespace-nowrap shrink-0">
                  <input 
                    type="checkbox"
                    checked={selectedCategories.includes(cat.label)}
                    onChange={() => toggleCategory(cat.label)}
                    className="w-3.5 h-3.5 md:w-4 md:h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="text-xs md:text-sm text-slate-600 font-medium group-hover:text-slate-900 transition-colors">{cat.label}</span>
                </label>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Calendar Content */}
        <main className="flex-1 overflow-auto bg-white">
          <div className="h-full flex flex-col">
            <div className="grid grid-cols-7 border-b border-slate-200 bg-white sticky top-0 z-10 shrink-0">
              {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
                <div key={day} className="py-2 text-center text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest md:tracking-[0.2em] border-r last:border-r-0 border-slate-100/50 truncate">
                  <span className="hidden md:inline">{day}</span>
                  <span className="md:hidden">{day.charAt(0)}</span>
                </div>
              ))}
            </div>
            <div className="flex-1">
              {loading ? (
                <div className="h-full flex flex-col items-center justify-center space-y-4">
                  <Loader2 size={40} className="animate-spin text-blue-600" />
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400">Syncing with server...</p>
                </div>
              ) : (
                renderCells()
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Unified Modals */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden"
            >
              <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 font-display">
                    {editingEvent ? 'Edit Event' : 'Create Event'}
                  </h3>
                </div>
                <button 
                  onClick={() => setShowModal(false)} 
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveEvent} className="p-8 space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Event Title</label>
                    <input 
                      required type="text"
                      value={eventForm.title} onChange={e => setEventForm({...eventForm, title: e.target.value})}
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Date</label>
                      <input 
                        required type="date"
                        value={eventForm.date} onChange={e => setEventForm({...eventForm, date: e.target.value})}
                        className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Time</label>
                      <input 
                        required type="time"
                        value={eventForm.time} onChange={e => setEventForm({...eventForm, time: e.target.value})}
                        className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Category</label>
                    <select 
                      value={eventForm.type} onChange={e => setEventForm({...eventForm, type: e.target.value})}
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none"
                    >
                      {categories.map(c => <option key={c.label} value={c.label}>{c.label}</option>)}
                    </select>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-6 border-t border-slate-100">
                  {editingEvent && (
                    <button 
                      type="button" 
                      onClick={() => handleDeleteEvent(editingEvent.id)}
                      className="text-rose-500 hover:text-rose-600 text-sm font-medium flex items-center gap-2"
                    >
                      <Trash2 size={18} /> Delete
                    </button>
                  )}
                  <div className="flex gap-3 ml-auto">
                    <button 
                      type="button" 
                      onClick={() => setShowModal(false)}
                      className="px-6 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                    >
                      Cancel
                    </button>
                    <button 
                      disabled={isSaving}
                      type="submit"
                      className="px-8 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isSaving ? 'Saving...' : (editingEvent ? 'Save Changes' : 'Create Event')}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
