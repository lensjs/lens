import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
} from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { CornerDownLeft, Search, Trash2 } from "lucide-react";
import { useConfig } from "../utils/context";
import { getSidebarRoutes } from "../router/routes";
import { prepareApiUrl } from "../utils/api";
import { cn } from "../utils/cn";

type IconType = ComponentType<{ size?: number; className?: string }>;

type Command = {
  id: string;
  label: string;
  icon?: IconType;
  keywords?: string;
  run: () => void;
};

// Sidebar order maps to the g-prefixed shortcuts (g r/q/c/e/m).
const GOTO_KEYS: Record<string, number> = { r: 0, q: 1, c: 2, e: 3, m: 4 };

export default function CommandPalette() {
  const config = useConfig();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands = useMemo<Command[]>(() => {
    const routes = getSidebarRoutes(config).map((route) => ({
      id: `nav-${route.path}`,
      label: `Go to ${route.label}`,
      icon: route.icon as IconType,
      keywords: route.label,
      run: () => navigate(route.path),
    }));

    return [
      ...routes,
      {
        id: "clear-all",
        label: "Clear all entries",
        icon: Trash2,
        keywords: "delete truncate reset",
        run: async () => {
          await fetch(prepareApiUrl(config.api.truncate), { method: "DELETE" });
          window.location.reload();
        },
      },
    ];
  }, [config, navigate]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return commands;
    return commands.filter((c) =>
      `${c.label} ${c.keywords ?? ""}`.toLowerCase().includes(term),
    );
  }, [query, commands]);

  const openPalette = () => {
    setQuery("");
    setActive(0);
    setOpen(true);
  };

  // Global shortcuts: Cmd/Ctrl+K, "?", "/", and "g" then r/q/c/e/m.
  useEffect(() => {
    let gPending = false;
    let gTimer: ReturnType<typeof setTimeout>;

    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (open) setOpen(false);
        else openPalette();
        return;
      }
      if (open) return;

      const target = e.target as HTMLElement | null;
      const typing =
        !!target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);
      if (typing) return;

      if (e.key === "/") {
        e.preventDefault();
        (
          document.querySelector('input[type="text"]') as HTMLInputElement | null
        )?.focus();
        return;
      }
      if (e.key === "?") {
        e.preventDefault();
        openPalette();
        return;
      }
      if (gPending && e.key in GOTO_KEYS) {
        const route = getSidebarRoutes(config)[GOTO_KEYS[e.key]!];
        if (route) navigate(route.path);
        gPending = false;
        return;
      }
      if (e.key === "g") {
        gPending = true;
        clearTimeout(gTimer);
        gTimer = setTimeout(() => (gPending = false), 800);
      }
    };

    const onOpenEvent = () => openPalette();
    window.addEventListener("keydown", onKey);
    window.addEventListener("lens:open-command-palette", onOpenEvent);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("lens:open-command-palette", onOpenEvent);
      clearTimeout(gTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, config, navigate]);

  // Focus the input when the palette opens (no state updates here).
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => inputRef.current?.focus(), 0);
    return () => clearTimeout(t);
  }, [open]);

  if (!open) return null;

  const runCommand = (command: Command) => {
    setOpen(false);
    command.run();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-start justify-center p-4 pt-[12vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <div
        className="absolute inset-0 bg-canvas/70 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-xl border border-border bg-elevated shadow-2xl">
        <div className="flex items-center gap-2 border-b border-border px-3">
          <Search size={16} className="text-dim" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") setOpen(false);
              else if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((a) => Math.min(a + 1, filtered.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((a) => Math.max(a - 1, 0));
              } else if (e.key === "Enter") {
                e.preventDefault();
                const command = filtered[active];
                if (command) runCommand(command);
              }
            }}
            placeholder="Type a command or search…"
            className="w-full bg-transparent py-3 text-sm text-fg placeholder:text-dim focus:outline-none"
          />
          <kbd className="rounded border border-border px-1.5 py-0.5 text-[10px] text-dim">
            ESC
          </kbd>
        </div>
        <ul className="max-h-80 overflow-y-auto p-1.5">
          {filtered.length === 0 && (
            <li className="px-3 py-6 text-center text-sm text-dim">
              No commands found
            </li>
          )}
          {filtered.map((command, i) => {
            const Icon = command.icon;
            return (
              <li key={command.id}>
                <button
                  onMouseEnter={() => setActive(i)}
                  onClick={() => runCommand(command)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                    i === active
                      ? "bg-accent/10 text-fg"
                      : "text-muted hover:bg-surface-2/60",
                  )}
                >
                  {Icon && (
                    <Icon
                      size={16}
                      className={i === active ? "text-accent" : "text-dim"}
                    />
                  )}
                  <span className="flex-1">{command.label}</span>
                  {i === active && (
                    <CornerDownLeft size={14} className="text-dim" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
        <div className="flex items-center justify-between border-t border-border px-3 py-2 text-[11px] text-dim">
          <span>↑ ↓ to navigate, Enter to run</span>
          <span>g then r/q/c/e/m • / to search</span>
        </div>
      </div>
    </div>,
    document.body,
  );
}
