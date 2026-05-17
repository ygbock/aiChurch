import React from 'react';
import { 
  Users, 
  FileText, 
  AlertCircle,
  Calendar,
  Clock,
  TrendingUp,
  Briefcase
} from 'lucide-react';

export default function HrDashboard() {
  return (
    <div className="p-6 md:p-8 lg:p-10 max-w-7xl mx-auto space-y-8 pb-32">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">HR Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Manage personnel, contracts, and organizational health.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 text-sm transition-colors shadow-sm">
            Add Employee
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Employees" 
          amount="142" 
          trend="+3 this month" 
          isPositive={true} 
          icon={<Users size={20} className="text-indigo-600" />} 
        />
        <StatCard 
          title="Active Contracts" 
          amount="138" 
          trend="4 expiring soon" 
          isPositive={false} 
          icon={<FileText size={20} className="text-orange-600" />} 
        />
        <StatCard 
          title="Open Positions" 
          amount="12" 
          trend="3 new requests" 
          isPositive={true} 
          trendNeutral 
          icon={<Briefcase size={20} className="text-emerald-600" />} 
        />
        <StatCard 
          title="Absence Rate" 
          amount="2.4%" 
          trend="-0.5% vs last month" 
          isPositive={true} 
          icon={<AlertCircle size={20} className="text-rose-600" />} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
           <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
             <div className="p-6 border-b border-slate-100">
                <h3 className="font-bold text-slate-900">Recent Onboarding & Contracts</h3>
             </div>
             <div className="p-0">
               <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase">Employee</th>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase">Role</th>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase">Action Needed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="hover:bg-slate-50">
                      <td className="p-4 font-medium text-slate-900">Sarah Osei</td>
                      <td className="p-4 text-sm text-slate-500">Youth Pastor</td>
                      <td className="p-4"><span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] uppercase font-bold rounded-full">Active</span></td>
                      <td className="p-4 text-sm text-slate-500">None</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-4 font-medium text-slate-900">Michael Mensah</td>
                      <td className="p-4 text-sm text-slate-500">Facilities Manager</td>
                      <td className="p-4"><span className="px-2 py-1 bg-orange-100 text-orange-700 text-[10px] uppercase font-bold rounded-full">Expiring</span></td>
                      <td className="p-4 text-sm text-indigo-600 font-medium cursor-pointer">Renew Contract</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-4 font-medium text-slate-900">David Nwachukwu</td>
                      <td className="p-4 text-sm text-slate-500">Media Lead</td>
                      <td className="p-4"><span className="px-2 py-1 bg-blue-100 text-blue-700 text-[10px] uppercase font-bold rounded-full">Onboarding</span></td>
                      <td className="p-4 text-sm text-indigo-600 font-medium cursor-pointer">Complete Setup</td>
                    </tr>
                  </tbody>
               </table>
             </div>
           </div>
        </div>

        <div className="space-y-6">
           <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
             <div className="p-6 border-b border-slate-100">
                <h3 className="font-bold text-slate-900">Pending Approvals</h3>
             </div>
             <div className="p-6 space-y-4">
                <div className="flex items-start gap-4 p-3 bg-slate-50 rounded-xl">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <Calendar size={16} className="text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Leave Request</h4>
                    <p className="text-xs text-slate-500 mt-1">Jane Smith (3 days)</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-3 bg-slate-50 rounded-xl">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <TrendingUp size={16} className="text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Salary Advance</h4>
                    <p className="text-xs text-slate-500 mt-1">Michael Ofori (Finance to review)</p>
                  </div>
                </div>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, amount, trend, isPositive, trendNeutral, icon }: any) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 bg-slate-50 rounded-xl">
          {icon}
        </div>
        <span className={`text-xs font-bold px-2 py-1 rounded-full ${trendNeutral ? 'bg-slate-100 text-slate-600' : isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
          {trend}
        </span>
      </div>
      <div>
        <p className="text-sm text-slate-500 font-medium mb-1">{title}</p>
        <h4 className="text-2xl font-black text-slate-900 tracking-tight">{amount}</h4>
      </div>
    </div>
  );
}
