import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, deleteDoc, collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, increment, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useFirebase } from '../components/FirebaseProvider';
import Modal from '../components/Modal';
import { ShareModal } from '../components/ShareModal';
import { Heart, MessageCircle, Share2, MoreHorizontal, Image as ImageIcon, Smile, Send, X } from 'lucide-react';
import { toast } from 'sonner';

export interface Post {
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
  images?: string[];
  sharedPostId?: string;
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

export function SharedPostEmbed({ sharedPostId }: { sharedPostId: string }) {
  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let unsubscribe: () => void;
    
    try {
      const docRef = doc(db, 'communityPosts', sharedPostId);
      unsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
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

          setPost({
             id: docSnap.id,
             authorId: data.authorId,
             author: { 
               name: data.authorName || 'Unknown', 
               role: data.authorRole || 'Member', 
               initials: data.authorInitials || '?',
               avatar: data.authorAvatar
             },
             content: data.content,
             image: data.image,
             images: data.images || [],
             sharedPostId: data.sharedPostId || null,
             likes: data.likes || 0,
             commentsCount: data.commentsCount || 0,
             time: timeString
          });
        }
        setIsLoading(false);
      }, (error) => {
        setIsLoading(false);
        console.error("Error fetching shared post", error);
      });
    } catch (e) {
      setIsLoading(false);
    }
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [sharedPostId]);

  if (isLoading) {
    return <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 animate-pulse h-32"></div>;
  }

  if (!post) {
    return (
      <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 text-slate-500 text-sm font-medium">
        This post has been deleted or is unavailable.
      </div>
    );
  }

  return (
    <div 
      onClick={(e) => { e.stopPropagation(); navigate(`/community-feed?post=${post.id}`); }}
      className="mt-3 p-4 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 transition-colors cursor-pointer"
    >
      <div className="flex gap-3 items-start mb-3">
        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold overflow-hidden shrink-0">
          {post.author.avatar ? (
             <img src={post.author.avatar} alt={post.author.name} className="w-full h-full object-cover" />
          ) : (
             post.author.initials
          )}
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900">{post.author.name}</p>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{post.time}</p>
        </div>
      </div>
      <p className="text-slate-700 text-sm leading-relaxed max-w-full break-words whitespace-pre-wrap line-clamp-4">
        {post.content}
      </p>
      {post.images && post.images.length > 0 ? (
        <div className="mt-3 flex gap-2 overflow-x-auto snap-x snap-mandatory scrollbar-hide">
          {post.images.map((img, idx) => (
            <div key={idx} className="shrink-0 w-full snap-center rounded-lg overflow-hidden border border-slate-100 max-h-48 relative flex items-center justify-center bg-black">
              <img src={img} alt="Shared post content" className="w-full h-full object-contain" />
            </div>
          ))}
        </div>
      ) : post.image ? (
        <div className="mt-3 rounded-lg overflow-hidden border border-slate-100 max-h-48 relative flex items-center justify-center bg-black">
          <img src={post.image} alt="Shared post content" className="w-full h-full object-contain" />
        </div>
      ) : null}
    </div>
  );
}

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

export function PostCard({ post, onLike }: { post: Post, onLike?: (postId: string) => void }) {
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const { user } = useFirebase();
  const [activeMenu, setActiveMenu] = useState(false);
  const [activeComments, setActiveComments] = useState(false);
  const [likes, setLikes] = useState(post.likes);
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  useEffect(() => {
    setLikes(post.likes);
    setIsLiked(post.isLiked || false);
  }, [post.likes, post.isLiked]);

  const handleLikeLocal = async () => {
    if (onLike) {
      onLike(post.id);
      return;
    }
    if (!user) return;
    const isCurrentlyLiked = isLiked;
    setIsLiked(!isCurrentlyLiked);
    setLikes(prev => isCurrentlyLiked ? prev - 1 : prev + 1);

    try {
      const likeRef = doc(db, 'communityPosts', post.id, 'likes', user.uid);
      const postRef = doc(db, 'communityPosts', post.id);
      if (isCurrentlyLiked) {
        await deleteDoc(likeRef);
        await updateDoc(postRef, { likes: increment(-1) });
      } else {
        await setDoc(likeRef, { createdAt: serverTimestamp() });
        await updateDoc(postRef, { likes: increment(1) });
      }
    } catch (error) {
      setIsLiked(isCurrentlyLiked);
      setLikes(prev => isCurrentlyLiked ? prev + 1 : prev - 1);
      toast.error('Failed to update like');
    }
  };

  return (
    <motion.article 
      id={`post-${post.id}`}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
    >
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex gap-3 items-center">
            <button 
              onClick={() => navigate(`/profile/${post.authorId}`)}
              className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold overflow-hidden shrink-0 hover:ring-2 hover:ring-indigo-600 hover:ring-offset-2 transition-all cursor-pointer"
            >
              {post.author.avatar ? (
                <img src={post.author.avatar} alt={post.author.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                post.author.initials
              )}
            </button>
            <div>
              <button 
                onClick={() => navigate(`/profile/${post.authorId}`)}
                className="text-sm font-bold text-slate-900 hover:text-indigo-600 transition-colors text-left"
              >
                {post.author.name}
              </button>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{post.author.role} • {post.time}</p>
            </div>
          </div>
          <div className="relative">
            <button 
              onClick={() => setActiveMenu(!activeMenu)}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg transition-all"
            >
              <MoreHorizontal size={20} />
            </button>

            <AnimatePresence>
              {activeMenu && !isMobile && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden z-20"
                >
                  <PostMenuContent 
                    post={post} 
                    user={user} 
                    onClose={() => setActiveMenu(false)} 
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <Modal isOpen={activeMenu && isMobile} onClose={() => setActiveMenu(false)} title="Post Options">
          <div className="-mx-6 -mt-2 -mb-6 pb-2">
            <PostMenuContent 
              post={post} 
              user={user} 
              onClose={() => setActiveMenu(false)} 
            />
          </div>
        </Modal>

        <p className="text-slate-700 text-sm leading-relaxed mb-4 break-words whitespace-pre-wrap">
          {post.content}
        </p>

        {post.images && post.images.length > 0 ? (
          <div className="mb-4 flex gap-2 overflow-x-auto snap-x snap-mandatory scrollbar-hide">
            {post.images.map((img, idx) => (
              <div key={idx} className="shrink-0 w-full sm:w-[85%] snap-center rounded-xl border border-slate-100 overflow-hidden max-h-[600px] flex items-center justify-center bg-black">
                <img src={img} alt="Post content" className="w-full h-full object-contain" />
              </div>
            ))}
          </div>
        ) : post.image ? (
          <div className="mb-4 rounded-xl overflow-hidden border border-slate-100 max-h-[600px] flex items-center justify-center bg-black">
            <img src={post.image} alt="Post content" className="w-full h-full object-contain" />
          </div>
        ) : null}

        {post.sharedPostId && (
          <div className="mb-4">
            <SharedPostEmbed sharedPostId={post.sharedPostId} />
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
            onClick={handleLikeLocal}
            className={`flex items-center gap-2 text-xs font-bold transition-all ${isLiked ? 'text-rose-500' : 'text-slate-500 hover:text-rose-500'}`}
          >
            <Heart size={18} fill={isLiked ? "currentColor" : "none"} />
            {likes}
          </button>
          <button 
            onClick={() => setActiveComments(true)}
            className={`flex items-center gap-2 text-xs font-bold transition-all text-slate-500 hover:text-indigo-600`}
          >
            <MessageCircle size={18} />
            {post.commentsCount}
          </button>
          <button 
            onClick={() => setIsShareModalOpen(true)}
            className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-all ml-auto"
          >
            <Share2 size={18} />
            Share
          </button>
        </div>
      </div>
      
      <Modal
        isOpen={activeComments}
        onClose={() => setActiveComments(false)}
        title="Comments"
      >
        <PostComments postId={post.id} />
      </Modal>

      <ShareModal 
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        post={post}
      />
    </motion.article>
  );
}

function PostMenuContent({ post, user, onClose, onEditPost, onEditPrivacy, onEditCommentPrivacy }: any) {
  return (
    <div className="flex flex-col">
      {user?.uid === post.authorId ? (
        <>
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
      } catch (error) {}
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
        await updateDoc(commentRef, { repliesCount: increment(1) });
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

        await updateDoc(postRef, { commentsCount: increment(1) });
      }
      setNewComment('');
      setReplyTo(null);
    } catch (error) {
      toast.error('Failed to post comment');
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
        onClick={() => navigate(`/profile/${comment.authorId}`)}
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
              onClick={() => navigate(`/profile/${comment.authorId}`)}
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
                  onClick={() => navigate(`/profile/${reply.authorId}`)}
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
                        onClick={() => navigate(`/profile/${reply.authorId}`)}
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
