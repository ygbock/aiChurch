import { describe, it, expect, beforeEach } from 'vitest';
import { usePermissions } from './usePermissions';

describe('usePermissions', () => {
  beforeEach(() => {
    usePermissions.setState({ permissions: [] });
  });

  it('should initialize with no permissions', () => {
    expect(usePermissions.getState().permissions).toEqual([]);
    expect(usePermissions.getState().hasPermission('read')).toBe(false);
  });

  it('should allow setting permissions', () => {
    usePermissions.getState().setPermissions(['read', 'write']);
    expect(usePermissions.getState().permissions).toEqual(['read', 'write']);
    expect(usePermissions.getState().hasPermission('read')).toBe(true);
    expect(usePermissions.getState().hasPermission('delete')).toBe(false);
  });

  it('should grant a permission', () => {
    usePermissions.getState().grantPermission('execute');
    expect(usePermissions.getState().hasPermission('execute')).toBe(true);
  });

  it('should not duplicate granted permissions', () => {
    usePermissions.getState().grantPermission('execute');
    usePermissions.getState().grantPermission('execute');
    expect(usePermissions.getState().permissions).toEqual(['execute']);
  });

  it('should revoke a permission', () => {
    usePermissions.getState().setPermissions(['read', 'write']);
    usePermissions.getState().revokePermission('write');
    expect(usePermissions.getState().hasPermission('write')).toBe(false);
    expect(usePermissions.getState().hasPermission('read')).toBe(true);
  });

  it('should verify hasAnyPermission', () => {
    usePermissions.getState().setPermissions(['read']);
    expect(usePermissions.getState().hasAnyPermission(['read', 'write'])).toBe(true);
    expect(usePermissions.getState().hasAnyPermission(['write', 'delete'])).toBe(false);
  });

  it('should verify hasAllPermissions', () => {
    usePermissions.getState().setPermissions(['read', 'write']);
    expect(usePermissions.getState().hasAllPermissions(['read', 'write'])).toBe(true);
    expect(usePermissions.getState().hasAllPermissions(['read', 'write', 'delete'])).toBe(false);
  });
});
