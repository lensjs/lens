import { describe, it, expect, vi, beforeEach, Mock} from 'vitest';
import { createPrismaHandler } from '../src/query/prisma';
import { lensUtils } from '@lensjs/core';

// Mock dependencies
vi.mock('@lensjs/core', () => ({
  lensUtils: {
    interpolateQuery: vi.fn((sql, params) => `interpolated(${sql}, ${JSON.stringify(params)})`),
    formatSqlQuery: vi.fn((sql, provider) => `formatted(${sql}, ${provider})`),
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
});
