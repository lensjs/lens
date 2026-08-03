/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep the Lens engine (and its native SQLite driver) out of the bundler so
  // it runs as a normal Node dependency in the Route Handlers.
  serverExternalPackages: [
    "@lensjs/core",
    "@lensjs/nextjs",
    "@lensjs/watchers",
    "libsql",
    "better-sqlite3",
  ],
};

export default nextConfig;
