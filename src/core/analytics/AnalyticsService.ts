export interface AnalyticsEvent {
  eventName: string;
  payload: any;
  timestamp: Date;
  tenantId?: string;
  branchId?: string;
  userId?: string;
}

class AnalyticsService {
  track(event: Omit<AnalyticsEvent, 'timestamp'>) {
    const fullEvent: AnalyticsEvent = {
        ...event,
        timestamp: new Date()
    };
    // In a real application, this would send data to a tool like Mixpanel, PostHog, or Google Analytics
    console.log(`[Analytics] ${event.eventName}`, fullEvent);
  }
}

export const analytics = new AnalyticsService();
