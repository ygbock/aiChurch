import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Download, 
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  BarChart,
  Loader2,
  Calendar
} from 'lucide-react';
import { useRole } from '../components/Layout';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useFirebase } from '../components/FirebaseProvider';

interface TransactionData {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: any;
}

export default function Financials() {
  const { role } = useRole();
  const { profile } = useFirebase();
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const districtId = profile?.districtId || 'default-district';
    const branchId = profile?.branchId || 'default-branch';
    const path = `/districts/${districtId}/branches/${branchId}/transactions`;
    
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

  const totals = transactions.reduce((acc, curr) => {
    if (curr.type === 'income') acc.income += curr.amount;
    else acc.expense += curr.amount;
    return acc;
  }, { income: 0, expense: 0 });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Financial Ledger</h2>
          <p className="text-slate-500 text-sm">
            {role === 'admin' ? 'Track tithes, offerings, and expenditures for Main Campus.' : 
             role === 'district' ? 'Consolidated financial oversight for North America District.' :
             'Global financial tracking across all districts and branches.'}
          </p>
        </div>
        <div className="flex gap-2">
          <button className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg font-medium text-sm hover:bg-slate-50 transition-colors flex items-center gap-2">
            <Download size={18} />
            Export Report
          </button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm">
            <DollarSign size={18} />
            Record Transaction
          </button>
        </div>
      </div>

      {/* Financial Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <DollarSign size={20} />
            </div>
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
              <ArrowUpRight size={14} />
              +12.5%
            </span>
          </div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Revenue (MTD)</p>
          <p className="text-2xl font-bold text-slate-900">${totals.income.toLocaleString()}.00</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-orange-50 rounded-lg text-orange-600">
              <TrendingDown size={20} />
            </div>
            <span className="text-xs font-bold text-orange-600 flex items-center gap-1">
              <ArrowUpRight size={14} />
              +4.2%
            </span>
          </div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Expenses (MTD)</p>
          <p className="text-2xl font-bold text-slate-900">${totals.expense.toLocaleString()}.00</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <TrendingUp size={20} />
            </div>
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
              <ArrowUpRight size={14} />
              +18.3%
            </span>
          </div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Net Balance</p>
          <p className="text-2xl font-bold text-slate-900">${(totals.income - totals.expense).toLocaleString()}.00</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Transaction History */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col min-h-[300px]">
          <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
            <h3 className="text-base font-semibold text-slate-900">Recent Transactions</h3>
            <button className="text-slate-400 hover:text-slate-600">
              <Filter size={18} />
            </button>
          </div>
          
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="animate-spin text-blue-600" size={32} />
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Initialising Ledger...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-6">
               <DollarSign className="text-slate-200 mb-2" size={48} />
               <h4 className="font-bold text-slate-900">No Transactions Yet</h4>
               <p className="text-xs text-slate-500">Your financial records will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.map((tx: TransactionData) => (
                    <TransactionRow 
                      key={tx.id}
                      desc={tx.description} 
                      cat={tx.category} 
                      date={tx.date?.seconds ? new Date(tx.date.seconds * 1000).toLocaleDateString() : 'N/A'} 
                      amount={`${tx.type === 'income' ? '+' : '-'}$${tx.amount.toLocaleString()}`} 
                      type={tx.type as 'income' | 'expense'} 
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Budget Allocation Chart Placeholder */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-200">
            <h3 className="text-base font-semibold text-slate-900">Budget Allocation</h3>
          </div>
          <div className="p-8 flex flex-col items-center justify-center flex-1 text-center">
            <div className="w-32 h-32 rounded-full border-8 border-slate-100 border-t-blue-600 border-r-emerald-500 border-b-orange-400 flex items-center justify-center mb-6">
              <PieChart size={32} className="text-slate-300" />
            </div>
            <div className="space-y-3 w-full">
              <BudgetLegend label="Ministries" percent="45%" color="bg-blue-600" />
              <BudgetLegend label="Operations" percent="30%" color="bg-emerald-500" />
              <BudgetLegend label="Outreach" percent="15%" color="bg-orange-400" />
              <BudgetLegend label="Savings" percent="10%" color="bg-slate-300" />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

interface TransactionRowProps {
  desc: string;
  cat: string;
  date: string;
  amount: string;
  type: 'income' | 'expense';
}

const TransactionRow: React.FC<TransactionRowProps> = ({ desc, cat, date, amount, type }) => {
  return (
    <tr className="hover:bg-slate-50 transition-colors">
      <td className="px-6 py-4">
        <p className="text-sm font-semibold text-slate-800">{desc}</p>
      </td>
      <td className="px-6 py-4">
        <span className="text-xs font-medium text-slate-500 px-2 py-1 bg-slate-100 rounded-md">{cat}</span>
      </td>
      <td className="px-6 py-4 text-sm text-slate-500">{date}</td>
      <td className={`px-6 py-4 text-sm font-bold text-right ${type === 'income' ? 'text-emerald-600' : 'text-orange-600'}`}>
        {amount}
      </td>
    </tr>
  );
};

function BudgetLegend({ label, percent, color }: { label: string, percent: string, color: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${color}`}></div>
        <span className="text-xs font-medium text-slate-600">{label}</span>
      </div>
      <span className="text-xs font-bold text-slate-900">{percent}</span>
    </div>
  );
}
