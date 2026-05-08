import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { useFirebase } from './FirebaseProvider';
import { Link2, MessageCircle, Phone, Users, MessageSquare, Image as ImageIcon, Smile, UserPlus } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, query, or, and, where, getDocs, doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { toast } from 'sonner';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: any;
}

export function ShareModal({ isOpen, onClose, post }: ShareModalProps) {
  const { profile, user } = useFirebase();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [friends, setFriends] = useState<any[]>([]);

  useEffect(() => {
    if (!user || !isOpen) return;
    const fetchFriends = async () => {
      try {
        const q1 = query(
          collection(db, 'friendships'),
          where('user1Id', '==', user.uid),
          where('status', '==', 'accepted')
        );
        const q2 = query(
          collection(db, 'friendships'),
          where('user2Id', '==', user.uid),
          where('status', '==', 'accepted')
        );
        const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
        const allDocs = [...snap1.docs, ...snap2.docs];

        const friendIds = allDocs.map(docSnap => {
          const data = docSnap.data();
          return data.user1Id === user.uid ? data.user2Id : data.user1Id;
        });

        if (friendIds.length > 0) {
          const friendsData = [];
          for (const fId of friendIds) {
             const userDoc = await getDoc(doc(db, 'users', fId));
             if (userDoc.exists()) {
                friendsData.push({ id: userDoc.id, ...userDoc.data() });
             }
          }
          setFriends(friendsData);
        }
      } catch (e) {
        console.error('Error fetching friends', e);
      }
    };
    fetchFriends();
  }, [user, isOpen]);

  const handleSendInMessenger = async (friendId: string) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const q = query(
        collection(db, 'directMessageChats'),
        where('participants', 'array-contains', user.uid)
      );
      const snap = await getDocs(q);
      let foundChatId = null;
      snap.forEach(docSnap => {
        const data = docSnap.data();
        if (data.participants.includes(friendId) && data.participants.length === 2 && !data.isGroup) {
          foundChatId = docSnap.id;
        }
      });

      let chatId = foundChatId;
      if (!chatId) {
        const newChat = await addDoc(collection(db, 'directMessageChats'), {
            participants: [user.uid, friendId],
            lastMessage: 'Shared a post',
            lastMessageTime: serverTimestamp(),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        chatId = newChat.id;
      }
      
      const messagesRef = collection(db, 'directMessageChats', chatId, 'messages');
      const postUrl = `${window.location.origin}/community-feed?post=${post.id}`;
      const messageContent = content ? `${content}\n\n${postUrl}` : postUrl;

      await addDoc(messagesRef, {
          senderId: user.uid,
          text: messageContent,
          sharedPostId: post.id,
          status: 'sent',
          createdAt: serverTimestamp()
      });

      await updateDoc(doc(db, 'directMessageChats', chatId), {
        lastMessage: 'Shared a post',
        lastMessageTime: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      // Try to increment unread if property exists, ignoring errors if not explicitly structured.
      // Doing it in a separate try catch to not fail the whole operation.
      try {
        await updateDoc(doc(db, 'directMessageChats', chatId), {
          [`unreadCount.${friendId}`]: increment(1)
        });
      } catch (e) { /* silent fail */ }
      
      toast.success('Sent in Messenger');
      setContent('');
      onClose();
    } catch (error) {
      console.error(error);
      toast.error('Failed to send in Messenger');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShareNow = async () => {
    if (!profile || !user) return;
    setIsSubmitting(true);
    try {
      const initials = profile.fullName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || 'U';
      const postUrl = `${window.location.origin}/community-feed?post=${post.id}`;
      
      await addDoc(collection(db, 'communityPosts'), {
        authorId: user.uid,
        authorName: profile.fullName || 'Anonymous',
        authorInitials: initials,
        authorRole: profile.role || 'Member',
        authorAvatar: user.photoURL || null,
        content: content,
        sharedPostId: post.id,
        createdAt: serverTimestamp(),
        likes: 0,
        commentsCount: 0,
        tags: ['shared'],
        privacy: 'public'
      });
      toast.success('Post shared to your feed!');
      onClose();
      setContent('');
    } catch (error) {
      console.error('Error sharing post:', error);
      toast.error('Failed to share post');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Share Post">
      <div className="p-4 bg-white rounded-t-3xl max-w-lg w-full mx-auto max-h-[90vh] overflow-y-auto">
        <div className="bg-slate-50 text-slate-500 text-xs p-3 rounded-lg mb-4">
          Links you share are unique to you and may be used to improve suggestions and ads you see. <a href="#" className="font-bold text-blue-600">Learn more</a>
        </div>
        
        <div className="flex gap-3 mb-4 items-start">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-200 shrink-0">
             {user?.photoURL ? (
                <img src={user.photoURL} alt={profile?.fullName || ''} className="w-full h-full object-cover" />
             ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-600 font-bold bg-indigo-100">
                   {profile?.fullName?.split(' ').map((n:string)=>n[0]).join('').substring(0,2).toUpperCase() || '?'}
                </div>
             )}
          </div>
          <div>
            <p className="font-bold text-slate-900 text-sm">{profile?.fullName || 'User'}</p>
            <div className="flex gap-2 mt-1">
              <select className="bg-slate-100/50 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-full outline-none cursor-pointer border-none shadow-sm pb-1 flex items-center h-8">
                <option value="feed">Feed ▾</option>
                <option value="story">Your Story</option>
              </select>
              <select className="bg-slate-100/50 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-full outline-none cursor-pointer border-none shadow-sm flex items-center h-8">
                <option value="public">🌍 Public ▾</option>
                <option value="friends">👥 Friends</option>
                <option value="only_me">🔒 Only Me</option>
              </select>
            </div>
          </div>
        </div>

        <textarea
          placeholder="Say something..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full text-lg outline-none resize-none min-h-[60px]"
        />

        <div className="flex items-center justify-between mt-2 mb-6 border-b border-slate-100 pb-4">
          <div className="flex gap-4 text-slate-500">
            <button className="hover:text-slate-700"><Smile size={24} /></button>
            <button className="hover:text-slate-700"><UserPlus size={24} /></button>
          </div>
          <button 
            onClick={handleShareNow}
            disabled={isSubmitting}
            className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg shadow-md hover:bg-blue-700 disabled:opacity-50"
          >
            Share now
          </button>
        </div>

        <div className="mb-6">
          <h3 className="font-bold text-slate-900 mb-4 text-lg">Send in Messenger</h3>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4">
             <div className="flex flex-col items-center gap-2 shrink-0 w-16">
               <div className="w-14 h-14 rounded-full bg-green-50 text-green-500 flex flex-col items-center justify-center border-2 border-green-500 relative">
                 <div className="text-[10px] absolute translate-y-[2px]"><MessageCircle className="w-6 h-6"/></div>
               </div>
               <p className="text-xs text-center font-medium leading-tight">Your story</p>
             </div>
             {friends.map((f, i) => (
               <div key={f.id} onClick={() => handleSendInMessenger(f.id)} className="flex flex-col items-center gap-2 shrink-0 w-16 cursor-pointer">
                 {f.photoUrl || f.photoURL ? (
                    <img src={f.photoUrl || f.photoURL} alt={f.fullName} className="w-14 h-14 rounded-full object-cover shadow-sm" />
                 ) : (
                    <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold shadow-sm">
                       {f.fullName?.substring(0, 2).toUpperCase() || '?'}
                    </div>
                 )}
                 <p className="text-xs text-center font-medium leading-tight line-clamp-2">{f.fullName}</p>
               </div>
             ))}
          </div>
        </div>

        <div className="mb-8">
          <h3 className="font-bold text-slate-900 mb-4 text-lg">Share to</h3>
          <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 items-start">
             {[
               { icon: <Users className="w-6 h-6 text-slate-800"/>, label: 'Your story', bg: 'bg-white border border-slate-200 shadow-sm' },
               { icon: <MessageCircle className="w-6 h-6 text-white"/>, label: 'Messenger', bg: 'bg-blue-500' },
               { icon: <Phone className="w-6 h-6 text-white"/>, label: 'WhatsApp', bg: 'bg-[#25D366]' },
               { icon: <Users className="w-6 h-6 text-slate-700"/>, label: 'Group', bg: 'bg-slate-100' },
               { icon: <Phone className="w-6 h-6 text-white"/>, label: 'WhatsApp Status', bg: 'bg-[#25D366]' },
               { icon: <Link2 className="w-6 h-6 text-slate-700"/>, label: 'Copy link', bg: 'bg-slate-100',
                 onClick: () => {
                   navigator.clipboard.writeText(`${window.location.origin}/community-feed?post=${post.id}`);
                   toast.success('Link copied to clipboard!');
                 }
               },
               { icon: <MessageSquare className="w-6 h-6 text-white"/>, label: 'Text', bg: 'bg-blue-500' },
             ].map((item, i) => (
               <div key={i} className="flex flex-col items-center gap-2 shrink-0 w-[4.5rem] cursor-pointer" onClick={item.onClick}>
                 <div className={`w-14 h-14 rounded-full flex items-center justify-center ${item.bg}`}>
                   {item.icon}
                 </div>
                 <p className="text-[11px] text-slate-900 font-bold text-center leading-tight">{item.label}</p>
               </div>
             ))}
          </div>
        </div>

      </div>
    </Modal>
  );
}
