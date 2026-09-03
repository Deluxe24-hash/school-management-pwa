import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";
import { MobileNav } from "./MobileNav";
import { useTheme } from "../hooks/useTheme";

export const Layout = () => {
  const { sidebarCollapsed } = useTheme();

  return (
    <div className="min-h-screen bg-paper dark:bg-paper-dark">
      {/* Desktop sidebar: fixed, only takes layout space at lg+ via the spacer below */}
      <aside
        className={`hidden lg:flex flex-col fixed inset-y-0 left-0 h-screen transition-[width] duration-300 z-30 ${
          sidebarCollapsed ? "w-20" : "w-64"
        }`}
      >
        <Sidebar />
      </aside>

      {/* Mobile slide-in drawer, fully independent of desktop layout */}
      <MobileNav />

      <main
        className={`flex flex-col min-h-screen transition-[margin] duration-300 ${
          sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"
        }`}
      >
        <Navbar />
        <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
