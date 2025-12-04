import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { ApiController } from '../../src/core/api_controller';
import Store from '../../src/abstracts/store';
import { WatcherTypeEnum, Paginator, LensEntry } from '../../src/types';

// Mock implementations for Store
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

// Mock the context module to control getStore and getUiConfig
vi.mock('../../src/context/context', () => ({
  getStore: vi.fn(),
  getUiConfig: vi.fn(),
}));

import { getStore, getUiConfig } from '../../src/context/context';

describe('ApiController', () => {
  let mockStore: MockStore;

  beforeEach(() => {
    mockStore = new MockStore();
    (getStore as Mock).mockReturnValue(mockStore);
    (getUiConfig as Mock).mockReturnValue({
      appName: 'TestApp',
      path: '/lens',
      enabled: true,
    });
    vi.clearAllMocks();
  });

  describe('getRequests', () => {
    it('should return paginated requests', async () => {
      const mockRequests: Omit<LensEntry, 'data'>[] = [
        { id: 'req1', type: WatcherTypeEnum.REQUEST, created_at: 'now', lens_entry_id: null, data: {} },
      ];
      const mockPaginator: Paginator<Omit<LensEntry, 'data'>[]> = {
        data: mockRequests,
        meta: { total: 1, lastPage: 1, currentPage: 1 },
      };
      mockStore.getAllRequests.mockResolvedValue(mockPaginator);

      const result = await ApiController.getRequests({ qs: { page: '1', perPage: '10' } });

      expect(mockStore.getAllRequests).toHaveBeenCalledWith({ page: 1, perPage: 10 });
      expect(result).toEqual({
        status: 200,
        message: 'Data fetched successfully',
        data: mockRequests,
        meta: { total: 1, lastPage: 1, currentPage: 1 },
      });
    });

    it('should use default pagination if qs is empty', async () => {
      const mockRequests: Omit<LensEntry, 'data'>[] = [];
      const mockPaginator: Paginator<Omit<LensEntry, 'data'>[]> = {
        data: mockRequests,
        meta: { total: 0, lastPage: 0, currentPage: 1 },
      };
      mockStore.getAllRequests.mockResolvedValue(mockPaginator);

      await ApiController.getRequests({ qs: {} });

      expect(mockStore.getAllRequests).toHaveBeenCalledWith({ page: 1, perPage: 100 });
    });
  });

  describe('getRequest', () => {
    it('should return a single request with associated queries and cache entries', async () => {
      const mockRequest: LensEntry = {
        id: 'req1',
        type: WatcherTypeEnum.REQUEST,
        created_at: 'now',
        lens_entry_id: null,
        data: { method: 'GET', path: '/test' },
      };
      const mockQueries: LensEntry[] = [
        { id: 'query1', type: WatcherTypeEnum.QUERY, created_at: 'now', lens_entry_id: 'req1', data: { sql: 'SELECT 1' } },
      ];
      const mockCacheEntries: LensEntry[] = [
        { id: 'cache1', type: WatcherTypeEnum.CACHE, created_at: 'now', lens_entry_id: 'req1', data: { key: 'test' } },
      ];

      mockStore.find.mockImplementation((type, id) => {
        if (type === WatcherTypeEnum.REQUEST && id === 'req1') return Promise.resolve(mockRequest);
        return Promise.resolve(null);
      });
      mockStore.allByRequestId.mockImplementation((requestId, type) => {
        if (requestId === 'req1' && type === WatcherTypeEnum.QUERY) return Promise.resolve(mockQueries);
        if (requestId === 'req1' && type === WatcherTypeEnum.CACHE) return Promise.resolve(mockCacheEntries);
        if (requestId === 'req1' && type === WatcherTypeEnum.EXCEPTION) return Promise.resolve([]); // Added for exceptions
        return Promise.resolve([]);
      });

      const result = await ApiController.getRequest({ params: { id: 'req1' }, qs: {} });

      expect(mockStore.find).toHaveBeenCalledWith(WatcherTypeEnum.REQUEST, 'req1');
      expect(mockStore.allByRequestId).toHaveBeenCalledWith('req1', WatcherTypeEnum.QUERY);
      expect(mockStore.allByRequestId).toHaveBeenCalledWith('req1', WatcherTypeEnum.CACHE);
      expect(result).toEqual({
        status: 200,
        message: 'Data fetched successfully',
        data: {
          request: mockRequest,
          queries: mockQueries,
          cacheEntries: mockCacheEntries,
          exceptions: [], // Added this line
        },
      });
    });

    it('should return 404 if request not found', async () => {
      mockStore.find.mockResolvedValue(null);

      const result = await ApiController.getRequest({ params: { id: 'nonexistent' }, qs: {} });

      expect(mockStore.find).toHaveBeenCalledWith(WatcherTypeEnum.REQUEST, 'nonexistent');
      expect(result).toEqual({
        status: 404,
        message: 'Could not find the requested resource',
        data: null,
      });
    });
  });

  describe('getQueries', () => {
    it('should return paginated queries', async () => {
      const mockQueries: LensEntry[] = [
        { id: 'query1', type: WatcherTypeEnum.QUERY, created_at: 'now', lens_entry_id: 'req1', data: { sql: 'SELECT 1' } },
      ];
      const mockPaginator: Paginator<LensEntry[]> = {
        data: mockQueries,
        meta: { total: 1, lastPage: 1, currentPage: 1 },
      };
      mockStore.getAllQueries.mockResolvedValue(mockPaginator);

      const result = await ApiController.getQueries({ qs: { page: '1', perPage: '10' } });

      expect(mockStore.getAllQueries).toHaveBeenCalledWith({ page: 1, perPage: 10 });
      expect(result).toEqual({
        status: 200,
        message: 'Data fetched successfully',
        data: mockQueries,
        meta: { total: 1, lastPage: 1, currentPage: 1 },
      });
    });
  });

  describe('getQuery', () => {
    it('should return a single query', async () => {
      const mockQuery: LensEntry = {
        id: 'query1',
        type: WatcherTypeEnum.QUERY,
        created_at: 'now',
        lens_entry_id: 'req1',
        data: { sql: 'SELECT 1' },
      };
      mockStore.find.mockResolvedValue(mockQuery);

      const result = await ApiController.getQuery({ params: { id: 'query1' }, qs: {} });

      expect(mockStore.find).toHaveBeenCalledWith(WatcherTypeEnum.QUERY, 'query1');
      expect(result).toEqual({
        status: 200,
        message: 'Data fetched successfully',
        data: mockQuery,
      });
    });

    it('should return 404 if query not found', async () => {
      mockStore.find.mockResolvedValue(null);

      const result = await ApiController.getQuery({ params: { id: 'nonexistent' }, qs: {} });

      expect(mockStore.find).toHaveBeenCalledWith(WatcherTypeEnum.QUERY, 'nonexistent');
      expect(result).toEqual({
        status: 404,
        message: 'Could not find the requested resource',
        data: null,
      });
    });
  });

  describe('getCacheEntries', () => {
    it('should return paginated cache entries', async () => {
      const mockCacheEntries: Omit<LensEntry, 'data'>[] = [
        { id: 'cache1', type: WatcherTypeEnum.CACHE, created_at: 'now', lens_entry_id: 'req1', data: {} },
      ];
      const mockPaginator: Paginator<Omit<LensEntry, 'data'>[]> = {
        data: mockCacheEntries,
        meta: { total: 1, lastPage: 1, currentPage: 1 },
      };
      mockStore.getAllCacheEntries.mockResolvedValue(mockPaginator);

      const result = await ApiController.getCacheEntries({ qs: { page: '1', perPage: '10' } });

      expect(mockStore.getAllCacheEntries).toHaveBeenCalledWith({ page: 1, perPage: 10 });
      expect(result).toEqual({
        status: 200,
        message: 'Data fetched successfully',
        data: mockCacheEntries,
        meta: { total: 1, lastPage: 1, currentPage: 1 },
      });
    });
  });

  describe('getCacheEntry', () => {
    it('should return a single cache entry', async () => {
      const mockCacheEntry: LensEntry = {
        id: 'cache1',
        type: WatcherTypeEnum.CACHE,
        created_at: 'now',
        lens_entry_id: 'req1',
        data: { key: 'test' },
      };
      mockStore.find.mockResolvedValue(mockCacheEntry);

      const result = await ApiController.getCacheEntry({ params: { id: 'cache1' }, qs: {} });

      expect(mockStore.find).toHaveBeenCalledWith(WatcherTypeEnum.CACHE, 'cache1');
      expect(result).toEqual({
        status: 200,
        message: 'Data fetched successfully',
        data: mockCacheEntry,
      });
    });

    it('should return 404 if cache entry not found', async () => {
      mockStore.find.mockResolvedValue(null);

      const result = await ApiController.getCacheEntry({ params: { id: 'nonexistent' }, qs: {} });

      expect(mockStore.find).toHaveBeenCalledWith(WatcherTypeEnum.CACHE, 'nonexistent');
      expect(result).toEqual({
        status: 404,
        message: 'Could not find the requested resource',
        data: null,
      });
    });
  });

  describe('truncate', () => {
    it('should call store.truncate and return success response', async () => {
      mockStore.truncate.mockResolvedValue(undefined);

      const result = await ApiController.truncate();

      expect(mockStore.truncate).toHaveBeenCalled();
      expect(result).toEqual({
        status: 200,
        message: 'All entries cleared',
        data: {},
      });
    });
  });

  describe('fetchUiConfig', () => {
    it('should return the UI config', () => {
      const mockUiConfig = { appName: 'TestApp', path: '/lens', enabled: true };
      (getUiConfig as Mock).mockReturnValue(mockUiConfig);

      const result = ApiController.fetchUiConfig();

      expect(getUiConfig).toHaveBeenCalled();
      expect(result).toEqual(mockUiConfig);
    });
  });

  describe('extractPaginationParams', () => {
    it('should return default pagination if no qs', () => {
      const result = (ApiController as any).extractPaginationParams();
      expect(result).toEqual({ page: 1, perPage: 100 });
    });

    it('should return default pagination if qs is empty', () => {
      const result = (ApiController as any).extractPaginationParams({});
      expect(result).toEqual({ page: 1, perPage: 100 });
    });

    it('should parse valid pagination params', () => {
      const result = (ApiController as any).extractPaginationParams({ page: '5', perPage: '20' });
      expect(result).toEqual({ page: 5, perPage: 20 });
    });

    it('should cap perPage at 100', () => {
      const result = (ApiController as any).extractPaginationParams({ page: '1', perPage: '200' });
      expect(result).toEqual({ page: 1, perPage: 100 });
    });

    it('should set perPage to 100 if less than 5', () => {
      const result = (ApiController as any).extractPaginationParams({ page: '1', perPage: '3' });
      expect(result).toEqual({ page: 1, perPage: 100 });
    });

    it('should set page to 1 if less than 1', () => {
      const result = (ApiController as any).extractPaginationParams({ page: '0', perPage: '10' });
      expect(result).toEqual({ page: 1, perPage: 10 });
    });

    it('should handle non-numeric page/perPage values', () => {
      const result = (ApiController as any).extractPaginationParams({ page: 'abc', perPage: 'xyz' });
      expect(result).toEqual({ page: 1, perPage: 100 });
    });
  });
});
