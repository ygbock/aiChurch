import React from 'react';
import { Navigate } from 'react-router-dom';
import { useFeatureFlags } from './useFeatureFlags';

interface ModuleGuardProps {
  moduleId: string;
  children: React.ReactNode;
}

export const ModuleGuard: React.FC<ModuleGuardProps> = ({ moduleId, children }) => {
  const { isModuleEnabled } = useFeatureFlags();

  if (!isModuleEnabled(moduleId)) {
    // If the module is disabled, redirect to dashboard or show unauthorized message
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
