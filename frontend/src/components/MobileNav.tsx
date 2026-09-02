import { useState } from "react";
import { X } from "lucide-react";
import { Sidebar } from "./Sidebar";

export const MobileNav = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      <div
        className={`fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-800 z-50 transform transition-transform duration-300 lg:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <span className="font-bold text-lg text-gray-900 dark:text-white">Menu</span>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div onClick={() => setIsOpen(false)}>
          <Sidebar />
        </div>
      </div>
    </>
  );
};
