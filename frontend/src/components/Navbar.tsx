import { useEffect, useRef, useState } from "react";
import { Bell, LogOut, Menu } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../hooks/useTheme";
import { ThemeToggle } from "./ThemeToggle";
import { getUserDisplayName, formatDateTime, cn } from "../utils/helpers";
import { notificationApi } from "../services/api";

export const Navbar = () => {
  const { user, logout } = useAuth();
  const { toggleMobileNav } = useTheme();

  const displayName = getUserDisplayName(user);
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("") || "U";

  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  const loadNotifications = () => {
    notificationApi.getAll().then((res) => {
      setNotifications(res.data.data.notifications);
      setUnreadCount(res.data.data.unreadCount);
    }).catch(() => {});
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 60000); // poll every minute
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleOpen = () => {
    setNotifOpen((v) => !v);
  };

  const handleMarkAllRead = async () => {
    await notificationApi.markAllRead();
    loadNotifications();
  };

  const handleNotifClick = async (n: any) => {
    if (!n.isRead) {
      await notificationApi.markRead(n.id);
      loadNotifications();
    }
    setNotifOpen(false);
  };

  return (
    <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-20">
      <div className="flex items-center gap-4">
        <button
          onClick={toggleMobileNav}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>
        <h1 className="text-lg font-serif font-semibold text-primary-900 dark:text-white hidden sm:block">
          School Management Portal
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <ThemeToggle />

        <div className="relative" ref={panelRef}>
          <button onClick={handleOpen} className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 flex items-center justify-center bg-red-500 text-white text-[10px] font-medium rounded-full">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-white dark:bg-primary-950 border border-gray-200 dark:border-gray-800 rounded-md shadow-lg z-30">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">Notifications</span>
                {unreadCount > 0 && (
                  <button onClick={handleMarkAllRead} className="text-xs text-gold-600 dark:text-gold-400 hover:underline">
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
                {notifications.length === 0 ? (
                  <p className="px-4 py-6 text-sm text-gray-500 dark:text-gray-400 text-center">No notifications yet.</p>
                ) : (
                  notifications.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => handleNotifClick(n)}
                      className={cn(
                        "w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5",
                        !n.isRead && "bg-gold-50/50 dark:bg-gold-500/5"
                      )}
                    >
                      <p className={cn("text-sm", !n.isRead ? "font-semibold text-gray-900 dark:text-white" : "font-medium text-gray-700 dark:text-gray-300")}>
                        {n.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{n.content}</p>
                      <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">{formatDateTime(n.createdAt)}</p>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 pl-3 border-l border-gray-200 dark:border-gray-700">
          <div className="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
            <span className="text-sm font-semibold text-primary-700 dark:text-primary-400">
              {initials}
            </span>
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">{displayName}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.role?.toLowerCase().replace("_", " ")}</p>
          </div>
          <button
            onClick={logout}
            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
