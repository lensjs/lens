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
        ${isMobileSidebarOpen ? "translate-x-0 bg-white dark:bg-neutral-900" : "-translate-x-[120%] lg:translate-x-0"}
        lg:bg-transparent
      `}
      >
        <ul className="flex flex-col gap-2 text-gray-700 dark:text-neutral-300">
          {getSidebarRoutes(config).map((route) => {
            const isActive = location.pathname.startsWith(route.path);
            const Icon = route.icon;

            return (
              <li key={route.path} className="contents">
                <Link
                  to={route.path}
                  className={[
                    "flex items-center gap-2 rounded-lg px-4 py-2 font-medium",
                    isActive
                      ? "bg-green-100 dark:bg-neutral-800 text-gray-900 dark:text-white"
                      : "text-gray-600 dark:text-neutral-400 hover:bg-gray-50 dark:hover:bg-neutral-800/50",
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
