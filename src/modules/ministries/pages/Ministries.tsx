import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Network, 
  Plus, 
  Users, 
  Calendar, 
  ArrowRight,
  Heart,
  Zap,
  Globe
} from 'lucide-react';
import { Link } from 'react-router-dom';

const INITIAL_MINISTRIES = [
  {
    id: "youth",
    title: "Youth & Young Adults",
    members: "450",
    events: "2",
    leader: "Pastor Michael Brown",
    icon: <Zap className="text-purple-600" size={24} />,
    color: "bg-purple-50"
  },
  {
    id: "mens",
    title: "Men's Ministry",
    members: "120",
    events: "4",
    leader: "Pastor Michael Nelson",
    icon: <Users className="text-blue-600" size={24} />,
    color: "bg-blue-50"
  },
  {
    id: "womens",
    title: "Women's Ministry",
    members: "185",
    events: "3",
    leader: "Sister Sarah Johnson",
    icon: <Heart className="text-rose-600" size={24} />,
    color: "bg-rose-50"
  },
  {
    id: "children",
    title: "Children's Ministry",
    members: "85",
    events: "6",
    leader: "Sister Grace Addo",
    icon: <Globe className="text-emerald-600" size={24} />,
    color: "bg-emerald-50"
  }
];

export default function Ministries() {
  const [ministries, setMinistries] = useState(INITIAL_MINISTRIES);
  const [isNewMinistryModalOpen, setIsNewMinistryModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    leader: '',
    email: '',
    description: ''
  });

  const handleCreateMinistry = () => {
    if (!formData.name || !formData.category) return;

    const newMinistry = {
      id: formData.name.toLowerCase().replace(/\s+/g, '-'),
      title: formData.name,
      members: "0",
      events: "0",
      leader: formData.leader || "Unassigned",
      icon: <Network className="text-slate-600" size={24} />,
      color: "bg-slate-50"
    };

    setMinistries([...ministries, newMinistry]);
    setIsNewMinistryModalOpen(false);
    setFormData({ name: '', category: '', leader: '', email: '', description: '' });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Ministry Hub</h2>
          <p className="text-slate-500 text-sm">Oversee all spiritual and community outreach programs.</p>
        </div>
        <button 
          onClick={() => setIsNewMinistryModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
        >
          <Plus size={18} />
          New Ministry
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ministries.map((min) => (
          <MinistryCard key={min.id} {...min} />
        ))}
        
        <button 
          onClick={() => setIsNewMinistryModalOpen(true)}
          className="border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center p-8 text-center hover:border-blue-300 hover:bg-blue-50/30 transition-all group cursor-pointer w-full h-full min-h-[220px]"
        >
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
            <Plus size={24} />
          </div>
          <h4 className="text-sm font-bold text-slate-900">Add New Ministry</h4>
          <p className="text-xs text-slate-500 mt-1">Expand your church's reach</p>
        </button>
      </div>

      {isNewMinistryModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Create New Ministry</h3>
                <p className="text-sm text-slate-500">Add a new ministry or department to your organization</p>
              </div>
              <button 
                onClick={() => setIsNewMinistryModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
              >
                &times;
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700">Ministry Name</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g., Youth Ministry" 
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700">Category/Type</label>
                <select 
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white font-medium"
                >
                  <option value="">Select Category</option>
                  <option value="youth">Youth & Young Adults</option>
                  <option value="mens">Men's Ministry</option>
                  <option value="womens">Women's Ministry</option>
                  <option value="children">Children's Ministry</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700">Lead Minister / Director</label>
                <input 
                  type="text" 
                  value={formData.leader}
                  onChange={(e) => setFormData({...formData, leader: e.target.value})}
                  placeholder="Search or enter name" 
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium" 
                />
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button 
                onClick={() => setIsNewMinistryModalOpen(false)}
                className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateMinistry}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm"
              >
                Create Ministry
              </button>
            </div>
          </motion.div>
        </div>
      )}
      {/* New Ministry Modal */}
      {isNewMinistryModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Create New Ministry</h3>
                <p className="text-sm text-slate-500">Add a new ministry or department to your organization</p>
              </div>
              <button 
                onClick={() => setIsNewMinistryModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 transition-colors focus:outline-none"
              >
                &times;
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700">Ministry Name</label>
                <input type="text" placeholder="e.g., Youth Ministry" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700">Category/Type</label>
                <select className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white">
                  <option>Select Category</option>
                  <option>Youth & Young Adults</option>
                  <option>Worship & Arts</option>
                  <option>Community Outreach</option>
                  <option>Education & Discipleship</option>
                  <option>Pastoral Care</option>
                  <option>Other</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700">Lead Minister / Director</label>
                <input type="text" placeholder="Search or enter name" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700">Contact Email</label>
                <input type="email" placeholder="ministry@church.com" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700">Description</label>
                <textarea rows={3} placeholder="Brief description of the ministry's purpose..." className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"></textarea>
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button 
                onClick={() => setIsNewMinistryModalOpen(false)}
                className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors focus:outline-none"
              >
                Cancel
              </button>
              <button 
                onClick={() => setIsNewMinistryModalOpen(false)}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm focus:outline-none"
              >
                Create Ministry
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

function MinistryCard({ id, title, members, events, leader, icon, color }: any) {
  return (
    <Link to={`/ministries/${id}`} className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow group block">
      <div className="p-6">
        <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center mb-4`}>
          {icon}
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-1">{title}</h3>
        <p className="text-xs text-slate-500 mb-6 flex items-center gap-1">
          Led by <span className="font-semibold text-slate-700">{leader}</span>
        </p>
        
        <div className="grid grid-cols-2 gap-4 py-4 border-t border-slate-50">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-slate-400" />
            <div>
              <p className="text-xs font-bold text-slate-900">{members}</p>
              <p className="text-[10px] text-slate-500 uppercase font-bold">Members</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-slate-400" />
            <div>
              <p className="text-xs font-bold text-slate-900">{events}</p>
              <p className="text-[10px] text-slate-500 uppercase font-bold">Events</p>
            </div>
          </div>
        </div>
      </div>
      <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center group-hover:bg-blue-50 transition-colors">
        <span className="text-xs font-bold text-slate-600 group-hover:text-blue-600">Manage Ministry</span>
        <ArrowRight size={16} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
      </div>
    </Link>
  );
}
