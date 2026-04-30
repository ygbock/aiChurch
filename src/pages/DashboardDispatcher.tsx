import React from 'react';
import { useRole } from '../components/Layout';
import Dashboard from './Dashboard';
import SuperadminDashboard from './SuperadminDashboard';
import DistrictDashboard from './DistrictDashboard';
import MemberPortal from './MemberPortal';

export default function DashboardDispatcher() {
  const { role } = useRole();

  switch (role) {
    case 'superadmin':
      return <SuperadminDashboard />;
    case 'district':
      return <DistrictDashboard />;
    case 'member':
      return <MemberPortal />;
    case 'branch_admin':
    case 'admin':
    default:
      return <Dashboard />;
  }
}
