import { describe, it, expect, vi, beforeEach, Mock} from 'vitest';
import CacheWatcher from '../../src/watchers/cache_watcher';
import { getStore } from '../../src/context/context';
import Store from '../../src/abstracts/store';
import { WatcherTypeEnum, CacheEntry } from '../../src/types';

// Mock Store implementation
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

// Mock the context module to control getStore
vi.mock('../../src/context/context', () => ({
  getStore: vi.fn(),
}));

describe('CacheWatcher', () => {
  let mockStore: MockStore;
  let cacheWatcher: CacheWatcher;

  beforeEach(() => {
    mockStore = new MockStore();
    (getStore as Mock).mockReturnValue(mockStore);
    cacheWatcher = new CacheWatcher();
    vi.clearAllMocks();
  });

  it('should have the correct name', () => {
    expect(cacheWatcher.name).toBe(WatcherTypeEnum.CACHE);
  });

  describe('log', () => {
    it('should save cache entry with minimal data and full data', async () => {
      const mockCacheEntry: CacheEntry = {
        action: 'write',
        data: { key: 'user:1', value: { name: 'John Doe' } },
        requestId: 'req123',
        createdAt: '2023-01-01T12:00:00Z',
      };

      await cacheWatcher.log(mockCacheEntry);

      expect(mockStore.save).toHaveBeenCalledWith({
        requestId: 'req123',
        type: WatcherTypeEnum.CACHE,
        data: {
          action: 'write',
          data: { key: 'user:1', value: { name: 'John Doe' } },
          requestId: 'req123',
          createdAt: '2023-01-01T12:00:00Z',
        },
        minimal_data: {
          action: 'write',
          key: 'user:1',
          createdAt: '2023-01-01T12:00:00Z',
        },
      });
    });

    it('should handle cache entry without requestId', async () => {
      const mockCacheEntry: CacheEntry = {
        action: 'delete',
        data: { key: 'product:5' },
        createdAt: '2023-01-01T12:05:00Z',
      };

      await cacheWatcher.log(mockCacheEntry);

      expect(mockStore.save).toHaveBeenCalledWith({
        requestId: '',
        type: WatcherTypeEnum.CACHE,
        data: {
          action: 'delete',
          data: { key: 'product:5', value: '' },
          requestId: '',
          createdAt: '2023-01-01T12:05:00Z',
        },
        minimal_data: {
          action: 'delete',
          key: 'product:5',
          createdAt: '2023-01-01T12:05:00Z',
        },
      });
    });

    it('should normalize payload when data is empty object', async () => {
      const mockCacheEntry: CacheEntry = {
        action: 'clear',
        data: {},
        requestId: 'req456',
        createdAt: '2023-01-01T12:10:00Z',
      };

      await cacheWatcher.log(mockCacheEntry);

      expect(mockStore.save).toHaveBeenCalledWith({
        requestId: 'req456',
        type: WatcherTypeEnum.CACHE,
        data: {
          action: 'clear',
          data: { key: '', value: '' },
          requestId: 'req456',
          createdAt: '2023-01-01T12:10:00Z',
        },
        minimal_data: {
          action: 'clear',
          key: '',
          createdAt: '2023-01-01T12:10:00Z',
        },
      });
    });

    it('should normalize payload when data is null or undefined', async () => {
      const mockCacheEntry: CacheEntry = {
        action: 'clear',
        requestId: 'req789',
        createdAt: '2023-01-01T12:15:00Z',
      };

      await cacheWatcher.log(mockCacheEntry);

      expect(mockStore.save).toHaveBeenCalledWith({
        requestId: 'req789',
        type: WatcherTypeEnum.CACHE,
        data: {
          action: 'clear',
          data: { key: '', value: '' },
          requestId: 'req789',
          createdAt: '2023-01-01T12:15:00Z',
        },
        minimal_data: {
          action: 'clear',
          key: '',
          createdAt: '2023-01-01T12:15:00Z',
        },
      });
    });

    it('should normalize payload when data has no key or value', async () => {
      const mockCacheEntry: CacheEntry = {
        action: 'clear',
        data: { someOtherField: 'value' },
        requestId: 'req101',
        createdAt: '2023-01-01T12:20:00Z',
      };

      await cacheWatcher.log(mockCacheEntry);

      expect(mockStore.save).toHaveBeenCalledWith({
        requestId: 'req101',
        type: WatcherTypeEnum.CACHE,
        data: {
          action: 'clear',
          data: { key: '', value: '' },
          requestId: 'req101',
          createdAt: '2023-01-01T12:20:00Z',
        },
        minimal_data: {
          action: 'clear',
          key: '',
          createdAt: '2023-01-01T12:20:00Z',
        },
      });
    });
  });
});
