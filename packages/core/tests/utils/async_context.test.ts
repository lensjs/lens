import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { handleUncaughExceptions, lensContext } from '../../src/utils/async_context';
import { ExceptionWatcher } from '../../src/watchers';
import { constructErrorObject } from '../../src/utils/exception';

// Mock constructErrorObject to simplify assertions
vi.mock('../../src/utils/exception', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
        constructErrorObject: vi.fn((err) => ({
      name: err.name,
      message: err.message,
      createdAt: 'mock-date',
      fileInfo: { file: '', function: '' },
      trace: [],
      codeFrame: null,
      originalStack: null,
    })),

  };
});

describe('handleUncaughExceptions', () => {
  let mockLogger: ExceptionWatcher;
  let processOnSpy: vi.SpyInstance;

  beforeEach(() => {
    mockLogger = {
      log: vi.fn(),
      name: 'exception',
      start: vi.fn(),
      stop: vi.fn(),
    };
    // Mock process.on to prevent actual event listener registration
    processOnSpy = vi.spyOn(process, 'on').mockImplementation((event, listener) => {
      // Store the listener for later invocation in tests
      if (event === 'uncaughtExceptionMonitor') {
        (processOnSpy as any)._uncaughtExceptionMonitorListener = listener;
      } else if (event === 'uncaughtException') {
        (processOnSpy as any)._uncaughtExceptionListener = listener;
      }
      return process;
    });
  });

  afterEach(() => {
    processOnSpy.mockRestore();
    vi.clearAllMocks();
  });

  it('should register uncaughtExceptionMonitor listener and log exception', async () => {
    handleUncaughExceptions(mockLogger);

    const error = new Error('Monitor Error');
    const listener = (processOnSpy as any)._uncaughtExceptionMonitorListener;
    expect(listener).toBeDefined();

    if (listener) {
      await listener(error);
    }

    expect(constructErrorObject).toHaveBeenCalledWith(error);
    expect(mockLogger.log).toHaveBeenCalledWith({
      name: 'Error',
      message: 'Monitor Error',
      createdAt: 'mock-date',
      fileInfo: { file: '', function: '' },
      trace: [],
      codeFrame: null,
      originalStack: null,
      requestId: undefined,
    });
  });

  it('should register uncaughtException listener and log exception', async () => {
    handleUncaughExceptions(mockLogger);

    const error = new Error('Uncaught Error');
    const listener = (processOnSpy as any)._uncaughtExceptionListener;
    expect(listener).toBeDefined();

    if (listener) {
      await listener(error);
    }

    expect(constructErrorObject).toHaveBeenCalledWith(error);
    expect(mockLogger.log).toHaveBeenCalledWith({
      name: 'Error',
      message: 'Uncaught Error',
      createdAt: 'mock-date',
      fileInfo: { file: '', function: '' },
      trace: [],
      codeFrame: null,
      originalStack: null,
      requestId: undefined,
    });
  });

  it('should include requestId from lensContext if available', async () => {
    handleUncaughExceptions(mockLogger);

    const requestId = 'test-request-id';
    const error = new Error('Context Error');

    await lensContext.run({ requestId }, async () => {
      const listener = (processOnSpy as any)._uncaughtExceptionMonitorListener;
      if (listener) {
        await listener(error);
      }
    });

    expect(mockLogger.log).toHaveBeenCalledWith(expect.objectContaining({
      requestId: requestId,
    }));
  });
});
