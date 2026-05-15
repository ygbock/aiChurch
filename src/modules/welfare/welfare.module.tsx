import { lazy } from 'react';
import React from 'react';
import { PlatformModule } from '../../core/platform/registry';
import { CalendarDays } from 'lucide-react';

const Volunteers = lazy(() => import('./pages/Volunteers'));
const Rosters = lazy(() => import('./pages/Rosters'));

export const welfareModule: PlatformModule = {
  id: 'welfare',
  name: 'Welfare',
  category: 'operations',
  description: 'Welfare management',
  enabledByDefault: true,
  routes: [
    { path: 'volunteers', element: <Volunteers /> },
    { path: 'rosters', element: <Rosters /> }
  ],
  widgets: [],
  navigation: [
    { label: 'Welfare Rosters', path: '/rosters', icon: CalendarDays }
  ]
};
