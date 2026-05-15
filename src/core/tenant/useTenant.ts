import { create } from 'zustand';

export interface Organization {
  id: string;
  name: string;
  type: string;
}

export interface District {
  id: string;
  organizationId: string;
  name: string;
}

export interface Branch {
  id: string;
  districtId: string;
  name: string;
  timezone: string;
  currency: string;
}

interface TenantState {
  currentOrganization: Organization | null;
  currentDistrict: District | null;
  currentBranch: Branch | null;
  
  setOrganization: (org: Organization | null) => void;
  setDistrict: (district: District | null) => void;
  setBranch: (branch: Branch | null) => void;
}

/**
 * Handles organizational scope, multitenancy and district/branch context.
 * Used across modules for data segregation.
 */
export const useTenant = create<TenantState>((set) => ({
  currentOrganization: null,
  currentDistrict: null,
  currentBranch: null,
  
  setOrganization: (org) => set({ currentOrganization: org }),
  setDistrict: (district) => set({ currentDistrict: district }),
  setBranch: (branch) => set({ currentBranch: branch }),
}));
