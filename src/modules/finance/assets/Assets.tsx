import React, { useState } from 'react';
import { Camera, Plus, Barcode, Laptop } from 'lucide-react';

export default function Assets() {
  return (
    <div className="p-6 md:p-8 lg:p-10 max-w-7xl mx-auto space-y-8 pb-32">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Asset Management</h1>
          <p className="text-slate-500 text-sm mt-1">Track fixed assets, depreciation, and maintenance schedules.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 text-sm transition-colors shadow-sm flex items-center gap-2">
            <Plus size={16} /> Register Asset
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-bold text-slate-900">Registered Assets</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">QR / Tag ID</th>
                <th className="px-6 py-4">Item Name</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4">Purchase Value</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {[
                { tag: 'AST-VD-001', name: 'Sony FX3 Cinema Camera', cat: 'Cameras', dept: 'Media', val: 'Le 65,000.00', stat: 'Active' },
                { tag: 'AST-VS-004', name: 'Yamaha Motif Keyboard', cat: 'Instruments', dept: 'Music', val: 'Le 35,000.00', stat: 'Maintenance' },
                { tag: 'AST-CP-012', name: 'MacBook Pro 16"', cat: 'Computers', dept: 'Admin', val: 'Le 42,000.00', stat: 'Active' }
              ].map((row, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Barcode size={16} className="text-slate-400" />
                      <span className="font-mono text-xs font-bold text-slate-500">{row.tag}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-900">{row.name}</td>
                  <td className="px-6 py-4 text-slate-500">{row.cat}</td>
                  <td className="px-6 py-4 text-slate-500">{row.dept}</td>
                  <td className="px-6 py-4 font-bold text-slate-900">{row.val}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-[10px] uppercase font-bold rounded-full tracking-wider ${row.stat === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                      {row.stat}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
