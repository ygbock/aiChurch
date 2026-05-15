import { create } from 'zustand';

export interface Permission {
  id: string;
  name: string;
  description: string;
}

interface PermissionsState {
  permissions: string[]; // List of permission IDs the current user holds
  hasPermission: (permissionId: string) => boolean;
  hasAnyPermission: (permissionIds: string[]) => boolean;
  hasAllPermissions: (permissionIds: string[]) => boolean;
  setPermissions: (permissions: string[]) => void;
  grantPermission: (permissionId: string) => void;
  revokePermission: (permissionId: string) => void;
}

export const usePermissions = create<PermissionsState>((set, get) => ({
  permissions: [],
  hasPermission: (permissionId) => {
    return get().permissions.includes(permissionId);
  },
  hasAnyPermission: (permissionIds) => {
    return permissionIds.some(id => get().permissions.includes(id));
  },
  hasAllPermissions: (permissionIds) => {
    return permissionIds.every(id => get().permissions.includes(id));
  },
  setPermissions: (permissions) => set({ permissions }),
  grantPermission: (permissionId) => set((state) => ({
    permissions: state.permissions.includes(permissionId) ? state.permissions : [...state.permissions, permissionId]
  })),
  revokePermission: (permissionId) => set((state) => ({
    permissions: state.permissions.filter(p => p !== permissionId)
  }))
}));
