import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Download, 
  Filter,
  ArrowUpRight,
  PieChart as PieChartIcon,
  BarChart,
  Loader2,
  Calendar,
  Plus,
  Search,
  Wallet,
  ArrowRight,
  X
} from 'lucide-react';
import { useRole } from '../components/Layout';
import { collection, onSnapshot, query, orderBy, limit, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useFirebase } from '../components/FirebaseProvider';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid 
} from 'recharts';

interface TransactionData {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: any;
  memberId?: string;
}

const budgetData = [
  { name: 'Ministries', value: 4500, color: '#2563eb' },
  { name: 'Operations', value: 3000, color: '#10b981' },
  { name: 'Outreach', value: 1500, color: '#f59e0b' },
  { name: 'Infrastructure', value: 1000, color: '#6366f1' },
];

const cashFlowData = [
  { name: 'Jan', income: 4200, expense: 3100 },
  { name: 'Feb', income: 3800, expense: 2900 },
  { name: 'Mar', income: 5100, expense: 3400 },
  { name: 'Apr', income: 4900, expense: 3800 },
  { name: 'May', income: 5900, expense: 4100 },
  { name: 'Jun', income: 6300, expense: 4200 },
];

export default function Financials() {
  const { role } = useRole();
  const { profile } = useFirebase();
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newTx, setNewTx] = useState({
    description: '',
    amount: '',
    type: 'income',
    category: 'Tithes'
  });

  useEffect(() => {
    const districtId = profile?.districtId || 'default-district';
    const branchId = profile?.branchId || 'default-branch';
    const path = `districts/${districtId}/branches/${branchId}/transactions`;
    
    const q = query(
      collection(db, path),
      orderBy('date', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as TransactionData[];
      
      setTransactions(docs);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'transactions');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profile]);

  const handleRecordTx = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTx.description || !newTx.amount) return;

    try {
      const districtId = profile?.districtId || 'default-district';
      const branchId = profile?.branchId || 'default-branch';
      const path = `districts/${districtId}/branches/${branchId}/transactions`;
      
      await addDoc(collection(db, path), {
        ...newTx,
        amount: parseFloat(newTx.amount),
        date: serverTimestamp()
      });

      setShowModal(false);
      setNewTx({ description: '', amount: '', type: 'income', category: 'Tithes' });
    } catch (err) {
      console.error("Failed to record transaction:", err);
    }
  };

  const totals = transactions.reduce((acc, curr) => {
    if (curr.type === 'income') acc.income += curr.amount;
    else acc.expense += curr.amount;
    return acc;
  }, { income: 0, expense: 0 });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 pb-12"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full -mr-32 -mt-32 opacity-50 z-0" />
        
        <div className="relative z-10">
          <h2 className="text-3xl font-bold text-slate-900 leading-tight">Financial Ledger</h2>
          <p className="text-slate-500 mt-2 max-w-md">
            {role === 'admin' ? 'Advanced fiscal management and audit logs for your branch location.' : 
             role === 'district' ? 'Consolidated financial intelligence for the North America District.' :
             'System-wide financial auditing and global currency conversions.'}
          </p>
        </div>

        <div className="flex gap-3 relative z-10">
          <button className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm">
            <Download size={18} />
            Export Audit
          </button>
          <button 
            onClick={() => setShowModal(true)}
            className="bg-slate-900 text-white px-8 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-800 transition-all flex items-center gap-2 shadow-xl shadow-slate-200"
          >
            <Plus size={18} />
            Add Entry
          </button>
        </div>
      </div>

      {/* Financial Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard 
          label="Income (MTD)" 
          value={`$${totals.income.toLocaleString()}`} 
          trend="+12.5%" 
          color="blue"
          icon={<ArrowUpRight size={20} />}
        />
        <StatCard 
          label="Expenses (MTD)" 
          value={`$${totals.expense.toLocaleString()}`} 
          trend="+4.2%" 
          color="rose"
          icon={<TrendingDown size={20} />}
        />
        <StatCard 
          label="Net Balance" 
          value={`$${(totals.income - totals.expense).toLocaleString()}`} 
          trend="+18.3%" 
          color="emerald"
          icon={<Wallet size={20} />}
        />
        <StatCard 
          label="Projected Savings" 
          value="$12,450" 
          trend="+2.1%" 
          color="amber"
          icon={<TrendingUp size={20} />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Trend Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-8">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Cash Flow Trends</h3>
              <p className="text-xs text-slate-400 font-black uppercase tracking-widest mt-1">H1 Performance Review</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-600 rounded-full" />
                <span className="text-[10px] font-black text-slate-400 uppercase">Income</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-rose-500 rounded-full" />
                <span className="text-[10px] font-black text-slate-400 uppercase">Expense</span>
              </div>
            </div>
          </div>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cashFlowData}>
                <defs>
                  <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} dy={10} />
                <YAxis hide />
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }} />
                <Area type="monotone" dataKey="income" stroke="#2563eb" strokeWidth={4} fillOpacity={1} fill="url(#colorInc)" dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} />
                <Area type="monotone" dataKey="expense" stroke="#f43f5e" strokeWidth={2} fill="none" strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Budget Allocation */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
           <div>
            <h3 className="text-xl font-bold text-slate-900">Budget Allocation</h3>
            <p className="text-xs text-slate-400 font-black uppercase tracking-widest mt-1">Resource Distribution</p>
          </div>

          <div className="relative h-48 my-6">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={budgetData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {budgetData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-slate-900">75%</span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Efficiency</span>
            </div>
          </div>

          <div className="space-y-3">
            {budgetData.map(item => (
              <div key={item.name} className="flex justify-between items-center group">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs font-bold text-slate-600 group-hover:text-slate-900 transition-colors">{item.name}</span>
                </div>
                <span className="text-xs font-black text-slate-900 tracking-tighter">${item.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h3 className="text-xl font-bold text-slate-900">Recent Transactions</h3>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search audit trail..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="animate-spin text-blue-600" size={32} />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Securing Ledger access...</span>
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-24 text-center space-y-4">
            <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200 mx-auto">
              <DollarSign size={32} />
            </div>
            <div>
              <p className="font-bold text-slate-900">No transactions recorded yet</p>
              <p className="text-xs text-slate-400">Start by recording tithes, offerings or bills.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Entry Details</th>
                  <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Classification</th>
                  <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Timestamp</th>
                  <th className="px-8 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                  <th className="px-8 py-4 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {transactions.map(tx => (
                  <TransactionListItem key={tx.id} tx={tx} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Transaction Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl shadow-2xl shadow-slate-900/20 w-full max-w-md overflow-hidden border border-slate-200"
          >
            <div className="px-8 py-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-slate-900 leading-none">Record Entry</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">New Ledger Transaction</p>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-white rounded-xl transition-colors text-slate-400"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleRecordTx} className="p-8 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Description</label>
                  <input 
                    type="text" 
                    value={newTx.description}
                    onChange={e => setNewTx({...newTx, description: e.target.value})}
                    placeholder="e.g. Sunday Offering - 1st Service"
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold placeholder:text-slate-300 focus:ring-2 focus:ring-blue-100 transition-all"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Amount ($)</label>
                    <input 
                      type="number" 
                      value={newTx.amount}
                      onChange={e => setNewTx({...newTx, amount: e.target.value})}
                      placeholder="0.00"
                      className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold placeholder:text-slate-300 focus:ring-2 focus:ring-blue-100 transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Type</label>
                    <select 
                      value={newTx.type}
                      onChange={e => setNewTx({...newTx, type: e.target.value as any})}
                      className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold text-slate-600 focus:ring-2 focus:ring-blue-100 transition-all appearance-none"
                    >
                      <option value="income">Income</option>
                      <option value="expense">Expense</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Category</label>
                  <select 
                    value={newTx.category}
                    onChange={e => setNewTx({...newTx, category: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold text-slate-600 focus:ring-2 focus:ring-blue-100 transition-all appearance-none"
                  >
                    <option value="Tithes">Tithes</option>
                    <option value="Offering">Offering</option>
                    <option value="Building Fund">Building Fund</option>
                    <option value="Missions">Missions</option>
                    <option value="Welfare">Welfare</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Salary">Salary</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <button 
                type="submit"
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
              >
                Record Transaction
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

function StatCard({ label, value, trend, color, icon }: any) {
  const colors: any = {
    blue: 'bg-blue-50 text-blue-600 shadow-blue-100',
    rose: 'bg-rose-50 text-rose-600 shadow-rose-100',
    emerald: 'bg-emerald-50 text-emerald-600 shadow-emerald-100',
    amber: 'bg-amber-50 text-amber-600 shadow-amber-100'
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm group hover:border-slate-300 transition-all relative overflow-hidden">
      <div className={`p-2 w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-all group-hover:scale-110 ${colors[color]}`}>
        {icon}
      </div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <div className="flex items-baseline gap-2">
        <p className="text-2xl font-bold text-slate-900 tracking-tight">{value}</p>
        <span className={`text-[10px] font-black ${color === 'rose' ? 'text-rose-500' : 'text-emerald-500'}`}>
          {trend}
        </span>
      </div>
    </div>
  );
}

function TransactionListItem({ tx }: { tx: TransactionData }) {
  const isIncome = tx.type === 'income';

  return (
    <tr className="hover:bg-slate-50/50 transition-colors group">
      <td className="px-8 py-5">
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isIncome ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
            {isIncome ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 leading-none">{tx.description}</p>
            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">ID: {tx.id.slice(0, 8)}</p>
          </div>
        </div>
      </td>
      <td className="px-8 py-5">
        <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-black uppercase tracking-widest">
          {tx.category}
        </span>
      </td>
      <td className="px-8 py-5">
        <div className="flex items-center gap-2 text-slate-400">
          <Calendar size={14} />
          <span className="text-xs font-bold text-slate-500">
            {tx.date?.seconds ? new Date(tx.date.seconds * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Pending...'}
          </span>
        </div>
      </td>
      <td className={`px-8 py-5 text-right font-bold text-sm tracking-tight ${isIncome ? 'text-emerald-600' : 'text-rose-600'}`}>
        {isIncome ? '+' : '-'}${tx.amount.toLocaleString()}
      </td>
      <td className="px-8 py-5 text-right opacity-0 group-hover:opacity-100 transition-opacity">
        <button className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-all">
          <ArrowRight size={16} />
        </button>
      </td>
    </tr>
  );
}
