# Lens.js AI Guide

This is the operating manual for any AI coding assistant (Claude Code, Cursor, and future tools)
working in this repository. It defines *how to work*; it does not restate the coding rules.

The authoritative conventions live in [`.cursor/rules/`](.cursor/rules). This file references
them — it never duplicates them. For a quick conventions cheat-sheet and the extension-point
map, see [`AGENTS.md`](AGENTS.md); for the human contributor guide, see
[`CONTRIBUTING.md`](CONTRIBUTING.md).

## Project Overview

LensJS is a **framework-agnostic monitoring/observability library for Node.js**, inspired by
Laravel Telescope. It captures requests, DB queries, cache operations, sent mail, and
exceptions, and presents them in a bundled React dashboard.

- **Open source** and published as scoped `@lensjs/*` packages — public APIs are contracts.
- **Extensible by design**: new signals, backends, frameworks, and ORMs plug in via defined
  extension points rather than core edits.
- **Backwards compatibility matters**: breaking a public API or `exports` path requires a
  `major` changeset.

Repository map (pnpm workspaces + Turborepo):

| Path | Package | Role |
| --- | --- | --- |
| `packages/core` | `@lensjs/core` | Engine: abstracts, `Lens` orchestrator, context/DI, emitter, API + routes, default store, and the dashboard in `src/ui` |
| `packages/express\|fastify\|nestjs\|adonis` | `@lensjs/<framework>` | Framework adapters |
| `packages/handlers` | `@lensjs/watchers` | ORM/mailer integrations (Prisma, Kysely, Sequelize, Nodemailer) |
| `packages/docs` | `docs` | VitePress documentation (not published) |
| `shared/date` / `shared/typescript-config` | `@lensjs/date` / `@lensjs/typescript-config` | Shared time utils / tsconfig presets |
| `apps/*` | — | Runnable example apps per framework (not published) |

## Repository Philosophy

Inferred from the codebase — do not add new principles:

- **Core is the single engine.** All capture, storage, routing, redaction, and UI logic live in
  `@lensjs/core`. Adapters and handlers are thin translators.
- **Dependencies point one way** — toward `@lensjs/core` and `@lensjs/date`. Core never imports
  a framework or ORM; adapters/handlers never import each other's internals.
- **Neutral contracts in core.** `RequestEntry`, `QueryEntry`, `CacheEntry`, `MailEntry`,
  `ExceptionEntry`, `Paginator<T>`, `ApiResponse<T>` are defined once and only *produced*
  elsewhere.
- **Reuse over abstraction.** Prefer existing primitives (`lensUtils`, `@lensjs/date`,
  watchers/stores/adapters/handlers, `compose()` mixins) over new patterns.
- **Observability must not harm the host.** Capture is non-blocking and never throws into the
  app; secrets/PII are always redacted.
- **Stability is a feature.** Additive change (`minor`) is preferred; breaking change is a last
  resort and always a `major`.

## Rule Source of Truth

**ALL coding conventions live in [`.cursor/rules/`](.cursor/rules) and are authoritative.** Read
the relevant rule before changing code in its area. Do not duplicate or paraphrase these rules
elsewhere — reference them.

| Rule | Read it when you are… |
| --- | --- |
| [`architecture.mdc`](.cursor/rules/architecture.mdc) *(always applies)* | Doing anything — layers, boundaries, dependency flow, extension points, golden rules |
| [`packages.mdc`](.cursor/rules/packages.mdc) | Touching `package.json`, `exports`, deps, barrels, or the monorepo setup |
| [`typescript.mdc`](.cursor/rules/typescript.mdc) | Writing any `.ts`/`.tsx` — naming, imports, generics, async, errors |
| [`adapters.mdc`](.cursor/rules/adapters.mdc) | Working on a framework adapter (express/fastify/nestjs/adonis) |
| [`watchers.mdc`](.cursor/rules/watchers.mdc) | Adding/altering a watcher or a `@lensjs/watchers` handler |
| [`stores.mdc`](.cursor/rules/stores.mdc) | Working on persistence or a custom `Store` |
| [`frontend.mdc`](.cursor/rules/frontend.mdc) | Working on the dashboard UI (`packages/core/src/ui`) |
| [`testing.mdc`](.cursor/rules/testing.mdc) | Writing or updating tests |
| [`documentation.mdc`](.cursor/rules/documentation.mdc) | Updating docs (VitePress) or in-code JSDoc |
| [`performance.mdc`](.cursor/rules/performance.mdc) | Anything on the request path or affecting bundle size |
| [`security.mdc`](.cursor/rules/security.mdc) *(always applies)* | Anything that captures, logs, or stores data |
| [`pull-request.mdc`](.cursor/rules/pull-request.mdc) | Reviewing a PR or diff |
| [`issues.mdc`](.cursor/rules/issues.mdc) | Triaging or answering an issue |
| [`release.mdc`](.cursor/rules/release.mdc) | Committing or preparing a release (commits + changesets) |

## AI Workflow

Whenever making a change:

1. **Understand the request** and which signal/package/layer it affects.
2. **Read the relevant Cursor rules** (see the table above), starting with `architecture.mdc`.
3. **Inspect existing implementations** of the same kind (a sibling watcher/adapter/handler).
4. **Reuse existing abstractions** and utilities instead of inventing new ones.
5. **Keep changes minimal** and scoped to the request.
6. **Preserve backwards compatibility** (additive `minor`; breaking = `major` changeset).
7. **Generate/update tests** for the behavior.
8. **Update documentation** when public behavior changes.
9. **Never introduce architectural drift** — no boundary violations, no duplicated logic.

## Before Writing Code

Always:

- **Search for similar implementations** and copy the established shape.
- **Reuse utilities** (`lensUtils`, `@lensjs/date`, `compose()` mixins) rather than re-deriving.
- **Respect package boundaries** — framework code in adapters, driver code in handlers, neutral
  code in core.
- **Understand dependency direction** — only import toward core/date.
- **Avoid duplicate abstractions** — if two places need it, it belongs in core.

## During Development

Never:

- Rewrite large sections unnecessarily or refactor unrelated code.
- Introduce framework- or ORM-specific code into `@lensjs/core` or other shared packages.
- Bypass existing abstractions (e.g. a watcher/adapter talking to a concrete store directly).
- Add a dependency without justification, or put a driver/framework in `dependencies` instead
  of a peer/dev dependency.
- Expose internal APIs publicly (do not leak internals into a package barrel or `exports`).

## Pull Request Review

Follow [`pull-request.mdc`](.cursor/rules/pull-request.mdc). Review the full diff, map each
change to its layer, and check it against that layer's rule. Cover, at minimum:

- **Architecture** & boundaries; no unnecessary abstractions or duplication.
- **API stability** & backwards compatibility (breaking change ⇒ `major` changeset).
- **Performance** — non-blocking instrumentation, no bundle bloat, no leaks.
- **Tests** present and asserting exact behavior.
- **Documentation** updated (and new pages wired into the sidebar).
- **Security** — redaction/purge/auth-gating preserved; no secrets/PII.

Produce the required output: **Summary, Strengths, Problems, Suggested fixes, Risk level,
Merge recommendation.**

## Issue Triage

Follow [`issues.mdc`](.cursor/rules/issues.mdc). Classify the issue
(bug / feature / documentation / question / discussion / duplicate / invalid / needs-reproduction
/ needs-more-info / good-first-issue / help-wanted) and tag the affected package/area. For bugs,
require a **minimal reproduction**, expected vs actual behavior, and environment (Lens versions,
Node, framework, ORM/mailer, OS). For features, evaluate architectural fit, API consistency,
maintenance cost, backward compatibility, and extensibility.

## Code Generation Checklist

Mentally run this before emitting code:

- [ ] I read `architecture.mdc` + the rule(s) for the area I'm changing.
- [ ] A similar implementation exists — I'm matching its shape and naming.
- [ ] I'm reusing utilities/primitives, not duplicating logic.
- [ ] The change is in the correct package and respects dependency direction.
- [ ] No framework/ORM code is entering a shared package; no internal is being exposed.
- [ ] Public API is unchanged or additive (else a `major` changeset).
- [ ] No secrets/PII captured, logged, or persisted; redaction/purge/auth-gating intact.
- [ ] Instrumentation stays non-blocking; no new heavy dependency.
- [ ] Tests added/updated; docs updated if public behavior changed.
- [ ] A changeset is included for user-facing `@lensjs/*` changes.

## Communication Style

When explaining changes:

- Explain the **reasoning** and any **tradeoffs**.
- State the **affected packages** and any **breaking changes** explicitly.
- Be **concise** and scannable; avoid unnecessary verbosity and generic filler.

## Final Reminder

The Cursor rules are the project's authoritative specification. **If this document conflicts with
any `.cursor/rules/*.mdc` file, the Cursor rule always wins.**
