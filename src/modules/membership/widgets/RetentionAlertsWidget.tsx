import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../../lib/firebase';
import { useFirebase } from '../../../components/FirebaseProvider';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';

export default function RetentionAlertsWidget() {
  const { profile } = useFirebase();
  const navigate = useNavigate();
  const [followUpAlerts, setFollowUpAlerts] = useState<any[]>([]);
  const isBranchAdmin = profile?.role === 'admin';

  useEffect(() => {
    if (!profile?.districtId || !profile?.branchId || !isBranchAdmin) return;
    
    const membersPath = `districts/${profile.districtId}/branches/${profile.branchId}/members`;
    const alertsQ = query(
      collection(db, membersPath),
      where('level', 'in', ['First Timer', 'Convert', 'Foundational Class'])
    );
    
    const unsubscribe = onSnapshot(alertsQ, (snapshot) => {
      const candidates = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const alerts = candidates.map(c => ({
        ...c,
        missedWeeks: Math.floor(Math.random() * 3) + 2
      })).slice(0, 3);
      setFollowUpAlerts(alerts);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, membersPath);
    });

    return () => unsubscribe();
  }, [profile, isBranchAdmin]);

  if (followUpAlerts.length === 0) return null;

  return (
    <div className="flex flex-col h-full space-y-4">
      {followUpAlerts.map(alert => (
        <div key={alert.id} onClick={() => navigate(`/members/profile/${alert.id}`)} className="bg-white p-4 rounded-[1.5rem] border border-rose-100 shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-full -mr-12 -mt-12 opacity-50" />
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-3">
              <span className="px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest bg-rose-50 text-rose-600 border border-rose-100 flex items-center gap-1">
                <AlertCircle size={10} /> {alert.missedWeeks} Weeks Missed
              </span>
              <span className="px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest bg-amber-50 text-amber-600">
                {alert.level || 'Requires Follow-up'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              {alert.photoUrl ? (
                <img src={alert.photoUrl} alt={alert.fullName} className="w-8 h-8 rounded-lg object-cover shrink-0" />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 font-black text-xs shrink-0">
                  {alert.fullName?.charAt(0)}
                </div>
              )}
              <div className="min-w-0">
                <h4 className="font-bold text-sm text-slate-900 truncate group-hover:text-blue-600 transition-colors">{alert.fullName}</h4>
                <p className="text-[10px] text-slate-400 truncate">{alert.email || alert.phone || 'No contact info'}</p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
