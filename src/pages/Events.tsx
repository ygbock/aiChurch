import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  Database,
  BookOpen,
  QrCode,
  Download
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { format, isSameDay, parseISO, addYears } from 'date-fns';
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
  targetMinistry?: string;
  registrationRequired?: boolean;
  cost?: string;
  duration?: string;
  attendanceRequirement?: 'Optional' | 'Required' | 'Not Required';
  logistics?: string;
  hasFoodLodging?: boolean;
  recurrence?: {
    isRecurring: boolean;
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    days?: string[];
    until?: string;
  };
}

const STANDARD_EVENTS_DIRECTORY = [
  {
    category: "Conference/Retreat (Larger convention-style events)",
    frequency: "Yearly",
    events: [
      {
        name: "Easter Retreat",
        timing: "Every Easter season",
        audience: "Open to the public",
        registration: "Required",
        cost: "Free for public, baptised pay initial fees and contributions",
        duration: "4 to 5 days",
        attendance: "Daily attendance is optional",
        logistics: "Provide food and lodging. Tent of meeting (main tent for adults, youth tent, and children's)."
      },
      {
        name: "Christmas Retreat",
        timing: "Christmas seasons",
        audience: "Open to the public",
        registration: "Required",
        cost: "Free for public, baptised pay initial fees and contributions",
        duration: "4 to 5 days",
        attendance: "Daily attendance is optional",
        logistics: "Provide food and lodging. Tent of meeting (main tent for adults, youth tent, and children's)."
      },
      {
        name: "Worker and discipleship Retreat",
        timing: "Yearly",
        audience: "Only for baptised members",
        registration: "Required",
        cost: "Members pay initial fees and contributions",
        duration: "4 to 5 days",
        attendance: "Daily attendance is required",
        logistics: "Provide food and lodging for attendees."
      },
      {
        name: "Youth conference",
        timing: "Yearly",
        audience: "Open to the public, only for youth and young adult",
        registration: "Required",
        cost: "Free for public, baptised pay initial fees and contributions",
        duration: "4 to 5 days",
        attendance: "Daily attendance is required",
        logistics: "Provide food and lodging for attendees."
      },
      {
        name: "Leadership conference",
        timing: "Yearly",
        audience: "For pastors and leader in the church",
        registration: "Required",
        cost: "Members pay initial fees and contributions",
        duration: "4 to 5 days",
        attendance: "Daily attendance is required",
        logistics: "Provide food and lodging for attendees."
      }
    ]
  },
  {
    category: "Service (Standard church services)",
    frequency: "Yearly & Monthly",
    events: [
      {
        name: "Covenant combine service",
        timing: "First Sunday of January every year",
        audience: "All district and branches fellowship in one location. Free and open to the public.",
        registration: "No attendance and registration required",
        cost: "Free",
        duration: "One day service",
        attendance: "Not required",
        logistics: ""
      },
      {
        name: "General combined service",
        timing: "Second Sunday of every month except for January which is first Sunday",
        audience: "All district and branches fellowship in one location. Free and open to the public.",
        registration: "No attendance and registration required",
        cost: "Free",
        duration: "One day service",
        attendance: "Not required",
        logistics: ""
      },
      {
        name: "Wonder sunday (branch level)",
        timing: "First Sunday of every month except for January",
        audience: "Free and open to the public",
        registration: "Not required",
        cost: "Free",
        duration: "One day service",
        attendance: "Attendance and head count required",
        logistics: ""
      },
      {
        name: "District combined (District level)",
        timing: "First Sunday quarterly",
        audience: "All branches with a district fellowship in one location. Free and open to the public.",
        registration: "Not required",
        cost: "Free",
        duration: "One day service",
        attendance: "Attendance and head count required",
        logistics: ""
      },
      {
        name: "Solution hour",
        timing: "Every last wednesday, Thursday, and Friday of the month",
        audience: "Open to the public",
        registration: "Not required",
        cost: "Free",
        duration: "Three day revival prayer meeting",
        attendance: "Not required",
        logistics: ""
      }
    ]
  },
  {
    category: "Service (Standard church services)",
    frequency: "Weekly",
    events: [
      {
        name: "Sunday devine service",
        timing: "9am to 12pm on Sunday",
        audience: "Open to the public",
        registration: "Not required",
        cost: "Free",
        duration: "3 hours",
        attendance: "Required",
        logistics: ""
      },
      {
        name: "Tuesday Bible study",
        timing: "6-8pm on Tuesday",
        audience: "Open to the public",
        registration: "Not required",
        cost: "Free",
        duration: "2 hours",
        attendance: "Required",
        logistics: ""
      },
      {
        name: "Thursday prayer meetings",
        timing: "6-8pm on Thursday",
        audience: "Open to the public",
        registration: "Not required",
        cost: "Free",
        duration: "2 hours",
        attendance: "Required",
        logistics: ""
      },
      {
        name: "Friday night vigil",
        timing: "Friday night",
        audience: "Open to the public",
        registration: "Not required",
        cost: "Free",
        duration: "Overnight",
        attendance: "Required",
        logistics: ""
      },
      {
        name: "Saturday home fellowship",
        timing: "Saturday",
        audience: "Members",
        registration: "Not required",
        cost: "Free",
        duration: "Variable",
        attendance: "Required",
        logistics: ""
      }
    ]
  }
];

export default function Events() {
  const { role } = useRole();
  const { profile } = useFirebase();
  const navigate = useNavigate();
  const location = useLocation();
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedEventQR, setSelectedEventQR] = useState<any>(null);

  const downloadQRCode = () => {
    const canvas = document.getElementById('qr-code-canvas') as HTMLCanvasElement;
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `qr-${selectedEventQR?.title.toLowerCase().replace(/\s+/g, '-')}.png`;
      link.href = url;
      link.click();
    }
  };

  const [editingEvent, setEditingEvent] = useState<EventData | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'directory'>('grid');
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
    type: 'Service',
    targetMinistry: 'All',
    registrationRequired: false,
    cost: '',
    duration: '',
    attendanceRequirement: 'Not Required' as 'Optional' | 'Required' | 'Not Required',
    logistics: '',
    hasFoodLodging: false,
    recurrence: {
      isRecurring: false,
      frequency: 'weekly' as 'daily' | 'weekly' | 'monthly' | 'yearly',
      until: format(new Date(new Date().setMonth(new Date().getMonth() + 3)), 'yyyy-MM-dd')
    }
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
      handleFirestoreError(error, OperationType.LIST, path);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profile]);

  useEffect(() => {
    if (location.state?.createEventForMinistry && isAdmin) {
      setEditingEvent(null);
      setEventForm({
        title: '',
        description: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        time: '09:00',
        location: '',
        type: 'Service',
        targetMinistry: location.state.createEventForMinistry,
        registrationRequired: false,
        cost: '',
        duration: '',
        attendanceRequirement: 'Not Required',
        logistics: '',
        hasFoodLodging: false,
        recurrence: {
          isRecurring: false,
          frequency: 'weekly',
          until: format(new Date(new Date().setMonth(new Date().getMonth() + 3)), 'yyyy-MM-dd')
        }
      });
      setShowModal(true);
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, isAdmin, navigate, location.pathname]);

  const handleOpenCreateModal = () => {
    if (!isAdmin) return;
    setEditingEvent(null);
    setEventForm({
      title: '',
      description: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      time: '09:00',
      location: '',
      type: 'Service',
      targetMinistry: 'All',
      registrationRequired: false,
      cost: '',
      duration: '',
      attendanceRequirement: 'Not Required',
      logistics: '',
      hasFoodLodging: false,
      recurrence: {
        isRecurring: false,
        frequency: 'weekly',
        until: format(new Date(new Date().setMonth(new Date().getMonth() + 3)), 'yyyy-MM-dd')
      }
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
      type: event.type || 'Service',
      targetMinistry: event.targetMinistry || 'All',
      registrationRequired: event.registrationRequired || false,
      cost: event.cost || '',
      duration: event.duration || '',
      attendanceRequirement: event.attendanceRequirement || 'Not Required',
      logistics: event.logistics || '',
      hasFoodLodging: event.hasFoodLodging || false,
      recurrence: event.recurrence ? {
        ...event.recurrence,
        until: event.recurrence.until || format(new Date(new Date().setMonth(new Date().getMonth() + 3)), 'yyyy-MM-dd')
      } as any : {
        isRecurring: false,
        frequency: 'weekly' as any,
        until: format(new Date(new Date().setMonth(new Date().getMonth() + 3)), 'yyyy-MM-dd')
      }
    });
    setShowModal(true);
  };

  const scheduleFromDirectory = (event: any, category: string) => {
    if (!isAdmin) return;
    setEditingEvent(null);
    setEventForm({
      title: event.name,
      description: event.audience,
      date: format(new Date(), 'yyyy-MM-dd'),
      time: '09:00',
      location: '',
      type: category.includes('Retreat') ? 'Conference' : 'Service',
      targetMinistry: 'All',
      registrationRequired: event.registration?.toLowerCase().includes('required'),
      cost: event.cost,
      duration: event.duration,
      attendanceRequirement: event.attendance?.toLowerCase().includes('optional') ? 'Optional' : 
                             event.attendance?.toLowerCase().includes('required') ? 'Required' : 'Not Required',
      logistics: event.logistics,
      hasFoodLodging: event.logistics?.toLowerCase().includes('food'),
      recurrence: {
        isRecurring: false,
        frequency: 'weekly',
        until: format(new Date(new Date().setMonth(new Date().getMonth() + 3)), 'yyyy-MM-dd')
      }
    });
    setShowModal(true);
    toast.info(`Pre-filling form for ${event.name}`);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventForm.title || !eventForm.date || !eventForm.time) {
      toast.error('Please fill in required fields');
      return;
    }

    setIsSaving(true);
    const districtId = profile?.districtId || 'default-district';
    const branchId = profile?.branchId || 'default-branch';
    const path = `districts/${districtId}/branches/${branchId}/events`;

    try {
      const eventDateTime = new Date(`${eventForm.date}T${eventForm.time}`);

      const data = {
        title: eventForm.title,
        description: eventForm.description,
        date: eventDateTime,
        time: eventForm.time,
        location: eventForm.location,
        type: eventForm.type,
        targetMinistry: eventForm.targetMinistry,
        registrationRequired: eventForm.registrationRequired,
        cost: eventForm.cost,
        duration: eventForm.duration,
        attendanceRequirement: eventForm.attendanceRequirement,
        logistics: eventForm.logistics,
        hasFoodLodging: eventForm.hasFoodLodging,
        recurrence: eventForm.recurrence.isRecurring ? eventForm.recurrence : null,
        branchId: branchId,
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
      handleFirestoreError(error, editingEvent ? OperationType.UPDATE : OperationType.WRITE, path);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;

    const districtId = profile?.districtId || 'default-district';
    const branchId = profile?.branchId || 'default-branch';
    const path = `districts/${districtId}/branches/${branchId}/events`;

    try {
      await deleteDoc(doc(db, path, eventId));
      toast.success('Event deleted');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
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
            onClick={() => navigate('/calendar', { state: { fromEvents: true } })}
            className="flex-1 md:flex-none h-11 bg-white border border-slate-200 text-slate-700 px-6 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-50 transition-all flex items-center justify-center gap-3 shadow-sm active:scale-95"
          >
            <CalendarIcon size={18} />
            Calendar
          </button>
          
          {isAdmin && (
            <button 
              onClick={() => handleOpenCreateModal()}
              className="flex-1 md:flex-none h-11 bg-blue-600 text-white px-6 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-blue-700 transition-all flex items-center justify-center gap-3 shadow-lg shadow-blue-200 active:scale-95"
            >
              <Plus size={18} />
              Create Event
            </button>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-4 sm:p-6 rounded-[1.5rem] sm:rounded-3xl border border-slate-100 shadow-sm group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="flex justify-between items-start mb-2 sm:mb-4">
              <div>
                <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 sm:mb-2">{stat.label}</p>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 font-display">{stat.value}</h3>
              </div>
              <div className={`w-8 h-8 sm:w-10 sm:h-10 ${stat.color} text-white rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-slate-100 shrink-0`}>
                {React.cloneElement(stat.icon as React.ReactElement<any>, { size: 18 })}
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
          <div className="hidden md:flex items-center gap-2 w-full md:w-auto">
             <div className="flex bg-white rounded-xl border border-slate-200 p-1 shadow-sm h-11 w-full md:w-auto">
              <button 
                onClick={() => setViewMode('grid')}
                className={`flex-1 md:flex-none justify-center px-4 py-1.5 rounded-lg flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'grid' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <LayoutGrid size={16} />
                Grid
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`flex-1 md:flex-none justify-center px-4 py-1.5 rounded-lg flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'list' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <List size={16} />
                List
              </button>
              <button 
                onClick={() => setViewMode('directory')}
                className={`flex-1 md:flex-none justify-center px-4 py-1.5 rounded-lg flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'directory' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <BookOpen size={16} />
                Directory
              </button>
            </div>
          </div>
        </div>

        {/* Tiered Filter Bullets */}
        <div className="flex flex-col md:flex-row flex-wrap gap-4">
          <div className="hidden md:flex flex-wrap gap-2 p-1 bg-slate-50 border border-slate-100 rounded-2xl w-fit">
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

          <div className="flex md:hidden gap-4 w-full">
            <select 
               className="w-1/2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-700 outline-none"
               value={scopeFilter}
               onChange={(e) => setScopeFilter(e.target.value)}
            >
               {['All', 'National', 'District', 'Branch'].map(scope => (
                  <option key={scope} value={scope}>{scope}</option>
               ))}
            </select>
            
            <select 
               className="w-1/2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-700 outline-none"
               value={categoryFilter}
               onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="All">All Categories</option>
              {categories.map(cat => (
                <option key={cat.label} value={cat.label}>{cat.label}</option>
              ))}
            </select>
          </div>

          <div className="hidden md:flex flex-wrap gap-2 p-1 bg-slate-50 border border-slate-100 rounded-2xl w-fit">
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
          className={viewMode === 'grid' ? "grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6" : viewMode === 'directory' ? "col-span-full" : "space-y-4"}
        >
          {viewMode === 'directory' ? (
             <div className="col-span-full space-y-12">
               {STANDARD_EVENTS_DIRECTORY.map((categoryGroup, index) => (
                  <div key={index} className="space-y-6">
                    <div className="flex items-center gap-3 mb-6">
                       <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-display uppercase tracking-wider">{categoryGroup.category}</h2>
                       <div className="h-px bg-slate-200 flex-1"></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {categoryGroup.events.map((event, idx) => (
                         <div key={idx} className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm hover:shadow-xl transition-all h-full flex flex-col group">
                            <div className="mb-4">
                               <div className="flex justify-between items-start mb-2">
                                  <h3 className="text-lg font-bold text-slate-900 font-display uppercase italic border-b-2 border-blue-100 inline-block pb-1 group-hover:text-blue-600 transition-colors">{event.name}</h3>
                                  <span className="bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg shrink-0">{categoryGroup.frequency}</span>
                               </div>
                               <div className="flex items-center gap-1 text-[10px] text-slate-500 font-black uppercase tracking-widest italic opacity-80">
                                 <Clock size={12} /> {event.timing}
                               </div>
                            </div>
                            
                            <div className="space-y-3 flex-1 mt-2">
                               <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 transition-colors group-hover:bg-white group-hover:border-slate-200">
                                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Globe size={10} /> Audience Details</p>
                                  <p className="text-xs text-slate-700 font-bold">{event.audience}</p>
                               </div>
                               <div className="grid grid-cols-2 gap-3">
                                 <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 transition-colors group-hover:bg-white group-hover:border-slate-200">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Registration</p>
                                    <p className="text-xs text-slate-700 font-bold">{event.registration}</p>
                                 </div>
                                 <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 transition-colors group-hover:bg-white group-hover:border-slate-200">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Duration</p>
                                    <p className="text-xs text-slate-700 font-bold">{event.duration}</p>
                                 </div>
                               </div>
                               <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 transition-colors group-hover:bg-white group-hover:border-slate-200">
                                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Attendance Config</p>
                                  <p className="text-xs text-slate-700 font-bold">{event.attendance}</p>
                               </div>
                             {event.logistics && (
                                 <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50 transition-colors">
                                    <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Warehouse size={10} /> Logistics & Cost</p>
                                    <p className="text-xs text-blue-900 font-bold leading-relaxed">{event.logistics}</p>
                                    <div className="mt-2 text-[10px] text-blue-700 bg-blue-100/50 p-2 rounded-lg font-medium italic">
                                      Cost: {event.cost}
                                    </div>
                                 </div>
                               )}

                               {isAdmin && (
                                 <button 
                                   onClick={() => scheduleFromDirectory(event, categoryGroup.category)}
                                   className="w-full mt-4 bg-slate-900 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center justify-center gap-2 group"
                                 >
                                   <Zap size={14} className="text-blue-400 group-hover:text-white" /> Schedule Protocol
                                 </button>
                               )}
                            </div>
                         </div>
                      ))}
                    </div>
                  </div>
               ))}
             </div>
          ) : loading ? (
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
                  className={`bg-white rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden group transition-all hover:shadow-xl relative ${viewMode === 'grid' ? 'flex flex-col' : 'flex flex-col md:flex-row md:items-center'}`}
                >
                  <div className={`w-1 transition-all group-hover:w-2 ${scopeColor} absolute left-0 inset-y-0`}></div>
                  
                  <div className={`p-3 sm:p-5 md:p-8 flex-1 ${viewMode === 'grid' ? 'flex flex-col' : ''}`}>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-2 sm:mb-4">
                      <span className={`px-1.5 sm:px-3 py-0.5 sm:py-1 ${scopeColor} text-white text-[7px] sm:text-[9px] font-black rounded-md sm:rounded-lg tracking-widest uppercase`}>{scopeLabel}</span>
                      <span className="px-1.5 sm:px-3 py-0.5 sm:py-1 bg-blue-50 text-blue-600 text-[7px] sm:text-[9px] font-black rounded-md sm:rounded-lg tracking-widest uppercase border border-blue-100">{evt.type}</span>
                    </div>

                    <div className="mb-2 sm:mb-4 md:mb-6">
                      <h3 className="text-sm sm:text-xl md:text-2xl font-bold text-slate-900 font-display mb-1 group-hover:text-blue-600 transition-colors uppercase italic leading-tight line-clamp-2">
                        {evt.title}
                      </h3>
                      {evt.description && (
                        <p className={`text-[9px] sm:text-xs md:text-sm text-slate-500 font-medium italic ${viewMode === 'grid' ? 'hidden sm:block line-clamp-1 sm:line-clamp-2' : ''}`}>"{evt.description}"</p>
                      )}
                    </div>

                    <div className={`flex ${viewMode === 'grid' ? 'flex-col sm:flex-row sm:flex-wrap mt-auto' : 'flex-wrap items-center'} gap-1.5 sm:gap-3 md:gap-6 text-[8px] sm:text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest`}>
                      <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2">
                        <CalendarIcon className="text-blue-600 sm:w-3.5 sm:h-3.5 w-3 h-3 shrink-0" />
                        <span className="truncate">{format(evt.date, 'yyyy-MM-dd')}</span>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2">
                        <Clock className="text-blue-600 sm:w-3.5 sm:h-3.5 w-3 h-3 shrink-0" />
                        <span className="truncate">{evt.time}</span>
                      </div>
                      {evt.location && (
                        <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 w-full sm:w-auto">
                          <MapPin className="text-blue-600 sm:w-3.5 sm:h-3.5 w-3 h-3 shrink-0" />
                          <span className="truncate">{evt.location}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={`px-3 sm:px-5 md:px-8 py-3 sm:py-4 md:py-6 border-t md:border-t-0 md:border-l border-slate-50 bg-slate-50/30 flex items-center gap-1.5 sm:gap-3 ${viewMode === 'grid' ? 'justify-between' : 'justify-end md:w-80 shrink-0'}`}>
                    <button 
                      onClick={() => { setSelectedEventQR(evt); setShowQRModal(true); }}
                      className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all shrink-0 rounded-xl border border-slate-200 bg-white"
                      title="Attendance QR"
                    >
                       <QrCode className="sm:w-5 sm:h-5 w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => navigate(`/programs/${evt.id}`, { state: { fromEvent: evt.id, programName: evt.title } })}
                      className="bg-white border text-slate-700 px-3 sm:px-6 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl font-black text-[8px] sm:text-[10px] uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all shadow-sm flex items-center gap-1 sm:gap-2 justify-center flex-1 sm:flex-none"
                    >
                       <Eye className="sm:w-4 sm:h-4 w-3 h-3" /> View
                    </button>
                    <button 
                      onClick={() => handleOpenEditModal(evt)}
                      className="w-7 h-7 sm:w-10 sm:h-10 flex items-center justify-center text-slate-400 hover:text-blue-600 transition-colors shrink-0 bg-white sm:bg-transparent rounded-lg sm:rounded-none border sm:border-transparent border-slate-200"
                    >
                       <MoreVertical className="sm:w-5 sm:h-5 w-3.5 h-3.5" />
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
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-2xl sm:rounded-[2rem] shadow-2xl w-full max-w-xl overflow-hidden relative max-h-[95vh] flex flex-col"
            >
              <div className="px-5 sm:px-8 py-5 sm:py-6 border-b border-slate-100 flex justify-between items-start sm:items-center bg-slate-50/50 shrink-0 gap-4">
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 italic font-display lowercase tracking-tight">
                    <span className="not-italic text-blue-600 mr-2">::</span>
                    {editingEvent ? 'Edit Event' : 'Schedule New Event'}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium">{editingEvent ? 'Modify existing schedule detail.' : 'Broadcast a new activity to the ministry.'}</p>
                </div>
                <button 
                  onClick={() => setShowModal(false)} 
                  className="p-2 text-slate-400 hover:text-slate-600 bg-white border border-slate-200 rounded-xl transition-all active:scale-95 shrink-0"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveEvent} className="p-5 sm:p-8 space-y-6 overflow-y-auto flex-1">
                <div className="space-y-4">
                  <div>
                    <label className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                       Event Title <span className="text-rose-500">Required</span>
                    </label>
                    <input 
                      required type="text"
                      value={eventForm.title} onChange={e => setEventForm({...eventForm, title: e.target.value})}
                      placeholder="e.g. Total Deliverance Crusade" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3 sm:py-4 text-sm font-bold outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Date</label>
                      <input 
                        required type="date"
                        value={eventForm.date} onChange={e => setEventForm({...eventForm, date: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3 sm:py-4 text-sm font-bold outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Start Time</label>
                      <input 
                        required type="time"
                        value={eventForm.time} onChange={e => setEventForm({...eventForm, time: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3 sm:py-4 text-sm font-bold outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Category</label>
                      <select 
                        value={eventForm.type} onChange={e => setEventForm({...eventForm, type: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3 sm:py-4 text-sm font-bold outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm appearance-none"
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
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3 sm:py-4 text-sm font-bold outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Organizing Ministry</label>
                    <select 
                      value={eventForm.targetMinistry} onChange={e => setEventForm({...eventForm, targetMinistry: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3 sm:py-4 text-sm font-bold outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm appearance-none"
                    >
                      <option value="All">All Ministries (Church-wide)</option>
                      <option value="youth">Youth & Young Adults</option>
                      <option value="mens">Men's Ministry</option>
                      <option value="womens">Women's Ministry</option>
                      <option value="childrens">Children's Ministry</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                        <input 
                          type="checkbox" 
                          id="regReq"
                          checked={eventForm.registrationRequired}
                          onChange={e => setEventForm({...eventForm, registrationRequired: e.target.checked})}
                          className="w-5 h-5 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="regReq" className="text-[10px] font-black text-slate-700 uppercase tracking-widest cursor-pointer">Registration Required</label>
                    </div>
                    <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                        <input 
                          type="checkbox" 
                          id="foodLog"
                          checked={eventForm.hasFoodLodging}
                          onChange={e => setEventForm({...eventForm, hasFoodLodging: e.target.checked})}
                          className="w-5 h-5 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="foodLog" className="text-[10px] font-black text-slate-700 uppercase tracking-widest cursor-pointer">Food & Lodging Provided</label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Attendance Requirement</label>
                      <select 
                        value={eventForm.attendanceRequirement}
                        onChange={e => setEventForm({...eventForm, attendanceRequirement: e.target.value as any})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3 sm:py-4 text-sm font-bold outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm appearance-none"
                      >
                        <option value="Not Required">Not Required (Standard/Service)</option>
                        <option value="Optional">Optional (Conferences/Retreats)</option>
                        <option value="Required">Strictly Required (Leadership/Worker)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Cost / Contribution</label>
                      <input 
                        type="text"
                        value={eventForm.cost} onChange={e => setEventForm({...eventForm, cost: e.target.value})}
                        placeholder="e.g. Free or NLE 50"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3 sm:py-4 text-sm font-bold outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Event Duration</label>
                    <input 
                       type="text" 
                       value={eventForm.duration} onChange={e => setEventForm({...eventForm, duration: e.target.value})}
                       placeholder="e.g. 4 to 5 days or 3 hours"
                       className="w-full bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3 sm:py-4 text-sm font-bold outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Logistics Note</label>
                    <textarea 
                      rows={2}
                      value={eventForm.logistics} onChange={e => setEventForm({...eventForm, logistics: e.target.value})}
                      placeholder="Special instructions for logistics..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3 sm:py-4 text-sm font-bold outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm resize-none"
                    ></textarea>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Description</label>
                    <textarea 
                      rows={3}
                      value={eventForm.description} onChange={e => setEventForm({...eventForm, description: e.target.value})}
                      placeholder="Tell members about the event..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3 sm:py-4 text-sm font-bold outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm resize-none"
                    ></textarea>
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-4">
                        <input 
                          type="checkbox" 
                          id="isRecurring"
                          checked={eventForm.recurrence.isRecurring}
                          onChange={e => setEventForm({...eventForm, recurrence: {...eventForm.recurrence, isRecurring: e.target.checked}})}
                          className="w-5 h-5 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="isRecurring" className="text-[10px] font-black text-slate-700 uppercase tracking-widest cursor-pointer">Set as Recurring Event</label>
                    </div>

                    <AnimatePresence>
                      {eventForm.recurrence.isRecurring && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-4 overflow-hidden"
                        >
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Frequency</label>
                               <select 
                                 value={eventForm.recurrence.frequency}
                                 onChange={e => setEventForm({...eventForm, recurrence: {...eventForm.recurrence, frequency: e.target.value as any}})}
                                 className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm"
                               >
                                 <option value="daily">Daily</option>
                                 <option value="weekly">Weekly</option>
                                 <option value="monthly">Monthly</option>
                                 <option value="yearly">Yearly</option>
                               </select>
                            </div>
                            <div className={!!(eventForm.recurrence.until && parseInt(eventForm.recurrence.until.split('-')[0]) > 2060) ? 'opacity-40 pointer-events-none' : ''}>
                               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Repeat Until</label>
                               <input 
                                 type="date"
                                 value={eventForm.recurrence.until}
                                 onChange={e => setEventForm({...eventForm, recurrence: {...eventForm.recurrence, until: e.target.value}})}
                                 className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm"
                               />
                            </div>
                          </div>

                          <div className="flex items-center gap-3 bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50">
                              <input 
                                type="checkbox" 
                                id="noEndDate"
                                checked={!!(eventForm.recurrence.until && parseInt(eventForm.recurrence.until.split('-')[0]) > 2060)}
                                onChange={e => {
                                  const farFuture = format(addYears(new Date(), 50), 'yyyy-MM-dd');
                                  const defaultFuture = format(new Date(new Date().setMonth(new Date().getMonth() + 3)), 'yyyy-MM-dd');
                                  setEventForm({
                                    ...eventForm, 
                                    recurrence: {
                                      ...eventForm.recurrence, 
                                      until: e.target.checked ? farFuture : defaultFuture
                                    }
                                  })
                                }}
                                className="w-5 h-5 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500"
                              />
                              <div>
                                <label htmlFor="noEndDate" className="text-[10px] font-black text-slate-700 uppercase tracking-widest cursor-pointer block">Continuous (Permanent Event)</label>
                                <p className="text-[9px] text-blue-600/70 font-medium lowercase tracking-normal">Enable this for services that never end (e.g. Sunday Service).</p>
                              </div>
                          </div>

                          <p className="text-[10px] text-slate-400 italic">
                            {!!(eventForm.recurrence.until && parseInt(eventForm.recurrence.until.split('-')[0]) > 2060) 
                              ? "This event is marked as permanent and will persist in the system indefinitely."
                              : "This will cause the event to populate the calendar automatically until the specified date."}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 mt-6">
                   {editingEvent && (
                     <button 
                       type="button" 
                       onClick={() => handleDeleteEvent(editingEvent.id)}
                       className="w-full sm:w-auto text-rose-500 hover:text-rose-600 text-[10px] sm:text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 p-2"
                     >
                       <Trash2 size={16} />
                       Delete Event
                     </button>
                   )}
                   <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto ml-auto">
                    <button 
                      type="button" 
                      onClick={() => setShowModal(false)} 
                      className="w-full sm:w-auto flex-1 sm:flex-none px-6 py-3 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl sm:rounded-2xl transition-all"
                    >
                      Dismiss
                    </button>
                    <button 
                      disabled={isSaving} 
                      type="submit" 
                      className="w-full sm:w-auto flex-1 sm:flex-none px-6 sm:px-8 py-3 bg-blue-600 text-white rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm uppercase tracking-widest shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-50 active:scale-95"
                    >
                      {isSaving ? 'Processing...' : (editingEvent ? 'Save Changes' : 'Schedule Event')}
                    </button>
                   </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {showQRModal && selectedEventQR && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[2.5rem] shadow-2xl p-8 w-full max-w-sm text-center font-sans"
            >
              <div className="flex justify-between items-center mb-8">
                <div className="text-left">
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Event Access</h3>
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Attendance QR Key</p>
                </div>
                <button onClick={() => setShowQRModal(false)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 flex items-center justify-center mb-8">
                <div className="bg-white p-4 rounded-3xl shadow-xl shadow-blue-50">
                  <QRCodeCanvas 
                    id="qr-code-canvas"
                    value={JSON.stringify({
                      type: 'event-checkin',
                      eventId: selectedEventQR.id,
                      branchId: selectedEventQR.branchId,
                      districtId: profile?.districtId || 'district1', // Fallback for safety
                      title: selectedEventQR.title,
                      timestamp: new Date().toISOString()
                    })}
                    size={200}
                    level="H"
                    includeMargin={true}
                  />
                </div>
              </div>

              <h4 className="text-lg font-black text-slate-900 uppercase mb-2 leading-tight">{selectedEventQR.title}</h4>
              <p className="text-xs text-slate-500 font-medium mb-8 leading-relaxed px-4">
                Display this code at the venue. Members can scan this to mark their attendance automatically.
              </p>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={downloadQRCode}
                  className="w-full h-12 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95"
                >
                  <Download size={18} />
                  Download PNG
                </button>
                <button 
                  onClick={() => setShowQRModal(false)}
                  className="w-full h-12 bg-slate-50 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:text-slate-600 transition-all"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
