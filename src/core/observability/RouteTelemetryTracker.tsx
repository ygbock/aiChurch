import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { telemetry } from './telemetry';

export function RouteTelemetryTracker() {
  const location = useLocation();

  useEffect(() => {
    telemetry.track({
      event: 'ROUTE_CHANGE',
      metadata: { path: location.pathname, search: location.search },
    });
  }, [location.pathname, location.search]);

  return null;
}
