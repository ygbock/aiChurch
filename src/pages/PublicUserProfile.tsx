import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  UserPlus, 
  MessageCircle, 
  MapPin, 
  Briefcase, 
  Heart,
  Users,
  Check,
  Building,
  User,
  Share2,
  Grid,
  List
} from 'lucide-react';
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp, setDoc, or } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useFirebase } from '../components/FirebaseProvider';
import { toast } from 'sonner';
import { PostCard } from '../components/PostCard';
import { ImageViewer } from '../components/ImageViewer';

export default function PublicUserProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, profile: currentProfile } = useFirebase();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [friendshipStatus, setFriendshipStatus] = useState<'none' | 'pending' | 'friends'>('none');
  const [districtName, setDistrictName] = useState<string>('');
  const [branchName, setBranchName] = useState<string>('');
  const [recentPosts, setRecentPosts] = useState<any[]>([]);
  const [friendsList, setFriendsList] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'posts' | 'pictures' | 'friends'>('posts');

  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const allImages = React.useMemo(() => {
    return recentPosts.flatMap(post => post.images && post.images.length > 0 ? post.images : (post.image ? [post.image] : []));
  }, [recentPosts]);

  useEffect(() => {
    if (!userId) return;

    const fetchProfile = async () => {
      try {
        const docRef = doc(db, 'users', userId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProfile({ id: docSnap.id, ...data });

          // Fetch district name
          if (data.districtId) {
            try {
              const dSnap = await getDoc(doc(db, 'districts', data.districtId));
              if (dSnap.exists()) setDistrictName(dSnap.data().name || data.districtId);
            } catch (e) { console.error(e); }
            
            // Fetch branch name
            if (data.branchId) {
              try {
                const bSnap = await getDoc(doc(db, 'districts', data.districtId, 'branches', data.branchId));
                if (bSnap.exists()) setBranchName(bSnap.data().name || data.branchId);
              } catch (e) { console.error(e); }
            }
          }
          
          // Fetch recent posts
          try {
            const { orderBy } = await import('firebase/firestore');
            const postsQ = query(
              collection(db, 'communityPosts'),
              where('authorId', '==', userId),
              orderBy('createdAt', 'desc')
            );
            const postsSnap = await getDocs(postsQ);
            
            const fetchedPosts = postsSnap.docs.map(doc => {
              const data = doc.data();
              let createdAt: Date;
              if (data.createdAt && typeof data.createdAt.toDate === 'function') {
                createdAt = data.createdAt.toDate();
              } else if (data.createdAt && (typeof data.createdAt === 'string' || typeof data.createdAt === 'number')) {
                createdAt = new Date(data.createdAt);
              } else {
                createdAt = new Date();
              }
              if (isNaN(createdAt.getTime())) createdAt = new Date();
              
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
                image: data.image || data.imageUrl,
                images: data.images || [],
                sharedPostId: data.sharedPostId || null,
                likes: data.likes || data.likesCount || 0,
                commentsCount: data.commentsCount || 0,
                time: timeString,
                tags: data.tags,
                privacy: data.privacy || 'public',
                commentPrivacy: data.commentPrivacy || 'global',
                isPinned: data.isPinned || false,
                hiddenBy: data.hiddenBy || [],
                isLiked: false, 
              };
            });
            
            if (currentUser) {
              for (const post of fetchedPosts) {
                const likeDocRef = doc(db, 'communityPosts', post.id, 'likes', currentUser.uid);
                const likeDoc = await getDoc(likeDocRef);
                if (likeDoc.exists()) {
                  post.isLiked = true;
                }
              }
            }
            
            setRecentPosts(fetchedPosts);
          } catch (e) { console.error(e); }

          // Fetch friends list
          try {
            const friendsQ1 = query(
               collection(db, 'friendships'),
               where('user1Id', '==', userId),
               where('status', '==', 'accepted')
            );
            const friendsQ2 = query(
               collection(db, 'friendships'),
               where('user2Id', '==', userId),
               where('status', '==', 'accepted')
            );
            
            const [snap1, snap2] = await Promise.all([getDocs(friendsQ1), getDocs(friendsQ2)]);
            const friendIds = [
               ...snap1.docs.map(d => d.data().user2Id),
               ...snap2.docs.map(d => d.data().user1Id)
            ];

            if (friendIds.length > 0) {
               const friendDocs = await Promise.all(
                  friendIds.map(id => getDoc(doc(db, 'users', id)))
               );
               const loadedFriends = friendDocs
                  .filter(d => d.exists())
                  .map(d => ({ id: d.id, ...d.data() }));
               setFriendsList(loadedFriends);
            }
          } catch(e) { console.error("Error fetching friends:", e); }

        } else {
          toast.error("User not found");
          navigate('/community-feed');
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'users');
        navigate('/community-feed');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId, navigate]);

  useEffect(() => {
    if (!userId || !currentUser) return;

    const checkFriendship = async () => {
      try {
        // Query friendships to see if currentUser and userId are friends
        const friendQuery = query(
          collection(db, 'friendships'),
          or(
            where('user1Id', '==', currentUser.uid),
            where('user2Id', '==', currentUser.uid)
          )
        );
        const snap = await getDocs(friendQuery);
        let found = false;
        snap.forEach(d => {
          const data = d.data();
          if ((data.user1Id === currentUser.uid && data.user2Id === userId) || 
              (data.user2Id === currentUser.uid && data.user1Id === userId)) {
                
            found = true;
            if (data.status === 'accepted') {
              setFriendshipStatus('friends');
            } else if (data.status === 'pending') {
              setFriendshipStatus('pending');
            }
          }
        });
        if (!found) setFriendshipStatus('none');
      } catch (error) {
        console.error("Error checking friendship:", error);
      }
    };

    checkFriendship();
  }, [userId, currentUser]);

  const handleCreateChat = async () => {
    if (!currentUser || !userId) return;
    try {
      // Check if chat exists
      const chatQ = query(
        collection(db, 'directMessageChats'), 
        where('participants', 'array-contains', currentUser.uid)
      );
      const chatSnap = await getDocs(chatQ);
      let existingChatId = null;
      
      chatSnap.forEach((doc) => {
        const data = doc.data();
        if (data.participants.includes(userId) && data.participants.length === 2 && !data.isGroup) {
          existingChatId = doc.id;
        }
      });

      if (existingChatId) {
        navigate(`/direct-messages/${existingChatId}`);
      } else {
        const newChatRerf = await addDoc(collection(db, 'directMessageChats'), {
          participants: [currentUser.uid, userId],
          lastMessage: '',
          lastMessageTime: serverTimestamp(),
          isGroup: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        navigate(`/direct-messages/${newChatRerf.id}`);
      }
    } catch(err) {
      handleFirestoreError(err, OperationType.CREATE, 'directMessageChats');
    }
  };

  const handleAddFriend = async () => {
    if (!currentUser || !userId) return;
    try {
      await addDoc(collection(db, 'friendships'), {
        user1Id: currentUser.uid,
        user2Id: userId,
        initiatorId: currentUser.uid,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setFriendshipStatus('pending');
      toast.success("Friend request sent!");
    } catch(err: any) {
      console.error("Error creating friendship:", err);
      if (err?.message?.includes("Missing or insufficient permissions")) {
         toast.error("Permission denied creating friendship.");
      } else {
         toast.error('Failed to send request: ' + err?.message);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!profile) return null;

  const avatarUrl = profile.photoUrl || profile.photoURL || (currentUser?.uid === userId ? currentUser?.photoURL : null);

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-y-auto">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-8 py-4 sm:py-6 sticky top-0 z-10">
        <div className="flex items-center gap-4 max-w-5xl mx-auto">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{profile.fullName}</h1>
            <p className="text-sm text-slate-500 font-medium hidden sm:block">Community Profile</p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto w-full p-4 sm:p-8 space-y-6 sm:space-y-8">
        
        {/* Profile Card */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Cover Photo Area - Colored Gradient for now */}
          <div className="h-32 sm:h-48 bg-gradient-to-r from-indigo-500 to-indigo-600 w-full" />
          
          <div className="px-6 sm:px-8 pb-8 relative">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 sm:gap-4 -mt-12 sm:-mt-16 mb-4">
               {/* Avatar */}
               <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl bg-white border-4 border-white shadow-xl flex items-center justify-center overflow-hidden z-10">
                 {avatarUrl ? (
                   <img src={avatarUrl} alt={profile.fullName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                 ) : (
                   <span className="text-3xl font-bold text-indigo-200">
                     {profile.fullName?.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || '?'}
                   </span>
                 )}
               </div>

               {/* Action Buttons */}
               <div className="flex gap-3 mt-4 sm:mt-0 flex-wrap justify-end">
                  {currentUser?.uid === userId && (
                    <button 
                      onClick={() => {
                         navigator.clipboard.writeText(window.location.href);
                         toast.success('Profile link copied to clipboard');
                      }}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors shadow-sm"
                    >
                      <Share2 size={18} />
                      Share
                    </button>
                  )}

                  {currentUser?.uid !== userId && (
                    <>
                       {friendshipStatus === 'none' && (
                         <button 
                           onClick={handleAddFriend}
                           className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors shadow-sm"
                         >
                           <UserPlus size={18} />
                           Add Friend
                         </button>
                       )}
                       {friendshipStatus === 'pending' && (
                         <button 
                           disabled
                           className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm"
                         >
                           <Check size={18} />
                           Request Sent
                         </button>
                       )}
                       {friendshipStatus === 'friends' && (
                         <button 
                           className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-50 text-indigo-700 rounded-xl font-bold text-sm"
                         >
                           <Users size={18} />
                           Friends
                         </button>
                       )}
                       <button 
                         onClick={handleCreateChat}
                         className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors shadow-sm"
                       >
                         <MessageCircle size={18} />
                         Message
                       </button>
                    </>
                  )}
               </div>
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-black text-slate-900">{profile.fullName}</h2>
              {profile.role && (
                <p className="text-indigo-600 font-bold capitalize">{profile.role}</p>
              )}
            </div>

            <div className="flex flex-wrap gap-4 mt-6">
               <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                 <Building size={18} className="text-slate-400" />
                 District: {districtName || profile.districtId || 'Unspecified'}
               </div>
               <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                 <MapPin size={18} className="text-slate-400" />
                 Branch: {branchName || profile.branchId || 'Unspecified'}
               </div>
               <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                 <Heart size={18} className="text-slate-400" />
                 Status: {profile.maritalStatus || 'Unspecified'}
               </div>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
           {/* About Card */}
           <div className="md:col-span-1 space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">About</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                       <Briefcase size={20} />
                     </div>
                     <div>
                       <p className="text-xs text-slate-500 font-bold mb-0.5">Department</p>
                       <p className="text-sm text-slate-900 font-semibold">{profile.department || 'Not specified'}</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                       <User size={20} />
                     </div>
                     <div>
                       <p className="text-xs text-slate-500 font-bold mb-0.5">Position / Role</p>
                       <p className="text-sm text-slate-900 font-semibold">{profile.position || profile.role || 'Member'}</p>
                     </div>
                  </div>
                </div>
              </div>
           </div>

           <div className="md:col-span-2 space-y-6">
              {/* Tabs */}
              <div className="flex border-b border-slate-200 overflow-x-auto hide-scrollbar">
                <button 
                  onClick={() => setActiveTab('posts')}
                  className={`flex-1 py-4 px-4 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors whitespace-nowrap min-w-fit ${activeTab === 'posts' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
                >
                  <List size={20} />
                  Posts
                </button>
                <button 
                  onClick={() => setActiveTab('pictures')}
                  className={`flex-1 py-4 px-4 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors whitespace-nowrap min-w-fit ${activeTab === 'pictures' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
                >
                  <Grid size={20} />
                  Pictures
                </button>
                <button 
                  onClick={() => setActiveTab('friends')}
                  className={`flex-1 py-4 px-4 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors whitespace-nowrap min-w-fit ${activeTab === 'friends' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
                >
                  <Users size={20} />
                  Friends
                </button>
              </div>

              {activeTab === 'posts' && (
                <div className="space-y-6">
                  {recentPosts.length > 0 ? (
                    recentPosts.map((post) => (
                      <PostCard key={post.id} post={post} />
                    ))
                  ) : (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
                       <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 mx-auto mb-4">
                          <MessageCircle size={28} />
                       </div>
                       <h3 className="text-lg font-bold text-slate-900 mb-2">No Recent Activity</h3>
                       <p className="text-slate-500 max-w-sm mx-auto">
                          {profile.fullName} hasn't posted anything in the community feed recently.
                       </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'pictures' && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                   {allImages.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                         {allImages.map((img, idx) => (
                           <div key={`pic-${idx}`} className="aspect-square rounded-xl overflow-hidden shadow-sm border border-slate-100 bg-slate-50 group relative cursor-pointer" onClick={() => { setViewerIndex(idx); setViewerOpen(true); }}>
                              <img src={img} alt="Post image" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                           </div>
                         ))}
                      </div>
                   ) : (
                      <div className="text-center py-8">
                         <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 mx-auto mb-4">
                            <Grid size={28} />
                         </div>
                         <h3 className="text-lg font-bold text-slate-900 mb-2">No Pictures</h3>
                         <p className="text-slate-500 max-w-sm mx-auto">
                            {profile.fullName} hasn't shared any pictures yet.
                         </p>
                      </div>
                   )}
                </div>
              )}

              {activeTab === 'friends' && (
                 <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
                    {friendsList.length > 0 ? (
                       <div className="divide-y divide-slate-100">
                          {friendsList.map(friend => (
                             <div 
                               key={friend.id} 
                               className="p-4 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors"
                               onClick={() => navigate(`/community-profile/${friend.id}`)}
                             >
                                <div className="flex items-center gap-4">
                                   <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 shrink-0">
                                      {friend.photoUrl || friend.photoURL ? (
                                         <img src={friend.photoUrl || friend.photoURL} alt={friend.fullName} className="w-full h-full object-cover" />
                                      ) : (
                                         <div className="w-full h-full flex items-center justify-center text-slate-600 font-bold bg-indigo-100">
                                            {friend.fullName?.substring(0, 2).toUpperCase() || '?'}
                                         </div>
                                      )}
                                   </div>
                                   <div>
                                      <p className="font-bold text-slate-900">{friend.fullName}</p>
                                   </div>
                                </div>
                                <div className="shrink-0">
                                   <button 
                                     onClick={(e) => { e.stopPropagation(); navigate(`/direct-messages?to=${friend.id}`); }} 
                                     className="p-2.5 rounded-full bg-slate-50 border border-slate-200 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-colors"
                                     title="Send Message"
                                   >
                                      <MessageCircle size={20} />
                                   </button>
                                </div>
                             </div>
                          ))}
                       </div>
                    ) : (
                      <div className="text-center py-8">
                         <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 mx-auto mb-4">
                            <Users size={28} />
                         </div>
                         <h3 className="text-lg font-bold text-slate-900 mb-2">No Friends Yet</h3>
                         <p className="text-slate-500 max-w-sm mx-auto">
                            {profile.fullName} hasn't added any friends.
                         </p>
                      </div>
                    )}
                 </div>
              )}
           </div>
        </div>

      </div>
      
      <ImageViewer 
        images={allImages}
        currentIndex={viewerIndex}
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
        onIndexChange={setViewerIndex}
      />
    </div>
  );
}
