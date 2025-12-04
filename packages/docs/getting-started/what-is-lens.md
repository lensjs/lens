# What is Lens?

**LensJS** is a lightweight, framework-agnostic monitoring toolkit for Node.js.
It helps you **observe your application in real time** by tracking requests, queries, and custom events — all through a simple and intuitive API.

## Key Features

*   **Lightweight:** Minimal overhead ensures easy integration without impacting your application's performance.
*   **Framework Agnostic:** Works seamlessly with any Node.js framework, with current support for Express and AdonisJS.
*   **Extensible:** Build custom watchers and adapters on top of `@lensjs/core` to fit your unique monitoring needs.
*   **Developer-Friendly Dashboard:** Inspect requests, queries, and events in your browser with an intuitive, real-time interface.

## How It Works

Lens uses **adapters** to connect to your framework (e.g., Express, AdonisJS).
These adapters collect and forward data (like requests and queries) to the Lens dashboard, where you can analyze performance and debug issues.

```mermaid
flowchart LR
    A[ Node.js App ] --> B[Adapter]
    B --> C[@lensjs/core]
    C --> D[Lens Dashboard]
```

## Why Choose Lens?

Many existing monitoring tools can be:

*   **Overly Complex:** Too heavy for small to medium-sized projects.
*   **Framework-Specific:** Tied to a single framework, limiting flexibility.
*   **Difficult to Customize:** Hard to extend or tailor to specific requirements.

**LensJS** provides a solution by being:

*   **Simple:** Fast setup and minimal configuration get you monitoring quickly.
*   **Universal:** Designed to work across multiple Node.js frameworks.
*   **Hackable:** Easily extendable with your own adapters, watchers, and data stores.

## Contributing

We welcome contributions from the community!

*   Open an issue if you find a bug or have an idea for a new feature.
*   Submit a Pull Request to improve existing features or enhance the documentation.

See the [Contributing Guide](../contributing/dev-setup.md) to get started.

## License

Lens is licensed under the **MIT License**. See the LICENSE file for details.

Project by [Mohammed Elattar](https://github.com/MohammedElattar).
If you find Lens useful, please consider giving it a star on GitHub — it really helps support the project!  
