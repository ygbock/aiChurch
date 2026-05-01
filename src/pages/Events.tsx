import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Clock, 
  MapPin,
  Filter,
  MoreVertical,
  X,
  Loader2,
  Trash2,
  LayoutGrid,
  List,
  Search,
  Globe,
  Network,
  Warehouse,
  ChevronDown,
  Eye,
  Zap,
  Database
} from 'lucide-react';
import { format, isSameDay, parseISO } from 'date-fns';
import { useRole } from '../components/Layout';
import { useFirebase } from '../components/FirebaseProvider';
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

export default function Events() {
  const { role } = useRole();
  const { profile } = useFirebase();
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventData | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [scopeFilter, setScopeFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');

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
      handleFirestoreError(error, OperationType.LIST, 'dashboard_events');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profile]);

  const handleOpenCreateModal = () => {
    if (!isAdmin) return;
    setEditingEvent(null);
    setEventForm({
      title: '',
      description: '',
      date: format(new Date(), 'yyyy-MM-dd'),
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
      handleFirestoreError(error, editingEvent ? OperationType.UPDATE : OperationType.WRITE, 'dashboard_events');
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
      handleFirestoreError(error, OperationType.DELETE, 'dashboard_events');
    }
  };

  const filteredEvents = events.filter(e => {
    const matchesSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         e.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || e.type === categoryFilter;
    const matchesScope = scopeFilter === 'All' || 
                        (scopeFilter === 'National' && e.type === 'Conference') || 
                        (scopeFilter === 'Branch' && e.type !== 'Conference');
    return matchesSearch && matchesCategory && matchesScope;
  }).sort((a, b) => b.date.getTime() - a.date.getTime());

  const stats = [
    { label: 'Scheduled Protocols', value: events.length, icon: <CalendarIcon size={20} />, color: 'bg-blue-600', sub: 'Total Active Records' },
    { label: 'National Reach', value: events.filter(e => e.type === 'Conference').length, icon: <Globe size={20} />, color: 'bg-rose-600', sub: 'System-wide events' },
    { label: 'District Networks', value: 0, icon: <Network size={20} />, color: 'bg-amber-600', sub: 'Regional activations' },
    { label: 'Branch Operations', value: events.filter(e => e.type === 'Service').length, icon: <Warehouse size={20} />, color: 'bg-emerald-600', sub: 'Local unit activities' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 w-full mx-auto pb-20"
    >
      {/* Top Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <h1 className="text-4xl font-black text-slate-900 tracking-tight font-display italic">
              Digital <span className="text-blue-600 not-italic">Protocols</span>
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Zap size={14} className="text-blue-500 animate-pulse" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">System Orchestration & Deployment Center</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button 
            onClick={() => navigate('/calendar')}
            className="flex-1 md:flex-none h-11 bg-white border border-slate-200 text-slate-700 px-6 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-50 transition-all flex items-center justify-center gap-3 shadow-sm active:scale-95"
          >
            <CalendarIcon size={18} />
            Full Calendar View
          </button>
          
          {isAdmin && (
            <button 
              onClick={() => handleOpenCreateModal()}
              className="flex-1 md:flex-none h-11 bg-blue-600 text-white px-6 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-blue-700 transition-all flex items-center justify-center gap-3 shadow-lg shadow-blue-200 active:scale-95"
            >
              <Plus size={18} />
              Initialize Activation
            </button>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{stat.label}</p>
                <h3 className="text-3xl font-black text-slate-900 font-display">{stat.value}</h3>
              </div>
              <div className={`w-10 h-10 ${stat.color} text-white rounded-2xl flex items-center justify-center shadow-lg shadow-slate-100`}>
                {stat.icon}
              </div>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-slate-50">
              <span className="text-[9px] font-bold text-slate-400 italic lowercase">{stat.sub}</span>
              <div className="flex items-center gap-1.5 grayscale opacity-50">
                <Zap size={12} className="text-blue-500" />
                <span className="text-[9px] font-black uppercase tracking-widest">Processed</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search & Filter Section */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 group w-full">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
            <input 
              type="text" 
              placeholder="Scan Digital Protocols..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-6 py-4 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all shadow-sm"
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
             <div className="flex bg-white rounded-xl border border-slate-200 p-1 shadow-sm h-11">
              <button 
                onClick={() => setViewMode('grid')}
                className={`px-4 py-1.5 rounded-lg flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'grid' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <LayoutGrid size={16} />
                Grid
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`px-4 py-1.5 rounded-lg flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'list' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <List size={16} />
                List
              </button>
            </div>
          </div>
        </div>

        {/* Tiered Filter Bullets */}
        <div className="flex flex-wrap gap-4">
          <div className="flex flex-wrap gap-2 p-1 bg-slate-50 border border-slate-100 rounded-2xl w-fit">
            {['All', 'National', 'District', 'Branch'].map(scope => (
              <button 
                key={scope}
                onClick={() => setScopeFilter(scope)}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${scopeFilter === scope ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-500 hover:text-slate-900'}`}
              >
                {scope}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 p-1 bg-slate-50 border border-slate-100 rounded-2xl w-fit">
            <button 
              onClick={() => setCategoryFilter('All')}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${categoryFilter === 'All' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-500 hover:text-slate-900'}`}
            >
              All
            </button>
            {categories.map(cat => (
              <button 
                key={cat.label}
                onClick={() => setCategoryFilter(cat.label)}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${categoryFilter === cat.label ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-500 hover:text-slate-900'}`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main View Area */}
      <AnimatePresence mode="wait">
        <motion.div 
          key={viewMode}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          layout
          className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}
        >
          {loading ? (
            <div className="col-span-full py-20 flex flex-col items-center justify-center space-y-4">
              <Loader2 size={40} className="animate-spin text-blue-600" />
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Restoring protocol data...</p>
            </div>
          ) : filteredEvents.length > 0 ? (
            filteredEvents.map((evt) => {
              const scopeLabel = evt.type === 'Conference' ? 'NATIONAL' : 'BRANCH';
              const scopeColor = scopeLabel === 'NATIONAL' ? 'bg-rose-600' : 'bg-emerald-600';

              return (
                <motion.div 
                  layout
                  key={evt.id}
                  className={`bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden group transition-all hover:shadow-xl relative ${viewMode === 'grid' ? 'flex flex-col' : 'flex flex-col md:flex-row md:items-center'}`}
                >
                  <div className={`w-1 transition-all group-hover:w-2 ${scopeColor} absolute left-0 inset-y-0`}></div>
                  
                  <div className="p-8 flex-1">
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className={`px-3 py-1 ${scopeColor} text-white text-[9px] font-black rounded-lg tracking-widest uppercase`}>{scopeLabel}</span>
                      <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[9px] font-black rounded-lg tracking-widest uppercase border border-blue-100">{evt.type}</span>
                    </div>

                    <div className="mb-6">
                      <h3 className="text-2xl font-bold text-slate-900 font-display mb-1 group-hover:text-blue-600 transition-colors uppercase italic leading-tight">
                        {evt.title}
                      </h3>
                      {evt.description && (
                        <p className="text-sm text-slate-500 font-medium italic line-clamp-2">"{evt.description}"</p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      <div className="flex items-center gap-2">
                        <CalendarIcon size={16} className="text-blue-600" />
                        {format(evt.date, 'yyyy-MM-dd')}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-blue-600" />
                        {evt.time}
                      </div>
                      {evt.location && (
                        <div className="flex items-center gap-2">
                          <MapPin size={16} className="text-blue-600" />
                          {evt.location}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={`px-8 py-6 border-t md:border-t-0 md:border-l border-slate-50 bg-slate-50/30 flex items-center gap-3 ${viewMode === 'grid' ? 'justify-between' : 'justify-end md:w-64 shrink-0'}`}>
                    <button 
                      onClick={() => handleOpenEditModal(evt)}
                      className="bg-white border text-slate-700 px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all shadow-sm flex items-center gap-2"
                    >
                       <Eye size={16} /> View
                    </button>
                    <button 
                      onClick={() => handleOpenEditModal(evt)}
                      className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-blue-600 transition-colors"
                    >
                       <MoreVertical size={20} />
                    </button>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="col-span-full py-20 bg-slate-50/50 rounded-[3rem] border border-dashed border-slate-200 flex flex-col items-center justify-center text-center p-8">
              <div className="w-20 h-20 bg-white rounded-[2rem] shadow-sm border border-slate-100 flex items-center justify-center text-slate-300 mb-6">
                <Database size={40} strokeWidth={1} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 font-display mb-2">No Protocols Detected</h3>
              <p className="text-sm text-slate-500 font-medium max-w-sm">No activations match your current scanning parameters. Try adjusting filters or initialize a new activation.</p>
              <button 
                onClick={() => { setSearchQuery(''); setCategoryFilter('All'); setScopeFilter('All'); }}
                className="mt-6 text-blue-600 text-xs font-black uppercase tracking-[0.2em] hover:tracking-[0.3em] transition-all"
              >
                Clear Scanning Range
              </button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Unified Modals */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xl overflow-hidden relative"
            >
              <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div>
                  <h3 className="text-xl font-black text-slate-900 italic font-display lowercase tracking-tight">
                    <span className="not-italic text-blue-600 mr-2">::</span>
                    {editingEvent ? 'Edit Event' : 'Schedule New Event'}
                  </h3>
                  <p className="text-sm text-slate-500 font-medium">{editingEvent ? 'Modify existing schedule detail.' : 'Broadcast a new activity to the ministry.'}</p>
                </div>
                <button 
                  onClick={() => setShowModal(false)} 
                  className="p-2 text-slate-400 hover:text-slate-600 bg-white border border-slate-200 rounded-xl transition-all active:scale-95"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveEvent} className="p-8 space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                       Event Title <span className="text-rose-500">Required</span>
                    </label>
                    <input 
                      required type="text"
                      value={eventForm.title} onChange={e => setEventForm({...eventForm, title: e.target.value})}
                      placeholder="e.g. Total Deliverance Crusade" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Date</label>
                      <input 
                        required type="date"
                        value={eventForm.date} onChange={e => setEventForm({...eventForm, date: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Start Time</label>
                      <input 
                        required type="time"
                        value={eventForm.time} onChange={e => setEventForm({...eventForm, time: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Category</label>
                      <select 
                        value={eventForm.type} onChange={e => setEventForm({...eventForm, type: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm appearance-none"
                      >
                        {categories.map(c => <option key={c.label} value={c.label}>{c.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Location</label>
                      <input 
                        type="text"
                        value={eventForm.location} onChange={e => setEventForm({...eventForm, location: e.target.value})}
                        placeholder="e.g. Main Auditorium"
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Description</label>
                    <textarea 
                      rows={3}
                      value={eventForm.description} onChange={e => setEventForm({...eventForm, description: e.target.value})}
                      placeholder="Tell members about the event..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm resize-none"
                    ></textarea>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                   {editingEvent && (
                     <button 
                       type="button" 
                       onClick={() => handleDeleteEvent(editingEvent.id)}
                       className="w-full sm:w-auto text-rose-500 hover:text-rose-600 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 p-2"
                     >
                       <Trash2 size={16} />
                       Delete Event
                     </button>
                   )}
                   <div className="flex gap-3 w-full sm:w-auto ml-auto">
                    <button 
                      type="button" 
                      onClick={() => setShowModal(false)} 
                      className="flex-1 sm:flex-none px-6 py-3 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-2xl transition-all"
                    >
                      Dismiss
                    </button>
                    <button 
                      disabled={isSaving} 
                      type="submit" 
                      className="flex-1 sm:flex-none px-8 py-3 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-50 active:scale-95"
                    >
                      {isSaving ? 'Processing...' : (editingEvent ? 'Save Changes' : 'Schedule Event')}
                    </button>
                   </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
