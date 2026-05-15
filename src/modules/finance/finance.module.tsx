import { lazy } from 'react';
import React from 'react';
import { PlatformModule } from '../../core/platform/registry';
import { Zap, Banknote } from 'lucide-react';
import { Navigate } from 'react-router-dom';

const FinanceLayout = lazy(() => import('./FinanceLayout'));
const FinanceDashboard = lazy(() => import('./dashboard/FinanceDashboard'));
const Donations = lazy(() => import('./donations/Donations'));
const Accounting = lazy(() => import('./accounting/Accounting'));
const Transactions = lazy(() => import('./transactions/Transactions'));
const Budgets = lazy(() => import('./budgets/Budgets'));
const Payroll = lazy(() => import('./payroll/Payroll'));
const Expenses = lazy(() => import('./expenses/Expenses'));
const Assets = lazy(() => import('./assets/Assets'));
const FinanceReports = lazy(() => import('./reports/Reports'));
const AuditLogs = lazy(() => import('./audit/AuditLogs'));

const FinanceMetricsWidget = lazy(() => import('./widgets/FinanceMetricsWidget'));

export const financeModule: PlatformModule = {
  id: 'finance',
  name: 'Finance',
  category: 'operations',
  description: 'Manage church finances, donations, and expenses',
  enabledByDefault: true,
  routes: [
    {
      path: '/finance',
      layout: 'none',
      element: <FinanceLayout />,
      children: [
        { index: true, element: <Navigate to="/finance/dashboard" replace /> },
        { path: 'dashboard', element: <FinanceDashboard /> },
        { path: 'donations', element: <Donations /> },
        { path: 'transactions', element: <Transactions /> },
        { path: 'accounting', element: <Accounting /> },
        { path: 'expenses', element: <Expenses /> },
        { path: 'budgets', element: <Budgets /> },
        { path: 'payroll', element: <Payroll /> },
        { path: 'assets', element: <Assets /> },
        { path: 'reports', element: <FinanceReports /> },
        { path: 'audit', element: <AuditLogs /> },
        { path: 'integrations', element: <div className="p-8">Integrations Comming Soon</div> }
      ]
    }
  ],
  widgets: [
    {
      id: 'finance-metrics',
      name: 'Finance Overview',
      component: FinanceMetricsWidget,
      size: 'small'
    }
  ],
  navigation: [
    { label: 'Financials', path: '/finance', icon: Banknote }
  ]
};
