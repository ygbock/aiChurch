import React from 'react';
import { motion } from 'motion/react';
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
  Star
} from 'lucide-react';

export default function MemberPortal() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Welcome back, Sarah!</h2>
          <p className="text-slate-500 text-sm">Here's what's happening in your church community today.</p>
        </div>
        <div className="flex gap-2">
          <button className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg font-medium text-sm hover:bg-slate-50 transition-colors flex items-center gap-2">
            <ArrowLeftRight size={18} />
            Request Transfer
          </button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm">
            <Calendar size={18} />
            Register for Event
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-8">
          {/* Upcoming Events Horizontal Scroll */}
          <section>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-slate-900">Recommended for You</h3>
              <button className="text-xs font-bold text-blue-600">View All</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <EventCard 
                title="Worship Night 2023" 
                date="Oct 25, 7:00 PM" 
                location="Main Sanctuary" 
                img="https://picsum.photos/seed/worship/400/200" 
              />
              <EventCard 
                title="Youth Leadership Summit" 
                date="Nov 02, 10:00 AM" 
                location="Community Hall" 
                img="https://picsum.photos/seed/youth/400/200" 
              />
            </div>
          </section>

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
              <QuickLink icon={<Users size={16} />} label="Directory" />
              <QuickLink icon={<Heart size={16} />} label="Give" />
              <QuickLink icon={<Clock size={16} />} label="History" />
              <QuickLink icon={<MapPin size={16} />} label="Branches" />
            </div>
          </div>
        </div>
      </div>
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

function QuickLink({ icon, label }: { icon: React.ReactNode, label: string }) {
  return (
    <button className="flex flex-col items-center justify-center p-3 bg-slate-50 rounded-lg border border-slate-100 hover:border-blue-200 hover:bg-blue-50 transition-all group">
      <div className="text-slate-400 group-hover:text-blue-600 transition-colors mb-1">
        {icon}
      </div>
      <span className="text-[10px] font-bold text-slate-600 group-hover:text-blue-600 transition-colors uppercase tracking-wider">{label}</span>
    </button>
  );
}
