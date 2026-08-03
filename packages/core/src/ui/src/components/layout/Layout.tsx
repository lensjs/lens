import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";
import Footer from "./Footer";
import CommandPalette from "../CommandPalette";
import Toaster from "../Toaster";
import { useExceptionToasts } from "../../hooks/useExceptionToasts";

const Layout = () => {
  const location = useLocation();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useExceptionToasts();

  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        isMobileSidebarOpen={isMobileSidebarOpen}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen((open) => !open)}
      />

      <div className="container relative flex flex-1 flex-col gap-6 py-6 lg:flex-row lg:gap-8">
        <Sidebar
          isMobileSidebarOpen={isMobileSidebarOpen}
          onCloseMobileSidebar={() => setIsMobileSidebarOpen(false)}
        />

        <main className="min-w-0 flex-1 pb-6">
          <Outlet />
        </main>
      </div>

      <Footer />
      <CommandPalette />
      <Toaster />
    </div>
  );
};

export default Layout;
