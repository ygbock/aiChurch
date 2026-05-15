import { lazy } from 'react';
import React from 'react';
import { PlatformModule } from '../../core/platform/registry';
import { Scan } from 'lucide-react';

const KioskCheckIn = lazy(() => import('./pages/KioskCheckIn'));
const ServiceAttendance = lazy(() => import('./pages/ServiceAttendance'));

export const attendanceModule: PlatformModule = {
  id: 'attendance',
  name: 'Attendance',
  category: 'core',
  description: 'Manage attendance tracking and check-ins',
  enabledByDefault: true,
  routes: [
    { path: '/kiosk', element: <KioskCheckIn />, layout: 'none' },
    { path: 'attendance-tracker', element: <ServiceAttendance /> }
  ],
  widgets: [],
  navigation: [
    { label: 'Scan Attendance', path: '/attendance-tracker', icon: Scan }
  ]
};
