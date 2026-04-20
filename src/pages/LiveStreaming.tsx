import React from 'react';
import { motion } from 'motion/react';
import { 
  Video, 
  Users, 
  MessageSquare, 
  Share2, 
  Play, 
  Settings,
  Mic,
  Monitor
} from 'lucide-react';
import { useRole } from '../components/Layout';

export default function LiveStreaming() {
  const { role } = useRole();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Live Streaming</h2>
          <p className="text-slate-500 text-sm">
            {role === 'admin' ? 'Broadcast services from Main Campus to your congregation.' : 
             role === 'district' ? 'Manage district-wide broadcasts and branch stream health.' :
             'Broadcast services to your global congregation.'}
          </p>
        </div>
        <button className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-red-700 transition-colors flex items-center gap-2 shadow-sm">
          <Video size={18} />
          Go Live Now
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Stream View */}
        <div className="lg:col-span-2 space-y-6">
          <div className="aspect-video bg-slate-900 rounded-xl overflow-hidden relative group">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white group-hover:scale-110 transition-transform cursor-pointer">
                <Play size={32} fill="currentColor" />
              </div>
            </div>
            <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black/80 to-transparent flex justify-between items-end">
              <div>
                <span className="px-2 py-1 bg-red-600 text-white text-[10px] font-bold rounded uppercase mb-2 inline-block">Live</span>
                <h3 className="text-white font-bold text-lg">Sunday Morning Service - Main Campus</h3>
              </div>
              <div className="flex items-center gap-3">
                <button className="p-2 text-white/80 hover:text-white transition-colors">
                  <Mic size={20} />
                </button>
                <button className="p-2 text-white/80 hover:text-white transition-colors">
                  <Monitor size={20} />
                </button>
                <button className="p-2 text-white/80 hover:text-white transition-colors">
                  <Settings size={20} />
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-4">Stream Information</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <StreamStat label="Viewers" value="1,240" icon={<Users size={16} />} />
              <StreamStat label="Duration" value="01:45:20" icon={<Play size={16} />} />
              <StreamStat label="Bitrate" value="4.5 Mbps" icon={<Monitor size={16} />} />
              <StreamStat label="Health" value="Excellent" icon={<Settings size={16} />} />
            </div>
          </div>
        </div>

        {/* Chat / Sidebar */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-[600px]">
          <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <MessageSquare size={16} className="text-blue-600" />
              Live Chat
            </h3>
            <button className="text-slate-400 hover:text-slate-600">
              <Share2 size={16} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <ChatMessage user="John Doe" message="Blessings from London!" time="10:45 AM" />
            <ChatMessage user="Sarah Smith" message="The choir sounds amazing today." time="10:46 AM" />
            <ChatMessage user="Pastor Mike" message="Welcome everyone to our service." time="10:48 AM" isStaff={true} />
            <ChatMessage user="David Wilson" message="Amen! Great word." time="10:50 AM" />
            <ChatMessage user="Grace Lee" message="Streaming perfectly in Singapore." time="10:52 AM" />
          </div>

          <div className="p-4 border-t border-slate-100">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Type a message..." 
                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-4 pr-10 text-sm focus:ring-1 focus:ring-blue-600 outline-none"
              />
              <button className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-600 font-bold text-xs">
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function StreamStat({ label, value, icon }: { label: string, value: string, icon: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-slate-400 mb-1">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-sm font-bold text-slate-900">{value}</p>
    </div>
  );
}

function ChatMessage({ user, message, time, isStaff }: { user: string, message: string, time: string, isStaff?: boolean }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <span className={`text-xs font-bold ${isStaff ? 'text-blue-600' : 'text-slate-900'}`}>{user}</span>
        <span className="text-[10px] text-slate-400">{time}</span>
      </div>
      <p className="text-sm text-slate-600 leading-relaxed">{message}</p>
    </div>
  );
}
