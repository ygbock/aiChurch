import React, { Suspense, useMemo } from 'react';
import { widgetRegistry } from './WidgetRegistry';
import { usePermissions } from '../permissions/usePermissions';
import { useFeatureFlags } from '../feature-flags/useFeatureFlags';
import { TelemetryErrorBoundary } from '../observability/ErrorBoundary';

interface DashboardWorkspaceProps {
  workspaceId: string;
  className?: string;
}

export function DashboardWorkspace({ workspaceId, className = '' }: DashboardWorkspaceProps) {
  const { hasPermission } = usePermissions();
  const { isModuleEnabled } = useFeatureFlags();

  const widgets = useMemo(() => {
    return widgetRegistry.getWidgetsForWorkspace(workspaceId).filter(widget => {
      // Check feature flag
      if (widget.featureFlag && !isModuleEnabled(widget.featureFlag)) {
        return false;
      }
      
      // Check permissions
      if (widget.permissions && widget.permissions.length > 0) {
        const hasAccess = widget.permissions.every(p => hasPermission(p));
        if (!hasAccess) return false;
      }

      return true;
    });
  }, [workspaceId, hasPermission, isModuleEnabled]);

  if (widgets.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-xl border border-dashed border-gray-200">
        <p className="text-gray-500 text-sm">No widgets available for this workspace.</p>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
      {widgets.map(widget => {
        const WidgetComponent = widget.component;
        
        // Handle size classes
        let sizeClass = 'col-span-1';
        if (widget.size === 'medium') sizeClass = 'col-span-1 md:col-span-2';
        if (widget.size === 'large') sizeClass = 'col-span-1 md:col-span-2 lg:col-span-3';
        if (widget.size === 'full') sizeClass = 'col-span-1 md:col-span-2 lg:col-span-3';

        return (
          <div key={widget.id} className={`${sizeClass} flex flex-col`}>
             <TelemetryErrorBoundary name={`Widget_${widget.id}`}>
               <Suspense fallback={
                 <div className="animate-pulse bg-gray-100 rounded-xl w-full h-64 flex items-center justify-center">
                   <span className="text-gray-400 text-xs">Loading {widget.title}...</span>
                 </div>
               }>
                 <WidgetComponent />
               </Suspense>
             </TelemetryErrorBoundary>
          </div>
        );
      })}
    </div>
  );
}
