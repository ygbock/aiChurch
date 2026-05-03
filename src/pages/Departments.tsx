import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Plus, 
  Search, 
  Filter, 
  ChevronRight,
  Users,
  Banknote,
  CheckSquare,
  MoreVertical,
  ArrowRight,
  Music,
  UserCheck,
  Zap,
  Heart
} from 'lucide-react';
import NewDepartment from './NewDepartment';
import { useFirebase } from '../components/FirebaseProvider';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

interface DepartmentData {
  id: string;
  name: string;
  category: string;
  mission: string;
  headName: string;
  isVisible: boolean;
  budgetLimit: number;
}

export default function Departments() {
  const { profile } = useFirebase();
  const navigate = useNavigate();
  const [showNewForm, setShowNewForm] = useState(false);
  const [departments, setDepartments] = useState<DepartmentData[]>([]);

  useEffect(() => {
    if (!profile?.districtId || !profile?.branchId) return;

    const ref = collection(db, 'districts', profile.districtId, 'branches', profile.branchId, 'departments');
    const unsubscribe = onSnapshot(ref, (snap) => {
      const results: DepartmentData[] = [];
      snap.forEach(doc => {
        results.push({ id: doc.id, ...doc.data() } as DepartmentData);
      });
      setDepartments(results);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'departments');
    });

    return () => unsubscribe();
  }, [profile]);

  if (showNewForm) {
    return (
      <div className="space-y-6">
        <button 
          onClick={() => setShowNewForm(false)}
          className="text-sm font-bold text-slate-500 hover:text-blue-600 flex items-center gap-2 mb-4 transition-colors"
        >
          <ArrowRight size={16} className="rotate-180" />
          Back to Departments
        </button>
        <NewDepartment onCancel={() => setShowNewForm(false)} onSuccess={() => setShowNewForm(false)} />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Departments</h2>
          <p className="text-slate-500 text-sm">Manage church operational units, staffing, and departmental goals.</p>
        </div>
        <button 
          onClick={() => setShowNewForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
        >
          <Plus size={18} />
          New Department
        </button>
      </div>

      {/* Department Stats */}
      <div className="grid grid-cols-3 gap-4 sm:gap-6">
        <StatCard label="Total Departments" value={departments.length.toString()} icon={<Building2 className="text-blue-600" size={20} />} trend="Active units" />
        <StatCard label="Total Staff" value="--" icon={<Users className="text-emerald-600" size={20} />} trend="Assigned workers" />
        <StatCard label="Total Budget" value={`$${departments.reduce((acc, curr) => acc + (curr.budgetLimit || 0), 0) || '0'}`} icon={<Banknote className="text-purple-600" size={20} />} trend="Allocated funds" />
      </div>

      {/* Departments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departments.length === 0 ? (
          <div className="col-span-3 py-16 text-center text-slate-500">
            No departments defined yet.
          </div>
        ) : (
          departments.map(dept => (
            <DepartmentCard 
              key={dept.id}
              title={dept.name} 
              category={dept.category} 
              members={0} 
              head={dept.headName || 'Not Assigned'} 
              onDashboardClick={() => navigate(`/departments/${dept.id}`)}
              icon={
                dept.category === 'Worship' ? <Music className="text-blue-600" /> :
                dept.category === 'Administration' ? <Banknote className="text-orange-600" /> :
                dept.category === 'Outreach' ? <Heart className="text-rose-600" /> :
                <Building2 className="text-slate-600" />
              }
              color={
                dept.category === 'Worship' ? 'bg-blue-50' :
                dept.category === 'Administration' ? 'bg-orange-50' :
                dept.category === 'Outreach' ? 'bg-rose-50' :
                'bg-slate-50'
              }
            />
          ))
        )}
      </div>
    </motion.div>
  );
}

function StatCard({ label, value, icon, trend }: { label: string, value: string, icon: React.ReactNode, trend: string }) {
  return (
    <div className="bg-white p-3 sm:p-6 rounded-xl border border-slate-200 shadow-sm">
      <div className="flex justify-between items-start mb-2 sm:mb-4">
        <div className="p-1.5 sm:p-2 bg-slate-50 rounded-lg shrink-0">
          {icon}
        </div>
        <span className="hidden sm:inline-block text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">{trend}</span>
      </div>
      <div>
        <p className="text-[9px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 truncate" title={label}>{label}</p>
        <p className="text-lg sm:text-2xl font-bold text-slate-900">{value}</p>
      </div>
    </div>
  );
}

const DepartmentCard: React.FC<{ 
  title: string, 
  category: string, 
  members: number, 
  head: string, 
  icon: React.ReactNode, 
  color: string,
  onDashboardClick: () => void 
}> = ({ title, category, members, head, icon, color, onDashboardClick }) => {
  return (
    <div 
      onClick={onDashboardClick}
      className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:border-blue-200 transition-all group cursor-pointer"
    >
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className={`p-3 rounded-xl ${color} group-hover:scale-110 transition-transform`}>
            {icon}
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
            }}
            className="text-slate-400 hover:text-slate-600"
          >
            <MoreVertical size={18} />
          </button>
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">{title}</h3>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">{category}</p>
        
        <div className="space-y-3 pt-4 border-t border-slate-50">
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-500 flex items-center gap-2">
              <Users size={14} />
              Members
            </span>
            <span className="font-bold text-slate-900">{members}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-500 flex items-center gap-2">
              <UserCheck size={14} />
              Head
            </span>
            <span className="font-bold text-slate-900">{head}</span>
          </div>
        </div>
      </div>
      <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Active</span>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onDashboardClick();
          }}
          className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          Dashboard
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
