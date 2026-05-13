import React, { useState } from 'react';
import { 
  Heart, 
  TrendingUp, 
  Download, 
  Plus, 
  CreditCard,
  Smartphone,
  Building,
  QrCode,
  DollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Donations() {
  const [activeTab, setActiveTab] = useState<'overview' | 'campaigns' | 'checkout' | 'history'>('overview');

  return (
    <div className="p-6 md:p-8 lg:p-10 max-w-7xl mx-auto space-y-8 pb-32">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Donations & Offerings</h1>
          <p className="text-slate-500 text-sm mt-1">Manage contributions, campaigns, and payments.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setActiveTab('checkout')}
            className="px-4 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 text-sm transition-colors shadow-sm flex items-center gap-2"
          >
            <Plus size={16} /> New Donation
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-slate-200/50 p-1 rounded-xl w-fit">
        {['overview', 'campaigns', 'checkout', 'history'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2 text-sm font-medium rounded-lg capitalize transition-colors ${activeTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600"><Heart size={20} /></div>
                  <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-2 py-1 rounded-full">+14.2%</span>
                </div>
                <p className="text-sm font-medium text-slate-500 mb-1">Total Giving (MTD)</p>
                <h4 className="text-3xl font-black text-slate-900">Le 45,200.00</h4>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-blue-50 rounded-xl text-blue-600"><TrendingUp size={20} /></div>
                  <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2 py-1 rounded-full">24 Active</span>
                </div>
                <p className="text-sm font-medium text-slate-500 mb-1">Campaign Progress</p>
                <h4 className="text-3xl font-black text-slate-900">Le 112,400.00</h4>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-purple-50 rounded-xl text-purple-600"><DollarSign size={20} /></div>
                  <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded-full">145 Donors</span>
                </div>
                <p className="text-sm font-medium text-slate-500 mb-1">Average Gift</p>
                <h4 className="text-3xl font-black text-slate-900">Le 250.00</h4>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-900">Recent Donations</h3>
                <button className="text-sm text-emerald-600 font-medium hover:text-emerald-700">View All</button>
              </div>
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold tracking-widest border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Donor / Member</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Method</th>
                    <th className="px-6 py-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {[
                    { date: 'Today, 10:42 AM', name: 'James Koroma', cat: 'Tithe', method: 'Orange Money', amount: 'Le 1,500.00' },
                    { date: 'Today, 09:15 AM', name: 'Anonymous', cat: 'Offering', method: 'Cash', amount: 'Le 200.00' },
                    { date: 'Yesterday', name: 'Sarah Bangura', cat: 'Building Fund', method: 'Bank Transfer', amount: 'Le 5,000.00' },
                  ].map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-slate-500">{row.date}</td>
                      <td className="px-6 py-4 font-medium text-slate-900">{row.name}</td>
                      <td className="px-6 py-4"><span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium">{row.cat}</span></td>
                      <td className="px-6 py-4 text-slate-500">{row.method}</td>
                      <td className="px-6 py-4 font-bold text-emerald-600 text-right">{row.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {activeTab === 'checkout' && (
          <motion.div key="checkout" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-2xl mx-auto space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <CreditCard size={32} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Process Donation</h2>
                <p className="text-slate-500">Record a new contribution or process a mobile money payment via Monime.</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2">Donation Type</label>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                    {['Tithe', 'Offering', 'Pledge', 'Building Fund', 'First Fruit', 'Other'].map(type => (
                      <button key={type} className="px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:border-emerald-500 hover:bg-emerald-50 transition-all text-center">
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2">Amount (SLL)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">Le</span>
                    <input type="number" placeholder="0.00" className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2">Payment Method</label>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <label className="flex flex-col items-center gap-2 p-4 border border-slate-200 rounded-xl cursor-pointer hover:border-emerald-500 bg-white">
                      <input type="radio" name="method" className="sr-only" />
                      <Smartphone size={24} className="text-orange-500" />
                      <span className="text-xs font-bold text-center">Orange Money</span>
                    </label>
                    <label className="flex flex-col items-center gap-2 p-4 border border-slate-200 rounded-xl cursor-pointer hover:border-emerald-500 bg-white">
                      <input type="radio" name="method" className="sr-only" />
                      <Smartphone size={24} className="text-purple-600" />
                      <span className="text-xs font-bold text-center">Afrimoney</span>
                    </label>
                    <label className="flex flex-col items-center gap-2 p-4 border border-slate-200 rounded-xl cursor-pointer hover:border-emerald-500 bg-white">
                      <input type="radio" name="method" className="sr-only" />
                      <Building size={24} className="text-blue-600" />
                      <span className="text-xs font-bold text-center">Bank Tx</span>
                    </label>
                    <label className="flex flex-col items-center gap-2 p-4 border border-slate-200 rounded-xl cursor-pointer hover:border-emerald-500 bg-white">
                      <input type="radio" name="method" className="sr-only" />
                      <QrCode size={24} className="text-slate-700" />
                      <span className="text-xs font-bold text-center">Cash/QR</span>
                    </label>
                  </div>
                </div>

                <div className="pt-4">
                  <button className="w-full py-4 bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-colors">
                    Process Payment with Monime
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
