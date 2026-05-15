import { describe, it, expect, beforeEach } from 'vitest';
import { useFeatureFlags } from './useFeatureFlags';

describe('useFeatureFlags', () => {
  beforeEach(() => {
    // Reset store before each test
    const { syncFromRegistry } = useFeatureFlags.getState();
    syncFromRegistry(); // syncs with platformRegistry which might be empty or have default modules
  });

  it('should enable and disable a module', () => {
    // Since useFeatureFlags syncs with platformRegistry, let's just test the enable/disable functions
    // We'll inject a fake module first if none exists
    useFeatureFlags.setState({
      modules: [{ id: 'test-module', name: 'Test Module', enabled: false, category: 'core', description: 'desc', icon: 'icon' }] as any
    });

    let state = useFeatureFlags.getState();
    expect(state.isModuleEnabled('test-module')).toBe(false);

    state.enableModule('test-module');
    state = useFeatureFlags.getState();
    expect(state.isModuleEnabled('test-module')).toBe(true);

    state.disableModule('test-module');
    state = useFeatureFlags.getState();
    expect(state.isModuleEnabled('test-module')).toBe(false);
  });
});
