import { describe, it, expect, beforeEach } from 'vitest';
import { useTenant } from './useTenant';

describe('useTenant', () => {
  beforeEach(() => {
    useTenant.setState({
      currentOrganization: null,
      currentDistrict: null,
      currentBranch: null,
    });
  });

  it('should initialize with null context', () => {
    const state = useTenant.getState();
    expect(state.currentOrganization).toBeNull();
    expect(state.currentDistrict).toBeNull();
    expect(state.currentBranch).toBeNull();
  });

  it('should set an organization correctly', () => {
    useTenant.getState().setOrganization({
      id: 'org-1',
      name: 'Test Org',
      type: 'church'
    });
    
    expect(useTenant.getState().currentOrganization?.id).toBe('org-1');
  });

  it('should set district and branch contexts for strict isolation checks', () => {
    useTenant.getState().setDistrict({
      id: 'district-1',
      organizationId: 'org-1',
      name: 'North District'
    });

    useTenant.getState().setBranch({
      id: 'branch-1',
      districtId: 'district-1',
      name: 'Main Branch',
      currency: 'USD',
      timezone: 'UTC'
    });

    expect(useTenant.getState().currentDistrict?.id).toBe('district-1');
    expect(useTenant.getState().currentBranch?.name).toBe('Main Branch');
  });

  // Adding a utility helper test format
  it('should allow clearing tenant context safely', () => {
    useTenant.getState().setBranch(null);
    expect(useTenant.getState().currentBranch).toBeNull();
  });
});
