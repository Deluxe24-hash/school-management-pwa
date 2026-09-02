import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";
import { MobileNav } from "./MobileNav";
import { useTheme } from "../hooks/useTheme";

export const Layout = () => {
  const { sidebarCollapsed } = useTheme();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      <aside
        className={`hidden lg:flex flex-col fixed h-screen bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 z-30 ${
          sidebarCollapsed ? "w-20" : "w-64"
        }`}
      >
        <Sidebar />
      </aside>

      <MobileNav />

      <main
        className="flex-1 flex flex-col min-h-screen transition-all duration-300"
        style={{ marginLeft: "0" }}
      >
        <div className="lg:hidden">
          <Navbar />
        </div>
        <div className="hidden lg:block">
          <Navbar />
        </div>
        <div
          className="flex-1 p-4 lg:p-8 overflow-x-hidden transition-all duration-300"
          style={{ marginLeft: sidebarCollapsed ? "5rem" : "16rem" }}
        >
          <Outlet />
        </div>
      </main>
    </div>
  );
};
