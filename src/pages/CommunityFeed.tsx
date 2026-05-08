import React, { useState, useEffect, useRef } from 'react';
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
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, increment, getDoc, setDoc, deleteDoc, where, or } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useFirebase } from '../components/FirebaseProvider';
import Modal from '../components/Modal';
import { ShareModal } from '../components/ShareModal';
import { PostCard } from '../components/PostCard';
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
  X,
  MapPin,
  Video,
  Camera,
  Flag,
  Phone,
  Palette,
  ChevronDown,
  ChevronLeft,
  Globe,
  AtSign
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
    districtId?: string;
    branchId?: string;
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
  const [ministryChannels, setMinistryChannels] = useState<{id: string, name: string, membersCount: number}[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [friendIds, setFriendIds] = useState<string[]>([]);
  const [friendRequests, setFriendRequests] = useState<any[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [privacy, setPrivacy] = useState('public');
  const [commentPrivacy, setCommentPrivacy] = useState('global');
  const [showWidgets, setShowWidgets] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [activeSharePost, setActiveSharePost] = useState<Post | null>(null);
  const [activeMenuPostId, setActiveMenuPostId] = useState<string | null>(null);

  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  
  const [newPostImages, setNewPostImages] = useState<string[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showComposer, setShowComposer] = useState(false);
  const [showMoreActions, setShowMoreActions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const EMOJIS = ['😀', '😂', '😍', '🙏', '🙌', '🔥', '❤️', '🎉', '💡', '✨'];
  const [editingPostContent, setEditingPostContent] = useState('');
  const [privacyModalPost, setPrivacyModalPost] = useState<Post | null>(null);
  const [commentPrivacyModalPost, setCommentPrivacyModalPost] = useState<Post | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile } = useFirebase();

  useEffect(() => {
    // Check for post param
    const params = new URLSearchParams(location.search);
    const postIdStr = params.get('post');
    if (postIdStr && posts.length > 0) {
      setTimeout(() => {
        const el = document.getElementById(`post-${postIdStr}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('ring-4', 'ring-indigo-500', 'ring-offset-4', 'transition-all', 'duration-1000');
          setTimeout(() => el.classList.remove('ring-4', 'ring-indigo-500', 'ring-offset-4', 'transition-all', 'duration-1000'), 2000);
        }
      }, 500);
    }
  }, [location.search, posts.length]);

  useEffect(() => {
    if (!user || !profile) return;

    // 1. Listen for friendships (accepted and pending)
    const friendshipsQuery = query(
      collection(db, 'friendships'),
      or(
        where('user1Id', '==', user.uid),
        where('user2Id', '==', user.uid)
      )
    );
    
    // We can't filter by `or` and `orderBy` effectively with inequality, so we just fetch all for the user

    const unsubscribeFriendships = onSnapshot(friendshipsQuery, (snap) => {
      let pending: any[] = [];
      let friends: string[] = [];
      
      snap.forEach(doc => {
        const data = doc.data();
        if (data.status === 'accepted') {
          friends.push(data.user1Id === user.uid ? data.user2Id : data.user1Id);
        } else if (data.status === 'pending' && data.initiatorId !== user.uid) {
          pending.push({ id: doc.id, ...data });
        }
      });
      
      setFriendIds(friends);
      setFriendRequests(pending);
    });

    const q = query(
      collection(db, 'communityPosts'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribePosts = onSnapshot(q, async (snapshot) => {
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
              districtId: data.authorDistrictId,
              branchId: data.authorBranchId,
              initials: data.authorInitials || '?',
              avatar: data.authorAvatar
            },
            content: data.content,
            image: data.image,
            images: data.images || [],
            sharedPostId: data.sharedPostId || null,
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

    const unsubscribeMinistryChannels = onSnapshot(query(collection(db, 'ministryChannels'), orderBy('createdAt', 'desc')), (snap) => {
      setMinistryChannels(snap.docs.map(d => ({ id: d.id, name: d.data().name, membersCount: d.data().membersCount || 0 })).slice(0, 4));
    }, (error) => {
      // safe fallback
      console.warn("Could not load ministryChannels in widget", error);
    });

    return () => {
      unsubscribePosts();
      unsubscribeFriendships();
      unsubscribeMinistryChannels();
    };
  }, [user, profile]);

  // Determine visibility of posts based on friendIds and privacy settings
  const visiblePosts = posts.filter(post => {
    if (post.authorId === user?.uid) return true; // Always see my own posts
    
    switch (post.privacy) {
      case 'public':
        return true;
      case 'district':
        return post.author.districtId === profile?.districtId;
      case 'branch':
        return post.author.branchId === profile?.branchId;
      case 'friends':
        return friendIds.includes(post.authorId);
      case 'only_me':
        return false;
      default:
        return true;
    }
  }).filter(post => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return post.content.toLowerCase().includes(term) || 
           post.author.name.toLowerCase().includes(term) || 
           post.tags?.some(t => t.toLowerCase().includes(term));
  });

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

  const handleImageSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const currentImagesCount = newPostImages.length;
    if (currentImagesCount + files.length > 4) {
      toast.error('You can only upload up to 4 images per post.');
      return;
    }

    const processFile = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 1200;
            const MAX_HEIGHT = 1200;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width *= MAX_HEIGHT / height;
                height = MAX_HEIGHT;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            
            // compress aggressively to fit within 1MB total sizes combined
            const dataUrl = canvas.toDataURL('image/jpeg', 0.5);
            resolve(dataUrl);
          };
          img.onerror = reject;
          img.src = event.target?.result as string;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    };

    try {
      const newImages = await Promise.all(Array.from(files).map(processFile));
      setNewPostImages(prev => [...prev, ...newImages].slice(0, 4));
    } catch(err) {
      toast.error('Failed to process one or more images');
    }
    
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim() && newPostImages.length === 0) return;
    if (!user || !profile || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const initials = profile.fullName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || 'U';
      const extractedTags = newPostContent.match(/#\w+/g)?.map(t => t.substring(1).toLowerCase()) || [];
      
      await addDoc(collection(db, 'communityPosts'), {
        authorId: user.uid,
        authorName: profile.fullName,
        authorRole: profile.role || 'Member',
        authorDistrictId: profile.districtId || null,
        authorBranchId: profile.branchId || null,
        authorInitials: initials,
        authorAvatar: user.photoURL || null,
        content: newPostContent,
        image: newPostImages[0] || null,
        images: newPostImages,
        tags: extractedTags,
        likes: 0,
        commentsCount: 0,
        privacy,
        commentPrivacy,
        isPinned: false,
        hiddenBy: [],
        createdAt: serverTimestamp()
      });
      
      setNewPostContent('');
      setNewPostImages([]);
      setShowEmojiPicker(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      
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

  const handleAcceptFriendRequest = async (requestId: string) => {
    try {
      await updateDoc(doc(db, 'friendships', requestId), {
        status: 'accepted',
        updatedAt: serverTimestamp()
      });
      toast.success('Friend request accepted');
    } catch (error) {
       handleFirestoreError(error, OperationType.UPDATE, 'friendships');
    }
  };

  const handleRejectFriendRequest = async (requestId: string) => {
    try {
      await updateDoc(doc(db, 'friendships', requestId), {
        status: 'rejected',
        updatedAt: serverTimestamp()
      });
      toast.success('Friend request removed');
    } catch (error) {
       handleFirestoreError(error, OperationType.UPDATE, 'friendships');
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
        <div className="relative mb-6">
          <input 
            type="text" 
            placeholder="Search feed..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-2xl py-3 pl-12 pr-4 text-sm font-medium outline-none transition-all shadow-sm"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Main Feed */}
        <div className="space-y-6">
          {/* Create Post Entry */}
          <div className="flex gap-3 sm:gap-4 items-center mb-6">
            <button 
              onClick={() => navigate(`/community-profile/${user?.uid}`)}
              className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold overflow-hidden shrink-0 hover:ring-2 hover:ring-indigo-500 hover:ring-offset-2 transition-all cursor-pointer"
            >
              {user?.photoURL ? (
                <img src={user.photoURL} alt={profile?.fullName || ''} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                profile?.fullName ? profile.fullName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : 'ME'
              )}
            </button>
            <button 
              onClick={() => setShowComposer(true)}
              className="flex-1 bg-white border border-slate-200 shadow-sm hover:bg-slate-50 text-slate-500 text-left rounded-full px-4 py-3 text-sm font-medium transition-colors"
            >
              What's on your mind?
            </button>
          </div>

          {/* Feed Posts */}
          <div className="space-y-6">
            <AnimatePresence>
              {visiblePosts.map((post) => (
                <PostCard key={post.id} post={post} onLike={handleLike} />
              ))}
            </AnimatePresence>
            
            <Modal
              isOpen={!!activeCommentPostId}
              onClose={() => setActiveCommentPostId(null)}
              title="Comments"
            >
              {activeCommentPostId && <PostComments postId={activeCommentPostId} />}
            </Modal>

            {activeSharePost && (
              <ShareModal 
                isOpen={!!activeSharePost}
                onClose={() => setActiveSharePost(null)}
                post={activeSharePost}
              />
            )}
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
              {(() => {
                const tagCounts: Record<string, number> = {};
                posts.forEach(p => {
                  p.tags?.forEach(tag => {
                    tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                  });
                });
                const trendingTags = Object.entries(tagCounts)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 5);
                
                if (trendingTags.length === 0) {
                  return <p className="text-xs font-medium text-slate-500">No trending topics yet</p>;
                }
                return trendingTags.map(([label, count]) => (
                  <div key={label} className="group cursor-pointer" onClick={() => setSearchTerm(label)}>
                    <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">#{label}</p>
                    <p className="text-[10px] text-slate-400 font-medium">{count} posts</p>
                  </div>
                ));
              })()}
            </div>
          </div>

          {/* Friend Requests / Connections */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-6">
              <UserPlus className="text-emerald-500" size={18} />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                {friendRequests.length > 0 ? 'Friend Requests' : 'Suggested Connections'}
              </h3>
            </div>
            <div className="space-y-4">
              {friendRequests.length > 0 ? (
                 friendRequests.map(req => (
                   <FriendRequestItem 
                     key={req.id} 
                     request={req} 
                     onAccept={() => handleAcceptFriendRequest(req.id)}
                     onReject={() => handleRejectFriendRequest(req.id)}
                   />
                 ))
              ) : (
                [
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
                    <button onClick={() => navigate('/directory')} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                      <UserPlus size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
            {friendRequests.length === 0 && (
              <button onClick={() => navigate('/directory')} className="w-full mt-6 py-2 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-all">
                Find Friends in Directory
              </button>
            )}
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
              {ministryChannels.length > 0 ? ministryChannels.map(channel => (
                <div 
                  key={channel.id} 
                  onClick={() => navigate(`/ministry-channels?channel=${channel.id}`)}
                  className="flex items-center justify-between group cursor-pointer p-2 hover:bg-slate-50 rounded-xl transition-all"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-medium group-hover:text-indigo-600">#</span>
                    <span className="text-xs font-bold text-slate-600 group-hover:text-slate-900">{channel.name}</span>
                  </div>
                  {channel.membersCount > 0 && (
                    <span className="bg-indigo-100 text-indigo-600 text-[10px] font-black px-1.5 py-0.5 rounded-full">
                      {channel.membersCount}
                    </span>
                  )}
                </div>
              )) : (
                <p className="text-xs text-slate-500 font-medium pb-2">No channels yet.</p>
              )}
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

      <AnimatePresence>
        {showComposer && (
          <div className="fixed inset-0 z-[100] flex flex-col bg-white sm:bg-slate-900/40 sm:p-4 sm:backdrop-blur-sm sm:items-center sm:justify-center">
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full h-full sm:h-auto sm:max-w-xl sm:rounded-2xl bg-white shadow-2xl flex flex-col overflow-hidden relative sm:max-h-[85vh] sm:min-h-[600px]"
            >
              {/* Header */}
              <div className="flex justify-between items-center px-4 py-3 border-b border-slate-100 shrink-0">
                <button onClick={() => setShowComposer(false)} className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors sm:hidden">
                  <ChevronLeft size={24} />
                </button>
                <button onClick={() => setShowComposer(false)} className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors hidden sm:block">
                  <X size={24} />
                </button>
                <span className="text-sm font-semibold text-slate-900 absolute left-1/2 -translate-x-1/2">Create post</span>
                <button 
                  onClick={(e) => {
                    handlePostSubmit(e as any);
                    if ((newPostContent.trim() || newPostImages.length > 0) && !isSubmitting) {
                      setShowComposer(false);
                    }
                  }}
                  disabled={(!newPostContent.trim() && newPostImages.length === 0) || isSubmitting}
                  className="px-4 py-1.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg disabled:opacity-50 disabled:bg-slate-200 disabled:text-slate-500 hover:bg-indigo-700 transition-colors"
                >
                  {isSubmitting ? 'Posting...' : 'Post'}
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto w-full flex flex-col relative pb-safe">
                {/* User Info & Privacy */}
                <div className="px-4 py-3 flex gap-3 pb-0 shrink-0">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden shrink-0 shadow-sm border border-slate-200 object-cover">
                    {user?.photoURL ? (
                      <img src={user.photoURL} alt={profile?.fullName || ''} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      profile?.fullName ? profile.fullName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : 'ME'
                    )}
                  </div>
                  <div>
                    <span className="block text-sm font-bold text-slate-900">{profile?.fullName || 'User'}</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <div className="relative">
                        <select 
                          value={privacy}
                          onChange={(e) => setPrivacy(e.target.value)}
                          className="pl-6 pr-6 py-1 bg-indigo-50 text-indigo-700 rounded-md text-[11px] font-bold appearance-none border-none focus:ring-0 cursor-pointer"
                        >
                          <option value="public">Public</option>
                          <option value="district">District</option>
                          <option value="branch">Branch</option>
                          <option value="friends">Friends Only</option>
                          <option value="only_me">Only Me</option>
                        </select>
                        <Globe size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-indigo-700 pointer-events-none" />
                        <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-indigo-700 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Text Area */}
                <div className="px-4 pt-4 flex-1 flex flex-col min-h-0">
                  <textarea 
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    placeholder="What's on your mind?"
                    className="flex-1 w-full border-none focus:ring-0 text-slate-800 bg-transparent p-0 text-xl md:text-2xl font-medium placeholder:text-slate-400 resize-none min-h-[120px]"
                  />
                  {newPostImages.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto pb-4 mb-2 scrollbar-hide">
                      {newPostImages.map((img, idx) => (
                        <div key={idx} className="relative shrink-0 border border-slate-200 rounded-xl overflow-hidden shadow-sm w-[200px] h-[200px]">
                          <img src={img} alt="Preview" className="w-full h-full object-cover" />
                          <button 
                            onClick={() => setNewPostImages(prev => prev.filter((_, i) => i !== idx))}
                            className="absolute top-2 right-2 p-1.5 bg-slate-900/50 text-white hover:bg-rose-500 rounded-full transition-colors backdrop-blur-md"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Attachments list taking up bottom area */}
                <div className="mt-auto border-t border-slate-100 bg-white shrink-0">
                  <input type="file" ref={fileInputRef} hidden accept="image/*" multiple onChange={handleImageSelected} />
                  
                  {!showMoreActions ? (
                    <div className="flex items-center justify-between px-4 py-3 border border-slate-200 rounded-xl m-4 shadow-sm">
                      <span className="text-sm font-semibold text-slate-700">Add to your post</span>
                      <div className="flex items-center gap-1 sm:gap-2">
                        <button onClick={() => fileInputRef.current?.click()} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-emerald-500 hover:text-emerald-600">
                          <ImageIcon size={24} />
                        </button>
                        <button onClick={() => setNewPostContent(prev => prev + '@')} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-blue-500 hover:text-blue-600 hidden sm:block">
                          <AtSign size={24} />
                        </button>
                        <button onClick={() => setNewPostContent(prev => prev + '#')} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-indigo-500 hover:text-indigo-600 hidden sm:block">
                          <Hash size={24} />
                        </button>
                        <button className="p-2 hover:bg-slate-100 rounded-full transition-colors text-blue-500 hover:text-blue-600 hidden sm:block">
                          <UserPlus size={24} />
                        </button>
                        <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-amber-500 hover:text-amber-600 hidden sm:block">
                          <Smile size={24} />
                        </button>
                        <button onClick={() => setShowMoreActions(true)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500 hover:text-slate-600">
                          <MoreHorizontal size={24} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100 sticky top-0 bg-white z-10 shadow-sm">
                        <span className="text-sm font-semibold text-slate-700">Add to your post</span>
                        <button onClick={() => setShowMoreActions(false)} className="p-1 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
                           <ChevronDown size={20} />
                        </button>
                      </div>
                      <div className="divide-y divide-slate-50 overflow-y-auto max-h-[40vh] sm:max-h-none">
                        <button onClick={() => { fileInputRef.current?.click(); setShowMoreActions(false); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                            <ImageIcon className="text-emerald-500 shrink-0" size={24} />
                            <span className="text-sm font-semibold text-slate-700">Photo/video</span>
                        </button>
                        <button onClick={() => { setNewPostContent(prev => prev + '@'); setShowMoreActions(false); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                            <AtSign className="text-blue-500 shrink-0" size={24} />
                            <span className="text-sm font-semibold text-slate-700">Mention people</span>
                        </button>
                        <button onClick={() => { setNewPostContent(prev => prev + '#'); setShowMoreActions(false); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                            <Hash className="text-indigo-500 shrink-0" size={24} />
                            <span className="text-sm font-semibold text-slate-700">Hashtag</span>
                        </button>
                        <button onClick={() => setShowMoreActions(false)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                            <UserPlus className="text-blue-500 shrink-0" size={24} />
                            <span className="text-sm font-semibold text-slate-700">Tag people</span>
                        </button>
                        <button onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowMoreActions(false); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors relative">
                            <Smile className="text-amber-500 shrink-0" size={24} />
                            <span className="text-sm font-semibold text-slate-700">Feeling/activity</span>
                        </button>
                        <button onClick={() => setShowMoreActions(false)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                            <MapPin className="text-rose-500 shrink-0" size={24} />
                            <span className="text-sm font-semibold text-slate-700">Check in</span>
                        </button>
                        <button onClick={() => setShowMoreActions(false)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                            <Video className="text-rose-500 shrink-0" size={24} />
                            <span className="text-sm font-semibold text-slate-700">Live video</span>
                        </button>
                        <button onClick={() => setShowMoreActions(false)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                            <Palette className="text-emerald-400 shrink-0" size={24} />
                            <span className="text-sm font-semibold text-slate-700">Background color</span>
                        </button>
                        <button onClick={() => setShowMoreActions(false)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                            <Camera className="text-blue-500 shrink-0" size={24} />
                            <span className="text-sm font-semibold text-slate-700">Camera</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Emoji Picker absolute overlay */}
              <AnimatePresence>
                {showEmojiPicker && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 grid grid-cols-5 gap-2 z-[110] w-[300px]"
                  >
                    {EMOJIS.map(emoji => (
                      <button 
                        key={emoji}
                        onClick={() => {
                          setNewPostContent(prev => prev + emoji);
                          setShowEmojiPicker(false);
                        }}
                        className="w-12 h-12 flex items-center justify-center text-3xl hover:bg-slate-50 rounded-lg transition-all"
                      >
                        {emoji}
                      </button>
                    ))}
                    <button 
                      onClick={() => setShowEmojiPicker(false)}
                      className="col-span-5 w-full mt-2 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 bg-slate-50 rounded-xl transition-all"
                    >
                      Close
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
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
            authorId: data.authorId,
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

function FriendRequestItem({ request, onAccept, onReject }: { request: any, onAccept: () => void, onReject: () => void }) {
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    getDoc(doc(db, 'users', request.initiatorId)).then(snap => {
      if (snap.exists()) setUserData(snap.data());
    });
  }, [request.initiatorId]);

  if (!userData) return null;

  return (
    <div className="flex justify-between items-center group">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 text-[10px] font-bold overflow-hidden">
          {userData.photoUrl ? (
            <img src={userData.photoUrl} alt={userData.fullName} className="w-full h-full object-cover" />
          ) : (
            userData.fullName.substring(0, 2).toUpperCase()
          )}
        </div>
        <div>
          <p className="text-xs font-bold text-slate-900 line-clamp-1">{userData.fullName}</p>
          <p className="text-[10px] text-slate-400 font-medium">{userData.role || 'Member'}</p>
        </div>
      </div>
      <div className="flex gap-1">
        <button onClick={onAccept} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all" title="Accept">
          <UserPlus size={16} />
        </button>
        <button onClick={onReject} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-all" title="Reject">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

function CommentItem({ postId, comment, user, onReply }: any) {
  const navigate = useNavigate();
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
          authorId: data.authorId,
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
      <button 
        onClick={() => navigate(`/community-profile/${comment.authorId}`)}
        className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold overflow-hidden shrink-0 hover:ring-2 hover:ring-indigo-600 transition-all cursor-pointer"
      >
        {comment.author.avatar ? (
          <img src={comment.author.avatar} alt={comment.author.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          comment.author.initials
        )}
      </button>
      <div className="flex-1">
        <div className="bg-slate-50 rounded-2xl rounded-tl-none p-3 pb-3">
          <div className="flex items-baseline justify-between mb-1">
            <button 
              onClick={() => navigate(`/community-profile/${comment.authorId}`)}
              className="text-sm font-bold text-slate-900 hover:text-indigo-600 transition-colors"
            >
              {comment.author.name}
            </button>
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
                <button 
                  onClick={() => navigate(`/community-profile/${reply.authorId}`)}
                  className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px] font-bold overflow-hidden shrink-0 hover:ring-2 hover:ring-indigo-600 transition-all cursor-pointer"
                >
                  {reply.author.avatar ? (
                    <img src={reply.author.avatar} alt={reply.author.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    reply.author.initials
                  )}
                </button>
                <div className="flex-1">
                  <div className="bg-slate-50 rounded-2xl rounded-tl-none p-2.5 pb-2.5">
                    <div className="flex items-baseline justify-between mb-0.5">
                      <button 
                        onClick={() => navigate(`/community-profile/${reply.authorId}`)}
                        className="text-sm font-bold text-slate-900 hover:text-indigo-600 transition-colors"
                      >
                        {reply.author.name}
                      </button>
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
