export default function Footer() {
  return (
    <footer className="mt-auto border-t border-border">
      <div className="container flex flex-col items-center justify-between gap-2 py-5 text-xs text-dim sm:flex-row">
        <p>LensJS — observability for Node.js</p>
        <a
          href="https://github.com/lensjs/lens"
          target="_blank"
          rel="noreferrer"
          className="transition-colors hover:text-fg"
        >
          github.com/lensjs/lens
        </a>
      </div>
    </footer>
  );
}
