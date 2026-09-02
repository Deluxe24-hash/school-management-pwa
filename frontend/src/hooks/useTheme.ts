import { useThemeStore } from "../store/themeStore";

export const useTheme = () => {
  const { isDarkMode, sidebarCollapsed, toggleDarkMode, toggleSidebar, setSidebarCollapsed } = useThemeStore();

  return {
    isDarkMode,
    sidebarCollapsed,
    toggleDarkMode,
    toggleSidebar,
    setSidebarCollapsed,
  };
};
