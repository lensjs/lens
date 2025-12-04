import { describe, it, expect, vi, beforeEach } from 'vitest';
import Lens from '../../src/core/lens';
import Store from '../../src/abstracts/store';
import Adapter from '../../src/abstracts/adapter';
import Watcher from '../../src/core/watcher';
import { WatcherTypeEnum } from '../../src/types';

// Mock implementations
class MockStore extends Store {
  initialize = vi.fn();
  save = vi.fn();
  getAllRequests = vi.fn();
  getAllQueries = vi.fn();
  getAllCacheEntries = vi.fn();
  allByRequestId = vi.fn();
  find = vi.fn();
  truncate = vi.fn();
  paginate = vi.fn();
  count = vi.fn();
}

class MockAdapter extends Adapter {
  setup = vi.fn();
  registerRoutes = vi.fn();
  serveUI = vi.fn();
  override setWatchers = vi.fn().mockReturnThis();
}

class MockWatcher extends Watcher {
  name = WatcherTypeEnum.QUERY;
  log = vi.fn();
}

describe('Lens', () => {
  let mockStore: MockStore;
  let mockAdapter: MockAdapter;
  let mockWatcher: MockWatcher;

  beforeEach(() => {
    mockStore = new MockStore();
    mockAdapter = new MockAdapter();
    mockWatcher = new MockWatcher();
    
    // Reset static properties of Lens
    Lens['watchers'].clear();
    Lens['store'] = undefined as any;
    Lens['adapter'] = undefined as any;
  });

  it('should set and get a store', async () => {
    Lens.setStore(mockStore);
    const store = await Lens.getStore();
    expect(store).toBe(mockStore);
  });

  it('should set and get an adapter', () => {
    Lens.setAdapter(mockAdapter);
    const adapter = Lens.getAdapter();
    expect(adapter).toBe(mockAdapter);
  });

  it('should throw an error if adapter is not set', () => {
    expect(() => Lens.getAdapter()).toThrow('No adapter has been set');
  });

  it('should add a watcher', () => {
    Lens.watch(mockWatcher);
    expect(Lens['watchers'].get(WatcherTypeEnum.QUERY)).toBe(mockWatcher);
  });

  it('should start and configure the adapter', async () => {
    Lens.setStore(mockStore);
    Lens.setAdapter(mockAdapter);
    Lens.watch(mockWatcher);

    await Lens.start({ path: 'test', appName: 'TestApp', enabled: true });

    expect(mockAdapter.setWatchers).toHaveBeenCalledWith([mockWatcher]);
    expect(mockAdapter.setup).toHaveBeenCalled();
    expect(mockAdapter.registerRoutes).toHaveBeenCalled();
    expect(mockAdapter.serveUI).toHaveBeenCalled();
  });

  it('should not start if not enabled', async () => {
    Lens.setAdapter(mockAdapter);
    await Lens.start({ path: 'test', appName: 'TestApp', enabled: false });

    expect(mockAdapter.setup).not.toHaveBeenCalled();
  });
});
