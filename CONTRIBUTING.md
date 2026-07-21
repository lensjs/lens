# Contributing to LensJS

Thanks for your interest in improving LensJS — a framework-agnostic observability tool for
Node.js (Laravel Telescope for Node). This guide covers how the monorepo is organized, how to
develop and test, and the conventions every change must follow.

For deeper, enforceable conventions, see the rules in [`.cursor/rules/`](.cursor/rules) — this
document is the human-facing summary and points to those rules throughout.

## Table of contents

- [Ground rules](#ground-rules)
- [Repository layout](#repository-layout)
- [Prerequisites](#prerequisites)
- [Getting started](#getting-started)
- [Common commands](#common-commands)
- [Architecture in one minute](#architecture-in-one-minute)
- [Where does my change go?](#where-does-my-change-go)
- [Coding conventions](#coding-conventions)
- [Testing](#testing)
- [Documentation](#documentation)
- [Security & privacy](#security--privacy)
- [Commits, changesets & releases](#commits-changesets--releases)
- [Opening a pull request](#opening-a-pull-request)
- [Filing an issue](#filing-an-issue)

## Ground rules

1. Treat the repository as the source of truth. Prefer existing patterns over new abstractions.
2. Reuse `@lensjs/core` primitives; never duplicate watcher/store/context/routing logic.
3. This is a published open-source library — every public API and `package.json` `exports` entry
   is a contract. Avoid breaking changes without a `major` changeset.
4. Never log or persist secrets/PII.
5. Keep changes minimal and scoped; add tests and docs with behavior changes.

## Repository layout

pnpm workspaces + Turborepo:

- `packages/core` -> `@lensjs/core`: the engine (abstracts, watchers, stores, context, emitter,
  API controller, `Lens` orchestrator) plus the React dashboard in `src/ui`.
- `packages/express | fastify | nestjs | adonis` -> `@lensjs/<framework>`: framework adapters.
- `packages/handlers` -> `@lensjs/watchers`: ORM/mailer integrations (Prisma, Kysely, Sequelize,
  Nodemailer).
- `packages/docs` -> `docs`: VitePress documentation site (not published).
- `shared/date` -> `@lensjs/date`; `shared/typescript-config` -> `@lensjs/typescript-config`.
- `apps/*`: runnable example apps per framework (not published).

## Prerequisites

- Node.js 20+ (CI runs Node 20; some packages set Node 18+ as the build target).
- pnpm (see the `packageManager` field in the root `package.json`). Use **pnpm only** — never
  `npm install` or `yarn`.

## Getting started

```bash
pnpm install
pnpm build      # builds all packages respecting the dependency graph
pnpm test       # runs the test suites
```

## Common commands

Run from the repo root:

- `pnpm build` — build all packages (Turborepo, dependency-aware).
- `pnpm dev` — run dev tasks.
- `pnpm run dev:front` — run the dashboard UI dev server.
- `pnpm test` — run all tests (Vitest).
- `pnpm changeset add` — create a changeset for a user-facing change.

The dashboard UI lives in `packages/core/src/ui` and is built and copied into
`@lensjs/core`'s `dist/ui` during `pnpm build`. After UI changes, rebuild core so adapters serve
the updated bundle.

## Architecture in one minute

Dependencies point toward core/date only:

```
@lensjs/date  <—  @lensjs/core  <—  @lensjs/{express,fastify,nestjs,adonis}
                       ^
                @lensjs/watchers (handlers)
```

- Core owns the neutral data contracts (`RequestEntry`, `QueryEntry`, `CacheEntry`, `MailEntry`,
  `ExceptionEntry`), the store interface, the API routes, and the dashboard.
- Adapters translate one web framework into core calls; handlers translate one ORM/mailer.
- Events are correlated to a request via an `AsyncLocalStorage` context (`lensContext`), or the
  framework-idiomatic equivalent in Adonis.

See [`.cursor/rules/architecture.mdc`](.cursor/rules/architecture.mdc) for the full model.

## Where does my change go?

- Capture a new signal type -> add a **Watcher**
  ([`watchers.mdc`](.cursor/rules/watchers.mdc)).
- New persistence backend -> extend **Store** and `Lens.setStore()`
  ([`stores.mdc`](.cursor/rules/stores.mdc)).
- Support a new web framework -> add an **Adapter** extending `LensAdapter`
  ([`adapters.mdc`](.cursor/rules/adapters.mdc)), plus an example under `apps/`.
- Integrate a new ORM/mailer -> add a handler in `@lensjs/watchers`
  ([`packages.mdc`](.cursor/rules/packages.mdc), [`watchers.mdc`](.cursor/rules/watchers.mdc)).
- Dashboard change -> follow [`frontend.mdc`](.cursor/rules/frontend.mdc).

Shared logic belongs in `@lensjs/core` (framework/driver-agnostic) or `@lensjs/date` (time);
framework-specific logic belongs only in that framework's adapter.

## Coding conventions

TypeScript is strict and dual-target (ESM + CJS via `tsup`). Highlights (full details in
[`typescript.mdc`](.cursor/rules/typescript.mdc) and [`packages.mdc`](.cursor/rules/packages.mdc)):

- `import type` for types; `node:` prefix for built-ins; explicit return types on exports; no
  `any` in public types; handle every promise (`await` or `void`).
- File names `snake_case.ts`; `PascalCase` types/classes; `camelCase` values; enums use the
  `...Enum` suffix. UI components are `PascalCase.tsx`.
- Internal packages are referenced with `"workspace:*"`; never relative cross-package imports.
- Keep drivers/frameworks as peer/dev dependencies; keep the public barrel minimal.

## Testing

- Vitest, per package under `tests/`. Core mirrors `src/`; handlers use one file per tool.
- Mock the store (extend the abstract `Store` with `vi.fn()`), the context, and time; assert
  exact persisted payloads. Never touch a real DB/network/clock.
- Add or update tests for every bug fix and new behavior. See
  [`testing.mdc`](.cursor/rules/testing.mdc).

## Documentation

- Update `packages/docs` (VitePress) when public behavior changes, and wire new pages into the
  sidebar in `.vitepress/config.mts`. Consumer install snippets use `npm`; contributor docs use
  `pnpm`. See [`documentation.mdc`](.cursor/rules/documentation.mdc).

## Security & privacy

- Never capture, log, or persist secrets or PII. Request redaction is centralized in
  `RequestWatcher` (`hiddenParams` -> `*******`); adapters purge binary/file bodies to
  `"Purged By Lens"`; user data is gated behind `isAuthenticated`/`getUser`.
- Never commit real credentials to code, tests, fixtures, or docs. See
  [`security.mdc`](.cursor/rules/security.mdc).

## Commits, changesets & releases

- Commits follow Conventional Commits and are enforced by a commitlint hook. Example:
  `feat(express): capture x-forwarded-for as client ip`.
- Any user-facing `@lensjs/*` change needs a changeset: `pnpm changeset add` (pick `patch` /
  `minor` / `major`) and commit the generated `.changeset/*.md`.
- Do not hand-edit `version` or `CHANGELOG.md`, and do not skip hooks. Docs-only, example-only,
  or internal-tooling changes need no changeset. See
  [`release.mdc`](.cursor/rules/release.mdc) and [`RELEASE_STEPS.md`](RELEASE_STEPS.md).

## Opening a pull request

Before you open a PR:

- [ ] Change is in the correct package/layer and respects boundaries.
- [ ] No duplicated logic; existing primitives reused.
- [ ] Public API is backward compatible (or a `major` changeset is included).
- [ ] Tests added/updated and `pnpm test` passes.
- [ ] Docs updated (and new pages wired into the sidebar) if public behavior changed.
- [ ] Changeset added for user-facing changes.
- [ ] No secrets/PII; redaction/purge/auth-gating preserved.
- [ ] Conventional Commit messages; hooks not skipped.

Reviewers use the checklist in [`pull-request.mdc`](.cursor/rules/pull-request.mdc).

## Filing an issue

Use the issue templates. For bugs, include a minimal reproduction (an `apps/*` example is a
great base), expected vs actual behavior, and your environment (Lens versions, Node, framework,
ORM/mailer, OS). Triage follows [`issues.mdc`](.cursor/rules/issues.mdc).
