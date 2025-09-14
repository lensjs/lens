import { Menu, X, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useConfig } from "../../utils/context";
import DeleteButton from "./DeleteButton";
import ConfigSheet from "../ConfigSheet";
import { getRoutesPaths } from "../../router/routes";

interface HeaderProps {
  isMobileSidebarOpen: boolean;
  onToggleMobileSidebar: () => void;
}

const Header = ({
  isMobileSidebarOpen,
  onToggleMobileSidebar,
}: HeaderProps) => {
  const config = useConfig();
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  return (
    <>
      <header className="container my-5 flex items-center justify-between gap-4">
        <Link to={getRoutesPaths(config).REQUESTS}>
          <p className="text-2xl font-bold ">{config.appName}</p>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsConfigOpen(true)}
            className="p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:border-blue-300 dark:hover:border-blue-700 bg-white dark:bg-neutral-800 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all duration-200 shadow-sm hover:shadow-md group"
            aria-label="Open configuration"
            title="Configuration"
          >
            <Settings
              size={18}
              className="text-neutral-500 dark:text-neutral-400 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors duration-200"
            />
          </button>
          <DeleteButton />
          <button
            onClick={onToggleMobileSidebar}
            className="p-2 rounded-lg  hover:bg-gray-200  dark:hover:bg-neutral-700 transition-colors lg:hidden"
            aria-label="Toggle menu"
          >
            <span className="text-gray-700 dark:text-gray-300">
              {isMobileSidebarOpen ? <X size={18} /> : <Menu size={18} />}
            </span>
          </button>
        </div>
      </header>

      <ConfigSheet
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
      />
    </>
  );
};

export default Header;
