import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'sonner';
import { CalendarIcon, Clock, MapPin, CheckCircle, CreditCard, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { QRCodeCanvas } from 'qrcode.react';

export default function PublicEventRegistration() {
  const { districtId, branchId, eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const [passData, setPassData] = useState<any>(null);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    paymentMethod: 'none',
    transactionId: '',
    mobileNumber: ''
  });

  useEffect(() => {
    fetchEvent();
  }, [districtId, branchId, eventId]);

  const fetchEvent = async () => {
    if (!districtId || !branchId || !eventId) return;
    try {
      const docRef = doc(db, `districts/${districtId}/branches/${branchId}/events`, eventId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.isOpenToPublic) {
          setEvent({ id: docSnap.id, ...data });
        } else {
           toast.error('This event is not open to the public.');
        }
      } else {
        toast.error('Event not found.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;

    try {
      const registrationPath = `districts/${districtId}/branches/${branchId}/events/${eventId}/registrations`;
      const passId = Math.random().toString(36).substring(2, 9).toUpperCase();
      
      let paymentStatus = 'none';
      if (event.cost && event.cost !== '0') {
        paymentStatus = form.paymentMethod === 'mobile_money' ? 'pending' : 'on_site';
      }

      const registrationData = {
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        passId,
        paymentStatus,
        paymentMethod: form.paymentMethod,
        transactionId: form.transactionId,
        mobileNumber: form.mobileNumber,
        registeredAt: serverTimestamp(),
      };

      await addDoc(collection(db, registrationPath), registrationData);
      
      setPassData(registrationData);
      toast.success('Registration successful!');
      setIsRegistered(true);
    } catch (error) {
       console.error("Error registering:", error);
       toast.error("Registration failed. Please try again.");
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin w-8 h-8 rounded-full border-4 border-blue-600 border-t-transparent"></div></div>;
  }

  if (!event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6">
        <h1 className="text-3xl font-black text-slate-800 mb-2 font-display uppercase tracking-wider">Event Not Available</h1>
        <p className="text-slate-500">This event may have been cancelled, past its date, or is invite-only.</p>
      </div>
    );
  }

  if (isRegistered && passData) {
    const qrData = JSON.stringify({
      type: 'event-pass',
      passId: passData.passId,
      name: passData.fullName,
      eventId: event.id,
      paymentStatus: passData.paymentStatus
    });

    return (
       <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
          <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl text-center border border-slate-100">
             <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={40} />
             </div>
             <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">You're In!</h2>
             <p className="text-slate-500 font-medium mb-8">Your registration for <strong>{event.title}</strong> is confirmed. Please keep this digital pass safe.</p>
             
             {/* Digital Pass Card */}
             <div className="bg-slate-900 text-white rounded-2xl p-6 mb-8 shadow-xl relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl -mr-16 -mt-16"></div>
               <h3 className="font-display font-black text-xl mb-1 truncate relative z-10">{event.title}</h3>
               <p className="text-slate-400 text-xs mb-6 relative z-10">{format(new Date(event.date.seconds ? event.date.toMillis() : event.date), 'MMMM do, yyyy')} • {event.time}</p>
               
               <div className="bg-white p-4 rounded-xl flex items-center justify-center mb-6 relative z-10">
                 <QRCodeCanvas value={qrData} size={150} level="H" includeMargin />
               </div>
               
               <div className="flex justify-between items-end relative z-10">
                  <div className="text-left">
                     <p className="text-[10px] uppercase tracking-widest text-slate-400 font-black mb-1">Passholder</p>
                     <p className="font-bold text-sm truncate">{passData.fullName}</p>
                  </div>
                  <div className="text-right">
                     <p className="text-[8px] uppercase tracking-widest text-slate-400 font-black mb-1">Status</p>
                     <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${passData.paymentStatus === 'pending' ? 'bg-amber-500/20 text-amber-300' : passData.paymentStatus === 'on_site' ? 'bg-blue-500/20 text-blue-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                        {passData.paymentStatus === 'none' ? 'Confirmed' : passData.paymentStatus.replace('_', ' ')}
                     </span>
                  </div>
               </div>
             </div>

             {event.cost && event.cost !== '0' && form.paymentMethod === 'mobile_money' && (
                <div className="bg-amber-50 border border-amber-100 text-amber-800 p-4 rounded-xl mb-6 text-sm font-medium">
                   Your payment via Mobile Money is being verified. Once approved, your status will update automatically.
                </div>
             )}

             <button onClick={() => window.location.reload()} className="text-blue-600 font-bold uppercase tracking-widest text-xs hover:underline">Register Another Person</button>
          </div>
       </div>
    );
  }

  const needsPayment = event.cost && event.cost !== '0' && event.cost !== 'Free';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-12 px-4 sm:px-6">
      <div className="w-full max-w-xl mx-auto">
         {/* Event Header */}
         <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 sm:p-8 mb-6 text-center">
            <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-[0.2em] rounded-lg mb-4 inline-block">{event.type || 'Event'}</span>
            <h1 className="text-3xl sm:text-5xl font-black text-slate-900 font-serif tracking-tight mb-4 leading-tight">{event.title}</h1>
            {event.description && <p className="text-slate-500 mb-8">{event.description}</p>}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left border-t border-slate-100 pt-8 mt-4">
               <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-blue-600 shrink-0"><CalendarIcon size={20} /></div>
                  <div>
                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Date</p>
                     <p className="text-sm font-bold text-slate-900">{format(new Date(event.date.seconds ? event.date.toMillis() : event.date), 'MMMM do, yyyy')}</p>
                  </div>
               </div>
               <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-blue-600 shrink-0"><Clock size={20} /></div>
                  <div>
                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Time</p>
                     <p className="text-sm font-bold text-slate-900">{event.time}</p>
                     {event.duration && <p className="text-xs text-slate-500">{event.duration}</p>}
                  </div>
               </div>
               {event.location && (
                 <div className="flex items-start gap-3 sm:col-span-2">
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-blue-600 shrink-0"><MapPin size={20} /></div>
                    <div>
                       <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Location</p>
                       <p className="text-sm font-bold text-slate-900">{event.location}</p>
                    </div>
                 </div>
               )}
            </div>

            {needsPayment && (
               <div className="mt-8 bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center justify-center gap-3 text-emerald-800">
                  <CreditCard size={24} className="text-emerald-600" />
                  <div className="text-left py-1">
                     <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600/80 mb-0.5">Registration Fee</p>
                     <p className="text-2xl font-black leading-none">{event.cost}</p>
                  </div>
               </div>
            )}
         </div>

         {/* Registration Form */}
         <form onSubmit={handleRegister} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 sm:p-8">
            <h2 className="text-2xl font-black text-slate-900 mb-6 tracking-tight">Reserve Your Spot</h2>
            
            <div className="space-y-4 mb-8">
               <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Full Name</label>
                  <input type="text" required value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all font-medium" placeholder="E.g. John Doe" />
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                     <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Email</label>
                     <input type="email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all font-medium" placeholder="john@example.com" />
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Phone</label>
                     <input type="tel" required value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all font-medium" placeholder="+44 7700 900000" />
                  </div>
               </div>
            </div>

            {needsPayment && (
               <div className="mb-8 p-6 bg-slate-50 border border-slate-200 rounded-2xl">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4">Payment Options</h3>
                  <div className="space-y-3 mb-6">
                     <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${form.paymentMethod === 'mobile_money' ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-500/20' : 'bg-white border-slate-200'}`}>
                        <input type="radio" value="mobile_money" checked={form.paymentMethod === 'mobile_money'} onChange={() => setForm({...form, paymentMethod: 'mobile_money'})} className="w-4 h-4 text-blue-600" />
                        <span className="font-bold text-sm text-slate-800">Mobile Money</span>
                     </label>
                     <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${form.paymentMethod === 'on_site' ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-500/20' : 'bg-white border-slate-200'}`}>
                        <input type="radio" value="on_site" checked={form.paymentMethod === 'on_site'} onChange={() => setForm({...form, paymentMethod: 'on_site'})} className="w-4 h-4 text-blue-600" />
                        <span className="font-bold text-sm text-slate-800">Pay On Site</span>
                     </label>
                  </div>

                  {form.paymentMethod === 'mobile_money' && (
                     <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                        <div className="bg-white p-4 rounded-xl border border-blue-100 text-sm text-blue-800 mb-4 font-medium">
                           Please send {event.cost} to MTNMomo: <strong className="font-black">024XXXXXXX</strong> and enter the transaction details below.
                        </div>
                        <div>
                           <label className="block text-xs font-bold text-slate-600 mb-2">MoMo Number Used</label>
                           <input type="tel" required value={form.mobileNumber} onChange={e => setForm({...form, mobileNumber: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 transition-all" placeholder="E.g. 024XXXXXXX" />
                        </div>
                        <div>
                           <label className="block text-xs font-bold text-slate-600 mb-2">Transaction ID / Reference</label>
                           <input type="text" required value={form.transactionId} onChange={e => setForm({...form, transactionId: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Enter reference from SMS" />
                        </div>
                     </div>
                  )}
               </div>
            )}

            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-black uppercase tracking-widest text-sm transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2">
               Complete Registration <ChevronRight size={18} />
            </button>
         </form>
      </div>
    </div>
  );
}
