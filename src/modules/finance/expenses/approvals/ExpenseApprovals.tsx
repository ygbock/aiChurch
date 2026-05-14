import React from 'react';
import { useExpenseStore } from '../stores/expenseStore';
import { CheckCircle2, XCircle, Clock, FileText } from 'lucide-react';

export default function ExpenseApprovals() {
  const { requests, updateRequest } = useExpenseStore();
  
  const pendingRequests = requests.filter(r => r.status === 'Pending Approval' || r.status === 'Pending Review');
  
  const handleApprove = (id: string) => {
    updateRequest(id, { status: 'Approved' });
  };
  
  const handleReject = (id: string) => {
    updateRequest(id, { status: 'Rejected' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
         <h2 className="text-lg font-bold text-slate-900">Pending Approvals</h2>
         <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-1 rounded-full">{pendingRequests.length} pending</span>
      </div>

      <div className="grid gap-6">
        {pendingRequests.map(req => (
          <div key={req.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
             <div className="space-y-4 flex-1">
                <div className="flex items-start justify-between">
                   <div>
                     <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-1 bg-indigo-50 text-indigo-700 text-[10px] uppercase font-bold rounded tracking-wider">{req.priority} Priority</span>
                        <span className="flex items-center gap-1 text-xs text-amber-600 font-medium">
                          <Clock size={12} /> {req.status}
                        </span>
                     </div>
                     <h3 className="text-lg font-bold text-slate-900">{req.title}</h3>
                     <p className="text-sm text-slate-500">Requested by {req.requestedBy} • {new Date(req.createdAt).toLocaleDateString()}</p>
                   </div>
                   <div className="text-right">
                     <p className="text-sm text-slate-500">Amount</p>
                     <p className="text-xl font-bold text-emerald-600">Le {req.amount.toLocaleString()}</p>
                   </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                   <div>
                     <p className="text-slate-500 text-xs mb-1">Department</p>
                     <p className="font-medium text-slate-900">{req.departmentName}</p>
                   </div>
                   <div>
                     <p className="text-slate-500 text-xs mb-1">Category</p>
                     <p className="font-medium text-slate-900">{req.expenseType}</p>
                   </div>
                   <div className="md:col-span-2">
                     <p className="text-slate-500 text-xs mb-1">Description</p>
                     <p className="font-medium text-slate-900 truncate">{req.description}</p>
                   </div>
                </div>
             </div>

             <div className="flex sm:flex-col gap-3 shrink-0 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100 md:border-l md:pl-6">
                <button 
                  onClick={() => handleApprove(req.id)}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold transition-colors shadow-sm"
                >
                  <CheckCircle2 size={18} /> Approve
                </button>
                <button 
                  onClick={() => handleReject(req.id)}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-lg text-sm font-bold transition-colors"
                >
                  <XCircle size={18} /> Reject
                </button>
             </div>
          </div>
        ))}

        {pendingRequests.length === 0 && (
           <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
             <CheckCircle2 size={48} className="mx-auto mb-4 text-emerald-400" />
             <h3 className="text-lg font-bold text-slate-900 mb-1">All caught up!</h3>
             <p className="text-slate-500 text-sm">There are no pending expenses requiring your approval.</p>
           </div>
        )}
      </div>
    </div>
  );
}
