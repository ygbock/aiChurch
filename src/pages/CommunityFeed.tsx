import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false
  );

  useEffect(() => {
    const media = window.matchMedia(query);
    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [query]);

  return matches;
}
import { useNavigate, useLocation } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, increment, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useFirebase } from '../components/FirebaseProvider';
import Modal from '../components/Modal';
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
  authorId: string;
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
  privacy?: string;
  commentPrivacy?: string;
  isPinned?: boolean;
  hiddenBy?: string[];
}

export default function CommunityFeed() {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [privacy, setPrivacy] = useState('public');
  const [commentPrivacy, setCommentPrivacy] = useState('global');
  const [showWidgets, setShowWidgets] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [activeMenuPostId, setActiveMenuPostId] = useState<string | null>(null);

  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editingPostContent, setEditingPostContent] = useState('');
  const [privacyModalPost, setPrivacyModalPost] = useState<Post | null>(null);
  const [commentPrivacyModalPost, setCommentPrivacyModalPost] = useState<Post | null>(null);
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
            authorId: data.authorId,
            author: { 
              name: data.authorName || 'Unknown', 
              role: data.authorRole || 'Member', 
              initials: data.authorInitials || '?',
              avatar: data.authorAvatar
            },
            content: data.content,
            image: data.image,
            likes: data.likes || 0,
            commentsCount: data.commentsCount || 0,
            time: timeString,
            tags: data.tags,
            privacy: data.privacy || 'public',
            commentPrivacy: data.commentPrivacy || 'global',
            isPinned: data.isPinned || false,
            hiddenBy: data.hiddenBy || [],
            isLiked: false, 
          } as Post;
        }).filter(post => !post.hiddenBy?.includes(user!.uid));
        
        // Sort by isPinned and then let createdAt handle rest
        fetchedPosts.sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          return 0; // Already sorted by date
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
      const initials = profile.fullName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || 'U';
      
      await addDoc(collection(db, 'communityPosts'), {
        authorId: user.uid,
        authorName: profile.fullName,
        authorRole: profile.role || 'Member',
        authorInitials: initials,
        authorAvatar: user.photoURL || null,
        content: newPostContent,
        likes: 0,
        commentsCount: 0,
        privacy,
        commentPrivacy,
        isPinned: false,
        hiddenBy: [],
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

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPostContent.trim() || !editingPostId) return;
    try {
      await updateDoc(doc(db, 'communityPosts', editingPostId), {
        content: editingPostContent
      });
      setEditingPostId(null);
      setEditingPostContent('');
      toast.success('Post updated');
    } catch (error) {
      toast.error('Failed to update post');
    }
  };

  const handlePrivacySubmit = async (privacyValue: string) => {
    if (!privacyModalPost) return;
    try {
      await updateDoc(doc(db, 'communityPosts', privacyModalPost.id), {
        privacy: privacyValue
      });
      setPrivacyModalPost(null);
      toast.success('Privacy updated');
    } catch (err) {
      toast.error('Failed to update privacy');
    }
  };

  const handleCommentPrivacySubmit = async (privacyValue: string) => {
    if (!commentPrivacyModalPost) return;
    try {
      await updateDoc(doc(db, 'communityPosts', commentPrivacyModalPost.id), {
        commentPrivacy: privacyValue
      });
      setCommentPrivacyModalPost(null);
      toast.success('Comment privacy updated');
    } catch (err) {
      toast.error('Failed to update comment privacy');
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
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold overflow-hidden shrink-0">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt={profile?.fullName || ''} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  profile?.fullName ? profile.fullName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : 'ME'
                )}
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
                        <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold overflow-hidden shrink-0">
                          {post.author.avatar ? (
                            <img src={post.author.avatar} alt={post.author.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            post.author.initials
                          )}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">{post.author.name}</h4>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{post.author.role} • {post.time}</p>
                        </div>
                      </div>
                      <div className="relative">
                        <button 
                          onClick={() => setActiveMenuPostId(activeMenuPostId === post.id ? null : post.id)}
                          className="p-2 text-slate-400 hover:text-slate-600 rounded-lg transition-all"
                        >
                          <MoreHorizontal size={20} />
                        </button>

                        <AnimatePresence>
                          {activeMenuPostId === post.id && !isMobile && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: -10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: -10 }}
                              className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden z-20"
                            >
                              <PostMenuContent 
                                post={post} 
                                user={user} 
                                onClose={() => setActiveMenuPostId(null)} 
                                onEditPost={(p: Post) => { setEditingPostId(p.id); setEditingPostContent(p.content); }}
                                onEditPrivacy={(p: Post) => setPrivacyModalPost(p)}
                                onEditCommentPrivacy={(p: Post) => setCommentPrivacyModalPost(p)}
                              />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    <Modal isOpen={activeMenuPostId === post.id && isMobile} onClose={() => setActiveMenuPostId(null)} title="Post Options">
                      <div className="-mx-6 -mt-2 -mb-6 pb-2">
                        <PostMenuContent 
                          post={post} 
                          user={user} 
                          onClose={() => setActiveMenuPostId(null)} 
                          onEditPost={(p: Post) => { setEditingPostId(p.id); setEditingPostContent(p.content); }}
                          onEditPrivacy={(p: Post) => setPrivacyModalPost(p)}
                          onEditCommentPrivacy={(p: Post) => setCommentPrivacyModalPost(p)}
                        />
                      </div>
                    </Modal>

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
                      <button 
                        onClick={() => setActiveCommentPostId(post.id)}
                        className={`flex items-center gap-2 text-xs font-bold transition-all text-slate-500 hover:text-indigo-600`}
                      >
                        <MessageCircle size={18} />
                        {post.commentsCount}
                      </button>
                      <button 
                        onClick={() => {
                          const url = `${window.location.origin}/community-feed?post=${post.id}`;
                          if (navigator.share) {
                            navigator.share({ title: 'Community Post', url }).catch(() => {});
                          } else {
                            navigator.clipboard.writeText(url);
                            toast.success('Link copied to clipboard!');
                          }
                        }}
                        className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-all ml-auto"
                      >
                        <Share2 size={18} />
                        Share
                      </button>
                    </div>
                  </div>
                </motion.article>
              ))}
            </AnimatePresence>
            
            <Modal
              isOpen={!!activeCommentPostId}
              onClose={() => setActiveCommentPostId(null)}
              title="Comments"
            >
              {activeCommentPostId && <PostComments postId={activeCommentPostId} />}
            </Modal>
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

      {/* Edit Post Modal */}
      <Modal isOpen={!!editingPostId} onClose={() => setEditingPostId(null)} title="Edit Post">
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <textarea
            value={editingPostContent}
            onChange={(e) => setEditingPostContent(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-100 min-h-[120px] resize-none"
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setEditingPostId(null)} className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors">Cancel</button>
            <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all">Save Changes</button>
          </div>
        </form>
      </Modal>

      {/* Post Privacy Modal */}
      <Modal isOpen={!!privacyModalPost} onClose={() => setPrivacyModalPost(null)} title="Who can see this?">
        <div className="space-y-2">
          {[
            { id: 'public', label: 'Public', desc: 'Anyone in the app' },
            { id: 'district', label: 'My District', desc: 'Members in your district' },
            { id: 'branch', label: 'My Branch', desc: 'Members in your branch' },
            { id: 'friends', label: 'Friends', desc: 'Your connections' },
            { id: 'only_me', label: 'Only Me', desc: 'Private to you' }
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => handlePrivacySubmit(opt.id)}
              className="flex items-center justify-between w-full p-4 rounded-xl border border-slate-200 hover:border-indigo-600 hover:bg-indigo-50 transition-all text-left"
            >
              <div>
                <p className="font-bold text-slate-900 text-sm mb-0.5">{opt.label}</p>
                <p className="text-xs font-medium text-slate-500">{opt.desc}</p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${privacyModalPost?.privacy === opt.id ? 'border-indigo-600' : 'border-slate-300'}`}>
                 {privacyModalPost?.privacy === opt.id && <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full" />}
              </div>
            </button>
          ))}
        </div>
      </Modal>

      {/* Comment Privacy Modal */}
      <Modal isOpen={!!commentPrivacyModalPost} onClose={() => setCommentPrivacyModalPost(null)} title="Who can comment?">
        <div className="space-y-2">
          {[
            { id: 'global', label: 'Everyone', desc: 'Anyone who can see the post' },
            { id: 'district', label: 'My District', desc: 'Members in your district' },
            { id: 'branch', label: 'My Branch', desc: 'Members in your branch' },
            { id: 'friends', label: 'Friends', desc: 'Your connections' }
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => handleCommentPrivacySubmit(opt.id)}
              className="flex items-center justify-between w-full p-4 rounded-xl border border-slate-200 hover:border-indigo-600 hover:bg-indigo-50 transition-all text-left"
            >
              <div>
                <p className="font-bold text-slate-900 text-sm mb-0.5">{opt.label}</p>
                <p className="text-xs font-medium text-slate-500">{opt.desc}</p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${commentPrivacyModalPost?.commentPrivacy === opt.id ? 'border-indigo-600' : 'border-slate-300'}`}>
                 {commentPrivacyModalPost?.commentPrivacy === opt.id && <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full" />}
              </div>
            </button>
          ))}
        </div>
      </Modal>
    </motion.div>
  );
}

function PostComments({ postId }: { postId: string }) {
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<any>(null);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const { user, profile } = useFirebase();

  useEffect(() => {
    if (!user) return;
    
    const commentsRef = collection(db, 'communityPosts', postId, 'comments');
    const q = query(commentsRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      try {
        const fetched = snapshot.docs.map(doc => {
          const data = doc.data();
          const createdAt = data.createdAt ? data.createdAt.toDate() : new Date();
          let timeString = 'Just now';
          const diffInMinutes = Math.floor((new Date().getTime() - createdAt.getTime()) / 60000);
          if (diffInMinutes > 0 && diffInMinutes < 60) timeString = `${diffInMinutes}m ago`;
          else if (diffInMinutes >= 60 && diffInMinutes < 1440) timeString = `${Math.floor(diffInMinutes / 60)}h ago`;
          else if (diffInMinutes >= 1440) timeString = `${Math.floor(diffInMinutes / 1440)}d ago`;

          return {
            id: doc.id,
            author: { 
              name: data.authorName || 'Unknown', 
              initials: data.authorInitials || '?',
              avatar: data.authorAvatar
            },
            content: data.content,
            likes: data.likes || 0,
            repliesCount: data.repliesCount || 0,
            time: timeString
          };
        });
        setComments(fetched);
      } catch (error) {
         handleFirestoreError(error, OperationType.LIST, `communityPosts/${postId}/comments`);
      }
    }, error => {
       handleFirestoreError(error, OperationType.LIST, `communityPosts/${postId}/comments`);
    });

    return () => unsubscribe();
  }, [postId, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user || !profile || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const postRef = doc(db, 'communityPosts', postId);
      const initials = profile.fullName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || 'U';

      if (replyTo) {
        const repliesRef = collection(db, 'communityPosts', postId, 'comments', replyTo.id, 'replies');
        await addDoc(repliesRef, {
          authorId: user.uid,
          authorName: profile.fullName,
          authorInitials: initials,
          authorAvatar: user.photoURL || null,
          content: newComment,
          createdAt: serverTimestamp()
        });

        const commentRef = doc(db, 'communityPosts', postId, 'comments', replyTo.id);
        await updateDoc(commentRef, {
          repliesCount: increment(1)
        });
      } else {
        const commentsRef = collection(db, 'communityPosts', postId, 'comments');
        await addDoc(commentsRef, {
          authorId: user.uid,
          authorName: profile.fullName,
          authorInitials: initials,
          authorAvatar: user.photoURL || null,
          content: newComment,
          likes: 0,
          repliesCount: 0,
          createdAt: serverTimestamp()
        });

        await updateDoc(postRef, {
          commentsCount: increment(1)
        });
      }
      
      setNewComment('');
      setReplyTo(null);
    } catch (error) {
      toast.error('Failed to post comment');
      handleFirestoreError(error, OperationType.CREATE, `communityPosts/${postId}/comments`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full gap-4 relative">
      <div className="flex-1 space-y-5">
        {comments.length > 0 ? (
          comments.map((comment) => (
            <CommentItem 
              key={comment.id} 
              postId={postId} 
              comment={comment} 
              user={user} 
              onReply={(c: any) => setReplyTo(c)} 
            />
          ))
        ) : (
          <p className="text-sm text-slate-500 font-medium text-center py-8">No comments yet. Be the first to share your thoughts!</p>
        )}
      </div>

      <div className="sticky bottom-0 -mx-4 -mb-4 p-4 sm:-mx-6 sm:-mb-6 sm:p-6 bg-white border-t border-slate-100 z-10">
        {replyTo && (
           <div className="flex items-center justify-between bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 mb-3">
             <span className="text-xs font-medium text-slate-500">Replying to <span className="font-bold text-slate-700">{replyTo.author.name}</span></span>
             <button onClick={() => setReplyTo(null)} className="text-slate-400 hover:text-slate-600"><X size={14}/></button>
           </div>
        )}
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <input 
              type="text" 
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setTimeout(() => setIsInputFocused(false), 200)}
              placeholder={replyTo ? "Write a reply..." : "Write a comment..."}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-slate-400"
            />
            <button 
              type="submit"
              disabled={!newComment.trim() || isSubmitting}
              className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 transition-all disabled:opacity-50 shrink-0 shadow-sm"
            >
              <Send size={16} className="-ml-0.5" />
            </button>
          </div>
          <AnimatePresence>
            {isInputFocused && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-1 px-2 overflow-hidden"
              >
                <button type="button" className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"><ImageIcon size={18} /></button>
                <button type="button" className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all font-black text-[10px] tracking-wide flex items-center justify-center">GIF</button>
                <button type="button" className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"><Smile size={18} /></button>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </div>
    </div>
  );
}

function CommentItem({ postId, comment, user, onReply }: any) {
  const [isLiked, setIsLiked] = useState(false);
  const [likes, setLikes] = useState(comment.likes || 0);
  const [replies, setReplies] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const likeRef = doc(db, 'communityPosts', postId, 'comments', comment.id, 'likes', user.uid);
    getDoc(likeRef).then(snap => setIsLiked(snap.exists())).catch(() => {});

    const repliesRef = collection(db, 'communityPosts', postId, 'comments', comment.id, 'replies');
    const q = query(repliesRef, orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(q, snap => {
      const fetched = snap.docs.map(doc => {
        const data = doc.data();
        const createdAt = data.createdAt ? data.createdAt.toDate() : new Date();
        let timeString = 'Just now';
        const diffInMinutes = Math.floor((new Date().getTime() - createdAt.getTime()) / 60000);
        if (diffInMinutes > 0 && diffInMinutes < 60) timeString = `${diffInMinutes}m ago`;
        else if (diffInMinutes >= 60 && diffInMinutes < 1440) timeString = `${Math.floor(diffInMinutes / 60)}h ago`;
        else if (diffInMinutes >= 1440) timeString = `${Math.floor(diffInMinutes / 1440)}d ago`;

        return {
          id: doc.id,
          author: { name: data.authorName, initials: data.authorInitials, avatar: data.authorAvatar },
          content: data.content,
          time: timeString
        };
      });
      setReplies(fetched);
    });
    return () => unsub();
  }, [postId, comment.id, user]);

  const handleLike = async () => {
    if (!user) return;
    const likeRef = doc(db, 'communityPosts', postId, 'comments', comment.id, 'likes', user.uid);
    const commentRef = doc(db, 'communityPosts', postId, 'comments', comment.id);
    
    setIsLiked(!isLiked);
    setLikes((prev: number) => isLiked ? prev - 1 : prev + 1);

    try {
      if (isLiked) {
        await deleteDoc(likeRef);
        await updateDoc(commentRef, { likes: increment(-1) });
      } else {
        await setDoc(likeRef, { createdAt: serverTimestamp() });
        await updateDoc(commentRef, { likes: increment(1) });
      }
    } catch(err) {
      setIsLiked(isLiked);
      setLikes((prev: number) => !isLiked ? prev - 1 : prev + 1);
    }
  };

  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold overflow-hidden shrink-0">
        {comment.author.avatar ? (
          <img src={comment.author.avatar} alt={comment.author.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          comment.author.initials
        )}
      </div>
      <div className="flex-1">
        <div className="bg-slate-50 rounded-2xl rounded-tl-none p-3 pb-3">
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-sm font-bold text-slate-900">{comment.author.name}</span>
            <span className="text-[10px] font-bold text-slate-400">{comment.time}</span>
          </div>
          <p className="text-sm text-slate-700">{comment.content}</p>
        </div>
        
        <div className="flex items-center gap-4 mt-2 px-2">
          <button 
            onClick={handleLike}
            className={`text-xs font-bold transition-all flex items-center gap-1 ${isLiked ? 'text-indigo-600' : 'text-slate-500 hover:text-indigo-600'}`}
          >
            {likes > 0 && <span>{likes}</span>}
            {isLiked ? 'Liked' : 'Like'}
          </button>
          <button 
            onClick={() => onReply(comment)}
            className="text-xs font-bold text-slate-500 hover:text-indigo-600 transition-all"
          >
            Reply
          </button>
        </div>

        {replies.length > 0 && (
          <div className="mt-3 space-y-3 pl-3 sm:pl-4 border-l-2 border-slate-100">
            {replies.map(reply => (
              <div key={reply.id} className="flex gap-2.5">
                <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px] font-bold overflow-hidden shrink-0">
                  {reply.author.avatar ? (
                    <img src={reply.author.avatar} alt={reply.author.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    reply.author.initials
                  )}
                </div>
                <div className="flex-1">
                  <div className="bg-slate-50 rounded-2xl rounded-tl-none p-2.5 pb-2.5">
                    <div className="flex items-baseline justify-between mb-0.5">
                      <span className="text-sm font-bold text-slate-900">{reply.author.name}</span>
                      <span className="text-[10px] font-bold text-slate-400">{reply.time}</span>
                    </div>
                    <p className="text-sm text-slate-700">{reply.content}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PostMenuContent({ post, user, onClose, onEditPost, onEditPrivacy, onEditCommentPrivacy }: any) {
  return (
    <div className="flex flex-col">
      {user?.uid === post.authorId ? (
        <>
          <button 
            onClick={() => {
              onClose();
              onEditPost(post);
            }}
            className="w-full text-left px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors border-b border-slate-100"
          >
            Edit Post
          </button>
          <button 
            onClick={async () => {
              onClose();
              try {
                await updateDoc(doc(db, 'communityPosts', post.id), {
                  isPinned: !post.isPinned
                });
                toast.success(post.isPinned ? 'Post unpinned' : 'Post pinned to top');
              } catch(e) {
                toast.error('Failed to pin post');
              }
            }}
            className="w-full text-left px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors border-b border-slate-100"
          >
            {post.isPinned ? 'Unpin Post' : 'Pin Post'}
          </button>
          <button 
            onClick={() => {
              onClose();
              onEditCommentPrivacy(post);
            }}
            className="w-full text-left px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors border-b border-slate-100"
          >
            Who can comment
          </button>
          <button 
            onClick={() => {
              onClose();
              onEditPrivacy(post);
            }}
            className="w-full text-left px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors border-b border-slate-100"
          >
            Edit Privacy
          </button>
          <button 
            onClick={async () => {
              onClose();
              try {
                await deleteDoc(doc(db, 'communityPosts', post.id));
                toast.success('Post deleted successfully');
              } catch (error) {
                toast.error('Failed to delete post');
              }
            }}
            className="w-full text-left px-4 py-3 text-sm font-bold text-rose-600 hover:bg-rose-50 transition-colors"
          >
            Delete Post
          </button>
        </>
      ) : (
        <>
          <button 
            onClick={async () => {
              onClose();
              try {
                const hiddenBy = post.hiddenBy || [];
                await updateDoc(doc(db, 'communityPosts', post.id), {
                  hiddenBy: [...hiddenBy, user?.uid]
                });
                toast.success('Post has been hidden from your feed');
              } catch(e) {
                toast.error('Failed to hide post');
              }
            }}
            className="w-full text-left px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors border-b border-slate-100"
          >
            Hide Post
          </button>
          <button 
            onClick={() => {
              onClose();
              toast.success(`Unfollowed ${post.author.name}`);
            }}
            className="w-full text-left px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors border-b border-slate-100"
          >
            Unfollow
          </button>
          <button 
            onClick={() => {
              onClose();
              toast.success('Post reported to moderators');
            }}
            className="w-full text-left px-4 py-3 text-sm font-bold text-rose-600 hover:bg-rose-50 transition-colors"
          >
            Report Post
          </button>
        </>
      )}
    </div>
  );
}
