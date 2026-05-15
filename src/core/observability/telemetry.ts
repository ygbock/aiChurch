// Simple observability wrapper
import { useTenant } from '../tenant/useTenant';

export interface TraceData {
  event: string;
  duration?: number;
  metadata?: Record<string, any>;
  error?: any;
}

export interface TelemetryPayload extends TraceData {
  timestamp: string;
  organizationId?: string;
  districtId?: string;
  branchId?: string;
}

class TelemetryService {
  private static instance: TelemetryService;
  private history: TelemetryPayload[] = [];
  private readonly MAX_HISTORY = 200;
  private listeners: ((payload: TelemetryPayload) => void)[] = [];

  private constructor() {}

  static getInstance() {
    if (!TelemetryService.instance) {
      TelemetryService.instance = new TelemetryService();
    }
    return TelemetryService.instance;
  }

  public subscribe(callback: (payload: TelemetryPayload) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  public getHistory() {
    return this.history;
  }

  public track(data: TraceData) {
    const tenantState = useTenant.getState();
    const payload: TelemetryPayload = {
      ...data,
      timestamp: new Date().toISOString(),
      organizationId: tenantState.currentOrganization?.id,
      districtId: tenantState.currentDistrict?.id,
      branchId: tenantState.currentBranch?.id,
    };
    
    // Add to buffer
    this.history.unshift(payload);
    if (this.history.length > this.MAX_HISTORY) {
      this.history.pop();
    }

    // Notify listeners
    this.listeners.forEach(l => {
        try { l(payload); } catch (e) { /* ignore */ }
    });
    
    // In production, this would send to Datadog, Sentry, or Grafana Agent
    if (data.error) {
        console.error(`[Telemetry Error] ${data.event}`, payload);
    } else {
        console.debug(`[Telemetry Track] ${data.event}`, payload);
    }
  }

  public startTrace(actionName: string) {
    const start = performance.now();
    return {
      end: (metadata?: Record<string, any>) => {
        const duration = performance.now() - start;
        this.track({
          event: actionName,
          duration,
          metadata
        });
      },
      error: (error: any, metadata?: Record<string, any>) => {
        const duration = performance.now() - start;
        this.track({
          event: actionName,
          duration,
          error,
          metadata
        });
      }
    };
  }
}

export const telemetry = TelemetryService.getInstance();
