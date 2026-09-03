import { X } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { useTheme } from "../hooks/useTheme";

export const MobileNav = () => {
  const { mobileNavOpen, setMobileNavOpen } = useTheme();

  return (
    <>
      {mobileNavOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileNavOpen(false)}
          aria-hidden="true"
        />
      )}
      <div
        className={`fixed inset-y-0 left-0 w-72 max-w-[80vw] z-50 transform transition-transform duration-300 lg:hidden ${
          mobileNavOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="relative h-full">
          <button
            onClick={() => setMobileNavOpen(false)}
            className="absolute top-4 right-3 p-2 rounded-md hover:bg-white/10 text-primary-200 z-10"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
          <div onClick={() => setMobileNavOpen(false)} className="h-full">
            <Sidebar />
          </div>
        </div>
      </div>
    </>
  );
};
