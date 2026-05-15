import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../../lib/firebase';
import { useFirebase } from '../../../components/FirebaseProvider';
import { useNavigate } from 'react-router-dom';
import { Users, ChevronRight } from 'lucide-react';

export default function RecentMembersWidget() {
  const { profile } = useFirebase();
  const navigate = useNavigate();
  const [recentMembers, setRecentMembers] = useState<any[]>([]);

  useEffect(() => {
    if (!profile?.districtId || !profile?.branchId) return;
    
    const membersPath = `districts/${profile.districtId}/branches/${profile.branchId}/members`;
    const membersQ = query(collection(db, membersPath), orderBy('createdAt', 'desc'), limit(5));
    
    const unsubscribe = onSnapshot(membersQ, (snapshot) => {
      setRecentMembers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, membersPath);
    });

    return () => unsubscribe();
  }, [profile]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Live Feed • Branch Hub</p>
        </div>
        <button 
          onClick={() => navigate('/members')}
          className="text-xs font-black text-blue-600 uppercase tracking-widest hover:text-blue-700 transition-colors"
        >
          View All
        </button>
      </div>

      <div className="flex-1 overflow-x-auto">
        {recentMembers.length === 0 ? (
           <div className="h-full flex flex-col items-center justify-center py-8 text-center space-y-4">
              <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                <Users size={28} />
              </div>
              <p className="text-sm font-bold text-slate-400">No recent activity detected.</p>
           </div>
        ) : (
          <div className="space-y-2">
            {recentMembers.map(member => (
              <div onClick={() => navigate(`/members/profile/${member.id}`)} key={member.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl cursor-pointer group transition-colors">
                <div className="flex items-center gap-3">
                  {member.photoUrl ? (
                    <img src={member.photoUrl} alt={member.fullName} className="w-10 h-10 rounded-xl object-cover shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-black text-xs shrink-0">
                      {member.fullName?.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-900 truncate">{member.fullName}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase truncate">{member.status || 'Pending'}</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-600 transition-colors" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
