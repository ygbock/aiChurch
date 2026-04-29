import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Settings, 
  Users, 
  Megaphone, 
  Calendar, 
  Activity, 
  TrendingUp, 
  Target,
  UserPlus,
  MapPin,
  BookOpen,
  ChevronRight,
  MoreVertical,
  Map as MapIcon,
  Search,
  Filter,
  Download,
  ChevronDown,
  Phone,
  Mail,
  Plus,
  ChevronLeft,
  CheckCircle2,
  Clock,
  AlertCircle,
  MessageSquare,
  ClipboardList,
  FileText,
  UserCheck,
  User,
  Zap,
  Music,
  Mic,
  Monitor,
  Cpu,
  Wrench,
  BarChart3,
  X,
  Globe,
  MonitorPlay,
  Radio,
  Trophy,
  Medal,
  Camera
} from 'lucide-react';
import { doc, getDoc, collection, getDocs, query, where, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useFirebase } from '../components/FirebaseProvider';
import { getScheduledEvents } from '../lib/churchSchedule';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

const attendanceData = [
  { name: 'Wk 1', attendance: 45, target: 50 },
  { name: 'Wk 2', attendance: 52, target: 50 },
  { name: 'Wk 3', attendance: 48, target: 50 },
  { name: 'Wk 4', attendance: 61, target: 50 },
  { name: 'Wk 5', attendance: 55, target: 60 },
  { name: 'Wk 6', attendance: 67, target: 60 },
];

const efficiencyData = [
  { name: 'Jan', efficiency: 78 },
  { name: 'Feb', efficiency: 82 },
  { name: 'Mar', efficiency: 85 },
  { name: 'Apr', efficiency: 89 },
  { name: 'May', efficiency: 87 },
  { name: 'Jun', efficiency: 94 },
];

const PieData = [
  { name: 'Active', value: 85 },
  { name: 'On Leave', value: 10 },
  { name: 'Probation', value: 5 },
];

const COLORS = ['#2563eb', '#64748b', '#f1f5f9'];

export default function DepartmentDashboard() {
  const { departmentId } = useParams();
  const navigate = useNavigate();
  const { profile } = useFirebase();
  const [department, setDepartment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<string | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<any>(null);
  
  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const openModal = (type: string) => {
    setModalType(type);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalType(null);
  };

  useEffect(() => {
    if (!profile?.districtId || !profile?.branchId || !departmentId) return;

    const fetchDept = async () => {
      try {
        const deptRef = doc(db, 'districts', profile.districtId, 'branches', profile.branchId, 'departments', departmentId);
        const deptSnap = await getDoc(deptRef);
        if (deptSnap.exists()) {
          setDepartment({ id: deptSnap.id, ...deptSnap.data() });
        }
      } catch (err) {
        console.error("Failed to fetch department:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDept();
  }, [departmentId, profile]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const isEvangelism = department?.name?.toLowerCase().includes('evangelism') || department?.category === 'Outreach' || department?.id === 'evangelism';
  const isUshering = department?.name?.toLowerCase().includes('usher') || department?.category === 'Hospitality' || department?.id === 'ushering';
  const isChoir = department?.name?.toLowerCase().includes('choir') || department?.category === 'Music' || department?.id === 'choir';
  const isTechnical = department?.name?.toLowerCase().includes('tech') || department?.category === 'Technical' || department?.id === 'technical';

  const getTabs = () => {
    if (isEvangelism) return ['Overview', 'Members', 'Outreach', 'Tasks', 'First-Timers', 'Follow-up'];
    if (isUshering) return ['Overview', 'Members', 'Assignments', 'Schedule', 'Stations', 'Tasks', 'Reports'];
    if (isChoir) return ['Overview', 'Members', 'Repertoire', 'Schedule', 'Tasks', 'Reports'];
    if (isTechnical) return ['Overview', 'Equipment', 'Support', 'Tasks', 'Members', 'Schedule'];
    return ['Overview', 'Members', 'Tasks'];
  };

  const tabs = getTabs();

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8 pb-12"
    >
      {/* Header */}
      <div className="flex flex-col space-y-4">
        <button 
          onClick={() => navigate('/departments')}
          className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors text-sm font-medium w-fit"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 font-display">
              {department?.name || 'Department'} Dashboard
            </h1>
            <p className="text-slate-500 mt-1 font-medium">
              {department?.description || 'Manage departmental assignments, service coverage, and coordination.'}
            </p>
          </div>
          <button className="border border-slate-200 text-slate-900 px-4 py-2 rounded-xl font-bold text-xs hover:bg-slate-50 transition-all flex items-center gap-2">
            <><Settings size={18} /> {department?.name} Settings</>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 md:grid-cols-4 gap-2 sm:gap-6">
        {isUshering ? (
          <>
            <StatBox icon={<Users size={18} className="text-slate-400" />} label="TOTAL USHERS" value="0" />
            <StatBox icon={<UserCheck size={18} className="text-slate-400" />} label="ACTIVE" value="0" />
            <StatBox icon={<Calendar size={18} className="text-slate-400" />} label="SERVICES" value="0" />
            <StatBox icon={<Zap size={18} className="text-slate-400" />} label="COMPLETED" value="2" />
            <StatBox icon={<TrendingUp size={18} className="text-blue-600" />} label="GROWTH" value="+15%" />
            <StatBox icon={<MapPin size={18} className="text-slate-400" />} label="COVERAGE" value="85%" />
          </>
        ) : isChoir ? (
          <>
            <StatBox icon={<Users size={18} className="text-slate-400" />} label="TOTAL MEMBERS" value="0" />
            <StatBox icon={<Activity size={18} className="text-slate-400" />} label="ACTIVE SINGERS" value="0" />
            <StatBox icon={<Calendar size={18} className="text-slate-400" />} label="EVENTS" value="2" />
            <StatBox icon={<TrendingUp size={18} className="text-blue-600" />} label="ACTIVITIES" value="2" />
            <StatBox icon={<TrendingUp size={18} className="text-blue-600" />} label="GROWTH" value="+8%" />
            <StatBox icon={<FileText size={18} className="text-slate-400" />} label="BUDGET" value="0%" />
          </>
        ) : isTechnical ? (
          <>
            <StatBox icon={<Users size={18} className="text-slate-400" />} label="TEAM" value="0" />
            <StatBox icon={<Monitor size={18} className="text-slate-400" />} label="EQUIPMENT" value="3" />
            <StatBox icon={<AlertCircle size={18} className="text-slate-400" />} label="TICKETS" value="0" />
            <StatBox icon={<Activity size={18} className="text-emerald-500" />} label="UPTIME" value="99.2%" />
            <StatBox icon={<Activity size={18} className="text-blue-500" />} label="HEALTH" value="95%" />
            <StatBox icon={<AlertCircle size={18} className="text-rose-500" />} label="ISSUES" value="0" />
          </>
        ) : (
          <>
            <StatBox icon={<Users size={18} className="text-slate-400" />} label="MEMBERS" value="0" />
            <StatBox icon={<Megaphone size={18} className="text-slate-400" />} label="ACTIVE" value="0" />
            <StatBox icon={<Calendar size={18} className="text-slate-400" />} label="EVENTS" value="0" />
            <StatBox icon={<Activity size={18} className="text-slate-400" />} label="OUTREACHES" value="0" />
            <StatBox icon={<TrendingUp size={18} className="text-blue-600" />} label="GROWTH" value="+18%" />
            <StatBox icon={<Target size={18} className="text-slate-400" />} label="CONVERSIONS" value="0" />
          </>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isUshering ? (
          <>
            <ActionButton icon={<UserPlus size={20} />} label="Add Usher" active={true} onClick={() => openModal('add_member')} />
            <ActionButton icon={<Calendar size={20} />} label="Assign Service" onClick={() => openModal('assign_service')} />
            <ActionButton icon={<ClipboardList size={20} />} label="Create Schedule" onClick={() => openModal('create_schedule')} />
            <ActionButton icon={<Users size={20} />} label="Training Session" onClick={() => openModal('training')} />
          </>
        ) : isChoir ? (
          <>
            <ActionButton icon={<UserPlus size={20} />} label="Add Singer" active={true} onClick={() => openModal('add_member')} />
            <ActionButton icon={<Calendar size={20} />} label="Schedule Rehearsal" onClick={() => openModal('schedule_rehearsal')} />
            <ActionButton icon={<Music size={20} />} label="Add Song" onClick={() => openModal('add_song')} />
            <ActionButton icon={<Download size={20} />} label="Import Members" onClick={() => openModal('import_members')} />
          </>
        ) : isTechnical ? (
          <>
            <ActionButton icon={<UserPlus size={20} />} label="Add Member" active={true} onClick={() => openModal('add_member')} />
            <ActionButton icon={<AlertCircle size={20} />} label="New Ticket" onClick={() => openModal('new_ticket')} />
            <ActionButton icon={<Monitor size={20} />} label="Add Equipment" onClick={() => openModal('add_equipment')} />
            <ActionButton icon={<Wrench size={20} />} label="Schedule Maintenance" onClick={() => openModal('schedule_maintenance')} />
          </>
        ) : (
          <>
            <ActionButton icon={<UserPlus size={20} />} label="Add Member" active={true} onClick={() => openModal('add_member')} />
            <ActionButton icon={<Calendar size={20} />} label="Plan Outreach" onClick={() => openModal('plan_outreach')} />
            <ActionButton icon={<Target size={20} />} label="Add Follow-up" onClick={() => openModal('add_followup')} />
            <ActionButton icon={<BookOpen size={20} />} label="Training" onClick={() => openModal('training')} />
          </>
        )}
      </div>

      {/* Modal Backdrop and Content */}
      <AnimatePresence>
        {isModalOpen && (
          <Modal 
            isOpen={isModalOpen} 
            onClose={closeModal} 
            title={
              modalType === 'add_member' ? (isChoir ? 'Add New Singer' : isUshering ? 'Add New Usher' : 'Add New Member') :
              modalType === 'plan_outreach' ? 'Plan Outreach Event' :
              modalType === 'schedule_rehearsal' ? 'Schedule Choir Rehearsal' :
              modalType === 'add_song' ? 'Add Song to Repertoire' :
              modalType === 'new_ticket' ? 'Create Technical Support Ticket' :
              modalType === 'add_equipment' ? 'Register New Equipment' :
              'Action Form'
            }
          >
            <div className="p-1">
              {modalType === 'add_member' && <AddMemberForm department={department} onClose={closeModal} />}
              {modalType === 'plan_outreach' && <PlanOutreachForm onClose={closeModal} />}
              {modalType === 'schedule_rehearsal' && <ScheduleRehearsalForm onClose={closeModal} />}
              {modalType === 'new_ticket' && <NewTicketForm onClose={closeModal} />}
              {modalType === 'add_song' && <AddSongForm onClose={closeModal} />}
              {modalType === 'add_equipment' && <AddEquipmentForm onClose={closeModal} />}
              {modalType === 'update_equipment' && <UpdateEquipmentForm equipment={selectedEquipment} onClose={closeModal} />}
              {modalType === 'assign_service' && <AssignServiceForm onClose={closeModal} department={department} selectedDate={selectedDate} />}
              {!['add_member', 'plan_outreach', 'schedule_rehearsal', 'new_ticket', 'add_song', 'add_equipment', 'update_equipment', 'assign_service'].includes(modalType || '') && (
                <div className="p-12 text-center flex flex-col items-center gap-4">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                    <Activity size={32} />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-slate-900 leading-none capitalize">{modalType?.replace(/_/g, ' ')}</p>
                    <p className="text-sm text-slate-400 mt-2 italic">Module coming soon...</p>
                  </div>
                  <button onClick={closeModal} className="mt-4 px-6 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold">
                    Close
                  </button>
                </div>
              )}
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className={`p-1 rounded-2xl flex overflow-x-auto no-scrollbar border-b border-slate-200`}>
        <div className={`flex gap-8`}>
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-sm font-bold transition-all relative whitespace-nowrap pb-4 ${activeTab === tab ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
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
          {isTechnical && (
            <div className="space-y-8">
              {/* System Health Overview */}
              <section className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 leading-none">System Health Overview</h3>
                  <p className="text-sm text-slate-500 mt-2">Current status of all technical systems</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <SystemHealthCard 
                    title="Audio Systems" 
                    uptime="99.8%" 
                    status="operational" 
                    issues={0} 
                  />
                  <SystemHealthCard 
                    title="Video Systems" 
                    uptime="99.5%" 
                    status="operational" 
                    issues={1} 
                  />
                  <SystemHealthCard 
                    title="Network Infrastructure" 
                    uptime="99.9%" 
                    status="operational" 
                    issues={0} 
                  />
                  <SystemHealthCard 
                    title="Streaming Platform" 
                    uptime="98.2%" 
                    status="maintenance" 
                    issues={2} 
                  />
                </div>
              </section>

              {/* Equipment Status */}
              <section className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 leading-none">Equipment Status</h3>
                  <p className="text-sm text-slate-500 mt-2">Current operational status of key equipment</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <EquipmentStatusCard 
                    name="Main Sound Board" 
                    category="Audio Mixer"
                    location="Sound Booth"
                    nextMaintenance="2024-04-15"
                    assigned="Sarah Johnson"
                    status="operational"
                  />
                  <EquipmentStatusCard 
                    name="Projector 1" 
                    category="Video Projector"
                    location="Sanctuary"
                    nextMaintenance="2024-07-10"
                    assigned="David Wilson"
                    status="operational"
                  />
                  <EquipmentStatusCard 
                    name="Live Stream Encoder" 
                    category="Streaming Equipment"
                    location="Media Room"
                    nextMaintenance="2024-01-30"
                    assigned="Emily Davis"
                    status="maintenance"
                  />
                </div>
              </section>

              {/* Recent Support Tickets */}
              <section className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-2xl font-bold text-slate-900 mb-1 leading-none">Recent Support Tickets</h3>
                <p className="text-sm text-slate-500 mb-8">Latest technical support requests</p>
                <div className="py-12 border-2 border-dashed border-slate-100 rounded-xl flex flex-col items-center justify-center text-slate-300 gap-4">
                  <AlertCircle size={40} className="opacity-20" />
                  <p className="font-medium italic">No active support tickets reported</p>
                </div>
              </section>
            </div>
          )}

          {isChoir && (
            <div className="space-y-8">
              {/* Voice Part Distribution */}
              <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-2xl font-bold text-slate-800 font-display">Voice Part Distribution</h3>
                <p className="text-sm text-slate-500 mb-6">Current distribution of singers by voice part</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <VoicePartStat icon={<Music size={20} />} label="SOPRANO" value="0" />
                  <VoicePartStat icon={<Mic size={20} />} label="ALTO" value="0" />
                  <VoicePartStat icon={<Music size={20} />} label="TENOR" value="0" />
                  <VoicePartStat icon={<Mic size={20} />} label="BASS" value="0" />
                </div>
              </section>

              {/* Recent Performances */}
              <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-2xl font-bold text-slate-800 font-display">Recent Performances</h3>
                <p className="text-sm text-slate-500 mb-6">Latest choir performances and events</p>
                <div className="space-y-3">
                  <PerformanceItem title="Devine Service" date="2026-01-11" type="service" attendees={0} />
                  <PerformanceItem title="Convenent Sunday" date="2026-01-04" type="service" attendees={0} />
                </div>
              </section>

              {/* Upcoming Rehearsals */}
              <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-2xl font-bold text-slate-800 font-display">Upcoming Rehearsals</h3>
                <p className="text-sm text-slate-500 mb-6">Next scheduled choir practices</p>
                <div className="space-y-3">
                  <RehearsalItem title="Devine Service" date="2026-01-11" songs={0} singers={0} />
                  <RehearsalItem title="Convenent Sunday" date="2026-01-04" songs={0} singers={0} />
                </div>
              </section>
            </div>
          )}

          {isUshering && (
            <div className="space-y-8">
              {/* Service Coverage This Week */}
              <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-xl font-bold text-slate-900 mb-1">Service Coverage This Week</h3>
                <p className="text-sm text-slate-500 mb-6">Current and upcoming service assignments</p>
                <div className="h-24 flex items-center justify-center border-2 border-dashed border-slate-100 rounded-lg">
                  <p className="text-slate-300 text-sm font-medium italic">Service timeline visualization coming soon</p>
                </div>
              </section>

              {/* Station Assignments */}
              <section className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Station Assignments</h3>
                  <p className="text-sm text-slate-500">Current usher station coverage</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <StationCard title="Main Entrance" assigned="2/2 ushers assigned" status="green" onClick={() => setActiveTab('Stations')} />
                  <StationCard title="Sanctuary Doors" assigned="1/2 ushers assigned" status="yellow" onClick={() => setActiveTab('Stations')} />
                  <StationCard title="Welcome Desk" assigned="1/1 ushers assigned" status="green" onClick={() => setActiveTab('Stations')} />
                  <StationCard title="Parking Lot" assigned="1/1 ushers assigned" status="green" onClick={() => setActiveTab('Stations')} />
                  <StationCard title="Children's Area" assigned="0/1 ushers assigned" status="red" onClick={() => setActiveTab('Stations')} />
                  <StationCard title="Overflow Area" assigned="0/1 ushers assigned" status="red" onClick={() => setActiveTab('Stations')} />
                </div>
              </section>

              {/* Recent Services */}
              <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-xl font-bold text-slate-900 mb-1">Recent Services</h3>
                <p className="text-sm text-slate-500 mb-6">Completed service assignments and attendance</p>
                <div className="h-24 flex items-center justify-center border-2 border-dashed border-slate-100 rounded-lg">
                  <p className="text-slate-300 text-sm font-medium italic">Completed service logs coming soon</p>
                </div>
              </section>
            </div>
          )}

          {/* Outreach Areas */}
          {isEvangelism && (
            <section className="space-y-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Outreach Areas</h3>
                <p className="text-sm text-slate-500">Current evangelism coverage areas</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <AreaCard name="Downtown" members={3} events={8} conversions={12} dotColor="bg-blue-500" />
                <AreaCard name="North Side" members={2} events={6} conversions={8} dotColor="bg-emerald-500" />
                <AreaCard name="South District" members={2} events={4} conversions={6} dotColor="bg-amber-500" />
                <AreaCard name="East End" members={1} events={3} conversions={4} dotColor="bg-purple-500" />
                <AreaCard name="West Side" members={1} events={2} conversions={4} dotColor="bg-rose-500" />
                <AreaCard name="University" members={1} events={1} conversions={2} dotColor="bg-indigo-500" />
              </div>
            </section>
          )}

          {/* Upcoming Events */}
          <section className="space-y-4">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Upcoming Outreach Events</h3>
              <p className="text-sm text-slate-500">Scheduled evangelism activities</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <EventRow 
                name="Downtown Street Outreach" 
                date="2024-01-30" 
                location="City Center" 
                expected={25} 
                category="Street Ministry" 
              />
              <EventRow 
                name="Community Block Party" 
                date="2024-01-27" 
                location="North Side Park" 
                expected={45} 
                category="Community Event" 
              />
            </div>
          </section>

          {/* Follow-up Pipeline */}
          {isEvangelism && (
            <section className="space-y-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Follow-up Pipeline</h3>
                <p className="text-sm text-slate-500">Current status of evangelism contacts</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <PipelineStat color="bg-slate-400" value={5} label="New" />
                <PipelineStat color="bg-amber-400" value={8} label="Contacted" />
                <PipelineStat color="bg-blue-400" value={6} label="Interested" />
                <PipelineStat color="bg-emerald-400" value={3} label="Converted" />
                <PipelineStat color="bg-rose-400" value={2} label="Not Interested" />
              </div>
            </section>
          )}
        </div>
      )}

      {activeTab === 'Members' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h3 className="text-2xl font-bold text-slate-900 leading-none">
              {isChoir ? 'Choir Singers' : (isUshering ? 'Usher Team' : (isTechnical ? 'Technical Team' : `${department?.name || 'Department'} Team`))}
            </h3>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <button className="flex-1 md:flex-none bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                <UserPlus size={16} />
                {isChoir ? 'Add Singer' : (isUshering ? 'Add Usher' : (isTechnical ? 'Add Technical Member' : 'Add Member'))}
              </button>
              <button className="flex-1 md:flex-none border border-slate-200 text-slate-600 px-4 py-2 rounded-lg font-bold text-sm hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
                <Download size={16} />
                Export List
              </button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder={isChoir ? "Search singers..." : (isUshering ? "Search ushers..." : (isTechnical ? "Search technical team..." : "Search members..."))}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
              />
            </div>
            <div className="flex flex-wrap gap-4">
              <div className="relative min-w-[140px]">
                <select className="appearance-none w-full bg-white border border-slate-200 rounded-lg px-4 py-2 pr-10 text-sm font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>{isChoir ? 'All Parts' : (isUshering ? 'All Stations' : (isTechnical ? 'All Assets' : 'All Areas'))}</option>
                  {isChoir ? (
                    <>
                      <option>Soprano</option>
                      <option>Alto</option>
                      <option>Tenor</option>
                      <option>Bass</option>
                    </>
                  ) : isUshering ? (
                    <>
                      <option>Main Entrance</option>
                      <option>Sanctuary</option>
                      <option>Overflow</option>
                    </>
                  ) : isTechnical ? (
                    <>
                      <option>Audio</option>
                      <option>Video</option>
                      <option>IT/Network</option>
                      <option>Streaming</option>
                    </>
                  ) : (
                    <>
                      <option>Downtown</option>
                      <option>North Side</option>
                    </>
                  )}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
              </div>
              <div className="relative min-w-[140px]">
                <select className="appearance-none w-full bg-white border border-slate-200 rounded-lg px-4 py-2 pr-10 text-sm font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>All Status</option>
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">{isChoir ? 'Singer' : (isUshering ? 'Usher' : (isTechnical ? 'Staff' : 'Member'))}</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">{isChoir ? 'Voice Part' : (isUshering ? 'Station' : (isTechnical ? 'Specialization' : 'Area'))}</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Role</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-center">{isChoir ? 'Soloist' : (isUshering ? 'Experience' : (isTechnical ? 'Certifications' : 'Events Led'))}</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-center">{isUshering ? 'Availability' : (isTechnical ? 'Devices' : 'Attendance')}</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                <MemberRow 
                  id="mem-1" 
                  name="John Smith" 
                  initial="JS"
                  dept={isChoir ? 'Tenor' : (isUshering ? 'Main Entrance' : (isTechnical ? 'Audio' : 'Main Area'))} 
                  role="Lead" 
                  status="Active" 
                  onView={() => navigate(`/departments/${departmentId}/members/mem-1`)}
                />
                <MemberRow 
                  id="mem-2" 
                  name="Sarah Johnson" 
                  initial="SJ"
                  dept={isChoir ? 'Soprano' : (isUshering ? 'Sanctuary' : (isTechnical ? 'Support' : 'Outreach'))} 
                  role="Member" 
                  status="Active" 
                  onView={() => navigate(`/departments/${departmentId}/members/mem-2`)}
                />
                <MemberRow 
                  id="mem-3" 
                  name="Michael Brown" 
                  initial="MB"
                  dept={isChoir ? 'Bass' : (isUshering ? 'Parking' : (isTechnical ? 'IT' : 'North Side'))} 
                  role="Member" 
                  status="Active" 
                  onView={() => navigate(`/departments/${departmentId}/members/mem-3`)}
                />
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'Outreach' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-2xl font-bold text-slate-900 leading-none">Outreach Calendar</h3>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-700 transition-colors flex items-center gap-2">
                <Plus size={16} />
                Schedule Outreach
              </button>
            </div>
            
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="grid grid-cols-7 text-center border-b border-slate-100">
                {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
                  <div key={day} className="py-4 text-[10px] font-black text-slate-400 tracking-widest uppercase">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {Array.from({ length: 35 }).map((_, i) => {
                  const day = i - 2; // Offset for January 2026 starts on Thursday
                  const isCurrentMonth = day > 0 && day <= 31;
                  const isToday = day === 23;
                  return (
                    <div 
                      key={i} 
                      className={`h-24 p-2 border-r border-b border-slate-50 last:border-r-0 relative group transition-colors hover:bg-slate-50/50 cursor-pointer ${!isCurrentMonth ? 'bg-slate-50/30' : ''}`}
                    >
                      <span className={`text-xs font-bold ${!isCurrentMonth ? 'text-slate-300' : isToday ? 'text-white' : 'text-slate-400'}`}>
                        {isCurrentMonth ? day : ''}
                      </span>
                      {isToday && (
                        <div className="absolute top-1 left-1 w-6 h-6 bg-blue-600 -z-10 rounded-full flex items-center justify-center transform -translate-x-[2px] -translate-y-[2px]" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm h-[400px] flex flex-col justify-between">
              <div>
                <h4 className="text-lg font-black text-slate-900 mb-6">Upcoming Outreach</h4>
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-center gap-4">
                  <Activity size={40} className="opacity-20" />
                  <p className="font-medium text-sm">No upcoming outreach</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
              <h4 className="text-lg font-black text-slate-900 mb-6 font-display">Team Assignments</h4>
              
              <div className="p-4 rounded-xl border border-slate-100 space-y-4">
                <div className="flex justify-between items-start">
                  <span className="text-sm font-bold text-slate-900">Next Outreach</span>
                  <span className="text-[10px] font-bold px-2 py-1 bg-slate-50 text-slate-500 rounded uppercase tracking-wider">Saturday</span>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-medium">Lead:</span>
                    <span className="font-bold text-slate-900">Paul Smith</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-medium">Team:</span>
                    <span className="font-bold text-slate-900">Downtown Group</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-50 flex justify-center">
                  <button className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors uppercase tracking-widest">
                    View Assignments
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'First-Timers' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-2xl font-bold text-slate-900 mb-1">First-Timers Management</h3>
              <p className="text-sm text-slate-500">Track and follow up with visitors to the church</p>
            </div>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-700 transition-colors flex items-center gap-2">
              <UserPlus size={16} />
              Add First-Timer
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-slate-50/30">
                  <th className="px-6 py-4 w-12 border-b border-slate-100">
                    <div className="w-4 h-4 rounded border border-slate-300" />
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Visitor Identity</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Encounter Details</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Allocation</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Lifecycle</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                <VisitorRow 
                  initial="F"
                  name="Fatu Sesay"
                  phone="+23288808438"
                  email="fatu@example.com"
                  date="Jan 5, 2026"
                  location="Central London"
                  allocation="Beccie St. Branch"
                  status="NEW"
                  lifecycle="PENDING"
                />
                <VisitorRow 
                  initial="F"
                  name="Fatmata Sesay"
                  phone="+123123456"
                  email="fatmata@example.com"
                  date="Jan 24, 2026"
                  location="East London"
                  allocation="Beccie St. Branch"
                  status="NEW"
                  lifecycle="PENDING"
                />
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'Tasks' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div>
              <h3 className="text-2xl font-bold text-slate-900 leading-none">Department Tasks</h3>
              <p className="text-sm text-slate-500 mt-2">Manage departmental operations and assignments</p>
            </div>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-700 transition-colors flex items-center gap-2">
              <Plus size={16} />
              New Task
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatBox icon={<Activity size={18} className="text-blue-500" />} label="ACTIVE TASKS" value="12" />
            <StatBox icon={<Clock size={18} className="text-amber-500" />} label="DUE SOON" value="5" />
            <StatBox icon={<CheckCircle2 size={18} className="text-emerald-500" />} label="COMPLETED" value="28" />
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex flex-wrap gap-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input type="text" placeholder="Search tasks..." className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium" />
              </div>
              <select className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>All Status</option>
                <option>To Do</option>
                <option>In Progress</option>
                <option>Completed</option>
              </select>
            </div>
            <div className="divide-y divide-slate-50">
              <TaskItem title="Organize Sunday Street Team" assignee="Paul Smith" priority="High" dueDate="Tomorrow" status="In Progress" />
              <TaskItem title="Update Follow-up Database" assignee="Fatu Sesay" priority="Medium" dueDate="Jan 30" status="To Do" />
              <TaskItem title="Print Evangelism Tracts" assignee="Mark J." priority="Low" dueDate="Jan 28" status="To Do" />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Follow-up' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div>
              <h3 className="text-2xl font-bold text-slate-900 leading-none">Follow-up Tracker</h3>
              <p className="text-sm text-slate-500 mt-2">Nurture relationships with new converts and visitors</p>
            </div>
            <div className="flex gap-3">
              <button className="border border-slate-200 text-slate-600 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-slate-50 transition-colors">
                <Calendar size={16} />
                Schedule Bulk
              </button>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-blue-700 transition-colors">
                <TrendingUp size={16} />
                View Reports
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Person</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Last Contact</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-center">Outcome</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-center">Next Step</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  <FollowUpRow name="John Doe" lastContact="2 days ago" method="Phone Call" outcome="Interested" nextStep="Invite to Service" />
                  <FollowUpRow name="Sarah Wilson" lastContact="Yesterday" method="Visit" outcome="Needs Prayer" nextStep="Home Visit" />
                  <FollowUpRow name="Michael Brown" lastContact="1 week ago" method="SMS" outcome="No Response" nextStep="Call Again" />
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Repertoire' && isChoir && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="text-2xl font-bold text-slate-900 leading-none">Song Repertoire</h3>
              <p className="text-sm text-slate-500 mt-2">Manage library of hymns, worship songs, and choir pieces</p>
            </div>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-700 transition-colors flex items-center gap-2">
              <Plus size={16} />
              New Song
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
             <StatBox icon={<Music size={18} className="text-blue-500" />} label="TOTAL SONGS" value="0" />
             <StatBox icon={<CheckCircle2 size={18} className="text-emerald-500" />} label="MASTERED" value="0" />
             <StatBox icon={<Activity size={18} className="text-amber-500" />} label="LEARNING" value="0" />
             <StatBox icon={<BarChart3 size={18} className="text-slate-500" />} label="ARCHIVED" value="0" />
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-center">#</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Song Title</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Theme / Genre</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-center">BPM / Key</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Proficiency</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                <SongRow title="Ancient of Days" theme="Worship" key="C" bpm={72} status="Mastered" />
                <SongRow title="Total Praise" theme="Classical" key="Db" bpm={64} status="Learning" />
                <SongRow title="Hallelujah Chorus" theme="Hymn" key="D" bpm={110} status="Archived" />
                <SongRow title="Way Maker" theme="Contemporary" key="E" bpm={68} status="Mastered" />
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'Assignments' && isUshering && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="text-2xl font-bold text-slate-900 leading-none">Shift Assignments</h3>
              <p className="text-sm text-slate-500 mt-2">Designate ushers to specific service stations and gates</p>
            </div>
            <button 
              onClick={() => openModal('assign_service')}
              className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-black transition-all flex items-center gap-2 shadow-lg shadow-slate-200"
            >
              <UserCheck size={18} />
              Quick Assign
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
                <div className="flex justify-between items-center">
                  <h4 className="text-lg font-bold text-slate-900">Sanctuary - First Service</h4>
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest leading-none">Full Staff</span>
                </div>
                <div className="space-y-3">
                  <AssignmentLine role="Lead Usher" name="Paul Smith" />
                  <AssignmentLine role="Main Gate" name="Sarah Wilson" />
                  <AssignmentLine role="Sanctuary Door A" name="Michael Brown" />
                  <AssignmentLine role="Offering Collection" name="John Davis" />
                </div>
             </div>

             <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
                <div className="flex justify-between items-center">
                  <h4 className="text-lg font-bold text-slate-900">Children's Wing</h4>
                  <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-widest leading-none">Needs 2 More</span>
                </div>
                <div className="space-y-3">
                  <AssignmentLine role="Area Lead" name="Emily Davis" />
                  <AssignmentLine role="Registration Desk" name="Mark J." />
                  <AssignmentLine role="Corridor Patrol" name="Unassigned" empty />
                  <AssignmentLine role="Safety Monitor" name="Unassigned" empty />
                </div>
             </div>
          </div>
        </div>
      )}

      {activeTab === 'Schedule' && (isUshering || isChoir || isTechnical) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div>
                <h3 className="text-2xl font-bold text-slate-900 leading-none">
                  {isChoir ? 'Music Calendar' : (isTechnical ? 'Maintenance Schedule' : 'Service Schedule')}
                </h3>
                <p className="text-sm text-slate-500 mt-2">Manage assignments and coverage</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => openModal(isChoir ? 'add_song' : (isTechnical ? 'schedule_maintenance' : 'assign_service'))}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
                >
                  <Plus size={18} />
                  {isChoir ? 'Add Rehearsal' : 'Add Event'}
                </button>
              </div>
            </div>
            
            <ServiceCalendar 
              currentDate={currentDate} 
              setCurrentDate={setCurrentDate}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              getEvents={getScheduledEvents}
            />
          </div>

          <div className="space-y-6">
            <ScheduleDayView 
              date={selectedDate} 
              isChoir={isChoir} 
              isUshering={isUshering} 
              isTechnical={isTechnical}
              events={getScheduledEvents(selectedDate)}
              onAssign={() => openModal('assign_service')}
            />
          </div>
        </div>
      )}

      {activeTab === 'Stations' && isUshering && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div>
              <h3 className="text-2xl font-bold text-slate-900 leading-none">Stations Management</h3>
              <p className="text-sm text-slate-500 mt-2">Define and oversee usher deployment zones</p>
            </div>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-700 transition-colors flex items-center gap-2">
              <Plus size={16} />
              New Station
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StationManagementCard title="Main Entrance" headUsher="Paul Smith" totalUshers={4} status="Active" color="emerald" />
            <StationManagementCard title="Sanctuary" headUsher="Sarah Wilson" totalUshers={6} status="Active" color="blue" />
            <StationManagementCard title="Children's Area" headUsher="Mark J." totalUshers={2} status="Understaffed" color="rose" />
            <StationManagementCard title="Overflow" headUsher="Not Assigned" totalUshers={0} status="Inactive" color="slate" />
          </div>
        </div>
      )}

      {activeTab === 'Reports' && (isUshering || isChoir) && (
        <div className="space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <div>
              <h3 className="text-2xl font-bold text-slate-900 leading-none">
                {isChoir ? 'Music & Vocal Analytics' : 'Departmental Performance & Trends'}
              </h3>
              <p className="text-sm text-slate-500 mt-2">
                {isChoir ? 'Detailed insights into choir growth, mastery, and attendance.' : 'Comprehensive tracking of attendance trends, growth metrics, and efficiency.'}
              </p>
            </div>
            <div className="flex gap-3">
              <button className="px-4 py-2 bg-slate-50 text-slate-600 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-slate-100 transition-colors border border-slate-100">
                <Download size={16} />
                Export CSV
              </button>
              <button className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-lg shadow-blue-100">
                <FileText size={18} />
                Full Report
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Attendance Trend */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-8">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-lg font-bold text-slate-900 leading-none">Attendance Trends</h4>
                  <p className="text-xs text-slate-400 mt-1 uppercase font-black tracking-widest">Last 6 Weeks</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 bg-blue-600 rounded-full" />
                    <span className="text-[10px] font-black text-slate-400 uppercase">Actual</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 bg-slate-200 rounded-full" />
                    <span className="text-[10px] font-black text-slate-400 uppercase">Target</span>
                  </div>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={attendanceData}>
                    <defs>
                      <linearGradient id="colorAttend" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} />
                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }} />
                    <Area type="monotone" dataKey="attendance" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorAttend)" dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} />
                    <Area type="monotone" dataKey="target" stroke="#e2e8f0" strokeWidth={2} strokeDasharray="5 5" fill="none" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Growth & Efficiency */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-8">
               <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-lg font-bold text-slate-900 leading-none">Operational Efficiency</h4>
                  <p className="text-xs text-slate-400 mt-1 uppercase font-black tracking-widest">Growth Percentage</p>
                </div>
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg flex items-center gap-2">
                  <TrendingUp size={16} />
                  <span className="text-xs font-black">+12.4%</span>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={efficiencyData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="efficiency" fill="#2563eb" radius={[6, 6, 0, 0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                <h4 className="text-lg font-bold text-slate-900 mb-6">Member Status</h4>
                <div className="h-48 relative">
                   <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={PieData}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {PieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-bold text-slate-900">85%</span>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Active Ratio</span>
                  </div>
                </div>
                <div className="mt-6 space-y-3">
                   {PieData.map((item, idx) => (
                     <div key={item.name} className="flex justify-between items-center">
                       <div className="flex items-center gap-2">
                         <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx] }} />
                         <span className="text-xs font-bold text-slate-600">{item.name}</span>
                       </div>
                       <span className="text-xs font-black text-slate-900 underline decoration-slate-100 underline-offset-4">{item.value}%</span>
                     </div>
                   ))}
                </div>
            </div>

            <div className="lg:col-span-2 bg-slate-900 p-10 rounded-3xl shadow-xl shadow-slate-200 relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full -mr-32 -mt-32 opacity-10" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full -ml-16 -mb-16 opacity-5" />
              
              <div className="relative z-10">
                <h4 className="text-2xl font-bold text-white mb-2">Automated Report Scheduler</h4>
                <p className="text-slate-400 text-sm max-w-sm">Set up recurring reports to be sent directly to your district admin email.</p>
              </div>

              <div className="relative z-10 flex flex-wrap gap-4 mt-8">
                <div className="px-4 py-2 bg-slate-800 rounded-xl border border-slate-700 flex items-center gap-3">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-xs font-bold text-white uppercase tracking-widest">Next Report: Monday 8:00 AM</span>
                </div>
                <button className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-900/50">
                  Configure Schedule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Equipment' && isTechnical && (
        <div className="space-y-10">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="space-y-1">
              <h3 className="text-4xl font-black text-slate-900 tracking-tight leading-none">Equipment Repository</h3>
              <p className="text-slate-500 font-medium max-w-xl">Asset management protocols and technical lifecycle tracking for department hardware.</p>
            </div>
            <button 
               onClick={() => openModal('add_equipment')}
               className="group flex items-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-[2rem] font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 active:scale-95"
            >
              <Plus size={18} className="group-hover:rotate-90 transition-transform" />
              Add Technical Asset
            </button>
          </div>

          <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm">
             <div className="relative group max-w-2xl">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                <input 
                  type="text" 
                  placeholder="Search repository by barcode, serial, or assignment..."
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-14 pr-6 text-sm font-bold focus:ring-2 focus:ring-blue-50 transition-all outline-none"
                />
             </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <EquipmentStatusCard 
              name="Main Sound Board" 
              category="Audio Mixer"
              location="Central Sound Booth"
              nextMaintenance="2024-04-15"
              assigned="Sarah Johnson"
              status="operational"
              onUpdate={() => { setSelectedEquipment({ name: 'Main Sound Board', category: 'Audio Mixer', status: 'operational' }); openModal('update_equipment'); }}
            />
            <EquipmentStatusCard 
              name="Primary Projection A" 
              category="Video Projector"
              location="Sanctuary Main"
              nextMaintenance="2024-07-10"
              assigned="David Wilson"
              status="operational"
              onUpdate={() => { setSelectedEquipment({ name: 'Primary Projection A', category: 'Video Projector', status: 'operational' }); openModal('update_equipment'); }}
            />
            <EquipmentStatusCard 
              name="Live Stream Encoder" 
              category="Streaming Equipment"
              location="Media Control Room"
              nextMaintenance="2024-01-30"
              assigned="Emily Davis"
              status="maintenance"
              onUpdate={() => { setSelectedEquipment({ name: 'Live Stream Encoder', category: 'Streaming Equipment', status: 'maintenance' }); openModal('update_equipment'); }}
            />
            <EquipmentStatusCard 
              name="Stage Lighting Array" 
              category="Lighting"
              location="Technical Booth"
              nextMaintenance="2024-05-20"
              assigned="Mark Thompson"
              status="operational"
              onUpdate={() => { setSelectedEquipment({ name: 'Stage Lighting Array', category: 'Lighting', status: 'operational' }); openModal('update_equipment'); }}
            />
            <EquipmentStatusCard 
              name="Wireless Vocal Pack B" 
              category="Audio"
              location="Storage Locker 1"
              nextMaintenance="2024-04-01"
              assigned="Sarah Johnson"
              status="offline"
              onUpdate={() => { setSelectedEquipment({ name: 'Wireless Vocal Pack B', category: 'Audio', status: 'offline' }); openModal('update_equipment'); }}
            />
             <EquipmentStatusCard 
              name="Network Core Switch" 
              category="Networking"
              location="Server Rack A"
              nextMaintenance="2024-09-12"
              assigned="David Wilson"
              status="operational"
              onUpdate={() => { setSelectedEquipment({ name: 'Network Core Switch', category: 'Networking', status: 'operational' }); openModal('update_equipment'); }}
            />
          </div>
        </div>
      )}

      {activeTab === 'Support' && isTechnical && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
             <div>
              <h3 className="text-2xl font-bold text-slate-900 leading-none">Support Tickets</h3>
              <p className="text-sm text-slate-500 mt-2">Technical support requests and infrastructure issues</p>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Search tickets..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                />
              </div>
              <button 
                onClick={() => openModal('new_ticket')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm whitespace-nowrap"
              >
                <Plus size={18} />
                New Ticket
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex gap-4 overflow-x-auto no-scrollbar">
              <button className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-black uppercase tracking-wider">All Tickets (5)</button>
              <button className="px-4 py-2 hover:bg-slate-50 text-slate-500 rounded-lg text-xs font-black uppercase tracking-wider">Open (2)</button>
              <button className="px-4 py-2 hover:bg-slate-50 text-slate-500 rounded-lg text-xs font-black uppercase tracking-wider">In Progress (1)</button>
              <button className="px-4 py-2 hover:bg-slate-50 text-slate-500 rounded-lg text-xs font-black uppercase tracking-wider">Resolved (2)</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Ticket ID</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Issue / Problem</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Category</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Priority</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-center">Status</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Assigned To</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  <TicketRow 
                    id="TCK-1024" 
                    subject="Microphone static in main hall" 
                    category="Audio" 
                    priority="High" 
                    status="Open" 
                    assignee="Sarah Johnson" 
                    date="2 hrs ago"
                  />
                  <TicketRow 
                    id="TCK-1023" 
                    subject="Live stream latency issues" 
                    category="Streaming" 
                    priority="Medium" 
                    status="In Progress" 
                    assignee="Emily Davis" 
                    date="Yesterday"
                  />
                  <TicketRow 
                    id="TCK-1022" 
                    subject="VPN access for remote mixers" 
                    category="IT/Network" 
                    priority="Low" 
                    status="Resolved" 
                    assignee="David Wilson" 
                    date="2 days ago"
                  />
                   <TicketRow 
                    id="TCK-1021" 
                    subject="Bulb replacement for front projector" 
                    category="Video" 
                    priority="High" 
                    status="Open" 
                    assignee="Unassigned" 
                    date="3 days ago"
                  />
                  <TicketRow 
                    id="TCK-1020" 
                    subject="Network switch reboot" 
                    category="IT/Network" 
                    priority="Critical" 
                    status="Resolved" 
                    assignee="David Wilson" 
                    date="4 days ago"
                  />
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab !== 'Overview' && activeTab !== 'Members' && activeTab !== 'Outreach' && activeTab !== 'First-Timers' && activeTab !== 'Tasks' && activeTab !== 'Follow-up' && activeTab !== 'Schedule' && activeTab !== 'Stations' && activeTab !== 'Reports' && activeTab !== 'Repertoire' && activeTab !== 'Equipment' && activeTab !== 'Support' && (
        <div className="h-64 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
          <Activity size={48} className="mb-4 opacity-20" />
          <p className="font-medium">{activeTab} module coming soon</p>
          <p className="text-xs">We're finalizing the {activeTab.toLowerCase()} management features.</p>
        </div>
      )}
    </motion.div>
  );
}

function MemberRow({ id, name, initial, dept, role, status, onView }: any) {
  return (
    <tr className="hover:bg-slate-50 transition-colors group">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-500">
            {initial}
          </div>
          <span className="font-bold text-slate-900">{name}</span>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className="text-xs font-bold text-slate-600">{dept}</span>
      </td>
      <td className="px-6 py-4">
        <span className="text-xs font-medium text-slate-500">{role}</span>
      </td>
      <td className="px-6 py-4 text-center">
        <span className="text-xs font-black text-blue-600">Pro</span>
      </td>
      <td className="px-6 py-4 text-center">
        <span className="text-xs font-bold text-slate-700">85%</span>
      </td>
      <td className="px-6 py-4">
        <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded text-[10px] font-black uppercase">
          {status}
        </span>
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex justify-end gap-2">
          <button 
            onClick={onView}
            className="px-3 py-1 bg-white border border-slate-200 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-colors"
          >
            View Profile
          </button>
          <button className="p-2 text-slate-300 hover:text-slate-600 transition-colors">
            <MoreVertical size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
}

function TicketRow({ id, subject, category, priority, status, assignee, date }: any) {
  const priorityColors: any = {
    Critical: 'text-white bg-rose-600',
    High: 'text-rose-600 bg-rose-50',
    Medium: 'text-amber-600 bg-amber-50',
    Low: 'text-slate-600 bg-slate-50'
  };

  const statusColors: any = {
    'Open': 'bg-blue-50 text-blue-600',
    'In Progress': 'bg-amber-50 text-amber-600',
    'Resolved': 'bg-emerald-50 text-emerald-600'
  };

  return (
    <tr className="hover:bg-slate-50 transition-colors group">
      <td className="px-6 py-4">
        <span className="text-xs font-black text-slate-400 font-mono tracking-tighter">#{id}</span>
      </td>
      <td className="px-6 py-4">
        <div>
          <p className="font-bold text-slate-900 leading-tight">{subject}</p>
          <p className="text-[10px] text-slate-400 font-medium mt-1">Reported {date}</p>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className="text-xs font-bold text-slate-600">{category}</span>
      </td>
      <td className="px-6 py-4">
        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${priorityColors[priority]}`}>
          {priority}
        </span>
      </td>
      <td className="px-6 py-4 text-center">
        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${statusColors[status]}`}>
          {status}
        </span>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
            <User size={12} />
          </div>
          <span className="text-xs font-bold text-slate-700">{assignee}</span>
        </div>
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex justify-end gap-2">
          {status !== 'Resolved' ? (
            <button 
              onClick={() => alert(`Resolving ticket ${id}...`)}
              className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-colors shadow-sm"
            >
              Resolve
            </button>
          ) : (
            <button className="px-3 py-1 border border-slate-200 text-slate-400 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-colors">
              Reopen
            </button>
          )}
          <button className="p-2 text-slate-300 hover:text-slate-600 transition-colors">
            <MoreVertical size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
}

function EquipmentStatusCard({ name, category, location, nextMaintenance, assigned, status, onUpdate }: { name: string, category: string, location: string, nextMaintenance: string, assigned: string, status: 'operational' | 'maintenance' | 'offline', onUpdate?: () => void }) {
  const statusColors: any = {
    operational: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    maintenance: 'bg-amber-50 text-amber-600 border-amber-100 shadow-amber-100/50',
    offline: 'bg-rose-50 text-rose-600 border-rose-100'
  };

  const icons: any = {
    'Audio Mixer': <Mic size={24} />,
    'Video Projector': <MonitorPlay size={24} />,
    'Streaming Equipment': <Globe size={24} />,
    'Lighting': <Zap size={24} />,
    'Audio': <Mic size={24} />,
    'IT/Network': <Cpu size={24} />,
    'Networking': <Radio size={24} />
  };

  return (
    <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm space-y-8 group hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-900/5 transition-all relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full translate-x-16 -translate-y-16 group-hover:bg-blue-50 transition-colors" />
      
      <div className="flex justify-between items-start relative z-10">
        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:scale-110 group-hover:bg-slate-900 group-hover:text-white transition-all shadow-inner">
          {icons[category] || <Wrench size={24} />}
        </div>
        <span className={`px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest shadow-sm transition-all ${statusColors[status]}`}>
          {status}
        </span>
      </div>

      <div className="space-y-1 relative z-10">
        <h4 className="text-2xl font-black text-slate-900 tracking-tight leading-tight group-hover:text-blue-600 transition-colors">{name}</h4>
        <div className="flex items-center gap-2">
           <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{category}</span>
           <span className="w-1 h-1 bg-slate-200 rounded-full" />
           <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">ID: {name.substring(0, 3).toUpperCase()}-{Math.floor(Math.random() * 900) + 100}</span>
        </div>
      </div>

      <div className="space-y-3 pt-6 border-t border-slate-50 relative z-10">
        <div className="flex justify-between items-center text-sm">
          <span className="font-bold text-slate-400 uppercase tracking-tighter text-[9px]">Location Vector</span>
          <span className="font-bold text-slate-700 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">{location}</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="font-bold text-slate-400 uppercase tracking-tighter text-[9px]">Maintenance Window</span>
          <span className="font-bold text-slate-500 font-mono text-[10px]">{nextMaintenance}</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="font-bold text-slate-400 uppercase tracking-tighter text-[9px]">Primary Custodian</span>
          <span className="font-bold text-slate-700 font-sans">{assigned}</span>
        </div>
      </div>

      <button 
        onClick={onUpdate}
        className="w-full py-4 bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-900 hover:text-white transition-all rounded-2xl relative z-10"
      >
        Update Lifecycle
      </button>
    </div>
  );
}

function SystemHealthCard({ title, uptime, status, issues }: { title: string, uptime: string, status: string, issues: number }) {
  const isGood = status === 'operational';
  const isWarn = status === 'maintenance';

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4 group hover:border-blue-200 transition-all">
      <div className="flex justify-between items-center">
        <h4 className="font-bold text-slate-900 leading-none">{title}</h4>
        <div className={`w-2 h-2 rounded-full ${isGood ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : isWarn ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-rose-500'}`} />
      </div>
      <div className="space-y-1">
        <div className="flex justify-between items-end">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">Uptime: {uptime}</p>
        </div>
        <div className="flex justify-between items-center">
           <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">
            Status: <span className={`font-black ${isGood ? 'text-emerald-600' : isWarn ? 'text-amber-600' : 'text-rose-600'}`}>{status}</span>
          </p>
        </div>
        <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">Open Issues: {issues}</p>
      </div>
    </div>
  );
}

function RehearsalItem({ title, date, songs, singers }: { title: string, date: string, songs: number, singers: number }) {
  return (
    <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100 flex justify-between items-center group hover:bg-slate-50 transition-colors">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
          <Calendar size={20} />
        </div>
        <div>
          <h4 className="font-bold text-slate-900 leading-none">{title}</h4>
          <p className="text-xs text-slate-500 mt-1">{date} • service</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-xs font-black text-blue-600 uppercase tracking-widest">{singers} singers</p>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{songs} songs</p>
      </div>
    </div>
  );
}

function PerformanceItem({ title, date, type, attendees }: { title: string, date: string, type: string, attendees: number }) {
  return (
    <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100 flex justify-between items-center group hover:bg-slate-50 transition-colors">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
          <Activity size={20} />
        </div>
        <div>
          <h4 className="font-bold text-slate-900 leading-none">{title}</h4>
          <p className="text-xs text-slate-500 mt-1">{date} • {attendees} attendees</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded uppercase tracking-wider">
          {type}
        </span>
      </div>
    </div>
  );
}

function Modal({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
      />
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200"
      >
        <div className="flex justify-between items-center px-8 py-6 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-xl font-bold text-slate-900 font-display uppercase tracking-tight">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        <div className="max-h-[80vh] overflow-y-auto">
          {children}
        </div>
      </motion.div>
    </div>
  );
}

function UpdateEquipmentForm({ equipment, onClose }: { equipment: any, onClose: () => void }) {
  const [status, setStatus] = useState(equipment?.status || 'operational');
  const [maintenanceNotes, setMaintenanceNotes] = useState('');

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm">
          <Monitor size={24} />
        </div>
        <div>
          <h4 className="font-bold text-slate-900">{equipment?.name}</h4>
          <p className="text-xs text-slate-500 uppercase tracking-widest font-black">{equipment?.category}</p>
        </div>
      </div>

      <div className="space-y-4">
        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Update Operational Status</label>
        <div className="grid grid-cols-3 gap-3">
          {['operational', 'maintenance', 'offline'].map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`py-3 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                status === s 
                  ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200' 
                  : 'bg-white border-slate-100 text-slate-400 hover:border-blue-100'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Maintenance & Update Log</label>
        <textarea 
          placeholder="Describe maintenance performed or reason for status change..."
          value={maintenanceNotes}
          onChange={(e) => setMaintenanceNotes(e.target.value)}
          className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px] font-medium"
        />
      </div>

      <div className="flex gap-3 pt-4">
        <button onClick={onClose} className="flex-1 px-6 py-4 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors">
          Cancel
        </button>
        <button onClick={onClose} className="flex-1 px-6 py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-black transition-colors shadow-lg shadow-slate-200">
          Sync Changes
        </button>
      </div>
    </div>
  );
}

function AssignServiceForm({ onClose, department, selectedDate }: { onClose: () => void, department: any, selectedDate: Date }) {
  const isChoir = department?.name?.toLowerCase().includes('choir') || department?.category === 'Music';
  const isUshering = department?.name?.toLowerCase().includes('usher') || department?.category === 'Hospitality';
  const isTechnical = department?.name?.toLowerCase().includes('tech') || department?.category === 'Technical';

  // Get events for the selected date from the calendar logic
  const dayEvents = getScheduledEvents(selectedDate, isChoir, isUshering, isTechnical);
  
  // Comprehensive list of services from churchSchedule.ts
  const baseServiceOptions = [
    'Divine Service', 
    'Weekly Bible Studies', 
    'Weekly Prayer Meetings', 
    'Night Vigil', 
    'Covenant Sunday', 
    'District Combined Service',
    'Wonder Sunday',
    'General Combined Service',
    'Church Cleaning & Preparation',
    'Choir Practice',
    'Evangelism & Follow-up',
    'Home Fellowship',
    'Youth Service',
    'Special Conference'
  ];

  const eventTitles = dayEvents.map(e => e.title);
  // Prioritize today's events at the top, followed by the rest
  const finalServiceOptions = Array.from(new Set([...eventTitles, ...baseServiceOptions]));

  // Role templates based on department
  const getInitialRoles = () => {
    if (isChoir) return ['Music Director', 'Pianist', 'Drummer', 'Lead Vocalist', 'Backing Vocal A', 'Backing Vocal B'];
    if (isTechnical) return ['Sound Engineer', 'Video Switcher', 'Stream Operator', 'Stage Manager', 'Projectionist'];
    return ['Lead Usher', 'Sanctuary Door A', 'Sanctuary Door B', 'Offering Collection', 'Welcome Desk'];
  };

  const [assignmentRoles] = useState(getInitialRoles());
  
  return (
    <div className="p-8 space-y-6">
      <div className="space-y-2">
        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Selected Date</label>
        <p className="text-lg font-bold text-slate-900">{selectedDate.toLocaleDateString('en-US', { dateStyle: 'full' })}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormSelect label="Select Service" options={finalServiceOptions} />
        <FormSelect label="Shift" options={['First Service', 'Second Service', 'Combined', 'Night']} />
      </div>

      <div className="space-y-4">
        <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">Member Assignments</h5>
        
        {assignmentRoles.map((role) => (
          <div key={role} className="flex gap-4 items-end">
            <div className="flex-1">
              <FormSelect label={role} options={['-- Unassigned --', 'John Smith', 'Sarah Johnson', 'Michael Brown', 'Emily Davis']} />
            </div>
            <button className="p-3 bg-slate-50 text-slate-400 hover:text-rose-500 rounded-xl transition-colors">
              <X size={18} />
            </button>
          </div>
        ))}

        <button className="w-full py-3 border-2 border-dashed border-slate-100 rounded-2xl text-xs font-bold text-slate-400 hover:border-blue-200 hover:text-blue-500 transition-all flex items-center justify-center gap-2">
          <Plus size={16} />
          Add Assignment Role
        </button>
      </div>

      <div className="pt-4 flex gap-3">
        <button onClick={onClose} className="flex-1 px-6 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors">
          Cancel
        </button>
        <button onClick={onClose} className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">
          Save Assignments
        </button>
      </div>
    </div>
  );
}

function AddMemberForm({ department, onClose }: { department: any, onClose: () => void }) {
  const { profile } = useFirebase();
  const [formMode, setFormMode] = useState<'search' | 'create'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [availableMembers, setAvailableMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  
  // New member state
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [isBaptised, setIsBaptised] = useState(false);

  const isChoir = department?.name?.toLowerCase().includes('choir') || department?.category === 'Music';
  const isUshering = department?.name?.toLowerCase().includes('usher') || department?.category === 'Hospitality';

  const handleSearch = async () => {
    if (!profile?.districtId || !profile?.branchId || !searchQuery) return;
    setLoading(true);
    try {
      const membersRef = collection(db, 'districts', profile.districtId, 'branches', profile.branchId, 'members');
      // In a real app we'd use a more sophisticated search, but for now we fetch all and filter in JS for simplicity in the demo
      // Or we can try a name prefix search
      const q = query(membersRef, where('fullName', '>=', searchQuery), where('fullName', '<=', searchQuery + '\uf8ff'));
      const snap = await getDocs(q);
      const members = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAvailableMembers(members);
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (formMode === 'create' && !isBaptised) {
      alert("Only baptized members can join a department.");
      return;
    }

    if (formMode === 'search' && selectedMember && !selectedMember.isBaptised) {
      alert("This member has not been baptized yet. Baptism is required for departmental membership.");
      return;
    }

    // Logic to add member to department
    alert("Member added to " + department.name + " successfully!");
    onClose();
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex p-1 bg-slate-100 rounded-xl">
        <button 
          onClick={() => setFormMode('search')}
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${formMode === 'search' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Select Existing
        </button>
        <button 
          onClick={() => setFormMode('create')}
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${formMode === 'create' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Create New
        </button>
      </div>

      <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex items-start gap-3">
        <AlertCircle size={18} className="text-amber-500 mt-0.5 shrink-0" />
        <p className="text-xs text-amber-700 font-medium">
          <span className="font-bold">Church Policy:</span> Only baptized members are eligible to serve in any department.
        </p>
      </div>

      {formMode === 'search' ? (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by full name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-24 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
            />
            <button 
              onClick={handleSearch}
              disabled={loading}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '...' : 'Search'}
            </button>
          </div>

          <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            {availableMembers.length > 0 ? (
              availableMembers.map(m => (
                <button 
                  key={m.id}
                  onClick={() => setSelectedMember(m)}
                  className={`w-full p-4 rounded-xl border flex items-center justify-between transition-all ${selectedMember?.id === m.id ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-100 hover:border-blue-100'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500">
                      {m.fullName?.[0]}
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-slate-900 leading-none">{m.fullName}</p>
                      <p className="text-[10px] text-slate-400 font-medium mt-1 uppercase tracking-widest">{m.isBaptised ? 'Baptized Member' : 'Not Baptized'}</p>
                    </div>
                  </div>
                  {m.isBaptised && selectedMember?.id === m.id && <CheckCircle2 size={20} className="text-blue-500" />}
                  {!m.isBaptised && <AlertCircle size={16} className="text-rose-400" />}
                </button>
              ))
            ) : searchQuery && !loading ? (
              <div className="text-center py-8 text-slate-400 italic text-sm">No members found matching your search.</div>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Full Name</label>
              <input 
                type="text" 
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Phone Number</label>
              <input 
                type="text" 
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="+234..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Email Address</label>
            <input 
              type="email" 
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="john@example.com"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-900">Has been baptized?</p>
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Verification required</p>
            </div>
            <button 
              onClick={() => setIsBaptised(!isBaptised)}
              className={`w-12 h-6 rounded-full transition-all relative ${isBaptised ? 'bg-blue-600' : 'bg-slate-300'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isBaptised ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
          
          {isChoir ? (
            <div className="grid grid-cols-2 gap-4">
              <FormSelect label="Voice Part" options={['Soprano', 'Alto', 'Tenor', 'Bass']} />
              <FormSelect label="Vocal Experience" options={['Beginner', 'Intermediate', 'Pro']} />
            </div>
          ) : isUshering ? (
            <div className="grid grid-cols-2 gap-4">
              <FormSelect label="Assigned Station" options={['Main Entrance', 'Sanctuary', 'Overflow']} />
              <FormSelect label="Shift" options={['Morning', 'Evening', 'All Day']} />
            </div>
          ) : (
            <FormField label="Area/Sub-unit" placeholder="e.g. Media Outreach" />
          )}
        </div>
      )}

      <div className="pt-4 flex gap-3">
        <button onClick={onClose} className="flex-1 px-6 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors">
          Cancel
        </button>
        <button 
          onClick={handleSave} 
          disabled={formMode === 'search' && !selectedMember}
          className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 disabled:opacity-50 disabled:shadow-none"
        >
          Add to {department?.name || 'Department'}
        </button>
      </div>
    </div>
  );
}

function PlanOutreachForm({ onClose }: { onClose: () => void }) {
  return (
    <div className="p-8 space-y-6">
      <FormField label="Event Title" placeholder="e.g. Street Evangelism" />
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Date" type="date" />
        <FormField label="Target Location" placeholder="e.g. Central Market" />
      </div>
      <FormField label="Description" placeholder="What is the goal of this outreach?" isTextArea />
      
      <div className="pt-4 flex gap-3">
        <button onClick={onClose} className="flex-1 px-6 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors">
          Cancel
        </button>
        <button onClick={onClose} className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors">
          Create Outreach
        </button>
      </div>
    </div>
  );
}

function ScheduleRehearsalForm({ onClose }: { onClose: () => void }) {
  return (
    <div className="p-8 space-y-6">
      <FormField label="Rehearsal Type" placeholder="e.g. Sunday Service Prep" />
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Date" type="date" />
        <FormField label="Time" type="time" />
      </div>
      <FormSelect label="Venue" options={['Main Sanctuary', 'Choir Room', 'Online']} />
      
      <div className="pt-4 flex gap-3">
        <button onClick={onClose} className="flex-1 px-6 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors">
          Cancel
        </button>
        <button onClick={onClose} className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors">
          Schedule
        </button>
      </div>
    </div>
  );
}

function NewTicketForm({ onClose }: { onClose: () => void }) {
  return (
    <div className="p-8 space-y-6">
      <FormField label="Subject" placeholder="e.g. Projector failing" />
      <FormSelect label="Priority" options={['Low', 'Medium', 'High', 'Critical']} />
      <FormField label="Details" placeholder="Describe the technical issue..." isTextArea />
      
      <div className="pt-4 flex gap-3">
        <button onClick={onClose} className="flex-1 px-10 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors">
          Cancel
        </button>
        <button onClick={onClose} className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors">
          Submit Ticket
        </button>
      </div>
    </div>
  );
}

function AddSongForm({ onClose }: { onClose: () => void }) {
  return (
    <div className="p-8 space-y-6">
      <FormField label="Song Title" placeholder="e.g. Amazing Grace" />
      <FormField label="Composer / Artist" placeholder="e.g. John Newton" />
      <div className="grid grid-cols-2 gap-4">
        <FormSelect label="Key" options={['C', 'D', 'E', 'F', 'G', 'A', 'B']} />
        <FormField label="Duration" placeholder="e.g. 4:30" />
      </div>
      
      <div className="pt-4 flex gap-3">
        <button onClick={onClose} className="flex-1 px-6 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors">
          Cancel
        </button>
        <button onClick={onClose} className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors">
          Add to Library
        </button>
      </div>
    </div>
  );
}

function AddEquipmentForm({ onClose }: { onClose: () => void }) {
  return (
    <div className="p-8 space-y-6">
      <FormField label="Equipment Name" placeholder="e.g. Soundcraft Mixer" />
      <div className="grid grid-cols-2 gap-4">
        <FormSelect label="Category" options={['Audio', 'Video', 'Lighting', 'Computing']} />
        <FormField label="Serial Number" placeholder="S/N..." />
      </div>
      <FormField label="Purchase Date" type="date" />
      
      <div className="pt-4 flex gap-3">
        <button onClick={onClose} className="flex-1 px-6 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors">
          Cancel
        </button>
        <button onClick={onClose} className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors">
          Register Asset
        </button>
      </div>
    </div>
  );
}

function FormField({ label, placeholder, type = 'text', isTextArea = false }: { label: string, placeholder?: string, type?: string, isTextArea?: boolean }) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{label}</label>
      {isTextArea ? (
        <textarea 
          placeholder={placeholder}
          rows={3}
          className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all resize-none"
        />
      ) : (
        <input 
          type={type}
          placeholder={placeholder}
          className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
        />
      )}
    </div>
  );
}

function FormSelect({ label, options }: { label: string, options: string[] }) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{label}</label>
      <div className="relative">
        <select className="appearance-none w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all cursor-pointer">
          {options.map(opt => <option key={opt}>{opt}</option>)}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
      </div>
    </div>
  );
}

function ServiceCalendar({ currentDate, setCurrentDate, selectedDate, setSelectedDate, getEvents }: { currentDate: Date, setCurrentDate: (d: Date) => void, selectedDate: Date, setSelectedDate: (d: Date) => void, getEvents: (d: Date) => any[] }) {
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  const daysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (month: number, year: number) => new Date(year, month, 1).getDay();

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const days = [];
  const totalDays = daysInMonth(currentDate.getMonth(), currentDate.getFullYear());
  const offset = firstDayOfMonth(currentDate.getMonth(), currentDate.getFullYear());

  for (let i = 0; i < offset; i++) days.push(null);
  for (let i = 1; i <= totalDays; i++) days.push(i);

  const isSelected = (day: number) => {
    return selectedDate.getDate() === day && 
           selectedDate.getMonth() === currentDate.getMonth() && 
           selectedDate.getFullYear() === currentDate.getFullYear();
  };

  const isToday = (day: number) => {
    const today = new Date();
    return today.getDate() === day && 
           today.getMonth() === currentDate.getMonth() && 
           today.getFullYear() === currentDate.getFullYear();
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between p-6 border-b border-slate-100">
        <h4 className="text-lg font-bold text-slate-900 leading-none">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h4>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="p-2 hover:bg-slate-50 rounded-lg transition-colors text-slate-400 hover:text-slate-600 border border-slate-100">
            <ChevronLeft size={18} />
          </button>
          <button onClick={nextMonth} className="p-2 hover:bg-slate-50 rounded-lg transition-colors text-slate-400 hover:text-slate-600 border border-slate-100">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 text-center border-b border-slate-50 bg-slate-50/30">
        {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
          <div key={day} className="py-4 text-[10px] font-black text-slate-400 tracking-widest uppercase">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {days.map((day, i) => {
          const events = day ? getEvents(new Date(currentDate.getFullYear(), currentDate.getMonth(), day)) : [];
          return (
            <div 
              key={i} 
              onClick={() => day && setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}
              className={`h-24 p-2 border-r border-b border-slate-50 last:border-r-0 relative group transition-all cursor-pointer ${
                !day ? 'bg-slate-50/20' : isSelected(day) ? 'bg-blue-50/50' : 'hover:bg-slate-50'
              }`}
            >
              {day && (
                <>
                  <div className="flex justify-between items-start">
                    <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full transition-colors ${
                      isToday(day) ? 'bg-blue-600 text-white' : isSelected(day) ? 'text-blue-600' : 'text-slate-400'
                    }`}>
                      {day}
                    </span>
                    
                    {/* Activity Dot */}
                    {events.length > 0 && (
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                    )}
                  </div>

                  {/* Event Summary Preview */}
                  {events.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <div className="px-1.5 py-0.5 bg-blue-100/50 rounded text-[9px] font-bold text-blue-700 truncate uppercase tracking-tighter">
                        {events[0].title}
                      </div>
                      {events.length > 1 && (
                        <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest pl-1">
                          +{events.length - 1} more
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ScheduleDayView({ date, isChoir, isUshering, isTechnical, events, onAssign }: { date: Date, isChoir: boolean, isUshering: boolean, isTechnical: boolean, events: any[], onAssign: () => void }) {
  const formattedDate = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-8 sticky top-24">
      <div>
        <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">Daily Schedule</h4>
        <h3 className="text-2xl font-bold text-slate-900 leading-none">{formattedDate}</h3>
      </div>

      <div className="space-y-6">
        {events.length > 0 ? (
          <div className="space-y-4">
            {events.map((event, i) => (
              <div key={i} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col gap-4 group hover:border-blue-200 transition-all">
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="font-bold text-slate-900">{event.title}</h5>
                    <p className="text-xs text-slate-500 font-medium">{event.time}</p>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">{event.category}</p>
                  </div>
                  <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded text-[10px] font-black uppercase tracking-wider">
                    Official
                  </span>
                </div>

                <button 
                  onClick={onAssign}
                  className="w-full py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shadow-sm"
                >
                  Assign Members
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 flex flex-col items-center justify-center text-center gap-4 text-slate-400">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200">
              <Calendar size={32} />
            </div>
            <div className="max-w-[200px]">
              <p className="font-bold text-slate-900">No scheduled events</p>
              <p className="text-xs font-medium mt-1">There are no services or rehearsals scheduled for this date.</p>
            </div>
            <button onClick={onAssign} className="mt-2 text-xs font-bold text-blue-600 uppercase tracking-widest hover:text-blue-700">
              Schedule One
            </button>
          </div>
        )}
      </div>

      <div className="pt-6 border-t border-slate-100">
        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Coverage Status</h4>
        <div className="space-y-3">
          <CoverageBar label="Sanctuary" value={100} color="bg-emerald-500" />
          <CoverageBar label="Gallary" value={60} color="bg-amber-500" />
          <CoverageBar label="Main Entrance" value={80} color="bg-blue-500" />
          <CoverageBar label="Overflow" value={0} color="bg-slate-200" />
        </div>
      </div>
    </div>
  );
}

function CoverageBar({ label, value, color }: { label: string, value: number, color: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
        <span className="text-slate-500 font-black">{label}</span>
        <span className={value === 0 ? 'text-slate-300' : 'text-slate-900'}>{value}%</span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          className={`h-full ${color} rounded-full`} 
        />
      </div>
    </div>
  );
}

function VoicePartStat({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="bg-slate-50/50 p-6 rounded-xl border border-slate-100 flex flex-col items-center justify-center gap-3 group hover:border-blue-200 transition-all cursor-pointer">
      <div className="text-blue-500 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <div className="text-center">
        <p className="text-2xl font-black text-slate-900 leading-none">{value}</p>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{label}</p>
      </div>
    </div>
  );
}

function StatBox({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
      <div className="p-2 bg-slate-50 rounded-lg">
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-lg font-bold text-slate-900 leading-tight">{value}</p>
      </div>
    </div>
  );
}

function ActionButton({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`p-6 rounded-2xl border flex flex-col items-center justify-center gap-3 transition-all group ${
        active 
          ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200 ring-4 ring-blue-50' 
          : 'bg-white border-slate-200 text-slate-500 hover:border-blue-200 hover:bg-blue-50/30'
      }`}
    >
      <div className={`transition-transform group-hover:scale-110 ${active ? 'text-white' : 'text-blue-600'}`}>
        {icon}
      </div>
      <span className="text-sm font-bold uppercase tracking-tight">{label}</span>
    </button>
  );
}

function AreaCard({ name, members, events, conversions, dotColor }: { name: string, members: number, events: number, conversions: number, dotColor: string }) {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-blue-200 transition-all cursor-pointer group">
      <div className="flex justify-between items-start mb-4">
        <h4 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{name}</h4>
        <div className={`w-2 h-2 rounded-full ${dotColor}`} />
      </div>
      <div className="space-y-1">
        <p className="text-xs text-slate-500">{members} members • {events} events</p>
        <p className="text-xs text-slate-500 font-medium">{conversions} conversions</p>
      </div>
    </div>
  );
}

function EventRow({ name, date, location, expected, category }: { name: string, date: string, location: string, expected: number, category: string }) {
  return (
    <div className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
      <div>
        <h4 className="font-bold text-slate-900">{name}</h4>
        <p className="text-xs text-slate-500 font-medium">{date} • {location}</p>
      </div>
      <div className="flex flex-col items-start sm:items-end gap-2 w-full sm:w-auto">
        <span className="text-xs font-bold text-slate-900">{expected} expected</span>
        <span className="text-[10px] font-bold px-2 py-1 bg-slate-100 text-slate-600 rounded uppercase tracking-wider">
          {category}
        </span>
      </div>
    </div>
  );
}

function PipelineStat({ color, value, label }: { color: string, value: number, label: string }) {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-center space-y-4 flex flex-col items-center justify-center hover:border-blue-200 transition-all cursor-pointer">
      <div className={`w-3 h-3 rounded-full ${color}`} />
      <div>
        <p className="text-2xl font-black text-slate-900 leading-none">{value}</p>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{label}</p>
      </div>
    </div>
  );
}

function VisitorRow({ initial, name, phone, email, date, location, allocation, status, lifecycle }: any) {
  return (
    <tr className="hover:bg-slate-50/50 transition-colors group">
      <td className="px-6 py-4">
        <div className="w-4 h-4 rounded border border-slate-300 group-hover:border-blue-400 transition-colors" />
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
            {initial}
          </div>
          <div>
            <p className="font-bold text-slate-900 leading-tight">{name}</p>
            <div className="flex items-center gap-3 mt-1">
              <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                <Phone size={10} />
                {phone}
              </span>
              <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                <Mail size={10} />
                {email}
              </span>
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <Calendar size={12} className="text-blue-500" />
            {date}
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
            <MapPin size={12} />
            {location}
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div>
          <p className="text-xs font-bold text-slate-700">{allocation}</p>
          <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Operational Unit</p>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className="px-2 py-1 bg-blue-50 text-blue-600 text-[10px] font-black rounded uppercase tracking-wider">
          {status}
        </span>
      </td>
      <td className="px-6 py-4">
        <span className="flex items-center gap-1.5 text-[10px] font-bold text-amber-600 uppercase tracking-widest">
          <div className="w-1 h-1 rounded-full bg-amber-500" />
          {lifecycle}
        </span>
      </td>
      <td className="px-6 py-4 text-right">
        <button className="p-2 text-slate-300 hover:text-slate-600 transition-colors">
          <MoreVertical size={16} />
        </button>
      </td>
    </tr>
  );
}

function StationManagementCard({ title, headUsher, totalUshers, status, color }: any) {
  const colorMap: any = {
    emerald: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    blue: 'border-blue-100 bg-blue-50 text-blue-700',
    rose: 'border-rose-100 bg-rose-50 text-rose-700',
    slate: 'border-slate-100 bg-slate-50 text-slate-700'
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
      <div className="flex justify-between items-start">
        <h4 className="text-lg font-bold text-slate-800">{title}</h4>
        <div className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider ${colorMap[color]}`}>
          {status}
        </div>
      </div>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
            <User size={14} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">HEAD USHER</p>
            <p className="text-sm font-bold text-slate-700">{headUsher}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
            <Users size={14} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">TOTAL STAFF</p>
            <p className="text-sm font-bold text-slate-700">{totalUshers} Ushers</p>
          </div>
        </div>
      </div>
      <div className="pt-4 border-t border-slate-50 flex gap-2">
        <button className="flex-1 text-xs font-bold text-blue-600 py-2 hover:bg-blue-50 rounded-lg transition-colors">
          View Roles
        </button>
        <button className="flex-1 text-xs font-bold text-slate-600 py-2 hover:bg-slate-50 rounded-lg transition-colors">
          Edit Station
        </button>
      </div>
    </div>
  );
}

function SongRow({ title, theme, key, bpm, status }: { title: string, theme: string, key: string, bpm: number, status: string }) {
  return (
    <tr className="hover:bg-slate-50 transition-colors group border-b border-slate-50 last:border-0">
      <td className="px-6 py-4 text-center">
        <span className="text-[10px] font-black text-slate-300 font-mono tracking-tighter group-hover:text-blue-400 transition-colors">01</span>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-blue-50 text-blue-600 flex items-center justify-center">
            <Music size={16} />
          </div>
          <span className="font-bold text-slate-900 leading-none">{title}</span>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className="text-xs font-bold text-slate-600">{theme}</span>
      </td>
      <td className="px-6 py-4 text-center">
        <div className="flex flex-col items-center">
          <span className="text-xs font-black text-slate-900">{key}</span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">{bpm} BPM</span>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider ${
          status === 'Mastered' ? 'bg-emerald-50 text-emerald-600' :
          status === 'Learning' ? 'bg-amber-50 text-amber-600' :
          'bg-slate-50 text-slate-400'
        }`}>
          {status}
        </span>
      </td>
      <td className="px-6 py-4 text-right">
        <button className="p-2 text-slate-300 hover:text-slate-600">
          <MoreVertical size={16} />
        </button>
      </td>
    </tr>
  );
}

function AssignmentLine({ role, name, empty }: { role: string, name: string, empty?: boolean }) {
  return (
    <div className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100 group">
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1 group-hover:text-blue-500 transition-colors uppercase">{role}</p>
        <p className={`text-sm font-bold ${empty ? 'text-rose-400' : 'text-slate-700'}`}>{name}</p>
      </div>
      <button className={`p-2 rounded-lg transition-colors ${empty ? 'bg-rose-50 text-rose-500 hover:bg-rose-100' : 'text-slate-300 hover:text-blue-600'}`}>
        {empty ? <UserPlus size={16} /> : <ArrowLeft className="rotate-180" size={16} />}
      </button>
    </div>
  );
}

function QuickActionRow({ icon, label }: { icon: React.ReactNode, label: string }) {
  return (
    <button className="w-full flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 hover:border-blue-200 transition-all group">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl border border-slate-100 bg-white flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-colors">
          {icon}
        </div>
        <span className="font-bold text-slate-700 group-hover:text-slate-900">{label}</span>
      </div>
    </button>
  );
}

function PipelineRow({ label, count, color }: { label: string, count: number, color: string }) {
  return (
    <div className="flex justify-between items-center group">
      <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900 transition-colors flex items-center gap-4">
        {label}
      </span>
      <span className="text-sm font-black text-slate-900">{count}</span>
    </div>
  );
}

function StatCardModern({ icon, label, value, color, bgColor }: any) {
  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6 group hover:shadow-md hover:border-blue-200 transition-all relative overflow-hidden">
      <div className={`w-14 h-14 ${bgColor} ${color} rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <div>
        <p className="text-xs font-bold text-slate-500 mb-1">{label}</p>
        <p className="text-4xl font-black text-slate-900 tracking-tighter">{value}</p>
      </div>
    </div>
  );
}

function ReportSummaryCard({ title, data, icon }: { title: string, data: string, icon: React.ReactNode }) {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
        {icon}
      </div>
      <div>
        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">{title}</h4>
        <p className="text-2xl font-black text-slate-900">{data}</p>
      </div>
    </div>
  );
}

function StationCard({ title, assigned, status, onClick }: any) {
  const statusColors: any = {
    green: 'bg-emerald-500',
    yellow: 'bg-amber-500',
    red: 'bg-rose-500'
  };

  return (
    <div 
      onClick={onClick}
      className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center group hover:border-blue-200 transition-all cursor-pointer"
    >
      <div className="space-y-1">
        <h4 className="text-lg font-bold text-slate-800 group-hover:text-blue-700 transition-colors">{title}</h4>
        <p className="text-sm text-slate-500 font-medium">{assigned}</p>
      </div>
      <div className={`w-3 h-3 rounded-full ${statusColors[status]} shadow-lg shadow-current/20 animate-pulse-subtle`} />
    </div>
  );
}

function TaskItem({ title, assignee, priority, dueDate, status }: any) {
  const priorityColors: any = {
    High: 'text-rose-600 bg-rose-50',
    Medium: 'text-amber-600 bg-amber-50',
    Low: 'text-blue-600 bg-blue-50'
  };

  const statusColors: any = {
    'To Do': 'text-slate-500 bg-slate-50',
    'In Progress': 'text-blue-600 bg-blue-50',
    'Completed': 'text-emerald-600 bg-emerald-50'
  };

  return (
    <div className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-slate-50/50 transition-colors group">
      <div className="flex items-start gap-4">
        <div className="mt-1">
          <div className="w-5 h-5 rounded border-2 border-slate-200 group-hover:border-blue-400 transition-colors cursor-pointer" />
        </div>
        <div>
          <h4 className="font-bold text-slate-900 leading-tight">{title}</h4>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <Users size={12} />
              {assignee}
            </span>
            <span className="text-[10px] text-slate-200">•</span>
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <Calendar size={12} />
              {dueDate}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3 w-full sm:w-auto ml-9 sm:ml-0">
        <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider ${priorityColors[priority]}`}>
          {priority}
        </span>
        <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider ${statusColors[status]}`}>
          {status}
        </span>
      </div>
    </div>
  );
}

function FollowUpRow({ name, lastContact, method, outcome, nextStep }: any) {
  return (
    <tr className="hover:bg-slate-50/50 transition-colors group">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-xs">
            {name.charAt(0)}
          </div>
          <span className="font-bold text-slate-900">{name}</span>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <Clock size={12} className="text-blue-500" />
            {lastContact}
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
            <MessageSquare size={12} />
            {method}
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-center">
        <span className="px-2 py-1 bg-blue-50 text-blue-600 text-[10px] font-black rounded uppercase tracking-wider">
          {outcome}
        </span>
      </td>
      <td className="px-6 py-4 text-center">
        <span className="px-2 py-1 bg-amber-50 text-amber-600 text-[10px] font-black rounded uppercase tracking-wider">
          {nextStep}
        </span>
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex justify-end gap-2">
          <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
            <Phone size={14} />
          </button>
          <button className="p-2 text-slate-300 hover:text-slate-600 transition-colors">
            <MoreVertical size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
}
