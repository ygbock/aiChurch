export interface BaseEvent {
  eventId: string;
  eventType: string;
  organizationId: string;
  districtId: string;
  branchId: string;
  actorId: string;
  correlationId: string;
  timestamp: string;
  version: string;
}

export interface TypedEvent<T = any> extends BaseEvent {
  payload: T;
}

export type EventHandler<T extends TypedEvent<any> = TypedEvent<any>> = (event: T) => void | Promise<void>;
