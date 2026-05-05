import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldAlert, AlertTriangle, Info, CheckCircle2, Search, 
  RefreshCw, ChevronLeft, Download, Trash2, CheckCircle,
  MoreVertical, ChevronDown, ChevronUp, ExternalLink,
  Activity, X, Settings2, Play, Square, CheckSquare
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Modal from '../components/Modal';

export default function SystemAlerts() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedAlerts, setExpandedAlerts] = useState<number[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedAlerts, setSelectedAlerts] = useState<number[]>([]);
  const [isLiveEnabled, setIsLiveEnabled] = useState(true);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'severity'>('newest');
  const [timeFilter, setTimeFilter] = useState<'all' | '24h' | '7d'>('all');

  const alertsData = [
    {
      id: 7,
      title: "Authentication Error Spike",
      desc: "Multiple failed login attempts detected from IP range 192.168.1.x",
      type: "critical",
      timestamp: "2 min ago",
      status: "resolved",
      details: {
        affectedSystem: "Firebase Auth",
        suggestedAction: "IP block has been engaged automatically. Monitor further activity.",
        errorTrace: "AuthError: too-many-requests"
      }
    },
    {
      id: 6,
      title: "API Rate Limit Near",
      desc: "SMS gateway approaching daily rate limit (90%).",
      type: "warning",
      timestamp: "10 min ago",
      status: "active",
      details: {
        affectedSystem: "Twilio Gateway",
        suggestedAction: "Increase daily spend limit or throttle bulk SMS broadcasts until reset.",
        errorTrace: "HTTP 429 Warning triggered from provider."
      }
    },
    {
      id: 5,
      title: "Database Sync Lag",
      desc: "District 4 branches experiencing 5s delay in synchronization with main database.",
      type: "critical",
      timestamp: "1 hour ago",
      status: "active",
      details: {
        affectedSystem: "Firestore Replication",
        suggestedAction: "Check region us-central1 connectivity for District 4 pool.",
        errorTrace: "TimeoutError: Reconnect limit exceeded on secondary node."
      }
    },
    {
      id: 4,
      title: "New License Request",
      desc: "Lagos Central Branch awaiting activation and license provisioning.",
      type: "info",
      timestamp: "3 hours ago",
      status: "active",
      details: {
        affectedSystem: "Billing / License Manager",
        suggestedAction: "Review branch documentation and manually approve license allocation.",
        errorTrace: null
      }
    },
    {
      id: 3,
      title: "Storage Warning",
      desc: "Media storage at 85% capacity in District 2.",
      type: "warning",
      timestamp: "1 day ago",
      status: "active",
      details: {
        affectedSystem: "Cloud Storage Bucket",
        suggestedAction: "Upgrade storage tier or run garbage collection on temporary media assets.",
        errorTrace: null
      }
    },
    {
      id: 2,
      title: "Transfer Queue High",
      desc: "150+ member transfers pending Superadmin review.",
      type: "warning",
      timestamp: "2 days ago",
      status: "active",
      details: {
        affectedSystem: "Transfer Service Worker",
        suggestedAction: "Bulk approve eligible transfers or clear orphaned transfer requests.",
        errorTrace: "System Warning: Queue threshold > 100 exceeded."
      }
    },
    {
      id: 1,
      title: "Security Audit",
      desc: "Routine security audit completed successfully.",
      type: "info",
      timestamp: "5 days ago",
      status: "resolved",
      details: {
        affectedSystem: "Compliance Monitor",
        suggestedAction: "No action required.",
        errorTrace: null
      }
    }
  ];

  const [alerts, setAlerts] = useState(alertsData);

  const toggleSelect = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedAlerts(prev => prev.includes(id) ? prev.filter(aid => aid !== id) : [...prev, id]);
  };

  const resolveSelected = () => {
    setAlerts(prev => prev.map(a => selectedAlerts.includes(a.id) ? { ...a, status: 'resolved' } : a));
    setSelectedAlerts([]);
  };

  const deleteSelected = () => {
    setAlerts(prev => prev.filter(a => !selectedAlerts.includes(a.id)));
    setSelectedAlerts([]);
  };

  const toggleExpand = (id: number) => {
    setExpandedAlerts(prev => 
      prev.includes(id) ? prev.filter(aid => aid !== id) : [...prev, id]
    );
  };

  const markAsResolved = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'resolved' } : a));
  };

  const markAllAsResolved = () => {
    setAlerts(prev => prev.map(a => ({ ...a, status: 'resolved' })));
  };

  const deleteResolved = () => {
    setAlerts(prev => prev.filter(a => a.status !== 'resolved'));
  };

  const filteredAlerts = alerts.filter(alert => {
    const matchesFilter = filter === 'all' || alert.type === filter;
    const matchesSearch = alert.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          alert.desc.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesTime = true;
    if (timeFilter === '24h') {
      matchesTime = alert.timestamp.includes('min') || alert.timestamp.includes('hour');
    } else if (timeFilter === '7d') {
      matchesTime = alert.timestamp.includes('min') || alert.timestamp.includes('hour') || alert.timestamp.includes('day');
    }

    return matchesFilter && matchesSearch && matchesTime;
  }).sort((a, b) => {
    if (sortBy === 'severity') {
      const severity = { critical: 3, warning: 2, info: 1 };
      const diff = severity[b.type as keyof typeof severity] - severity[a.type as keyof typeof severity];
      if (diff !== 0) return diff;
      return b.id - a.id;
    }
    if (sortBy === 'oldest') return a.id - b.id;
    return b.id - a.id; // newest
  });

  const toggleSelectAll = () => {
    if (selectedAlerts.length === filteredAlerts.length && filteredAlerts.length > 0) {
      setSelectedAlerts([]);
    } else {
      setSelectedAlerts(filteredAlerts.map(a => a.id));
    }
  };

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

  const stats = {
    total: alerts.filter(a => a.status === 'active').length,
    critical: alerts.filter(a => a.type === 'critical' && a.status === 'active').length,
    warning: alerts.filter(a => a.type === 'warning' && a.status === 'active').length,
    info: alerts.filter(a => a.type === 'info' && a.status === 'active').length,
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-5xl mx-auto pb-12 w-full"
    >
      <div className="flex flex-row items-center justify-between gap-2 sm:gap-4">
        <div className="flex items-center gap-1 sm:gap-3 flex-1 min-w-0">
          <button 
            onClick={() => navigate(-1)}
            className="p-1 sm:p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500 shrink-0 -ml-1 sm:ml-0"
          >
            <ChevronLeft size={24} />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight uppercase leading-tight sm:leading-none truncate">System Alerts</h1>
            <div className="flex items-center gap-2 mt-0.5 sm:mt-1">
              <p className="text-[10px] sm:text-sm text-slate-500 font-medium truncate sm:whitespace-normal">Monitor, diagnose, and resolve platform notifications.</p>
              {isLiveEnabled && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Live
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <button 
            onClick={() => setIsLiveEnabled(!isLiveEnabled)} 
            className={`hidden lg:flex items-center gap-2 px-3 py-2 border rounded-xl font-bold text-sm transition-colors shadow-sm ${
              isLiveEnabled 
                ? 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800' 
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {isLiveEnabled ? <Square size={14} className="fill-current" /> : <Play size={14} className="fill-current" />}
            {isLiveEnabled ? 'Pause Stream' : 'Live Updates'}
          </button>
          <button className="flex items-center justify-center w-9 h-9 sm:w-auto sm:h-auto sm:px-3 sm:py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors shadow-sm" title="Export Log">
            <Download size={18} className="sm:w-4 sm:h-4" />
            <span className="hidden sm:inline ml-2">Export</span>
          </button>
          <button 
            onClick={() => setIsSettingsModalOpen(true)}
            className="flex items-center justify-center w-9 h-9 sm:w-auto sm:h-auto sm:px-3 sm:py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors shadow-sm"
            title="Alert Settings"
          >
            <Settings2 size={18} className="sm:w-4 sm:h-4" />
            <span className="hidden sm:inline ml-2">Settings</span>
          </button>
          <button 
            onClick={handleRefresh}
            className={`flex items-center justify-center w-9 h-9 sm:w-auto sm:h-auto sm:p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 bg-white border border-slate-200 rounded-xl transition-all shadow-sm ${isRefreshing ? 'animate-spin text-blue-600 border-blue-200' : ''}`}
            title="Refresh System Alerts"
          >
            <RefreshCw size={18} className="sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* Analytics Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between cursor-pointer hover:border-slate-300 transition-colors" onClick={() => setFilter('all')}>
          <div className="flex justify-between items-start mb-2">
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
              <Activity size={16} />
            </div>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-0.5">Active Alerts</p>
            <p className="text-2xl font-black text-slate-800">{stats.total}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-red-100 shadow-sm flex flex-col justify-between cursor-pointer hover:border-red-200 transition-colors" onClick={() => setFilter('critical')}>
          <div className="flex justify-between items-start mb-2">
            <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
              <ShieldAlert size={16} />
            </div>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-0.5">Critical</p>
            <p className="text-2xl font-black text-slate-800">{stats.critical}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-orange-100 shadow-sm flex flex-col justify-between cursor-pointer hover:border-orange-200 transition-colors" onClick={() => setFilter('warning')}>
          <div className="flex justify-between items-start mb-2">
            <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
              <AlertTriangle size={16} />
            </div>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-0.5">Warnings</p>
            <p className="text-2xl font-black text-slate-800">{stats.warning}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm flex flex-col justify-between cursor-pointer hover:border-blue-200 transition-colors" onClick={() => setFilter('info')}>
          <div className="flex justify-between items-start mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <Info size={16} />
            </div>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-0.5">Information</p>
            <p className="text-2xl font-black text-slate-800">{stats.info}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col relative">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full lg:w-auto pb-1 lg:pb-0">
            <div 
              className="mr-2 flex items-center shrink-0 cursor-pointer p-1 rounded hover:bg-slate-100"
              onClick={toggleSelectAll}
              title="Select all loaded alerts"
            >
              {selectedAlerts.length > 0 && selectedAlerts.length === filteredAlerts.length ? (
                <CheckSquare size={18} className="text-blue-600" />
              ) : selectedAlerts.length > 0 ? (
                <div className="w-[18px] h-[18px] rounded-[3px] border border-blue-600 bg-blue-600 flex items-center justify-center">
                  <div className="w-2.5 h-0.5 bg-white rounded-sm"></div>
                </div>
              ) : (
                <Square size={18} className="text-slate-400" />
              )}
            </div>
            
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${filter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              All Types
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
          
          <div className="flex w-full lg:w-auto gap-2">
            <div className="hidden md:flex items-center gap-2 mr-2">
              <select 
                className="bg-transparent border-none text-xs font-bold text-slate-500 focus:ring-0 cursor-pointer"
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value as any)}
              >
                <option value="all">All Time</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
              </select>
              <div className="w-px h-4 bg-slate-200"></div>
              <select 
                className="bg-transparent border-none text-xs font-bold text-slate-500 focus:ring-0 cursor-pointer"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="severity">By Severity</option>
              </select>
            </div>
            <div className="relative flex-1 lg:w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search alerts..." 
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
            </div>
            
            <button 
              onClick={deleteResolved}
              className="flex items-center justify-center p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 border border-slate-200 rounded-lg transition-colors"
              title="Clear Resolved Alerts"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>

        <div className="divide-y divide-slate-100 mb-[72px] lg:mb-0">
          {filteredAlerts.length > 0 ? (
            filteredAlerts.map(alert => (
              <div key={alert.id} className={`flex flex-col hover:bg-slate-50 transition-colors ${alert.status === 'resolved' ? 'opacity-60 bg-slate-50/50' : ''} ${selectedAlerts.includes(alert.id) ? 'bg-blue-50/30' : ''}`}>
                <div 
                  className="p-4 sm:p-5 flex items-start sm:items-center gap-3 sm:gap-4 cursor-pointer"
                  onClick={() => toggleExpand(alert.id)}
                >
                  <div className="flex items-center shrink-0 pt-3 sm:pt-0" onClick={e => e.stopPropagation()}>
                    <button 
                      onClick={(e) => toggleSelect(alert.id, e)}
                      className="p-1 rounded hover:bg-slate-200 text-slate-400 transition-colors"
                    >
                      {selectedAlerts.includes(alert.id) ? (
                        <CheckSquare size={18} className="text-blue-600" />
                      ) : (
                        <Square size={18} />
                      )}
                    </button>
                  </div>
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 border ${alert.status === 'resolved' ? 'bg-slate-100 border-slate-200 text-slate-400' : getAlertColors(alert.type)}`}>
                    {alert.status === 'resolved' ? <CheckCircle2 size={20} /> : getAlertIcon(alert.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="min-w-0 pr-4">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`text-sm font-bold truncate ${alert.status === 'resolved' ? 'line-through text-slate-500' : 'text-slate-800'}`}>
                          {alert.title}
                        </h3>
                        {alert.status === 'resolved' && (
                          <span className="hidden sm:inline-flex bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded items-center gap-1">
                            Resolved
                          </span>
                        )}
                        {alert.status === 'active' && alert.type === 'critical' && (
                          <span className="animate-pulse w-2 h-2 rounded-full bg-red-500"></span>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-slate-500 truncate">{alert.desc}</p>
                    </div>
                    
                    <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 sm:min-w-[140px]">
                      <span className="text-[10px] sm:text-xs font-semibold text-slate-400">{alert.timestamp}</span>
                      
                      <div className="flex items-center gap-1">
                        {alert.status === 'active' && (
                          <button 
                            onClick={(e) => markAsResolved(alert.id, e)}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                            title="Mark as Resolved"
                          >
                            <CheckCircle size={16} />
                          </button>
                        )}
                        <button className="p-1.5 text-slate-400 rounded-md transition-colors">
                          {expandedAlerts.includes(alert.id) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                <AnimatePresence>
                  {expandedAlerts.includes(alert.id) && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden bg-slate-50/80 border-t border-slate-100"
                    >
                      <div className="p-4 sm:p-5 sm:pl-[76px] grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Alert Details</h4>
                          <p className="text-sm text-slate-700 leading-relaxed">{alert.desc}</p>
                          
                          <div className="mt-4 flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-500">Affected Module:</span>
                            <span className="text-xs bg-white border border-slate-200 px-2 py-1 rounded text-slate-700 font-medium font-mono">
                              {alert.details.affectedSystem}
                            </span>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Recommended Action</h4>
                            <div className="bg-white border border-slate-200 rounded-lg p-3 text-sm text-slate-600">
                              {alert.details.suggestedAction}
                            </div>
                          </div>
                          
                          {alert.details.errorTrace && (
                            <div>
                              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">System Trace</h4>
                              <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs text-green-400 font-mono overflow-x-auto">
                                {alert.details.errorTrace}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="md:col-span-2 flex justify-end gap-2 pt-2">
                          <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors flex items-center gap-2">
                            <ExternalLink size={14} /> View Logs
                          </button>
                          {alert.status === 'active' && (
                            <button 
                              onClick={(e) => markAsResolved(alert.id, e)}
                              className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors"
                            >
                              Resolve Alert
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-slate-500">
              <CheckCircle2 size={48} className="mx-auto mb-4 text-emerald-400 opacity-50" />
              <p className="font-bold text-slate-700 mb-1">Status Operational</p>
              <p className="text-sm">There are no {filter !== 'all' ? filter : ''} system alerts matching your criteria.</p>
            </div>
          )}
        </div>
        
        {/* Bulk Actions Floating Bar */}
        <AnimatePresence>
          {selectedAlerts.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed lg:absolute bottom-4 left-4 right-4 lg:left-1/2 lg:-translate-x-1/2 lg:right-auto bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center justify-between gap-6 z-50 min-w-min lg:min-w-[400px]"
            >
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold">
                  {selectedAlerts.length}
                </span>
                <span className="text-sm font-bold">Selected</span>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={resolveSelected}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold transition-colors"
                >
                  Mark Resolved
                </button>
                <div className="w-px h-4 bg-white/10 mx-1"></div>
                <button 
                  onClick={deleteSelected}
                  className="px-3 py-1.5 text-slate-300 hover:text-red-400 hover:bg-red-400/10 rounded-lg text-xs font-bold transition-colors"
                >
                  Delete
                </button>
                <button 
                  onClick={() => setSelectedAlerts([])}
                  className="p-1.5 ml-1 text-slate-400 hover:text-white rounded-lg transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Settings Modal */}
      <Modal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        title="Alert Settings & Preferences"
      >
        <div className="space-y-6">
          <div>
            <h4 className="text-sm font-bold text-slate-900 mb-3">Notification Channels</h4>
            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
                <div>
                  <div className="text-sm font-bold text-slate-800">Email Notifications</div>
                  <div className="text-xs text-slate-500">Receive critical alerts via email immediately</div>
                </div>
                <input type="checkbox" defaultChecked className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4" />
              </label>
              
              <label className="flex items-center justify-between p-3 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
                <div>
                  <div className="text-sm font-bold text-slate-800">Slack Integration</div>
                  <div className="text-xs text-slate-500">Forward warnings and criticals to #ops-alerts</div>
                </div>
                <input type="checkbox" defaultChecked className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4" />
              </label>
              
              <label className="flex items-center justify-between p-3 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
                <div>
                  <div className="text-sm font-bold text-slate-800">SMS / PagerDuty</div>
                  <div className="text-xs text-slate-500">For out-of-hours critical system failures</div>
                </div>
                <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4" />
              </label>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-bold text-slate-900 mb-3">System Thresholds</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">High Transfer Queue Warning</label>
                <select className="w-full rounded-lg border-slate-200 text-sm focus:border-blue-500 focus:ring-blue-500">
                  <option>100 pending transfers</option>
                  <option>250 pending transfers</option>
                  <option>500 pending transfers</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Storage Capacity Warning</label>
                <select defaultValue="85" className="w-full rounded-lg border-slate-200 text-sm focus:border-blue-500 focus:ring-blue-500">
                  <option value="80">Alert at 80% capacity</option>
                  <option value="85">Alert at 85% capacity</option>
                  <option value="90">Alert at 90% capacity</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
            <button 
              onClick={() => setIsSettingsModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={() => setIsSettingsModalOpen(false)}
              className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors"
            >
              Save Preferences
            </button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
