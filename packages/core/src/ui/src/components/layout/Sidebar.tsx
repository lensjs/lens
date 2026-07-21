import { Link, useLocation } from "react-router-dom";
import { getSidebarRoutes } from "../../router/routes";
import { useConfig } from "../../utils/context";
import { cn } from "../../utils/cn";

interface SidebarProps {
  isMobileSidebarOpen: boolean;
  onCloseMobileSidebar: () => void;
}

const Sidebar = ({
  isMobileSidebarOpen,
  onCloseMobileSidebar,
}: SidebarProps) => {
  const config = useConfig();
  const location = useLocation();

  return (
    <>
      {/* Overlay for mobile */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-10 bg-canvas/60 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobileSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-14 z-20 h-[calc(100vh-3.5rem)] w-64 shrink-0 border-r border-border bg-canvas p-4",
          "transition-transform duration-200 ease-out",
          "lg:sticky lg:top-6 lg:z-0 lg:h-auto lg:w-56 lg:self-start lg:border-r-0 lg:bg-transparent lg:p-0",
          isMobileSidebarOpen
            ? "translate-x-0"
            : "-translate-x-[110%] lg:translate-x-0",
        )}
      >
        <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-dim">
          Monitor
        </p>
        <nav className="flex flex-col gap-0.5">
          {getSidebarRoutes(config).map((route) => {
            const isActive = location.pathname.startsWith(route.path);
            const Icon = route.icon;

            return (
              <Link
                key={route.path}
                to={route.path}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-accent/10 text-fg"
                    : "text-muted hover:bg-surface-2/60 hover:text-fg",
                )}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-accent" />
                )}
                <span
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-md transition-colors",
                    isActive
                      ? "bg-accent/15 text-accent"
                      : "text-dim group-hover:text-muted",
                  )}
                >
                  <Icon size={16} />
                </span>
                {route.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
