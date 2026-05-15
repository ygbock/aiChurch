import { v4 as uuidv4 } from 'uuid';

export interface BaseEventPayload {
  eventId: string;
  eventType: string;
  organizationId?: string | null;
  districtId?: string | null;
  branchId?: string | null;
  actorId: string | null;
  correlationId: string;
  timestamp: string;
  version: string;
}

export interface StandardEvent<T = any> extends BaseEventPayload {
  data: T;
}

export interface DonationCompletedData {
  donationId?: string;
  amount: number;
  currency: string;
  txId?: string;
  category?: string;
  donorName?: string;
}

export interface MemberRegisteredData {
  memberId: string;
  name?: string;
  fullName?: string;
  branchId?: string | null;
  districtId?: string | null;
}

export interface AttendanceRecordedData {
  serviceId?: string;
  count?: number;
  memberId?: string;
  eventId?: string;
  fullName?: string;
  programName?: string;
  programId?: string;
  method?: string;
}

export interface ExpenseApprovedData {
  expenseId: string;
  amount: number;
}

export interface PayrollProcessedData {
  payrollId: string;
  totalAmount: number;
}

// Map event types to their payloads
export type EventPayloadMap = {
  'DONATION_COMPLETED': StandardEvent<DonationCompletedData>;
  'MEMBER_REGISTERED': StandardEvent<MemberRegisteredData>;
  'ATTENDANCE_RECORDED': StandardEvent<AttendanceRecordedData>;
  'COURSE_COMPLETED': StandardEvent<any>;
  'EVENT_REGISTERED': StandardEvent<any>;
  'EXPENSE_APPROVED': StandardEvent<ExpenseApprovedData>;
  'PAYROLL_PROCESSED': StandardEvent<PayrollProcessedData>;
  [key: string]: StandardEvent<any>; // Allow custom events for now
};

export function createStandardEvent<T>(eventType: string, data: T, tenantContext: any, actorId: string | null = null, correlationId?: string): StandardEvent<T> {
  return {
    eventId: uuidv4(),
    eventType,
    organizationId: tenantContext?.organizationId || null,
    districtId: tenantContext?.districtId || null,
    branchId: tenantContext?.branchId || null,
    actorId,
    correlationId: correlationId || uuidv4(),
    timestamp: new Date().toISOString(),
    version: '1.0',
    data,
  };
}
