import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, setDoc, serverTimestamp, where, collectionGroup } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { UserCheck, Search, CheckCircle, X, Check, ArrowLeft, Camera, Ticket } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useZxing } from 'react-zxing';
import { QRCodeSVG } from 'qrcode.react';

export default function KioskCheckIn() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const programId = searchParams.get('programId');
  const programName = searchParams.get('programName') || 'Sunday Service';

  const [searchQuery, setSearchQuery] = useState('');
  const [members, setMembers] = useState<any[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [checkedInList, setCheckedInList] = useState<Set<string>>(new Set());
  const [isScanning, setIsScanning] = useState(false);
  const [recentCheckIn, setRecentCheckIn] = useState<any>(null); // For ticket modal
  
  const { ref: zxingRef } = useZxing({
    onDecodeResult(result) {
      const scannedId = result.getText().trim();
      const match = members.find(m => m.id === scannedId);
      
      if (match) {
        if (checkedInList.has(match.id)) {
          toast.info(`${match.fullName} is already checked in.`);
        } else {
          handleCheckIn(match);
        }
      } else {
        toast.error("Member not found from QR Code.");
      }
      
      setIsScanning(false);
      setSearchQuery('');
    },
    paused: !isScanning,
  });
  
  // Date format YYYY-MM-DD
  const todayDateStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    setIsLoading(true);
    try {
      // In a real app we would want to scan all members or we would check in via district -> branch -> member
      // Since collectionGroup is allowed for members:
      const membersRef = collectionGroup(db, 'members');
      const q = query(membersRef);
      // Wait, firestore.rules has collection group match for `{path=**}/members/{memberId}` but rules only allow list if isSuperAdmin or isDistrictLeader.
      // Assuming kiosk mode will be run by an admin.
      const snapshot = await getDocs(q);
      const membersList = snapshot.docs.map(doc => ({
        id: doc.id,
        refPath: doc.ref.path,
        ...doc.data()
      }));
      setMembers(membersList);
      setFilteredMembers(membersList);
    } catch (error) {
       console.error("Error fetching members:", error);
       toast.error("Failed to load members for kiosk.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const q = searchQuery.trim().toLowerCase();
    
    // Check if the input is an exact match for an ID
    if (q) {
      const exactMatch = members.find(m => m.id.toLowerCase() === q);
      if (exactMatch && !isCheckingIn) {
         if (checkedInList.has(exactMatch.id)) {
           // We could show a toast here, but on every keystroke it might be annoying,
           // so we just let it appear in the filtered list.
         } else {
           handleCheckIn(exactMatch);
           return;
         }
      }
    }

    setFilteredMembers(members.filter(m => 
      m.fullName?.toLowerCase().includes(q) || 
      m.email?.toLowerCase().includes(q) ||
      m.phone?.includes(q) ||
      m.id.toLowerCase().includes(q)
    ));
  }, [searchQuery, members]);

  const handleCheckIn = async (member: any) => {
     if (isCheckingIn || checkedInList.has(member.id)) return;
     setIsCheckingIn(true);
     try {
        const attendanceRef = collection(db, `${member.refPath}/attendance`);
        const memberRefId = programId ? programId : todayDateStr;
        const docRef = doc(attendanceRef, memberRefId);
        
        const payload = {
           date: todayDateStr,
           timestamp: serverTimestamp(),
           service: programName,
           method: "Kiosk",
           status: "Present",
           recordedBy: auth.currentUser?.uid || 'kiosk'
        };

        await setDoc(docRef, payload);

        // If it's a specific program, we ALSO need to double-write to the program's tracking collection
        if (programId) {
            // member.refPath is districts/{d}/branches/{b}/members/{m}
            // we want to write to districts/{d}/branches/{b}/events/{programId}/attendance/{m}
            const eventAttendancePath = member.refPath.replace(`/members/${member.id}`, `/events/${programId}/attendance`);
            await setDoc(doc(db, eventAttendancePath, member.id), payload);
        }

        toast.success(`${member.fullName} checked in!`);
        setCheckedInList(prev => new Set([...prev, member.id]));
        setRecentCheckIn(member);
        setSearchQuery('');
     } catch (error) {
        console.error("Error checking in", error);
        toast.error("Failed to check in.");
     } finally {
        setIsCheckingIn(false);
     }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col p-4 sm:p-6 relative">
      <button 
        onClick={() => {
           if (programId) {
              navigate(-1);
           } else {
              navigate('/dashboard');
           }
        }}
        className="absolute top-4 left-4 sm:top-6 sm:left-6 text-slate-400 hover:text-white flex items-center gap-2 font-bold px-3 py-2 sm:px-4 sm:py-2 rounded-xl transition-colors hover:bg-slate-800 z-10 text-sm sm:text-base"
      >
         <ArrowLeft size={20} />
         <span className="hidden sm:inline">Exit Kiosk</span>
      </button>

      <div className="max-w-4xl w-full mx-auto flex-1 flex flex-col pt-16 sm:pt-12">
        
        <div className="text-center mb-8 sm:mb-12 relative">
           <AnimatePresence>
             {recentCheckIn && (
               <motion.div
                 initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                 className="fixed inset-0 z-50 flex items-center justify-center p-6"
               >
                 <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setRecentCheckIn(null)} />
                 <motion.div 
                   initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                   className="relative bg-white text-slate-900 rounded-[2rem] p-8 max-w-sm w-full border border-slate-200 shadow-2xl overflow-hidden"
                 >
                   <div className="absolute top-0 right-0 p-4">
                     <button onClick={() => setRecentCheckIn(null)} className="text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full p-2">
                       <X size={20} />
                     </button>
                   </div>
                   <div className="text-center mt-4">
                     <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Check size={32} strokeWidth={3} />
                     </div>
                     <h3 className="text-2xl font-black text-slate-800 tracking-tight">{recentCheckIn.fullName}</h3>
                     <p className="text-slate-500 font-medium">Checked in to {programName}</p>

                     <div className="mt-8 border-t border-dashed border-slate-300 pt-8 flex justify-center">
                       <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm inline-block">
                         <QRCodeSVG 
                           value={recentCheckIn.id} 
                           size={160} 
                           bgColor={"#ffffff"} 
                           fgColor={"#0f172a"} 
                           level={"Q"} 
                         />
                       </div>
                     </div>
                     <div className="mt-4 flex flex-col items-center">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest bg-slate-100 px-3 py-1 rounded-full flex items-center gap-1.5">
                           <Ticket size={12} /> Security / Event Tag Code
                        </span>
                        <p className="text-xs text-slate-500 mt-3 font-medium">Screen shot or scan this barcode for secure pick-up, seating, or kids check-out.</p>
                     </div>
                   </div>
                 </motion.div>
               </motion.div>
             )}
             {programId && (
               <motion.div 
                 initial={{ opacity: 0, y: -10 }} 
                 animate={{ opacity: 1, y: 0 }} 
                 className="absolute -top-12 left-1/2 -translate-x-1/2 bg-blue-500/20 text-blue-400 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border border-blue-500/30"
               >
                 Event Context Active
               </motion.div>
             )}
           </AnimatePresence>
           <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <UserCheck className="w-8 h-8 sm:w-10 sm:h-10" />
           </div>
           <h1 className="text-3xl sm:text-5xl font-black mb-2 sm:mb-4 tracking-tight">Express Check-In</h1>
           <p className="text-slate-400 text-sm sm:text-xl font-medium">{programName} • {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric'})}</p>
        </div>

        <div className="bg-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl border border-slate-700/50 mb-6 sm:mb-8 relative flex gap-2">
           <div className="relative flex-1">
             <Search size={24} className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5 sm:w-6 sm:h-6" />
             <input 
               autoFocus
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               placeholder="Search name or ID..." 
               className="w-full bg-slate-900/50 border border-slate-700 text-lg sm:text-2xl font-bold text-white rounded-xl sm:rounded-2xl py-4 sm:py-6 pl-12 sm:pl-16 pr-4 sm:pr-6 focus:outline-none focus:ring-4 focus:ring-emerald-500/30 transition-all placeholder:text-slate-600"
             />
           </div>
           <button
             onClick={() => setIsScanning(!isScanning)}
             className={`shrink-0 px-4 sm:px-6 rounded-xl sm:rounded-2xl border flex items-center justify-center transition-all ${isScanning ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'}`}
           >
             <Camera size={24} className="w-6 h-6 sm:w-8 sm:h-8" />
           </button>
        </div>

        {isScanning && (
          <div className="bg-slate-800 rounded-2xl sm:rounded-3xl p-2 sm:p-4 mb-6 sm:mb-8 overflow-hidden relative aspect-square max-w-sm mx-auto w-full flex items-center justify-center border border-slate-700/50 shadow-2xl">
            <div className="relative w-full h-full rounded-xl sm:rounded-2xl overflow-hidden">
              <video ref={zxingRef} className="w-full h-full object-cover" />
              
              {/* Scanner Grid Overlay */}
              <div className="absolute inset-0 pointer-events-none border-[4px] border-emerald-500/30 m-4 sm:m-8 rounded-xl sm:rounded-3xl overflow-hidden">
                 {/* Scanning Line Animation */}
                 <motion.div
                   animate={{
                     top: ["0%", "calc(100% - 4px)", "0%"],
                   }}
                   transition={{
                     duration: 3,
                     ease: "linear",
                     repeat: Infinity,
                   }}
                   className="absolute left-0 right-0 h-1 bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.8)]"
                 />
              </div>

              {/* Decorative corners */}
              <div className="absolute inset-x-8 inset-y-8 pointer-events-none">
                 <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-500 rounded-tl-xl sm:rounded-tl-2xl -ml-1 -mt-1"></div>
                 <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-500 rounded-tr-xl sm:rounded-tr-2xl -mr-1 -mt-1"></div>
                 <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-500 rounded-bl-xl sm:rounded-bl-2xl -ml-1 -mb-1"></div>
                 <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-500 rounded-br-xl sm:rounded-br-2xl -mr-1 -mb-1"></div>
              </div>
            </div>

            <div className="absolute inset-x-0 bottom-8 flex justify-center z-10">
              <button 
                onClick={() => setIsScanning(false)}
                className="bg-slate-900/80 hover:bg-slate-900 text-white px-6 py-3 rounded-full text-sm font-bold backdrop-blur-md border border-slate-700 transition-colors shadow-xl flex items-center gap-2"
              >
                <X size={16} />
                Close Scanner
              </button>
            </div>
          </div>
        )}

        {searchQuery.length > 0 && !isScanning && (
           <div className="bg-slate-800 rounded-2xl sm:rounded-3xl border border-slate-700/50 overflow-hidden shadow-2xl flex-1 max-h-[500px] overflow-y-auto custom-scrollbar">
             {filteredMembers.length > 0 ? (
                <div className="divide-y divide-slate-700/50">
                  {filteredMembers.map(member => {
                     const isCheckedIn = checkedInList.has(member.id);
                     return (
                       <div key={member.id} className="p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-0 hover:bg-slate-700/30 transition-colors">
                          <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto">
                             <div className="w-12 h-12 sm:w-16 sm:h-16 shrink-0 rounded-xl sm:rounded-2xl bg-slate-700 flex items-center justify-center text-lg sm:text-xl font-bold text-slate-400">
                                {member.photoUrl ? (
                                   <img src={member.photoUrl} alt={member.fullName} className="w-full h-full object-cover rounded-xl sm:rounded-2xl" />
                                ) : (
                                   member.fullName?.substring(0,2).toUpperCase()
                                )}
                             </div>
                             <div className="flex-1 min-w-0">
                                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight truncate">{member.fullName}</h3>
                                <div className="text-slate-400 mt-1 flex items-center gap-2 text-xs sm:text-sm">
                                  <span>{member.level || 'Member'}</span>
                                  {member.phone && <><span className="w-1 h-1 bg-slate-600 rounded-full shrink-0"></span><span className="truncate">{member.phone}</span></>}
                                </div>
                             </div>
                          </div>
                          
                          <button 
                            onClick={() => handleCheckIn(member)}
                            disabled={isCheckedIn || isCheckingIn}
                            className={`w-full sm:w-auto px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black text-sm sm:text-lg tracking-wide uppercase flex items-center justify-center gap-2 sm:gap-3 transition-all ${
                               isCheckedIn 
                               ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                               : 'bg-emerald-500 text-white hover:bg-emerald-400 shadow-xl shadow-emerald-500/20 active:scale-95'
                            }`}
                          >
                            {isCheckedIn ? (
                              <>
                                <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                                Checked In
                              </>
                            ) : (
                              <>
                                <Check className="w-5 h-5 sm:w-6 sm:h-6" />
                                Check In
                              </>
                            )}
                          </button>
                       </div>
                     );
                  })}
                </div>
             ) : (
                <div className="p-12 text-center text-slate-500">
                   <p className="text-xl font-bold mb-2">No members found</p>
                   <p>Try searching by a different name or phone number.</p>
                </div>
             )}
           </div>
        )}

      </div>
    </div>
  );
}
