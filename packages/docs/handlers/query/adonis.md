# AdonisJS Query Watcher

Lens provides built-in support for monitoring database queries in AdonisJS applications, specifically for the [Lucid ORM](https://lucid.adonisjs.com/docs/debugging#manually-listening-for-the-event).

## Enabling Query Debugging

To enable query watching, you only need to activate the `debug` option in your `config/database.ts` file for the relevant database connection. Below is an example for an SQLite database configuration:

```ts
import app from '@adonisjs/core/services/app'
import { defineConfig } from '@adonisjs/lucid'

const dbConfig = defineConfig({
  connection: 'sqlite',
  connections: {
    sqlite: {
      debug: true, // Set to true to enable query debugging for Lens
      client: 'better-sqlite3',
      connection: {
        filename: app.tmpPath('db.sqlite3'),
      },
      useNullAsDefault: true,
      migrations: {
        naturalSort: true,
        paths: ['database/migrations'],
      },
    },
  },
})

export default dbConfig
```

By setting `debug: true`, Lucid will emit events that Lens can capture and display in its dashboard, allowing you to monitor your database queries in real-time.