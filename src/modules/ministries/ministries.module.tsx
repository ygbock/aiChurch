import { lazy } from 'react';
import React from 'react';
import { PlatformModule } from '../../core/platform/registry';
import { Network } from 'lucide-react';

const Ministries = lazy(() => import('./pages/Ministries'));
const MinistryDashboard = lazy(() => import('./pages/MinistryDashboard'));
const CommitteeWorkspace = lazy(() => import('./pages/CommitteeWorkspace'));
const ProgramDashboard = lazy(() => import('./pages/ProgramDashboard'));
const BaptismManagement = lazy(() => import('./pages/BaptismManagement'));
const BaptismInterviewPanel = lazy(() => import('./pages/BaptismInterviewPanel'));

export const ministriesModule: PlatformModule = {
  id: 'ministries',
  name: 'Ministries',
  category: 'core',
  description: 'Ministry hierarchies, committees, ministry roles, workflows',
  enabledByDefault: true,
  routes: [
    { path: 'ministries', element: <Ministries /> },
    { path: 'ministries/:ministryId', element: <MinistryDashboard /> },
    { path: 'ministries/:ministryId/committees/:committeeId', element: <CommitteeWorkspace /> },
    { path: 'programs/:programId', element: <ProgramDashboard /> },
    { path: 'baptism', element: <BaptismManagement /> },
    { path: 'baptism/interviews', element: <BaptismInterviewPanel /> }
  ],
  widgets: [],
  navigation: [
    { label: 'Ministries', path: '/ministries', icon: Network }
  ]
};
