# Contributing to Lens

First off, thank you for considering contributing to Lens! It's people like you that make Lens such a great tool.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [Git](https://git-scm.com/)
- [pnpm](https://pnpm.io)

### Setup

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/lensjs/lens.git
    cd lens
    ```

2.  **Install dependencies:**

    This project uses `pnpm` as a package manager and `lerna` with workspaces. Running `pnpm install` at the root will install dependencies for all packages and link them together.

    ```bash
    pnpm install && pnpmx install husky
    ```
3.  **Build all packages:**

    This command will build all the packages in the correct order.

    ```bash
    pnpm run build
    ```

4.  **Run the example application:**

    This will start the Express server with hot-reloading.

    ```bash
    pnpm run dev
    ```

    The server will be running at `http://localhost:3000`. You can visit `http://localhost:3000/add-user` to trigger a database query that will be captured by Lens.

## Making Changes

1.  Make your changes in the appropriate package(s).
2.  If you are working on the UI, you can run the UI dev server:
    ```bash
    pnpm run dev:front
    ```
3.  Ensure all tests pass. (TODO: Add test running instructions).
4.  Commit your changes following the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification.
5.  Push your changes and open a pull request.
