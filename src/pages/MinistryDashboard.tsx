import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useFirebase } from '../components/FirebaseProvider';
import { collection, query, orderBy, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, isToday, parseISO } from 'date-fns';
import FloatingActionMenu from '../components/FloatingActionMenu';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { 
  ArrowLeft, 
  Users, 
  Settings,
  Calendar,
  Zap,
  Trophy,
  Medal,
  ChevronRight,
  BookOpen,
  MessageSquare,
  Camera,
  Heart,
  BarChart3,
  Video,
  Globe,
  Plus,
  ClipboardList,
  FileText,
  UserPlus,
  Shield,
  Play,
  TrendingUp,
  CreditCard,
  Target,
  Search,
  Download,
  Mail,
  Eye,
  Edit2,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  Clock,
  FolderOpen,
  Upload,
  Send,
  MoreVertical,
  Paperclip,
  CheckSquare,
  LayoutGrid,
  Trash2,
  Bell
} from 'lucide-react';
import CollapsibleSection from '../components/CollapsibleSection';

const MINISTRY_CONFIGS: Record<string, any> = {
  youth: {
    name: 'Youth & Young Adults Ministry',
    description: 'Discipleship, leadership development, and digital engagement (Ages 13-30)',
    tabs: ['Overview', 'Members', 'Programs', 'Events', 'Groups', 'Care & Mentoring', 'Finance', 'Analytics', 'Tasks', 'Resources', 'Chat'],
    stats: [
      { label: 'TOTAL YOUTH', value: '1,240', icon: <Users size={16} className="text-blue-500" /> },
      { label: 'TEENS', value: '89', icon: <Zap size={16} className="text-emerald-500" /> },
      { label: 'YOUTH (18+)', value: '102', icon: <Trophy size={16} className="text-purple-500" /> },
      { label: 'YOUNG ADULTS', value: '57', icon: <Medal size={16} className="text-orange-500" /> },
      { label: 'ENGAGEMENT', value: '78%', icon: <BarChart3 size={16} className="text-blue-500" /> },
      { label: 'EVENTS', value: '12', icon: <Calendar size={16} className="text-slate-400" /> },
    ],
    quickActions: [
      { label: 'Plan Event', tab: 'Events', icon: <Calendar size={18} /> },
      { label: 'Create Program', tab: 'Programs', icon: <BookOpen size={18} /> },
      { label: 'Counseling', tab: 'Care & Mentoring', icon: <MessageSquare size={18} /> },
      { label: 'Upload Media', tab: 'Media & Resources', icon: <Camera size={18} /> },
    ]
  },
  mens: {
    name: "Men's Ministry Dashboard",
    description: "Manage the Men's Ministry operations, committees, and activities.",
    tabs: ['Overview', 'Members', 'Committees', 'Programs', 'Finance', 'Publications', 'Events', 'Tasks', 'Resources', 'Chat', 'Analytics'],
    stats: [
      { label: 'MEMBERS', value: '120', icon: <Users size={16} className="text-blue-500" /> },
      { label: 'COMMITTEES', value: '4', icon: <Settings size={16} className="text-emerald-500" /> },
      { label: 'THIS MONTH', value: '£2,450', icon: <CreditCard size={16} className="text-purple-500" /> },
      { label: 'PLEDGES', value: '15', icon: <TrendingUp size={16} className="text-orange-500" /> },
      { label: 'EVENTS', value: '5', icon: <Calendar size={16} className="text-blue-500" /> },
      { label: 'PUBLICATIONS', value: '8', icon: <FileText size={16} className="text-slate-400" /> },
    ],
    quickActions: [
      { label: 'Add Member', tab: 'Members', icon: <UserPlus size={18} /> },
      { label: 'Record Payment', tab: 'Finance', icon: <CreditCard size={18} /> },
      { label: 'New Publication', tab: 'Publications', icon: <FileText size={18} /> },
      { label: 'New Event', tab: 'Events', icon: <Calendar size={18} /> },
    ]
  },
  womens: {
    name: "Women's Ministry Dashboard",
    description: "Empowering women through fellowship, prayer, and community impact.",
    tabs: ['Overview', 'Members', 'Circles', 'Programs', 'Care', 'Events', 'Finance', 'Tasks', 'Resources', 'Chat', 'Analytics'],
    stats: [
      { label: 'MEMBERS', value: '185', icon: <Users size={16} className="text-rose-500" /> },
      { label: 'CIRCLES', value: '6', icon: <Target size={16} className="text-emerald-500" /> },
      { label: 'OUTREACH', value: '12', icon: <Heart size={16} className="text-rose-500" /> },
      { label: 'EVENTS', value: '4', icon: <Calendar size={16} className="text-slate-400" /> },
    ],
    quickActions: [
      { label: 'New Circle', tab: 'Circles', icon: <Plus size={18} /> },
      { label: 'Plan Meeting', tab: 'Events', icon: <Calendar size={18} /> },
      { label: 'Care Request', tab: 'Care', icon: <Heart size={18} /> },
    ]
  },
  children: {
    name: "Children's Ministry Dashboard",
    description: "Building a foundation of faith for the next generation (Ages 3-12).",
    tabs: ['Overview', 'Members', 'Classes', 'Teachers', 'Curriculum', 'Safety', 'Events', 'Finance', 'Tasks', 'Resources', 'Chat', 'Analytics'],
    stats: [
      { label: 'KIDS', value: '85', icon: <Users size={16} className="text-emerald-500" /> },
      { label: 'CLASSES', value: '5', icon: <BookOpen size={16} className="text-blue-500" /> },
      { label: 'TEACHERS', value: '12', icon: <Heart size={16} className="text-rose-500" /> },
      { label: 'SAFETY STATUS', value: 'Secure', icon: <Shield size={16} className="text-emerald-500" /> },
    ],
    quickActions: [
      { label: 'Check-in', tab: 'Overview', icon: <UserPlus size={18} /> },
      { label: 'Plan Lesson', tab: 'Curriculum', icon: <BookOpen size={18} /> },
      { label: 'Safety Check', tab: 'Safety', icon: <Shield size={18} /> },
    ]
  }
};

export default function MinistryDashboard() {
  const { ministryId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useFirebase();
  const [activeTab, setActiveTab] = useState('Overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [memberForm, setMemberForm] = useState({ name: '', email: '', phone: '', role: 'Member', committee: '-' });
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  
  const [programs, setPrograms] = useState<any[]>([]);

  // Initialize tab from location state if available
  useEffect(() => {
    if (location.state?.initialTab) {
      setActiveTab(location.state.initialTab);
    }
  }, [location.state, location.state?.initialTab]);

  useEffect(() => {
    if (!profile) return;
    const districtId = profile?.districtId || 'default-district';
    const branchId = profile?.branchId || 'default-branch';
    const path = `districts/${districtId}/branches/${branchId}/events`;
    
    const q = query(collection(db, path), orderBy('date', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs
        .map(doc => {
          const data = doc.data();
          let eventDate = data.date;
          if (eventDate?.toDate) eventDate = eventDate.toDate();
          else if (eventDate?.seconds) eventDate = new Date(eventDate.seconds * 1000);
          else if (typeof eventDate === 'string') eventDate = parseISO(eventDate);

          return {
            id: doc.id,
            ...data,
            date: eventDate,
            level: 'Branch Level',
            ageGroup: 'All Ages',
            duration: '1 event',
            participants: 0
          };
        })
        .filter(doc => (doc as any).targetMinistry === ministryId || (doc as any).targetMinistry === 'All');
        
      setPrograms(docs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'ministry_events');
    });

    return () => unsubscribe();
  }, [profile, ministryId]);

  const handleDeleteProgram = async (id: string) => {
    try {
      const districtId = profile?.districtId || 'default-district';
      const branchId = profile?.branchId || 'default-branch';
      const path = `districts/${districtId}/branches/${branchId}/events`;
      await deleteDoc(doc(db, path, id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `events/${id}`);
    }
  };

  const handleOpenEditModal = (program: any) => {
    navigate('/events');
  };

  const handleOpenCreateModal = () => {
    navigate('/events', { state: { createEventForMinistry: ministryId } });
  };

  const config = MINISTRY_CONFIGS[ministryId || 'youth'] || MINISTRY_CONFIGS.youth;
  const tabs = config.tabs;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8 pb-12"
    >
      {/* Header */}
      <div className="flex flex-col space-y-4">
        <button 
          onClick={() => navigate('/ministries')}
          className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors text-sm font-medium w-fit"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 font-display">
              {config.name}
            </h1>
            <p className="text-sm sm:text-base text-slate-500 mt-1 font-medium">
              {config.description}
            </p>
          </div>
          <button className="w-full md:w-auto justify-center bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 transition-all flex items-center gap-2 shadow-sm">
            <Settings size={18} />
            Ministry Settings
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {config.stats.map((stat: any, i: number) => (
          <StatBox key={i} icon={stat.icon} label={stat.label} value={stat.value} />
        ))}
      </div>

      {/* Quick Actions Menu */}
      <FloatingActionMenu actions={config.quickActions.map((action: any) => ({
        icon: action.icon,
        label: action.label,
        onClick: () => setActiveTab(action.tab)
      }))} />

      {/* Tabs */}
      <div className="p-1 border-b border-slate-200 flex overflow-x-auto no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
        <div className="flex gap-4 sm:gap-6 md:gap-8">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 text-sm font-bold transition-all relative whitespace-nowrap ${
                activeTab === tab ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" 
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content based on Tab */}
      {activeTab === 'Overview' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {ministryId === 'youth' ? (
            <>
              {/* Row 1: Pipeline & Engagement */}
              <div className="space-y-8">
                {/* Leadership Pipeline Section */}
                <CollapsibleSection title="Leadership Pipeline" icon={<LayoutGrid size={20} />}>
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-slate-500 mt-1 font-medium">Youth in leadership development tracks</p>
                      </div>
                      <div className="text-right">
                        <span className="text-3xl font-black text-emerald-500">15</span>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Enrolled</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <PipelineRow label="Level 1 (Beginner)" count={8} color="bg-blue-500" />
                      <PipelineRow label="Level 2 (Intermediate)" count={5} color="bg-blue-400" />
                      <PipelineRow label="Level 3 (Advanced)" count={2} color="bg-blue-300" />
                    </div>

                    <div className="pt-6 border-t border-slate-100 flex justify-center">
                      <button className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors uppercase tracking-widest flex items-center gap-2">
                        View Full Pipeline <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                </CollapsibleSection>
              </div>

              <div className="space-y-8">
                <CollapsibleSection title="Recent Engagement" icon={<TrendingUp size={20} />}>
                  <div className="flex items-center justify-center py-12 border-2 border-dashed border-slate-50 rounded-xl min-h-[200px]">
                    <p className="text-slate-300 text-sm font-bold italic text-center">Engagement tracking coming soon</p>
                  </div>
                </CollapsibleSection>
              </div>

              {/* Row 2: Programs & Resources */}
              <div className="space-y-8">
                <CollapsibleSection title="Next Active Programs" icon={<Calendar size={20} />}>
                  <div className="space-y-4">
                    <ProgramRow title="Youth Bible Study" time="Wednesdays, 6:00 PM" attendees={42} />
                    <ProgramRow title="Friday Night Fellowship" time="Fridays, 7:30 PM" attendees={65} />
                    <ProgramRow title="Leadership 101" time="Saturdays, 10:00 AM" attendees={15} />
                  </div>
                </CollapsibleSection>
              </div>

              <div className="space-y-8">
                <CollapsibleSection title="Resource Library" icon={<FolderOpen size={20} />}>
                  <div className="space-y-3">
                    <ResourceItem title="Youth Handbook 2026" type="PDF" />
                    <ResourceItem title="Bible Verse Cards" type="Digital" />
                    <ResourceItem title="Ministry Plan" type="DOCX" />
                    <ResourceItem title="Leadership Training Module" type="PDF" />
                  </div>
                </CollapsibleSection>
              </div>
            </>
          ) : (
            <>
              {/* Men's/General Ministry Overview */}
              <div className="space-y-8">
                <CollapsibleSection title="Leadership Structure" icon={<Shield size={20} />}>
                  <div className="space-y-8">
                    <div>
                      <p className="text-sm text-slate-500 mt-1 font-medium italic">Current ministry leadership and roles</p>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center">
                        <div>
                          <p className="text-sm font-bold text-slate-900">Pastor Michael Nelson</p>
                          <p className="text-xs text-slate-500 font-medium">Head of Ministry</p>
                        </div>
                        <ChevronRight size={16} className="text-slate-300" />
                      </div>
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center">
                        <div>
                          <p className="text-sm font-bold text-slate-900">Brother David Clark</p>
                          <p className="text-xs text-slate-500 font-medium">Finance Coordinator</p>
                        </div>
                        <ChevronRight size={16} className="text-slate-300" />
                      </div>
                    </div>
                  </div>
                </CollapsibleSection>
              </div>
              <div className="space-y-8">
                <CollapsibleSection title="Recent Activity" icon={<Bell size={20} />}>
                  <div className="space-y-8">
                    <div>
                      <p className="text-sm font-medium text-slate-500 mt-1 italic">Latest updates and transitions</p>
                    </div>
                    <div className="space-y-6">
                      <div className="flex gap-4">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 shrink-0" />
                        <div>
                          <p className="text-sm font-bold text-slate-900">New publication: "Men's Ministry Monthly Newsletter - January 2024"</p>
                          <p className="text-xs text-slate-500 font-medium mt-1">2 hours ago</p>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 shrink-0" />
                        <div>
                          <p className="text-sm font-bold text-slate-900">£200 pledge payment received from David Clark</p>
                          <p className="text-xs text-slate-500 font-medium mt-1">1 day ago</p>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <div className="w-2 h-2 rounded-full bg-orange-500 mt-2 shrink-0" />
                        <div>
                          <p className="text-sm font-bold text-slate-900">Men's Prayer Breakfast scheduled for January 21</p>
                          <p className="text-xs text-slate-500 font-medium mt-1">3 days ago</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CollapsibleSection>
              </div>

              <div className="space-y-8">
                <CollapsibleSection title="Active Programs" icon={<BookOpen size={20} />}>
                  <div className="space-y-4">
                    {programs.slice(0, 3).map(prog => (
                      <div key={prog.id} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-xl border border-slate-100 group hover:border-blue-200 transition-all cursor-pointer">
                        <div className="space-y-1">
                          <h4 className="text-sm font-bold text-slate-900">{prog.title}</h4>
                          <p className="text-xs text-slate-500 font-medium">{prog.duration}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-slate-900">{prog.participants}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Enrolled</p>
                        </div>
                      </div>
                    ))}
                    <div className="pt-4 border-t border-slate-100 flex justify-center">
                      <button 
                        onClick={() => setActiveTab('Programs')}
                        className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors uppercase tracking-widest flex items-center gap-2"
                      >
                        View All Programs <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                </CollapsibleSection>
              </div>
            </>
          )}
          </div>
        </div>
      )}

      {activeTab === 'Committees' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h3 className="text-2xl font-bold text-slate-900 font-display">Committees</h3>
            <button className="w-full sm:w-auto justify-center bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm">
              <Plus size={18} />
              Create Committee
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <CommitteeCard id="audit-committee" title="Audit Committee" head="TBD" status="Active" ministryId={ministryId!} />
            <CommitteeCard id="finance-committee" title="Finance Committee" head="TBD" status="Active" ministryId={ministryId!} />
            <CommitteeCard id="education-committee" title="Education Committee" head="TBD" status="Active" ministryId={ministryId!} />
            <CommitteeCard id="planning-committee" title="Planning Committee" head="TBD" status="Active" ministryId={ministryId!} />
            <CommitteeCard id="welfare-committee" title="Welfare Committee" head="TBD" status="Active" ministryId={ministryId!} />
          </div>
        </div>
      )}

      {activeTab === 'Members' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h3 className="text-2xl font-bold text-slate-900 font-display">Ministry Members</h3>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <button className="flex-1 sm:flex-none px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors shadow-sm">
                <Download size={18} />
                <span className="hidden sm:inline">Export</span>
              </button>
              <button className="flex-1 sm:flex-none px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors shadow-sm">
                <Mail size={18} />
                <span className="hidden sm:inline">Message</span>
              </button>
              <button onClick={() => setIsAddMemberModalOpen(true)} className="flex-1 sm:flex-none bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-sm">
                <Plus size={18} />
                Add
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search members..." 
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
            <select className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all min-w-[140px] sm:min-w-[200px]">
              <option>All Roles</option>
              <option>Leader</option>
              <option>Member</option>
              <option>Volunteer</option>
            </select>
            <button className="w-full sm:w-auto px-6 py-2.5 bg-slate-50 border border-slate-200 text-slate-400 rounded-xl text-sm font-bold flex items-center justify-center gap-2">
              Select Members
            </button>
          </div>

          <div className="hidden sm:block bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <table className="w-full text-left border-collapse min-w-[500px] sm:min-w-[600px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-4 py-3 sm:px-6 sm:py-4 w-12 sm:w-auto">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-blue-600 rounded flex items-center justify-center cursor-pointer">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-transparent rounded-full" />
                    </div>
                  </th>
                  <th className="px-4 py-3 sm:px-6 sm:py-4 text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest">Member</th>
                  <th className="px-4 py-3 sm:px-6 sm:py-4 text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Role</th>
                  <th className="hidden sm:table-cell px-4 py-3 sm:px-6 sm:py-4 text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Committees</th>
                  <th className="hidden sm:table-cell px-4 py-3 sm:px-6 sm:py-4 text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Joined</th>
                  <th className="px-4 py-3 sm:px-6 sm:py-4 text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <MemberRow name="Joseph Conteh" email="joseph@gmail.com" role="member" joined="2026-03-02" />
                <MemberRow name="Philip Conteh" email="philip@gmail.com" role="member" joined="2026-03-02" />
                <MemberRow name="John Conteh" email="john@eample.com" role="member" joined="2026-03-02" />
              </tbody>
            </table>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-4 sm:hidden">
            <MemberCard name="Joseph Conteh" email="joseph@gmail.com" role="member" joined="2026-03-02" />
            <MemberCard name="Philip Conteh" email="philip@gmail.com" role="member" joined="2026-03-02" />
            <MemberCard name="John Conteh" email="john@eample.com" role="member" joined="2026-03-02" />
          </div>
        </div>
      )}

      {activeTab === 'Programs' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h3 className="text-2xl font-bold text-slate-900 font-display">Operational Programs</h3>
              <p className="text-sm text-slate-500 font-medium mt-1">Manage training cycles and discipleship tracks</p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div className="bg-slate-100 p-1 rounded-xl flex gap-1 shrink-0">
                  <button
                    onClick={() => setViewMode('cards')}
                    className={`p-2 rounded-lg transition-all ${viewMode === 'cards' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    <LayoutGrid size={18} />
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    <ClipboardList size={18} />
                  </button>
                </div>
              </div>
              <button
                onClick={handleOpenCreateModal}
                className="flex bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors items-center justify-center gap-2 shadow-sm shrink-0 w-full sm:w-auto"
              >
                <Plus size={18} />
                New Program
              </button>
            </div>
          </div>

          <div className="space-y-4">
             {programs.filter(p => searchQuery ? p.title.toLowerCase().includes(searchQuery.toLowerCase()) : true).length > 0 ? (
               viewMode === 'cards' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {programs.filter(p => searchQuery ? p.title.toLowerCase().includes(searchQuery.toLowerCase()) : true).map(prog => (
                    <TrainingProgramCard
                      key={prog.id}
                      {...prog}
                      onEdit={() => handleOpenEditModal(prog)}
                      onDelete={() => handleDeleteProgram(prog.id)}
                      onManage={() => navigate(`/programs/${prog.id}`, { state: { fromMinistry: ministryId, programName: prog.title } })}
                    />
                  ))}
                </div>
               ) : (
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-x-auto w-full">
                  <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Program</th>
                        <th className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Level</th>
                        <th className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Audience</th>
                        <th className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Partic.</th>
                        <th className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {programs.filter(p => searchQuery ? p.title.toLowerCase().includes(searchQuery.toLowerCase()) : true).map(prog => (
                        <tr
                          key={prog.id}
                          className="hover:bg-slate-50 transition-colors cursor-pointer"
                          onClick={() => navigate(`/programs/${prog.id}`, { state: { fromMinistry: ministryId, programName: prog.title } })}
                        >
                          <td className="px-4 py-4">
                            <h4 className="text-sm font-bold text-slate-900">{prog.title}</h4>
                            <p className="text-xs text-slate-500">{prog.duration}</p>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-bold rounded-full uppercase truncate">
                              {prog.level}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center text-sm font-medium text-slate-600 truncate">
                            {prog.ageGroup}
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className="text-sm font-black text-slate-900">{prog.participants}</span>
                          </td>
                          <td className="px-4 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <ProgramActionMenu
                              onEdit={() => handleOpenEditModal(prog)}
                              onDelete={() => handleDeleteProgram(prog.id)}
                              onManage={() => navigate(`/programs/${prog.id}`, { state: { fromMinistry: ministryId, programName: prog.title } })}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
               )
             ) : (
                <div className="py-20 text-center bg-slate-50 border-2 border-dashed border-slate-100 rounded-3xl">
                  <p className="text-slate-400 font-bold italic tracking-tight">No programs found.</p>
                </div>
             )}
          </div>
        </div>
      )}

      {activeTab === 'Events' && <CalendarEventsTab />}

      {activeTab === 'Groups' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h3 className="text-2xl font-bold text-slate-900 font-display">Youth Groups & Cells</h3>
            <button className="w-full sm:w-auto justify-center bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm">
              <UserPlus size={18} />
              Create Group
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <GroupCard 
              title="Teen Cell Group Alpha"
              ages="13-17"
              leader="Brother James Wilson"
              members={15}
              nextMeeting="2/5/2024"
            />
            <GroupCard 
              title="Young Adults Fellowship"
              ages="25-30"
              leader="Sister Sarah Johnson"
              members={22}
              nextMeeting="2/7/2024"
            />
            <GroupCard 
              title="Youth Worship Band"
              ages="16-24"
              leader="Brother David Mensah"
              members={12}
              nextMeeting="2/6/2024"
            />
          </div>
        </div>
      )}

      {activeTab === 'Care & Mentoring' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h3 className="text-2xl font-bold text-slate-900 font-display">Counseling & Mentoring</h3>
            <button className="w-full sm:w-auto bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-sm">
              <Heart size={18} />
              New Session
            </button>
          </div>

          <div className="space-y-4">
            <CareMentoringCard 
              name="Anonymous Youth"
              age={17}
              priority="medium"
              type="Academic Pressure"
              status="assigned"
              assignedTo="Pastor Michael Brown"
            />
            <CareMentoringCard 
              name="Brother Samuel Osei"
              age={23}
              priority="low"
              type="Career Guidance"
              status="scheduled"
              assignedTo="Sister Grace Addo"
            />
          </div>
        </div>
      )}

      {activeTab === 'Media & Resources' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h3 className="text-2xl font-bold text-slate-900 font-display">Media & Digital Resources</h3>
            <label className="w-full sm:w-auto justify-center bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm cursor-pointer border border-blue-600">
              <Camera size={18} />
              Upload Content
              <input type="file" className="hidden" aria-label="Upload Content" />
            </label>
          </div>

          <div className="flex flex-col items-center justify-center py-24 bg-white border border-slate-200 rounded-2xl shadow-sm text-center">
            <Play size={48} className="text-slate-400 mb-4 stroke-[1.5]" />
            <h4 className="text-lg font-bold text-slate-900 font-display mb-1">Media Library</h4>
            <p className="text-sm text-slate-500 font-medium">Short videos, blogs, sermon clips, and youth-focused content</p>
          </div>
        </div>
      )}

      {activeTab === 'Analytics' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h3 className="text-2xl font-bold text-slate-900 font-display">Ministry Analytics</h3>
            <button className="w-full sm:w-auto justify-center bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm">
              <Download size={18} />
              Export Report
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatBox icon={<Users size={20} className="text-blue-500" />} label="Avg Attendance" value="342" />
            <StatBox icon={<Heart size={20} className="text-emerald-500" />} label="Volunteer Hours" value="1,250" />
            <StatBox icon={<TrendingUp size={20} className="text-purple-500" />} label="New Members" value="+24%" />
            <StatBox icon={<CreditCard size={20} className="text-orange-500" />} label="Contributions" value="£12,450" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h4 className="text-lg font-bold text-slate-900 mb-6">Member Growth Trends</h4>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={[
                    { name: 'Jan', members: 120 }, { name: 'Feb', members: 125 },
                    { name: 'Mar', members: 135 }, { name: 'Apr', members: 142 },
                    { name: 'May', members: 155 }, { name: 'Jun', members: 180 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dx={-10} />
                    <Tooltip cursor={{stroke: '#e2e8f0', strokeWidth: 2}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                    <Area type="monotone" dataKey="members" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorMembers)" />
                    <defs>
                      <linearGradient id="colorMembers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h4 className="text-lg font-bold text-slate-900 mb-6">Event Attendance Rates</h4>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: 'Wk 1', attendance: 85 }, { name: 'Wk 2', attendance: 92 },
                    { name: 'Wk 3', attendance: 78 }, { name: 'Wk 4', attendance: 110 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dx={-10} />
                    <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                    <Bar dataKey="attendance" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h4 className="text-lg font-bold text-slate-900 mb-6">Volunteer Hours & Finance</h4>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={[
                    { name: 'Q1', hours: 300, finance: 4000 }, { name: 'Q2', hours: 450, finance: 5200 },
                    { name: 'Q3', hours: 380, finance: 4800 }, { name: 'Q4', hours: 500, finance: 6100 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                    <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dx={-10} />
                    <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dx={10} />
                    <Tooltip cursor={{stroke: '#e2e8f0', strokeWidth: 2}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                    <Legend iconType="circle" wrapperStyle={{paddingTop: '20px', fontSize: '12px'}} />
                    <Line yAxisId="left" type="monotone" dataKey="hours" name="Volunteer Hours" stroke="#8b5cf6" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
                    <Line yAxisId="right" type="monotone" dataKey="finance" name="Contributions (£)" stroke="#f59e0b" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
      {activeTab === 'Finance' && <FinanceTab />}
      {activeTab === 'Tasks' && <TasksTab />}
      {activeTab === 'Resources' && <DocsTab />}
      {activeTab === 'Docs' && <DocsTab />}
      {activeTab === 'Chat' && <ChatTab />}
      {activeTab === 'Publications' && (
        <div className="flex flex-col items-center justify-center py-24 bg-white border border-slate-200 rounded-2xl shadow-sm text-center">
          <BookOpen size={48} className="text-slate-400 mb-4 stroke-[1.5]" />
          <h4 className="text-lg font-bold text-slate-900 font-display mb-1">Ministry Publications</h4>
          <p className="text-sm text-slate-500 font-medium">Magazines, newsletters, and digital tracts</p>
        </div>
      )}

      {/* Add Member Modal */}
      {isAddMemberModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Add Ministry Member</h3>
                <p className="text-sm text-slate-500">Register a new member to this ministry.</p>
              </div>
              <button 
                onClick={() => setIsAddMemberModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 bg-white rounded-lg border border-slate-200"
              >
                <Plus size={20} className="rotate-45" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Full Name</label>
                <input 
                  type="text" 
                  value={memberForm.name}
                  onChange={(e) => setMemberForm({...memberForm, name: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-colors"
                  placeholder="e.g. John Doe"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
                <input 
                  type="email" 
                  value={memberForm.email}
                  onChange={(e) => setMemberForm({...memberForm, email: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-colors"
                  placeholder="e.g. john@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Role</label>
                <select 
                  value={memberForm.role}
                  onChange={(e) => setMemberForm({...memberForm, role: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-colors"
                >
                  <option value="Member">Member</option>
                  <option value="Leader">Leader</option>
                  <option value="Volunteer">Volunteer</option>
                  <option value="Coordinator">Coordinator</option>
                </select>
              </div>
            </div>
            
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button 
                onClick={() => setIsAddMemberModalOpen(false)}
                className="px-6 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  setIsAddMemberModalOpen(false);
                  setMemberForm({ name: '', email: '', phone: '', role: 'Member', committee: '-' });
                }}
                className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
              >
                Add Member
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

function GroupCard({ title, ages, leader, members, nextMeeting }: { title: string, ages: string, leader: string, members: number, nextMeeting: string }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between h-full">
      <div className="space-y-6">
        <div>
          <h4 className="text-xl font-bold text-slate-900 font-display">{title}</h4>
          <p className="text-sm font-medium text-slate-500 mt-1">Ages {ages}</p>
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="font-medium text-slate-500">Leader:</span>
            <span className="font-bold text-slate-900">{leader}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="font-medium text-slate-500">Members:</span>
            <span className="font-bold text-slate-900">{members}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="font-medium text-slate-500">Next Meeting:</span>
            <span className="font-bold text-slate-900">{nextMeeting}</span>
          </div>
        </div>
      </div>
      
      <button className="w-full mt-6 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors">
        Manage Group
      </button>
    </div>
  );
}

function CareMentoringCard({ name, age, priority, type, status, assignedTo }: { name: string, age: number, priority: string, type: string, status: string, assignedTo: string }) {
  const getPriorityColor = () => {
    switch(priority) {
      case 'medium': return 'bg-blue-600';
      case 'low': return 'bg-red-600';
      default: return 'bg-slate-600';
    }
  };

  const getStatusColor = () => {
    switch(status) {
      case 'assigned': return 'bg-blue-600';
      case 'scheduled': return 'bg-red-600';
      default: return 'bg-slate-600';
    }
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="text-lg sm:text-xl font-bold text-slate-900 font-display">{name}</h4>
          <span className="px-2 py-1 bg-slate-50 border border-slate-200 text-slate-700 text-[10px] sm:text-xs font-bold rounded-full">
            Age {age}
          </span>
          <span className={`px-2 py-1 text-white text-[10px] sm:text-xs font-bold rounded-full uppercase ${getPriorityColor()}`}>
            {priority}
          </span>
        </div>
        <button className="w-full sm:w-auto px-4 py-1.5 flex items-center justify-center gap-2 border border-slate-200 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-50 transition-colors shrink-0">
          <Shield size={16} />
          Review
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">Type:</p>
          <p className="text-base font-bold text-slate-900 mt-1">{type}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500">Status:</p>
          <div className="mt-1">
            <span className={`inline-flex px-3 py-0.5 rounded-full text-xs font-bold text-white ${getStatusColor()}`}>
              {status}
            </span>
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500">Assigned to:</p>
          <p className="text-base font-bold text-slate-900 mt-1">{assignedTo}</p>
        </div>
      </div>
    </div>
  );
}

function StatBox({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="bg-white p-3 md:p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
      <div className="flex items-center gap-1.5 md:gap-2">
        <div className="shrink-0 flex items-center justify-center [&>svg]:w-4 [&>svg]:h-4 md:[&>svg]:w-5 md:[&>svg]:h-5">
          {icon}
        </div>
        <span className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none truncate block">{label}</span>
      </div>
      <p className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 tracking-tight">{value}</p>
    </div>
  );
}

function ActionButton({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`p-3 rounded-xl border transition-all flex items-center gap-3 text-left group ${
        active 
          ? 'bg-blue-600 border-blue-600 shadow-md shadow-blue-100' 
          : 'bg-white border-slate-200 hover:border-blue-200 hover:bg-slate-50'
      }`}
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
        active ? 'bg-blue-500 text-white' : 'bg-slate-50 text-slate-400 group-hover:text-blue-600'
      }`}>
        {icon}
      </div>
      <span className={`text-xs font-bold transition-colors ${active ? 'text-white' : 'text-slate-600 group-hover:text-slate-900'}`}>{label}</span>
      {!active && <ChevronRight size={14} className="ml-auto text-slate-300 group-hover:text-blue-600 transition-colors" />}
    </button>
  );
}

function PipelineRow({ label, count, color }: { label: string, count: number, color: string }) {
  return (
    <div className="flex justify-between items-center group">
      <div className="flex items-center gap-2 sm:gap-3">
        <div className={`w-2 h-2 rounded-full shrink-0 ${color}`} />
        <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900 transition-colors truncate max-w-[150px] sm:max-w-none">{label}</span>
      </div>
      <span className="text-sm font-black text-slate-900 shrink-0">{count}</span>
    </div>
  );
}

function CommitteeCard({ id, title, head, status, ministryId }: { id: string, title: string, head: string, status: string, ministryId: string }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-6">
        <h4 className="text-xl font-bold text-slate-900 font-display">{title}</h4>
        <span className="px-3 py-1 bg-blue-600 text-white text-[10px] font-bold uppercase rounded-full">
          {status}
        </span>
      </div>
      
      <div className="flex items-center gap-2 mb-8 text-slate-500">
        <Users size={16} />
        <span className="text-sm font-medium">Head: {head}</span>
      </div>

      <div className="flex items-center gap-3">
        <Link 
          to={`/ministries/${ministryId}/committees/${id}`}
          className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors"
        >
          <ArrowRight size={16} />
          Open Workspace
        </Link>
        <button className="p-2 border border-slate-200 text-slate-400 rounded-xl hover:bg-slate-50 hover:text-slate-600 transition-colors">
          <Edit2 size={18} />
        </button>
      </div>
    </div>
  );
}

function MemberRow({ name, email, role, joined }: { name: string, email: string, role: string, joined: string }) {
  const [selectedRole, setSelectedRole] = useState(role);
  const [selectedCommittee, setSelectedCommittee] = useState('-');
  const initials = name.split(' ').map(n => n[0]).join('');
  
  return (
    <tr className="hover:bg-slate-50 transition-colors">
      <td className="px-4 py-3 sm:px-6 sm:py-4">
        <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-blue-600 rounded flex items-center justify-center cursor-pointer">
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-transparent rounded-full transition-all" />
        </div>
      </td>
      <td className="px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs sm:text-sm shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">{name}</p>
            <p className="text-[10px] sm:text-xs text-slate-500 font-medium truncate">{email}</p>
          </div>
        </div>
      </td>
      <td className="px-2 py-3 sm:px-6 sm:py-4 text-center">
        <select 
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="text-[10px] sm:text-xs font-bold uppercase text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-1.5 sm:px-2 py-1 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer max-w-[80px] sm:max-w-none"
        >
          <option value="member">Member</option>
          <option value="coordinator">Coordinator</option>
          <option value="treasurer">Treasurer</option>
          <option value="leader">Leader</option>
          <option value="admin">Super Admin</option>
        </select>
      </td>
      <td className="hidden sm:table-cell px-6 py-4 text-center">
        <select 
          value={selectedCommittee}
          onChange={(e) => setSelectedCommittee(e.target.value)}
          className="text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-slate-500 cursor-pointer max-w-[120px]"
        >
          <option value="-">-</option>
          <option value="events">Events</option>
          <option value="finance">Finance</option>
          <option value="welfare">Welfare</option>
          <option value="outreach">Outreach</option>
        </select>
      </td>
      <td className="hidden sm:table-cell px-6 py-4 text-center text-sm font-medium text-slate-500">
        {joined}
      </td>
      <td className="px-4 py-3 sm:px-6 sm:py-4 text-right">
        <div className="flex justify-end gap-2 sm:gap-3 text-slate-400">
          <button className="hover:text-blue-600 transition-colors" title="Email Member" onClick={() => window.location.href = `mailto:${email}`}>
            <Mail size={16} className="sm:w-[18px] sm:h-[18px]" />
          </button>
          <button className="hover:text-emerald-600 transition-colors" title="In-App Message" onClick={() => alert(`Open in-app message dialog for ${name}`)}>
            <MessageSquare size={16} className="sm:w-[18px] sm:h-[18px]" />
          </button>
          <button className="hover:text-amber-600 transition-colors" title="Save Role">
            <CheckCircle2 size={16} className="sm:w-[18px] sm:h-[18px]" />
          </button>
          <button className="hover:text-blue-600 transition-colors" title="View Profile">
            <Eye size={16} className="sm:w-[18px] sm:h-[18px]" />
          </button>
        </div>
      </td>
    </tr>
  );
}

function MemberCard({ name, email, role, joined }: { name: string, email: string, role: string, joined: string }) {
  const [selectedRole, setSelectedRole] = useState(role);
  const initials = name.split(' ').map(n => n[0]).join('');

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-sm shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-900 truncate">{name}</p>
          <p className="text-[10px] text-slate-500 font-medium truncate">{email}</p>
        </div>
        <div className="flex justify-end gap-2 text-slate-400 shrink-0">
          <button className="hover:text-blue-600 transition-colors" title="Email Member" onClick={() => window.location.href = `mailto:${email}`}>
            <Mail size={16} />
          </button>
          <button className="hover:text-emerald-600 transition-colors" title="In-App Message" onClick={() => alert(`Open in-app message dialog for ${name}`)}>
            <MessageSquare size={16} />
          </button>
          <button className="hover:text-amber-600 transition-colors" title="Save Role">
            <CheckCircle2 size={16} />
          </button>
          <button className="hover:text-blue-600 transition-colors" title="View Profile">
            <Eye size={16} />
          </button>
        </div>
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <select 
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="text-[10px] font-bold uppercase text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
        >
          <option value="member">Member</option>
          <option value="coordinator">Coordinator</option>
          <option value="treasurer">Treasurer</option>
          <option value="leader">Leader</option>
          <option value="admin">Super Admin</option>
        </select>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Joined: {joined}
        </p>
      </div>
    </div>
  );
}

function ProgramRow({ title, time, attendees }: { title: string, time: string, attendees: number }) {
  return (
    <div className="flex sm:items-center flex-col sm:flex-row justify-between p-3 sm:p-4 bg-slate-50/50 rounded-xl border border-slate-100 group hover:border-blue-200 transition-all cursor-pointer gap-2 sm:gap-0">
      <div className="space-y-1">
        <h4 className="text-sm font-bold text-slate-900 truncate">{title}</h4>
        <p className="text-[10px] sm:text-xs text-slate-500 font-medium">{time}</p>
      </div>
      <div className="flex sm:block justify-between items-center sm:text-right border-t border-slate-100 sm:border-0 pt-2 sm:pt-0 mt-1 sm:mt-0">
        <p className="text-[10px] font-bold text-slate-400 uppercase sm:hidden shrink-0">Avg. Reach</p>
        <div>
          <p className="text-sm font-black text-slate-900 text-right sm:text-auto">{attendees}</p>
          <p className="hidden sm:block text-[10px] font-bold text-slate-400 uppercase">Avg. Reach</p>
        </div>
      </div>
    </div>
  );
}

function ResourceItem({ title, type }: { title: string, type: string }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors group cursor-pointer">
      <div className="flex items-center gap-3">
        <FileText size={16} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
        <span className="text-sm font-bold text-slate-700 group-hover:text-slate-900 transition-colors">{title}</span>
      </div>
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{type}</span>
    </div>
  );
}

function ProgramActionMenu({ onEdit, onDelete, onManage }: { onEdit: () => void, onDelete: () => void, onManage: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="relative">
      <button 
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
        className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
      >
        <MoreVertical size={18} />
      </button>
      {isOpen && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 w-40 p-1">
          <button onClick={() => { setIsOpen(false); onManage(); }} className="w-full text-left px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2">
            <Eye size={16} /> Manage
          </button>
          <button onClick={() => { setIsOpen(false); onEdit(); }} className="w-full text-left px-3 py-2 text-sm font-bold text-blue-600 hover:bg-blue-50 rounded-lg flex items-center gap-2">
            <Edit2 size={16} /> Edit
          </button>
          <button onClick={() => { setIsOpen(false); onDelete(); }} className="w-full text-left px-3 py-2 text-sm font-bold text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-2">
            <Trash2 size={16} /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

function TrainingProgramCard({ id, title, level, participants, ageGroup, duration, status, completion, onDelete, onEdit, onManage }: any) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative group">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h4 className="text-lg font-bold text-slate-900 font-display line-clamp-1">{title}</h4>
          <span className="inline-block mt-2 px-3 py-1 bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-full">
            {level}
          </span>
        </div>
        <ProgramActionMenu onEdit={onEdit} onDelete={onDelete} onManage={onManage} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Participants</p>
          <p className="text-sm font-bold text-slate-900 mt-0.5">{participants}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Age Group</p>
          <p className="text-sm font-bold text-slate-900 mt-0.5">{ageGroup}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Duration</p>
          <p className="text-sm font-bold text-slate-900 mt-0.5">{duration}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Status</p>
          <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-white ${status === 'active' ? 'bg-blue-600' : 'bg-slate-400'}`}>
            {status}
          </span>
        </div>
      </div>
    </div>
  );
}


function EventCard({ title, category, date, location, registered, capacity }: { title: string, category: string, date: string, location: string, registered: number, capacity: number }) {
  const progress = Math.min((registered / capacity) * 100, 100);
  
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between h-full">
      <div className="space-y-4">
        <div>
          <h4 className="text-xl font-bold text-slate-900 font-display">{title}</h4>
          <p className="text-sm font-medium text-slate-500 mt-1">{category}</p>
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="font-medium text-slate-500">Date:</span>
            <span className="font-bold text-slate-900">{date}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="font-medium text-slate-500">Location:</span>
            <span className="font-bold text-slate-900">{location}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="font-medium text-slate-500">Registered:</span>
            <span className="font-bold text-slate-900">{registered}/{capacity}</span>
          </div>
          
          <div className="relative w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="absolute left-0 top-0 h-full bg-blue-600 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
      
      <button className="w-full mt-6 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors">
        Manage Event
      </button>
    </div>
  );
}

// --- NEW TABS COMPONENTS ---

function CalendarEventsTab() {
  const [filter, setFilter] = useState('All');
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 4, 1));
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const [events, setEvents] = useState([
    { id: 1, title: 'Youth Outreach', date: new Date(2026, 4, 10), type: 'Outreach', time: '10:00 AM', location: 'City Center' },
    { id: 2, title: 'Youth Retreat', date: new Date(2026, 4, 15), type: 'Retreats', time: '9:00 AM', location: 'Camp Galilee' },
    { id: 3, title: 'Leadership Meeting', date: new Date(2026, 4, 25), type: 'Meetings', time: '7:00 PM', location: 'Hall B' }
  ]);

  const [newEventForm, setNewEventForm] = useState({
    title: '',
    time: '',
    location: '',
    type: 'Service'
  });

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const handleOpenModal = (date?: Date) => {
    setSelectedDate(date || new Date());
    setNewEventForm({ title: '', time: '', location: '', type: 'Service' });
    setIsEventModalOpen(true);
  };

  const handleCreateEvent = () => {
    if (!newEventForm.title || !selectedDate) return;
    setEvents([...events, {
      id: Date.now(),
      title: newEventForm.title,
      date: selectedDate,
      time: newEventForm.time,
      location: newEventForm.location,
      type: newEventForm.type
    }]);
    setIsEventModalOpen(false);
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const dateFormat = "d";
    const dayRows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, dateFormat);
        const cloneDay = day;
        
        const dayEvents = events.filter(e => isSameDay(e.date, cloneDay) && (filter === 'All' || e.type === filter));

        days.push(
          <div 
            key={day.toString()} 
            onClick={() => handleOpenModal(cloneDay)}
            className={`h-20 sm:h-28 p-1 sm:p-2 border border-slate-200 rounded-lg transition-colors flex flex-col cursor-pointer hover:border-blue-300 hover:bg-blue-50/50 relative ${!isSameMonth(day, monthStart) ? "bg-slate-50/50" : "bg-white"} ${isToday(day) ? "ring-2 ring-blue-500 ring-inset" : ""}`}
          >
            <span className={`text-xs sm:text-sm font-bold block text-right mb-1 ${isToday(day) ? "text-blue-600" : (isSameMonth(day, monthStart) ? "text-slate-700" : "text-slate-400")}`}>
              {formattedDate}
            </span>
            <div className="flex flex-col gap-1 overflow-y-auto no-scrollbar flex-1">
              {dayEvents.map(evt => {
                let badgeClass = "bg-slate-100 text-slate-700";
                let dotClass = "bg-slate-400";
                switch(evt.type) {
                  case 'Outreach': badgeClass = "bg-emerald-100 text-emerald-700"; dotClass = "bg-emerald-500"; break;
                  case 'Retreats': badgeClass = "bg-blue-100 text-blue-700"; dotClass = "bg-blue-500"; break;
                  case 'Meetings': badgeClass = "bg-purple-100 text-purple-700"; dotClass = "bg-purple-500"; break;
                  case 'Service': badgeClass = "bg-amber-100 text-amber-700"; dotClass = "bg-amber-500"; break;
                  case 'Conference': badgeClass = "bg-rose-100 text-rose-700"; dotClass = "bg-rose-500"; break;
                }
                return (
                  <div key={evt.id}>
                    <div className={`hidden lg:block px-1.5 py-0.5 rounded text-[9px] xl:text-[10px] font-bold truncate ${badgeClass}`} title={evt.title}>
                      {evt.title}
                    </div>
                    <div className={`lg:hidden w-1.5 h-1.5 rounded-full mx-auto my-0.5 ${dotClass}`} title={evt.title} />
                  </div>
                )
              })}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      dayRows.push(
        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-1 sm:mb-2" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }
    return <div className="min-w-[500px]">{dayRows}</div>;
  };

  const upcomingEvents = events
    .filter(e => e.date >= new Date(new Date().setHours(0,0,0,0)) && (filter === 'All' || e.type === filter))
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 4);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h3 className="text-2xl font-bold text-slate-900 font-display">Ministry Calendar</h3>
        <button onClick={() => handleOpenModal()} className="w-full sm:w-auto bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-sm">
          <Calendar size={18} />
          New Event
        </button>
      </div>

      <div className="flex flex-col xl:flex-row gap-6">
        <div className="xl:w-2/3 bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm overflow-x-auto overflow-y-hidden">
          <div className="flex justify-between items-center mb-4 sm:mb-6 min-w-[500px]">
             <h4 className="font-bold text-slate-900 text-lg">{format(currentMonth, 'MMMM yyyy')}</h4>
             <div className="flex gap-2">
                <button onClick={handlePrevMonth} className="p-2 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100"><ChevronRight size={16} className="rotate-180" /></button>
                <button onClick={() => setCurrentMonth(new Date())} className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 text-sm font-bold text-slate-600">Today</button>
                <button onClick={handleNextMonth} className="p-2 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100"><ChevronRight size={16} /></button>
             </div>
          </div>
          <div className="min-w-[500px]">
            <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center text-[10px] sm:text-xs font-bold text-slate-400 uppercase">
              <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
            </div>
            {renderCells()}
          </div>
        </div>

        <div className="xl:w-1/3 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h4 className="font-bold text-slate-900 mb-4">Filters</h4>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Event Type</label>
                <div className="flex flex-wrap gap-2">
                  {['All', 'Service', 'Meetings', 'Outreach', 'Retreats', 'Conference'].map(f => (
                    <label key={f} className="flex items-center gap-2 p-2 px-3 border border-slate-200 bg-slate-50 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors max-w-full">
                      <input type="radio" name="event-filter" checked={filter === f} onChange={() => setFilter(f)} className="text-blue-600 focus:ring-blue-500" />
                      <span className="text-sm font-medium text-slate-700 truncate">{f}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
             <h4 className="font-bold text-slate-900 mb-4">Upcoming</h4>
             {upcomingEvents.length > 0 ? (
               <div className="space-y-4">
                  {upcomingEvents.map(evt => {
                    let badgeClass = "bg-blue-50 text-blue-600";
                    switch(evt.type) {
                      case 'Outreach': badgeClass = "bg-emerald-50 text-emerald-600"; break;
                      case 'Retreats': badgeClass = "bg-blue-50 text-blue-600"; break;
                      case 'Meetings': badgeClass = "bg-purple-50 text-purple-600"; break;
                      case 'Service': badgeClass = "bg-amber-50 text-amber-600"; break;
                      case 'Conference': badgeClass = "bg-rose-50 text-rose-600"; break;
                    }
                    return (
                      <div key={evt.id} className="flex gap-4">
                         <div className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl shrink-0 ${badgeClass}`}>
                            <span className="text-xs font-bold uppercase">{format(evt.date, 'MMM')}</span>
                            <span className="text-lg font-black leading-none">{format(evt.date, 'd')}</span>
                         </div>
                         <div className="min-w-0">
                           <p className="text-sm font-bold text-slate-900 truncate">{evt.title}</p>
                           <p className="text-xs text-slate-500 font-medium truncate">{evt.time} {evt.location ? `- ${evt.location}` : ''}</p>
                         </div>
                      </div>
                    )
                  })}
               </div>
             ) : (
               <p className="text-sm text-slate-500 font-medium">No upcoming events found.</p>
             )}
          </div>
        </div>
      </div>

      <AnimatePresence>
      {isEventModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative z-[101]"
          >
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-lg font-bold text-slate-900">New Event</h3>
                <p className="text-sm text-slate-500">Schedule a new ministry event.</p>
              </div>
              <button 
                onClick={() => setIsEventModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 bg-white rounded-lg border border-slate-200"
              >
                <Plus size={20} className="rotate-45" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Event Title</label>
                <input 
                  type="text" 
                  value={newEventForm.title}
                  onChange={(e) => setNewEventForm({...newEventForm, title: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-colors"
                  placeholder="e.g. Wednesday Prayer Service"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Date</label>
                  <input 
                    type="date"
                    value={selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''}
                    onChange={(e) => {
                      if(e.target.value) {
                         const d = parseISO(e.target.value);
                         setSelectedDate(d);
                      }
                    }}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Time</label>
                  <input 
                    type="text" 
                    value={newEventForm.time}
                    onChange={(e) => setNewEventForm({...newEventForm, time: e.target.value})}
                    placeholder="e.g. 6:30 PM"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Event Type</label>
                <select 
                  value={newEventForm.type}
                  onChange={(e) => setNewEventForm({...newEventForm, type: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-colors"
                >
                  <option value="Service">Service</option>
                  <option value="Conference">Conference</option>
                  <option value="Meetings">Meeting</option>
                  <option value="Outreach">Outreach</option>
                  <option value="Retreats">Retreat</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Location</label>
                <input 
                  type="text" 
                  value={newEventForm.location}
                  onChange={(e) => setNewEventForm({...newEventForm, location: e.target.value})}
                  placeholder="e.g. Main Sanctuary"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-colors"
                />
              </div>
            </div>
            
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button 
                onClick={() => setIsEventModalOpen(false)}
                className="px-6 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateEvent}
                disabled={!newEventForm.title || !selectedDate}
                className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Event
              </button>
            </div>
          </motion.div>
        </div>
      )}
      </AnimatePresence>
    </div>
  );
}

function TasksTab() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h3 className="text-2xl font-bold text-slate-900 font-display">Task Management</h3>
        <button className="w-full sm:w-auto justify-center bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm">
          <CheckSquare size={18} />
          Create Task
        </button>
      </div>

      <div className="hidden sm:block bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Task</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Assignee</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Due Date</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
               <TaskRow title="Prepare Outreach Materials" assignee="Jane Doe" status="In Progress" due="May 10, 2026" />
               <TaskRow title="Follow up with new visitors" assignee="Philip Conteh" status="Pending" due="May 12, 2026" />
               <TaskRow title="Update Ministry Constitution" assignee="Joseph Conteh" status="Completed" due="May 1, 2026" />
            </tbody>
          </table>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:hidden">
         <TaskCard title="Prepare Outreach Materials" assignee="Jane Doe" status="In Progress" due="May 10, 2026" />
         <TaskCard title="Follow up with new visitors" assignee="Philip Conteh" status="Pending" due="May 12, 2026" />
         <TaskCard title="Update Ministry Constitution" assignee="Joseph Conteh" status="Completed" due="May 1, 2026" />
      </div>
    </div>
  );
}

function TaskCard({ title, assignee, status, due }: any) {
  const getStatusColor = () => {
    switch (status) {
      case 'Completed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'In Progress': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-3">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className="p-2 border border-slate-200 rounded-lg bg-white text-slate-400 shrink-0">
             {status === 'Completed' ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Clock size={16} />}
          </div>
          <p className="text-sm font-bold text-slate-900">{title}</p>
        </div>
      </div>
      <div className="flex justify-between items-center pt-3 border-t border-slate-100">
        <div className="flex items-center gap-2">
           <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
             {assignee.charAt(0)}
           </div>
           <span className="text-[10px] font-medium text-slate-700">{assignee}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex px-2 py-1 text-[8px] font-bold uppercase rounded-full border ${getStatusColor()}`}>
            {status}
          </span>
          <span className="text-[10px] font-medium text-slate-500">{due}</span>
        </div>
      </div>
    </div>
  );
}

function TaskRow({ title, assignee, status, due }: any) {
  const getStatusColor = () => {
    switch (status) {
      case 'Completed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'In Progress': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <tr className="hover:bg-slate-50 transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 border border-slate-200 rounded-lg bg-white text-slate-400">
             {status === 'Completed' ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Clock size={16} />}
          </div>
          <p className="text-sm font-bold text-slate-900">{title}</p>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
           <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
             {assignee.charAt(0)}
           </div>
           <span className="text-sm font-medium text-slate-700">{assignee}</span>
        </div>
      </td>
      <td className="px-6 py-4 text-center">
        <span className={`inline-flex px-3 py-1 text-[10px] font-bold uppercase rounded-full border ${getStatusColor()}`}>
          {status}
        </span>
      </td>
      <td className="px-6 py-4 text-center text-sm font-medium text-slate-500">
        {due}
      </td>
      <td className="px-6 py-4 text-right">
        <button className="text-blue-600 hover:text-blue-800 text-sm font-bold">Edit</button>
      </td>
    </tr>
  );
}

function DocsTab() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h3 className="text-2xl font-bold text-slate-900 font-display">Document Storage</h3>
        <label className="w-full sm:w-auto justify-center bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm cursor-pointer border border-blue-600">
          <Upload size={18} />
          Upload File
          <input type="file" className="hidden" />
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 border border-slate-200 rounded-2xl shadow-sm hover:border-blue-300 transition-colors cursor-pointer group flex flex-col items-center justify-center gap-3">
          <FolderOpen size={48} className="text-blue-500 group-hover:scale-110 transition-transform" strokeWidth={1.5} />
          <p className="text-sm font-bold text-slate-900">Constitutions</p>
          <p className="text-xs text-slate-500">4 files</p>
        </div>
        <div className="bg-white p-6 border border-slate-200 rounded-2xl shadow-sm hover:border-emerald-300 transition-colors cursor-pointer group flex flex-col items-center justify-center gap-3">
          <FolderOpen size={48} className="text-emerald-500 group-hover:scale-110 transition-transform" strokeWidth={1.5} />
          <p className="text-sm font-bold text-slate-900">Meeting Minutes</p>
          <p className="text-xs text-slate-500">12 files</p>
        </div>
        <div className="bg-white p-6 border border-slate-200 rounded-2xl shadow-sm hover:border-purple-300 transition-colors cursor-pointer group flex flex-col items-center justify-center gap-3">
          <FolderOpen size={48} className="text-purple-500 group-hover:scale-110 transition-transform" strokeWidth={1.5} />
          <p className="text-sm font-bold text-slate-900">Outreach Plans</p>
          <p className="text-xs text-slate-500">8 files</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h4 className="font-bold text-slate-900 text-sm uppercase tracking-widest text-[10px]">Recent Documents</h4>
        </div>
        <div className="divide-y divide-slate-100">
          <DocRow title="Q2 Outreach Playbook.pdf" size="2.4 MB" date="May 2, 2026" uploader="Jane Doe" icon={<FileText className="text-rose-500" />} />
          <DocRow title="Ministry Constitution 2026.docx" size="1.1 MB" date="Apr 28, 2026" uploader="Joseph Conteh" icon={<ClipboardList className="text-blue-500" />} />
          <DocRow title="April Meeting Minutes.pdf" size="845 KB" date="Apr 15, 2026" uploader="Philip Conteh" icon={<FileText className="text-rose-500" />} />
        </div>
      </div>
    </div>
  );
}

function DocRow({ title, size, date, uploader, icon }: any) {
  return (
    <div className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-sm">
          {icon}
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900">{title}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-slate-500">{size}</span>
            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
            <span className="text-xs text-slate-500">Added {date} by {uploader}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors bg-white border border-slate-200 rounded-lg"><Download size={16} /></button>
        <button className="p-2 text-slate-400 hover:text-slate-900 transition-colors"><MoreVertical size={16} /></button>
      </div>
    </div>
  );
}

function ChatTab() {
  return (
    <div className="h-[600px] flex flex-col bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
        <div>
          <h3 className="font-bold text-slate-900">Ministry General Chat</h3>
          <p className="text-xs text-slate-500 font-medium">15 online members</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
             <div className="w-8 h-8 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-blue-700">JD</div>
             <div className="w-8 h-8 rounded-full bg-emerald-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-emerald-700">PC</div>
             <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-700">+8</div>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
        <div className="flex justify-center">
          <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-widest rounded-full">Today</span>
        </div>
        
        <ChatMessage sender="Joseph Conteh" time="10:24 AM" isSelf={false} message="Good morning everyone! Please remember to review the Q2 outreach playbook I uploaded." />
        <ChatMessage sender="Philip Conteh" time="10:30 AM" isSelf={false} message="Downloaded it! Looks great. Are we still meeting this Thursday to finalize?" />
        <ChatMessage sender="You" time="10:45 AM" isSelf={true} message="Yes, Thursday at 7 PM. See you all then." />
        <ChatMessage sender="Jane Doe" time="11:02 AM" isSelf={false} message="I'll bring the printed copies for the youth leaders." />
      </div>

      <div className="p-4 bg-white border-t border-slate-100 shrink-0">
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-2 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
          <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
            <Paperclip size={20} />
          </button>
          <input 
            type="text" 
            placeholder="Type a message..." 
            className="flex-1 bg-transparent border-none focus:outline-none text-sm px-2 text-slate-700" 
          />
          <button className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

function ChatMessage({ sender, time, message, isSelf }: any) {
  return (
    <div className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}>
      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-xs font-bold text-slate-700">{isSelf ? 'You' : sender}</span>
        <span className="text-[10px] text-slate-400 font-medium">{time}</span>
      </div>
      <div className={`px-4 py-3 rounded-2xl max-w-[80%] text-sm ${isSelf ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white border border-slate-200 text-slate-700 shadow-sm rounded-bl-sm'}`}>
        {message}
      </div>
    </div>
  );
}

function FinanceTab() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h3 className="text-2xl font-bold text-slate-900 font-display">Ministry Finance & Budget</h3>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <button className="w-full sm:w-auto justify-center bg-slate-50 border border-slate-200 text-slate-700 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-100 transition-colors flex items-center gap-2 shadow-sm">
            <Download size={18} />
            Export
          </button>
          <button className="w-full sm:w-auto justify-center bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-sm">
            <Plus size={18} />
            Record Transaction
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 border border-slate-200 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <CreditCard size={20} />
            </div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Allocated Budget</p>
          </div>
          <p className="text-3xl font-black text-slate-900">£15,000</p>
          <p className="text-xs text-slate-500 font-medium mt-2">For Q2 2026</p>
        </div>
        <div className="bg-white p-6 border border-slate-200 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp size={20} />
            </div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Total Income</p>
          </div>
          <p className="text-3xl font-black text-slate-900">£8,450</p>
          <p className="text-xs text-emerald-600 font-bold mt-2 flex items-center gap-1">
            <ArrowRight size={12} className="rotate-[-45deg]" /> Pledges & Donations
          </p>
        </div>
        <div className="bg-white p-6 border border-slate-200 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
               <TrendingUp size={20} className="rotate-180" />
            </div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Total Expenses</p>
          </div>
          <p className="text-3xl font-black text-slate-900">£3,120</p>
          <p className="text-xs text-slate-500 font-medium mt-2">20% of allocated budget used</p>
        </div>
      </div>

      <div className="hidden sm:block bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h4 className="font-bold text-slate-900 text-sm uppercase tracking-widest text-[10px]">Recent Transactions</h4>
          <select className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white font-medium text-slate-700 focus:outline-none">
            <option>All Transactions</option>
            <option>Income</option>
            <option>Expenses</option>
          </select>
        </div>
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-white border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Description</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Category</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Amount</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
               <FinanceRow date="May 5, 2026" description="Retreat Venue Deposit" category="Event Expense" amount="-£1,500" type="expense" status="Cleared" />
               <FinanceRow date="May 2, 2026" description="Pledge Payment - J. Doe" category="Donation" amount="+£250" type="income" status="Cleared" />
               <FinanceRow date="Apr 28, 2026" description="Speaker Honorarium" category="Honorarium" amount="-£300" type="expense" status="Pending" />
               <FinanceRow date="Apr 25, 2026" description="Outreach Supplies" category="Materials" amount="-£120" type="expense" status="Cleared" />
               <FinanceRow date="Apr 20, 2026" description="Ministry Allowance Q2" category="Allocation" amount="+£5,000" type="income" status="Cleared" />
            </tbody>
          </table>
        </div>
      </div>
      <div className="sm:hidden space-y-4">
        <div className="flex justify-between items-center">
          <h4 className="font-bold text-slate-900 text-xs text-[10px] uppercase tracking-widest">Recent Transactions</h4>
          <select className="px-2 py-1 border border-slate-200 rounded-md text-[10px] bg-white font-medium text-slate-700 focus:outline-none">
            <option>All Transactions</option>
            <option>Income</option>
            <option>Expenses</option>
          </select>
        </div>
        <div className="grid grid-cols-1 gap-3">
           <FinanceCard date="May 5, 2026" description="Retreat Venue Deposit" category="Event Expense" amount="-£1,500" type="expense" status="Cleared" />
           <FinanceCard date="May 2, 2026" description="Pledge Payment - J. Doe" category="Donation" amount="+£250" type="income" status="Cleared" />
           <FinanceCard date="Apr 28, 2026" description="Speaker Honorarium" category="Honorarium" amount="-£300" type="expense" status="Pending" />
           <FinanceCard date="Apr 25, 2026" description="Outreach Supplies" category="Materials" amount="-£120" type="expense" status="Cleared" />
           <FinanceCard date="Apr 20, 2026" description="Ministry Allowance Q2" category="Allocation" amount="+£5,000" type="income" status="Cleared" />
        </div>
      </div>
    </div>
  );
}

function FinanceCard({ date, description, category, amount, type, status }: any) {
  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-3">
      <div className="flex justify-between items-start gap-4">
        <div>
          <p className="text-sm font-bold text-slate-900">{description}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[9px] font-bold uppercase rounded-md border border-slate-200">
              {category}
            </span>
          </div>
        </div>
        <div className={`text-right text-sm font-bold whitespace-nowrap shrink-0 ${type === 'income' ? 'text-emerald-600' : 'text-slate-900'}`}>
          {amount}
        </div>
      </div>
      <div className="flex justify-between items-center pt-3 border-t border-slate-100">
        <span className="text-[10px] font-medium text-slate-500">{date}</span>
        <span className={`inline-flex px-2 py-1 text-[8px] font-bold uppercase rounded-full border ${status === 'Cleared' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-orange-50 text-orange-600 border-orange-200'}`}>
          {status}
        </span>
      </div>
    </div>
  );
}

function FinanceRow({ date, description, category, amount, type, status }: any) {
  return (
    <tr className="hover:bg-slate-50 transition-colors bg-white">
      <td className="px-6 py-4 text-sm font-medium text-slate-500 whitespace-nowrap">{date}</td>
      <td className="px-6 py-4">
         <p className="text-sm font-bold text-slate-900">{description}</p>
      </td>
      <td className="px-6 py-4">
         <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase rounded-md border border-slate-200">
           {category}
         </span>
      </td>
      <td className={`px-6 py-4 text-right text-sm font-bold whitespace-nowrap ${type === 'income' ? 'text-emerald-600' : 'text-slate-900'}`}>
         {amount}
      </td>
      <td className="px-6 py-4 text-center">
         <span className={`inline-flex px-2 py-1 text-[10px] font-bold uppercase rounded-full border ${status === 'Cleared' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-orange-50 text-orange-600 border-orange-200'}`}>
           {status}
         </span>
      </td>
    </tr>
  );
}
