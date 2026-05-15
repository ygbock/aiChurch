import { lazy } from 'react';
import React from 'react';
import { PlatformModule } from '../../core/platform/registry';
import { CheckCircle2, Copy, Map, ArrowLeftRight, Globe, BarChart3, Settings as SettingsIcon, CheckSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Reports = lazy(() => import('./pages/Reports'));
const Settings = lazy(() => import('./pages/Settings'));
const CMS = lazy(() => import('./pages/CMS'));
const Tasks = lazy(() => import('./pages/Tasks'));
const SystemAlerts = lazy(() => import('./pages/SystemAlerts'));
const AdminDistricts = lazy(() => import('./pages/AdminDistricts'));
const AdminRegistration = lazy(() => import('./pages/AdminRegistration'));
const ServiceReports = lazy(() => import('./pages/ServiceReports'));

const TasksWidget = lazy(() => import('./widgets/TasksWidget'));
const TelemetryStreamWidget = lazy(() => import('./widgets/TelemetryStreamWidget'));

export const administrationModule: PlatformModule = {
  id: 'administration',
  name: 'Administration',
  category: 'admin',
  description: 'Organization governance, tenant controls, system settings, feature configuration, global permissions',
  enabledByDefault: true,
  routes: [
    { path: 'reports', element: <Reports /> },
    { path: 'settings', element: <Settings /> },
    { path: 'cms', element: <CMS /> },
    { path: 'tasks', element: <Tasks /> },
    { path: 'system-alerts', element: <SystemAlerts /> },
    { path: 'districts', element: <AdminDistricts /> },
    { path: '/register', element: <AdminRegistration />, layout: 'none' },
    { path: 'service-reports', element: <ServiceReports /> }
  ],
  widgets: [
    {
      id: 'admin-tasks',
      name: 'Tasks & Follow-ups',
      component: TasksWidget,
      size: 'medium'
    },
    {
      id: 'telemetry-stream',
      name: 'Real-time Telemetry',
      component: TelemetryStreamWidget,
      size: 'large'
    }
  ],
  navigation: [
    { label: 'Districts', path: '/districts', permission: 'admin.super', icon: Map },
    { label: 'Transfers', path: '/transfers', icon: ArrowLeftRight },
    { label: 'CMS', path: '/cms', icon: Globe },
    { label: 'Reports', path: '/reports', icon: BarChart3 },
    { label: 'Settings', path: '/settings', icon: SettingsIcon },
    { label: 'Tasks', path: '/tasks', category: 'operations', icon: CheckSquare }
  ]
};

