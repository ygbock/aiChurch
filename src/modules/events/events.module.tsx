import { lazy } from 'react';
import React from 'react';
import { PlatformModule } from '../../core/platform/registry';
import { Calendar as CalendarIcon, Flame } from 'lucide-react';

const Events = lazy(() => import('./pages/Events'));
const CalendarPage = lazy(() => import('./pages/Calendar'));
const PublicEventRegistration = lazy(() => import('./pages/PublicEventRegistration'));

export const eventsModule: PlatformModule = {
  id: 'events',
  name: 'Events',
  category: 'spiritual',
  description: 'Manage church events and registrations',
  enabledByDefault: true,
  routes: [
    { path: 'events', element: <Events /> },
    { path: 'calendar', element: <CalendarPage /> },
    { path: '/public/events/:districtId/:branchId/:eventId/register', element: <PublicEventRegistration />, layout: 'none' }
  ],
  widgets: [],
  navigation: [
    { label: 'Calendar', path: '/calendar', icon: CalendarIcon },
    { label: 'Live Events', path: '/events', icon: Flame }
  ]
};
