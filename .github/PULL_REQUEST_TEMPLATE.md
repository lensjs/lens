<!--
Thanks for contributing to LensJS! Please fill out this template.
See CONTRIBUTING.md and .cursor/rules/pull-request.mdc for the full review checklist.
-->

## Summary

<!-- What does this PR do and why? -->

## Affected packages

<!-- Tick all that apply -->

- [ ] `@lensjs/core`
- [ ] `@lensjs/express`
- [ ] `@lensjs/fastify`
- [ ] `@lensjs/nestjs`
- [ ] `@lensjs/adonis`
- [ ] `@lensjs/watchers` (handlers)
- [ ] `@lensjs/date`
- [ ] dashboard UI (`packages/core/src/ui`)
- [ ] docs / examples / tooling

## Type of change

- [ ] Bug fix (`fix`)
- [ ] New feature (`feat`)
- [ ] Breaking change (requires a `major` changeset)
- [ ] Docs / examples / internal tooling only

## Checklist

Architecture & boundaries
- [ ] Change is in the correct package/layer; boundaries respected (no core -> framework/ORM, no
      adapter/handler re-implementing core, no relative cross-package imports).
- [ ] No unnecessary new abstraction; existing primitives (`lensUtils`, `@lensjs/date`,
      watchers/stores/adapters/handlers) reused.
- [ ] No duplicated logic.

API & compatibility
- [ ] Public API / `exports` / barrels are backward compatible, or a `major` changeset is
      included.
- [ ] Neutral data contracts and the store `save()` shape are unchanged (or bumped major).
- [ ] Naming is consistent (`snake_case.ts`, `WatcherTypeEnum`, `create<Tool>Handler`, ...).

Quality
- [ ] Tests added/updated; `pnpm test` passes locally.
- [ ] No floating promises; async is `await`ed or explicitly `void`ed.
- [ ] Event listeners / timers / process handlers are cleaned up (no leaks).
- [ ] Instrumentation stays non-blocking; no sync/awaited I/O added to the host request path.
- [ ] TypeScript strict; no `any` in public types.

Dependencies & bundle
- [ ] No unnecessary dependency; drivers/frameworks are peer/dev, not `dependencies`.

Docs, security & release
- [ ] Docs updated (and new pages wired into the sidebar) if public behavior changed.
- [ ] No secrets/PII captured, logged, or committed; redaction/purge/auth-gating preserved.
- [ ] Conventional Commit messages; changeset added for user-facing changes; hooks not skipped.

## Testing / reproduction

<!-- How did you verify this? Commands, example app, screenshots for UI changes. -->

## Related issues

<!-- e.g. Closes #123 -->
