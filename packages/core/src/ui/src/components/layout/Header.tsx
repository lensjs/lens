import { Menu, X } from "lucide-react";
import { Link } from "react-router-dom";
import { getRoutesPaths } from "../../router/routes";
import { useConfig } from "../../utils/context";
import DeleteButton from "./DeleteButton";

interface HeaderProps {
  isMobileSidebarOpen: boolean;
  onToggleMobileSidebar: () => void;
}

const Header = ({
  isMobileSidebarOpen,
  onToggleMobileSidebar,
}: HeaderProps) => {
  const config = useConfig();
  return (
    <>
      <header className="container my-5 flex items-center justify-between gap-4">
        <Link to={getRoutesPaths(config).REQUESTS}>
          <p className="text-2xl font-bold ">{config.appName}</p>
        </Link>

        <div className="flex items-center gap-2">
         
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

     
    </>
  );
};

export default Header;
