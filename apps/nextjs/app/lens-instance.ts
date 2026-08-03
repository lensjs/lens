import { createLens } from "@lensjs/nextjs";
import { patchConsole } from "@lensjs/watchers";

// Initialize Lens once for the whole app (module singleton). The returned
// `handlers` serve the dashboard/API/SSE and `withLens` wraps Route Handlers.
export const lens = await createLens({
  appName: "Next.js Lens Demo",
  logWatcherEnabled: true,
  jobWatcherEnabled: true,
  // Password-lock the dashboard when LENS_PASSWORD is set (e.g. on staging).
  auth: process.env.LENS_PASSWORD
    ? { password: process.env.LENS_PASSWORD }
    : undefined,
  isAuthenticated: async () => true,
  getUser: async () => ({
    id: 1,
    name: "John Doe",
    email: "john@example.com",
  }),
});

// Capture console output for the Logs watcher, correlated to the active request
// (called after `createLens` so the watcher is already subscribed).
patchConsole();
