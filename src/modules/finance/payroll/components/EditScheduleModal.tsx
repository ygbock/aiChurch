import React, { useState, useEffect } from 'react';
import { usePayrollStore } from '../stores/usePayrollStore';
import { X, Save } from 'lucide-react';
import { PayrollSchedule, ScheduleFrequency, EmploymentType, CompensationModel } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../../lib/firebase';

interface EditScheduleModalProps {
  schedule?: PayrollSchedule;
  onClose: () => void;
}

export default function EditScheduleModal({ schedule, onClose }: EditScheduleModalProps) {
  const { setSchedules, schedules } = usePayrollStore();
  const [districts, setDistricts] = useState<{id: string, name: string}[]>([]);
  const [branches, setBranches] = useState<{id: string, name: string}[]>([]);
  const [districtId, setDistrictId] = useState('');

  const [formData, setFormData] = useState<Partial<PayrollSchedule>>(
    schedule || {
      name: '',
      frequency: 'monthly',
      branchId: 'global',
      nextRunDate: new Date().toISOString().split('T')[0],
      cutoffDate: new Date().toISOString().split('T')[0],
      autoGenerate: false,
      isLocked: false,
      isActive: true,
      targetRoles: [],
      targetEmploymentTypes: [],
      targetCompensationModels: []
    }
  );

  useEffect(() => {
    const fetchDistricts = async () => {
      try {
        const snap = await getDocs(collection(db, 'districts'));
        setDistricts(snap.docs.map(doc => ({ id: doc.id, name: doc.data().name })));
      } catch (err) {
        console.error("Failed to fetch districts", err);
      }
    };
    fetchDistricts();
  }, []);

  useEffect(() => {
    const fetchBranches = async () => {
      if (!districtId) {
        setBranches([]);
        return;
      }
      try {
        const snap = await getDocs(collection(db, 'districts', districtId, 'branches'));
        setBranches(snap.docs.map(doc => ({ id: doc.id, name: doc.data().name })));
      } catch (err) {
        console.error("Failed to fetch branches", err);
      }
    };
    fetchBranches();
  }, [districtId]);

  const handleChange = (field: keyof PayrollSchedule, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayChange = (field: 'targetRoles' | 'targetEmploymentTypes' | 'targetCompensationModels', value: string) => {
    setFormData(prev => {
      const current = prev[field] as string[] || [];
      if (current.includes(value as never)) {
        return { ...prev, [field]: current.filter(item => item !== value) };
      } else {
        return { ...prev, [field]: [...current, value] };
      }
    });
  };

  const handeSave = () => {
    if (!formData.name) {
      alert("Name is required");
      return;
    }
    
    if (schedule) {
      // update
      setSchedules(schedules.map(s => s.id === schedule.id ? { ...formData as PayrollSchedule, id: schedule.id } : s));
    } else {
      // create
      const newSchedule: PayrollSchedule = {
        ...(formData as PayrollSchedule),
        id: `sched-${uuidv4().slice(0, 8)}`,
      };
      setSchedules([...schedules, newSchedule]);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-xl">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-lg font-bold text-slate-900">
            {schedule ? 'Edit Schedule' : 'New Schedule'}
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Schedule Name</label>
              <input 
                type="text" 
                value={formData.name || ''} 
                onChange={e => handleChange('name', e.target.value)}
                placeholder="e.g. Monthly Staff Payroll"
                className="w-full p-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Frequency</label>
                <select 
                  value={formData.frequency || 'monthly'} 
                  onChange={e => handleChange('frequency', e.target.value as ScheduleFrequency)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white"
                >
                  <option value="weekly">Weekly</option>
                  <option value="bi_weekly">Bi-Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="event">Event-Based</option>
                  <option value="milestone">Milestone</option>
                </select>
              </div>

               <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">District Focus</label>
                  <select 
                    value={districtId} 
                    onChange={e => {
                       setDistrictId(e.target.value);
                       if (!e.target.value) handleChange('branchId', 'global');
                    }}
                    className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white"
                  >
                    <option value="">Global / All Districts</option>
                    {districts.map(dist => (
                       <option key={dist.id} value={dist.id}>{dist.name}</option>
                    ))}
                  </select>
               </div>
              
               <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Branch Target</label>
                  <select 
                    value={formData.branchId || 'global'} 
                    onChange={e => handleChange('branchId', e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white"
                    disabled={!districtId}
                  >
                    <option value="global">All Branches in District</option>
                    {branches.map(b => (
                       <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Next Run Date</label>
                <input 
                  type="date"
                  value={formData.nextRunDate?.split('T')[0] || ''} 
                  onChange={e => handleChange('nextRunDate', new Date(e.target.value).toISOString())}
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Cutoff Date</label>
                <input 
                  type="date"
                  value={formData.cutoffDate?.split('T')[0] || ''} 
                  onChange={e => handleChange('cutoffDate', new Date(e.target.value).toISOString())}
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-4">
             <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2">Target Constraints (Optional)</h3>
             <p className="text-xs text-slate-500">Filter which profiles this schedule applies to. If none selected, applies to everyone in the branch.</p>
             
             <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Employment Types</label>
                <div className="flex flex-wrap gap-2">
                   {['full_time', 'part_time', 'contract', 'volunteer', 'honorarium'].map(mode => (
                      <label key={mode} className="flex items-center gap-1.5 bg-white px-2 py-1 border border-slate-200 rounded text-xs">
                         <input 
                           type="checkbox" 
                           checked={(formData.targetEmploymentTypes || []).includes(mode as never)} 
                           onChange={() => handleArrayChange('targetEmploymentTypes', mode)}
                         />
                         <span className="capitalize">{mode.replace('_', ' ')}</span>
                      </label>
                   ))}
                </div>
             </div>

             <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Compensation Models</label>
                <div className="flex flex-wrap gap-2">
                   {['fixed_salary', 'pastor_stipend', 'volunteer_allowance', 'per_service', 'hourly', 'contract_rate'].map(mode => (
                      <label key={mode} className="flex items-center gap-1.5 bg-white px-2 py-1 border border-slate-200 rounded text-xs">
                         <input 
                           type="checkbox" 
                           checked={(formData.targetCompensationModels || []).includes(mode as never)} 
                           onChange={() => handleArrayChange('targetCompensationModels', mode)}
                         />
                         <span className="capitalize">{mode.replace('_', ' ')}</span>
                      </label>
                   ))}
                </div>
             </div>
          </div>

          <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                  <input type="checkbox" checked={formData.autoGenerate || false} onChange={e => handleChange('autoGenerate', e.target.checked)} className="rounded text-indigo-600 w-4 h-4" />
                  Auto-Generate
              </label>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                  <input type="checkbox" checked={formData.isLocked || false} onChange={e => handleChange('isLocked', e.target.checked)} className="rounded text-rose-600 w-4 h-4" />
                  Lock Schedule
              </label>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                  <input type="checkbox" checked={formData.isActive || false} onChange={e => handleChange('isActive', e.target.checked)} className="rounded text-emerald-600 w-4 h-4" />
                  Is Active
              </label>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button 
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg text-sm transition-colors"
          >
            Cancel
          </button>
          <button 
            type="button"
            onClick={handeSave}
            className="px-6 py-2 bg-indigo-600 text-white font-medium hover:bg-indigo-700 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
          >
            <Save size={16} /> Save Schedule
          </button>
        </div>
      </div>
    </div>
  );
}
