# @lensjs/typescript-config

A shared TypeScript configuration package for the Lens monorepo. It provides a set of base and extended `tsconfig.json` files to ensure consistent and optimized TypeScript compilation settings across all packages within the project. This helps maintain code quality, type safety, and development efficiency.

## Features

*   **`base.json`**: A foundational TypeScript configuration with common compiler options applicable to most (if not all) packages. It sets strictness rules, module resolution strategies, and target environments.
*   **`core.json`**: Extends `base.json` with configurations specific to the `@lensjs/core` package.
*   **`express.json`**: Extends `base.json` with configurations tailored for packages integrating with Express.js (e.g., `@lensjs/express`).
*   **`handlers.json`**: Extends `base.json` with configurations for handler-related packages (e.g., `@lensjs/watchers`).
*   **Consistency**: Ensures all packages adhere to a unified set of TypeScript best practices and compiler settings.
*   **Maintainability**: Simplifies managing TypeScript configurations across a multi-package repository.

## Installation

```bash
# This package is typically used as a devDependency in other packages
# and is not meant for direct installation or usage in application code.
pnpm add -D @lensjs/typescript-config
```

## Usage Example (in another package's tsconfig.json)

```json
{
  "extends": "@lensjs/typescript-config/core.json",
  "compilerOptions": {
    // Package-specific overrides or additions
    "outDir": "./dist"
  },
  "include": ["src", "tests"]
}
```
