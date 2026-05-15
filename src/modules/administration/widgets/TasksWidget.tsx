import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';

export default function TasksWidget() {
    const navigate = useNavigate();
    return (
        <div className="flex flex-col h-full space-y-4">
            <div className="flex justify-between items-center mb-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">My Pipeline</p>
                <button onClick={() => navigate('/tasks')} className="text-xs font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest transition-colors">
                    View All
                </button>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center py-8 text-center space-y-4 border border-dashed border-slate-200 rounded-2xl bg-slate-50">
                <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-slate-300 shadow-sm">
                    <CheckCircle2 size={24} />
                </div>
                <div>
                   <p className="text-sm font-bold text-slate-500">No pending tasks</p>
                   <p className="text-xs text-slate-400">You're all caught up!</p>
                </div>
            </div>
        </div>
    );
}
