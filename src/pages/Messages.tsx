import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  Search, 
  User, 
  Info, 
  MoreVertical, 
  Phone, 
  Video, 
  ArrowLeft,
  MessageSquare,
  Shield,
  Star as StarIcon,
  Check,
  CheckCheck,
  Clock
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  collection, 
  query, 
  onSnapshot, 
  where, 
  orderBy, 
  addDoc, 
  serverTimestamp, 
  doc, 
  updateDoc,
  getDoc,
  limit
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useFirebase } from '../components/FirebaseProvider';
import { format } from 'date-fns';

interface Chat {
  id: string;
  participants: string[];
  lastMessage?: string;
  lastMessageAt?: any;
  recipientProfile?: any;
}

interface Message {
  id: string;
  senderId: string;
  text: string;
  createdAt: any;
}

export default function Messages() {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useFirebase();
  
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [searchChats, setSearchChats] = useState('');
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [loading, setLoading] = useState(true);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Fetch all chats for current user
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsub = onSnapshot(q, async (snapshot) => {
      const chatData = await Promise.all(snapshot.docs.map(async (chatDoc) => {
        const data = chatDoc.data();
        const recipientId = data.participants.find((p: string) => p !== user.uid);
        
        // Fetch recipient basic info
        let recipientProfile = { fullName: 'User', role: 'Member' };
        try {
          const userRef = doc(db, 'users', recipientId);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            recipientProfile = userSnap.data() as any;
          }
        } catch (e) {
          console.warn("Failed to fetch recipient info", e);
        }

        return {
          id: chatDoc.id,
          ...data,
          recipientProfile
        } as Chat;
      }));

      setChats(chatData);
      setLoading(false);
      
      if (chatId) {
        const active = chatData.find(c => c.id === chatId);
        if (active) setActiveChat(active);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'chats');
      setLoading(false);
    });

    return () => unsub();
  }, [user, chatId]);

  // Fetch messages for active chat
  useEffect(() => {
    if (!chatId) {
      setMessages([]);
      return;
    }

    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('createdAt', 'asc'),
      limit(100)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      setMessages(msgs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `chats/${chatId}/messages`);
    });

    return () => unsub();
  }, [chatId]);

  const sendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || !chatId || !user) return;

    const text = inputText.trim();
    setInputText('');

    try {
      const msgData = {
        senderId: user.uid,
        text,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'chats', chatId, 'messages'), msgData);
      
      // Send notification to recipient
      const recipientId = activeChat?.participants.find((p: string) => p !== user.uid);
      if (recipientId) {
        await addDoc(collection(db, `users/${recipientId}/reminders`), {
          title: 'New Message',
          description: `${profile?.fullName} sent you a message: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`,
          date: format(new Date(), 'yyyy-MM-dd'),
          time: format(new Date(), 'HH:mm'),
          status: 'pending',
          userId: recipientId,
          category: 'chat',
          targetPath: `/messages/${chatId}`,
          createdAt: serverTimestamp()
        });
      }
      
      // Update chat meta
      await updateDoc(doc(db, 'chats', chatId), {
        lastMessage: text,
        lastMessageAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Message send error:", error);
    }
  };

  const filteredChats = chats.filter(c => 
    c.recipientProfile?.fullName.toLowerCase().includes(searchChats.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-120px)] bg-slate-50/50 rounded-[3rem] border border-slate-200 overflow-hidden shadow-2xl shadow-slate-200/50">
      {/* Sidebar */}
      <div className={`w-full md:w-96 bg-white border-r border-slate-100 flex flex-col ${chatId ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-8 space-y-6">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Signals</h2>
            <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
              <MessageSquare size={20} />
            </div>
          </div>
          
          <div className="relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Filter threads..."
              className="w-full h-14 pl-14 pr-6 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-4 focus:ring-indigo-50 transition-all outline-none font-bold text-slate-900 placeholder:text-slate-300"
              value={searchChats}
              onChange={(e) => setSearchChats(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 space-y-1">
          {loading ? (
             <div className="p-8 text-center animate-pulse space-y-4">
                {[1,2,3,4].map(i => <div key={i} className="h-20 bg-slate-50 rounded-3xl" />)}
             </div>
          ) : filteredChats.length === 0 ? (
            <div className="p-12 text-center space-y-4">
              <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200 mx-auto">
                <Search size={32} />
              </div>
              <p className="text-slate-400 font-bold text-sm">No conversations found</p>
            </div>
          ) : (
            filteredChats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => navigate(`/messages/${chat.id}`)}
                className={`w-full p-4 rounded-[2rem] flex items-center gap-4 transition-all group relative overflow-hidden ${chatId === chat.id ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'hover:bg-slate-50'}`}
              >
                <div className="relative">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black shadow-sm ${chatId === chat.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-white transition-colors'}`}>
                    {chat.recipientProfile?.fullName?.[0]}
                  </div>
                  <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-lg border-4 border-white shadow-sm flex items-center justify-center text-[8px] font-black ${chat.recipientProfile?.role === 'superadmin' || chat.recipientProfile?.role === 'admin' ? 'bg-indigo-500 text-white' : 'bg-amber-500 text-white'}`}>
                    {chat.recipientProfile?.role === 'admin' ? <Shield size={10} /> : <StarIcon size={10} />}
                  </div>
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <p className="font-bold text-sm truncate uppercase tracking-tight">{chat.recipientProfile?.fullName}</p>
                    {chat.lastMessageAt && (
                      <span className={`text-[8px] font-black uppercase tracking-widest ${chatId === chat.id ? 'text-white/60' : 'text-slate-400'}`}>
                        {format(chat.lastMessageAt.toDate(), 'HH:mm')}
                      </span>
                    )}
                  </div>
                  <p className={`text-[10px] font-medium truncate ${chatId === chat.id ? 'text-white/80' : 'text-slate-500'}`}>
                    {chat.lastMessage || 'Start a conversation'}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col bg-white overflow-hidden ${!chatId ? 'hidden md:flex' : 'flex'}`}>
        {chatId && activeChat ? (
          <>
            {/* Chat Header */}
            <header className="h-24 px-10 border-b border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-5">
                <button 
                  onClick={() => navigate('/messages')}
                  className="md:hidden p-2 -ml-2 text-slate-400 hover:text-slate-900 transition-colors"
                >
                  <ArrowLeft size={20} />
                </button>
                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 font-black text-lg">
                  {activeChat.recipientProfile?.fullName?.[0]}
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">{activeChat.recipientProfile?.fullName}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{activeChat.recipientProfile?.role}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all flex items-center justify-center">
                  <Phone size={18} />
                </button>
                <button className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all flex items-center justify-center">
                  <Video size={18} />
                </button>
                <button className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all flex items-center justify-center border-l border-slate-100 ml-2">
                  <MoreVertical size={18} />
                </button>
              </div>
            </header>

            {/* Messages Area */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto custom-scrollbar p-10 space-y-6 bg-slate-50/30"
            >
              <div className="py-20 text-center">
                <div className="inline-flex items-center gap-3 px-4 py-2 bg-white border border-slate-100 rounded-full shadow-sm">
                   <Shield size={14} className="text-indigo-500" />
                   <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Communication Encrypted & Secure</span>
                </div>
              </div>

              <AnimatePresence>
                {messages.map((msg) => {
                  const isOwn = msg.senderId === user?.uid;
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[70%] group ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                        <div className={`p-5 rounded-[2rem] text-sm font-bold shadow-sm ${isOwn ? 'bg-indigo-600 text-white rounded-br-lg' : 'bg-white text-slate-700 rounded-bl-lg'}`}>
                          {msg.text}
                        </div>
                        <div className={`flex items-center gap-2 mt-2 px-2 ${isOwn ? 'flex-row-reverse' : ''}`}>
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                            {msg.createdAt ? format(msg.createdAt.toDate(), 'HH:mm') : '...'}
                          </span>
                          {isOwn && <CheckCheck size={10} className="text-emerald-500" />}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Input Area */}
            <div className="p-8 px-10 bg-white border-t border-slate-50">
              <form 
                onSubmit={sendMessage}
                className="flex items-center gap-4 bg-slate-50 p-2 pl-6 rounded-[2rem] border border-slate-100 focus-within:ring-4 focus-within:ring-indigo-50 focus-within:bg-white transition-all group"
              >
                <input 
                  type="text" 
                  placeholder="Type your message..."
                  className="flex-1 bg-transparent border-none outline-none font-bold text-slate-900 placeholder:text-slate-300"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                />
                <button 
                  type="submit"
                  disabled={!inputText.trim()}
                  className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-100 hover:bg-slate-900 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
                >
                  <Send size={18} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-20 text-center space-y-8">
             <div className="relative">
                <div className="w-32 h-32 bg-slate-50 rounded-[3rem] animate-pulse" />
                <div className="absolute inset-0 flex items-center justify-center text-slate-200">
                  <MessageSquare size={64} />
                </div>
             </div>
             <div className="space-y-4 max-w-sm">
                <h3 className="text-2xl font-black text-slate-900">Select a thread</h3>
                <p className="text-slate-500 font-medium leading-relaxed">Choose a conversation from the sidebar or start a new connection from the directory.</p>
                <button 
                  onClick={() => navigate('/directory')}
                  className="px-8 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200"
                >
                   Open Directory
                </button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
