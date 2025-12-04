import { describe, it, expect, vi, beforeEach, Mock} from 'vitest';
import { createKyselyHandler } from '../src/query/kysely';
import { watcherEmitter } from '../src/utils/emitter';

vi.mock('../src/utils/emitter', () => ({
  watcherEmitter: new (vi.fn(() => ({
    on: vi.fn(),
    emit: vi.fn(),
  })))()
}));

vi.mock('@lensjs/core', () => ({
  lensUtils: {
    interpolateQuery: vi.fn((sql, params) => `interpolated(${sql}, ${params.join(', ')})`),
    formatSqlQuery: vi.fn((sql, provider) => `formatted(${sql}, ${provider})`),
  },
}));

vi.mock('@lensjs/date', () => ({
  nowISO: vi.fn(() => '2025-09-05T12:00:00.000Z'),
}));

describe('createKyselyHandler', () => {
  let onQueryMock: Mock;
  let consoleErrorSpy: vi.SpyInstance;

  beforeEach(() => {
    onQueryMock = vi.fn();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.clearAllMocks();
  });

  it('should call onQuery with formatted data for a successful query', async () => {
    const handler = createKyselyHandler({ provider: 'sqlite' });
    await handler({ onQuery: onQueryMock });

    const payload = {
      level: 'query',
      query: {
        sql: 'SELECT * FROM users WHERE id = ?',
        parameters: [1],
      },
      queryDurationMillis: 10.5,
    };

    // Manually emit the event since watcherEmitter is mocked
    (watcherEmitter.on as Mock).mock.calls[0][1](payload);

    expect(onQueryMock).toHaveBeenCalledTimes(1);
    expect(onQueryMock).toHaveBeenCalledWith({
      query: 'formatted(interpolated(SELECT * FROM users WHERE id = ?, 1), sqlite)',
      duration: '10.5 ms',
      type: 'sqlite',
      createdAt: '2025-09-05T12:00:00.000Z',
    });
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it('should log error to console and not call onQuery for an error query when logQueryErrorsToConsole is true', async () => {
    const handler = createKyselyHandler({ provider: 'pg', logQueryErrorsToConsole: true });
    await handler({ onQuery: onQueryMock });

    const errorPayload = {
      level: 'error',
      query: {
        sql: 'INSERT INTO users (name) VALUES (?)',
        parameters: ['test'],
      },
      queryDurationMillis: 5.2,
      error: new Error('Database error'),
    };

    (watcherEmitter.on as Mock).mock.calls[0][1](errorPayload);

    expect(onQueryMock).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith({
      error: errorPayload.error,
      query: 'formatted(interpolated(INSERT INTO users (name) VALUES (?), test), pg)',
      duration: '5.2 ms',
      type: 'pg',
      createdAt: '2025-09-05T12:00:00.000Z',
    });
  });

  it('should not log error to console and not call onQuery for an error query when logQueryErrorsToConsole is false', async () => {
    const handler = createKyselyHandler({ provider: 'mysql', logQueryErrorsToConsole: false });
    await handler({ onQuery: onQueryMock });

    const errorPayload = {
      level: 'error',
      query: {
        sql: 'UPDATE users SET name = ? WHERE id = ?',
        parameters: ['new name', 2],
      },
      queryDurationMillis: 7.8,
      error: new Error('Constraint violation'),
    };

    (watcherEmitter.on as Mock).mock.calls[0][1](errorPayload);

    expect(onQueryMock).not.toHaveBeenCalled();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });
});
