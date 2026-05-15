import { create } from 'zustand';
import { platformRegistry } from '../platform/registry';

export interface SystemModule {
  id: string;
  name: string;
  enabled: boolean;
  branchId?: string;
  districtId?: string;
  organizationId?: string;
}

interface FeatureFlagState {
  modules: SystemModule[];
  isModuleEnabled: (moduleId: string) => boolean;
  enableModule: (moduleId: string, tenantId?: { branchId?: string, districtId?: string, organizationId?: string }) => void;
  disableModule: (moduleId: string, tenantId?: { branchId?: string, districtId?: string, organizationId?: string }) => void;
  syncFromRegistry: () => void;
}

export const useFeatureFlags = create<FeatureFlagState>((set, get) => ({
  modules: [],
  isModuleEnabled: (moduleId) => {
    // If we haven't synced yet, assume registry default
    if (get().modules.length === 0) {
      const allModules = platformRegistry.getAllModules();
      const mod = allModules.find(m => m.id === moduleId);
      return mod ? !!mod.enabledByDefault : false;
    }
    const mod = get().modules.find((m) => m.id === moduleId);
    return mod ? mod.enabled : false;
  },
  syncFromRegistry: () => {
    if (get().modules.length === 0) {
      const allModules = platformRegistry.getAllModules();
      set({ 
        modules: allModules.map(m => ({ 
          id: m.id, 
          name: m.name, 
          enabled: !!m.enabledByDefault 
        })) 
      });
    }
  },
  enableModule: (moduleId, tenantId) => set((state) => ({
    modules: state.modules.map(m => m.id === moduleId ? { ...m, enabled: true, ...tenantId } : m)
  })),
  disableModule: (moduleId, tenantId) => set((state) => ({
    modules: state.modules.map(m => m.id === moduleId ? { ...m, enabled: false, ...tenantId } : m)
  }))
}));
