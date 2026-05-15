import { lazy } from 'react';
import React from 'react';
import { PlatformModule } from '../../core/platform/registry';
import { Building2 } from 'lucide-react';

const Departments = lazy(() => import('./pages/Departments'));
const DepartmentDashboard = lazy(() => import('./pages/DepartmentDashboard'));
const DepartmentMemberProfile = lazy(() => import('./pages/DepartmentMemberProfile'));

export const departmentsModule: PlatformModule = {
  id: 'departments',
  name: 'Departments',
  category: 'core',
  description: 'Manage church departments, workers, and specialized groups',
  enabledByDefault: true,
  routes: [
    { path: 'departments', element: <Departments /> },
    { path: 'departments/:departmentId', element: <DepartmentDashboard /> },
    { path: 'departments/:departmentId/members/:memberId', element: <DepartmentMemberProfile /> }
  ],
  widgets: [],
  navigation: [
    { label: 'Departments', path: '/departments', icon: Building2 }
  ]
};
