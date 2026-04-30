import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  ChevronRight,
  Fingerprint,
  UserCheck,
  X,
  Wallet,
  UserPlus,
  Trash2,
  ArrowRight,
  Search
} from 'lucide-react';
import { useFirebase } from '../components/FirebaseProvider';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface NewDepartmentProps {
  onCancel: () => void;
  onSuccess?: () => void;
}

export default function NewDepartment({ onCancel, onSuccess }: NewDepartmentProps) {
  const { profile } = useFirebase();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Worship');
  const [mission, setMission] = useState('');
  const [headName, setHeadName] = useState('');
  const [isVisible, setIsVisible] = useState(true);
  const [budgetLimit, setBudgetLimit] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!profile?.districtId || !profile?.branchId) {
      alert("Missing branch context for department creation.");
      return;
    }
    if (!name || !category) {
      alert("Name and category are required.");
      return;
    }

    setSaving(true);
    try {
      await addDoc(collection(db, 'districts', profile.districtId, 'branches', profile.branchId, 'departments'), {
        name,
        category,
        mission,
        headName,
        headId: "", // Usually from member selection
        isVisible,
        budgetLimit: parseFloat(budgetLimit) || 0,
        branchId: profile.branchId,
        createdAt: new Date().toISOString()
      });
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error(err);
      alert("Failed to create department");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="max-w-6xl w-full flex-1 flex flex-col"
    >
      {/* Page Header */}
      <div className="mb-8">
        <nav className="flex items-center gap-2 text-xs font-medium text-slate-500 uppercase tracking-widest mb-3">
          <a href="#" className="hover:text-blue-600 transition-colors">Departments</a>
          <ChevronRight size={14} />
          <span className="text-slate-800 font-bold">Create New</span>
        </nav>
        <h2 className="text-2xl font-bold text-slate-900">New Department</h2>
        <p className="text-slate-500 mt-1 text-sm">Structure your ministry with a digital cathedral approach.</p>
      </div>

      {/* Form Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Department Identity */}
          <section className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center gap-3">
              <Fingerprint size={18} className="text-slate-500" />
              <h3 className="text-base font-semibold text-slate-900">Department Identity</h3>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="col-span-1">
                <label className="block text-xs font-semibold text-slate-800 mb-1.5">Department Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Creative Arts & Production" 
                  className="w-full bg-white border border-slate-200 rounded-lg py-2.5 px-3 focus:ring-1 focus:ring-blue-600 focus:border-blue-600 text-sm text-slate-800 placeholder:text-slate-400 transition-all outline-none"
                />
              </div>
              <div className="col-span-1">
                <label className="block text-xs font-semibold text-slate-800 mb-1.5">Category</label>
                <select 
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg py-2.5 px-3 focus:ring-1 focus:ring-blue-600 focus:border-blue-600 text-sm text-slate-800 transition-all outline-none appearance-none"
                >
                  <option>Worship</option>
                  <option>Outreach</option>
                  <option>Administration</option>
                  <option>Youth & Children</option>
                  <option>Pastoral Care</option>
                </select>
              </div>
              <div className="col-span-1 sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-800 mb-1.5">Mission & Purpose</label>
                <textarea 
                  value={mission}
                  onChange={e => setMission(e.target.value)}
                  placeholder="Define the spiritual and operational goals of this department..." 
                  rows={4}
                  className="w-full bg-white border border-slate-200 rounded-lg py-2.5 px-3 focus:ring-1 focus:ring-blue-600 focus:border-blue-600 text-sm text-slate-800 placeholder:text-slate-400 transition-all outline-none resize-none"
                ></textarea>
              </div>
            </div>
          </section>

          {/* Department Leadership */}
          <section className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center gap-3">
              <UserCheck size={18} className="text-slate-500" />
              <h3 className="text-base font-semibold text-slate-900">Department Leadership</h3>
            </div>
            <div className="p-5">
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">Head of Department (Name)</label>
              <div className="relative">
                <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" 
                  value={headName}
                  onChange={e => setHeadName(e.target.value)}
                  placeholder="Enter name of department head..." 
                  className="w-full bg-white border border-slate-200 rounded-lg py-2.5 pl-9 pr-3 focus:ring-1 focus:ring-blue-600 focus:border-blue-600 text-sm text-slate-800 placeholder:text-slate-400 transition-all outline-none"
                />
              </div>
            </div>
          </section>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-1 space-y-6">
          {/* Configuration */}
          <section className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-slate-200">
              <h3 className="text-base font-semibold text-slate-900">Configuration</h3>
            </div>
            <div className="p-5 space-y-5">
              <div>
                <label className="flex items-center justify-between cursor-pointer group">
                  <span className="text-sm font-medium text-slate-800">Visibility</span>
                  <div 
                    onClick={() => setIsVisible(!isVisible)}
                    className={`relative w-9 h-5 rounded-full transition-colors ${isVisible ? 'bg-blue-600' : 'bg-slate-200'}`}
                  >
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm transition-all ${isVisible ? 'right-1' : 'left-1'}`}></div>
                  </div>
                </label>
                <p className="text-xs text-slate-500 mt-1">Visible to all church members in the directory.</p>
              </div>
              
              <div className="pt-5 border-t border-slate-100">
                <label className="block text-xs font-semibold text-slate-800 mb-2">Budget Limit ($)</label>
                <input 
                  type="number" 
                  value={budgetLimit}
                  onChange={e => setBudgetLimit(e.target.value)}
                  placeholder="e.g. 5000" 
                  className="w-full bg-white border border-slate-200 rounded-lg py-2.5 px-3 focus:ring-1 focus:ring-blue-600 focus:border-blue-600 text-sm text-slate-800 placeholder:text-slate-400 transition-all outline-none"
                />
              </div>
            </div>
          </section>

          {/* Staffing */}
          <section className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-base font-semibold text-slate-900">Staffing</h3>
              <button className="text-blue-600 hover:text-blue-700 transition-colors">
                <UserPlus size={16} />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <StaffMember 
                name="Mark Thompson" 
                role="Coordinator" 
                img="https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" 
              />
              <StaffMember 
                name="Lydia Chen" 
                role="Assistant" 
                img="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" 
              />
            </div>
          </section>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-end gap-3 pt-6 border-t border-slate-200">
        <button onClick={onCancel} className="text-slate-600 font-medium text-sm px-5 py-2.5 hover:bg-slate-100 rounded-lg transition-colors w-full sm:w-auto">
          Cancel & Revert
        </button>
        <button 
          onClick={handleSave} 
          disabled={saving}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 w-full sm:w-auto disabled:opacity-50"
        >
          {saving ? 'Creating...' : 'Establish Department'}
          {!saving && <ArrowRight size={16} />}
        </button>
      </div>

      {/* Footer */}
      <footer className="mt-8 pb-4 text-center">
        <p className="text-xs text-slate-500">Built for the Eternal Sanctuary &copy; 2024</p>
      </footer>
    </motion.div>
  );
}

function StaffMember({ name, role, img }: { name: string, role: string, img: string }) {
  return (
    <div className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-lg border border-slate-100 group hover:border-slate-200 transition-colors">
      <img src={img} alt={name} className="w-8 h-8 rounded-full object-cover" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 truncate">{name}</p>
        <p className="text-xs text-slate-500">{role}</p>
      </div>
      <button className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-600 p-1.5 rounded-md transition-all">
        <Trash2 size={14} />
      </button>
    </div>
  );
}
