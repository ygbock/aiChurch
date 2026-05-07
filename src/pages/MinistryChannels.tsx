import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Hash, 
  Send, 
  PlusCircle, 
  Smile, 
  AtSign, 
  Download, 
  Info, 
  Phone, 
  MoreVertical,
  Search,
  MessageSquare,
  Pin,
  Users,
  FileText,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  id: string;
  author: {
    name: string;
    avatar?: string;
    initials: string;
    role: string;
  };
  content: string;
  time: string;
  reactions?: { emoji: string; count: number }[];
  attachment?: {
    name: string;
    type: string;
    size: string;
  };
}

interface Channel {
  id: string;
  name: string;
  description: string;
  membersCount: number;
  unreadCount?: number;
}

const CHANNELS: Channel[] = [
  { id: '1', name: 'Announcements', description: 'General church-wide updates and news.', membersCount: 1248 },
  { id: '2', name: 'WorshipTeam', description: 'Planning and discussion for Sunday services.', membersCount: 15, unreadCount: 2 },
  { id: '3', name: 'YouthMinistry', description: 'Events and coordination for the youth department.', membersCount: 450 },
  { id: '4', name: 'Volunteers', description: 'General volunteer coordination and support.', membersCount: 85, unreadCount: 1 },
];

const INITIAL_MESSAGES: Record<string, Message[]> = {
  '2': [
    {
      id: 'm1',
      author: { name: 'Sarah Jenkins', initials: 'SJ', role: 'Worship Leader' },
      content: "Good morning team! Just uploaded the setlist for this coming Sunday. Please review the transitions between song 2 and 3.",
      time: '9:14 AM',
      attachment: { name: 'Sunday_Setlist_V1.pdf', type: 'PDF Document', size: '1.2 MB' }
    },
    {
      id: 'm2',
      author: { name: 'Marcus Chen', initials: 'MC', role: 'Guitar' },
      content: "Looks great Sarah. I might need a bit more time on the acoustic intro for 'Great Are You Lord'. Can we rehearse that specifically on Thursday?",
      time: '9:22 AM',
      reactions: [{ emoji: '👍', count: 2 }]
    }
  ]
};

export default function MinistryChannels() {
  const [activeChannelId, setActiveChannelId] = useState('2');
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES['2'] || []);
  const [newMessage, setNewMessage] = useState('');
  const [showDetails, setShowDetails] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeChannel = CHANNELS.find(c => c.id === activeChannelId);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const msg: Message = {
      id: Date.now().toString(),
      author: { name: 'You', initials: 'ME', role: 'Member' },
      content: newMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages([...messages, msg]);
    setNewMessage('');
    
    // Simulate auto-reply for demo
    if (newMessage.toLowerCase().includes('hello')) {
      setTimeout(() => {
        toast.info('New message in #WorshipTeam');
      }, 1000);
    }
  };

  return (
    <div className="flex h-[calc(100vh-140px)] bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Channel Sidebar */}
      <div className="hidden md:flex flex-col w-64 bg-slate-50 border-r border-slate-200">
        <div className="p-4 border-b border-slate-200 bg-white/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Ministry Channels</h3>
            <button className="p-1 text-slate-400 hover:text-indigo-600 transition-colors">
              <PlusCircle size={16} />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text" 
              placeholder="Jump to..." 
              className="w-full bg-white border border-slate-200 rounded-lg py-1.5 pl-9 pr-3 text-xs font-medium focus:ring-2 focus:ring-indigo-100 outline-none"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {CHANNELS.map(channel => (
            <button
              key={channel.id}
              onClick={() => setActiveChannelId(channel.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all ${
                activeChannelId === channel.id 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' 
                  : 'text-slate-600 hover:bg-slate-200/50'
              }`}
            >
              <div className="flex items-center gap-2">
                <Hash size={16} className={activeChannelId === channel.id ? 'text-white' : 'text-slate-400'} />
                <span className="text-sm font-bold truncate">{channel.name}</span>
              </div>
              {channel.unreadCount && activeChannelId !== channel.id && (
                <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 rounded-full">
                  {channel.unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat Header */}
        <div className="h-16 px-6 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="md:hidden p-2 text-slate-400">
               <Hash size={20} />
            </div>
            <div>
              <h1 className="text-base font-black text-slate-900 leading-none">#{activeChannel?.name}</h1>
              <p className="text-[10px] text-slate-500 font-medium mt-1 truncate max-w-xs md:max-w-md">
                {activeChannel?.description}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="hidden sm:flex p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
              <Phone size={18} />
            </button>
            <button 
              onClick={() => setShowDetails(!showDetails)}
              className={`p-2 rounded-lg transition-all ${showDetails ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400 hover:bg-slate-50'}`}
            >
              <Info size={18} />
            </button>
            <button className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg transition-all">
              <MoreVertical size={18} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50/30"
        >
          <div className="flex items-center gap-4 my-4">
            <div className="h-px bg-slate-200 flex-1" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Today</span>
            <div className="h-px bg-slate-200 flex-1" />
          </div>

          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div 
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-4 group"
              >
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-indigo-600 font-black shrink-0 mt-1">
                  {msg.author.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-sm font-black text-slate-900">{msg.author.name}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{msg.time}</span>
                  </div>
                  <div className="bg-white border border-slate-100 p-4 rounded-2xl rounded-tl-none shadow-sm inline-block max-w-[90%]">
                    <p className="text-sm text-slate-700 leading-relaxed font-medium">
                      {msg.content}
                    </p>
                  </div>

                  {msg.attachment && (
                    <div className="mt-3 flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-white max-w-sm hover:border-indigo-200 transition-all cursor-pointer group/file">
                      <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                        <FileText size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{msg.attachment.name}</p>
                        <p className="text-[10px] text-slate-500 font-medium">{msg.attachment.type} • {msg.attachment.size}</p>
                      </div>
                      <Download size={16} className="text-slate-300 group-hover/file:text-indigo-600 transition-colors" />
                    </div>
                  )}

                  {msg.reactions && (
                    <div className="flex gap-2 mt-2">
                      {msg.reactions.map((r, i) => (
                        <button key={i} className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-full px-2 py-1 hover:bg-indigo-50 hover:border-indigo-200 transition-all">
                          <span className="text-xs">{r.emoji}</span>
                          <span className="text-[10px] font-black text-slate-500">{r.count}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-slate-100 shrink-0">
          <form 
            onSubmit={handleSendMessage}
            className="bg-slate-50 border border-slate-200 rounded-2xl focus-within:ring-4 focus-within:ring-indigo-100/50 focus-within:border-indigo-200 transition-all overflow-hidden"
          >
            <div className="flex items-center gap-1 p-2 border-b border-slate-200/50 bg-white/50">
               <button type="button" className="p-2 text-slate-400 hover:bg-white rounded-lg transition-colors"><PlusCircle size={18} /></button>
               <div className="w-px h-4 bg-slate-200 mx-1" />
               <button type="button" className="p-2 text-slate-400 hover:bg-white rounded-lg transition-colors"><Smile size={18} /></button>
               <button type="button" className="p-2 text-slate-400 hover:bg-white rounded-lg transition-colors"><AtSign size={18} /></button>
            </div>
            <textarea 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
              placeholder={`Message #${activeChannel?.name}...`}
              className="w-full bg-transparent border-none p-4 text-sm font-medium text-slate-700 placeholder:text-slate-400 outline-none resize-none h-20"
            />
            <div className="flex items-center justify-between p-2 bg-white/50">
              <span className="text-[10px] text-slate-400 font-bold ml-2">Press Enter to send</span>
              <button 
                type="submit"
                disabled={!newMessage.trim()}
                className="bg-indigo-600 text-white p-2 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-100"
              >
                <Send size={18} />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Right Sidebar Details */}
      <AnimatePresence>
        {showDetails && (
          <motion.div 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="hidden lg:flex flex-col bg-white border-l border-slate-200 overflow-y-auto"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900">Details</h3>
              <button onClick={() => setShowDetails(false)} className="text-slate-400 hover:text-slate-600">
                 <ChevronRight size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-8">
              {/* About */}
              <div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Info size={12} /> About Channel
                </h4>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    {activeChannel?.description}
                  </p>
                </div>
              </div>

              {/* Members */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Users size={12} /> Members ({activeChannel?.membersCount})
                  </h4>
                  <button className="text-[10px] font-black text-indigo-600 hover:underline">View All</button>
                </div>
                <div className="space-y-4">
                  {[
                    { name: 'Sarah Jenkins', role: 'Worship Leader', initial: 'S' },
                    { name: 'Marcus Chen', role: 'Guitar', initial: 'M' },
                    { name: 'Elena Rodriguez', role: 'Vocals', initial: 'E' }
                  ].map((m, i) => (
                    <div key={i} className="flex items-center gap-3 cursor-pointer group">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 text-[10px] font-bold group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                        {m.initial}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 leading-none">{m.name}</p>
                        <p className="text-[10px] text-slate-400 font-medium mt-1">{m.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pinned */}
              <div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Pin size={12} /> Pinned Items
                </h4>
                <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-2xl">
                   <p className="text-[10px] text-amber-700 font-bold mb-1">Upcoming Revival Practice</p>
                   <p className="text-[10px] text-amber-600/70 font-medium leading-relaxed">Thursday @ 7pm - Main Sanctuary. Attendance is mandatory for all leads.</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
