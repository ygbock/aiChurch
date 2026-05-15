import { analytics } from '../analytics/AnalyticsService';
import { useTenant } from '../tenant/useTenant';
import { EventPayloadMap, StandardEvent } from './contracts';
import { eventRegistry } from './registry';
import { v4 as uuidv4 } from 'uuid';
import { telemetry } from '../observability/telemetry';

export type EventHandler<T = any> = (payload: T) => void;

export class EventBus {
  private listeners: Record<string, EventHandler[]> = {};

  subscribe<K extends keyof EventPayloadMap>(eventName: K, callback: EventHandler<EventPayloadMap[K]>) {
    const stringName = String(eventName);
    if (!this.listeners[stringName]) {
      this.listeners[stringName] = [];
    }
    this.listeners[stringName].push(callback as EventHandler<any>);

    // Return unsubscribe function
    return () => {
      this.listeners[stringName] = this.listeners[stringName].filter(cb => cb !== callback);
    };
  }

  publish<K extends keyof EventPayloadMap>(eventName: K, data: EventPayloadMap[K]['data']) {
    const stringName = String(eventName);
    const tenantState = useTenant.getState();
    const trace = telemetry.startTrace(`EventBus.publish:${stringName}`);
    
    // Auto-wrap in standard event envelope
    const event: EventPayloadMap[K] = {
      eventId: uuidv4(),
      eventType: stringName,
      organizationId: tenantState.currentOrganization?.id || null,
      districtId: tenantState.currentDistrict?.id || null,
      branchId: tenantState.currentBranch?.id || null,
      actorId: null, // Would normally inject userContext here if available globally
      correlationId: uuidv4(),
      timestamp: new Date().toISOString(),
      version: '1.0',
      data: data as any,
    } as any;
    
    // Automatically track all core business events in analytics
    analytics.track({
        eventName: stringName,
        payload: event.data,
        tenantId: event.organizationId || undefined,
        branchId: event.branchId || undefined,
    });

    if (!eventRegistry.isRegistered(stringName)) {
        console.warn(`[EventBus] Publishing unregistered event: ${stringName}`);
        telemetry.track({ event: 'EventBus.unregistered_event', metadata: { eventName: stringName } });
    }

    if (!this.listeners[stringName]) {
       trace.end({ listeners: 0 });
       return;
    }

    this.listeners[stringName].forEach(callback => {
      try {
        // Enforce asynchronous delivery to decouple modules and prevent blocking
        setTimeout(() => callback(event), 0);
      } catch (error) {
        console.error(`Error in event listener for ${stringName}:`, error);
        telemetry.track({ event: `EventBus.listen_error:${stringName}`, error });
      }
    });

    trace.end({ listeners: this.listeners[stringName].length });
  }
}

export const systemEvents = new EventBus();

// Core System Events Dictionary
export const Events = {
  MEMBER_CREATED: 'MEMBER_REGISTERED',
  ATTENDANCE_CHECKED_IN: 'ATTENDANCE_RECORDED',
  DONATION_COMPLETED: 'DONATION_COMPLETED',
  COURSE_COMPLETED: 'COURSE_COMPLETED',
  EVENT_REGISTERED: 'EVENT_REGISTERED',
  EXPENSE_APPROVED: 'EXPENSE_APPROVED',
  PAYROLL_PROCESSED: 'PAYROLL_PROCESSED',
} as const;

Object.values(Events).forEach(event => eventRegistry.registerEvent(event));

