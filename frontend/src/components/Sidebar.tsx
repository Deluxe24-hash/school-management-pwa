import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, Users, GraduationCap, School, BookOpen,
  Calendar, ClipboardCheck, FileText, CreditCard, ClipboardList,
  Megaphone, Settings, ChevronLeft, ChevronRight, School as SchoolIcon,
} from "lucide-react";
import { useTheme } from "../hooks/useTheme";
import { useAuth } from "../hooks/useAuth";

const menuItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: [] },
  { path: "/students", label: "Students", icon: Users, roles: [] },
  { path: "/teachers", label: "Teachers", icon: GraduationCap, roles: [] },
  { path: "/classes", label: "Classes", icon: School, roles: [] },
  { path: "/subjects", label: "Subjects", icon: BookOpen, roles: [] },
  { path: "/sessions", label: "Sessions", icon: Calendar, roles: ["SUPER_ADMIN", "ADMIN", "PRINCIPAL"] },
  { path: "/attendance", label: "Attendance", icon: ClipboardCheck, roles: [] },
  { path: "/results", label: "Results", icon: FileText, roles: [] },
  { path: "/fees", label: "Fees", icon: CreditCard, roles: [] },
  { path: "/assignments", label: "Assignments", icon: ClipboardList, roles: [] },
  { path: "/announcements", label: "Announcements", icon: Megaphone, roles: [] },
  { path: "/settings", label: "Settings", icon: Settings, roles: ["SUPER_ADMIN", "ADMIN"] },
];

export const Sidebar = () => {
  const { sidebarCollapsed, toggleSidebar } = useTheme();
  const { hasRole } = useAuth();

  const filteredMenu = menuItems.filter(
    (item) => item.roles.length === 0 || hasRole(item.roles as any)
  );

  return (
    <div className="flex flex-col h-full">
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2">
            <SchoolIcon className="w-8 h-8 text-primary-600" />
            <span className="font-bold text-lg text-gray-900 dark:text-white">SchoolPortal</span>
          </div>
        )}
        {sidebarCollapsed && <SchoolIcon className="w-8 h-8 text-primary-600 mx-auto" />}
        <button
          onClick={toggleSidebar}
          className="hidden lg:flex p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronLeft className="w-5 h-5 text-gray-500" />
          )}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {filteredMenu.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "active" : ""} ${sidebarCollapsed ? "justify-center px-2" : ""}`
            }
            title={sidebarCollapsed ? item.label : undefined}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!sidebarCollapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        {!sidebarCollapsed && <p className="text-xs text-gray-400 text-center">v1.0.0</p>}
      </div>
    </div>
  );
};
