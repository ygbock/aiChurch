import React from 'react';
import { ShoppingCart, Plus, Filter, FileText } from 'lucide-react';

export default function Procurement() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
           <h2 className="text-lg font-bold text-slate-900">Purchase Orders</h2>
           <p className="text-sm text-slate-500">Manage and track procurement requests.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 border border-slate-300 bg-white text-slate-700 font-medium rounded-lg hover:bg-slate-50 text-sm transition-colors flex items-center gap-2">
            <Filter size={16} /> Filter
          </button>
          <button className="px-4 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 text-sm transition-colors shadow-sm flex items-center gap-2">
            <Plus size={16} /> Create PO
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold tracking-widest border-b border-slate-100">
            <tr>
              <th className="px-6 py-4">PO Number</th>
              <th className="px-6 py-4">Vendor</th>
              <th className="px-6 py-4">Delivery Date</th>
              <th className="px-6 py-4 text-right">Amount</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            <tr>
              <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                <ShoppingCart size={32} className="mx-auto mb-3 text-slate-300" />
                <p>No purchase orders found.</p>
                <button className="mt-4 text-sm font-bold text-emerald-600 hover:text-emerald-700">
                  Create your first PO
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
