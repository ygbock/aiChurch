import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  ArrowLeft,
  Menu,
  HelpCircle,
  Settings,
  Bell,
  CalendarDays,
  User,
  Check,
  MoreVertical,
  Filter
} from 'lucide-react';
import { 
  format, 
  addMonths, 
  subMonths, 
  addWeeks, 
  subWeeks, 
  addDays, 
  subDays, 
  addYears, 
  subYears, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  startOfYear, 
  endOfYear, 
  startOfDay, 
  endOfDay, 
  isSameMonth, 
  isSameDay, 
  isSameYear, 
  isToday, 
  parseISO, 
  eachDayOfInterval, 
  eachMonthOfInterval 
} from 'date-fns';
import { useFirebase } from '../components/FirebaseProvider';
import { useRole } from '../components/Layout';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, deleteDoc, doc, updateDoc, where, getDocs } from 'firebase/firestore';
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

interface Appointment {
  id: string;
  title: string;
  clientName: string;
  clientEmail?: string;
  date: string;
  time: string;
  duration: string;
  location: string;
  type: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
  staffId?: string;
  staffName?: string;
  requesterId?: string;
}

interface Reminder {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  status: 'pending' | 'completed';
  userId: string;
}

export default function Calendar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { role } = useRole();
  const { profile } = useFirebase();
  const [events, setEvents] = useState<EventData[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAppts, setLoadingAppts] = useState(false);
  const [loadingReminders, setLoadingReminders] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'year' | 'month' | 'week' | 'day' | 'appointments' | 'reminders'>('month');
  const [activeAppointmentTab, setActiveAppointmentTab] = useState<'upcoming' | 'pending' | 'past'>('upcoming');
  const [activeReminderTab, setActiveReminderTab] = useState<'all' | 'pending' | 'completed'>('pending');
  const [editingEvent, setEditingEvent] = useState<EventData | null>(null);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['Service', 'Youth', 'Conference', 'Meetings', 'Outreach', 'District', 'Weekly', 'Member Portal', 'Holidays', 'Appointment', 'Reminder']);
  const [expandedSections, setExpandedSections] = useState<string[]>(['MY CALENDARS', 'CHURCH CALENDARS', 'OTHER CALENDARS']);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showDayDetail, setShowDayDetail] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
    );
  };

  const toggleCategory = (label: string) => {
    setSelectedCategories(prev => 
      prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
    );
  };

  // Event Form State
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    time: '09:00',
    location: '',
    type: 'Service'
  });

  const [appointmentForm, setAppointmentForm] = useState({
    title: '',
    clientName: '',
    clientEmail: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    time: '10:00',
    duration: '30 mins',
    location: '',
    type: 'Consultation',
    notes: ''
  });

  const [reminderForm, setReminderForm] = useState({
    title: '',
    description: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    time: '09:00',
    status: 'pending' as 'pending' | 'completed'
  });
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [bookableStaff, setBookableStaff] = useState<any[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [bookingDate, setBookingDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [bookingForm, setBookingForm] = useState({
    title: 'Consultation Session',
    notes: ''
  });

  useEffect(() => {
    if (!db) return;
    // For now, any non-member is a potential counselor/pastor
    const q = query(collection(db, 'users'), where('role', 'in', ['admin', 'superadmin', 'district']));
    return onSnapshot(q, (snapshot) => {
       const staff = snapshot.docs
         .map(doc => ({ id: doc.id, ...doc.data() }))
         .filter((s: any) => s.id !== profile?.uid);
       setBookableStaff(staff);
    }, (err) => {
      console.warn("Failed to fetch staff:", err);
    });
  }, [db]);

  // Generate slots for a staff member on a specific date
  useEffect(() => {
    if (!bookingDate || !selectedStaff) return;

    const generateSlots = () => {
      const slots = [];
      const startHour = 9; // 9 AM
      const endHour = 17; // 5 PM
      
      // Standard 30 min slots
      for (let h = startHour; h < endHour; h++) {
        slots.push(`${h.toString().padStart(2, '0')}:00`);
        slots.push(`${h.toString().padStart(2, '0')}:30`);
      }

      // Filter out slots that conflict with existing appointments for THIS staff member
      const staffAppointments = appointments.filter(a => 
        a.staffId === selectedStaff.id && 
        a.date === bookingDate && 
        a.status !== 'cancelled'
      );

      const bookedTimes = staffAppointments.map(a => a.time);
      
      // Also filter out church events for that time? 
      // (Simplified: for now just other appointments for that staff)
      
      return slots.filter(s => !bookedTimes.includes(s));
    };

    setAvailableSlots(generateSlots());
    setSelectedSlot(null);
  }, [bookingDate, selectedStaff, appointments]);


  const updateAppointmentStatus = async (id: string, status: 'confirmed' | 'cancelled' | 'completed' | 'pending') => {
    if (!db) return;
    try {
      await updateDoc(doc(db, 'appointments', id), { 
        status,
        updatedAt: serverTimestamp() 
      });
      toast.success(`Appointment ${status}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'appointments');
    }
  };

  const isAdmin = role === 'admin' || role === 'superadmin' || role === 'district';

  const combinedEvents = React.useMemo(() => {
    const e = events
      .filter(evt => selectedCategories.includes(evt.type))
      .map(evt => ({ 
        ...evt, 
        calendarType: 'event' as const,
        status: undefined,
        original: undefined
      }));
    
    const r = reminders
      .filter(rem => selectedCategories.includes('Reminder'))
      .map(rem => ({
        id: rem.id,
        title: rem.title,
        date: parseISO(rem.date),
        time: rem.time,
        type: 'Reminder',
        calendarType: 'reminder' as const,
        status: rem.status,
        original: rem
      }));
    
    const all = [...e, ...r].sort((a, b) => {
        const dateA = a.date instanceof Date ? a.date : new Date(a.date);
        const dateB = b.date instanceof Date ? b.date : new Date(b.date);
        const diff = dateA.getTime() - dateB.getTime();
        if (diff !== 0) return diff;
        return (a.time || '').localeCompare(b.time || '');
    });

    return all;
  }, [events, reminders, selectedCategories]);

  const handleSetEventReminder = async (event: EventData) => {
    if (!profile || !db) {
      toast.error('Please sign in to set reminders');
      return;
    }

    try {
      const path = `users/${profile.uid}/reminders`;
      
      // Check if reminder already exists for this event
      // (Simple check by title and date)
      const existingQuery = query(
        collection(db, path), 
        where('title', '==', `Reminder: ${event.title}`),
        where('date', '==', format(event.date, 'yyyy-MM-dd'))
      );
      const snapshot = await getDocs(existingQuery);
      
      if (!snapshot.empty) {
        toast.info('Reminder already set for this event');
        return;
      }

      await addDoc(collection(db, path), {
        title: `Reminder: ${event.title}`,
        description: `Linked to event at ${event.location || 'Church'}`,
        date: format(event.date, 'yyyy-MM-dd'),
        time: event.time || '09:00',
        status: 'pending',
        userId: profile.uid,
        createdAt: serverTimestamp(),
        eventId: event.id // Reference back to event
      });

      toast.success('Event reminder set!');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${profile.uid}/reminders`);
    }
  };

  const categories = [
    // Church Calendars
    { label: 'Service', color: 'bg-emerald-500', section: 'CHURCH CALENDARS' },
    { label: 'Conference', color: 'bg-blue-600', section: 'CHURCH CALENDARS' },
    { label: 'Meetings', color: 'bg-amber-500', section: 'CHURCH CALENDARS' },
    { label: 'District', color: 'bg-indigo-600', section: 'CHURCH CALENDARS' },
    
    // My Calendars
    { label: 'Youth', color: 'bg-rose-500', section: 'MY CALENDARS' },
    { label: 'Weekly', color: 'bg-cyan-500', section: 'MY CALENDARS' },
    { label: 'Member Portal', color: 'bg-slate-500', section: 'MY CALENDARS' },
    { label: 'Appointment', color: 'bg-indigo-400', section: 'MY CALENDARS' },
    { label: 'Reminder', color: 'bg-rose-400', section: 'MY CALENDARS' },
    
    // Other Calendars
    { label: 'Outreach', color: 'bg-violet-500', section: 'OTHER CALENDARS' },
    { label: 'Holidays', color: 'bg-orange-400', section: 'OTHER CALENDARS' },
    { label: 'Personal Session', color: 'bg-amber-600', section: 'MY CALENDARS' }
  ];

  useEffect(() => {
    if (!profile || !role) return;
    
    let unsubscribe;
    
    // Determine path based on role
    // Superadmin: see everything? No, usually scoped to district at least.
    // If we want "all" events, and assuming events are stored in districts/{dId}/branches/{bId}/events
    // Fetching across all branches might be hard with nested collections without a collection group query.
    // However, if we assume they want to see events from their domain:
    
    const districtId = profile?.districtId || 'default-district';
    const branchId = profile?.branchId || 'default-branch';
    
    // For now, let's keep it to the current branch but clarify that "Events" module saves here too.
    // If the user wants events across branches, we'd use a different query.
    const path = `districts/${districtId}/branches/${branchId}/events`;
    
    const q = query(collection(db, path), orderBy('date', 'asc'));

    unsubscribe = onSnapshot(q, (snapshot) => {
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

  useEffect(() => {
    if (!profile || !db) return;
    
    // Admins/Districts see all (or use more granular branch filtering if needed)
    // Members only see their own bookings
    const isStaff = role === 'admin' || role === 'superadmin' || role === 'district';
    
    let q;
    if (isStaff) {
      q = query(collection(db, 'appointments'), orderBy('date', 'desc'), orderBy('time', 'asc'));
    } else {
      q = query(
        collection(db, 'appointments'), 
        where('requesterId', '==', profile.uid),
        orderBy('date', 'desc'), 
        orderBy('time', 'asc')
      );
    }

    setLoadingAppts(true);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
      setAppointments(data);
      setLoadingAppts(false);
    }, (error) => {
      if (error.message.includes('offline')) return;
      handleFirestoreError(error, OperationType.LIST, 'appointments');
      setLoadingAppts(false);
    });
    return unsubscribe;
  }, [profile, db, role]);

  useEffect(() => {
    if (!profile || !db) return;
    const path = `users/${profile.uid}/reminders`;
    const q = query(collection(db, path), orderBy('date', 'asc'), orderBy('time', 'asc'));
    setLoadingReminders(true);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Reminder));
      setReminders(data);
      setLoadingReminders(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      setLoadingReminders(false);
    });
    return unsubscribe;
  }, [profile, db]);

  const handleSaveReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !db) return;
    
    setIsSaving(true);
    try {
      const path = `users/${profile.uid}/reminders`;
      const data = {
        title: reminderForm.title,
        description: reminderForm.description,
        date: reminderForm.date,
        time: reminderForm.time,
        status: reminderForm.status,
        userId: profile.uid,
        updatedAt: serverTimestamp()
      };

      if (editingReminder) {
        await updateDoc(doc(db, path, editingReminder.id), data);
        toast.success('Reminder updated');
      } else {
        await addDoc(collection(db, path), {
          ...data,
          createdAt: serverTimestamp()
        });
        toast.success('Reminder set');
      }

      setShowReminderModal(false);
      setEditingReminder(null);
      setReminderForm({
        title: '',
        description: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        time: '09:00',
        status: 'pending'
      });
    } catch (error) {
      handleFirestoreError(error, editingReminder ? OperationType.UPDATE : OperationType.WRITE, `users/${profile.uid}/reminders`);
    } finally {
      setIsSaving(false);
    }
  };

  const updateReminderStatus = async (reminder: Reminder, status: 'pending' | 'completed') => {
    if (!profile || !db) return;
    try {
      const path = `users/${profile.uid}/reminders`;
      await updateDoc(doc(db, path, reminder.id), { status, updatedAt: serverTimestamp() });
      toast.success(`Reminder marked as ${status}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${profile.uid}/reminders/${reminder.id}`);
    }
  };

  const handleDeleteReminder = async (reminderId: string) => {
    if (!profile || !db || !window.confirm('Delete this reminder?')) return;
    try {
      const path = `users/${profile.uid}/reminders`;
      await deleteDoc(doc(db, path, reminderId));
      toast.success('Reminder deleted');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${profile.uid}/reminders/${reminderId}`);
    }
  };

  const handleSaveAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    
    setIsSaving(true);
    try {
      await addDoc(collection(db, 'appointments'), {
        ...appointmentForm,
        status: 'confirmed',
        createdAt: serverTimestamp()
      });
      
      // Also add to global events if needed or just let it exist as appointment
      // For consistency with previous implementation:
      const districtId = profile?.districtId || 'default-district';
      const branchId = profile?.branchId || 'default-branch';
      const path = `districts/${districtId}/branches/${branchId}/events`;
      
      await addDoc(collection(db, path), {
        title: `Appointment: ${appointmentForm.title} (${appointmentForm.clientName})`,
        date: new Date(`${appointmentForm.date}T${appointmentForm.time}`),
        time: appointmentForm.time,
        location: appointmentForm.location,
        type: 'Appointment',
        description: `Client: ${appointmentForm.clientName}\nNotes: ${appointmentForm.notes}`,
        createdAt: serverTimestamp()
      });

      setShowAppointmentModal(false);
      setAppointmentForm({
        title: '', clientName: '', clientEmail: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        time: '10:00', duration: '30 mins',
        location: '', type: 'Consultation', notes: ''
      });
      toast.success('Appointment scheduled successfully');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'appointments');
    } finally {
      setIsSaving(false);
    }
  };

  const renderMiniCalendar = () => {
    const monthStart = startOfMonth(currentDate);
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
                    onClick={() => {
                      setCurrentDate(cloneDay);
                      if (viewMode === 'year') setViewMode('month');
                    }}
                    className={`w-7 h-7 flex items-center justify-center text-[10px] sm:text-[11px] font-medium cursor-pointer rounded-full transition-all hover:bg-slate-100 ${!isSameMonth(day, monthStart) ? 'text-slate-200' : isToday(day) ? 'bg-[#2563EB] text-white font-bold' : 'text-slate-700'}`}
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
      date: date ? format(date, 'yyyy-MM-dd') : format(currentDate, 'yyyy-MM-dd'),
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

  const navigateCalendar = (direction: 'prev' | 'next') => {
    const amount = direction === 'next' ? 1 : -1;
    switch (viewMode) {
      case 'year':
        setCurrentDate(direction === 'next' ? addYears(currentDate, 1) : subYears(currentDate, 1));
        break;
      case 'month':
        setCurrentDate(direction === 'next' ? addMonths(currentDate, 1) : subMonths(currentDate, 1));
        break;
      case 'week':
        setCurrentDate(direction === 'next' ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1));
        break;
      case 'day':
        setCurrentDate(direction === 'next' ? addDays(currentDate, 1) : subDays(currentDate, 1));
        break;
    }
  };

  const renderYearView = () => {
    const yearStart = startOfYear(currentDate);
    const months = eachMonthOfInterval({
      start: yearStart,
      end: endOfYear(yearStart)
    });

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8 p-8 overflow-auto h-full bg-white">
        {months.map((month) => (
          <div key={month.toString()} className="space-y-4">
            <h3 
              onClick={() => {
                setCurrentDate(month);
                setViewMode('month');
              }}
              className="text-lg font-bold text-slate-800 hover:text-[#2563EB] cursor-pointer transition-colors px-2"
            >
              {format(month, 'MMMM')}
            </h3>
            <div className="flex flex-col gap-1">
              <div className="grid grid-cols-7 mb-1">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                  <div key={`${d}-${i}`} className="text-[9px] font-bold text-slate-400 text-center">{d}</div>
                ))}
              </div>
              {(() => {
                const monthStart = startOfMonth(month);
                const startDate = startOfWeek(monthStart);
                const days = [];
                let day = startDate;

                for (let i = 0; i < 42; i++) {
                  const cloneDay = day;
                  const hasEvents = combinedEvents.some(e => isSameDay(e.date, cloneDay));
                  days.push(
                    <div
                      key={day.toString()}
                      onClick={() => {
                        setCurrentDate(cloneDay);
                        setViewMode('day');
                      }}
                      className={`w-full aspect-square flex flex-col items-center justify-center text-[10px] font-medium cursor-pointer rounded-full transition-all hover:bg-slate-50 relative ${!isSameMonth(day, monthStart) ? 'text-slate-100' : isToday(day) ? 'bg-[#2563EB] text-white font-bold' : 'text-slate-600'}`}
                    >
                      {format(day, 'd')}
                      {hasEvents && isSameMonth(day, monthStart) && !isToday(day) && (
                        <div className="absolute bottom-0 w-1 h-1 bg-[#2563EB] rounded-full"></div>
                      )}
                    </div>
                  );
                  day = addDays(day, 1);
                }
                return <div className="grid grid-cols-7">{days}</div>;
              })()}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const dayRows = [];
    let days = [];
    let day = startDate;

    const handleDayClick = (clickedDay: Date) => {
      setSelectedDay(clickedDay);
      setShowDayDetail(true);
    };

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = day;
        const formattedDate = format(day, "d");
        const dayItems = combinedEvents.filter(e => isSameDay(e.date, cloneDay));
        
        days.push(
          <div 
            key={day.toString()} 
            onClick={() => handleDayClick(cloneDay)}
            className={`min-h-[80px] md:min-h-[140px] p-1 md:p-2 border-r border-b border-slate-50 transition-all cursor-pointer group hover:bg-slate-50/50 ${!isSameMonth(day, monthStart) ? "text-slate-300 opacity-40" : "bg-white"} ${isToday(day) ? "bg-[#2563EB]/5" : ""}`}
          >
            <div className="flex justify-center mb-1">
              <span className={`text-[11px] font-bold w-6 h-6 flex items-center justify-center rounded-full transition-all ${isToday(day) ? "bg-[#2563EB] text-white" : "text-slate-600 group-hover:bg-slate-100"}`}>
                {formattedDate}
              </span>
            </div>
            <div className="space-y-0.5 overflow-y-auto max-h-[100px] no-scrollbar">
              {dayItems.map(item => {
                const cat = categories.find(c => c.label === item.type);
                const isService = item.type === 'Service';
                const isReminder = item.calendarType === 'reminder';
                const isCompleted = isReminder && item.status === 'completed';

                return (
                  <div 
                    key={item.id} 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      if (isReminder) {
                        setEditingReminder(item.original);
                        setReminderForm({
                          title: item.original.title,
                          description: item.original.description || '',
                          date: item.original.date,
                          time: item.original.time,
                          status: item.original.status
                        });
                        setShowReminderModal(true);
                      } else {
                        handleOpenEditModal(item as any); 
                      }
                    }}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-md cursor-pointer transition-all hover:brightness-95 ${isService ? 'bg-[#10B981] text-white' : isReminder ? (isCompleted ? 'bg-slate-100 text-slate-400' : 'bg-rose-500 text-white') : 'bg-slate-100 text-slate-700'}`}
                    title={`${item.time} - ${item.title}`}
                  >
                    <div className={`w-1.5 h-1.5 shrink-0 rounded-full ${isService ? 'bg-white/40' : isReminder ? 'bg-white/60' : (cat?.color || 'bg-blue-500')}`}></div>
                    <span className={`text-[10px] font-bold truncate text-inherit ${isCompleted ? 'line-through' : ''}`}>
                      {item.title}
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
    return (
      <div className="h-full flex flex-col">
        <div className="grid grid-cols-7 border-b border-slate-100 bg-white sticky top-0 z-10 shrink-0">
          {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
            <div key={day} className="py-3 text-center text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider border-r last:border-r-0 border-slate-100">
              <span className="hidden sm:inline">{day}</span>
              <span className="sm:hidden">{day[0]}</span>
            </div>
          ))}
        </div>
        <div className="flex-1 border-t border-slate-100">
          {dayRows}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const startDate = startOfWeek(currentDate);
    const weekDays = eachDayOfInterval({
      start: startDate,
      end: addDays(startDate, 6)
    });

    return (
      <div className="h-full flex flex-col">
        <div className="grid grid-cols-7 border-b border-slate-100 bg-white sticky top-0 z-10 shrink-0">
          {weekDays.map(day => (
            <div 
              key={day.toString()} 
              onClick={() => {
                setCurrentDate(day);
                setViewMode('day');
              }}
              className={`py-4 text-center border-r last:border-r-0 border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors ${isToday(day) ? 'bg-[#2563EB]/5' : ''}`}
            >
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{format(day, 'EEE')}</p>
              <p className={`text-lg font-bold ${isToday(day) ? 'text-[#2563EB]' : 'text-slate-800'}`}>{format(day, 'd')}</p>
            </div>
          ))}
        </div>
        <div className="flex-1 overflow-auto grid grid-cols-7">
          {weekDays.map(day => (
            <div 
              key={day.toString()} 
              onClick={() => handleOpenCreateModal(day)}
              className={`min-h-full border-r last:border-r-0 border-slate-50 p-3 space-y-3 cursor-pointer group hover:bg-slate-50/50 ${isToday(day) ? 'bg-[#2563EB]/5' : ''}`}
            >
              {combinedEvents
                .filter(e => isSameDay(e.date, day))
                .map(item => {
                  const cat = categories.find(c => c.label === item.type);
                  const isReminder = item.calendarType === 'reminder';
                  const isCompleted = isReminder && item.status === 'completed';
                  return (
                    <div 
                      key={item.id}
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        if (isReminder) {
                          setEditingReminder(item.original as any);
                          setReminderForm({
                            title: item.original.title,
                            description: item.original.description || '',
                            date: item.original.date,
                            time: item.original.time,
                            status: item.original.status
                          });
                          setShowReminderModal(true);
                        } else {
                          handleOpenEditModal(item as any); 
                        }
                      }}
                      className={`p-3 rounded-2xl border shadow-sm transition-all hover:shadow-md hover:scale-[1.02] ${item.type === 'Service' ? 'bg-[#10B981] border-[#10B981]/20 text-white' : isReminder ? (isCompleted ? 'bg-slate-50 border-slate-100 text-slate-400' : 'bg-rose-500 border-rose-400 text-white') : 'bg-white border-slate-100 text-slate-800'}`}
                    >
                      <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${item.type === 'Service' || (isReminder && !isCompleted) ? 'text-white/60' : 'text-slate-400'}`}>
                        {item.time} • {item.type}
                      </p>
                      <h4 className={`text-xs font-bold leading-tight ${isCompleted ? 'line-through' : ''}`}>{item.title}</h4>
                      {item.calendarType === 'event' && (item as any).location && (
                        <p className={`text-[10px] mt-2 flex items-center gap-1 ${item.type === 'Service' ? 'text-white/80' : 'text-slate-500'}`}>
                          <MapPin size={10} /> {(item as any).location}
                        </p>
                      )}
                    </div>
                  );
                })}
              <div className="h-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Plus size={20} className="text-slate-300" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const dayItems = combinedEvents
      .filter(e => isSameDay(e.date, currentDate))
      .sort((a, b) => (a.time || '').localeCompare(b.time || ''));

    return (
      <div className="h-full flex flex-col bg-white overflow-auto p-4 sm:p-8">
        <div className="max-w-3xl mx-auto w-full space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-8">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-[#2563EB] text-white rounded-2xl flex flex-col items-center justify-center shadow-lg shadow-blue-100">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-80">{format(currentDate, 'MMM')}</span>
                <span className="text-2xl font-bold leading-none">{format(currentDate, 'd')}</span>
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">{format(currentDate, 'EEEE')}</h2>
                <p className="text-slate-500 font-medium">Protocol Schedule for {format(currentDate, 'LLLL d, yyyy')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => {
                  setEditingReminder(null);
                  setReminderForm({
                    title: '',
                    description: '',
                    date: format(currentDate, 'yyyy-MM-dd'),
                    time: '09:00',
                    status: 'pending'
                  });
                  setShowReminderModal(true);
                }}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-all font-bold"
              >
                <Bell size={18} /> Set Reminder
              </button>
              <button 
                onClick={() => handleOpenCreateModal(currentDate)}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-[#2563EB] text-white rounded-xl shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all font-bold"
              >
                <Plus size={18} /> Schedule Event
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {dayItems.length > 0 ? dayItems.map((item, idx) => {
              const cat = categories.find(c => c.label === item.type);
              const isReminder = item.calendarType === 'reminder';
              const isCompleted = isReminder && item.status === 'completed';

              return (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  key={item.id}
                  onClick={() => {
                    if (isReminder) {
                      setEditingReminder(item.original);
                      setReminderForm({
                        title: item.original.title,
                        description: item.original.description || '',
                        date: item.original.date,
                        time: item.original.time,
                        status: item.original.status
                      });
                      setShowReminderModal(true);
                    } else {
                      handleOpenEditModal(item as any);
                    }
                  }}
                  className={`group flex gap-6 cursor-pointer ${isCompleted ? 'opacity-50' : ''}`}
                >
                  <div className="w-20 shrink-0 text-right pt-2">
                    <p className="text-sm font-bold text-slate-900">{item.time}</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">GMT</p>
                  </div>
                  <div className="relative pt-2 pb-6">
                    <div className={`absolute top-0 bottom-0 left-0 w-1 bg-slate-100 rounded-full group-hover:bg-[#2563EB] transition-colors ${isReminder ? 'group-hover:bg-rose-500' : ''}`}></div>
                    <div className="ml-6 flex-1 bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm group-hover:shadow-xl transition-all group-hover:border-blue-100">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <span className={`text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-2 inline-block ${isReminder ? (isCompleted ? 'bg-slate-400' : 'bg-rose-500') : (cat?.color || 'bg-blue-500')}`}>
                            {item.type}
                          </span>
                          <div className="flex items-center gap-3">
                            {isReminder && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateReminderStatus(item.original as any, isCompleted ? 'pending' : 'completed');
                                }}
                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${isCompleted ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 group-hover:border-rose-300'}`}
                              >
                                {isCompleted && <Check size={12} strokeWidth={4} />}
                              </button>
                            )}
                            <h3 className={`text-xl font-bold text-slate-900 group-hover:text-[#2563EB] transition-colors ${isReminder ? 'group-hover:text-rose-500' : ''} ${isCompleted ? 'line-through text-slate-400' : ''}`}>
                              {item.title}
                            </h3>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {isReminder ? (
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleDeleteReminder(item.id); }}
                              className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                            >
                              <Trash2 size={16} />
                            </button>
                          ) : isAdmin && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleDeleteEvent(item.id); }}
                              className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </div>

                      {item.calendarType === 'event' && (
                        <div className="flex flex-wrap gap-4 text-sm text-slate-500 font-medium pb-2 border-b border-slate-50 mb-6">
                           <span className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full">
                              <Clock size={16} className="text-[#2563EB]" /> {item.time} GMT
                           </span>
                           {(item as any).location && (
                              <span className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full">
                                <MapPin size={16} className="text-[#2563EB]" /> {(item as any).location}
                              </span>
                           )}
                        </div>
                      )}

                      {isReminder && item.original?.description && (
                        <div className="text-sm text-slate-600 mb-6 bg-slate-50 p-4 rounded-xl">
                          {item.original.description}
                        </div>
                      )}

                      {!isReminder && (item as any).description && (
                        <div className="text-sm text-slate-600 mb-6 leading-relaxed bg-slate-50 p-6 rounded-2xl border border-slate-100">
                          {(item as any).description}
                        </div>
                      )}

                      {!isReminder && (
                        <div className="flex items-center gap-4">
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleSetEventReminder(item as any); }}
                            className="text-xs font-black uppercase tracking-widest text-[#2563EB] bg-[#2563EB]/5 px-4 py-2 rounded-full hover:bg-[#2563EB]/10 transition-all active:scale-95 flex items-center gap-2"
                          >
                            <Bell size={12} /> Remind Me
                          </button>
                          <button className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">
                            Share Event
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            }) : (
              <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                  <CalendarIcon size={40} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">No events scheduled</h3>
                  <p className="text-sm text-slate-500 mt-1">There are no events or reminders for this day yet.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderAppointmentsView = () => {
    const filteredAppointments = appointments.filter(appt => {
      const matchesSearch = appt.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           appt.clientName.toLowerCase().includes(searchQuery.toLowerCase());
      
      const apptDate = appt.date;
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      
      if (activeAppointmentTab === 'pending') return matchesSearch && appt.status === 'pending';
      if (activeAppointmentTab === 'upcoming') return matchesSearch && appt.status !== 'pending' && apptDate >= todayStr;
      if (activeAppointmentTab === 'past') return matchesSearch && appt.status !== 'pending' && apptDate < todayStr;
      
      return matchesSearch;
    });

    return (
      <div className="h-full flex flex-col bg-white overflow-hidden font-sans">
        {/* Appointments Header & Filter */}
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between shrink-0">
          <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
            {(['upcoming', 'pending', 'past'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveAppointmentTab(tab)}
                className={`flex-1 sm:flex-none px-4 py-1.5 rounded-[10px] text-[11px] font-black uppercase tracking-widest transition-all ${activeAppointmentTab === tab ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button 
              onClick={() => setShowAppointmentModal(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all font-bold active:scale-95"
            >
              <Plus size={18} /> Schedule
            </button>
          </div>
        </div>

        {/* Appointments List */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30 no-scrollbar">
          {loadingAppts ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="animate-spin mb-4" size={32} />
              <p className="font-bold tracking-widest uppercase text-[10px]">Syncing Schedule...</p>
            </div>
          ) : filteredAppointments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 max-w-7xl mx-auto">
              {filteredAppointments.map((appt, idx) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  key={appt.id}
                  className="bg-white rounded-[2rem] border border-slate-200 p-6 hover:shadow-xl hover:border-indigo-100 transition-all group relative overflow-hidden"
                >
                  <div className={`absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 rounded-full opacity-[0.03] pointer-events-none transition-transform group-hover:scale-150 ${appt.status === 'confirmed' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                  
                  {appt.staffName && (
                    <div className="flex items-center gap-2 mb-4 bg-amber-50/50 py-1.5 px-3 rounded-full border border-amber-100/50 w-fit">
                      <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center text-white">
                        <User size={12} />
                      </div>
                      <span className="text-[10px] font-bold text-amber-700">Guide: {appt.staffName}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-start mb-4">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                      appt.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600' : 
                      appt.status === 'pending' ? 'bg-amber-50 text-amber-600' : 
                      'bg-slate-50 text-slate-500'
                    }`}>
                      {appt.status}
                    </span>
                    <div className="flex gap-2">
                      {appt.status === 'pending' && (
                        <button 
                          onClick={() => updateAppointmentStatus(appt.id, 'confirmed')}
                          className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors"
                        >
                          <Check size={16} />
                        </button>
                      )}
                      <button className="p-2 text-slate-300 hover:text-slate-600 transition-colors">
                        <MoreVertical size={18} />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors mb-2 line-clamp-1">{appt.title}</h3>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                      <User size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 leading-none">{appt.clientName}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{appt.clientEmail || 'No email'}</p>
                    </div>
                  </div>

                  <div className="space-y-2.5 pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-3 text-slate-600">
                      <CalendarIcon size={14} className="text-indigo-400" />
                      <span className="text-[13px] font-medium">{format(parseISO(appt.date), 'EEE, MMM d, yyyy')}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-600">
                      <Clock size={14} className="text-indigo-400" />
                      <span className="text-[13px] font-medium">{appt.time} ({appt.duration})</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="py-32 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-slate-200 shadow-sm border border-slate-100 mb-6">
                <CalendarDays size={40} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-1">No appointments</h3>
              <p className="text-sm text-slate-400 max-w-sm">No scheduled items found for this filter.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderRemindersView = () => {
    const filteredReminders = reminders.filter(rem => {
      const matchesSearch = rem.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           rem.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (activeReminderTab === 'pending') return matchesSearch && rem.status === 'pending';
      if (activeReminderTab === 'completed') return matchesSearch && rem.status === 'completed';
      
      return matchesSearch;
    });

    return (
      <div className="h-full flex flex-col bg-slate-50/30 overflow-hidden font-sans">
        <div className="p-6 border-b border-slate-100 bg-white flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between shrink-0">
          <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
            {(['all', 'pending', 'completed'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveReminderTab(tab)}
                className={`flex-1 sm:flex-none px-6 py-1.5 rounded-[10px] text-[11px] font-black uppercase tracking-widest transition-all ${activeReminderTab === tab ? 'bg-white text-rose-500 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {tab}
              </button>
            ))}
          </div>

          <button 
            onClick={() => {
              setEditingReminder(null);
              setReminderForm({
                title: '',
                description: '',
                date: format(new Date(), 'yyyy-MM-dd'),
                time: '09:00',
                status: 'pending'
              });
              setShowReminderModal(true);
            }}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-rose-500 text-white rounded-xl shadow-lg shadow-rose-100 hover:bg-rose-600 transition-all font-bold active:scale-95"
          >
            <Plus size={18} /> New Reminder
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
          <div className="max-w-4xl mx-auto space-y-4">
            {loadingReminders ? (
              <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                <Loader2 className="animate-spin mb-4" size={32} />
                <p className="font-bold tracking-widest uppercase text-[10px]">Updating Reminders...</p>
              </div>
            ) : filteredReminders.length > 0 ? (
              filteredReminders.map((rem, idx) => (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  key={rem.id}
                  className={`bg-white p-4 rounded-2xl border transition-all flex items-center gap-4 group ${rem.status === 'completed' ? 'border-slate-100 opacity-60' : 'border-slate-200 hover:border-rose-100 hover:shadow-md'}`}
                >
                  <button 
                    onClick={() => updateReminderStatus(rem, rem.status === 'completed' ? 'pending' : 'completed')}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${rem.status === 'completed' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 hover:border-rose-300'}`}
                  >
                    {rem.status === 'completed' && <Check size={14} strokeWidth={3} />}
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-bold text-sm truncate ${rem.status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-900 group-hover:text-rose-500'}`}>
                      {rem.title}
                    </h3>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex items-center gap-1 text-[10px] text-slate-400">
                        <CalendarIcon size={12} />
                        <span>{format(parseISO(rem.date), 'MMM d')}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400">
                        <Clock size={12} />
                        <span>{rem.time}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => {
                        setEditingReminder(rem);
                        setReminderForm({
                          title: rem.title,
                          description: rem.description || '',
                          date: rem.date,
                          time: rem.time,
                          status: rem.status
                        });
                        setShowReminderModal(true);
                      }}
                      className="p-2 text-slate-400 hover:text-indigo-500 rounded-lg"
                    >
                      <Settings size={16} />
                    </button>
                    <button 
                      onClick={() => handleDeleteReminder(rem.id)}
                      className="p-2 text-slate-400 hover:text-rose-500 rounded-lg"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="py-32 flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-slate-200 shadow-sm border border-slate-100 mb-6">
                  <Bell size={40} />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-1">Clean slate</h3>
                <p className="text-sm text-slate-400">No reminders found for this filter.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden font-sans">
      {/* Top Header - Global App Nav */}
      <div className="h-14 border-b border-slate-100 flex items-center justify-between px-4 sm:px-6 shrink-0">
          <h2 className="text-xl sm:text-2xl font-bold text-[#002B70] tracking-tight font-display truncate">Digital Calendar Visualization</h2>
          <div className="flex items-center gap-2 sm:gap-4">
            <button 
              onClick={() => {
                if (location.state?.fromEvents) {
                  navigate('/events');
                } else {
                  navigate('/');
                }
              }}
              className="text-slate-400 hover:text-slate-600 transition-colors p-2"
            >
              <X size={24} />
            </button>
          </div>
      </div>

      {/* Calendar Toolbar */}
      <header className="h-16 border-b border-slate-200 flex items-center justify-between px-3 sm:px-6 bg-white shrink-0">
        <div className="flex items-center gap-2 sm:gap-6">
             <button 
                onClick={() => setShowSidebar(true)}
                className="p-2 hover:bg-slate-50 text-slate-500 rounded-lg lg:hidden"
             >
                <Menu size={20} />
             </button>
             <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 bg-[#2563EB] text-white rounded-full flex items-center justify-center text-xs font-bold shadow-md hidden sm:flex">
                  {format(new Date(), 'd')}
                </div>
                <h1 className="text-lg sm:text-xl font-medium text-slate-700 hidden xs:block">Calendar</h1>
             </div>
             
             <div className="h-8 w-px bg-slate-200 mx-1 sm:mx-2 hidden sm:block"></div>

             <div className="flex items-center gap-1 sm:gap-3">
                <button 
                  onClick={() => setCurrentDate(new Date())}
                  className="px-3 sm:px-5 py-1.5 border border-slate-200 rounded-lg text-xs sm:text-sm font-medium text-slate-800 hover:bg-slate-50 transition-colors"
                >
                  Today
                </button>
                <div className="flex items-center gap-1 sm:gap-2">
                  <button onClick={() => navigateCalendar('prev')} className="p-1.5 sm:p-2 hover:bg-slate-100 rounded-full text-slate-600">
                    <ChevronLeft size={18} />
                  </button>
                  <button onClick={() => navigateCalendar('next')} className="p-1.5 sm:p-2 hover:bg-slate-100 rounded-full text-slate-600">
                    <ChevronRight size={18} />
                  </button>
                </div>
             </div>
             
             <h2 className="text-sm sm:text-xl font-display font-medium text-slate-800 ml-1 sm:ml-4 whitespace-nowrap overflow-hidden">
                {viewMode === 'year' ? format(currentDate, 'yyyy') : format(currentDate, 'MMMM yyyy')}
             </h2>
        </div>
        
        <div className="flex items-center gap-1 sm:gap-4">
          <div className="hidden md:flex items-center gap-4 text-slate-400 mr-4">
            <button className="hover:text-slate-600 transition-colors p-2"><Search size={20} /></button>
            <button className="hover:text-slate-600 transition-colors p-2"><HelpCircle size={20} /></button>
            <button className="hover:text-slate-600 transition-colors p-2"><Settings size={20} /></button>
          </div>

          <div className="h-8 w-px bg-slate-200 mx-1 hidden sm:block"></div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative">
              <select 
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value as any)}
                className="flex items-center gap-2 px-4 py-1.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-800 hover:bg-slate-50 min-w-[100px] outline-none appearance-none cursor-pointer pr-8"
              >
                <option value="year">Year</option>
                <option value="month">Month</option>
                <option value="week">Week</option>
                <option value="day">Day</option>
                <option value="appointments">Appointments</option>
                <option value="reminders">Reminders</option>
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500" />
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600 border border-slate-200 shrink-0">
              {profile?.fullName?.split(' ').map(n => n[0]).join('') || 'FF'}
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {showSidebar && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSidebar(false)}
              className="lg:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
            />
          )}
        </AnimatePresence>

        {/* Sidebar */}
        <aside className={`
          fixed lg:relative inset-y-0 left-0 w-72 border-r border-slate-200 bg-white flex flex-col shrink-0 overflow-y-auto no-scrollbar py-6 px-6 z-50 transition-transform duration-300 transform 
          ${showSidebar ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <div className="flex items-center justify-between mb-8 lg:hidden">
            <h2 className="text-xl font-bold text-slate-800">Menu</h2>
            <button onClick={() => setShowSidebar(false)} className="p-2 text-slate-400">
              <X size={20} />
            </button>
          </div>
          <div className="mb-8">
            <div className="grid grid-cols-7 mb-2">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <div key={`${d}-${i}`} className="text-[10px] font-bold text-slate-400 text-center">{d}</div>
              ))}
            </div>
            {renderMiniCalendar()}
          </div>

          <div className="space-y-6">
            {[
              { id: 'MY CALENDARS' },
              { id: 'CHURCH CALENDARS' },
              { id: 'OTHER CALENDARS' }
            ].map(section => (
              <div key={section.id} className="space-y-3">
                <button 
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center justify-between text-[11px] font-black text-slate-500 tracking-widest uppercase"
                >
                  {section.id}
                  <ChevronDown size={14} className={`transition-transform ${expandedSections.includes(section.id) ? '' : '-rotate-90'}`} />
                </button>
                
                <AnimatePresence>
                  {expandedSections.includes(section.id) && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="space-y-1 overflow-hidden"
                    >
                      {categories
                        .filter(cat => cat.section === section.id)
                        .map((cat) => (
                          <label key={cat.label} className="flex items-center gap-3 py-1.5 cursor-pointer group">
                            <input 
                              type="checkbox"
                              checked={selectedCategories.includes(cat.label)}
                              onChange={() => toggleCategory(cat.label)}
                              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer border-slate-300"
                            />
                            <div className={`w-2 h-2 rounded-full ${cat.color}`}></div>
                            <span className="text-[13px] text-slate-600 font-medium group-hover:text-slate-900 transition-colors">{cat.label}</span>
                          </label>
                        ))
                      }
                      {categories.filter(cat => cat.section === section.id).length === 0 && (
                        <div className="pl-7 text-[13px] text-slate-400 italic py-1">No additional layers</div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

          <div className="mt-auto pt-6 border-t border-slate-100 relative px-2">
            <button 
              onClick={() => setIsActionMenuOpen(!isActionMenuOpen)}
              className={`w-full flex items-center justify-center gap-3 px-4 py-4 rounded-2xl transition-all text-sm font-black active:scale-95 shadow-xl ${isActionMenuOpen ? 'bg-slate-900 text-white shadow-slate-200' : 'bg-[#2563EB] text-white shadow-blue-100 hover:bg-blue-700'}`}
            >
              <Plus size={20} className={`transition-transform duration-300 ${isActionMenuOpen ? 'rotate-45' : ''}`} />
              Quick Action
              <ChevronDown size={14} className={`ml-auto transition-transform duration-300 ${isActionMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {isActionMenuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-[60]" 
                    onClick={() => setIsActionMenuOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute bottom-full left-0 w-full mb-3 bg-white rounded-[24px] shadow-2xl border border-slate-100 p-2 z-[70] overflow-hidden"
                  >
                    <button 
                      onClick={() => {
                        setViewMode('appointments');
                        setIsActionMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-colors ${viewMode === 'appointments' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${viewMode === 'appointments' ? 'bg-indigo-100' : 'bg-slate-50'}`}>
                        <CalendarDays size={16} />
                      </div>
                      Appointments
                    </button>
                    <button 
                      onClick={() => {
                        setViewMode('reminders');
                        setIsActionMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-colors ${viewMode === 'reminders' ? 'bg-rose-50 text-rose-600' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${viewMode === 'reminders' ? 'bg-rose-100' : 'bg-slate-50'}`}>
                        <Bell size={16} />
                      </div>
                      Reminders
                    </button>
                    <button 
                      onClick={() => {
                        setShowBookingModal(true);
                        setIsActionMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                        <CalendarIcon size={16} />
                      </div>
                      Book Session
                    </button>
                    {isAdmin && (
                      <button 
                        onClick={() => {
                          handleOpenCreateModal();
                          setIsActionMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                          <Plus size={16} />
                        </div>
                        New Event
                      </button>
                    )}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </aside>

        {/* Main Calendar Content */}
        <main className="flex-1 overflow-hidden bg-white">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center space-y-4">
              <Loader2 size={40} className="animate-spin text-blue-600" />
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Syncing with server...</p>
            </div>
          ) : (
            <>
              {viewMode === 'year' && renderYearView()}
              {viewMode === 'month' && renderMonthView()}
              {viewMode === 'week' && renderWeekView()}
              {viewMode === 'day' && renderDayView()}
              {viewMode === 'appointments' && renderAppointmentsView()}
              {viewMode === 'reminders' && renderRemindersView()}
            </>
          )}
        </main>
      </div>

      {/* Booking Modal */}
      <AnimatePresence>
        {showBookingModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-500/10 text-amber-600 rounded-2xl flex items-center justify-center">
                    <CalendarDays size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Schedule Session</h3>
                    <p className="text-sm text-slate-500">Connect with a Pastor, Mentor or Counselor</p>
                  </div>
                </div>
                <button onClick={() => setShowBookingModal(false)} className="p-3 hover:bg-white rounded-2xl text-slate-400 transition-all shadow-sm border border-slate-100">
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
                <div className="space-y-8">
                  {/* Step 1: Select Staff */}
                  <section className="space-y-4">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Step 1: Choose Your Guide</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {bookableStaff.map(staff => (
                        <button
                          key={staff.id}
                          onClick={() => setSelectedStaff(staff)}
                          className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${selectedStaff?.id === staff.id ? 'border-amber-500 bg-amber-50 ring-4 ring-amber-50' : 'border-slate-100 hover:border-slate-200 bg-white'}`}
                        >
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${selectedStaff?.id === staff.id ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                            {staff.fullName[0]}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{staff.fullName}</p>
                            <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">{staff.role}</p>
                          </div>
                          {selectedStaff?.id === staff.id && <div className="ml-auto bg-amber-500 text-white rounded-full p-1"><Check size={14} /></div>}
                        </button>
                      ))}
                    </div>
                  </section>

                  {/* Step 2: Date & Slots */}
                  {selectedStaff && (
                    <motion.section 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-6 pt-4 border-t border-slate-100"
                    >
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Step 2: Pick Your Time</h4>
                      
                      <div className="flex flex-col sm:flex-row gap-6">
                        <div className="flex-1 space-y-2">
                          <label className="text-xs font-bold text-slate-500 ml-1">Preferred Date</label>
                          <input
                            type="date"
                            min={format(new Date(), 'yyyy-MM-dd')}
                            value={bookingDate}
                            onChange={(e) => setBookingDate(e.target.value)}
                            className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-amber-500 transition-all"
                          />
                        </div>
                        
                        <div className="flex-[2] space-y-2">
                          <label className="text-xs font-bold text-slate-500 ml-1">Available Slots</label>
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {availableSlots.length > 0 ? (
                              availableSlots.map(slot => (
                                <button
                                  key={slot}
                                  onClick={() => setSelectedSlot(slot)}
                                  className={`py-3 rounded-xl text-xs font-black transition-all ${selectedSlot === slot ? 'bg-amber-500 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                >
                                  {slot}
                                </button>
                              ))
                            ) : (
                              <div className="col-span-full py-4 text-center text-slate-400 text-xs font-medium">No free slots on this day.</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.section>
                  )}

                  {/* Step 3: Details */}
                  {selectedSlot && (
                    <motion.section 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4 pt-4 border-t border-slate-100"
                    >
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Step 3: Notes for Session</h4>
                      <input
                        type="text"
                        placeholder="Session Purpose (e.g. Life Guidance, Prayer)"
                        value={bookingForm.title}
                        onChange={(e) => setBookingForm({...bookingForm, title: e.target.value})}
                        className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-amber-500"
                      />
                      <textarea
                        rows={3}
                        placeholder="Any specific background or topics you'd like to discuss?"
                        value={bookingForm.notes}
                        onChange={(e) => setBookingForm({...bookingForm, notes: e.target.value})}
                        className="w-full bg-slate-50 border-none rounded-[20px] px-5 py-4 text-sm font-medium text-slate-600 focus:ring-2 focus:ring-amber-500 resize-none"
                      />
                    </motion.section>
                  )}
                </div>
              </div>

              <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                <div className="text-slate-500">
                  {selectedSlot && (
                    <p className="text-xs font-bold flex items-center gap-2">
                      <Clock size={14} className="text-amber-500" />
                      <span>{format(parseISO(bookingDate), 'MMM d')} @ {selectedSlot}</span>
                    </p>
                  )}
                </div>
                <button
                  disabled={!selectedSlot || !selectedStaff || isSaving}
                  onClick={async () => {
                    if (!profile || !db) return;
                    setIsSaving(true);
                    try {
                      const appointmentData = {
                        title: bookingForm.title,
                        clientName: profile.fullName,
                        clientEmail: profile.email,
                        date: bookingDate,
                        time: selectedSlot,
                        duration: '30 mins',
                        location: 'Staff Office / Virtual',
                        type: 'Personal Session',
                        status: 'pending',
                        notes: bookingForm.notes,
                        staffId: selectedStaff.id,
                        staffName: selectedStaff.fullName,
                        requesterId: profile.uid,
                        createdAt: serverTimestamp()
                      };
                      
                      await addDoc(collection(db, 'appointments'), appointmentData);
                      
                      // Also add to global calendar as a personal reminder or private event logic
                      const districtId = profile?.districtId || 'default-district';
                      const branchId = profile?.branchId || 'default-branch';
                      const path = `districts/${districtId}/branches/${branchId}/events`;
                      
                      await addDoc(collection(db, path), {
                        title: `Session: ${bookingForm.title} (${selectedStaff.fullName})`,
                        date: new Date(`${bookingDate}T${selectedSlot}`),
                        time: selectedSlot || '10:00',
                        location: 'Meeting Room',
                        type: 'Personal Session',
                        description: `Session with ${selectedStaff.fullName}`,
                        createdAt: serverTimestamp()
                      });

                      toast.success('Session request sent!');
                      setShowBookingModal(false);
                      // Clear state
                      setSelectedStaff(null);
                      setSelectedSlot(null);
                    } catch (error) {
                      handleFirestoreError(error, OperationType.WRITE, 'appointments');
                    } finally {
                      setIsSaving(false);
                    }
                  }}
                  className={`px-10 py-4 rounded-2xl text-sm font-black transition-all active:scale-95 shadow-xl ${(!selectedSlot || isSaving) ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-amber-500 text-white hover:bg-amber-600 shadow-amber-100'}`}
                >
                  {isSaving ? 'Scheduling...' : 'Confirm Session'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Day Detail Modal */}
      <AnimatePresence>
        {showDayDetail && selectedDay && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="bg-white w-full max-w-lg rounded-t-[32px] sm:rounded-3xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#2563EB]/10 text-[#2563EB] rounded-2xl flex flex-col items-center justify-center">
                    <span className="text-[10px] font-black uppercase tracking-widest">{format(selectedDay, 'EEE')}</span>
                    <span className="text-xl font-bold leading-none">{format(selectedDay, 'd')}</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{format(selectedDay, 'MMMM d, yyyy')}</h3>
                  </div>
                </div>
                <button 
                  onClick={() => setShowDayDetail(false)}
                  className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
                {combinedEvents.filter(e => isSameDay(e.date, selectedDay)).length > 0 ? (
                  combinedEvents
                    .filter(e => isSameDay(e.date, selectedDay))
                    .map(item => {
                      const cat = categories.find(c => c.label === item.type);
                      const isReminder = item.calendarType === 'reminder';
                      const isCompleted = isReminder && item.status === 'completed';
                      return (
                        <div 
                          key={item.id}
                          className={`group relative border p-4 rounded-2xl transition-all hover:shadow-md cursor-pointer ${isReminder ? (isCompleted ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-white border-rose-100 hover:border-rose-200') : 'bg-slate-50 hover:bg-white border-slate-100 hover:border-blue-100'}`}
                          onClick={() => {
                            if (isReminder) {
                              setEditingReminder(item.original as any);
                              setReminderForm({
                                title: item.original.title,
                                description: item.original.description || '',
                                date: item.original.date,
                                time: item.original.time,
                                status: item.original.status
                              });
                              setShowReminderModal(true);
                            } else {
                              handleOpenEditModal(item as any);
                            }
                            setShowDayDetail(false);
                          }}
                        >
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex-1">
                              <span className={`text-white text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full mb-2 inline-block ${isReminder ? (isCompleted ? 'bg-slate-400' : 'bg-rose-500') : (cat?.color || 'bg-blue-500')}`}>
                                {item.type}
                              </span>
                              <div className="flex items-center gap-2">
                                {isReminder && (
                                   <div className={`w-3 h-3 rounded-full border flex items-center justify-center shrink-0 ${isCompleted ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300'}`}>
                                      {isCompleted && <Check size={8} strokeWidth={4} />}
                                   </div>
                                )}
                                <h4 className={`text-sm font-bold text-slate-900 line-clamp-1 ${isCompleted ? 'line-through text-slate-400' : ''}`}>{item.title}</h4>
                              </div>
                              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[11px] text-slate-500 font-medium">
                                <span className="flex items-center gap-1"><Clock size={12} className="text-slate-400" /> {item.time}</span>
                                {item.calendarType === 'event' && (item as any).location && <span className="flex items-center gap-1"><MapPin size={12} className="text-slate-400" /> {(item as any).location}</span>}
                                {!isReminder && (
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); handleSetEventReminder(item as any); }}
                                    className="flex items-center gap-1 text-[#2563EB] hover:underline"
                                  >
                                    <Bell size={12} /> Set Reminder
                                  </button>
                                )}
                              </div>
                            </div>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isReminder) {
                                  handleDeleteReminder(item.id);
                                } else {
                                  handleDeleteEvent(item.id);
                                }
                              }}
                              className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      )
                    })
                ) : (
                  <div className="py-12 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-4">
                      <CalendarIcon size={32} />
                    </div>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No Items</p>
                  </div>
                )}
              </div>

              {isAdmin && (
                <div className="p-6 bg-slate-50 border-t border-slate-100">
                  <button 
                    onClick={() => {
                      handleOpenCreateModal(selectedDay);
                      setShowDayDetail(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-4 bg-[#2563EB] text-white rounded-2xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95"
                  >
                    <Plus size={18} /> Schedule New Event
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Unified Modals */}
      <AnimatePresence>
        {showReminderModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden font-sans"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900">{editingReminder ? 'Edit Reminder' : 'Set Reminder'}</h2>
                <button onClick={() => setShowReminderModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveReminder} className="p-8 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Task / Title</label>
                    <input 
                      required
                      type="text" 
                      value={reminderForm.title}
                      onChange={(e) => setReminderForm({...reminderForm, title: e.target.value})}
                      className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-rose-500 outline-none transition-all font-medium text-sm"
                      placeholder="e.g. Call District Pastor"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Description (Optional)</label>
                    <textarea 
                      value={reminderForm.description}
                      onChange={(e) => setReminderForm({...reminderForm, description: e.target.value})}
                      className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-rose-500 outline-none transition-all font-medium text-sm min-h-[100px] resize-none"
                      placeholder="Details about this reminder..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Date</label>
                      <input 
                        required
                        type="date" 
                        value={reminderForm.date}
                        onChange={(e) => setReminderForm({...reminderForm, date: e.target.value})}
                        className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-rose-500 outline-none transition-all font-medium text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Time</label>
                      <input 
                        required
                        type="time" 
                        value={reminderForm.time}
                        onChange={(e) => setReminderForm({...reminderForm, time: e.target.value})}
                        className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-rose-500 outline-none transition-all font-medium text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    disabled={isSaving}
                    type="submit"
                    className="w-full px-8 py-4 bg-rose-500 text-white rounded-2xl font-bold shadow-xl shadow-rose-100 hover:bg-rose-600 transition-all flex items-center justify-center gap-2 active:scale-95"
                  >
                    {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Check size={20} />}
                    {editingReminder ? 'Update Reminder' : 'Set Reminder'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {showAppointmentModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden font-sans"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900">Schedule Appointment</h2>
                <button onClick={() => setShowAppointmentModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveAppointment} className="p-8 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Client Name</label>
                    <input 
                      required
                      type="text" 
                      value={appointmentForm.clientName}
                      onChange={(e) => setAppointmentForm({...appointmentForm, clientName: e.target.value})}
                      className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-indigo-500 outline-none transition-all font-medium text-sm"
                      placeholder="e.g. John Doe"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Email (Optional)</label>
                    <input 
                      type="email" 
                      value={appointmentForm.clientEmail}
                      onChange={(e) => setAppointmentForm({...appointmentForm, clientEmail: e.target.value})}
                      className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-indigo-500 outline-none transition-all font-medium text-sm"
                      placeholder="john@example.com"
                    />
                  </div>
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Appointment Title</label>
                    <input 
                      required
                      type="text" 
                      value={appointmentForm.title}
                      onChange={(e) => setAppointmentForm({...appointmentForm, title: e.target.value})}
                      className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-indigo-500 outline-none transition-all font-medium text-sm"
                      placeholder="e.g. Protocol Briefing"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Date</label>
                    <input 
                      required
                      type="date" 
                      value={appointmentForm.date}
                      onChange={(e) => setAppointmentForm({...appointmentForm, date: e.target.value})}
                      className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-indigo-500 outline-none transition-all font-medium text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Time</label>
                    <input 
                      required
                      type="time" 
                      value={appointmentForm.time}
                      onChange={(e) => setAppointmentForm({...appointmentForm, time: e.target.value})}
                      className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-indigo-500 outline-none transition-all font-medium text-sm"
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    disabled={isSaving}
                    type="submit"
                    className="w-full sm:w-auto px-10 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
                  >
                    {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Check size={20} />}
                    Confirm Schedule
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

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
