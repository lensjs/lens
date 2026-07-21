import { LogOut, Menu, Search, X } from "lucide-react";
import { Link } from "react-router-dom";
import { getRoutesPaths } from "../../router/routes";
import { useConfig } from "../../utils/context";
import { clearToken, UNAUTHORIZED_EVENT } from "../../utils/auth";
import DeleteButton from "./DeleteButton";
import RecordingToggle from "./RecordingToggle";
import { LensLogo } from "../LensLogo";

const lockDashboard = () => {
  clearToken();
  window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
};

const openCommandPalette = () =>
  window.dispatchEvent(new Event("lens:open-command-palette"));

interface HeaderProps {
  isMobileSidebarOpen: boolean;
  onToggleMobileSidebar: () => void;
}

const Header = ({ isMobileSidebarOpen, onToggleMobileSidebar }: HeaderProps) => {
  const config = useConfig();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-canvas/80 backdrop-blur-md">
      <div className="container flex h-14 items-center justify-between gap-4">
        <Link
          to={getRoutesPaths(config).REQUESTS}
          className="group flex items-center gap-2.5"
        >
          <LensLogo
            size={28}
            className="text-accent transition-transform group-hover:scale-105"
          />
          <span className="flex flex-col leading-none">
            <span className="text-[15px] font-semibold tracking-tight text-fg">
              {config.appName}
            </span>
            <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-dim">
              Lens
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={openCommandPalette}
            className="hidden items-center gap-2 rounded-lg border border-border bg-surface-2/60 px-2.5 py-1.5 text-xs text-muted transition-colors hover:border-border-strong hover:text-fg sm:inline-flex"
            aria-label="Open command palette"
          >
            <Search size={14} />
            <span>Search</span>
            <kbd className="rounded border border-border px-1 py-0.5 text-[10px] leading-none">
              ⌘K
            </kbd>
          </button>
          <RecordingToggle />
          {config.authRequired && (
            <button
              onClick={lockDashboard}
              className="rounded-lg p-2 text-muted transition-colors hover:bg-surface-2 hover:text-fg"
              aria-label="Lock dashboard"
              title="Lock dashboard"
            >
              <LogOut size={18} />
            </button>
          )}
          <DeleteButton />
          <button
            onClick={onToggleMobileSidebar}
            className="rounded-lg p-2 text-muted transition-colors hover:bg-surface-2 hover:text-fg lg:hidden"
            aria-label="Toggle menu"
          >
            {isMobileSidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
