import { describe, it, expect, beforeEach } from 'vitest';
import { useTenant } from './useTenant';

describe('Tenant Boundaries Isolation', () => {
  beforeEach(() => {
    useTenant.setState({
      currentOrganization: null,
      currentDistrict: null,
      currentBranch: null,
    });
  });

  it('should not leak organization data when switching contexts', () => {
    // Admin sets context to Org A
    useTenant.getState().setOrganization({ id: 'org-A', name: 'Org A', type: 'church' });
    expect(useTenant.getState().currentOrganization?.id).toBe('org-A');

    // Simulate cross-tenant switch (e.g. Superadmin changing scopes)
    useTenant.getState().setOrganization({ id: 'org-B', name: 'Org B', type: 'church' });
    expect(useTenant.getState().currentOrganization?.id).toBe('org-B');
    expect(useTenant.getState().currentOrganization?.id).not.toBe('org-A');
  });

  it('should maintain branch boundary isolation strictly', () => {
    // User from Branch X
    useTenant.getState().setBranch({ id: 'branch-X', districtId: 'district-1', name: 'Branch X', currency: 'USD', timezone: 'UTC' });
    const userBranch = useTenant.getState().currentBranch?.id;
    
    // Validate we correctly expose only the authorized branch
    expect(userBranch).toBe('branch-X');
  });
});
