import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Camera,
  Mic,
  Search, 
  Send, 
  Paperclip, 
  Smile, 
  MoreVertical, 
  Phone, 
  Video, 
  CheckCheck,
  Plus,
  Users,
  MessageSquare,
  X,
  ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate, useLocation } from 'react-router-dom';

interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  time: string;
  status: 'sent' | 'delivered' | 'read';
}

interface User {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  initials: string;
  status: 'online' | 'offline' | 'away';
  lastSeen?: string;
}

interface Chat {
  id: string;
  user: User;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  messages: ChatMessage[];
}

const CHATS: Chat[] = [
  {
    id: '1',
    user: { 
      id: 'u1', 
      name: 'Pastor John', 
      role: 'Head Pastor', 
      initials: 'PJ', 
      status: 'online' 
    },
    lastMessage: 'Looking forward to seeing you at the service this Sunday!',
    lastMessageTime: '10:42 AM',
    unreadCount: 2,
    messages: [
      { id: 'm1', senderId: 'u1', text: 'Hello! How are the preparations going for the weekend retreat?', time: '10:35 AM', status: 'read' },
      { id: 'm2', senderId: 'me', text: 'Hi Pastor John! Everything is moving along well. We just finalized the catering order this morning.', time: '10:38 AM', status: 'read' },
      { id: 'm3', senderId: 'u1', text: 'Excellent news. Looking forward to seeing you at the service this Sunday!', time: '10:42 AM', status: 'read' }
    ]
  },
  {
    id: '2',
    user: { 
      id: 'u2', 
      name: 'Sarah Jenkins', 
      role: 'Choir Lead', 
      initials: 'SJ', 
      status: 'offline',
      lastSeen: '2h ago'
    },
    lastMessage: 'Thanks for the update on the youth group schedule.',
    lastMessageTime: 'Yesterday',
    unreadCount: 0,
    messages: []
  },
  {
    id: '3',
    user: { 
      id: 'u3', 
      name: 'Michael Thompson', 
      role: 'Technical Team', 
      initials: 'MT', 
      status: 'away' 
    },
    lastMessage: 'The new sound system arrives tomorrow morning.',
    lastMessageTime: 'Tuesday',
    unreadCount: 0,
    messages: []
  }
];

export default function DirectMessages() {
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [chats, setChats] = useState<Chat[]>(CHATS);
  const [messageText, setMessageText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const activeChat = chats.find(c => c.id === activeChatId);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeChatId, chats]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !activeChat) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      senderId: 'me',
      text: messageText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent'
    };

    setChats(prev => prev.map(chat => {
      if (chat.id === activeChatId) {
        return {
          ...chat,
          messages: [...chat.messages, newMessage],
          lastMessage: messageText,
          lastMessageTime: 'Just now'
        };
      }
      return chat;
    }));

    setMessageText('');
    
    // Simulate delivery
    setTimeout(() => {
      setChats(prev => prev.map(chat => {
        if (chat.id === activeChatId) {
          return {
            ...chat,
            messages: chat.messages.map(m => m.id === newMessage.id ? { ...m, status: 'delivered' as const } : m)
          };
        }
        return chat;
      }));
    }, 1500);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Social Tab Navigation */}
      <div className={`-mx-4 px-4 md:-mx-6 md:px-6 lg:mx-0 lg:px-0 gap-6 md:gap-8 border-b border-slate-200 mb-2 overflow-x-auto no-scrollbar w-[calc(100%+32px)] md:w-[calc(100%+48px)] lg:w-full ${activeChatId ? 'hidden lg:flex' : 'flex'}`}>
        {[
          { label: 'Community Feed', path: '/community-feed', mobileOnly: false },
          { label: 'Ministry Channels', path: '/ministry-channels', mobileOnly: false },
          { label: 'Direct Messages', path: '/direct-messages', mobileOnly: false },
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

      <div className={`flex bg-white lg:rounded-2xl lg:border lg:border-slate-200 shadow-sm overflow-hidden relative -mx-4 md:-mx-6 lg:mx-0 w-[calc(100%+32px)] md:w-[calc(100%+48px)] lg:w-full ${activeChatId ? 'h-[calc(100vh-100px)] lg:h-[calc(100vh-200px)] border-t border-slate-200 lg:border-t-0' : 'h-[calc(100vh-160px)] lg:h-[calc(100vh-200px)]'}`}>
      {/* Search & List Panel */}
      <div className={`flex flex-col w-full lg:w-96 lg:border-r border-slate-200 bg-white ${activeChatId ? 'hidden lg:flex' : 'flex'}`}>
        <div className="p-4 border-b border-slate-100 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none">Direct Messages</h3>
            <button className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="New Message">
              <Plus size={18} />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text" 
              placeholder="Search conversations..." 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-xs font-medium focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
          {chats.map(chat => (
            <button
              key={chat.id}
              onClick={() => setActiveChatId(chat.id)}
              className={`w-full flex items-start gap-3 p-4 transition-all hover:bg-slate-50 text-left relative ${
                activeChatId === chat.id ? 'bg-indigo-50/50 border-r-2 border-indigo-600' : ''
              }`}
            >
              <div className="relative shrink-0">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold border border-slate-200 group-hover:scale-105 transition-transform">
                  {chat.user.initials}
                </div>
                <div className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-white rounded-full ${
                  chat.user.status === 'online' ? 'bg-emerald-500' : 
                  chat.user.status === 'away' ? 'bg-amber-500' : 'bg-slate-300'
                }`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <h4 className={`text-sm font-bold truncate ${activeChatId === chat.id ? 'text-indigo-600' : 'text-slate-900'}`}>
                    {chat.user.name}
                  </h4>
                  <span className="text-[10px] text-slate-400 font-medium shrink-0">{chat.lastMessageTime}</span>
                </div>
                <p className="text-xs text-slate-500 truncate mt-0.5">{chat.lastMessage}</p>
              </div>
              {chat.unreadCount > 0 && (
                <div className="absolute top-1/2 -translate-y-1/2 right-4 w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black shadow-sm">
                  {chat.unreadCount}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* active Chat Area */}
      <div className={`flex-1 flex-col bg-[#efeae2] relative ${activeChatId ? 'flex' : 'hidden lg:flex'}`}>
        {activeChat ? (
          <>
            {/* Header */}
            <div className="h-16 lg:h-20 px-4 lg:px-8 border-b border-slate-100 flex justify-between items-center bg-white shrink-0 shadow-sm z-10">
              <div className="flex items-center gap-2 lg:gap-4">
                <button 
                  onClick={() => setActiveChatId(null)}
                  className="lg:hidden p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-colors -ml-2"
                >
                  <ArrowLeft size={20} />
                </button>
                <div className="relative">
                  <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-slate-100 flex items-center justify-center text-indigo-600 font-bold shadow-sm">
                    {activeChat.user.initials}
                  </div>
                  <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 border-2 border-white rounded-full ${
                    activeChat.user.status === 'online' ? 'bg-emerald-500' : 
                    activeChat.user.status === 'away' ? 'bg-amber-500' : 'bg-slate-300'
                  }`} />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900 leading-none">{activeChat.user.name}</h2>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1.5 flex items-center gap-1.5">
                    {activeChat.user.status === 'online' ? 'Active Now' : `Last seen ${activeChat.user.lastSeen || 'recently'}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all" title="Audio Call">
                  <Phone size={18} />
                </button>
                <button className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all" title="Video Call">
                  <Video size={18} />
                </button>
                <button className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all">
                  <MoreVertical size={18} />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-8 space-y-6"
            >
              <div className="flex justify-center mb-8">
                <span className="px-3 py-1 bg-white border border-slate-100 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-widest shadow-sm">
                  Conversation Started
                </span>
              </div>

              {activeChat.messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex ${msg.senderId === 'me' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-3 max-w-[75%] ${msg.senderId === 'me' ? 'flex-row-reverse' : ''}`}>
                    {msg.senderId !== 'me' && (
                      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0">
                        {activeChat.user.initials}
                      </div>
                    )}
                    <div className="flex flex-col gap-1">
                      <div className={`px-3 py-2 text-[15px] shadow-sm leading-relaxed break-words whitespace-pre-wrap ${
                        msg.senderId === 'me' 
                          ? 'bg-[#d9fdd3] text-[#111b21] rounded-2xl rounded-tr-none' 
                          : 'bg-white text-[#111b21] rounded-2xl rounded-tl-none'
                      }`}>
                        {msg.text}
                      </div>
                      <div className={`flex items-center gap-1.5 px-2 mt-1 ${msg.senderId === 'me' ? 'justify-end' : 'justify-start'}`}>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">{msg.time}</span>
                        {msg.senderId === 'me' && (
                          <CheckCheck size={14} className={msg.status === 'read' ? 'text-[#53bdeb]' : 'text-slate-400'} />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Input Area */}
            <div className="p-2 md:p-3 bg-transparent mt-auto w-full border-t-0">
              <form 
                onSubmit={handleSendMessage}
                className="flex items-end gap-2 w-full max-w-full"
              >
                <div className="flex bg-white items-center gap-1 flex-1 border border-slate-200 shadow-sm rounded-3xl px-2 py-1.5 focus-within:ring-2 focus-within:ring-[#00a884]/20 focus-within:border-[#00a884]">
                  <button type="button" className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors shrink-0">
                    <Smile size={24} />
                  </button>
                  <textarea 
                    value={messageText}
                    onChange={(e) => {
                      setMessageText(e.target.value);
                      e.target.style.height = 'auto';
                      e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey && window.innerWidth >= 1024) {
                        e.preventDefault();
                        if (messageText.trim()) {
                          handleSendMessage(e as any);
                        }
                      }
                    }}
                    placeholder="Message" 
                    className="flex-1 bg-transparent border-none py-1.5 text-[15px] font-normal text-slate-700 placeholder:text-slate-400 focus:ring-0 outline-none resize-none max-h-[120px] min-h-[24px] overflow-y-auto leading-tight"
                    rows={1}
                    style={{ minHeight: '24px' }}
                  />
                  <button type="button" className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors shrink-0">
                    <Paperclip size={20} className="transform -rotate-45" />
                  </button>
                  {!messageText.trim() && (
                    <button type="button" className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors shrink-0 mr-1">
                      <Camera size={24} />
                    </button>
                  )}
                </div>
                {messageText.trim() ? (
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
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
              <MessageSquare className="text-slate-200" size={40} />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Your Private Messages</h3>
            <p className="text-slate-500 max-w-xs mt-2 text-sm leading-relaxed">
              Select a conversation from the sidebar to view message history and send new messages securely.
            </p>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
