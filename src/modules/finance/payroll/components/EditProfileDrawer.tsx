import React, { useState, useEffect } from 'react';
import { usePayrollStore } from '../stores/usePayrollStore';
import { X, Plus, Trash2, Save } from 'lucide-react';
import { PayrollProfile, EmploymentType, PaymentMethod } from '../types';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../../lib/firebase';

interface EditProfileDrawerProps {
  profile: PayrollProfile;
  onClose: () => void;
}

export default function EditProfileDrawer({ profile, onClose }: EditProfileDrawerProps) {
  const { updateProfile, createProfile, profiles, taxRules } = usePayrollStore();
  const [formData, setFormData] = useState<PayrollProfile>({ ...profile });
  const [departments, setDepartments] = useState<{id: string, name: string}[]>([]);
  const [districts, setDistricts] = useState<{id: string, name: string}[]>([]);
  const [branches, setBranches] = useState<{id: string, name: string}[]>([]);

  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const snap = await getDocs(collection(db, 'departments'));
        setDepartments(snap.docs.map(doc => ({ id: doc.id, name: doc.data().name })));
      } catch (err) {
        console.error("Failed to fetch departments", err);
      }
    };
    fetchDepts();
  }, []);

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
      if (!formData.districtId) {
        setBranches([]);
        return;
      }
      try {
        const snap = await getDocs(collection(db, 'districts', formData.districtId, 'branches'));
        setBranches(snap.docs.map(doc => ({ id: doc.id, name: doc.data().name })));
      } catch (err) {
        console.error("Failed to fetch branches", err);
      }
    };
    fetchBranches();
  }, [formData.districtId]);

  useEffect(() => {
    const prefixMap: Record<EmploymentType, string> = {
      full_time: 'FT',
      part_time: 'PT',
      contract: 'CT',
      volunteer: 'VL',
      honorarium: 'HN'
    };
    const prefix = prefixMap[formData.employmentType];
    
    if (!formData.employeeId) {
       const generatedId = `${prefix}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
       setFormData(prev => ({ ...prev, employeeId: generatedId }));
    } else {
       const match = formData.employeeId.match(/^[A-Z]{2}-(\d{4})$/);
       if (match) {
         setFormData(prev => ({ ...prev, employeeId: `${prefix}-${match[1]}` }));
       }
    }
  }, [formData.employmentType]);

  const handleChange = (field: keyof PayrollProfile, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    const exists = profiles.find(p => p.id === formData.id);
    if (exists) {
      updateProfile(formData);
    } else {
      createProfile(formData);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" onClick={onClose}></div>
      
      {/* Drawer */}
      <div className="w-full max-w-md bg-white h-full shadow-2xl relative z-10 flex flex-col animate-in slide-in-from-right">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Edit Profile</h2>
            <p className="text-sm text-slate-500">{formData.firstName} {formData.lastName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-2">Employment Details</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">First Name</label>
                <input 
                  type="text" 
                  value={formData.firstName} 
                  onChange={e => handleChange('firstName', e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Last Name</label>
                <input 
                  type="text" 
                  value={formData.lastName} 
                  onChange={e => handleChange('lastName', e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Employee ID</label>
                <input 
                  type="text" 
                  value={formData.employeeId || ''} 
                  onChange={e => handleChange('employeeId', e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Status</label>
                <select 
                  value={formData.isActive ? 'active' : 'inactive'} 
                  onChange={e => handleChange('isActive', e.target.value === 'active')}
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Role / Job Title</label>
              <input 
                type="text" 
                value={formData.role} 
                onChange={e => handleChange('role', e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Employment Type</label>
                <select 
                  value={formData.employmentType} 
                  onChange={e => handleChange('employmentType', e.target.value as EmploymentType)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white"
                >
                  <option value="full_time">Full Time</option>
                  <option value="part_time">Part Time</option>
                  <option value="contract">Contractor</option>
                  <option value="volunteer">Volunteer</option>
                  <option value="honorarium">Honorarium</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Department</label>
                <select 
                  value={formData.departmentId || ''} 
                  onChange={e => handleChange('departmentId', e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white"
                >
                  <option value="">None</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">District</label>
                <select 
                  value={formData.districtId || ''} 
                  onChange={e => handleChange('districtId', e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white"
                >
                  <option value="">Select District</option>
                  {districts.map(dist => (
                    <option key={dist.id} value={dist.id}>{dist.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Branch</label>
                <select 
                  value={formData.branchId || ''} 
                  onChange={e => handleChange('branchId', e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white"
                  disabled={!formData.districtId}
                >
                  <option value="">Select Branch</option>
                  {branches.map(branch => (
                    <option key={branch.id} value={branch.id}>{branch.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-2">Compensation & Config</h3>
            
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Compensation Model</label>
              <select 
                value={formData.compensationModel || 'fixed_salary'} 
                onChange={e => handleChange('compensationModel', e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white"
              >
                <option value="fixed_salary">Fixed Salary</option>
                <option value="pastor_stipend">Pastor Stipend</option>
                <option value="volunteer_allowance">Volunteer Allowance</option>
                <option value="per_service">Per-Service Payment</option>
                <option value="hourly">Hourly Payment</option>
                <option value="contract_rate">Contract Payment</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Currency</label>
                <select 
                  value={formData.currency} 
                  onChange={e => handleChange('currency', e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white"
                >
                  <option value="SLE">SLE (Le)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="NGN">NGN (₦)</option>
                  <option value="KES">KES (KSh)</option>
                  <option value="ZAR">ZAR (R)</option>
                  <option value="GHS">GHS (GH₵)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  {formData.compensationModel === 'hourly' ? 'Hourly Rate' : 
                   formData.compensationModel === 'per_service' ? 'Rate Per Service' : 
                   'Base Amount'}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">#</span>
                  <input 
                    type="number" 
                    value={formData.baseSalary} 
                    onChange={e => handleChange('baseSalary', parseFloat(e.target.value) || 0)}
                    className="w-full pl-8 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Payment Method</label>
              <select 
                value={formData.paymentMethod} 
                onChange={e => handleChange('paymentMethod', e.target.value as PaymentMethod)}
                className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white"
              >
                <option value="bank_transfer">Bank Transfer</option>
                <option value="mobile_money">Mobile Money / Wallet</option>
                <option value="cash">Cash</option>
                <option value="split">Split Payment (Multiple)</option>
              </select>
            </div>

            {(formData.paymentMethod === 'mobile_money' || formData.paymentMethod === 'split') && (
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-3">
                <p className="text-xs font-bold text-slate-700">Mobile Money Configuration</p>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Provider</label>
                  <input 
                    type="text" 
                    value={formData.mobileMoneyDetails?.provider || ''} 
                    onChange={e => handleChange('mobileMoneyDetails', { ...formData.mobileMoneyDetails, provider: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded bg-white text-xs"
                    placeholder="e.g. M-Pesa, Orange Money"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Phone Number</label>
                  <input 
                    type="text" 
                    value={formData.mobileMoneyDetails?.phoneNumber || ''} 
                    onChange={e => handleChange('mobileMoneyDetails', { ...formData.mobileMoneyDetails, phoneNumber: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded bg-white text-xs"
                  />
                </div>
              </div>
            )}
            
            {(formData.paymentMethod === 'bank_transfer' || formData.paymentMethod === 'split') && (
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-3">
                <p className="text-xs font-bold text-slate-700">Bank Configuration</p>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Bank Name</label>
                  <input 
                    type="text" 
                    value={formData.bankDetails?.bankName || ''} 
                    onChange={e => handleChange('bankDetails', { ...formData.bankDetails, bankName: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded bg-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Account Number</label>
                  <input 
                    type="text" 
                    value={formData.bankDetails?.accountNumber || ''} 
                    onChange={e => handleChange('bankDetails', { ...formData.bankDetails, accountNumber: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded bg-white text-xs"
                  />
                </div>
              </div>
            )}

            {formData.paymentMethod === 'split' && (
              <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200">
                <p className="text-xs font-bold text-emerald-800">Split Settings</p>
                <p className="text-[10px] text-emerald-600 mb-2">Configure how to split the payment across accounts (e.g., 50/50)</p>
                <div className="flex gap-2">
                   <div className="flex-1">
                     <label className="block text-[10px] uppercase font-bold text-emerald-700 mb-1">Bank %</label>
                     <input 
                       type="number" 
                       value={(formData.splitAllocations?.find(s => s.method === 'bank_transfer')?.percentage || 0) * 100}
                       onChange={e => {
                         const val = Number(e.target.value) / 100;
                         const splits = formData.splitAllocations || [];
                         const others = splits.filter(s => s.method !== 'bank_transfer');
                         handleChange('splitAllocations', [...others, { method: 'bank_transfer', percentage: val, bankDetails: formData.bankDetails }]);
                       }}
                       className="w-full p-2 border border-emerald-200 rounded bg-white text-xs" 
                       placeholder="e.g. 50" 
                     />
                   </div>
                   <div className="flex-1">
                     <label className="block text-[10px] uppercase font-bold text-emerald-700 mb-1">Mobile %</label>
                     <input 
                       type="number" 
                       value={(formData.splitAllocations?.find(s => s.method === 'mobile_money')?.percentage || 0) * 100}
                       onChange={e => {
                         const val = Number(e.target.value) / 100;
                         const splits = formData.splitAllocations || [];
                         const others = splits.filter(s => s.method !== 'mobile_money');
                         handleChange('splitAllocations', [...others, { method: 'mobile_money', percentage: val, mobileMoneyDetails: formData.mobileMoneyDetails }]);
                       }}
                       className="w-full p-2 border border-emerald-200 rounded bg-white text-xs" 
                       placeholder="e.g. 50" 
                     />
                   </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-2">Compliance</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-3 col-span-2">
                <p className="text-xs font-bold text-slate-700">Tax Profile</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Tax ID / TIN</label>
                    <input 
                      type="text" 
                      value={formData.taxProfile?.taxId || ''} 
                      onChange={e => handleChange('taxProfile', { ...formData.taxProfile, taxId: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded bg-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Tax Rule (Optional)</label>
                    <select 
                      value={formData.taxProfile?.taxRuleId || ''} 
                      onChange={e => handleChange('taxProfile', { ...formData.taxProfile, taxRuleId: e.target.value || undefined })}
                      className="w-full p-2 border border-slate-200 rounded bg-white text-xs"
                    >
                      <option value="">Auto (Match Country)</option>
                      {taxRules?.map(tr => (
                         <option key={tr.id} value={tr.id}>{tr.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {/* Legacy Tax Band or General Override fallback */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200 mt-2">
                  <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Override Type</label>
                      <select 
                        value={formData.taxProfile?.override?.overrideType || formData.taxProfile?.taxBand || 'standard'} 
                        onChange={e => {
                          const val = e.target.value;
                          if (val === 'standard') {
                              handleChange('taxProfile', { ...formData.taxProfile, override: undefined, taxBand: 'standard' });
                          } else if (val === 'exempt') {
                              handleChange('taxProfile', { ...formData.taxProfile, override: { overrideType: 'exempt', value: 0 }, taxBand: 'exempt' });
                          } else if (val === 'fixed_amount' || val === 'percentage') {
                              handleChange('taxProfile', { ...formData.taxProfile, override: { overrideType: val, value: 0 }, taxBand: 'standard' });
                          } else {
                              handleChange('taxProfile', { ...formData.taxProfile, taxBand: val as any, override: undefined });
                          }
                        }}
                        className="w-full p-2 border border-slate-200 rounded bg-white text-xs"
                      >
                        <option value="standard">None (Use Computed Rule)</option>
                        <option value="exempt">Tax Exempt</option>
                        <option value="reduced">Legacy Reduced (50%)</option>
                        <option value="fixed_amount">Fixed Amount</option>
                        <option value="percentage">Percentage</option>
                      </select>
                  </div>
                  {formData.taxProfile?.override && formData.taxProfile.override.overrideType !== 'exempt' && (
                     <div>
                       <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Override Value</label>
                       <input 
                         type="number" 
                         step={formData.taxProfile.override.overrideType === 'percentage' ? "0.01" : "1"}
                         value={formData.taxProfile.override.value || 0} 
                         onChange={e => handleChange('taxProfile', { 
                           ...formData.taxProfile, 
                           override: { ...formData.taxProfile!.override!, value: Number(e.target.value) } 
                         })}
                         className="w-full p-2 border border-slate-200 rounded bg-white text-xs font-bold"
                         placeholder={formData.taxProfile.override.overrideType === 'percentage' ? 'e.g. 0.15' : 'Amount'}
                       />
                     </div>
                  )}
                </div>
              </div>
              
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-3 col-span-2">
                <p className="text-xs font-bold text-slate-700">Pension Details</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Pension Provider</label>
                    <select
                      value={formData.pensionDetails?.providerId || ''}
                      onChange={e => handleChange('pensionDetails', { ...formData.pensionDetails, providerId: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded bg-white text-xs"
                    >
                      <option value="">Default Provider / None</option>
                      {usePayrollStore.getState().pensionProviders?.map(p => (
                         <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Pension Number</label>
                    <input 
                      type="text" 
                      value={formData.pensionDetails?.pensionNumber || ''} 
                      onChange={e => handleChange('pensionDetails', { ...formData.pensionDetails, pensionNumber: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded bg-white text-xs"
                      placeholder="e.g. PEN-1090"
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">EE Contrib Rate</label>
                    <input 
                      type="number" 
                      step="0.01"
                      value={formData.pensionDetails?.employeeContributionRate || ''} 
                      onChange={e => handleChange('pensionDetails', { ...formData.pensionDetails, employeeContributionRate: Number(e.target.value) || 0 })}
                      className="w-full p-2 border border-slate-200 rounded bg-white text-xs"
                      placeholder="Override Employee Rate"
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">ER Contrib Rate</label>
                    <input 
                      type="number" 
                      step="0.01"
                      value={formData.pensionDetails?.employerContributionRate || ''} 
                      onChange={e => handleChange('pensionDetails', { ...formData.pensionDetails, employerContributionRate: Number(e.target.value) || 0 })}
                      className="w-full p-2 border border-slate-200 rounded bg-white text-xs"
                      placeholder="Override Employer Rate"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Calculation Basis Override</label>
                    <select
                      value={formData.pensionDetails?.calculationBasisOverride || ''}
                      onChange={e => handleChange('pensionDetails', { ...formData.pensionDetails, calculationBasisOverride: (e.target.value as any) || undefined })}
                      className="w-full p-2 border border-slate-200 rounded bg-white text-xs"
                    >
                      <option value="">Default (From Provider)</option>
                      <option value="basic_salary">Basic Salary Only</option>
                      <option value="basic_plus_taxable_allowances">Basic Salary + Taxable Allowances</option>
                      <option value="gross_pay">Total Gross Pay</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
             <div className="border-b border-slate-100 pb-2 flex justify-between items-center">
               <h3 className="font-bold text-slate-900">Custom Allowances</h3>
               <button
                 type="button"
                 onClick={() => {
                   const defaultAllowance = { 
                     id: `alw-${Date.now()}`, 
                     profileId: formData.id, 
                     type: 'custom' as any, 
                     name: 'New Allowance', 
                     amount: 0, 
                     calculationMethod: 'fixed' as any,
                     isTaxable: false, 
                     frequency: 'recurring' as any 
                   };
                   handleChange('allowances', [...(formData.allowances || []), defaultAllowance]);
                 }}
                 className="text-indigo-600 hover:text-indigo-700 text-xs font-bold flex items-center gap-1"
               >
                 <Plus size={14} /> Add
               </button>
             </div>
             <p className="text-xs text-slate-500 italic">Allowances configured globally or via structures can be overridden here.</p>
             
             {formData.allowances && formData.allowances.length > 0 && (
               <div className="space-y-2">
                 {formData.allowances.map((alw, idx) => (
                    <div key={alw.id} className="flex flex-col gap-2 bg-slate-50 p-2 rounded border border-slate-200">
                      <div className="flex flex-col md:flex-row items-start md:items-center gap-2">
                        <div className="flex gap-2 w-full md:flex-1">
                          <select
                            value={alw.type}
                            onChange={e => {
                              const next = [...formData.allowances!];
                              next[idx].type = e.target.value as any;
                              // Set default names for common types
                              const names: Record<string, string> = {
                                housing: 'Housing Allowance',
                                transportation: 'Transportation Allowance',
                                feeding: 'Feeding Allowance',
                                communication: 'Communication Allowance',
                                welfare: 'Welfare Allowance',
                                ministry_support: 'Ministry Support',
                                risk_allowance: 'Risk Allowance',
                                bonus: 'Performance Bonus',
                                overtime: 'Overtime Pay'
                              };
                              if (names[e.target.value]) {
                                next[idx].name = names[e.target.value];
                              }
                              handleChange('allowances', next);
                            }}
                            className="w-1/2 md:w-32 p-2 text-xs border border-slate-200 rounded bg-white shadow-sm shrink-0"
                          >
                            <option value="custom">Custom</option>
                            <option value="housing">Housing</option>
                            <option value="transportation">Transportation</option>
                            <option value="feeding">Feeding</option>
                            <option value="communication">Communication</option>
                            <option value="welfare">Welfare</option>
                            <option value="ministry_support">Ministry Support</option>
                            <option value="risk_allowance">Risk Allowance</option>
                            <option value="bonus">Bonus</option>
                            <option value="overtime">Overtime</option>
                          </select>
                          <input
                            type="text"
                            value={alw.name}
                            onChange={e => {
                              const next = [...formData.allowances!];
                              next[idx].name = e.target.value;
                              handleChange('allowances', next);
                            }}
                            className="w-1/2 md:flex-1 p-2 text-xs border border-slate-200 rounded shrink-0"
                            placeholder="Allowance Name"
                          />
                        </div>
                        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                          <div className="flex flex-col gap-1 w-24 shrink-0">
                            <select
                              value={alw.calculationMethod || 'fixed'}
                              onChange={e => {
                                const next = [...formData.allowances!];
                                next[idx].calculationMethod = e.target.value as any;
                                handleChange('allowances', next);
                              }}
                              className="w-full p-1 text-[10px] border border-slate-200 rounded bg-white"
                            >
                              <option value="fixed">Fixed</option>
                              <option value="percentage_of_basic">% of Basic</option>
                            </select>
                            <input
                              type="number"
                              step={alw.calculationMethod === 'percentage_of_basic' ? "0.01" : "1"}
                              value={alw.amount || ''}
                              onChange={e => {
                                const next = [...formData.allowances!];
                                next[idx].amount = Number(e.target.value) || 0;
                                handleChange('allowances', next);
                              }}
                              className="w-full p-2 text-xs border border-slate-200 rounded font-bold"
                              placeholder={alw.calculationMethod === 'percentage_of_basic' ? "e.g. 0.1" : "Amount"}
                            />
                          </div>
                          <div className="flex flex-col items-center gap-1 justify-center shrink-0 w-12">
                            <label className="text-[8px] font-black uppercase text-slate-400">Taxable</label>
                            <input 
                              type="checkbox"
                              checked={alw.isTaxable}
                              onChange={e => {
                                const next = [...formData.allowances!];
                                next[idx].isTaxable = e.target.checked;
                                handleChange('allowances', next);
                              }}
                              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                          </div>
                          <select
                            value={alw.frequency}
                            onChange={e => {
                              const next = [...formData.allowances!];
                              next[idx].frequency = e.target.value as any;
                              handleChange('allowances', next);
                            }}
                            className="w-24 p-2 text-[10px] border border-slate-200 rounded shrink-0"
                          >
                            <option value="recurring">Recurring</option>
                            <option value="one_time">One-Time</option>
                            <option value="conditional">Conditional</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => {
                              const next = formData.allowances!.filter((_, i) => i !== idx);
                              handleChange('allowances', next);
                            }}
                            className="p-2 text-rose-500 hover:bg-rose-50 rounded shrink-0 ml-auto md:ml-0"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      {alw.frequency === 'conditional' && (
                        <div className="flex px-1 mt-1">
                           <input
                             type="text"
                             value={alw.conditionExpression || ''}
                             onChange={e => {
                               const next = [...formData.allowances!];
                               next[idx].conditionExpression = e.target.value;
                               handleChange('allowances', next);
                             }}
                             className="w-full p-2 text-xs border border-slate-200 rounded bg-white text-emerald-700 font-mono focus:outline-none"
                             placeholder="Rule: e.g. serviceCount > 4, hours > 40"
                           />
                        </div>
                      )}
                    </div>
                 ))}
               </div>
             )}
          </div>

          <div className="space-y-4">
             <div className="border-b border-slate-100 pb-2 flex justify-between items-center">
               <h3 className="font-bold text-slate-900">Custom Deductions</h3>
               <button
                 type="button"
                 onClick={() => {
                   const defaultDeduction = { 
                     id: `ded-${Date.now()}`, 
                     profileId: formData.id, 
                     type: 'custom' as any, 
                     name: 'New Deduction', 
                     amount: 0, 
                     calculationMethod: 'fixed' as any,
                     frequency: 'recurring' as any 
                   };
                   handleChange('deductions', [...(formData.deductions || []), defaultDeduction]);
                 }}
                 className="text-indigo-600 hover:text-indigo-700 text-xs font-bold flex items-center gap-1"
               >
                 <Plus size={14} /> Add
               </button>
             </div>
             <p className="text-xs text-slate-500 italic">Deductions configured globally (e.g. taxes, union dues) apply automatically.</p>

             {formData.deductions && formData.deductions.length > 0 && (
               <div className="space-y-2">
                 {formData.deductions.map((ded, idx) => (
                   <div key={ded.id} className="flex flex-col gap-2 bg-slate-50 p-2 rounded border border-slate-200">
                     <div className="flex flex-col md:flex-row items-start md:items-center gap-2">
                       <div className="flex gap-2 w-full md:flex-1">
                         <select
                           value={ded.type}
                           onChange={e => {
                             const next = [...formData.deductions!];
                             next[idx].type = e.target.value as any;
                             // Set default names for common types
                             const names: Record<string, string> = {
                               tax: 'Additional Tax',
                               pension: 'Voluntary Pension',
                               loan: 'Loan Repayment',
                               advance: 'Salary Advance Recovery',
                               welfare: 'Welfare Contribution',
                               insurance: 'Insurance Premium',
                               disciplinary: 'Disciplinary Deduction',
                               monthly_contribution: 'Department Contribution'
                             };
                             if (names[e.target.value]) {
                               next[idx].name = names[e.target.value];
                             }
                             handleChange('deductions', next);
                           }}
                           className="w-1/2 md:w-32 p-2 text-xs border border-slate-200 rounded bg-white shadow-sm shrink-0"
                         >
                           <option value="custom">Custom</option>
                           <option value="tax">Additional Tax</option>
                           <option value="pension">Voluntary Pension</option>
                           <option value="loan">Loan Repayment</option>
                           <option value="advance">Salary Advance</option>
                           <option value="welfare">Welfare</option>
                           <option value="insurance">Insurance</option>
                           <option value="disciplinary">Disciplinary</option>
                           <option value="monthly_contribution">Monthly Contrib.</option>
                         </select>
                         <input
                           type="text"
                           value={ded.name}
                           onChange={e => {
                             const next = [...formData.deductions!];
                             next[idx].name = e.target.value;
                             handleChange('deductions', next);
                           }}
                           className="w-1/2 md:flex-1 p-2 text-xs border border-slate-200 rounded shrink-0"
                           placeholder="Deduction Name"
                         />
                       </div>
                       <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                         <div className="flex flex-col gap-1 w-24 shrink-0">
                           <select
                             value={ded.calculationMethod || 'fixed'}
                             onChange={e => {
                               const next = [...formData.deductions!];
                               next[idx].calculationMethod = e.target.value as any;
                               handleChange('deductions', next);
                             }}
                             className="w-full p-1 text-[10px] border border-slate-200 rounded bg-white"
                           >
                             <option value="fixed">Fixed</option>
                             <option value="percentage_of_basic">% of Basic</option>
                           </select>
                           <input
                             type="number"
                             step={ded.calculationMethod === 'percentage_of_basic' ? "0.01" : "1"}
                             value={ded.amount || ''}
                             onChange={e => {
                               const next = [...formData.deductions!];
                               next[idx].amount = Number(e.target.value) || 0;
                               handleChange('deductions', next);
                             }}
                             className="w-full p-2 text-xs border border-slate-200 rounded font-bold"
                             placeholder={ded.calculationMethod === 'percentage_of_basic' ? "e.g. 0.05" : "Amount"}
                           />
                         </div>
                         <select
                           value={ded.frequency}
                           onChange={e => {
                             const next = [...formData.deductions!];
                             next[idx].frequency = e.target.value as any;
                             handleChange('deductions', next);
                           }}
                           className="w-24 p-2 text-[10px] border border-slate-200 rounded shrink-0"
                         >
                           <option value="recurring">Recurring</option>
                           <option value="one_time">One-Time</option>
                           <option value="conditional">Conditional</option>
                         </select>
                         <button
                           type="button"
                           onClick={() => {
                             const next = formData.deductions!.filter((_, i) => i !== idx);
                             handleChange('deductions', next);
                           }}
                           className="p-2 text-rose-500 hover:bg-rose-50 rounded shrink-0 ml-auto md:ml-0"
                         >
                           <Trash2 size={16} />
                         </button>
                       </div>
                     </div>
                     {ded.frequency === 'conditional' && (
                       <div className="flex px-1 mt-1">
                          <input
                            type="text"
                            value={ded.conditionExpression || ''}
                            onChange={e => {
                              const next = [...formData.deductions!];
                              next[idx].conditionExpression = e.target.value;
                              handleChange('deductions', next);
                            }}
                            className="w-full p-2 text-xs border border-slate-200 rounded bg-white text-emerald-700 font-mono focus:outline-none"
                            placeholder="Rule formula"
                          />
                       </div>
                     )}
                   </div>
                 ))}
               </div>
             )}
          </div>

        </div>

        <div className="p-6 border-t border-slate-100 bg-white">
          <button 
            onClick={handleSave} 
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Save size={18} /> Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
