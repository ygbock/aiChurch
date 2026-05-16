import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Landmark, ArrowRight, ShieldCheck, Mail, UserPlus, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminRegistration() {
  const [step, setStep] = useState(1);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative Circles */}
      <div className="absolute top-[10%] left-[5%] w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-60" />
      <div className="absolute bottom-[10%] right-[5%] w-96 h-96 bg-indigo-50 rounded-full blur-3xl opacity-60" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl relative z-10"
      >
        <div className="flex justify-center mb-12">
           <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-lg">
                 <Landmark size={24} />
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">FaithFlow <span className="text-blue-600">Enterprise</span></h1>
           </div>
        </div>

        <div className="bg-white border border-slate-100 shadow-2xl shadow-slate-200/40 rounded-[3rem] p-12 overflow-hidden">
           <div className="flex gap-2 mb-12">
              {[1, 2, 3].map(i => (
                 <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-blue-600' : 'bg-slate-100'}`} />
              ))}
           </div>

           <div className="space-y-8">
              {step === 1 && (
                 <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                    <div className="space-y-2">
                       <h2 className="text-3xl font-black text-slate-900 tracking-tight">Register Organization</h2>
                       <p className="text-slate-500 font-medium leading-relaxed">Establish your national or local ministry on the FaithFlow global platform.</p>
                    </div>
                    <div className="space-y-4">
                       <input type="text" placeholder="Organization Legal Name" className="w-full h-16 px-6 bg-slate-50 border border-slate-100 rounded-[1.5rem] focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all outline-none text-lg font-bold" />
                       <select className="w-full h-16 px-6 bg-slate-50 border border-slate-100 rounded-[1.5rem] focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all outline-none text-lg font-bold appearance-none">
                          <option>Select Region / Territory</option>
                          <option>North America</option>
                          <option>West Africa</option>
                          <option>Europe</option>
                       </select>
                    </div>
                    <button onClick={() => setStep(2)} className="w-full h-16 bg-slate-900 text-white rounded-[1.5rem] font-bold text-lg hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-3">
                       Proceed to Next Protocol <ArrowRight size={20} />
                    </button>
                 </motion.div>
              )}

              {step === 2 && (
                 <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                    <div className="space-y-2">
                       <h2 className="text-3xl font-black text-slate-900 tracking-tight">Administrative Lead</h2>
                       <p className="text-slate-500 font-medium leading-relaxed">Primary contact responsible for top-level organization governance.</p>
                    </div>
                    <div className="space-y-4">
                       <input type="text" placeholder="Full Administrative Name" className="w-full h-16 px-6 bg-slate-50 border border-slate-100 rounded-[1.5rem] focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all outline-none text-lg font-bold" />
                       <input type="email" placeholder="Organization Email Identity" className="w-full h-16 px-6 bg-slate-50 border border-slate-100 rounded-[1.5rem] focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all outline-none text-lg font-bold" />
                    </div>
                    <div className="flex gap-4">
                       <button onClick={() => setStep(1)} className="flex-1 h-16 bg-slate-50 text-slate-400 rounded-[1.5rem] font-bold text-lg hover:bg-slate-100 transition-all">Back</button>
                       <button onClick={() => setStep(3)} className="flex-[2] h-16 bg-slate-900 text-white rounded-[1.5rem] font-bold text-lg hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-3">
                          Validate Identity <ArrowRight size={20} />
                       </button>
                    </div>
                 </motion.div>
              )}

              {step === 3 && (
                 <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8 text-center py-12">
                    <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-xl shadow-emerald-50 mb-8">
                       <ShieldCheck size={48} />
                    </div>
                    <div className="space-y-3">
                       <h2 className="text-4xl font-black text-slate-900 tracking-tight">Request Logged</h2>
                       <p className="text-slate-500 font-medium max-w-md mx-auto">Your organizational registration has been submitted for verification. You will receive an auth proxy link via email shortly.</p>
                    </div>
                    <Link to="/login" className="inline-flex items-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-slate-800 transition-all group">
                       Return to Access Point <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                 </motion.div>
              )}
           </div>
        </div>

        <div className="mt-12 flex justify-center gap-8">
           <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              <Globe size={14} /> Global Deployment
           </div>
           <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              <ShieldCheck size={14} /> Verified Org
           </div>
        </div>
      </motion.div>
    </div>
  );
}
