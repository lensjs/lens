# AGENTS.md — LensJS AI Coding Playbook

This is the agent brief for LensJS: a compact architecture summary, the repository conventions
cheat-sheet, and the step-by-step playbook to follow when generating code. The enforceable
detail lives in [`.cursor/rules/`](.cursor/rules); this file tells you how to apply it.

LensJS is a framework-agnostic observability library for Node.js (Laravel Telescope for Node):
it captures requests, DB queries, cache ops, sent mail, and exceptions and shows them in a
bundled React dashboard.

## Architecture summary

Dependencies point one direction — toward core/date. Nothing to the right may leak left.

```
@lensjs/date  <—  @lensjs/core  <—  @lensjs/{express,fastify,nestjs,adonis}  (adapters)
                       ^
                @lensjs/watchers  (handlers: prisma / kysely / sequelize / nodemailer)
```

- `@lensjs/core` — the engine: abstract `Watcher` / `Store` / `Adapter`, the `Lens`
  orchestrator, `lensContext` (AsyncLocalStorage) + `Container` (DI), `lensEmitter`,
  `ApiController` + the route table, the default `QueuedSqliteStore`
  (`compose(BetterSqliteStore, QueuedStore)`), and the dashboard in `src/ui`.
- Adapters extend `LensAdapter` and implement `setup()` / `registerRoutes()` / `serveUI()`.
  They translate a framework into core calls and NEVER re-implement core logic. `@lensjs/express`
  is the template.
- Handlers (`@lensjs/watchers`) translate one ORM/mailer into core's neutral data shapes via
  the `onQuery` callback (Prisma/Kysely/Sequelize) or `lensEmitter.emit` (cache/mail).
- Core owns the neutral contracts (`RequestEntry`, `QueryEntry`, `CacheEntry`, `MailEntry`,
  `ExceptionEntry`, `Paginator<T>`, `ApiResponse<T>`). Everything correlates to a `requestId`.

Boot sequence (`Lens.start()`): bail if disabled -> bind store + `uiConfig` in the container ->
`adapter.setWatchers(...).setup()` -> `adapter.registerRoutes(core routes)` ->
`adapter.serveUI(...)`. The dashboard fetches its config at runtime from `GET /lens-config`.

## Repository conventions cheat-sheet

- Package manager: **pnpm** only (never npm/yarn). Task runner: Turborepo. Build: `tsup`
  (ESM + CJS + d.ts, `target: node18`); Adonis builds with `tsc`.
- Internal deps: `"workspace:*"`. No relative cross-package imports — use `@lensjs/*`.
- Dependency tiers: workspace primitives = `dependencies`; ORMs = `devDependencies` (types);
  drivers/frameworks = optional `peerDependencies`.
- Publishable manifest matches `@lensjs/express`: `type: module`, dual `exports`
  (`require`/`import`), `main`/`types`/`files: ["dist"]`, `publishConfig.access: public`,
  `keywords`/`repository.directory`/`homepage`/`bugs`.
- One `.` export per package; minimal `index.ts` barrels; no top-level import side effects.
- TypeScript: strict (`noUncheckedIndexedAccess`, `noImplicitOverride`, ...); `import type`;
  `node:` prefix; explicit return types on exports; no `any` in public types; `override` on
  overrides; handle every promise (`await` or `void`).
- Naming: files `snake_case.ts`; types/classes `PascalCase`; values `camelCase`; enums
  `WatcherTypeEnum`. UI components `PascalCase.tsx`, hooks `use*.ts`.
- Time only via `@lensjs/date` (`nowISO()`), never `new Date()`/Luxon directly.
- Store writes: `{ id?, type, data, minimal_data?, requestId?, timestamp? }` with a
  `minimal_data` (list) vs `data` (detail) split.
- UI: never hardcode `/lens` or API paths — build URLs from injected config via
  `prepareApiUrl` + `useConfig()`. Dark theme only.
- Security: redact secrets/PII before persisting (`hiddenParams` -> `*******`,
  `"Purged By Lens"`); gate user data behind `isAuthenticated`/`getUser`.
- Commits: Conventional Commits (commitlint-enforced). Releases: Changesets (a `major` bump for
  any breaking public change). Never hand-edit `version`/`CHANGELOG.md`; never skip hooks.
- Tests: Vitest under each package's `tests/`; mock store/context/time; assert exact payloads.

## AI coding playbook

When generating or changing code, follow these steps in order:

1. **Search first.** Look for an existing implementation/utility (`lensUtils`, `@lensjs/date`,
   existing watchers/adapters/handlers/stores) before writing anything.
2. **Reuse existing utilities.** Extend or call them rather than re-deriving logic.
3. **Never duplicate functionality.** If two places need it, put it in core (or `@lensjs/date`)
   and import it.
4. **Follow repository naming and placement** (see the cheat-sheet and `typescript.mdc` /
   `packages.mdc`).
5. **Preserve the architecture and boundaries.** Put framework code in adapters, driver code in
   handlers, shared/neutral code in core. Reject changes that blur these.
6. **Keep public APIs backward compatible.** Add new symbols instead of changing existing ones;
   a breaking change requires a `major` changeset.
7. **Generate tests** for the behavior (mock store/context/time; assert exact payloads).
8. **Update documentation** when public behavior changes, and wire new docs pages into the
   VitePress sidebar.
9. **Keep changes minimal and scoped.** No opportunistic refactors of unrelated code.
10. **Explain the architectural reasoning** behind non-trivial changes.

Then, before finishing: add a changeset if the change is user-facing, ensure `pnpm test` would
pass, and confirm no secrets/PII are captured or committed.

## Extension points (the only sanctioned ways to extend)

- New captured signal -> a `Watcher` (`.cursor/rules/watchers.mdc`).
- New persistence backend -> a `Store` + `Lens.setStore()` (`.cursor/rules/stores.mdc`).
- New web framework -> a `LensAdapter` + `apps/` example (`.cursor/rules/adapters.mdc`).
- New ORM/mailer -> a handler in `@lensjs/watchers` (`.cursor/rules/watchers.mdc`).

## Never do

- Put framework- or ORM-specific code in `@lensjs/core`.
- Re-implement core capture/store/context/routing inside an adapter or handler.
- Import across packages by relative path.
- Widen/break a public type or `exports` path without a `major` changeset.
- Log or persist secrets/PII; bypass redaction, purging, or auth-gating.
- Block the host app's request path with sync/awaited capture I/O.

## Rule index

`.cursor/rules/`: `architecture`, `typescript`, `packages`, `watchers`, `stores`, `adapters`,
`frontend`, `testing`, `documentation`, `performance`, `security`, `pull-request`, `issues`,
`release`. Human contributor guide: [`CONTRIBUTING.md`](CONTRIBUTING.md).
