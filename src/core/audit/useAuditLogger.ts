import { create } from 'zustand';

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  module: string;
  details: string;
  timestamp: Date;
  tenantId?: string;
  branchId?: string;
}

interface AuditState {
  logs: AuditLog[];
  logAction: (log: Omit<AuditLog, 'id' | 'timestamp'>) => void;
}

export const useAuditLogger = create<AuditState>((set) => ({
  logs: [],
  logAction: (log) => {
    const newLog = {
      ...log,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date()
    };
    console.log('[Audit Log]', newLog);
    set((state) => ({ logs: [newLog, ...state.logs] }));
  }
}));
