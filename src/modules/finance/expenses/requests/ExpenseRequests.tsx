import React, { useState } from 'react';
import { useExpenseStore } from '../stores/expenseStore';
import { Search, Filter, MoreVertical, FileText, CheckCircle2, Clock, Scan } from 'lucide-react';
import ScanReceiptModal, { ExtractedData } from '../components/ScanReceiptModal';
import CreateExpenseDrawer from '../components/CreateExpenseDrawer';

export default function ExpenseRequests() {
  const { requests } = useExpenseStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [prefilledData, setPrefilledData] = useState<any>(null);

  const filteredRequests = requests.filter(r => 
    r.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.departmentName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleScanComplete = (data: ExtractedData) => {
    setPrefilledData(data);
    setIsDrawerOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search expenses..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 bg-white w-64"
            />
          </div>
          <button className="p-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 bg-white">
            <Filter size={18} />
          </button>
        </div>
        <div className="flex gap-3">
          <button 
             onClick={() => setIsScannerOpen(true)}
             className="px-4 py-2 border border-indigo-200 bg-indigo-50 text-indigo-700 font-medium rounded-lg hover:bg-indigo-100 text-sm transition-colors flex items-center gap-2"
          >
            <Scan size={16} /> Scan Invoice
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left max-w-full">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Request & Date</th>
                <th className="px-6 py-4">Department & Category</th>
                <th className="px-6 py-4">Requested By</th>
                <th className="px-6 py-4 text-right">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredRequests.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-900">{req.title}</p>
                    <p className="text-xs text-slate-500">{new Date(req.createdAt).toLocaleDateString()}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-slate-700">{req.departmentName}</p>
                    <p className="text-xs text-slate-500">{req.expenseType}</p>
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-medium">{req.requestedBy}</td>
                  <td className="px-6 py-4 text-slate-900 font-bold text-right">Le {req.amount.toLocaleString()}</td>
                  <td className="px-6 py-4">
                     <span className={`inline-flex px-2 py-1 rounded-full text-xs font-bold border ${
                       req.status.includes('Pending') ? 'bg-amber-50 text-amber-700 border-amber-200' :
                       req.status === 'Approved' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                       req.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                       'bg-slate-50 text-slate-700 border-slate-200'
                     }`}>
                       {req.status}
                     </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-1 text-slate-400 hover:text-slate-600 rounded">
                      <MoreVertical size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredRequests.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <FileText size={32} className="mx-auto mb-3 text-slate-300" />
                    <p>No expense requests found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <ScanReceiptModal 
        isOpen={isScannerOpen} 
        onClose={() => setIsScannerOpen(false)} 
        onComplete={handleScanComplete}
      />

      <CreateExpenseDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        prefilledData={prefilledData}
      />
    </div>
  );
}
