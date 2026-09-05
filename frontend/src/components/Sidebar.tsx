import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, Users, GraduationCap, School, BookOpen,
  Calendar, ClipboardCheck, FileText, CreditCard, ClipboardList,
  Megaphone, Settings, ChevronLeft, ChevronRight, School as SchoolIcon,
  Clock, FileBadge, MessageSquare, Library, UserPlus,
} from "lucide-react";
import { useTheme } from "../hooks/useTheme";
import { useAuth } from "../hooks/useAuth";

const menuItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: [] },
  { path: "/students", label: "Students", icon: Users, roles: ["SUPER_ADMIN", "ADMIN", "PRINCIPAL", "HEAD_TEACHER", "TEACHER"] },
  { path: "/teachers", label: "Teachers", icon: GraduationCap, roles: ["SUPER_ADMIN", "ADMIN", "PRINCIPAL"] },
  { path: "/classes", label: "Classes", icon: School, roles: ["SUPER_ADMIN", "ADMIN", "PRINCIPAL", "HEAD_TEACHER", "TEACHER"] },
  { path: "/subjects", label: "Subjects", icon: BookOpen, roles: ["SUPER_ADMIN", "ADMIN", "PRINCIPAL", "HEAD_TEACHER", "TEACHER"] },
  { path: "/sessions", label: "Sessions", icon: Calendar, roles: ["SUPER_ADMIN", "ADMIN", "PRINCIPAL"] },
  { path: "/timetable", label: "Timetable", icon: Clock, roles: [] },
  { path: "/attendance", label: "Attendance", icon: ClipboardCheck, roles: ["SUPER_ADMIN", "ADMIN", "PRINCIPAL", "HEAD_TEACHER", "TEACHER"] },
  { path: "/results", label: "Results", icon: FileText, roles: ["SUPER_ADMIN", "ADMIN", "PRINCIPAL", "HEAD_TEACHER", "TEACHER"] },
  { path: "/report-cards", label: "Report Cards", icon: FileBadge, roles: ["SUPER_ADMIN", "ADMIN", "PRINCIPAL", "HEAD_TEACHER", "TEACHER"] },
  { path: "/fees", label: "Fees", icon: CreditCard, roles: ["SUPER_ADMIN", "ADMIN", "ACCOUNTANT"] },
  { path: "/library", label: "Library", icon: Library, roles: [] },
  { path: "/messages", label: "Messages", icon: MessageSquare, roles: [] },
  { path: "/admissions", label: "Admissions", icon: UserPlus, roles: ["SUPER_ADMIN", "ADMIN", "PRINCIPAL"] },
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
    <div className="flex flex-col h-full bg-primary-900 text-white">
      <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2.5">
            <SchoolIcon className="w-7 h-7 text-gold-400" />
            <span className="font-serif font-semibold text-lg tracking-tight">Ledger</span>
          </div>
        )}
        {sidebarCollapsed && <SchoolIcon className="w-7 h-7 text-gold-400 mx-auto" />}
        <button
          onClick={toggleSidebar}
          className="hidden lg:flex p-1 rounded-md hover:bg-white/10 text-primary-200"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
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

      <div className="p-4 border-t border-white/10">
        {!sidebarCollapsed && <p className="text-xs text-primary-300 text-center">v1.0.0</p>}
      </div>
    </div>
  );
};
