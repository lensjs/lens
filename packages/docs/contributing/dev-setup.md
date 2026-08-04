# Contributing to Lens

<p class="lens-lead">
Thank you for considering a contribution to Lens! It's people like you that make Lens a great
tool. This guide gets your local development environment up and running.
</p>

<Callout type="info" title="Prerequisites">
You'll need <a href="https://nodejs.org/" target="_blank" rel="noreferrer">Node.js</a> v18+,
<a href="https://git-scm.com/" target="_blank" rel="noreferrer">Git</a>, and
<a href="https://pnpm.io" target="_blank" rel="noreferrer">pnpm</a>. Lens is a pnpm + Turborepo
monorepo — always use <strong>pnpm</strong> (never npm or yarn).
</Callout>

## Getting started

<Steps>
<Step title="Clone the repository">

<CommandCopy command="git clone https://github.com/lensjs/lens.git && cd lens" />

</Step>
<Step title="Install dependencies">

`pnpm install` at the root installs dependencies for all packages and links them together.

<CommandCopy command="pnpm install" />

</Step>
<Step title="Build all packages">

This builds every package in the correct dependency order.

<CommandCopy command="pnpm run build" />

</Step>
<Step title="Run the example app">

Start the Express example server with hot-reloading.

<CommandCopy command="pnpm run dev" />

The server runs at `http://localhost:3000`. Visit `http://localhost:3000/add-user` to trigger a
database query that Lens will capture.

</Step>
</Steps>

## Making changes

<Steps>
<Step title="Edit the relevant package(s)">

Make your changes in the appropriate package under `packages/` or `shared/`.

</Step>
<Step title="Work on the dashboard UI">

If you're changing the dashboard, run the UI dev server:

<CommandCopy command="pnpm run dev:front" />

</Step>
<Step title="Commit with Conventional Commits">

Follow the
[Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification, then push and
open a pull request.

</Step>
</Steps>

<Callout type="best-practice" title="Before you open a PR">
Ensure the test suite passes with <code>pnpm test</code>, add a changeset for any user-facing
<code>@lensjs/*</code> change, and keep changes scoped. See the repository's
<code>CONTRIBUTING.md</code> and <code>.cursor/rules</code> for the full conventions.
</Callout>

## Next steps

<CardGrid :cols="2">
  <Card icon="github" title="Open a pull request" href="https://github.com/lensjs/lens/pulls">
    Browse open PRs or start your own.
  </Card>
  <Card icon="bug" title="Report an issue" href="https://github.com/lensjs/lens/issues">
    Found a bug or have an idea? Let us know.
  </Card>
</CardGrid>
