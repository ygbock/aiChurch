import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import DashboardDispatcher from './pages/DashboardDispatcher';
import Members from './pages/Members';
import MembersDashboard from './pages/MembersDashboard';
import NewMember from './pages/NewMember';
import Departments from './pages/Departments';
import Financials from './pages/Financials';
import Ministries from './pages/Ministries';
import Reports from './pages/Reports';
import Events from './pages/Events';
import LiveStreaming from './pages/LiveStreaming';
import Settings from './pages/Settings';
import BibleSchool from './pages/BibleSchool';
import CommunicationHub from './pages/CommunicationHub';
import CMS from './pages/CMS';
import Volunteers from './pages/Volunteers';
import Tasks from './pages/Tasks';
import TransferManagement from './pages/TransferManagement';
import SuperadminDashboard from './pages/SuperadminDashboard';
import MemberPortal from './pages/MemberPortal';
import DistrictDashboard from './pages/DistrictDashboard';
import AdminRegistration from './pages/AdminRegistration';
import { FirebaseProvider } from './components/FirebaseProvider';

// Placeholder components for other pages
const Help = () => (
  <div className="p-8 bg-white rounded-xl border border-slate-200">
    <h2 className="text-2xl font-bold text-slate-900 mb-4">Help Center</h2>
    <p className="text-slate-500">Need assistance? Our support team is here to help you navigate Faith Healing Bible Church.</p>
  </div>
);

export default function App() {
  return (
    <FirebaseProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/register" element={<AdminRegistration />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardDispatcher />} />
            <Route path="members" element={<MembersDashboard />} />
            <Route path="members/registry" element={<Members />} />
            <Route path="members/new" element={<NewMember />} />
            <Route path="members/edit/:memberId" element={<NewMember />} />
            <Route path="ministries" element={<Ministries />} />
            <Route path="departments" element={<Departments />} />
            <Route path="financials" element={<Financials />} />
            <Route path="reports" element={<Reports />} />
            <Route path="events" element={<Events />} />
            <Route path="streaming" element={<LiveStreaming />} />
            <Route path="bible-school" element={<BibleSchool />} />
            <Route path="communication" element={<CommunicationHub />} />
            <Route path="cms" element={<CMS />} />
            <Route path="volunteers" element={<Volunteers />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="transfers" element={<TransferManagement />} />
            <Route path="superadmin" element={<SuperadminDashboard />} />
            <Route path="member-portal" element={<MemberPortal />} />
            <Route path="district" element={<DistrictDashboard />}>
              <Route path=":districtId" element={<DistrictDashboard />} />
            </Route>
            <Route path="settings" element={<Settings />} />
            <Route path="help" element={<Help />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </FirebaseProvider>
  );
}
