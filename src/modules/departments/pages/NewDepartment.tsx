import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  ChevronRight,
  Fingerprint,
  ArrowRight
} from 'lucide-react';
import { useFirebase } from '../../../components/FirebaseProvider';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../../lib/firebase';

interface NewDepartmentProps {
  onCancel: () => void;
  onSuccess?: () => void;
}

export default function NewDepartment({ onCancel, onSuccess }: NewDepartmentProps) {
  const { profile } = useFirebase();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Worship');
  const [description, setDescription] = useState('');
  const [isVisible, setIsVisible] = useState(true);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name || !category || !description) {
      alert("Name, category, and description are required.");
      return;
    }

    setSaving(true);
    try {
      await addDoc(collection(db, 'departments'), {
        name,
        category,
        description,
        isVisible,
        createdAt: serverTimestamp()
      });
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error(err);
      alert("Failed to create department");
      handleFirestoreError(err, OperationType.CREATE, 'departments');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="max-w-4xl w-full flex-1 flex flex-col mx-auto"
    >
      {/* Page Header */}
      <div className="mb-8">
        <nav className="flex items-center gap-2 text-xs font-medium text-slate-500 uppercase tracking-widest mb-3">
          <a href="#" className="hover:text-blue-600 transition-colors">Departments</a>
          <ChevronRight size={14} />
          <span className="text-slate-800 font-bold">Create Global Department</span>
        </nav>
        <h2 className="text-2xl font-bold text-slate-900">New Global Department</h2>
        <p className="text-slate-500 mt-1 text-sm">Define a new operational unit that will be available across all branches.</p>
      </div>

      {/* Form Grid */}
      <div className="space-y-6 flex-1">
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
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">Mission & Description</label>
              <textarea 
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Define the spiritual and operational goals of this department..." 
                rows={4}
                className="w-full bg-white border border-slate-200 rounded-lg py-2.5 px-3 focus:ring-1 focus:ring-blue-600 focus:border-blue-600 text-sm text-slate-800 placeholder:text-slate-400 transition-all outline-none resize-none"
              ></textarea>
            </div>
          </div>
        </section>

        {/* Configuration */}
        <section className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-slate-200">
            <h3 className="text-base font-semibold text-slate-900">Configuration</h3>
          </div>
          <div className="p-5 space-y-5">
            <div>
              <label className="flex items-center justify-between cursor-pointer group">
                <span className="text-sm font-medium text-slate-800">Global Visibility</span>
                <div 
                  onClick={() => setIsVisible(!isVisible)}
                  className={`relative w-9 h-5 rounded-full transition-colors ${isVisible ? 'bg-blue-600' : 'bg-slate-200'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm transition-all ${isVisible ? 'right-1' : 'left-1'}`}></div>
                </div>
              </label>
              <p className="text-xs text-slate-500 mt-1">Visible to all church members across all branches.</p>
            </div>
          </div>
        </section>
      </div>

      {/* Actions */}
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-end gap-3 pt-6 border-t border-slate-200">
        <button onClick={onCancel} className="text-slate-600 font-medium text-sm px-5 py-2.5 hover:bg-slate-100 rounded-lg transition-colors w-full sm:w-auto">
          Cancel
        </button>
        <button 
          onClick={handleSave} 
          disabled={saving}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 w-full sm:w-auto disabled:opacity-50"
        >
          {saving ? 'Creating...' : 'Create Global Department'}
          {!saving && <ArrowRight size={16} />}
        </button>
      </div>
    </motion.div>
  );
}
