import React, { useState } from 'react';
import { usePayrollStore } from '../stores/usePayrollStore';
import { motion } from 'motion/react';
import { Calendar, Users, DollarSign, Plus, CheckCircle2, FileText, Gift, Zap } from 'lucide-react';
import { PayrollProfile } from '../types';
import EditProfileDrawer from './EditProfileDrawer';
import QuickIssueModal from './QuickIssueModal';
import { v4 as uuidv4 } from 'uuid';

export default function StipendManagement() {
  const { profiles, schedules } = usePayrollStore();
  const [activeSubTab, setActiveSubTab] = useState<'recipients' | 'rules'>('recipients');
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);
  const [showQuickIssueModal, setShowQuickIssueModal] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<PayrollProfile | null>(null);

  // Filter profiles for stipends
  const stipendProfiles = profiles.filter(p => 
    p.employmentType === 'honorarium' || 
    p.employmentType === 'volunteer' ||
    p.compensationModel === 'pastor_stipend' ||
    p.compensationModel === 'volunteer_allowance' ||
    p.compensationModel === 'per_service'
  );

  const stipendSchedules = schedules.filter(s => 
     s.targetCompensationModels?.some(m => ['pastor_stipend', 'volunteer_allowance', 'per_service', 'hourly'].includes(m)) ||
     s.targetEmploymentTypes?.some(e => ['volunteer', 'honorarium'].includes(e)) ||
     s.frequency === 'event'
  );

  const handleNewRecipient = () => {
    setSelectedProfile({
      id: `prof-${uuidv4().slice(0, 8)}`,
      firstName: '',
      lastName: '',
      role: '',
      employmentType: 'volunteer',
      compensationModel: 'volunteer_allowance',
      branchId: '',
      currency: 'SLE',
      baseSalary: 0,
      paymentMethod: 'cash',
      isActive: true,
      allowances: [],
      deductions: [],
    });
    setShowProfileDrawer(true);
  };

  const handleEditPolicy = (profile: PayrollProfile) => {
    setSelectedProfile(profile);
    setShowProfileDrawer(true);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
         <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Gift className="text-indigo-600" size={20} />
                Ministry Stipends & Honorariums
            </h3>
            <p className="text-sm text-slate-500">Manage allowances for pastors, volunteers, choristers, and guest speakers.</p>
         </div>
         <div className="flex gap-2">
            <button 
              onClick={() => setShowQuickIssueModal(true)}
              className="px-4 py-2 bg-indigo-50 text-indigo-700 font-medium rounded-lg hover:bg-indigo-100 text-sm transition-colors flex items-center gap-2"
            >
                <Zap size={16} /> Quick Issue
            </button>
            <button 
              onClick={handleNewRecipient}
              className="px-4 py-2 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 text-sm transition-colors flex items-center gap-2"
            >
                <Plus size={16} /> New Recipient
            </button>
         </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
             <div className="flex items-center gap-3 mb-2">
                 <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Users size={20} /></div>
                 <h4 className="font-bold text-slate-700">Active Recipients</h4>
             </div>
             <p className="text-2xl font-black text-slate-900">{stipendProfiles.length}</p>
             <p className="text-xs text-slate-500 mt-1">across all branches</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
             <div className="flex items-center gap-3 mb-2">
                 <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><DollarSign size={20} /></div>
                 <h4 className="font-bold text-slate-700">Total Monthly Est.</h4>
             </div>
              <p className="text-2xl font-black text-slate-900">
                ${stipendProfiles.reduce((acc, p) => {
                  const base = p.baseSalary || 0;
                  const allowancesTotal = p.allowances?.reduce((a, al) => {
                    if (al.calculationMethod === 'percentage_of_basic') {
                      return a + (base * al.amount);
                    }
                    return a + al.amount;
                  }, 0) || 0;
                  return acc + base + allowancesTotal;
                }, 0).toLocaleString()}
              </p>
             <p className="text-xs text-slate-500 mt-1">base + fixed allowances</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
             <div className="flex items-center gap-3 mb-2">
                 <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><Calendar size={20} /></div>
                 <h4 className="font-bold text-slate-700">Event Schedules</h4>
             </div>
             <p className="text-2xl font-black text-slate-900">{stipendSchedules.length}</p>
             <p className="text-xs text-slate-500 mt-1">active payment triggers</p>
          </div>
      </div>

      <div className="bg-white border text-left border-slate-200 shadow-sm rounded-2xl overflow-hidden">
        <div className="flex border-b border-slate-100 bg-slate-50 p-2 gap-2">
            <button 
               onClick={() => setActiveSubTab('recipients')}
               className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeSubTab === 'recipients' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}
            >
                Stipend Recipients
            </button>
            <button 
               onClick={() => setActiveSubTab('rules')}
               className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeSubTab === 'rules' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}
            >
                Automation & Rules
            </button>
        </div>

        {activeSubTab === 'recipients' && (
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-medium">
                            <th className="py-3 px-6 text-left">Recipient</th>
                            <th className="py-3 px-6 text-left">Category & Role</th>
                            <th className="py-3 px-6 text-right">Base / Fixed</th>
                            <th className="py-3 px-6 text-left">Method</th>
                            <th className="py-3 px-6 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {stipendProfiles.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="py-8 text-center text-slate-500">No stipend recipients configured.</td>
                            </tr>
                        ) : (
                            stipendProfiles.map(profile => (
                                <tr key={profile.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="py-4 px-6 font-medium text-slate-900">
                                        {profile.firstName} {profile.lastName}
                                        <p className="text-xs text-slate-500 font-normal">{profile.branchId}</p>
                                    </td>
                                    <td className="py-4 px-6">
                                        <div className="flex flex-col gap-1 items-start">
                                            <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded capitalize">
                                                {profile.employmentType.replace('_', ' ')}
                                            </span>
                                            <div className="text-xs font-medium text-slate-600 flex items-center gap-1">
                                                {profile.role}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6 text-right font-bold text-slate-900">
                                        {profile.baseSalary > 0 ? (
                                            `$${profile.baseSalary.toLocaleString()}`
                                        ) : (
                                            <span className="text-slate-400 font-normal">Per Event/Usage</span>
                                        )}
                                        {profile.allowances && profile.allowances.length > 0 && (
                                            <div className="text-[10px] text-emerald-600 font-normal mt-0.5">
                                                + {profile.allowances.length} allowances
                                            </div>
                                        )}
                                    </td>
                                    <td className="py-4 px-6 text-slate-600">
                                        <span className="capitalize">{profile.paymentMethod.replace('_', ' ')}</span>
                                    </td>
                                    <td className="py-4 px-6 text-right">
                                        <button 
                                          onClick={() => handleEditPolicy(profile)}
                                          className="px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                                        >
                                            Edit Policy
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        )}

        {activeSubTab === 'rules' && (
            <div className="p-6">
                <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                    <div>
                        <h4 className="font-bold text-slate-900">Stipend Auto-Generation Rules</h4>
                        <p className="text-sm text-slate-500">System triggers that issue stipends based on schedules.</p>
                    </div>
                </div>
                
                {stipendSchedules.length === 0 ? (
                    <div className="text-center py-6 text-slate-500 text-sm">No specialized stipend or honorarium schedules exist. Go to the Schedules tab to create one.</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {stipendSchedules.map(s => (
                            <div key={s.id} className="p-4 border border-slate-200 rounded-xl bg-white shadow-sm flex flex-col gap-3">
                                <div className="flex justify-between items-start">
                                    <h5 className="font-bold text-slate-900">{s.name}</h5>
                                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                                        {s.frequency}
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-2 text-xs">
                                    {s.targetEmploymentTypes?.map(t => (
                                        <span key={t} className="bg-sky-100 text-sky-700 px-2 py-0.5 rounded capitalize">{t.replace('_', ' ')}</span>
                                    ))}
                                    {s.targetCompensationModels?.map(m => (
                                        <span key={m} className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded capitalize">{m.replace('_', ' ')}</span>
                                    ))}
                                </div>
                                <div className="mt-auto border-t border-slate-100 pt-3 flex justify-between items-center text-sm">
                                    <span className="text-slate-500">Auto-Generate: {s.autoGenerate ? 'Yes' : 'No'}</span>
                                    <span className="text-slate-900 font-medium">Next: {new Date(s.nextRunDate).toLocaleDateString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}
      </div>

      {showProfileDrawer && selectedProfile && (
        <EditProfileDrawer 
          profile={selectedProfile}
          onClose={() => {
            setShowProfileDrawer(false);
            setSelectedProfile(null);
          }}
        />
      )}

      {showQuickIssueModal && (
        <QuickIssueModal 
          onClose={() => setShowQuickIssueModal(false)}
          recipients={stipendProfiles}
        />
      )}
    </motion.div>
  );
}
