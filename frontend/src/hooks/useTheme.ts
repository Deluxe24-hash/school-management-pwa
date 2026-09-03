import { useThemeStore } from "../store/themeStore";

export const useTheme = () => {
  const {
    isDarkMode,
    sidebarCollapsed,
    mobileNavOpen,
    toggleDarkMode,
    toggleSidebar,
    setSidebarCollapsed,
    toggleMobileNav,
    setMobileNavOpen,
  } = useThemeStore();

  return {
    isDarkMode,
    sidebarCollapsed,
    mobileNavOpen,
    toggleDarkMode,
    toggleSidebar,
    setSidebarCollapsed,
    toggleMobileNav,
    setMobileNavOpen,
  };
};
