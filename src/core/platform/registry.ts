import { ComponentType } from 'react';

export interface ModuleNavigation {
  label: string;
  path: string;
  icon?: ComponentType<any>;
  permission?: string;
  category?: 'core' | 'spiritual' | 'operations' | 'admin';
}

export interface ModuleRoute {
  path?: string;
  component?: ComponentType<any>;
  element?: React.ReactNode;
  index?: boolean;
  children?: ModuleRoute[];
  layout?: 'main' | 'none'; // 'main' renders inside Layout, 'none' renders at root. defaults to 'main'
}

export interface PlatformModule {
  id: string;
  name: string;
  category?: 'core' | 'spiritual' | 'operations' | 'admin';
  description?: string;
  routes: ModuleRoute[];
  widgets?: Array<{ id: string; name: string; component: ComponentType<any>; size?: 'small' | 'medium' | 'large' | 'full'; workspace?: string }>;
  navigation?: ModuleNavigation[];
  enabledByDefault: boolean;
}

class PlatformRegistry {
  private modules = new Map<string, PlatformModule>();

  registerModule(module: PlatformModule) {
    if (this.modules.has(module.id)) {
      console.warn(`Module ${module.id} is already registered. Overwriting.`);
    }
    this.modules.set(module.id, module);
  }

  getModule(id: string): PlatformModule | undefined {
    return this.modules.get(id);
  }

  getAllModules(): PlatformModule[] {
    return Array.from(this.modules.values());
  }
}

export const platformRegistry = new PlatformRegistry();
