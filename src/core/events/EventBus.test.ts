import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventBus, Events } from './EventBus';
import { EventPayloadMap } from './contracts';

describe('EventBus', () => {
  let eventBus: EventBus;

  beforeEach(() => {
    // Reset EventBus manually by creating a new instance for tests (ignoring the singleton for isolated testing)
    eventBus = new EventBus();
  });

  it('should allow subscribing to and publishing events', async () => {
    const callback = vi.fn();
    const payload = {
      donationId: '123',
      amount: 100,
      currency: 'USD',
    };

    const unsubscribe = eventBus.subscribe(Events.DONATION_COMPLETED, callback);
    eventBus.publish(Events.DONATION_COMPLETED, payload);

    // EventBus uses setTimeout, so we need to wait for the event loop to tick
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback.mock.calls[0][0].data).toEqual(payload);
    expect(callback.mock.calls[0][0].eventType).toEqual(Events.DONATION_COMPLETED);

    unsubscribe();
    eventBus.publish(Events.DONATION_COMPLETED, payload);

    await new Promise(resolve => setTimeout(resolve, 10));
    expect(callback).toHaveBeenCalledTimes(1); // Should not increase
  });

  it('should wrap standard event payload with correlationId and tenant data', async () => {
    const callback = vi.fn();
    
    eventBus.subscribe(Events.MEMBER_CREATED as any, callback);
    eventBus.publish(Events.MEMBER_CREATED as any, { memberId: 'm-1' });

    await new Promise(resolve => setTimeout(resolve, 10));

    const receivedEvent = callback.mock.calls[0][0];
    expect(receivedEvent.correlationId).toBeDefined();
    expect(receivedEvent.eventId).toBeDefined();
    expect(receivedEvent.timestamp).toBeDefined();
    expect(receivedEvent.version).toEqual('1.0');
    expect(receivedEvent.data.memberId).toEqual('m-1');
  });
});
