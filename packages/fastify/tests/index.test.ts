import { describe, it, expect, vi, beforeEach } from 'vitest';
import { lens } from './index';
import { FastifyAdapter } from '../src/adapter';
import {
  CacheWatcher,
  ExceptionWatcher,
  Lens,
  lensContext,
  lensEmitter,
  lensExceptionUtils,
  lensUtils,
  QueryWatcher,
  RequestWatcher,
  WatcherTypeEnum,
} from '@lensjs/core';
import { FastifyInstance, FastifyError } from 'fastify';

// Create mock watcher instances outside of vi.mock to ensure consistent references
// These will be the actual instances returned by the mocked @lensjs/core watchers
let currentMockRequestWatcher: any;
let currentMockCacheWatcher: any;
let currentMockQueryWatcher: any;
let currentMockExceptionWatcher: any;

// Mock external dependencies
vi.mock('@lensjs/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@lensjs/core')>();
  return {
    ...actual,
    Lens: {
      setAdapter: vi.fn().mockReturnThis(),
      setWatchers: vi.fn().mockReturnThis(),
      start: vi.fn(),
    },
    lensUtils: {
      ...actual.lensUtils,
      prepareIgnoredPaths: vi.fn((path, ignored) => ({
        ignoredPaths: ignored,
        normalizedPath: path,
      })),
      generateRandomUuid: vi.fn(() => 'mock-uuid'),
      prettyHrTime: vi.fn(() => '1ms'),
      isStaticFile: vi.fn(() => false),
      stripBeforeAssetsPath: vi.fn((url) => url),
    },
    lensContext: {
      ...actual.lensContext,
      getStore: vi.fn(() => ({ requestId: 'mock-request-id' })),
      run: vi.fn((_context, cb) => cb()),
    },
    lensEmitter: {
      ...actual.lensEmitter,
      on: vi.fn(),
    },
    lensExceptionUtils: {
      ...actual.lensExceptionUtils,
      constructErrorObject: vi.fn((error) => ({
        message: error.message,
        stack: error.stack,
      })),
    },
    // Ensure these return the consistent mock instances
    RequestWatcher: vi.fn(() => {
      currentMockRequestWatcher = { name: WatcherTypeEnum.REQUEST, log: vi.fn() };
      return currentMockRequestWatcher;
    }),
    CacheWatcher: vi.fn(() => {
      currentMockCacheWatcher = { name: WatcherTypeEnum.CACHE, log: vi.fn() };
      return currentMockCacheWatcher;
    }),
    QueryWatcher: vi.fn(() => {
      currentMockQueryWatcher = { name: WatcherTypeEnum.QUERY, log: vi.fn() };
      return currentMockQueryWatcher;
    }),
    ExceptionWatcher: vi.fn(() => {
      currentMockExceptionWatcher = { name: WatcherTypeEnum.EXCEPTION, log: vi.fn() };
      return currentMockExceptionWatcher;
    }),
  };
});

// Mock fastify instance
const mockFastifyInstance = {
  addHook: vi.fn(),
  route: vi.fn(),
  register: vi.fn(),
  setErrorHandler: vi.fn((handler) => {
    // Store the handler to be called later in tests
    (mockFastifyInstance as any).errorHandler = handler;
  }),
  get: vi.fn(),
} as unknown as FastifyInstance;

// Mock FastifyAdapter separately to control its instance behavior
const mockAdapterInstance = {
  setConfig: vi.fn().mockReturnThis(),
  setIgnoredPaths: vi.fn().mockReturnThis(),
  setOnlyPaths: vi.fn().mockReturnThis(),
  setup: vi.fn(), // Keep setup as a spy, but remove assertions for it being called directly
  registerRoutes: vi.fn(),
  serveUI: vi.fn(),
  getWatchers: vi.fn(() => [
    currentMockRequestWatcher,
    currentMockCacheWatcher,
    currentMockQueryWatcher,
    currentMockExceptionWatcher,
  ]),
};

vi.mock('../src/adapter', () => {
  const FastifyAdapter = vi.fn(() => mockAdapterInstance);
  return { FastifyAdapter };
});

describe('lens', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the errorHandler mock
    (mockFastifyInstance as any).errorHandler = undefined;

    // Reset mockAdapterInstance methods
    mockAdapterInstance.setConfig.mockClear().mockReturnThis();
    mockAdapterInstance.setIgnoredPaths.mockClear().mockReturnThis();
    mockAdapterInstance.setOnlyPaths.mockClear().mockReturnThis();
    mockAdapterInstance.setup.mockClear();
    mockAdapterInstance.registerRoutes.mockClear();
    mockAdapterInstance.serveUI.mockClear();

    // Reset currentMockWatcher references and their log spies
    currentMockRequestWatcher = { name: WatcherTypeEnum.REQUEST, log: vi.fn() };
    currentMockCacheWatcher = { name: WatcherTypeEnum.CACHE, log: vi.fn() };
    currentMockQueryWatcher = { name: WatcherTypeEnum.QUERY, log: vi.fn() };
    currentMockExceptionWatcher = { name: WatcherTypeEnum.EXCEPTION, log: vi.fn() };

    // Ensure getWatchers returns the newly created mock instances
    mockAdapterInstance.getWatchers.mockClear().mockReturnValue([
      currentMockRequestWatcher,
      currentMockCacheWatcher,
      currentMockQueryWatcher,
      currentMockExceptionWatcher,
    ]);

    // Reset Lens mocks
    Lens.setAdapter.mockClear().mockReturnThis();
    Lens.setWatchers.mockClear().mockReturnThis();
    Lens.start.mockClear();

    // Reset lensContext mock
    lensContext.getStore.mockClear().mockReturnValue({ requestId: 'mock-request-id' });
    lensContext.run.mockClear().mockImplementation((_context, cb) => cb());

    // Reset lensExceptionUtils mock
    lensExceptionUtils.constructErrorObject.mockClear().mockImplementation((error) => ({
      message: error.message,
      stack: error.stack,
    }));
  });

  it('should be a function', () => {
    expect(typeof lens).toBe('function');
  });

  it('should initialize Lens with default configuration', async () => {
    await lens({ app: mockFastifyInstance });

    expect(FastifyAdapter).toHaveBeenCalledWith({ app: mockFastifyInstance });
    expect(Lens.setAdapter).toHaveBeenCalledWith(mockAdapterInstance);
    expect(Lens.setWatchers).toHaveBeenCalledWith(expect.any(Array));
    expect(Lens.start).toHaveBeenCalledWith({
      appName: 'Lens',
      enabled: true,
      basePath: '/lens',
    });

    expect(mockAdapterInstance.setConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        appName: 'Lens',
        enabled: true,
        path: '/lens',
        requestWatcherEnabled: true,
        cacheWatcherEnabled: false,
        exceptionWatcherEnabled: true,
        registerErrorHandler: true,
      })
    );
    expect(mockAdapterInstance.setIgnoredPaths).toHaveBeenCalledWith([]);
    expect(mockAdapterInstance.setOnlyPaths).toHaveBeenCalledWith([]);
  });

  it('should initialize Lens with custom configuration', async () => {
    const customConfig = {
      app: mockFastifyInstance,
      appName: 'MyCustomLens',
      enabled: false,
      path: '/custom-lens',
      ignoredPaths: [/\/api\//],
      onlyPaths: [/\/admin\//],
      requestWatcherEnabled: false,
      cacheWatcherEnabled: true,
      exceptionWatcherEnabled: false,
      registerErrorHandler: false,
      queryWatcher: { enabled: true, handler: vi.fn() },
    };

    await lens(customConfig);

    expect(Lens.start).toHaveBeenCalledWith({
      appName: 'MyCustomLens',
      enabled: false,
      basePath: '/custom-lens',
    });

    expect(mockAdapterInstance.setConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        appName: 'MyCustomLens',
        enabled: false,
        path: '/custom-lens',
        requestWatcherEnabled: false,
        cacheWatcherEnabled: true,
        exceptionWatcherEnabled: false,
        registerErrorHandler: false,
        queryWatcher: expect.objectContaining({ enabled: true }),
      })
    );
    expect(mockAdapterInstance.setIgnoredPaths).toHaveBeenCalledWith([/\/api\//]);
    expect(mockAdapterInstance.setOnlyPaths).toHaveBeenCalledWith([/\/admin\//]);
  });

  it('should register error handler if exceptionWatcherEnabled and registerErrorHandler are true', async () => {
    await lens({ app: mockFastifyInstance, exceptionWatcherEnabled: true, registerErrorHandler: true });
    expect(mockFastifyInstance.setErrorHandler).toHaveBeenCalledTimes(1);
  });

  it('should NOT register error handler if registerErrorHandler is false', async () => {
    await lens({ app: mockFastifyInstance, exceptionWatcherEnabled: true, registerErrorHandler: false });
    expect(mockFastifyInstance.setErrorHandler).not.toHaveBeenCalled();
  });

  it('should NOT register error handler if exceptionWatcherEnabled is false', async () => {
    await lens({ app: mockFastifyInstance, exceptionWatcherEnabled: false, registerErrorHandler: true });
    expect(mockFastifyInstance.setErrorHandler).not.toHaveBeenCalled();
  });

  it('should log exceptions via the registered error handler', async () => {
    await lens({
      app: mockFastifyInstance,
      exceptionWatcherEnabled: true,
      registerErrorHandler: true,
    });

    const error = new Error('Test Error') as FastifyError;
    error.statusCode = 500;

    // Simulate Fastify calling the error handler
    if ((mockFastifyInstance as any).errorHandler) {
      await (mockFastifyInstance as any).errorHandler(error, {}, {});
    }

    expect(lensExceptionUtils.constructErrorObject).toHaveBeenCalledWith(error);
    expect(currentMockExceptionWatcher.log).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Test Error',
        stack: expect.any(String),
        requestId: 'mock-request-id',
      })
    );
  });

  it('should export a logException function that logs to the exception watcher', async () => {
    await lens({
      app: mockFastifyInstance,
      exceptionWatcherEnabled: true,
      registerErrorHandler: true,
    });

    const error = new Error('Direct Log Error') as FastifyError;

    const { logException } = await lens({
      app: mockFastifyInstance,
      exceptionWatcherEnabled: true,
      registerErrorHandler: true,
    });

    logException(error);

    expect(lensExceptionUtils.constructErrorObject).toHaveBeenCalledWith(error);
    expect(currentMockExceptionWatcher.log).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Direct Log Error',
        stack: expect.any(String),
        requestId: 'mock-request-id',
      })
    );
  });

  it('should not log exception if exceptionWatcherEnabled is false for direct logException', async () => {
    await lens({
      app: mockFastifyInstance,
      exceptionWatcherEnabled: false,
    });

    const error = new Error('Should Not Log') as FastifyError;
    const { logException } = await lens({
      app: mockFastifyInstance,
      exceptionWatcherEnabled: false,
    });

    logException(error);

    expect(currentMockExceptionWatcher.log).not.toHaveBeenCalled();
    expect(lensExceptionUtils.constructErrorObject).not.toHaveBeenCalled();
  });

  it('should not log exception if exceptionWatcher is not found for direct logException', async () => {
    // To simulate no exception watcher, we set exceptionWatcherEnabled to false
    // in the lens configuration, so it's not added to the watchers array.
    const { logException } = await lens({
      app: mockFastifyInstance,
      exceptionWatcherEnabled: false, // <-- Key change here
    });

    const error = new Error('No Watcher') as FastifyError;
    logException(error);

    expect(lensExceptionUtils.constructErrorObject).not.toHaveBeenCalled();
  });

  it('should correctly pass ignoredPaths and onlyPaths to the adapter', async () => {
    const ignored = [/\/ignore\//];
    const only = [/\/only\//];
    await lens({ app: mockFastifyInstance, ignoredPaths: ignored, onlyPaths: only });

    expect(mockAdapterInstance.setIgnoredPaths).toHaveBeenCalledWith(ignored);
    expect(mockAdapterInstance.setOnlyPaths).toHaveBeenCalledWith(only);
  });

  it('should correctly prepare ignored paths using lensUtils', async () => {
    const customPath = '/my-lens';
    const customIgnored = [/\/custom-ignore\//];
    await lens({ app: mockFastifyInstance, path: customPath, ignoredPaths: customIgnored });

    expect(lensUtils.prepareIgnoredPaths).toHaveBeenCalledWith(customPath, customIgnored);
  });

  it('should set up watchers based on configuration', async () => {
    await lens({
      app: mockFastifyInstance,
      requestWatcherEnabled: true,
      cacheWatcherEnabled: true,
      queryWatcher: { enabled: true, handler: vi.fn() },
      exceptionWatcherEnabled: true,
    });

    expect(Lens.setWatchers).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ name: WatcherTypeEnum.REQUEST }),
        expect.objectContaining({ name: WatcherTypeEnum.CACHE }),
        expect.objectContaining({ name: WatcherTypeEnum.QUERY }),
        expect.objectContaining({ name: WatcherTypeEnum.EXCEPTION }),
      ])
    );
  });

  it('should not include disabled watchers in the Lens instance', async () => {
    await lens({
      app: mockFastifyInstance,
      requestWatcherEnabled: false,
      cacheWatcherEnabled: false,
      queryWatcher: { enabled: false, handler: vi.fn() },
      exceptionWatcherEnabled: false,
    });

    expect(Lens.setWatchers).toHaveBeenCalledWith([]);
  });
});
