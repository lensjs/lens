import { Link, useLocation } from "react-router-dom";
import { getSidebarRoutes } from "../../router/routes";
import { useConfig } from "../../utils/context";

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
          className="fixed inset-0  bg-opacity-50 z-10 lg:hidden"
          onClick={onCloseMobileSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
        fixed lg:sticky top-0 z-20 lg:z-0
        h-full lg:h-auto
        w-3/4 sm:w-64 lg:w-auto min-w-60
        p-4 lg:p-0
        transform transition-transform duration-300 ease-in-out
        ${isMobileSidebarOpen ? "translate-x-0 bg-slate-900" : "-translate-x-[120%] lg:translate-x-0"}
        lg:bg-transparent
      `}
      >
        <ul className="flex flex-col gap-2 text-slate-200">
          {getSidebarRoutes(config).map((route) => {
            const isActive = location.pathname.startsWith(route.path);
            const Icon = route.icon;

            return (
              <li key={route.path} className="contents">
                <Link
                  to={route.path}
                  className={[
                    "flex items-center gap-2 rounded-lg px-4 py-2 font-semibold transition-all duration-200",
                    isActive
                      ? "bg-blue-900/20 text-blue-400 border border-blue-800/30 shadow-sm"
                      : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-100",
                  ].join(" ")}
                >
                  <Icon size={16} />
                  {route.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </aside>
    </>
  );
};

export default Sidebar;
