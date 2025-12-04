# The providers directory

The `providers` directory contains the service providers exported by your application. Make sure to register these providers within the `exports` collection (aka package entrypoints) defined within the `package.json` file.

## Middleware Registration

For Lens to properly capture all queries within a request's lifecycle, you must register the `LensMiddleware` as a global middleware in your application.

Open your `start/kernel.ts` file and add the following import:

```typescript
import LensMiddleware from '@acme/lens/build/src/middlewares/lens_middleware'
```

Then, register it in the `router.use` array:

```typescript
router.use([
  () => import('@adonisjs/core/bodyparser_middleware'),
  () => import('@adonisjs/session/session_middleware'),
  () => import('@adonisjs/shield/shield_middleware'),
  () => import('@adonisjs/auth/initialize_auth_middleware'),
  LensMiddleware
])
```

Learn more about [package entrypoints](https://nodejs.org/api/packages.html#package-entry-points).
