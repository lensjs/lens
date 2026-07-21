import { describe, it, expect, vi, beforeEach, Mock} from 'vitest';
import { createPrismaHandler, withLensPrisma } from '../src/query/prisma';
import { lensUtils, getCurrentRequestId } from '@lensjs/core';
import { watcherEmitter } from '../src/utils/emitter';

// Mock dependencies
vi.mock('@lensjs/core', () => ({
  lensUtils: {
    interpolateQuery: vi.fn((sql, params) => `interpolated(${sql}, ${JSON.stringify(params)})`),
    formatSqlQuery: vi.fn((sql, provider) => `formatted(${sql}, ${provider})`),
  },
  getCurrentRequestId: vi.fn(() => undefined),
}));

vi.mock('../src/utils/emitter', () => ({
  watcherEmitter: {
    on: vi.fn(),
    emit: vi.fn(),
  },
}));

describe('createPrismaHandler', () => {
  let onQueryMock: Mock;
  let prismaMock: any;

  beforeEach(() => {
    vi.clearAllMocks();
    onQueryMock = vi.fn();
    prismaMock = {
      $on: vi.fn(),
    };
  });

  it('should register a query listener with prisma.$on', async () => {
    const handler = createPrismaHandler({ prisma: prismaMock, provider: 'sqlite' });
    await handler({ onQuery: onQueryMock });
    expect(prismaMock.$on).toHaveBeenCalledTimes(1);
    expect(prismaMock.$on).toHaveBeenCalledWith('query', expect.any(Function));
  });

  it('should call onQuery with formatted data for a successful SQL query', async () => {
    const handler = createPrismaHandler({ prisma: prismaMock, provider: 'sqlite' });
    await handler({ onQuery: onQueryMock });

    const prismaQueryEvent = {
      query: 'SELECT * FROM users WHERE id = $1',
      params: '[1]',
      duration: 10.5,
      timestamp: '2025-09-05T12:00:00.000Z',
    };

    // Manually trigger the registered listener
    const listener = prismaMock.$on.mock.calls[0][1];
    await listener(prismaQueryEvent);

    expect(lensUtils.interpolateQuery).toHaveBeenCalledWith(
      prismaQueryEvent.query,
      [1],
    );
    expect(lensUtils.formatSqlQuery).toHaveBeenCalledWith(
      `interpolated(${prismaQueryEvent.query}, [1])`,
      'sqlite',
    );
    expect(onQueryMock).toHaveBeenCalledTimes(1);
    expect(onQueryMock).toHaveBeenCalledWith({
      query: `formatted(interpolated(SELECT * FROM users WHERE id = $1, [1]), sqlite)`,
      duration: '10.5 ms',
      createdAt: prismaQueryEvent.timestamp,
      type: 'sqlite',
    });
  });

  it('should call onQuery with raw query for mongodb provider', async () => {
    const handler = createPrismaHandler({ prisma: prismaMock, provider: 'mongodb' });
    await handler({ onQuery: onQueryMock });

    const prismaQueryEvent = {
      query: 'db.users.find({ _id: 1 })',
      params: '{}',
      duration: 5.0,
      timestamp: '2025-09-05T12:05:00.000Z',
    };

    const listener = prismaMock.$on.mock.calls[0][1];
    await listener(prismaQueryEvent);

    expect(lensUtils.interpolateQuery).not.toHaveBeenCalled();
    expect(lensUtils.formatSqlQuery).not.toHaveBeenCalled();
    expect(onQueryMock).toHaveBeenCalledTimes(1);
    expect(onQueryMock).toHaveBeenCalledWith({
      query: prismaQueryEvent.query,
      duration: '5 ms',
      createdAt: prismaQueryEvent.timestamp,
      type: 'mongodb',
    });
  });

  it.each([
    'BEGIN',
    'COMMIT',
    'ROLLBACK',
    'SAVEPOINT',
  ])('should ignore %s queries for SQL providers', async (ignoredQuery) => {
    const handler = createPrismaHandler({ prisma: prismaMock, provider: 'postgresql' });
    await handler({ onQuery: onQueryMock });

    const prismaQueryEvent = {
      query: ignoredQuery,
      params: '[]',
      duration: 1.0,
      timestamp: '2025-09-05T12:10:00.000Z',
    };

    const listener = prismaMock.$on.mock.calls[0][1];
    await listener(prismaQueryEvent);

    expect(onQueryMock).not.toHaveBeenCalled();
  });

  it('should not ignore BEGIN/COMMIT/ROLLBACK for mongodb provider', async () => {
    const handler = createPrismaHandler({ prisma: prismaMock, provider: 'mongodb' });
    await handler({ onQuery: onQueryMock });

    const prismaQueryEvent = {
      query: 'BEGIN',
      params: '{}',
      duration: 1.0,
      timestamp: '2025-09-05T12:10:00.000Z',
    };

    const listener = prismaMock.$on.mock.calls[0][1];
    await listener(prismaQueryEvent);

    expect(onQueryMock).toHaveBeenCalledTimes(1);
    expect(onQueryMock).toHaveBeenCalledWith(expect.objectContaining({
      query: 'BEGIN',
      type: 'mongodb',
    }));
  });

  describe('withLensPrisma (in-context correlation)', () => {
    it('wraps the client and emits prismaQuery with the in-context requestId + duration', async () => {
      (getCurrentRequestId as Mock).mockReturnValue('req-42');

      let capturedExtension: any;
      const fakeClient = {
        $extends: vi.fn((extension: any) => {
          capturedExtension = extension;
          return { extended: true };
        }),
      };

      const wrapped = withLensPrisma(fakeClient as any, { provider: 'postgresql' });

      expect(fakeClient.$extends).toHaveBeenCalledTimes(1);
      expect(wrapped).toEqual({ extended: true });

      // Simulate Prisma invoking the wrapped operation in-context.
      const queryFn = vi.fn(async () => ['result']);
      const result = await capturedExtension.query.$allOperations({
        model: 'User',
        operation: 'findMany',
        args: { where: { id: 1 } },
        query: queryFn,
      });

      expect(result).toEqual(['result']);
      expect(queryFn).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(watcherEmitter.emit).toHaveBeenCalledTimes(1);

      const [event, payload] = (watcherEmitter.emit as Mock).mock.calls[0];
      expect(event).toBe('prismaQuery');
      expect(payload).toMatchObject({
        query: 'User.findMany({"where":{"id":1}})',
        provider: 'postgresql',
        requestId: 'req-42',
      });
      expect(typeof payload.duration).toBe('number');
    });

    it('forwards prismaQuery events to onQuery with the captured requestId', async () => {
      const handler = createPrismaHandler({ provider: 'postgresql' });
      await handler({ onQuery: onQueryMock });

      const registration = (watcherEmitter.on as Mock).mock.calls.find(
        (call) => call[0] === 'prismaQuery',
      );
      expect(registration).toBeDefined();

      const listener = registration![1];
      await listener({
        query: 'User.findMany({})',
        duration: 3.14159,
        provider: 'postgresql',
        requestId: 'req-7',
      });

      expect(onQueryMock).toHaveBeenCalledWith(
        {
          query: 'User.findMany({})',
          duration: '3.1 ms',
          createdAt: expect.any(String),
          type: 'postgresql',
        },
        'req-7',
      );
    });

    it('ignores prismaQuery events from a different provider', async () => {
      const handler = createPrismaHandler({ provider: 'postgresql' });
      await handler({ onQuery: onQueryMock });

      const listener = (watcherEmitter.on as Mock).mock.calls.find(
        (call) => call[0] === 'prismaQuery',
      )![1];

      await listener({
        query: 'User.findMany({})',
        duration: 1,
        provider: 'mysql',
        requestId: 'req-9',
      });

      expect(onQueryMock).not.toHaveBeenCalled();
    });
  });
});
