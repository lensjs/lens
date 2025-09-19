# Express Exception Handler

This guide explains how to integrate Lens's exception watcher with your Express application to monitor and report exceptions.

## Configuration

First, ensure the `exceptionWatcherEnabled` option is set to `true` within the configuration object passed to the `lens` initialization function. This option is enabled by default, but it's good practice to explicitly confirm its status:

```ts
const { handleExceptions } = await lens({
  // ... other options
  exceptionWatcherEnabled: true, // Ensure this is true to enable exception watching
});
```

## Integration

Lens leverages [Express Error Handling](https://expressjs.com/en/guide/error-handling.html). You should call the `handleExceptions` function after all your routes are defined. This ensures that Lens can catch and process any exceptions that occur within your route handlers.

```ts
// All routes are defined above

handleExceptions(app);

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
```

## Verification

To verify that the exception handler is working correctly, you can intentionally throw an exception in one of your routes:

```ts
app.get("/throw-error", async (_, res) => {
    throw new Error("Something went wrong");
});
```

After triggering this route, navigate to the Lens `/exceptions` path in your browser, and you should see the details of the captured exception.
