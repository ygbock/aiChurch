import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, increment, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useFirebase } from '../components/FirebaseProvider';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  MoreHorizontal, 
  Image as ImageIcon, 
  Smile, 
  Send,
  UserPlus,
  TrendingUp,
  Hash,
  Sparkles,
  Users,
  Search,
  MessageSquare,
  Menu,
  X
} from 'lucide-react';
import { toast } from 'sonner';

interface Post {
  id: string;
  author: {
    name: string;
    role: string;
    avatar?: string;
    initials: string;
  };
  content: string;
  image?: string;
  likes: number;
  commentsCount: number;
  time: string;
  isLiked?: boolean;
  tags?: string[];
}

export default function CommunityFeed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [showWidgets, setShowWidgets] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile } = useFirebase();

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'communityPosts'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      try {
        const fetchedPosts = snapshot.docs.map(doc => {
          const data = doc.data();
          const createdAt = data.createdAt ? data.createdAt.toDate() : new Date();
          
          let timeString = 'Just now';
          const diffInMinutes = Math.floor((new Date().getTime() - createdAt.getTime()) / 60000);
          if (diffInMinutes > 0 && diffInMinutes < 60) {
            timeString = `${diffInMinutes}m ago`;
          } else if (diffInMinutes >= 60 && diffInMinutes < 1440) {
            timeString = `${Math.floor(diffInMinutes / 60)}h ago`;
          } else if (diffInMinutes >= 1440) {
            timeString = `${Math.floor(diffInMinutes / 1440)}d ago`;
          }

          return {
            id: doc.id,
            author: { 
              name: data.authorName || 'Unknown', 
              role: data.authorRole || 'Member', 
              initials: data.authorInitials || '?' 
            },
            content: data.content,
            image: data.image,
            likes: data.likes || 0,
            commentsCount: data.commentsCount || 0,
            time: timeString,
            tags: data.tags,
            // we will query likes subcollection if we need isLiked tracking, but for simplicity assume false and then load
            isLiked: false, 
          } as Post;
        });
        
        setPosts(fetchedPosts);

        // Fetch user's likes for these posts
        // We'll update the 'isLiked' dynamically
        for (const postDoc of snapshot.docs) {
          const likeDocRef = doc(db, 'communityPosts', postDoc.id, 'likes', user.uid);
          getDoc(likeDocRef).then((likeDoc) => {
            if (likeDoc.exists()) {
               setPosts(prev => prev.map(p => p.id === postDoc.id ? { ...p, isLiked: true } : p));
            }
          }).catch(err => {
             // Ignore offline issues here
          });
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'communityPosts');
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'communityPosts');
    });

    return () => unsubscribe();
  }, [user]);

  const handleLike = async (postId: string) => {
    if (!user) return;
    
    // Optimistic UI updates
    const isCurrentlyLiked = posts.find(p => p.id === postId)?.isLiked;
    
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          likes: post.isLiked ? Math.max(0, post.likes - 1) : post.likes + 1,
          isLiked: !post.isLiked
        };
      }
      return post;
    }));

    try {
      const postRef = doc(db, 'communityPosts', postId);
      const likeRef = doc(db, 'communityPosts', postId, 'likes', user.uid);

      if (isCurrentlyLiked) {
        await deleteDoc(likeRef);
        await updateDoc(postRef, {
          likes: increment(-1)
        });
      } else {
        await setDoc(likeRef, { createdAt: serverTimestamp() });
        await updateDoc(postRef, {
          likes: increment(1)
        });
      }
    } catch (error) {
      toast.error('Failed to update like status');
      console.error(error);
    }
  };

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim() || !user || !profile || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const initials = profile.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U';
      
      await addDoc(collection(db, 'communityPosts'), {
        authorId: user.uid,
        authorName: profile.fullName,
        authorRole: profile.role || 'Member',
        authorInitials: initials,
        content: newPostContent,
        likes: 0,
        commentsCount: 0,
        createdAt: serverTimestamp()
      });
      
      setNewPostContent('');
      toast.success('Post shared with the community!');
    } catch (error) {
      toast.error('Failed to create post. Please try again.');
      handleFirestoreError(error, OperationType.CREATE, 'communityPosts');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-6xl mx-auto py-2 md:py-8 w-full max-w-full"
    >
      {/* Social Tab Navigation */}
      <div className="-mx-4 px-4 md:mx-0 md:px-0 flex gap-6 md:gap-8 border-b border-slate-200 mb-6 md:mb-8 overflow-x-auto no-scrollbar w-[calc(100%+32px)] md:w-full">
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

      <div className="max-w-3xl mx-auto space-y-6">
        {/* Main Feed */}
        <div className="space-y-6">
          {/* Create Post */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold shrink-0">
                ME
              </div>
              <div className="flex-1">
                <textarea 
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="Share a word of encouragement or a prayer request..."
                  className="w-full border-none focus:ring-0 text-slate-700 bg-slate-50 rounded-xl p-4 min-h-[100px] resize-none text-sm font-medium placeholder:text-slate-400"
                />
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex gap-1">
                    <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                      <ImageIcon size={20} />
                    </button>
                    <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                      <Hash size={20} />
                    </button>
                    <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                      <Smile size={20} />
                    </button>
                  </div>
                  <button 
                    onClick={handlePostSubmit}
                    disabled={!newPostContent.trim() || isSubmitting}
                    className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSubmitting ? 'Posting...' : 'Post'} <Send size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Feed Posts */}
          <div className="space-y-6">
            <AnimatePresence>
              {posts.map((post) => (
                <motion.article 
                  key={post.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex gap-3 items-center">
                        <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold">
                          {post.author.initials}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">{post.author.name}</h4>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{post.author.role} • {post.time}</p>
                        </div>
                      </div>
                      <button className="p-2 text-slate-400 hover:text-slate-600 rounded-lg transition-all">
                        <MoreHorizontal size={20} />
                      </button>
                    </div>

                    <p className="text-slate-700 text-sm leading-relaxed mb-4 break-words whitespace-pre-wrap">
                      {post.content}
                    </p>

                    {post.image && (
                      <div className="mb-4 rounded-xl overflow-hidden border border-slate-100">
                        <img src={post.image} alt="Post content" className="w-full h-auto" />
                      </div>
                    )}

                    {post.tags && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {post.tags.map(tag => (
                          <span key={tag} className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-6 pt-4 border-t border-slate-50">
                      <button 
                        onClick={() => handleLike(post.id)}
                        className={`flex items-center gap-2 text-xs font-bold transition-all ${post.isLiked ? 'text-rose-500' : 'text-slate-500 hover:text-rose-500'}`}
                      >
                        <Heart size={18} fill={post.isLiked ? "currentColor" : "none"} />
                        {post.likes}
                      </button>
                      <button className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-all">
                        <MessageCircle size={18} />
                        {post.commentsCount}
                      </button>
                      <button className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-all ml-auto">
                        <Share2 size={18} />
                        Share
                      </button>
                    </div>
                  </div>
                </motion.article>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Floating Button */}
      <button 
        onClick={() => setShowWidgets(true)}
        className="fixed bottom-6 right-6 lg:bottom-12 lg:right-12 w-14 h-14 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-2xl hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all z-40"
      >
        <Menu size={24} />
      </button>

      {/* Side Popout Drawer */}
      <AnimatePresence>
        {showWidgets && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowWidgets(false)}
              className="fixed inset-0 bg-slate-900/20 backdrop-blur-[2px] z-50"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-sm bg-slate-50 border-l border-slate-200 shadow-2xl z-50 overflow-y-auto p-6 space-y-6"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-black text-slate-900">Community Hub</h2>
                <button 
                  onClick={() => setShowWidgets(false)}
                  className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
          {/* Trending */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="text-indigo-600" size={18} />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Trending in Community</h3>
            </div>
            <div className="space-y-4">
              {[
                { label: 'SundayService', posts: '1.2k' },
                { label: 'SpringRetreat24', posts: '850' },
                { label: 'YouthNight', posts: '420' },
                { label: 'WorshipTeam', posts: '310' }
              ].map(topic => (
                <div key={topic.label} className="group cursor-pointer">
                  <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">#{topic.label}</p>
                  <p className="text-[10px] text-slate-400 font-medium">{topic.posts} posts</p>
                </div>
              ))}
            </div>
          </div>

          {/* New Members */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-6">
              <UserPlus className="text-emerald-500" size={18} />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Suggested Connections</h3>
            </div>
            <div className="space-y-4">
              {[
                { name: 'Michael Chen', role: 'New Member', initials: 'MC' },
                { name: 'Grace Adebayo', role: 'Protocol Team', initials: 'GA' }
              ].map(member => (
                <div key={member.name} className="flex justify-between items-center group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 text-[10px] font-bold">
                      {member.initials}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{member.name}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{member.role}</p>
                    </div>
                  </div>
                  <button className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                    <UserPlus size={16} />
                  </button>
                </div>
              ))}
            </div>
            <button className="w-full mt-6 py-2 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-all">
              View All Members
            </button>
          </div>

          {/* Ministry Channels Widget */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <MessageSquare className="text-indigo-600" size={18} />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Ministry Channels</h3>
              </div>
              <button 
                onClick={() => navigate('/ministry-channels')}
                className="text-[10px] font-black text-indigo-600 hover:underline"
              >
                OPEN CHAT
              </button>
            </div>
            <div className="space-y-3">
              {[
                { name: 'Announcements', count: 0 },
                { name: 'WorshipTeam', count: 2 },
                { name: 'YouthMinistry', count: 0 },
                { name: 'Volunteers', count: 1 }
              ].map(channel => (
                <div 
                  key={channel.name} 
                  onClick={() => navigate('/ministry-channels')}
                  className="flex items-center justify-between group cursor-pointer p-2 hover:bg-slate-50 rounded-xl transition-all"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-medium group-hover:text-indigo-600">#</span>
                    <span className="text-xs font-bold text-slate-600 group-hover:text-slate-900">{channel.name}</span>
                  </div>
                  {channel.count > 0 && (
                    <span className="bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                      {channel.count}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Ministry Pulse */}
          <div className="bg-indigo-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden group">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles size={18} />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Community Insight</span>
              </div>
              <h4 className="text-lg font-black leading-tight mb-2">Member engagement is up 24% this week!</h4>
              <p className="text-xs text-indigo-100 leading-relaxed font-medium">Keep sharing your testimonies and requests. Our community is stronger together.</p>
            </div>
            <Users className="absolute -right-4 -bottom-4 text-white/10 w-24 h-24 group-hover:scale-110 transition-transform" />
          </div>
        </motion.div>
        </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
