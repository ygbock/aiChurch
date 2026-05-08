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
  User
} from 'lucide-react';
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp, setDoc, or } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useFirebase } from '../components/FirebaseProvider';
import { toast } from 'sonner';

export default function PublicUserProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, profile: currentProfile } = useFirebase();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [friendshipStatus, setFriendshipStatus] = useState<'none' | 'pending' | 'friends'>('none');

  useEffect(() => {
    if (!userId) return;

    const fetchProfile = async () => {
      try {
        const docRef = doc(db, 'users', userId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setProfile({ id: docSnap.id, ...docSnap.data() });
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
    } catch(err) {
      handleFirestoreError(err, OperationType.CREATE, 'friendships');
      toast.error('Failed to send request');
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
                 {profile.photoUrl ? (
                   <img src={profile.photoUrl} alt={profile.fullName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                 ) : (
                   <span className="text-3xl font-bold text-indigo-200">
                     {profile.fullName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                   </span>
                 )}
               </div>

               {/* Action Buttons */}
               {currentUser?.uid !== userId && (
                 <div className="flex gap-3 mt-4 sm:mt-0">
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
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors shadow-sm"
                    >
                      <MessageCircle size={18} />
                      Message
                    </button>
                 </div>
               )}
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
                 District: {profile.districtId || 'Unspecified'}
               </div>
               <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                 <MapPin size={18} className="text-slate-400" />
                 Branch: {profile.branchId || 'Unspecified'}
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

           {/* Feed placeholder */}
           <div className="md:col-span-2 space-y-6">
              {/* Here we could query and render recent posts by this user */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
                 <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 mx-auto mb-4">
                    <MessageCircle size={28} />
                 </div>
                 <h3 className="text-lg font-bold text-slate-900 mb-2">No Recent Activity</h3>
                 <p className="text-slate-500 max-w-sm mx-auto">
                    {profile.fullName} hasn't posted anything in the community feed recently.
                 </p>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}
