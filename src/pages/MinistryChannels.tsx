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
  Camera,
  Mic,
  Paperclip,
  Search,
  MessageSquare,
  Pin,
  Users,
  FileText,
  ChevronRight,
  ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate, useLocation } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useFirebase } from '../components/FirebaseProvider';

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

const DEFAULT_CHANNELS = [
  { name: 'Announcements', description: 'General church-wide updates and news.', membersCount: 1248 },
  { name: 'WorshipTeam', description: 'Planning and discussion for Sunday services.', membersCount: 15 },
  { name: 'YouthMinistry', description: 'Events and coordination for the youth department.', membersCount: 450 },
  { name: 'Volunteers', description: 'General volunteer coordination and support.', membersCount: 85 },
];

export default function MinistryChannels() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showDetails, setShowDetails] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const { user, profile } = useFirebase();
  const navigate = useNavigate();
  const location = useLocation();

  const activeChannel = channels.find(c => c.id === activeChannelId);

  // Initialize channels if empty, and subscribe to channels
  useEffect(() => {
    if (!user) return;
    
    const unsubscribe = onSnapshot(collection(db, 'ministryChannels'), async (snapshot) => {
      try {
        if (snapshot.empty) {
            // Seed default channels
            for (const ch of DEFAULT_CHANNELS) {
              await addDoc(collection(db, 'ministryChannels'), {
                ...ch,
                createdAt: serverTimestamp()
              });
            }
        } else {
            const fetchedChannels = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Channel[];
            
            // Sort by name for consistency
            fetchedChannels.sort((a,b) => a.name.localeCompare(b.name));
            setChannels(fetchedChannels);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'ministryChannels');
      }
    }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'ministryChannels');
    });
    
    return () => unsubscribe();
  }, [user]);

  // Subscribe to messages in active channel
  useEffect(() => {
    if (!user || !activeChannelId) {
        setMessages([]);
        return;
    }
    
    const messagesRef = collection(db, 'ministryChannels', activeChannelId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      try {
          const fetchedMessages = snapshot.docs.map(doc => {
            const data = doc.data();
            const createdAt = data.createdAt ? data.createdAt.toDate() : new Date();
            
            return {
              id: doc.id,
              author: {
                name: data.authorName || 'Unknown',
                initials: data.authorInitials || '?',
                role: data.authorRole || 'Member'
              },
              content: data.content,
              time: createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
          }) as Message[];
          setMessages(fetchedMessages);
      } catch (error) {
         handleFirestoreError(error, OperationType.LIST, `ministryChannels/${activeChannelId}/messages`);
      }
    }, (error) => {
        handleFirestoreError(error, OperationType.LIST, `ministryChannels/${activeChannelId}/messages`);
    });
    
    return () => unsubscribe();
  }, [user, activeChannelId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !profile || !activeChannelId || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const messagesRef = collection(db, 'ministryChannels', activeChannelId, 'messages');
      const initials = profile.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U';

      await addDoc(messagesRef, {
          authorId: user.uid,
          authorName: profile.fullName,
          authorInitials: initials,
          authorRole: profile.role || 'Member',
          content: newMessage,
          createdAt: serverTimestamp()
      });
      setNewMessage('');
    } catch (error) {
      toast.error('Failed to send message');
      handleFirestoreError(error, OperationType.CREATE, `ministryChannels/${activeChannelId}/messages`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Social Tab Navigation */}
      <div className={`-mx-4 px-4 md:-mx-6 md:px-6 lg:mx-0 lg:px-0 gap-6 md:gap-8 border-b border-slate-200 mb-2 overflow-x-auto no-scrollbar w-[calc(100%+32px)] md:w-[calc(100%+48px)] lg:w-full ${activeChannelId ? 'hidden lg:flex' : 'flex'}`}>
        {[
          { label: 'Feed', path: '/community-feed', mobileOnly: false },
          { label: 'Channels', path: '/ministry-channels', mobileOnly: false },
          { label: 'Messages', path: '/direct-messages', mobileOnly: false },
          { label: 'Announcements', path: '/communication', mobileOnly: true }
        ].map((tab) => (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            className={`shrink-0 pb-4 text-sm font-bold transition-all whitespace-nowrap relative ${
              tab.mobileOnly ? 'md:hidden' : ''
            } ${
              location.pathname === tab.path 
                ? 'text-indigo-600' 
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {tab.label}
            {location.pathname === tab.path && (
              <motion.div 
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"
              />
            )}
          </button>
        ))}
      </div>

      <div className={`flex bg-white lg:rounded-2xl lg:border lg:border-slate-200 shadow-sm overflow-hidden relative -mx-4 md:-mx-6 lg:mx-0 w-[calc(100%+32px)] md:w-[calc(100%+48px)] lg:w-full ${activeChannelId ? 'h-[calc(100vh-100px)] lg:h-[calc(100vh-200px)] border-t border-slate-200 lg:border-t-0' : 'h-[calc(100vh-160px)] lg:h-[calc(100vh-200px)]'}`}>
      {/* Channel Sidebar */}
      <div className={`flex flex-col w-full lg:w-72 lg:border-r border-slate-200 bg-slate-50 ${activeChannelId ? 'hidden lg:flex' : 'flex'}`}>
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
          {channels.map(channel => (
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
      <div className={`flex-1 flex-col min-w-0 bg-[#efeae2] ${activeChannelId ? 'flex' : 'hidden lg:flex'}`}>
        {activeChannel ? (
          <>
        {/* Chat Header */}
        <div className="h-16 px-4 lg:px-6 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2 lg:gap-3">
            <button 
              onClick={() => setActiveChannelId(null)}
              className="lg:hidden p-2 -ml-2 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="hidden lg:block p-2 text-slate-400">
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
                className="flex gap-3 group"
              >
                <div className="w-8 h-8 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-indigo-600 font-bold shrink-0 mt-6">
                  {msg.author.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-sm font-black text-slate-900">{msg.author.name}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{msg.time}</span>
                  </div>
                  <div className="bg-white border border-slate-100 px-3 py-2 rounded-2xl rounded-tl-none shadow-sm inline-block max-w-[90%] break-words whitespace-pre-wrap">
                    <p className="text-[15px] text-[#111b21] leading-relaxed">
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
        <div className="p-2 md:p-3 bg-transparent mt-auto shrink-0 w-full border-t-0">
          <form 
            onSubmit={handleSendMessage}
            className="flex items-end gap-2 w-full max-w-full"
          >
            <div className="flex bg-white items-center gap-1 flex-1 border border-slate-200 shadow-sm rounded-3xl px-2 py-1.5 focus-within:ring-2 focus-within:ring-[#00a884]/20 focus-within:border-[#00a884]">
              <button type="button" className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors shrink-0">
                <Smile size={24} />
              </button>
              <textarea 
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && window.innerWidth >= 1024) {
                    e.preventDefault();
                    if (newMessage.trim()) {
                      handleSendMessage(e as any);
                    }
                  }
                }}
                placeholder={`Message #${activeChannel?.name}...`}
                className="flex-1 bg-transparent border-none py-1.5 text-[15px] font-normal text-slate-700 placeholder:text-slate-400 focus:ring-0 outline-none resize-none max-h-[120px] min-h-[24px] overflow-y-auto leading-tight"
                rows={1}
                style={{ minHeight: '24px' }}
              />
              <button type="button" className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors shrink-0">
                <Paperclip size={20} className="transform -rotate-45" />
              </button>
              {!newMessage.trim() && (
                <button type="button" className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors shrink-0 mr-1">
                  <Camera size={24} />
                </button>
              )}
            </div>
            {newMessage.trim() ? (
              <button 
                type="submit"
                className="w-12 h-12 shrink-0 bg-[#00a884] text-white rounded-full flex items-center justify-center hover:bg-[#008f6f] active:scale-95 transition-all shadow-sm"
              >
                <Send size={20} style={{ transform: 'translateX(1px)' }} />
              </button>
            ) : (
              <button 
                type="button"
                className="w-12 h-12 shrink-0 bg-[#00a884] text-white rounded-full flex items-center justify-center hover:bg-[#008f6f] active:scale-95 transition-all shadow-sm"
              >
                <Mic size={24} />
              </button>
            )}
          </form>
        </div>
        </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-slate-50/30">
            <div className="w-20 h-20 bg-white shadow-sm border border-slate-200 rounded-full flex items-center justify-center mb-6">
              <Hash className="text-slate-300" size={40} />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Ministry Channels</h3>
            <p className="text-slate-500 max-w-xs mt-2 text-sm leading-relaxed">
              Select a channel from the sidebar to view conversations.
            </p>
          </div>
        )}
      </div>

      {/* Right Sidebar Details */}
      <AnimatePresence>
        {showDetails && activeChannel && (
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
    </div>
  );
}
