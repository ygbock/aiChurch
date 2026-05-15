import { lazy } from 'react';
import { PlatformModule } from '../../core/platform/registry';
const RecentMembersWidget = lazy(() => import('./widgets/RecentMembersWidget'));
const RetentionAlertsWidget = lazy(() => import('./widgets/RetentionAlertsWidget'));

import React from 'react';
import { Users, UserCheck } from 'lucide-react';

const MemberManagementPage = lazy(() => import('./registry/MemberManagementPage'));
const MembersDashboard = lazy(() => import('./pages/MembersDashboard'));
const NewMember = lazy(() => import('./pages/NewMember'));
const NewConvert = lazy(() => import('./pages/NewConvert'));
const NewFirstTimer = lazy(() => import('./pages/NewFirstTimer'));
const TransferManagement = lazy(() => import('./pages/TransferManagement'));
const MemberProfile = lazy(() => import('./pages/MemberProfile'));
const Directory = lazy(() => import('./pages/Directory'));
const CellManagement = lazy(() => import('./pages/CellManagement'));
const FollowUpManagement = lazy(() => import('./pages/FollowUpManagement'));

export const membershipModule: PlatformModule = {
  id: 'membership',
  name: 'Membership',
  category: 'core',
  description: 'Manage church members, groups, and directory',
  enabledByDefault: true,
  routes: [
    { path: 'members', element: <MemberManagementPage /> },
    { path: 'members/profile/:memberId', element: <MemberProfile /> },
    { path: 'members/new', element: <NewMember /> },
    { path: 'members/new-convert', element: <NewConvert /> },
    { path: 'members/new-first-timer', element: <NewFirstTimer /> },
    { path: 'members/edit/:memberId', element: <NewMember /> },
    { path: 'transfers', element: <TransferManagement /> },
    { path: 'cells', element: <CellManagement /> },
    { path: 'follow-ups', element: <FollowUpManagement /> },
    { path: 'directory', element: <Directory /> }
  ],
  widgets: [
    {
      id: 'membership-recent',
      name: 'Recent Registrations',
      component: RecentMembersWidget,
      size: 'medium'
    },
    {
      id: 'membership-retention',
      name: 'Action Required: Retention Alerts',
      component: RetentionAlertsWidget,
      size: 'medium'
    }
  ],
  navigation: [
    { label: 'Members', path: '/members', icon: Users },
    { label: 'Home Cells', path: '/cells', icon: Users },
    { label: 'Follow-ups', path: '/follow-ups', icon: UserCheck }
  ]
};
