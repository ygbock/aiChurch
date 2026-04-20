import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Lock, 
  Globe, 
  Database, 
  Shield,
  ChevronRight
} from 'lucide-react';
import AccessManagement from './AccessManagement';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-4xl"
    >
      <div>
        <h2 className="text-2xl font-bold text-slate-900">System Settings</h2>
        <p className="text-slate-500 text-sm">Configure your church management preferences and security.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Settings Sidebar */}
        <div className="space-y-1">
          <SettingsTab onClick={() => setActiveTab('profile')} icon={<User size={18} />} label="Account Profile" active={activeTab === 'profile'} />
          <SettingsTab onClick={() => setActiveTab('notifications')} icon={<Bell size={18} />} label="Notifications" active={activeTab === 'notifications'} />
          <SettingsTab onClick={() => setActiveTab('security')} icon={<Lock size={18} />} label="Security & Privacy" active={activeTab === 'security'} />
          <SettingsTab onClick={() => setActiveTab('branch')} icon={<Globe size={18} />} label="Branch Configuration" active={activeTab === 'branch'} />
          <SettingsTab onClick={() => setActiveTab('data')} icon={<Database size={18} />} label="Data Management" active={activeTab === 'data'} />
          <SettingsTab onClick={() => setActiveTab('permissions')} icon={<Shield size={18} />} label="User Permissions" active={activeTab === 'permissions'} />
        </div>

        {/* Settings Content */}
        <div className="md:col-span-2 space-y-6">
          {activeTab === 'permissions' ? (
            <AccessManagement />
          ) : (
            <>
          <section className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">Profile Information</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-6 mb-6">
                <img 
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" 
                  alt="Admin" 
                  className="w-20 h-20 rounded-full object-cover border-4 border-slate-50"
                />
                <button className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-200 transition-colors">
                  Change Photo
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Full Name</label>
                  <input type="text" defaultValue="Admin User" className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm focus:ring-1 focus:ring-blue-600 outline-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Email Address</label>
                  <input type="email" defaultValue="admin@faithconnect.org" className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm focus:ring-1 focus:ring-blue-600 outline-none" />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Role</label>
                  <input type="text" defaultValue="Super Administrator" disabled className="w-full bg-slate-100 border border-slate-200 rounded-lg py-2 px-3 text-sm text-slate-500 cursor-not-allowed" />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors shadow-sm">
                Save Changes
              </button>
            </div>
          </section>

          <section className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">Email Notifications</h3>
            </div>
            <div className="p-6 space-y-4">
              <NotificationToggle label="New Member Registration" description="Receive an email when a new member joins." checked={true} />
              <NotificationToggle label="Financial Reports" description="Weekly summary of tithes and offerings." checked={true} />
              <NotificationToggle label="System Updates" description="Stay informed about new features and maintenance." checked={false} />
            </div>
          </section>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function SettingsTab({ onClick, icon, label, active }: { onClick: () => void, icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors ${active ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
      <div className="flex items-center gap-3">
        {icon}
        {label}
      </div>
      <ChevronRight size={16} className={active ? 'text-blue-600' : 'text-slate-300'} />
    </button>
  );
}

function NotificationToggle({ label, description, checked }: { label: string, description: string, checked: boolean }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-sm font-semibold text-slate-900">{label}</p>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
      <div className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${checked ? 'bg-blue-600' : 'bg-slate-200'}`}>
        <div className={`absolute top-1 w-3 h-3 rounded-full transition-all bg-white shadow-sm ${checked ? 'right-1' : 'left-1'}`}></div>
      </div>
    </div>
  );
}
