export default function Home() {
  return (
    <main style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <h1>Lens + Next.js example</h1>
      <p>Trigger some captured activity, then open the dashboard:</p>
      <ul>
        <li>
          <a href="/lens">Open the Lens dashboard</a>
        </li>
        <li>
          <a href="/api/users">GET /api/users (request + log + job)</a>
        </li>
        <li>
          <a href="/api/boom">GET /api/boom (throws, captured)</a>
        </li>
      </ul>
    </main>
  );
}
