# @lensjs/watchers

Watcher handlers for Lens. This package provides integrations for various ORMs/query builders (Kysely, Prisma, Sequelize) to emit query and cache events, allowing Lens to observe and log database interactions.

## Features

*   **`createKyselyHandler`**: Integrates with Kysely to capture and format database queries.
*   **`createPrismaHandler`**: Integrates with Prisma to capture and format database queries, with support for different Prisma providers (e.g., SQLite, PostgreSQL, MongoDB).
*   **`createSequelizeHandler`**: Integrates with Sequelize to capture and format database queries.
*   **`emitCacheEvent`**: Emits cache-related events (set, get, delete) to the Lens core.
*   **`watcherEmitter`**: An event emitter for internal communication of query and cache events.

## Installation

```bash
pnpm add @lensjs/watchers
```

## Usage Examples

### Prisma Integration

```typescript
import { PrismaClient } from '@prisma/client';
import { createPrismaHandler } from '@lensjs/watchers/query/prisma';

const prisma = new PrismaClient();

// Initialize the Prisma handler
createPrismaHandler({
  prisma,
  provider: 'sqlite', // or 'postgresql', 'mysql', 'mongodb', etc.
}).then(({ onQuery }) => {
  // 'onQuery' will be called for each captured query
  // You can integrate this with your Lens core setup
  // For example, if Lens core has a method to handle queries:
  // lensCore.handleQuery(queryData);
});

// Your application logic using Prisma
async function main() {
  await prisma.user.findMany();
}

main();
```

### Cache Event Emission

```typescript
import { emitCacheEvent } from '@lensjs/watchers/cache';

// Example of emitting a cache 'write' or 'hit' event
emitCacheEvent({
  action: 'write',
  createdAt: new Date().toISOString(), // createdAt is required by CacheEntry
  data: {
    key: 'user:123',
    value: { id: 123, name: 'Alice' },
  },
});

// Example of emitting a cache 'delete' or 'miss' event
emitCacheEvent({
  action: 'delete',
  createdAt: new Date().toISOString(), // createdAt is required by CacheEntry
  data: {
    key: 'user:456',
  },
});

// Example of emitting a cache 'clear' event
emitCacheEvent({
  action: 'clear',
  createdAt: new Date().toISOString(), // createdAt is required by CacheEntry
  // data property can be omitted or an empty object for 'clear'
});
```