import { EventPayloadMap } from './contracts';

class EventRegistry {
  private registeredEvents = new Set<string>();

  registerEvent(eventType: string) {
    if (this.registeredEvents.has(eventType)) {
      console.warn(`Event ${eventType} is already registered.`);
    }
    this.registeredEvents.add(eventType);
  }

  isRegistered(eventType: string): boolean {
    return this.registeredEvents.has(eventType);
  }

  getAllRegisteredEvents(): string[] {
    return Array.from(this.registeredEvents);
  }
}

export const eventRegistry = new EventRegistry();

// Register known platform events
['DONATION_COMPLETED', 'MEMBER_REGISTERED', 'ATTENDANCE_RECORDED', 'COURSE_COMPLETED', 'EVENT_REGISTERED', 'EXPENSE_APPROVED', 'PAYROLL_PROCESSED'].forEach(event => {
  eventRegistry.registerEvent(event);
});
