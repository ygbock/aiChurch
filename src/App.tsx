import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import { FirebaseProvider } from './components/FirebaseProvider';
import { ThemeProvider } from './components/ThemeProvider';
import { Toaster } from 'sonner';
import { ModuleGuard } from './core/feature-flags/ModuleGuard';
import { platformRegistry, ModuleRoute } from './core/platform/registry';
import { bootstrapPlatform } from './core/platform/bootstrap';
import { RouteTelemetryTracker } from './core/observability/RouteTelemetryTracker';
import { TelemetryErrorBoundary } from './core/observability/ErrorBoundary';

// Make sure to bootstrap the platform
bootstrapPlatform();

const DashboardDispatcher = lazy(() => import('./modules/administration/pages/DashboardDispatcher'));

const Help = () => (
  <div className="p-8 bg-white rounded-xl border border-slate-200">
    <h2 className="text-2xl font-bold text-slate-900 mb-4">Help Center</h2>
    <p className="text-slate-500">Need assistance? Our support team is here to help you navigate Faith Healing Bible Church.</p>
  </div>
);

const renderRoutes = (routes: ModuleRoute[], moduleId: string) => {
  return routes.map((route, i) => {
    // Only wrap with ModuleGuard if it's not index route without element
    const wrappedElement = route.element ? <ModuleGuard moduleId={moduleId}>{route.element}</ModuleGuard> : undefined;
    if (route.index) {
      return <Route key={`index-${i}`} index element={wrappedElement} />;
    }
    if (route.children) {
      return (
        <Route key={`${route.path}-${i}`} path={route.path} element={wrappedElement}>
          {renderRoutes(route.children, moduleId)}
        </Route>
      );
    }
    return <Route key={`${route.path}-${i}`} path={route.path} element={wrappedElement} />;
  });
};

export default function App() {
  const allModules = platformRegistry.getAllModules();
  
  const mainLayoutRoutes = allModules.flatMap(m => 
    renderRoutes(m.routes.filter(r => r.layout !== 'none'), m.id)
  );
  
  const noneLayoutRoutes = allModules.flatMap(m => 
    renderRoutes(m.routes.filter(r => r.layout === 'none'), m.id)
  );

  return (
    <ThemeProvider>
      <FirebaseProvider>
        <BrowserRouter>
          <RouteTelemetryTracker />
          <Toaster position="top-right" richColors />
          <TelemetryErrorBoundary name="App_Root">
            <Suspense fallback={<div className="flex h-screen items-center justify-center bg-slate-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div></div>}>
                <Routes>
                  {noneLayoutRoutes}
                  
                  <Route path="/" element={<Layout />}>
                    <Route index element={<Navigate to="/dashboard" replace />} />
                    <Route path="dashboard" element={<DashboardDispatcher />} />
                    
                    {mainLayoutRoutes}
                    
                    <Route path="help" element={<Help />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Route>
                </Routes>
            </Suspense>
          </TelemetryErrorBoundary>
        </BrowserRouter>
      </FirebaseProvider>
    </ThemeProvider>
  );
}
