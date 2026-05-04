import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, AlertTriangle, Info, CheckCircle2, Search, Filter, RefreshCw, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function SystemAlerts() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all');

  const alerts = [
    {
      id: 1,
      title: "Database Sync Lag",
      desc: "District 4 branches experiencing 5s delay in synchronization with main database.",
      type: "critical",
      timestamp: "10 min ago",
      status: "active"
    },
    {
      id: 2,
      title: "New License Request",
      desc: "Lagos Central Branch awaiting activation and license provisioning.",
      type: "info",
      timestamp: "1 hour ago",
      status: "active"
    },
    {
      id: 3,
      title: "Transfer Queue High",
      desc: "150+ member transfers pending Superadmin review.",
      type: "warning",
      timestamp: "2 hours ago",
      status: "active"
    },
    {
      id: 4,
      title: "Storage Warning",
      desc: "Media storage at 85% capacity in District 2.",
      type: "warning",
      timestamp: "5 hours ago",
      status: "active"
    },
    {
      id: 5,
      title: "Security Audit",
      desc: "Routine security audit completed successfully.",
      type: "info",
      timestamp: "1 day ago",
      status: "resolved"
    },
    {
      id: 6,
      title: "API Rate Limit Near",
      desc: "SMS gateway approaching daily rate limit (90%).",
      type: "warning",
      timestamp: "1 day ago",
      status: "active"
    },
    {
      id: 7,
      title: "Authentication Error Spike",
      desc: "Multiple failed login attempts detected from IP range 192.168.1.x",
      type: "critical",
      timestamp: "2 days ago",
      status: "resolved"
    }
  ];

  const filteredAlerts = alerts.filter(alert => filter === 'all' || alert.type === filter);

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical': return <ShieldAlert size={20} />;
      case 'warning': return <AlertTriangle size={20} />;
      case 'info': return <Info size={20} />;
      default: return <Info size={20} />;
    }
  };

  const getAlertColors = (type: string) => {
    switch (type) {
      case 'critical': return 'bg-red-50 border-red-100 text-red-600';
      case 'warning': return 'bg-orange-50 border-orange-100 text-orange-600';
      case 'info': return 'bg-blue-50 border-blue-100 text-blue-600';
      default: return 'bg-slate-50 border-slate-200 text-slate-600';
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-5xl mx-auto pb-12 w-full"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500"
          >
            <ChevronLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight uppercase">System Alerts</h1>
            <p className="text-sm text-slate-500 mt-1 font-medium">Monitor and manage platform notifications.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors shadow-sm">
            <RefreshCw size={16} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full sm:w-auto pb-1 sm:pb-0">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${filter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              All Alerts
            </button>
            <button
              onClick={() => setFilter('critical')}
              className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${filter === 'critical' ? 'bg-red-100 text-red-700' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
            >
              Critical
            </button>
            <button
              onClick={() => setFilter('warning')}
              className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${filter === 'warning' ? 'bg-orange-100 text-orange-700' : 'bg-orange-50 text-orange-600 hover:bg-orange-100'}`}
            >
              Warnings
            </button>
            <button
              onClick={() => setFilter('info')}
              className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${filter === 'info' ? 'bg-blue-100 text-blue-700' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
            >
              Info
            </button>
          </div>
          
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search alerts..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredAlerts.length > 0 ? (
            filteredAlerts.map(alert => (
              <div key={alert.id} className={`p-4 sm:p-6 flex flex-col sm:flex-row gap-4 sm:items-center hover:bg-slate-50 transition-colors ${alert.status === 'resolved' ? 'opacity-60' : ''}`}>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${getAlertColors(alert.type)}`}>
                  {getAlertIcon(alert.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-bold text-slate-800">{alert.title}</h3>
                    {alert.status === 'resolved' && (
                      <span className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                        <CheckCircle2 size={10} /> Resolved
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500">{alert.desc}</p>
                </div>
                
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-4 shrink-0">
                  <span className="text-xs font-semibold text-slate-400">{alert.timestamp}</span>
                  {alert.status === 'active' && (
                    <button className="text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors">
                      Mark Resolved
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-slate-500">
              <CheckCircle2 size={48} className="mx-auto mb-4 text-slate-300" />
              <p className="font-bold text-slate-700 mb-1">No alerts found</p>
              <p className="text-sm">There are no {filter !== 'all' ? filter : ''} system alerts at this time.</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
