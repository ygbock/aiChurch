import React from 'react';
import { Zap } from 'lucide-react';

export default function FinanceMetricsWidget() {
    return (
        <div className="bg-emerald-50 p-4 sm:p-6 md:p-8 rounded-[1.25rem] sm:rounded-[1.5rem] md:rounded-[2rem] border border-emerald-200 shadow-sm relative overflow-hidden group transition-all flex flex-col justify-between">
          <div className="p-2 w-8 h-8 sm:w-10 sm:h-10 md:p-2.5 md:w-12 md:h-12 rounded-lg sm:rounded-xl md:rounded-2xl flex items-center justify-center mb-3 sm:mb-4 md:mb-6 transition-all group-hover:scale-110 shadow-sm shrink-0 bg-emerald-100 text-emerald-600">
            <Zap className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[8px] sm:text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5 sm:mb-1 truncate">Tithe Revenue</p>
            <div className="flex flex-wrap items-baseline gap-x-1.5 sm:gap-x-2 gap-y-0.5 mt-0.5">
              <h4 className="text-lg sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-none">$42.5k</h4>
              <span className="text-[8px] sm:text-[9px] md:text-[10px] font-black leading-none text-emerald-600">
                +8%
              </span>
            </div>
          </div>
        </div>
    );
}
