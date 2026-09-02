import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ThemeState {
  isDarkMode: boolean;
  sidebarCollapsed: boolean;
  toggleDarkMode: () => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      isDarkMode: false,
      sidebarCollapsed: false,

      toggleDarkMode: () => {
        set((state) => {
          const newMode = !state.isDarkMode;
          if (newMode) {
            document.documentElement.classList.add("dark");
          } else {
            document.documentElement.classList.remove("dark");
          }
          return { isDarkMode: newMode };
        });
      },

      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
    }),
    {
      name: "theme-storage",
      partialize: (state) => ({ isDarkMode: state.isDarkMode, sidebarCollapsed: state.sidebarCollapsed }),
    }
  )
);

// Initialize theme on load
const stored = localStorage.getItem("theme-storage");
if (stored) {
  const parsed = JSON.parse(stored);
  if (parsed.state?.isDarkMode) {
    document.documentElement.classList.add("dark");
  }
}
