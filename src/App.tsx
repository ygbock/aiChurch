import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import DashboardDispatcher from './pages/DashboardDispatcher';
import MemberManagementPage from './pages/members/MemberManagementPage';
import PublicEventRegistration from './pages/PublicEventRegistration';
import MembersDashboard from './pages/MembersDashboard';
import NewMember from './pages/NewMember';
import NewConvert from './pages/NewConvert';
import NewFirstTimer from './pages/NewFirstTimer';
import Departments from './pages/Departments';
import DepartmentDashboard from './pages/DepartmentDashboard';
import Financials from './pages/Financials';
import Ministries from './pages/Ministries';
import MinistryDashboard from './pages/MinistryDashboard';
import CommitteeWorkspace from './pages/CommitteeWorkspace';
import Reports from './pages/Reports';
import Events from './pages/Events';
import Calendar from './pages/Calendar';
import LiveStreaming from './pages/LiveStreaming';
import Settings from './pages/Settings';
import BibleSchool from './pages/BibleSchool';
import CommunicationHub from './pages/CommunicationHub';
import CommunityFeed from './pages/CommunityFeed';
import PublicUserProfile from './pages/PublicUserProfile';
import MinistryChannels from './pages/MinistryChannels';
import DirectMessages from './pages/DirectMessages';
import CMS from './pages/CMS';
import Volunteers from './pages/Volunteers';
import Rosters from './pages/Rosters';
import Tasks from './pages/Tasks';
import TransferManagement from './pages/TransferManagement';
import SuperadminDashboard from './pages/SuperadminDashboard';
import SystemAlerts from './pages/SystemAlerts';
import MemberPortal from './pages/MemberPortal';
import MemberProfile from './pages/MemberProfile';
import KioskCheckIn from './pages/KioskCheckIn';
import DistrictDashboard from './pages/DistrictDashboard';
import AdminDistricts from './pages/AdminDistricts';
import DepartmentMemberProfile from './pages/DepartmentMemberProfile';
import AdminRegistration from './pages/AdminRegistration';
import ProgramDashboard from './pages/ProgramDashboard';
import Directory from './pages/Directory';
import BaptismManagement from './pages/BaptismManagement';
import BaptismInterviewPanel from './pages/BaptismInterviewPanel';
import { FirebaseProvider } from './components/FirebaseProvider';
import { Toaster } from 'sonner';

// Placeholder components for other pages
const Help = () => (
  <div className="p-8 bg-white rounded-xl border border-slate-200">
    <h2 className="text-2xl font-bold text-slate-900 mb-4">Help Center</h2>
    <p className="text-slate-500">Need assistance? Our support team is here to help you navigate Faith Healing Bible Church.</p>
  </div>
);

import ServiceReports from './pages/ServiceReports';

export default function App() {
  return (
    <FirebaseProvider>
      <BrowserRouter>
        <Toaster position="top-right" richColors />
        <Routes>
          <Route path="/kiosk" element={<KioskCheckIn />} />
          <Route path="/register" element={<AdminRegistration />} />
          <Route path="/public/events/:districtId/:branchId/:eventId/register" element={<PublicEventRegistration />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardDispatcher />} />
            <Route path="districts" element={<AdminDistricts />} />
            <Route path="members" element={<MemberManagementPage />} />
            <Route path="members/registry" element={<Navigate to="/members" replace />} />
            <Route path="members/profile/:memberId" element={<MemberProfile />} />
            <Route path="members/new" element={<NewMember />} />
            <Route path="members/new-convert" element={<NewConvert />} />
            <Route path="members/new-first-timer" element={<NewFirstTimer />} />
            <Route path="members/edit/:memberId" element={<NewMember />} />
            <Route path="ministries" element={<Ministries />} />
            <Route path="ministries/:ministryId" element={<MinistryDashboard />} />
            <Route path="ministries/:ministryId/committees/:committeeId" element={<CommitteeWorkspace />} />
            <Route path="programs/:programId" element={<ProgramDashboard />} />
            <Route path="departments" element={<Departments />} />
            <Route path="departments/:departmentId" element={<DepartmentDashboard />} />
            <Route path="departments/:departmentId/members/:memberId" element={<DepartmentMemberProfile />} />
            <Route path="financials" element={<Financials />} />
            <Route path="service-reports" element={<ServiceReports />} />
            <Route path="reports" element={<Reports />} />
            <Route path="events" element={<Events />} />
            <Route path="calendar" element={<Calendar />} />
            <Route path="streaming" element={<LiveStreaming />} />
            <Route path="bible-school" element={<BibleSchool />} />
            <Route path="baptism" element={<BaptismManagement />} />
            <Route path="baptism/interviews" element={<BaptismInterviewPanel />} />
            <Route path="communication" element={<CommunicationHub />} />
            <Route path="community-feed" element={<CommunityFeed />} />
            <Route path="community-profile/:userId" element={<PublicUserProfile />} />
            <Route path="ministry-channels" element={<MinistryChannels />} />
            <Route path="direct-messages" element={<DirectMessages />} />
            <Route path="direct-messages/:chatId" element={<DirectMessages />} />
            <Route path="cms" element={<CMS />} />
            <Route path="volunteers" element={<Volunteers />} />
            <Route path="rosters" element={<Rosters />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="transfers" element={<TransferManagement />} />
            <Route path="directory" element={<Directory />} />
            <Route path="superadmin" element={<SuperadminDashboard />} />
            <Route path="system-alerts" element={<SystemAlerts />} />
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
