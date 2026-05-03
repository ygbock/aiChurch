import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Users, 
  Shield, 
  MapPin, 
  Phone, 
  Mail, 
  ChevronRight, 
  Filter,
  Globe,
  Star as StarIcon,
  MessageSquare,
  ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  collection, 
  query, 
  onSnapshot, 
  where, 
  getDocs, 
  collectionGroup,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useFirebase } from '../components/FirebaseProvider';
import { toast } from 'sonner';

interface DirectoryEntry {
  id: string;
  fullName: string;
  role: string;
  email?: string;
  phone?: string;
  branchId?: string;
  department?: string;
  type: 'staff' | 'member';
  photoUrl?: string;
}

export default function Directory() {
  const navigate = useNavigate();
  const { profile } = useFirebase();
  const [entries, setEntries] = useState<DirectoryEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'staff' | 'member'>('all');
  const [deptFilter, setDeptFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const depts = Array.from(new Set(entries.map(e => e.department).filter(Boolean))).sort();

  useEffect(() => {
    setLoading(true);
    
    // Fetch Staff from /users
    const staffQuery = query(collection(db, 'users'));
    const unsubStaff = onSnapshot(staffQuery, (snapshot) => {
      const staffList = snapshot.docs.map(doc => ({
        id: doc.id,
        fullName: doc.data().fullName,
        role: doc.data().role,
        email: doc.data().email,
        branchId: doc.data().branchId,
        department: doc.data().department || 'Administration',
        type: 'staff' as const,
        photoUrl: doc.data().photoUrl
      }));
      
      setEntries(prev => {
        const filteredPrev = prev.filter(e => e.type !== 'staff');
        return [...filteredPrev, ...staffList];
      });
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
      setLoading(false);
    });

    // Fetch Members (Collection Group for global directory)
    const membersQuery = query(collectionGroup(db, 'members'));
    const unsubMembers = onSnapshot(membersQuery, (snapshot) => {
      const membersList = snapshot.docs.map(doc => ({
        id: doc.id,
        fullName: doc.data().fullName,
        role: doc.data().level || 'Member',
        email: doc.data().email,
        phone: doc.data().phone,
        branchId: doc.data().branchId,
        department: doc.data().department || 'Community',
        type: 'member' as const,
        photoUrl: doc.data().photoUrl
      }));

      setEntries(prev => {
        const filteredPrev = prev.filter(e => e.type !== 'member');
        return [...filteredPrev, ...membersList];
      });
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'members-global');
    });

    return () => {
      unsubStaff();
      unsubMembers();
    };
  }, []);

  const filteredEntries = entries.filter(e => {
    const matchesSearch = e.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         e.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (e.department && e.department.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = typeFilter === 'all' || e.type === typeFilter;
    const matchesDept = deptFilter === 'all' || e.department === deptFilter;
    return matchesSearch && matchesType && matchesDept;
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 pb-20"
    >
      <div className="flex justify-between items-center">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400 hover:text-slate-900"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-2 px-3 py-1 bg-white border border-slate-200 rounded-full shadow-sm">
          <Globe size={14} className="text-slate-400" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Ministry Network</span>
        </div>
      </div>

      <header className="text-center space-y-4 max-w-2xl mx-auto">
        <h2 className="text-5xl font-black text-slate-900 tracking-tight">Church Directory</h2>
        <p className="text-slate-500 font-medium">Discover and connect with our global community of staff and members.</p>
      </header>

      {/* Search & Filters */}
      <div className="relative max-w-3xl mx-auto group">
        <div className="absolute inset-0 bg-indigo-500/5 blur-3xl rounded-[3rem] -z-10 opacity-0 group-focus-within:opacity-100 transition-opacity" />
        <div className="bg-white rounded-[2.5rem] border border-slate-200 p-3 shadow-xl shadow-slate-200/20 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={20} />
            <input 
              type="text" 
              placeholder="Search by name, role, or ministry..."
              className="w-full h-14 pl-14 pr-6 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-4 focus:ring-indigo-50 transition-all outline-none font-bold text-slate-900 placeholder:text-slate-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            {[
              { id: 'all', label: 'Everyone', icon: <Users size={16} /> },
              { id: 'staff', label: 'Pastors', icon: <Shield size={16} /> },
              { id: 'member', label: 'Members', icon: <StarIcon size={16} /> }
            ].map(type => (
              <button
                key={type.id}
                onClick={() => setTypeFilter(type.id as any)}
                className={`px-6 h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 border ${typeFilter === type.id ? 'bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-200' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200 hover:text-slate-700'}`}
              >
                {type.icon}
                <span className="hidden sm:inline">{type.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Secondary Filter: Departments */}
        <div className="flex flex-wrap justify-center gap-2">
          <button 
            onClick={() => setDeptFilter('all')}
            className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${deptFilter === 'all' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-400 hover:bg-slate-50 border border-slate-100'}`}
          >
            All Ministries
          </button>
          {depts.map(d => (
            <button 
              key={d}
              onClick={() => setDeptFilter(d!)}
              className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${deptFilter === d ? 'bg-indigo-600 text-white' : 'bg-white text-slate-400 hover:bg-slate-50 border border-slate-100'}`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredEntries.map((entry) => (
            <DirectoryCard key={entry.id + entry.type} entry={entry} />
          ))}
        </AnimatePresence>

        {!loading && filteredEntries.length === 0 && (
          <div className="col-span-full py-20 text-center space-y-4">
             <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto text-slate-200 mb-6">
                <Search size={40} />
             </div>
             <h4 className="text-xl font-bold text-slate-900">No identities found</h4>
             <p className="text-slate-500 font-medium max-w-xs mx-auto">We couldn't find anyone matching your current search parameters.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function DirectoryCard({ entry }: { entry: DirectoryEntry }) {
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();
  const { user } = useFirebase();
  const [isConnecting, setIsConnecting] = useState(false);

  const startChat = async () => {
    if (!user) {
      toast.error('Please login to connect');
      return;
    }
    if (user.uid === entry.id) {
      toast.error("You can't message yourself");
      return;
    }

    setIsConnecting(true);
    try {
      // Check if chat already exists
      const q = query(
        collection(db, 'chats'),
        where('participants', 'array-contains', user.uid)
      );
      
      const snap = await getDocs(q);
      const existingChat = snap.docs.find(doc => 
        doc.data().participants.includes(entry.id)
      );

      if (existingChat) {
        navigate(`/messages/${existingChat.id}`);
      } else {
        // Create new chat
        const newChat = await addDoc(collection(db, 'chats'), {
          participants: [user.uid, entry.id],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastMessage: 'Conversation started',
          lastMessageAt: serverTimestamp()
        });
        navigate(`/messages/${newChat.id}`);
      }
    } catch (error) {
      console.error("Connect error:", error);
      toast.error('Failed to initiate connection');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group bg-white rounded-[2.5rem] border border-slate-200 p-6 transition-all duration-500 hover:border-indigo-100 hover:shadow-2xl hover:shadow-indigo-100/50 relative overflow-hidden"
    >
      {/* Decorative Background Element */}
      <div className={`absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 transition-transform duration-700 ${isHovered ? 'scale-150 rotate-90' : 'scale-100'}`} />

      <div className="relative flex flex-col items-center text-center space-y-4">
        {/* Avatar */}
        <div className="relative">
          <div className={`w-24 h-24 rounded-[2rem] overflow-hidden border-4 border-white shadow-xl transition-all duration-500 ${isHovered ? 'rotate-3 scale-110' : ''}`}>
            {entry.photoUrl ? (
              <img src={entry.photoUrl} alt={entry.fullName} className="w-full h-full object-cover" />
            ) : (
              <div className={`w-full h-full flex items-center justify-center text-3xl font-black ${entry.type === 'staff' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-300'}`}>
                {entry.fullName[0]}
              </div>
            )}
          </div>
          <div className={`absolute -bottom-1 -right-1 w-8 h-8 rounded-xl border-4 border-white shadow-lg flex items-center justify-center text-white transition-all duration-300 ${isHovered ? 'translate-x-1 translate-y-1' : ''} ${entry.type === 'staff' ? 'bg-indigo-600' : 'bg-amber-500'}`}>
            {entry.type === 'staff' ? <Shield size={14} /> : <StarIcon size={14} />}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-black text-slate-900 tracking-tight group-hover:text-indigo-600 transition-colors uppercase leading-none mb-1">{entry.fullName}</h3>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{entry.role}</p>
        </div>

        <div className="flex flex-col gap-2 w-full pt-4">
           {entry.branchId && (
             <div className="flex items-center gap-2 justify-center text-[10px] font-bold text-slate-500">
                <MapPin size={12} className="text-slate-300" />
                <span>{entry.branchId} Branch</span>
             </div>
           )}
           {entry.email && (
             <div className="flex items-center gap-2 justify-center text-[10px] font-bold text-slate-500">
                <Mail size={12} className="text-slate-300" />
                <span>{entry.email}</span>
             </div>
           )}
        </div>

        <div className="pt-4 flex gap-2 w-full">
          <button 
            onClick={startChat}
            disabled={isConnecting}
            className="flex-1 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-all border border-transparent hover:border-indigo-100 active:scale-95 disabled:opacity-50"
          >
            <MessageSquare size={18} />
          </button>
          <button 
            onClick={startChat}
            disabled={isConnecting}
            className="flex-1 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg active:scale-95 group/btn overflow-hidden relative disabled:opacity-50"
          >
            <span className="relative z-10">{isConnecting ? 'Opening...' : 'Connect'}</span>
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-indigo-400 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
