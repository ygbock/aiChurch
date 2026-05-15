import { describe, it, expect, beforeEach } from 'vitest';
import { platformRegistry, PlatformModule } from './registry';

describe('platformRegistry', () => {
  beforeEach(() => {
    // There is no native clear() on PlatformRegistry as implemented,
    // so we'll test the addition of a unique module id.
  });

  it('should register a module and retrieve it', () => {
    const mockModule: PlatformModule = {
      id: 'test_module_1',
      name: 'Test Module 1',
      category: 'core',
      routes: [],
      enabledByDefault: true,
      widgets: []
    };

    platformRegistry.registerModule(mockModule);

    const retrieved = platformRegistry.getModule('test_module_1');
    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe('test_module_1');
    expect(retrieved?.category).toBe('core');
  });

  it('should return all registered modules', () => {
    const mockModule2: PlatformModule = {
      id: 'test_module_2',
      name: 'Test Module 2',
      routes: [],
      enabledByDefault: false,
    };

    platformRegistry.registerModule(mockModule2);
    
    const allModules = platformRegistry.getAllModules();
    expect(allModules.length).toBeGreaterThanOrEqual(1);
    
    const foundModule2 = allModules.find(m => m.id === 'test_module_2');
    expect(foundModule2).toBeDefined();
    expect(foundModule2?.enabledByDefault).toBe(false);
  });
});
