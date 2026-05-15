import React, { useState } from 'react';
import { usePayrollStore } from '../stores/usePayrollStore';
import { Plus, Search, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import EditProfileDrawer from './EditProfileDrawer';
import { PayrollProfile } from '../types';

export default function PayrollProfiles() {
  const { profiles } = usePayrollStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingProfile, setEditingProfile] = useState<PayrollProfile | null>(null);

  const filtered = profiles.filter(p => 
    (p.firstName + ' ' + p.lastName).toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search staff, volunteers..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <button className="px-4 py-2 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 text-sm transition-colors flex items-center justify-center gap-2">
          <Plus size={16} /> New Profile
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(profile => (
          <div key={profile.id} className={`bg-white p-6 rounded-2xl border ${profile.isActive ? 'border-slate-200 shadow-sm' : 'border-slate-100 opacity-70'} relative group`}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">{profile.firstName} {profile.lastName}</h3>
                <p className="text-slate-500 text-sm">{profile.role}</p>
              </div>
              <span className={`px-2 py-1 text-xs font-bold uppercase tracking-wider rounded-md ${
                profile.employmentType === 'full_time' ? 'bg-blue-50 text-blue-700' :
                profile.employmentType === 'volunteer' ? 'bg-purple-50 text-purple-700' :
                profile.employmentType === 'honorarium' ? 'bg-amber-50 text-amber-700' :
                'bg-slate-100 text-slate-700'
              }`}>
                {profile.employmentType.replace('_', ' ')}
              </span>
            </div>
            
            <div className="space-y-2 mb-6">
                <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Base/Stipend</span>
                    <span className="font-bold">${profile.baseSalary}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Method</span>
                    <span className="capitalize font-medium text-slate-700">{profile.paymentMethod.replace('_', ' ')}</span>
                </div>
                {!profile.isActive && (
                   <div className="mt-2 text-xs font-bold text-red-500 uppercase tracking-widest text-center bg-red-50 py-1 rounded">
                       Inactive
                   </div>
                )}
            </div>

            <button 
              onClick={() => setEditingProfile(profile)}
              className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 font-medium rounded-lg text-sm transition-colors flex flex-row items-center justify-center gap-2"
            >
                <Edit2 size={14} /> Edit Configuration
            </button>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {editingProfile && (
           <EditProfileDrawer 
             profile={editingProfile} 
             onClose={() => setEditingProfile(null)} 
           />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
